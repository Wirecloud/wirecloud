/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements*/


(function (se) {

    "use strict";

    describe("Styled ModelTable", () => {

        let dom = null, table = null;

        const create_basic_field_test = function create_basic_field_test(label, value, expected, custom_conf) {
            it(label, () => {

                if (custom_conf) {
                    table = new StyledElements.ModelTable(custom_conf);
                }

                // Create and push the data
                const data = [
                    {test: value}
                ];
                table.source.changeElements(data);
                const cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
                expect(cell.innerHTML).toBe(expected);
            });
        };

        const create_sort_test = function create_sort_test(label, values, expected) {

            if (values.length !== expected.length) {
                throw new TypeError();
            }

            it(label, () => {
                let column, observed;

                // Create and push the data
                const data = values.map(function (value) {return {test: value};});
                table.source.changeElements(data);

                // Check if data was sorted correctly
                column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
                observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(expected);

                // Change the sort order
                const cell = table.wrapperElement.querySelector(".se-model-table-headrow .se-model-table-cell");
                cell.click();
                expected.reverse();

                // Check if data was sorted correctly
                column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
                observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(expected);

            });
        };

        beforeEach(() => {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(() => {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
            table = null;
        });

        describe("new ModelTable(columns, [options])", () => {

            it("can be created using the minimal required info", () => {
                const columns = [
                    {field: "test", type: "string"}
                ];

                // Create a new table using the default options
                table = new StyledElements.ModelTable(columns);

                expect(table).not.toBe(null);
                expect(table.statusBar).toEqual(jasmine.any(se.Container));
            });

            it("can be created providing exta CSS classes", () => {
                const columns = [
                    {field: "test", type: "string"}
                ];

                const options = {
                    class: "my-css-class"
                };

                // Create a new table
                table = new StyledElements.ModelTable(columns, options);

                expect(table.wrapperElement.classList.contains('my-css-class')).toBeTruthy();
            });

            it("can be created providing exta CSS classes for the columns", () => {
                const columns = [
                    {field: "test", type: "string", class: "my-css-class"}
                ];

                const options = {
                    class: "my-css-class"
                };

                // Create a new table
                table = new StyledElements.ModelTable(columns, options);

                // Create and push the data
                const data = [
                    {test: "Hello"},
                    {test: "world"}
                ];
                table.source.changeElements(data);

                const column = table.wrapperElement.querySelectorAll(".my-css-class");
                expect(column.length).toBe(3); // 1 header + 2 rows
            });

            it("can be created with custom cell width", () => {
                const columns = [
                    {field: "test", type: "string", width: "100px"}
                ];

                const options = {
                    initialSortColumn: "test2"
                };

                table = new StyledElements.ModelTable(columns, options);

                // Create and push the data
                const data = [
                    {test: "Hello"},
                    {test: "world"}
                ];
                table.source.changeElements(data);

                const column = table.wrapperElement.querySelectorAll(".se-model-table-cell");
                const tablebody = table.wrapperElement.querySelector(".se-model-table-body");

                expect(column.length).toBe(3);
                expect(tablebody.style.gridTemplateColumns).toBe("100px");
            });

            it("can be created using the initialSortColumn option", () => {

                const columns = [
                    {field: "test", type: "string", sortable: true},
                    {field: "test2", type: "string", sortable: true}
                ];

                const options = {
                    initialSortColumn: "test2"
                };

                // Create a new table
                table = new StyledElements.ModelTable(columns, options);

                // Create and push the data
                const data = [
                    {test: "a", test2: "b"},
                    {test: "b", test2: "a"}
                ];
                table.source.changeElements(data);

                // Check if data was sorted correctly
                const column = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell:first-child");
                const observed = Array.prototype.map.call(column, function (cell) {return cell.innerHTML;});
                expect(observed).toEqual(["b", "a"]);
            });

        });

        it("should handle data added to the data source", () => {
            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "string"},
                {field: "test2", "label": "TestName", sortable: false, type: "string"}
            ];
            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            // Create and push the data
            const data = [
                {test: "Hello", test2: "world"}
            ];
            const keys = Object.keys(data[0]);
            table.source.changeElements(data);
            table.source.addElement({test: "Bye", test2: "5"});

            const cols = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");

            // Check data was added
            for (let i = 0; i < 2; i++) { // 2 columns
                for (let j = 0; j < 2; j++) { // 2 Rows
                    expect(cols[j + 2 * i].innerHTML).toBe(data[i][keys[j]]);
                }
            }
        });

        it("should handle errors retrieving data", () => {
            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "string"},
                {field: "test2", "label": "TestName", sortable: false, type: "string"}
            ];
            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            // Simulate an error
            table.source.events.requestEnd.dispatch(table.source, "Connection Error");

            const alert = table.wrapperElement.querySelectorAll(".se-model-table-msg");
            expect(alert).not.toEqual(null);
        });

        describe("should handle number fields", () => {
            const columns = [
                {field: "test", sortable: true, type: "number"}
            ];

            beforeEach(() => {
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

        describe("should handle number fields using the unit option", () => {
            const columns = [
                {field: "test", sortable: true, type: "number", unit: "ºC"}
            ];

            beforeEach(() => {
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

        describe("should handle string fields", () => {
            const columns = [
                {field: "test", sortable: true, type: "string"}
            ];

            beforeEach(() => {
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

        describe("should handle date fields", () => {
            const columns = [
                {field: "test", sortable: true, type: "date"}
            ];

            const dateParser = function dateParser(date) {
                return new Date(date);
            };

            const dateparser_columns = [
                {field: "test", sortable: true, type: "date", dateparser: dateParser}
            ];

            const calendar_dates = [
                {field: "test", sortable: true, type: "date", format: "calendar"}
            ];

            const customformat_dates = [
                {field: "test", sortable: true, type: "date", format: "dddd", tooltip: "none"}
            ];

            beforeEach(() => {
                // Create a new table using the defaults options
                table = new StyledElements.ModelTable(columns);

                const baseTime = new Date(1463184000000); // new Date(2016, 4, 14);
                jasmine.clock().install();
                jasmine.clock().mockDate(baseTime);
            });

            afterEach(() => {
                jasmine.clock().uninstall();
            });

            const date3 = 1359590400000;
            const date3_rendered = "<span>3 years ago</span>";
            const date2 = new Date(1330387200000);
            const date2_rendered = "<span>4 years ago</span>";
            const date1 = "2011-02-20T00:00:05.000Z";
            const date1_rendered = "<span>5 years ago</span>";
            const date1_rendered_calendar = "<span>02/20/2011</span>";
            const date1_rendered_custom = "<span>Sunday</span>";

            create_basic_field_test('null values should be handled correctly', null, "");
            create_basic_field_test('undefined values should be handled correctly', undefined, "");
            create_basic_field_test('timestamps should be handled correctly', date1, date1_rendered);
            create_basic_field_test('timestamps should be handled correctly (calendar format)', date1, date1_rendered_calendar, calendar_dates);
            create_basic_field_test('timestamps should be handled correctly (custom format)', date1, date1_rendered_custom, customformat_dates);
            create_basic_field_test('date instances should be handled correctly', date2, date2_rendered);
            create_basic_field_test('string should be handled correctly', date2, date2_rendered);
            create_basic_field_test('should accept custom date parsing functions', date1, date1_rendered, dateparser_columns);
            create_sort_test('should be sortable', [date2, null, date1, date3], ["", date1_rendered, date2_rendered, date3_rendered]);

            it("should update date columns", () => {

                const date_base = "2016-05-14T00:00:00.000Z";
                const initial_expected = "<span>a few seconds ago</span>";
                const expected = "<span>a minute ago</span>";
                const data = [
                    {test: date_base}
                ];

                table.source.changeElements(data);
                const col = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");

                expect(col.innerHTML).toBe(initial_expected);

                jasmine.clock().tick(61000);

                expect(col.innerHTML).toBe(expected);

            });
        });

        it("should manage sort_id option when sorting", () => {

            const columns = [
                {field: "test1", sort_id: "test1", sortable: true, type: "number"},
                {field: "test2", sortable: false, type: "number"}
            ];

            table = new se.ModelTable(columns);
            table.source.changeElements([
                {test1: 1, test2: 5},
                {test1: 5, test2: 3}
            ]);
            spyOn(table.source, "changeOptions");

            table.wrapperElement.querySelector(".se-model-table-headrow .se-model-table-cell").click();

            expect(table.source.changeOptions).toHaveBeenCalledWith({order: ["-test1"]});
        });

        describe("set selection(value)", () => {

            it("should throw an error if selection is not an array", () => {
                const columns = [
                    {field: "id", type: "number"},
                    {field: "test", type: "number"}
                ];

                // Create a new table
                const table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "multiple"});

                expect(() => {
                    table.selection = 5;
                }).toThrowError(TypeError);
            });

        });

        describe("select(selection)", () => {
            let expected, observed, rows;
            beforeEach(() => {

                const columns = [
                    {field: "id", type: "number"},
                    {field: "test", type: "number"}
                ];

                // Create a new table
                table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "multiple"});

                // Create and push the data
                const data = [
                    {id: 0, test: "hello world"},
                    {id: 1, test: "bye world"},
                    {id: 2, test: "other world"}
                ];
                table.source.changeElements(data);
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
            });

            it("should throw an error if selection is disabled", () => {
                const columns = [
                    {field: "id", type: "number"}
                ];

                // Create a new table
                table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "none"});

                // Create and push the data
                const data = [
                    {id: 0}
                ];
                table.source.changeElements(data);

                expect(() => {table.select(0);}).toThrow(new Error("Selection is disabled"));

            });

            it("should allow single selections", () => {
                expect(table.select(1)).toBe(table);
                expect(table.selection).toEqual([1]);

                // Check if css are applied properly
                expected = [false, true, false];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});

                expect(observed).toEqual(expected);
            });

            it("should throw an error if selection is simple and tries to select more than one row", () => {
                const columns = [
                    {field: "id", type: "number"}
                ];

                // Create a new table
                table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "single"});

                // Create and push the data
                const data = [
                    {id: 0},
                    {id: 1}
                ];
                table.source.changeElements(data);

                expect(() => {table.select([0, 1]);}).toThrow(new Error("Selection is set to \"single\" but tried to select more than one rows."));
            });

            it("should allow multiple selections", () => {
                expect(table.select([1, 2])).toBe(table);
                expect(table.selection).toEqual([1, 2]);

                // Check if css are applied properly
                expected = [false, true, true];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});

                expect(observed).toEqual(expected);
            });

            it("should allow cleaning selections", () => {
                expect(table.select(1)).toBe(table);
                expect(table.select()).toBe(table);
                expect(table.selection).toEqual([]);

                // Check if css are applied properly
                expected = [false, false, false];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(expected);
            });

            it("should ignore not matching ids", () => {
                expect(table.select(4)).toBe(table);
                expect(table.selection).toEqual([4]);

                // Check if css are applied properly
                expected = [false, false, false];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(expected);
            });

        });

        it("Should ignore selection events when selection is disabled", () => {
            const columns = [
                {field: "id", type: "number"},
                {field: "test", type: "number"}
            ];

            // Create a new table
            const table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "none"});

            // Create and push the data
            const data = [
                {id: 0, test: "hello world"},
                {id: 1, test: "bye world"},
                {id: 2, test: "other world"}
            ];
            table.source.changeElements(data);
            const rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
            const cell = rows[0].querySelector(".se-model-table-cell");
            event = new MouseEvent("click");

            cell.dispatchEvent(event);

            expect(table.selection).toEqual([]);
        });

        describe("Should handle mouse to select", () => {
            let expected, observed, rows, cell, event;

            beforeEach(() => {
                const columns = [
                    {field: "id", type: "number"},
                    {field: "test", type: "number"}
                ];

                // Create a new table
                table = new StyledElements.ModelTable(columns, {id: 'id', selectionType: "multiple"});

                // Create and push the data
                const data = [
                    {id: 0, test: "hello world"},
                    {id: 1, test: "bye world"},
                    {id: 2, test: "other world"}
                ];
                table.source.changeElements(data);
                rows = table.wrapperElement.querySelectorAll(".se-model-table-row");
            });

            it("should allow click selections without modifiers", () => {
                cell = rows[0].querySelector(".se-model-table-cell");
                event = new MouseEvent("click");
                cell.dispatchEvent(event);

                // Check if css are applied properly
                expected = [true, false, false];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(expected);

                expect(table.selection).toEqual([0]);
            });

            describe("should allow click selections with control key pressed", () => {

                it("should allow first selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, false, false];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should allow multiple selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    cell = rows[2].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, false, true];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should allow deselect selected rows", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    event = new MouseEvent("click", {ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [false, false, false];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });
            });

            describe("should allow click selections with shift key pressed", () => {
                it("should allow first selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, false, false];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should allow range selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    cell = rows[2].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, true, true];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should overwrite previous selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    cell = rows[1].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {ctrlKey: true});
                    cell.dispatchEvent(event);

                    cell = rows[2].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [false, true, true];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });
            });

            describe("should allow click selections with shift and control keys pressed", () => {
                it("should allow first selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true, ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, false, false];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should allow range selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    cell = rows[2].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true, ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, true, true];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });

                it("should not overwrite previous selection", () => {
                    cell = rows[0].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click");
                    cell.dispatchEvent(event);

                    cell = rows[1].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {ctrlKey: true});
                    cell.dispatchEvent(event);

                    cell = rows[2].querySelector(".se-model-table-cell");
                    event = new MouseEvent("click", {shiftKey: true, ctrlKey: true});
                    cell.dispatchEvent(event);

                    // Check if css are applied properly
                    expected = [true, true, true];
                    observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                    expect(observed).toEqual(expected);
                });
            });

            it("should deselect rows when no row is clicked", () => {
                cell = rows[0].querySelector(".se-model-table-cell");
                event = new MouseEvent("click");
                cell.dispatchEvent(event);

                cell = rows[2].querySelector(".se-model-table-cell");
                event = new MouseEvent("click", {shiftKey: true});
                cell.dispatchEvent(event);


                expected = [true, true, true];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(expected);

                table.wrapperElement.click();

                // Check if css are applied properly
                expected = [false, false, false];
                observed = Array.prototype.map.call(rows, function (row) {return row.classList.contains("highlight");});
                expect(observed).toEqual(expected);

            });

        });


        it("Should handle column's content builder", () => {
            const contentBuilder = (el) => {
                return "hello " + el.test;
            };

            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number", contentBuilder}
            ];
            const data = [
                {test: 0},
                {test: 1},
                {test: 2}
            ];

            // Create a new table
            table = new StyledElements.ModelTable(columns, {});
            table.source.changeElements(data);

            const rows = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");
            for (let i = 0; i < rows.length; i++) {
                expect(rows[i].innerHTML).toBe("hello " + i);
            }
        });

        it("Should handle column's content builder (StyledElement)", () => {
            const contentBuilder = (el) => {
                return new se.Button();
            };

            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number", contentBuilder}
            ];
            const data = [
                {test: 0},
                {test: 1},
                {test: 2}
            ];

            // Create a new table
            table = new StyledElements.ModelTable(columns, {});
            table.source.changeElements(data);

            const rows = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");
            for (let i = 0; i < rows.length; i++) {
                expect(rows[i].firstElementChild.className).toBe("se-btn");
            }
        });

        it("Should handle column's content builder (null values)", () => {
            const contentBuilder = (el) => {
                return;
            };

            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number", contentBuilder}
            ];
            const data = [
                {test: 0}
            ];

            // Create a new table
            table = new StyledElements.ModelTable(columns, {});
            table.source.changeElements(data);

            const rows = table.wrapperElement.querySelectorAll(".se-model-table-row .se-model-table-cell");
            expect(rows[0].innerHTML).toBe("");
        });

        it("Should handle state functions", () => {
            let rows;
            const stateFunc = function stateFunc(el) {
                if (el.test >= 2) {
                    return "success";
                } else {
                    return "warning";
                }
            };

            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            const data = [
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

        it("Model table should be able to get reset", () => {
            let cell;
            const columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];

            // Create a new table using the default options
            table = new StyledElements.ModelTable(columns);

            // Create and push the data
            const data = [
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

        describe("destroy()", () => {

            it("Destroy empty model table", () => {
                const columns = [
                    {field: "test", "label": "TestName", sortable: false, type: "number"}
                ];
                // Default options
                const options = {};
                // Create the table
                table = new StyledElements.ModelTable(columns, options);

                expect(table.destroy()).toBe(table);
            });

            it("Destroy model table without pagination", () => {
                const columns = [
                    {field: "test", "label": "TestName", sortable: false, type: "number"}
                ];
                // Default options
                const options = {pageSize: 0};
                // Create the table
                table = new StyledElements.ModelTable(columns, options);

                expect(table.destroy()).toBe(table);
            });

            it("Destroy model table with data", () => {
                //
                // Preparation
                //
                let cell;
                const columns = [
                    {field: "test", "label": "TestName", sortable: true, type: "number"}
                ];
                // Default options
                const options = {};
                // Create the table
                table = new StyledElements.ModelTable(columns, options);

                // Create and push the data
                const data = [
                    {test: "hello world"}
                ];
                table.source.changeElements(data);

                cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
                expect(cell.innerHTML).toBe("hello world");

                //
                // Action
                //
                expect(table.destroy()).toBe(table);

                //
                // Validation
                //
                cell = table.wrapperElement.querySelector(".se-model-table-row .se-model-table-cell:first-child");
                expect(cell).toBe(null);
            });

        });

    });

})(StyledElements);
