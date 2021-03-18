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


(function (utils) {

    "use strict";

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

    describe("Wirecloud.ui.SharingWindowMenu", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.ui.UserGroupTypeahead = jasmine.createSpy("UserGroupTypeahead").and.callFake(function () {
                this.bind = jasmine.createSpy("bind");
                this.addEventListener = jasmine.createSpy("addEventListener");
            });
            Wirecloud.contextManager = {
                "get": jasmine.createSpy("get").and.callFake((name) => {
                    switch (name) {
                    case "username":
                        return "currentuser";
                    };
                })
            };
        });

        afterAll(() => {
            // TODO
            Wirecloud.contextManager = null;
        });

        describe("new SharingWindowMenu(workspace)", () => {

            it("requires the workspace parameter", () => {
                expect(() => {
                    new Wirecloud.ui.SharingWindowMenu();
                }).toThrowError(TypeError);
            });

            it("load sharing configuration from workspaces (public)", () => {
                const workspace = {
                    model: {
                        groups: [],
                        users: [
                            {
                                username: "currentuser",
                                organization: false,
                                accesslevel: "owner"
                            },
                            {
                                username: "otheruser",
                                organization: false,
                                accesslevel: "read"
                            },
                            {
                                username: "org",
                                organization: true,
                                accesslevel: "read"
                            }
                        ],
                        preferences: {
                            get: jasmine.createSpy("get")
                        }
                    }
                };
                workspace.model.preferences.get.and.callFake((pref) => {
                    return pref === "public";
                });

                const dialog = new Wirecloud.ui.SharingWindowMenu(workspace);

                expect(dialog.visibilityOptions.getValue()).toBe("public");
                expect(dialog.sharelist.length).toBe(3);
            });

            it("load sharing configuration from workspaces (public-auth)", () => {
                const workspace = {
                    model: {
                        groups: [
                            {
                                name: "group",
                                accesslevel: "read"
                            }
                        ],
                        users: [
                            {
                                username: "currentuser",
                                organization: false,
                                accesslevel: "owner"
                            },
                            {
                                username: "org",
                                organization: true,
                                accesslevel: "read"
                            }
                        ],
                        preferences: {
                            get: jasmine.createSpy("get")
                        }
                    }
                };
                workspace.model.preferences.get.and.returnValue(true);

                const dialog = new Wirecloud.ui.SharingWindowMenu(workspace);

                expect(dialog.visibilityOptions.getValue()).toBe("public-auth");
                expect(dialog.sharelist.length).toBe(3);
            });

        });

        describe("inputSearchTypeahead", () => {

            let dialog;

            beforeEach(() => {
                const workspace = {
                    model: {
                        groups: [
                            {
                                name: "currentgroup",
                                accesslevel: "owner"
                            }
                        ],
                        users: [
                            {
                                username: "currentuser",
                                fullname: "Current User",
                                organization: false,
                                accesslevel: "owner"
                            }
                        ],
                        preferences: {
                            get: jasmine.createSpy("get")
                        }
                    }
                };

                dialog = new Wirecloud.ui.SharingWindowMenu(workspace);
            });

            it("should add new users", () => {
                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "otheruser",
                        type: "user",
                        accesslevel: "read"
                    }
                });
                expect(dialog.sharelist.length).toBe(3);
            });

            it("should add new organizations", () => {
                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "org",
                        type: "organization",
                        accesslevel: "read"
                    }
                });
                expect(dialog.sharelist.length).toBe(3);
            });

            it("should add new groups", () => {
                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "onegroup",
                        type: "group",
                        accesslevel: "read"
                    }
                });
                expect(dialog.sharelist.length).toBe(3);
            });

            it("should ignore already present users", () => {
                const initialShareList = utils.clone(dialog.sharelist);

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "currentuser",
                        fullname: "Updated fullname",
                        type: "user",
                        accesslevel: "read"
                    }
                });

                expect(dialog.sharelist).toEqual(initialShareList);
            });

            it("should ignore already present groups", () => {
                const initialShareList = utils.clone(dialog.sharelist);

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "currentgroup",
                        type: "group",
                        accesslevel: "read"
                    }
                });

                expect(dialog.sharelist).toEqual(initialShareList);
            });

            it("should be possible to remove added users", () => {
                let button;
                spyOn(StyledElements, "Button").and.callFake(function () {
                    button = this;
                    this.addEventListener = jasmine.createSpy("addEventListener");
                });

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "otheruser",
                        type: "user",
                        accesslevel: "read"
                    }
                });
                expect(dialog.sharelist.length).toBe(3);

                callEventListener(button, "click");

                expect(dialog.sharelist.length).toBe(2);
            });

            it("should be possible to remove added groups", () => {
                let button;
                spyOn(StyledElements, "Button").and.callFake(function () {
                    button = this;
                    this.addEventListener = jasmine.createSpy("addEventListener");
                });

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        name: "otheruser",
                        type: "group",
                        accesslevel: "read"
                    }
                });
                expect(dialog.sharelist.length).toBe(3);

                callEventListener(button, "click");

                expect(dialog.sharelist.length).toBe(2);
            });

        });

        describe("btnAccept", () => {

            let dialog, workspace;

            beforeEach(() => {
                workspace = {
                    model: {
                        groups: [
                            {
                                name: "group",
                                accesslevel: "read"
                            }
                        ],
                        users: [
                            {
                                username: "currentuser",
                                type: "user",
                                organization: false,
                                accesslevel: "owner"
                            }
                        ],
                        preferences: {
                            get: jasmine.createSpy("get"),
                            set: jasmine.createSpy("set")
                        }
                    }
                };

                dialog = new Wirecloud.ui.SharingWindowMenu(workspace);
            });

            it("should save changes on server", (done) => {
                workspace.model.preferences.set.and.returnValue(Promise.resolve());
                spyOn(dialog, "_closeListener");

                dialog.btnAccept.click();
                expect(dialog.btnAccept.enabled).toBe(false);
                expect(dialog.btnCancel.enabled).toBe(false);

                setTimeout(() => {
                    expect(workspace.model.preferences.set).toHaveBeenCalled();
                    expect(dialog._closeListener).toHaveBeenCalledWith();
                    done();
                });
            });

            it("should handle errors saving changes on server", (done) => {
                workspace.model.preferences.set.and.returnValue(Promise.reject("error"));
                spyOn(dialog, "_closeListener");

                dialog.btnAccept.click();
                expect(dialog.btnAccept.enabled).toBe(false);
                expect(dialog.btnCancel.enabled).toBe(false);

                setTimeout(() => {
                    expect(dialog._closeListener).not.toHaveBeenCalled();
                    expect(dialog.btnAccept.enabled).toBe(true);
                    expect(dialog.btnCancel.enabled).toBe(true);
                    done();
                });
            });
        });

    });

})(StyledElements.Utils);
