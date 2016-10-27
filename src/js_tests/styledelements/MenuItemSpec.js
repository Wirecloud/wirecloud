/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* jshint jasmine:true */
/* globals StyledElements */


(function () {

    "use strict";

    describe("Styled MenuItem", function () {

        var menuItem;

        afterEach(function () {
            menuItem = null;
        });

        describe ("MenuItem(title, handler, context)", function () {
            it("Should be created when no parameters are received", function () {
                menuItem = new StyledElements.MenuItem();
                expect(menuItem).toBeTruthy();
            });

            it("Should be created when only title is set", function () {
                menuItem = new StyledElements.MenuItem("customTitle");
                expect(menuItem).toBeTruthy();
                expect(menuItem.titleElement.textContent).toEqual("customTitle");
            });

            it("Should allow title to be a StyledElement", function () {
                var textArea = new StyledElements.TextArea();
                menuItem = new StyledElements.MenuItem(textArea);

                expect(menuItem).toBeTruthy();
                expect(menuItem.titleElement.innerHTML).toBe("<textarea class=\"se-text-area\"></textarea>");
            });
        });

        describe ("addIconClass(iconClass)", function () {
            var iconClass;
            it("Should add icon", function () {
                menuItem = new StyledElements.MenuItem();
                iconClass = "arrow";

                expect(menuItem.iconElement).toBe(undefined);
                menuItem.addIconClass(iconClass);
                expect(menuItem.iconElement.className).toBe("se-icon " + iconClass);
            });

            it("Should overwrite previous icon", function () {
                menuItem = new StyledElements.MenuItem();
                iconClass = "arrow";
                menuItem.addIconClass(iconClass);
                iconClass = "open";
                menuItem.addIconClass(iconClass);
                expect(menuItem.iconElement.className).toBe("se-icon " + iconClass);
            });
        });

        describe ("setDescription(description)", function () {
            it("Should work with strings", function () {
                menuItem = new StyledElements.MenuItem();
                menuItem.setDescription("Hello World");
                expect(menuItem.descriptionElement).toBeTruthy();
                expect(menuItem.descriptionElement.textContent).toBe("Hello World");
            });

            it("Should work with StyledElements", function () {
                var textArea = new StyledElements.TextArea();
                menuItem = new StyledElements.MenuItem();
                menuItem.setDescription(textArea);

                expect(menuItem.descriptionElement).toBeTruthy();
                expect(menuItem.descriptionElement.innerHTML).toBe("<textarea class=\"se-text-area\"></textarea>");
            });
        });


    });
})();
