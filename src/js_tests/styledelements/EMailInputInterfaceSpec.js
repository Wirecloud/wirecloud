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

    describe("EMailInputInterface", () => {

        let dom = null;

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

        describe("new EMailInputInterface(fieldId, description)", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.EMailInputInterface("pass", {});  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("requires fieldId and description parameters", () => {
                expect(() => {
                    new se.EMailInputInterface();
                }).toThrowError(TypeError);
            });

            it("should work by providing the minimum details", () => {
                const field = new se.EMailInputInterface("email", {});
                expect(field.id).toBe("email");
                expect(field).toEqual(jasmine.any(se.InputInterface));
            });

        });

    });

})(StyledElements);
