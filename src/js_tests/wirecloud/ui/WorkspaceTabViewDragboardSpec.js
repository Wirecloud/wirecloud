/*
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

    const create_tab = function () {
        return {
            appendChild: jasmine.createSpy("appendChild"),
            model: {
                id: 3,
                preferences: {
                    get: jasmine.createSpy("get").and.returnValue({
                        "type": "gridlayout",
                        "columns": 20
                    })
                }
            },
            removeChild: jasmine.createSpy("removeChild"),
            workspace: {
                model: {
                    id: 8
                },
                restricted: false
            }
        };
    };

    const create_widget = function (options) {
        if (options == null) {
            options = {};
        }
        if (!("volatile" in options)) {
            options.volatile = false;
        }
        if (!("z" in options)) {
            options.z = null;
        }
        if (options.id == null) {
            options.id = "1";
        }

        return {
            id: options.id,
            model: {
                volatile: !!options.volatile
            },
            persist: jasmine.createSpy("persist"),
            position: {
                z: options.z
            },
            setPosition: jasmine.createSpy("setPosition").and.callFake(function (options) {
                this.position.z = options.z;
            })
        };
    };

    const layout_constructor = function () {
        this.destroy = jasmine.createSpy("destroy");
        this.initialize = jasmine.createSpy("initialize");
        this.moveTo = jasmine.createSpy("moveTo");
        this._notifyWindowResizeEvent = jasmine.createSpy("_notifyWindowResizeEvent");
    };

    describe("WorkspaceTabViewDragboard", () => {

        beforeAll(() => {
            Wirecloud.ui.ColumnLayout = jasmine.createSpy("ColumnLayout").and.callFake(layout_constructor);
            Wirecloud.ui.GridLayout = jasmine.createSpy("GridLayout").and.callFake(layout_constructor);
            Wirecloud.ui.SmartColumnLayout = jasmine.createSpy("SmartColumnLayout").and.callFake(layout_constructor);
            Wirecloud.ui.FreeLayout = jasmine.createSpy("FreeLayout").and.callFake(layout_constructor);
            Wirecloud.ui.FullDragboardLayout = jasmine.createSpy("FullDragboardLayout").and.callFake(layout_constructor);
            Wirecloud.ui.SidebarLayout = jasmine.createSpy("SidebarLayout");
        });

        describe("new WorkspaceTabViewDragboard", () => {

            it("should start empty", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(dragboard.widgets).toEqual([]);
                expect(dragboard.baseLayout).toEqual(jasmine.any(Wirecloud.ui.GridLayout));
            });

            it("should configure base layout", () => {
                let tab = create_tab();
                tab.model.preferences.get.and.returnValue({
                    "type": "columnlayout",
                    "smart": true,
                    "columns": 20
                })
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(dragboard.widgets).toEqual([]);
                expect(dragboard.baseLayout).toEqual(jasmine.any(Wirecloud.ui.SmartColumnLayout));
            });

        });

        describe("_addWidget(widget)", () => {

            it("should add widget on top if widget is not z-positioned", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget = create_widget();

                dragboard._addWidget(widget);

                expect(dragboard.tab).toBe(tab);
                expect(dragboard.tab.appendChild).toHaveBeenCalledWith(widget);
                expect(dragboard.widgets).toEqual([widget]);
                expect(widget.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
            });

            it("should move widgets when z position is already taken", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                let widget2 = create_widget({z: 1});
                dragboard._addWidget(widget2);
                let widget3 = create_widget({z: 2});
                dragboard._addWidget(widget3);
                let newwidget = create_widget({z: 1});
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();

                dragboard._addWidget(newwidget);

                expect(dragboard.tab).toBe(tab);
                expect(dragboard.widgets).toEqual([widget1, widget2, newwidget, widget3]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(newwidget.setPosition).toHaveBeenCalledWith({
                    z: 2
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 3
                });
            });

            it("should move widgets when z position is already taken (should work with holes)", () => {
                // Holes are only accepted while loading the dashboard as widgets can be loaded without taking into account the z-index order, once loaded, holes are not accepted
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                let widget2 = create_widget({z: 1});
                dragboard._addWidget(widget2);
                let widget3 = create_widget({z: 4});
                dragboard._addWidget(widget3);
                let newwidget = create_widget({z: 1});
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();

                dragboard._addWidget(newwidget);

                expect(dragboard.tab).toBe(tab);
                // property 3 and 4 should not exist (this is different to be
                // undefined)
                let expected_array = [widget1, widget2, newwidget];
                expected_array[5] = widget3;
                expect(dragboard.widgets).toEqual(expected_array);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(newwidget.setPosition).toHaveBeenCalledWith({
                    z: 2
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 5
                });
            });

            it("should add the fixed class when restricted", () => {
                let tab = create_tab();
                tab.wrapperElement = {
                    classList: {
                        add: jasmine.createSpy("fixed")
                    }
                };
                tab.workspace.restricted = true;
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(tab.wrapperElement.classList.add).toHaveBeenCalledWith("fixed");
            });

        });

        describe("getWidth() & getHeight()", () => {

            it("getHeight()", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.dragboardHeight = 20;
                expect(dragboard.getHeight()).toBe(20);
            });

            it("getWidth()", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.dragboardWidth = 20;
                expect(dragboard.getWidth()).toBe(20);
            });

        });

        describe("lower(widget)", () => {

            var dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                let tab = create_tab();
                dragboard = new ns.WorkspaceTabViewDragboard(tab);
                widget1 = create_widget();
                dragboard._addWidget(widget1);
                widget2 = create_widget();
                dragboard._addWidget(widget2);
                widget3 = create_widget();
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
            });

            it("should do nothing if the widget to lower is already the lowest one", () => {
                expect(dragboard.lower(widget1)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget1, widget2, widget3]);
                expect(widget1.setPosition).not.toHaveBeenCalled();
            });

            it("should lower widget and update the affected widget", () => {
                expect(dragboard.lower(widget2)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget2, widget1, widget3]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });

        });

        describe("lowerToBottom(widget)", () => {

            var dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                let tab = create_tab();
                dragboard = new ns.WorkspaceTabViewDragboard(tab);
                widget1 = create_widget();
                dragboard._addWidget(widget1);
                widget2 = create_widget();
                dragboard._addWidget(widget2);
                widget3 = create_widget();
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
                spyOn(dragboard, "update");
            });

            it("should do nothing if the widget to lower is already the lowest one", () => {
                expect(dragboard.lowerToBottom(widget1)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget1, widget2, widget3]);
                expect(widget1.setPosition).not.toHaveBeenCalled();
                expect(dragboard.update).not.toHaveBeenCalled();
            });

            it("should lower widget and update the affected widgets", () => {
                expect(dragboard.lowerToBottom(widget3)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget3, widget1, widget2]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 2
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(dragboard.update).toHaveBeenCalledWith();
            });

        });

        describe("paint()", () => {

            it("should compress z indexes", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                let widget3 = create_widget({z: 2});
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
                spyOn(dragboard, "_recomputeSize");

                dragboard.paint();

                expect(dragboard.widgets).toEqual([widget1, widget3]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
            });

            it("should do nothing if already painted", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                let widget3 = create_widget({z: 2});
                dragboard._addWidget(widget3);
                spyOn(dragboard, "_recomputeSize");

                dragboard.paint();
                widget1.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
                dragboard.paint();

                expect(dragboard.widgets).toEqual([widget1, widget3]);
                expect(widget1.setPosition).not.toHaveBeenCalled();
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });
        });

        describe("raise(widget)", () => {

            var dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                let tab = create_tab();
                dragboard = new ns.WorkspaceTabViewDragboard(tab);
                widget1 = create_widget();
                dragboard._addWidget(widget1);
                widget2 = create_widget();
                dragboard._addWidget(widget2);
                widget3 = create_widget();
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
            });

            it("should do nothing if the widget to raise is already the upper one", () => {
                expect(dragboard.raise(widget3)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget1, widget2, widget3]);
                expect(widget3.setPosition).not.toHaveBeenCalled();
            });

            it("should raise widget and update the affected widget", () => {
                expect(dragboard.raise(widget2)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget1, widget3, widget2]);
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 2
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(widget1.setPosition).not.toHaveBeenCalled();
            });

        });

        describe("raiseToTop(widget)", () => {

            var dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                let tab = create_tab();
                dragboard = new ns.WorkspaceTabViewDragboard(tab);
                widget1 = create_widget();
                dragboard._addWidget(widget1);
                widget2 = create_widget();
                dragboard._addWidget(widget2);
                widget3 = create_widget();
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
                spyOn(dragboard, "update");
            });

            it("should do nothing if the widget to raise is already the highest one", () => {
                expect(dragboard.raiseToTop(widget3)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget1, widget2, widget3]);
                expect(widget3.setPosition).not.toHaveBeenCalled();
                expect(dragboard.update).not.toHaveBeenCalled();
            });

            it("should raise widget and update the affected widgets", () => {
                expect(dragboard.raiseToTop(widget1)).toBe(dragboard);

                expect(dragboard.widgets).toEqual([widget2, widget3, widget1]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 2
                });
                expect(widget2.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 1
                });
                expect(dragboard.update).toHaveBeenCalledWith();
            });

        });

        describe("_removeWidget(widget)", () => {

            it("should add widget on top if widget is not z-positioned", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let widget1 = create_widget({"id": "1"});
                dragboard._addWidget(widget1);
                let widget2 = create_widget({"id": "2"});
                dragboard._addWidget(widget2);
                let widget3 = create_widget({"id": "3"});
                dragboard._addWidget(widget3);

                dragboard._removeWidget(widget2);

                expect(dragboard.widgets).toEqual([widget1, widget3]);
                expect(dragboard.tab.removeChild).toHaveBeenCalledWith(widget2);
            });

        });

        describe("_recomputeSize()", () => {

            it("DEPRECATED recompute size (display: none)", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(document.defaultView, "getComputedStyle").and.returnValue({
                    getPropertyValue: jasmine.createSpy("getPropertyValue").and.returnValue("none"),
                });

                dragboard._recomputeSize();
            });

            it("DEPRECATED recompute size", () => {
                let parentElement = document.createElement('div');
                let tab = create_tab();
                tab.wrapperElement = document.createElement('div');
                parentElement.appendChild(tab.wrapperElement);
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(document.defaultView, "getComputedStyle").and.returnValue({
                    getPropertyValue: jasmine.createSpy("getPropertyValue").and.returnValue("block"),
                    getPropertyCSSValue: () => {
                        return {
                            getFloatValue: () => {}
                        };
                    }
                });

                dragboard._recomputeSize();
            });

        });

        describe("_notifyWindowResizeEvent()", () => {

            it("DEPRECATED resize event", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(dragboard, "_recomputeSize").and.callFake(function () {
                    this.dragboardWidth = 50;
                    this.dragboardHeight = 20;
                });
                spyOn(dragboard, "_updateIWidgetSizes");

                dragboard._notifyWindowResizeEvent();

                expect(dragboard._recomputeSize).toHaveBeenCalledWith();
                expect(dragboard._updateIWidgetSizes).toHaveBeenCalledWith(true, true);
            });

            it("DEPRECATED resize event (no change)", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(dragboard, "_recomputeSize");

                dragboard._notifyWindowResizeEvent();

                expect(dragboard._recomputeSize).toHaveBeenCalledWith();
            });

        });

        describe("_updateBaseLayout()", () => {

            it("should update base layout", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);
                let initial_base_layout = dragboard.baseLayout;
                tab.model.preferences.get.and.returnValue({
                    "type": "columnlayout",
                    "smart": false,
                    "columns": 20
                })

                dragboard._updateBaseLayout();

                expect(dragboard.baseLayout).not.toBe(initial_base_layout);
                expect(dragboard.baseLayout.initialize).toHaveBeenCalledWith();
                expect(initial_base_layout.moveTo).toHaveBeenCalledWith(dragboard.baseLayout);
                expect(initial_base_layout.destroy).toHaveBeenCalledWith();
            });

        });

        describe("_updateIWidgetSizes(widthChanged, heightChanged)", () => {

            it("should update all the layouts", () => {
                let tab = create_tab();
                let dragboard = new ns.WorkspaceTabViewDragboard(tab);

                dragboard._updateIWidgetSizes(true, false);

                expect(dragboard.baseLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
                expect(dragboard.freeLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
                expect(dragboard.fulldragboardLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
            });

        });

        describe("update([ids])", () => {

            var dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                let tab = create_tab();
                dragboard = new ns.WorkspaceTabViewDragboard(tab);
                widget1 = create_widget({"id": "1"});
                dragboard._addWidget(widget1);
                widget2 = create_widget({"id": "2"});
                dragboard._addWidget(widget2);
                widget3 = create_widget({"id": "3"});
                dragboard._addWidget(widget3);
                tab.widgetsById = {
                    "1": widget1,
                    "2": widget2,
                    "3": widget3
                };
            });

            it("should persist all widgets when no passing the ids parameter", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                let p = dragboard.update();

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    let body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body.length).toBe(3);
                    done();
                }, fail);
            });

            it("should allow to filter widgets", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                let p = dragboard.update(["1"]);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    let body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body.length).toBe(1);
                    done();
                }, fail);
            });

            it("should do nothing if the filtered list of widget is empty", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                let p = dragboard.update(["4", "5"]);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                }, fail);
            });

            it("handles unexpected responses", (done) => {

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PUT");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                let task = dragboard.update();

                task.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handles error responses", (done) => {

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PUT");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 403
                        });
                    });
                });

                let task = dragboard.update();

                task.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
