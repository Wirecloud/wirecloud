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

    const OPERATOR = Object.freeze({
        id: "1",
        name: "operator1",
        meta: {
            type: 'operator'
        }
    });


    describe("OperatorSourceEndpoint", function () {

        describe("new OperatorSourceEndpoint(operatorModel, [endpointDesc])", function () {

            it("should create a new instance", function () {
                const endpointDesc = {
                    name: "source",
                    description: "description",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual(["operator", OPERATOR.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual(endpointDesc.description);
                expect(endpoint.friendcodeList).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no description", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.SourceEndpoint).toBe(true);
                expect(endpoint.id).toEqual(["operator", OPERATOR.id, endpointDesc.name].join("/"));
                expect(endpoint.description).toEqual("");
                expect(endpoint.friendcodeList).toEqual(["a", "b", "c"]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should create a new instance with no endpointDesc", function () {
                /* The Dashboard Management API doesn't provide a endpointDesc */
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR);

                expect(endpoint.component).toBe(OPERATOR);
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
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.friendcodeList).toEqual([]);
            });

        });

        describe("toString()", function () {
            it("should convert the endpoint into a string", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.toString()).toEqual(["operator", OPERATOR.id, endpointDesc.name].join("/"));
            });
        });

        describe("toJSON()", function () {
            it("should convert the endpoint into a JSON object", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const expected_result = {
                    id: OPERATOR.id,
                    type: "operator",
                    endpoint: endpointDesc.name
                };
                const endpoint = new ns.OperatorSourceEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.toJSON()).toEqual(expected_result);
            });
        });

    });

})(Wirecloud.wiring);
