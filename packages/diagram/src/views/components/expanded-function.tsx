import { ASTNode, ASTUtil, Function as BallerinaFunction, NodePosition } from "@ballerina/ast-model";
import { BallerinaAST, IBallerinaLangClient } from "@ballerina/lang-service";
import * as React from "react";
import { DiagramConfig } from "../../config/default";
import { DiagramUtils } from "../../diagram/diagram-utils";
import { DiagramContext } from "../../diagram/index";
import { getCodePoint } from "../../utils";
import { BlockViewState } from "../../view-model/block";
import { ExpandContext } from "../../view-model/expand-context";
import { StmntViewState } from "../../view-model/index";
import { visitor as initVisitor } from "../../visitors/init-visitor";
import { Block } from "./block";

const config: DiagramConfig = DiagramUtils.getConfig();

interface ExpandedFunctionProps {
    model: BallerinaFunction;
    docUri: string;
    bBox: any;
    onClose: () => void;
}

export const ExpandedFunction: React.SFC<ExpandedFunctionProps> = ({ model, docUri, bBox, onClose }) => {
    if (!model.body) {
        return null;
    }

    const expandedFnViewState = model.body.viewState as BlockViewState;
    const expandedFnBbox = expandedFnViewState.bBox;

    return (
        <DiagramContext.Consumer>
            {(context) => {
                if (!model.body) {
                    return null;
                }

                const onClickClose = () => {
                    onClose();
                    context.update();
                };

                return (
                    <g>
                        <rect className="expanded-func-frame"
                            x={expandedFnBbox.x - expandedFnBbox.leftMargin - config.statement.expanded.margin}
                            y={bBox.y}
                            width={expandedFnBbox.w + expandedFnBbox.leftMargin + config.statement.expanded.margin}
                            height={bBox.h - config.statement.expanded.footer}/>
                        <text
                            x={bBox.statement.x}
                            y={bBox.statement.y + (config.statement.height / 2)}>
                            {bBox.statement.text}
                        </text>
                        <text
                            x={bBox.statement.x + bBox.statement.textWidth + 2}
                            y={bBox.statement.y + (config.statement.height / 2)}
                            onClick={onClickClose}>
                            {getCodePoint("up")}
                        </text>
                        <g className="life-line">
                            <line x1={bBox.x - config.statement.expanded.offset}
                                x2={bBox.x}
                                y1={bBox.y + config.statement.expanded.header}
                                y2={bBox.y + config.statement.expanded.header} />
                            <line x1={bBox.x} x2={bBox.x}
                                y1={bBox.y + config.statement.expanded.header}
                                y2={bBox.y + bBox.h - config.statement.expanded.footer
                                        - config.statement.expanded.bottomMargin } />
                        </g>
                        { /* Override the docUri context value */ }
                        <DiagramContext.Provider value={{ ...context, docUri }}>
                            <Block model={model.body} />
                        </DiagramContext.Provider>
                    </g>
                );
            }}
        </DiagramContext.Consumer>
    );
};

interface FunctionExpanderProps {
    statementViewState: StmntViewState;
    position: NodePosition;
    expandContext: ExpandContext;
}

export const FunctionExpander: React.SFC<FunctionExpanderProps> = ({ statementViewState, position, expandContext }) => {

    const x = statementViewState.bBox.x + statementViewState.bBox.labelWidth + 10;
    const y = statementViewState.bBox.y + (statementViewState.bBox.h / 2) + 2;
    return (
        <DiagramContext.Consumer>
            {({ langClient, docUri, update }) => (
                <text x={x} y={y}
                    className="expander"
                    // style={{visibility: statementViewState.hovered ? "visible" : "hidden"}}
                    onClick={getExpandFunctionHandler(
                        langClient, docUri, position, expandContext, statementViewState, update)}>
                    {getCodePoint("down")}
                </text>
            )}
        </DiagramContext.Consumer>
    );
};

function getExpandFunctionHandler(
    langClient: IBallerinaLangClient | undefined, docUri: string | undefined,
    position: NodePosition, expandContext: ExpandContext, statementViewState: StmntViewState, update: () => void) {

    return async (e: React.MouseEvent<SVGTextElement>) => {
        if (!langClient || !docUri) {
            return;
        }

        const res = await langClient.getDefinitionPosition({
            position: {
                character: position.startColumn,
                line: position.startLine - 1,
            },
            textDocument: {
                uri: docUri,
            },
        });

        const astRes = await langClient.getAST({
            documentIdentifier: {
                uri: res.uri
            }
        });

        const subTree = findDefinitionSubTree({
            endColumn: res.range.end.character + 1,
            endLine: res.range.end.line + 1,
            startColumn: res.range.start.character + 1,
            startLine: res.range.start.line + 1,
        }, astRes.ast);

        const defTree = subTree as BallerinaFunction;
        ASTUtil.traversNode(defTree, initVisitor);

        expandContext.expandedSubTree = defTree;
        expandContext.expandedSubTreeDocUri = res.uri;
        update();
    };
}

function findDefinitionSubTree(position: NodePosition, ast: BallerinaAST) {
    return ast.topLevelNodes.find((balNode) => {
        const node = balNode as ASTNode;
        if (!node.position) {
            return false;
        }

        if (node.position.startColumn === position.startColumn &&
            node.position.endColumn === position.endColumn &&
            node.position.startLine === position.startLine &&
            node.position.endLine === position.endLine) {

            return true;
        }

        return false;
    });
}
