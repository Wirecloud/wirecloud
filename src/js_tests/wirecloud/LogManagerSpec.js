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

    describe("LogManager", function () {
        var childA, parentA;

        beforeEach(function () {
            parentA = new ns.LogManager();
            childA = new ns.LogManager(parentA);
        });

        describe("new LogManager([parent])", function () {

            var check_initial_props = function check_initial_props(logManager, parent) {
                expect(logManager.parent).toEqual(parent);
                expect(logManager.children.length).toBe(0);
                expect(logManager.closed).toBe(false);
                expect(logManager.entries.length).toBe(0);
                expect(logManager.history.length).toBe(1);
                expect(logManager.totalCount).toBe(0);
                expect(logManager.errorCount).toBe(0);
            };

            it("should create an instance", function () {
                var parentB = new ns.LogManager();

                expect(parentB instanceof ns.LogManager).toBe(true);
                check_initial_props(parentB, null);
            });

            it("should create an instance given a parent", function () {
                var childB = new ns.LogManager(parentA);

                check_initial_props(childB, parentA);
                expect(parentA.children).toEqual([childA, childB]);
            });

            it("should throw an error given a closed parent", function () {
                var childB;

                expect(function () {
                    childB = new ns.LogManager(parentA.close());
                }).toThrowError(Error);
            });
        });

        describe("close()", function () {

            it("should close properly", function () {
                expect(parentA.close()).toEqual(parentA);
                expect(parentA.closed).toBe(true);
            });

            it("should do nothing if it is already closed", function () {
                parentA.close();
                expect(parentA.close()).toEqual(parentA);
            });

            it("should keep last entries", function () {
                parentA.log("error1");

                expect(parentA.close()).toEqual(parentA);
                expect(parentA.entries.length).toBe(1);
                expect(parentA.history.length).toBe(1);
                expect(parentA.history[0].length).toBe(1);
            });

            it("should remove parent", function () {
                expect(childA.close()).toEqual(childA);
                expect(childA.parent).toBe(null);
                expect(parentA.children.length).toBe(0);
            });

            it("should remove children", function () {
                expect(parentA.close()).toEqual(parentA);
                expect(parentA.children.length).toBe(0);
                expect(childA.parent).toBe(null);
            });
        });

        describe("log(message, [options])", function () {

            var equals_entries = function equals_entries(entryA, entryB) {
                expect(entryA.msg).toEqual(entryB.msg);
                expect(entryA.level).toEqual(entryB.level);
                expect(entryA.logManager).toEqual(entryB.logManager);
            };

            it("should add an error entry by default", function () {
                expect(parentA.log("test")).toEqual(parentA);
                expect(parentA.errorCount).toBe(1);
                equals_entries(parentA.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: parentA
                });
            });

            it("should send entry to parent", function () {
                expect(childA.log("test")).toEqual(childA);
                expect(parentA.entries.length).toBe(1);
                equals_entries(parentA.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.ERROR_MSG,
                    logManager: childA
                });
            });

            it("should add a warning entry (in options.level)", function () {
                expect(parentA.log("test", {
                    level: Wirecloud.constants.LOGGING.WARN_MSG
                })).toEqual(parentA);
                expect(parentA.errorCount).toBe(0);
                equals_entries(parentA.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.WARN_MSG,
                    logManager: parentA
                });
            });

            it("should add an info entry (in options.level)", function () {
                expect(parentA.log("test", {
                    level: Wirecloud.constants.LOGGING.INFO_MSG
                })).toEqual(parentA);
                expect(parentA.errorCount).toBe(0);
                equals_entries(parentA.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.INFO_MSG,
                    logManager: parentA
                });
            });

            it("should add a debug entry (in options.level)", function () {
                expect(parentA.log("test", {
                    level: Wirecloud.constants.LOGGING.DEBUG_MSG
                })).toEqual(parentA);
                expect(parentA.errorCount).toBe(0);
                equals_entries(parentA.entries[0], {
                    msg: "test",
                    level: Wirecloud.constants.LOGGING.DEBUG_MSG,
                    logManager: parentA
                });
            });

            it("should do nothing if it is already closed", function () {
                parentA.close();

                expect(parentA.log("test")).toEqual(parentA);
                expect(parentA.errorCount).toBe(0);
                expect(parentA.entries.length).toBe(0);
            });

            it("should not call console when options.console is false", function () {
                spyOn(console, 'error');

                expect(parentA.log("test", {
                    console: false
                })).toEqual(parentA);
                expect(parentA.errorCount).toBe(1);
                expect(console.error).not.toHaveBeenCalled();
            });
        });

        describe("newCycle()", function () {

            it("should restart properly", function () {
                expect(parentA.newCycle()).toEqual(parentA);
                expect(parentA.entries.length).toBe(0);
                expect(parentA.history.length).toBe(2);
                expect(parentA.history[0].length).toBe(0);
                expect(parentA.history[1].length).toBe(0);
            });

            it("should restart properly and keep last entries", function () {
                parentA.log("error1");

                expect(parentA.newCycle()).toEqual(parentA);
                expect(parentA.history[1].length).toBe(1);
            });

            it("should do nothing if it is already closed", function () {
                parentA.close();

                expect(parentA.newCycle()).toEqual(parentA);
                expect(parentA.history.length).toBe(1);
            });
        });

        describe("reset()", function () {

            it("should reset properly", function () {
                childA.log("error1");

                expect(parentA.reset()).toEqual(parentA);
                expect(parentA.entries.length).toBe(0);
                expect(childA.entries.length).toBe(0);
            });

            it("should do nothing if it is already closed", function () {
                parentA.log("error1");
                parentA.close();

                expect(parentA.reset()).toEqual(parentA);
                expect(parentA.entries.length).toBe(1);
            });
        });
    });

})(Wirecloud);
