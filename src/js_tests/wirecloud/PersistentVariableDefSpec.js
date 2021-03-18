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

    describe("Wirecloud.PersistentVariableDef", () => {

        describe("new Wirecloud.PersistentVariableDef(options)", () => {

            it("throws a TypeError if the options parameter is not provided", () => {

                expect(() => {
                    new Wirecloud.PersistentVariableDef();
                }).toThrowError(TypeError);

            });

            it("throws a TypeError if options is null", () => {

                expect(() => {
                    new Wirecloud.PersistentVariableDef(null);
                }).toThrowError(TypeError);

            });

            it("throws a TypeError if the default option is not a string", () => {

                expect(() => {
                    new Wirecloud.PersistentVariableDef({default: 5});
                }).toThrowError(TypeError);

            });

            it("exposes variable details", () => {

                const meta = new Wirecloud.PersistentVariableDef({
                    name: "prop",
                    type: "text",
                    label: "label content",
                    description: "prop description",
                    multiuser: true,
                    secure: true
                });

                expect(meta.name).toBe("prop");
                expect(meta.type).toBe("text");
                expect(meta.label).toBe("label content");
                expect(meta.description).toBe("prop description");
                expect(meta.multiuser).toBe(true);
                expect(meta.secure).toBe(true);

            });

        });

    });

})();
