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
    });

})(Wirecloud.wiring);
