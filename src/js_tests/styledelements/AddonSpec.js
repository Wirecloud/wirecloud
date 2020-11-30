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

/* globals MouseEvent, StyledElements */


(function () {

    "use strict";

    describe("Addons", function () {

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

        describe("new Addon([options])", function () {

            it("can be created without passing any option", function () {
                var element = new StyledElements.Addon();
                expect(element.wrapperElement.textContent).toBe("");
                expect(element.wrapperElement.className).toBe("se-add-on");
            });

            it("should suport the text option", function () {
                var element = new StyledElements.Addon({text: "%"});
                expect(element.wrapperElement.textContent).toBe("%");
            });

            it("should suport the title option", function () {
                var element = new StyledElements.Addon({title: "percentage"});
                expect(element.wrapperElement.textContent).toBe("");
            });

        });

        describe("assignInput(input)", function () {

            it("should allow to set the initial input", function () {
                var element = new StyledElements.Addon();
                var input = new StyledElements.TextField();
                expect(element.assignInput(input)).toBe(element);
            });

        });

        describe("setLabel(label)", function () {

            it("should allow to set the initial label", function () {
                var element = new StyledElements.Addon();
                expect(element.setLabel("€")).toBe(element);
                expect(element.wrapperElement.textContent).toBe("€");
            });

            it("should replace previous labels", function () {
                var element = new StyledElements.Addon({text: "%"});
                expect(element.setLabel("€")).toBe(element);
                expect(element.wrapperElement.textContent).toBe("€");
            });

        });

        describe("setTitle(title)", function () {

            it("should allow to set the initial title", function () {
                var element = new StyledElements.Addon();
                expect(element.setTitle("euros")).toBe(element);
            });

            it("should replace previous labels", function () {
                var element = new StyledElements.Addon({title: "percentage"});
                expect(element.setTitle("euros")).toBe(element);
            });

        });

        it("should stop propagation and the default action of click events", function () {
            var element = new StyledElements.Addon({text: "%"});
            var event = new MouseEvent("click");
            spyOn(event, "stopPropagation");
            spyOn(event, "preventDefault");

            element.wrapperElement.dispatchEvent(event);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it("should focus associated input on click events", function () {
            var element = new StyledElements.Addon({text: "%"});
            var textfield = new StyledElements.TextField();
            spyOn(textfield, "focus");
            element.assignInput(textfield);
            element.wrapperElement.dispatchEvent(new MouseEvent("click"));
            expect(textfield.focus).toHaveBeenCalled();
        });

        it("should no focus the associated input on click events if the addon is disabled", function () {
            var element = new StyledElements.Addon({text: "%"});
            var textfield = new StyledElements.TextField();
            spyOn(textfield, "focus");
            element.assignInput(textfield);
            element.enabled = false;
            element.wrapperElement.dispatchEvent(new MouseEvent("click"));
            expect(textfield.focus).not.toHaveBeenCalled();
        });

        // =====================================================================
        // deprecated
        // =====================================================================

        describe('destroy() [deprecated]', function () {

            it("should remove the addon from the DOM", function () {
                var element = new StyledElements.Addon({text: "%"});
                element.appendTo(dom);

                expect(element.destroy()).toEqual(undefined);

                expect(dom.innerHTML.trim()).toBe("");
            });

        });

    });

})();
