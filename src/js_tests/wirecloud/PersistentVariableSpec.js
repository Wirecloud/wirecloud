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

    describe("Wirecloud.PersistentVariable", () => {

        describe("new Wirecloud.PersistentVariable(meta, commiter, readonly, value)", () => {

            it("throws a TypeError exception if meta is not a PersistentVariableDef instance", () => {

                expect(() => {
                    new Wirecloud.PersistentVariable();
                }).toThrowError(TypeError);

            });

            it("exposes variable details", () => {

                const meta = new Wirecloud.PersistentVariableDef({
                    name: "variable",
                    type: "text"
                });
                const commiter = {add: jasmine.createSpy("add")};
                const variable = new Wirecloud.PersistentVariable(
                    meta,
                    commiter,
                    false,
                    "value"
                );

                expect(variable.meta).toBe(meta);
                expect(variable.readonly).toBe(false);
                expect(variable.commiter).toBe(commiter);
                expect(variable.value).toBe("value");
            });

        });

        describe("get()", () => {

            it("returns initial value if not changed", () => {
                const variable = new Wirecloud.PersistentVariable(
                    new Wirecloud.PersistentVariableDef({
                        name: "variable",
                        type: "text"
                    }),
                    null, // commiter
                    false,
                    "value"
                );
                expect(variable.get()).toBe("value");
            });

            it("returns current value", () => {
                const variable = new Wirecloud.PersistentVariable(
                    new Wirecloud.PersistentVariableDef({
                        name: "variable",
                        type: "text"
                    }),
                    {add: jasmine.createSpy("add")}, // commiter
                    false,
                    "value"
                );
                variable.set("new value");
                expect(variable.get()).toBe("new value");
            });

        });

        describe("set(new_value)", () => {

            it("throws an error if the variable is readonly", () => {
                const variable = new Wirecloud.PersistentVariable(
                    new Wirecloud.PersistentVariableDef({
                        name: "variable",
                        type: "text"
                    }),
                    {add: jasmine.createSpy("add")}, // commiter
                    true,
                    "initial"
                );
                expect(() => {
                    variable.set("new value");
                }).toThrowError();
                expect(variable.commiter.add).not.toHaveBeenCalled();
                expect(variable.value).toBe("initial");
            });

            it("updates current value", () => {
                const variable = new Wirecloud.PersistentVariable(
                    new Wirecloud.PersistentVariableDef({
                        name: "variable",
                        type: "text"
                    }),
                    {add: jasmine.createSpy("add")}, // commiter
                    false,
                    "initial"
                );
                variable.set("new value");
                expect(variable.value).toBe("new value");
                expect(variable.commiter.add).toHaveBeenCalledWith("variable", "new value");
            });

        });
    });

})();
