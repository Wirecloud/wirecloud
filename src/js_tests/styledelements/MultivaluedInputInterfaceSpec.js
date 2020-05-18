/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements */


(function (se) {

    "use strict";

    describe("Styled MultivaluedInputInterface", () => {

        var dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        describe("new MultivaluedInputInterface(fieldId, description)", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.MultivaluedInputInterface("list", {});  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("requires fieldId and description parameters", () => {
                expect(() => {
                    new se.MultivaluedInputInterface();
                }).toThrowError(TypeError);
            });

            it("should work by providing the minimum details", () => {
                let field = new se.MultivaluedInputInterface("list", {});
                expect(field.id).toBe("list");
                expect(field).toEqual(jasmine.any(se.InputInterface));
                expect(field.entries).toEqual([{
                    addRowButton: jasmine.any(se.Button),
                    removeRowButton: jasmine.any(se.Button),
                    wrapper: jasmine.anything(),
                    form: jasmine.any(se.Form)
                }]);
            });

        });

        describe("clear()", () => {

            it("should work on empty fields", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                expect(field.clear()).toBe(field);

                expect(field.entries).toEqual([]);
            });

        });

        describe("parse(text)", () => {

            it("should parse arrays from string", () => {
                expect(se.MultivaluedInputInterface.parse("[]")).toEqual([]);
            });

        });

        describe("getValue()", () => {

            it("should work on empty fields", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                expect(field.getValue()).toEqual([{}]);
            });

        });

        describe("_setValue(newValue)", () => {

            it("should support null values", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                expect(field._setValue()).toEqual(field);
            });

            it("should support an array of values", () => {
                let field = new se.MultivaluedInputInterface("list", {fields: [{id: "name"}]});

                expect(field._setValue([{name: "a"}])).toEqual(field);
            });

        });

        describe("_setError(error)", () => {

            it("should support null values", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                expect(field._setError()).toEqual(field);
            });

        });

        describe("interface", () => {

            it("should allow to add new entries", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                field.wrapperElement.querySelector('.se-add-item-btn').click();

                expect(field.entries.length).toBe(2);
            });

            it("should allow to remove entries", () => {
                let field = new se.MultivaluedInputInterface("list", {});

                field.wrapperElement.querySelector('.se-remove-item-btn').click();
            });

            it("should allow to remove entries", () => {
                let field = new se.MultivaluedInputInterface("list", {});
                field.addEntry({name: 'a'});

                field.wrapperElement.querySelector('.se-remove-item-btn').click();
            });

        });

    });

})(StyledElements);
