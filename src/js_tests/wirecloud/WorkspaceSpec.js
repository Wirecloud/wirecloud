/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function () {

    "use strict";

    const callEventListener = function callEventListener(instance, event) {
        const largs = Array.prototype.slice.call(arguments, 2);
        largs.unshift(instance);
        instance.addEventListener.calls.allArgs().some((args) => {
            if (args[0] === event) {
                args[1].apply(instance, largs);
                return true;
            }
        });
    };

    const create_workspace = function create_workspace(options) {

        options = Wirecloud.Utils.merge({
            id: "1",
            owner: "user",
            name: "empty",
            tabs: []
        }, options);

        if (options.contents) {
            options.tabs.push({
                id: "1",
                name: "tab",
                title: "Tab",
                iwidgets: [
                    {
                        id: "1"
                    }
                ]
            });

            options.tabs.push({
                id: "5",
                name: "tab-2",
                title: "Tab 2",
                iwidgets: [],
                visible: true
            });

            options.tabs.push({
                id: "3",
                name: "tab-4",
                title: "Tab 4",
                iwidgets: [
                    {
                        id: "3"
                    }
                ]
            });
        }

        const resources = {
            addComponent: jasmine.createSpy("addComponent"),
            findResource: jasmine.createSpy("findResource")
        };
        return new Wirecloud.Workspace({
            id: options.id,
            owner: options.owner,
            name: options.name,
            title: options.title,
            removable: options.owner === "user",
            description: "",
            longdescription: "",
            tabs: options.tabs
        }, resources);
    };

    describe("Workspace", () => {

        beforeEach(() => {
            // Init wiring mocks
            spyOn(Wirecloud, "Wiring").and.callFake(function () {
                this.operators = [];
                this.operatorsById = {};
                this.findOperator = jasmine.createSpy("findOperator");
                this.addEventListener = jasmine.createSpy("addEventListener");
                this.removeEventListener = jasmine.createSpy("removeEventListener");
            });

            // Init Widget mocks
            Wirecloud.Widget = jasmine.createSpy("Widget").and.callFake(function (data) {
                this.id = data.id;
            });

            // Init WorkspaceTab mocks
            Wirecloud.WorkspaceTab = jasmine.createSpy("WorkspaceTab").and.callFake(function (workspace, data) {
                this.id = data.id;
                this.name = data.name;
                this.title = data.title;
                this.initial = data.visible;
                this.widgets = data.iwidgets.map((widget) => {
                    return new Wirecloud.Widget(widget);
                }) || [];
                this.widgetsById = {};
                this.widgets.forEach((widget) => {
                    this.widgetsById[widget.id] = widget;
                });
                this.createWidget = jasmine.createSpy("createWidget");
                this.addEventListener = jasmine.createSpy("addEventListener");
                this.removeEventListener = jasmine.createSpy("removeEventListener");
            });

            // Mock core contextManager
            Wirecloud.contextManager = {
                get: jasmine.createSpy("get").and.callFake((key) => {
                    const context = {
                        "username": "user",
                        "mode": "classic"
                    };
                    return context[key];
                })
            };

            // Init WorkspaceTab mocks
            Wirecloud.PreferenceManager = {
                buildPreferences: jasmine.createSpy('buildPreferences').and.callFake(() => {
                    return {
                        addEventListener: jasmine.createSpy("addEventListener")
                    };
                })
            };

            // Simulate Wirecloud.init has been called
            Wirecloud.constants.WORKSPACE_CONTEXT = {
                "description": {
                    "description": "Workspace's short description",
                    "label": "Description"
                },
                'editing': {
                    "label": "Editing mode",
                    "description": "Boolean. Designates whether the workspace is in editing mode."
                },
                "longdescription": {
                    "description": "Workspace's long description",
                    "label": "Long Description"
                },
                "name": {
                    "description": "Current name of the workspace",
                    "label": "Name"
                },
                "owner": {
                    "description": "Workspace's owner username",
                    "label": "Owner"
                },
                "title": {
                    "description": "Current title of the workspace",
                    "label": "Title"
                }
            };
        });

        afterEach(() => {
            if ("live" in Wirecloud) {
                delete Wirecloud.live;
            }
            if (Wirecloud.contextManager != null) {
                delete Wirecloud.contextManager;
            }
        });

        describe("new Workspace(data, components)", () => {

            it("throws a TypeError exception when no passing arguments", () => {
                expect(() => {
                    new Wirecloud.Workspace();
                }).toThrowError(TypeError);
            });

            it("ignores empty titles", () => {
                const workspace = create_workspace({title: " \t "});

                expect(workspace.name).toBe("empty");
                expect(workspace.title).toBe("empty");
            });

            it("handles invalid tabs option", () => {
                const workspace = create_workspace({tabs: "a"});

                expect(workspace.tabs).toEqual([]);
            });

            it("parses empty workspaces", () => {
                const workspace = create_workspace();

                expect(workspace.owner).toBe("user");
                expect(workspace.name).toBe("empty");
                expect(workspace.title).toBe("empty");
                expect(workspace.description).toBe("");
                expect(workspace.longdescription).toBe("");
                expect(workspace.tabs).toEqual([]);
                expect(workspace.tabsById).toEqual({});
                expect(workspace.initialtab).toBe(null);
                expect(workspace.widgets).toEqual([]);
                expect(workspace.widgetsById).toEqual({});
                expect(workspace.url).toEqual(jasmine.any(URL));
                expect(workspace.url.toString()).toBe("https://wirecloud.example.com/user/empty");
                expect(workspace.operators).toEqual([]);
                expect(workspace.operatorsById).toEqual({});
                expect(workspace.wiring).toEqual(jasmine.any(Wirecloud.Wiring));
            });

            it("parses populated workspaces", () => {
                const workspace = create_workspace({
                    contents: true,
                    title: "My Title"
                });

                expect(workspace.owner).toBe("user");
                expect(workspace.name).toBe("empty");
                expect(workspace.title).toBe("My Title");
                expect(workspace.description).toBe("");
                expect(workspace.longdescription).toBe("");
                expect(workspace.tabsById).toEqual({
                    "1": jasmine.any(Wirecloud.WorkspaceTab),
                    "3": jasmine.any(Wirecloud.WorkspaceTab),
                    "5": jasmine.any(Wirecloud.WorkspaceTab)
                });
                expect(workspace.tabs).toEqual([
                    workspace.tabsById["1"],
                    workspace.tabsById["5"],
                    workspace.tabsById["3"]
                ]);
                expect(workspace.initialtab).toBe(workspace.tabs[1]);
                expect(workspace.widgets).toEqual([
                    jasmine.any(Wirecloud.Widget),
                    jasmine.any(Wirecloud.Widget)
                ]);
                expect(workspace.widgetsById).toEqual({
                    "1": jasmine.any(Wirecloud.Widget),
                    "3": jasmine.any(Wirecloud.Widget)
                });
                expect(workspace.url).toEqual(jasmine.any(URL));
                expect(workspace.url.toString()).toBe("https://wirecloud.example.com/user/empty");
                expect(workspace.operators).toEqual([]);
                expect(workspace.operatorsById).toEqual({});
                expect(workspace.wiring).toEqual(jasmine.any(Wirecloud.Wiring));
            });

            it("listen to live synchronization messages when available", () => {
                Wirecloud.live = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };

                create_workspace();

                expect(Wirecloud.live.addEventListener.calls.count()).toBe(1);
                expect(Wirecloud.live.addEventListener).toHaveBeenCalledWith("workspace", jasmine.any(Function));
            });

            it("reacts to workspace name changes", () => {
                Wirecloud.live = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({
                    name: "oldname"
                });
                workspace.addEventListener("change", listener);

                callEventListener(Wirecloud.live, "workspace", {
                    workspace: "1",
                    name: "newname"
                });

                expect(workspace.name).toBe("newname");
                expect(listener).toHaveBeenCalledWith(workspace, ['name'], {name: "oldname"});
            });

            it("ignores name changes related to other workspaces", () => {
                Wirecloud.live = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({
                    name: "oldname"
                });
                workspace.addEventListener("change", listener);

                callEventListener(Wirecloud.live, "workspace", {
                    workspace: "2",
                    name: "newname"
                });

                expect(workspace.name).toBe("oldname");
                expect(listener).not.toHaveBeenCalled();
            });

            it("ignores changes on unmanaged properties", () => {
                Wirecloud.live = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace();
                workspace.addEventListener("change", listener);

                callEventListener(Wirecloud.live, "workspace", {
                    workspace: "1",
                    unknown: "newvalue"
                });

                expect(listener).not.toHaveBeenCalled();
            });

            it("handles change events from tabs", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                workspace.addEventListener("changetab", listener);
                callEventListener(workspace.tabs[0], "change", ["name"]);

                expect(listener).toHaveBeenCalledWith(workspace, workspace.tabs[0], ["name"]);
            });

            it("handles addwidget events related to widget creation", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                workspace.addEventListener("createwidget", listener);
                const widget = new Wirecloud.Widget({id: "1"});
                callEventListener(workspace.tabs[0], "addwidget", widget, null);

                expect(listener).toHaveBeenCalledWith(workspace, widget);
            });

            it("handles addwidget events related to widget creation", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                workspace.addEventListener("removewidget", listener);
                const widget = new Wirecloud.Widget({id: "1"});
                callEventListener(workspace.tabs[0], "removewidget", widget);

                expect(listener).toHaveBeenCalledWith(workspace, widget);
            });

            it("ignore addwidget events related to moving widgets between tabs", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                const widget = new Wirecloud.Widget({id: "1"});
                callEventListener(workspace.tabs[0], "addwidget", widget, {});

                expect(listener).not.toHaveBeenCalled();
            });

            it("handles createoperator events", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                workspace.addEventListener("createoperator", listener);
                const operator = {};
                callEventListener(workspace.wiring, "createoperator", operator);

                expect(listener).toHaveBeenCalledWith(workspace, operator);
            });

            it("handles removeoperator events", () => {
                const listener = jasmine.createSpy("listener");
                const workspace = create_workspace({contents: true});
                workspace.addEventListener("removeoperator", listener);
                const operator = {};
                callEventListener(workspace.wiring, "removeoperator", operator);

                expect(listener).toHaveBeenCalledWith(workspace, operator);
            });

        });

        describe("createTab([options])", () => {

            let workspace;

            beforeEach(() => {
                workspace = create_workspace();
            });

            it("creates tabs on empty workspaces", (done) => {
                workspace = create_workspace();
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.title).toEqual(jasmine.any(String));
                    expect(data.name).toEqual(jasmine.any(String));
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": "MyTab",
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([tab]);
                    done();
                });
            });

            it("creates tabs with custom title", (done) => {
                const title = "My tiTle";
                workspace = create_workspace();
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.title).toEqual(title);
                    expect(data.name).toEqual(jasmine.any(String));
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": name,
                                "title": title,
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab({title: title});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([tab]);
                    done();
                });
            });

            it("created tabs can be removed", (done) => {
                workspace = create_workspace();
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.name).toEqual(jasmine.any(String));
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": "MyTab",
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab();
                task.then((tab) => {
                    tab.addEventListener.calls.allArgs().forEach((args) => {
                        if (args[0] === "remove") {
                            args[1](tab);
                        }
                    });
                    expect(workspace.tabs).toEqual([]);
                    done();
                });
            });

            it("creates tabs on populated workspaces", (done) => {
                workspace = create_workspace({contents: true});
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.name).toEqual(jasmine.any(String));
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": "mytab",
                                "title": "MyTab",
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab({title: "MyTab"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([
                        jasmine.any(Wirecloud.WorkspaceTab),
                        jasmine.any(Wirecloud.WorkspaceTab),
                        jasmine.any(Wirecloud.WorkspaceTab),
                        tab
                    ]);
                    done();
                });
            });

            it("allows providing the tab name using the name option", (done) => {
                workspace = create_workspace();
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.name).toBe("MyTab");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": "MyTab",
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab({"name": "MyTab"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([tab]);
                    done();
                });
            });

            it("creates tabs and search a non-duplicated title", (done) => {
                workspace = create_workspace({contents: true});
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    const data = JSON.parse(options.postBody);
                    expect(data.title).toEqual("Tab 4 (2)");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": "123",
                                "name": "MyTab",
                                "iwidgets": []
                            })
                        });
                    });
                });

                const task = workspace.createTab();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([
                        jasmine.any(Wirecloud.WorkspaceTab),
                        jasmine.any(Wirecloud.WorkspaceTab),
                        jasmine.any(Wirecloud.WorkspaceTab),
                        tab
                    ]);
                    done();
                });
            });

            describe("calls reject on unexpected responses", () => {

                const test = (status) => {
                    return (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        const task = workspace.createTab();

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("200", test(200));
                it("204", test(204));

            });

            describe("calls reject on error responses", () => {

                const test = (status) => {
                    return (done) => {
                        const description = "detailed error description";
                        Wirecloud.workspaceInstances = {};
                        Wirecloud.workspacesByUserAndName = {};
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({description: description})
                                });
                            });
                        });

                        const task = workspace.createTab();

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            expect(error).toBe(description);
                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("500", test(500));

            });

        });

        describe("findOperator(id)", () => {

            it("is a Wirecloud.Wiring.findOperator shortcut", () => {
                const workspace = create_workspace({
                    contents: true
                });

                workspace.findOperator("1");

                expect(workspace.wiring.findOperator.calls.count()).toBe(1);
                expect(workspace.wiring.findOperator).toHaveBeenCalledWith("1");
            });

        });

        describe("findTab(id)", () => {

            let workspace;

            beforeEach(() => {
                workspace = create_workspace({
                    contents: true
                });
            });

            it("throws an error when not passing the id parameter", () => {
                expect(() => {
                    workspace.findTab();
                }).toThrowError(TypeError);
            });

            it("returns the associated WorkspaceTab instance", () => {
                const tab = workspace.findTab("1");

                expect(tab).toBe(workspace.tabs[0]);
            });

            it("allows to pass numbers on the id parameter", () => {
                const tab = workspace.findTab(1);

                expect(tab).toBe(workspace.tabs[0]);
            });

            it("returns null if there is not a tab with the passed id", () => {
                const tab = workspace.findTab("2");

                expect(tab).toBe(null);
            });

        });

        describe("findWidget(id)", () => {

            let workspace;

            beforeEach(() => {
                workspace = create_workspace({
                    contents: true
                });
            });

            it("throws an error when not passing the id parameter", () => {
                expect(() => {
                    workspace.findWidget();
                }).toThrowError(TypeError);
            });

            it("returns the associated Widget instance", () => {
                const widget = workspace.findWidget("1");

                expect(widget).toBe(workspace.tabs[0].widgets[0]);
            });

            it("allows to pass numbers on the id parameter", () => {
                const widget = workspace.findWidget(1);

                expect(widget).toBe(workspace.tabs[0].widgets[0]);
            });

            it("returns null if there is not a widget with the passed id", () => {
                const widget = workspace.findWidget("2");

                expect(widget).toBe(null);
            });

        });

        describe("isAllowed(action)", () => {

            beforeEach(() => {
                Wirecloud.PolicyManager = {
                    evaluate: jasmine.createSpy("evaluate").and.returnValue(true)
                };
            });

            const test = (action, expected_value, options) => {
                it(action, () => {
                    const workspace = create_workspace(options);
                    expect(workspace.isAllowed(action)).toBe(expected_value);
                });
            }

            describe("owned workspaces", () => {
                test("remove", true);
                test("merge_workspaces", true);
                test("update_preferences", true);
                test("rename", true);
                test("edit", true);
                test("anyotherpermission", true);

                it("merge_workspaces (alternative)", () => {
                    Wirecloud.PolicyManager.evaluate.and.returnValues(false, true);
                    const workspace = create_workspace();
                    expect(workspace.isAllowed("merge_workspaces")).toBe(true);
                });
            });

            describe("non-owned workspaces", () => {
                test("remove", false, {owner: "other"});
                test("merge_workspaces", false, {owner: "other"});
                test("update_preferences", false, {owner: "other"});
                test("rename", false, {owner: "other"});
                test("edit", false, {owner: "other"});
            });

        });

        describe("merge([options])", () => {

            it("is a Wirecloud.mergeWorkspace shortcut", () => {
                spyOn(Wirecloud, "mergeWorkspace");
                const workspace = create_workspace();
                const options = {workspace: 5};

                workspace.merge(options);

                expect(Wirecloud.mergeWorkspace).toHaveBeenCalledWith(workspace, options);
            });

        });

        describe("publish(options)", () => {

            let workspace;

            beforeEach(() => {
                workspace = create_workspace();
                spyOn(Wirecloud.LocalCatalogue, '_includeResource');
            });

            it("throws a TypeError exception when not passing the options parameter", () => {
                expect(() => {
                    workspace.publish();
                }).toThrowError(TypeError);
            });

            it("creates packaged workspaces using the minimal information", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 201,
                            responseText: "{}"
                        });
                    });
                });

                const task = workspace.publish({
                    vendor: "Wirecloud",
                    name: "PackagedMashup",
                    version: "1.0"
                });

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(() => {
                    done();
                });
            });

            it("creates packaged workspaces providing workspace description", (done) => {
                const image = {"image": true};
                spyOn(window, "FormData").and.callFake(function () {
                    this.data = {};
                    this.append = function (key, value) {
                        this.data[key] = value;
                    };
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(options.postBody).toEqual(jasmine.any(FormData));
                    const data = options.postBody.data;
                    expect(data.image).toBe(image);
                    expect(JSON.parse(data.json)).toEqual({
                        vendor: "Wirecloud",
                        name: "PackagedMashup",
                        version: "1.0",
                        description: "Mashup description",
                        longdescription: "This is a *mashup*"
                    });
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 201,
                            responseText: "{}"
                        });
                    });
                });

                const task = workspace.publish({
                    vendor: "Wirecloud",
                    name: "PackagedMashup",
                    version: "1.0",
                    description: "Mashup description",
                    longdescription: "This is a *mashup*",
                    image: image
                });

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(() => {
                    done();
                });
            });

            describe("calls reject on unexpected responses", () => {

                const test = (status) => {
                    return (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        const task = workspace.publish({
                            vendor: "Wirecloud",
                            name: "PackagedMashup",
                            version: "1.0"
                        });

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("201", test(201));
                it("204", test(204));

            });

            describe("calls reject on error responses", () => {

                const test = (status) => {
                    return (done) => {
                        const description = "detailed error description";
                        Wirecloud.workspaceInstances = {};
                        Wirecloud.workspacesByUserAndName = {};
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({description: description})
                                });
                            });
                        });

                        const task = workspace.publish({
                            vendor: "Wirecloud",
                            name: "PackagedMashup",
                            version: "1.0"
                        });

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            expect(error).toBe(description);
                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("500", test(500));

            });

        });

        describe("remove()", () => {

            it("is a Wirecloud.removeWorkspace shortcut", (done) => {
                spyOn(Wirecloud, "removeWorkspace").and.callFake((workspace) => {
                    return new Wirecloud.Task("mocked task", (resolve) => {resolve();});
                });
                const workspace = create_workspace();
                const listener = jasmine.createSpy("listener");
                workspace.addEventListener("remove", listener);

                const task = workspace.remove();

                expect(Wirecloud.removeWorkspace).toHaveBeenCalledWith(workspace);
                task.then(() => {
                    expect(listener.calls.count()).toBe(1);
                    expect(listener).toHaveBeenCalledWith(workspace);
                    done();
                });
            });

        });

        describe("rename(title[, name])", () => {

            let workspace;

            beforeEach(() => {
                workspace = create_workspace();
            });

            it("throws a TypeError exception when not passing the title parameter", () => {
                expect(() => {
                    workspace.rename();
                }).toThrowError(TypeError);
            });

            it("should allow to provide a custom name", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    const data = JSON.parse(options.postBody);
                    expect(data.name).toEqual("custom-name");
                    expect(data.title).toEqual("New Name");
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                const task = workspace.rename("New Name", "custom-name");

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((value) => {
                    done();
                });
            });

            it("fires a change event", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });
                const listener = jasmine.createSpy("listener");
                workspace.addEventListener("change", listener);

                const task = workspace.rename("New Name");

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((value) => {
                    expect(listener).toHaveBeenCalledWith(workspace, ['name', 'title'], {name: "empty", title: "empty"});
                    expect(value).toBe(workspace);
                    expect(workspace.title).toBe("New Name");
                    expect(workspace.name).toBe("new-name");
                    done();
                });
            });

            describe("calls reject on unexpected responses", () => {

                const test = (status) => {
                    return (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        const task = workspace.rename("newname");

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("200", test(200));
                it("201", test(201));

            });

            describe("calls reject on error responses", () => {

                const test = (status) => {
                    return (done) => {
                        const description = "detailed error description";
                        Wirecloud.workspaceInstances = {};
                        Wirecloud.workspacesByUserAndName = {};
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({description: description})
                                });
                            });
                        });

                        const task = workspace.rename("newname");

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            expect(error).toBe(description);
                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("500", test(500));

            });

        });

        describe("unload(name)", () => {

            it("disconnect all event listeners", () => {
                const workspace = create_workspace();

                expect(workspace.unload()).toBe(workspace);

                expect(workspace.wiring.addEventListener.calls.allArgs())
                    .toEqual(workspace.wiring.removeEventListener.calls.allArgs().reverse());
            });

            it("disconnect live event listener", () => {
                Wirecloud.live = {
                    addEventListener: jasmine.createSpy("addEventListener"),
                    removeEventListener: jasmine.createSpy("removeEventListener")
                };

                const workspace = create_workspace();
                expect(workspace.unload()).toBe(workspace);

                expect(Wirecloud.live.addEventListener.calls.allArgs())
                    .toEqual(Wirecloud.live.removeEventListener.calls.allArgs());
            });

        });
    });

})();
