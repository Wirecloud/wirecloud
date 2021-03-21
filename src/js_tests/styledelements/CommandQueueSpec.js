/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

/* globals Promise, StyledElements */


(function () {

    "use strict";

    describe("Command Queue: ", function () {

        const CommandQueue = StyledElements.CommandQueue;

        describe("new CommandQueue(context, callback)", function () {

            it("throws a TypeError exception when not passing context and callback parameters", () => {
                expect(() => {
                    new CommandQueue();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when the callback parameters is not a function", () => {
                expect(() => {
                    new CommandQueue({}, null);
                }).toThrowError(TypeError);
            });

            it("works using basic options", function () {
                const queue = new CommandQueue({}, function () {});
                expect(queue.running).toBe(false);
            });

            it("CommandQueue(can be created using basic options", function () {
                const queue = new CommandQueue({}, function () {});
                expect(queue.running).toBe(false);
            });

        });

        describe("addCommand(command)", function () {

            const realSetTimeout = setTimeout;
            let queue, context, callback;

            beforeEach(function () {
                jasmine.clock().install();
                context = {context: true};
                callback = jasmine.createSpy('callback').and.callFake(function (context, command) {
                    if (command === "skip") {
                        return false;
                    } else if (command === "exception") {
                        throw Error("error message");
                    } else if (command === "reject") {
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                reject(command);
                            }, 200);
                        });
                    } else {
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                resolve(command);
                            }, 200);
                        });
                    }
                });

                queue = new CommandQueue(context, callback);
            });

            afterEach(() => {
                jasmine.clock().uninstall();
            });

            it("ignore calls without a command parameter", function (done) {
                const p = queue.addCommand();

                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.then(done);
            });

            it("ignore undefined commands", function (done) {
                const p = queue.addCommand(undefined);

                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.then(done);
            });

            it("handles exceptions on the callback function", function (done) {
                const p = queue.addCommand("exception");

                // Command is resolved immediately so the queue should be empty
                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.catch((error) => {
                    expect(error).toEqual(jasmine.any(Error));
                    done();
                });
            });

            it("handles rejected commands", function (done) {
                const p = queue.addCommand("reject");

                // Command is resolved asynchronously so the queue should not be empty
                expect(queue.running).toBe(true);
                expect(p).toEqual(jasmine.any(Promise));
                p.catch((error) => {
                    expect(error).toEqual("reject");
                    done();
                });
                jasmine.clock().tick(200);
            });

            it("supports adding commands to empty queues", (done) => {
                expect(queue.running).toBe(false);
                queue.addCommand(1);
                expect(queue.running).toBe(true);
                jasmine.clock().tick(200);
                jasmine.clock().uninstall();

                setTimeout(() => {
                    expect(queue.running).toBe(false);
                    expect(callback.calls.count()).toBe(1);
                    expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                    done();
                }, 0);
            });

            it("supports adding several commands", (done) => {
                const listener1 = jasmine.createSpy();
                const listener2 = jasmine.createSpy();
                const listener3 = jasmine.createSpy();

                expect(queue.running).toBe(false);
                const p1 = queue.addCommand(1);
                const p2 = queue.addCommand(2);
                const p3 = queue.addCommand(3);

                expect(p1).toEqual(jasmine.any(Promise));
                expect(p2).toEqual(jasmine.any(Promise));
                expect(p3).toEqual(jasmine.any(Promise));
                expect(queue.running).toBe(true);

                p1.then(listener1);
                p2.then(listener2);
                p3.then(listener3);

                // Use realSetTimeout to allow promise resolution
                // Wait resolution of command 1
                jasmine.clock().tick(200);
                realSetTimeout(() => {
                    expect(listener1).toHaveBeenCalled();
                    expect(listener2).not.toHaveBeenCalled();
                    jasmine.clock().tick(200);
                    // Wait resolution of command 2
                    realSetTimeout(() => {
                        expect(listener2).toHaveBeenCalled();
                        expect(listener3).not.toHaveBeenCalled();
                        jasmine.clock().tick(200);
                        // Wait resolution of command 3
                        realSetTimeout(() => {
                            expect(listener3).toHaveBeenCalled();

                            expect(queue.running).toBe(false);
                            expect(callback.calls.count()).toBe(3);
                            expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                            expect(callback.calls.argsFor(1)).toEqual([context, 2]);
                            expect(callback.calls.argsFor(2)).toEqual([context, 3]);
                            done();
                        }, 0);
                    }, 0);
                }, 0);
            });

            it("supports skiping a command", function (done) {
                const listener = jasmine.createSpy();

                expect(queue.running).toBe(false);
                queue.addCommand(1);
                const p = queue.addCommand("skip");
                queue.addCommand(3);

                expect(p).toEqual(jasmine.any(Promise));
                expect(queue.running).toBe(true);

                p.then(listener);

                // Use realSetTimeout to allow promise resolution
                // Wait resolution of command 1
                jasmine.clock().tick(200);
                realSetTimeout(() => {
                    // Command skip is immediately resolve
                    // Wait resolution of command 3
                    jasmine.clock().tick(200);
                    realSetTimeout(() => {
                        expect(queue.running).toBe(false);
                        expect(listener).toHaveBeenCalled();
                        expect(callback.calls.count()).toBe(3);
                        expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                        expect(callback.calls.argsFor(1)).toEqual([context, "skip"]);
                        expect(callback.calls.argsFor(2)).toEqual([context, 3]);
                        done();
                    }, 0);
                }, 0);
            });

        });

    });

})();
