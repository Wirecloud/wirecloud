/*
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
                const dragboard = {};
                const layout = new ns.SidebarLayout(dragboard);

                // Check initial values
                expect(layout.isActive()).toBe(false);
                expect(layout.position).toBe("left");
            });

            it("should validate the position option", () => {
                expect(() => {
                    new ns.SidebarLayout({}, {position: "invalid"});
                }).toThrowError(TypeError);
            });

            it("should allow to provide a custom position", () => {
                const dragboard = {};
                const layout = new ns.SidebarLayout(dragboard, {position: "right"});

                // Should init in inactive mode
                expect(layout.isActive()).toBe(false);
                expect(layout.position).toBe("right");
            });

            it("should accept the active option", () => {
                const dragboard = {};
                const layout = new ns.SidebarLayout(dragboard, {active: true});

                // Should init in active mode
                expect(layout.isActive()).toBe(true);
                expect(layout.position).toBe("left");
            });

        });

        describe("active property", () => {

            it("should be initialized to false", () => {
                const layout = new ns.SidebarLayout({});

                expect(layout.active).toBe(false);
            });

            it("should ignoring setting false if already false", () => {
                const layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = false;
                expect(layout.active).toBe(false);
                expect(layout._notifyWindowResizeEvent).not.toHaveBeenCalled();
            });

            it("should be possible to change it to true", () => {
                const layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                expect(layout.active).toBe(true);
                expect(layout._notifyWindowResizeEvent).toHaveBeenCalled();
            });

            it("should ignoring setting true if already true", () => {
                const layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                layout._notifyWindowResizeEvent.calls.reset();
                layout.active = true;
                expect(layout.active).toBe(true);
                expect(layout._notifyWindowResizeEvent).not.toHaveBeenCalled();
            });

            it("should be possible to change it to false", () => {
                const layout = new ns.SidebarLayout({});
                spyOn(layout, "_notifyWindowResizeEvent");

                layout.active = true;
                layout._notifyWindowResizeEvent.calls.reset();
                layout.active = false;

                expect(layout.active).toBe(false);
                expect(layout._notifyWindowResizeEvent).toHaveBeenCalled();
            });

        });

        describe("adaptColumnOffset(value[, width])", () => {

            it("should call parent method for top sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptColumnOffset").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.adaptColumnOffset(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptColumnOffset).toHaveBeenCalledWith(50, undefined);
                expect(value).toBe(result);
            });

            it("should call parent method for bottom sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptColumnOffset").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.adaptColumnOffset(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptColumnOffset).toHaveBeenCalledWith(50, undefined);
                expect(value).toBe(result);
            });

            it("should always return 0 cell size for left sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.adaptColumnOffset(50);

                expect(value.inLU).toBe(0);
                expect(value.inPixels).toBe(0);
            });

            it("should always return 0 cell size for right sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "right"});

                const value = layout.adaptColumnOffset(50);

                expect(value.inLU).toBe(0);
                expect(value.inPixels).toBe(0);
            });

        });

        describe("adaptRowOffset(value)", () => {

            it("should call parent method for left sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptRowOffset").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.adaptRowOffset(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptRowOffset).toHaveBeenCalledWith(50);
                expect(value).toBe(result);
            });

            it("should call parent method for right sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptRowOffset").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "right"});

                const value = layout.adaptRowOffset(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptRowOffset).toHaveBeenCalledWith(50);
                expect(value).toBe(result);
            });

            it("should always return 0 cell size for top sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.adaptRowOffset(50);

                expect(value.inLU).toBe(0);
                expect(value.inPixels).toBe(0);
            });

            it("should always return 0 cell size for bottom sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.adaptRowOffset(50);

                expect(value.inLU).toBe(0);
                expect(value.inPixels).toBe(0);
            });

        });

        describe("adaptHeight(size)", () => {

            it("should call parent method for left sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptHeight").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.adaptHeight(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptHeight).toHaveBeenCalledWith(50);
                expect(value).toBe(result);
            });

            it("should call parent method for right sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptHeight").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "right"});

                const value = layout.adaptHeight(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptHeight).toHaveBeenCalledWith(50);
                expect(value).toBe(result);
            });

            it("should always return 1 cell size for top sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.adaptHeight(50);

                expect(value.inLU).toBe(1);
                expect(value.inPixels).toBe(layout.getHeight());
            });

            it("should always return 1 cell size for bottom sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.adaptHeight(50);

                expect(value.inLU).toBe(1);
                expect(value.inPixels).toBe(layout.getHeight());
            });

        });

        describe("adaptWidth(size[, width])", () => {

            it("should call parent method for top sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptWidth").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.adaptWidth(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptWidth).toHaveBeenCalledWith(50, undefined);
                expect(value).toBe(result);
            });

            it("should call parent method for bottom sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "adaptWidth").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.adaptWidth(50);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.adaptWidth).toHaveBeenCalledWith(50, undefined);
                expect(value).toBe(result);
            });

            it("should always return 1 cell size for left sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.adaptWidth(50);

                expect(value.inLU).toBe(1);
                expect(value.inPixels).toBe(layout.getWidth());
            });

            it("should always return 1 cell size for right sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.adaptWidth(50);

                expect(value.inLU).toBe(1);
                expect(value.inPixels).toBe(layout.getWidth());
            });

        });

        describe("addWidget(widget, element)", () => {

            it("should enable layout handle on first addition", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "addWidget");
                const layout = new ns.SidebarLayout({});
                const widget = {
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
                const layout = new ns.SidebarLayout({});
                const widget = {
                    wrapperElement: document.createElement('div')
                };
                layout.initialize();

                layout.addWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(false);
                expect(layout.handle.parentElement).not.toBe(null);
            });

            it("should work on next additions", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "addWidget");
                const layout = new ns.SidebarLayout({});
                const widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.addWidget(widget, true);
                layout.addWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(false);
            });

        });

        describe("getHeight()", () => {

            it("should call parent method for left sidebars", () => {
                const result = 600;
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeight").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.getHeight();

                expect(Wirecloud.ui.SmartColumnLayout.prototype.getHeight).toHaveBeenCalledWith();
                expect(value).toBe(result);
            });

            it("should call parent method for right sidebars", () => {
                const result = 600;
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeight").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "right"});

                const value = layout.getHeight();

                expect(Wirecloud.ui.SmartColumnLayout.prototype.getHeight).toHaveBeenCalledWith();
                expect(value).toBe(result);
            });

            it("should always return 1 cell size for top sidebars", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeight");
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.getHeight();

                expect(value).toEqual(jasmine.any(Number));
            });

            it("should always return 1 cell size for bottom sidebars", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeight");
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.getHeight(2);

                expect(value).toEqual(jasmine.any(Number));
            });

        });

        describe("getHeightInPixels(size)", () => {

            it("should call parent method for left sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeightInPixels").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "left"});

                const value = layout.getHeightInPixels(2);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.getHeightInPixels).toHaveBeenCalledWith(2);
                expect(value).toBe(result);
            });

            it("should call parent method for right sidebars", () => {
                const result = {};
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "getHeightInPixels").and.returnValue(result);
                const layout = new ns.SidebarLayout({}, {position: "right"});

                const value = layout.getHeightInPixels(2);

                expect(Wirecloud.ui.SmartColumnLayout.prototype.getHeightInPixels).toHaveBeenCalledWith(2);
                expect(value).toBe(result);
            });

            it("should always return 1 cell size for top sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "top"});

                const value = layout.getHeightInPixels(2);

                expect(value).toBe(layout.getHeight());
            });

            it("should always return 1 cell size for bottom sidebars", () => {
                const layout = new ns.SidebarLayout({}, {position: "bottom"});

                const value = layout.getHeightInPixels(2);

                expect(value).toBe(layout.getHeight());
            });

        });

        describe("initialize()", () => {

            it("should work on empty layouts", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "initialize");
                const layout = new ns.SidebarLayout({});

                layout.initialize();
            });

            it("should enable layout handle if there is a widget in the first position", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "initialize");
                const layout = new ns.SidebarLayout({});
                const widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.matrix[0][0] = widget;
                layout.initialize();
            });

            it("should enable layout handle if there is a widget", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "initialize");
                const layout = new ns.SidebarLayout({}, {position: "top"});
                const widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.matrix[4][0] = widget;
                layout.initialize();
            });

        });

        describe("removeWidget(widget, element)", () => {

            it("should work on previous removals", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "removeWidget");
                const layout = new ns.SidebarLayout({});
                const widget = {
                    wrapperElement: document.createElement('div')
                };

                layout.widgets["1"] = true;
                layout.matrix[0][0] = widget;
                layout.removeWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(true);
            });

            it("should disable layout handle on last removal", () => {
                spyOn(Wirecloud.ui.SmartColumnLayout.prototype, "removeWidget");
                const layout = new ns.SidebarLayout({});
                const widget = {};

                layout.removeWidget(widget, true);

                expect(layout.handle.classList.contains("hidden")).toBe(true);
            });

        });

        describe("updatePosition(widget, element)", () => {
            let dragboard, element, layout;

            beforeEach(() => {
                dragboard = {
                    topMargin: 0,
                    leftMargin: 0,
                    tab: {
                        workspace: {
                        }
                    },
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(800),
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(600)
                };
                element = document.createElement('div');
            });

            it("should work on left position (inactive)", () => {
                layout = new ns.SidebarLayout(dragboard);
                const widget = {
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
                const widget = {
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
                const widget = {
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
                const widget = {
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

            it("should work on top position (inactive)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "top"});
                const widget = {
                    position: {
                        y: 0
                    }
                };
                layout.updatePosition(widget, element);

                expect(element.style.bottom).toBe("");
                expect(element.style.top).toBe("-498px");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("");
            });

            it("should work on top position (active)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "top"});
                const widget = {
                    position: {
                        y: 0
                    }
                };
                layout.active = true;
                layout.updatePosition(widget, element);

                expect(element.style.bottom).toBe("");
                expect(element.style.top).toBe("0px");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("");
            });

            it("should work on bottom position (inactive)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "bottom"});
                const widget = {
                    position: {
                        y: 0
                    }
                };
                layout.updatePosition(widget, element);

                expect(element.style.bottom).toBe("-498px");
                expect(element.style.top).toBe("");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("");
            });

            it("should work on bottom position (active)", () => {
                layout = new ns.SidebarLayout(dragboard, {position: "bottom"});
                const widget = {
                    position: {
                        y: 0
                    }
                };
                layout.active = true;
                layout.updatePosition(widget, element);

                expect(element.style.bottom).toBe("0px");
                expect(element.style.top).toBe("");
                expect(element.style.left).toBe("");
                expect(element.style.right).toBe("");
            });

        });

        describe("handle click events", () => {

            it("should activate the layout if inactive", () => {
                const layout = new ns.SidebarLayout({});
                layout.handle.click();

                expect(layout.active).toBe(true);
            });

            it("should deactivate the layout if active", () => {
                const layout = new ns.SidebarLayout({});
                layout.active = true;
                layout.handle.click();

                expect(layout.active).toBe(false);
            });

        });

        describe("removeHandle()", () => {

            it("should work", () => {
                const layout = new ns.SidebarLayout({});
                layout.handle = {
                    remove: jasmine.createSpy("remove")
                }

                layout.removeHandle();

                expect(layout.handle.remove).toHaveBeenCalled();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
