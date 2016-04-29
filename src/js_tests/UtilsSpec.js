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
/* jshint -W053 */

(function () {

    "use strict";

    var check_simple_call = function check_simple_call(label, method, args, expected_result) {
        it(label, function () {
            expect(method.apply(StyledElements.Utils, args)).toBe(expected_result);
        });
    };

    describe("Styled Element Utils - Object helpers", function () {

        describe("isEmpty(value)", function () {
            var isEmpty;

            beforeAll(function () {
                isEmpty = StyledElements.Utils.isEmpty;
            });

            it("returns true if value is null or undefined", function () {
                expect(isEmpty(null)).toBeTruthy();
                expect(isEmpty()).toBeTruthy();
            });

            it("returns true if value is boolean", function () {
                expect(isEmpty(new Boolean(true))).toBeTruthy();
                expect(isEmpty(new Boolean(false))).toBeTruthy();
            });

            it("returns true if value is number", function () {
                expect(isEmpty(new Number(-1))).toBeTruthy();
                expect(isEmpty(new Number(0))).toBeTruthy();
                expect(isEmpty(new Number(1))).toBeTruthy();
            });

            it("returns true if value is string and string.length is 0", function () {
                expect(isEmpty(new String(""))).toBeTruthy();
            });

            it("returns false if value is string and string.length is greater than 0", function () {
                expect(isEmpty(new String("hello world"))).toBeFalsy();
            });

            it("returns true if value is array and array.length is 0", function () {
                expect(isEmpty([])).toBeTruthy();
            });

            it("returns false if value is array and array.length is greater than 0", function () {
                expect(isEmpty([1, 2, 3])).toBeFalsy();
            });

            it("returns true if value is object and object.keys.length is 0", function () {
                expect(isEmpty({})).toBeTruthy();
            });

            it("returns false if value is object and object.keys.length is greater than 0", function () {
                expect(isEmpty({a: 1, b: 2})).toBeFalsy();
            });
        });

        describe("merge(object, ...sources)", function () {
            var merge;

            beforeAll(function () {
                merge = StyledElements.Utils.merge;
            });

            it("throws exception if object is null or undefined", function () {
                expect(function () {
                    return merge();
                }).toThrowError(TypeError, "The argument `object` must be an `Object`.");
                expect(function () {
                    return merge(null);
                }).toThrowError(TypeError, "The argument `object` must be an `Object`.");
            });

            it("should merge sources into object", function () {
                var src = {};
                var defaults = {
                    depth: 0,
                    state: "default",
                    events: ["click", "focus"]
                };
                var options = {
                    state: "primary",
                    events: ["mouseover"]
                };
                expect(merge(src, defaults, options)).toBe(src);
                expect(src.depth).toBe(0);
                expect(src.state).toBe("primary");
                expect(src.events).toEqual(["mouseover"]);
            });
        });

        describe("values(object)", function () {
            var values;

            beforeAll(function () {
                values = StyledElements.Utils.values;
            });

            it("returns array of object property values", function () {
                expect(values({one: 1, two: 2, tree: 3})).toEqual([1, 2, 3]);
            });
        });

        describe("formatSize(size)", function () {
            var formatSize = StyledElements.Utils.formatSize;

            check_simple_call("should format work without passing arguments", formatSize, [], 'N/A');
            check_simple_call("should format `null` correctly", formatSize, [null], 'N/A');
            check_simple_call("should format 0 as 0 bytes", formatSize, [0], '0 bytes');
            check_simple_call("should format 1023 as 1023 bytes", formatSize, [1023], '1023 bytes');
            check_simple_call("should format 1536 as 1.5 KiB", formatSize, [1536], '1.5 KiB');
            check_simple_call("should format 1024 as 1 KiB", formatSize, [1024], '1 KiB');
            check_simple_call("should format 1047552 as 1023 KiB", formatSize, [1047552], '1023 KiB');
            check_simple_call("should format 1048576 as 1 MiB", formatSize, [1048576], '1 MiB');
            check_simple_call("should format 1488978 as 1.42 MiB", formatSize, [1488978], '1.42 MiB');
            check_simple_call("should format 1488978 as 1 MiB when using 3 decimals", formatSize, [1488978, 3], '1.42 MiB');
            check_simple_call("should format 1072693248 as 1023 MiB", formatSize, [1072693248], '1023 MiB');
            check_simple_call("should format 1073741824 as 1 GiB", formatSize, [1073741824], '1 GiB');
            check_simple_call("should format 1098437885952 as 1023 GiB", formatSize, [1098437885952], '1023 GiB');
            check_simple_call("should format 1099511627776 as 1 TiB", formatSize, [1099511627776], '1 TiB');
        });
    });

})();
