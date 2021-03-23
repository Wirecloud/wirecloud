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

    describe("Wirecloud.UserPrefDef", () => {

        describe("new Wirecloud.UserPrefDef(options)", () => {

            it("throws a TypeError if the options parameter is not provided", () => {

                expect(() => {
                    new Wirecloud.UserPrefDef();
                }).toThrowError(TypeError);

            });

            it("throws a TypeError if options is null", () => {

                expect(() => {
                    new Wirecloud.UserPrefDef(null);
                }).toThrowError(TypeError);

            });

            it("throws a TypeError if the default option is not a string", () => {

                expect(() => {
                    new Wirecloud.UserPrefDef({default: 5});
                }).toThrowError(TypeError);

            });

            it("exposes preference details", () => {

                const meta = new Wirecloud.UserPrefDef({
                    name: "pref",
                    type: "text",
                    label: "label content",
                    description: "pref description",
                    required: true,
                    secure: false
                });

                expect(meta.name).toBe("pref");
                expect(meta.type).toBe("text");
                expect(meta.label).toBe("label content");
                expect(meta.description).toBe("pref description");
                expect(meta.required).toBe(true);
                expect(meta.secure).toBe(false);
            });

            describe("boolean", () => {

                it("true", () => {
                    const meta = new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "true"});
                    expect(meta.default).toBe(true);
                });

                it("false", () => {
                    const meta = new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "false"});
                    expect(meta.default).toBe(false);
                });

            });

            describe("number", () => {

                it("5", () => {
                    const meta = new Wirecloud.UserPrefDef({name: "pref", type: "number", default: "5"});
                    expect(meta.default).toBe(5);
                });

                it("-25.3434", () => {
                    const meta = new Wirecloud.UserPrefDef({name: "pref", type: "number", default: "-25.3434"});
                    expect(meta.default).toBe(-25.3434);
                });

            });

        });

    });

})();
