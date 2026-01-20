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


(function (ns, utils) {

    "use strict";

    describe("GridLayout", () => {

        describe("new GridLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace)", () => {

            it("should work by providing options", () => {
                const dragboard = {};
                const layout = new ns.GridLayout(
                    dragboard,
                    20,
                    10,
                    4,
                    4,
                    10
                );

                // Check initial values
                expect(layout.columns).toBe(20);
                expect(layout.rows).toBe(10);
                expect(layout.topMargin).toBe(2);
                expect(layout.bottomMargin).toBe(2);
                expect(layout.leftMargin).toBe(2);
                expect(layout.rightMargin).toBe(2);
            });

            it("should work by providing odd margins", () => {
                const dragboard = {};
                const layout = new ns.GridLayout(
                    dragboard,
                    20,
                    10,
                    5,
                    5,
                    10
                );

                // Check initial values
                expect(layout.columns).toBe(20);
                expect(layout.rows).toBe(10);
                expect(layout.topMargin).toBe(2);
                expect(layout.bottomMargin).toBe(3);
                expect(layout.leftMargin).toBe(2);
                expect(layout.rightMargin).toBe(3);
            });
        });

        describe("initialize()", () => {

            let layout;

            const createWidgetMock = function createWidgetMock(data, insert) {
                return {
                    id: data.id,
                    model: {
                        load: jasmine.createSpy("load")
                    },
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
                const dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.GridLayout(
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
                const widget = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 1, height: 1
                });
                layout.addWidget(widget);

                // Check initial values
                expect(layout.initialize()).toBe(false);
            });

            it("should shrink widgets that are too wide", () => {
                const widget1 = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 5, height: 1
                });
                layout.addWidget(widget1);
                const widget2 = createWidgetMock({
                    id: "2", x: 1, y: 1, width: 5, height: 1
                });
                layout.addWidget(widget2);

                // Check initial values
                expect(layout.initialize()).toBe(true);

                expect(widget1.setShape).toHaveBeenCalledWith({width: 4});
                expect(widget2.setShape).toHaveBeenCalledWith({width: 4});
                expect(widget2.setPosition).toHaveBeenCalledWith({relx: true, x: 0, rely: true, y: 1});
            });

            it("should move colliding widgets", () => {
                const widget1 = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 3, height: 2
                });
                layout.addWidget(widget1);
                const widget2 = createWidgetMock({
                    id: "2", x: 1, y: 1, width: 2, height: 1
                });
                layout.addWidget(widget2);

                // Check initial values
                expect(layout.initialize()).toBe(true);
            });

        });

        describe("initializeMove(widget, draggable)", () => {

            const return_this = function () {return this;};
            const draggable = {setXOffset: return_this, setYOffset: return_this};
            let layout;

            const createWidgetMock = function createWidgetMock(data) {
                return new Wirecloud.ui.WidgetView(data);
            };

            beforeEach(() => {
                spyOn(Wirecloud.ui, "WidgetView").and.callFake(function (data) {
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

                const dragboard = {
                    _notifyWindowResizeEvent: jasmine.createSpy("_notifyWindowResizeEvent"),
                    update: jasmine.createSpy("update"),
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(400),
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(800)
                };
                layout = new ns.GridLayout(dragboard, 4, 13, 4, 4, 10);
                spyOn(layout, "updatePosition");
                layout.initialize();
            });

            it("should throw an exception if widget is not a widget instance", () => {
                expect(() => {
                    layout.initializeMove();
                }).toThrowError(TypeError);
                expect(() => {
                    layout.initializeMove("patata");
                }).toThrowError(TypeError);
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

            it("should cancel current move operation", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                spyOn(layout, "cancelMove");

                layout.initializeMove(widget, draggable);
                expect(layout.cancelMove).toHaveBeenCalledWith();
            });


            it("should work on empty layouts (no real move)", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.acceptMove();
            });

            it("should work on empty layouts (basic move)", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(200, 0);
                layout.moveTemporally(420, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({x: 1, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

            it("should work on empty layouts (move outside layout - right side)", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 2, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1000, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({x: 2, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

            it("should work on empty layouts (move outside layout - top left side)", () => {
                const width = 700 * layout.MAX_HLU / 800;
                const widget = createWidgetMock({id: "1", x: 400, y: 600, width: width, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(-100, -100);
                layout.acceptMove();

                expect(widget.position).toEqual({x: 0, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

            it("should work on empty layouts (move between tabs)", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.disableCursor();
                layout.moveTemporally(1, 0);
                layout.acceptMove();
            });

            it("should work on empty layouts (cancel move)", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.cancelMove();
            });

        });

        describe("adaptColumnOffset(size[, width])", () => {

            it("should return 0 LU as minimum", () => {
                const layout = new ns.GridLayout({leftMargin: 4}, 4, 13, 4, 4, 10);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(0);

                const value = layout.adaptColumnOffset(0);

                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should take into account left margin", () => {
                const layout = new ns.GridLayout({leftMargin: 4}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(80);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(0);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(0);

                const value = layout.adaptColumnOffset("2px");

                expect(layout.fromPixelsToHCells).toHaveBeenCalledWith(0, undefined);
                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should handle pixels offsets", () => {
                const layout = new ns.GridLayout({leftMargin: 4}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(80);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(200);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(1);

                const value = layout.adaptColumnOffset("204px");

                expect(layout.fromPixelsToHCells).toHaveBeenCalledWith(202, undefined);
                expect(value.inPixels).toBe(200);
                expect(value.inLU).toBe(1);
            });

            it("should support percentages", () => {
                const layout = new ns.GridLayout({leftMargin: 4}, 4, 13, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getColumnOffset = jasmine.createSpy("getColumnOffset").and.returnValue(60);
                layout.fromPixelsToHCells = jasmine.createSpy("fromPixelsToHCells").and.returnValue(3);

                const value = layout.adaptColumnOffset("75%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

        });

        describe("adaptRowOffset(value)", () => {

            it("should return 0 LU as minimum", () => {
                const layout = new ns.GridLayout({topMargin: 4}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(0);

                const value = layout.adaptRowOffset("2px");

                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should manage cell values", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(0);

                const value = layout.adaptRowOffset(0);

                expect(value.inPixels).toBe(0);
                expect(value.inLU).toBe(0);
            });

            it("should floor cells", () => {
                const layout = new ns.GridLayout({}, 4, 20, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(3.2);

                const value = layout.adaptRowOffset("65px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should ceil cells", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(2.5);

                const value = layout.adaptRowOffset("55px");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

            it("should support percentages", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(80);
                layout.getRowOffset = jasmine.createSpy("getRowOffset").and.returnValue(60);
                layout.fromPixelsToVCells = jasmine.createSpy("fromPixelsToVCells").and.returnValue(3);

                const value = layout.adaptRowOffset("75%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(3);
            });

        });

        describe("addWidget(widget, affectsDragboard)", () => {

            let dragboard, layout;

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
                layout = new ns.GridLayout(dragboard, 4, 10, 4, 4, 10);
                layout.initialized = true;
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "addWidget");
            });

            it("should add widgets", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});

                expect(layout.addWidget(widget, true)).toEqual(new Set());

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should shrink widgets that are too wide", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 5, height: 1});

                expect(layout.addWidget(widget, true)).toEqual(new Set());

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(widget.setShape).toHaveBeenCalledWith({width: 4});
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should make widgets fit current column scheme", () => {
                const widget = createWidgetMock({id: "1", x: 1, y: 0, width: 4, height: 1});
                layout.addWidget(widget, true);

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(widget.setPosition).toHaveBeenCalledWith(new Wirecloud.DragboardPosition(0, 0));
            });

            it("should search a position for not-positioned widgets", () => {
                const widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                widget.position = null;
                widget.setPosition.and.callFake(function (newposition) {this.position = newposition;});
                spyOn(layout, "_searchFreeSpace").and.returnValue({anchor: "top-left", x: 0, y: 0});

                expect(layout.addWidget(widget, true)).toEqual(new Set());

                expect(Wirecloud.ui.DragboardLayout.prototype.addWidget).toHaveBeenCalledWith(widget, true);
                expect(layout.matrix[0][0]).toBe(widget);
            });

        });

        describe("disableCursor()", () => {

            it("should work when the cursor is already disabled", () => {
                const layout = new ns.GridLayout({}, 20, 13, 4, 4, 10);
                layout.disableCursor();
            });

        });

        describe("fromPixelsToHCells(pixels)", () => {

            let dragboard, layout;

            beforeEach(() => {
                dragboard = {};
                layout = new ns.GridLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );
                spyOn(layout, "fromHCellsToPixels").and.returnValue(10);
            });

            it("should work with integer cells", () => {
                expect(layout.fromPixelsToHCells(20)).toBe(2);
            });

            it("should truncate cell values", () => {
                layout.fromHCellsToPixels.and.returnValues(83.5, 417.5);
                expect(layout.fromPixelsToHCells(418)).toBe(5);
            });

            it("should use zero as minimum value", () => {
                expect(layout.fromPixelsToHCells(-1)).toBe(0);
            });

        });

        describe("fromPixelsToVCells(pixels)", () => {

            let dragboard, layout;

            beforeEach(() => {
                dragboard = {
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(400)
                };
                layout = new ns.GridLayout(
                    dragboard,
                    20,
                    10,
                    4,
                    4,
                    10
                );
            });

            it("should return a value", () => {
                expect(layout.fromPixelsToVCells(76)).toBe(2);
            });

            it("should check minimum value is zero", () => {
                expect(layout.fromPixelsToVCells(-1)).toBe(0);
            });

        });

        describe("getCellAt(x, y)", () => {

            let layout;

            beforeEach(() => {
                layout = new ns.GridLayout({}, 4, 4, 4, 4, 10);
                layout.getWidth = jasmine.createSpy("getWidth").and.returnValue(40);
                layout.getHeight = jasmine.createSpy("getHeight").and.returnValue(40);
            });

            it("should be able to return origin position", () => {
                expect(layout.getCellAt(0, 0)).toEqual(new Wirecloud.DragboardPosition(0, 0));
            });

            it("should be able to return intermediate positions", () => {
                expect(layout.getCellAt(38, 12)).toEqual(new Wirecloud.DragboardPosition(3, 1));
            });

        });

        describe("getHeightInPixels(cells)", () => {

            it("should work", () => {
                const dragboard = {
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(400),
                };
                const layout = new ns.GridLayout(
                    dragboard,
                    20,
                    10,
                    4,
                    4,
                    10
                );
                expect(layout.getHeightInPixels(2)).toBe(80 - 4);
            });

        });

        describe("getColumnOffset(cells)", () => {

            it("should work", () => {
                const dragboard = {
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(800),
                    leftMargin: 4
                };
                const layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
                expect(layout.getColumnOffset({x: 2})).toBe(400 + 4 + 2);
            });
        });

        describe("getRowOffset(cells)", () => {

            it("should work", () => {
                const dragboard = {
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(800),
                    topMargin: 4
                };
                const layout = new ns.GridLayout(
                    dragboard,
                    4,
                    4,
                    4,
                    4,
                    10
                );
                expect(layout.getRowOffset({y: 2})).toBe(400 + 4 + 2);
            });
        });

        describe("getWidthInPixels(cells)", () => {

            it("should work", () => {
                const dragboard = {
                    getWidth: jasmine.createSpy("getHeight").and.returnValue(400),
                };
                const layout = new ns.GridLayout(
                    dragboard,
                    10,
                    10,
                    4,
                    4,
                    10
                );
                expect(layout.getWidthInPixels(2)).toBe(80 - 4);
            });

        });

        describe("insertAt(widget, x, y, matrix)", () => {

            let layout;

            const createWidgetMock = function createWidgetMock(data, insert) {
                const widget = {
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
                const dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should support adding widgets on free space", () => {
                const widget = createWidgetMock({
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2
                }, false);

                layout._insertAt(widget, 0, 0, layout._buffers.base);

                expect(layout.matrix[0][0]).toBe(widget);
                expect(layout.matrix[1][1]).toBe(widget);
            });

            it("should move affected widgets", () => {
                const widget1 = createWidgetMock({
                    x: 1,
                    y: 1,
                    width: 2,
                    height: 2
                }, true);
                const widget2 = createWidgetMock({
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2
                }, false);

                layout._insertAt(widget2, 0, 0, layout._buffers.base);

                expect(layout.matrix[0][0]).toBe(widget2);
                expect(layout.matrix[1][1]).toBe(widget2);
                expect(layout.matrix[1][2]).toBe(widget1);
            });

        });

        describe("moveSpaceDown(buffer, widget, offset)", () => {

            let layout;

            const createWidgetMock = function createWidgetMock(data) {
                const widget = {
                    id: data.id,
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
                layout.widgets[widget.id] = widget;

                return widget;
            };

            beforeEach(() => {
                const dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on layouts with widgets", () => {
                const widget1 = createWidgetMock({
                    id: "1", x: 0, y: 0, width: 2, height: 2
                });
                const widget2 = createWidgetMock({
                    id: "2", x: 0, y: 2, width: 1, height: 1
                });
                const widget3 = createWidgetMock({
                    id: "3", x: 0, y: 3, width: 2, height: 1
                });

                layout.moveSpaceDown(layout._buffers.base, widget2, 2);

                expect(layout.matrix[0][0]).toBe(widget1);
                expect(layout.matrix[0][1]).toBe(widget1);
                expect(layout.matrix[0][2]).toBe(undefined);
                expect(layout.matrix[0][3]).toBe(undefined);
                expect(layout.matrix[0][4]).toBe(widget2);
                expect(layout.matrix[0][5]).toBe(widget3);
                expect(layout.matrix[1][0]).toBe(widget1);
                expect(layout.matrix[1][1]).toBe(widget1);
                expect(layout.matrix[1][2]).toBe(undefined);
                expect(layout.matrix[1][3]).toBe(undefined);
                expect(layout.matrix[1][4]).toBe(undefined);
                expect(layout.matrix[1][5]).toBe(widget3);
            });

        });

        describe("moveSpaceUp(buffer, widget)", () => {

            let layout;

            const createWidgetMock = function createWidgetMock(data) {
                const widget = {
                    id: data.id,
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
                layout.widgets[widget.id] = widget;

                return widget;
            };

            beforeEach(() => {
                const dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on layouts with widgets", () => {
                // |  2 |     |112 |
                // |112 |  => |  2 |
                // |  2 |     |  2 |
                // |333 |     |333 |
                // |44  |     |44  |
                const widget1 = createWidgetMock({
                    id: "1", x: 0, y: 1, width: 2, height: 1
                });
                const widget2 = createWidgetMock({
                    id: "2", x: 2, y: 0, width: 1, height: 3
                });
                const widget3 = createWidgetMock({
                    id: "3", x: 0, y: 3, width: 3, height: 1
                });
                const widget4 = createWidgetMock({
                    id: "4", x: 0, y: 4, width: 2, height: 1
                });

                layout.moveSpaceUp(layout._buffers.base, widget1);

                expect(layout.matrix[0][0]).toBe(widget1);
                expect(layout.matrix[0][1]).toBe(undefined);
                expect(layout.matrix[0][2]).toBe(undefined);
                expect(layout.matrix[0][3]).toBe(widget3);
                expect(layout.matrix[0][4]).toBe(widget4);

                expect(layout.matrix[1][0]).toBe(widget1);
                expect(layout.matrix[1][1]).toBe(undefined);
                expect(layout.matrix[1][2]).toBe(undefined);
                expect(layout.matrix[1][3]).toBe(widget3);
                expect(layout.matrix[1][4]).toBe(widget4);

                expect(layout.matrix[2][0]).toBe(widget2);
                expect(layout.matrix[2][1]).toBe(widget2);
                expect(layout.matrix[2][2]).toBe(widget2);
                expect(layout.matrix[2][3]).toBe(widget3);
            });

        });

        describe("moveTo(destLayout)", () => {

            const destLayout = "destLayout";

            let layout;

            beforeEach(() => {
                layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
            });

            it("should work on empty layouts", () => {
                layout.moveTo(destLayout);
            });

            it("should work on layouts with widgets", () => {
                const widget1 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                const widget2 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                const widget3 = {
                    moveToLayout: jasmine.createSpy("moveToLayout")
                };
                layout.matrix[0][0] = widget1;
                layout.matrix[3][0] = widget2;
                layout.matrix[0][6] = widget3;

                layout.moveTo(destLayout);
            });

        });

        describe("_notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist)", () => {

            let layout;

            const createWidgetMock = function createWidgetMock(data) {
                const widget = {
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
                const dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on empty layouts (width increase - right)", () => {
                const widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, false, false, false);

                expect(layout.matrix[1][0]).toBe(widget);
            });

            it("should work on layouts with widgets (width increase - right)", () => {
                // 1  2     11 2
                // 1333  => 11
                // 1        11
                // 1        11
                //          3333
                const widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });
                const widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 1
                });
                const widget3 = createWidgetMock({
                    x: 1, y: 1, width: 3, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 2, 4, false, false, false);

                expect(layout.matrix[1][0]).toBe(widget1);
                expect(layout.matrix[1][3]).toBe(widget1);
                expect(layout.matrix[3][0]).toBe(widget2);
                expect(layout.matrix[1][4]).toBe(widget3);
            });

            it("should work on empty layouts (width decrease - right)", () => {
                const widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, false, false, false);

                expect(layout.matrix[1][0]).toBe(undefined);
            });

            it("should work on layouts with widgets (width decrease - right)", () => {
                // |11  |     |1   |
                // |11  |  => |1   |
                // |11  |     |1   |
                // |11  |     |1   |
                // | 22 |     | 22 |
                const widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                const widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, false, false, false);

                expect(layout.matrix[0][0]).toBe(widget1);
                expect(layout.matrix[1][0]).toBe(undefined);
                expect(layout.matrix[1][4]).toBe(widget2);
            });

            it("should work on empty layouts (height increase - right)", () => {
                const widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, false, false, false);
                expect(layout.matrix[0][3]).toBe(widget);
            });

            it("should work on layouts with widgets (height increase - right)", () => {
                // |1 2 |    |1 2 |
                // |  2 |    |1 2 |
                // |3333| => |1   |
                // |    |    |1   |
                // |    |    |3333|
                const widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });
                const widget2 = createWidgetMock({
                    x: 2, y: 0, width: 1, height: 2
                });
                const widget3 = createWidgetMock({
                    x: 0, y: 2, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 1, 1, 4, false, false, false);
                expect(layout.matrix[0][3]).toBe(widget1);
                expect(layout.matrix[2][0]).toBe(widget2);
                expect(layout.matrix[0][4]).toBe(widget3);
            });

            it("should work on empty layouts (height decrease - right)", () => {
                const widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 1, false, false, false);
                expect(layout.matrix[0][0]).toBe(widget);
            });

            it("should work on empty layouts (width increase - left)", () => {
                const widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, true, false, false);

                expect(layout.matrix[2][3]).toBe(widget);
            });

            it("should work on layouts with widgets (width increase - right)", () => {
                // |2  1|    |2 11|
                // |3331|    |  11|
                // |   1| => |  11|
                // |   1|    |  11|
                // |    |    |333 |
                const widget1 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                const widget2 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });
                const widget3 = createWidgetMock({
                    x: 0, y: 1, width: 3, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 2, 4, true, false, false);

                expect(layout.matrix[2][0]).toBe(widget1);
                expect(layout.matrix[2][3]).toBe(widget1);
                expect(layout.matrix[0][0]).toBe(widget2);
                expect(layout.matrix[2][4]).toBe(widget3);
            });

            it("should work on empty layouts (width decrease - left)", () => {
                const widget = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, true, false, false);
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
                const widget1 = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });
                const widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, true, false);

                expect(layout.matrix[3][0]).toBe(widget1);
                expect(layout.matrix[2][0]).toBe(undefined);
                expect(layout.matrix[2][3]).toBe(undefined);
                expect(layout.matrix[2][4]).toBe(widget2);
            });

            it("should work on empty layouts (height decrease - left)", () => {
                const widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 1, true, false, false);
                expect(layout.matrix[3][0]).toBe(widget);
                expect(layout.matrix[3][1]).toBe(undefined);
            });

            it("should work on layouts with widgets (height decrease - left)", () => {
                // |2  1|    |2  1|
                // |2  1|    |2   |
                // |   1| => |    |
                // |   1|    |    |
                // |3333|    |3333|
                const widget1 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                const widget2 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 2
                });
                const widget3 = createWidgetMock({
                    x: 0, y: 4, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 1, 1, true, false, false);

                expect(layout.matrix[3][0]).toBe(widget1);
                expect(layout.matrix[3][1]).toBe(undefined);
                expect(layout.matrix[3][3]).toBe(undefined);
                expect(layout.matrix[3][4]).toBe(widget3);
                expect(layout.matrix[0][0]).toBe(widget2);
            });

            it("should work on empty layouts (height increase - left)", () => {
                const widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, true, false, false);
                expect(layout.matrix[3][3]).toBe(widget);
            });

            it("should persist changes if required", () => {
                const widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, true, false, true);

                expect(layout.dragboard.update).toHaveBeenCalledWith();
            });

        });

        describe("_notifyWindowResizeEvent(widthChanged, heightChanged)", () => {

            it("should call parent on width change", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "_notifyWindowResizeEvent");

                layout._notifyWindowResizeEvent(true, false);

                expect(Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
            });

            it("should ignore changes not affecting view width/height", () => {
                const widget = {
                    repaint: jasmine.createSpy('repaint')
                };
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout.widgets["1"] = widget;
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "_notifyWindowResizeEvent");

                layout._notifyWindowResizeEvent(false, false);

                expect(widget.repaint).not.toHaveBeenCalled();
            });

        });

        describe("padHeight(height)", () => {

            it("should pad height", () => {
                const layout = new ns.GridLayout({}, 4, 13, 5, 4, 10);
                expect(layout.padHeight(20)).toBe(25);
            });

        });

        describe("padWidth(width)", () => {

            it("should pad width", () => {
                const layout = new ns.GridLayout({}, 4, 13, 5, 4, 10);
                expect(layout.padWidth(20)).toBe(24);
            });

        });

        describe("_removeFromMatrix(matrix, widget)", () => {

            it("should call _clearSpace", () => {
                const dragboard = {};
                const layout = new ns.GridLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
                const widget = {}, matrix = {};
                spyOn(layout, "_clearSpace");

                expect(layout._removeFromMatrix(matrix, widget)).toEqual(new Set());

                expect(layout._clearSpace).toHaveBeenCalledWith(matrix, widget);
            });

        });

        describe("removeWidget(widget, affectsDragboard)", () => {

            it("should call _removeFromMatrix and removeWidget from DragboardLayout", () => {
                const widget = {}, affectsDragboard = {}, result = new Set();
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                spyOn(layout, "_removeFromMatrix").and.returnValue(result);
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "removeWidget").and.returnValue(result);

                expect(layout.removeWidget(widget, affectsDragboard)).toEqual(result);

                expect(layout._removeFromMatrix).toHaveBeenCalledWith(layout._buffers.base, widget);
                expect(Wirecloud.ui.DragboardLayout.prototype.removeWidget).toHaveBeenCalledWith(widget, affectsDragboard);
            });

        });

        describe("_setPositions()", () => {

            it("works on empty layouts", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout._buffers.shadow = {
                    positions: {}
                };
                layout.dragboardCursor = {setPosition: jasmine.createSpy("setPosition")};

                layout._setPositions();
            });

            it("works on layouts with widgets", () => {
                const layout = new ns.GridLayout({}, 4, 13, 4, 4, 10);
                layout._buffers.shadow = {
                    positions: {}
                };
                layout.dragboardCursor = {setPosition: jasmine.createSpy("setPosition")};
                spyOn(layout, "_getPositionOn");

                layout.widgets = [
                    {setPosition: jasmine.createSpy("setPosition")}
                ];

                layout._setPositions();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
