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

        var create_basic_field_test = function create_basic_field_test(label, value, expected, custom_conf) {
            it(label, function () {

                if (custom_conf) {
                    table = new StyledElements.ModelTable(custom_conf);
                }

                // Create and push the data
                var data = [
                    {test: value}
                ];
                table.source.changeElements(data);
                var cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
                expect(cell.innerHTML).toBe(expected);
            });
        };

        var create_sort_test = function create_sort_test(label, values, expected) {

            if (values.length !== expected.length) {
                throw new TypeError();
            }

            it(label, function () {

                var cell, column, data, observed;

                // Create and push the data
                data = values.map(function (value) {return {test: value};});
                table.source.changeElements(data);

                // Check if data was sorted correctly
                column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
                observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(expected);

                // Change the sort order
                cell = table.wrapperElement.querySelector(".se-model-table-headrow .se-model-table-cell");
                cell.click();
                expected.reverse();

                // Check if data was sorted correctly
                column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
                observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
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

            var column = table.wrapperElement.querySelectorAll(".my-css-class");
            expect(column.length).toBe(3); // 1 header + 2 rows
        });

        it("can be created with custom cell width", function () {
            var columns = [
                {field: "test", type: "string", width: "100px"}
            ];

            var options = {
                initialSortColumn: "test2"
            };

            table = new StyledElements.ModelTable(columns, options);

            // Create and push the data
            var data = [
                {test: "Hello"},
                {test: "world"}
            ];
            table.source.changeElements(data);

            var column = table.wrapperElement.querySelectorAll(".se-model-table-cell");

            expect(column.length).toBe(3);
            for (var i = 0; i < column.length; i++) {
                expect(column[i].style.width).toBe("100px");
            }

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
            var column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
            var observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
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

            var cols = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");

            // Check data was added
            for (var i = 0; i < 2; i++) { // 2 columns
                for (var j = 0; j < 2; j++) { // 2 Rows
                    expect(cols[j + 2 * i].innerHTML).toBe(data[i][keys[j]]);
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

            var dateParser = function dateParser (date) {
                return new Date(date);
            };

            var dateparser_columns = [
                {field: "test", sortable: true, type: "date", dateparser: dateParser}
            ];

            beforeEach(function () {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);

                var baseTime = new Date(1463184000000); // new Date(2016, 4, 14);
                jasmine.clock().install();
                jasmine.clock().mockDate(baseTime);
            });

            afterEach(function () {
                jasmine.clock().uninstall();
            });

            var date3 = 1359590400000;
            var date3_rendered = "<span>3 years ago</span>";
            var date2 = new Date(1330387200000);
            var date2_rendered = "<span>4 years ago</span>";
            var date1 = "2011-02-20T00:00:05.000Z";
            var date1_rendered = "<span>5 years ago</span>";

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('timestamps should be handled correctly', date1, date1_rendered);
            create_basic_field_test('date instances should be handled correctly', date2, date2_rendered);
            create_basic_field_test('string should be handled correctly', date2, date2_rendered);
            create_basic_field_test('should accept custom date parsing functions', date1, date1_rendered, dateparser_columns);
            create_sort_test('should be sortable', [date2, null, date1, date3], ["", date1_rendered, date2_rendered, date3_rendered]);

            it("should update date columns", function () {

                var date_base = "2016-05-14T00:00:00.000Z";
                var initial_expected = "<span>a few seconds ago</span>";
                var expected = "<span>a minute ago</span>";
                var data = [
                    {test: date_base}
                ];

                table.source.changeElements(data);
                var col = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");

                expect(col.innerHTML).toBe(initial_expected);

                jasmine.clock().tick(61000);

                expect(col.innerHTML).toBe(expected);

            });
        });

        describe("should handle element selection", function () {
            var expected, observed, rows;
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

                // Check if css are applied properly
                expected = [false, true, false];
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});

                expect(observed).toEqual(observed);
            });

            it ("should allow multiple selections", function () {
                expect(table.select([1, 2])).toBe(table);
                expect(table.selection).toEqual([1, 2]);

                // Check if css are applied properly
                expected = [false, true, true];
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});

                expect(observed).toEqual(observed);
            });

            it ("should allow cleaning selections", function () {
                expect(table.select(1)).toBe(table);
                expect(table.select()).toBe(table);
                expect(table.selection).toEqual([]);

                // Check if css are applied properly
                expected = [false, false, false];
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(observed);
            });

            it ("should ignore not matching ids", function () {
                expect(table.select(4)).toBe(table);
                expect(table.selection).toEqual([4]);

                // Check if css are applied properly
                expected = [false, false, false];
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(observed);
            });
        });

        it("Should handle row's content builder", function () {
            var rows;
            var contentBuilder = function contentBuilder (el) {
                return "hello " + el.test;
            };

            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number", contentBuilder: contentBuilder}
            ];
            var data = [
                {test: 0},
                {test: 1},
                {test: 2}
            ];

            // Create a new table
            table = new StyledElements.ModelTable(columns, {});
            table.source.changeElements(data);

            rows = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");
            for (var i = 0; i < rows.length; i++) {
                expect(rows[i].innerHTML).toBe("hello " + i);
            }
        });

        it("Should handle state functions", function () {
            var rows;
            var stateFunc = function stateFunc (el) {
                if (el.test >= 2) {
                    return "success";
                } else {
                    return "warning";
                }
            };

            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            var data = [
                {test: 0},
                {test: 1},
                {test: 2}
            ];

            // Create a new table
            table = new StyledElements.ModelTable(columns, {stateFunc: stateFunc});
            table.source.changeElements(data);

            rows = table.wrapperElement.querySelectorAll(".se-model-table-row-success");
            expect(rows.length).toBe(1);

            rows = table.wrapperElement.querySelectorAll(".se-model-table-row-warning");
            expect(rows.length).toBe(2);
        });

        it("Model table should be able to get reset", function () {
            var cell;
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

            cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
            expect(cell.innerHTML).toBe("hello world");

            // Wipe the data
            table.source.changeElements();

            cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
            expect(cell).toBe(null);
        });

        it("Destroy model table", function () {
            var cell;
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

            cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
            expect(cell.innerHTML).toBe("hello world");

            // Wipe the data
            table.destroy();

            cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
            expect(cell).toBe(null);
        });
    });

})();
