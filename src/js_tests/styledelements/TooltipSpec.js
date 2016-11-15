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

    describe("Styled Tooltips", function () {

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

            var tooltip = new StyledElements.Tooltip();
            expect(tooltip).not.toBe(null);

        });

        it("can be displayed and hidden just immediately", function () {

            var ref_element = new StyledElements.Button();
            var tooltip = new StyledElements.Tooltip();
            // PhantomJS doesn't emulate CSS animations
            // The expected behaviour when calling hide just after calling show
            // is to find a computed opacity of 0
            spyOn(window, 'getComputedStyle').and.returnValue({
                getPropertyValue: function () {return "0";}
            });
            expect(tooltip.show(ref_element).hide().element).toBe(null);

        });

        it("can be forced to be hidden", function () {

            // A second call to hide should cancel current animation and hide the tooltip
            var ref_element = new StyledElements.Button();
            var tooltip = new StyledElements.Tooltip();
            expect(tooltip.show(ref_element).hide().hide()).toBe(tooltip);
            expect(tooltip.element).toBe(null);
            expect(tooltip.visible).toBe(false);

        });

        it("should do nothing when the hide method is used and the tooltip is already hidden", function () {

            var tooltip = new StyledElements.Tooltip();
            expect(tooltip.hide()).toBe(tooltip);
            expect(tooltip.element).toBe(null);
            expect(tooltip.visible).toBe(false);

        });

        describe('destroy() [deprecated]', function () {

            it("should hide the tooltip", function () {

                var tooltip = new StyledElements.Tooltip();
                spyOn(tooltip, 'hide');
                expect(tooltip.destroy()).toBe(undefined);
                expect(tooltip.hide).toHaveBeenCalled();

            });

        });

    });

})();

