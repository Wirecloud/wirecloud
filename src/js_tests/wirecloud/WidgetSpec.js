/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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

    const WORKSPACE_TAB = {
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

    const WORKSPACEVIEW_TAB = {
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

    const LOCKED_WORKSPACE_TAB = {
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

    const EMPTY_WIDGET_META = {
        title: "My Widget",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: false,
        requirements: [],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html",
        macversion: 1
    };
    Object.freeze(EMPTY_WIDGET_META);

    const MISSING_WIDGET_META = {
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

    const FULLSCREEN_WIDGET_META = {
        title: "My Widget",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: false,
        requirements: [{}, {type: "feature", name: "FullscreenWidget"}],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html",
        macversion: 1
    };
    Object.freeze(FULLSCREEN_WIDGET_META);

    const PREF = new Wirecloud.UserPrefDef({name: "pref", type: "text", default: "other"});
    const PROP = new Wirecloud.PersistentVariableDef({name: "prop", type: "text"});
    const WIDGET_META = {
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
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html",
        macversion: 1
    };
    Object.freeze(WIDGET_META);

    const WIDGETV2_META = {
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
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html",
        macversion: 2,
        js_files: ['http://thiswebsitedoesnotexist.com/test2.js'],
        entrypoint: "TestingEntrypoint"
    };
    Object.freeze(WIDGETV2_META);

    const WIDGETV2_META_NO_SCRIPTS = {
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
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html",
        macversion: 2,
        js_files: [],
        entrypoint: "TestingEntrypoint"
    };
    Object.freeze(WIDGETV2_META_NO_SCRIPTS);

    const PREF2 = new Wirecloud.UserPrefDef({name: "pref2", type: "text", default: "5"});
    const SPREF = new Wirecloud.UserPrefDef({name: "spref", type: "text", secure: true});
    const WIDGET_META_PREFS = {
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
            "pref": PREF,
            "pref2": PREF2,
            "spref": SPREF
        },
        preferenceList: [
            PREF,
            PREF2,
            SPREF
        ],
        properties: {
            "prop": PROP
        },
        propertyList: [
            PROP
        ],
        codeurl: "https://wirecloud.example.com/widgets/MyWidget/index.html"
    };
    Object.freeze(WIDGET_META_PREFS);

    const WIDGET_LAYOUT_CONFIGS = [{
        id: 0,
        moreOrEqual: 0,
        lessOrEqual: 800,
        anchor: 'top-left',
        relx: true,
        rely: true,
        left: 0,
        top: 0,
        zIndex: 0,
        relheight: true,
        relwidth: true,
        height: 1,
        width: 1,
        minimized: false,
        fulldragboard: false,
        titlevisible: true
    }, {
        id: 1,
        moreOrEqual: 801,
        lessOrEqual: 999,
        anchor: 'top-right',
        relx: true,
        rely: true,
        left: 1,
        top: 0,
        zIndex: 1,
        relheight: true,
        relwidth: true,
        height: 2,
        width: 1,
        minimized: false,
        fulldragboard: true,
        titlevisible: true
    },
    {
        id: 2,
        moreOrEqual: 1000,
        lessOrEqual: -1,
        anchor: 'top-left',
        relx: true,
        rely: true,
        left: 0,
        top: 0,
        zIndex: 0,
        relheight: true,
        relwidth: true,
        height: 1,
        width: 1,
        minimized: false,
        fulldragboard: false,
        titlevisible: true
    }];
    Object.freeze(WIDGET_LAYOUT_CONFIGS);

    describe("Wirecloud.Widget", function () {

        beforeAll(() => {
            spyOn(console, "log");
            spyOn(console, "info");
        });

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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, FULLSCREEN_WIDGET_META, {
                    id: "1"
                });

                expect(widget.wrapperElement.getAttribute("allowfullscreen")).toBe("true");
            });

            it("handles tab remove events", () => {
                WORKSPACE_TAB.addEventListener.calls.reset();
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                const listener = jasmine.createSpy("listener");
                widget.addEventListener("remove", listener);

                WORKSPACE_TAB.addEventListener.calls.argsFor(0)[1](WORKSPACE_TAB);

                expect(listener).toHaveBeenCalled();
            });

            it("allow to instantiate widgets on workspaceviews", () => {
                const widget = new Wirecloud.Widget(WORKSPACEVIEW_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(widget.codeurl).toBe("https://wirecloud.example.com/widgets/MyWidget/index.html#id=1&workspaceview=id232");
            });

        });

        describe("changeTab(tab)", () => {

            it("do nothing when moving to the same tab", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest");

                const p = widget.changeTab(widget.tab);
                p.then(() => {
                    expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    done();
                });

            });

            it("save tab change into the server", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.changeTab({
                    id: 5
                });
                p.then(() => {
                    done();
                });

            });

            it("handle error saving tab change into the server", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.changeTab({
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;

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

            it("loads unloaded v2 widgets", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGETV2_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;

                widget.wrapperElement.load = jasmine.createSpy("load").and.callFake((url) => {
                    widget.wrapperElement.loadedURL = url;
                    element.dispatchEvent(new Event("load"));
                });

                expect(widget.loaded).toBe(false);
                expect(widget.load()).toBe(widget);
                expect(widget.wrapperElement.load).toHaveBeenCalledWith(widget.codeurl);

                // Now the widget should be fully loaded
                expect(widget.wrapperElement.loadedURL).toBe(widget.codeurl);
            });

            it("loads missing widgets", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, MISSING_WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;

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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                const listener = jasmine.createSpy();
                widget.registerContextAPICallback("iwidget", listener);
                widget.registerContextAPICallback("mashup", listener);
                widget.registerContextAPICallback("platform", listener);
                const element = widget.wrapperElement;

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

            it("handles v2 widgets unload events", async () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGETV2_META, {
                    id: "1"
                });
                const listener = jasmine.createSpy();
                widget.registerContextAPICallback("iwidget", listener);
                widget.registerContextAPICallback("mashup", listener);
                widget.registerContextAPICallback("platform", listener);
                const element = widget.wrapperElement;

                widget.wrapperElement.load = jasmine.createSpy("load").and.callFake((url) => {
                    widget.wrapperElement.loadedURL = url;
                    element.dispatchEvent(new Event("load"));
                });

                expect(widget.load()).toBe(widget);

                let loadedScripts = document.querySelectorAll('script[src="http://thiswebsitedoesnotexist.com/test2.js"]');
                expect(loadedScripts.length).toBe(1);

                // Now the widget should be fully loaded
                widget.loaded = true;

                // Send unload event
                element.dispatchEvent(new Event("unload"));

                expect(widget.callbacks.iwidget).toEqual([]);
                expect(widget.callbacks.mashup).toEqual([]);
                expect(widget.callbacks.platform).toEqual([]);

                const new_widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGETV2_META, {
                    id: "2"
                });

                expect(new_widget.load()).toBe(new_widget);

                loadedScripts = document.querySelectorAll('script[src="http://thiswebsitedoesnotexist.com/test2.js"]');
                expect(loadedScripts.length).toBe(1);

                Wirecloud.loadedScripts["http://thiswebsitedoesnotexist.com/test2.js"].loaded = true;

                const another_widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGETV2_META, {
                    id: "3"
                });

                expect(another_widget.load()).toBe(another_widget);

                loadedScripts = document.querySelectorAll('script[src="http://thiswebsitedoesnotexist.com/test2.js"]');
                expect(loadedScripts.length).toBe(1);
            });

            it("handles v2 widgets reload", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGETV2_META, {
                    id: "1"
                });

                const element = widget.wrapperElement;

                widget.wrapperElement.load = jasmine.createSpy("load").and.callFake((url) => {
                    widget.wrapperElement.loadedURL = url;
                    element.dispatchEvent(new Event("load"));
                });

                expect(widget.loaded).toBe(false);
                expect(widget.load()).toBe(widget);
                expect(widget.wrapperElement.load).toHaveBeenCalledWith(widget.codeurl);

                // Now the widget should be fully loaded
                expect(widget.wrapperElement.loadedURL).toBe(widget.codeurl);

                widget.wrapperElement.load.calls.reset();
                expect(widget.reload()).toBe(widget);
                expect(widget.wrapperElement.load).toHaveBeenCalledWith(widget.codeurl);
            });

            it("ignores unload events when unloaded", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;

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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                expect(widget.hasEndpoints()).toBe(false);
                expect(widget.meta.hasEndpoints).toHaveBeenCalled();
            });

        });

        describe("hasPreferences()", () => {

            it("is a shortcut", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                expect(widget.hasPreferences()).toBe(false);
                expect(widget.meta.hasPreferences).toHaveBeenCalled();
            });

        });

        describe("is(component)", () => {

            it("return true for the same component", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                expect(widget.is(widget)).toBe(true);
            });

            it("return false for the different widgets", () => {
                const widget1 = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });

                const widget2 = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "2"
                });

                expect(widget1.is(widget2)).toBe(false);
            });

        });

        describe("isAllowed(name)", () => {

            describe("close", () => {

                it("normal widget on unlocked workspace", () => {
                    const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                    expect(widget.isAllowed("move", "editor")).toBe(false);
                });

                it("volatile widget on shared workspace (editor)", () => {
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {id: "1"});
                    expect(() => {
                        widget.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

                it("volatile widget on shared workspace", () => {
                    const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
            let widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
            });

            it("throws a TypeError exception when passing an invalid scope", () => {
                const listener = jasmine.createSpy();
                expect(() => {
                    widget.registerContextAPICallback("invalid", listener);
                }).toThrowError(TypeError);
            });

            it("support registering widget context callbacks", () => {
                const listener = jasmine.createSpy();
                widget.registerContextAPICallback("iwidget", listener);
            });

            it("support registering mashup context callbacks", () => {
                const listener = jasmine.createSpy();
                WORKSPACE_TAB.workspace.contextManager.addCallback.calls.reset();

                widget.registerContextAPICallback("mashup", listener);

                expect(WORKSPACE_TAB.workspace.contextManager.addCallback).toHaveBeenCalledWith(listener);
            });

            it("support registering platform context callbacks", () => {
                const listener = jasmine.createSpy();
                widget.registerContextAPICallback("platform", listener);
            });

        });

        describe("registerPrefCallback(callback)", () => {

            it("should register preference callbacks", () => {
                const listener = jasmine.createSpy("listener");
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
                expect(widget.registerPrefCallback(listener)).toBe(widget);
            });

        });

        describe("reload()", () => {

            it("should reload widget view", (done) => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    title: "old title"
                });
                const listener = jasmine.createSpy("listener");
                const element = widget.wrapperElement;
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
                const listener = jasmine.createSpy("listener");
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                widget.addEventListener("remove", listener);
                const p = widget.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("supports removing loaded widgets", (done) => {
                const listener = jasmine.createSpy("listener");
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });
                const element = widget.wrapperElement;
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
                const p = widget.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("removes widget from persistence", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    done();
                });

            });

            it("handle unexpected responses when removing the widget from persistence", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.remove();
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
                const listener = jasmine.createSpy("listener");
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                const p = widget.rename("new name");
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(widget.title).toBe("new name");
                    done();
                });
            });

            it("renames widget on the server", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.rename("new name");
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.rename("new name");
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

            let widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title"
                });
            });

            it("should do nothing when passing an empty position", () => {
                const initial_position = widget.position;

                expect(widget.setPosition({})).toBe(widget);

                expect(widget.position).toEqual(initial_position);
            });

            it("should allow to modify all the position properties", () => {
                const new_position = {
                    anchor: "bottom-left",
                    relx: false,
                    rely: true,
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
                    anchor: "bottom-left",
                    relx: true,
                    rely: false,
                    x: 1,
                    y: 2,
                    z: 3
                };
                expect(widget.setPosition(new_position)).toBe(widget);

                expect(widget.position).toEqual({
                    anchor: "bottom-left",
                    relx: true,
                    rely: false,
                    x: 1,
                    y: 2,
                    z: 3
                });
            });

        });

        describe("setShape(shape)", () => {

            let widget;

            beforeEach(() => {
                widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title"
                });
            });

            it("should do nothing when passing an empty shape", () => {
                const initial_shape = widget.shape;

                expect(widget.setShape({})).toBe(widget);

                expect(widget.shape).toEqual(initial_shape);
            });

            it("should allow to modify all the shape properties", () => {
                const new_shape = {
                    relwidth: true,
                    relheight: true,
                    width: 2,
                    height: 3
                };
                expect(widget.setShape(new_shape)).toBe(widget);

                expect(widget.shape).toEqual(new_shape);
            });

            it("should ignore extra properties", () => {
                const new_shape = {
                    extra: 123,
                    relwidth: true,
                    relheight: true,
                    width: 2,
                    height: 3
                };
                expect(widget.setShape(new_shape)).toBe(widget);

                expect(widget.shape).toEqual({
                    relwidth: true,
                    relheight: true,
                    width: 2,
                    height: 3
                });
            });

        });

        describe("setPermissions(permissions)", () => {

            it("applies changes immediatelly for volatile widgets", () => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true,
                    permissions: {
                        viewer: {
                            move: false
                        }
                    }
                });

                const t = widget.setPermissions({move: true});
                expect(t).toEqual(jasmine.any(Promise));
                expect(widget.permissions.viewer.move).toBe(true);
            });

            it("updates permissions on the server", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.setPermissions({move: true});
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
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.setPermissions({move: true});
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

        describe("setPreferences(newValues)", () => {

            it("applies changes immediatelly for volatile widgets", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                const p = widget.setPreferences({pref: "a value"});
                expect(widget.preferences.pref.value).toBe("a value");
                expect(p).toEqual(jasmine.any(Promise));
                p.then(
                    (value) => {
                        expect(value).toEqual({pref: "a value"});
                        expect(widget.preferences.pref.value).toBe("a value");
                        expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("updates preferences on the server", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META, {
                    id: "1",
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                const p = widget.setPreferences({pref: "a value"});
                p.then(
                    (value) => {
                        expect(value).toEqual({pref: "a value"});
                        expect(widget.preferences.pref.value).toBe("a value");
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("updates preferences on the server (multiple)", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META_PREFS, {
                    id: "1",
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                const p = widget.setPreferences({pref: "a value", pref2: "another value"});
                p.then(
                    (value) => {
                        expect(value).toEqual({pref: "a value", pref2: "another value"});
                        expect(widget.preferences.pref.value).toBe("a value");
                        expect(widget.preferences.pref2.value).toBe("another value");
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("censor secure preferences", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META_PREFS, {
                    id: "1",
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(options.method).toEqual("POST");
                    const body = JSON.parse(options.postBody);
                    expect(body).toEqual({
                        pref: "a value",
                        spref: "another value"
                    });
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 204
                        });
                    });
                });

                const p = widget.setPreferences({pref: "a value", spref: "another value"});
                p.then(
                    (value) => {
                        expect(value).toEqual({pref: "a value", spref: "********"});
                        expect(widget.preferences.pref.value).toBe("a value");
                        expect(widget.preferences.spref.value).toBe("********");
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("ignores non-changed preferences", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META_PREFS, {
                    id: "1",
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    expect(Object.keys(JSON.parse(options.postBody))).toEqual(["pref"]);
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                const p = widget.setPreferences({pref: PREF.default, nonexistent: "other"});
                p.then(
                    (value) => {
                        expect(value).toEqual({});
                        expect(widget.preferences.pref.value).toBe(PREF.default);
                        expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("ignores non-existent preferences", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META, {
                    id: "1",
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("POST");
                    expect(Object.keys(JSON.parse(options.postBody))).toEqual(["pref"]);
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                });

                const p = widget.setPreferences({pref: "a value", nonexistent: "other"});
                p.then(
                    (value) => {
                        expect(value).toEqual({pref: "a value"});
                        expect(widget.preferences.pref.value).toBe("a value");
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                ).finally(() => done());
            });

            it("handles unexpected responses", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(options.method).toEqual("POST");
                    return new Wirecloud.Task("Sending request", (resolve) => {
                        resolve({
                            status: 200
                        });
                    });
                });

                const p = widget.setPreferences({pref: "a value"});
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    }
                ).finally(() => done());
            });

        });

        describe("setTitleVisibility(visibility[, persistence])", () => {

            it("returns immediatelly for volatile widgets", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });
                spyOn(Wirecloud.io, "makeRequest");

                const p = widget.setTitleVisibility(true, false);
                expect(widget.titlevisible).toBe(true);
                expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                p.then(
                    (value) => {
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("updates titlevisible property", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: [{
                        titlevisible: false,
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: -1
                    }]
                });
                spyOn(Wirecloud.io, "makeRequest");
                expect(widget.titlevisible).toBe(false);

                const p = widget.setTitleVisibility(true, false);
                expect(widget.titlevisible).toBe(true);
                expect(widget.currentLayoutConfig.titlevisible).toBe(true);
                expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                p.then(
                    (value) => {
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("updates titlevisible property on the server", (done) => {
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: [{
                        titlevisible: false,
                        id: 0,
                        moreOrEqual: 0,
                        lessOrEqual: -1
                    }]
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
                expect(widget.currentLayoutConfig.titlevisible).toBe(false);

                const p = widget.setTitleVisibility(true, true);
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
                const widget = new Wirecloud.Widget(LOCKED_WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.setTitleVisibility(true, true);
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
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                expect(widget.showLogs()).toBe(widget);
            });

        });

        describe("showSettings()", () => {

            it("shows a window menu for changing widget preferences", () => {
                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(widget.showSettings()).toBe(widget);
            });

        });

        describe("upgrade(meta)", () => {
            let failOnPreferences = false;
            let failOnProperties = false;

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
                        const PREF = new Wirecloud.UserPrefDef({
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                expect(() => {
                    widget.upgrade(null);
                }).toThrowError(TypeError);

            });

            it("save widget meta changes into the server (upgrade)", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(1);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(-1);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, WIDGET_META, {
                    id: "1"
                });

                // Preferences and properties are not requested in this case
                failOnPreferences = true;
                failOnProperties = true;

                const MISSING_WIDGET_META = new Wirecloud.WidgetMeta(true);
                const p = widget.upgrade(MISSING_WIDGET_META);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });
                const element = widget.wrapperElement;
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
                    setAttribute: jasmine.createSpy("setAttribute"),
                    parentNode: {
                        replaceChild: jasmine.createSpy("replaceChild")
                    },
                    addEventListener: jasmine.createSpy("addEventListener")
                };

                const real_createElement = document.createElement;
                document.createElement = jasmine.createSpy("createElement").and.callFake(function (tagName) {
                    if (tagName === "iframe") {
                        return widget.wrapperElement;
                    } else {
                        return real_createElement(tagName);
                    }
                });

                widget.load();
                element.dispatchEvent(new Event("load"));

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(1);
                const p = widget.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(widget.meta).toBe(new_meta);
                        expect(widget.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(widget.preferences.npref.value).toBe("upgraded value");
                        expect(widget.preferences.pref).toBe(undefined);
                        expect(widget.wrapperElement.parentNode.replaceChild).toHaveBeenCalled();
                        document.createElement = real_createElement;
                        done();
                    },
                    (error) => {
                        document.createElement = real_createElement;
                        fail("error callback called " + error);
                    }
                );

            });

            it("handle error saving meta change into the server", (done) => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
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

                const p = widget.upgrade(new Wirecloud.WidgetMeta());
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnPreferences = true;

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnPreferences = "invalid";

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnProperties = true;

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = widget.upgrade(new_meta);
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

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1"
                });

                failOnProperties = "invalid";

                const new_meta = new Wirecloud.WidgetMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = widget.upgrade(new_meta);
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

        describe("updateWindowSize(windowSize)", () => {

            it("should update the widget information accordingly", () => {

                // Force window size to 800
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 750
                });

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.layoutConfigurations).toBe(WIDGET_LAYOUT_CONFIGS);

                expect(widget.updateWindowSize(800)).toBe(false);
                expect(widget.updateWindowSize(900)).toBe(true);

                expect(widget.currentLayoutConfig).toBe(widget.layoutConfigurations[1]);

                expect(widget.fulldragboard).toBe(true);
                expect(widget.position.z).toBe(1);
                expect(widget.shape.height).toBe(2);

                expect(widget.updateWindowSize(800)).toBe(true);

                expect(widget.currentLayoutConfig).toBe(widget.layoutConfigurations[0]);

                expect(widget.fulldragboard).toBe(false);
                expect(widget.position.z).toBe(0);
                expect(widget.shape.height).toBe(1);

            });

        });

        describe("setLayoutPosition(layoutPosition)", () => {

            it("should update the current layout position accordingly", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.setLayoutPosition({
                    anchor: 'top-left',
                    relx: false,
                    rely: true,
                    x: 1,
                    y: 0,
                    z: 0
                })).toBe(widget);

                expect(widget.currentLayoutConfig.left).toBe(1);
                expect(widget.currentLayoutConfig.relx).toBe(false);

                expect(widget.position.x).toBe(0);
                expect(widget.position.relx).toBe(true);

            });

        });

        describe("setLayoutShape(layoutShape)", () => {

            it("should update the current layout shape accordingly", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.setLayoutShape({
                    relwidth: false,
                    relheight: true,
                    width: 1,
                    height: 2
                })).toBe(widget);

                expect(widget.currentLayoutConfig.height).toBe(2);
                expect(widget.currentLayoutConfig.relwidth).toBe(false);

                expect(widget.shape.height).toBe(1);
                expect(widget.shape.relwidth).toBe(true);

            });

        });

        describe("setLayoutIndex(index)", () => {

            it("should update the layout accordingly", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.setLayoutIndex(3)).toBe(widget);
                expect(widget.layout).toBe(3);

                widget.setLayoutIndex(1);
                expect(widget.layout).toBe(1);
            });

        });

        describe("setLayoutFulldragboard(fulldragboard)", () => {

            it("should update the fulldragboard property of the layout accordingly", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.setLayoutFulldragboard(true)).toBe(widget);
                expect(widget.currentLayoutConfig.fulldragboard).toBe(true);
                expect(widget.fulldragboard).toBe(false);
            });

        });

        describe("setLayoutMinimizedStatus(minimized)", () => {

            it("should update the minimized property of the layout accordingly", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.setLayoutMinimizedStatus(true)).toBe(widget);
                expect(widget.minimized).toBe(widget.currentLayoutConfig.minimized);
                expect(widget.currentLayoutConfig.minimized).toBe(true);
            });

        });

        describe("getLayoutConfigBySize(size)", () => {

            it("should return the layout configuration that fits the given size", () => {

                const widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "1",
                    layoutConfigurations: WIDGET_LAYOUT_CONFIGS
                });

                expect(widget.getLayoutConfigBySize(800)).toBe(widget.layoutConfigurations[0]);
                expect(widget.getLayoutConfigBySize(900)).toBe(widget.layoutConfigurations[1]);
                expect(widget.getLayoutConfigBySize(1000)).toBe(widget.layoutConfigurations[2]);

            });

        });

    });

})();
