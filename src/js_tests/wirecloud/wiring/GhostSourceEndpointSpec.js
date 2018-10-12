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

/* globals Wirecloud */


(function (ns) {

    "use strict";

    var CONNECTION = Object.freeze({
        _connect: function () {},
        _disconnect: function () {}
    });

    var OPERATOR = Object.freeze({
        id: "1",
        meta: {
            type: 'operator'
        }
    });

    var WIDGET = Object.freeze({
        id: "1",
        meta: {
            type: 'widget'
        }
    });

    var DEFAULT_ENDPOINT_NAME = "source";


    describe("GhostSourceEndpoint", function () {

        describe("new GhostSourceEndpoint(componentModel, endpointName)", function () {

            it("should allow to create operator endpoints", function () {
                var endpoint = new ns.GhostSourceEndpoint(OPERATOR, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual([OPERATOR.meta.type, OPERATOR.id, DEFAULT_ENDPOINT_NAME].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.label).toEqual(DEFAULT_ENDPOINT_NAME);
                expect(endpoint.missing).toBe(true);
            });

            it("should allow to create widget endpoints", function () {
                var endpoint = new ns.GhostSourceEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual([WIDGET.meta.type, WIDGET.id, DEFAULT_ENDPOINT_NAME].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.label).toEqual(DEFAULT_ENDPOINT_NAME);
                expect(endpoint.missing).toBeTruthy();
            });

        });

        describe("toString()", function () {

            it("should convert a missing source endpoint to string", function () {
                var endpoint = new ns.GhostSourceEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint + "").toEqual([WIDGET.meta.type, WIDGET.id, DEFAULT_ENDPOINT_NAME].join("/"));
            });

            it("should convert a widget's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(endpoint + "").toEqual([WIDGET.meta.type, WIDGET.id, endpointDesc.name].join("/"));
            });

        });

        describe("toJSON()", function () {

            it("should convert a missing source endpoint to string", function () {
                var endpointJSON = {
                    id: WIDGET.id,
                    type: WIDGET.meta.type,
                    endpoint: DEFAULT_ENDPOINT_NAME
                };
                var endpoint = new ns.GhostSourceEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });

            it("should convert a widget's source endpoint to string", function () {
                var endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                var endpointJSON = {
                    id: WIDGET.id,
                    type: WIDGET.meta.type,
                    endpoint: endpointDesc.name
                };
                var endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });

        });

        describe("propagate(event, [options])", function () {

            it("should do nothing if there are no connected endpoints", function () {
                var endpoint = new ns.GhostSourceEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);
                endpoint.propagate("test");
            });

            it("should do nothing also if there are connected endpoints", function () {
                var endpoint1 = new ns.GhostSourceEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);
                var endpoint2 = new ns.TargetEndpoint();
                var endpoint3 = new ns.TargetEndpoint();

                spyOn(endpoint2, 'propagate');
                spyOn(endpoint3, 'propagate');

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint3, CONNECTION);
                endpoint1.propagate("test");
                expect(endpoint2.propagate.calls.count()).toEqual(0);
                expect(endpoint3.propagate.calls.count()).toEqual(0);
            });

        });

    });

})(Wirecloud.wiring);
