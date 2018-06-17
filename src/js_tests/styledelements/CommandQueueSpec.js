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

        var CommandQueue = StyledElements.CommandQueue;

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
                var queue = new CommandQueue({}, function () {});
                expect(queue.running).toBe(false);
            });

            it("CommandQueue(can be created using basic options", function () {
                var queue = new CommandQueue({}, function () {});
                expect(queue.running).toBe(false);
            });

        });

        describe("addCommand(command)", function () {

            var queue, context, callback;

            beforeEach(function () {
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

            it("ignore calls without a command parameter", function (done) {
                var p = queue.addCommand();

                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.then(done);
            });

            it("ignore undefined commands", function (done) {
                var p = queue.addCommand(undefined);

                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.then(done);
            });

            it("handles exceptions on the callback function", function (done) {
                var p = queue.addCommand("exception");

                // Command is resolved immediately so the queue should be empty
                expect(queue.running).toBe(false);
                expect(p).toEqual(jasmine.any(Promise));
                p.catch((error) => {
                    expect(error).toEqual(jasmine.any(Error));
                    done();
                });
            });

            it("handles rejected commands", function (done) {
                var p = queue.addCommand("reject");

                // Command is resolved asynchronously so the queue should not be empty
                expect(queue.running).toBe(true);
                expect(p).toEqual(jasmine.any(Promise));
                p.catch((error) => {
                    expect(error).toEqual("reject");
                    done();
                });
            });

            it("supports adding commands to empty queues", function (done) {
                expect(queue.running).toBe(false);
                queue.addCommand(1);
                expect(queue.running).toBe(true);
                setTimeout(function () {
                    expect(queue.running).toBe(false);
                    expect(callback.calls.count()).toBe(1);
                    expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                    done();
                }, 200);
            });

            it("supports adding several commands", function (done) {
                var listener = jasmine.createSpy();

                expect(queue.running).toBe(false);
                queue.addCommand(1);
                queue.addCommand(2);
                var p = queue.addCommand(3);

                expect(p).toEqual(jasmine.any(Promise));
                expect(queue.running).toBe(true);

                p.then(listener);

                setTimeout(function () {
                    expect(queue.running).toBe(false);
                    expect(listener).toHaveBeenCalled();
                    expect(callback.calls.count()).toBe(3);
                    expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                    expect(callback.calls.argsFor(1)).toEqual([context, 2]);
                    expect(callback.calls.argsFor(2)).toEqual([context, 3]);
                    done();
                }, 620);
            });

            it("supports skiping a command", function (done) {
                var listener = jasmine.createSpy();

                expect(queue.running).toBe(false);
                queue.addCommand(1);
                var p = queue.addCommand("skip");
                queue.addCommand(3);

                expect(p).toEqual(jasmine.any(Promise));
                expect(queue.running).toBe(true);

                p.then(listener);

                setTimeout(function () {
                    expect(queue.running).toBe(false);
                    expect(listener).toHaveBeenCalled();
                    expect(callback.calls.count()).toBe(3);
                    expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                    expect(callback.calls.argsFor(1)).toEqual([context, "skip"]);
                    expect(callback.calls.argsFor(2)).toEqual([context, 3]);
                    done();
                }, 620);
            });

        });

    });

})();
