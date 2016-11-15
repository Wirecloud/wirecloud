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

    describe("Styled PopupMenuBase", function () {
        var popupMenu;

        describe("PopupMenuBase(options)", function () {
            it("Should be createdwith no options", function () {
                popupMenu = new StyledElements.PopupMenu();
                expect(popupMenu).toBeTruthy();
            });
        });

        describe("append(child)", function () {
            describe("Should work with MenuItem instances", function () {
                var menuItem1, menuItem2;
                var empty = function empty() {
                };
                beforeAll(function () {
                    popupMenu = new StyledElements.PopupMenu();
                    menuItem1 = new StyledElements.MenuItem("First", empty);
                    menuItem2 = new StyledElements.MenuItem("Second", empty, {test: "helloWorld"});
                    spyOn(menuItem1, "dispatchEvent").and.callThrough();
                    spyOn(menuItem1, "run").and.callThrough();
                    spyOn(menuItem2, "dispatchEvent").and.callThrough();
                    spyOn(menuItem2, "run").and.callThrough();
                });

                it("Should append them", function () {
                    popupMenu.append(menuItem1);
                    expect(popupMenu._items.length).toBe(1);
                    popupMenu.append(menuItem2);
                    expect(popupMenu._items.length).toBe(2);
                });

                it("Should receive menuItem's click callbacks", function () {
                    menuItem1.click();
                    expect(menuItem1.dispatchEvent).toHaveBeenCalled();
                    expect(menuItem2.dispatchEvent).not.toHaveBeenCalled();
                    expect(menuItem1.run).toHaveBeenCalled();
                    expect(menuItem2.run).not.toHaveBeenCalled();
                });

                it("Should handle menuItem custom context", function () {
                    menuItem2.click();
                    expect(menuItem2.dispatchEvent).toHaveBeenCalled();
                    expect(menuItem2.run).toHaveBeenCalledWith(null, {test: "helloWorld"});
                });

                it("Should handle PopupMenu custom context", function () {
                    expect(popupMenu).toBeTruthy();
                    popupMenu.setContext({test: "helloWorld"});
                    menuItem2.run.calls.reset();
                    menuItem2.click();
                    expect(menuItem2.run).toHaveBeenCalledWith({test: "helloWorld"}, {test: "helloWorld"});
                });
            });
        });

        describe("appendSeparator()", function () {
            it("Should be appended", function () {
                popupMenu = new StyledElements.PopupMenu();
                popupMenu.appendSeparator();
                expect(popupMenu._items.length).toBe(1);
                popupMenu.appendSeparator();
                expect(popupMenu._items.length).toBe(2);
            });
        });

        it("Should handle visibility", function () {
            popupMenu = new StyledElements.PopupMenu();
            expect(popupMenu).toBeTruthy();
            expect(popupMenu.wrapperElement.classList[1]).toEqual("hidden");
        });

    });
})();
