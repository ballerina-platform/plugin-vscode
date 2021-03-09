import { createElement } from "react";
import { render } from "react-dom";
import { Diagram } from "./Diagram";
import { SamplesList } from "./ExampleList";
import { BallerinaExampleCategory } from "./model";

export function renderSamplesList(target: HTMLElement,
                                  openSample: (url: string) => void,
                                  getSamples: () => Promise<BallerinaExampleCategory[]>,
                                  openLink: (url: string) => void) {
    const props = {
        getSamples,
        openLink,
        openSample,
    };
    target.classList.add("composer");
    const SamplesListElement = createElement(SamplesList, props);
    render(SamplesListElement, target);
}

export function renderDiagramEditor(options: {
    target: HTMLElement, editorProps: {
        docUri: string, width: string,
        height: string, zoom: string,
        langClient: any
    }
}) {
    // const props = {
    //     getSamples: (url: string) => void,
    //         openLink: (url: string) => void,
    //     getSamples: () => Promise<BallerinaExampleCategory[]>
    // };
    options.target.classList.add("composer");
    const DiagramElement = createElement(Diagram, options);
    render(DiagramElement, options.target);
}
