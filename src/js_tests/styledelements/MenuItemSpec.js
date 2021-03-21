/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    describe("Styled MenuItem", () => {

        let menuItem;

        afterEach(() => {
            menuItem = null;
        });

        describe("MenuItem(title[, options, context])", () => {

            it("Should be created when no parameters are received", () => {
                menuItem = new StyledElements.MenuItem();
                expect(menuItem).toBeTruthy();
            });

            it("Should be created when only title is set", () => {
                menuItem = new StyledElements.MenuItem("customTitle");
                expect(menuItem).toBeTruthy();
                expect(menuItem.title).toEqual("customTitle");
            });

            it("Should allow title to be a StyledElement", () => {
                const textArea = new StyledElements.TextArea();
                menuItem = new StyledElements.MenuItem(textArea);

                expect(menuItem).toBeTruthy();
                expect(menuItem.wrapperElement.querySelector(".se-popup-menu-item-title").innerHTML).toBe("<textarea class=\"se-text-area\"></textarea>");
            });

            it("Should allow to use the handler option", () => {
                const listener = jasmine.createSpy('listener');
                menuItem = new StyledElements.MenuItem("customTitle", {handler: listener});
                expect(menuItem).toBeTruthy();

                expect(menuItem.run).toBe(listener);
            });

            it("Should allow to use the handler parameter (backwards compability)", () => {
                const listener = jasmine.createSpy('listener');
                menuItem = new StyledElements.MenuItem("customTitle", listener);
                expect(menuItem).toBeTruthy();

                expect(menuItem.run).toBe(listener);
            });

            it("Should allow to use the context option", () => {
                const context = {};
                menuItem = new StyledElements.MenuItem("customTitle", {context: context});
                expect(menuItem).toBeTruthy();

                expect(menuItem.context).toBe(context);
            });

            it("Should allow to use the context parameter (backwards compability)", () => {
                const context = {};
                const listener = jasmine.createSpy('listener');
                menuItem = new StyledElements.MenuItem("customTitle", listener, context);
                expect(menuItem).toBeTruthy();

                expect(menuItem.run).toBe(listener);
                expect(menuItem.context).toBe(context);
            });

            it("Should allow to use the enabled option", () => {
                menuItem = new StyledElements.MenuItem("customTitle", {enabled: false});
                expect(menuItem).toBeTruthy();

                expect(menuItem.enabled).toBe(false);
            });

            it("Should allow to use the iconClass option", () => {
                const iconClass = "arrow";
                menuItem = new StyledElements.MenuItem("customTitle", {iconClass: iconClass});
                expect(menuItem).toBeTruthy();

                const iconelement = menuItem.wrapperElement.querySelector(".se-icon");
                expect(iconelement.className).toBe("se-icon " + iconClass);
            });

        });

        describe("addIconClass(iconClass)", () => {

            let iconClass;

            it("Should add icon", () => {
                menuItem = new StyledElements.MenuItem();
                iconClass = "arrow";

                expect(menuItem.wrapperElement.querySelector(".se-icon")).toBe(null);
                menuItem.addIconClass(iconClass);
                const iconelement = menuItem.wrapperElement.querySelector(".se-icon");
                expect(iconelement.className).toBe("se-icon " + iconClass);
            });

            it("Should overwrite previous icon", () => {
                menuItem = new StyledElements.MenuItem();
                iconClass = "arrow";
                menuItem.addIconClass(iconClass);
                iconClass = "open";
                menuItem.addIconClass(iconClass);
                const iconelement = menuItem.wrapperElement.querySelector(".se-icon");
                expect(iconelement.className).toBe("se-icon " + iconClass);
            });

        });

        describe("click()", () => {

            it("should sent click events on enabled elements", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("click", listener);

                expect(menuItem.click()).toBe(menuItem);

                expect(listener).toHaveBeenCalledWith(menuItem);
                expect(listener).toHaveBeenCalledTimes(1);
            });

            it("should ignore disabled elements", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("click", listener);

                expect(menuItem.click()).toBe(menuItem);

                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("focus()", () => {

            it("should focus on enabled elements", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("focus", listener);

                expect(menuItem.focus()).toBe(menuItem);

                expect(listener).toHaveBeenCalledWith(menuItem);
                expect(listener).toHaveBeenCalledTimes(1);
            });

            it("should ignore disabled elements", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("focus", listener);

                expect(menuItem.focus()).toBe(menuItem);

                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("setDescription(description)", () => {

            it("should work with strings", () => {
                menuItem = new StyledElements.MenuItem();

                expect(menuItem.setDescription("Hello World")).toBe(menuItem);

                const descriptionelement = menuItem.wrapperElement.querySelector(".se-popup-menu-item-description");
                expect(descriptionelement).toBeTruthy();
                expect(menuItem.description).toBe("Hello World");
            });

            it("should allow second calls", () => {
                menuItem = new StyledElements.MenuItem();

                expect(menuItem.setDescription("Hi").setDescription("Hello World")).toBe(menuItem);

                const descriptionelement = menuItem.wrapperElement.querySelector(".se-popup-menu-item-description");
                expect(descriptionelement).toBeTruthy();
                expect(menuItem.description).toBe("Hello World");
            });

            it("should work with StyledElements", () => {
                const textArea = new StyledElements.TextArea();
                menuItem = new StyledElements.MenuItem();
                menuItem.setDescription(textArea);

                const descriptionelement = menuItem.wrapperElement.querySelector(".se-popup-menu-item-description");
                expect(descriptionelement.innerHTML).toBe("<textarea class=\"se-text-area\"></textarea>");
            });

        });

        describe("should handle events", () => {

            it("click", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.wrapperElement.dispatchEvent(new MouseEvent("click"));
            });

            it("mouseenter (enabled)", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("mouseenter", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("mouseenter"));

                expect(listener).toHaveBeenCalledWith(menuItem);
            });

            it("mouseenter (disabled)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("mouseenter", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("mouseenter"));

                expect(listener).not.toHaveBeenCalled();
            });

            it("mouseleave (enabled)", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("mouseleave", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("mouseleave"));

                expect(listener).toHaveBeenCalledWith(menuItem);
            });

            it("mouseleave (disabled)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("mouseleave", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("mouseleave"));

                expect(listener).not.toHaveBeenCalled();
            });

            it("focus (enabled)", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("focus", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("focus"));

                expect(listener).toHaveBeenCalledWith(menuItem);
            });

            it("focus (disabled)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("focus", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("focus"));

                expect(listener).not.toHaveBeenCalled();
            });

            it("blur (enabled)", () => {
                menuItem = new StyledElements.MenuItem();
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("blur", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("blur"));

                expect(listener).toHaveBeenCalledWith(menuItem);
            });

            it("blur (disabled)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.enabled = false;
                const listener = jasmine.createSpy("listener");
                menuItem.addEventListener("blur", listener);

                menuItem.wrapperElement.dispatchEvent(new MouseEvent("blur"));

                expect(listener).not.toHaveBeenCalled();
            });

            it("keydown (Enter)", () => {
                menuItem = new StyledElements.MenuItem();
                spyOn(menuItem, "click");

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter"}));

                expect(menuItem.click).toHaveBeenCalledWith();
            });

            it("keydown (Space)", () => {
                menuItem = new StyledElements.MenuItem();
                spyOn(menuItem, "click");

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: " "}));

                expect(menuItem.click).toHaveBeenCalledWith();
            });

            it("keydown (Escape)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    hide: jasmine.createSpy('hide')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}));

                expect(menuItem.parentElement.hide).toHaveBeenCalledWith();
            });

            it("keydown (ArrowLeft)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    hide: jasmine.createSpy('hide')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}));

                expect(menuItem.parentElement.hide).toHaveBeenCalledWith();
            });

            it("keydown (ArrowLeft, SubMenuItem)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = new StyledElements.SubMenuItem();
                spyOn(menuItem.parentElement, "hide");
                spyOn(menuItem.parentElement.menuitem, "focus");

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft"}));

                expect(menuItem.parentElement.hide).toHaveBeenCalledWith();
                expect(menuItem.parentElement.menuitem.focus).toHaveBeenCalledWith();
            });

            it("keydown (ArrowUp)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    moveFocusUp: jasmine.createSpy('moveFocusUp')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowUp"}));

                expect(menuItem.parentElement.moveFocusUp).toHaveBeenCalledWith();
            });

            it("keydown (Tab)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    moveFocusDown: jasmine.createSpy('moveFocusDown')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab"}));

                expect(menuItem.parentElement.moveFocusDown).toHaveBeenCalledWith();
            });

            it("keydown (Tab, shift)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    moveFocusUp: jasmine.createSpy('moveFocusUp')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab", shiftKey: true}));

                expect(menuItem.parentElement.moveFocusUp).toHaveBeenCalledWith();
            });

            it("keydown (Tab, submenu)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.submenu = {
                    isVisible: jasmine.createSpy("isVisible").and.returnValue(true),
                    moveFocusDown: jasmine.createSpy("moveFocusDown")
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab"}));

                expect(menuItem.submenu.isVisible).toHaveBeenCalledWith();
                expect(menuItem.submenu.moveFocusDown).toHaveBeenCalledWith();
            });

            it("keydown (ArrowDown)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    moveFocusDown: jasmine.createSpy('moveFocusDown')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown"}));

                expect(menuItem.parentElement.moveFocusDown).toHaveBeenCalledWith();
            });

            it("keydown (ArrowRight)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.parentElement = {
                    moveFocusDown: jasmine.createSpy('moveFocusDown')
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}));

                expect(menuItem.parentElement.moveFocusDown).not.toHaveBeenCalled();
            });

            it("keydown (ArrowRight, submenu)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.submenu = {
                    hasEnabledItem: jasmine.createSpy("hasEnabledItem").and.returnValue(true),
                    moveFocusDown: jasmine.createSpy("moveFocusDown"),
                    show: jasmine.createSpy("show")
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}));

                expect(menuItem.submenu.moveFocusDown).toHaveBeenCalledWith();
            });

            it("keydown (ArrowRight, submenu with not enabled items)", () => {
                menuItem = new StyledElements.MenuItem();
                menuItem.submenu = {
                    hasEnabledItem: jasmine.createSpy("hasEnabledItem").and.returnValue(false),
                    moveFocusDown: jasmine.createSpy("moveFocusDown"),
                    show: jasmine.createSpy("show")
                };

                menuItem.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}));

                expect(menuItem.submenu.moveFocusDown).not.toHaveBeenCalled();
            });

        });

    });

})();
