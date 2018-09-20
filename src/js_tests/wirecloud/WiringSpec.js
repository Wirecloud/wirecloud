/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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
                    missing: (meta === "Wirecloud/TestOperator/0.5"),
                    type: "operator",
                    uri: meta
                };
                this.missing = (meta === "Wirecloud/TestOperator/0.5");
                this.addEventListener = jasmine.createSpy("addEventListener");
                this.fullDisconnect = jasmine.createSpy("fullDisconnect");
                this.load = jasmine.createSpy("load");
                this.remove = jasmine.createSpy("remove");
                this.removeEventListener = jasmine.createSpy("removeEventListener");
                this.inputs = [];
                this.upgrade = jasmine.createSpy("upgrade");
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
                expect(wiring.errorCount).toBe(0);
            });

            it("should cache operatorsById", function () {
                var workspace = createWorkspaceMock();

                var wiring = new Wirecloud.Wiring(workspace, {});

                let operatorsById = wiring.operatorsById;
                expect(wiring.operatorsById).toBe(operatorsById);
            });

            it("loads simple wiring configurations", function () {

                var workspace = createWorkspaceMock();
                let widget = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                workspace.widgets.push(widget);

                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    }
                });

                expect(widget.addEventListener).toHaveBeenCalled();
                expect(wiring.errorCount).toBe(0);
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

                expect(wiring.errorCount).toBe(0);
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

                expect(wiring.errorCount).toBe(0);
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

            it("loads wiring configurations with connections and missing components", function () {

                var workspace = createWorkspaceMock();
                let widget = createWidgetMock("2");
                widget.missing = true;
                workspace.widgets = [widget];
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/0.5"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "missingoutput", type: "operator", id: "1"},
                            target: {endpoint: "missinginput", type: "widget", id: "2"}
                        }
                    ]
                });

                // Wiring should report 1 error for the connection.
                // Error for the missing components are reported by them on load
                expect(wiring.errorCount).toBe(1);
                expect(wiring.status).toEqual({
                    version: '2.0',
                    connections: [
                        jasmine.any(Wirecloud.wiring.Connection)
                    ],
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

                // Wiring should report 1 error
                expect(wiring.errorCount).toBe(1);
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
                // ignored as it cannot be recovered
                expect(wiring.errorCount).toBe(0);
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
                // ignored as it cannot be recovered
                expect(wiring.errorCount).toBe(0);
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

            it("loads wiring configurations with totally broken connections", () => {

                var workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {},
                            target: {endpoint: "input", type: "widget", id: "3"}
                        }
                    ]
                });

                // The connection referring to the missing widget should be
                // ignored as it cannot be recovered
                expect(wiring.errorCount).toBe(0);
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

        describe("_notifyOperatorInstall(component)", () => {

            it("should upgrade missing operators", () => {
                let workspace = createWorkspaceMock();
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/0.5"},
                        "2": {id: "2", name: "Wirecloud/OtherOperator/0.5"}
                    },
                    connections: []
                });
                let new_meta = {uri: "Wirecloud/TestOperator/0.5"};

                wiring._notifyOperatorInstall(new_meta);

                expect(wiring.operators[0].upgrade).toHaveBeenCalledWith(new_meta);
                expect(wiring.operators[1].upgrade).not.toHaveBeenCalled();
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
                expect(wiring.operators).toEqual([]);
                expect(wiring.operatorsById).toEqual({});

                var operator1 = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});
                var operator2 = wiring.createOperator("Wirecloud/TestOperator/1.0", {volatile: true});

                expect(operator1.id).not.toEqual(operator2.id);
                expect(wiring.operatorsById).toEqual({
                    "1": operator1,
                    "2": operator2
                });
                expect(wiring.operators).toEqual([operator1, operator2]);
            });

            it("returns Task instances when creating operators", function (done) {
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                var task = wiring.createOperator("Wirecloud/TestOperator/1.0");

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (operator) {
                    expect(operator).toEqual(jasmine.any(Wirecloud.wiring.Operator));
                    expect(wiring.operatorsById).toEqual({
                        "1": operator
                    });
                    expect(wiring.operators).toEqual([operator]);
                    done();
                });
            });

            it("handles unexpected responses", (done) => {

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PATCH");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                var task = wiring.createOperator("Wirecloud/TestOperator/1.0");

                task.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handles error responses", (done) => {

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PATCH");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 403
                        });
                    });
                });

                var task = wiring.createOperator("Wirecloud/TestOperator/1.0");

                task.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });
        });

        describe("findOperator(id)", function () {

            var wiring;

            beforeEach(function () {
                var workspace = createWorkspaceMock();
                wiring = new Wirecloud.Wiring(workspace, {operators: {"1": {id: "1", name: "Wirecloud/TestOperator/1.0"}}});
            });

            it("throws a TypeError exception when not passing any id", () => {
                expect(() => {
                    wiring.findOperator();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing null as id", () => {
                expect(() => {
                    wiring.findOperator(null);
                }).toThrowError(TypeError);
            });

            it("returns operators instances", function () {
                expect(wiring.findOperator("1")).toEqual(jasmine.any(Wirecloud.wiring.Operator));
            });

            it("allows passing numbers on the id parameter", function () {
                expect(wiring.findOperator(1)).toEqual(jasmine.any(Wirecloud.wiring.Operator));
            });

            it("returns null for not found operators", function () {
                expect(wiring.findOperator(200)).toBe(null);
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

            it("should report error status for loaded missing components", function () {

                var workspace = createWorkspaceMock();
                let widget = createWidgetMock("2");
                widget.missing = true;
                workspace.widgets = [widget];
                var wiring = new Wirecloud.Wiring(workspace, {
                    operators: {
                        "1": {id: "1", name: "Wirecloud/TestOperator/0.5"}
                    },
                    connections: [
                        {
                            readonly: false,
                            source: {endpoint: "missingoutput", type: "operator", id: "1"},
                            target: {endpoint: "missinginput", type: "widget", id: "2"}
                        }
                    ]
                });
                expect(wiring.errorCount).toBe(1);

                widget.loaded = wiring.operators[0].loaded = true;
                wiring.load(wiring.status);

                // Wiring should report 3 errors as it is in charge of reporting
                // missing status for the missing components (already loaded)
                expect(wiring.errorCount).toBe(3);

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
                                    targethandle: "auto"
                                },
                                {
                                    sourcename: "operator/1/output",
                                    sourcehandle: "auto",
                                    targetname: "operator/3/input",
                                    targethandle: "auto"
                                },
                                {
                                    sourcename: "operator/3/output",
                                    sourcehandle: "auto",
                                    targetname: "operator/2/input",
                                    targethandle: "auto"
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
                            targethandle: "auto"
                        },
                        {
                            sourcename: "operator/1/output",
                            sourcehandle: "auto",
                            targetname: "operator/3/input",
                            targethandle: "auto"
                        },
                        {
                            sourcename: "operator/3/output",
                            sourcehandle: "auto",
                            targetname: "operator/2/input",
                            targethandle: "auto"
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

        it("should handle duplicate operators removals", function () {
            var workspace = createWorkspaceMock();
            let listener = jasmine.createSpy();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                },
                connections: [],
                visualdescription: {
                    behaviours: [],
                    components: {
                        operator: {},
                        widget: {}
                    },
                    connections: []
                }
            });
            wiring.addEventListener('removeoperator', listener);

            let operator = wiring.operators[0];
            callEventListener(operator, "remove");
            expect(listener).toHaveBeenCalledWith(wiring, operator);
            listener.calls.reset();

            // This second call should not happend, but just in case
            callEventListener(operator, "remove");

            expect(listener).not.toHaveBeenCalled();
        });

        it("should handle widget removals", () => {
            var workspace = createWorkspaceMock();
            let widget2 = createWidgetMock("2");
            let widget3 = createWidgetMock("3");
            workspace.widgets = [widget2, widget3];
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
                },
                connections: [
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "widget", id: "2"}
                    },
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "operator", id: "1"},
                        target: {endpoint: "input", type: "widget", id: "3"}
                    },
                    {
                        readonly: false,
                        source: {endpoint: "output", type: "widget", id: "3"},
                        target: {endpoint: "input", type: "widget", id: "2"}
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
                                    targetname: "widget/2/input",
                                    targethandle: "auto"
                                },
                                {
                                    sourcename: "operator/1/output",
                                    sourcehandle: "auto",
                                    targetname: "widget/3/input",
                                    targethandle: "auto"
                                },
                                {
                                    sourcename: "widget/3/output",
                                    sourcehandle: "auto",
                                    targetname: "widget/2/input",
                                    targethandle: "auto"
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
                            targetname: "widget/2/input",
                            targethandle: "auto"
                        },
                        {
                            sourcename: "operator/1/output",
                            sourcehandle: "auto",
                            targetname: "widget/3/input",
                            targethandle: "auto"
                        },
                        {
                            sourcename: "widget/3/output",
                            sourcehandle: "auto",
                            targetname: "widget/2/input",
                            targethandle: "auto"
                        }
                    ]
                }
            });

            var expected_operators = wiring.operators;
            var expected_connections = [wiring.connections[0]];
            var expected_vconnections = [wiring.visualdescription.connections[0]];
            callEventListener(workspace.widgets[1], "remove");

            expect(wiring.operators).toEqual(expected_operators);
            expect(wiring.connections).toEqual(expected_connections);
            expect(wiring.visualdescription.connections).toEqual(expected_vconnections);
        });

        it("should handle missing widget removals", () => {
            var workspace = createWorkspaceMock();
            let widget = createWidgetMock("2");
            widget.missing = true;
            workspace.widgets = [widget];
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {},
                connections: [],
                visualdescription: {
                    behaviours: [],
                    components: {
                        operator: {},
                        widget: {}
                    },
                    connections: []
                }
            });
            // Simulate error loading widget
            wiring.logManager.log("missing widget");
            expect(wiring.errorCount).toBe(1);

            var expected_operators = wiring.operators;
            var expected_connections = [];
            var expected_vconnections = [];
            callEventListener(widget, "remove");

            expect(wiring.errorCount).toBe(0);
            expect(wiring.operators).toEqual(expected_operators);
            expect(wiring.connections).toEqual(expected_connections);
            expect(wiring.visualdescription.connections).toEqual(expected_vconnections);
        });

        it("should handle upgraded/downgraded operators", function () {
            var workspace = createWorkspaceMock();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "2": {id: "2", name: "Wirecloud/TestOperator/1.0"},
                    "3": {id: "3", name: "Wirecloud/TestOperator/1.0"},
                    "1": {id: "1", name: "Wirecloud/TestOperator/1.0"}
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
            callEventListener(operator, "change", ["meta"], {meta: {missing: false}});

            // TODO improve this test
            var operator = wiring.operators[1];
            callEventListener(operator, "change", ["meta"], {meta: {missing: false}});
        });

        it("should handle upgraded/downgraded missing operators", function () {
            var workspace = createWorkspaceMock();
            var wiring = new Wirecloud.Wiring(workspace, {
                operators: {
                    "1": {id: "1", name: "Wirecloud/TestOperator/0.5"},
                    "2": {id: "2", name: "Wirecloud/TestOperator/0.5"},
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
                    }
                ]
            });
            wiring.connections[0].missing = wiring.connections[1].missing = false;

            // TODO improve this test
            var operator = wiring.operators[0];
            callEventListener(operator, "change", ["meta"], {meta: operator.meta});

            // TODO improve this test
            var operator = wiring.operators[1];
            callEventListener(operator, "change", ["meta"], {meta: operator.meta});
        });

        it("should ignore superfluos superfluous changes in operators", function () {
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

            callEventListener(wiring.operators[0], "change", ["title"], {title: "New title"});
            expect(wiring.operators[0].fullDisconnect).not.toHaveBeenCalled();
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

    var createWidgetMock = function createWidgetMock(id) {
        let widget = {
            id: id,
            meta: {
                type: "widget"
            },
            inputs: {
            },
            outputs: {
            },
            addEventListener: jasmine.createSpy("addEventListener"),
            removeEventListener: jasmine.createSpy("removeEventListener")
        };

        widget.inputs.input = new Wirecloud.wiring.WidgetTargetEndpoint(widget, {name: "input", friendcode: ""});
        widget.outputs.output = new Wirecloud.wiring.WidgetSourceEndpoint(widget, {name: "output", friendcode: ""});
        return widget;
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
