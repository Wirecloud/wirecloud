/*
 *     Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.
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


(function (se) {

    "use strict";

    describe("Styled Popup Menus", () => {

        afterEach(() => {
            document.querySelectorAll('.se-popup-menu').forEach((element) => {
                element.remove();
            });
        });

        describe("new PopupMenuBase(options)", () => {

            it("should init default status", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.activeItem).toBe(null);
                expect(menu.firstEnabledItem).toBe(null);
                expect(menu.lastEnabledItem).toBe(null);
            });

        });

        describe("append()", () => {

            var menu;

            afterEach(() => {
                menu = new se.PopupMenuBase();
            });

            const test = (description, value) => {
                it("should throw a TypeError exception when child is " + description, () => {
                    expect(() => {
                        menu.append(value);
                    }).toThrowError(TypeError);
                });
            };

            test("null", null);
            test("undefined", null);
            test("5", 5);
            test('"hello world!"', "hello world!");

            it("should allow to append submenu items", () => {
                var ref_element = new se.Button();
                menu.show(ref_element);
                var item = new se.SubMenuItem("Entry");

                expect(menu.append(item)).toBe(menu);

                expect(menu.activeItem).toBe(null);
                expect(menu.firstEnabledItem).toBe(item.menuItem);
                expect(menu.lastEnabledItem).toBe(item.menuItem);
            });

            it("should work on visible menus", () => {
                var listener = jasmine.createSpy("listener");
                var ref_element = new se.Button();
                menu.show(ref_element);
                menu.addEventListener("itemOver", listener);
                var item = new se.MenuItem("Entry");

                expect(menu.append(item)).toBe(menu);

                expect(listener).not.toHaveBeenCalled();
                expect(menu.activeItem).toBe(null);
                expect(menu.firstEnabledItem).toBe(item);
                expect(menu.lastEnabledItem).toBe(item);
            });

            it("should activate child if there are no items and oneActiveAtLeast option is used", () => {
                var listener = jasmine.createSpy("listener");
                menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var ref_element = new se.Button();
                menu.show(ref_element);
                menu.addEventListener("itemOver", listener);
                var item = new se.MenuItem("Entry");

                expect(menu.append(item)).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item);
                expect(menu.activeItem).toBe(item);
                expect(menu.firstEnabledItem).toBe(item);
                expect(menu.lastEnabledItem).toBe(item);
            });

            it("should add dynamic generated items", () => {
                var listener = jasmine.createSpy("listener");
                menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var ref_element = new se.Button();
                menu.show(ref_element);
                menu.addEventListener("itemOver", listener);
                var item1 = new se.MenuItem("Entry");
                item1.enabled = false;
                var item2 = new se.MenuItem("Entry");
                var item3 = new se.Separator();
                var item4 = new se.SubMenuItem("SubMenu");
                var builder = () => {return [item1, item2, item3, item4];};
                var dynamic_items = new se.DynamicMenuItems(builder);

                expect(menu.append(dynamic_items)).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item2);
                expect(menu.activeItem).toBe(item2);
                expect(menu.firstEnabledItem).toBe(item2);
                expect(menu.lastEnabledItem).toBe(item4.menuItem);
            });

        });

        describe("clear()", () => {

            it("should work on empty menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.clear()).toBe(menu);
            });

            it("should work on visible menus", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item = new se.MenuItem("Entry");
                menu.append(item);
                menu.show(ref_element);

                expect(menu.clear()).toBe(menu);
            });

        });

        describe("destroy()", () => {

            it("should work on empty menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.destroy()).toBe(menu);
            });

            it("should work on visible menus", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.Separator();
                menu.append(item1).append(item2);
                menu.show(ref_element);
                spyOn(menu, "hide");

                expect(menu.destroy()).toBe(menu);
                expect(menu.hide).toHaveBeenCalledWith();
            });

        });

        describe("hide()", () => {

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("should work on already hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.hide()).toBe(menu);
            });

            it("should work on visible menus", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                menu.show(ref_element);

                expect(menu.hide()).toBe(menu);
            });

            it("should support WireCloud", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                menu.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterPopup: jasmine.createSpy("_unregisterPopup")
                    }
                };

                expect(menu.hide()).toBe(menu);
                expect(Wirecloud.UserInterfaceManager._unregisterPopup).toHaveBeenCalledWith(menu);
            });

            it("should hide any visible sub-menu", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var submenu = new se.SubMenuItem("Submenu");
                menu.append(submenu).show(ref_element);
                spyOn(submenu, "hide");

                expect(menu.hide()).toBe(menu);
                expect(submenu.hide).toHaveBeenCalledWith();
            });

            it("should handle dynamic items", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item1 = new se.MenuItem("Entry");
                item1.enabled = false;
                spyOn(item1, "destroy");
                var item2 = new se.MenuItem("Entry");
                spyOn(item2, "destroy");
                var item3 = new se.Separator();
                spyOn(item3, "destroy");
                var item4 = new se.SubMenuItem("SubMenu");
                spyOn(item4, "hide");
                spyOn(item4, "destroy");
                var builder = () => {return [item1, item2, item3, item4];};
                var dynamic_items = new se.DynamicMenuItems(builder);
                menu.append(dynamic_items).show(ref_element);

                expect(menu.hide()).toBe(menu);

                expect(item1.destroy).toHaveBeenCalledWith();
                expect(item2.destroy).toHaveBeenCalledWith();
                expect(item3.destroy).toHaveBeenCalledWith();
                expect(item4.hide).toHaveBeenCalledWith();
                expect(item4.destroy).toHaveBeenCalledWith();
            });

        });

        describe("moveCursorDown()", () => {

            it("should ignore hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.moveCursorDown()).toBe(menu);
                expect(menu.activeItem).toBe(null);
            });

            it("should clean active item if current active item is the last one", () => {
                var item = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item).moveCursorDown().addEventListener("itemOver", listener);

                expect(menu.moveCursorDown()).toBe(menu);

                expect(listener).not.toHaveBeenCalled();
                expect(menu.activeItem).toBe(null);
            });

            it("should move down to the first menu item if there is no current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element);
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item1);
                expect(menu.activeItem).toBe(item1);
            });

            it("should move down to the next menu item if there is a current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveCursorDown();
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item2);
            });

            it("should skip disabled menu items", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                item2.enabled = false;
                var item3 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).append(item3).show(ref_element).moveCursorDown();
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item3);
            });

            it("should return back to the first menu item if the current menu item is the last available one", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveCursorDown().moveCursorDown();
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item1);
            });

        });

        describe("moveCursorUp()", () => {

            it("should ignore hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.moveCursorUp()).toBe(menu);
            });

            it("should do nothing if there is only one available menu item", () => {
                // TODO: bad implemented test
                var item = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                menu.append(item);

                expect(menu.moveCursorUp()).toBe(menu);
            });

            it("should activate last menu item if there is no current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element);
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item2);
            });

            it("should move up to the previous menu item if there is a current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveCursorUp();
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item1);
            });

            it("should return back to the last menu item if the current menu item is the last available one", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveCursorUp().moveCursorUp();
                menu.addEventListener("itemOver", listener);

                expect(menu.moveCursorUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(menu, item2);
            });

        });

        describe("moveFocusDown()", () => {

            it("should ignore hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.moveFocusDown()).toBe(menu);
            });

            it("should do nothing if there is only one available menu item", () => {
                // TODO: bad implemented test
                var item = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                menu.append(item);

                expect(menu.moveFocusDown()).toBe(menu);
            });

            it("should move down to the first menu item if there is no current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element);
                item1.addEventListener("focus", listener);

                expect(menu.moveFocusDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item1);
            });

            it("should move down to the next menu item if there is a current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveFocusDown();
                item2.addEventListener("focus", listener);

                expect(menu.moveFocusDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item2);
            });

            it("should return back to the first menu item if the current menu item is the last available one", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveFocusDown().moveFocusDown();
                item1.addEventListener("focus", listener);

                expect(menu.moveFocusDown()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item1);
            });

        });

        describe("moveFocusUp()", () => {

            it("should ignore hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.moveFocusUp()).toBe(menu);
            });

            it("should do nothing if there is only one available menu item", () => {
                // TODO: bad implemented test
                var item = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                menu.append(item);

                expect(menu.moveFocusUp()).toBe(menu);
            });

            it("should activate last menu item if there is no current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element);
                item2.addEventListener("focus", listener);

                expect(menu.moveFocusUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item2);
            });

            it("should move up to the previous menu item if there is a current active menu item", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveFocusUp();
                item1.addEventListener("focus", listener);

                expect(menu.moveFocusUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item1);
            });

            it("should return back to the last menu item if the current menu item is the last available one", () => {
                var ref_element = new se.Button();
                var item1 = new se.MenuItem("Entry");
                var item2 = new se.MenuItem("Entry");
                var menu = new se.PopupMenuBase();
                var listener = jasmine.createSpy("listener");
                menu.append(item1).append(item2).show(ref_element).moveFocusUp().moveFocusUp();
                item2.addEventListener("focus", listener);

                expect(menu.moveFocusUp()).toBe(menu);

                expect(listener).toHaveBeenCalledWith(item2);
            });

        });

        describe("repaint()", () => {

            it("should work on hidden menus", () => {
                var menu = new se.PopupMenuBase();

                expect(menu.repaint()).toBe(menu);
            });

            it("should work on visible menus", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                menu.show(ref_element);

                expect(menu.repaint()).toBe(menu);
            });

        });

        describe("show(refPosition)", () => {

            var ref_element;

            beforeEach(() => {
                ref_element = new se.Button();
            });

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("should support basic string placement", () => {
                var menu = new se.PopupMenuBase({placement: 'top-right'});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-top-right")).toBe(true);
            });

            it("should ignore second calls", () => {
                var menu = new se.PopupMenuBase({placement: 'top-right'});
                menu.show(ref_element);

                expect(menu.show(ref_element)).toBe(menu);

                var elements = document.querySelectorAll('.se-popup-menu');
                expect(elements.length).toBe(1);
            });

            it("left-bottom placement", () => {
                var menu = new se.PopupMenuBase({placement: ['left-bottom']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-left-bottom")).toBe(true);
            });

            it("right-bottom placement", () => {
                var menu = new se.PopupMenuBase({placement: ['right-bottom']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-right-bottom")).toBe(true);
            });

            it("top-left placement", () => {
                var menu = new se.PopupMenuBase({placement: ['top-left']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-top-left")).toBe(true);
            });

            it("top-right placement", () => {
                var menu = new se.PopupMenuBase({placement: ['top-right']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-top-right")).toBe(true);
            });

            it("bottom-left placement", () => {
                var menu = new se.PopupMenuBase({placement: ['bottom-left']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-bottom-left")).toBe(true);
            });

            it("bottom-right placement", () => {
                var menu = new se.PopupMenuBase({placement: ['bottom-right']});

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-bottom-right")).toBe(true);
            });

            it("should support dynamic items", () => {
                var menu = new se.PopupMenuBase({placement: ['bottom-right']});
                var item1 = new se.MenuItem("Entry");
                item1.enabled = false;
                var item2 = new se.MenuItem("Entry");
                var item3 = new se.Separator();
                var item4 = new se.SubMenuItem("SubMenu");
                var builder = () => {return [item1, item2, item3, item4];};
                var dynamic_items = new se.DynamicMenuItems(builder);
                menu.append(dynamic_items);

                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-bottom-right")).toBe(true);
            });

            it("should manage the case where there is not space", () => {
                var menu = new se.PopupMenuBase({
                    placement: ['bottom-right']
                });

                for (let i = 0; i < 50; i++) {
                    menu.append(new se.MenuItem("Entry " + i));
                }
                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(element.classList.contains("se-popup-menu-bottom-right")).toBe(true);
            });

            it("should manage the case where ref_element is a simple coordenate", () => {
                var ref_element = {x: 50, y: 50};
                var menu = new se.PopupMenuBase({
                    placement: ['bottom-right']
                });

                for (let i = 0; i < 50; i++) {
                    menu.append(new se.MenuItem("Entry " + i));
                }
                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
            });

            it("should support WireCloud", () => {
                var menu = new se.PopupMenuBase({
                    placement: ['bottom-right']
                });
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _registerPopup: jasmine.createSpy("_registerPopup")
                    }
                };
                expect(menu.show(ref_element)).toBe(menu);

                var element = document.querySelector('.se-popup-menu');
                expect(element).not.toBe(null);
                expect(Wirecloud.UserInterfaceManager._registerPopup).toHaveBeenCalledWith(menu);
            });

        });

        describe("should react to the following events", () => {

            it("mouseenter on a item", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item = new se.MenuItem("Entry");
                var listener = jasmine.createSpy("listener");
                menu.append(item).show(ref_element).addEventListener("itemOver", listener);

                item.dispatchEvent("mouseenter");

                expect(listener).toHaveBeenCalledWith(menu, item);
                expect(menu.activeItem).toBe(item);
            });

            it("mouseleave on an active item", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item = new se.MenuItem("Entry");
                var listener = jasmine.createSpy("listener");
                menu.append(item).show(ref_element).moveCursorDown().addEventListener("itemOver", listener);
                spyOn(item, "deactivate");

                item.dispatchEvent("mouseleave");

                expect(listener).not.toHaveBeenCalled();
                expect(item.deactivate).toHaveBeenCalledWith();
                expect(menu.activeItem).toBe(null);
            });

            it("should ignore mouseleave when using the oneActiveAtLeast option", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var item = new se.MenuItem("Entry");
                var listener = jasmine.createSpy("listener");
                menu.append(item).show(ref_element).addEventListener("itemOver", listener);
                spyOn(item, "deactivate");

                item.dispatchEvent("mouseleave");

                expect(listener).not.toHaveBeenCalled();
                expect(item.deactivate).not.toHaveBeenCalledWith();
            });

            it("should manage complex mouseleave cases when not using the oneActiveAtLeast option", () => {
                // E.g.
                // 1. mouseenter item1
                // 2. press key down (moveCursorDown) => activate item2
                // 3. mouseleave item1
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase();
                var item1 = new se.MenuItem("Entry 1");
                var item2 = new se.MenuItem("Entry 2");
                var listener = jasmine.createSpy("listener");
                menu
                    .append(item1).append(item2).show(ref_element)
                    .moveCursorDown().moveCursorDown()
                    .addEventListener("itemOver", listener);
                spyOn(item1, "deactivate");
                spyOn(item2, "deactivate");

                item1.dispatchEvent("mouseleave");

                expect(listener).not.toHaveBeenCalled();
                expect(item1.deactivate).toHaveBeenCalledWith();
                expect(item2.deactivate).not.toHaveBeenCalled();
                expect(menu.activeItem).toBe(item2);
            });

            it("should manage complex mouseleave cases when using the oneActiveAtLeast option", () => {
                // E.g.
                // 1. mouseenter item1
                // 2. press key down (moveCursorDown) => activate item2
                // 3. mouseleave item1
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var item1 = new se.MenuItem("Entry 1");
                var item2 = new se.MenuItem("Entry 2");
                var listener = jasmine.createSpy("listener");
                menu
                    .append(item1).append(item2).show(ref_element)
                    .moveCursorDown()
                    .addEventListener("itemOver", listener);
                spyOn(item1, "deactivate");
                spyOn(item2, "deactivate");

                item1.dispatchEvent("mouseleave");

                expect(listener).not.toHaveBeenCalled();
                expect(item1.deactivate).toHaveBeenCalledWith();
                expect(item2.deactivate).not.toHaveBeenCalled();
                expect(menu.activeItem).toBe(item2);
            });

            it("should manage blur events", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var item1 = new se.MenuItem("Entry 1");
                var item2 = new se.MenuItem("Entry 2");
                menu
                    .append(item1).append(item2).show(ref_element)
                    .moveFocusDown();

                item1.dispatchEvent("blur");
            });

            it("should manage blur events", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var item1 = new se.MenuItem("Entry 1");
                var item2 = new se.MenuItem("Entry 2");
                menu
                    .append(item1).append(item2).show(ref_element)
                    .moveFocusDown();

                item2.dispatchEvent("blur");
            });

            it("should manage click events on submenus", () => {
                var ref_element = new se.Button();
                var menu = new se.PopupMenuBase({oneActiveAtLeast: true});
                var item = new se.SubMenuItem("Entry");
                menu
                    .append(item).show(ref_element)
                    .moveFocusDown();

                item.menuItem.dispatchEvent("click");
            });

        });

    });

})(StyledElements);
