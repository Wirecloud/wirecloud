/*
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


(function (ns, utils) {

    "use strict";

    describe("SidebarLayout", () => {

        describe("new SidebarLayout(dragboard[, options])", () => {

            it("is a class constructor", () => {
                expect(() => {
                    ns.SidebarLayout({});  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work without providing options", () => {
                var dragboard = {};
                let layout = new ns.SidebarLayout(dragboard);

                // Check initial values
                expect(layout.active).toBe(false);
                expect(layout.position).toBe("left");
            });

            it("should allow to provide a custom position", () => {
                var dragboard = {};
                let layout = new ns.SidebarLayout(dragboard, {position: "right"});

                // Should init in inactive mode
                expect(layout.active).toBe(false);
                expect(layout.position).toBe("right");
            });

        });

        describe("active property", () => {

            it("should be initialized to false", () => {
                let layout = new ns.SidebarLayout({});

                expect(layout.active).toBe(false);
            });

            it("should ignoring setting false if already false", () => {
                let layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = false;
                expect(layout.active).toBe(false);
                expect(layout._notifyWindowResizeEvent).not.toHaveBeenCalled();
            });

            it("should be possible to change it to true", () => {
                let layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                expect(layout.active).toBe(true);
                expect(layout._notifyWindowResizeEvent).toHaveBeenCalled();
            });

            it("should ignoring setting true if already true", () => {
                let layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                layout._notifyWindowResizeEvent.calls.reset();
                layout.active = true;
                expect(layout.active).toBe(true);
                expect(layout._notifyWindowResizeEvent).not.toHaveBeenCalled();
            });

            it("should be possible to change it to false", () => {
                let layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                layout._notifyWindowResizeEvent.calls.reset();
                layout.active = false;

                expect(layout.active).toBe(false);
                expect(layout._notifyWindowResizeEvent).toHaveBeenCalled();
            });

        });

        describe("adaptColumnOffset(value)", () => {

            it("should always return 0 cell size", () => {
                let layout = new ns.SidebarLayout({});

                let value = layout.adaptColumnOffset(50);

                expect(value.inLU).toBe(0);
                expect(value.inPixels).toBe(0);
            });

        });

        describe("adaptWidth(size)", () => {

            it("should always return 1 cell size", () => {
                let layout = new ns.SidebarLayout({});

                let value = layout.adaptWidth(50);

                expect(value.inLU).toBe(1);
                expect(value.inPixels).toBe(layout.getWidth());
            });

        });

        describe("addWidget(widget, element)", () => {

            it("should enable layout handle on first addition", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "addWidget");
                let layout = new ns.SidebarLayout({});
                let widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.addWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(false);
                expect(layout.handle.parentElement).toBe(null);
            });

            it("should enable layout handle on first addition", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "addWidget").and.callFake(function (widget) {
                    this.matrix[0][0] = widget;
                });
                let layout = new ns.SidebarLayout({});
                let widget = {
                    wrapperElement: document.createElement('div')
                };
                layout.initialize();

                layout.addWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(false);
                expect(layout.handle.parentElement).not.toBe(null);
            });

            it("should work on next additions", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "addWidget");
                let layout = new ns.SidebarLayout({});
                let widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.addWidget(widget, true);
                layout.addWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(false);
            });

        });

        describe("initialize()", () => {

            it("should work on empty layouts", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "initialize");
                let layout = new ns.SidebarLayout({});

                layout.initialize();
            });

            it("should enable layout handle if there are widget", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "initialize");
                let layout = new ns.SidebarLayout({});
                let widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.matrix[0][0] = widget;
                layout.initialize();
            });

        });

        describe("removeWidget(widget, element)", () => {

            it("should work on previous removals", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "removeWidget");
                let layout = new ns.SidebarLayout({});
                let widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.widgets["1"] = true;
                layout.matrix[0][0] = widget;
                layout.removeWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(true);
            });

            it("should disable layout handle on last removal", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "removeWidget");
                let layout = new ns.SidebarLayout({});
                let widget = {};

                layout.removeWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(true);
            });

        });

        describe("updatePosition(widget, element)", () => {
            var dragboard, element, layout;

            beforeEach(() => {
                dragboard = {
                    topMargin: 0,
                    leftMargin: 0,
                    tab: {
                        workspace: {
                        }
                    }
                };
                element = document.createElement('div');
            });

            it("should work on left position (inactive)", () => {
                layout = new ns.SidebarLayout(dragboard);
                let widget = {
                    position: {
                        y: 0
                    }
                };
                layout.updatePosition(widget, element);

                expect(element.style.top).toBe("2px");
                expect(element.style.left).toBe("-498px");
                expect(element.style.right).toBe("");
            });

            it("should work on left position (active)", () => {
                layout = new ns.SidebarLayout(dragboard);
                let widget = {
                    position: {
                        y: 0
                    }
                };
                layout.active = true;
                layout.updatePosition(widget, element);

                expect(element.style.top).toBe("2px");
                expect(element.style.left).toBe("0px");
                expect(element.style.right).toBe("");
            });

            it("should work on right position (inactive)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "right"});
                let widget = {
                    position: {
                        y: 0
                    }
                };
                layout.updatePosition(widget, element);

                expect(element.style.top).toBe("2px");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("-498px");
            });

            it("should work on right position (active)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "right"});
                let widget = {
                    position: {
                        y: 0
                    }
                };
                layout.active = true;
                layout.updatePosition(widget, element);

                expect(element.style.top).toBe("2px");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("0px");
            });

        });

        describe("handle click events", () => {

            it("should activate the layout if inactive", () => {
                var layout = new ns.SidebarLayout({});
                layout.handle.click();

                expect(layout.active).toBe(true);
            });

            it("should deactivate the layout if active", () => {
                var layout = new ns.SidebarLayout({});
                layout.active = true;
                layout.handle.click();

                expect(layout.active).toBe(false);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
