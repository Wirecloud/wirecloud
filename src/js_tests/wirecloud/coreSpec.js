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

    });

})();
