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

/* globals StyledElements, Wirecloud */

(function (ns, se) {

    "use strict";

    describe("TutorialSubMenu", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.TutorialCatalogue = {
                tutorials: [
                    {label: "tutorial1", start: function () {}}
                ]
            };
        });

        describe("new TutorialSubMenu()", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.TutorialSubMenu();  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work without passing any parameter", () => {
                new ns.TutorialSubMenu();
            });

        });

    });

})(Wirecloud.ui, StyledElements);
