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

    describe("SmartColumnLayout", () => {

        describe("new SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace])", () => {

            it("should work by providing options", () => {
                var dragboard = {};
                let layout = new ns.SmartColumnLayout(
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

            it("should work on empty layouts", () => {
                var dragboard = {};
                let layout = new ns.SmartColumnLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );

                expect(layout.initialize()).toBe(false);
            });

            it("should not save widget positions if is not needed to move widgets", () => {
                var dragboard = {};
                let layout = new ns.SmartColumnLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );
                spyOn(ns.ColumnLayout.prototype, "initialize").and.returnValue(false);
                spyOn(layout, "moveSpaceUp").and.returnValue(false);
                var widget = {
                    id: "1",
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint")
                };
                layout.addWidget(widget);

                expect(layout.initialize()).toBe(false);
            });

            it("should save widget positions if widget positions have been modified", () => {
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                let layout = new ns.SmartColumnLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );
                spyOn(ns.ColumnLayout.prototype, "initialize").and.returnValue(false);
                spyOn(layout, "moveSpaceUp").and.returnValue(true);
                var widget = {
                    id: "1",
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint")
                };
                layout.addWidget(widget);

                expect(layout.initialize()).toBe(true);
                expect(layout.dragboard.update).toHaveBeenCalledWith([widget.id]);
            });

        });

        describe("_insertAt(widget, x, y, matrix)", () => {

            it("should be based on ColumnLayout but moving the widget up if possible", () => {
                var dragboard = {};
                let widget = {};
                let layout = new ns.SmartColumnLayout(
                    dragboard,
                    20,
                    13,
                    4,
                    4,
                    10
                );
                spyOn(ns.ColumnLayout.prototype, "_insertAt").and.returnValue(false);
                spyOn(ns.ColumnLayout.prototype, "moveSpaceUp").and.returnValue(new Set());

                layout._insertAt(widget, 0, 0, "base");

                expect(ns.ColumnLayout.prototype._insertAt).toHaveBeenCalledWith(widget, 0, 0, "base");
                expect(ns.ColumnLayout.prototype.moveSpaceUp).toHaveBeenCalledWith("base", widget);
            });

        });

        describe("_notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist", () => {

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
                layout = new ns.SmartColumnLayout(
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
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, false, false);

                expect(layout.matrix[0][0]).toBe(widget1);
                expect(layout.matrix[1][0]).toBe(widget2);
            });

            it("should work on empty layouts (height increase - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, false, false);
                expect(layout.matrix[0][3]).toBe(widget);
            });

            it("should work on layouts with widgets (height increase - right)", () => {
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
                let widget1 = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, true, false);

                expect(layout.matrix[3][0]).toBe(widget1);
                expect(layout.matrix[2][0]).toBe(widget2);
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
                expect(layout.matrix[3][2]).toBe(widget3);
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

            var layout, id_seq;

            const createWidgetMock = function createWidgetMock(data) {
                let widget = {
                    id: "" + id_seq++,
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
                id_seq = 1;
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.SmartColumnLayout(
                    dragboard,
                    4,
                    13,
                    4,
                    4,
                    10
                );
            });

            it("should work on empty buffers", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                expect(layout._removeFromMatrix("base", widget)).toEqual(new Set());
            });

            it("should work on layouts with unaffected widgets (basic case)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                expect(layout._removeFromMatrix("base", widget1)).toEqual(new Set());
                expect(layout.matrix[3][0]).toBe(widget2);
            });

            it("should work on layouts with unaffected widgets (complex case)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 4, width: 4, height: 4
                });

                expect(layout._removeFromMatrix("base", widget1)).toEqual(new Set());
                expect(layout.matrix[0][0]).toBe(undefined);
                expect(layout.matrix[0][3]).toBe(undefined);
                expect(layout.matrix[0][4]).toBe(widget3);
                expect(layout.matrix[3][4]).toBe(widget3);
                expect(layout.matrix[3][3]).toBe(widget2);
            });

            it("should work on layouts with affected widgets (basic case)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 0, y: 4, width: 1, height: 4
                });

                expect(layout._removeFromMatrix("base", widget1)).toEqual(new Set([widget2]));
                expect(layout.matrix[0][0]).toBe(widget2);
            });

            it("should work on layouts with affected widgets (complex case)", () => {
                // | 111|    |2233|
                // | 111| => |22 4|
                // |2233|    |   4|
                // |22 4|    |    |
                // |   4|    |    |
                let widget1 = createWidgetMock({
                    x: 1, y: 0, width: 3, height: 2
                });
                let widget2 = createWidgetMock({
                    x: 0, y: 2, width: 2, height: 2
                });
                let widget3 = createWidgetMock({
                    x: 2, y: 2, width: 2, height: 1
                });
                let widget4 = createWidgetMock({
                    x: 3, y: 3, width: 1, height: 2
                });

                expect(layout._removeFromMatrix("base", widget1)).toEqual(new Set([widget2, widget3, widget4]));
                expect(layout.matrix[0][0]).toBe(widget2);
                expect(layout.matrix[2][0]).toBe(widget3);
                expect(layout.matrix[3][1]).toBe(widget4);
                expect(layout.matrix[3][3]).toBe(undefined);
            });

            it("should work on layouts with affected widgets (complex case)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 3
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 4, width: 2, height: 1
                });
                let widget4 = createWidgetMock({
                    x: 0, y: 5, width: 4, height: 4
                });

                expect(layout._removeFromMatrix("base", widget1)).toEqual(new Set([widget3, widget4]));
                expect(layout.matrix[0][0]).toBe(widget3);
                expect(layout.matrix[0][1]).toBe(undefined);
                expect(layout.matrix[0][3]).toBe(widget4);
                expect(layout.matrix[3][2]).toBe(widget2);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
