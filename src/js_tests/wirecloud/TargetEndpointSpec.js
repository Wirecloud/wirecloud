/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* jshint jasmine:true */
/* globals Wirecloud */


(function (ns) {

    "use strict";

    describe("TargetEndpoint", function () {

        describe("new WidgetTargetEndpoint(widgetModel, [endpointDesc])", function () {
            var widgetModel;

            beforeAll(function () {

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should create a new instance", function () {
                var endpointDesc = {
                    name: "source",
                    description: "description",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(widgetModel);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual([widgetModel.meta.type, widgetModel.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual(endpointDesc.description);
                expect(endpoint.keywords).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no endpointDesc.description", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc);

                expect(endpoint.description).toEqual("No description provided.");
            });

            it("should create a new instance with no endpointDesc", function () {
                var endpoint = new ns.WidgetTargetEndpoint(widgetModel);

                expect(endpoint.component).toBe(widgetModel);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
            });
        });

        describe("new OperatorTargetEndpoint(operatorModel, [endpointDesc])", function () {
            var operatorModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };
            });

            it("should create a new instance", function () {
                var endpointDesc = {
                    name: "source",
                    description: "description",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(operatorModel);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual([operatorModel.meta.type, operatorModel.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual(endpointDesc.description);
                expect(endpoint.keywords).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no description", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc);

                expect(endpoint.description).toEqual("No description provided.");
            });

            it("should create a new instance with no endpointDesc", function () {
                var endpoint = new ns.OperatorTargetEndpoint(operatorModel);

                expect(endpoint.component).toBe(operatorModel);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
            });
        });

        describe("new GhostTargetEndpoint(componentModel, endpointName)", function () {
            var componentModel;

            beforeAll(function () {

                componentModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };
            });

            it("should create a new instance", function () {
                var endpointName = "source";
                var endpoint = new ns.GhostTargetEndpoint(componentModel, endpointName);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(componentModel);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual([componentModel.meta.type, componentModel.id, endpointName].join("/"));
                expect(endpoint.description).toEqual("No description provided");
                expect(endpoint.label).toEqual(endpointName);
                expect(endpoint.missing).toBe(true);
            });
        });

        describe("toString()", function () {
            var operatorModel, widgetModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should convert a missing source endpoint to string", function () {
                var endpointName = "source";
                var endpoint = new ns.GhostTargetEndpoint(widgetModel, endpointName);

                expect(endpoint + "").toEqual([widgetModel.meta.type, widgetModel.id, endpointName].join("/"));
            });

            it("should convert a widget's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc);

                expect(endpoint + "").toEqual([widgetModel.meta.type, widgetModel.id, endpointDesc.name].join("/"));
            });

            it("should convert a operator's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc);

                expect(endpoint + "").toEqual([operatorModel.meta.type, operatorModel.id, endpointDesc.name].join("/"));
            });
        });

        describe("toJSON()", function () {
            var operatorModel, widgetModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should convert a missing source endpoint to string", function () {
                var endpointName = "source";
                var endpointJSON = {
                    id: widgetModel.id,
                    type: widgetModel.meta.type,
                    endpoint: endpointName
                };
                var endpoint = new ns.GhostTargetEndpoint(widgetModel, endpointName);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });

            it("should convert a widget's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointJSON = {
                    id: widgetModel.id,
                    type: widgetModel.meta.type,
                    endpoint: endpointDesc.name
                };
                var endpoint = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });

            it("should convert a operator's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointJSON = {
                    id: operatorModel.id,
                    type: operatorModel.meta.type,
                    endpoint: endpointDesc.name
                };
                var endpoint = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });
        });

        describe("connect(sourceEndpoint, connection)", function () {
            var widgetModel, operatorModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should connect to source-endpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.SourceEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
            });

            it("should throw error when sourceEndpoint is not instance of SourceEndpoint", function () {
                var endpointDesc = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.TargetEndpoint(operatorModel, endpointDesc);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                expect(function () {
                    endpoint.connect(null, connection);
                }).toThrowError(TypeError);

                expect(connection._connect.calls.count()).toEqual(0);
            });

            it("should not connect to source-endpoints more than once", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.SourceEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
            });
        });

        describe("disconnect(sourceEndpoint)", function () {
            var widgetModel, operatorModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should disconnect source-endpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.SourceEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };

                endpoint1.connect(endpoint2, connection);
                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
                expect(connection._disconnect.calls.count()).toEqual(1);
            });

            it("should not throw error when sourceEndpoint does not exist", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.SourceEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };

                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
                expect(connection._disconnect.calls.count()).toEqual(0);
            });

            it("should throw error when sourceEndpoint is not instance of SourceEndpoint", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);

                expect(endpoint1.connections.length).toEqual(0);
                expect(function () {
                    endpoint1.disconnect(null);
                }).toThrowError(TypeError);
            });
        });

        describe("fullDisconnect()", function () {
            var widgetModel, operatorModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should disconnect source-endpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc3 = {
                    name: "endpoint3",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.TargetEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.SourceEndpoint(widgetModel, endpointDesc2);
                var endpoint3 = new ns.SourceEndpoint(widgetModel, endpointDesc3);
                var connection1 = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };
                var connection2 = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };

                endpoint1.connect(endpoint2, connection1);
                endpoint1.connect(endpoint3, connection2);
                endpoint1.fullDisconnect();
                expect(endpoint1.connections.length).toEqual(0);
                expect(connection1._disconnect.calls.count()).toEqual(1);
                expect(connection2._disconnect.calls.count()).toEqual(1);
            });
        });

        describe("propagate(event, [options])", function () {
            var widgetModel, operatorModel;

            beforeEach(function () {

                operatorModel = {
                    id: "1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should save given event into operator's pending events", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.pending_events = {
                    push: jasmine.createSpy("push")
                };
                endpoint1.propagate("test");

                expect(operatorModel.pending_events.push.calls.argsFor(0)).toEqual([{
                    endpoint: endpointDesc1.name,
                    value: "test"
                }]);
            });

            it("should ignore given event when target-endpoint is missing", function () {
                var endpointName = "endpoint1";
                var endpoint1 = new ns.GhostTargetEndpoint(operatorModel, endpointName);

                operatorModel.pending_events = {
                    push: jasmine.createSpy("push")
                };
                endpoint1.propagate("test");

                expect(operatorModel.pending_events.push.calls.count()).toEqual(0);
            });

            it("should throw error when operator target-endpoint's callback is undefined", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;

                operatorModel.logManager = {
                    log: jasmine.createSpy("push")
                };

                endpoint1.propagate("test");
                expect(operatorModel.logManager.log.calls.count()).toEqual(1);
            });

            it("should throw error when widget target-endpoint's callback is undefined", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc1);

                widgetModel.loaded = true;

                widgetModel.logManager = {
                    log: jasmine.createSpy("push")
                };

                endpoint1.propagate("test");
                expect(widgetModel.logManager.log.calls.count()).toEqual(1);
            });

            it("should send given event to operator target-endpoint's callback properly", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;
                endpoint1.callback = jasmine.createSpy("callback");
                //spyOn(endpointDesc1, "callback");//.and.throwError("quux");

                endpoint1.propagate("test");
                expect(endpoint1.callback.calls.count()).toEqual(1);
            });

            it("should catch unexpected exceptions when operator target-endpoint's callback throws errors", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;
                operatorModel.logManager = {
                    formatException: jasmine.createSpy("formatException").and.returnValue("exception"),
                    log: jasmine.createSpy("push")
                };

                endpoint1.callback = function () {};
                spyOn(endpoint1, "callback").and.throwError("unexpected error");

                endpoint1.propagate("test");
                expect(operatorModel.logManager.log.calls.count()).toEqual(1);
            });

            it("should catch unexpected exceptions when widget target-endpoint's callback throws errors", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc1);

                widgetModel.loaded = true;
                widgetModel.logManager = {
                    formatException: jasmine.createSpy("formatException").and.returnValue("exception"),
                    log: jasmine.createSpy("push")
                };

                endpoint1.callback = function () {};
                spyOn(endpoint1, "callback").and.throwError("unexpected error");

                endpoint1.propagate("test");
                expect(widgetModel.logManager.log.calls.count()).toEqual(1);
            });

            it("should throw EndpointTypeError when operator target-endpoint's callback throws EndpointTypeError", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;

                endpoint1.callback = function () {};
                spyOn(endpoint1, "callback").and.throwError(new ns.EndpointTypeError("test"));

                expect(function () {
                    endpoint1.propagate("test");
                }).toThrowError(ns.EndpointTypeError);
            });

            it("should throw EndpointValueError when widget target-endpoint's callback throws EndpointValueError", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.WidgetTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;

                endpoint1.callback = function () {};
                spyOn(endpoint1, "callback").and.throwError(new ns.EndpointValueError("test"));

                expect(function () {
                    endpoint1.propagate("test");
                }).toThrowError(ns.EndpointValueError);
            });

            it("should ignore given event when operator's target-endpoint is not in options.targetEndpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.pending_events = {
                    push: jasmine.createSpy("push")
                };
                endpoint1.propagate("test", {
                    targetEndpoints: [{
                        type: "widget",
                        id: "1",
                        endpoint: "test"
                    }]
                });

                expect(operatorModel.pending_events.push.calls.count()).toEqual(0);
            });

            it("should ignore given event when widget's target-endpoint is not in options.targetEndpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc1);

                widgetModel.pending_events = {
                    push: jasmine.createSpy("push")
                };
                endpoint1.propagate("test", {
                    targetEndpoints: [{
                        type: "operator",
                        id: "1",
                        endpoint: "test"
                    }]
                });

                expect(widgetModel.pending_events.push.calls.count()).toEqual(0);
            });

            it("should take given event when operator's target-endpoint is in options.targetEndpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc1);

                operatorModel.loaded = true;

                operatorModel.logManager = {
                    log: jasmine.createSpy("push")
                };

                endpoint1.propagate("test", {
                    targetEndpoints: [endpoint1.toJSON()]
                });
                expect(operatorModel.logManager.log.calls.count()).toEqual(1);
            });

            it("should take given event when widget's target-endpoint is in options.targetEndpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc1);

                widgetModel.loaded = true;

                widgetModel.logManager = {
                    log: jasmine.createSpy("push")
                };

                endpoint1.propagate("test", {
                    targetEndpoints: [endpoint1.toJSON()]
                });
                expect(widgetModel.logManager.log.calls.count()).toEqual(1);
            });
        });
    });

})(Wirecloud.wiring);
