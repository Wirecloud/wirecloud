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

/* jshint jasmine:true */
/* globals StyledElements */

(function () {

    "use strict";

    describe("Styled Elements framework", function () {

        var dom = null;

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

        it("should allow to add elements to containers using the appendTo method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            element.appendTo(container);
            expect(container.children).toEqual([element]);

        });

        it("should allow to add elements to containers using the appendTo method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            element.appendTo(container);
            element.appendTo(container);
            // Container should contain only a copy of element
            expect(container.children).toEqual([element]);

        });

        it("should allow to add elements to containers using the appendChild method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            expect(container.appendChild(element).children).toEqual([element]);

        });

        it("should allow to add string nodes to containers using the appendChild method", function () {

            var container = new StyledElements.Container();
            expect(container.appendChild("hello ").appendChild("world!!").children).toEqual([]);
            expect(container.wrapperElement.textContent, "hello world!!");

        });

        it("should allow to add elements to containers using the appendChild method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(container.appendChild(element).children).toEqual([element]);

        });

        it("should allow to add elements to containers using the prependChild method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            expect(container.prependChild(element).children).toEqual([element]);

        });

        it("should allow to add string nodes to containers using the prependChild method", function () {

            var container = new StyledElements.Container();
            expect(container.prependChild("world!!").prependChild("hello ").children).toEqual([]);
            expect(container.wrapperElement.textContent, "hello world!!");

        });

        it("should allow to add elements to containers using the prependChild method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(container.prependChild(element).children).toEqual([element]);

        });

        it("should not crash when calling the remove method and the element has no parent element", function () {

            var element = new StyledElements.Button();
            expect(element.wrapperElement.parentElement).toBe(null);
            expect(element.parentElement).toBe(null);
            element.remove();
            expect(element.wrapperElement.parentElement).toBe(null);
            expect(element.parentElement).toBe(null);

        });

        it("should allow to remove elements from the DOM", function () {

            var element = new StyledElements.Button();
            element.appendTo(dom);
            expect(element.wrapperElement.parentElement).not.toBe(null);
            expect(element.parentElement).toBe(null);
            element.remove();
            expect(element.wrapperElement.parentElement).toBe(null);
            expect(element.parentElement).toBe(null);

        });

        it("should allow to remove elements from containers", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(element.wrapperElement.parentElement).not.toBe(null);
            expect(element.parentElement).not.toBe(null);
            element.remove();
            expect(element.wrapperElement.parentElement).toBe(null);
            expect(element.parentElement).toBe(null);

        });


    });

})();
