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

    describe("Alert", () => {

        describe("new Alert([options])", () => {

            it("is a class constructor", () => {
                expect(() => {
                    se.Alert();  // eslint-disable-line new-cap
                }).toThrowError(TypeError);
            });

            it("should work without providing any option", () => {
                const element = new se.Alert();

                expect(element.heading).toEqual(jasmine.any(se.Container));
                expect(element.body).toEqual(jasmine.any(se.Container));
            });

            it("should allow changing the message", () => {
                const element = new se.Alert();
                element.setMessage("New message");

                expect(element.body.wrapperElement.textContent).toEqual("New message");
            });

            it("should allow to show and hide the alert", () => {
                const element = new se.Alert();
                element.hide();

                expect(element.wrapperElement.style.display).toEqual("none");

                element.show();
                expect(element.wrapperElement.style.display).toEqual("");
            });

        });

    });

})(StyledElements);
