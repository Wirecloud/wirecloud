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

    describe("WidgetView", () => {

        beforeAll(() => {
            ns.FullDragboardLayout = function () {};
        });

        beforeEach(() => {
            spyOn(ns, "WidgetViewMenuItems")
            utils.inherit(ns.WidgetViewMenuItems, StyledElements.DynamicMenuItems);

            ns.WidgetViewResizeHandle = jasmine.createSpy("WidgetViewResizeHandle").and.callFake(function () {
                this.addClassName = jasmine.createSpy("addClassName");
                this.setResizableElement = jasmine.createSpy("setResizableElement");
            });
        });

        afterAll(() => {
            delete ns.FullDragboardLayout;
            delete ns.WidgetViewResizeHandle;
        });

        const callEventListener = function callEventListener(instance, event) {
            const largs = Array.prototype.slice.call(arguments, 2);
            largs.unshift(instance);
            instance.addEventListener.calls.allArgs().some(function (args) {
                if (args[0] === event) {
                    args[1].apply(instance, largs);
                    return true;
                }
            });
        };

        const create_layout_mock = function create_layout_mock(tab, klass) {
            const layout = Object.create(klass.prototype);
            Object.assign(layout, {
                dragboard: tab.dragboard,
                tab: tab,
                adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 1}),
                adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 2}),
                adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 3}),
                adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 4}),
                addWidget: jasmine.createSpy("addWidget").and.callFake(function addWidget(widget) {
                    widget.layout = this;
                    return new Set();
                }),
                getColumnOffset: jasmine.createSpy("getColumnOffset"),
                getRowOffset: jasmine.createSpy("getRowOffset"),
                removeWidget: jasmine.createSpy("removeWidget").and.callFake(function removeWidget(widget) {
                    widget.layout = null;
                    return new Set();
                }),
                getHeight: jasmine.createSpy("getHeight"),
                getHeightInPixels: jasmine.createSpy("getHeightInPixels"),
                getWidth: jasmine.createSpy("getWidth"),
                _notifyResizeEvent: jasmine.createSpy("_notifyResizeEvent")
            });
            if ("_searchFreeSpace" in klass.prototype) {
                layout._searchFreeSpace = jasmine.createSpy("_searchFreeSpace");
            }
            if ("_searchFreeSpace2" in klass.prototype) {
                layout._searchFreeSpace2 = jasmine.createSpy("_searchFreeSpace2");
            }
            return layout;
        };

        const create_tab_mock = function create_tab_mock() {
            const tab = {
                id: "123",
                model: {},
                workspace: {
                    addEventListener: jasmine.createSpy("addEventListener")
                },
                addEventListener: jasmine.createSpy("addEventListener")
            };
            tab.dragboard = {
                tab: tab,
                leftMargin: 1,
                topMargin: 2,
                lowerToBottom: jasmine.createSpy("lowerToBottom"),
                update: jasmine.createSpy("update")
            };
            tab.dragboard.baseLayout = create_layout_mock(tab, ns.SmartColumnLayout);
            tab.dragboard.freeLayout = create_layout_mock(tab, ns.FreeLayout);
            tab.dragboard.leftLayout = create_layout_mock(tab, ns.SidebarLayout);
            tab.dragboard.rightLayout = create_layout_mock(tab, ns.SidebarLayout);
            tab.dragboard.layouts = [
                tab.dragboard.baseLayout,
                tab.dragboard.freeLayout,
                tab.dragboard.leftLayout,
                tab.dragboard.rightLayout
            ];
            tab.dragboard.fulldragboardLayout = create_layout_mock(tab, ns.FullDragboardLayout);
            return tab;
        };

        const create_widget_mock = function create_widget_mock(options) {
            options = options != null ? options : {};

            const layoutConfigurations = [{
                id: 0,
                moreOrEqual: 0,
                lessOrEqual: 800,
                anchor: options.anchor != null ? options.anchor : "topleft",
                relx: options.relx != null ? options.relx : true,
                left: 3,
                rely: options.rely != null ? options.rely : true,
                top: 0,
                zIndex: 0,
                relwidth: options.relwidth != null ? options.relwidth : true,
                width: 5,
                relheight: options.relheight != null ? options.relheight : true,
                height: 1,
                fulldragboard: !!options.fulldragboard,
                titlevisible: true,
                minimized: false
            },
            {
                id: 1,
                moreOrEqual: 801,
                lessOrEqual: -1,
                anchor: "topleft",
                relx: true,
                left: 10,
                rely: true,
                top: 2,
                zIndex: 0,
                relwidth: true,
                width: 6,
                relheight: false,
                height: 2,
                fulldragboard: true,
                titlevisible: true,
                minimized: false
            }];

            return {
                addEventListener: jasmine.createSpy("addEventListener"),
                changeTab: jasmine.createSpy("changeTab").and.returnValue(Promise.resolve()),
                contextManager: {
                    modify: jasmine.createSpy("modify")
                },
                fulldragboard: layoutConfigurations[0].fulldragboard,
                id: "23",
                isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true),
                layout: (options.layout != null ? options.layout : 2),
                logManager: {
                    addEventListener: jasmine.createSpy("addEventListener")
                },
                layoutConfigurations: layoutConfigurations,
                currentLayoutConfig: layoutConfigurations[0],
                permissions: {
                    editor: {
                        move: true,
                    },
                    viewer: {
                        move: false
                    }
                },
                position: layoutConfigurations[0],
                reload: jasmine.createSpy("reload"),
                shape: layoutConfigurations[0],
                remove: jasmine.createSpy("remove"),
                setPosition: jasmine.createSpy("setPosition"),
                setLayoutPosition: jasmine.createSpy("setLayoutPostion"),
                setPermissions: jasmine.createSpy("setPermissions").and.returnValue(new Wirecloud.Task("", () => {})),
                setShape: jasmine.createSpy("setShape"),
                setLayoutShape: jasmine.createSpy("setLayoutShape"),
                setTitleVisibility: jasmine.createSpy("setTitleVisibility").and.returnValue(new Wirecloud.Task("", () => {})),
                setLayoutMinimizedStatus: jasmine.createSpy("setLayoutMinimizedStatus"),
                setLayoutFulldragboard: jasmine.createSpy("setLayoutFulldragboard"),
                setLayoutIndex: jasmine.createSpy("setLayoutIndex"),
                updateWindowSize: jasmine.createSpy("updateWindowSize"),
                showLogs: jasmine.createSpy("showLogs"),
                showSettings: jasmine.createSpy("showSettings"),
                title: "My Widget",
                titlevisible: layoutConfigurations[0].titlevisible,
                volatile: !!options.volatile,
                wrapperElement: document.createElement('div')
            };
        };

        describe("new WidgetView(tab, model, options)", () => {

            it("should throw a TypeError exception when not passing any parameter", () => {
                expect(() => {
                    new ns.WidgetView();
                }).toThrowError(TypeError);
            });

            it("should work by providing options", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                // Check initial values
                expect(widget.tab).toBe(tab);
                expect(widget.model).toBe(model);
                expect(widget.id).toBe(model.id);
                expect(widget.layout).toBe(tab.dragboard.leftLayout);
                expect(widget.minimized).toBe(false);
                expect(widget.title).toBe(model.title);
                expect(widget.shape).toEqual(model.shape);
                expect(widget.position).toEqual(model.position);
            });

        });

        describe("moveToLayout(newLayout)", () => {

            it("should do nothing if target layout is the current one", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 0});
                const widget = new ns.WidgetView(tab, model);

                widget.moveToLayout(widget.layout);
            });

            it("should work when not affecting other widgets", (done) => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 1});
                const widget = new ns.WidgetView(tab, model);
                const newLayout = create_layout_mock(tab, ns.FreeLayout);

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["23"], true);
                    done();
                });
            });

            it("should work when affecting other widgets", (done) => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 3});
                const widget = new ns.WidgetView(tab, model);
                const newLayout = create_layout_mock(tab, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23", "1"], true);
                    done();
                });
            });

            it("should split updates when moving widget between tabs", (done) => {
                const tab1 = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab1, model);
                const tab2 = create_tab_mock();
                const oldLayout = widget.layout;
                const newLayout = create_layout_mock(tab2, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.model.changeTab).toHaveBeenCalledWith(tab2.model);
                    expect(widget.tab).toBe(tab2);
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"], true);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"], true);
                    done();
                });
            });

            it("should manage minimized widgets", (done) => {
                const tab1 = create_tab_mock();
                const model = create_widget_mock();
                model.minimized = true;
                const widget = new ns.WidgetView(tab1, model);
                const tab2 = create_tab_mock();
                const oldLayout = widget.layout;
                const newLayout = create_layout_mock(tab2, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"], true);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"], true);
                    done();
                });
            });

            it("should relocate widgets if target layout is not a free layout", (done) => {
                const tab1 = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab1, model);
                const tab2 = create_tab_mock();
                const oldLayout = widget.layout;
                const newLayout = create_layout_mock(tab2, ns.SmartColumnLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });
                Wirecloud.Utils.getLayoutMatrix = jasmine.createSpy("getLayoutMatrix");
                newLayout._searchFreeSpace2.and.returnValue({relx: true, rely: true, relwidth: true, relheight: true, anchor: "top-left", x: 1, y: 2});
                newLayout._searchFreeSpace.and.returnValue({relx: true, rely: true, relwidth: true, relheight: true, anchor: "top-left", x: 1, y: 2});

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"], true);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"], true);
                    done();
                });
            });

            it("should restore widget shape when coming back from a full dragboard layout", (done) => {
                const tab = create_tab_mock();
                const model = create_widget_mock({fulldragboard: true});
                const widget = new ns.WidgetView(tab, model);
                const newLayout = create_layout_mock(tab, ns.SmartColumnLayout);
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "5"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "5", "23"], true);
                    done();
                });
            });

        });

        describe("updateWindowSize(windowSize)", () => {

            it("should update the window size going to a non-full dragboard layout", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 0});
                const widget = new ns.WidgetView(tab, model);

                model.updateWindowSize.and.callFake(() => {
                    model.position = {
                        x: 1,
                        y: 2,
                        z: 3,
                        relx: true,
                        rely: true,
                        anchor: "top-left"
                    };
                    model.shape = {
                        relwidth: true,
                        relheight: true,
                        width: 4,
                        height: 5
                    }
                });

                widget.layout.removeWidgetEventListeners = jasmine.createSpy("removeWidgetEventListeners");
                widget.setPosition = jasmine.createSpy("setPosition");
                widget.setShape = jasmine.createSpy("setShape");

                widget.updateWindowSize(900);
                expect(model.updateWindowSize).toHaveBeenCalledWith(900);
                expect(widget.layout.removeWidgetEventListeners).toHaveBeenCalledWith(widget);
                expect(widget.setPosition).toHaveBeenCalledWith({
                    x: 1,
                    y: 2,
                    z: 3,
                    relx: true,
                    rely: true,
                    anchor: "top-left"
                }, false);
                expect(widget.setShape).toHaveBeenCalledWith({
                    relwidth: true,
                    relheight: true,
                    width: 4,
                    height: 5
                }, false, false, false, false);
                expect(tab.dragboard.layouts[0].addWidget).toHaveBeenCalledWith(widget, false);
            });

            it("should update the window size going to a full dragboard layout", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 2, fulldragboard: false});
                const widget = new ns.WidgetView(tab, model);

                model.updateWindowSize.and.callFake(() => {
                    model.position = {
                        x: 1,
                        y: 2,
                        z: 3,
                        relx: true,
                        rely: true,
                        anchor: "top-left"
                    };
                    model.shape = {
                        relwidth: true,
                        relheight: true,
                        width: 4,
                        height: 5
                    };
                    model.fulldragboard = true;
                });

                tab.dragboard.layouts[2].removeWidgetEventListeners = jasmine.createSpy("removeWidgetEventListeners");
                tab.dragboard.layouts[2].removeHandle = jasmine.createSpy("removeHandle");
                widget.setPosition = jasmine.createSpy("setPosition");
                widget.setShape = jasmine.createSpy("setShape");

                widget.updateWindowSize(900);
                expect(model.updateWindowSize).toHaveBeenCalledWith(900);
                expect(tab.dragboard.layouts[2].removeWidgetEventListeners).toHaveBeenCalledWith(widget);
                expect(tab.dragboard.layouts[2].removeHandle).toHaveBeenCalled();

                expect(widget.setPosition).toHaveBeenCalledWith({
                    x: 1,
                    y: 2,
                    z: 3,
                    relx: true,
                    rely: true,
                    anchor: "top-left"
                }, false);
                expect(widget.setShape).toHaveBeenCalledWith({
                    relwidth: true,
                    relheight: true,
                    width: 4,
                    height: 5
                }, false, false, false, false);
                expect(tab.dragboard.fulldragboardLayout.addWidget).toHaveBeenCalledWith(widget, false);
            });

        });

        describe("togglePermission(permission, persitence)", () => {

            it("should work for enabling a permission", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                model.permissions.viewer.move = false;
                const widget = new ns.WidgetView(tab, model);

                const t = widget.togglePermission("move", false);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                expect(model.setPermissions).toHaveBeenCalledWith({move: true}, false);
            });

            it("should work for disabling a permission", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                model.permissions.viewer.move = true;
                const widget = new ns.WidgetView(tab, model);

                const t = widget.togglePermission("move", true);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                expect(model.setPermissions).toHaveBeenCalledWith({move: false}, true);
            });

        });

        describe("toggleTitleVisibility(persitence)", () => {

            it("should work for enabling a title visibility", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                model.titlevisible = false;
                const widget = new ns.WidgetView(tab, model);

                const t = widget.toggleTitleVisibility(false);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                expect(model.setTitleVisibility).toHaveBeenCalledWith(true, false);
            });

            it("should work for disabling a permission", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                model.titlevisible = true;
                const widget = new ns.WidgetView(tab, model);

                const t = widget.toggleTitleVisibility(true);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                expect(model.setTitleVisibility).toHaveBeenCalledWith(false, true);
            });

        });

        describe("persist()", () => {

            it("should update model data on normal widgets", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.persist()).toBe(widget);

                expect(widget.model.setPosition).toHaveBeenCalled();
                expect(widget.model.setShape).toHaveBeenCalled();
            });

            it("should ignore volatile widgets", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({volatile: true});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.persist()).toBe(widget);

                expect(widget.model.setPosition).not.toHaveBeenCalled();
                expect(widget.model.setShape).not.toHaveBeenCalled();
            });

        });

        describe("reload()", () => {

            it("should work", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.reload()).toBe(widget);
                expect(widget.model.reload).toHaveBeenCalledWith();
            });

        });

        describe("setFullDragboardMode(enable)", () => {

            it("should work for moving a widget into full dragboard mode", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.setFullDragboardMode(true)).toBe(widget);

                expect(widget.model.fulldragboard).toBe(true);
                expect(widget.layout).toBe(tab.dragboard.fulldragboardLayout);
                expect(tab.dragboard.lowerToBottom).toHaveBeenCalledWith(widget);
            });

            it("should work for extracting a widget from full dragboard mode", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({fulldragboard: true});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.setFullDragboardMode(false)).toBe(widget);

                expect(widget.model.fulldragboard).toBe(false);
                expect(widget.layout).toBe(tab.dragboard.leftLayout);
                expect(tab.dragboard.lowerToBottom).not.toHaveBeenCalled();
            });

            it("do nothing if widget is already in full dragboard mode", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({fulldragboard: true});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.setFullDragboardMode(true)).toBe(widget);

                expect(widget.model.fulldragboard).toBe(true);
                expect(widget.layout).toBe(tab.dragboard.fulldragboardLayout);
                expect(tab.dragboard.lowerToBottom).not.toHaveBeenCalled();
            });

            it("do nothing if widget is already not in full dragboard mode", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.setFullDragboardMode(false)).toBe(widget);

                expect(widget.model.fulldragboard).toBe(false);
                expect(widget.layout).toBe(tab.dragboard.leftLayout);
                expect(tab.dragboard.lowerToBottom).not.toHaveBeenCalled();
            });

        });

        describe("showLogs()", () => {

            it("should work", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.showLogs()).toBe(widget);
                expect(widget.model.showLogs).toHaveBeenCalledWith();
            });

        });

        describe("repaint()", () => {

            it("should work", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.repaint()).toBe(widget);
            });

        });

        describe("remove()", () => {

            it("should work", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.remove()).toBe(widget);
            });

        });

        describe("showSettings()", () => {

            it("should work", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock();
                const widget = new ns.WidgetView(tab, model);

                expect(widget.showSettings()).toBe(widget);
                expect(widget.model.showSettings).toHaveBeenCalledWith();
            });

        });

        describe("toJSON([action, allLayoutConfigurations])", () => {

            it("should work on normal widgets", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 0});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.toJSON()).toEqual({
                    id: "23",
                    tab: "123",
                    layout: 0,
                    layoutConfigurations: [{
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        action: 'update',
                        minimized: false,
                        anchor: "topleft",
                        relx: true,
                        rely: true,
                        top: 0,
                        left: 3,
                        zIndex: 0,
                        relwidth: true,
                        width: 5,
                        relheight: true,
                        height: 1,
                        fulldragboard: false,
                        titlevisible: true
                    }]
                });
            });

            it("should work on fulldragboard widgets", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 0, fulldragboard: true});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.toJSON()).toEqual({
                    id: "23",
                    tab: "123",
                    layout: 0,
                    layoutConfigurations: [{
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        action: 'update',
                        minimized: false,
                        anchor: "topleft",
                        relx: true,
                        rely: true,
                        top: 0,
                        left: 3,
                        zIndex: 0,
                        relwidth: true,
                        width: 5,
                        relheight: true,
                        height: 1,
                        fulldragboard: true,
                        titlevisible: true
                    }]
                });
            });

            it("should list all layout configurations if specified", () => {
                const tab = create_tab_mock();
                const model = create_widget_mock({layout: 0});
                const widget = new ns.WidgetView(tab, model);

                expect(widget.toJSON('update', true)).toEqual({
                    id: "23",
                    tab: "123",
                    layout: 0,
                    layoutConfigurations: [{
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: 800,
                        action: 'update',
                        minimized: false,
                        anchor: "topleft",
                        relx: true,
                        rely: true,
                        top: 0,
                        left: 3,
                        zIndex: 0,
                        relwidth: true,
                        width: 5,
                        relheight: true,
                        height: 1,
                        fulldragboard: false,
                        titlevisible: true
                    },
                    {
                        id: 1,
                        moreOrEqual: 801,
                        lessOrEqual: -1,
                        anchor: "topleft",
                        action: 'update',
                        relx: true,
                        left: 10,
                        rely: true,
                        top: 2,
                        zIndex: 0,
                        relwidth: true,
                        width: 6,
                        relheight: false,
                        height: 2,
                        fulldragboard: true,
                        titlevisible: true,
                        minimized: false
                    }]
                });
            });

        });

        describe("events", () => {

            let model, tab, widget;

            beforeEach(() => {
                tab = create_tab_mock();
                model = create_widget_mock();
                widget = new ns.WidgetView(tab, model);
            });

            it("should manage changes on widget meta", () => {
                model.missing = true;
                callEventListener(model, "change", ["meta"]);

                expect(widget.wrapperElement.classList.contains("wc-missing-widget")).toBe(true);
            });

            it("should manage changes on widget title", () => {
                const newTitle = "New Title";
                spyOn(widget.titleelement, "setTextContent");
                model.title = newTitle;
                callEventListener(model, "change", ["title"]);

                expect(widget.titleelement.setTextContent).toHaveBeenCalledWith(newTitle);
            });

            it("should manage changes on widget title visibility", () => {
                model.titlevisible = false;
                callEventListener(model, "change", ["titlevisible"]);

                expect(widget.wrapperElement.classList.contains("wc-titled-widget")).toBe(false);
            });

            it("should manage edit mode changes on workspace", () => {
                widget.layout = create_layout_mock(tab, ns.FreeLayout);
                tab.workspace.editing = true;
                callEventListener(tab.workspace, "editmode");

                expect(widget.grip.hidden).toBe(false);
                expect(widget.grip.enabled).toBe(true);
            });

            it("should manage click events on the titlevisible button", () => {
                spyOn(widget, "toggleTitleVisibility");
                widget.titlevisibilitybutton.dispatchEvent("click");

                expect(widget.toggleTitleVisibility).toHaveBeenCalledWith(true);
            });

            it("should manage click events on the grip button", () => {
                spyOn(widget, "togglePermission").and.callThrough();
                widget.grip.dispatchEvent("click");

                expect(widget.togglePermission).toHaveBeenCalledWith("move", true);
            });

            it("should manage hide events from tab", () => {
                widget.tab.workspace.hidden = false;
                widget.tab.hidden = true;
                callEventListener(widget.tab, "hide");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

            it("should manage hide events from tab (workspace hidden)", () => {
                widget.tab.workspace.hidden = true;
                widget.tab.hidden = true;
                callEventListener(widget.tab, "hide");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

            it("should manage hide events from workspace", () => {
                widget.tab.workspace.hidden = true;
                widget.tab.hidden = false;
                callEventListener(widget.tab.workspace, "hide");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

            it("should manage hide events from workspace (tab hidden)", () => {
                widget.tab.workspace.hidden = true;
                widget.tab.hidden = true;
                callEventListener(widget.tab.workspace, "hide");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

            it("should manage show events from tab", () => {
                widget.tab.workspace.hidden = false;
                widget.tab.hidden = false;
                callEventListener(widget.tab, "show");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: true
                });
            });

            it("should manage show events from tab (workspace hidden)", () => {
                widget.tab.workspace.hidden = true;
                widget.tab.hidden = false;
                callEventListener(widget.tab, "show");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

            it("should manage show events from workspace", () => {
                widget.tab.workspace.hidden = false;
                widget.tab.hidden = false;
                callEventListener(widget.tab.workspace, "show");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: true
                });
            });

            it("should manage show events from workspace (tab hidden)", () => {
                widget.tab.workspace.hidden = false;
                widget.tab.hidden = true;
                callEventListener(widget.tab.workspace, "show");

                expect(widget.model.contextManager.modify).toHaveBeenCalledWith({
                    visible: false
                });
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
