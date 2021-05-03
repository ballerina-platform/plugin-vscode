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
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { join } from 'path';

export enum PROJECT_KIND {
    PACKAGE = "package",
    MODULE = "module",
    FUNCTION = "function",
    SERVICE = "service",
    RESOURCE = "resource"
}

export const TREE_ELEMENT_EXECUTE_COMMAND: string = 'ballerina.executeTreeElement';
export const TREE_REFRESH_COMMAND: string = 'ballerina.refreshPackageTree';

export class PackageTreeItem extends TreeItem {
    private kind: string;
    private filePath: string;
    private extensionPath: string;
    private parent: PackageTreeItem | null;
    private childrenData: ChildrenData;
    private startLine: number;
    private startColumn: number;
    private endLine: number;
    private endColumn: number;
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        kind: string,
        filePath: string,
        extensionPath: string,
        hasIcon: boolean,
        parent: PackageTreeItem | null,
        childrenData: ChildrenData,
        startLine: number = -1,
        startColumn: number = -1,
        endLine: number = -1,
        endColumn: number = -1
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label} ${kind}`;
        this.description = this.version;
        this.kind = kind;
        this.filePath = filePath;
        this.extensionPath = extensionPath;
        this.childrenData = childrenData;
        this.parent = parent;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
        if (hasIcon) {
            this.iconPath = {
                light: join(this.extensionPath, 'resources', 'images', 'icons', `${kind.toLowerCase()}.svg`),
                dark: join(this.extensionPath, 'resources', 'images', 'icons', `${kind.toLowerCase()}-inverse.svg`)
            };
        }

        this.command = {
            command: TREE_ELEMENT_EXECUTE_COMMAND,
            title: "Execute Tree Command",
            arguments: [
                this.filePath,
                this.kind,
                this.startLine,
                this.startColumn,
                this.endLine,
                this.endColumn,
                this.label
            ]
        };
    }

    getParent(): PackageTreeItem | null {
        return this.parent;
    }

    setChildrenData(response) {
        this.childrenData = response;
    }

    getChildrenData() {
        return this.childrenData;
    }

    getFilePath() {
        return this.filePath;
    }

    getStartLine() {
        return this.startLine;
    }

    getStartColumn() {
        return this.startColumn;
    }

    getEndLine() {
        return this.endLine;
    }

    getEndColumn() {
        return this.endColumn;
    }

    getKind() {
        return this.kind;
    }
}

export interface ChildrenData {
    functions?: FunctionOrResource[];
    services?: Service[];
    resources?: FunctionOrResource[];
    modules?: Module[];
}

export interface Package {
    name: string;
    filePath: string;
    modules: Module[];
}

export interface Module {
    name?: string;
    default?: boolean;
    functions: FunctionOrResource[];
    services: Service[];
}

interface FunctionOrResource {
    name: string;
    filePath: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

interface Service {
    name: string;
    filePath: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    resources: FunctionOrResource[];
}
