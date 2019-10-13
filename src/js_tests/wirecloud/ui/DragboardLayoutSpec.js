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


(function (ns, utils) {

    "use strict";

    describe("DragboardLayout", () => {

        describe("new DragboardLayout(dragboard)", () => {

            it("should init state", () => {
                var dragboard = {};
                let layout = new ns.DragboardLayout(dragboard);

                // Check initial values
                expect(layout.dragboard).toBe(dragboard);
                expect(layout.widgets).toEqual({});
            });

        });

        describe("adaptColumnOffset(value)", () => {

            it("should throw a non-implemented error", () => {
                let layout = new ns.DragboardLayout({});
                expect(() => {
                    layout.adaptColumnOffset(1);
                }).toThrowError(Error);
            });

        });

        describe("adaptHeight(value)", () => {

            it("should return 1 LU as minimum", () => {
                let layout = new ns.DragboardLayout({});
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getHeightInPixels = jasmine.createSpy("getHeightInPixels").and.returnValue(40);

                let value = layout.adaptHeight(0.3);

                expect(value.inPixels).toBe(layout.getHeight());
                expect(value.inLU).toBe(1);
            });

            it("should floor cells", () => {
                let layout = new ns.DragboardLayout({});
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getHeightInPixels = jasmine.createSpy("getHeightInPixels").and.returnValue(40);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2.2);

                let value = layout.adaptHeight("60px");

                expect(value.inPixels).toBe(40);
                expect(value.inLU).toBe(2);
            });

            it("should ceil cells", () => {
                let layout = new ns.DragboardLayout({});
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getHeightInPixels = jasmine.createSpy("getHeightInPixels").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2.5);

                let value = layout.adaptHeight("60px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should support percentages", () => {
                let layout = new ns.DragboardLayout({});
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getHeightInPixels = jasmine.createSpy("getHeightInPixels").and.returnValue(40);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2);

                let value = layout.adaptHeight("60%");

                expect(value.inPixels).toBe(40);
                expect(value.inLU).toBe(2);
            });

        });

        describe("_adaptIWidget(widget)", () => {

            it("should do nothing for non-in-DOM widgets", () => {
                let layout = new ns.DragboardLayout({});
                layout._adaptIWidget({});
            });

            it("should do nothing for big enough widgets", () => {
                let widget = {
                    element: document.createElement('div'),
                    shape: {
                        width: 1,
                        height: 1
                    },
                    setShape: jasmine.createSpy('setShape')
                };
                let layout = new ns.DragboardLayout({});
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(1);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(1);
                layout._adaptIWidget(widget);

                expect(widget.setShape).not.toHaveBeenCalled();
            });

            it("should be able to adapt widget width", () => {
                let widget = {
                    element: document.createElement('div'),
                    shape: {
                        width: 1,
                        height: 1
                    },
                    setShape: jasmine.createSpy('setShape')
                };
                let layout = new ns.DragboardLayout({});
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(2);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(1);
                layout._adaptIWidget(widget);

                expect(widget.setShape).toHaveBeenCalledWith({width: 2, height: 1});
            });

            it("should be able to adapt widget height", () => {
                let widget = {
                    element: document.createElement('div'),
                    shape: {
                        width: 1,
                        height: 1
                    },
                    setShape: jasmine.createSpy('setShape')
                };
                let layout = new ns.DragboardLayout({});
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(1);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2);
                layout._adaptIWidget(widget);

                expect(widget.setShape).toHaveBeenCalledWith({width: 1, height: 2});
            });

        });

        describe("adaptRowOffset(value)", () => {

            it("should throw a non-implemented error", () => {
                let layout = new ns.DragboardLayout({});
                expect(() => {
                    layout.adaptRowOffset(1);
                }).toThrowError(Error);
            });

        });

        describe("adaptWidth(value)", () => {

            it("should return 1 LU as minimum", () => {
                let layout = new ns.DragboardLayout({});
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getWidthInPixels = jasmine.createSpy("getWidthInPixels").and.returnValue(40);

                let value = layout.adaptWidth(0.3);

                expect(value.inPixels).toBe(layout.getWidth());
                expect(value.inLU).toBe(1);
            });

            it("should floor cells", () => {
                let layout = new ns.DragboardLayout({});
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getWidthInPixels = jasmine.createSpy("getWidthInPixels").and.returnValue(40);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(2.2);

                let value = layout.adaptWidth("60px");

                expect(value.inPixels).toBe(40);
                expect(value.inLU).toBe(2);
            });

            it("should ceil cells", () => {
                let layout = new ns.DragboardLayout({});
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getWidthInPixels = jasmine.createSpy("getWidthInPixels").and.returnValue(60);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(2.5);

                let value = layout.adaptWidth("60px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should support percentages", () => {
                let layout = new ns.DragboardLayout({});
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getWidthInPixels = jasmine.createSpy("getWidthInPixels").and.returnValue(40);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(2);

                let value = layout.adaptWidth("60%");

                expect(value.inPixels).toBe(40);
                expect(value.inLU).toBe(2);
            });

        });

        describe("addWidget(widget, affectsDragboard)", () => {

            var widget;

            beforeEach(() => {
                widget = {
                    id: "1",
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint")
                };
            });

            it("should add widgets", () => {
                let layout = new ns.DragboardLayout({});

                layout.addWidget(widget);

                expect(layout.widgets).toEqual({"1": widget});
                expect(widget.layout).toBe(layout);
                expect(widget.addEventListener).toHaveBeenCalled();
                expect(widget.repaint).toHaveBeenCalled();
            });

            it("should throw and Error if the widget is already associated with a layout", () => {
                let layout = new ns.DragboardLayout({});
                widget.layout = {};

                expect(() => {
                    layout.addWidget(widget);
                }).toThrowError(Error);

                expect(layout.widgets).toEqual({});
            });

            it("should add widgets (affecting dragboard)", () => {
                var dragboard = {
                    _addWidget: jasmine.createSpy("_addWidget")
                };
                let layout = new ns.DragboardLayout(dragboard);

                layout.addWidget(widget, true);

                expect(layout.widgets).toEqual({"1": widget});
                expect(widget.layout).toBe(layout);
                expect(widget.addEventListener).toHaveBeenCalled();
                expect(widget.repaint).toHaveBeenCalled();
                expect(dragboard._addWidget).toHaveBeenCalledWith(widget);
            });
        });

        describe("getHeight()", () => {

            it("should return getHeight() from dragboard", () => {
                var dragboard = {
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(30)
                };
                let layout = new ns.DragboardLayout(dragboard);

                let value = layout.getHeight();

                expect(value).toBe(30);
            });

        });

        describe("getWidth()", () => {

            it("should return getWidth() from dragboard", () => {
                var dragboard = {
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(30)
                };
                let layout = new ns.DragboardLayout(dragboard);

                let value = layout.getWidth();

                expect(value).toBe(30);
            });

        });

        describe("isInside(x, y)", () => {

            var layout;

            beforeAll(() => {
                layout = new ns.DragboardLayout({
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(50)
                });
            });

            it("should return true for the origin coordinate", () => {
                expect(layout.isInside(0, 0)).toBe(true);
            });

            it("should return false if x is less than 0", () => {
                expect(layout.isInside(-1, 0)).toBe(false);
            });

            it("should return false if y is less than 0", () => {
                expect(layout.isInside(0, -1)).toBe(false);
            });

            it("should return false if x and y is less than 0", () => {
                expect(layout.isInside(-1, -1)).toBe(false);
            });

            it("should return true if x is just in the limit", () => {
                expect(layout.isInside(49, 0)).toBe(true);
            });

            it("should return false if x is outside the available range", () => {
                expect(layout.isInside(50, 0)).toBe(false);
            });

        });

        describe("moveTo(newlayout)", () => {

            it("should work on empty layouts", () => {
                let layout = new ns.DragboardLayout({});

                layout.moveTo({});
            });

            it("should work on layouts with widgets", () => {
                let widget = {
                    moveToLayout: jasmine.createSpy('moveToLayout')
                };
                let layout = new ns.DragboardLayout({});
                layout.widgets["1"] = widget;
                let newlayout = {};

                layout.moveTo(newlayout);

                expect(widget.moveToLayout).toHaveBeenCalledWith(newlayout);
            });

        });

        describe("_notifyWindowResizeEvent(widthChanged, heightChanged)", () => {

            it("should work on empty layouts", () => {
                let layout = new ns.DragboardLayout({});

                layout._notifyWindowResizeEvent();
            });

            it("should work on layouts with widgets", () => {
                let widget = {
                    repaint: jasmine.createSpy('repaint')
                };
                let layout = new ns.DragboardLayout({});
                layout.widgets["1"] = widget;

                layout._notifyWindowResizeEvent();

                expect(widget.repaint).toHaveBeenCalledWith();
            });

        });

        describe("parseSize(value)", () => {

            it("should be able to parse numbers", () => {
                let layout = new ns.DragboardLayout({});

                let value = layout.parseSize(1);

                expect(value).toEqual([1, "cells"]);
            });

            it("should be able to parse pixel sizes", () => {
                let layout = new ns.DragboardLayout({});

                let value = layout.parseSize("1px");

                expect(value).toEqual([1, "px"]);
            });

            it("should be able to parse percentage sizes", () => {
                let layout = new ns.DragboardLayout({});

                let value = layout.parseSize("50%");

                expect(value).toEqual([50, "%"]);
            });

            it("should treat values without unit as cell values", () => {
                let layout = new ns.DragboardLayout({});

                let value = layout.parseSize("1");

                expect(value).toEqual([1, "cells"]);
            });

            ["potato", true, false, null, undefined].forEach((value) => {
                it("should raise a TypeError exception on invalid values (" + JSON.stringify(value) + ")", () => {
                    let layout = new ns.DragboardLayout({});
                    expect(() => {
                        layout.parseSize(value);
                    }).toThrowError(TypeError);
                });
            });

        });

        describe("removeWidget(widget, affectsDragboard)", () => {

            var widget;

            beforeEach(() => {
                widget = {
                    id: "1",
                    removeEventListener: jasmine.createSpy("removeEventListener")
                };
            });

            it("should remove widgets", () => {
                let layout = new ns.DragboardLayout({});
                layout.widgets["1"] = widget;

                layout.removeWidget(widget);

                expect(layout.widgets).toEqual({});
                expect(widget.layout).toBe(null);
                expect(widget.removeEventListener).toHaveBeenCalled();
            });

            it("should remove widgets (affecting dragboard)", () => {
                var dragboard = {
                    _removeWidget: jasmine.createSpy("_removeWidget")
                };
                let layout = new ns.DragboardLayout(dragboard);
                layout.widgets["1"] = widget;

                layout.removeWidget(widget, true);

                expect(layout.widgets).toEqual({});
                expect(widget.layout).toBe(null);
                expect(widget.removeEventListener).toHaveBeenCalled();
                expect(dragboard._removeWidget).toHaveBeenCalledWith(widget);
            });

        });


        describe("updatePosition(widget, element)", () => {

            it("should update widget css", () => {
                let layout = new ns.DragboardLayout({});
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(10);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(20);
                let widget = {position: {x: 1, y: 3}, element: document.createElement('div')};

                layout.updatePosition(widget, widget.element);

                expect(widget.element.style.left).toBe("10px");
                expect(widget.element.style.top).toBe("20px");
            });

        });

        describe("provides basic implementations of", () => {
            ["_notifyResizeEvent", "initializeMove", "moveTemporally", "acceptMove", "cancelMove", "disableCursor"].forEach((method) => {
                it("", () => {
                    let layout = new ns.DragboardLayout({});

                    layout[method]();
                });

            });
        });

        describe("widget remove event", () => {

            it("handles widget removals", () => {
                let widget = {
                    id: "1",
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint")
                };
                let layout = new ns.DragboardLayout({
                    update: jasmine.createSpy("update")
                });
                layout.addWidget(widget);
                spyOn(layout, "removeWidget");

                widget.addEventListener.calls.argsFor(0)[1](widget);

                expect(layout.removeWidget).toHaveBeenCalledWith(widget, true);
                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
