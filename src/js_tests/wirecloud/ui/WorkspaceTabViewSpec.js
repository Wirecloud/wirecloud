/*
 *     Copyright (c) 2018-2019 Future Internet Consulting and Development Solutions S.L.
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

    const create_tab = function create_tab(options) {
        return utils.merge({
            addEventListener: jasmine.createSpy("addEventListener"),
            createWidget: jasmine.createSpy("createWidget"),
            id: "8",
            preferences: {
                get: jasmine.createSpy("get"),
                addEventListener: jasmine.createSpy("addEventListener")
            },
            title: "Tab Title",
            widgets: []
        }, options);
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
            isAllowed: jasmine.createSpy("isAllowed").and.returnValue(false)
        }, options);

        workspace.addEventListener = jasmine.createSpy("addEventListener");
        workspace.removeEventListener = jasmine.createSpy("removeEventListener");

        return {
            addEventListener: jasmine.createSpy("addEventListener"),
            buildAddWidgetButton: jasmine.createSpy("buildAddWidgetButton").and.returnValue(),
            model: workspace
        };
    };

    describe("WorkspaceTabView", () => {

        const notebook = new StyledElements.Notebook();

        beforeAll(() => {
            spyOn(ns, "WidgetView").and.callFake(function (tab, model, options) {
                this.id = model.id;
                this.load = jasmine.createSpy("load");
            });
            // TODO
            ns.WorkspaceTabViewDragboard = jasmine.createSpy("WorkspaceTabViewDragboard").and.callFake(function () {
                this.freeLayout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 0}),
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 0}),
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 0}),
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 0})
                };
                this.baseLayout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 0}),
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 0}),
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 0}),
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 0})
                };
                this.leftLayout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 0}),
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 0}),
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 0}),
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 0})
                };
                this.rightLayout = {
                    adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 0}),
                    adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 0}),
                    adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 0}),
                    adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 0})
                };
                this.paint = jasmine.createSpy("paint");
                this._notifyWindowResizeEvent = jasmine.createSpy("_notifyWindowResizeEvent");
                this._updateBaseLayout = jasmine.createSpy("_updateBaseLayout");
            });
            ns.WorkspaceTabViewMenuItems = jasmine.createSpy("WorkspaceTabViewMenuItems");
            utils.inherit(ns.WorkspaceTabViewMenuItems, StyledElements.DynamicMenuItems);
            Wirecloud.TutorialCatalogue = {
                buildTutorialReferences: jasmine.createSpy("buildTutorialReferences")
            };
        });

        afterAll(() => {
            // TODO
            ns.WorkspaceTabViewDragboard = null;
            Wirecloud.TutorialCatalogue = null;
        });

        describe("new WorkspaceTabView(id, notebook, options)", () => {

            /*
            it("should require the id parameter", () => {
                expect(() => {
                    new ns.WorkspaceTabView();
                }).toThrowError(TypeError);
            });
            */

            it("should load empty tabs", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.title).toEqual("Tab Title");
                expect(tab.widgets).toEqual([]);
                expect(tab.widgetsById).toEqual({});
                expect(tab.initialMessage.hidden).toBe(true);
            });

            it("should load tabs with widgets", () => {
                let workspace = create_workspace();
                let model = create_tab({
                    widgets: [{id: "9"}, {id: "5"}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.title).toEqual("Tab Title");
                expect(tab.widgets).toEqual([
                    jasmine.any(ns.WidgetView),
                    jasmine.any(ns.WidgetView)
                ]);
                expect(tab.widgetsById).toEqual({
                    "5": jasmine.any(ns.WidgetView),
                    "9": jasmine.any(ns.WidgetView)
                });
                expect(tab.initialMessage.hidden).toBe(true);
            });

            it("should load empty editable tabs", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab({
                    widgets: []
                });
                ns.WorkspaceTabViewMenuItems.calls.reset();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(ns.WorkspaceTabViewMenuItems).toHaveBeenCalledWith(tab);
                expect(tab.initialMessage.hidden).toBe(false);
            });

            it("should load editable tabs", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab({
                    widgets: [{id: "9"}, {id: "5"}]
                });
                ns.WorkspaceTabViewMenuItems.calls.reset();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(ns.WorkspaceTabViewMenuItems).toHaveBeenCalledWith(tab);
            });

        });

        describe("createWidget(resource[, options])", () => {

            it("should commit changes by default", (done) => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(Promise.resolve(widgetmodel));
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });
                // TODO this make sense?
                tab.dragboard.freeLayout.adaptHeight.and.returnValue({inLU: "invalid"});
                tab.dragboard.freeLayout.adaptWidth.and.returnValue({inLU: 40});
                tab.dragboard.freeLayout.columns = 20;
                // END TODO

                let p = tab.createWidget(
                    {
                        default_height: "120px",
                        default_width: "33%"
                    },
                    {
                        layout: 1,
                        top: 2,
                        left: 3,
                        height: "invalid",
                        width: 40
                    }
                );

                p.then((created_widget) => {
                    expect(created_widget).toBe(widget);
                    done();
                });
            });

            it("should allow commit false", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(widgetmodel);
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });
                tab.dragboard.baseLayout.adaptWidth.and.returnValue({inLU: 15});
                tab.dragboard.baseLayout.columns = 20;

                let created_widget = tab.createWidget(
                    {
                        default_height: "120px",
                        default_width: "33%"
                    }, {
                        commit: false
                    }
                );

                expect(created_widget).toBe(widget);
            });

            it("should support the refposition option", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(widgetmodel);
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });
                tab.dragboard.freeLayout.searchBestPosition = jasmine.createSpy("searchBestPosition").and.returnValue({x: 1, y: 2});

                let created_widget = tab.createWidget(
                    {
                        default_height: "120px",
                        default_width: "33%"
                    }, {
                        commit: false,
                        layout: 1,
                        refposition: document.createElement('div')
                    }
                );

                expect(created_widget).toBe(widget);
                expect(tab.dragboard.freeLayout.searchBestPosition).toHaveBeenCalled();
            });

            it("should honour initiallayout preference", (done) => {
                let workspace = create_workspace();
                let model = create_tab();
                model.preferences.get.and.returnValue("Free");
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(Promise.resolve(widgetmodel));
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });
                tab.dragboard.freeLayout._searchFreeSpace = jasmine.createSpy("_searchFreeSpace").and.returnValue({x: 1, y: 2});

                let p = tab.createWidget({
                    default_height: "120px",
                    default_width: "33%"
                });

                p.then((created_widget) => {
                    expect(created_widget).toBe(widget);
                    done();
                });
            });

            it("should allow to create widgets on the left sidebar layout", (done) => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(Promise.resolve(widgetmodel));
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });

                let p = tab.createWidget(
                    {
                        default_height: "120px",
                        default_width: "33%"
                    }, {
                        layout: 2
                    }
                );

                p.then((created_widget) => {
                    expect(created_widget).toBe(widget);
                    done();
                });
            });

            it("should allow to create widgets on the right sidebar layout", (done) => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: 80};
                model.createWidget.and.returnValue(Promise.resolve(widgetmodel));
                let widget = {id: 80};
                spyOn(tab, "findWidget").and.callFake((id) => {
                    expect(id).toBe(80);
                    return widget;
                });

                let p = tab.createWidget(
                    {
                        default_height: "120px",
                        default_width: "33%"
                    }, {
                        layout: 3
                    }
                );

                p.then((created_widget) => {
                    expect(created_widget).toBe(widget);
                    done();
                });
            });

        });

        describe("highlight()", () => {

            it("should add the highlight CSS class", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.highlight()).toBe(tab);
            });

        });

        describe("show()", () => {

            it("should load all the widgets from the tab", () => {
                let workspace = create_workspace();
                let model = create_tab({
                    widgets: [{}, {}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.show()).toBe(tab);
                expect(tab.widgets[0].load).toHaveBeenCalled();
                expect(tab.widgets[1].load).toHaveBeenCalled();
            });

        });

        describe("showSettings()", () => {

            it("should display the settings dialog", () => {
                var show;
                // TODO
                ns.PreferencesWindowMenu = jasmine.createSpy("PreferencesWindowMenu").and.callFake(function () {
                    this.show = show = jasmine.createSpy("show");
                });
                let workspace = create_workspace();
                let model = create_tab({
                    widgets: [{}, {}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.showSettings()).toBe(tab);

                expect(ns.PreferencesWindowMenu).toHaveBeenCalledWith('tab', model.preferences);
                expect(show).toHaveBeenCalledWith();
            });

        });

        describe("tab events", () => {

            var workspace, model, tab;

            beforeEach(() => {
                workspace = create_workspace();
                model = create_tab({});
                tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
            });

            it("should ignore preferences changes not related to the baselayout", () => {
                callEventListener(model.preferences, "pre-commit", {"other": 5});

                expect(tab.dragboard._updateBaseLayout).not.toHaveBeenCalled();
            });

            it("should handle changes to the baselayout preference", () => {
                callEventListener(model.preferences, "pre-commit", {"baselayout": 5});

                expect(tab.dragboard._updateBaseLayout).toHaveBeenCalledWith();
            });

            it("should handle title changes", () => {
                spyOn(StyledElements.Tab.prototype, "rename");
                let newtitle = "NewTitle";
                model.title = newtitle;

                callEventListener(model, "change", ['title']);

                expect(StyledElements.Tab.prototype.rename).toHaveBeenCalledWith(newtitle);
            });

            it("should handle name changes (visible tab)", () => {
                spyOn(StyledElements.Tab.prototype, "rename");
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    workspace_owner: "owner",
                    workspace_name: "dashboard",
                    tab: "oldname"
                });
                spyOn(Wirecloud.HistoryManager, "replaceState");
                let newname = "new-name";
                model.name = newname;
                tab.hidden = false;

                callEventListener(model, "change", ['name']);

                expect(StyledElements.Tab.prototype.rename).not.toHaveBeenCalled();
                expect(Wirecloud.HistoryManager.replaceState).toHaveBeenCalledWith({
                    workspace_owner: "owner",
                    workspace_name: "dashboard",
                    tab: newname
                });
            });

            it("should handle name changes (hidden tab)", () => {
                spyOn(StyledElements.Tab.prototype, "rename");
                spyOn(Wirecloud.HistoryManager, "getCurrentState");
                spyOn(Wirecloud.HistoryManager, "replaceState");
                let newname = "new-name";
                model.name = newname;
                tab.hidden = true;

                callEventListener(model, "change", ['name']);

                expect(StyledElements.Tab.prototype.rename).not.toHaveBeenCalled();
                expect(Wirecloud.HistoryManager.replaceState).not.toHaveBeenCalled();
            });

            it("should handle remove events", () => {
                spyOn(StyledElements.Tab.prototype, "close");

                callEventListener(model, "remove");

                expect(StyledElements.Tab.prototype.close).toHaveBeenCalledWith();
            });

            it("should handle addwidget events (visible tab)", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: "20"};
                tab.hidden = false;

                callEventListener(model, "addwidget", widgetmodel, null);

                expect(tab.widgets).toEqual([
                    jasmine.any(ns.WidgetView)
                ]);
                expect(tab.widgetsById).toEqual({
                    "20": jasmine.any(ns.WidgetView)
                });
                expect(tab.widgets[0].load).toHaveBeenCalledWith();
                expect(tab.initialMessage.hidden).toBe(true);
            });

            it("should handle addwidget events (hidden tab)", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: "20"};
                tab.hidden = true;

                callEventListener(model, "addwidget", widgetmodel, null);

                expect(tab.widgets).toEqual([
                    jasmine.any(ns.WidgetView)
                ]);
                expect(tab.widgetsById).toEqual({
                    "20": jasmine.any(ns.WidgetView)
                });
                expect(tab.widgets[0].load).not.toHaveBeenCalled();
                expect(tab.initialMessage.hidden).toBe(true);
            });

            it("should handle addwidget events related to move widgets between tabs", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widgetmodel = {id: "20"};
                let widgetview = new ns.WidgetView(null, widgetmodel);
                ns.WidgetView.calls.reset();
                tab.hidden = true;

                callEventListener(model, "addwidget", widgetmodel, widgetview);

                expect(tab.widgets).toEqual([widgetview]);
                expect(tab.widgetsById).toEqual({
                    "20": widgetview
                });
                expect(ns.WidgetView).not.toHaveBeenCalled();
                expect(widgetview.load).not.toHaveBeenCalled();
            });

            it("should handle removewidget events", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab({
                    widgets: [{id: "9"}, {id: "5"}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widget = tab.findWidget("5");

                callEventListener(model, "removewidget", widget);

                expect(tab.widgets).toEqual([
                    jasmine.any(ns.WidgetView)
                ]);
                expect(tab.widgetsById).toEqual({
                    "9": jasmine.any(ns.WidgetView)
                });
                expect(tab.initialMessage.hidden).toBe(true);
            });

            it("should display empty message when adequated on removewidget events", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab({
                    widgets: [{id: "5"}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                let widget = tab.findWidget("5");

                callEventListener(model, "removewidget", widget);

                expect(tab.widgets).toEqual([]);
                expect(tab.widgetsById).toEqual({});
                expect(tab.initialMessage.hidden).toBe(false);
            });

            it("should handle edit mode change events", () => {
                let workspace = create_workspace();
                workspace.model.isAllowed.and.returnValue(true);
                let model = create_tab({
                    widgets: [{id: "9"}, {id: "5"}]
                });
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });
                expect(tab.prefbutton.enabled).toBe(false);

                workspace.editing = true;
                callEventListener(workspace, "editmode", true);

                expect(tab.prefbutton.enabled).toBe(true);
            });

        });

        describe("unhighlight()", () => {

            it("should remove the highlight CSS class", () => {
                let workspace = create_workspace();
                let model = create_tab();
                let tab = new ns.WorkspaceTabView("1", notebook, {
                    model: model,
                    workspace: workspace
                });

                expect(tab.unhighlight()).toBe(tab);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);
