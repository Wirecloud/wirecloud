/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils, se) {

    "use strict";

    describe("WidgetViewResizeHandle", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.ui.FullDragboardLayout = function () {};
        });

        afterAll(() => {
            // TODO
            delete Wirecloud.ui.FullDragboardLayout;
        });

        describe("new WidgetViewResizeHandle(widget[, options])", () => {

            it("should require a widget parameter", () => {
                expect(() => {
                    new Wirecloud.ui.WidgetViewResizeHandle();
                }).toThrowError(TypeError);
            });

            it("should work passing a widget", () => {
                const handle = new Wirecloud.ui.WidgetViewResizeHandle({
                    heading: document.createElement("div")
                });
                expect(handle).toEqual(jasmine.any(se.StyledElement));
            });

            it("fixWidth and fixHeight options cannot be used at the same time", () => {
                expect(() => {
                    new Wirecloud.ui.WidgetViewResizeHandle({
                        heading: document.createElement("div")
                    }, {
                        fixHeight: true,
                        fixWidth: true
                    });
                }).toThrowError(TypeError);
            });

        });

        describe("canDrag(draggable, context[, role])", () => {

            const test = (editing, volatile, Layout, allowed, result, role) => {
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
                    const draggable = new Wirecloud.ui.WidgetViewResizeHandle(widget);

                    expect(draggable.canDrag(null, {widget: widget}, role)).toBe(result);
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

            test(false, false, "freedragboard", true, true, "owner");
            test(false, true, "freedragboard", false, false, "owner");
        });

        describe("onresizestart(resizableElement, handleElement, context)", () => {

            let draggable, widget;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    model: {
                        isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true)
                    },
                    position: {
                        z: 3
                    },
                    setPosition: jasmine.createSpy("setPosition"),
                    shape: {
                        width: 10,
                        height: 10
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
                spyOn(Wirecloud.ui, "ResizeHandle");
                draggable = new Wirecloud.ui.WidgetViewResizeHandle(widget);
            });

            it("should initialize the resizing", () => {
                draggable.onresizestart(
                    widget.wrapperElement,
                    draggable.wrapperElement,
                    {widget: widget}
                );
            });

        });

        describe("onresize(event, draggable, context, xDelta, yDelta)", () => {

            let draggable, widget, dragboard;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    position: {
                        anchor: "top-left",
                        relx: false,
                        rely: false,
                        x: 10,
                        y: 10
                    },
                    setShape: jasmine.createSpy("setShape"),
                    shape: {
                        relwidth: false,
                        width: 100,
                        relheight: false,
                        height: 800
                    },
                    wrapperElement: document.createElement("div")
                });
                spyOn(widget.layout, "getCellAt").and.returnValue({x: 0, y: 0});
                dragboard = {
                    getWidth: jasmine.createSpy('getWidth').and.returnValue(1000),
                    getHeight: jasmine.createSpy('getHeight').and.returnValue(800),
                    leftMargin: 3,
                    raiseToTop: jasmine.createSpy('raiseToTop'),
                    topMargin: 2
                };
                widget.layout.dragboard = dragboard;
                draggable = new Wirecloud.ui.WidgetViewResizeHandle(widget);
            });

            it("should support resizing both dimensions", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: false,
                        fixHeight: false,
                        dragboard: dragboard,
                        resizeLeftSide: false,
                        resizeTopSide: false,
                        widget: widget
                    },
                    300, -400);
                expect(widget.setShape).toHaveBeenCalledWith({width: 400, height: 400}, false, false);
            });

            it("should enforce minimal dimensions", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: false,
                        fixHeight: false,
                        dragboard: dragboard,
                        resizeLeftSide: false,
                        resizeTopSide: false,
                        widget: widget
                    },
                    -90, -780);
                expect(widget.setShape).toHaveBeenCalledWith({width: 80, height: 50}, false, false);
            });

            it("should support resizing both dimensions (from right side, center, relative shape)", () => {
                widget.position.anchor = "topcenter";
                widget.shape.relwidth = true;
                widget.shape.relheight = true;
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: false,
                        fixHeight: false,
                        dragboard: dragboard,
                        resizeLeftSide: false,
                        resizeTopSide: false,
                        widget: widget
                    },
                    -7, -400);
                expect(widget.setShape).toHaveBeenCalledWith({width: 86000, height: 500000}, false, false);
            });

            it("should support resizing only one dimensions (from left side)", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: false,
                        fixHeight: true,
                        dragboard: dragboard,
                        resizeLeftSide: true,
                        resizeTopSide: false,
                        widget: widget
                    },
                    -7, -400);
                expect(widget.setShape).toHaveBeenCalledWith({width: 107, height: 800}, true, false);
            });

            it("should support resizing only one dimensions (from top side)", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: true,
                        fixHeight: false,
                        dragboard: dragboard,
                        resizeLeftSide: false,
                        resizeTopSide: true,
                        widget: widget
                    },
                    -3, -4);
                expect(widget.setShape).toHaveBeenCalledWith({width: 100, height: 804}, false, true);
            });

            it("should do nothing if there is no dimension change (fixed width)", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: true,
                        fixHeight: false,
                        dragboard: dragboard,
                        widget: widget
                    },
                    800, 0
                );
                expect(widget.setShape).not.toHaveBeenCalled();
            });

            it("should do nothing if there is no dimension change (fixed height)", () => {
                draggable.onresize(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        initialWidthPixels: 100,
                        initialHeightPixels: 800,
                        fixWidth: false,
                        fixHeight: true,
                        dragboard: dragboard,
                        widget: widget
                    },
                    0, 400
                );
                expect(widget.setShape).not.toHaveBeenCalled();
            });

        });

        describe("onresizeend(draggable, context)", () => {

            let draggable, widget;

            beforeEach(() => {
                widget = Object.assign({
                    heading: document.createElement("div"),
                    layout: new Wirecloud.ui.FreeLayout(),
                    setPosition: jasmine.createSpy("setPosition"),
                    setShape: jasmine.createSpy("setShape"),
                    wrapperElement: document.createElement("div")
                });
                widget.layout.dragboard = {
                    raiseToTop: jasmine.createSpy('raiseToTop')
                };
                draggable = new Wirecloud.ui.WidgetViewResizeHandle(widget);
            });

            it("accepts resizes without changes", () => {
                draggable.onresizeend(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {widget: widget, dragboard: {_notifyWindowResizeEvent: jasmine.createSpy("_notifyWindowResizeEvent")}}
                );
                expect(widget.setShape).not.toHaveBeenCalled();
            });

            it("accepts resizes with changes", () => {
                draggable.onresizeend(
                    draggable.wrapperElement,
                    widget.wrapperElement,
                    {
                        widget: widget,
                        width: 10,
                        height: 10,
                        resizeLeftSide: true,
                        dragboard: {
                            _notifyWindowResizeEvent: jasmine.createSpy("_notifyWindowResizeEvent")
                        }
                    }
                );
                expect(widget.setShape).toHaveBeenCalled();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils, StyledElements);
