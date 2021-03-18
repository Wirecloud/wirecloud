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

    let loaded = false;
    const OPERATOR = {
        id: "1",
        load: jasmine.createSpy('load'),
        logManager: {
            formatException: jasmine.createSpy('formatException'),
            log: jasmine.createSpy('log')
        },
        meta: {
            type: 'operator'
        },
        pending_events: {
            push: jasmine.createSpy('push')
        }
    };
    Object.defineProperty(OPERATOR, 'loaded', {
        get: function () {return loaded;}
    });
    Object.freeze(OPERATOR);


    describe("OperatorTargetEndpoint", function () {

        beforeEach(function () {
            loaded = false;
            OPERATOR.load.calls.reset();
            OPERATOR.logManager.log.calls.reset();
            OPERATOR.pending_events.push.calls.reset();
        });

        describe("new OperatorTargetEndpoint(operatorModel, [endpointDesc])", function () {

            it("should create a new instance", function () {
                const endpointDesc = {
                    name: "source",
                    description: "description",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.id).toEqual(["operator", OPERATOR.id, endpointDesc.name].join("/"));
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
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.description).toBe("");
            });

            it("should create a new instance with no endpointDesc", function () {
                /* The Dashboard Management API doesn't provide a endpointDesc */
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR);

                expect(endpoint.component).toBe(OPERATOR);
                expect(endpoint instanceof ns.TargetEndpoint).toBe(true);
                expect(endpoint.friendcodeList).toEqual([]);
                expect(endpoint.missing).toBeFalsy();
            });

            it("should handle empty friendcodes", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: ""
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.friendcodeList).toEqual([]);
            });

        });

        describe("getReachableEndpoints()", function () {

            it("should return the info for targeting this endpoint in a list", function () {
                const endpointDesc = {
                    actionlabel: "Send tweet",
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const expected_result = [
                    {
                        actionlabel: "Send tweet",
                        endpoint: "source",
                        id: OPERATOR.id,
                        type: OPERATOR.meta.type
                    }
                ];
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.getReachableEndpoints()).toEqual(expected_result);
            });

            it("should provide a default action label if the endpoint does not provide it", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const expected_result = [
                    {
                        actionlabel: "Use in title",
                        endpoint: "source",
                        id: OPERATOR.id,
                        type: OPERATOR.meta.type
                    }
                ];
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.getReachableEndpoints()).toEqual(expected_result);
            });

        });

        describe("propagate(event, [options])", function () {

            it("should add the event to the pending_events list if the operator is currently unloaded", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                endpoint.propagate("test");
                expect(OPERATOR.pending_events.push.calls.count()).toBe(1);
                expect(OPERATOR.load.calls.count()).toBe(0);
            });

            it("should call endpoint listener", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback");
                loaded = true;

                endpoint.propagate("test");
                expect(endpoint.callback).toHaveBeenCalledWith("test");
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(OPERATOR.load.calls.count()).toBe(0);
            });

            it("should propagate EndpointValueError errors", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback").and.throwError(new ns.EndpointValueError("test"));
                loaded = true;

                expect(function () {
                    endpoint.propagate("test");
                }).toThrowError(ns.EndpointValueError);
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback).toHaveBeenCalledWith("test");
            });

            it("should propagate EndpointTypeError errors", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback").and.throwError(new ns.EndpointTypeError("test"));
                loaded = true;

                expect(function () {
                    endpoint.propagate("test");
                }).toThrowError(ns.EndpointTypeError);
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback).toHaveBeenCalledWith("test");
            });

            it("should log an error if the widget has not provided a listener", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                loaded = true;

                endpoint.propagate("test");
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(OPERATOR.logManager.log.calls.count()).toBe(1);
            });

            it("should catch any other error calling the endpoint listener", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback").and.throwError(new TypeError("test"));
                loaded = true;

                endpoint.propagate("test");
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback).toHaveBeenCalledWith("test");
                expect(OPERATOR.logManager.log.calls.count()).toBe(1);
            });

            it("should call the callback if the event targets this endpoint", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback");
                loaded = true;

                endpoint.propagate("test", {targetEndpoints: [{type: "operator", id: OPERATOR.id, endpoint: "endpoint2"}]});
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback.calls.count()).toBe(1);
            });

            it("should ignore any event not targeting this endpoint", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback");
                loaded = true;

                endpoint.propagate("test", {targetEndpoints: [{type: "otherendpoint"}]});
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback.calls.count()).toBe(0);
            });

            it("should ignore third-party options", function () {
                const endpointDesc = {
                    name: "endpoint2",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);
                spyOn(endpoint, "callback");
                loaded = true;

                endpoint.propagate("test", {thirdparty: true});
                expect(OPERATOR.pending_events.push.calls.count()).toBe(0);
                expect(endpoint.callback.calls.count()).toBe(1);
            });

        });

        describe("toString()", function () {
            it("should convert the endpoint into a string", function () {
                const endpointDesc = {
                    name: "source",
                    label: "title",
                    friendcode: "a b c"
                };
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

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
                const endpoint = new ns.OperatorTargetEndpoint(OPERATOR, endpointDesc);

                expect(endpoint.toJSON()).toEqual(expected_result);
            });
        });

    });

})(Wirecloud.wiring);
