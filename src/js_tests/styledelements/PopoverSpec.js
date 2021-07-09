/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    describe("Styled Popovers", function () {

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
            document.querySelectorAll('.popover').forEach((element) => {
                element.remove();
            });
        });

        describe("new Popover([options])", () => {

            it("can be created without passing any option", () => {
                const tooltip = new StyledElements.Popover();
                expect(tooltip).not.toBe(null);
            });

        });

        describe("bind(element, mode)", () => {

            it("should work on click mode", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                expect(tooltip.bind(ref_element, "click")).toBe(tooltip);
            });

            it("should work on hover mode", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                expect(tooltip.bind(ref_element, "hover")).toBe(tooltip);
            });

            it("should throw a TypeError exception on invalid mode", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                expect(() => {
                    tooltip.bind(ref_element, "invalid");
                }).toThrowError(TypeError);
            });

        });

        describe("disablePointerEvents()", () => {

            it("should work when popover is not visible", () => {
                const tooltip = new StyledElements.Popover();
                expect(tooltip.disablePointerEvents()).toBe(tooltip);
            });

            it("should work when popover is visible", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                tooltip.show(ref_element);

                expect(tooltip.disablePointerEvents()).toBe(tooltip);
            });

        });

        describe("enablePointerEvents()", () => {

            it("should work when popover is not visible", () => {
                const tooltip = new StyledElements.Popover();
                expect(tooltip.enablePointerEvents()).toBe(tooltip);
            });

            it("should work when popover is visible", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                tooltip.show(ref_element);

                expect(tooltip.enablePointerEvents()).toBe(tooltip);
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
                const tooltip = new StyledElements.Popover();
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
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover();
                expect(tooltip.show(ref_element).hide().hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.popover')).toBe(null);
            });

            it("should do nothing when the hide method is used and the tooltip is already hidden", () => {
                const tooltip = new StyledElements.Popover();
                expect(tooltip.hide()).toBe(tooltip);
                expect(tooltip.visible).toBe(false);
                expect(document.querySelector('.popover')).toBe(null);
            });

            it("should support WireCloud when sticky option is false (default)", () => {
                const ref_element = new se.Button();
                const popover = new se.Popover();
                popover.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterPopup: jasmine.createSpy("_unregisterPopup")
                    }
                };

                expect(popover.hide()).toBe(popover);
                expect(Wirecloud.UserInterfaceManager._unregisterPopup).toHaveBeenCalledWith(popover);
            });

            it("should also use WireCloud support when sticky is true", () => {
                const ref_element = new se.Button();
                const popover = new se.Popover({
                    sticky: true
                });
                popover.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterPopup: jasmine.createSpy("_unregisterPopup")
                    }
                };

                expect(popover.hide()).toBe(popover);
                expect(Wirecloud.UserInterfaceManager._unregisterPopup).toHaveBeenCalled();
            });

            it("should work when using the refContainer option", () => {
                const ref_element = new se.Button();
                const refContainer = {
                    addEventListener: jasmine.createSpy("addEventListener"),
                    removeEventListener: jasmine.createSpy("removeEventListener"),
                    contextManager: {
                        addCallback: jasmine.createSpy(),
                        removeCallback: jasmine.createSpy()
                    }
                };
                const popover = new se.Popover({
                    refContainer: refContainer
                });
                popover.show(ref_element);
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _unregisterPopup: jasmine.createSpy("_unregisterPopup")
                    }
                };

                expect(popover.hide()).toBe(popover);
                expect(refContainer.contextManager.removeCallback).toHaveBeenCalled();
                expect(Wirecloud.UserInterfaceManager._unregisterPopup).toHaveBeenCalledWith(popover);
            });

        });

        describe("repaint()", () => {

            it("works on hiden popovers", () => {
                const popover = new StyledElements.Popover({placement: ['right']});
                expect(popover.repaint()).toBe(popover);
            });

            it("works on visible popovers", () => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover({placement: ['right']});
                popover.show(ref_element);

                expect(popover.repaint()).toBe(popover);
            });

            it("works on visible popovers (using static ref_elements)", () => {
                const ref_element = {top: 0, bottom: 0, right: 0, left: 0};
                const popover = new StyledElements.Popover({placement: ['right']});
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
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("right placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['right']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("left placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['left']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("top placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['top']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("bottom placement", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['bottom']});
                expect(tooltip.show(ref_element)).toBe(tooltip);
                expect(tooltip.element).not.toBe(null);
            });

            it("should manage the case where there is not space", () => {
                const ref_element = new StyledElements.Button({text: "Test"});
                const content = document.createElement('div');
                content.style.width = "1400px";
                content.style.height = "1400px";
                content.style.background = "blue";
                const tooltip = new StyledElements.Popover({
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

            it("should support WireCloud when sticky option is false (default)", () => {
                const ref_element = new se.Button({text: "Test"});
                const popover = new se.Popover({
                    placement: ['bottom-right']
                });
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _registerPopup: jasmine.createSpy("_registerPopup")
                    }
                };
                expect(popover.show(ref_element)).toBe(popover);

                const element = document.querySelector('.popover');
                expect(element).not.toBe(null);
                expect(Wirecloud.UserInterfaceManager._registerPopup).toHaveBeenCalledWith(popover);
            });

            it("should also support WireCloud when sticky option is true", () => {
                const ref_element = new se.Button({text: "Test"});
                const popover = new se.Popover({
                    placement: ['bottom-right'],
                    sticky: true
                });
                window.Wirecloud = {
                    UserInterfaceManager: {
                        _registerPopup: jasmine.createSpy("_registerPopup")
                    }
                };
                expect(popover.show(ref_element)).toBe(popover);

                const element = document.querySelector('.popover');
                expect(element).not.toBe(null);
                expect(Wirecloud.UserInterfaceManager._registerPopup).toHaveBeenCalled();
            });

        });

        describe("toggle(refPosition)", () => {

            it("shows popover when currently hidden", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['top']});
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).not.toHaveBeenCalled();
                expect(tooltip.show).toHaveBeenCalledWith(ref_element);
            });

            it("hide popover when currently visible", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['top']});
                tooltip.show(ref_element);
                spyOn(tooltip, "hide").and.returnValue(tooltip);
                spyOn(tooltip, "show").and.returnValue(tooltip);

                expect(tooltip.toggle(ref_element)).toBe(tooltip);
                expect(tooltip.hide).toHaveBeenCalledWith();
                expect(tooltip.show).not.toHaveBeenCalled();
            });

        });

        describe("update(title, content)", () => {

            it("should work when currently hidden", () => {
                const tooltip = new StyledElements.Popover({placement: ['top']});

                expect(tooltip.update("new title", "new content")).toBe(tooltip);

                expect(tooltip.options.title).toBe("new title");
                expect(tooltip.options.content).toBe("new content");
            });

            it("should work when visible", () => {
                const ref_element = new StyledElements.Button();
                const tooltip = new StyledElements.Popover({placement: ['top']});
                tooltip.show(ref_element);

                expect(tooltip.update("new title", "new content")).toBe(tooltip);

                expect(tooltip.options.title).toBe("new title");
                expect(tooltip.options.content).toBe("new content");
            });

        });

        describe("events", () => {

            it("should hide popover when clicking outside the popover", (done) => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover();
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                document.body.dispatchEvent(new MouseEvent("click", {button: 0}));

                setTimeout(() => {
                    expect(popover.hide).toHaveBeenCalledWith();
                    done();
                });
            });

            it("should not hide popover when clicking outside the popover when using the sticky option", (done) => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover({sticky: true});
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                document.body.dispatchEvent(new MouseEvent("click", {button: 0}));

                setTimeout(() => {
                    expect(popover.hide).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should ignore click events outside the popover when the not using the main button", (done) => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover();
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                document.body.dispatchEvent(new MouseEvent("click", {button: 1}));

                setTimeout(() => {
                    expect(popover.hide).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should ignore transitionend events when showing a popover", () => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover();
                // The expected behaviour when calling hide just after calling show
                // is to find a computed opacity of 0
                spyOn(window, 'getComputedStyle').and.returnValue({
                    getPropertyValue: function () {return "0";}
                });
                expect(popover.show(ref_element)).toBe(popover);

                const element = document.querySelector('.popover');
                element.dispatchEvent(new Event("transitionend"));
            });

            it("should manage fullscreen mode change events (entering fullscreen)", () => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover();
                const fullscreen_element = document.createElement("div");
                spyOn(utils, "onFullscreenChange");
                spyOn(utils, "getFullscreenElement");
                expect(popover.show(ref_element)).toBe(popover);
                // Change fullscreen element
                utils.getFullscreenElement.and.returnValue(fullscreen_element);

                utils.onFullscreenChange.calls.argsFor(0)[1]();

                expect(fullscreen_element.childElementCount).toBe(1);
            });

            it("should manage fullscreen mode change events (exiting fullscreen)", () => {
                const ref_element = new StyledElements.Button();
                const popover = new StyledElements.Popover();
                const fullscreen_element = document.createElement("div");
                spyOn(utils, "onFullscreenChange");
                spyOn(utils, "getFullscreenElement").and.returnValue(fullscreen_element);
                expect(popover.show(ref_element)).toBe(popover);
                // Remove fullscreen element
                utils.getFullscreenElement.and.returnValue(null);

                utils.onFullscreenChange.calls.argsFor(0)[1]();

                expect(fullscreen_element.childElementCount).toBe(0);
            });

            it("should manage visible changes when using the refContainer option", () => {
                const ref_element = new StyledElements.Button();
                const refContainer = {
                    addEventListener: jasmine.createSpy("addEventListener"),
                    removeEventListener: jasmine.createSpy("removeEventListener"),
                    contextManager: {
                        addCallback: jasmine.createSpy("addCallback"),
                        removeCallback: jasmine.createSpy("removeCallback")
                    }
                };
                const popover = new StyledElements.Popover({
                    refContainer: refContainer
                });
                expect(popover.show(ref_element)).toBe(popover);

                refContainer.contextManager.addCallback.calls.argsFor(0)[0]({
                    visible: false
                });
                const element = document.querySelector('.popover');
                expect([...element.classList]).toContain("hidden");
            });

            it("should ignore widget changes not affecting visiblity when using the refContainer option", () => {
                const ref_element = new StyledElements.Button();
                const refContainer = {
                    addEventListener: jasmine.createSpy("addEventListener"),
                    removeEventListener: jasmine.createSpy("removeEventListener"),
                    contextManager: {
                        addCallback: jasmine.createSpy("addCallback"),
                        removeCallback: jasmine.createSpy("removeCallback")
                    }
                };
                const popover = new StyledElements.Popover({
                    refContainer: refContainer
                });
                expect(popover.show(ref_element)).toBe(popover);

                refContainer.contextManager.addCallback.calls.argsFor(0)[0]({
                    other: false
                });
                const element = document.querySelector('.popover');
                expect([...element.classList]).not.toContain("hidden");
            });

            it("should manage unload events from widgets when using the refContainer option", () => {
                const ref_element = new StyledElements.Button();
                const refContainer = {
                    addEventListener: jasmine.createSpy("addEventListener"),
                    removeEventListener: jasmine.createSpy("removeEventListener"),
                    contextManager: {
                        addCallback: jasmine.createSpy("addCallback"),
                        removeCallback: jasmine.createSpy("removeCallback")
                    }
                };
                const popover = new StyledElements.Popover({
                    refContainer: refContainer
                });
                spyOn(popover, "hide").and.callThrough();
                expect(popover.show(ref_element)).toBe(popover);

                refContainer.addEventListener.calls.argsFor(0)[1](popover, refContainer);

                expect(refContainer.removeEventListener).toHaveBeenCalled();
                expect(refContainer.contextManager.removeCallback).toHaveBeenCalled();
                expect(popover.hide).toHaveBeenCalled();
            });

        });

    });

})(StyledElements, StyledElements.Utils);
