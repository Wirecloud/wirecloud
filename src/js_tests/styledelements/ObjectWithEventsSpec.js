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

/* globals StyledElements */


(function () {

    "use strict";

    describe("Styled ObjectWithEvents", function () {

        describe("new ObjectWithEvents([eventTypes])", function () {

            it("should create an instance given an eventType list", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                expect(Object.keys(eventTarget.events)).toEqual(['click']);
            });
        });

        describe("addEventListener(eventType, eventListener)", function () {

            it("should throw error if the eventType does not exist", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener = function (element) {};

                expect(function () {
                    eventTarget.addEventListener('focus', eventListener);
                }).toThrow(jasmine.any(Error));
            });

            it("should throw error if the eventListener is not a function", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(function () {
                    eventTarget.addEventListener('click', null);
                }).toThrow(jasmine.any(TypeError));
            });

            it("should add more than once the same eventListener", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener = function (element) {};

                eventTarget.addEventListener('click', eventListener);
                eventTarget.addEventListener('click', eventListener);

                expect(eventTarget.events.click.handlers).toEqual([eventListener, eventListener]);
            });
        });

        describe("dispatchEvent(eventType [, ...args])", function () {

            it("should throw error if the eventType does not exist", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(function () {
                    eventTarget.dispatchEvent('focus');
                }).toThrow(jasmine.any(Error));
            });

            it("should add an eventListener while the event is dispatching", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener1 = function (element) {
                    eventTarget.addEventListener('click', eventListener2);
                };
                var eventListener2 = jasmine.createSpy('eventListener2');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.dispatchEvent('click');

                expect(eventListener2).toHaveBeenCalledWith(eventTarget);
            });

            it("should remove an eventListener while the event is dispatching", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener1 = function (element) {
                    eventTarget.removeEventListener('click', eventListener2);
                };
                var eventListener2 = jasmine.createSpy('eventListener2');
                var eventListener3 = jasmine.createSpy('eventListener3');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.addEventListener('click', eventListener2);
                eventTarget.addEventListener('click', eventListener3);

                eventTarget.dispatchEvent('click');

                expect(eventListener2).not.toHaveBeenCalled();
                expect(eventListener3).toHaveBeenCalledWith(eventTarget);
            });

            it("should call all eventListener list despite an eventListener throws error", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener1 = function (element) {
                    throw Error();
                };
                var eventListener2 = jasmine.createSpy('eventListener2');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.addEventListener('click', eventListener2);

                eventTarget.dispatchEvent('click');

                expect(eventListener2).toHaveBeenCalledWith(eventTarget);
            });
        });

        describe("removeEventListener(eventType, eventListener)", function () {

            it("should throw error if the eventType does not exist", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener = function (element) {};

                expect(function () {
                    eventTarget.removeEventListener('focus', eventListener);
                }).toThrow(jasmine.any(Error));
            });

            it("should throw error if the eventListener is not a function", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(function () {
                    eventTarget.removeEventListener('click', null);
                }).toThrow(jasmine.any(TypeError));
            });

            it("should remove all references of the eventListener", function () {
                var eventTarget = new StyledElements.ObjectWithEvents(['click']);
                var eventListener = function (element) {};

                eventTarget.addEventListener('click', eventListener);
                eventTarget.addEventListener('click', eventListener);
                eventTarget.removeEventListener('click', eventListener);

                expect(eventTarget.events.click.handlers.length).toEqual(0);
            });
        });
    });

})();
