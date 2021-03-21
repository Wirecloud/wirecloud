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

    describe("Containers", function () {
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

        describe("new Container([options])", function () {

            it("can be created without passing any option", function () {
                const element = new StyledElements.Container();
                expect(element.children).toEqual([]);
            });

            it("should support the id option", function () {
                const element = new StyledElements.Container({id: 5});
                expect(element.children).toEqual([]);
            });

        });

        describe('appendChild(child, [refElement])', function () {

            it("should allow to append elements", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                expect(container.appendChild(element).children).toEqual([element]);

            });

            it("should allow to append string nodes", function () {

                const container = new StyledElements.Container();
                expect(container.appendChild("hello ").appendChild("world!!").children).toEqual([]);
                expect(container.wrapperElement.textContent, "hello world!!");

            });

            it("should move child elements", function () {

                const container = new StyledElements.Container();
                const element1 = new StyledElements.Button();
                const element2 = new StyledElements.Button();
                container.appendChild(element1);
                container.appendChild(element2);
                container.appendChild(element1);
                expect(container.appendChild(element1).children).toEqual([element2, element1]);

            });

        });

        describe("clear()", function () {

            it("should work also when using it on disabled containers", function () {
                const element = new StyledElements.Container();
                element.enabled = false;
                expect(element.clear()).toBe(element);
            });

        });

        describe("has(element)", function () {

            it("should return true when testing for child DOM elements", function () {
                const container = new StyledElements.Container();
                const test_element = new StyledElements.Button();
                container.appendChild(test_element);
                expect(container.has(test_element)).toBe(true);
            });

            it("should return false when testing for non-child DOM elements", function () {
                const container = new StyledElements.Container();
                const test_element = new StyledElements.Button();
                expect(container.has(test_element)).toBe(false);
            });

            it("should return true when testing for child DOM elements", function () {
                const container = new StyledElements.Container();
                const test_element = document.createElement('div');
                container.appendChild(test_element);
                expect(container.has(test_element)).toBe(true);
            });

            it("should return false when testing for non-child DOM elements", function () {
                const container = new StyledElements.Container();
                const test_element = document.createElement('div');
                expect(container.has(test_element)).toBe(false);
            });

        });

        describe('prependChild(child, [refElement])', function () {

            it("should allow to prepend elements", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                expect(container.prependChild(element).children).toEqual([element]);

            });

            it("should allow to add string nodes", function () {

                const container = new StyledElements.Container();
                expect(container.prependChild("world!!").prependChild("hello ").children).toEqual([]);
                expect(container.wrapperElement.textContent, "hello world!!");

            });

            it("should allow to add elements to containers using the prependChild method (duplicated)", function () {

                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                container.appendChild(element);
                expect(container.prependChild(element).children).toEqual([element]);

            });

        });

        describe('text([newText])', function () {

            it("should allow to replace all the content", function () {

                const text = 'this is a test';
                const container = new StyledElements.Container();
                const element = new StyledElements.Button();
                container.appendChild(element);
                expect(container.text(text)).toBe(container);
                expect(container.text()).toBe(text);

            });

        });

        it('should allow to reenable the container', function () {

            const container = new StyledElements.Container();
            container.enabled = false;
            container.enabled = true;
            expect(container.enabled).toBe(true);

        });

        // =====================================================================
        // deprecated
        // =====================================================================

        describe('isDisabled() [deprecated]', function () {

            it("should return false if the element is enabled", function () {

                const container = new StyledElements.Container();
                expect(container.isDisabled()).toBe(false);

            });

            it("should return true if the element is disabled", function () {

                const container = new StyledElements.Container();
                container.enabled = false;
                expect(container.isDisabled()).toBe(true);

            });

        });

    });

})();
