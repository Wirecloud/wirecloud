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

    var check_simple_call = function check_simple_call(label, method, args, expected_result) {
        it(label, function () {
            expect(method.apply(StyledElements.Utils, args)).toBe(expected_result);
        });
    };

    describe("Styled Element Utils - Object helpers", function () {

        describe("clone(object, deep)", function () {
            var clone = StyledElements.Utils.clone;

            it("returns null if object is null", function () {
                expect(clone(null)).toBe(null);
            });

            it("returns a shallow copy if object is an array", function () {
                var original = ['a', 1, true, {'b': 'c'}, [1], null, undefined];
                var result = clone(original);
                expect(result).not.toBe(original);
                expect(result).toEqual(original);

                // Check clone returned a shallow copy
                expect(result[3]).toBe(original[3]);
                expect(result[4]).toBe(original[4]);
            });

            it("returns a shallow copy if object is an object", function () {
                var original = {'a': 1, 'b': true, 'c': {'b': 'c'}, 'd': [1], 'e': null, 'f': undefined};
                var result = clone(original);
                expect(result).not.toBe(original);
                expect(result).toEqual(original);

                // Check clone returned a shallow copy
                expect(result.c).toBe(original.c);
                expect(result.d).toBe(original.d);
            });

            it("returns a depp copy if object is an array and deep is true", function () {
                var original = ['a', 1, true, {'b': 'c'}, [1], null, undefined];
                var result = clone(original, true);
                expect(result).not.toBe(original);
                expect(result).toEqual(original);

                // Check deepcopy returned a deep copy
                expect(result[3]).not.toBe(original[3]);
                expect(result[4]).not.toBe(original[4]);
            });

            it("returns a deep copy if object is an object and deep is true", function () {
                var original = {'a': 1, 'b': true, 'c': {'b': 'c'}, 'd': [1], 'e': null, 'f': undefined};
                var result = clone(original, true);
                expect(result).not.toBe(original);
                expect(result).toEqual(original);

                // Check deepcopy returned a deep copy
                expect(result.c).not.toBe(original.c);
                expect(result.d).not.toBe(original.d);
            });
        });

        describe("escapeHTML(text)", function () {
            var escapeHTML = StyledElements.Utils.escapeHTML;

            it("returns an unescaped string if the text parameter doesn't contain especial characters", function () {
                expect(escapeHTML("hello world")).toBe("hello world");
            });

            it("returns an escaped string if the text parameter contains especial characters", function () {
                expect(escapeHTML("<Copy & paste>")).toBe("&lt;Copy &amp; paste&gt;");
            });
        });

        describe("escapeRegExp(text)", function () {
            var escapeRegExp = StyledElements.Utils.escapeRegExp;

            it("returns an unescaped string if the text parameter doesn't contain especial characters", function () {
                expect(escapeRegExp("helloworld")).toBe("helloworld");
            });

            it("returns an escaped string if the text parameter contains especial characters", function () {
                expect(escapeRegExp("[Copy] & paste+")).toBe("\\[Copy\\]\\ &\\ paste\\+");
            });
        });

        describe("getRelativePosition(element1, element2)", function () {
            var element1, element2, getRelativePosition = StyledElements.Utils.getRelativePosition;

            beforeEach(function () {
                element1 = document.createElement('div');
                document.body.appendChild(element1);

                element2 = document.createElement('div');
                document.body.appendChild(element2);
            });

            afterEach(function () {
                element1.remove();
                element2.remove();
            });

            it("returns {x: 0, y: 0} when element1 and element2 are the same element", function () {
                expect(getRelativePosition(element1, element1)).toEqual({x: 0, y: 0});
            });

            it ("returns the relative position when providing different values for element1 and element2", function () {
                element1.style.cssText = "position: absolute; top: 0px; left: 0px; right: 0px; height: 10px;";
                element2.style.cssText = "position: absolute; top: 20px; left: 10px; right: 0px; height: 10px;";

                expect(getRelativePosition(element2, element1)).toEqual({x: 10, y: 20});
            });
        });

        describe("isElement(value)", function () {
            var isElement = StyledElements.Utils.isElement;

            it("returns false if value is null", function () {
                expect(isElement(null)).toBeFalsy();
            });

            it("returns false if value is undefined", function () {
                expect(isElement(undefined)).toBeFalsy();
            });

            it("returns false if value is a boolean true", function () {
                expect(isElement(true)).toBeFalsy();
            });

            it("returns false if value is a boolean false", function () {
                expect(isElement(false)).toBeFalsy();
            });

            it("returns false for numbers", function () {
                expect(isElement(1)).toBeFalsy();
            });

            it("returns false for strings", function () {
                expect(isElement("")).toBeFalsy();
            });

            it("returns false if value is an array", function () {
                expect(isElement([1, 2, 3])).toBeFalsy();
            });

            it("returns false if value is a simple object", function () {
                expect(isElement({})).toBeFalsy();
            });

            it("returns true if value is an Element", function () {
                expect(isElement(document.createElement('i'))).toBeTruthy();
            });

            it("returns true for third-party Elements", function () {
                var PseudoElementClass = function () {};
                var element = new PseudoElementClass();
                element.ownerDocument = {
                    defaultView: {
                        HTMLElement: PseudoElementClass
                    }
                };
                expect(isElement(element)).toBeTruthy();
            });

        });

        describe("isEmpty(value)", function () {
            var isEmpty;

            beforeAll(function () {
                isEmpty = StyledElements.Utils.isEmpty;
            });

            it("returns true if value is null", function () {
                expect(isEmpty(null)).toBeTruthy();
            });

            it("returns true if value is undefined", function () {
                expect(isEmpty(undefined)).toBeTruthy();
            });

            it("returns true if value is a boolean true", function () {
                expect(isEmpty(true)).toBeTruthy();
            });

            it("returns true if value is a boolean false", function () {
                expect(isEmpty(false)).toBeTruthy();
            });

            it("returns true for negative numbers", function () {
                expect(isEmpty(-1)).toBeTruthy();
            });

            it("returns true for number 0", function () {
                expect(isEmpty(0)).toBeTruthy();
            });

            it("returns true for positive numbers", function () {
                expect(isEmpty(1)).toBeTruthy();
            });

            it("returns true if value is string and string.length is 0", function () {
                expect(isEmpty("")).toBeTruthy();
            });

            it("returns false if value is string and string.length is greater than 0", function () {
                expect(isEmpty("hello world")).toBeFalsy();
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

        describe("normalizeKey(event)", function () {
            var normalizeKey = StyledElements.Utils.normalizeKey;

            var initkeyevent = function initkeyevent(event) {
                ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].forEach(function (attr) {
                    if (!(attr in event)) {
                        event[attr] = false;
                    }
                });
                return event;
            };

            it("returns Unidentified for unknown keyCodes", function () {
                expect(normalizeKey(initkeyevent({keyCode: 0}))).toBe("Unidentified");
            });

            it("returns a translated value for known keyCodes", function () {
                expect(normalizeKey(initkeyevent({keyCode: 8}))).toBe("Backspace");
            });

            it("returns key value if present", function () {
                expect(normalizeKey(initkeyevent({key: "Escape"}))).toBe("Escape");
            });

            it("returns fixed key value if needed", function () {
                expect(normalizeKey(initkeyevent({key: "Left"}))).toBe("ArrowLeft");
            });

            it("return unaltered key value if the alt key is pressed", function () {
                expect(normalizeKey(initkeyevent({altKey: true, key: "å", keyCode: 65}))).toBe("a");
            });

        });

        describe("merge(object, ...sources)", function () {
            var merge;

            beforeAll(function () {
                merge = StyledElements.Utils.merge;
            });

            it("throws exception if object is null", function () {
                expect(function () {
                    return merge();
                }).toThrowError(TypeError, "The argument `object` must be an `Object`.");
            });

            it("throws exception if object is undefined", function () {
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
                    events: ["mouseover"],
                    other: true
                };
                expect(merge(src, defaults, options)).toBe(src);
                expect(src.depth).toBe(0);
                expect(src.state).toBe("primary");
                expect(src.events).toEqual(["mouseover"]);
                expect(src.other).toBe(true);
                expect(defaults.state).toBe("default");
            });
        });

        describe("update(object, ...sources)", function () {
            var update;

            beforeAll(function () {
                update = StyledElements.Utils.update;
            });

            it("throws exception if object is null", function () {
                expect(function () {
                    return update();
                }).toThrowError(TypeError, "The argument `object` must be an `Object`.");
            });

            it("throws exception if object is undefined", function () {
                expect(function () {
                    return update(null);
                }).toThrowError(TypeError, "The argument `object` must be an `Object`.");
            });

            it("should update sources into object", function () {
                var src = {
                    depth: 0,
                    state: "default",
                    events: ["click", "focus"]
                };
                var source1 = {
                    depth: 1,
                    state: "danger",
                    other: ["mouseover"]
                };
                var source2 = {
                    state: "primary"
                };
                expect(update(src, source1, source2)).toBe(src);
                expect(src.depth).toBe(1);
                expect(src.state).toBe("primary");
                expect(src.events).toEqual(["click", "focus"]);
                expect('other' in src).toBeFalsy();
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

        describe("inherit(child, parent, [members])", function () {
            var inherit;

            beforeAll(function () {
                inherit = StyledElements.Utils.inherit;
            });

            it("should inherit from another class", function () {
                var A = function A() {};
                var B = function B() {};

                expect(inherit(B, A)).toBeUndefined();

                var test = new B();

                expect(test instanceof B).toBe(true);
                expect(test instanceof A).toBe(true);
            });

            it("should inherit from another class overwriting methods", function () {
                var A = function A() {};
                A.prototype.toString = function toString() {
                    return "A";
                };

                var B = function B() {};

                inherit(B, A, {
                    toString: function toString() {
                        return "B";
                    }
                });
                var test = new B();

                expect(test.toString()).toEqual("B");
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
