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


(function (ns) {

    "use strict";

    describe("Wirecloud.OperatorMeta", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.contextManager = {
                "get": jasmine.createSpy("get").and.callFake((name) => {
                    switch (name) {
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

        describe("new OperatorMeta(desc)", () => {

            it("throws a TypeError exception when not passing the desc parameter", () => {
                expect(() => {
                    new ns.OperatorMeta();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when providing a description for a different mac type", () => {
                expect(() => {
                    new ns.OperatorMeta({
                        name: "TestOperator",
                        version: "1.0",
                        type: "widget"
                    });
                }).toThrowError(TypeError);
            });

            it("provides some fallback values", () => {
                const mac = new ns.OperatorMeta({
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    preferences: [],
                    properties: [],
                    version: "1.0"
                });

                expect(mac.codeurl).toEqual(jasmine.any(String));
                expect(mac.properties).toEqual({});
                expect(mac.propertyList).toEqual([]);
            });

            it("provides a default code endpoint and content type for missing widgets", () => {
                const mac = new ns.OperatorMeta({
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    missing: true,
                    preferences: [],
                    properties: [],
                    version: "1.0"
                });

                expect(mac.codeurl).toEqual("/api/widget/missing_widget?v=36a984d7d95e028705ca9030c18f6dd295bedaca");
            });

            it("allows to customize operator properties", () => {
                const mac = new ns.OperatorMeta({
                    vendor: "Wirecloud",
                    name: "TestWidget",
                    preferences: [],
                    properties: [
                        {name: "prop1"}
                    ],
                    type: "operator",
                    version: "1.1"
                });

                expect(mac.properties).toEqual({
                    prop1: jasmine.any(Wirecloud.PersistentVariableDef)
                });
                expect(mac.propertyList).toEqual([jasmine.any(Wirecloud.PersistentVariableDef)]);
            });

        });

    });

})(Wirecloud.wiring);
