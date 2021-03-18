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

/* globals StyledElements, Wirecloud */


(function (ns) {

    "use strict";

    const equals_entries = function equals_entries(entryA, entryB) {
        expect(entryA.msg).toEqual(entryB.msg);
        expect(entryA.level).toEqual(entryB.level);
        expect(entryA.logManager).toEqual(entryB.logManager);
    };

    describe("LogManager", function () {

        describe("new LogManager([parent])", function () {

            const check_initial_props = function check_initial_props(logManager, parent) {
                expect(logManager.parent).toEqual(parent);
                expect(logManager.closed).toBe(false);
                expect(logManager.entries.length).toBe(0);
                expect(logManager.previouscycles.length).toBe(0);
                expect(logManager.totalCount).toBe(0);
                expect(logManager.errorCount).toBe(0);
            };

            it("should create an instance", function () {
                const manager = new ns.LogManager();

                expect(manager instanceof ns.LogManager).toBe(true);
                check_initial_props(manager, null);
            });

            it("should create an instance given a parent", function () {
                const parent = new ns.LogManager();

                const manager = new ns.LogManager(parent);

                check_initial_props(manager, parent);
            });

            it("should throw an error given a closed parent", function () {
                const parent = new ns.LogManager();

                expect(function () {
                    new ns.LogManager(parent.close());
                }).toThrowError(Error);
            });
        });

        describe("close()", function () {

            it("should make manager state the new status", function () {
                const manager = new ns.LogManager();

                expect(manager.close()).toEqual(manager);

                expect(manager.closed).toBe(true);
            });

            it("should do nothing if it is already closed", function () {
                const manager = new ns.LogManager();
                manager.close();

                expect(manager.close()).toEqual(manager);

                expect(manager.closed).toBe(true);
            });

            it("should keep previous entries", function () {
                const manager = new ns.LogManager();
                manager.log("error1");
                manager.newCycle();
                manager.log("info1", {level: Wirecloud.constants.LOGGING.INFO_MSG});
                const entries = manager.entries;
                const cycles = manager.previouscycles;

                expect(manager.close()).toEqual(manager);
                expect(manager.entries).toEqual(entries);
                expect(manager.previouscycles).toBe(cycles);
            });

            it("should maintain the parent", function () {
                const parent = new ns.LogManager();
                const manager = new ns.LogManager(parent);

                expect(manager.close()).toEqual(manager);

                expect(manager.parent).toBe(parent);
            });

        });

        describe("formatException(exception)", function () {

            let manager;

            beforeEach(function () {
                manager = new ns.LogManager();
            });

            it("should format exceptions", function () {

                const details = manager.formatException(new Error("error message"));

                expect(details).toEqual(jasmine.any(StyledElements.Fragment));

            });

        });

        describe("log(message, [options])", function () {

            let manager;

            beforeEach(function () {
                manager = new ns.LogManager();
            });

            it("should add an error entry by default", function () {

                expect(manager.log("test")).toEqual(manager);

                expect(manager.errorCount).toBe(1);
                equals_entries(manager.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: manager
                });

            });

            it("should prepend entries into the entries list", function () {

                manager.log("test1");

                expect(manager.log("test2")).toEqual(manager);

                expect(manager.errorCount).toBe(2);
                equals_entries(manager.entries[0], {
                    msg: "test2",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: manager
                });
                equals_entries(manager.entries[1], {
                    msg: "test1",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: manager
                });

            });

            it("should only affect the current cycle", function () {

                manager.log("error1");
                manager.log("error2");
                manager.newCycle();
                const cycles = manager.previouscycles;

                expect(manager.log("test")).toEqual(manager);

                expect(manager.errorCount).toBe(1);
                equals_entries(manager.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: manager
                });
                expect(manager.previouscycles).toBe(cycles);
            });

            it("should support adding warning entries using the level option", function () {

                expect(manager.log("test", {
                    level: Wirecloud.constants.LOGGING.WARN_MSG
                })).toEqual(manager);

                expect(manager.errorCount).toBe(0);
                equals_entries(manager.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.WARN_MSG,
                    logManager: manager
                });

            });

            it("should support adding info entries using the level option", function () {

                expect(manager.log("test", {
                    level: Wirecloud.constants.LOGGING.INFO_MSG
                })).toEqual(manager);

                expect(manager.errorCount).toBe(0);
                equals_entries(manager.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.INFO_MSG,
                    logManager: manager
                });

            });

            it("should support adding debug entries using the level option", function () {

                expect(manager.log("test", {
                    level: Wirecloud.constants.LOGGING.DEBUG_MSG
                })).toEqual(manager);

                expect(manager.errorCount).toBe(0);
                equals_entries(manager.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.DEBUG_MSG,
                    logManager: manager
                });

            });

            describe("throws a TypeError exception when using an invalid value for the level option:", function () {

                const test = function test(level) {
                    expect(function () {
                        manager.log("test", {
                            level: level
                        });
                    }).toThrowError(TypeError);

                    expect(manager.entries.length).toBe(0);
                };

                it("string", test.bind(null, "a"));
                it("invalid number", test.bind(null, -4));
                it("true", test.bind(null, true));
                it("false", test.bind(null, false));

            });

            it("throws an Error if the LogManager is already closed", function () {

                manager.close();

                expect(function () {
                    manager.log("test");
                }).toThrowError();

                expect(manager.errorCount).toBe(0);
                expect(manager.entries.length).toBe(0);

            });

            it("should run on console-less environments", function () {
                const _old_console = window.console;
                window.console = null;

                try {
                    expect(manager.log("test")).toEqual(manager);

                    expect(manager.errorCount).toBe(1);
                } catch (e) {
                    window.console = _old_console;
                    throw e;
                }
                window.console = _old_console;
            });

            it("should not call console when options.console is false", function () {
                spyOn(console, 'error');

                expect(manager.log("test", {
                    console: false
                })).toEqual(manager);

                expect(manager.errorCount).toBe(1);
                // eslint-disable-next-line no-console
                expect(console.error).not.toHaveBeenCalled();
            });

        });

        describe("newCycle()", function () {

            let manager;

            beforeEach(function () {
                manager = new ns.LogManager();
            });

            it("should work on empty log managers", function () {

                expect(manager.newCycle()).toEqual(manager);

                expect(manager.entries.length).toBe(0);
                expect(manager.previouscycles.length).toBe(1);
                expect(manager.previouscycles[0].length).toBe(0);
            });

            it("should keep previous entries", function () {
                manager.log("error1");
                const previouscycle = manager.entries;

                expect(manager.newCycle()).toEqual(manager);

                expect(manager.previouscycles[0]).toEqual(previouscycle);
            });

            it("throws an Error if the LogManager is already closed", function () {
                manager.close();

                expect(function () {
                    manager.newCycle();
                }).toThrowError();

                expect(manager.previouscycles.length).toBe(0);
            });
        });

        describe("parseErrorResponse(response)", function () {

            let manager;

            beforeEach(function () {
                manager = new ns.LogManager();
            });

            it("should extract error message from WireCloud's error responses", function () {

                const response = {
                    responseText: '{"description": "error description"}'
                }

                const msg = manager.parseErrorResponse(response);

                expect(msg).toBe("error description");

            });

            it("should provide an error description for responses using an unexpected json format", function () {

                const response = {
                    status: 503,
                    statusText: "Status text for Service Unavailable",
                    responseText: '{"message": "error description coming form another service (e.g. a load balancer)"}'
                }

                const msg = manager.parseErrorResponse(response);

                expect(msg).toContain(response.status);
                expect(msg).toContain(response.statusText);

            });

            it("should provide an error description for responses not using json responses at all", function () {

                const response = {
                    status: 503,
                    statusText: "",
                    responseText: '<html><body>Error description coming form another service (e.g. a load balancer)</body></html>'
                }

                const msg = manager.parseErrorResponse(response);

                expect(msg).toContain(response.status);
                expect(msg).toContain("Service Unavailable");

            });

            it("should provide an error description for responses not using json responses at all", function () {

                const response = {
                    status: 600,
                    statusText: "",
                    responseText: '<html><body>Error description coming form another service (e.g. a load balancer)</body></html>'
                }

                const msg = manager.parseErrorResponse(response);

                expect(msg).toContain(response.status);
                expect(msg).toContain("Unknown status code");

            });

        });

        describe("reset()", function () {

            let manager;

            beforeEach(function () {
                manager = new ns.LogManager();
            });

            it("should work on empty log managers", function () {
                expect(manager.reset()).toEqual(manager);

                expect(manager.entries.length).toBe(0);
                expect(manager.previouscycles.length).toBe(0);
            });

            it("should remove all entries", function () {
                manager.log("error1");
                manager.newCycle();
                manager.log("error2");

                expect(manager.reset()).toEqual(manager);

                expect(manager.entries.length).toBe(0);
                expect(manager.previouscycles.length).toBe(0);
            });

            it("throws an Error if the LogManager is already closed", function () {
                const manager = new ns.LogManager();
                manager.log("error1");
                manager.close();

                expect(function () {
                    manager.reset();
                }).toThrowError();

                expect(manager.entries.length).toBe(1);
            });
        });
    });

})(Wirecloud);
