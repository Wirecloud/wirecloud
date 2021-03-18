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

    describe("WidgetViewDraggable", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.ui.FullDragboardLayout = function () {};
        });

        afterAll(() => {
            // TODO
            delete Wirecloud.ui.FullDragboardLayout;
        });

        describe("new WidgetViewDraggable(widget)", () => {

            it("should require a widget parameter", () => {
                new Wirecloud.ui.WidgetViewDraggable({
                    heading: document.createElement("div")
                });
            });

        });

        describe("canDrag(draggable, context[, role])", () => {

            const test = (editing, volatile, Layout, allowed, result) => {
                let title = "should return " + result + " when (";
                title += (editing ? "" : "no ") + "editing";
                if (volatile) {
                    title += ', volatile';
                }
                if (typeof Layout === "string") {
                    title += ', ' + Layout;
                }
                title += ')';
                it(title, () => {
                    const layoutMapping = {
                        "freedragboard": Wirecloud.ui.FreeLayout,
                        "fulldragboard": Wirecloud.ui.FullDragboardLayout
                    };
                    Layout = layoutMapping[Layout];
                    const widget = Object.assign({
                        heading: document.createElement("div"),
                        layout: Layout != null ? new Layout() : null,
                        model: {
                            isAllowed: jasmine.createSpy("isAllowed").and.returnValue(allowed),
                            volatile: volatile
                        },
                        tab: {
                            workspace: {
                                editing: editing
                            }
                        }
                    });
                    const draggable = new Wirecloud.ui.WidgetViewDraggable(widget);

                    expect(draggable.canDrag(null, {widget: widget})).toBe(result);
                });
            };

            test(false, true, false, true, true);
            test(true, true, false, true, true);
            test(true, false, false, true, true);

            test(false, false, false, true, false);
            test(false, false, "fulldragboard", true, false);
            test(true, false, "fulldragboard", true, false);

            test(false, false, "freedragboard", true, true);
            test(false, false, "freedragboard", false, false);
            test(false, true, "freedragboard", true, true);
            test(false, true, "freedragboard", false, false);
            test(true, false, "freedragboard", true, true);
            test(true, true, "freedragboard", true, true);
        });

        describe("ondragstart(draggable, context)", () => {

            let draggable, widget;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    model: {
                        isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true)
                    },
                    tab: {
                        id: 1,
                        wrapperElement: document.createElement("div"),
                        workspace: {
                            tabs: [
                                {id: 1},
                                {
                                    id: 2,
                                    tabElement: document.createElement('div')
                                }
                            ]
                        }
                    },
                    wrapperElement: document.createElement("div")
                });
                spyOn(widget.layout, "initializeMove");
                widget.layout.dragboard = {
                    raiseToTop: jasmine.createSpy('raiseToTop')
                };
                spyOn(Wirecloud.ui, "Draggable");
                draggable = new Wirecloud.ui.WidgetViewDraggable(widget);
            });

            it("should initialize the movement", () => {
                draggable.ondragstart(draggable, {widget: widget});

                expect(widget.layout.initializeMove).toHaveBeenCalled();
            });

            it("should handle mouseenter events on other tabs", () => {
                spyOn(widget.layout, "disableCursor");
                widget.tab.workspace.findTab = jasmine.createSpy("findTab").and.returnValue(widget.tab.workspace.tabs[1]);
                const context = Wirecloud.ui.Draggable.calls.argsFor(0)[1];

                context._on_mouseenter_tab({
                    target: {
                        getAttribute: jasmine.createSpy("getAttribute")
                    }
                });

                expect(context.tab).toBe(widget.tab.workspace.tabs[1]);
            });

            it("should handle mouseleave events on selected tabs", () => {
                spyOn(widget.layout, "disableCursor");
                widget.tab.workspace.findTab = jasmine.createSpy("findTab").and.returnValue(widget.tab.workspace.tabs[1]);
                const context = Wirecloud.ui.Draggable.calls.argsFor(0)[1];
                context.tab = widget.tab.workspace.tabs[1];

                context._on_mouseleave_tab({
                    target: {
                        getAttribute: jasmine.createSpy("getAttribute")
                    }
                });

                expect(context.tab).toBe(null);
            });

            it("should handle mouseleave events on non selected tabs", () => {
                spyOn(widget.layout, "disableCursor");
                widget.tab.workspace.findTab = jasmine.createSpy("findTab").and.returnValue(widget.tab.workspace.tabs[1]);
                const context = Wirecloud.ui.Draggable.calls.argsFor(0)[1];
                context.tab = null;

                context._on_mouseleave_tab({
                    target: {
                        getAttribute: jasmine.createSpy("getAttribute")
                    }
                });

                expect(context.tab).toBe(null);
            });

        });

        describe("ondrag(event, draggable, context, xDelta, yDelta)", () => {

            let draggable, widget;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    wrapperElement: document.createElement("div")
                });
                spyOn(widget.layout, "getCellAt").and.returnValue({x: 0, y: 0});
                spyOn(widget.layout, "moveTemporally");
                widget.layout.dragboard = {
                    raiseToTop: jasmine.createSpy('raiseToTop')
                };
                draggable = new Wirecloud.ui.WidgetViewDraggable(widget);
            });

            it("should move widget inside current tab", () => {
                draggable.ondrag({}, draggable, {widget: widget}, 10, 10);

                expect(widget.layout.moveTemporally).toHaveBeenCalled();
            });

            it("should do nothing if there is a selected tab", () => {
                draggable.ondrag({}, draggable, {tab: {}, widget: widget}, 10, 10);

                expect(widget.layout.moveTemporally).not.toHaveBeenCalled();
            });

        });

        describe("ondragend(draggable, context)", () => {

            let draggable, tabs, widget;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    moveToLayout: jasmine.createSpy("moveToLayout"),
                    tab: {
                        dragboard: {},
                        wrapperElement: document.createElement("div")
                    },
                    wrapperElement: document.createElement("div")
                });
                tabs = [
                    {
                        id: 1,
                        tabElement: {
                            removeEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    {
                        id: 2,
                        tabElement: {
                            removeEventListener: jasmine.createSpy("addEventListener")
                        }
                    }
                ];
                spyOn(widget.layout, "getCellAt").and.returnValue({x: 0, y: 0});
                spyOn(widget.layout, "acceptMove");
                spyOn(widget.layout, "cancelMove");
                widget.layout.dragboard = {
                    raiseToTop: jasmine.createSpy('raiseToTop')
                };
                draggable = new Wirecloud.ui.WidgetViewDraggable(widget);
            });

            it("accepts movements inside the same tab", () => {
                draggable.ondragend(draggable, {tabs: tabs, widget: widget});

                expect(widget.moveToLayout).not.toHaveBeenCalled();
                expect(widget.layout.cancelMove).not.toHaveBeenCalled();
                expect(widget.layout.acceptMove).toHaveBeenCalled();
            });

            it("accepts movements into a new tab (freeLayout)", () => {
                widget.tab.dragboard.freeLayout = widget.layout;
                draggable.ondragend(
                    draggable,
                    {
                        tab: {
                            tabElement: document.createElement("div"),
                            dragboard: {
                                freeLayout: "freeLayout",
                                baseLayout: "baseLayout"
                            }
                        },
                        tabs: tabs,
                        widget: widget
                    }
                );

                expect(widget.layout.acceptMove).not.toHaveBeenCalled();
                expect(widget.layout.cancelMove).toHaveBeenCalled();
                expect(widget.moveToLayout).toHaveBeenCalledWith("freeLayout");
            });

            it("accepts movements into a new tab (baseLayout)", () => {
                widget.tab.dragboard.freeLayout = {};
                draggable.ondragend(
                    draggable,
                    {
                        tab: {
                            tabElement: document.createElement("div"),
                            dragboard: {
                                freeLayout: "freeLayout",
                                baseLayout: "baseLayout"
                            }
                        },
                        tabs: tabs,
                        widget: widget
                    }
                );

                expect(widget.layout.acceptMove).not.toHaveBeenCalled();
                expect(widget.layout.cancelMove).toHaveBeenCalled();
                expect(widget.moveToLayout).toHaveBeenCalledWith("baseLayout");
            });

        });

        it("setXOffset()", () => {
            const draggable = new Wirecloud.ui.WidgetViewDraggable({
                heading: document.createElement("div")
            });

            expect(draggable.setXOffset(10)).toBe(draggable);
        });

        it("setYOffset()", () => {
            const draggable = new Wirecloud.ui.WidgetViewDraggable({
                heading: document.createElement("div")
            });

            expect(draggable.setYOffset(10)).toBe(draggable);
        });

    });

})(Wirecloud.ui, StyledElements.Utils);
