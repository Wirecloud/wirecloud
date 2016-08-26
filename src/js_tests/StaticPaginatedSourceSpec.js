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


(function (se) {

    "use strict";

    describe("Static Paginated Sources", function () {

        describe("new StaticPaginatedSource([options])", function () {

            it("can be created without passing any option", function () {
                var element = new se.StaticPaginatedSource();

                expect(element.length).toBe(0);
            });

            it("should support the initialElements option", function () {
                var element = new se.StaticPaginatedSource({
                    initialElements: [
                        {id: 1, name: 'a'},
                        {id: 3, name: 'b'}
                    ]
                });

                expect(element.length).toBe(2);
            });

            it("should support the no paginated mode", function () {
                var entries = [];
                for (var i; i < 40; i++) {
                    entries.push({id: i});
                }

                var element = new se.StaticPaginatedSource({
                    initialElements: entries,
                    pageSize: 0
                });

                expect(element.getCurrentPage()).toEqual(entries);
                expect(element.length).toBe(entries.length);
            });

        });

        describe("addElement(newElement)", function () {

            it("should add the new element", function () {
                var element = new se.StaticPaginatedSource();

                expect(element.addElement({})).toBe(element);
                expect(element.length).toBe(1);
            });

            it("should work when using the keywords option for filtered elements", function () {
                var element = new se.StaticPaginatedSource({keywords: 'keyword'});

                expect(element.addElement({id: 1, description: 'some text with a keyword inside'})).toBe(element);
                expect(element.length).toBe(1);
            });

            it("should work when using the keywords option for non-filtered elements", function () {
                var element = new se.StaticPaginatedSource({keywords: 'keyword'});

                expect(element.addElement({id: 1, description: 'some text'})).toBe(element);
                expect(element.length).toBe(1);
            });

        });

        describe("changeElement(newElements)", function () {

            it("should discard previous elements", function () {
                var entries = [];
                for (var i; i < 40; i++) {
                    entries.push({id: i});
                }

                var element = new se.StaticPaginatedSource({initialElements: entries});

                var new_entries = [{id: 41}];
                expect(element.changeElements(new_entries)).toBe(element);
                expect(element.getCurrentPage()).toEqual(new_entries);
                expect(element.getElements()).toEqual(new_entries);
                expect(element.length).toBe(new_entries.length);
            });

            it("should maintain previous options", function () {
                var entries = [];
                for (var i; i < 40; i++) {
                    entries.push({id: i});
                }

                var element = new se.StaticPaginatedSource({
                    initialElements: entries,
                    keywords: 'keyword',
                    order: ['-id']
                });

                var entry1 = {id: 41, description: 'keyword'};
                var entry2 = {id: 40, description: 'keyword'};
                var entry3 = {id: 42, description: 'keyword'};
                var entry4 = {id: 39, description: ''};
                var new_entries = [entry1, entry2, entry3, entry4];
                expect(element.changeElements(new_entries)).toBe(element);
                expect(element.getCurrentPage()).toEqual([entry3, entry1, entry2]);
                expect(element.getElements()).toEqual(new_entries);
                expect(element.length).toBe(new_entries.length);
            });

        });

        describe("changeOptions(options)", function () {

            it("should allow to change the keywords option", function () {
                var element = new se.StaticPaginatedSource({
                    initialElements: [
                        {id: 1, description: 'some text with a keyword inside', enabled: true},
                        {id: 2, description: 'some text', enabled: false},
                        {id: 3, description: '', enabled: false},
                        {id: 4, description: false, enabled: 'keywords'},
                    ]
                });

                element.changeOptions({keywords: 'keyword'});
                expect(element.getCurrentPage().length).toBe(2);
                expect(element.length).toBe(4);
            });

            it("should allow to change the order option", function () {
                var entry1 = {
                    id: {
                        vendor: 'B',
                        name: 'entry1',
                        version: '1.0'
                    },
                    description: 'some text with a keyword inside'
                };
                var entry2 = {
                    id: {
                        vendor: 'C',
                        name: 'entry2',
                        version: '1.1'
                    },
                    description: 'some text with a keyword inside'
                };
                var entry3 = {
                    id: {
                        vendor: 'A',
                        name: 'entry3',
                        version: '1.2'
                    },
                    description: 'some text with a keyword inside'
                };

                var element = new se.StaticPaginatedSource({
                    initialElements: [
                        entry1,
                        entry2,
                        entry3
                    ]
                });

                element.changeOptions({order: [['id', 'vendor']]});
                expect(element.getCurrentPage()).toEqual([entry3, entry1, entry2]);
                expect(element.length).toBe(3);
            });

        });

        describe("getElements()", function () {

            it("should allow to change the keywords option", function () {
                var element = new se.StaticPaginatedSource();
                expect(element.getElements()).toEqual([]);
            });

            it("should allow to change the keywords option", function () {
                var entry1 = {id: 1, name: 'a'};
                var entry2 = {id: 3, name: 'b'};
                var element = new se.StaticPaginatedSource({
                    initialElements: [entry1, entry2]
                });
                expect(element.getElements()).toEqual([entry1, entry2]);
            });

        });

    });

})(StyledElements);
