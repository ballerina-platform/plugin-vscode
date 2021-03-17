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

import assert = require('assert');
// import { expect } from 'chai';
import * as path from 'path';
import { ExtendedLangClient } from "../../src/core/extended-language-client";
import { getServerOptions } from "../../src/server/server";
import { getBallerinaCmd } from "../test-util";
import { commands, Uri } from "vscode";

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..', 'test', 'data');

suite("Language Server Tests", function () {
    this.timeout(10000);
    let langClient: ExtendedLangClient;

    suiteSetup((done: MochaDone): any => {
        langClient = new ExtendedLangClient(
            'ballerina-vscode',
            'Ballerina LS Client',
            getServerOptions(getBallerinaCmd()),
            { documentSelector: [{ scheme: 'file', language: 'ballerina' }] },
            false
        );
        langClient.start();
        done();
    });


    test("Test Language Server Start", function (done): void {
        langClient.onReady().then(() => {
            done();
        }, () => {
            done(new Error("Language Server start failed"));
        }).catch((err) => {
            done(new Error("Language Server start failed"));
        });
    });

    // test("Test getSyntaxTree", function (done): void {
    //     const uri = Uri.file(path.join(getBBEPath(), 'hello_world.bal').toString());
    //     commands.executeCommand('vscode.open', uri).then(() => {
    //         langClient.onReady().then(() => {
    //             langClient.getSyntaxTree(uri).then((response) => {
    //                 expect(response).to.contain.keys('syntaxTree', 'parseSuccess');
    //                 done();
    //             }, (reason) => {
    //                 done(reason);
    //             });
    //         });
    //     });
    // });

    test("Test getBallerinaProject - Ballerina project", (done) => {
        const projectPath = path.join(PROJECT_ROOT, 'helloPackage');
        const uri = Uri.file(path.join(projectPath, 'main.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const projectPath = path.join(PROJECT_ROOT, 'helloPackage');
                const documentIdentifier = {
                    documentIdentifier: {
                        uri: uri.toString()
                    }
                };
                langClient.getBallerinaProject(documentIdentifier).then((response) => {
                    assert.equal(response.packageName, 'helloproject', "Invalid package name.");
                    assert.equal(response.path, projectPath, 'Invalid project path');
                    assert.equal(response.kind, 'BUILD_PROJECT', 'Invalid project kind.');
                    done();
                }, (reason) => {
                    done(reason);
                });
            });
        });
    });

    test("Test getBallerinaProject - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'hello_world.bal'));
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const documentIdentifier = {
                    documentIdentifier: {
                        uri: uri.toString()
                    }
                };
                langClient.getBallerinaProject(documentIdentifier).then((response) => {
                    assert.equal(response.kind, 'SINGLE_FILE_PROJECT', 'Invalid project kind.');
                    done();
                }, (reason) => {
                    done(reason);
                });
            });
        });
    });

    test("Test fetchExamples", (done) => {
        langClient.onReady().then(() => {
            langClient.fetchExamples().then((response) => {
                assert.notEqual(response.samples.length, 0, 'No samples listed');
                done();
            }, (reason) => {
                done(reason);
            });
        });
    });

    test("Test Folding Range - Ballerina project", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'helloPackage', 'modules', 'hello', 'hello_service.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const foldingRangeParam = {
                    textDocument: {
                        uri: uri.toString()
                    }
                };
                langClient.sendRequest('textDocument/foldingRange', foldingRangeParam).then((response: any) => {
                    assert.equal(response.length, 4, 'Invalid folding start position.');
                    assert.equal(response[0].startLine, 4, 'Invalid folding start position - 4.');
                    assert.equal(response[0].endLine, 12, 'Invalid folding end position - 12.');
                    assert.equal(response[0].kind, 'region', 'Invalid folding kind - 0th.');
                    assert.equal(response[1].startLine, 8, 'Invalid folding start position - 8.');
                    assert.equal(response[1].endLine, 11, 'Invalid folding end position - 11.');
                    assert.equal(response[1].kind, 'region', 'Invalid folding kind - 1st.');
                    assert.equal(response[2].startLine, 15, 'Invalid folding start position - 15.');
                    assert.equal(response[2].endLine, 17, 'Invalid folding end position - 17.');
                    assert.equal(response[2].kind, 'region', 'Invalid folding kind - 2nd.');
                    assert.equal(response[3].startLine, 0, 'Invalid folding start position - 0.');
                    assert.equal(response[3].endLine, 1, 'Invalid folding end position - 1.');
                    assert.equal(response[3].kind, 'region', 'Invalid folding kind - 3rd.');
                    done();
                });
            });
        });
    });

    test("Test Folding Range - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'hello_world.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const foldingRangeParam = {
                    textDocument: {
                        uri: uri.toString()
                    }
                };
                langClient.sendRequest('textDocument/foldingRange', foldingRangeParam).then((response: any) => {
                    assert.equal(response.length, 3, 'Invalid folding start position.');
                    assert.equal(response[0].startLine, 3, 'Invalid folding start position - 3.');
                    assert.equal(response[0].endLine, 4, 'Invalid folding end position - 4.');
                    assert.equal(response[0].kind, 'region', 'Invalid folding kind - 0th.');
                    assert.equal(response[1].startLine, 7, 'Invalid folding start position - 7.');
                    assert.equal(response[1].endLine, 9, 'Invalid folding end position - 9.');
                    assert.equal(response[1].kind, 'comment', 'Invalid folding kind - 1st.');
                    assert.equal(response[2].startLine, 10, 'Invalid folding start position - 10.');
                    assert.equal(response[2].endLine, 11, 'Invalid folding end position - 11.');
                    assert.equal(response[2].kind, 'region', 'Invalid folding kind - 2nd.');
                    done();
                });
            });
        });
    });

    test("Test Goto Defition - Ballerina project", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'helloPackage', 'main.bal'));
        langClient.onReady().then(() => {
            const definitionParam = {
                textDocument: {
                    uri: uri.toString()
                }, position: {
                    line: 5,
                    character: 33
                }
            };
            langClient.sendRequest('textDocument/definition', definitionParam).then((response: any) => {
                const gotoDefFilePath = Uri.file(path.join(PROJECT_ROOT, 'helloPackage', 'modules', 'hello',
                    'hello_service.bal').toString());
                assert.equal(response[0].uri, gotoDefFilePath, 'Invalid goto definitopn file uri.');
                assert.equal(response[0].range.start.line, 15, 'Invalid goto def start line.');
                assert.equal(response[0].range.start.character, 16, 'Invalid goto def start character.');
                assert.equal(response[0].range.end.line, 15, 'Invalid goto def end line.');
                assert.equal(response[0].range.end.character, 26, 'Invalid goto def start character.');
                done();
            });
        });
    });

    test("Test Goto Defition - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'hello_world.bal'));
        langClient.onReady().then(() => {
            const definitionParam = {
                textDocument: {
                    uri: uri.toString()
                }, position: {
                    line: 4,
                    character: 20
                }
            };
            langClient.sendRequest('textDocument/definition', definitionParam).then((response: any) => {
                assert.equal(response[0].uri, uri, 'Invalid goto definitopn file uri.');
                assert.equal(response[0].range.start.line, 10, 'Invalid goto def start line.');
                assert.equal(response[0].range.start.character, 16, 'Invalid goto def start character.');
                assert.equal(response[0].range.end.line, 10, 'Invalid goto def end line.');
                assert.equal(response[0].range.end.character, 26, 'Invalid goto def start character.');
                done();
            });
        });
    });

    test("Test Hover - Ballerina project", (done) => {
        langClient.onReady().then(() => {
            const hoverParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'helloPackage', 'main.bal')).toString()
                },
                position: {
                    line: 6,
                    character: 10
                }
            };
            langClient.sendRequest('textDocument/hover', hoverParam).then((response: any) => {
                assert.equal(response.contents.kind, 'markdown', 'Invalid content kind.');
                assert.equal(response.contents.value.includes('Prints'), true, 'Invalid hover value.');
                done();
            });
        });
    });

    test("Test Hover - Single file", (done) => {
        langClient.onReady().then(() => {
            const hoverParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'hello_world.bal')).toString()
                },
                position: {
                    line: 10,
                    character: 20
                }
            };
            langClient.sendRequest('textDocument/hover', hoverParam).then((response: any) => {
                assert.equal(response.contents.kind, 'markdown', 'Invalid content kind.');
                assert.equal(response.contents.value.includes('Returns a message'), true, 'Invalid hover value.');
                done();
            });
        });
    });

    test("Test Code Action - Ballerina project", (done) => {
        langClient.onReady().then(() => {
            const actionParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'helloPackage', 'main.bal')).toString()
                },
                range: {
                    start: {
                        line: 4,
                        character: 10
                    },
                    end: {
                        line: 4,
                        character: 11
                    }
                },
                context: {
                    diagnostics: []
                }
            };
            langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                assert.equal(response.length, 2, 'Invalid number of code actions.');
                assert.equal(response[0].command.title, 'Document this', 'Invalid \'Document this\' action.');
                assert.equal(response[1].command.title, 'Document all', 'Invalid \'Document all\' action.');
                done();
            });
        });
    });

    test("Test Code Action - Single file", (done) => {
        langClient.onReady().then(() => {
            const actionParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'hello_world.bal')).toString()
                },
                range: {
                    start: {
                        line: 10,
                        character: 20
                    },
                    end: {
                        line: 10,
                        character: 22
                    }
                },
                context: {
                    diagnostics: []
                }
            };
            langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                assert.equal(response.length, 2, 'Invalid number of code actions.');
                assert.equal(response[0].command.title, 'Document this', 'Invalid \'Document this\' action.');
                assert.equal(response[1].command.title, 'Document all', 'Invalid \'Document all\' action.');
                done();
            });
        });
    });

    test("Test No Code Action - Single file (source)", (done) => {
        langClient.onReady().then(() => {
            const actionParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                },
                range: {
                    start: {
                        line: 7,
                        character: 11
                    },
                    end: {
                        line: 7,
                        character: 13
                    }
                },
                context: {
                    diagnostics: []
                }
            };
            langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                assert.equal(response.length, 0, 'Invalid number of code actions.');
                done();
            });
        });
    });

    test("Test No Code Action - Single file (comment)", (done) => {
        langClient.onReady().then(() => {
            const actionParam = {
                textDocument: {
                    uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                },
                range: {
                    start: {
                        line: 22,
                        character: 16
                    },
                    end: {
                        line: 22,
                        character: 17
                    }
                },
                context: {
                    diagnostics: []
                }
            };
            langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                assert.equal(response.length, 0, 'Invalid number of code actions.');
                done();
            });
        });
    });

    test("Test Folding Range - Different Ballerina components", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const foldingRangeParam = {
                    textDocument: {
                        uri: uri.toString()
                    }
                };
                langClient.sendRequest('textDocument/foldingRange', foldingRangeParam).then((response: any) => {
                    assert.equal(response.length, 33, 'Invalid folding start position.');
                    assert.equal(response[0].startLine, 5, 'Invalid folding start position - 5. (function)');
                    assert.equal(response[0].endLine, 7, 'Invalid folding end position - 6. (function)');
                    assert.equal(response[0].kind, 'region', 'Invalid folding kind - 0th. (function)');
                    assert.equal(response[1].startLine, 10, 'Invalid folding start position - 9. (function comment)');
                    assert.equal(response[1].endLine, 11, 'Invalid folding end position - 10. (function comment)');
                    assert.equal(response[1].kind, 'comment', 'Invalid folding kind - 1st. (function comment)');
                    assert.equal(response[2].startLine, 12, 'Invalid folding start position - 11. (function)');
                    assert.equal(response[2].endLine, 17, 'Invalid folding end position - 17. (function)');
                    assert.equal(response[2].kind, 'region', 'Invalid folding kind - 2nd. (function)');
                    assert.equal(response[3].startLine, 25, 'Invalid folding start position - 25. (class)');
                    assert.equal(response[3].endLine, 52, 'Invalid folding end position - 52. (class)');
                    assert.equal(response[3].kind, 'region', 'Invalid folding kind - 3rd. (class)');
                    assert.equal(response[4].startLine, 20, 'Invalid folding start position - 20. (class comment)');
                    assert.equal(response[4].endLine, 24, 'Invalid folding end position - 24. (class comment)');
                    assert.equal(response[4].kind, 'comment', 'Invalid folding kind - 4th. (class comment)');
                    assert.equal(response[5].startLine, 30, 'Invalid folding start position - 30. (inner function comment)');
                    assert.equal(response[5].endLine, 34, 'Invalid folding end position - 34. (inner function comment)');
                    assert.equal(response[5].kind, 'comment', 'Invalid folding kind - 5th. (inner function comment)');
                    assert.equal(response[6].startLine, 35, 'Invalid folding start position - 35. (inner function)');
                    assert.equal(response[6].endLine, 38, 'Invalid folding end position - 38. (inner function)');
                    assert.equal(response[6].kind, 'region', 'Invalid folding kind - 6th. (inner function)');
                    assert.equal(response[7].startLine, 41, 'Invalid folding start position - 41. (inner function comment)');
                    assert.equal(response[7].endLine, 43, 'Invalid folding end position - 43. (inner function comment)');
                    assert.equal(response[7].kind, 'comment', 'Invalid folding kind - 7th. (inner function comment)');
                    assert.equal(response[8].startLine, 44, 'Invalid folding start position - 44. (inner function)');
                    assert.equal(response[8].endLine, 45, 'Invalid folding end position - 45. (inner function)');
                    assert.equal(response[8].kind, 'region', 'Invalid folding kind - 8th. (inner function)');
                    assert.equal(response[9].startLine, 48, 'Invalid folding start position - 48. (inner function)');
                    assert.equal(response[9].endLine, 51, 'Invalid folding end position - 51. (inner function)');
                    assert.equal(response[9].kind, 'region', 'Invalid folding kind - 9th. (inner function)');
                    assert.equal(response[10].startLine, 49, 'Invalid folding start position - 49. (if clause)');
                    assert.equal(response[10].endLine, 50, 'Invalid folding end position - 50. (if clause)');
                    assert.equal(response[10].kind, 'region', 'Invalid folding kind - 10th. (if clause)');
                    assert.equal(response[11].startLine, 55, 'Invalid folding start position - 55. (record)');
                    assert.equal(response[11].endLine, 58, 'Invalid folding end position - 58. (record)');
                    assert.equal(response[11].kind, 'region', 'Invalid folding kind - 11th. (record)');
                    assert.equal(response[12].startLine, 61, 'Invalid folding start position - 61. (record comment)');
                    assert.equal(response[12].endLine, 62, 'Invalid folding end position - 62. (record comment)');
                    assert.equal(response[12].kind, 'comment', 'Invalid folding kind - 12th. (record comment)');
                    assert.equal(response[13].startLine, 63, 'Invalid folding start position - 63. (closed record)');
                    assert.equal(response[13].endLine, 65, 'Invalid folding end position - 65. (closed record)');
                    assert.equal(response[13].kind, 'region', 'Invalid folding kind - 13th. (closed record)');
                    assert.equal(response[14].startLine, 68, 'Invalid folding start position - 68. (object comment)');
                    assert.equal(response[14].endLine, 71, 'Invalid folding end position - 71. (object comment)');
                    assert.equal(response[14].kind, 'comment', 'Invalid folding kind - 14th. (object comment)');
                    assert.equal(response[15].startLine, 72, 'Invalid folding start position - 72. (object)');
                    assert.equal(response[15].endLine, 84, 'Invalid folding end position - 84. (object)');
                    assert.equal(response[15].kind, 'region', 'Invalid folding kind - 15th. (object)');
                    assert.equal(response[16].startLine, 78, 'Invalid folding start position - 78. (method declaration)');
                    assert.equal(response[16].endLine, 78, 'Invalid folding end position - 78. (method declaration)');
                    assert.equal(response[16].kind, 'region', 'Invalid folding kind - 16th. (method declaration)');
                    assert.equal(response[17].startLine, 84, 'Invalid folding start position - 84. (method declaration)');
                    assert.equal(response[17].endLine, 84, 'Invalid folding end position - 84. (method declaration)');
                    assert.equal(response[17].kind, 'region', 'Invalid folding kind - 17th. (method declaration)');
                    assert.equal(response[18].startLine, 80, 'Invalid folding start position - 80. (method declaration comment)');
                    assert.equal(response[18].endLine, 83, 'Invalid folding end position - 83. (method declaration comment)');
                    assert.equal(response[18].kind, 'comment', 'Invalid folding kind - 18th. (method declaration comment)');
                    assert.equal(response[19].startLine, 89, 'Invalid folding start position - 89. (service)');
                    assert.equal(response[19].endLine, 146, 'Invalid folding end position - 146. (service)');
                    assert.equal(response[19].kind, 'region', 'Invalid folding kind - 19th. (service)');
                    assert.equal(response[20].startLine, 87, 'Invalid folding start position - 87. (service comment)');
                    assert.equal(response[20].endLine, 88, 'Invalid folding end position - 88. (service comment)');
                    assert.equal(response[20].kind, 'comment', 'Invalid folding kind - 20th. (service comment)');
                    assert.equal(response[21].startLine, 93, 'Invalid folding start position - 93. (resource)');
                    assert.equal(response[21].endLine, 106, 'Invalid folding end position - 106. (resource)');
                    assert.equal(response[21].kind, 'region', 'Invalid folding kind - 21st. (resource)');
                    assert.equal(response[22].startLine, 97, 'Invalid folding start position - 97. (if-else clause)');
                    assert.equal(response[22].endLine, 101, 'Invalid folding end position - 101. (if-else clause)');
                    assert.equal(response[22].kind, 'region', 'Invalid folding kind - 22nd. (if-else clause)');
                    assert.equal(response[23].startLine, 104, 'Invalid folding start position - 104. (if clause)');
                    assert.equal(response[23].endLine, 105, 'Invalid folding end position - 105. (if clause)');
                    assert.equal(response[23].kind, 'region', 'Invalid folding kind - 23rd. (if clause)');
                    assert.equal(response[24].startLine, 109, 'Invalid folding start position - 109. (resource comment)');
                    assert.equal(response[24].endLine, 114, 'Invalid folding end position - 114. (resource comment)');
                    assert.equal(response[24].kind, 'comment', 'Invalid folding kind - 24th. (resource comment)');
                    assert.equal(response[25].startLine, 115, 'Invalid folding start position - 115. (resource)');
                    assert.equal(response[25].endLine, 124, 'Invalid folding end position - 124. (resource)');
                    assert.equal(response[25].kind, 'region', 'Invalid folding kind - 25th. (resource)');
                    assert.equal(response[26].startLine, 122, 'Invalid folding start position - 122. (if clause)');
                    assert.equal(response[26].endLine, 123, 'Invalid folding end position - 123. (if clause)');
                    assert.equal(response[26].kind, 'region', 'Invalid folding kind - 26th. (if clause)');
                    assert.equal(response[27].startLine, 129, 'Invalid folding start position - 129. (resource comment)');
                    assert.equal(response[27].endLine, 129, 'Invalid folding end position - 129. (resource comment)');
                    assert.equal(response[27].kind, 'comment', 'Invalid folding kind - 27th. (resource comment)');
                    assert.equal(response[28].startLine, 130, 'Invalid folding start position - 130. (resource)');
                    assert.equal(response[28].endLine, 145, 'Invalid folding end position - 145. (resource)');
                    assert.equal(response[28].kind, 'region', 'Invalid folding kind - 28th. (resource)');
                    assert.equal(response[29].startLine, 143, 'Invalid folding start position - 143. (if clause)');
                    assert.equal(response[29].endLine, 144, 'Invalid folding end position - 144. (if clause)');
                    assert.equal(response[29].kind, 'region', 'Invalid folding kind - 29th. (if clause)');
                    assert.equal(response[30].startLine, 149, 'Invalid folding start position - 143. (function)');
                    assert.equal(response[30].endLine, 155, 'Invalid folding end position - 144. (function)');
                    assert.equal(response[30].kind, 'region', 'Invalid folding kind - 30th. (function)');
                    assert.equal(response[31].startLine, 150, 'Invalid folding start position - 143. (if-else clause)');
                    assert.equal(response[31].endLine, 154, 'Invalid folding end position - 144. (if-else clause)');
                    assert.equal(response[31].kind, 'region', 'Invalid folding kind - 31st. (if-else clause)');
                    assert.equal(response[32].startLine, 0, 'Invalid folding start position - 0. (imports)');
                    assert.equal(response[32].endLine, 3, 'Invalid folding end position - 3. (imports)');
                    assert.equal(response[32].kind, 'region', 'Invalid folding kind - 30th. (imports)');
                    done();
                });
            });
        });
    });

    test("Test Optimize Imports Action - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const actionParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                    },
                    range: {
                        start: {
                            line: 3,
                            character: 3
                        },
                        end: {
                            line: 3,
                            character: 4
                        }
                    },
                    context: {
                        diagnostics: []
                    }
                };
                langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                    assert.equal(response.length, 1, 'Invalid number of code actions.');
                    assert.equal(response[0].title, 'Optimize all imports', 'Invalid \'Optimize all imports\' action.');
                    assert.equal(response[0].kind, "quickfix", "Invalid code action kind.");
                    done();
                });
            });
        });
    });

    test("Test Incompatible Params Action - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const actionParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                    },
                    range: {
                        start: {
                            line: 15,
                            character: 24
                        },
                        end: {
                            line: 15,
                            character: 24
                        }
                    },
                    context: {
                        diagnostics: []
                    }
                };

                langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                    assert.equal(response.length, 2, 'Invalid number of code actions.');
                    assert.equal(response[0].title, "Change variable 'piValue' type to 'string'", 'Invalid variable change command.');
                    assert.equal(response[0].kind, "quickfix", "Invalid code action kind - 0th.");
                    assert.equal(response[1].title, "Add type cast to assignment", 'Invalid type cast action.');
                    assert.equal(response[1].kind, "quickfix", "Invalid code action kind - 1st.");
                    done();
                });
            });
        });
    });

    test("Test Create Variable Action - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const actionParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                    },
                    range: {
                        start: {
                            line: 16,
                            character: 6
                        },
                        end: {
                            line: 16,
                            character: 7
                        }
                    },
                    context: {
                        diagnostics: []
                    }
                };

                langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                    assert.equal(response.length, 2, 'Invalid number of code actions.');
                    assert.equal(response[0].title, 'Create variable', 'Invalid create variable action.');
                    assert.equal(response[0].kind, "quickfix", "Invalid code action kind - 0th.");
                    assert.equal(response[1].title, 'Ignore return value', 'Invalid ignore return value action.');
                    assert.equal(response[1].kind, "quickfix", "Invalid code action kind - 1st.");
                    done();
                });
            });
        });
    });

    test("Test Create Variable With Unions Action - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const actionParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                    },
                    range: {
                        start: {
                            line: 7,
                            character: 10
                        },
                        end: {
                            line: 7,
                            character: 11
                        }
                    },
                    context: {
                        diagnostics: []
                    }
                };

                langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                    assert.equal(response.length, 3, "Invalid number of code actions.");
                    assert.equal(response[0].title, "Create variable and type guard", "Invalid create variable and type guard action.");
                    assert.equal(response[0].kind, "quickfix", "Invalid code action kind - 0th.");
                    assert.equal(response[1].title, "Create variable and check error", "Invalid create variable and check error action.");
                    assert.equal(response[1].kind, "quickfix", "Invalid code action kind - 1st.");
                    assert.equal(response[2].title, "Create variable", "Invalid create variable action.");
                    assert.equal(response[2].kind, "quickfix", "Invalid code action kind - 2nd.");
                    done();
                });
            });
        });
    });

    test("Test CodeLens - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample1.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const lensParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample1.bal')).toString()
                    }
                };

                langClient.sendRequest('textDocument/codeLens', lensParam).then((response: any) => {
                    assert.equal(response.length, 1, 'Invalid number of code actions.');
                    assert.equal(response[0].command.title, 'Document this', 'Invalid code lens title.');
                    assert.equal(response[0].range.start.line, 55, "Invalid start line.");
                    assert.equal(response[0].range.end.line, 59, 'Invalid end line.');
                    done();
                });
            });
        });
    });

    test("Test Update Document Action - Single file", (done) => {
        const uri = Uri.file(path.join(PROJECT_ROOT, 'sample2.bal').toString());
        commands.executeCommand('vscode.open', uri).then(() => {
            langClient.onReady().then(() => {
                const actionParam = {
                    textDocument: {
                        uri: Uri.file(path.join(PROJECT_ROOT, 'sample2.bal')).toString()
                    },
                    range: {
                        start: {
                            line: 7,
                            character: 6
                        },
                        end: {
                            line: 7,
                            character: 6
                        }
                    },
                    context: {
                        diagnostics: []
                    }
                };

                langClient.sendRequest('textDocument/codeAction', actionParam).then((response: any) => {
                    assert.equal(response.length, 1, 'Invalid number of code actions.');
                    assert.equal(response[0].title, 'Update documentation', 'Invalid update documentation action.');
                    assert.equal(response[0].kind, "quickfix", "Invalid code action kind - 0th.");
                    done();
                });
            });
        });
    });

    test("Test Language Server Stop", (done) => {
        langClient.stop().then(() => {
            done();
        }, () => {
            done(new Error("Language Server stop failed"));
        });
    });
});

