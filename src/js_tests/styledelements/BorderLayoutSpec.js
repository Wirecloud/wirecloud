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

    describe("BorderLayout", () => {

        describe("new BorderLayout([options])", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.BorderLayout();  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work without providing any option", () => {
                const layout = new se.BorderLayout();

                expect(layout.north).toEqual(jasmine.any(se.Container));
                expect(layout.east).toEqual(jasmine.any(se.Container));
                expect(layout.south).toEqual(jasmine.any(se.Container));
                expect(layout.west).toEqual(jasmine.any(se.Container));
                expect(layout.center).toEqual(jasmine.any(se.Container));
            });

        });

    });

})(StyledElements);
