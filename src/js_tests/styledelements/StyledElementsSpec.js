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

    describe("Styled Elements framework", function () {

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

        describe("appendTo(parentElement, refElement)", function () {

            it("should allow to add elements to containers using an HTML element as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = document.createElement('span');
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(otherElement).appendChild(refElement);

                expect(element.appendTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([otherElement, element]);

            });

            it("should allow to add elements to containers using a StyledElement as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = new StyledElements.Button();
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(refElement).appendChild(otherElement);

                expect(element.appendTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([refElement, element, otherElement]);

            });

            it("should allow to add elements to containers using a Fragment as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = new StyledElements.Fragment("<div/>");
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(refElement).appendChild(otherElement);

                expect(element.appendTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([element, otherElement]);

            });

            it("should allow to append elements into containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();

                expect(element.appendTo(container)).toBe(element);

                expect(container.children).toEqual([element]);

            });

            it("should allow to append containers into containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Container();

                expect(element.appendTo(container)).toBe(element);

                expect(container.children).toEqual([element]);

            });

            it("should allow to add elements to containers using the appendTo method (duplicated)", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                element.appendTo(container);
                element.appendTo(container);
                // Container should contain only a copy of element
                expect(container.children).toEqual([element]);

            });

        });

        describe("addClassName(classList)", function () {

            it("should do nothing when passing an empty string", function () {
                const element = new StyledElements.Button();
                expect(element.addClassName("")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn");
            });

            it("should support class lists", function () {

                const element = new StyledElements.Button();
                expect(element.addClassName(["a", "b"])).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn a b");

            });

            it("should support whitespace separated class lists", function () {

                const element = new StyledElements.Button();
                expect(element.addClassName("a b")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn a b");

            });

        });

        describe("prependTo(parentElement, refElement)", function () {

            it("should allow to add elements to containers using an HTML element as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = document.createElement('span');
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(otherElement).appendChild(refElement);

                expect(element.prependTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([otherElement, element]);
                expect(container.wrapperElement.lastChild).toBe(refElement); // TODO

            });

            it("should allow to add elements to containers using a StyledElement as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = new StyledElements.Button();
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(refElement).appendChild(otherElement);

                expect(element.prependTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([element, refElement, otherElement]);

            });

            it("should allow to add elements to containers using a Fragment as refElement", function () {

                const container = new StyledElements.Container();
                const refElement = new StyledElements.Fragment("<div/>");
                const otherElement = new StyledElements.Button();
                const element = new StyledElements.Button();
                container.appendChild(refElement).appendChild(otherElement);

                expect(element.prependTo(container, refElement)).toBe(element);

                expect(container.children).toEqual([element, otherElement]);

            });

            it("should allow to prepend containers into containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Container();

                expect(element.prependTo(container)).toBe(element);

                expect(container.children).toEqual([element]);

            });

            it("should allow to prepend elements into containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();

                expect(element.prependTo(container)).toBe(element);

                expect(container.children).toEqual([element]);

            });

            it("should ignore child elements when adding them into containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                element.appendTo(container);

                expect(element.prependTo(container)).toBe(element);

                // Container should contain only a copy of element
                expect(container.children).toEqual([element]);

            });

        });

        describe("removeClassName(classList)", function () {

            it("should clear all classes when passing null", function () {
                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.removeClassName()).toBe(element);
                expect(element.wrapperElement.className).toBe("");
            });

            it("should do nothing when removing an inexistent class name", function () {

                const element = new StyledElements.Button();
                expect(element.removeClassName("inexistent")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn");

            });

            it("should support class lists", function () {

                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.removeClassName(["a", "inexistent", "b"])).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn test");

            });

            it("should support whitespace separated class lists", function () {

                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.removeClassName("a inexistent b")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn test");

            });

        });

        describe("replaceClassName(removeList, addList)", function () {

            it("should call removeClassName and addClassName", function () {
                const element = new StyledElements.Button();
                const removeList = [];
                const addList = [];
                spyOn(element, "addClassName");
                spyOn(element, "removeClassName");
                expect(element.replaceClassName(removeList, addList)).toBe(element);
                expect(element.addClassName.calls.count()).toEqual(1);
                expect(element.addClassName.calls.argsFor(0)).toEqual([addList]);
                expect(element.removeClassName.calls.count()).toEqual(1);
                expect(element.removeClassName.calls.argsFor(0)).toEqual([removeList]);
            });

        });

        describe("toggleClassName(classList, state)", function () {

            it("should do nothing when passing an empty classList", function () {
                const element = new StyledElements.Button();
                expect(element.toggleClassName("")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn");
            });

            it("should add class names if they are not present", function () {
                const element = new StyledElements.Button();
                expect(element.toggleClassName("a b")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn a b");
            });

            it("should add class names if they are not present (using lists)", function () {
                const element = new StyledElements.Button();
                expect(element.toggleClassName(["a", "b"])).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn a b");
            });

            it("should add class names if state is true", function () {
                const element = new StyledElements.Button();
                element.wrapperElement.className += " a";
                expect(element.toggleClassName("se-btn a b", true)).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn a b");
            });

            it("should remove class names if they are present", function () {
                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.toggleClassName("a b")).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn test");
            });

            it("should remove class names if they are present (using lists)", function () {
                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.toggleClassName(["a", "b"])).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn test");
            });

            it("should remove class names if state is false", function () {
                const element = new StyledElements.Button();
                element.wrapperElement.className += " a test b";
                expect(element.toggleClassName("a b c", false)).toBe(element);
                expect(element.wrapperElement.className).toBe("se-btn test");
            });

        });

        describe("remove()", function () {

            it("should not crash if the element has no parent", function () {

                const element = new StyledElements.Button();
                // Initial checks
                expect(element.wrapperElement.parentElement).toBe(null);
                expect(element.parentElement).toBe(null);
                // Call the remove method
                expect(element.remove()).toBe(element);
                // Post-checks
                expect(element.wrapperElement.parentElement).toBe(null);
                expect(element.parentElement).toBe(null);

            });

            it("should allow to remove elements from the DOM", function () {

                const element = new StyledElements.Button();
                element.appendTo(dom);
                // Initial checks
                expect(element.wrapperElement.parentElement).not.toBe(null);
                expect(element.parentElement).toBe(null);
                // Call the remove method
                expect(element.remove()).toBe(element);
                // Post-checks
                expect(element.wrapperElement.parentElement).toBe(null);
                expect(element.parentElement).toBe(null);

            });

            it("should allow to remove elements from containers", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                container.appendChild(element);
                // Initial checks
                expect(element.wrapperElement.parentElement).not.toBe(null);
                expect(element.parentElement).not.toBe(null);
                // Call the remove method
                expect(element.remove()).toBe(element);
                // Post-checks
                expect(element.wrapperElement.parentElement).toBe(null);
                expect(element.parentElement).toBe(null);

            });

        });

    });

})();
