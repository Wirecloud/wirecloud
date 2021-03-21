/*
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements */


(function (se) {

    "use strict";

    describe("Event", () => {

        describe("new Event(context)", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.Event({});  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work by providing the minimum details", () => {
                const context = {};
                const event = new se.Event(context);

                expect(event.context).toBe(context);
            });

        });

        describe("clearEventListeners()", () => {

            it("should work on events without listeners", () => {
                const event = new se.Event({});

                event.clearEventListeners();

                expect(event.handlers).toEqual([]);
            });

            it("should work on events with listeners", () => {
                const event = new se.Event({});
                const listener = () => {};
                event.addEventListener(listener);

                event.clearEventListeners();

                expect(event.handlers).toEqual([]);
            });

            it("should work on events with listeners (dispatching)", () => {
                const event = new se.Event({});
                const listener1 = jasmine.createSpy("listener1").and.callFake(() => {
                    event.clearEventListeners();
                });
                const listener2 = jasmine.createSpy("listener2");
                event.addEventListener(listener1);
                event.addEventListener(listener2);

                event.dispatch();

                expect(listener1).toHaveBeenCalledWith();
                expect(listener2).not.toHaveBeenCalled();
                expect(event.handlers).toEqual([]);
            });

        });

        describe("dispatch()", () => {

            let console_error;

            /* eslint-disable no-console */
            beforeAll(() => {
                console_error = console.error;
                delete console.error;
            });

            afterAll(() => {
                console.error = console_error;
            })
            /* eslint-enable no-console */

            it("should work if console.error is not a function", () => {
                const listener = jasmine.createSpy("listener").and.throwError();
                const event = new se.Event({});
                event.addEventListener(listener);

                event.dispatch();
            });

        });

    });

})(StyledElements);
