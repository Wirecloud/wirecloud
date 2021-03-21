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

    const WIDGET = Object.freeze({
        id: "1",
        meta: {
            type: 'widget'
        }
    });


    describe("WidgetSourceEndpoint", function () {

        describe("new WidgetSourceEndpoint(widgetModel, [endpointDesc])", function () {

            it("should create a new instance", function () {
                const endpointDesc = {
                    name: "source",
                    description: "description",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(endpoint).not.toBeNull();
                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual([WIDGET.meta.type, WIDGET.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual(endpointDesc.description);
                expect(endpoint.friendcodeList).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no endpointDesc.description", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual(["widget", WIDGET.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no endpointDesc", function () {
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET);

                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual(null);
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual([]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should handle empty friendcodes", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: ""
                };
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(endpoint.component).toBe(WIDGET);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual(["widget", WIDGET.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual([]);
                expect(endpoint.missing).toBeFalsy();
            });

        });

        describe("toString()", function () {

            it("should convert a widget's source endpoint to string", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(endpoint + "").toEqual([WIDGET.meta.type, WIDGET.id, endpointDesc.name].join("/"));
            });

        });

        describe("toJSON()", function () {

            it("should convert a widget's source endpoint to string", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpointJSON = {
                    id: WIDGET.id,
                    type: WIDGET.meta.type,
                    endpoint: endpointDesc.name
                };
                const endpoint = new ns.WidgetSourceEndpoint(WIDGET, endpointDesc);

                expect(JSON.parse(JSON.stringify(endpoint))).toEqual(endpointJSON);
            });

        });

    });

})(Wirecloud.wiring);
