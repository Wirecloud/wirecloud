/*
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

/* globals StyledElements, Wirecloud */

(function (ns, se) {

    "use strict";

    describe("NewWorkspaceWindowMenu", () => {

        beforeAll(() => {
            Wirecloud.ui.InputInterfaceFactory = new StyledElements.InputInterfaceFactory();
            Wirecloud.ui.InputInterfaceFactory.addFieldType("mac", StyledElements.TextInputInterface);

            Wirecloud.contextManager = {
                "get": jasmine.createSpy("get").and.callFake((name) => {
                    switch (name) {
                        case "username":
                            return "currentuser";
                    };
                })
            };
        });

        beforeEach(() => {
            spyOn(Wirecloud.UserInterfaceManager, "monitorTask");
            spyOn(Wirecloud, "createWorkspace");
            spyOn(Wirecloud, "changeActiveWorkspace");
            Wirecloud.ui.MissingDependenciesWindowMenu = jasmine.createSpy("MissingDependenciesWindowMenu");
            Wirecloud.ui.MessageWindowMenu = jasmine.createSpy("MessageWindowMenu");
        });

        afterAll(() => {
            delete Wirecloud.ui.InputInterfaceFactory;
            delete Wirecloud.contextManager;
            delete Wirecloud.ui.MissingDependenciesWindowMenu;
            delete Wirecloud.ui.MessageWindowMenu;
        });

        describe("new Wirecloud.ui.NewWorkspaceWindowMenu(options)", () => {

            it("should work without providing any option", () => {
                const dialog = new ns.NewWorkspaceWindowMenu();

                expect(dialog.form.fields.workspace).toBe(undefined);
                expect(dialog.form.fields.mashup).not.toBe(undefined);
                expect(dialog.form.fields.title).not.toBe(undefined);
            });

            it("should allow to pass an initial title by using the title option", () => {
                const dialog = new ns.NewWorkspaceWindowMenu({"title": "New workspace"});

                expect(dialog.form.fields.workspace).toBe(undefined);
                expect(dialog.form.fields.mashup).not.toBe(undefined);
                expect(dialog.form.fields.title.initialValue).toBe("New workspace");
            });

            it("should allow to duplicate workspaces by using the workspace option", () => {
                const dialog = new ns.NewWorkspaceWindowMenu({"workspace": "4"});

                expect(dialog.form.fields.mashup).toBe(undefined);
                expect(dialog.form.fields.workspace.initialValue).toBe("4");
            });

        });

        describe("executeOperation(data)", () => {

            it("should work when the title is empty", () => {
                const dialog = new ns.NewWorkspaceWindowMenu();
                const workspace = {};
                Wirecloud.createWorkspace.and.returnValue(
                    new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});})
                );

                dialog.executeOperation({
                    title: "",
                    mashup: null
                });
            });

            it("should work when a title is provided", () => {
                const dialog = new ns.NewWorkspaceWindowMenu();
                const workspace = {};
                Wirecloud.createWorkspace.and.returnValue(
                    new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});})
                );

                dialog.executeOperation({
                    title: "New Workspace",
                    mashup: null
                });
            });

            it("should manage generic errors", () => {
                const dialog = new ns.NewWorkspaceWindowMenu();
                const workspace = {};
                Wirecloud.createWorkspace.and.returnValue(
                    new Wirecloud.Task("Sending request", (resolve, reject) => {reject({});})
                );

                dialog.executeOperation({
                    title: "New Workspace",
                    mashup: null
                });
            });

            it("should manage missingDependencies error", () => {
                const dialog = new ns.NewWorkspaceWindowMenu();
                const workspace = {};
                Wirecloud.createWorkspace.and.returnValue(
                    new Wirecloud.Task("Sending request", (resolve, reject) => {reject({details: {missingDependencies: []}});})
                );

                dialog.executeOperation({
                    title: "My Marketplace",
                    mashup: "CoNWeT/bae-marketplace/0.1.1"
                });

                expect(Wirecloud.ui.MessageWindowMenu).not.toHaveBeenCalled();
                expect(Wirecloud.ui.MissingDependenciesWindowMenu).toHaveBeenCalled();
            });

        });

    });

})(Wirecloud.ui, StyledElements);
