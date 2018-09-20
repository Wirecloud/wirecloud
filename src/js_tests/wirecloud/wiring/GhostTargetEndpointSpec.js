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


    describe("GhostTargetEndpoint", function () {

        describe("new GhostTargetEndpoint(widgetModel, endpointName)", function () {

            it("should allow to create operator endpoints", function () {
                var endpoint = new ns.GhostTargetEndpoint(OPERATOR, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual([OPERATOR.meta.type, OPERATOR.id, DEFAULT_ENDPOINT_NAME].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual([]);
                expect(endpoint.label).toEqual(DEFAULT_ENDPOINT_NAME);
                expect(endpoint.missing).toBe(true);
            });

            it("should allow to create widget endpoints", function () {
                var endpoint = new ns.GhostTargetEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual([WIDGET.meta.type, WIDGET.id, DEFAULT_ENDPOINT_NAME].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual([]);
                expect(endpoint.label).toEqual(DEFAULT_ENDPOINT_NAME);
                expect(endpoint.missing).toBe(true);
            });

        });

        describe("getReachableEndpoints()", function () {

            it("should return a empty list", function () {
                var endpoint = new ns.GhostTargetEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.getReachableEndpoints()).toEqual([]);
            });

        });

        describe("propagate(event, [options])", function () {

            it("should do nothing", function () {
                var endpoint = new ns.GhostTargetEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);
                endpoint.propagate("test");
            });

        });

        describe("toString()", function () {

            it("should convert operator endpoints into a strings", function () {
                var endpoint = new ns.GhostTargetEndpoint(OPERATOR, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.toString()).toEqual(["operator", WIDGET.id, DEFAULT_ENDPOINT_NAME].join("/"));
            });

            it("should convert widget endpoints into a strings", function () {
                var endpoint = new ns.GhostTargetEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.toString()).toEqual(["widget", WIDGET.id, DEFAULT_ENDPOINT_NAME].join("/"));
            });

        });

        describe("toJSON()", function () {

            it("should convert operator endpoints into a JSON objects", function () {
                var expected_result = {
                    id: OPERATOR.id,
                    type: "operator",
                    endpoint: DEFAULT_ENDPOINT_NAME
                };
                var endpoint = new ns.GhostTargetEndpoint(OPERATOR, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.toJSON()).toEqual(expected_result);
            });

            it("should convert widget endpoints into a JSON objects", function () {
                var expected_result = {
                    id: WIDGET.id,
                    type: "widget",
                    endpoint: DEFAULT_ENDPOINT_NAME
                };
                var endpoint = new ns.GhostTargetEndpoint(WIDGET, DEFAULT_ENDPOINT_NAME);

                expect(endpoint.toJSON()).toEqual(expected_result);
            });

        });

    });

})(Wirecloud.wiring);
