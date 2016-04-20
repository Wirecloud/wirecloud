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

    describe("Styled Notebook", function () {
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

        it("should add a new tab", function () {
            var element = new StyledElements.Notebook();
            var tab1 = element.createTab();
            var tab2 = element.createTab();

            expect(element.tabs).toEqual([tab1, tab2]);
            expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.tabElement);
            expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.tabElement);
        });

        it("should add a new tab when add button exists", function () {
            var element = new StyledElements.Notebook();

            element.addEventListener('newTab', function () {});

            var tab = element.createTab();
            var btnCreate = element.new_tab_button_tabs;

            expect(element.tabs).toEqual([tab]);
            expect(element.tabArea.wrapperElement.children[0]).toBe(tab.tabElement);
            expect(element.tabArea.wrapperElement.children[1]).toBe(btnCreate.wrapperElement);
        });
    });

})();
