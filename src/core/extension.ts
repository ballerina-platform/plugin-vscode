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

import {
    workspace, window, commands, languages, Uri,
    ConfigurationChangeEvent, extensions,
    Extension, ExtensionContext, IndentAction, WebviewPanel, OutputChannel, StatusBarItem, StatusBarAlignment
} from "vscode";
import {
    INVALID_HOME_MSG, INSTALL_BALLERINA, DOWNLOAD_BALLERINA, MISSING_SERVER_CAPABILITY, ERROR, COMMAND_NOT_FOUND, NO_SUCH_FILE,
    CONFIG_CHANGED, OLD_BALLERINA_VERSION, UNKNOWN_ERROR, INVALID_FILE, INSTALL_NEW_BALLERINA,
} from "./messages";
import * as path from 'path';
import { exec, spawnSync } from 'child_process';
import { LanguageClientOptions, State as LS_STATE, RevealOutputChannelOn, ServerOptions } from "vscode-languageclient";
import { getServerOptions } from '../server/server';
import { ExtendedLangClient } from './extended-language-client';
import { log, getOutputChannel, outputChannel } from '../utils/index';
import { AssertionError } from "assert";
import { BALLERINA_HOME, ENABLE_TELEMETRY, OVERRIDE_BALLERINA_HOME } from "./preferences";
import TelemetryReporter from "vscode-extension-telemetry";
import {
    createTelemetryReporter, CMP_EXTENSION_CORE, sendTelemetryEvent, sendTelemetryException,
    TM_EVENT_ERROR_INVALID_BAL_HOME_CONFIGURED, TM_EVENT_EXTENSION_INIT, TM_EVENT_EXTENSION_INI_FAILED,
    TM_EVENT_ERROR_OLD_BAL_HOME_DETECTED
} from "../telemetry";
const any = require('promise.any');

const SWAN_LAKE_REGEX = /(s|S)wan( |-)(l|L)ake/g;
const PREV_REGEX = /1\.2\.[0-9]+/g;

export const EXTENSION_ID = 'ballerina.ballerina';

