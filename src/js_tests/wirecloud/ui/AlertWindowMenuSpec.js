/*
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

/* globals StyledElements, Wirecloud */

(function (ns, se) {

    "use strict";

    describe("AlertWindowMenu(options)", () => {

        it("options is required", () => {
            expect(() => {
                new ns.AlertWindowMenu();
            }).toThrowError();
        });

        it("options cannot be null", () => {
            expect(() => {
                new ns.AlertWindowMenu(null);
            }).toThrowError();
        });

        it("options (message) is required", () => {
            expect(() => {
                new ns.AlertWindowMenu({});
            }).toThrowError(TypeError);
        });

        it("options can be a message string", () => {
            new ns.AlertWindowMenu("message");
        });

        it("options can be a StyledElement", () => {
            new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
        });

    });

    describe("setFocus()", () => {

        it("should focus cancel button", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            spyOn(dialog.cancelButton, "focus");
            expect(dialog.cancelButton.focus).not.toHaveBeenCalled();

            dialog.setFocus();

            expect(dialog.cancelButton.focus).toHaveBeenCalled();
        });

    });

    describe("setHandler(acceptHandler[, cancelHandler])", () => {

        it("should support simple success actions", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            const listener = jasmine.createSpy('listener');
            spyOn(dialog, 'hide');

            dialog.setHandler(listener);
            dialog.acceptButton.click();

            expect(listener).toHaveBeenCalled();
            expect(dialog.hide).toHaveBeenCalled();
        });

        it("should support asynchronous success actions", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            const then_mock = jasmine.createSpy('then');
            const listener = jasmine.createSpy('listener').and.callFake(() => {
                return {
                    then: then_mock
                };
            });
            spyOn(dialog, 'hide');

            dialog.setHandler(listener);
            dialog.acceptButton.click();

            expect(listener).toHaveBeenCalled();
            expect(dialog.acceptButton.hasClassName('busy')).toBe(true);

            expect(dialog.hide).not.toHaveBeenCalled();

            // Call to the onFulfilled handler
            then_mock.calls.argsFor(0)[0]();
            expect(dialog.hide).toHaveBeenCalled();
        });

        it("should handle errors in asynchronous success actions", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            const then_mock = jasmine.createSpy('then');
            const listener = jasmine.createSpy('listener').and.callFake(() => {
                return {
                    then: then_mock
                };
            });
            spyOn(dialog, 'hide');

            dialog.setHandler(listener);
            dialog.acceptButton.click();

            expect(listener).toHaveBeenCalled();
            expect(dialog.acceptButton.hasClassName('busy')).toBe(true);

            expect(dialog.hide).not.toHaveBeenCalled();

            // call to the onRejected handler
            then_mock.calls.argsFor(0)[1](new Error("Connection Error"));
            expect(dialog.acceptButton.hasClassName('busy')).toBe(false);
            expect(dialog.hide).not.toHaveBeenCalled();
        });

        it("cancel should be optional", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            const slistener = jasmine.createSpy('listener');
            spyOn(dialog, 'hide');

            dialog.setHandler(slistener);
            dialog.cancelButton.click();

            expect(slistener).not.toHaveBeenCalled();
            expect(dialog.hide).toHaveBeenCalled();
        });

        it("should support simple cancel actions", () => {
            const dialog = new ns.AlertWindowMenu(new se.Fragment("<div>hello world!</div>"));
            const slistener = jasmine.createSpy('listener');
            const listener = jasmine.createSpy('listener');
            spyOn(dialog, 'hide');

            dialog.setHandler(slistener, listener);
            dialog.cancelButton.click();

            expect(listener).toHaveBeenCalled();
            expect(dialog.hide).toHaveBeenCalled();
        });

    });

})(Wirecloud.ui, StyledElements);
