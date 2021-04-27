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
import { DiagramEditorLangClientInterface } from "@wso2-enterprise/low-code-editor";
import { createElement } from "react";
import { render } from "react-dom";
import { Diagram } from "./Diagram";

export function renderDiagramEditor(options: {
    target: HTMLElement, editorProps: {
        langClient: DiagramEditorLangClientInterface,
        filePath: string,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number
    }
}) {
    options.target.classList.add("composer");
    const DiagramElement = createElement(Diagram, options);
    render(DiagramElement, options.target);
}
