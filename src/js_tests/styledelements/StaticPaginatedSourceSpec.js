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


(function (se) {

    "use strict";

    describe("Static Paginated Sources", function () {

        describe("new StaticPaginatedSource([options])", function () {

            it("can be created without passing any option", function () {
                const element = new se.StaticPaginatedSource();

                expect(element.length).toBe(0);
            });

            it("should support the initialElements option", function () {
                const element = new se.StaticPaginatedSource({
                    initialElements: [
                        {id: 1, name: 'a'},
                        {id: 3, name: 'b'}
                    ]
                });

                expect(element.length).toBe(2);
            });

            it("should support the no paginated mode", function () {
                const entries = [];
                for (let i; i < 40; i++) {
                    entries.push({id: i});
                }

                const element = new se.StaticPaginatedSource({
                    initialElements: entries,
                    pageSize: 0
                });

                expect(element.getCurrentPage()).toEqual(entries);
                expect(element.length).toBe(entries.length);
                expect(element.totalCount).toBe(entries.length);
            });

        });

        describe("addElement(newElement)", function () {

            it("should add the new element", function () {
                const element = new se.StaticPaginatedSource();

                expect(element.addElement({})).toBe(element);
                expect(element.length).toBe(1);

                expect(element.addElement({})).toBe(element);
                expect(element.length).toBe(2);
            });

            it("should work when using the keywords option for filtered elements", function () {
                const element = new se.StaticPaginatedSource({keywords: 'keyword'});

                expect(element.addElement({id: 1, description: 'some text with a keyword inside'})).toBe(element);
                expect(element.length).toBe(1);
            });

            it("should work when using the keywords option for non-filtered elements", function () {
                const element = new se.StaticPaginatedSource({keywords: 'keyword'});

                expect(element.addElement({id: 1, description: 'some text'})).toBe(element);
                expect(element.length).toBe(1);
            });

            it("should update existing elements", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});

                expect(element.addElement({id: "2"})).toBe(element);
                expect(element.length).toBe(1);

                expect(element.addElement({id: "2", type: "test"})).toBe(element);
                expect(element.length).toBe(1);
                expect(element.getElements()).toEqual([{id: "2", type: "test"}]);
            });

            it("should throw an error if the element does not have ID", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});
                expect(function () {element.addElement({});}).toThrow(new Error("The element must have a valid ID"));
            });

            it("should throw an error if ID is null", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});
                expect(function () {element.addElement({id: null});}).toThrow(new Error("The element must have a valid ID"));
            });
        });

        describe("removeElement(element)", function () {
            it("should remove the element", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});

                expect(element.addElement({id: "1", doesntMatter: "true"})).toBe(element);
                expect(element.length).toBe(1);

                expect(element.addElement({id: "2"})).toBe(element);
                expect(element.length).toBe(2);

                expect(element.removeElement({id: "1"})).toBe(element);
                expect(element.length).toBe(1);
                expect(element.getElements()).toEqual([{id: "2"}]);
            });

            it("should throw an error if the element does not exist", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});

                expect(function () {element.removeElement({id: "1"});}).toThrow(new Error("Element does not exist"));
            });

            it("should throw an error if options.idAttr is not set", function () {
                const element = new se.StaticPaginatedSource();
                expect(function () {element.removeElement({id: "1"});}).toThrow(new Error("options.idAttr is not set"));
            });

            it("should throw an error if the element does not have ID", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});
                expect(function () {element.removeElement({});}).toThrow(new Error("The element must have a valid ID"));
            });
        });

        describe("changeElement(newElements)", function () {

            const basicChangeElementTest = function basicChangeElementTest(element) {
                const entries = [];
                for (let i; i < 40; i++) {
                    entries.push({id: i});
                }

                expect(element.changeElements(entries)).toBe(element);
                expect(element.getCurrentPage()).toEqual(entries);
                expect(element.getElements()).toEqual(entries);
                expect(element.length).toBe(entries.length);
            };

            it("should work when idAttr is set", function () {
                const element = new se.StaticPaginatedSource({idAttr: "id"});
                basicChangeElementTest(element);
            });

            it("should work when idAttr is not set", function () {
                const element = new se.StaticPaginatedSource();
                basicChangeElementTest(element);
            });

            it("should discard previous elements", function () {
                const entries = [];
                for (let i; i < 40; i++) {
                    entries.push({id: i});
                }

                const element = new se.StaticPaginatedSource({initialElements: entries});

                const new_entries = [{id: 41}];
                expect(element.changeElements(new_entries)).toBe(element);
                expect(element.getCurrentPage()).toEqual(new_entries);
                expect(element.getElements()).toEqual(new_entries);
                expect(element.length).toBe(new_entries.length);
            });

            it("should maintain previous options", function () {
                const entries = [];
                for (let i; i < 40; i++) {
                    entries.push({id: i});
                }

                const element = new se.StaticPaginatedSource({
                    initialElements: entries,
                    keywords: 'keyword',
                    order: ['-id']
                });

                const entry1 = {id: 41, description: 'keyword'};
                const entry2 = {id: 40, description: 'keyword'};
                const entry3 = {id: 42, description: 'keyword'};
                const entry4 = {id: 39, description: ''};
                const new_entries = [entry1, entry2, entry3, entry4];
                expect(element.changeElements(new_entries)).toBe(element);
                expect(element.getCurrentPage()).toEqual([entry3, entry1, entry2]);
                expect(element.getElements()).toEqual(new_entries);
                expect(element.length).toBe(new_entries.length);
                expect(element.totalCount).toBe(3);
            });

            it("should not allow repeated elements", function () {
                const entries = [];
                for (let i; i < 10; i++) {
                    entries.push({id: i});
                }

                const element = new se.StaticPaginatedSource({initialElements: entries, idAttr: "id"});

                const new_entries = [{id: 1}, {id: 1}];
                expect(function () {element.changeElements(new_entries);}).toThrow(new Error("All elements must have an unique ID"));
                expect(element.getCurrentPage()).toEqual(entries);
                expect(element.getElements()).toEqual(entries);
                expect(element.length).toBe(entries.length);
            });

            it("should throw an error if any element does not have an ID", function () {
                const entries = [{id: "valido"}, {}];
                const element = new se.StaticPaginatedSource({idAttr: "id"});
                expect(function () {element.changeElements(entries);}).toThrow(new Error("All elements must have a valid ID"));
            });

        });

        describe("changeOptions(options)", function () {

            it("should allow to change the keywords option", function () {
                const element = new se.StaticPaginatedSource({
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
                expect(element.totalCount).toBe(2);
            });

            it("should allow to change the order option", function () {
                const entry1 = {
                    id: {
                        vendor: 'B',
                        name: 'entry1',
                        version: '1.0'
                    },
                    description: 'some text with a keyword inside'
                };
                const entry2 = {
                    id: {
                        vendor: 'C',
                        name: 'entry2',
                        version: '1.1'
                    },
                    description: 'some text with a keyword inside'
                };
                const entry3 = {
                    id: {
                        vendor: 'A',
                        name: 'entry3',
                        version: '1.2'
                    },
                    description: 'some text with a keyword inside'
                };

                const element = new se.StaticPaginatedSource({
                    initialElements: [
                        entry1,
                        entry2,
                        entry3
                    ]
                });

                element.changeOptions({order: [['id', 'vendor']]});
                expect(element.getCurrentPage()).toEqual([entry3, entry1, entry2]);
                expect(element.length).toBe(3);
                expect(element.totalCount).toBe(3);
            });

        });

        describe("getElements()", function () {

            it("should allow to change the keywords option", function () {
                const element = new se.StaticPaginatedSource();
                expect(element.getElements()).toEqual([]);
            });

            it("should allow to change the keywords option", function () {
                const entry1 = {id: 1, name: 'a'};
                const entry2 = {id: 3, name: 'b'};
                const element = new se.StaticPaginatedSource({
                    initialElements: [entry1, entry2]
                });
                expect(element.getElements()).toEqual([entry1, entry2]);
            });

        });

    });

})(StyledElements);
