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

    describe("Wirecloud.MashableApplicationComponent", () => {

        describe("new MashableApplicationComponent(desc)", () => {

            it("throws a TypeError exception when not passing the desc parameter", () => {
                expect(() => {
                    new Wirecloud.MashableApplicationComponent();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not providing a vendor", () => {
                expect(() => {
                    new Wirecloud.MashableApplicationComponent({
                        name: "TestOperator",
                        version: "1.0",
                        type: "operator"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not providing a name", () => {
                expect(() => {
                    new Wirecloud.MashableApplicationComponent({
                        vendor: "Wirecloud",
                        version: "1.0",
                        type: "operator"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not providing a version", () => {
                expect(() => {
                    new Wirecloud.MashableApplicationComponent({
                        vendor: "Wirecloud",
                        name: "TestOperator",
                        type: "operator"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not providing a type", () => {
                expect(() => {
                    new Wirecloud.MashableApplicationComponent({
                        vendor: "Wirecloud",
                        name: "TestOperator",
                        version: "1.0"
                    });
                }).toThrowError(TypeError);
            });

            it("provides some fallback values", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac.vendor).toBe("Wirecloud");
                expect(mac.name).toBe("TestOperator");
                expect(mac.type).toBe("operator");
                expect(mac.version).toEqual(jasmine.any(Wirecloud.Version));
                expect(mac.missing).toBe(false);
                expect(mac.uri).toBe("Wirecloud/TestOperator/1.0");
                expect(mac.group_id).toBe("Wirecloud/TestOperator");
                expect(mac.image).toBe(null);
                expect(mac.description).toBe("");
                expect(mac.doc).toBe("");
                expect(mac.changelog).toBe("");
                expect(mac.title).toBe("TestOperator");
                expect(mac.base_url).toEqual(jasmine.any(String));
                expect(mac.preferences).toEqual(jasmine.any(Object));
                expect(mac.preferenceList).toEqual(jasmine.any(Array));
            });

            it("supports providing all the details thrugh the desc parameter", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    preferences: [],
                    type: "operator",
                    missing: true,
                    image: "a.png",
                    description: "mydescription ",
                    doc: "doc/userguide.md",
                    changelog: "doc/changelog.md",
                    title: "My Operator",
                    version: "1.0"
                });

                expect(mac.vendor).toBe("Wirecloud");
                expect(mac.name).toBe("TestOperator");
                expect(mac.type).toBe("operator");
                expect(mac.missing).toBe(true);
                expect(mac.version).toEqual(jasmine.any(Wirecloud.Version));
                expect(mac.uri).toBe("Wirecloud/TestOperator/1.0");
                expect(mac.group_id).toBe("Wirecloud/TestOperator");
                expect(mac.image).toBe("a.png");
                expect(mac.description).toBe("mydescription");
                expect(mac.doc).toBe("doc/userguide.md");
                expect(mac.changelog).toBe("doc/changelog.md");
                expect(mac.title).toBe("My Operator");
                expect(mac.base_url).toEqual(jasmine.any(String));
                expect(mac.preferences).toEqual(jasmine.any(Object));
                expect(mac.preferenceList).toEqual(jasmine.any(Array));
            });

        });

        describe("hasEndpoints()", () => {

            it("returns false if the mac has not input/output endpoints", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac.hasEndpoints()).toBe(false);
            });

            it("returns true if the mac has at least one input endpoints", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0",
                    wiring: {
                        inputs: [
                            {name: "input1"}
                        ]
                    }
                });

                expect(mac.hasEndpoints()).toBe(true);
            });

            it("returns true if the mac has at least one output endpoints", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0",
                    wiring: {
                        outputs: [
                            {name: "output1"}
                        ]
                    }
                });

                expect(mac.hasEndpoints()).toBe(true);
            });

        });

        describe("hasPreferences()", () => {

            it("returns false if the mac has not preferences", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac.hasPreferences()).toBe(false);
            });

            it("returns true if the mac has at least one preference", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [
                        {name: "pref1"}
                    ],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac.hasPreferences()).toBe(true);
            });

        });

        describe("is(other)", () => {

            it("returns false for different versions of the same mac", () => {
                const mac1 = new Wirecloud.MashableApplicationComponent({
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                const mac2 = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestWidget ",
                    preferences: [],
                    type: "operator",
                    version: "1.1"
                });

                expect(mac1.is(mac2)).toBe(false);
            });

            it("returns false for totally different macs", () => {
                const mac1 = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                const mac2 = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestWidget ",
                    preferences: [],
                    type: "widget",
                    version: "1.0"
                });

                expect(mac1.is(mac2)).toBe(false);
            });

            it("returns true when other is the same instance", () => {
                const mac = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac.is(mac)).toBe(true);
            });

            it("returns true if other is a equivalent mac", () => {
                const mac1 = new Wirecloud.MashableApplicationComponent({
                    vendor: " Wirecloud",
                    name: "TestOperator ",
                    preferences: [
                        {name: "pref1"}
                    ],
                    type: "operator",
                    version: "1.0"
                });

                const mac2 = new Wirecloud.MashableApplicationComponent({
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    preferences: [],
                    type: "operator",
                    version: "1.0"
                });

                expect(mac1.is(mac2)).toBe(true);
            });

        });

    });

})();
