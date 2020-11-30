/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function () {

    "use strict";

    describe("core", function () {

        beforeEach(function () {

            spyOn(Wirecloud, "Workspace").and.callFake(function (data, components) {
                for (var key in data) {
                    this[key] = data[key];
                }
                this.addEventListener = jasmine.createSpy("addEventListener");
            });
            Wirecloud.activeWorkspace = null;

        });

        describe("changeActiveWorkspace(workspace[, options])", () => {

            var initworkspace;

            beforeEach(() => {
                initworkspace = {
                    id: 1,
                    owner: "wirecloud",
                    name: "home",
                    title: "Home",
                    contextManager: {
                        addCallback: jasmine.createSpy()
                    }
                };
                Wirecloud.workspaceInstances = {1: initworkspace};
                Wirecloud.workspacesByUserAndName = {
                    wirecloud: {home: initworkspace}
                };
                spyOn(Wirecloud, "loadWorkspace").and.callFake(() => {
                    return new Wirecloud.Task("Downloading workspace", (resolve) => {
                        resolve(initworkspace);
                    });
                });
                spyOn(Wirecloud.HistoryManager, 'pushState');
                spyOn(Wirecloud.HistoryManager, 'replaceState');
            });

            it("throws a TypeError exception when not passing the workspace parameter", () => {
                expect(function () {
                    Wirecloud.changeActiveWorkspace();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing the owner option without passing a name option", function () {
                expect(() => {
                    Wirecloud.changeActiveWorkspace({
                        owner: "user"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when passing the name option without passing a owner option", function () {
                expect(() => {
                    Wirecloud.changeActiveWorkspace({
                        name: "MyWorkspace"
                    });
                }).toThrowError(TypeError);
            });

            it("allows switching the active workspace by passing ids", function (done) {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);

                // Act
                var task = Wirecloud.changeActiveWorkspace({id: 1});

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

            it("allows switching the active workspace by passing owner/name pairs", function (done) {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);

                // Act
                var task = Wirecloud.changeActiveWorkspace({
                    owner: "wirecloud",
                    name: "home",
                    title: "Home"
                });

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

            it("unloads previous active workspace", (done) => {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);
                var previous_workspace = {
                    unload: jasmine.createSpy('unload')
                };
                Wirecloud.activeWorkspace = previous_workspace;

                // Act
                var task = Wirecloud.changeActiveWorkspace({id: 1});

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(previous_workspace.unload).toHaveBeenCalledWith();
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

            it("supports passing the initial tab using the initialtab option", (done) => {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);

                // Act
                var task = Wirecloud.changeActiveWorkspace({id: 1}, {initialtab: "MyTab"});

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.HistoryManager.replaceState).not.toHaveBeenCalled();
                    expect(Wirecloud.HistoryManager.pushState).toHaveBeenCalledWith({
                        workspace_owner: "wirecloud",
                        workspace_name: "home",
                        workspace_title: "Home",
                        view: "workspace",
                        tab: "MyTab"
                    });
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

            it("supports replacing the navigation history (by using the history option)", (done) => {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);

                // Act
                var task = Wirecloud.changeActiveWorkspace({id: 1}, {history: "replace"});

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.HistoryManager.pushState).not.toHaveBeenCalled();
                    expect(Wirecloud.HistoryManager.replaceState).toHaveBeenCalledWith({
                        workspace_owner: "wirecloud",
                        workspace_name: "home",
                        workspace_title: "Home",
                        view: "workspace"
                    });
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

            it("supports not touching the navigation history by using the history option", (done) => {
                // Arrange
                var listener = jasmine.createSpy('listener');
                Wirecloud.addEventListener('activeworkspacechanged', listener);

                // Act
                var task = Wirecloud.changeActiveWorkspace({id: 1}, {history: "ignore"});

                // Assert
                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(Wirecloud.HistoryManager.pushState).not.toHaveBeenCalled();
                    expect(Wirecloud.HistoryManager.replaceState).not.toHaveBeenCalled();
                    expect(Wirecloud.activeWorkspace).toBe(initworkspace);
                    expect(workspace).toBe(initworkspace);
                    expect(listener).toHaveBeenCalledWith(Wirecloud, initworkspace);
                    done();
                });
            });

        });

        describe("createWorkspace(options)", () => {

            it("throws an Error when not providing any of the mashup, workspace or name options", () => {
                expect(() => {
                    Wirecloud.createWorkspace();
                }).toThrowError();
            });

            it("throws an Error when using the mashup and workspace options at the same time", () => {
                expect(() => {
                    Wirecloud.createWorkspace({
                        mashup: "Wirecloud/TestMashup/1.0",
                        workspace: 123
                    });
                }).toThrowError();
            });

            it("allows creating simple workspaces", (done) => {
                Wirecloud.workspaceInstances = {};
                Wirecloud.workspacesByUserAndName = {};
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": 123,
                                "owner": "user",
                                "name": "MyWorkspace",
                                "empty_params": []
                            })
                        });
                    });
                });

                var task = Wirecloud.createWorkspace({name: "MyWorkspace"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(workspace).toEqual(jasmine.any(Object));
                    expect(Wirecloud.workspaceInstances[123]).toBe(workspace);
                    expect(Wirecloud.workspacesByUserAndName).toEqual({
                        "user": {
                            "MyWorkspace": workspace
                        }
                    });
                    done();
                });
            });

            it("allows creating workspaces from mashup templates", (done) => {
                var template = "Wirecloud/TestMashup/1.0";
                Wirecloud.workspaceInstances = {};
                Wirecloud.workspacesByUserAndName = {};
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    var payload = JSON.parse(options.postBody);
                    expect(payload.mashup).toBe(template);
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": 123,
                                "owner": "user",
                                "name": "TestMashup 2",
                                "empty_params": []
                            })
                        });
                    });
                });

                var task = Wirecloud.createWorkspace({mashup: template});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(workspace).toEqual(jasmine.any(Object));
                    expect(Wirecloud.workspaceInstances[123]).toBe(workspace);
                    expect(Wirecloud.workspacesByUserAndName).toEqual({
                        "user": {
                            "TestMashup 2": workspace
                        }
                    });
                    done();
                });
            });

            describe("calls reject on unexepected responses", () => {

                var test = (status) => {
                    return (done) => {
                        Wirecloud.workspaceInstances = {};
                        Wirecloud.workspacesByUserAndName = {};
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        var task = Wirecloud.createWorkspace({name: "Test"});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("200", test(200));
                it("404", test(404));
                it("422 (with invalid body)", test(422));

            });

            describe("calls reject on error responses", () => {

                var test = (status, details) => {
                    return (done) => {
                        var description = "detailed error description";
                        Wirecloud.workspaceInstances = {};
                        Wirecloud.workspacesByUserAndName = {};
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({
                                        description: description,
                                        details: details
                                    })
                                });
                            });
                        });

                        var task = Wirecloud.createWorkspace({name: "Test"});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            if (details == null) {
                                expect(error).toBe(description);
                            } else {
                                expect(error).toEqual({
                                    description: description,
                                    details: details
                                });
                            }

                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("500", test(500));
                it("422", test(422, {missingDependencies: {}}));

            });

        });

        describe("init([options])", () => {

            var preferencesmanager, currentThemeBackup;

            beforeEach(() => {
                currentThemeBackup = Wirecloud.currentTheme;

                preferencesmanager = {
                    addEventListener: jasmine.createSpy("addEventListener")
                };
                spyOn(window, "addEventListener");
                spyOn(Wirecloud.HistoryManager, "init");
                spyOn(Wirecloud.HistoryManager, "getCurrentState");
                spyOn(Wirecloud.UserInterfaceManager, "init");
                spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
                spyOn(Wirecloud.UserInterfaceManager, "changeCurrentView");
                Wirecloud.ui.Theme = jasmine.createSpy("Theme");
                Wirecloud.PreferenceManager = {
                    buildPreferences: jasmine.createSpy('buildPreferences').and.callFake(() => {
                        return preferencesmanager;
                    })
                };
                spyOn(Wirecloud, "changeActiveWorkspace").and.callFake(() => {
                    return new Wirecloud.Task("", (resolve) => (resolve()));
                });
                window.moment = {
                    locale: jasmine.createSpy("locale")
                };

                spyOn(Wirecloud, "ContextManager");
                Wirecloud.ContextManager.prototype.get = jasmine.createSpy("get").and.callFake((name) => {
                    switch (name) {
                    case "isanonymous":
                        return false;
                    case "theme":
                        return "wirecloud.defaulttheme";
                    case "username":
                        return "admin";
                    case "version_hash":
                        return "dcbd0816066ec878d2b2e9792be025c45e71a8d5";
                    };
                });
                Wirecloud.ContextManager.prototype.modify = jasmine.createSpy("modify");
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    var response;

                    switch (url) {
                    case Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION:
                        response = '{}';
                        break;
                    case Wirecloud.URLs.PLATFORM_CONTEXT_COLLECTION:
                        response = '{"platform": {"fullname": {"description": "Full name of the logged user", "label": "Full name", "value": "Administrator"}, "isanonymous": {"description": "Boolean. Designates whether current user is logged in the system.", "label": "Is Anonymous", "value": false}, "isstaff": {"description": "Boolean. Designates whether current user can access the admin site.", "label": "Is Staff", "value": true}, "issuperuser": {"description": "Boolean. Designates whether current user is a super user.", "label": "Is Superuser", "value": true}, "language": {"description": "Current language used in the platform", "label": "Language", "value": "en"}, "mode": {"description": "Rendering mode used by the platform (available modes: classic, smartphone and embedded)", "label": "Mode", "value": "classic"}, "orientation": {"description": "Current screen orientation", "label": "Orientation", "value": "landscape"}, "theme": {"description": "Name of the theme used by the platform", "label": "Theme", "value": "wirecloud.defaulttheme"}, "username": {"description": "User name of the current logged user", "label": "Username", "value": "admin"}, "version": {"description": "Version of the platform", "label": "Version", "value": "1.1.0"}, "version_hash": {"description": "Hash for the current version of the platform. This hash changes when the platform is updated or when an addon is added or removed", "label": "Version Hash", "value": "dcbd0816066ec878d2b2e9792be025c45e71a8d5"}}, "workspace": {"name": {"description": "Current name of the workspace", "label": "Name"}, "owner": {"description": "Workspace\'s owner username", "label": "Owner"}}}';
                        break;
                    case "/api/theme/wirecloud.defaulttheme":
                        response = '{"baseurl": "http://localhost:8000/static/theme/wirecloud.defaulttheme/", "label": "Basic", "name": "wirecloud.defaulttheme"}';
                        break;
                    case Wirecloud.URLs.PLATFORM_PREFERENCES:
                        response = '{"language": {"inherit": false, "value": "en"}}';
                        break;
                    case Wirecloud.URLs.WORKSPACE_COLLECTION:
                        response = '[{"description": "", "id": "1", "lastmodified": 1481098766279, "longdescription": "", "name": "home", "owner": "wirecloud", "public": true, "removable": false, "shared": true}]';
                        break;
                    }

                    return new Wirecloud.Task("request", (resolve) => {
                        resolve({
                            responseText: response
                        });
                    });
                });

            });

            afterEach(() => {
                Wirecloud.currentTheme = currentThemeBackup;

                if ("WEBSOCKET" in Wirecloud.URLs) {
                    delete Wirecloud.URLs.WEBSOCKET;
                }
            });

            it("should return a Task", function (done) {
                Wirecloud.HistoryManager.getCurrentState.and.returnValue({
                    workspace_owner: "wirecloud",
                    workspace_name: "home",
                    workspace_title: "Home",
                    view: "workspace"
                });

                var task = Wirecloud.init();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(() => {
                    expect(Wirecloud.UserInterfaceManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.HistoryManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.UserInterfaceManager.monitorTask).toHaveBeenCalledWith(task);

                    // Check Wirecloud react to unload events
                    Wirecloud.UserInterfaceManager.monitorTask.calls.reset();
                    expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", jasmine.any(Function), true);
                    expect(() => {
                        window.addEventListener.calls.argsFor(0)[1]();
                    }).not.toThrow();
                    expect(Wirecloud.UserInterfaceManager.monitorTask).toHaveBeenCalledWith(task);

                    // WireCloud should reload on language change
                    expect(() => {
                        // But ignore other changes
                        preferencesmanager.addEventListener.calls.argsFor(0)[1](null, {other: true});
                    }).not.toThrow();

                    done();
                });
            });

            it("should discard default operations when using the preventDefault option", (done) => {
                Wirecloud.HistoryManager.getCurrentState.and.returnValue({
                    workspace_owner: "wirecloud",
                    workspace_name: "home",
                    workspace_title: "Home",
                    view: "workspace"
                });

                var task = Wirecloud.init({preventDefault: true});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(() => {
                    expect(Wirecloud.UserInterfaceManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.HistoryManager.init).not.toHaveBeenCalledWith();
                    expect(Wirecloud.UserInterfaceManager.monitorTask).not.toHaveBeenCalled();
                    expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();

                    // Wirecloud should ignore beforeunload events when using the preventDefault option
                    expect(window.addEventListener).not.toHaveBeenCalled()

                    done();
                });
            });

            it("should handle context errors", (done) => {
                spyOn(Wirecloud.GlobalLogManager, "log");
                spyOn(Wirecloud.ui.MessageWindowMenu.prototype, "show");
                Wirecloud.HistoryManager.getCurrentState.and.returnValue({
                    workspace_owner: "wirecloud",
                    workspace_name: "home",
                    workspace_title: "Home",
                    view: "workspace"
                });
                Wirecloud.ContextManager.and.throwError("invalid data");

                var task = Wirecloud.init();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.catch(() => {
                    expect(Wirecloud.GlobalLogManager.log).toHaveBeenCalled();
                    expect(Wirecloud.UserInterfaceManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.HistoryManager.init).not.toHaveBeenCalledWith();
                    expect(Wirecloud.UserInterfaceManager.monitorTask).toHaveBeenCalled();
                    expect(Wirecloud.changeActiveWorkspace).not.toHaveBeenCalled();
                    expect(Wirecloud.ui.MessageWindowMenu.prototype.show).toHaveBeenCalled();
                    done();
                });
            });

            it("should init live synchornization support when available", (done) => {
                const addEventListenerSpy = jasmine.createSpy("addEventListener");
                spyOn(window, "WebSocket").and.callFake(function () {
                    this.addEventListener = addEventListenerSpy;
                });
                Wirecloud.URLs.WEBSOCKET = "/api/live";
                Wirecloud.HistoryManager.getCurrentState.and.returnValue({
                    workspace_owner: "wirecloud",
                    workspace_name: "home",
                    workspace_title: "Home",
                    view: "workspace"
                });

                const task = Wirecloud.init();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(() => {
                    expect(Wirecloud.UserInterfaceManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.HistoryManager.init).toHaveBeenCalledWith();
                    expect(Wirecloud.UserInterfaceManager.monitorTask).toHaveBeenCalledWith(task);

                    expect(WebSocket).toHaveBeenCalled();
                    expect(Wirecloud.live).not.toEqual(null);
                    expect(() => {
                        addEventListenerSpy.calls.argsFor(0)[1]({
                            data: JSON.stringify({category: "workspace"})
                        });
                    }).not.toThrow();
                    done();
                });
            });

        });

        describe("loadWorkspace(workspace[, options])", function () {

            it("should throw a TypeError when not passing the workspace parameter", function () {
                expect(function () {
                    Wirecloud.loadWorkspace();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError when passing the owner option without passing a name option", function () {
                expect(() => {
                    Wirecloud.loadWorkspace({
                        owner: "user"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError when passing the name option without passing a owner option", function () {
                expect(() => {
                    Wirecloud.loadWorkspace({
                        name: "MyWorkspace"
                    });
                }).toThrowError(TypeError);
            });

            it("retrieves workspace information by owner/name", function (done) {
                Wirecloud.workspaceInstances = {};
                Wirecloud.workspacesByUserAndName = {
                    wirecloud: {home: {id: 1}}
                };
                Wirecloud.WorkspaceCatalogue = jasmine.createSpy("WorkspaceCatalogue").and.callFake(function (id) {
                    expect(id).toBe(1);
                });
                Wirecloud.WorkspaceCatalogue.prototype.reload = jasmine.createSpy("reload").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace components", function (resolve) {resolve()});
                });
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY_OWNER_NAME, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY_OWNER_NAME.evaluate).toHaveBeenCalledWith({
                        owner: "wirecloud",
                        name: "home"
                    });
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"id": 1, "owner": "wirecloud", "name": "home", "empty_params": []}'
                        });
                    });
                });

                var task = Wirecloud.loadWorkspace({owner: "wirecloud", name: "home", title: "Home"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (workspace) {
                    expect(workspace).toEqual(jasmine.any(Wirecloud.Workspace));
                    done();
                });
            });

            it("retrieves workspace information by id", function (done) {
                Wirecloud.workspaceInstances = {};
                Wirecloud.WorkspaceCatalogue = jasmine.createSpy("WorkspaceCatalogue").and.callFake(function (id) {
                    expect(id).toBe(100);
                });
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY, "evaluate");
                Wirecloud.WorkspaceCatalogue.prototype.reload = jasmine.createSpy("reload").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace components", function (resolve) {resolve()});
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY.evaluate).toHaveBeenCalledWith({
                        workspace_id: 100
                    });
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"id": 100, "owner": "wirecloud", "name": "home", "empty_params": []}'
                        });
                    });
                });

                var task = Wirecloud.loadWorkspace({id: 100});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (workspace) {
                    expect(workspace).toEqual(jasmine.any(Wirecloud.Workspace));
                    done();
                });
            });

            it("handles workspace name updates", (done) => {
                Wirecloud.workspaceInstances = {};
                Wirecloud.WorkspaceCatalogue = jasmine.createSpy("WorkspaceCatalogue");
                Wirecloud.WorkspaceCatalogue.prototype.reload = jasmine.createSpy("reload").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace components", function (resolve) {resolve()});
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"id": 100, "owner": "wirecloud", "name": "home", "empty_params": []}'
                        });
                    });
                });

                var task = Wirecloud.loadWorkspace({id: 100});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (workspace) {
                    // Simulate a workspace name change
                    workspace.name = "newname";
                    expect(workspace.addEventListener).toHaveBeenCalledWith("change", jasmine.any(Function));
                    workspace.addEventListener.calls.argsFor(0)[1](workspace, ["name"], {name: "home"});
                    expect(Wirecloud.workspacesByUserAndName.wirecloud.home).toBe(undefined);
                    expect(Wirecloud.workspacesByUserAndName.wirecloud.newname).toBe(workspace);
                    done();
                });
            });

            it("handles general workspace updates", (done) => {
                Wirecloud.workspaceInstances = {};
                Wirecloud.WorkspaceCatalogue = jasmine.createSpy("WorkspaceCatalogue");
                Wirecloud.WorkspaceCatalogue.prototype.reload = jasmine.createSpy("reload").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace components", function (resolve) {resolve()});
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"id": 100, "owner": "wirecloud", "name": "home", "empty_params": []}'
                        });
                    });
                });

                var task = Wirecloud.loadWorkspace({id: 100});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (workspace) {
                    // Simulate a workspace change
                    expect(workspace.addEventListener).toHaveBeenCalledWith("change", jasmine.any(Function));
                    workspace.addEventListener.calls.argsFor(0)[1](workspace, ["description"], {description: ""});
                    expect(Wirecloud.workspacesByUserAndName.wirecloud.home).toBe(workspace);
                    done();
                });
            });

        });

        describe("mergeWorkspace(options)", () => {

            beforeEach(() => {
                var workspace = {
                    id: 1,
                    owner: "user",
                    name: "dashboard"
                };
                Wirecloud.workspaceInstances = {
                    1: workspace
                };
                Wirecloud.workspacesByUserAndName = {
                    user: {dashboard: workspace}
                };
            });

            it("throws a TypeError when not providing the target workspace parameter", () => {
                expect(() => {
                    Wirecloud.mergeWorkspace();
                }).toThrowError();
            });

            it("throws a TypeError when not providing any of the workspace/mashup options", () => {
                expect(() => {
                    Wirecloud.mergeWorkspace({id: 1}, {});
                }).toThrowError();
            });

            it("throws a TypeError when passing the target workspace's owner option without passing a name option", function () {
                expect(() => {
                    Wirecloud.mergeWorkspace({owner: "user"}, {});
                }).toThrowError();
            });

            it("throws a TypeError when passing the target workspace's name option without passing a owner option", function () {
                expect(() => {
                    Wirecloud.mergeWorkspace({name: "dashboard"}, {});
                }).toThrowError();
            });

            it("throws a TypeError when providing workspace and mashup options at the same time", () => {
                expect(() => {
                    Wirecloud.mergeWorkspace({id: 1}, {
                        mashup: "Wirecloud/TestMashup/1.0",
                        workspace: 5
                    });
                }).toThrowError();
            });

            it("allows merging two workspaces", (done) => {
                spyOn(Wirecloud.URLs.WORKSPACE_MERGE, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(Wirecloud.URLs.WORKSPACE_MERGE.evaluate).toHaveBeenCalledWith({
                        to_ws_id: 1
                    });
                    var data = JSON.parse(options.postBody);
                    expect(data.workspace).toBe(5);
                    expect(Object.keys(data)).not.toEqual(jasmine.arrayContaining(["mashup"]));
                    return new Wirecloud.Task("Merging workspace data", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.mergeWorkspace({id: 1}, {workspace: 5});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(workspace).not.toEqual(jasmine.any(Wirecloud.Workspace));
                    expect(workspace.url).toBe("https://wirecloud.example.com/user/dashboard");
                    expect(workspace.id).toBe(1);
                    done();
                });
            });

            it("allows merging two workspaces (refering target workspace using owner/name)", (done) => {
                spyOn(Wirecloud.URLs.WORKSPACE_MERGE, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(Wirecloud.URLs.WORKSPACE_MERGE.evaluate).toHaveBeenCalledWith({
                        to_ws_id: 1
                    });
                    var data = JSON.parse(options.postBody);
                    expect(data.workspace).toBe(5);
                    expect(Object.keys(data)).not.toEqual(jasmine.arrayContaining(["mashup"]));
                    return new Wirecloud.Task("Merging workspace data", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.mergeWorkspace({owner: "user", name: "dashboard"}, {workspace: 5});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(workspace).not.toEqual(jasmine.any(Wirecloud.Workspace));
                    expect(workspace.url).toBe("https://wirecloud.example.com/user/dashboard");
                    expect(workspace.id).toBe(1);
                    done();
                });
            });

            it("allows merging mashups into workspaces", (done) => {
                spyOn(Wirecloud.URLs.WORKSPACE_MERGE, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(Wirecloud.URLs.WORKSPACE_MERGE.evaluate).toHaveBeenCalledWith({
                        to_ws_id: 1
                    });
                    var data = JSON.parse(options.postBody);
                    expect(data.mashup).toBe("Wirecloud/TestMashup/1.0");
                    expect(Object.keys(data)).not.toEqual(jasmine.arrayContaining(["workspace"]));
                    return new Wirecloud.Task("Merging workspace data", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.mergeWorkspace({id: 1}, {mashup: "Wirecloud/TestMashup/1.0"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((workspace) => {
                    expect(workspace).not.toEqual(jasmine.any(Wirecloud.Workspace));
                    expect(workspace.url).toBe("https://wirecloud.example.com/user/dashboard");
                    expect(workspace.id).toBe(1);
                    done();
                });
            });

            describe("calls reject on unexepected responses", () => {

                var test = (status) => {
                    return (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        var task = Wirecloud.mergeWorkspace({id: 1}, {workspace: 5});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("200", test(200));
                it("201", test(201));
                it("409", test(409));
                it("422 (with invalid body)", test(422));

            });

            describe("calls reject on error responses", () => {

                var test = (status, details) => {
                    return (done) => {
                        var description = "detailed error description";
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({
                                        description: description,
                                        details: details
                                    })
                                });
                            });
                        });

                        var task = Wirecloud.mergeWorkspace({id: 1}, {workspace: 5});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            if (details == null) {
                                expect(error).toBe(description);
                            } else {
                                expect(error).toEqual({
                                    description: description,
                                    details: details
                                });
                            }

                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("404", test(404));
                it("500", test(500));
                it("422", test(422, {missingDependencies: {}}));

            });

        });

        describe("removeWorkspace(options)", () => {

            it("throws an Error when not providing any of the owner, name or id options", () => {
                expect(() => {
                    Wirecloud.removeWorkspace();
                }).toThrowError();
            });

            it("throws a TypeError when passing the owner option without passing a name option", function () {
                expect(() => {
                    Wirecloud.removeWorkspace({
                        owner: "user"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError when passing the name option without passing a owner option", function () {
                expect(() => {
                    Wirecloud.removeWorkspace({
                        name: "MyWorkspace"
                    });
                }).toThrowError(TypeError);
            });

            it("remove workspaces by owner/name", function (done) {
                var workspace = {
                    id: 1,
                    owner: "wirecloud",
                    name: "home",
                    title: "Home"
                };
                Wirecloud.workspaceInstances = {
                    1: workspace
                };
                Wirecloud.workspacesByUserAndName = {
                    wirecloud: {home: workspace}
                };
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY.evaluate).toHaveBeenCalledWith({
                        workspace_id: 1
                    });
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.removeWorkspace({owner: "wirecloud", name: "home", title: "Home"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function () {
                    expect(Wirecloud.workspaceInstances).toEqual({});
                    expect(Wirecloud.workspacesByUserAndName).toEqual({"wirecloud": {}});
                    done();
                });
            });

            it("remove workspaces by id", function (done) {
                var workspace = {
                    id: 100,
                    owner: "wirecloud",
                    name: "home",
                    title: "Home"
                };
                Wirecloud.workspaceInstances = {
                    100: workspace
                };
                Wirecloud.workspacesByUserAndName = {
                    wirecloud: {home: workspace}
                };
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url) => {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY.evaluate).toHaveBeenCalledWith({
                        workspace_id: 100
                    });
                    return new Wirecloud.Task("Requesting workspace data", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.removeWorkspace({id: 100});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function () {
                    expect(Wirecloud.workspaceInstances).toEqual({});
                    expect(Wirecloud.workspacesByUserAndName).toEqual({"wirecloud": {}});
                    done();
                });
            });

            it("remove workspaces by id (not tracked)", function (done) {
                var workspace = {
                    id: 100,
                    owner: "wirecloud",
                    name: "home",
                    title: "Home"
                };
                Wirecloud.workspaceInstances = {
                    100: workspace
                };
                Wirecloud.workspacesByUserAndName = {
                    wirecloud: {home: workspace}
                };
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url) => {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY.evaluate).toHaveBeenCalledWith({
                        workspace_id: 2
                    });
                    return new Wirecloud.Task("Requesting workspace data", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                var task = Wirecloud.removeWorkspace({id: 2});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function () {
                    expect(Wirecloud.workspaceInstances).toEqual({100: workspace});
                    expect(Wirecloud.workspacesByUserAndName).toEqual({"wirecloud": {home: workspace}});
                    done();
                });
            });

            describe("calls reject on unexepected responses", () => {

                var test = (status) => {
                    return (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status
                                });
                            });
                        });

                        var task = Wirecloud.removeWorkspace({id: 100});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            done();
                        });
                    };
                };

                it("200", test(200));
                it("201", test(201));
                it("409", test(409));

            });

            describe("calls reject on error responses", () => {

                var test = (status) => {
                    return (done) => {
                        var description = "detailed error description";
                        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                            return new Wirecloud.Task("Sending request", (resolve) => {
                                resolve({
                                    status: status,
                                    responseText: JSON.stringify({description: description})
                                });
                            });
                        });

                        var task = Wirecloud.removeWorkspace({id: 100});

                        expect(task).toEqual(jasmine.any(Wirecloud.Task));
                        task.catch((error) => {
                            expect(error).toBe(description);
                            done();
                        });
                    };
                };

                it("401", test(401));
                it("403", test(403));
                it("404", test(404));
                it("500", test(500));

            });

        });

    });

})();
