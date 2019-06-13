import { Uri, ExtensionContext } from "vscode";
import { join } from "path";
import { ballerinaExtInstance } from "src/core";

export function getWebViewResourceRoot(): string {
    return getVSCodeResourceURI(join((ballerinaExtInstance.context as ExtensionContext).extensionPath, 
        'resources'));
}

export function getNodeModulesRoot(): string {
    return getVSCodeResourceURI(join((ballerinaExtInstance.context as ExtensionContext).extensionPath, 
        'node_modules'));
}

export function getVSCodeResourceURI(filePath: string): string {
    return Uri.file(filePath).with({ scheme: 'vscode-resource' }).toString();
}

export interface WebViewOptions {
    jsFiles?: string[];
    cssFiles?: string[];
    body: string;
    scripts: string;
    styles: string;
    bodyCss?: string;
}

export function getLibraryWebViewContent(options: WebViewOptions) {
    const {
        jsFiles,
        cssFiles,
        body,
        scripts,
        styles,
        bodyCss 
    } = options;

    const resourceRoot = getWebViewResourceRoot();
    const nodeModulesRoot = getNodeModulesRoot();
    const externalScripts = jsFiles 
        ? jsFiles.map(jsFile => 
            '<script charset="UTF-8" onload="loadedScript();" src="' + jsFile +'"></script>')
        : [];
    const externalStyles = cssFiles 
        ? cssFiles.map(cssFile => 
            '<link rel="stylesheet" type="text/css" href="' + cssFile + '" />') 
        : [];

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${externalStyles}
                <style>
                    /* use this class for loader that are shown until the module js is loaded */
                    .root-loader {
                        position: absolute;
                        color: rgba(150, 150, 150, 0.5);
                        left: calc(50% - 20px);
                        top: calc(50% - 20px);
                    }
                    ${styles}
                </style>
            </head>
            
            <body style="overflow: auto;" class="${bodyCss}">
                ${body}
                <script>
                    ${scripts}
                </script>
                <script charset="UTF-8" src="${nodeModulesRoot}/mousetrap/mousetrap.min.js"></script>
                <script charset="UTF-8" src="${resourceRoot}/utils/messaging.js"></script>
                <script charset="UTF-8" src="${resourceRoot}/utils/undo-redo.js"></script>
                ${externalScripts}
            </body>
            </html>
        `;
}

export function getComposerPath(): string {
    return process.env.COMPOSER_DEBUG === "true" 
        ? process.env.COMPOSER_DEV_HOST as string
        : join(ballerinaExtInstance.ballerinaHome, 'lib', 'tools', 'composer-library');
}

export function getComposerJSFiles(isAPIEditor: boolean = false): string[] {
    return [
        getVSCodeResourceURI(join(getComposerPath(), isAPIEditor ? 'apiEditor.js' : 'composer.js')),
        getVSCodeResourceURI(join(getComposerPath(), 'font', 'codepoints.js')),
        process.env.COMPOSER_DEBUG === "true" ? 'http://localhost:8097' : '' // For React Dev Tools
    ];
}

export function getComposerCSSFiles(): string[] {
    return [
        getVSCodeResourceURI(join(getComposerPath(), 'themes', 'ballerina-default.min.css')),
        getVSCodeResourceURI(join(getComposerPath(), 'font', 'font', 'font-ballerina.css'))
    ];
}

export function getComposerWebViewOptions(): Partial<WebViewOptions> {
    return {
        jsFiles: getComposerJSFiles(),
        cssFiles: getComposerCSSFiles()
    };
}