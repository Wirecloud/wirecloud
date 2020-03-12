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

    describe("FreeLayout", () => {

        describe("new FreeLayout(dragboard)", () => {

            it("should work by providing options", () => {
                new ns.FreeLayout({});
            });

        });

        describe("adaptColumnOffset(value)", () => {

            it("should floor cells", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getWidth").and.returnValue(100);

                let value = layout.adaptColumnOffset("60.3%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(600000);
            });

            it("should ceil cells", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getWidth").and.returnValue(100);

                let value = layout.adaptColumnOffset("60.7%");

                expect(value.inPixels).toBe(61);
                expect(value.inLU).toBe(610000);
            });

            it("should support pixel units", () => {
                let layout = new ns.FreeLayout({
                    leftMargin: 2,
                    topMargin: 2
                });
                spyOn(layout, "getWidth").and.returnValue(100);

                let value = layout.adaptColumnOffset("58px");

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

            it("should support cell units", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getWidth").and.returnValue(100);

                let value = layout.adaptColumnOffset(560000);

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

        });

        describe("adaptHeight(value)", () => {

            it("should floor cells", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptHeight("60.3%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(600000);
            });

            it("should ceil cells", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptHeight("60.7%");

                expect(value.inPixels).toBe(61);
                expect(value.inLU).toBe(610000);
            });

            it("should support pixel units", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptHeight("56px");

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

            it("should support cell units", () => {
                let layout = new ns.FreeLayout({});
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptHeight(56);

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

        });

        describe("adaptRowOffset(value)", () => {

            it("should floor cells", () => {
                let layout = new ns.FreeLayout({
                    leftMargin: 2,
                    topMargin: 2
                });
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptRowOffset("62.3%");

                expect(value.inPixels).toBe(60);
                expect(value.inLU).toBe(600000);
            });

            it("should ceil cells", () => {
                let layout = new ns.FreeLayout({
                    leftMargin: 2,
                    topMargin: 2
                });
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptRowOffset("62.7%");

                expect(value.inPixels).toBe(61);
                expect(value.inLU).toBe(610000);
            });

            it("should support pixel units", () => {
                let layout = new ns.FreeLayout({
                    leftMargin: 2,
                    topMargin: 2
                });
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptRowOffset("58px");

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

            it("should support cell units", () => {
                let layout = new ns.FreeLayout({
                    leftMargin: 2,
                    topMargin: 2
                });
                spyOn(layout, "getHeight").and.returnValue(100);

                let value = layout.adaptRowOffset(58);

                expect(value.inPixels).toBe(56);
                expect(value.inLU).toBe(560000);
            });

        });

        describe("initialize()", () => {

            it("should work on empty layouts", () => {
                let layout = new ns.FreeLayout({});

                expect(layout.initialize()).toBe(false);
            });

            it("should work on non-empty layouts", () => {
                var dragboard = {
                    update: jasmine.createSpy("update")
                };
                let layout = new ns.FreeLayout(dragboard);
                var widget = {
                    id: "1",
                    addEventListener: jasmine.createSpy("addEventListener"),
                    repaint: jasmine.createSpy("repaint")
                };
                layout.addWidget(widget);

                expect(layout.initialize()).toBe(false);

                expect(widget.repaint).toHaveBeenCalledWith();
                expect(layout.dragboard.update).not.toHaveBeenCalled();
            });

        });

        describe("fromPixelsToVCells(pixels)", () => {

            it("should return a value", () => {
                let layout = new ns.FreeLayout({
                    getHeight: function () {return 1000;}
                });
                expect(layout.fromPixelsToVCells(306)).toBe(306000);
            });

        });

        describe("getCellAt(x, y)", () => {

            it("should return a DragboardPosition", () => {
                var dragboard = {
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(100)
                };
                let layout = new ns.FreeLayout(dragboard);

                expect(layout.getCellAt(0, 0)).toEqual(jasmine.any(Wirecloud.DragboardPosition));
            });

        });

        describe("_notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist)", () => {

            var dragboard, layout;

            const createWidgetMock = function createWidgetMock(data) {
                return {
                    position: {
                        anchor: data.anchor || "topleft",
                        relx: data.relx || false,
                        rely: data.rely || false,
                        x: data.x,
                        y: data.y
                    },
                    shape: {
                        width: data.width,
                        height: data.height
                    },
                    repaint: jasmine.createSpy('repaint'),
                    setPosition: jasmine.createSpy('setPosition').and.callFake(function (newposition) {this.position = newposition; return this;})
                };
            };

            beforeEach(() => {
                dragboard = {
                    update: jasmine.createSpy("update")
                };
                layout = new ns.FreeLayout(dragboard);
            });

            it("should work on empty layouts (width change - right)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, false, false, false);

                expect(widget.setPosition).not.toHaveBeenCalled();
            });

            it("should work on empty layouts (width change - left, topcenter)", () => {
                let widget = createWidgetMock({
                    anchor: "topcenter", x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, true, false, false);

                expect(widget.setPosition).toHaveBeenCalled();
            });

            it("should work on empty layouts (no size change - left, topcenter)", () => {
                let widget = createWidgetMock({
                    anchor: "topcenter", x: 0, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 4, true, false, false);

                expect(widget.setPosition).not.toHaveBeenCalled();
            });

            it("should work on layouts with widgets (width change - right)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 1
                });
                let widget3 = createWidgetMock({
                    x: 1, y: 1, width: 3, height: 1
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, false, false, false);

                expect(widget1.setPosition).not.toHaveBeenCalled();
                expect(widget2.setPosition).not.toHaveBeenCalled();
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });

            it("should work on empty layouts (height change - right, bottom)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, false, false, false);
                expect(widget.setPosition).not.toHaveBeenCalled();
            });

            it("should work on empty layouts (height change - right, top)", () => {
                let widget = createWidgetMock({
                    x: 0, y: 4, width: 1, height: 1
                });

                layout._notifyResizeEvent(widget, 1, 1, 1, 4, false, true, false);
                expect(widget.setPosition).toHaveBeenCalledWith({y: 1});
            });

            it("should work on layouts with widgets (height change - right)", () => {
                let widget1 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 1
                });
                let widget2 = createWidgetMock({
                    x: 2, y: 0, width: 1, height: 2
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 2, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 3, 1, 2, false, false, false);
                expect(widget1.setPosition).not.toHaveBeenCalled();
                expect(widget2.setPosition).not.toHaveBeenCalled();
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });

            it("should work on empty layouts (width change - left)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 2, 4, true, false, false);

                expect(widget.setPosition).toHaveBeenCalledWith({x: 2});
            });

            it("should work on layouts with widgets (width change - left)", () => {
                let widget1 = createWidgetMock({
                    x: 2, y: 0, width: 2, height: 4
                });
                createWidgetMock({
                    x: 1, y: 4, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget1, 2, 4, 1, 4, true, false, false);

                expect(widget1.setPosition).toHaveBeenCalledWith({x: 3});
            });

            it("should work on empty layouts (height change - left, bottom)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 1, 1, true, false, false);
                expect(widget.setPosition).not.toHaveBeenCalled();
            });

            it("should work on empty layouts (width change - rigth, top)", () => {
                let widget = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });

                layout._notifyResizeEvent(widget, 1, 4, 4, 4, false, true, false);
                expect(widget.setPosition).not.toHaveBeenCalled();
            });

            it("should work on layouts with widgets (height change - left)", () => {
                let widget1 = createWidgetMock({
                    x: 3, y: 0, width: 1, height: 4
                });
                let widget2 = createWidgetMock({
                    x: 0, y: 0, width: 1, height: 2
                });
                let widget3 = createWidgetMock({
                    x: 0, y: 4, width: 4, height: 1
                });

                layout._notifyResizeEvent(widget1, 1, 4, 1, 1, true, false, false);

                expect(widget1.setPosition).not.toHaveBeenCalled();
                expect(widget2.setPosition).not.toHaveBeenCalled();
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });

            it("should persist changes if required", () => {
                let widget = createWidgetMock({
                    x: 0, y: 0, width: 2, height: 4
                });

                layout._notifyResizeEvent(widget, 2, 4, 1, 4, true, false, true);

                expect(dragboard.update).toHaveBeenCalledWith([widget.id]);
            });

        });

        describe("getColumnOffset(position)", () => {

            it("should work with relative positions (from left)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    leftMargin: 4,
                    topMargin: 7
                });
                expect(layout.getColumnOffset({relx: true, anchor: "topleft", x: 500000})).toBe(404);
            });

            it("should work with relative positions (from left, css)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    leftMargin: 4,
                    rightMargin: 7
                });
                expect(layout.getColumnOffset({relx: true, anchor: "topleft", x: 500000}, true)).toBe("calc(50% + -1.5px)");
            });

            it("should work with relative positions (from right)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    rightMargin: 3,
                    topMargin: 7
                });
                expect(layout.getColumnOffset({relx: true, anchor: "topright", x: 500000})).toBe(403);
            });

            it("should work with relative positions (from right, css)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    rightMargin: 3,
                    leftMargin: 7
                });
                expect(layout.getColumnOffset({relx: true, anchor: "topright", x: 500000}, true)).toBe("calc(50% + -2px)");
            });

            it("should work with absolute positions (from left)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    leftMargin: 4,
                    topMargin: 7
                });
                expect(layout.getColumnOffset({relx: false, anchor: "topleft", x: 400})).toBe(404);
            });

            it("should work with absolute positions (from right)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    leftMargin: 4,
                    rightMargin: 3,
                    topMargin: 7
                });
                expect(layout.getColumnOffset({relx: false, anchor: "topright", x: 400})).toBe(403);
            });

            it("should work with absolute positions (from right, css)", () => {
                var layout = new ns.FreeLayout({
                    getWidth: function () {return 800;},
                    leftMargin: 4,
                    rightMargin: 3,
                    topMargin: 7,
                });
                expect(layout.getColumnOffset({relx: false, anchor: "topright", x: 400}, true)).toBe("403px");
            });

        });

        describe("getHeightInPixels(cells)", () => {

            it("should work", () => {
                var layout = new ns.FreeLayout({
                    getHeight: function () {return 800;},
                    leftMargin: 4,
                    topMargin: 7
                });
                expect(layout.getHeightInPixels(500000)).toBe(400);
            });

        });

        describe("getRowOffset(column[, css])", () => {

            it("should work with relative positions (from top)", () => {
                var layout = new ns.FreeLayout({
                    getHeight: function () {return 800;},
                    topMargin: 7
                });
                expect(layout.getRowOffset({y: 500000, rely: true, anchor: "topleft"})).toBe(407);
            });

            it("should work with relative positions (from bottom)", () => {
                var layout = new ns.FreeLayout({
                    getHeight: function () {return 800;},
                    bottomMargin: 5
                });
                expect(layout.getRowOffset({y: 500000, rely: true, anchor: "bottomleft"})).toBe(405);
            });

            it("should work with absolute positions (from top)", () => {
                var layout = new ns.FreeLayout({
                    topMargin: 7
                });
                expect(layout.getRowOffset({y: 400, rely: false, anchor: "topleft"})).toBe(407);
            });

            it("should work with absolute positions (from bottom)", () => {
                var layout = new ns.FreeLayout({
                    bottomMargin: 5
                });
                expect(layout.getRowOffset({y: 400, rely: false, anchor: "bottomleft"})).toBe(405);
            });

            it("should work with relative positions (from top, css)", () => {
                var layout = new ns.FreeLayout({
                    getHeight: function () {return 800;},
                    topMargin: 10,
                    bottomMargin: 10
                });
                expect(layout.getRowOffset({y: 500000, rely: true, anchor: "topleft"}, true)).toBe("calc(50% + 0px)");
            });

            it("should work with relative positions (from bottom, css)", () => {
                var layout = new ns.FreeLayout({
                    getHeight: function () {return 800;},
                    topMargin: 10,
                    bottomMargin: 5
                });
                expect(layout.getRowOffset({y: 500000, rely: true, anchor: "bottomleft"}, true)).toBe("calc(50% + -2.5px)");
            });

            it("should work with absolute positions (from top, css)", () => {
                var layout = new ns.FreeLayout({
                    topMargin: 7
                });
                expect(layout.getRowOffset({y: 400, rely: false, anchor: "topleft"}, true)).toBe("407px");
            });

            it("should work with absolute positions (from bottom, css)", () => {
                var layout = new ns.FreeLayout({
                    bottomMargin: 5
                });
                expect(layout.getRowOffset({y: 400, rely: false, anchor: "bottomleft"}, true)).toBe("405px");
            });

        });

        describe("_notifyWindowResizeEvent(widthChanged, heightChanged)", () => {

            it("should call parent on width change", () => {
                var layout = new ns.FreeLayout({});
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "_notifyWindowResizeEvent");

                layout._notifyWindowResizeEvent(true, false);

                expect(Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
            });

            it("should ignore changes not affecting view width", () => {
                var layout = new ns.FreeLayout({});
                spyOn(Wirecloud.ui.DragboardLayout.prototype, "_notifyWindowResizeEvent");

                layout._notifyWindowResizeEvent(false, false);

                expect(Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent).not.toHaveBeenCalled();
            });

        });

        describe("initializeMove(widget, draggable)", () => {

            const return_this = function () {return this;};
            const draggable = {setXOffset: return_this, setYOffset: return_this};
            var layout;

            const createWidgetMock = function createWidgetMock(data) {
                return new Wirecloud.ui.WidgetView(data);
            };

            beforeEach(() => {
                spyOn(Wirecloud.ui, "WidgetView").and.callFake(function (data) {
                    this.id = data.id;
                    this.position = {
                        anchor: data.anchor || "topleft",
                        relx: data.relx || false,
                        rely: data.rely || false,
                        x: data.x,
                        y: data.y
                    };
                    this.shape = {
                        relwidth: data.relwidth || false,
                        relheight: data.relheight || false,
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

                var dragboard = {
                    _notifyWindowResizeEvent: jasmine.createSpy("_notifyWindowResizeEvent"),
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(800),
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(800),
                    topMargin: 0,
                    leftMargin: 0,
                    update: jasmine.createSpy("update")
                };
                layout = new ns.FreeLayout(dragboard);
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
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                spyOn(layout, "cancelMove");

                layout.initializeMove(widget, draggable);
                expect(layout.cancelMove).toHaveBeenCalledWith();
            });

            it("should work on empty layouts (no real move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.acceptMove();
            });

            it("should work on empty layouts (basic move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: "topleft", relx: false, rely: false, x: 2, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (basic move - bottom)", () => {
                let widget = createWidgetMock({id: "1", anchor: "bottomleft", x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: "bottomleft", relx: false, rely: false, x: 2, y: 799});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (basic move - rely, bottom, center)", () => {
                let widget = createWidgetMock({id: "1", anchor: "bottomcenter", rely: true, x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: "bottomcenter", relx: false, rely: true, x: 3.5, y: 998750});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (basic move - relwidth, top, center)", () => {
                let widget = createWidgetMock({id: "1", anchor: "topcenter", relwidth: true, x: 0, y: 0, width: 250000, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: "topcenter", relx: false, rely: false, x: 102, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (basic move - relx, bottom, right)", () => {
                let widget = createWidgetMock({id: "1", anchor: "bottomright", relx: true, x: 0, y: 0, width: 3, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.moveTemporally(2, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: "bottomright", relx: true, rely: false, x: 993750, y: 799});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (move outside layout - right side)", () => {
                let width = 700 * layout.MAX_HLU / 800;
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: width, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(2 * width / 7, 0);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: 'topleft', relx: false, rely: false, x: width / 7, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (move outside layout - top left side)", () => {
                let width = 700 * layout.MAX_HLU / 800;
                let widget = createWidgetMock({id: "1", x: 400, y: 600, width: width, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(-100, -100);
                layout.acceptMove();

                expect(widget.position).toEqual({anchor: 'topleft', relx: false, rely: false, x: 0, y: 0});
                expect(layout.dragboard.update).toHaveBeenCalledWith(["1"]);
            });

            it("should work on empty layouts (move between tabs)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.disableCursor();
                layout.moveTemporally(1, 0);
                layout.acceptMove();
            });

            it("should work on empty layouts (cancel move)", () => {
                let widget = createWidgetMock({id: "1", x: 0, y: 0, width: 1, height: 1});
                layout.addWidget(widget);
                layout.initializeMove(widget, draggable);
                layout.moveTemporally(1, 0);
                layout.cancelMove();
            });

        });

        describe("searchBestPosition(width, height, refiframe, options)", () => {

            var dragboard, layout;

            beforeEach(() => {
                dragboard = {
                    leftMargin: 0,
                    topMargin: 0,
                    getWidth: jasmine.createSpy("getWidth").and.returnValue(100),
                    getHeight: jasmine.createSpy("getHeight").and.returnValue(100),
                    tab: {
                        wrapperElement: document.createElement('div')
                    },
                    update: jasmine.createSpy("update")
                };
                layout = new ns.FreeLayout(dragboard);
            });

            it("should use first placement (bottom-right) when possible", () => {
                var options = {
                    width: 10,
                    height: 10,
                    refposition: {left: 10, bottom: 10}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(10);
                expect(options.height).toBe(10);
                expect(options.left).toBe(100000);
                expect(options.top).toBe(10);
            });

            it("should use second placement when possible", () => {
                var options = {
                    width: 750000,
                    height: 20,
                    refposition: {left: 70, right: 90, bottom: 10}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(750000);
                expect(options.height).toBe(20);
                expect(options.left).toBe(150000);
                expect(options.top).toBe(10);
            });

            it("should use last placement when possible", () => {
                var options = {
                    width: 800000,
                    height: 20,
                    refposition: {left: 80, right: 90, top: 90, bottom: 99}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(800000);
                expect(options.height).toBe(20);
                expect(options.left).toBe(100000);
                expect(options.top).toBe(70);
            });

            it("should reduce widget height if there is not enough space", () => {
                var options = {
                    width: 800000,
                    height: 100,
                    refposition: {left: 80, right: 90, top: 90, bottom: 99}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(800000);
                expect(options.height).toBe(100);
                expect(options.left).toBe(100000);
                expect(options.top).toBe(0);
            });

            it("should reduce widget width (rigth side) if there is not enough space", () => {
                var options = {
                    width: 950000,
                    height: 100,
                    refposition: {left: 10, right: 90, top: 0, bottom: 10}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(900000);
                expect(options.height).toBe(100);
                expect(options.left).toBe(100000);
                expect(options.top).toBe(10);
            });

            it("should reduce widget width (left side) if there is not enough space", () => {
                var options = {
                    width: 950000,
                    height: 100,
                    refposition: {left: 70, right: 90, top: 0, bottom: 10}
                };

                layout.searchBestPosition(options);

                expect(options.width).toBe(950000);
                expect(options.height).toBe(100);
                expect(options.left).toBe(0);
                expect(options.top).toBe(10);
            });

            it("should allow to use elements inside widget iframes as reference", () => {
                var options = {
                    width: 8000,
                    height: 20,
                    refiframe: document.createElement('iframe'),
                    refposition: {left: 0, right: 9, top: 60, bottom: 69}
                };

                spyOn(Wirecloud.Utils, "getRelativePosition").and.returnValue({x: 20, y: 30});
                layout.searchBestPosition(options);

                expect(options.width).toBe(8000);
                expect(options.height).toBe(20);
                expect(options.left).toBe(200000);
                expect(options.top).toBe(70);
            });

        });

        describe("updatePosition(widget, element)", () => {

            let layout, element;

            beforeEach(() => {
                layout = new ns.FreeLayout({});
                spyOn(layout, "getRowOffset").and.returnValue("127px");
                element = document.createElement("div");
            });

            it("should support topleft placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "topleft"}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.bottom).toBe("");
            });

            it("should support topcenter placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "topcenter"},
                    shape: {relwidth: false, width: 100}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.bottom).toBe("");
            });

            it("should support topcenter placement (relwidth)", () => {
                expect(layout.updatePosition({
                    position: {anchor: "topcenter"},
                    shape: {relwidth: true, width: 500000}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.bottom).toBe("");
            });

            it("should support topright placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "topright"}
                }, element)).toBe(layout);
                expect(element.style.left).toBe("");
                expect(element.style.bottom).toBe("");
            });

            it("should support bottomleft placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "bottomleft"}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.top).toBe("");
            });

            it("should support bottomcenter placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "bottomcenter"},
                    shape: {relwidth: false, width: 100}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.top).toBe("");
            });

            it("should support bottomcenter placement (relwidth)", () => {
                expect(layout.updatePosition({
                    position: {anchor: "bottomcenter"},
                    shape: {relwidth: true, width: 500000}
                }, element)).toBe(layout);
                expect(element.style.right).toBe("");
                expect(element.style.top).toBe("");
            });

            it("should support bottomright placement", () => {
                expect(layout.updatePosition({
                    position: {anchor: "bottomright"}
                }, element)).toBe(layout);
                expect(element.style.left).toBe("");
                expect(element.style.top).toBe("");
            });

        });

        describe("updateShape(widget, element)", () => {

            let layout, element;

            beforeEach(() => {
                layout = new ns.FreeLayout({
                    topMargin: 1,
                    rightMargin: 2,
                    bottomMargin: 3,
                    leftMargin: 4
                });
                spyOn(layout, "getRowOffset").and.returnValue("127px");
                element = document.createElement("div");
            });

            it("should support absolute sizes", () => {
                expect(layout.updateShape({
                    shape: {
                        relwidth: false,
                        relheight: false,
                        width: 50,
                        height: 10
                    }
                }, element)).toBe(layout);
                expect(element.style.width).toBe("50px");
                expect(element.style.height).toBe("10px");
            });

            it("should support relwidth shapes", () => {
                expect(layout.updateShape({
                    shape: {
                        relwidth: true,
                        relheight: false,
                        width: 500000,
                        height: 10
                    }
                }, element)).toBe(layout);
                expect(element.style.width).toBe("calc(50% - 3px)");
                expect(element.style.height).toBe("10px");
            });

            it("should support relheight shapes", () => {
                expect(layout.updateShape({
                    shape: {
                        relwidth: false,
                        relheight: true,
                        width: 50,
                        height: 100000
                    }
                }, element)).toBe(layout);
                expect(element.style.width).toBe("50px");
                expect(element.style.height).toBe("calc(10% - 0.4px)");
            });

            it("should support minimized shapes", () => {
                expect(layout.updateShape({
                    minimized: true,
                    shape: {
                        relwidth: false,
                        relheight: true,
                        width: 50,
                        height: 100000
                    }
                }, element)).toBe(layout);
                expect(element.style.width).toBe("50px");
                expect(element.style.height).toBe("");
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
