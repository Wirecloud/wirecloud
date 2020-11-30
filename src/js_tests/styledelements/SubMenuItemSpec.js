/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

    describe("Styled SubMenuItem", () => {

        let item;

        afterEach(() => {
            item = null;
        });

        describe("new SubMenuItem(title[, options])", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.SubMenuItem("item");  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work only by providing a title", () => {
                let item = new se.SubMenuItem("item");
                expect(item).not.toEqual(null);
            });

        });

        describe("addEventListener(eventId, listener)", () => {

            const test = function test(eventId, menuitem) {
                it("should " + (menuitem ? "shortcut" : "handle") + " " + eventId + " events", () => {
                    item = new se.SubMenuItem("submenu");
                    let listener = jasmine.createSpy("listener");
                    spyOn(item.menuitem, "addEventListener");
                    spyOn(StyledElements.PopupMenuBase.prototype, "addEventListener").and.returnValue(item);

                    expect(item.addEventListener(eventId, listener)).toBe(item);

                    if (menuitem) {
                        expect(item.menuitem.addEventListener).toHaveBeenCalledWith(eventId, listener);
                        expect(StyledElements.PopupMenuBase.prototype.addEventListener).not.toHaveBeenCalled();
                    } else {
                        expect(item.menuitem.addEventListener).not.toHaveBeenCalled();
                        expect(StyledElements.PopupMenuBase.prototype.addEventListener).toHaveBeenCalledWith(eventId, listener);
                    }
                });
            };

            test('mouseenter', true);
            test('mouseleave', true);
            test('click', true);
            test('blur', true);
            test('focus', true);

            test('visibilityChange', false);
            test('itemOver', false);
        });

        describe("addIconClass(iconClass)", () => {

            it("should be a shortcut", () => {
                item = new se.SubMenuItem("submenu");
                spyOn(item.menuitem, "addIconClass");

                expect(item.addIconClass("class")).toBe(item);

                expect(item.menuitem.addIconClass).toHaveBeenCalledWith("class");
            });

        });

        describe("disable()", () => {

            it("should be a shortcut", () => {
                item = new se.SubMenuItem("submenu");
                spyOn(item.menuitem, "disable");

                expect(item.disable()).toBe(item);

                expect(item.menuitem.disable).toHaveBeenCalledWith();
            });

        });

        describe("enable()", () => {

            it("should be a shortcut", () => {
                item = new se.SubMenuItem("submenu");
                spyOn(item.menuitem, "enable");

                expect(item.enable()).toBe(item);

                expect(item.menuitem.enable).toHaveBeenCalledWith();
            });

        });

        describe("setDisabled(disabled)", () => {

            it("should be a shortcut", () => {
                item = new se.SubMenuItem("submenu");
                spyOn(item.menuitem, "setDisabled");

                expect(item.setDisabled(true)).toBe(item);

                expect(item.menuitem.setDisabled).toHaveBeenCalledWith(true);
            });

        });

        describe("destroy()", () => {

            it("should work", () => {
                item = new se.SubMenuItem("submenu");

                expect(item.destroy()).toBe(undefined);
            });

        });

        describe("_menuItemCallback(menuitem)", () => {

            it("should support menu parents", () => {
                item = new se.SubMenuItem("submenu");
                item.parentMenu = {
                    hide: jasmine.createSpy("hide"),
                    _context: "ab"
                };
                let child = {
                    run: jasmine.createSpy("run")
                };

                item._menuItemCallback(child);

                expect(child.run).toHaveBeenCalledWith("ab");
            });

            it("should support submenu parents", () => {
                item = new se.SubMenuItem("submenu");
                item.parentMenu = new se.SubMenuItem("parent");
                item.parentMenu.parentMenu = {
                    hide: jasmine.createSpy("hide"),
                    _context: "abc"
                };
                let child = {
                    run: jasmine.createSpy("run")
                };

                item._menuItemCallback(child);

                expect(child.run).toHaveBeenCalledWith("abc");
            });

        });

    });

})(StyledElements);
