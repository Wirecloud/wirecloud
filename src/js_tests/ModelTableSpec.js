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

    describe("Styled ModelTable", function () {

        var dom = null, table = null;

        var create_basic_field_test = function create_basic_field_test(label, value, expected) {
            it(label, function () {
                // Create and push the data
                var data = [
                    {test: value}
                ];
                table.source.changeElements(data);

                expect(table.columnsCells[0][0].innerHTML).toBe(expected);
            });
        };

        var create_sort_test = function create_sort_test(label, values, expected) {

            if (values.length !== expected.length) {
                throw new TypeError();
            }

            it(label, function () {

                var data, observed;

                // Create and push the data
                data = values.map(function (value) {return {test: value};});
                table.source.changeElements(data);

                // Check if data was sorted correctly
                observed = table.columnsCells[0].map(function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(expected);

                // Change the sort order
                table.pSortByColumn(0, true);
                expected.reverse();

                // Check if data was sorted correctly
                observed = table.columnsCells[0].map(function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(expected);

            });
        };

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
            table = null;
        });

        it("can be created using the minimal required info", function () {
            var columns = [
                {field: "test", type: "string"}
            ];

            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            expect(table).not.toBe(null);
        });

        it("can be created providing exta CSS classes", function () {
            var columns = [
                {field: "test", type: "string"}
            ];

            var options = {
                class: "my-css-class"
            };

            // Create a new table
            table = new StyledElements.ModelTable(columns, options);

            expect(table.wrapperElement.classList.contains('my-css-class')).toBeTruthy();
        });

        it("can be created providing exta CSS classes for the columns", function () {
            var columns = [
                {field: "test", type: "string", class: "my-css-class"}
            ];

            var options = {
                class: "my-css-class"
            };

            // Create a new table
            table = new StyledElements.ModelTable(columns, options);

            // Create and push the data
            var data = [
                {test: "Hello"},
                {test: "world"}
            ];
            table.source.changeElements(data);
            table.columnsCells[0].forEach(function (cell) {
                expect(cell.classList.contains('my-css-class')).toBeTruthy();
            });
        });

        it("can be created using the initialSortColumn option", function () {

            var columns = [
                {field: "test", type: "string", sortable: true},
                {field: "test2", type: "string", sortable: true}
            ];

            var options = {
                initialSortColumn: "test2"
            };

            // Create a new table
            table = new StyledElements.ModelTable(columns, options);

            // Create and push the data
            var data = [
                {test: "a", test2: "b"},
                {test: "b", test2: "a"}
            ];
            table.source.changeElements(data);

            // Check if data was sorted correctly
            var observed = table.columnsCells[0].map(function (cell) {return cell.innerHTML;});
            expect(observed).toEqual(["b", "a"]);
        });

        it("should handle data added to the data source", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "string"},
                {field: "test2", "label": "TestName", sortable: false, type: "string"}
            ];
            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            // Create and push the data
            var data = [
                {test: "Hello", test2: "world"}
            ];
            var keys = Object.keys(data[0]);
            table.source.changeElements(data);
            table.source.addElement({test: "Bye", test2: "5"});

            var cols = table.columnsCells;

            // Check data was added
            for (var i = 0; i < cols.length; i++) {
                for (var j = 0; j < cols[i].length; j++) {
                    expect(table.columnsCells[i][j].innerHTML).toBe(data[j][keys[i]]);
                }
            }
        });

        describe("should handle number fields", function () {
            var columns = [
                {field: "test", sortable: true, type: "number"}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);
            });

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('integer values should be handled correctly', 3, "3");
            create_basic_field_test('float values should be handled correctly', 3.3, "3.3");
            create_basic_field_test('string values should be handled correctly', "5", "5");
            create_basic_field_test('number 0 should not be treated as no value', 0, "0");
            create_sort_test('should be sortable', [1, "3", null, 2], ["", "1", "2", "3"]);
        });

        describe("should handle number fields using the unit option", function () {
            var columns = [
                {field: "test", sortable: true, type: "number", unit: "ºC"}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);
            });

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('integer values should be handled correctly', 3, "3 ºC");
            create_basic_field_test('float values should be handled correctly', 3.3, "3.3 ºC");
            create_basic_field_test('string values should be handled correctly', "5", "5 ºC");
            create_basic_field_test('number 0 should not be treated as no value', 0, "0 ºC");
            create_sort_test('should be sortable', [1, "3", null, 2], ["", "1 ºC", "2 ºC", "3 ºC"]);
        });

        describe("should handle string fields", function () {
            var columns = [
                {field: "test", sortable: true, type: "string"}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);
            });

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('integer values should be handled correctly', 5, "5");
            create_basic_field_test('float values should be handled correctly', 5.5, "5.5");
            create_basic_field_test('string values should be handled correctly', "hello world!!", "hello world!!");
            create_sort_test('should be sortable', ["a", 5, null, "c", "b"], ["", "5", "a", "b", "c"]);
        });

        describe("should handle date fields", function () {
            var columns = [
                {field: "test", sortable: true, type: "date"}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);

                var baseTime = new Date(2016, 4, 14);
                jasmine.clock().mockDate(baseTime);
            });

            var date3 = 1359590400000;
            var date3_rendered = "<span>3 years ago</span>";
            var date2 = new Date(1330387200000);
            var date2_rendered = "<span>4 years ago</span>";
            var date1 = "2011-02-20T00:00:00.000Z";
            var date1_rendered = "<span>5 years ago</span>";

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('timestamps should be handled correctly', date1, date1_rendered);
            create_basic_field_test('date instances should be handled correctly', date2, date2_rendered);
            create_basic_field_test('string should be handled correctly', date2, date2_rendered);
            create_sort_test('should be sortable', [date2, null, date1, date3], ["", date1_rendered, date2_rendered, date3_rendered]);
        });

        describe("", function () {

            var dateParser = function dateParser (date) {
                return new Date(date);
            };

            var columns = [
                {field: "test", sortable: true, type: "date", dateparser: dateParser}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);
                var baseTime = new Date(2016, 4, 14);
                jasmine.clock().mockDate(baseTime);
            });

            var date1 = "2011-02-20T00:00:00.000Z";
            var date1_rendered = "<span>5 years ago</span>";

            create_basic_field_test('should accept custom date parsing functions', date1, date1_rendered);
        });

        describe("should handle element selection", function () {

            beforeEach(function () {
                var columns = [
                    {field: "id", type: "number"},
                    {field: "test", type: "number"}
                ];

                // Create a new table
                table = new StyledElements.ModelTable(columns, {id: 'id'});

                // Create and push the data
                var data = [
                    {id: 0, test: "hello world"},
                    {id: 1, test: "bye world"},
                    {id: 2, test: "other world"}
                ];
                table.source.changeElements(data);
            });

            it ("should allow simple selections", function () {
                expect(table.select(1)).toBe(table);
                expect(table.selection).toEqual([1]);
                // Check model table highlited the correct row
                for (var key in table._current_elements) {
                    var highlited = table._current_elements[key].row.classList.contains('highlight');
                    expect(highlited).toBe(key === "1");
                }
            });

            it ("should allow multiple selections", function () {
                expect(table.select([1, 2])).toBe(table);
                expect(table.selection).toEqual([1, 2]);
                // Check model table highlited the correct rows
                for (var key in table._current_elements) {
                    var highlited = table._current_elements[key].row.classList.contains('highlight');
                    expect(highlited).toBe(["1", "2"].indexOf(key) !== -1);
                }
            });

            it ("should allow cleaning selections", function () {
                expect(table.select(1)).toBe(table);
                expect(table.select()).toBe(table);
                expect(table.selection).toEqual([]);
                // Check model table unhighlight the previously selected rows
                for (var key in table._current_elements) {
                    expect(table._current_elements[key].row.classList.contains('highlight')).toBeFalsy();
                }
            });

            it ("should ignore not matching ids", function () {
                expect(table.select(4)).toBe(table);
                expect(table.selection).toEqual([4]);
                // Check model table doesn't highlight any row
                for (var key in table._current_elements) {
                    expect(table._current_elements[key].row.classList.contains('highlight')).toBeFalsy();
                }
            });

        });

        it("Model table should be able to get reset", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];

            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            // Create and push the data
            var data = [
                {test: "hello world"}
            ];
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("hello world");

            // Wipe the data
            table.source.changeElements();

            expect(table.columnsCells[0].length).toBe(0);
        });

        it("Destroy model table", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            // Default options
            var options = {};
            // Create the table
            table = new StyledElements.ModelTable(columns, options);

            // Create and push the data
            var data = [
                {test: "hello world"}
            ];
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("hello world");

            // Wipe the data
            table.destroy();

            expect(table.columnsCells[0].length).toBe(0);
            expect(table.layout).toBe(null);
            expect(table.source).toBe(null);
        });
    });

})();
