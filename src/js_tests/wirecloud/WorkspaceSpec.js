/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var create_empty_workspace = function create_empty_workspace(options) {
        options = Wirecloud.Utils.merge({
            owner: "user",
            name: "empty"
        }, options);

        return new Wirecloud.Workspace({
            id: 1,
            owner: options.owner,
            name: options.name,
            removable: options.owner === "user",
            description: "",
            longdescription: "",
            tabs: []
        });
    };

    describe("Workspace", () => {

        beforeEach(() => {
            Wirecloud.contextManager = {
                get: jasmine.createSpy("get").and.callFake((key) => {
                    var context = {
                        "username": "user",
                        "mode": "classic"
                    };
                    return context[key];
                })
            };
            Wirecloud.PreferenceManager = {
                buildPreferences: jasmine.createSpy('buildPreferences').and.callFake(() => {
                    return {
                        addEventListener: jasmine.createSpy("addEventListener")
                    };
                })
            };
            Wirecloud.constants.WORKSPACE_CONTEXT = {
                "name": {
                    "description": "Current name of the workspace",
                    "label": "Name"
                },
                "owner": {
                    "description": "Workspace's owner username",
                    "label": "Owner"
                },
                "description": {
                    "description": "Workspace's short description",
                    "label": "Description"
                },
                "longdescription": {
                    "description": "Workspace's long description",
                    "label": "Long Description"
                }
            };
        });

        describe("new Workspace(data, components)", () => {

            it("throws a TypeError exception when no passing arguments", () => {
                expect(() => {
                    new Wirecloud.Workspace();
                }).toThrowError(TypeError);
            });

            it("parses empty workspaces", () => {
                var workspace = create_empty_workspace();

                expect(workspace.owner).toBe("user");
                expect(workspace.name).toBe("empty");
                expect(workspace.description).toBe("");
                expect(workspace.longdescription).toBe("");
                expect(workspace.tabs).toEqual([]);
                expect(workspace.tabsById).toEqual({});
                expect(workspace.initialtab).toBe(null);
                expect(workspace.widgets).toEqual([]);
                expect(workspace.widgetsById).toEqual({});
                expect(workspace.url).toBe("https://wirecloud.example.com/user/empty");
                expect(workspace.operators).toEqual([]);
                expect(workspace.operatorsById).toEqual({});
                expect(workspace.wiring).toEqual(jasmine.any(Wirecloud.Wiring));
            });

        });

        describe("createTab([options])", () => {

            var workspace;

            beforeEach(() => {
                workspace = create_empty_workspace();

                Wirecloud.WorkspaceTab = jasmine.createSpy("WorkspaceTab").and.callFake(function (workspace, data) {
                    this.createWidget = jasmine.createSpy("createWidget");
                    this.addEventListener = jasmine.createSpy("addEventListener");
                });

                spyOn(Wirecloud.io, "makeRequest").and.callFake(function () {
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: JSON.stringify({
                                "id": 123,
                                "name": "MyTab",
                            })
                        });
                    });
                });
            });

            it("creates tabs on empty workspaces", (done) => {
                workspace = create_empty_workspace();

                var task = workspace.createTab();

                expect(task).toEqual(jasmine.any(Wirecloud.Task));
                task.then((tab) => {
                    expect(tab).toEqual(jasmine.any(Wirecloud.WorkspaceTab));
                    expect(workspace.tabs).toEqual([tab]);
                    done();
                });
            });

        });

        describe("isAllowed(action)", () => {

            beforeEach(() => {
                Wirecloud.PolicyManager = {
                    evaluate: jasmine.createSpy("evaluate").and.returnValue(true)
                };
            });

            var test = (action, expected_value, options) => {
                it(action, () => {
                    var workspace = create_empty_workspace(options);
                    expect(workspace.isAllowed(action)).toBe(expected_value);
                });
            }

            describe("owned workspaces", () => {
                test("remove", true);
                test("merge_workspaces", true);
                test("update_preferences", true);
                test("rename", true);
                test("edit", true);
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
                var workspace = create_empty_workspace();
                var options = {workspace: 5};

                workspace.merge(options);

                expect(Wirecloud.mergeWorkspace).toHaveBeenCalledWith(workspace, options);
            });

        });

        describe("rename(name)", () => {

            var workspace;

            beforeEach(() => {
                workspace = create_empty_workspace();
            });

            it("throws a TypeError exception when not passing the name parameter", () => {
                expect(() => {
                    workspace.rename();
                }).toThrowError(TypeError);
            });

        });
    });


})();
