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

    const callEventListener = function callEventListener(instance, event) {
        var largs = Array.prototype.slice.call(arguments, 2);
        largs.unshift(instance);
        instance.addEventListener.calls.allArgs().some(function (args) {
            if (args[0] === event) {
                args[1].apply(instance, largs);
                return true;
            }
        });
    };

    const create_workspace = function create_workspace(options) {
        let workspace = utils.merge({
            id: "1",
            owner: "user",
            name: "empty",
            title: "Dashboard Title",
            tabs: [
                {
                    id: "8",
                    widgets: [],
                    name: "tab",
                    title: "Tab",
                    initial: true
                }
            ],
            operators: [],
            preferences: {},
            createTab: jasmine.createSpy("createTab"),
            isAllowed: jasmine.createSpy("isAllowed").and.returnValue(false),
            contextManager: {
                modify: jasmine.createSpy("modify")
            }
        }, options);

        workspace.addEventListener = jasmine.createSpy("addEventListener");
        workspace.removeEventListener = jasmine.createSpy("removeEventListener");

        return workspace;
    };

    describe("WorkspaceView", () => {

        var sidebar = null;

        beforeAll(() => {
            // TODO
            Wirecloud.contextManager = {
                "get": jasmine.createSpy("get").and.returnValue("currentuser")
            };

            // TODO
            Wirecloud.ui.MissingDependenciesWindowMenu = jasmine.createSpy("MissingDependenciesWindowMenu").and.callFake(function () {
                this.show = jasmine.createSpy("show");
            });
        });

        afterAll(() => {
            // TODO
            Wirecloud.contextManager = null;
        });

        beforeEach(() => {
            Wirecloud.clearEventListeners("loaded");
            Wirecloud.contextManager.get.and.returnValue("currentuser");

            // Init required mocks
            ns.WorkspaceListItems = jasmine.createSpy("WorkspaceListItems");
            utils.inherit(ns.WorkspaceListItems, StyledElements.DynamicMenuItems);

            ns.WorkspaceViewMenuItems = jasmine.createSpy("WorkspaceViewMenuItems");
            utils.inherit(ns.WorkspaceViewMenuItems, StyledElements.DynamicMenuItems);

            ns.ComponentSidebar = jasmine.createSpy("ComponentSidebar").and.callFake(function () {
                sidebar = this;
                this.wrapperElement = document.createElement('div');
                this.addEventListener = jasmine.createSpy("addEventListener");
            });
            utils.inherit(ns.ComponentSidebar, StyledElements.StyledElement);

            ns.WorkspaceTabView = class WorkspaceTabView extends StyledElements.Tab {
                constructor(id, notebook, options) {
                    super(id, notebook, options);
                    this.id = "8";
                    this.createWidget = jasmine.createSpy("createWidget");
                    this.findWidget = jasmine.createSpy("findWidget");
                    this.widgets = [];
                    this.dragboard = {
                        _updateIWidgetSizes: jasmine.createSpy("_updateIWidgetSizes"),
                        leftLayout: {
                            active: false
                        },
                        rightLayout: {
                            active: false
                        }
                    };
                }
            };

            spyOn(Wirecloud, "Workspace").and.callFake(function () {
                this.operators = [];
                this.operatorsById = {};
                this.findOperator = jasmine.createSpy("findOperator");
                this.addEventListener = jasmine.createSpy("addEventListener");
                this.removeEventListener = jasmine.createSpy("removeEventListener");
            });
        });

        describe("new WorkspaceView(id, options)", () => {

            it("should work without providing options", () => {
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');

                expect(ns.ComponentSidebar).toHaveBeenCalledWith();
                expect(view.view_name).toBe("workspace");
                expect(view.editing).toBe(false);
            });

            it("should allow to change the activeWorkspace through the workspace menu", () => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                spyOn(Wirecloud, "changeActiveWorkspace");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();

                ns.WorkspaceListItems.calls.argsFor(0)[0]("notused", workspace);

                expect(view.wsMenu).not.toEqual(null);
                expect(Wirecloud.changeActiveWorkspace).toHaveBeenCalledWith(workspace);
            });

            it("should allow to add new widgets", (done) => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                view.activeTab.createWidget.and.returnValue(Promise.resolve());

                let group = {
                    meta: {
                        type: "widget"
                    }
                };
                let button = {
                    disable: jasmine.createSpy("disable"),
                    enable: jasmine.createSpy("enable")
                };
                callEventListener(sidebar, "create", group, button);
                expect(view.activeTab.createWidget).toHaveBeenCalledWith(group.meta);
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(button.enable).toHaveBeenCalledWith();
                    done();
                }, 0);
            });

            it("should handle errors when adding new widgets", (done) => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                view.activeTab.createWidget.and.returnValue(Promise.reject());

                let group = {
                    meta: {
                        type: "widget"
                    }
                };
                let button = {
                    disable: jasmine.createSpy("disable"),
                    enable: jasmine.createSpy("enable")
                };
                callEventListener(sidebar, "create", group, button);
                expect(view.activeTab.createWidget).toHaveBeenCalledWith(group.meta);
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(button.enable).toHaveBeenCalledWith();
                    done();
                }, 0);
            });

            it("should allow to merge mashups", (done) => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                spyOn(Wirecloud, "changeActiveWorkspace");
                spyOn(Wirecloud, "mergeWorkspace").and.returnValue(Promise.resolve(workspace));

                let group = {
                    meta: {
                        type: "mashup"
                    }
                };
                let button = {
                    disable: jasmine.createSpy("disable"),
                    enable: jasmine.createSpy("enable")
                };
                callEventListener(sidebar, "create", group, button);
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(Wirecloud.changeActiveWorkspace).toHaveBeenCalledWith(workspace, {history: "replace"});
                    done();
                });
            });

            it("should handle missing components error when merging mashups", (done) => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                spyOn(Wirecloud, "changeActiveWorkspace");
                let error_details = {
                    missingDependencies: []
                };
                spyOn(Wirecloud, "mergeWorkspace").and.returnValue(Promise.reject({
                    details: error_details
                }));

                let group = {
                    meta: {
                        type: "mashup"
                    }
                };
                let button = {
                    disable: jasmine.createSpy("disable"),
                    enable: jasmine.createSpy("enable")
                };
                spyOn(Wirecloud.ui.WindowMenu.prototype, "show");
                callEventListener(sidebar, "create", group, button);
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(Wirecloud.ui.MissingDependenciesWindowMenu).toHaveBeenCalledWith(null, error_details);
                    expect(button.enable).toHaveBeenCalledWith();
                    expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should handle error when merging mashups", (done) => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                spyOn(Wirecloud, "changeActiveWorkspace");
                spyOn(Wirecloud, "mergeWorkspace").and.returnValue(Promise.reject({}));

                let group = {
                    meta: {
                        type: "mashup"
                    }
                };
                let button = {
                    disable: jasmine.createSpy("disable"),
                    enable: jasmine.createSpy("enable")
                };
                spyOn(Wirecloud.ui.WindowMenu.prototype, "show");
                callEventListener(sidebar, "create", group, button);
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(button.enable).toHaveBeenCalledWith();
                    expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();
                    done();
                });
            });

        });

        describe("buildStateData()", () => {

            it("should return a valid state", () => {
                let view = new ns.WorkspaceView(1);

                expect(view.buildStateData()).toEqual(jasmine.any(Object));
            });

        });

        describe("canGoUp()", () => {

            it("should return true if current loaded workspace is not wirecloud/home", () => {
                Wirecloud.activeWorkspace = {
                    owner: "oneuser",
                    name: "dashboard"
                };
                let view = new ns.WorkspaceView(1);

                expect(view.canGoUp()).toBe(true);
            });

            it("should return false if there is any workspace loaded", () => {
                Wirecloud.activeWorkspace = null;
                let view = new ns.WorkspaceView(1);

                expect(view.canGoUp()).toBe(false);
            });

            it("should return false if the current loaded workspace is wirecloud/home", () => {
                Wirecloud.activeWorkspace = {
                    owner: "wirecloud",
                    name: "home"
                };
                let view = new ns.WorkspaceView(1);

                expect(view.canGoUp()).toBe(false);
            });

        });

        describe("drawAttention(id)", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
            });

            it("should do nothing if the widget is not present", () => {
                expect(view.drawAttention("1")).toBe(view);
            });

            it("should highlight the widget if present", () => {
                let widget = {
                    highlight: jasmine.createSpy("highlight"),
                    tab: {
                        dragboard: {
                            raiseToTop: jasmine.createSpy("raiseToTop")
                        },
                        highlight: jasmine.createSpy("highlight")
                    }
                };
                widget.highlight.and.returnValue(widget);
                view.tabs[0].findWidget.and.returnValue(widget);

                expect(view.drawAttention("14")).toBe(view);
            });

            it("should activate sidebar layouts", () => {
                spyOn(Wirecloud.ui, "SidebarLayout");
                let widget = {
                    highlight: jasmine.createSpy("highlight"),
                    layout: new Wirecloud.ui.SidebarLayout(),
                    tab: {
                        dragboard: {
                            raiseToTop: jasmine.createSpy("raiseToTop")
                        },
                        highlight: jasmine.createSpy("highlight")
                    }
                };
                widget.highlight.and.returnValue(widget);
                view.tabs[0].findWidget.and.returnValue(widget);

                expect(view.drawAttention("14")).toBe(view);
                expect(widget.layout.active).toBe(true);
            });
        });

        describe("buildAddWidgetButton()", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
            });

            it("should slide in the component panel", () => {
                view.showcase = {
                    searchComponents: {
                        refresh: jasmine.createSpy("refresh")
                    }
                };
                spyOn(view.layout, "slideIn");
                let button = view.buildAddWidgetButton();

                button.click();

                expect(view.showcase.searchComponents.refresh).toHaveBeenCalledWith();
                expect(view.layout.slideIn).toHaveBeenCalledWith();
            });

            it("should slideOut the component panel", () => {
                spyOn(view.layout, "slideOut");
                let button = view.buildAddWidgetButton();

                button.active = true;
                button.click();

                expect(view.layout.slideOut).toHaveBeenCalledWith();
            });
        });

        describe("findTab(id)", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
            });

            it("should return null if the tab is not present", () => {
                expect(view.findTab("1")).toBe(null);
            });

            it("should return a tab if present", () => {
                expect(view.findTab("8")).not.toBe(null);
            });

        });

        describe("findWidget(id)", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
            });

            it("should return null if the widget is not present", () => {
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                expect(view.findWidget("1")).toBe(null);
            });

            it("should return a widget if present", () => {
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                let widget = {};
                view.tabs[0].findWidget.and.returnValue(widget);

                expect(view.findWidget("8")).toBe(widget);
            });

            it("should work while loading", () => {
                // findWidget can be called while loading, in this case
                // WorkspaceView will have a temporal tab to display the
                // loading animation, this tab should be skipped
                spyOn(StyledElements.Notebook.prototype, "goToTab").and.callFake(function () {
                    let widget = {};
                    view.tabs[1].findWidget.and.returnValue(widget);

                    expect(view.findWidget("8")).toBe(widget);
                    this.visibleTab = view.tabs[1];
                });

                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                expect(view.notebook.goToTab).toHaveBeenCalled();
            });

        });

        describe("getBreadcrumb()", () => {

            it("should return loading... if WireCloud is still loading", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);

                expect(view.getBreadcrumb()).toEqual([{
                    'label': 'loading...'
                }]);
            });

            it("should use metadata from navigation history if available", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    "workspace_owner": "otheruser",
                    "workspace_title": "dashboard"
                });
                let view = new ns.WorkspaceView(1);

                expect(view.getBreadcrumb()).toEqual([
                    {
                        'label': 'otheruser'
                    },
                    {
                        'label': 'dashboard'
                    }
                ]);
            });

            it("should return a breadcum based on the loaded workspace", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.getBreadcrumb()).toEqual([
                    {
                        'label': 'user'
                    },
                    {
                        'label': 'Dashboard Title'
                    }
                ]);
            });

        });

        describe("getTitle()", () => {

            it("should return loading... if WireCloud is still loading", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);

                expect(view.getTitle()).toEqual('loading...');
            });

            it("should use metadata from navigation history if available", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    "workspace_owner": "otheruser",
                    "workspace_title": "dashboard"
                });
                let view = new ns.WorkspaceView(1);

                expect(view.getTitle()).toEqual('otheruser/dashboard');
            });

            it("should return a breadcum based on the loaded workspace", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.getTitle()).toEqual('user/Dashboard Title');
            });

        });

        describe("getToolbarButtons()", () => {

            it("should return an empty list if user is anonymous", () => {
                Wirecloud.contextManager.get.and.returnValue("anonymous");
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);

                expect(view.getToolbarButtons()).toEqual([]);
            });

            it("should return a button list if user is not anonymous", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);

                expect(view.getToolbarButtons()).toEqual([
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button)
                ]);
            });

            it("should return a button list if user is not anonymous and there is a loaded workspace", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                spyOn(Wirecloud.UserInterfaceManager, "changeCurrentView");
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                view.loadWorkspace(workspace);

                let buttons = view.getToolbarButtons();

                expect(buttons).toEqual([
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button),
                    jasmine.any(StyledElements.Button)
                ]);

                buttons[2].enable().click();
                buttons[3].click();
                buttons[4].click();

                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("wiring");
                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("myresources");
                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("marketplace");
                expect(Wirecloud.UserInterfaceManager.changeCurrentView.calls.count()).toBe(3);
            });

        });

        describe("getToolbarMenu()", () => {

            it("should return null while not loaded", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({});
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.getToolbarMenu()).toBe(null);
            });

            it("should return the toolbar menu once loaded", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    "workspace_owner": "otheruser",
                    "workspace_title": "dashboard"
                });
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.getToolbarMenu()).toBe(view.wsMenu);
            });

            it("should return null if the current user is anonymous", () => {
                Wirecloud.contextManager.get.and.returnValue("anonymous");
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    "workspace_owner": "otheruser",
                    "workspace_title": "dashboard"
                });
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.getToolbarMenu()).toBe(null);
            });

        });

        describe("goUp()", () => {

            it("changes the active workspace", () => {
                spyOn(Wirecloud, "changeActiveWorkspace");
                let view = new ns.WorkspaceView(1);

                expect(view.goUp()).toBe(view);

                expect(Wirecloud.changeActiveWorkspace).toHaveBeenCalledWith({
                    owner: 'wirecloud',
                    name: 'home'
                });
            });

        });

        describe("loadWorkspace(workspace[, options])", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
            });

            it("should load empty workspaces", () => {
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                expect(view.tabs).toEqual([jasmine.any(StyledElements.Tab)]);
                expect(view.activeTab).toBe(view.tabs[0]);
                expect(view.name).toEqual(workspace.name);
                expect(view.title).toEqual(workspace.title);
                expect(view.widgets).toEqual([]);

                // Normal visualization should provide a power by wirecloud button
                expect(view.seeOnWirecloudButton).toEqual(undefined);
                expect(view.poweredByWirecloudButton).toEqual(jasmine.any(StyledElements.Button));
                spyOn(window, "open");
                view.poweredByWirecloudButton.click();

                expect(window.open).toHaveBeenCalledWith(jasmine.anything(), "_blank");
            });

            it("should load workspaces with operators", () => {
                spyOn(view.layout.content, "appendChild");
                let operator = {wrapperElement: {}};
                let workspace = create_workspace({
                    operators: [operator]
                });
                view.loadWorkspace(workspace);

                expect(view.layout.content.appendChild).toHaveBeenCalledWith(operator.wrapperElement);
            });

            it("should load workspaces using the initialTab option", () => {
                let workspace = create_workspace({
                    tabs: [
                        {
                            id: "8",
                            widgets: [],
                            name: "tab",
                            title: "Tab",
                            initial: true
                        },
                        {
                            id: "12",
                            widgets: [],
                            name: "tab2",
                            title: "Tab 2",
                            initial: false
                        }
                    ]
                });
                view.loadWorkspace(workspace, {initialtab: "tab2"});

                expect(view.tabs).toEqual([
                    jasmine.any(ns.WorkspaceTabView),
                    jasmine.any(ns.WorkspaceTabView)
                ]);
                expect(view.activeTab).toBe(view.tabs[1]);
                expect(view.name).toEqual(workspace.name);
                expect(view.title).toEqual(workspace.title);
            });

            it("should load editable workspaces", (done) => {
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                spyOn(StyledElements.Notebook.prototype, "addButton");
                spyOn(StyledElements.Notebook.prototype, "createTab").and.callThrough();
                view.loadWorkspace(workspace);

                // Check the interface provides a button for creating tabs
                let tab = {};
                workspace.createTab.and.returnValue(Promise.resolve(tab));

                let button = view.notebook.addButton.calls.argsFor(0)[0];
                spyOn(button, "disable");
                spyOn(button, "enable");
                button.click();
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(workspace.createTab).toHaveBeenCalledWith();
                    expect(view.notebook.createTab).toHaveBeenCalledWith({
                        tab_constructor: Wirecloud.ui.WorkspaceTabView,
                        model: tab,
                        workspace: view
                    });
                    expect(button.enable).toHaveBeenCalledWith();
                    done();
                }, 0);
            });

            it("should handle errors creating tabs", (done) => {
                let view = new ns.WorkspaceView(1);
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                spyOn(StyledElements.Notebook.prototype, "addButton");
                spyOn(StyledElements.Notebook.prototype, "createTab").and.callThrough();
                view.loadWorkspace(workspace);
                workspace.createTab.and.returnValue(Promise.reject());

                let button = view.notebook.addButton.calls.argsFor(0)[0];
                spyOn(button, "disable");
                spyOn(button, "enable");
                view.notebook.createTab.calls.reset();
                button.click();
                expect(button.disable).toHaveBeenCalledWith();

                setTimeout(() => {
                    expect(workspace.createTab).toHaveBeenCalledWith();
                    expect(view.notebook.createTab).not.toHaveBeenCalled();
                    expect(button.enable).toHaveBeenCalledWith();
                    done();
                }, 0);
            });

            it("should load workspaces when supporting the fullscreen mode", () => {
                let workspace = create_workspace();
                spyOn(Wirecloud.Utils, "isFullscreenSupported").and.returnValue(true);
                spyOn(Wirecloud.Utils, "onFullscreenChange");

                view.loadWorkspace(workspace);

                expect(Wirecloud.Utils.onFullscreenChange).toHaveBeenCalledWith(view.notebook, jasmine.any(Function));

                Wirecloud.Utils.onFullscreenChange.calls.argsFor(0)[1]();

                view.notebook = {
                    fullscreen: true,
                    addClassName: jasmine.createSpy("addClassName"),
                    exitFullscreen: jasmine.createSpy("exitFullscreen"),
                    requestFullscreen: jasmine.createSpy("requestFullscreen")
                };

                Wirecloud.Utils.onFullscreenChange.calls.argsFor(0)[1]();

                view.fullscreenButton.click();
                expect(view.notebook.exitFullscreen).toHaveBeenCalledWith();

                view.notebook.fullscreen = false;
                view.fullscreenButton.click();
                expect(view.notebook.requestFullscreen).toHaveBeenCalledWith();
            });

            it("should load workspaces on embedded mode", () => {
                let workspace = create_workspace();
                spyOn(Wirecloud.Utils, "isFullscreenSupported").and.returnValue(true);
                spyOn(Wirecloud.Utils, "onFullscreenChange");
                Wirecloud.contextManager.get.and.returnValue("embedded");

                view.loadWorkspace(workspace);

                // embedded visualizations should provide a see on wirecloud button
                expect(view.poweredByWirecloudButton).toEqual(undefined);
                expect(view.seeOnWirecloudButton).toEqual(jasmine.any(StyledElements.Button));
                spyOn(window, "open");
                view.seeOnWirecloudButton.click();

                expect(window.open).toHaveBeenCalledWith(jasmine.anything(), "_blank");
            });

            it("should handle operator create events", () => {
                spyOn(Wirecloud.HistoryManager, "replaceState");
                Wirecloud.UserInterfaceManager.header = {
                    "refresh": jasmine.createSpy("refresh")
                };
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                spyOn(view.layout.content, "appendChild");
                let operator = {wrapperElement: {}};

                callEventListener(workspace, "createoperator", operator);

                expect(view.layout.content.appendChild).toHaveBeenCalledWith(operator.wrapperElement);
            });

            it("should handle operator remove events", () => {
                spyOn(Wirecloud.HistoryManager, "replaceState");
                Wirecloud.UserInterfaceManager.header = {
                    "refresh": jasmine.createSpy("refresh")
                };
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                spyOn(view.layout.content, "removeChild");
                let operator = {wrapperElement: {}};

                callEventListener(workspace, "removeoperator", operator);

                expect(view.layout.content.removeChild).toHaveBeenCalledWith(operator.wrapperElement);
            });

            it("should handle workspace changes", () => {
                spyOn(Wirecloud.HistoryManager, "replaceState");
                Wirecloud.UserInterfaceManager.header = {
                    "refresh": jasmine.createSpy("refresh")
                };
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                callEventListener(workspace, "change");

                expect(Wirecloud.HistoryManager.replaceState).toHaveBeenCalled();
            });

            it("should handle workspace remove events", () => {
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                spyOn(Wirecloud, "changeActiveWorkspace");
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                callEventListener(workspace, "remove");

                expect(Wirecloud.changeActiveWorkspace).toHaveBeenCalledWith({
                    owner: 'wirecloud',
                    name: 'home'
                });
            });

            it("should handle workspace unload events", () => {
                let workspace = create_workspace();
                view.loadWorkspace(workspace);

                callEventListener(workspace, "unload");

                expect(view.model).toBe(null);
                expect(view.editing).toBe(false);
            });

            it("should enable edit mode when clicking on the edit button", () => {
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                view.loadWorkspace(workspace);

                // Enable edit mode
                view.editButton.click();

                expect(view.editing).toBe(true);
                expect(view.model.contextManager.modify).toHaveBeenCalledWith({editing: true});
            });

            it("should disable edit mode on unload events", () => {
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                view.loadWorkspace(workspace);
                view.editButton.click();

                callEventListener(workspace, "unload");

                expect(view.model).toBe(null);
                expect(view.editing).toBe(false);
            });

            it("should slide out component panel when leaving edit mode", () => {
                let workspace = create_workspace();
                workspace.isAllowed.and.returnValue(true);
                view.loadWorkspace(workspace);

                // Enable edit mode
                view.editButton.click();

                // Open component panel
                spyOn(view.layout, "slideOut");

                view.walletButton.active = true;
                view.walletButton.click();
                view.model.contextManager.modify.calls.reset();

                // Close edit mode
                view.editButton.click();

                expect(view.layout.slideOut).toHaveBeenCalledWith();
                expect(view.model.contextManager.modify).toHaveBeenCalledWith({editing: false});
            });

        });

        describe("onHistoryChange(newState)", () => {

            var view;

            beforeEach(() => {
                view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                Wirecloud.activeWorkspace = null;
                spyOn(Wirecloud, "changeActiveWorkspace");
            });

            it("should handle changes to deleted workspaces (no active workspace)", () => {
                spyOn(Wirecloud, "dispatchEvent");

                view.onHistoryChange({
                    workspace_owner: "user",
                    workspace_name: "dashboard"
                });

                expect(Wirecloud.dispatchEvent).toHaveBeenCalledWith('viewcontextchanged');
            });

            it("should handle changes to deleted workspaces", () => {
                let unload = jasmine.createSpy("unload");
                Wirecloud.activeWorkspace = {
                    unload: unload
                };
                spyOn(Wirecloud, "dispatchEvent");

                view.onHistoryChange({
                    workspace_owner: "user",
                    workspace_name: "dashboard"
                });

                expect(Wirecloud.dispatchEvent).toHaveBeenCalledWith('viewcontextchanged');
                expect(unload).toHaveBeenCalledWith();
            });

            it("should handle workspace changes", () => {
                let workspace = create_workspace();
                Wirecloud.workspacesByUserAndName = {
                    "user": {
                        "dashboard": workspace
                    }
                };

                view.onHistoryChange({
                    workspace_owner: "user",
                    workspace_name: "dashboard"
                });

                expect(Wirecloud.changeActiveWorkspace).toHaveBeenCalledWith(workspace, {initialtab: undefined, history: 'ignore'});
            });

            it("should handle tab changes", () => {
                let workspace = create_workspace({
                    tabs: [
                        {
                            id: "8",
                            widgets: [],
                            name: "tab",
                            title: "Tab",
                            initial: true
                        },
                        {
                            id: "12",
                            widgets: [],
                            name: "tab2",
                            title: "Tab 2",
                            initial: false
                        }
                    ]
                });
                view.loadWorkspace(workspace);
                Wirecloud.activeWorkspace = workspace;
                Wirecloud.workspacesByUserAndName = {
                    "user": {
                        "dashboard": workspace
                    }
                };
                spyOn(view, "findTab").and.returnValue(view.tabs[1]);
                spyOn(view.notebook, "goToTab");

                view.onHistoryChange({
                    workspace_owner: "user",
                    workspace_name: "dashboard",
                    tab: "tab2"
                });

                expect(view.notebook.goToTab).toHaveBeenCalledWith(view.tabs[1]);
                expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();
            });

            it("should handle no changes", () => {
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                Wirecloud.activeWorkspace = workspace;
                Wirecloud.workspacesByUserAndName = {
                    "user": {
                        "dashboard": workspace
                    }
                };
                spyOn(view.notebook, "goToTab");

                view.onHistoryChange({
                    workspace_owner: "user",
                    workspace_name: "dashboard"
                });

                expect(view.notebook.goToTab).not.toHaveBeenCalled();
                expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();
            });

        });

        describe("showSettings()", () => {

            it("should display the preferences window menu", () => {
                let view = new ns.WorkspaceView(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = create_workspace();
                view.loadWorkspace(workspace);
                let show = jasmine.createSpy("show");
                // TODO
                Wirecloud.ui.PreferencesWindowMenu = jasmine.createSpy("PreferencesWindowMenu").and.callFake(function () {
                    this.show = show
                });

                expect(view.showSettings()).toBe(view);

                expect(Wirecloud.ui.PreferencesWindowMenu).toHaveBeenCalledWith("workspace", workspace.preferences);
                expect(show).toHaveBeenCalledWith();
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
