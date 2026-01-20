/*
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    const create_tab = function (customPreferences = null) {
        return {
            appendChild: jasmine.createSpy("appendChild"),
            model: {
                id: 3,
                preferences: {
                    get: jasmine.createSpy("get").and.returnValue(customPreferences || {
                        "type": "gridlayout",
                        "columns": 20
                    })
                }
            },
            removeChild: jasmine.createSpy("removeChild"),
            workspace: {
                editing: true,
                model: {
                    id: 8
                },
                restricted: false
            },
            quitEditingInterval: jasmine.createSpy("quitEditingInterval")
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
                volatile: !!options.volatile,
                layoutConfigurations: options.layoutConfigurations || [],
                id: options.id
            },
            persist: jasmine.createSpy("persist"),
            position: {
                z: options.z
            },
            setPosition: jasmine.createSpy("setPosition").and.callFake(function (options) {
                this.position.z = options.z;
            }),
            updateWindowSize: jasmine.createSpy("updateWindowSize"),
            toJSON: function () {}
        };
    };

    const layout_constructor = function () {
        this.initialize = jasmine.createSpy("initialize");
        this.moveTo = jasmine.createSpy("moveTo");
        this.isActive = jasmine.createSpy("isActive").and.returnValue(true);
        this._notifyWindowResizeEvent = jasmine.createSpy("_notifyWindowResizeEvent");
    };

    describe("WorkspaceTabViewDragboard", () => {

        beforeAll(() => {
            spyOn(Wirecloud.ui, "ColumnLayout").and.callFake(layout_constructor);
            Wirecloud.ui.GridLayout = jasmine.createSpy("GridLayout").and.callFake(layout_constructor);
            spyOn(Wirecloud.ui, "SmartColumnLayout").and.callFake(layout_constructor);
            spyOn(Wirecloud.ui, "FreeLayout").and.callFake(layout_constructor);
            Wirecloud.ui.FullDragboardLayout = jasmine.createSpy("FullDragboardLayout").and.callFake(layout_constructor);
            spyOn(Wirecloud.ui, "SidebarLayout").and.callFake(layout_constructor);
        });

        describe("new WorkspaceTabViewDragboard", () => {

            it("should start empty", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(dragboard.widgets).toEqual([]);
                expect(dragboard.baseLayout).toEqual(jasmine.any(Wirecloud.ui.GridLayout));
            });

            it("should configure base layout", () => {
                const tab = create_tab();
                tab.model.preferences.get.and.returnValue({
                    "type": "columnlayout",
                    "smart": true,
                    "columns": 20
                })
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(dragboard.widgets).toEqual([]);
                expect(dragboard.baseLayout).toEqual(jasmine.any(Wirecloud.ui.SmartColumnLayout));
            });

        });

        describe("_addWidget(widget)", () => {

            it("should add widget on top if widget is not z-positioned", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget = create_widget();

                dragboard._addWidget(widget);

                expect(dragboard.tab).toBe(tab);
                expect(dragboard.tab.appendChild).toHaveBeenCalledWith(widget);
                expect(dragboard.widgets).toEqual([widget]);
                expect(widget.setPosition).toHaveBeenCalledWith({
                    z: 0
                });
            });

            it("should move widgets when z position is already taken", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                const widget2 = create_widget({z: 1});
                dragboard._addWidget(widget2);
                const widget3 = create_widget({z: 2});
                dragboard._addWidget(widget3);
                const newwidget = create_widget({z: 1});
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
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                const widget2 = create_widget({z: 1});
                dragboard._addWidget(widget2);
                const widget3 = create_widget({z: 4});
                dragboard._addWidget(widget3);
                const newwidget = create_widget({z: 1});
                widget1.setPosition.calls.reset();
                widget2.setPosition.calls.reset();
                widget3.setPosition.calls.reset();

                dragboard._addWidget(newwidget);

                expect(dragboard.tab).toBe(tab);
                // property 3 and 4 should not exist (this is different to be
                // undefined)
                const expected_array = [widget1, widget2, newwidget];
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
                const tab = create_tab();
                tab.wrapperElement = {
                    classList: {
                        add: jasmine.createSpy("fixed")
                    }
                };
                tab.workspace.restricted = true;
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                expect(dragboard.tab).toBe(tab);
                expect(tab.wrapperElement.classList.add).toHaveBeenCalledWith("fixed");
            });

        });

        describe("getWidth() & getHeight()", () => {

            it("getHeight()", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.dragboardHeight = 20;
                expect(dragboard.getHeight()).toBe(20);
            });

            it("getWidth()", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.dragboardWidth = 20;
                expect(dragboard.getWidth()).toBe(20);
            });

        });

        describe("lower(widget)", () => {

            let dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                const tab = create_tab();
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

            let dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                const tab = create_tab();
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
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                const widget3 = create_widget({z: 2});
                dragboard._addWidget(widget3);
                widget1.setPosition.calls.reset();
                widget3.setPosition.calls.reset();
                spyOn(dragboard, "_recomputeSize");

                dragboard.paint();

                expect(dragboard.widgets).toEqual([widget1, widget3]);
                expect(widget1.setPosition).toHaveBeenCalledWith({
                    z: 0,
                }, false);
                expect(widget3.setPosition).toHaveBeenCalledWith({
                    z: 1
                }, false);
            });

            it("should do nothing if already painted", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget1 = create_widget({z: 0});
                dragboard._addWidget(widget1);
                const widget3 = create_widget({z: 2});
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

            let dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                const tab = create_tab();
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

            let dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                const tab = create_tab();
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
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const widget1 = create_widget({"id": "1"});
                dragboard._addWidget(widget1);
                const widget2 = create_widget({"id": "2"});
                dragboard._addWidget(widget2);
                const widget3 = create_widget({"id": "3"});
                dragboard._addWidget(widget3);

                dragboard._removeWidget(widget2);

                expect(dragboard.widgets).toEqual([widget1, widget3]);
                expect(dragboard.tab.removeChild).toHaveBeenCalledWith(widget2);
            });

        });

        describe("_recomputeSize()", () => {

            it("DEPRECATED recompute size (display: none)", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(document.defaultView, "getComputedStyle").and.returnValue({
                    getPropertyValue: jasmine.createSpy("getPropertyValue").and.returnValue("none"),
                });

                dragboard._recomputeSize();
            });

            it("DEPRECATED recompute size", () => {
                const parentElement = document.createElement('div');
                const tab = create_tab();
                tab.wrapperElement = document.createElement('div');
                parentElement.appendChild(tab.wrapperElement);
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
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
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
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
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                spyOn(dragboard, "_recomputeSize");

                dragboard._notifyWindowResizeEvent();

                expect(dragboard._recomputeSize).toHaveBeenCalledWith();
            });

        });

        describe("_updateBaseLayout()", () => {

            it("should update base layout", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                const initial_base_layout = dragboard.baseLayout;
                tab.model.preferences.get.and.returnValue({
                    "type": "columnlayout",
                    "smart": false,
                    "columns": 20
                })

                dragboard._updateBaseLayout();

                expect(dragboard.baseLayout).not.toBe(initial_base_layout);
                expect(dragboard.baseLayout.initialize).toHaveBeenCalledWith();
                expect(initial_base_layout.moveTo).toHaveBeenCalledWith(dragboard.baseLayout);
            });

        });

        describe("_updateIWidgetSizes(widthChanged, heightChanged)", () => {

            it("should update all the layouts", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);

                dragboard._updateIWidgetSizes(true, false);

                expect(dragboard.baseLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
                expect(dragboard.freeLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
                expect(dragboard.fulldragboardLayout._notifyWindowResizeEvent).toHaveBeenCalledWith(true, false);
            });

        });

        describe("_updateScreenSizes", () => {

            it("should delete non-existent screen sizes, update those that exist and add new ones", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);

                dragboard.resetLayouts = jasmine.createSpy("resetLayouts");
                dragboard.refreshPositionBasedOnZIndex = jasmine.createSpy("refreshPositionBasedOnZIndex");
                dragboard.paint = jasmine.createSpy("paint");

                const widget = create_widget({
                    id: 3,
                    layoutConfigurations: [
                        {
                            id: 0,
                            moreOrEqual: 0,
                            lessOrEqual: 800,
                            anchor: "top-left",
                            width: 10,
                            height: 10,
                            relwidth: true,
                            relheight: true,
                            left: 0,
                            top: 0,
                            zIndex: 0,
                            relx: true,
                            rely: true,
                            titlevisible: true,
                            fulldragboard: false,
                            minimized: false
                        },
                        {
                            id: 1,
                            moreOrEqual: 801,
                            lessOrEqual: -1,
                            anchor: "top-left",
                            width: 10,
                            height: 10,
                            relwidth: true,
                            relheight: true,
                            left: 0,
                            top: 0,
                            zIndex: 0,
                            relx: true,
                            rely: true,
                            titlevisible: true,
                            fulldragboard: false,
                            minimized: false
                        }
                    ]
                });

                dragboard._addWidget(widget);

                tab.model.preferences.get = jasmine.createSpy("get").and.returnValue([
                    {
                        id: 1,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        name: "Default-1"
                    },
                    {
                        id: 2,
                        moreOrEqual: 801,
                        lessOrEqual: -1,
                        name: "Default-2"
                    }
                ]);

                const p = dragboard._updateScreenSizes();

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    expect(dragboard.resetLayouts).toHaveBeenCalled();
                    expect(dragboard.refreshPositionBasedOnZIndex).toHaveBeenCalled();
                    expect(dragboard.paint).toHaveBeenCalled();
                    const body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body).toEqual([{
                        id: 3,
                        layoutConfigurations: [
                            {
                                id: 0,
                                action: 'delete'
                            },
                            {
                                id: 1,
                                action: 'update',
                                moreOrEqual: 0,
                                lessOrEqual: 800
                            },
                            {
                                id: 2,
                                action: 'update',
                                moreOrEqual: 801,
                                lessOrEqual: -1,
                                anchor: "top-left",
                                width: 10,
                                height: 10,
                                relwidth: true,
                                relheight: true,
                                left: 0,
                                top: 0,
                                zIndex: 0,
                                relx: true,
                                rely: true,
                                titlevisible: true,
                                fulldragboard: false,
                                minimized: false
                            }
                        ]
                    }]);
                    done();
                });
            });

            it("should not update a layout configuration if it has not changed", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);

                dragboard.resetLayouts = jasmine.createSpy("resetLayouts");
                dragboard.refreshPositionBasedOnZIndex = jasmine.createSpy("refreshPositionBasedOnZIndex");
                dragboard.paint = jasmine.createSpy("paint");

                const widget = create_widget({
                    id: 3,
                    layoutConfigurations: [
                        {
                            id: 0,
                            moreOrEqual: 0,
                            lessOrEqual: 800,
                            anchor: "top-left",
                            width: 10,
                            height: 10,
                            relwidth: true,
                            relheight: true,
                            left: 0,
                            top: 0,
                            zIndex: 0,
                            relx: true,
                            rely: true,
                            titlevisible: true,
                            fulldragboard: false,
                            minimized: false
                        }
                    ]
                });

                dragboard._addWidget(widget);

                tab.model.preferences.get = jasmine.createSpy("get").and.returnValue([
                    {
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        name: "Default-1"
                    }
                ]);

                const p = dragboard._updateScreenSizes();

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    expect(dragboard.resetLayouts).toHaveBeenCalled();
                    expect(dragboard.refreshPositionBasedOnZIndex).toHaveBeenCalled();
                    expect(dragboard.paint).toHaveBeenCalled();
                    const body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body).toEqual([{
                        id: 3,
                        layoutConfigurations: []
                    }]);
                    done();
                });
            });

            it("should quit the editing interval if custom screen sizes are used", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.customWidth = 800;

                dragboard.resetLayouts = jasmine.createSpy("resetLayouts");
                dragboard.refreshPositionBasedOnZIndex = jasmine.createSpy("refreshPositionBasedOnZIndex");
                dragboard.paint = jasmine.createSpy("paint");

                const widget = create_widget({
                    id: 3,
                    layoutConfigurations: [
                        {
                            id: 0,
                            moreOrEqual: 0,
                            lessOrEqual: 800,
                            anchor: "top-left",
                            width: 10,
                            height: 10,
                            relwidth: true,
                            relheight: true,
                            left: 0,
                            top: 0,
                            zIndex: 0,
                            relx: true,
                            rely: true,
                            titlevisible: true,
                            fulldragboard: false,
                            minimized: false
                        }
                    ]
                });

                dragboard._addWidget(widget);

                tab.model.preferences.get = jasmine.createSpy("get").and.returnValue([
                    {
                        id: 1,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        name: "Default-1"
                    }
                ]);

                const p = dragboard._updateScreenSizes();

                p.then(() => {
                    expect(tab.quitEditingInterval).toHaveBeenCalled();
                    done();
                });
            });

            it("should handle unexpected responses", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PUT");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.paint = jasmine.createSpy("paint");

                const task = dragboard._updateScreenSizes();

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

            it("should handle error responses", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("PUT");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 403
                        });
                    });
                });

                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.paint = jasmine.createSpy("paint");

                const task = dragboard._updateScreenSizes();

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

        describe("updateWidgetScreenSizeWithId", () => {

            it("should update the screen size of the widget with the given id", () => {
                const tab = create_tab([
                    {
                        "id": 1,
                        "moreOrEqual": 0,
                        "lessOrEqual": 800
                    }
                ]);
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);
                dragboard.updateWidgetScreenSize = jasmine.createSpy("updateWidgetScreenSize");

                dragboard.updateWidgetScreenSizeWithId(1);

                expect(dragboard.updateWidgetScreenSize).toHaveBeenCalledWith(400);
            });

        });

        describe("update([ids, allLayoutConfigurations])", () => {

            let dragboard, widget1, widget2, widget3;

            beforeEach(() => {
                const tab = create_tab();
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

            it("should do nothing when no passing the ids parameter and not editing", (done) => {
                spyOn(Wirecloud.io, "makeRequest");
                const tab = create_tab();
                tab.workspace.editing = false;
                dragboard = new ns.WorkspaceTabViewDragboard(tab);

                const p = dragboard.update();

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                }, fail);
            });

            it("should do nothing when passing the ids parameter and not editing", (done) => {
                spyOn(Wirecloud.io, "makeRequest");
                const tab = create_tab();
                tab.workspace.editing = false;
                dragboard = new ns.WorkspaceTabViewDragboard(tab);

                const p = dragboard.update(["1"]);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                }, fail);
            });

            it("should persist all widgets when no passing the ids parameter", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const p = dragboard.update();

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    const body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body.length).toBe(3);
                    done();
                }, fail);
            });

            it("should allow to filter widgets", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const p = dragboard.update(["1"]);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    const body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body.length).toBe(1);
                    done();
                }, fail);
            });

            it("should do nothing if the filtered list of widget is empty", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                const p = dragboard.update(["4", "5"]);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                }, fail);
            });

            it("should honor the allLayoutConfigurations parameter", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });

                dragboard.tab.widgetsById["1"].toJSON = jasmine.createSpy("toJSON").and.returnValue({"hello": "world"});

                const p = dragboard.update(null, true);
                expect(dragboard.tab.widgetsById["1"].toJSON).toHaveBeenCalledWith('update', true);

                p.then(() => {
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    const body = JSON.parse(Wirecloud.io.makeRequest.calls.argsFor(0)[1].postBody);
                    expect(body.length).toBe(3);
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

                const task = dragboard.update();

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

                const task = dragboard.update();

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

        describe("refreshPositionBasedOnZIndex()", () => {

            it("should sort widgets by z-index", () => {
                const tab = create_tab();
                const dragboard = new ns.WorkspaceTabViewDragboard(tab);

                Array.prototype.push.apply(dragboard.widgets, [
                    {position: {z: 2}},
                    {position: {z: 1}},
                    {position: {z: 3}}
                ]);

                dragboard.refreshPositionBasedOnZIndex();

                expect(dragboard.widgets).toEqual([
                    {position: {z: 1}},
                    {position: {z: 2}},
                    {position: {z: 3}}
                ]);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
