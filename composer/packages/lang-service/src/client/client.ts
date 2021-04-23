// tslint:disable-next-line:no-submodule-imports
import { IConnection } from "monaco-languageclient/lib/connection";
import {
    InitializeParams, InitializeResult,
    Location, TextDocumentPositionParams
} from "vscode-languageserver-protocol";
import { BallerinaEndpoint } from "./ast-models";
import {
    BallerinaProject, GetBallerinaProjectParams,
    GetProjectASTParams, GetProjectASTResponse, GetSyntaxTreeParams, GetSyntaxTreeResponse, GoToSourceParams,
    IBallerinaLangClient, RevealRangeParams
} from "./model";

export class BallerinaLangClient implements IBallerinaLangClient {

    public isInitialized: boolean = false;

    constructor(
        public lsConnection: IConnection) {
    }

    public init(params: InitializeParams = initParams): Thenable<InitializeResult> {
        this.lsConnection.listen();
        return this.lsConnection.initialize(params)
            .then((resp) => {
                this.isInitialized = true;
                return resp;
            });
    }

    public getProjectAST(params: GetProjectASTParams): Thenable<GetProjectASTResponse> {
        return this.lsConnection.sendRequest<GetProjectASTResponse>("ballerinaProject/packages", params);
    }

    public getSyntaxTree(params: GetSyntaxTreeParams): Thenable<GetSyntaxTreeResponse> {
        return this.lsConnection.sendRequest<GetSyntaxTreeResponse>("ballerinaDocument/syntaxTree", params);
    }

    // public fetchExamples(params: BallerinaExampleListParams = {}): Thenable<BallerinaExampleListResponse> {
    //     return this.lsConnection.sendRequest("ballerinaExample/list", params);
    // }

    public getEndpoints(): Thenable<BallerinaEndpoint[]> {
        return this.lsConnection.sendRequest("ballerinaSymbol/endpoints", {})
            .then((resp: any) => resp.endpoints);
    }

    public getBallerinaProject(params: GetBallerinaProjectParams): Thenable<BallerinaProject> {
        return this.lsConnection.sendRequest("ballerinaDocument/project", params);
    }

    public getDefinitionPosition(params: TextDocumentPositionParams): Thenable<Location> {
        // TODO
        return Promise.reject("Not implemented");
    }

    public goToSource(params: GoToSourceParams): void {
        // TODO
    }

    public revealRange(params: RevealRangeParams): void {
        // TODO
    }

    public close(): void {
        this.lsConnection.shutdown();
    }
}

export const initParams: InitializeParams = {
    capabilities: {
    },
    processId: process.pid,
    rootUri: null,
    workspaceFolders: null,
};
