/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    describe("Styled ObjectWithEvents", () => {

        describe("new ObjectWithEvents([eventTypes])", () => {

            it("eventTypes is not required", () => {
                const eventTarget = new StyledElements.ObjectWithEvents();
                expect(Object.keys(eventTarget.events)).toEqual([]);
            });

            it("should create an instance given an eventType list", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                expect(Object.keys(eventTarget.events)).toEqual(['click']);
            });

        });

        describe("addEventListener(eventType, eventListener)", () => {

            it("should throw error if the eventType does not exist", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};

                expect(() => {
                    eventTarget.addEventListener('focus', eventListener);
                }).toThrow(jasmine.any(Error));
            });

            it("should throw error if the eventListener is not a function", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(() => {
                    eventTarget.addEventListener('click', null);
                }).toThrow(jasmine.any(TypeError));
            });

            it("should add more than once the same eventListener", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};

                eventTarget.addEventListener('click', eventListener);
                eventTarget.addEventListener('click', eventListener);

                expect(eventTarget.events.click.handlers).toEqual([eventListener, eventListener]);
            });
        });

        describe("clearEventListeners([eventType])", () => {

            it("should throw error if eventType does not exist", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(() => {
                    eventTarget.clearEventListeners('focus');
                }).toThrow(jasmine.any(Error));
            });

            it("should clear all the listeners for a given event", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                eventTarget.addEventListener("click", () => {});
                eventTarget.addEventListener("click", () => {});

                eventTarget.clearEventListeners("click");

                expect(eventTarget.events.click.handlers).toEqual([]);
            });

            it("should clear all the listeners of all the events if not providing an event name", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(["click", "focus"]);
                eventTarget.addEventListener("click", () => {});
                eventTarget.addEventListener("focus", () => {});

                eventTarget.clearEventListeners();

                expect(eventTarget.events.click.handlers).toEqual([]);
                expect(eventTarget.events.focus.handlers).toEqual([]);
            });

        });

        describe("dispatchEvent(eventType[, ...args])", () => {

            it("should throw error if the eventType does not exist", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(() => {
                    eventTarget.dispatchEvent('focus');
                }).toThrow(jasmine.any(Error));
            });

            it("should allow adding an event listeners while the event is dispatching", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener1 = (element) => {
                    eventTarget.addEventListener('click', eventListener2);
                };
                const eventListener2 = jasmine.createSpy('eventListener2');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.dispatchEvent('click');

                expect(eventListener2).toHaveBeenCalledWith(eventTarget);
            });

            it("should allow removing event listeners while the event is dispatching", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener1 = (element) => {
                    eventTarget.removeEventListener('click', eventListener2);
                };
                const eventListener2 = jasmine.createSpy('eventListener2');
                const eventListener3 = jasmine.createSpy('eventListener3');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.addEventListener('click', eventListener2);
                eventTarget.addEventListener('click', eventListener3);

                eventTarget.dispatchEvent('click');

                expect(eventListener2).not.toHaveBeenCalled();
                expect(eventListener3).toHaveBeenCalledWith(eventTarget);
            });

            it("should call all eventListener listeners despite whether one of them thrown an error", () => {
                spyOn(window.console, "error");
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener1 = jasmine.createSpy('eventListener1').and.throwError();
                const eventListener2 = jasmine.createSpy('eventListener2');

                eventTarget.addEventListener('click', eventListener1);
                eventTarget.addEventListener('click', eventListener2);

                eventTarget.dispatchEvent('click');

                expect(eventListener1).toHaveBeenCalledWith(eventTarget);
                expect(eventListener2).toHaveBeenCalledWith(eventTarget);
                expect(window.console.error).toHaveBeenCalledWith(jasmine.any(Error));
            });
        });

        describe("off(eventType, eventListener", () => {

            it("should be a proxy to removeEventListener", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};
                const response = Object.freeze({});
                spyOn(eventTarget, "removeEventListener").and.returnValue(response);

                const r = eventTarget.off("click", eventListener);

                expect(r).toBe(response);
                expect(eventTarget.removeEventListener).toHaveBeenCalledWith("click", eventListener);
            });

        });

        describe("on(eventType, eventListener", () => {

            it("should be a proxy to addEventListener", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};
                const response = Object.freeze({});
                spyOn(eventTarget, "addEventListener").and.returnValue(response);

                const r = eventTarget.on("click", eventListener);

                expect(r).toBe(response);
                expect(eventTarget.addEventListener).toHaveBeenCalledWith("click", eventListener);
            });

        });

        describe("removeEventListener(eventType, eventListener)", () => {

            it("should throw error if the eventType does not exist", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};

                expect(() => {
                    eventTarget.removeEventListener('focus', eventListener);
                }).toThrow(jasmine.any(Error));
            });

            it("should throw error if the eventListener is not a function", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);

                expect(() => {
                    eventTarget.removeEventListener('click', null);
                }).toThrow(jasmine.any(TypeError));
            });

            it("should remove all references of the eventListener", () => {
                const eventTarget = new StyledElements.ObjectWithEvents(['click']);
                const eventListener = (element) => {};

                eventTarget.addEventListener('click', eventListener);
                eventTarget.addEventListener('click', eventListener);
                eventTarget.removeEventListener('click', eventListener);

                expect(eventTarget.events.click.handlers.length).toEqual(0);
            });
        });
    });

})();
