import { Uri } from 'vscode';
import { getLibraryWebViewContent, WebViewOptions, getComposerWebViewOptions, log } from '../utils';
// import fileUriToPath = require('file-uri-to-path');

export function render(filePath: Uri, startLine: number, startColumn: number, endLine: number, endColumn: number, kind: string, name: string)
    : string {
    return renderDiagram(filePath, startLine, startColumn, endLine, endColumn, kind, name);
}

function renderDiagram(filePath: Uri, startLine: number, startColumn: number, endLine: number, endColumn: number,
    kind: string, name: string): string {

    const body = `
        <div id="warning"></div>
        <div class="ballerina-editor design-view-container" id="diagram"></div>
    `;

    const bodyCss = "diagram";

    const styles = `
        body {
            background: #f1f1f1;
        }
        .overlay {
            display: none;
        }
        .drop-zone.rect {
            fill-opacity: 0;
        }
        #diagram {
            height : 100%;
        }
        #errors {
            display: table;
            width: 100%;
            height: 100%;
        }
        #errors span { 
            display: table-cell;
            vertical-align: middle;
            text-align: center;
        }
        #warning {
            position: absolute;
            top: 15px;
            position: absolute;
            overflow: hidden;
            height: 25px;
            vertical-align: bottom;
            text-align: center;
            color: rgb(255, 90, 30);
            width: 100%;
        }
        #warning p {
            line-height: 25px;
        }
    `;

    // const filePathString = fileUriToPath(filePath.toString());
    log(filePath.fsPath);
    log('start: ' + startLine);
    log('startColumn: ' + startColumn);
    log('end: ' + endLine);
    log('endColumn: ' + endColumn);

    name = name.split(' ').pop()!;
    kind = kind.charAt(0).toUpperCase() + kind.slice(1);
    log('kind: ' + kind);
    log('name: ' + name);
    const scripts = `
        function loadedScript() {
            window.langclient = getLangClient();
            let filePath = ${JSON.stringify(filePath.fsPath)};
            let startLine = ${JSON.stringify(startLine.toString())};
            let startColumn = ${JSON.stringify(startColumn.toString())};
            let endLine = ${JSON.stringify(endLine.toString())};
            let endColumn = ${JSON.stringify(endColumn.toString())};
            let name = ${JSON.stringify(name)};
            let kind = ${JSON.stringify(kind)};
            function drawDiagram() {
                try {
                    let width = window.innerWidth - 6;
                    let height = window.innerHeight;
                    let zoom = 1;
                    const options = {
                        target: document.getElementById("diagram"),
                        editorProps: {
                            langClient: getLangClient(),
                            filePath,
                            startLine,
                            startColumn,
                            endLine,
                            endColumn,
                            name,
                            kind
                        }
                    };
                    const diagram = ballerinaComposer.renderDiagramEditor(options);
                    webViewRPCHandler.addMethod("updateAST", (args) => {
                        diagram.updateAST(args[0]);
                        return Promise.resolve({});
                    });
                } catch(e) {
                    console.log(e.stack);
                    drawError('Oops. Something went wrong. ' + e.message);
                }
            }
            function drawError(message) {
                document.getElementById("diagram").innerHTML = \`
                <div id="errors">
                    <span>\$\{message\}</span>
                </div>
                \`;
            }
            drawDiagram();
            enableUndoRedo();
        }
    `;

    const webViewOptions: WebViewOptions = {
        ...getComposerWebViewOptions(),
        body, scripts, styles, bodyCss
    };

    return getLibraryWebViewContent(webViewOptions);
}

export function renderError() {
    return `
    <!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
    <div>
        Could not connect to the parser service. Please try again after restarting vscode.
        <a href="command:workbench.action.reloadWindow">Restart</a>
    </div>
    </body>
    </html>
    `;
}
