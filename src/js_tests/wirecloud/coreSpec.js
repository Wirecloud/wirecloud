/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

            });

            describe("calls reject on error responses", () => {

                var test = (status) => {
                    return (done) => {
                        var description = "detailed error description";
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

                        var task = Wirecloud.createWorkspace({name: "Test"});

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
                spyOn(Wirecloud.URLs.WORKSPACE_ENTRY, "evaluate");
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    expect(Wirecloud.URLs.WORKSPACE_ENTRY.evaluate).toHaveBeenCalledWith({
                        workspace_id: 1
                    });
                    return new Wirecloud.Task("Requesting workspace data", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"empty_params": []}'
                        });
                    });
                });

                var task = Wirecloud.loadWorkspace({owner: "wirecloud", name: "home"});

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then(function (workspace) {
                    expect(workspace).toEqual(jasmine.any(Wirecloud.Workspace));
                    // TODO internal aspect
                    expect(task.subtasks).toEqual([jasmine.any(Wirecloud.Task), jasmine.any(Wirecloud.Task), jasmine.any(Wirecloud.Task)]);
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
                            responseText: '{"empty_params": []}'
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
                    name: "home"
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

                var task = Wirecloud.removeWorkspace({owner: "wirecloud", name: "home"});

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
                    name: "home"
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
                    name: "home"
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
