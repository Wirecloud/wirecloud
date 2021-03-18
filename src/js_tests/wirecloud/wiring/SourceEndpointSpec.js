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
        _disconnect: function () {},
        logManager: {
            log: jasmine.createSpy('log')
        }
    });


    describe("SourceEndpoint", function () {

        beforeEach(function () {
            CONNECTION.logManager.log.calls.reset();
        });

        describe("connect(targetEndpoint, connection)", function () {

            it("should connect to target-endpoints", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                expect(endpoint1.connections.length).toEqual(1);
            });

            describe("throws a TypeError exception when targetEndpoint is not instance of TargetEndpoint", function () {

                const test = function test(value) {
                    const endpoint = new ns.SourceEndpoint();

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
                it("SourceEndpoint", test.bind(null, new ns.SourceEndpoint()));

            });

            it("should not connect to target-endpoints more than once", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint2, CONNECTION);
                expect(endpoint1.connections.length).toEqual(1);
            });

        });

        describe("disconnect(targetEndpoint)", function () {

            it("should disconnect target-endpoints", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
            });

            it("should not throw error when targetEndpoint does not exist", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();

                endpoint1.disconnect(endpoint2);
                expect(endpoint1.connections.length).toEqual(0);
            });

            describe("should throw error when targetEndpoint is not instance of TargetEndpoint", function () {

                const test = function test(value) {
                    const endpoint1 = new ns.SourceEndpoint();

                    expect(function () {
                        endpoint1.disconnect(null);
                    }).toThrowError(TypeError);
                };

                it("null", test.bind(null, null));
                it("number", test.bind(null, 1));
                it("boolean", test.bind(null, true));
                it("string", test.bind(null, "hello world"));
                it("object", test.bind(null, {}));
                it("SourceEndpoint", test.bind(null, new ns.SourceEndpoint()));

            });

        });

        describe("fullDisconnect()", function () {

            it("should disconnect target-endpoints", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();
                const endpoint3 = new ns.TargetEndpoint();

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint3, CONNECTION);
                endpoint1.fullDisconnect();
                expect(endpoint1.connections.length).toEqual(0);
            });

        });

        describe("getReachableEndpoints()", function () {

            it("should return an empty list if the endpoint is not connected", function () {
                const endpoint1 = new ns.SourceEndpoint();
                expect(endpoint1.getReachableEndpoints()).toEqual([]);
            });

            it("should return a list with the reachable endpoints", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();
                spyOn(endpoint2, 'getReachableEndpoints').and.returnValue(['endpoint2']);
                const endpoint3 = new ns.TargetEndpoint();
                spyOn(endpoint3, 'getReachableEndpoints').and.returnValue(['endpoint3']);
                const endpoint4 = new ns.TargetEndpoint();
                spyOn(endpoint4, 'getReachableEndpoints').and.returnValue([]);

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.connect(endpoint3, CONNECTION);
                endpoint1.connect(endpoint4, CONNECTION);

                expect(endpoint1.getReachableEndpoints()).toEqual(['endpoint2', 'endpoint3']);
            });

        });

        describe("propagate(event, [options])", function () {

            it("should catch EndpointTypeError errors", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();
                spyOn(endpoint2, 'propagate').and.throwError(new ns.EndpointTypeError());

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.propagate("test");

                expect(CONNECTION.logManager.log.calls.count()).toEqual(1);
            });

            it("should catch EndpointValueError errors", function () {
                const endpoint1 = new ns.SourceEndpoint();
                const endpoint2 = new ns.TargetEndpoint();
                spyOn(endpoint2, 'propagate').and.throwError(new ns.EndpointValueError());

                endpoint1.connect(endpoint2, CONNECTION);
                endpoint1.propagate("test");

                expect(CONNECTION.logManager.log.calls.count()).toEqual(1);
            });

        });

    });

})(Wirecloud.wiring);
