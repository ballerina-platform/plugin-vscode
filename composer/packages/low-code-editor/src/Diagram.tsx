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
// tslint:disable-next-line:no-submodule-imports
import { DiagramEditorLangClientInterface } from "@wso2-enterprise/low-code-editor";
// tslint:disable-next-line:no-submodule-imports
import { DiagramGenerator } from "@wso2-enterprise/low-code-editor/build/DiagramGenerator/index";
import * as React from "react";

export interface DiagramProps {
    target: HTMLElement;
    editorProps: {
        langClient: DiagramEditorLangClientInterface,
        filePath: string,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number
    };
}

/**
 * React component for rendering a the low code editor.
 */
export class Diagram extends React.Component<DiagramProps> {

    private languageClient: DiagramEditorLangClientInterface;
    private filePath: string;
    private startLine: number;
    private startColumn: number;
    private endLine: number;
    private endColumn: number;

    constructor(props: DiagramProps) {
        super(props);
        this.filePath = props.editorProps.filePath;
        this.startLine = props.editorProps.startLine;
        this.startColumn = props.editorProps.startColumn;
        this.endLine = props.editorProps.endLine;
        this.endColumn = props.editorProps.endColumn;
        this.languageClient = props.editorProps.langClient;
    }

    public render() {
        return (<DiagramGenerator diagramLangClient={this.languageClient} filePath={this.filePath}
            startLine={this.startLine.toString()} startCharacter={this.startColumn.toString()}
            endLine={this.endLine.toString()} endCharacter={this.endColumn.toString()} />);
        // return (<DiagramGenerator diagramLangClient={this.languageClient} filePath={this.filePath} />);
        /// return (<div>
        //     <h1>Hello Diagram</h1>
        //     <h2>languageClient: </h2>
        //     <p>{this.languageClient}</p>
        //     <h2>filePath: </h2>
        //     <p>{this.filePath}</p>
        //     <h2>startLine: </h2>
        //     <p>{this.startLine}</p>
        //     <h2>startColumn: </h2>
        //     <p>{this.startColumn}</p>
        //     <h2>endLine: </h2>
        //     <p>{this.endLine}</p>
        //     <h2>endColumn: </h2>
        //     <p>{this.endColumn}</p>
        // </div>);
    }
}
