/*
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

    describe("Wirecloud.WidgetMeta", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.contextManager = {
                "get": jasmine.createSpy("get").and.callFake((name) => {
                    switch (name) {
                    case "language":
                        return "en";
                    case "theme":
                        return "defaulttheme";
                    case "version_hash":
                        return "36a984d7d95e028705ca9030c18f6dd295bedaca";
                    };
                })
            };
        });

        afterAll(() => {
            // TODO
            Wirecloud.contextManager = null;
        });

        describe("new WidgetMeta(desc)", () => {

            it("throws a TypeError exception when not passing the desc parameter", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when providing a description for a different mac type", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta({
                        name: "TestOperator",
                        version: "1.0",
                        type: "operator",
                        macversion: 1
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when the entrypoint is missing for mac version 2", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta({
                        vendor: "Wirecloud",
                        name: "TestWidget",
                        version: "1.0",
                        type: "widget",
                        js_files: [],
                        macversion: 2,
                        preferences: [],
                        contents: {
                            src: "index.html"
                        }
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when the js_files is missing for mac version 2", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta({
                        vendor: "Wirecloud",
                        name: "TestWidget",
                        version: "1.0",
                        type: "widget",
                        macversion: 2,
                        entrypoint: "Test",
                        preferences: [],
                        contents: {
                            src: "index.html"
                        }
                    });
                }).toThrowError(TypeError);
            });

            it("accepts missing js_files and entrypoint for mac version 1", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta({
                        vendor: "Wirecloud",
                        name: "TestWidget",
                        preferences: [],
                        properties: [],
                        version: "1.0",
                        macversion: 1,
                        contents: {
                            src: "index.html"
                        }
                    });
                }).not.toThrow();
            });

            it("accepts js_files and entrypoint for mac version 2", () => {
                expect(() => {
                    new Wirecloud.WidgetMeta({
                        vendor: "Wirecloud",
                        name: "TestWidget",
                        preferences: [],
                        properties: [],
                        version: "1.0",
                        macversion: 2,
                        entrypoint: "Test",
                        js_files: [],
                        contents: {
                            src: "index.html"
                        }
                    });
                }).not.toThrow();
            });

            it("provides some fallback values", () => {
                const mac = new Wirecloud.WidgetMeta({
                    vendor: "Wirecloud",
                    name: "TestWidget",
                    preferences: [],
                    properties: [],
                    version: "1.0",
                    macversion: 1,
                    contents: {
                        src: "index.html"
                    }
                });

                expect(mac.codeurl).toEqual(jasmine.any(String));
                expect(mac.codecontenttype).toBe("application/xhtml+xml");
                expect(mac.properties).toEqual({});
                expect(mac.propertyList).toEqual([]);
            });

            it("provides a default code endpoint and content type for missing widgets", () => {
                const mac = new Wirecloud.WidgetMeta({
                    vendor: "Wirecloud",
                    name: "TestWidget",
                    missing: true,
                    preferences: [],
                    properties: [],
                    version: "1.0",
                    macversion: 1,
                    contents: {
                        src: "index.html",
                        contenttype: "application/html"
                    }
                });

                expect(mac.codeurl).toEqual("https://wirecloud.example.com/api/widget/missing_widget?lang=en&entrypoint=true&v=36a984d7d95e028705ca9030c18f6dd295bedaca&theme=defaulttheme");
                expect(mac.codecontenttype).toBe("application/xhtml+xml");
            });

            it("allows to customize widget properties", () => {
                const mac = new Wirecloud.WidgetMeta({
                    vendor: "Wirecloud",
                    name: "TestWidget",
                    preferences: [],
                    properties: [
                        {name: "prop1"}
                    ],
                    type: "widget",
                    version: "1.1",
                    macversion: 1,
                    contents: {
                        src: "index.html",
                        contenttype: "application/html"
                    }
                });

                expect(mac.codecontenttype).toBe("application/html");
                expect(mac.properties).toEqual({
                    prop1: jasmine.any(Wirecloud.PersistentVariableDef)
                });
                expect(mac.propertyList).toEqual([jasmine.any(Wirecloud.PersistentVariableDef)]);
            });

        });

        describe("getInfoString()", () => {

            it("should provide a string for debuging", () => {
                const mac = new Wirecloud.WidgetMeta({
                    vendor: "Wirecloud",
                    name: "TestWidget",
                    preferences: [],
                    properties: [],
                    version: "1.0",
                    macversion: 1,
                    contents: {
                        src: "index.html"
                    }
                });

                expect(mac.getInfoString()).toBe("[Widget; Vendor: Wirecloud, Name: TestWidget, Version: 1.0]");
            });

        });

    });

})();
