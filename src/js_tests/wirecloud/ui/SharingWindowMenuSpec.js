/*
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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


(function () {

    "use strict";

    describe("Wirecloud.ui.SharingWindowMenu", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.ui.UserTypeahead = jasmine.createSpy("UserTypeahead").and.callFake(function () {
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

            it("load sharing configuration from workspaces", () => {
                let workspace = {
                    model: {
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
                workspace.model.preferences.get.and.returnValue(true);

                let dialog = new Wirecloud.ui.SharingWindowMenu(workspace);

                expect(dialog.visibilityOptions.getValue()).toBe("public");
                expect(Object.keys(dialog.sharingUsers).length).toBe(3);
            });

        });

        describe("inputSearchTypeahead", () => {

            var dialog;

            beforeEach(() => {
                let workspace = {
                    model: {
                        users: [
                            {
                                username: "currentuser",
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
                        username: "otheruser",
                        organization: false,
                        accesslevel: "read"
                    }
                });
                expect(Object.keys(dialog.sharingUsers).length).toBe(2);
            });

            it("should add new organizations", () => {
                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        username: "org",
                        organization: true,
                        accesslevel: "read"
                    }
                });
                expect(Object.keys(dialog.sharingUsers).length).toBe(2);
            });

            it("should ignore already present users", () => {
                let initialSharingUsers = dialog.sharingUsers;

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        username: "currentuser",
                        organization: true,
                        accesslevel: "read"
                    }
                });

                expect(dialog.sharingUsers).toEqual(initialSharingUsers);
            });

            it("should be possible to remove added users", () => {
                var button;
                spyOn(StyledElements, "Button").and.callFake(function () {
                    button = this;
                    this.addEventListener = jasmine.createSpy("addEventListener");
                });

                callEventListener(dialog.inputSearchTypeahead, "select", {
                    context: {
                        username: "otheruser",
                        organization: false,
                        accesslevel: "read"
                    }
                });
                expect(Object.keys(dialog.sharingUsers).length).toBe(2);

                callEventListener(button, "click");

                expect(Object.keys(dialog.sharingUsers).length).toBe(1);
            });

        });

        describe("btnAccept", () => {

            var dialog, workspace;

            beforeEach(() => {
                workspace = {
                    model: {
                        users: [
                            {
                                username: "currentuser",
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

    var callEventListener = function callEventListener(instance, event) {
        var largs = Array.prototype.slice.call(arguments, 2);
        largs.unshift(instance);
        instance.addEventListener.calls.allArgs().some(function (args) {
            if (args[0] === event) {
                args[1].apply(instance, largs);
                return true;
            }
        });
    };

})();
