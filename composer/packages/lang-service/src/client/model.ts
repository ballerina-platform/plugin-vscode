import {
    InitializeParams, InitializeResult, Location, Position,
    Range, TextDocumentPositionParams
} from "vscode-languageserver-protocol";
import {
    BallerinaAST, BallerinaEndpoint
} from "./ast-models";

export interface GetProjectASTParams {
    sourceRoot: string;
}

export interface GetProjectASTResponse {
    modules: ProjectAST;
    parseSuccess: boolean;
}

export interface ProjectAST {
    [moduleName: string]: {
        name: string,
        compilationUnits: {
            [compilationUnitName: string]: {
                name: string,
                ast: BallerinaAST,
                uri: string,
            }
        }
    };
}

export interface GetSyntaxTreeParams {
    documentIdentifier: {
        uri: string;
    };
}

export interface GetSyntaxTreeResponse {
    syntaxTree: BallerinaAST;
    parseSuccess: boolean;
}

export interface GoToSourceParams {
    textDocumentIdentifier: {
        uri: string;
    };
    position: Position;
}

export interface RevealRangeParams {
    textDocumentIdentifier: {
        uri: string;
    };
    range: Range;
}

export interface BallerinaExample {
    title: string;
    url: string;
}

export interface BallerinaExampleCategory {
    title: string;
    column: number;
    samples: BallerinaExample[];
}

export interface BallerinaExampleListParams {
    filter?: string;
}

export interface BallerinaExampleListResponse {
    samples: BallerinaExampleCategory[];
}

export interface BallerinaProject {
    path?: string;
    version?: string;
    author?: string;
}

export interface GetBallerinaProjectParams {
    documentIdentifier: {
        uri: string;
    };
}

export interface IBallerinaLangClient {

    isInitialized: boolean;

    init: (params?: InitializeParams) => Thenable<InitializeResult>;

    getProjectAST: (params: GetProjectASTParams) => Thenable<GetProjectASTResponse>;

    getSyntaxTree: (params: GetSyntaxTreeParams) => Thenable<GetSyntaxTreeResponse>;

    // fetchExamples: (params: BallerinaExampleListParams) => Thenable<BallerinaExampleListResponse>;

    getEndpoints: () => Thenable<BallerinaEndpoint[]>;

    getBallerinaProject: (params: GetBallerinaProjectParams) => Thenable<BallerinaProject>;

    getDefinitionPosition: (params: TextDocumentPositionParams) => Thenable<Location>;

    goToSource: (params: GoToSourceParams) => void;

    revealRange: (params: RevealRangeParams) => void;

    close: () => void;
}
