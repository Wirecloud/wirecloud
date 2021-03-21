/*
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

/* globals StyledElements, Wirecloud */


(function () {

    "use strict";

    describe("UserInterfaceManager", () => {

        /*
         * Wirecloud.UserInterfaceManager is a singleton class making hard to
         * create unit tests for it. Thus, it is not required to provide pure
         * unit tests in this Spec file.
         */

        let dom;

        beforeEach(() => {
            dom = document.createElement('div');
            dom.id = "wc-body";
            document.body.appendChild(dom);
            spyOn(Wirecloud, "addEventListener");
            const _createAlternative = StyledElements.Alternatives.prototype.createAlternative;
            spyOn(StyledElements.Alternatives.prototype, "createAlternative").and.callFake(function () {return _createAlternative.call(this);});
        });

        afterEach(() => {
            Wirecloud.UserInterfaceManager.terminate();
            dom.remove();
        });

        describe("changeCurrentView(newView[, options])", () => {

            beforeEach(() => {
                Wirecloud.UserInterfaceManager.init();
            });

            it("throws a TypeError exception when not passing the newView parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager.changeCurrentView();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing an invalid value for the newView parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager.changeCurrentView("invalidview");
                }).toThrowError(TypeError);
            });

            it("should allow to change between main views", (done) => {
                Wirecloud.UserInterfaceManager.changeCurrentView("workspace").then(() => {
                    spyOn(StyledElements.Alternatives.prototype, "showAlternative");
                    Wirecloud.UserInterfaceManager.changeCurrentView("wiring");
                    expect(StyledElements.Alternatives.prototype.showAlternative).toHaveBeenCalledWith(Wirecloud.UserInterfaceManager.views.wiring, {onComplete: jasmine.any(Function), effect: "horizontalslide"});
                    done();
                });
                setTimeout(() => {
                    Wirecloud.UserInterfaceManager.views.initial.get().dispatchEvent(new TransitionEvent("transitionend"));
                    Wirecloud.UserInterfaceManager.views.workspace.get().dispatchEvent(new TransitionEvent("transitionend"));
                }, 0);
            });

            it("should allow to change between views", () => {
                spyOn(StyledElements.Alternatives.prototype, "showAlternative");
                Wirecloud.UserInterfaceManager.changeCurrentView("marketplace");
                expect(StyledElements.Alternatives.prototype.showAlternative).toHaveBeenCalledWith(Wirecloud.UserInterfaceManager.views.marketplace, {onComplete: jasmine.any(Function), effect: "dissolve"});
            });

            it("should allow to provide custom options", () => {
                const myoptions = {a: "b"};
                spyOn(StyledElements.Alternatives.prototype, "showAlternative");
                Wirecloud.UserInterfaceManager.changeCurrentView("marketplace", myoptions);
                expect(StyledElements.Alternatives.prototype.showAlternative).toHaveBeenCalledWith(Wirecloud.UserInterfaceManager.views.marketplace, {a: "b", effect: "dissolve"});
            });

        });

        describe("onHistoryChange(state)", () => {

            it("should change current view", () => {
                spyOn(Wirecloud.UserInterfaceManager, "changeCurrentView").and.returnValue(Promise.resolve({in: {}}));
                Wirecloud.UserInterfaceManager.onHistoryChange({
                    view: "wiring"
                });

                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("wiring", true);
            });

            it("should call onHistoryChange on target view", (done) => {
                const next = jasmine.createSpy("onHistoryChange");
                spyOn(Wirecloud.UserInterfaceManager, "changeCurrentView")
                    .and.returnValue(Promise.resolve({
                        in: {
                            onHistoryChange: next
                        }
                    }));
                const state = {
                    view: "wiring"
                };
                Wirecloud.UserInterfaceManager.onHistoryChange(state);

                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("wiring", true);
                setTimeout(() => {
                    expect(next).toHaveBeenCalledWith(state);
                    done();
                }, 0);
            });

        });

        describe("_registerPopup(popup)", () => {

            it("throws a TypeError exception when not passing the popup parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerPopup();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing an invalid value for the window_menu parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerPopup({});
                }).toThrowError(TypeError);
            });

        });

        describe("_registerRootWindowMenu(window_menu)", () => {

            it("throws a TypeError exception when not passing the window_menu parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerRootWindowMenu();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing an invalid value for the window_menu parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerRootWindowMenu({});
                }).toThrowError(TypeError);
            });

            it("should replace any currently visible dialog", (done) => {
                // This is required to avoid having a blocked UI
                const dialog1 = new Wirecloud.ui.MessageWindowMenu();
                const dialog2 = new Wirecloud.ui.MessageWindowMenu();
                Wirecloud.UserInterfaceManager.init();
                Wirecloud.UserInterfaceManager._registerRootWindowMenu(dialog1);
                spyOn(dialog1, "hide");

                expect(Wirecloud.UserInterfaceManager._registerRootWindowMenu(dialog2)).toBe(Wirecloud.UserInterfaceManager);
                expect(dialog1.hide).toHaveBeenCalledWith();
                expect(Wirecloud.UserInterfaceManager.currentWindowMenu).toBe(dialog2);

                setTimeout(() => {
                    done();
                }, 0);
            });

        });

        describe("_registerTooltip(popup)", () => {

            it("throws a TypeError exception when not passing the popup parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerTooltip();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing an invalid value for the window_menu parameter", () => {
                expect(() => {
                    Wirecloud.UserInterfaceManager._registerTooltip({});
                }).toThrowError(TypeError);
            });

            it("should register tooltips", () => {
                const tooltip = new StyledElements.Tooltip();
                expect(Wirecloud.UserInterfaceManager._registerTooltip(tooltip)).toBe(Wirecloud.UserInterfaceManager);
                expect(Wirecloud.UserInterfaceManager.currentTooltip).toBe(tooltip);
            });

            it("should hide previous visible tooltips", () => {
                const tooltip1 = new StyledElements.Tooltip();
                const tooltip2 = new StyledElements.Tooltip();
                Wirecloud.UserInterfaceManager._registerTooltip(tooltip1);
                spyOn(tooltip1, "hide");

                expect(Wirecloud.UserInterfaceManager._registerTooltip(tooltip2)).toBe(Wirecloud.UserInterfaceManager);
                expect(Wirecloud.UserInterfaceManager.currentTooltip).toBe(tooltip2);
                expect(tooltip1.hide).toHaveBeenCalledWith();
            });

        });

        describe("_unregisterRootWindowMenu(window_menu)", () => {

            it("should do nothing when not passing the window_menu parameter", () => {
                Wirecloud.UserInterfaceManager._unregisterRootWindowMenu();
            });

            it("should do nothing when passing an invalid value for the window_menu parameter", () => {
                Wirecloud.UserInterfaceManager._unregisterRootWindowMenu({});
            });

            it("should hide any currently visible dialog", (done) => {
                // This is required to avoid having a blocked UI
                const dialog = new Wirecloud.ui.MessageWindowMenu();
                Wirecloud.UserInterfaceManager.init();
                Wirecloud.UserInterfaceManager._registerRootWindowMenu(dialog);

                setTimeout(() => {
                    expect(Wirecloud.UserInterfaceManager._unregisterRootWindowMenu(dialog)).toBe(Wirecloud.UserInterfaceManager);
                    expect(Wirecloud.UserInterfaceManager.currentWindowMenu).toBe(null);
                    setTimeout(done, 0);
                }, 0);
            });

        });

        describe("_unregisterTooltip(tooltip)", () => {

            it("should do nothing when not passing the tooltip parameter", () => {
                Wirecloud.UserInterfaceManager._unregisterTooltip();
            });

            it("should do nothing when passing an invalid value for the tooltip parameter", () => {
                Wirecloud.UserInterfaceManager._unregisterTooltip({});
            });

            it("removes tooltips form the on progress tasks", () => {
                const tooltip = new StyledElements.Tooltip();
                Wirecloud.UserInterfaceManager._registerTooltip(tooltip);

                Wirecloud.UserInterfaceManager._unregisterTooltip(tooltip);
                expect(Wirecloud.UserInterfaceManager.currentTooltip).toBe(null);
            });
        });

        describe("should manage events", () => {

            beforeEach(() => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState");
                spyOn(Wirecloud.HistoryManager, "replaceState");
                Wirecloud.UserInterfaceManager.init();
                jasmine.clock().install();
            });

            afterEach(() => {
                jasmine.clock().uninstall();
            });

            it("contextloaded", () => {
                Wirecloud.addEventListener.calls.argsFor(0)[1]();
                expect(Wirecloud.UserInterfaceManager.views.myresources).not.toBe(undefined);
            });

            it("activeworkspacechanged", () => {
                Wirecloud.HistoryManager.getCurrentState.and.returnValue({
                    tab: {},
                    tab_id: "1",
                    workspace_title: "My Workspace"
                });
                Wirecloud.UserInterfaceManager.views.workspace.layout = {
                    slideOut: jasmine.createSpy("slideOut")
                };
                Wirecloud.UserInterfaceManager.views.workspace.model = {
                    title: "My Workspace"
                };
                Wirecloud.UserInterfaceManager.views.workspace.notebook = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                Wirecloud.UserInterfaceManager.views.workspace.wiringButton = new StyledElements.Button();
                Wirecloud.UserInterfaceManager.header = {
                    refresh: jasmine.createSpy("refresh")
                };
                Wirecloud.UserInterfaceManager.views.workspace.loadWorkspace = jasmine.createSpy("loadWorkspace");
                Wirecloud.addEventListener.calls.argsFor(1)[1](Wirecloud, {
                    emptyparams: [],
                    wiring: {
                        logManager: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    }
                });
            });

            it("resize", () => {
                const dialog = new Wirecloud.ui.MessageWindowMenu();
                dialog.show();
                jasmine.clock().tick(1);
                spyOn(dialog, "repaint");

                window.dispatchEvent(new Event("resize"));

                expect(dialog.repaint).toHaveBeenCalledWith();
            });

            it("resize (tooltip)", () => {
                const tooltip = new StyledElements.Tooltip();
                Wirecloud.UserInterfaceManager._registerTooltip(tooltip);
                jasmine.clock().tick(1);
                spyOn(tooltip, "repaint");

                window.dispatchEvent(new Event("resize"));

                expect(tooltip.repaint).toHaveBeenCalledWith();
            });

            it("Escape keydown events", () => {
                document.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape"}));
            });

            it("Escape keydown events (active popup)", () => {
                const dialog = new Wirecloud.ui.MessageWindowMenu();
                dialog.show();
                jasmine.clock().tick(1);
                spyOn(dialog, "hide");

                document.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape"}));

                expect(dialog.hide).toHaveBeenCalledWith();
            });

            it("Escape keydown events (active popup & tooltip)", () => {
                const dialog = new Wirecloud.ui.MessageWindowMenu();
                dialog.show();
                jasmine.clock().tick(1);
                spyOn(dialog, "hide");
                const tooltip = new StyledElements.Tooltip();
                Wirecloud.UserInterfaceManager._registerTooltip(tooltip);
                spyOn(tooltip, "hide");

                document.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape"}));

                expect(dialog.hide).not.toHaveBeenCalled();
                expect(tooltip.hide).toHaveBeenCalledWith();
            });

            it("Backspace keydown events (active popup)", () => {
                const dialog = new Wirecloud.ui.MessageWindowMenu();
                dialog.show();
                jasmine.clock().tick(1);
                spyOn(dialog, "hide");

                const event = new KeyboardEvent("keydown", {"key": "Backspace"});
                spyOn(event, "preventDefault");
                document.dispatchEvent(event);

                expect(event.preventDefault).toHaveBeenCalledWith();
            });

        });

    });

})();
