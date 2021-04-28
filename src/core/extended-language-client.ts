'use strict';
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

import { LanguageClient } from "vscode-languageclient";
import { DocumentSymbol, DocumentSymbolParams, SymbolInformation } from "monaco-languageclient";
import {
    DidOpenParams, DidCloseParams, DidChangeParams, GetSyntaxTreeParams, GetSyntaxTreeResponse,
    DiagramEditorLangClientInterface, BallerinaSyntaxTreeModifyRequest, BallerinaSyntaxTreeResponse,
    BallerinaConnectorsResponse, BallerinaConnectorRequest, BallerinaConnectorResponse, BallerinaRecordRequest,
    BallerinaRecordResponse, BallerinaSTModifyRequest, BallerinaSTModifyResponse, TriggerModifyRequest,
    GetSyntaxTreeFileRangeParams, GetSyntaxTreeFileRangeResponse
} from "@wso2-enterprise/low-code-editor/build/Definitions";

export const BALLERINA_LANG_ID = "ballerina";

export interface BallerinaSyntaxTree {
    kind: string;
    topLevelNodes: any[];
}

export interface GetSyntaxTreeRequest {
    documentIdentifier: {
        uri: string;
    };
}

export interface BallerinaExample {
    title: string;
    url: string;
}

export interface BallerinaExampleCategory {
    title: string;
    column: number;
    samples: Array<BallerinaExample>;
}

export interface BallerinaExampleListRequest {
    filter?: string;
}

export interface BallerinaExampleListResponse {
    samples: Array<BallerinaExampleCategory>;
}

export interface BallerinaOASResponse {
    ballerinaOASJson?: string;
}

export interface BallerinaOASRequest {
    ballerinaDocument: {
        uri: string;
    };
    ballerinaService?: string;
}

export interface BallerinaAstOasChangeRequest {
    oasDefinition?: string;
    documentIdentifier: {
        uri: string;
    };
}

export interface BallerinaProject {
    kind?: string;
    path?: string;
    version?: string;
    author?: string;
    packageName?: string;
}

export interface BallerinaProjectComponents {
    packages?: any[];
}

export interface GetBallerinaProjectParams {
    documentIdentifier: {
        uri: string;
    };
}

export interface GetBallerinaPackagesParams {
    documentIdentifiers: DocumentIdentifier[];
}

export interface DocumentIdentifier {
    uri: string;
}

export interface BallerinaAstOasChangeResponse {
    oasAST?: string;
}

export interface BallerinaServiceListRequest {
    documentIdentifier: {
        uri: string;
    };
}

export interface BallerinaServiceListResponse {
    services: string[];
}

export interface BallerinaSynResponse {
    syn?: String;
}

export interface GetSynRequest {
    Params: string;
}

export interface LowCodeLangClientTemp extends Omit<DiagramEditorLangClientInterface, 'init'> {
    // Diagnostics: (params: BallerinaProjectParams) => Thenable<PublishDiagnosticsParams[]>;
}

export class ExtendedLangClient extends LanguageClient implements LowCodeLangClientTemp {
    isInitialized: boolean = true;

    didOpen(params: DidOpenParams): void {
        this.sendRequest("textDocument/didOpen", params);
    }
    registerPublishDiagnostics(): void {
        this.onNotification("textDocument/publishDiagnostics", (notification: any) => {
            // const { diagnostics, uri } = notification;
            // if (uri && uri === ("file://" + store.getState().appInfo?.currentApp?.workingFile)) {
            // store.dispatch(diagramSetDiagnostic(diagnostics));
            // }
        });
    }
    didClose(params: DidCloseParams): void {
        this.sendRequest("textDocument/didClose", params);
    }
    didChange(params: DidChangeParams): void {
        this.sendRequest("textDocument/didChange", params);
    }
    syntaxTreeModify(params: BallerinaSyntaxTreeModifyRequest): Thenable<BallerinaSyntaxTreeResponse> {
        return this.sendRequest<BallerinaSyntaxTreeResponse>("ballerinaDocument/syntaxTreeModify", params);
    }
    getConnectors(): Thenable<BallerinaConnectorsResponse> {
        return this.sendRequest<BallerinaConnectorsResponse>("ballerinaConnector/connectors");
    }
    getConnector(params: BallerinaConnectorRequest): Thenable<BallerinaConnectorResponse> {
        return this.sendRequest<BallerinaConnectorResponse>("ballerinaConnector/connector", params);
    }
    getRecord(params: BallerinaRecordRequest): Thenable<BallerinaRecordResponse> {
        return this.sendRequest<BallerinaRecordResponse>("ballerinaConnector/record", params);
    }
    astModify(params: BallerinaSTModifyRequest): Thenable<BallerinaSTModifyResponse> {
        return this.sendRequest<BallerinaSTModifyResponse>("ballerinaDocument/astModify", params);
    }
    stModify(params: BallerinaSTModifyRequest): Thenable<BallerinaSTModifyResponse> {
        return this.sendRequest<BallerinaSTModifyResponse>("ballerinaDocument/syntaxTreeModify", params);
    }
    triggerModify(params: TriggerModifyRequest): Thenable<BallerinaSTModifyResponse> {
        return this.sendRequest<BallerinaSTModifyResponse>("ballerinaDocument/triggerModify", params);
    }

    // getCompletion(params: CompletionParams): Thenable<CompletionResponse[]> {
    //     return this.sendRequest("textDocument/completion", params);
    // }

    public getDocumentSymbol(params: DocumentSymbolParams): Thenable<DocumentSymbol[] | SymbolInformation[] | null> {
        return this.sendRequest("textDocument/documentSymbol", params);
    }

    public close(): void {
        // this.shutdown();
    }
    getDidOpenParams(): DidOpenParams {
        // const uri = store.getState().appInfo?.currentApp?.workingFile;
        // const content = store.getState()?.appInfo?.currentFile?.content;
        // const decContent = content ? atob(content) : "";
        return {
            textDocument: {
                uri: "file://",
                languageId: "ballerina",
                text: '',
                version: 1
            }
        };
    }

    getSyntaxTreeFileRange(params: GetSyntaxTreeFileRangeParams): Thenable<GetSyntaxTreeFileRangeResponse> {
        return this.sendRequest("ballerinaDocument/syntaxTreeByRange", params);
    }

    // getSyntaxTreeFileRange: (params: GetSyntaxTreeFileRangeParams) => Thenable<GetSyntaxTreeFileRangeResponse>;

    getSyntaxHighlighter(params: string): Thenable<BallerinaSynResponse> {
        const req: GetSynRequest = {
            Params: params
        };
        return this.sendRequest("ballerinaSyntaxHighlighter/list", req);
    }

    getSyntaxTree(uri: GetSyntaxTreeParams): Thenable<GetSyntaxTreeResponse> {
        const req: GetSyntaxTreeRequest = {
            documentIdentifier: {
                uri: uri.toString()
            }
        };
        return this.sendRequest("ballerinaDocument/syntaxTree", req);
    }

    fetchExamples(args: BallerinaExampleListRequest = {}): Thenable<BallerinaExampleListResponse> {
        return this.sendRequest("ballerinaExample/list", args);
    }

    getBallerinaProject(params: GetBallerinaProjectParams): Thenable<BallerinaProject> {
        return this.sendRequest("ballerinaPackage/metadata", params);
    }

    getBallerinaProjectComponents(params: GetBallerinaPackagesParams): Thenable<BallerinaProjectComponents> {
        return this.sendRequest("ballerinaPackage/components", params);
    }
}
