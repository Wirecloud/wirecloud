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

/* globals StyledElements */


(function () {

    "use strict";

    describe("Styled Tooltips", () => {

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
            document.querySelectorAll('.se-tooltip').forEach((element) => {
                element.remove();
            });
        });

        describe("new Tooltip([options])", () => {

            it("can be created without passing any option", () => {
                const tooltip = new StyledElements.Tooltip();
                expect(tooltip).not.toBe(null);
            });

        });

        describe("hide()", () => {

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("can be displayed and hidden just immediately", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip();
                // The expected behaviour when calling hide just after calling show
                // is to find a computed opacity of 0
                spyOn(window, 'getComputedStyle').and.returnValue({
                    getPropertyValue: function () {return "0";}
                });

                expect(tooltip.show(ref_element).hide()).toBe(tooltip);

                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.se-tooltip')).toBe(null);
            });

            it("should support WireCloud", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip();
                tooltip.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterTooltip: jasmine.createSpy("_unregisterTooltip")
                    }
                };

                expect(tooltip.hide().hide()).toBe(tooltip);

                expect(window.Wirecloud.UserInterfaceManager._unregisterTooltip).toHaveBeenCalledWith(tooltip);
            });

            it("can be forced to be hidden", (done) => {
                // A second call to hide should cancel current animation and hide the tooltip
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip();
                tooltip.show(ref_element);
                // Wait for CSS transitions to apply
                setTimeout(() => {
                    expect(tooltip.hide()).toBe(tooltip);
                    // after first call, tooltip starts disappearing using an opacity transition
                    // so the dom element is still there
                    expect(tooltip.visible).toBe(true);
                    expect(tooltip.hide()).toBe(tooltip);
                    // second call cancels that transition removing immediately the tooltip
                    expect(tooltip.visible).toBe(false);

                    expect(document.querySelector('.se-tooltip')).toBe(null);
                    done();
                }, 50);
            });

            it("should do nothing when the hide method is used and the tooltip is already hidden", function () {
                const tooltip = new StyledElements.Tooltip();
                expect(tooltip.hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
            });

        });

        describe("show(ref_element)", () => {

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("should support WireCloud", () => {
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _registerTooltip: jasmine.createSpy("_unregisterTooltip")
                    }
                };
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element).not.toBe(null);
                expect(window.Wirecloud.UserInterfaceManager._registerTooltip).toHaveBeenCalledWith(tooltip);
            });

            it("second call cancels animation", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element).not.toBe(null);
            });

            it("support passing a bounding box", () => {
                const ref_element = document.createElement("div");
                const tooltip = new StyledElements.Tooltip({placement: ['right']});

                expect(tooltip.show(ref_element.getBoundingClientRect())).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element.classList.contains("se-tooltip-right")).toBe(true);
            });

            it("right placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['right']});

                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element.classList.contains("se-tooltip-right")).toBe(true);
            });

            it("left placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['left']});

                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element.classList.contains("se-tooltip-left")).toBe(true);
            });

            it("top placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['top']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
            });

            it("bottom placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip({placement: ['bottom']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
            });

            it("should manage the case where there is not space", () => {
                const ref_element = new StyledElements.Button({text: "Test"});
                const content = document.createElement('div');
                content.style.width = "1400px";
                content.style.height = "1400px";
                content.style.background = "blue";
                const tooltip = new StyledElements.Tooltip({
                    content: content,
                    placement: ['right']
                });
                ref_element.insertInto(dom);
                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.se-tooltip');
                expect(element).not.toBe(null);
                expect(element.style.top).toBe("10px");
                expect(element.style.bottom).toBe("10px");
                expect(element.style.right).toBe("10px");
                expect(element.style.left).not.toBe("10px");
                expect(element.style.left).not.toBe("");
            });

        });

        describe("toggle(refPosition)", () => {

            it("shows tooltips when currently hidden", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip();
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).not.toHaveBeenCalled();
                expect(tooltip.show).toHaveBeenCalledWith(ref_element);
            });

            it("hide tooltip when currently visible", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Tooltip();
                tooltip.show(ref_element);
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).toHaveBeenCalledWith();
                expect(tooltip.show).not.toHaveBeenCalled();
            });

        });

        describe('destroy() [deprecated]', () => {

            it("should hide the tooltip", () => {

                const tooltip = new StyledElements.Tooltip();
                spyOn(tooltip, 'hide');
                expect(tooltip.destroy()).toBe(undefined);
                expect(tooltip.hide).toHaveBeenCalled();

            });

        });

    });

})();