export interface ConstructIdentifier {
    filePath: string;
    kind: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export class BallerinaExtension {
    public telemetryReporter: TelemetryReporter;
    public ballerinaHome: string;
    public ballerinaCmd: string;
    public ballerinaVersion: string;
    public isSwanLake: boolean;
    public is12x: boolean;
    public extension: Extension<any>;
    private clientOptions: LanguageClientOptions;
    public langClient?: ExtendedLangClient;
    public context?: ExtensionContext;
    private sdkVersion: StatusBarItem;
    private packageTreeElementClickedCallbacks: Array<(construct: ConstructIdentifier) => void> = [];

    private webviewPanels: {
        [name: string]: WebviewPanel;
    };

    constructor() {
        this.ballerinaHome = '';
        this.ballerinaCmd = '';
        this.ballerinaVersion = '';
        this.webviewPanels = {};
        this.sdkVersion = window.createStatusBarItem(StatusBarAlignment.Left, 100);
        this.sdkVersion.text = `Ballerina SDK: Detecting`;
        this.sdkVersion.command = `ballerina.showLogs`;
        this.sdkVersion.show();
        this.isSwanLake = false;
        this.is12x = false;
        // Load the extension
        this.extension = extensions.getExtension(EXTENSION_ID)!;
        this.clientOptions = {
            documentSelector: [{ scheme: 'file', language: 'ballerina' }, { scheme: 'file', language: 'toml' }],
            synchronize: { configurationSection: 'ballerina' },
            outputChannel: getOutputChannel(),
            revealOutputChannelOn: RevealOutputChannelOn.Never,
        };
        this.telemetryReporter = createTelemetryReporter(this);
    }

    setContext(context: ExtensionContext) {
        this.context = context;
    }

    init(_onBeforeInit: Function): Promise<void> {
        // Register show logs command.
        const showLogs = commands.registerCommand('ballerina.showLogs', () => {
            outputChannel.show();
        });
        this.context!.subscriptions.push(showLogs);

        try {
            // Register pre init handlers.
            this.registerPreInitHandlers();

            // Check if ballerina home is set.
            if (this.overrideBallerinaHome()) {
                if (!this.overrideBallerinaHome()) {
                    const message = "Trying to get ballerina version without setting ballerina home.";
                    sendTelemetryEvent(this, TM_EVENT_ERROR_INVALID_BAL_HOME_CONFIGURED, CMP_EXTENSION_CORE, message);
                    throw new AssertionError({
                        message: message
                    });
                }

                log("Ballerina home is configured in settings.");
                this.ballerinaHome = this.getConfiguredBallerinaHome();
            }

            // Validate the ballerina version.
            const pluginVersion = this.extension.packageJSON.version.split('-')[0];
            return this.getBallerinaVersion(this.ballerinaHome, this.overrideBallerinaHome()).then(runtimeVersion => {
                this.ballerinaVersion = runtimeVersion.split('-')[0];
                if (!this.overrideBallerinaHome()) {
                    const { home } = this.autoDetectBallerinaHome();
                    this.ballerinaHome = home;
                }
                log(`Plugin version: ${pluginVersion}\nBallerina version: ${this.ballerinaVersion}`);
                this.sdkVersion.text = `Ballerina SDK: ${this.ballerinaVersion}`;

                if (this.ballerinaVersion.match(SWAN_LAKE_REGEX)) {
                    this.isSwanLake = true;
                } else if (this.ballerinaVersion.match(PREV_REGEX)) {
                    this.is12x = true;
                }

                if (!this.isSwanLake && !this.is12x) {
                    this.showMessageOldBallerina();
                    const message = `Ballerina version ${this.ballerinaVersion} is not supported. 
                        Please use a compatible VSCode extension version.`;
                    sendTelemetryEvent(this, TM_EVENT_ERROR_OLD_BAL_HOME_DETECTED, CMP_EXTENSION_CORE, message);
                    throw new AssertionError({
                        message: message
                    });
                }

                // if Home is found load Language Server.
                let serverOptions: ServerOptions;
                serverOptions = getServerOptions(this.ballerinaCmd);
                this.langClient = new ExtendedLangClient('ballerina-vscode', 'Ballerina LS Client', serverOptions,
                    this.clientOptions, false);

                // Following was put in to handle server startup failures.
                const disposeDidChange = this.langClient.onDidChangeState(stateChangeEvent => {
                    if (stateChangeEvent.newState === LS_STATE.Stopped) {
                        const message = "Couldn't establish language server connection.";
                        sendTelemetryEvent(this, TM_EVENT_EXTENSION_INI_FAILED, CMP_EXTENSION_CORE, message);
                        log(message);
                        this.showPluginActivationError();
                    }
                });

                let disposable = this.langClient.start();
                this.langClient.onReady().then(() => {
                    disposeDidChange.dispose();
                    this.context!.subscriptions.push(disposable);
                });
            }, (reason) => {
                sendTelemetryException(this, reason, CMP_EXTENSION_CORE);
                throw new Error(reason);
            }).catch(e => {
                const msg = `Error when checking ballerina version. ${e.message}`;
                sendTelemetryException(this, e, CMP_EXTENSION_CORE, msg);
                this.telemetryReporter.dispose();
                throw new Error(msg);
            });
        } catch (ex) {
            const msg = "Error while activating plugin. " + (ex.message ? ex.message : ex);
            // If any failure occurs while initializing show an error message
            this.showPluginActivationError();
            sendTelemetryException(this, ex, CMP_EXTENSION_CORE, msg);
            this.telemetryReporter.dispose();
            return Promise.reject(msg);
        }
    }

    onReady(): Promise<void> {
        if (!this.langClient) {
            const message = `Ballerina SDK: Error`;
            this.sdkVersion.text = message;
            sendTelemetryEvent(this, TM_EVENT_EXTENSION_INI_FAILED, CMP_EXTENSION_CORE, message);
            this.telemetryReporter.dispose();
            return Promise.reject('BallerinaExtension is not initialized');
        }

        sendTelemetryEvent(this, TM_EVENT_EXTENSION_INIT, CMP_EXTENSION_CORE);
        return this.langClient.onReady();
    }

    showPluginActivationError(): any {
        // message to display on Unknown errors.
        // ask to enable debug logs.
        // we can ask the user to report the issue.
        this.sdkVersion.text = `Ballerina SDK: Error`;
        window.showErrorMessage(UNKNOWN_ERROR);
    }

    registerPreInitHandlers(): any {
        // We need to restart VSCode if we change plugin configurations.
        workspace.onDidChangeConfiguration((params: ConfigurationChangeEvent) => {
            if (params.affectsConfiguration(BALLERINA_HOME) ||
                params.affectsConfiguration(OVERRIDE_BALLERINA_HOME)) {
                this.showMsgAndRestart(CONFIG_CHANGED);
            }
        });

        languages.setLanguageConfiguration('ballerina', {
            onEnterRules: [
                {
                    beforeText: new RegExp('^\\s*#'),
                    action: {
                        appendText: '# ',
                        indentAction: IndentAction.None,
                    }
                }
            ]
        });
    }

    showMsgAndRestart(msg: string): void {
        const action = 'Restart Now';
        window.showInformationMessage(msg, action).then((selection) => {
            if (action === selection) {
                commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }

    async getBallerinaVersion(ballerinaHome: string, overrideBallerinaHome: boolean): Promise<string> {
        // if ballerina home is overridden, use ballerina cmd inside distribution
        // otherwise use wrapper command
        let distPath = "";
        if (overrideBallerinaHome) {
            distPath = path.join(ballerinaHome, "bin") + path.sep;
        }
        let exeExtension = "";
        if (process.platform === 'win32') {
            exeExtension = ".bat";
        }

        let ballerinaExecutor = '';
        const balPromise: Promise<string> = new Promise((resolve, reject) => {
            exec(distPath + 'bal' + exeExtension + ' version', (err, stdout, _stderr) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (stdout.length === 0 || stdout.startsWith(ERROR) || stdout.includes(NO_SUCH_FILE) || stdout.includes(COMMAND_NOT_FOUND)) {
                    reject(stdout);
                    return;
                }

                ballerinaExecutor = 'bal';
                log(`'bal' command is picked up from the plugin.`);
                resolve(stdout);
            });
        });
        const ballerinaPromise: Promise<string> = new Promise((resolve, reject) => {
            exec(distPath + 'ballerina' + exeExtension + ' version', (err, stdout, _stderr) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (stdout.length === 0 || stdout.startsWith(ERROR) || stdout.includes(NO_SUCH_FILE) || stdout.includes(COMMAND_NOT_FOUND)) {
                    reject(stdout);
                    return;
                }

                ballerinaExecutor = 'ballerina';
                log(`'ballerina' command is picked up from the plugin.`);
                resolve(stdout);
            });
        });
        const cmdOutput = await any([balPromise, ballerinaPromise]);
        this.ballerinaCmd = distPath + ballerinaExecutor + exeExtension;
        try {
            const implVersionLine = cmdOutput.split('\n')[0];
            const replacePrefix = implVersionLine.startsWith("jBallerina")
                ? /jBallerina /
                : /Ballerina /;
            const parsedVersion = implVersionLine.replace(replacePrefix, '').replace(/[\n\t\r]/g, '');
            return Promise.resolve(parsedVersion);
        } catch (error) {
            sendTelemetryException(this, error, CMP_EXTENSION_CORE);
            return Promise.reject(error);
        }
    }

    showMessageInstallBallerina(): any {
        const download: string = 'Download';
        const openSettings: string = 'Open Settings';
        const viewLogs: string = 'View Logs';
        window.showWarningMessage(INSTALL_BALLERINA, download, openSettings, viewLogs).then((selection) => {
            if (openSettings === selection) {
                commands.executeCommand('workbench.action.openGlobalSettings');
            } else if (download === selection) {
                commands.executeCommand('vscode.open', Uri.parse(DOWNLOAD_BALLERINA));
            } else if (viewLogs === selection) {
                const balOutput = ballerinaExtInstance.getOutPutChannel();
                if (balOutput) {
                    balOutput.show();
                }
            }

        });
    }

    showMessageInstallLatestBallerina(): any {
        const download: string = 'Download';
        const openSettings: string = 'Open Settings';
        const viewLogs: string = 'View Logs';
        window.showWarningMessage(ballerinaExtInstance.getVersion() + INSTALL_NEW_BALLERINA, download, openSettings, viewLogs).then((selection) => {
            if (openSettings === selection) {
                commands.executeCommand('workbench.action.openGlobalSettings');
            }
            if (download === selection) {
                commands.executeCommand('vscode.open', Uri.parse(DOWNLOAD_BALLERINA));
            } else if (viewLogs === selection) {
                const balOutput = ballerinaExtInstance.getOutPutChannel();
                if (balOutput) {
                    balOutput.show();
                }
            }
        });
    }

    showMessageInvalidBallerinaHome(): void {
        const action = 'Open Settings';
        window.showWarningMessage(INVALID_HOME_MSG, action).then((selection) => {
            if (action === selection) {
                commands.executeCommand('workbench.action.openGlobalSettings');
            }
        });
    }

    showMessageOldBallerina(): any {
        const download: string = 'Download';
        window.showWarningMessage(OLD_BALLERINA_VERSION, download).then((selection) => {
            if (download === selection) {
                commands.executeCommand('vscode.open', Uri.parse(DOWNLOAD_BALLERINA));
            }
        });
    }

    showMessageServerMissingCapability(): any {
        const download: string = 'Download';
        window.showErrorMessage(MISSING_SERVER_CAPABILITY, download).then((selection) => {
            if (download === selection) {
                commands.executeCommand('vscode.open', Uri.parse(DOWNLOAD_BALLERINA));
            }
        });
    }

    showMessageInvalidFile(): any {
        window.showErrorMessage(INVALID_FILE);
    }

    /**
     * Get ballerina home path.
     *
     * @returns {string}
     * @memberof BallerinaExtension
     */
    getBallerinaHome(): string {
        return this.ballerinaHome;
    }

    /**
     * Get ballerina home path configured in preferences.
     *
     * @returns {string}
     * @memberof BallerinaExtension
     */
    getConfiguredBallerinaHome(): string {
        return <string>workspace.getConfiguration().get(BALLERINA_HOME);
    }

    autoDetectBallerinaHome(): { home: string, isOldBallerinaDist: boolean, isBallerinaNotFound: boolean } {
        let balHomeOutput = "",
            isBallerinaNotFound = false,
            isOldBallerinaDist = false;
        try {
            let response = spawnSync(this.ballerinaCmd, ['home']);
            if (response.stdout.length > 0) {
                balHomeOutput = response.stdout.toString().trim();
            } else if (response.stderr.length > 0) {
                let message = response.stderr.toString();
                // ballerina is installed, but ballerina home command is not found
                isOldBallerinaDist = message.includes("bal: unknown command 'home'");
                // ballerina is not installed
                isBallerinaNotFound = message.includes('command not found')
                    || message.includes('unknown command')
                    || message.includes('is not recognized as an internal or external command');
                log("Error executing `bal home`. " + "\n<---- cmd output ---->\n"
                    + message + "<---- cmd output ---->\n");
            }

            // specially handle unknown ballerina command scenario for windows
            if (balHomeOutput === "" && process.platform === "win32") {
                isOldBallerinaDist = true;
            }
        } catch ({ message }) {
            // ballerina is installed, but ballerina home command is not found
            isOldBallerinaDist = message.includes("bal: unknown command 'home'");
            // ballerina is not installed
            isBallerinaNotFound = message.includes('command not found')
                || message.includes('unknown command')
                || message.includes('is not recognized as an internal or external command');
            log("Error executing `bal home`. " + "\n<---- cmd output ---->\n"
                + message + "<---- cmd output ---->\n");
        }

        return {
            home: isBallerinaNotFound || isOldBallerinaDist ? '' : balHomeOutput,
            isBallerinaNotFound,
            isOldBallerinaDist
        };
    }

    public overrideBallerinaHome(): boolean {
        return <boolean>workspace.getConfiguration().get(OVERRIDE_BALLERINA_HOME);
    }

    public addWebviewPanel(name: string, panel: WebviewPanel) {
        this.webviewPanels[name] = panel;

        panel.onDidDispose(() => {
            delete this.webviewPanels[name];
        });
    }

    public getWebviewPanels() {
        return this.webviewPanels;
    }

    public getID(): string {
        return this.extension.id;
    }

    public getVersion(): string {
        return this.extension.packageJSON.version;
    }

    public getOutPutChannel(): OutputChannel | undefined {
        return getOutputChannel();
    }

    public isTelemetryEnabled(): boolean {
        return <boolean>workspace.getConfiguration().get(ENABLE_TELEMETRY);
    }

    public packageTreeElementClicked(construct: ConstructIdentifier): void {
        this.packageTreeElementClickedCallbacks.forEach((callback) => {
            callback(construct);
        });
    }

    public onPackageTreeElementClicked(callback: (construct: ConstructIdentifier) => void) {
        this.packageTreeElementClickedCallbacks.push(callback);
    }
}

export const ballerinaExtInstance = new BallerinaExtension();
