/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    describe("Wiring", function () {

        beforeEach(function () {

            spyOn(Wirecloud.wiring, "Operator").and.callFake(function (wiring, meta, data) {
                this.id = data.id;
                this.meta = {
                    type: "operator",
                    uri: meta
                };
                this.addEventListener = jasmine.createSpy("addEventListener");
                this.fullDisconnect = jasmine.createSpy("fullDisconnect");
                this.load = jasmine.createSpy("load");
                this.remove = jasmine.createSpy("remove");
                this.removeEventListener = jasmine.createSpy("removeEventListener");
                this.inputs = [];
                this.is = jasmine.createSpy("is").and.callFake(function (other) {
                    return this === other;
                });
                this.outputs = [];
                this.volatile = !!data.volatile;

                if (meta === "Wirecloud/TestOperator/1.0") {
                    this.inputs.input = new Wirecloud.wiring.OperatorTargetEndpoint(this, {name: "input", friendcode: ""});
                    this.outputs.output = new Wirecloud.wiring.OperatorSourceEndpoint(this, {name: "output", friendcode: ""});
                }
            });
        });

        describe("new Wiring(workspace, data)", function () {

            it("throws a TypeError if workspace is not a workspace", function () {
                expect(function () {
                    new Wirecloud.Wiring();
                }).toThrowError(TypeError);
            });

            it("loads an empty wiring configuration", function () {
                var workspace = createWorkspaceMock();

                var wiring = new Wirecloud.Wiring(workspace, {});
                expect(wiring).not.toBe(null);
            });

            it("loads simple wiring configurations", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    }
                });

                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("loads wiring configurations", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    }
                });

                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("loads wiring configurations with connections", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                        "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "output", type: "operator", id: "1"},
                            target: {endpoint: "input", type: "operator", id: "2"}
                        }
                    ]
                });

                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [
                        jasmine.any(Wirecloud.wiring.Connection)
                    ],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator),
                        "2": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("loads wiring configurations with connections and missing endpoints", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                        "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "missingoutput", type: "operator", id: "1"},
                            target: {endpoint: "missinginput", type: "operator", id: "2"}
                        }
                    ]
                });

                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [
                        jasmine.any(Wirecloud.wiring.Connection)
                    ],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator),
                        "2": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("loads wiring configurations with connections referring missing operators", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "output", type: "operator", id: "1"},
                            target: {endpoint: "missinginput", type: "operator", id: "3"}
                        }
                    ]
                });

                // The connection referring to the missing operator should be
                // filtered as it cannot be recovered
                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("loads wiring configurations with connections referring missing widgets", function () {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "output", type: "operator", id: "1"},
                            target: {endpoint: "missinginput", type: "widget", id: "3"}
                        }
                    ]
                });

                // The connection referring to the missing widget should be
                // filtered as it cannot be recovered
                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

        });

        describe("createConnection(source, target, [options])", function () {
            var wiring;

            beforeEach(function () {
                var workspace = createWorkspaceMock();
                wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                        "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: []
                });

            });

            it("returns connection instances", function () {
                var result = wiring.createConnection(
                    wiring.operators[0].outputs.output,
                    wiring.operators[1].inputs.input
                );

                expect(result)
                    .toEqual(jasmine.any(Wirecloud.wiring.Connection));
                expect(wiring.connections).toEqual([]);
            });

            it("append connection instances when using the commit option", function () {
                var result = wiring.createConnection(
                    wiring.operators[0].outputs.output,
                    wiring.operators[1].inputs.input,
                    {commit: true}
                );

                expect(result)
                    .toEqual(jasmine.any(Wirecloud.wiring.Connection));
                expect(wiring.connections).toEqual([result]);
            });

        });

        describe("createOperator(meta[, options])", function () {
            var wiring;

            beforeEach(function () {
                var workspace = createWorkspaceMock();
                wiring = new Wirecloud.Wiring(workspace, {});
            });

            it("returns operators instances when creating volatile operators", function () {
                var result = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});

                expect(result)
                    .toEqual(jasmine.any(Wirecloud.wiring.Operator));
                expect(wiring.operators).toEqual([result]);
            });

            it("provide unique ids when creating volatile operators", function () {
                var operator1 = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});
                var operator2 = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});

                expect(operator1.id).not.toEqual(operator2.id);
                expect(wiring.operators).toEqual([operator1, operator2]);
            });

            it("returns Promise instances when creating operators", function (done) {
                // Currently, this method is used by the Wiring Editor, so the
                // created operator is not added to the wiring status until the
                // wiring Editor calls the load method with the new configuration.
                var p = wiring.createOperator("Wirecloud/TestOperator/1.0");

                expect(p).toEqual(jasmine.any(Promise));
                p.then(function (operator) {
                    expect(operator).toEqual(jasmine.any(Wirecloud.wiring.Operator));
                    expect(wiring.operators).toEqual([]);
                    done();
                });
            });

        });

        describe("findOperator(id)", function () {

            var wiring;

            beforeEach(function () {
                var workspace = createWorkspaceMock();
                wiring = new Wirecloud.Wiring(workspace, {operators: {"1": {id: "1", name: "Wirecloud/TestOperator/1.0"}}});
            });

            it("returns operators instances", function () {
                expect(wiring.findOperator("1")).toEqual(jasmine.any(Wirecloud.wiring.Operator));
            });

            it("returns undefined for not found operators", function () {
                expect(wiring.findOperator(200)).toBe(undefined);
            });

        });

        describe("load(status)", function () {

            var wiring;

            beforeEach(function () {
                var workspace = createWorkspaceMock();
                wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                        "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "output", type: "operator", id: "1"},
                            target: {endpoint: "input", type: "operator", id: "2"}
                        }
                    ]
                });
            });

            it("should replace previous wiring status", function () {
                var operator1 = wiring.operators[0];
                var operator2 = wiring.operators[1];
                var connection1 = wiring.connections[0];
                spyOn(connection1, "detach");

                expect(wiring.load()).toBe(wiring);

                expect(operator1.remove).toHaveBeenCalledWith();
                expect(operator2.remove).toHaveBeenCalledWith();
                expect(connection1.detach).toHaveBeenCalledWith();
                expect(wiring.operators).toEqual([]);
                expect(wiring.connections).toEqual([]);
                expect(wiring.status).toEqual(WIRING_STATUS_SKELETON);
            });

            it("should maintain previous operators", function () {
                var operator1 = wiring.operators[0];
                var operator2 = wiring.operators[1];
                var connection1 = wiring.connections[0];
                spyOn(connection1, "detach");

                expect(wiring.load({operators: {1: operator1}})).toBe(wiring);

                expect(operator1.remove).not.toHaveBeenCalled();
                expect(operator2.remove).toHaveBeenCalledWith();
                expect(connection1.detach).toHaveBeenCalledWith();
                expect(wiring.operators).toEqual([operator1]);
                expect(wiring.connections).toEqual([]);
                expect(wiring.status).toEqual(utils.merge({}, WIRING_STATUS_SKELETON, {operators: {1: operator1}}));
            });

            it("should detach removed connections", function () {
                var operator1 = wiring.operators[0];
                var operator2 = wiring.operators[1];
                var connection1 = wiring.connections[0];
                spyOn(connection1, "detach");
                var newstatus = wiring.status;
                newstatus.connections = [];

                expect(wiring.load(newstatus)).toBe(wiring);

                expect(operator1.remove).not.toHaveBeenCalled();
                expect(operator2.remove).not.toHaveBeenCalled();
                expect(connection1.detach).toHaveBeenCalledWith();
                expect(wiring.operators).toEqual([operator1, operator2]);
                expect(wiring.connections).toEqual([]);
            });

            it("should maintain valid volatile connections", function () {
                var operator1 = wiring.operators[0];
                var operator2 = wiring.operators[1];
                operator2.volatile = true;
                var connection1 = wiring.connections[0];
                spyOn(connection1, "detach");
                var newstatus = wiring.status;
                newstatus.connections = [];

                expect(wiring.load(newstatus)).toBe(wiring);

                expect(operator1.remove).not.toHaveBeenCalledWith();
                expect(operator2.remove).not.toHaveBeenCalledWith();
                expect(connection1.detach).not.toHaveBeenCalledWith();
                expect(wiring.operators).toEqual([operator1, operator2]);
                expect(wiring.connections).toEqual([connection1]);
            });

            it("should remove volatile connections linked to removed operators", function () {
                var operator1 = wiring.operators[0];
                var operator2 = wiring.operators[1];
                operator2.volatile = true;
                var connection1 = wiring.connections[0];
                spyOn(connection1, "detach").and.callThrough();
                operator1.remove = jasmine.createSpy("remove").and.callFake(function () {
                    // Simulate operator2 was created by operator1
                    callEventListener(operator2, "remove");
                    connection1.detach();
                });

                expect(wiring.load()).toBe(wiring);

                expect(operator1.remove).toHaveBeenCalledWith();
                // The remove method be called by operator1, but we call
                // directly to the remove event listener in our operator 1 mock
                // Check that the Wiring class doesn't call it manually
                expect(operator2.remove).not.toHaveBeenCalledWith();
                expect(connection1.detach).toHaveBeenCalledWith();
                expect(wiring.operators).toEqual([]);
                expect(wiring.connections).toEqual([]);
                expect(wiring.status).toEqual(WIRING_STATUS_SKELETON);
            });

        });

        describe("normalize(status)", function () {

            it("returns wiring status skeleton when no passing any parameter", function () {
                expect(Wirecloud.Wiring.normalize()).toEqual(WIRING_STATUS_SKELETON);
            });

            it("empty wiring status", function () {
                expect(Wirecloud.Wiring.normalize({})).toEqual(WIRING_STATUS_SKELETON);
            });

            it("should normalize visualdescription components", function () {
                var result = Wirecloud.Wiring.normalize({
                    visualdescription: {
                        components: {
                            operator: {
                                1: {name: "Wirecloud/TestOperator/1.0"}
                            },
                            widget: {
                                1: {name: "Wirecloud/Test/1.0"}
                            }
                        }
                    }
                });

                expect(result.visualdescription.components.operator[1]).toEqual(utils.merge({}, VISUAL_COMPONENT_SKELETON, {name: "Wirecloud/TestOperator/1.0"}));
                expect(result.visualdescription.components.widget[1]).toEqual(utils.merge({}, VISUAL_COMPONENT_SKELETON, {name: "Wirecloud/Test/1.0"}));
            });

        });

        describe("save()", function () {

            // TODO
            beforeAll(function () {
                Wirecloud.URLs.WIRING_ENTRY = new utils.Template("");
            });

            it("empty wiring status", function (done) {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {});

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    return Promise.resolve({status: 204});
                });
                var result = wiring.save();

                expect(result).toEqual(jasmine.any(Promise));
                expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                result.then(done);
            });

            it("reports unexpected responses", function (done) {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {});

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    return Promise.resolve({status: 404});
                });
                var result = wiring.save();

                expect(result).toEqual(jasmine.any(Promise));
                expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                result.catch(done);
            });

        });

        describe("toJSON()", function () {

            it("empty wiring status", function () {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {});

                expect(wiring.toJSON()).toEqual(WIRING_STATUS_SKELETON);
            });

            it("simple wiring status", function () {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    }
                });

                expect(wiring.toJSON()).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

            it("should ignore volatile operators", function () {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    }
                });
                var volatileoperator = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});

                var result = wiring.toJSON();

                expect(result).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

                expect(result.operators).not.toContain(volatileoperator);
            });

            it("should serialize connections", function () {
                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                        "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "output", type: "operator", id: "1"},
                            target: {endpoint: "input", type: "operator", id: "2"}
                        }
                    ]
                });

                var result = wiring.toJSON();

                expect(result).toEqual({
                    version: '2.0',
                    connections: [
                        jasmine.any(Wirecloud.wiring.Connection)
                    ],
                    operators: {
                        "1": jasmine.any(Wirecloud.wiring.Operator),
                        "2": jasmine.any(Wirecloud.wiring.Operator)
                    },
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                });

            });

        });

        it("should handle removed connections", function () {
            var workspace = createWorkspaceMock();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                    "2": {id: "2", name: "Wirecloud/TestOperator/1.0"}
                },
                connections: [
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "operator", id: "2"}
                    }
                ]
            });

            wiring.connections[0].remove();

            expect(wiring.connections).toEqual([]);
        });

        it("should handle operators removals", function () {
            var workspace = createWorkspaceMock();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                    "2": {id: "2", name: "Wirecloud/TestOperator/1.0"},
                    "3": {id: "3", name: "Wirecloud/TestOperator/1.0"}
                },
                connections: [
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "operator", id: "2"}
                    },
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "operator", id: "3"}
                    },
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "3"},
                        target: {endpoint: "input", type: "operator", id: "2"}
                    }
                ],
                visualdescription: {
                    behaviours: [
                        {
                            title: "behaviour1",
                            description: "behaviour description",
                            components: {
                                operator: {},
                                widget: {}
                            },
                            connections: [
                                {
                                    sourcename: "operator/1/output",
                                    sourcehandle: "auto",
                                    targetname: "operator/2/input",
                                    targethandle:"auto"
                                },
                                {
                                    sourcename: "operator/1/output",
                                    sourcehandle: "auto",
                                    targetname: "operator/3/input",
                                    targethandle:"auto"
                                },
                                {
                                    sourcename: "operator/3/output",
                                    sourcehandle: "auto",
                                    targetname: "operator/2/input",
                                    targethandle:"auto"
                                }
                            ]
                        }
                    ],
                    components: {
                        operator: {},
                        widget: {}
                    },
                    connections: [
                        {
                            sourcename: "operator/1/output",
                            sourcehandle: "auto",
                            targetname: "operator/2/input",
                            targethandle:"auto"
                        },
                        {
                            sourcename: "operator/1/output",
                            sourcehandle: "auto",
                            targetname: "operator/3/input",
                            targethandle:"auto"
                        },
                        {
                            sourcename: "operator/3/output",
                            sourcehandle: "auto",
                            targetname: "operator/2/input",
                            targethandle:"auto"
                        }
                    ]
                }
            });

            var expected_operators = [wiring.operators[0], wiring.operators[1]];
            var expected_connections = [wiring.connections[0]];
            var expected_vconnections = [wiring.visualdescription.connections[0]];
            callEventListener(wiring.operators[2], "remove");

            expect(wiring.operators).toEqual(expected_operators);
            expect(wiring.connections).toEqual(expected_connections);
            expect(wiring.visualdescription.connections).toEqual(expected_vconnections);
        });

        it("should handle upgraded/downgraded operators", function () {
            var workspace = createWorkspaceMock();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"},
                    "2": {id: "2", name: "Wirecloud/TestOperator/1.0"},
                    "3": {id: "3", name: "Wirecloud/TestOperator/1.0"},
                },
                connections: [
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "operator", id: "2"}
                    },
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "operator", id: "3"}
                    }
                ]
            });

            // TODO improve this test
            var operator = wiring.operators[0];
            callEventListener(operator, "change", ["meta"]);

            // TODO improve this test
            var operator = wiring.operators[1];
            callEventListener(operator, "change", ["meta"]);
        });

    });

    var WIRING_STATUS_SKELETON = {
        version: '2.0',
        connections: [],
        operators: {},
        visualdescription: {
            behaviours: [],
            components: {
                operator: {},
                widget: {}
            },
            connections: []
        }
    };

    var VISUAL_COMPONENT_SKELETON = {
        name: "",
        position: {
            x: 0,
            y: 0
        },
        collapsed: false,
        endpoints: {
            source: [],
            target: []
        }
    };

    var createWorkspaceMock = function createWorkspaceMock() {
        var workspace = {
            addEventListener: jasmine.createSpy('addEventListener'),
            findWidget: function (id) {
                for (var i = 0; i < this.widgets.length; i++) {
                    if (this.widgets[i].id === id) {
                        return this.widgets[i];
                    }
                }
            },
            widgets: [],
            resources: {
                getOrCreateMissing: function (uri) {
                    return uri;
                }
            }
        };

        return workspace;
    };

    var callEventListener = function callEventListener(instance, event) {
        var largs = Array.prototype.slice.call(arguments, 2);
        largs.unshift(instance);
        instance.addEventListener.calls.allArgs().some(function (args) {
            if (args[0] === event) {
                args[1].apply(instance, largs);
                return true;
            }
        });
    };

})(StyledElements.Utils);
