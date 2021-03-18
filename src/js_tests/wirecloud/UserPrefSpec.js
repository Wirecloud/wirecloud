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

    describe("Wirecloud.UserPref", () => {

        describe("new Wirecloud.UserPref(meta, readonly, hidden, value)", () => {

            it("throws a TypeError exception if meta is not a UserPrefDef instance", () => {

                expect(() => {
                    new Wirecloud.UserPref();
                }).toThrowError(TypeError);

            });

            describe("process boolean values", () => {

                it("boolean: false", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "true"}),
                        false,
                        false,
                        false
                    );
                    expect(pref.value).toBe(false);
                });

                it("boolean: true", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "false"}),
                        false,
                        false,
                        true
                    );
                    expect(pref.value).toBe(true);
                });

                it("string: false", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "true"}),
                        false,
                        false,
                        "false"
                    );
                    expect(pref.value).toBe(false);
                });

                it("string: true", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "boolean", default: "false"}),
                        false,
                        false,
                        "true"
                    );
                    expect(pref.value).toBe(true);
                });

            });

            describe("process number values", () => {

                it("number: 5", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "number"}),
                        false,
                        false,
                        5
                    );
                    expect(pref.value).toBe(5);
                });

                it("number: -25.3434", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "number"}),
                        false,
                        false,
                        -25.3434
                    );
                    expect(pref.value).toBe(-25.3434);
                });

                it("string: 5", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "number"}),
                        false,
                        false,
                        "5"
                    );
                    expect(pref.value).toBe(5);
                });

                it("string: true", () => {
                    const pref = new Wirecloud.UserPref(
                        new Wirecloud.UserPrefDef({name: "pref", type: "number"}),
                        false,
                        false,
                        "-25.3434"
                    );
                    expect(pref.value).toBe(-25.3434);
                });

            });

        });

        describe("getInterfaceDescription()", () => {

            it("support text preferences", () => {
                const pref = new Wirecloud.UserPref(
                    new Wirecloud.UserPrefDef({name: "pref", type: "text"}),
                    false,
                    false,
                    "asa"
                );
                expect(pref.getInterfaceDescription()).toEqual(jasmine.any(Object));
            });

            it("support number preferences", () => {
                const pref = new Wirecloud.UserPref(
                    new Wirecloud.UserPrefDef({name: "pref", type: "text"}),
                    false,
                    false,
                    5
                );
                expect(pref.getInterfaceDescription()).toEqual(jasmine.any(Object));
            });

            it("support list preferences", () => {
                const pref = new Wirecloud.UserPref(
                    new Wirecloud.UserPrefDef({
                        name: "pref",
                        type: "list",
                        options: [
                            {value: 1, label: "one"}
                        ]
                    }),
                    false,
                    false,
                    5
                );
                expect(pref.getInterfaceDescription()).toEqual(jasmine.any(Object));
            });

        });

    });

})();
