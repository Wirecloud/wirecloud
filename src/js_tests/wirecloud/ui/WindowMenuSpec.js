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

/* globals StyledElements, Wirecloud */

(function (ns, se) {

    "use strict";

    describe("WindowMenu", () => {

        beforeEach(() => {
            spyOn(Wirecloud.UserInterfaceManager, "_registerRootWindowMenu");
            spyOn(Wirecloud.UserInterfaceManager, "_registerPopup");
        });

        describe("new WindowMenu([title, extra_class, events])", () => {

            it("no parameter is required", () => {
                const dialog = new ns.WindowMenu();

                expect(Object.keys(dialog.events)).toEqual(["show", "hide"]);
            });

            it("show and hide events are required", () => {
                const dialog = new ns.WindowMenu(null, null, ["event1", "event2"]);

                expect(Object.keys(dialog.events)).toEqual(["event1", "event2", "show", "hide"]);
            });

            it("show and hide events should be no duplicated", () => {
                const dialog = new ns.WindowMenu(null, null, ["event1", "show", "hide"]);

                expect(Object.keys(dialog.events)).toEqual(["event1", "show", "hide"]);
            });

        });

        describe("getStylePosition()", () => {

            it("should return NaN for hidden dialogs", () => {
                const dialog = new ns.WindowMenu();

                expect(dialog.getStylePosition()).toEqual({
                    posX: NaN,
                    posY: NaN
                });
            });

            it("should return numbers for visible dialogs", () => {
                const dialog = new ns.WindowMenu();
                dialog.show();

                expect(dialog.getStylePosition()).toEqual({
                    posX: jasmine.any(Number),
                    posY: jasmine.any(Number)
                });
            });

        });

        describe("hide()", () => {

            it("should do nothing if already hidden", () => {
                const listener = jasmine.createSpy();
                const dialog = new ns.WindowMenu();
                dialog.addEventListener("hide", listener);

                expect(dialog.hide()).toBe(dialog);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should hide child windows", () => {
                const listener = jasmine.createSpy();
                const root = new ns.WindowMenu();
                const dialog = new ns.WindowMenu();
                dialog.addEventListener("hide", listener);
                root.show();
                dialog.show(root);

                expect(root.hide()).toBe(root);

                expect(listener).toHaveBeenCalledWith(dialog);
            });

            it("should work with child windows", () => {
                const listener1 = jasmine.createSpy();
                const listener2 = jasmine.createSpy();
                const root = new ns.WindowMenu();
                const dialog = new ns.WindowMenu();
                root.addEventListener("hide", listener1);
                dialog.addEventListener("hide", listener2);
                root.show();
                dialog.show(root);

                expect(dialog.hide()).toBe(dialog);

                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).toHaveBeenCalledWith(dialog);
            });

        });

        describe("setPosition(coordinates)", () => {

            it("should do nothing for hidden dialogs", () => {
                const dialog = new ns.WindowMenu();

                expect(dialog.setPosition({
                    posX: 10,
                    posY: 15
                })).toBe(dialog);
            });

            it("should set the position for visible dialogs", () => {
                const dialog = new ns.WindowMenu();
                dialog.show();

                expect(dialog.setPosition({
                    posX: 10,
                    posY: 15
                })).toBe(dialog);
            });

        });

        describe("show([parent])", () => {

            it("should work for the root window", () => {
                const listener = jasmine.createSpy();
                const dialog = new ns.WindowMenu();
                dialog.addEventListener("show", listener);

                expect(dialog.show()).toBe(dialog);

                expect(listener).toHaveBeenCalledWith(dialog);
            });

            it("should work for child windows", () => {
                const listener = jasmine.createSpy();
                const root = new ns.WindowMenu();
                const dialog = new ns.WindowMenu();
                dialog.addEventListener("show", listener);
                root.show();

                expect(dialog.show(root)).toBe(dialog);

                expect(listener).toHaveBeenCalledWith(dialog);
            });

            it("only a child window is allowed", () => {
                const listener = jasmine.createSpy();
                const root = new ns.WindowMenu();
                const dialog1 = new ns.WindowMenu();
                const dialog2 = new ns.WindowMenu();
                dialog2.addEventListener("show", listener);
                root.show();
                dialog1.show(root);

                expect(() => {
                    dialog2.show(root);
                }).toThrowError(TypeError);

                expect(listener).not.toHaveBeenCalled();
            });

            it("windows cannot be configured to be child of themeselves", () => {
                const listener = jasmine.createSpy();
                const dialog = new ns.WindowMenu();
                dialog.show();
                dialog.addEventListener("show", listener);

                expect(() => {
                    dialog.show(dialog);
                }).toThrowError(TypeError);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should do nothing if the window is already visible", () => {
                const listener = jasmine.createSpy();
                const dialog = new ns.WindowMenu();
                dialog.show();
                dialog.addEventListener("show", listener);

                expect(dialog.show()).toBe(dialog);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should throw an exception if the window is already visible and has a different parent", () => {
                const listener = jasmine.createSpy();
                const root = new ns.WindowMenu();
                const dialog = new ns.WindowMenu();
                dialog.show(root);
                dialog.addEventListener("show", listener);

                expect(() => {
                    dialog.show();
                }).toThrowError(TypeError);

                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("setFocus()", () => {

            it("should provide an empty implementation", () => {
                const dialog = new ns.WindowMenu();

                expect(dialog.setFocus()).toBe(dialog);
            });

        });

        describe("destroy() [deprecated]", () => {

            it("should provide a default implementation", () => {
                const dialog = new ns.WindowMenu();
                spyOn(dialog, "hide");

                expect(dialog.destroy()).toBe(undefined);

                expect(dialog.hide).toHaveBeenCalledWith();
            });

        });

    });

})(Wirecloud.ui, StyledElements);
