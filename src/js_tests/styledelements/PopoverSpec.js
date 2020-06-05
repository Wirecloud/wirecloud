/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (se) {

    "use strict";

    describe("Styled Popovers", function () {

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
            document.querySelectorAll('.popover').forEach((element) => {
                element.remove();
            });
        });

        describe("new Popover([options])", () => {

            it("can be created without passing any option", () => {
                var tooltip = new StyledElements.Popover();
                expect(tooltip).not.toBe(null);
            });

        });

        describe("bind(element, mode)", () => {

            it("should work on click mode", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover();
                expect(tooltip.bind(ref_element, "click")).toBe(tooltip);
            });

            it("should work on hover mode", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover();
                expect(tooltip.bind(ref_element, "hover")).toBe(tooltip);
            });

            it("should throw a TypeError exception on invalid mode", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover();
                expect(() => {
                    tooltip.bind(ref_element, "invalid");
                }).toThrowError(TypeError);
            });

        });

        describe("hide()", () => {

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("can be displayed and hidden just immediately", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover();
                // The expected behaviour when calling hide just after calling show
                // is to find a computed opacity of 0
                spyOn(window, 'getComputedStyle').and.returnValue({
                    getPropertyValue: function () {return "0";}
                });
                expect(tooltip.show(ref_element).hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.popover')).toBe(null);
            });

            it("can be forced to be hidden", () => {
                // A second call to hide should cancel current animation and hide the tooltip
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover();
                expect(tooltip.show(ref_element).hide().hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.popover')).toBe(null);
            });

            it("should do nothing when the hide method is used and the tooltip is already hidden", () => {
                var tooltip = new StyledElements.Popover();
                expect(tooltip.hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.popover')).toBe(null);
            });

            it("should support WireCloud", () => {
                var ref_element = new se.Button();
                var popover = new se.Popover();
                popover.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterPopup: jasmine.createSpy("_unregisterPopup")
                    }
                };

                expect(popover.hide()).toBe(popover);
                expect(Wirecloud.UserInterfaceManager._unregisterPopup).toHaveBeenCalledWith(popover);
            });

        });

        describe("repaint()", () => {

            it("works on hiden popovers", () => {
                let popover = new StyledElements.Popover({placement: ['right']});
                expect(popover.repaint()).toBe(popover);
            });

            it("works on visible popovers", () => {
                let ref_element = new StyledElements.Button();
                let popover = new StyledElements.Popover({placement: ['right']});
                popover.show(ref_element);

                expect(popover.repaint()).toBe(popover);
            });

            it("works on visible popovers (using static ref_elements)", () => {
                let ref_element = {top: 0, bottom: 0, right: 0, left: 0};
                let popover = new StyledElements.Popover({placement: ['right']});
                popover.show(ref_element);

                expect(popover.repaint()).toBe(popover);
            });

        });

        describe("show(refPosition)", () => {

            afterEach(() => {
                if ("Wirecloud" in window) {
                    delete window.Wirecloud;
                }
            });

            it("second call cancels animation", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("right placement", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("left placement", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['left']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("top placement", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['top']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("bottom placement", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['bottom']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("should manage the case where there is not space", () => {
                var ref_element = new StyledElements.Button({text: "Test"});
                var content = document.createElement('div');
                content.style.width = "1400px";
                content.style.height = "1400px";
                content.style.background = "blue";
                var tooltip = new StyledElements.Popover({
                    content: content,
                    placement: ['right']
                });
                ref_element.insertInto(dom);
                expect(tooltip.show(ref_element)).toBe(tooltip);

                const element = document.querySelector('.popover');
                expect(element).not.toBe(null);
                expect(element.style.top).toBe("10px");
                expect(element.style.bottom).toBe("10px");
                expect(element.style.right).toBe("10px");
                expect(element.style.left).not.toBe("10px");
                expect(element.style.left).not.toBe("");
            });

            it("should support WireCloud", () => {
                let ref_element = new se.Button({text: "Test"});
                let popover = new se.Popover({
                    placement: ['bottom-right']
                });
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _registerPopup: jasmine.createSpy("_registerPopup")
                    }
                };
                expect(popover.show(ref_element)).toBe(popover);

                var element = document.querySelector('.popover');
                expect(element).not.toBe(null);
                expect(Wirecloud.UserInterfaceManager._registerPopup).toHaveBeenCalledWith(popover);
            });

        });

        describe("toggle(refPosition)", () => {

            it("shows popover when currently hidden", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['top']});
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).not.toHaveBeenCalled();
                expect(tooltip.show).toHaveBeenCalledWith(ref_element);
            });

            it("hide popover when currently visible", () => {
                var ref_element = new StyledElements.Button();
                var tooltip = new StyledElements.Popover({placement: ['top']});
                tooltip.show(ref_element);
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).toHaveBeenCalledWith();
                expect(tooltip.show).not.toHaveBeenCalled();
            });

        });

        describe("events", () => {

            it("should hide popover when clicking outside the popover", (done) => {
                let ref_element = new StyledElements.Button();
                let popover = new StyledElements.Popover();
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                document.body.dispatchEvent(new MouseEvent("click", {button: 0}));

                setTimeout(() => {
                    expect(popover.hide).toHaveBeenCalledWith();
                    done();
                });
            });

            it("should ignore click events outside the popover when the not using the main button", (done) => {
                let ref_element = new StyledElements.Button();
                let popover = new StyledElements.Popover();
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                document.body.dispatchEvent(new MouseEvent("click", {button: 1}));

                setTimeout(() => {
                    expect(popover.hide).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should ignore transitionend events when showing a popover", () => {
                let ref_element = new StyledElements.Button();
                let popover = new StyledElements.Popover();
                // The expected behaviour when calling hide just after calling show
                // is to find a computed opacity of 0
                spyOn(window, 'getComputedStyle').and.returnValue({
                    getPropertyValue: function () {return "0";}
                });
                expect(popover.show(ref_element)).toBe(popover);

                let element = document.querySelector('.popover');
                element.dispatchEvent(new Event("transitionend"));
            });

        });

    });

})(StyledElements);
