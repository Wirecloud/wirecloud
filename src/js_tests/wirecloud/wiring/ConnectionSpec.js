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

    describe("Connection", function () {
        let operatorModel, widgetModel, endpointDesc1, endpointDesc2, sourceEndpoint, targetEndpoint, wiringEngine;

        beforeAll(() => {
            spyOn(console, "log");
            spyOn(console, "info");
            spyOn(console, "error");
        });

        beforeEach(function () {

            endpointDesc1 = {
                name: "source",
                description: "description",
                label: "title",
                friendcode: "a"
            };

            endpointDesc2 = {
                name: "target",
                description: "description",
                label: "title",
                friendcode: "a"
            };

            operatorModel = {
                id: "1",
                volatile: false,
                meta: {
                    type: 'operator'
                }
            };

            widgetModel = {
                id: "1",
                volatile: false,
                meta: {
                    type: 'widget'
                }
            };

            wiringEngine = {
                logManager: new Wirecloud.LogManager()
            };

            sourceEndpoint = new ns.WidgetSourceEndpoint(widgetModel, endpointDesc1);
            targetEndpoint = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc2);
        });

        describe("new Connection(wiringEngine, sourceEndpoint, targetEndpoint, [options])", function () {

            it("should create a new instance with no options", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                expect(connection instanceof ns.Connection).toBe(true);
                expect(connection.source).toBe(sourceEndpoint);
                expect(connection.target).toBe(targetEndpoint);
                expect(connection.readonly).toBe(false);
                expect(connection.volatile).toBe(false);
                expect(connection.id).toEqual([sourceEndpoint.id, targetEndpoint.id].join("//"));
            });

            it("should create a new instance with options.readonly = true", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint, {
                    readonly: true
                });

                expect(connection.readonly).toBe(true);
            });
        });

        describe("toJSON()", function () {

            it("should parse to JSON", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                expect(connection.toJSON()).toEqual({
                    readonly: false,
                    source: sourceEndpoint.toJSON(),
                    target: targetEndpoint.toJSON()
                });
            });
        });

        describe("equals(value)", function () {

            it("should be equals to the same connection", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                expect(connection.equals(connection)).toBe(true);
            });

            it("should be equals to another connection with same endpoints", function () {
                const connection1 = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);
                const connection2 = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                expect(connection1.equals(connection2)).toBe(true);
            });

            it("should not be equals to another connection with different endpoints", function () {
                const endpointDesc3 = {
                    name: "target-test",
                    description: "description",
                    label: "title",
                    friendcode: "a"
                };
                const targetEndpoint2 = new ns.OperatorTargetEndpoint(operatorModel, endpointDesc3);

                const connection1 = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);
                const connection2 = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint2);

                expect(connection1.equals(connection2)).toBe(false);
            });
        });

        describe("establish()", function () {

            it("should connect two endpoints properly", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);

                expect(connection.establish()).toBe(connection);
                expect(connection.established).toBe(true);
                expect(callback.calls.count()).toEqual(1);
            });

            it("should do nothing if the connection is already established", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);
                connection.establish();

                expect(connection.establish()).toBe(connection);
                expect(connection.established).toBe(true);
                expect(callback.calls.count()).toEqual(1);
            });

            it("should do nothing if the source is a ghost endpoint", function () {
                const missingSourceEndpoint = new ns.GhostSourceEndpoint(widgetModel, "missing");
                const connection = new ns.Connection(wiringEngine, missingSourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);

                expect(connection.establish()).toBe(connection);
                expect(connection.established).toBe(false);
                expect(callback.calls.count()).toEqual(0);
            });

            it("should do nothing if the target is a ghost endpoint", function () {
                const missingTargetEndpoint = new ns.GhostTargetEndpoint(operatorModel, "missing");
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, missingTargetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);

                expect(connection.establish()).toBe(connection);
                expect(connection.established).toBe(false);
                expect(callback.calls.count()).toEqual(0);
            });
        });

        describe("detach()", function () {

            it("should disconnect two endpoints properly", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("detach", callback);
                connection.establish();

                expect(connection.detach()).toBe(connection);
                expect(connection.established).toBe(false);
                expect(callback.calls.count()).toEqual(1);
            });

            it("should do nothing if the connection is not established", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("detach", callback);

                expect(connection.detach()).toBe(connection);

                expect(callback.calls.count()).toEqual(0);
            });
        });

        describe("remove()", function () {

            it("should remove if the connection is established", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback1 = jasmine.createSpy("callback1");
                const callback2 = jasmine.createSpy("callback2");

                connection.addEventListener("detach", callback1);
                connection.addEventListener("remove", callback2);
                connection.establish();

                expect(connection.remove()).toBe(connection);
                expect(connection.established).toBe(false);
                expect(callback1.calls.count()).toEqual(1);
                expect(callback2.calls.count()).toEqual(1);
            });

            it("should do nothing if the connection is not established", function () {
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);

                const callback1 = jasmine.createSpy("callback1");
                const callback2 = jasmine.createSpy("callback2");

                connection.addEventListener("detach", callback1);
                connection.addEventListener("remove", callback2);

                expect(connection.remove()).toBe(connection);
                expect(connection.established).toBe(false);
                expect(callback1.calls.count()).toEqual(0);
                expect(callback2.calls.count()).toEqual(1);
            });
        });

        describe("updateEndpoint(endpoint)", function () {

            it("should change the missing source-endpoint", function () {
                const missingSourceEndpoint = new ns.GhostSourceEndpoint(widgetModel, "missing");
                const connection = new ns.Connection(wiringEngine, missingSourceEndpoint, targetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);

                expect(connection.updateEndpoint(sourceEndpoint)).toBe(connection);
                expect(connection.established).toBe(true);
                expect(connection.source).toEqual(sourceEndpoint);
                expect(callback.calls.count()).toEqual(1);
            });

            it("should change the missing target-endpoint", function () {
                const missingTargetEndpoint = new ns.GhostTargetEndpoint(operatorModel, "missing");
                const connection = new ns.Connection(wiringEngine, sourceEndpoint, missingTargetEndpoint);

                const callback = jasmine.createSpy("callback");

                connection.addEventListener("establish", callback);

                expect(connection.updateEndpoint(targetEndpoint)).toBe(connection);
                expect(connection.established).toBe(true);
                expect(connection.target).toEqual(targetEndpoint);
                expect(callback.calls.count()).toEqual(1);
            });

            describe("throws a TypeError if endpoint is not valid", function () {

                const base_test = function base_test(value) {
                    const connection = new ns.Connection(wiringEngine, sourceEndpoint, targetEndpoint);
                    const callback = jasmine.createSpy("callback");

                    connection.addEventListener("establish", callback);

                    expect(function () {
                        connection.updateEndpoint(value);
                    }).toThrowError(TypeError);
                    expect(callback.calls.count()).toEqual(0);
                };

                it("null", function () {
                    base_test(null);
                });

                it("number", function () {
                    base_test(0);
                });

                it("string", function () {
                    base_test("test");
                });

                it("object", function () {
                    base_test({});
                });
            });
        });
    });

})(Wirecloud.wiring);
