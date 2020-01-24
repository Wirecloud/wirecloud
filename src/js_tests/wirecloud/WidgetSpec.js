/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function () {

    "use strict";

    var WORKSPACE_TAB = {
        workspace: {
            contextManager: {
                addCallback: jasmine.createSpy('addCallback'),
                removeCallback: jasmine.createSpy('removeCallback')
            },
            isAllowed: jasmine.createSpy('isAllowed').and.callFake(() => {
                return true;
            }),
            restricted: false,
            view: {}
        },
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener')
    };
    Object.freeze(WORKSPACE_TAB);

    var WORKSPACEVIEW_TAB = {
        workspace: {
            contextManager: {
                addCallback: jasmine.createSpy('addCallback'),
                removeCallback: jasmine.createSpy('removeCallback')
            },
            restricted: false,
            view: {
                workspaceview: "id232"
            }
        },
        addEventListener: jasmine.createSpy('addEventListener'),
    };
    Object.freeze(WORKSPACEVIEW_TAB);

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

    var MISSING_WIDGET_META = {
        title: "My Widget",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: true,
        requirements: [],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html"
    };
    Object.freeze(EMPTY_WIDGET_META);

    var FULLSCREEN_WIDGET_META = {
        title: "My Widget",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: false,
        requirements: [{}, {type: "feature", name: "FullscreenWidget"}],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html"
    };
    Object.freeze(FULLSCREEN_WIDGET_META);

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


    describe("Wirecloud.Widget", function () {

        // TODO
        beforeEach(() => {
            Wirecloud.PropertyCommiter = jasmine.createSpy("PropertyCommiter").and.returnValue({
                commit: jasmine.createSpy('commit')
            });
            Wirecloud.ui.LogWindowMenu = jasmine.createSpy("LogWindowMenu").and.returnValue({
                htmlElement: {
                    classList: {
                        add: jasmine.createSpy("add")
                    }
                },
                show: jasmine.createSpy("show")
            });
            Wirecloud.Widget.PreferencesWindowMenu = jasmine.createSpy("PreferencesWindowMenu").and.returnValue({
                show: jasmine.createSpy("show")
            });
            Wirecloud.contextManager = {
                addCallback: jasmine.createSpy("addCallback"),
                removeCallback: jasmine.createSpy("removeCallback")
            };

        });

        afterEach(() => {
            if (Wirecloud.contextManager != null) {
                delete Wirecloud.contextManager;
            }
        });

        // TODO
        afterAll(() => {
            delete Wirecloud.PropertyCommiter;
            delete Wirecloud.ui.LogWindowMenu;
            delete Wirecloud.Widget.PreferencesWindowMenu;
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

            it("allow to instantiate fullscreen capable widgets", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, FULLSCREEN_WIDGET_META, {
                    id: "1"
                });

                expect(widget.wrapperElement.getAttribute("allowfullscreen")).toBe("true");
            });

            it("handles tab remove events", () => {
                WORKSPACE_TAB.addEventListener.calls.reset();
                let widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                let listener = jasmine.createSpy("listener");
                widget.addEventListener("remove", listener);

                WORKSPACE_TAB.addEventListener.calls.argsFor(0)[1](WORKSPACE_TAB);

                expect(listener).toHaveBeenCalled();
            });

            it("allow to instantiate widgets on workspaceviews", () => {
                let widget = new Wirecloud.Widget(WORKSPACEVIEW_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(widget.codeurl).toBe("https://wirecloud.example.com/widgets/MyWidget/index.html#id=1&workspaceview=id232");
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

        describe("load()", () => {

            it("loads unloaded widgets", () => {

                let widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;

                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };

                expect(widget.load()).toBe(widget);

                // Widget should now be in loading false
                expect(widget.loaded).toBe(false);
                expect(widget.wrapperElement.contentWindow.location.replace).toHaveBeenCalledWith(widget.codeurl);
                expect(widget.wrapperElement.setAttribute).toHaveBeenCalledWith("type", widget.codecontenttype);

                // Should ignore initial load events raised in between
                element.dispatchEvent(new Event("load"));
                expect(widget.wrapperElement.contentDocument.defaultView.addEventListener).not.toHaveBeenCalled();

                // Emulate final load event
                widget.wrapperElement.contentWindow.location.href = widget.codeurl;
                element.dispatchEvent(new Event("load"));

                // Now the widget should be fully loaded
                expect(widget.loaded).toBe(true);
                expect(widget.wrapperElement.contentDocument.defaultView.addEventListener).toHaveBeenCalled();
            });

            it("loads missing widgets", () => {
                let widget = new Wirecloud.Widget(WORKSPACE_TAB, MISSING_WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;

                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };

                expect(widget.load()).toBe(widget);

                // Emulate final load event
                widget.wrapperElement.contentWindow.location.href = widget.codeurl;
                element.dispatchEvent(new Event("load"));

                // Now the widget should be fully loaded
                expect(widget.loaded).toBe(true);
                expect(widget.wrapperElement.contentDocument.defaultView.addEventListener).toHaveBeenCalled();
            });

            it("sends pending events", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;
                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            href: widget.codeurl,
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                widget.pending_events.push({endpoint: "input", value: "hello world"});

                widget.load();
                element.dispatchEvent(new Event("load"));

                // Now the widget should be fully loaded
                expect(widget.loaded).toBe(true);
                expect(widget.wrapperElement.contentDocument.defaultView.addEventListener).toHaveBeenCalled();
                expect(widget.pending_events).toEqual([]);
            });

            it("does nothing for widgets in loading state", () => {

                let widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                widget.wrapperElement = {
                    contentWindow: {
                        location: {
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                expect(widget.load()).toBe(widget);
                widget.wrapperElement.contentWindow.location.replace.calls.reset();
                widget.wrapperElement.setAttribute.calls.reset();

                expect(widget.load()).toBe(widget);

                expect(widget.wrapperElement.contentWindow.location.replace).not.toHaveBeenCalled();
                expect(widget.wrapperElement.setAttribute).not.toHaveBeenCalled();
            });

            it("does nothing for loaded widgets", () => {

                let widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;
                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            href: widget.codeurl,
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                expect(widget.load()).toBe(widget);
                widget.wrapperElement.contentWindow.location.replace.calls.reset();
                widget.wrapperElement.setAttribute.calls.reset();
                element.dispatchEvent(new Event("load"));
                expect(widget.loaded).toBe(true);

                expect(widget.load()).toBe(widget);

                expect(widget.wrapperElement.contentWindow.location.replace).not.toHaveBeenCalled();
                expect(widget.wrapperElement.setAttribute).not.toHaveBeenCalled();
            });

            it("handles unload events", () => {

                let widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                let listener = jasmine.createSpy();
                widget.registerContextAPICallback("iwidget", listener);
                widget.registerContextAPICallback("mashup", listener);
                widget.registerContextAPICallback("platform", listener);
                let element = widget.wrapperElement;

                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };

                expect(widget.load()).toBe(widget);

                // Emulate final load event
                widget.wrapperElement.contentWindow.location.href = widget.codeurl;
                element.dispatchEvent(new Event("load"));

                // Now the widget should be fully loaded
                expect(widget.loaded).toBe(true);

                // Send unload event
                widget.wrapperElement.contentDocument.defaultView.addEventListener.calls.argsFor(0)[1]();

                expect(widget.callbacks.iwidget).toEqual([]);
                expect(widget.callbacks.mashup).toEqual([]);
                expect(widget.callbacks.platform).toEqual([]);
            });

            it("ignores unload events when unloaded", () => {

                let widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;

                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };

                expect(widget.load()).toBe(widget);

                // Emulate final load event
                widget.wrapperElement.contentWindow.location.href = widget.codeurl;
                element.dispatchEvent(new Event("load"));

                // Send unload event
                widget.wrapperElement.contentDocument.defaultView.addEventListener.calls.argsFor(0)[1]();

                // Now the widget should be fully unloaded
                expect(widget.loaded).toBe(false);

                // Send a second unload event
                widget.wrapperElement.contentDocument.defaultView.addEventListener.calls.argsFor(0)[1]();
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
                            editor: {
                                close: true
                            }
                        }
                    });
                    expect(widget.isAllowed("close", "editor")).toBe(true);
                });

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            editor: {
                                close: true
                            }
                        }
                    });
                    expect(widget.isAllowed("close", "editor")).toBe(false);
                });

                it("normal widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            // This should contain a false value as this user is
                            // not able to edit shared dashboards
                            // Anyway, this should no affect the result
                            viewer: {
                                close: true
                            }
                        }
                    });
                    expect(widget.isAllowed("close", "viewer")).toBe(false);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true,
                        permissions: {
                            viewer: {
                                close: true
                            }
                        }
                    });
                    expect(widget.isAllowed("close")).toBe(true);
                });

                it("readonly widget", () => {
                    var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            editor: {
                                close: true
                            }
                        },
                        readonly: true
                    });
                    expect(widget.isAllowed("close", "editor")).toBe(false);
                });

            });

            describe("move", () => {

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                    expect(widget.isAllowed("move", "editor")).toBe(false);
                });

                it("volatile widget on shared workspace (editor)", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true,
                        permissions: {
                            editor: {
                                move: true
                            }
                        }
                    });
                    expect(widget.isAllowed("move", "editor")).toBe(true);
                });

                it("volatile widget on shared workspace (viewer)", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true,
                        permissions: {
                            viewer: {
                                move: true
                            }
                        }
                    });
                    expect(widget.isAllowed("move", "viewer")).toBe(true);
                });

            });

            describe("rename", () => {

                it("normal widget on unlocked workspace", () => {
                    var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            editor: {
                                rename: true
                            }
                        }
                    });
                    expect(widget.isAllowed("rename", "editor")).toBe(true);
                });

                it("normal widget on locked workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            editor: {
                                rename: true
                            }
                        }
                    });
                    expect(widget.isAllowed("rename", "editor")).toBe(false);
                });

                it("normal widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1",
                        permissions: {
                            viewer: {
                                // This should contain a false value as this user is
                                // not able to edit shared dashboards
                                // Anyway, this should no affect the result
                                close: true
                            }
                        }
                    });
                    expect(widget.isAllowed("rename", "viewer")).toBe(false);
                });

                it("volatile widget on shared workspace", () => {
                    var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                        id: "1/1",
                        volatile: true,
                        permissions: {
                            viewer: {
                                rename: true
                            }
                        }
                    });
                    expect(widget.isAllowed("rename", "viewer")).toBe(true);
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

        describe("registerContextAPICallback(scope, callback)", () => {
            var widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
            });

            it("throws a TypeError exception when passing an invalid scope", () => {
                let listener = jasmine.createSpy();
                expect(() => {
                    widget.registerContextAPICallback("invalid", listener);
                }).toThrowError(TypeError);
            });

            it("support registering widget context callbacks", () => {
                let listener = jasmine.createSpy();
                widget.registerContextAPICallback("iwidget", listener);
            });

            it("support registering mashup context callbacks", () => {
                let listener = jasmine.createSpy();
                WORKSPACE_TAB.workspace.contextManager.addCallback.calls.reset();

                widget.registerContextAPICallback("mashup", listener);

                expect(WORKSPACE_TAB.workspace.contextManager.addCallback).toHaveBeenCalledWith(listener);
            });

            it("support registering platform context callbacks", () => {
                let listener = jasmine.createSpy();
                widget.registerContextAPICallback("platform", listener);
            });

        });

        describe("registerPrefCallback(callback)", () => {

            it("should register preference callbacks", () => {
                var listener = jasmine.createSpy("listener");
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
                expect(widget.registerPrefCallback(listener)).toBe(widget);
            });

        });

        describe("reload()", () => {

            it("should reload widget view", (done) => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
                let listener = jasmine.createSpy("listener");
                let element = widget.wrapperElement;
                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            href: widget.codeurl,
                            reload: jasmine.createSpy("reload").and.callFake(() => {
                                // call unload event
                                widget.wrapperElement.contentDocument.defaultView.addEventListener.calls.argsFor(0)[1]();
                            }),
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                widget.addEventListener("unload", listener);
                widget.addEventListener("load", () => {
                    setTimeout(() => {
                        expect(listener).not.toHaveBeenCalled();
                        expect(widget.reload()).toBe(widget);
                        expect(widget.wrapperElement.contentWindow.location.reload).toHaveBeenCalledWith();

                        setTimeout(() => {
                            expect(listener).toHaveBeenCalledTimes(1);
                            done();
                        }, 0);
                    }, 0);
                });
                widget.load();
                element.dispatchEvent(new Event("load"));
            });

        });

        describe("remove()", () => {

            it("supports removing volatile widgets", (done) => {
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

            it("supports removing loaded widgets", (done) => {
                let listener = jasmine.createSpy("listener");
                let widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });
                let element = widget.wrapperElement;
                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            href: widget.codeurl,
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                widget.load();
                element.dispatchEvent(new Event("load"));

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

        describe("setPosition(position)", () => {

            var widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title"
                });
            });

            it("should do nothing when passing an empty position", () => {
                let initial_position = widget.position;

                expect(widget.setPosition({})).toBe(widget);

                expect(widget.position).toEqual(initial_position);
            });

            it("should allow to modify all the position properties", () => {
                const new_position = {
                    x: 1,
                    y: 2,
                    z: 3
                };
                expect(widget.setPosition(new_position)).toBe(widget);

                expect(widget.position).toEqual(new_position);
            });

            it("should ignore extra properties", () => {
                const new_position = {
                    extra: 123,
                    x: 1,
                    y: 2,
                    z: 3
                };
                expect(widget.setPosition(new_position)).toBe(widget);

                expect(widget.position).toEqual({
                    x: 1,
                    y: 2,
                    z: 3
                });
            });

        });

        describe("setShape(shape)", () => {

            var widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title"
                });
            });

            it("should do nothing when passing an empty shape", () => {
                let initial_shape = widget.shape;

                expect(widget.setShape({})).toBe(widget);

                expect(widget.shape).toEqual(initial_shape);
            });

            it("should allow to modify all the shape properties", () => {
                const new_shape = {
                    width: 2,
                    height: 3
                };
                expect(widget.setShape(new_shape)).toBe(widget);

                expect(widget.shape).toEqual(new_shape);
            });

            it("should ignore extra properties", () => {
                const new_shape = {
                    extra: 123,
                    width: 2,
                    height: 3
                };
                expect(widget.setShape(new_shape)).toBe(widget);

                expect(widget.shape).toEqual({
                    width: 2,
                    height: 3
                });
            });

        });

        describe("setPermissions(permissions)", () => {

            it("applies changes immediatelly for volatile widgets", () => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true,
                    permissions: {
                        viewer: {
                            move: false
                        }
                    }
                });

                let t = widget.setPermissions({move: true});
                expect(t).toEqual(jasmine.any(Promise));
                expect(widget.permissions.viewer.move).toBe(true);
            });

            it("updates permissions on the server", (done) => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    permissions: {
                        viewer: {
                            move: false
                        }
                    }
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                let p = widget.setPermissions({move: true});
                p.then(
                    (value) => {
                        expect(widget.permissions.viewer.move).toBe(true);
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("handles unexpected responses", (done) => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200
                        });
                    });
                });

                let p = widget.setPermissions({move: true});
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

        describe("setTitleVisibility(visibility)", () => {

            it("throws a TypeError exception for volatile widgets", () => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                expect(() => {
                    widget.setTitleVisibility(true)
                }).toThrowError(TypeError);
            });

            it("updates titlevisible property on the server", (done) => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    titlevisible: false
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });
                expect(widget.titlevisible).toBe(false);

                let p = widget.setTitleVisibility(true);
                p.then(
                    (value) => {
                        expect(widget.titlevisible).toBe(true);
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("handles unexpected responses", (done) => {
                var widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200
                        });
                    });
                });

                let p = widget.setTitleVisibility(true);
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

        describe("showLogs()", () => {

            it("shows a log window menu", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                expect(widget.showLogs()).toBe(widget);
            });

        });

        describe("showSettings()", () => {

            it("shows a window menu for changing widget preferences", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(widget.showSettings()).toBe(widget);
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

            it("handle status transition from loaded widget", (done) => {

                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                let element = widget.wrapperElement;
                widget.wrapperElement = {
                    contentDocument: {
                        defaultView: {
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    },
                    contentWindow: {
                        location: {
                            href: widget.codeurl,
                            replace: jasmine.createSpy("replace")
                        }
                    },
                    setAttribute: jasmine.createSpy("setAttribute")
                };
                widget.load();
                element.dispatchEvent(new Event("load"));

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
