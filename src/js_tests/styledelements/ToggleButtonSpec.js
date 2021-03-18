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

    describe("Styled ToggleButtons", function () {

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

        describe("new ToggleButton(options)", function () {

            it("options are optional", function () {
                const element = new StyledElements.ToggleButton();
                expect(element).toEqual(jasmine.any(StyledElements.Button));
                expect(element.wrapperElement.textContent).toBe("");
                expect(element.state).toBe("");
                expect(element.depth).toBe(null);
                expect(element.active).toBe(false);
                expect(element.wrapperElement.className).toBe("se-btn");
            });

            it("supports the initiallyChecked option", function () {
                const element = new StyledElements.ToggleButton({initiallyChecked: true});
                expect(element.active).toBe(true);
            });

        });

        describe("active property", function () {
            let element;

            it("should allow to activate the button", function () {
                element = new StyledElements.ToggleButton();
                element.active = true;
                expect(element.active).toBe(true);
                expect(element.hasClassName("active")).toBeTruthy();
            });

            it("should allow to deactivate the button", function () {
                element = new StyledElements.ToggleButton({initiallyChecked: true});
                element.active = false;
                expect(element.active).toBe(false);
                expect(element.hasClassName("active")).toBeFalsy();
            });
        });

        describe("click()", function () {

            let element;

            it("activates the button when currently deactivated", function () {
                element = new StyledElements.ToggleButton();
                expect(element.click()).toBe(element);
                expect(element.active).toBe(true);
            });

            it("does nothing if the button is deactivated and disabled", function () {
                element = new StyledElements.ToggleButton();
                element.disable();
                expect(element.click()).toBe(element);
                expect(element.active).toBe(false);
            });

            it("deactivates the button when currently activated", function () {
                element = new StyledElements.ToggleButton({initiallyChecked: true});
                expect(element.click()).toBe(element);
                expect(element.active).toBe(false);
            });

            it("does nothing if the button is activated and disabled", function () {
                element = new StyledElements.ToggleButton({initiallyChecked: true});
                element.disable();
                expect(element.click()).toBe(element);
                expect(element.active).toBe(true);
            });

            it("should be called when the user clicks on the button", function () {
                element = new StyledElements.ToggleButton();
                spyOn(element, 'click');
                element.wrapperElement.click();
                expect(element.click).toHaveBeenCalled();
            });
        });

    });

})();
