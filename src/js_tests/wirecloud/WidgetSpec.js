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

    var WORKSPACE_TAB = {
        workspace: {
            isAllowed: jasmine.createSpy('isAllowed').and.callFake(() => {
                return true;
            }),
            restricted: false,
            view: {}
        },
        addEventListener: jasmine.createSpy('addEventListener')
    };
    Object.freeze(WORKSPACE_TAB);

    var LOCKED_WORKSPACE_TAB = {
        workspace: {
            isAllowed: jasmine.createSpy('isAllowed').and.callFake(() => {
                return false;
            }),
            restricted: true,
            view: {}
        },
        addEventListener: jasmine.createSpy('addEventListener')
    };
    Object.freeze(WORKSPACE_TAB);

    var EMPTY_WIDGET_META = {
        title: "My Widget",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: false,
        requirements: [],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html"
    };
    Object.freeze(EMPTY_WIDGET_META);

    var PREF = new Wirecloud.UserPrefDef({name: "pref", type: "text", default: "other"});
    var PROP = new Wirecloud.PersistentVariableDef({name: "prop", type: "text"});
    var WIDGET_META = {
        uri: "Vendor/Widget/1.0",
        title: "My Widget",
        inputList: [
            {name: "input", label: "input", friendcode: ""}
        ],
        missing: false,
        requirements: [],
        outputList: [
            {name: "output", label: "output", friendcode: ""}
        ],
        preferences: {
            "pref": PREF
        },
        preferenceList: [
            PREF
        ],
        properties: {
            "prop": PROP
        },
        propertyList: [
            PROP
        ],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html"
    };
    Object.freeze(WIDGET_META);


    // endsWith polyfill
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }



    describe("Wirecloud.Widget", function () {

        beforeEach(() => {
            Wirecloud.PropertyCommiter = jasmine.createSpy("PropertyCommiter");
        });

        describe("new Widget(tab, meta, data)", () => {

            it("throws a TypeError exception if tab is not a WorkspaceTab instance", () => {
                expect(() => {
                    new Wirecloud.Widget();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception if meta is not a MashableApplicationComponent instance", () => {
                expect(() => {
                    new Wirecloud.Widget(WORKSPACE_TAB);
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception if data is not an object", () => {
                expect(() => {
                    new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META);
                }).toThrowError(TypeError);
            });

            it("allows to instantiate widgets using minimal data", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                expect(widget.id).toBe("1");
                expect(widget.loaded).toBe(false);
                expect(widget.missing).toBe(false);
                expect(widget.title).toBe(EMPTY_WIDGET_META.title);
                expect(widget.volatile).toBe(false);
                expect(new URL(widget.codeurl)).toEqual(jasmine.any(URL));
            });

            it("allow to instantiate widgets from partial persistence", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "2",
                    title: "title",
                    preferences: {},
                    propeties: {}
                });

                expect(widget.id).toBe("2");
                expect(widget.loaded).toBe(false);
                expect(widget.missing).toBe(false);
                expect(widget.title).toBe("title");
                expect(widget.volatile).toBe(false);
                expect(new URL(widget.codeurl)).toEqual(jasmine.any(URL));

                expect(Object.keys(widget.preferences)).toEqual(["pref"]);
                expect(widget.preferences.pref).toEqual(jasmine.any(Wirecloud.UserPref));
                expect(widget.preferences.pref.readonly).toBe(false);
                expect(widget.preferences.pref.hidden).toBe(false);
                expect(widget.preferences.pref.value).toEqual("other");
                expect(widget.preferenceList).toEqual([widget.preferences.pref]);
            });

            it("allow to instantiate widgets from persistence", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "2",
                    title: "title",
                    preferences: {
                        "pref": {
                            readonly: false,
                            hidden: false,
                            value: "value"
                        }
                    },
                    properties: {
                        "prop": {
                            readonly: false,
                            value: "data"
                        }
                    }
                });

                expect(widget.id).toBe("2");
                expect(widget.loaded).toBe(false);
                expect(widget.missing).toBe(false);
                expect(widget.title).toBe("title");
                expect(widget.volatile).toBe(false);
                expect(new URL(widget.codeurl)).toEqual(jasmine.any(URL));

                expect(Object.keys(widget.preferences)).toEqual(["pref"]);
                expect(widget.preferences.pref).toEqual(jasmine.any(Wirecloud.UserPref));
                expect(widget.preferences.pref.value).toEqual("value");

                expect(Object.keys(widget.properties)).toEqual(["prop"]);
                expect(widget.properties.prop).toEqual(jasmine.any(Wirecloud.PersistentVariable));
                expect(widget.properties.prop.value).toEqual("data");
            });

            it("allow to instantiate volatile widgets", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    volatile: true
                });

                expect(widget.id).toBe("1/1");
                expect(widget.loaded).toBe(false);
                expect(widget.missing).toBe(false);
                expect(widget.title).toBe(EMPTY_WIDGET_META.title);
                expect(widget.volatile).toBe(true);
                expect(new URL(widget.codeurl)).toEqual(jasmine.any(URL));
            });

        });

        describe("changeTab(tab)", () => {

            it("do nothing when moving to the same tab", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest");

                var p = widget.changeTab(widget.tab);
                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                });

            });

            it("save tab change into the server", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var p = widget.changeTab({
                    id: 5
                });
                p.then(() => {
                    done();
                });

            });

            it("handle error saving tab change into the server", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                var p = widget.changeTab({
                    id: 5
                });
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

        });

        describe("fullDisconnect()", () => {

            it("is a shortcut for calling fullDisconnect on every endpoint", () => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });

                spyOn(widget.inputs.input, "fullDisconnect");
                spyOn(widget.outputs.output, "fullDisconnect");

                widget.fullDisconnect();

                expect(widget.inputs.input.fullDisconnect.calls.count()).toBe(1);
                expect(widget.inputs.input.fullDisconnect).toHaveBeenCalledWith();
                expect(widget.outputs.output.fullDisconnect.calls.count()).toBe(1);
                expect(widget.outputs.output.fullDisconnect).toHaveBeenCalledWith();
            });
        });

        describe("hasEndpoints()", () => {

            it("is a shortcut", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                expect(widget.hasEndpoints()).toBe(false);
                expect(widget.meta.hasEndpoints).toHaveBeenCalled();
            });

        });

        describe("hasPreferences()", () => {

            it("is a shortcut", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                expect(widget.hasPreferences()).toBe(false);
                expect(widget.meta.hasPreferences).toHaveBeenCalled();
            });

        });

        describe("is(component)", () => {

            it("return true for the same component", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                expect(widget.is(widget)).toBe(true);
            });

            it("return false for the different widgets", () => {
                var widget1 = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });

                var widget2 = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "2"
                });

                expect(widget1.is(widget2)).toBe(false);
            });

        });

        describe("isAllowed(name)", () => {

            describe("close", () => {

                it("normal widget on unlocked workspace", () => {
                    var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            close: true
                        }
                    });
                    expect(widget.isAllowed("close")).toBe(true);
                });

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            close: true
                        }
                    });
                    expect(widget.isAllowed("close")).toBe(false);
                });

                it("normal widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            // This should contain a false value as this user is
                            // not able to edit shared dashboards
                            // Anyway, this should no affect the result
                            close: true
                        }
                    });
                    expect(widget.isAllowed("close")).toBe(false);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(widget.isAllowed("close")).toBe(true);
                });

            });

            describe("move", () => {

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                    expect(widget.isAllowed("move")).toBe(false);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(widget.isAllowed("move")).toBe(true);
                });

            });

            describe("rename", () => {

                it("normal widget on unlocked workspace", () => {
                    var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            rename: true
                        }
                    });
                    expect(widget.isAllowed("rename")).toBe(true);
                });

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            rename: true
                        }
                    });
                    expect(widget.isAllowed("rename")).toBe(false);
                });

                it("normal widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            // This should contain a false value as this user is
                            // not able to edit shared dashboards
                            // Anyway, this should no affect the result
                            close: true
                        }
                    });
                    expect(widget.isAllowed("rename")).toBe(false);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(widget.isAllowed("rename")).toBe(true);
                });

            });

            describe("invalid permission name", () => {

                it("normal widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                    expect(() => {
                        widget.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(() => {
                        widget.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

            });

        });

        describe("remove()", () => {

            it("support removing volatile widgets", (done) => {
                var listener = jasmine.createSpy("listener");
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                widget.addEventListener("remove", listener);
                var p = widget.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("removes widget from persistence", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("DELETE");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var p = widget.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    done();
                });

            });

            it("handle unexpected responses when removing the widget from persistence", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("DELETE");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: 'content'
                        });
                    });
                });

                var p = widget.remove();
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

        });

        describe("rename(name)", () => {

            it("throws an exception when passing an invalid name", () => {
                var listener = jasmine.createSpy("listener");
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                widget.addEventListener("remove", listener);
                expect(() => {
                    widget.rename(" \t\n");
                }).toThrowError(TypeError);
                expect(listener).not.toHaveBeenCalled();
                expect(widget.title).toBe("old title");
            });

            it("support renaming volatile widgets", (done) => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                var p = widget.rename("new name");
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(widget.title).toBe("new name");
                    done();
                });
            });

            it("renames widget on the server", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                var p = widget.rename("new name");
                p.then(
                    (value) => {
                        expect(value).toBe(value);
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("handle unexpected responses when removing the widget from persistence", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201,
                            responseText: 'content'
                        });
                    });
                });

                var p = widget.rename("new name");
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

        });

        describe("upgrade(meta)", () => {
            var failOnPreferences = false;
            var failOnProperties = false;

            beforeEach(() => {
                failOnPreferences = false;
                failOnProperties = false;
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    url = url.toString();
                    if (url.endsWith("/preferences")) {
                        expect(options.method).toEqual("GET");
                        return new Wirecloud.Task("Sending request", function (resolve) {
                            if (typeof failOnPreferences === "string") {
                                resolve({
                                    status: 200,
                                    responseText: 'invalid'
                                });
                            } else if (failOnPreferences) {
                                resolve({
                                    status: 404
                                });
                            } else {
                                resolve({
                                    status: 200,
                                    responseText: '{"npref": {"readonly": false, "hidden": false, "value": "upgraded value"}}'
                                });
                            }
                        });
                    } else if (url.endsWith("/properties")) {
                        expect(options.method).toEqual("GET");
                        return new Wirecloud.Task("Sending request", function (resolve) {
                            if (typeof failOnProperties === "string") {
                                resolve({
                                    status: 200,
                                    responseText: 'invalid'
                                });
                            } else if (failOnProperties) {
                                resolve({
                                    status: 404
                                });
                            } else {
                                resolve({
                                    status: 200,
                                    responseText: '{}'
                                });
                            }
                        });
                    } else {
                        expect(options.method).toEqual("POST");
                        return new Wirecloud.Task("Sending request", function (resolve) {
                            resolve({
                                status: 204
                            });
                        });
                    }
                });

                Wirecloud.WidgetMeta = jasmine.createSpy("WidgetMeta").and.callFake(function (missing) {
                    this.uri = "Vendor/Widget/1.0";
                    this.version = {
                        compareTo: jasmine.createSpy('compareTo')
                    }

                    if (missing === true) {
                        this.preferenceList = [];
                        this.preferences = {};
                        this.missing = true;
                    } else {
                        var PREF = new Wirecloud.UserPrefDef({
                            name: "npref",
                            type: "text",
                            default: "other"
                        });
                        this.preferenceList = [PREF];
                        this.preferences = {"npref": PREF};
                        this.missing = false;
                    }
                    this.propertyList = [];
                    this.properties = {};

                    this.inputList = [];
                    this.outputList = [];
                });
            });

            it("throws an exception when passing an invalid meta", () => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(() => {
                    widget.upgrade(null);
                }).toThrowError(TypeError);

            });

            it("save widget meta changes into the server (upgrade)", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(1);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(widget.meta).toBe(new_meta);
                        expect(widget.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(widget.preferences.npref.value).toBe("upgraded value");
                        expect(widget.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("save widget meta changes into the server (downgrade)", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(-1);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(widget.meta).toBe(new_meta);
                        expect(widget.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(widget.preferences.npref.value).toBe("upgraded value");
                        expect(widget.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("save widget meta changes into the server (replace)", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(widget.meta).toBe(new_meta);
                        expect(widget.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(widget.preferences.npref.value).toBe("upgraded value");
                        expect(widget.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("allows switching to missing state", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });

                // Preferences and properties are not requested in this case
                failOnPreferences = true;
                failOnProperties = true;

                var MISSING_WIDGET_META = new Wirecloud.WidgetMeta(true);
                var p = widget.upgrade(MISSING_WIDGET_META);
                p.then(
                    (value) => {
                        expect(widget.meta).toBe(MISSING_WIDGET_META);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("handle error saving meta change into the server", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                Wirecloud.io.makeRequest.and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                Wirecloud.WidgetMeta = jasmine.createSpy("WidgetMeta").and.callFake(function () {
                    this.uri = "";
                });

                var p = widget.upgrade(new Wirecloud.WidgetMeta());
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle unexpected responses while requesting new preferences", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnPreferences = true;

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle unexpected responses bodies while requesting new preferences", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnPreferences = "invalid";

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle unexpected responses while requesting new properties", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnProperties = true;

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle unexpected responses bodies while requesting new properties", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnProperties = "invalid";

                var new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                var p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

        });

    });

})();
