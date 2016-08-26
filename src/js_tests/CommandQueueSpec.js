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
/* globals Promise, StyledElements */


(function () {

    "use strict";

    describe("Command Queue: ", function () {

        var CommandQueue = StyledElements.CommandQueue;

        describe("new CommandQueue(context, callback)", function () {

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
                    return new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            resolve(command);
                        }, 200);
                    });
                });

                queue = new CommandQueue(context, callback);
            });

            it("ignore undefined commands", function () {
                expect(queue.running).toBe(false);
                queue.addCommand(undefined);
                expect(queue.running).toBe(false);
                queue.addCommand();
                expect(queue.running).toBe(false);
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
                expect(queue.running).toBe(false);
                queue.addCommand(1);
                queue.addCommand(2);
                queue.addCommand(3);
                expect(queue.running).toBe(true);

                setTimeout(function () {
                    expect(queue.running).toBe(false);
                    expect(callback.calls.count()).toBe(3);
                    expect(callback.calls.argsFor(0)).toEqual([context, 1]);
                    expect(callback.calls.argsFor(1)).toEqual([context, 2]);
                    expect(callback.calls.argsFor(2)).toEqual([context, 3]);
                    done();
                }, 620);
            });

        });

    });

})();
