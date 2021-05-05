import { ballerinaExtInstance } from "../../core";
import { commands, window } from "vscode";
import {
    TM_EVENT_PROJECT_CLOUD, TM_EVENT_ERROR_EXECUTE_PROJECT_CLOUD, CMP_PROJECT_CLOUD, sendTelemetryEvent,
    sendTelemetryException
} from "../../telemetry";
import { outputChannel } from "../../utils";
import { getCurrentBallerinaProject } from "../../utils/project-utils";
import { PROJECT_TYPE } from "./cmd-runner";
import * as fs from 'fs';

const CLOUD_CONFIG_FILE_NAME = "/Cloud.toml";

export function activateCloudCommand() {
    // register create Cloud.toml command handler
    commands.registerCommand('ballerina.create.cloud', async () => {
        try {
            sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_PROJECT_CLOUD, CMP_PROJECT_CLOUD);

            const currentProject = await getCurrentBallerinaProject();
            if (!ballerinaExtInstance.isSwanLake) {
                const message = `Ballerina version doesn't support Cloud.toml creation.`;
                sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_ERROR_EXECUTE_PROJECT_CLOUD, CMP_PROJECT_CLOUD, message);
                window.showErrorMessage(message);
                return;
            }

            if (currentProject.kind !== PROJECT_TYPE.SINGLE_FILE) {
                if (currentProject.path) {
                    let cloudTomlPath = currentProject.path + CLOUD_CONFIG_FILE_NAME;
                    if (!fs.existsSync(cloudTomlPath)) {
                        const commandArgs =  {
                            key : "uri",
                            value : window.activeTextEditor!.document.uri.toString()
                        };
                        commands.executeCommand('ballerina.create.cloud.exec', commandArgs);
                        outputChannel.appendLine(`Cloud.toml created in ${currentProject.path}`);
                    } else {
                        const message = `Cloud.toml already exists in the project.`;
                        sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_ERROR_EXECUTE_PROJECT_CLOUD, CMP_PROJECT_CLOUD, message);
                        window.showErrorMessage(message);
                    }
                }
            } else {
                const message = `Cloud.toml is not supported for single file projects.`;
                sendTelemetryEvent(ballerinaExtInstance, TM_EVENT_ERROR_EXECUTE_PROJECT_CLOUD, CMP_PROJECT_CLOUD, message);
                window.showErrorMessage(message);
            }
        } catch (error) {
            sendTelemetryException(ballerinaExtInstance, error, CMP_PROJECT_CLOUD);
            window.showErrorMessage(error);
        }
    });
}
