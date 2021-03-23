/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
 */
import { BallerinaExtension, ConstructIdentifier } from "../core";
import { showDiagramEditor } from '../diagram';
import { sendTelemetryEvent, CMP_PACKAGE_VIEW, TM_EVENT_OPEN_PACKAGE_OVERVIEW } from "../telemetry";
import { commands, window } from 'vscode';
import { PROJECT_KIND, TREE_ELEMENT_EXECUTE_COMMAND, TREE_REFRESH_COMMAND } from "./model";
import { PackageOverviewDataProvider } from "./tree-data-provider";

export function activate(ballerinaExtInstance: BallerinaExtension) {

    sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_OPEN_PACKAGE_OVERVIEW, CMP_PACKAGE_VIEW);

    const packageTreeDataProvider = new PackageOverviewDataProvider(ballerinaExtInstance);
    const ballerinaPackageTree = window.createTreeView('ballerinaPackageTreeView', {
        treeDataProvider: packageTreeDataProvider
    });

    commands.registerCommand(TREE_REFRESH_COMMAND, () =>
        packageTreeDataProvider.refresh()
    );

    packageTreeDataProvider.getPackageStructure().then(treeViewChildren => {
        if (treeViewChildren.length > 0) {
            ballerinaPackageTree.reveal(treeViewChildren[0], { expand: true, focus: false, select: false });
        }
    });

    commands.registerCommand(TREE_ELEMENT_EXECUTE_COMMAND, (filePath: string, kind: string, startLine: number,
        startColumn: number, endLine: number, endColumn: number) => {
        ballerinaExtInstance.packageTreeElementClicked({
            filePath,
            kind,
            startLine,
            startColumn,
            endLine,
            endColumn
        });
    });

    ballerinaExtInstance.onPackageTreeElementClicked((construct: ConstructIdentifier) => {
        // openBallerinaFile(construct);
        if (construct.kind === PROJECT_KIND.FUNCTION || construct.kind === PROJECT_KIND.RESOURCE) {
            showDiagramEditor(ballerinaExtInstance.context!, ballerinaExtInstance.langClient!, construct.startLine,
                construct.startColumn, construct.endLine, construct.endColumn, construct.filePath);
        }
    });
}

// function openBallerinaFile(construct: ConstructIdentifier) {
//     if (construct.filePath && (construct.kind === PROJECT_KIND.FUNCTION || construct.kind === PROJECT_KIND.RESOURCE)) {
//         const showOptions: TextDocumentShowOptions = {
//             preserveFocus: false,
//             preview: false,
//             viewColumn: ViewColumn.Active,
//             selection: new Range(construct.startLine!, construct.startColumn!, construct.startLine!, construct.startColumn!)
//         };
//         const status = commands.executeCommand('vscode.open', Uri.file(construct.filePath), showOptions);
//         if (!status) {
//             throw new Error(`Unable to open ${construct.filePath}`);
//         }
//     }
// }
