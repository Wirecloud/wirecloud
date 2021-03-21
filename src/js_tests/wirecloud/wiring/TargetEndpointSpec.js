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

    const CONNECTION = Object.freeze({
        _connect: function () {},
        _disconnect: function () {}
    });


    describe("TargetEndpoint", function () {

        describe("connect(sourceEndpoint, connection)", function () {

            it("should connect to source-endpoints", function () {
                const endpoint1 = new ns.TargetEndpoint();
                const endpoint2 = new ns.SourceEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                expect(endpoint1.connections.length).toEqual(1);
            });

            describe("should throw error when sourceEndpoint is not instance of SourceEndpoint", function () {
                const test = function test(value) {
                    const endpoint = new ns.TargetEndpoint();

                    expect(function () {
                        endpoint.connect(value, CONNECTION);
                    }).toThrowError(TypeError);
                };

                it("null", test.bind(null, null));
                it("undefined", test.bind(null, undefined));
                it("string", test.bind(null, "a"));
                it("number", test.bind(null, 4));
                it("boolean", test.bind(null, false));
                it("object", test.bind(null, {}));
                it("TargetEndpoint", test.bind(null, new ns.TargetEndpoint()));

            });

            it("should not connect to source-endpoints more than once", function () {
                const endpoint1 = new ns.TargetEndpoint();
                const endpoint2 = new ns.SourceEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint2, CONNECTION);
                expect(endpoint1.connections.length).toEqual(1);
            });

        });

        describe("disconnect(sourceEndpoint)", function () {

            it("should disconnect source-endpoints", function () {
                const endpoint1 = new ns.TargetEndpoint();
                const endpoint2 = new ns.SourceEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
            });

            it("should not throw error when sourceEndpoint does not exist", function () {
                const endpoint1 = new ns.TargetEndpoint();
                const endpoint2 = new ns.SourceEndpoint();

                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
            });

            describe("should throw error when sourceEndpoint is not instance of SourceEndpoint", function () {

                const test = function test(value) {
                    const endpoint1 = new ns.TargetEndpoint();

                    expect(function () {
                        endpoint1.disconnect(null);
                    }).toThrowError(TypeError);
                };

                it("null", test.bind(null, null));
                it("number", test.bind(null, 1));
                it("boolean", test.bind(null, true));
                it("string", test.bind(null, "hello world"));
                it("object", test.bind(null, {}));
                it("TargetEndpoint", test.bind(null, new ns.TargetEndpoint()));

            });

        });

        describe("fullDisconnect()", function () {

            it("should disconnect source-endpoints", function () {
                const endpoint1 = new ns.TargetEndpoint();
                const endpoint2 = new ns.SourceEndpoint();
                const endpoint3 = new ns.SourceEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint3, CONNECTION);
                endpoint1.fullDisconnect();
                expect(endpoint1.connections.length).toEqual(0);
            });

        });

        describe("propagate(event, [options])", function () {

            it("should do nothing", function () {
                const endpoint = new ns.TargetEndpoint();
                endpoint.propagate("test");
            });

        });

    });

})(Wirecloud.wiring);
