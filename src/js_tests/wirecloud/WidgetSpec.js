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
                return false;
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

    var MISSING_WIDGET_META = {
        inputList: [],
        missing: true,
        requirements: [],
        outputList: [],
        preferenceList: [],
        propertyList: []
    };
    Object.freeze(MISSING_WIDGET_META);

    var WIDGET_META = {
        title: "My Widget",
        inputList: [],
        missing: false,
        requirements: [],
        outputList: [],
        preferenceList: [
            {name: "pref", type: "text", default: ""}
        ],
        propertyList: []
    };
    Object.freeze(WIDGET_META);

    describe("Wirecloud.Widget", function () {

        beforeEach(() => {
            Wirecloud.PropertyCommiter = jasmine.createSpy("PropertyCommiter");
            Wirecloud.UserPref = jasmine.createSpy("UserPref");
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
                expect(new URL(widget.codeurl).toEqual(jasmine.any(URL));
            });

            it("allow to instantiate widgets from persistence", () => {
                var widget = new Wirecloud.Widget(WORKSPACE_TAB, EMPTY_WIDGET_META, {
                    id: "2",
                    title: "title"
                });

                expect(widget.id).toBe("2");
                expect(widget.loaded).toBe(false);
                expect(widget.missing).toBe(false);
                expect(widget.title).toBe("title");
                expect(widget.volatile).toBe(false);
                expect(new URL(widget.codeurl)).toEqual(jasmine.any(URL));
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
                expect(widget.codeurl).toEqual(jasmine.any(URL));
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

    });

})();
