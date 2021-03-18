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
 */
import * as React from "react";
import { Input } from "semantic-ui-react";
import { BallerinaExampleCategory } from "./model";
// tslint:disable-next-line:ordered-imports
import DiagramGenerator from "@drifftr/ballerina-low-code-editor";

// export interface SamplesListState {
//     samples?: BallerinaExampleCategory[];
//     searchQuery?: string;
// }

export interface DiagramProps {
    target: HTMLElement;
    editorProps: {
        docUri: string, width: string,
        height: string, zoom: string,
        langClient: any
    };
}

/**
 * React component for rendering a list of Ballerina examples.
 *
 * @class SamplesList
 * @extends {Component}
 */
export class Diagram extends React.Component<DiagramProps> {

    // private availableSamples: undefined | BallerinaExampleCategory[];
    private searchInput: Input | undefined;
    private languageClient: any;
    private filePath: string;

    constructor(props: DiagramProps) {
        super(props);
        this.languageClient = props.editorProps.langClient;
        this.filePath = "/Users/prabushi/Documents/wso2/test/alpha2s/new/examples/examples/hello_world.bal";
    }

    public componentDidMount() {
        this.focusOnSearchInput();
        // this.props.getSamples().then((samples) => {
        //     this.availableSamples = samples;
        //     this.setState({
        //         samples,
        //     });
        // });
    }

    public componentWillReceiveProps() {
        // this.props.getSamples().then((samples) => {
        //     this.availableSamples = samples;
        //     this.setState({
        //         samples,
        //     });
        // });
    }

    public focusOnSearchInput() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    public getColumnContents() {

        const columns: BallerinaExampleCategory[][] = [];
        // const { samples } = this.state;
        // if (samples) {
        //     samples.forEach((sample: BallerinaExampleCategory) => {
        //         columns[sample.column] = columns[sample.column] || [];
        //         columns[sample.column].push(sample);
        //     });
        // }
        return columns;
    }

    public render() {
        return (<DiagramGenerator langClient={this.languageClient} filePath={this.filePath} />);
    }
}
