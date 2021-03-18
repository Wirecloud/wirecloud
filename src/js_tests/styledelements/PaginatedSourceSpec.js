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

/* globals StyledElements */


(function () {

    "use strict";

    describe("Paginated source", function () {
        let paginatedSource;
        let elements;

        afterEach(function () {
            paginatedSource.goToFirst();
        });

        describe("PaginatedSource(options)", function () {
            it("Should be created with default options", function () {
                // We need to use its child as base or we cant check if the pagination is working
                // as the base has no elements
                paginatedSource = new StyledElements.StaticPaginatedSource();
                elements = [1, 2, 3, 4, 5];
                paginatedSource.changeElements(elements);
                expect(paginatedSource).toBeTruthy();
                expect(paginatedSource.totalPages).toBe(1);
            });

            it("Should be created with custom options", function () {
                paginatedSource = new StyledElements.StaticPaginatedSource({pageSize: 2});
                elements = [1, 2, 3, 4, 5];
                paginatedSource.changeElements(elements);
                expect(paginatedSource).toBeTruthy();
                expect(paginatedSource.totalPages).toBe(3);
            });
        });

        describe("changePage(index)", function () {
            it("Should go to target page", function () {
                paginatedSource.changePage(2);
                expect(paginatedSource.getCurrentPage()).toEqual([3, 4]);
                paginatedSource.changePage(200); // If the index its to high, goes to the last page
                expect(paginatedSource.getCurrentPage()).toEqual([5]);
            });
        });

        describe("getCurrentPage()", function () {
            it("Should return current page", function () {
                expect(paginatedSource.getCurrentPage()).toEqual([1, 2]);
            });
        });
        describe("goToNext()", function () {
            it("Should go to the next page", function () {
                paginatedSource.goToNext();
                expect(paginatedSource.getCurrentPage()).toEqual([3, 4]);
            });
        });
        describe("goToPrevious()", function () {
            it("Should go to the previous page", function () {
                paginatedSource.goToPrevious();
                expect(paginatedSource.getCurrentPage()).toEqual([1, 2]);
            });
        });
        describe("goToLast()", function () {
            it("Should go to the last page", function () {
                paginatedSource.goToLast();
                expect(paginatedSource.getCurrentPage()).toEqual([5]);
            });
        });
        describe("goToFirst()", function () {
            it("Should go to the first page", function () {
                paginatedSource.goToFirst();
                expect(paginatedSource.getCurrentPage()).toEqual([1, 2]);
            });
        });

        describe("changeOptions(newOptions)", function () {
            it("Should change pageSize", function () {
                paginatedSource.goToFirst();
                paginatedSource.changeOptions({pageSize: 1});
                expect(paginatedSource.getCurrentPage()).toEqual([1]);
            });
        });
    });
})();
