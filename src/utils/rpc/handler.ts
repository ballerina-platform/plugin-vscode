import { WebViewMethod, WebViewRPCMessage } from './model';
import { Position, Range, Selection, window, Uri, TextEditor, ViewColumn, commands, WebviewPanel } from 'vscode';
import { ExtendedLangClient } from 'src/core/extended-language-client';

const getLangClientMethods = (langClient: ExtendedLangClient): WebViewMethod[] => {
    return [{
        methodName: 'getSyntaxTree',
        handler: (args: any[]) => {
            return langClient.onReady().then(() => {
                return langClient.getSyntaxTree(args[0]);
            });
        }
    },
    {
        methodName: 'getEndpoints',
        handler: (args: any[]) => {
            return langClient.onReady().then(() => {
                return langClient.getEndpoints();
            });
        }
    },
    {
        methodName: 'revealRange',
        handler: (args: any[], webViewPanel) => {
            const params = JSON.parse(args[0]);
            const revealRangeInEditor = (editor: TextEditor) => {
                const { start, end } = params.range;
                const startPosition = new Position(start.line - 1, start.character - 1);
                const endPosition = new Position(end.line - 1, end.character - 1);
                editor.revealRange(new Range(startPosition, endPosition));
                editor.selection = new Selection(startPosition, endPosition);
                // Following is a hack tempPanel is created so the editor has two columns
                // webViewPanel.reveal does not move to column TWO if its not already there
                // TODO: Report to vscode as a bug
                const tempPanel = window.createWebviewPanel(
                    'temp',
                    'TEMP',
                    { viewColumn: ViewColumn.Two, preserveFocus: true }
                );
                webViewPanel.reveal(ViewColumn.Two);
                setTimeout(() => {
                    tempPanel.dispose();
                }, 0);
            };
            const activeTextEditor = window.activeTextEditor;
            const visibleTextEditors = window.visibleTextEditors;
            const findByDocUri = (editor: TextEditor) => editor.document.uri.toString()
                === params.textDocumentIdentifier.uri;
            const foundVisibleEditor = visibleTextEditors.find(findByDocUri);

            if (activeTextEditor && findByDocUri(activeTextEditor)) {
                revealRangeInEditor(activeTextEditor);
            } else if (foundVisibleEditor) {
                revealRangeInEditor(foundVisibleEditor);
                return Promise.resolve();
            } else {
                return window.showTextDocument(Uri.parse(params.textDocumentIdentifier.uri)
                    , {
                        viewColumn: ViewColumn.One
                    })
                    .then((textEditor) => {
                        revealRangeInEditor(textEditor);
                    });
            }
        }
    },
    {
        methodName: 'goToSource',
        handler: (args: any[]) => {
            const activeEditor = window.activeTextEditor;
            if (activeEditor) {
                // TODO
            }
            return Promise.resolve();
        }
    },
    {
        methodName: 'getExamples',
        handler: (args: any[]) => {
            return langClient.onReady().then(() => {
                return langClient.fetchExamples();
            });
        }
    },
    {
        methodName: 'getDefinitionPosition',
        handler: (args: any[]) => {
            return langClient.getDefinitionPosition(args[0]);
        }
    },
    {
        methodName: 'didOpen',
        handler: (args: any[]) => {
            return langClient.didOpen(args[0]);
        }
    }, {
        methodName: 'registerPublishDiagnostics',
        handler: () => {
            return langClient.registerPublishDiagnostics();
        }
    }, {
        methodName: 'didClose',
        handler: (args: any[]) => {
            return langClient.didClose(args[0]);
        }
    }, {
        methodName: 'didChange',
        handler: (args: any[]) => {
            return langClient.didChange(args[0]);
        }
    }, {
        methodName: 'syntaxTreeModify',
        handler: (args: any[]) => {
            return langClient.syntaxTreeModify(args[0]);
        }
    }, {
        methodName: 'getConnectors',
        handler: () => {
            return langClient.getConnectors();
        }
    }, {
        methodName: 'getConnector',
        handler: (args: any[]) => {
            return langClient.getConnector(args[0]);
        }
    }, {
        methodName: 'getRecord',
        handler: (args: any[]) => {
            return langClient.getRecord(args[0]);
        }
    }, {
        methodName: 'astModify',
        handler: (args: any[]) => {
            return langClient.astModify(args[0]);
        }
    }, {
        methodName: 'stModify',
        handler: (args: any[]) => {
            return langClient.stModify(args[0]);
        }
    }, {
        methodName: 'triggerModify',
        handler: (args: any[]) => {
            return langClient.triggerModify(args[0]);
        }
    }, {
        methodName: 'getDocumentSymbol',
        handler: (args: any[]) => {
            return langClient.getDocumentSymbol(args[0]);
        }
    }, {
        methodName: 'close',
        handler: () => {
            return langClient.close();
        }
    }, {
        methodName: 'getDidOpenParams',
        handler: () => {
            return langClient.getDidOpenParams();
        }
    }, {
        methodName: 'getSyntaxTreeFileRange',
        handler: (args: any[]) => {
            return langClient.getSyntaxTreeFileRange(args[0]);
        }
    }
    ];
};

const undoRedoMethods = [{
    methodName: 'undo',
    handler: (args: any[]) => {
        commands.executeCommand('workbench.action.focusPreviousGroup')
            .then(() => {
                commands.executeCommand('undo');
            });
    }
},
{
    methodName: 'redo',
    handler: (args: any[]) => {
        commands.executeCommand('workbench.action.focusPreviousGroup')
            .then(() => {
                commands.executeCommand('redo');
            });

    }
}
];

export class WebViewRPCHandler {

    private _sequence: number = 1;
    private _callbacks: Map<number, Function> = new Map();

    constructor(public methods: Array<WebViewMethod>, public webViewPanel: WebviewPanel) {
        webViewPanel.webview.onDidReceiveMessage(this._onRemoteMessage.bind(this));
        this.webViewPanel = webViewPanel;
    }

    private _getMethod(methodName: string) {
        return this.methods.find(method => (method.methodName === methodName));
    }

    private _onRemoteMessage(msg: WebViewRPCMessage) {
        if (msg.id !== undefined) {
            // this is a request from remote
            const method = this._getMethod(msg.methodName);
            if (method) {
                method.handler(msg.arguments || [], this.webViewPanel)
                    .then((response: Thenable<any>) => {
                        this.webViewPanel.webview.postMessage({
                            originId: msg.id,
                            response: JSON.stringify(response)
                        });
                    });
            }
        } else if (msg.originId !== undefined) {
            // this is a response from remote to one of our requests
            const callback = this._callbacks.get(msg.originId);
            if (callback) {
                callback(JSON.parse(msg.response));
                this._callbacks.delete(msg.originId);
            }
        }
    }

    invokeRemoteMethod(methodName: string, args: any[] = [], callback: Function) {
        const msg = {
            id: this._sequence,
            methodName,
            arguments: args,
        };
        this._callbacks.set(this._sequence, callback);
        this.webViewPanel.webview.postMessage(msg);
        this._sequence++;
    }

    static create(
        webViewPanel: WebviewPanel,
        langClient: ExtendedLangClient,
        methods: Array<WebViewMethod> = [])
        : WebViewRPCHandler {
        return new WebViewRPCHandler(
            [...methods, ...getLangClientMethods(langClient), ...undoRedoMethods],
            webViewPanel);
    }

    dispose() {
        // TODO unregister event handlers
    }
}
