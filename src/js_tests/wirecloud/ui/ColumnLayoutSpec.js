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

    describe("ColumnLayout", () => {

        describe("new ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace)", () => {

            it("should work by providing options", () => {
                var dragboard = {};
                let layout = new ns.ColumnLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );

                // Check initial values
                expect(layout.columns).toBe(20);
                expect(layout.rows).toBe(0);
            });

        });

        describe("initialize()", () => {

            var layout;

            const createWidgetMock = function createWidgetMock(data, insert) {
                return {
                    id: data.id,
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    shape: {
                        width: data.width,
                        height: data.height
                    },
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint"),
                    setPosition: jasmine.createSpy('setPosition').and.callFake(function (newposition) {Object.assign(this.position, newposition);}),
                    setShape: jasmine.createSpy('setShape').and.callFake(function (newshape) {Object.assign(this.shape, newshape);})
                };
            };

            beforeEach(() => {
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.ColumnLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on empty layouts", () => {
                expect(layout.initialize()).toBe(false);
            });

            it("should not save widget positions if is not needed to move widgets", () => {
                var widget = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 1, height: 1
                });
                layout.addWidget(widget);

                // Check initial values
                expect(layout.initialize()).toBe(false);
            });

            it("should shrink widgets that are too wide", () => {
                var widget1 = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 5, height: 1
                });
                layout.addWidget(widget1);
                var widget2 = createWidgetMock({
                    id: "2", x: 1, y: 1, width: 5, height: 1
                });
                layout.addWidget(widget2);

                // Check initial values
                expect(layout.initialize()).toBe(true);

                expect(widget1.setShape).toHaveBeenCalledWith({width: 4});
                expect(widget2.setShape).toHaveBeenCalledWith({width: 4});
                expect(widget2.setPosition).toHaveBeenCalledWith(new Wirecloud.DragboardPosition(0, 1));
            });

            it("should move colliding widgets", () => {
                var widget1 = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 3, height: 2
                });
                layout.addWidget(widget1);
                var widget2 = createWidgetMock({
                    id: "2", x: 1, y: 1, width: 2, height: 1
                });
                layout.addWidget(widget2);

                // Check initial values
                expect(layout.initialize()).toBe(true);
            });

        });

        describe("initializeMove(widget, draggable)", () => {

            var layout;

            const createWidgetMock = function createWidgetMock(data) {
                Wirecloud.ui.WidgetView = jasmine.createSpy("WidgetView").and.callFake(function () {
                    this.id = data.id;
                    this.position = {
                        x: data.x,
                        y: data.y
                    };
                    this.shape = {
                        width: data.width,
                        height: data.height
                    };
                    this.addEventListener = jasmine.createSpy("addEventListener");
                    this.repaint = jasmine.createSpy("repaint");
                    this.setPosition = jasmine.createSpy('setPosition').and.callFake(function (newposition) {this.position = Object.assign({}, this.position, newposition);});
                    this.setShape = jasmine.createSpy('setShape').and.callFake(function (newshape) {Object.assign(this.shape, newshape);});
                    this.wrapperElement = document.createElement('div');
                    this.tab = {
                        wrapperElement: document.createElement('div')
                    };
                    this.tab.wrapperElement.appendChild(this.wrapperElement);
                });

                return new Wirecloud.ui.WidgetView(data);
            };

            beforeEach(() => {
                var dragboard = {
                    _notifyWindowResizeEvent: jasmine.createSpy("_notifyWindowResizeEvent"),
                    update: jasmine.createSpy("update")
                };
                layout = new ns.ColumnLayout(dragboard, 4, 13, 4, 4, 10);
                spyOn(layout, "updatePosition");
                layout.initialize();
            });

            it("should ignore not initialized movements", () => {
                layout.moveTemporally(1, 0);
            });

            it("should ignore not initialized movement cancelations", () => {
                layout.cancelMove();
            });

            it("should ignore not initialized movement cancelations", () => {
                layout.acceptMove();
            });

            it("should work on empty layouts (no real move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, null);
                layout.acceptMove();
            });

            it("should work on empty layouts (basic move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, null);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({x: 1, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

            it("should work on empty layouts (move between tabs)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, null);
                layout.disableCursor();
                layout.moveTemporally(1, 0);
                layout.acceptMove();
            });

            it("should work on empty layouts (cancel move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, null);
                layout.moveTemporally(1, 0);
                layout.cancelMove();
            });

        });

        describe("adaptColumnOffset(size)", () => {

            it("should return 0 LU as minimum", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(0);

                let value = layout.adaptColumnOffset(0);

                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should floor cells", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(80);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(60);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(3.2);

                let value = layout.adaptColumnOffset("65px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should ceil cells", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(80);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(60);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(2.5);

                let value = layout.adaptColumnOffset("50px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should support percentages", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(60);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(3);

                let value = layout.adaptColumnOffset("75%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

        });

        describe("adaptRowOffset(value)", () => {

            it("should return 0 LU as minimum", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(0);

                let value = layout.adaptRowOffset(0);

                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should floor cells", () => {
                let layout = new ns.ColumnLayout({}, 4, 20, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(3.2);

                let value = layout.adaptRowOffset("65px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should ceil cells", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2.5);

                let value = layout.adaptRowOffset("55px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should support percentages", () => {
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(3);

                let value = layout.adaptRowOffset("75%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

        });

        describe("addWidget(widget, affectsDragboard)", () => {

            var dragboard, layout;

            const createWidgetMock = function createWidgetMock(data, insert) {
                return {
                    id: data.id,
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    shape: {
                        width: data.width,
                        height: data.height
                    },
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint"),
                    setPosition: jasmine.createSpy('setPosition').and.callFake(function (newposition) {Object.assign(this.position, newposition);}),
                    setShape: jasmine.createSpy('setShape').and.callFake(function (newshape) {Object.assign(this.shape, newshape);})
                };
            };

            beforeEach(() => {
                layout = new ns.ColumnLayout(dragboard, 4, 10, 4, 4, 10);
                layout.initialized = true;
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "addWidget");
            });

            it("should add widgets", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});

                expect(layout.addWidget(widget, true)).toBe(false);

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should shrink widgets that are too wide", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 5, height: 1});

                expect(layout.addWidget(widget, true)).toBe(false);

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(widget.setShape).toHaveBeenCalledWith({width: 4});
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should make widgets fit current column scheme", () => {
                let widget = createWidgetMock({id: "1", x: 1, y: 0, width: 4, height: 1});
                layout.addWidget(widget, true);

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(widget.setPosition).toHaveBeenCalledWith(new Wirecloud.DragboardPosition(0, 0));
            });

        });

        describe("getCellAt(x, y)", () => {

            it("should be able to return origin position", () => {
                let layout = new ns.ColumnLayout({}, 4, 10, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);

                expect(layout.getCellAt(0, 0)).toEqual(new Wirecloud.DragboardPosition(0, 0));
            });

            it("should be able to return intermediate positions", () => {
                let layout = new ns.ColumnLayout({}, 4, 10, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);

                expect(layout.getCellAt(38, 12)).toEqual(new Wirecloud.DragboardPosition(3, 1));
            });

        });

        describe("insertAt(widget, x, y, matrix)", () => {

            var layout;

            const createWidgetMock = function createWidgetMock(data, insert) {
                let widget = {
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    shape: {
                        width: data.width,
                        height: data.height
                    },
                    setPosition: jasmine.createSpy('setPosition').and.callFake(function (newposition) {this.position = newposition;})
                };
                if (insert) {
                    layout._reserveSpace2(
                        layout.matrix,
                        widget,
                        widget.position.x, widget.position.y,
                        widget.shape.width, widget.shape.height
                    );
                }

                return widget;
            };

            beforeEach(() => {
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.ColumnLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should support adding widgets on free space", () => {
                let widget = createWidgetMock({
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2
                }, false);

                layout._insertAt(widget, 0, 0, "base");

                expect(layout.matrix[0][0]).toBe(widget);
                expect(layout.matrix[1][1]).toBe(widget);
            });

            it("should move affected widgets", () => {
                let widget1 = createWidgetMock({
                    x: 1,
                    y: 1,
                    width: 2,
                    height: 2
                }, true);
                let widget2 = createWidgetMock({
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2
                }, false);

                layout._insertAt(widget2, 0, 0, "base");

                expect(layout.matrix[0][0]).toBe(widget2);
                expect(layout.matrix[1][1]).toBe(widget2);
                expect(layout.matrix[1][2]).toBe(widget1);
            });

        });

        describe("moveTo(destLayout)", () => {

            const destLayout = "destLayout";

            var layout;

            beforeEach(() => {
                layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
            });

            it("should work on empty layouts", () => {
                layout.moveTo(destLayout);
            });

            it("should work on layouts with widgets", () => {
                let widget1 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                let widget2 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                let widget3 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                layout.matrix[0][0] = widget1;
                layout.matrix[3][0] = widget2;
                layout.matrix[0][6] = widget3;

                layout.moveTo(destLayout);
            });

        });

        describe("_notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist)", () => {

            var layout;

            const createWidgetMock = function createWidgetMock(data) {
                let widget = {
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    shape: {
                        width: data.width,
                        height: data.height
                    },
                    setPosition: jasmine.createSpy('setPosition').and.callFake(function (newposition) {this.position = newposition;})
                };
                layout._reserveSpace2(
                    layout.matrix,
                    widget,
                    widget.position.x, widget.position.y,
                    widget.shape.width, widget.shape.height
                );

                return widget;
            };

            beforeEach(() => {
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.ColumnLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on empty layouts (width increase - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, false, false);

                expect(layout.matrix[1][0]).toBe(widget);
            });

            it("should work on layouts with widgets (width increase - right)", () => {
                // 1  2     11 2
                // 1333  => 11
                // 1        11
                // 1        11
                //          3333
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 1
                });
                let widget3 = createWidgetMock({
                    x: 1, y: 1, width: 3, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 2, 4, false, false);

                expect(layout.matrix[1][0]).toBe(widget1);
                expect(layout.matrix[1][3]).toBe(widget1);
                expect(layout.matrix[3][0]).toBe(widget2);
                expect(layout.matrix[1][4]).toBe(widget3);
            });

            it("should work on empty layouts (width decrease - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, false, false);

                expect(layout.matrix[1][0]).toBe(undefined);
            });

            it("should work on layouts with widgets (width decrease - right)", () => {
                // |11  |     |1   |
                // |11  |  => |1   |
                // |11  |     |1   |
                // |11  |     |1   |
                // | 22 |     | 22 |
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, false, false);

                expect(layout.matrix[0][0]).toBe(widget1);
                expect(layout.matrix[1][0]).toBe(undefined);
                expect(layout.matrix[1][4]).toBe(widget2);
            });

            it("should work on empty layouts (height increase - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, false, false);
                expect(layout.matrix[0][3]).toBe(widget);
            });

            it("should work on layouts with widgets (height increase - right)", () => {
                // |1 2 |    |1 2 |
                // |  2 |    |1 2 |
                // |3333| => |1   |
                // |    |    |1   |
                // |    |    |3333|
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });
                let widget2 = createWidgetMock({
                    x: 2, y: 0, width: 1, height: 2
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 2, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 1, 1, 4, false, false);
                expect(layout.matrix[0][3]).toBe(widget1);
                expect(layout.matrix[2][0]).toBe(widget2);
                expect(layout.matrix[0][4]).toBe(widget3);
            });

            it("should work on empty layouts (height decrease - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 1, false, false);
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should work on empty layouts (width increase - left)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, true, false);

                expect(layout.matrix[2][3]).toBe(widget);
            });

            it("should work on layouts with widgets (width increase - right)", () => {
                // |2  1|    |2 11|
                // |3331|    |  11|
                // |   1| => |  11|
                // |   1|    |  11|
                // |    |    |333 |
                let widget1 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 1, width: 3, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 2, 4, true, false);

                expect(layout.matrix[2][0]).toBe(widget1);
                expect(layout.matrix[2][3]).toBe(widget1);
                expect(layout.matrix[0][0]).toBe(widget2);
                expect(layout.matrix[2][4]).toBe(widget3);
            });

            it("should work on empty layouts (width decrease - left)", () => {
                let widget = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, true, false);
                expect(layout.matrix[3][0]).toBe(widget);
                expect(layout.matrix[2][0]).toBe(undefined);
                expect(layout.matrix[2][3]).toBe(undefined);
            });

            it("should work on layouts with widgets (width decrease - left)", () => {
                // |  11|    |   1|
                // |  11|    |   1|
                // |  11| => |   1|
                // |  11|    |   1|
                // | 22 |    | 22 |
                let widget1 = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, true, false);

                expect(layout.matrix[3][0]).toBe(widget1);
                expect(layout.matrix[2][0]).toBe(undefined);
                expect(layout.matrix[2][3]).toBe(undefined);
                expect(layout.matrix[2][4]).toBe(widget2);
            });

            it("should work on empty layouts (height decrease - left)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 1, true, false);
                expect(layout.matrix[3][0]).toBe(widget);
                expect(layout.matrix[3][1]).toBe(undefined);
            });

            it("should work on layouts with widgets (height decrease - left)", () => {
                // |2  1|    |2  1|
                // |2  1|    |2   |
                // |   1| => |    |
                // |   1|    |    |
                // |3333|    |3333|
                let widget1 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 2
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 4, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 1, 1, true, false);

                expect(layout.matrix[3][0]).toBe(widget1);
                expect(layout.matrix[3][1]).toBe(undefined);
                expect(layout.matrix[3][3]).toBe(undefined);
                expect(layout.matrix[3][4]).toBe(widget3);
                expect(layout.matrix[0][0]).toBe(widget2);
            });

            it("should work on empty layouts (height increase - left)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, true, false);
                expect(layout.matrix[3][3]).toBe(widget);
            });

            it("should persist changes if required", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, true, true);
            });

        });

        describe("_removeFromMatrix(matrix, widget)", () => {

            it("should call _clearSpace", () => {
                var dragboard = {};
                var layout = new ns.ColumnLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
                var widget = {}, matrix = {};
                spyOn(layout, "_clearSpace");

                expect(layout._removeFromMatrix(matrix, widget)).toBe(false);

                expect(layout._clearSpace).toHaveBeenCalledWith(matrix, widget);
            });

        });

        describe("removeWidget(widget, affectsDragboard)", () => {

            it("should call _removeFromMatrix and removeWidget from DragboardLayout", () => {
                let widget = {}, affectsDragboard = {}, result = {};
                let layout = new ns.ColumnLayout({}, 4, 13, 4, 4, 10);
                spyOn(layout, "_removeFromMatrix").and.returnValue(result);
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "removeWidget").and.returnValue(result);

                expect(layout.removeWidget(widget, affectsDragboard)).toBe(result);

                expect(layout._removeFromMatrix).toHaveBeenCalledWith("base", widget);
                expect(Wirecloud.ui.DragboardLayout.prototype.removeWidget).toHaveBeenCalledWith(widget, affectsDragboard);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
