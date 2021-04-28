/**
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
import { commands, window, Uri, ViewColumn, ExtensionContext, WebviewPanel } from 'vscode';
import * as _ from 'lodash';
import { render } from './renderer';
import { ExtendedLangClient } from '../core/extended-language-client';
import { BallerinaExtension } from '../core';
import { getCommonWebViewOptions, WebViewRPCHandler } from '../utils';
import { join } from "path";
import {
	TM_EVENT_OPEN_DIAGRAM, TM_EVENT_ERROR_OLD_BAL_HOME_DETECTED, TM_EVENT_ERROR_EXECUTE_DIAGRAM_OPEN, CMP_DIAGRAM_VIEW,
	sendTelemetryEvent, sendTelemetryException
} from '../telemetry';

// const DEBOUNCE_WAIT = 500;

let diagramViewPanel: WebviewPanel | undefined;
// let activeEditor: TextEditor | undefined;
// let preventDiagramUpdate = false;
// let rpcHandler: WebViewRPCHandler;

// function updateWebView(docUri: Uri): void {
// 	if (rpcHandler) {
// 		rpcHandler.invokeRemoteMethod("updateAST", [docUri.toString()], () => { });
// 	}
// }

export function showDiagramEditor(context: ExtensionContext, ballerinaExtInstance: BallerinaExtension, startLine: number,
	startColumn: number, endLine: number, endColumn: number, filePath: string = ''): void {
	// const didChangeDisposable = workspace.onDidChangeTextDocument(
	// 	_.debounce((e: TextDocumentChangeEvent) => {
	// 		if (activeEditor && (e.document === activeEditor.document) &&
	// 			e.document.fileName.endsWith('.bal')) {
	// 			if (preventDiagramUpdate) {
	// 				return;
	// 			}
	// 			updateWebView(e.document.uri);
	// 		}
	// 	}, DEBOUNCE_WAIT));

	// const changeActiveEditorDisposable = window.onDidChangeActiveTextEditor(
	// 	(activatedEditor: TextEditor | undefined) => {
	// 		if (window.activeTextEditor && activatedEditor
	// 			&& (activatedEditor.document === window.activeTextEditor.document)
	// 			&& activatedEditor.document.fileName.endsWith('.bal')) {
	// 			activeEditor = window.activeTextEditor;
	// 			updateWebView(activatedEditor.document.uri);
	// 		}
	// 	});

	if (diagramViewPanel) {
		diagramViewPanel.dispose();
		// diagramViewPanel.reveal(ViewColumn.Two, true);
		// return;
	}
	// Create and show a new webview
	diagramViewPanel = window.createWebviewPanel(
		'ballerinaDiagram',
		"Ballerina Diagram",
		{ viewColumn: ViewColumn.One, preserveFocus: true },
		getCommonWebViewOptions()
	);

	diagramViewPanel.iconPath = {
		light: Uri.file(join(context.extensionPath, 'resources/images/icons/design-view.svg')),
		dark: Uri.file(join(context.extensionPath, 'resources/images/icons/design-view-inverse.svg'))
	};

	const editor = window.activeTextEditor;
	// if (!editor) {
	// 	return;
	// }
	// activeEditor = editor;
	WebViewRPCHandler.create(diagramViewPanel, ballerinaExtInstance.langClient!);
	let treeItemPath: Uri;
	if (filePath === '') {
		if (!editor || !window.activeTextEditor || !window.activeTextEditor.document.fileName.endsWith('.bal')) {
			const message = 'Current file is not a ballerina file.';
			sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_ERROR_EXECUTE_DIAGRAM_OPEN, CMP_DIAGRAM_VIEW, message);
			if (diagramViewPanel) {
				diagramViewPanel.dispose();
			}
			window.showErrorMessage(message);
			return;
		}
		treeItemPath = editor!.document.uri;
	} else {
		treeItemPath = Uri.file(filePath);
	}

	const html = render(treeItemPath!, startLine, startColumn, endLine, endColumn);
	if (diagramViewPanel && html) {
		diagramViewPanel.webview.html = html;
	}

	diagramViewPanel.onDidDispose(() => {
		diagramViewPanel = undefined;
		// didChangeDisposable.dispose();
		// changeActiveEditorDisposable.dispose();
	});
}

export function activate(ballerinaExtInstance: BallerinaExtension) {
	const context = <ExtensionContext>ballerinaExtInstance.context;
	const langClient = <ExtendedLangClient>ballerinaExtInstance.langClient;

	const diagramRenderDisposable = commands.registerCommand('ballerina.show.diagram', () => {
		if (!ballerinaExtInstance.isSwanLake) {
			ballerinaExtInstance.showMessageOldBallerina();
			sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_ERROR_OLD_BAL_HOME_DETECTED, CMP_DIAGRAM_VIEW,
				"Diagram Editor is not supported for the ballerina version.");
			return;
		}
		sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_OPEN_DIAGRAM, CMP_DIAGRAM_VIEW);
		return ballerinaExtInstance.onReady()
			.then(() => {
				const { experimental } = langClient.initializeResult!.capabilities;
				const serverProvidesAST = experimental && experimental.astProvider;

				if (!serverProvidesAST) {
					ballerinaExtInstance.showMessageServerMissingCapability();
					return {};
				}
				showDiagramEditor(context, ballerinaExtInstance, 0, 0, -1, -1);
			})
			.catch((e) => {
				ballerinaExtInstance.showPluginActivationError();
				sendTelemetryException(ballerinaExtInstance, e, CMP_DIAGRAM_VIEW);
			});
	});
	context.subscriptions.push(diagramRenderDisposable);
}
