class WebViewRPCHandler {

    constructor(methods) {
        this._sequence = 1;
        this._callbacks = {};
        this.methods = methods || [];
        this._onRemoteMessage = this._onRemoteMessage.bind(this);
        window.addEventListener('message', this._onRemoteMessage);
    }

    _onRemoteMessage(evt) {
        const msg = evt.data;
        if (msg.id) {
            const methodName = msg.methodName;
            // this is a request from remote
            const method = this.methods.find(method => method.methodName === methodName);
            if (method) {
                method.handler(msg.arguments)
                    .then((response) => {
                        vscode.postMessage({
                            originId: msg.id,
                            response: JSON.stringify(response)
                        });
                    });
            }
        } else if (msg.originId) {
            // this is a response from remote
            const seqId = msg.originId;
            if (this._callbacks[seqId]) {
                this._callbacks[seqId](JSON.parse(msg.response));
                delete this._callbacks[seqId];
            }
        }
    }

    addMethod(methodName, handler = () => { }) {
        this.methods.push({ methodName, handler });
    }

    invokeRemoteMethod(methodName, args, onReply = () => { }) {
        const msg = {
            id: this._sequence,
            methodName: methodName,
            arguments: args,
        }
        this._callbacks[this._sequence] = onReply;
        vscode.postMessage(msg);
        this._sequence++;
    }

    dispose() {
        window.removeEventListener('message', this._onRemoteMessage);
    }
}

var webViewRPCHandler = new WebViewRPCHandler([]);

var vscode = acquireVsCodeApi();


function getLangClient() {
    return {
        isInitialized: true,
        getProjectAST: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getProjectAST', [params.sourceRoot], (resp) => {
                    resolve(resp);
                });
            });
        },
        getSyntaxTree: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getSyntaxTree', [params.documentIdentifier.uri], (resp) => {
                    resolve(resp);
                });
            });
        },
        getEndpoints: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getEndpoints', [], (resp) => {
                    resolve(resp);
                });
            })
        },
        revealRange: (params) => {
            if (params) {
                return new Promise((resolve, reject) => {
                    webViewRPCHandler.invokeRemoteMethod(
                        'revealRange',
                        [JSON.stringify(params)],
                        (resp) => {
                            resolve(resp);
                        }
                    );
                })
            }
        },
        goToSource: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod(
                    'goToSource',
                    [JSON.stringify(params)],
                    (resp) => {
                        resolve(resp);
                    }
                );
            })
        },
        getExamples: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getExamples', [], (resp) => {
                    resolve(resp.samples);
                });
            })
        },
        getDefinitionPosition: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getDefinitionPosition', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        didOpen: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('didOpen', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        registerPublishDiagnostics: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('registerPublishDiagnostics', [], (resp) => {
                    resolve(resp);
                });
            })
        },
        didClose: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('didClose', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        didChange: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('didChange', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        syntaxTreeModify: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('syntaxTreeModify', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        getConnectors: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getConnectors', [], (resp) => {
                    resolve(resp);
                });
            })
        },
        getConnector: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getConnector', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        getRecord: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getRecord', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        astModify: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('astModify', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        stModify: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('stModify', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        triggerModify: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('triggerModify', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        getDocumentSymbol: (params) => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getDocumentSymbol', [params], (resp) => {
                    resolve(resp);
                });
            })
        },
        close: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('close', [], (resp) => {
                    resolve(resp);
                });
            })
        },
        getDidOpenParams: () => {
            return new Promise((resolve, reject) => {
                webViewRPCHandler.invokeRemoteMethod('getDidOpenParams', [], (resp) => {
                    resolve(resp);
                });
            })
        }
    }
}