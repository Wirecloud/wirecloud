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

    describe("SourceEndpoint", function () {

        describe("new WidgetSourceEndpoint(widgetModel, [endpointDesc])", function () {
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
                var endpoint = new ns.WidgetSourceEndpoint(widgetModel, endpointDesc);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(widgetModel);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
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
                var endpoint = new ns.WidgetSourceEndpoint(widgetModel, endpointDesc);

                expect(endpoint.description).toEqual("No description provided.");
            });

            it("should create a new instance with no endpointDesc", function () {
                var endpoint = new ns.WidgetSourceEndpoint(widgetModel);

                expect(endpoint.component).toBe(widgetModel);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
            });
        });

        describe("new OperatorSourceEndpoint(operatorModel, [endpointDesc])", function () {
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
                var endpoint = new ns.OperatorSourceEndpoint(operatorModel, endpointDesc);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(operatorModel);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
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
                var endpoint = new ns.OperatorSourceEndpoint(operatorModel, endpointDesc);

                expect(endpoint.description).toEqual("No description provided.");
            });

            it("should create a new instance with no endpointDesc", function () {
                var endpoint = new ns.OperatorSourceEndpoint(operatorModel);

                expect(endpoint.component).toBe(operatorModel);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
            });
        });

        describe("new GhostSourceEndpoint(componentModel, endpointName)", function () {
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
                var endpoint = new ns.GhostSourceEndpoint(componentModel, endpointName);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(componentModel);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
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
                var endpoint = new ns.GhostSourceEndpoint(widgetModel, endpointName);

                expect(endpoint + "").toEqual([widgetModel.meta.type, widgetModel.id, endpointName].join("/"));
            });

            it("should convert a widget's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.WidgetSourceEndpoint(widgetModel, endpointDesc);

                expect(endpoint + "").toEqual([widgetModel.meta.type, widgetModel.id, endpointDesc.name].join("/"));
            });

            it("should convert a operator's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.OperatorSourceEndpoint(operatorModel, endpointDesc);

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
                var endpoint = new ns.GhostSourceEndpoint(widgetModel, endpointName);

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
                var endpoint = new ns.WidgetSourceEndpoint(widgetModel, endpointDesc);

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
                var endpoint = new ns.OperatorSourceEndpoint(operatorModel, endpointDesc);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });
        });

        describe("connect(targetEndpoint, connection)", function () {
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

            it("should connect to target-endpoints", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
            });

            it("should throw error when targetEndpoint is not instance of TargetEndpoint", function () {
                var endpointDesc = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.SourceEndpoint(operatorModel, endpointDesc);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                expect(function () {
                    endpoint.connect(null, connection);
                }).toThrowError(TypeError);

                expect(connection._connect.calls.count()).toEqual(0);
            });

            it("should not connect to target-endpoints more than once", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect')
                };

                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
                endpoint1.connect(endpoint2, connection);
                expect(connection._connect.calls.count()).toEqual(1);
            });
        });

        describe("disconnect(targetEndpoint)", function () {
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

            it("should disconnect target-endpoints", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };

                endpoint1.connect(endpoint2, connection);
                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
                expect(connection._disconnect.calls.count()).toEqual(1);
            });

            it("should not throw error when targetEndpoint does not exist", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var connection = {
                    _connect: jasmine.createSpy('_connect'),
                    _disconnect: jasmine.createSpy('_disconnect')
                };

                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
                expect(connection._disconnect.calls.count()).toEqual(0);
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

            it("should disconnect target-endpoints", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var endpoint3 = new ns.TargetEndpoint(widgetModel, endpointDesc3);
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

        describe("getReachableEndpoints()", function () {
            var widgetModel, operatorModel;

            beforeAll(function () {

                operatorModel = {
                    id: "1",
                    name: "operator1",
                    meta: {
                        type: 'operator'
                    }
                };

                widgetModel = {
                    id: "1",
                    name: "widget1",
                    meta: {
                        type: 'widget'
                    }
                };
            });

            it("should retrieve an empty list", function () {
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
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.TargetEndpoint(widgetModel, endpointDesc2);
                var endpoint3 = new ns.TargetEndpoint(widgetModel, endpointDesc3);
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

                expect(endpoint1.getReachableEndpoints()).toEqual([]);
            });

            it("should retrieve target-endpoints given widget's target-endpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c",
                    actionlabel: "push"
                };
                var endpointDesc3 = {
                    name: "endpoint3",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc2);
                var endpoint3 = new ns.WidgetTargetEndpoint(widgetModel, endpointDesc3);
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

                var result = [
                    {
                        type: widgetModel.meta.type,
                        id: widgetModel.id,
                        endpoint: endpointDesc2.name,
                        actionlabel: endpointDesc2.actionlabel,
                        iWidgetName: widgetModel.name
                    },
                    {
                        type: widgetModel.meta.type,
                        id: widgetModel.id,
                        endpoint: endpointDesc3.name,
                        actionlabel: "Use in " + endpointDesc3.label,
                        iWidgetName: widgetModel.name
                    }
                ];

                expect(endpoint1.getReachableEndpoints()).toEqual(result);
            });

            it("should retrieve target-endpoints given operator's target-endpoints", function () {
                var endpointDesc1 = {
                    name: "endpoint1",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointDesc2 = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c",
                    actionlabel: "push"
                };
                var endpointDesc3 = {
                    name: "endpoint3",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint1 = new ns.SourceEndpoint(operatorModel, endpointDesc1);
                var endpoint2 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc2);
                var endpoint3 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc3);
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

                var result = [
                    {
                        type: operatorModel.meta.type,
                        id: operatorModel.id,
                        endpoint: endpointDesc2.name,
                        actionlabel: endpointDesc2.actionlabel
                    },
                    {
                        type: operatorModel.meta.type,
                        id: operatorModel.id,
                        endpoint: endpointDesc3.name,
                        actionlabel: "Use in " + endpointDesc3.label
                    }
                ];

                expect(endpoint1.getReachableEndpoints()).toEqual(result);
            });
        });
    });

})(Wirecloud.wiring);
