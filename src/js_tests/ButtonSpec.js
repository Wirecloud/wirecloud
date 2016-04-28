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

    describe("Styled Buttons", function () {

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

        it("can be created without passing any option", function () {

            var element = new StyledElements.Button();
            expect(element.wrapperElement.textContent).toBe("");
            expect(element.state).toBe("");
            expect(element.depth).toBe(null);
            expect(element.wrapperElement.className).toBe("se-btn");

        });

        it("can be created only with a text label", function () {

            var element = new StyledElements.Button({text: "hello world!!"});
            expect(element.wrapperElement.textContent).toBe("hello world!!");

        });

        it("should handle initial depth", function () {

            var element = new StyledElements.Button({text: "hello world!!", depth: 2});
            expect(element.depth).toBe(2);
            expect(element.hasClassName('z-depth-2')).toBeTruthy();

        });

        it("should handle depth changes", function () {

            var element = new StyledElements.Button({text: "hello world!!", depth: 2});
            element.depth = 1;
            expect(element.depth).toBe(1);

        });

        it("should handle depth cleaning", function () {

            var element = new StyledElements.Button({text: "hello world!!", depth: 3});
            element.depth = null;
            expect(element.depth).toBe(null);

        });

        it("should handle bad depth values", function () {

            var element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            expect(element.depth = "bad", null);
            expect(element.depth).toBe(null);

        });

        it("should handle initial state", function () {

            var element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            expect(element.state).toBe("primary");

        });

        it("should handle state changes", function () {

            var element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "danger";
            expect(element.state).toBe("danger");

        });

        it("should handle state cleaning", function () {

            var element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "";
            expect(element.state).toBe("");

        });

        it("should handle bad state values", function () {

            var element = new StyledElements.Button({text: "hello world!!", state: 'primary'});
            element.state = "bad";
            expect(element.state).toBe("");

        });

        describe("addIconClassName(classList)", function () {

            var element;

            beforeEach(function () {
                // TODO addIconClassName should work also if the button is not
                // initialized using the iconClass option
                element = new StyledElements.Button({iconClass: 'a'});
            });

            it("should do nothing when passing a empty string", function () {
                expect(element.addIconClassName('  ')).toBe(element);
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

        });

    });

})();
