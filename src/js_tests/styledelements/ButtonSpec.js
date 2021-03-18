/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals FocusEvent, KeyboardEvent, MouseEvent, StyledElements */


(function () {

    "use strict";

    describe("Styled Buttons", function () {

        let dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        describe("new Button([options])", function () {

            it("can be created without passing any option", function () {
                const element = new StyledElements.Button();
                expect(element.wrapperElement.textContent).toBe("");
                expect(element.state).toBe("");
                expect(element.depth).toBe(null);
                expect(element.wrapperElement.className).toBe("se-btn");
            });

            it("can be created only with a text label", function () {
                const element = new StyledElements.Button({text: "hello world!!"});
                expect(element.wrapperElement.textContent).toBe("hello world!!");
            });

            it("should support the id option", function () {
                const element = new StyledElements.Button({id: "my-button"});
                expect(element.wrapperElement.getAttribute('id')).toBe("my-button");
            });

            it("should handle initial depth", function () {
                const element = new StyledElements.Button({text: "hello world!!", depth: 2});
                expect(element.depth).toBe(2);
                expect(element.hasClassName('z-depth-2')).toBeTruthy();
            });

        });

        it("should handle depth changes", function () {

            const element = new StyledElements.Button({text: "hello world!!", depth: 2});
            element.depth = 1;
            expect(element.depth).toBe(1);

        });

        it("should handle depth changes with the same value", function () {

            const element = new StyledElements.Button({text: "hello world!!", depth: 2});
            element.depth = 2;
            expect(element.depth).toBe(2);

        });

        it("should handle depth cleaning", function () {

            const element = new StyledElements.Button({text: "hello world!!", depth: 3});
            element.depth = null;
            expect(element.depth).toBe(null);

        });

        it("should handle bad depth values", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            expect(element.depth = "bad", null);
            expect(element.depth).toBe(null);

        });

        it("should handle initial state", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            expect(element.state).toBe("primary");

        });

        it("should handle state changes", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "danger";
            expect(element.state).toBe("danger");

        });

        it("should handle state changes with the same value", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "primary";
            expect(element.state).toBe("primary");

        });

        it("should handle state cleaning", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "";
            expect(element.state).toBe("");

        });

        it("should handle bad state values", function () {

            const element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "bad";
            expect(element.state).toBe("");

        });

        it("should trigger blur events", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('blur', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new FocusEvent("focus"));
            element.wrapperElement.dispatchEvent(new FocusEvent("blur"));

        });

        it("should trigger click events", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('click', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new MouseEvent("click"));

        });

        it("should trigger focus events", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('focus', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new FocusEvent("focus"));

        });

        it("should trigger click events when the user press the Enter key", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('click', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {"key": "Enter"}));

        });

        it("should trigger click events when the user press the Space key", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('click', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {"key": " "}));

        });

        it("should trigger click events when the user press the Space key", function () {

            const element = new StyledElements.Button();
            const listener = jasmine.createSpy();
            element.addEventListener('click', listener);
            element.wrapperElement.dispatchEvent(new KeyboardEvent("keydown", {"key": "a"}));
            expect(listener).not.toHaveBeenCalled();

        });

        it("should trigger mouseenter events", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('mouseenter', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new MouseEvent("mouseenter"));

        });

        it("should trigger mouseleave events", function (done) {

            const element = new StyledElements.Button();
            element.addEventListener('mouseleave', function (button) {
                expect(button).toBe(element);
                done();
            });
            element.wrapperElement.dispatchEvent(new MouseEvent("mouseleave"));

        });

        describe("addIconClassName(classList)", function () {

            let element;

            beforeEach(function () {
                // Provide a default instance of Button for testing
                element = new StyledElements.Button({iconClass: 'a'});
            });

            it("should do nothing when passing a empty string", function () {
                expect(element.addIconClassName('  ')).toBe(element);
                expect(element.icon.className).toBe("se-icon a");
            });

            it("should do nothing when passing a empty array", function () {
                expect(element.addIconClassName([])).toBe(element);
                expect(element.icon.className).toBe("se-icon a");
            });

            it("should support space separated classes", function () {
                expect(element.addIconClassName('b c')).toBe(element);
                expect(element.icon.className).toBe("se-icon a b c");
            });

            it("should support class list", function () {
                expect(element.addIconClassName(['b', 'c'])).toBe(element);
                expect(element.icon.className).toBe("se-icon a b c");
            });

            it("should ignore repeated classes", function () {
                expect(element.addIconClassName('a')).toBe(element);
                expect(element.icon.className).toBe("se-icon a");
            });

            it("should also work if the button was not created using the iconClass option", function () {
                element = new StyledElements.Button();
                expect(element.addIconClassName('fa fa-plus')).toBe(element);
                expect(element.icon.className).toBe("se-icon fa fa-plus");
            });
        });

        describe("blur()", function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Button for testing
                element = new StyledElements.Button();
            });

            it("should trigger blur events", function () {
                spyOn(element.wrapperElement, 'blur');
                expect(element.blur()).toBe(element);
                expect(element.wrapperElement.blur.calls.count()).toBe(1);
            });

        });

        describe("click()", function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Button for testing
                element = new StyledElements.Button();
                element.appendTo(dom);
            });

            it("should trigger click events if enabled", function () {
                spyOn(element.events.click, 'dispatch');
                expect(element.click()).toBe(element);
                expect(element.events.click.dispatch.calls.count()).toBe(1);
            });

            it("shouldn't trigger click events if disabled", function () {
                spyOn(element.events.click, 'dispatch');
                element.disable();
                expect(element.click()).toBe(element);
                expect(element.events.click.dispatch.calls.count()).toBe(0);
            });

        });

        describe('destroy() [deprecated]', function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Button for testing
                element = new StyledElements.Button();
                element.appendTo(dom);
            });


            it("should destroy the button", function () {

                expect(element.destroy()).toBe(undefined);
                expect(element.wrapperElement.parentElement).toBe(null);

            });

        });

        describe("focus()", function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Button for testing
                element = new StyledElements.Button();
            });

            it("should trigger a focus event", function () {
                spyOn(element.wrapperElement, 'focus');
                expect(element.focus()).toBe(element);
                expect(element.wrapperElement.focus.calls.count()).toBe(1);
            });

        });

        describe("hasIconClassName(className)", () => {

            it("should return false for undefined class name", () => {
                const element = new StyledElements.Button();
                expect(element.hasIconClassName()).toBe(false);
            });

            it("should return false for empty class name", () => {
                const element = new StyledElements.Button();
                expect(element.hasIconClassName("")).toBe(false);
            });

            it("should return false if the class name is not present", () => {
                const element = new StyledElements.Button({class: "fas fa-bars", iconClass: "icon"});
                expect(element.hasIconClassName("fa-bars")).toBe(false);
            });

            it("should return true if the class name is present", () => {
                const element = new StyledElements.Button({iconClass: "fas fa-bars"});
                expect(element.hasIconClassName("fa-bars")).toBe(true);
            });

        });

        describe("removeIconClassName(classList)", function () {

            it("should remove the icon element when passing null", function () {
                const element = new StyledElements.Button({iconClass: "fa fa-ok"});
                expect(element.removeIconClassName()).toBe(element);
                expect(element.icon).toBe(null);
            });

            it("should do nothing when the button has no icon and passing an empty class list", function () {
                const element = new StyledElements.Button();
                expect(element.removeIconClassName()).toBe(element);
                expect(element.icon).toBe(null);
            });

            it("should do nothing when removing an inexistent class name", function () {
                const element = new StyledElements.Button({iconClass: "fa fa-ok"});
                expect(element.removeIconClassName("fa-bell")).toBe(element);
                expect(element.icon.className).toBe("se-icon fa fa-ok");
            });

            it("should support class lists", function () {
                const element = new StyledElements.Button({iconClass: "fa fa-ok fa-2x"});
                expect(element.removeIconClassName(["fa-ok", "inexistent", "fa-2x"])).toBe(element);
                expect(element.icon.className).toBe("se-icon fa");
            });

            it("should support whitespace separated class lists", function () {
                const element = new StyledElements.Button({iconClass: "fa fa-ok fa-2x"});
                expect(element.removeIconClassName("fa-ok inexistent fa-2x")).toBe(element);
                expect(element.icon.className).toBe("se-icon fa");
            });

            it("should remove the icon element when removing all the CSS classes", function () {
                const element = new StyledElements.Button({iconClass: "fa fa-ok"});
                expect(element.removeIconClassName("fa fa-ok")).toBe(element);
                expect(element.icon).toBe(null);
            });

        });

        describe("replaceIconClassName(removeList, addList)", function () {

            it("should call removeIconClassName and addIconClassName", function () {
                const element = new StyledElements.Button();
                const removeList = [];
                const addList = [];
                spyOn(element, "addIconClassName").and.callThrough();
                spyOn(element, "removeIconClassName").and.callThrough();
                expect(element.replaceIconClassName(removeList, addList)).toBe(element);
                expect(element.addIconClassName.calls.count()).toEqual(1);
                expect(element.addIconClassName.calls.argsFor(0)).toEqual([addList]);
                expect(element.removeIconClassName.calls.count()).toEqual(1);
                expect(element.removeIconClassName.calls.argsFor(0)).toEqual([removeList]);
            });

        });

        describe("setBadge([content, state, isAlert])", function () {

            let element;

            beforeEach(function () {
                element = new StyledElements.Button();
            });

            it("should support passing only the content parameter", function () {
                expect(element.setBadge('new')).toBe(element);
                expect(element.badgeElement.textContent).toBe("new");
                expect(element.badgeElement.className).toBe("badge z-depth-1");
            });

            it("should support passing only the content and the state parameter", function () {
                expect(element.setBadge('new', 'info')).toBe(element);
                expect(element.badgeElement.textContent).toBe("new");
                expect(element.badgeElement.className).toBe("badge badge-info z-depth-1");
            });

            it("should support the isAlert parameter", function () {
                expect(element.setBadge('1 error', 'danger', true)).toBe(element);
                expect(element.badgeElement.textContent).toBe("1 error");
                expect(element.badgeElement.className).toBe("badge badge-danger z-depth-1");
                expect(element.hasClassName('has-alert')).toBeTruthy();
            });

            it("should overwrite previous badge", function () {
                expect(element.setBadge('new', 'info')).toBe(element);
                expect(element.setBadge('1 error', 'danger')).toBe(element);
                expect(element.badgeElement.textContent).toBe("1 error");
                expect(element.badgeElement.className).toBe("badge badge-danger z-depth-1");
            });

            it("should do nothing when not passing parameters and the button didn't have a badge", function () {
                element = new StyledElements.Button();
                expect(element.setBadge()).toBe(element);
                expect(element.badgeElement).toEqual(null);
            });

            it("should remove current badge when not passing parameters", function () {
                element = new StyledElements.Button();
                expect(element.setBadge('1')).toBe(element);
                expect(element.setBadge()).toBe(element);
                expect(element.badgeElement).toEqual(null);
            });

        });

        describe("setLabel([text])", function () {

            let element;

            it("should add labels", function () {
                element = new StyledElements.Button();
                expect(element.setLabel('Label')).toBe(element);
                expect(element.label).not.toBe(null);
                expect(element.label.textContent).toBe("Label");
            });

            it("should update labels", function () {
                element = new StyledElements.Button({text: "new"});
                expect(element.setLabel('Label')).toBe(element);
                expect(element.label).not.toBe(null);
                expect(element.label.textContent).toBe("Label");
            });

            it("should remove current label if text is empty", function () {
                element = new StyledElements.Button({text: "new"});
                expect(element.setLabel('')).toBe(element);
                expect(element.label).toBe(null);
            });

        });

        describe("setTitle(title)", function () {

            let element;

            beforeEach(function () {
                element = new StyledElements.Button();
            });

            it("should create a tooltip if content is not empty", function () {
                expect(element.setTitle('title')).toBe(element);
                expect(element.tooltip).not.toBe(null);
            });

            it("does nothing if content is null and the button doesn't have a tooltip", function () {
                expect(element.setTitle()).toBe(element);
                expect(element.tooltip).toBe(null);
            });

            it("should remove previous tooltip if content is empty", function () {
                expect(element.setTitle('title')).toBe(element);
                expect(element.setTitle('')).toBe(element);
                expect(element.tooltip).toBe(null);
            });

            it("should remove previous tooltip if content is null", function () {
                expect(element.setTitle('title')).toBe(element);
                expect(element.setTitle()).toBe(element);
                expect(element.tooltip).toBe(null);
            });

            it("should update previous tooltips", function () {
                expect(element.setTitle('title1')).toBe(element);
                expect(element.setTitle('title2')).toBe(element);
                expect(element.tooltip).not.toBe(null);
            });

        });
    });

})();
