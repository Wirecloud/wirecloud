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

    var fields_with_defaults_and_initial_values = [
        {name: "field1", type: "boolean", defaultValue: true, initialValue: false},
        {name: "field2", type: "number", defaultValue: 10, initialValue: 1},
        {name: "field3", type: "text", defaultValue: "default text", initialValue: "hello world!", required: true},
        {name: "field4", type: "longtext", defaultValue: "default long text", initialValue: "long hello world!"}
    ];

    describe("Styled Forms", function () {

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

        describe("new Form(fields[, options])", function () {

            it("throws a TypeError exception if fields is not passed at all", function () {
                expect(function () {
                    new StyledElements.Form();
                }).toThrow(jasmine.any(TypeError));
            });

            it("throws a TypeError exception if fields is null", function () {
                expect(function () {
                    new StyledElements.Form(null);
                }).toThrow(jasmine.any(TypeError));
            });

            it("can be created with an empty field set", function () {
                var fields = [];
                var element = new StyledElements.Form(fields);
                expect(element).not.toBe(null);
            });

            it("can be created with field descriptions", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);
                expect(element).not.toBe(null);

                // Check buttons
                expect(element.acceptButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.cancelButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.setdefaultsButton).toBe(null);
                expect(element.resetButton).toBe(null);

                // Check fields
                expect(element.fieldInterfaces.field1).toEqual(jasmine.any(StyledElements.BooleanInputInterface));
                expect(element.fieldInterfaces.field1._fieldId).toBe('field1');
                expect(element.fieldInterfaces.field2).toEqual(jasmine.any(StyledElements.NumberInputInterface));
                expect(element.fieldInterfaces.field2._fieldId).toBe('field2');
                expect(element.fieldInterfaces.field3).toEqual(jasmine.any(StyledElements.TextInputInterface));
                expect(element.fieldInterfaces.field3._fieldId).toBe('field3');
                expect(element.fieldInterfaces.field4).toEqual(jasmine.any(StyledElements.LongTextInputInterface));
                expect(element.fieldInterfaces.field4._fieldId).toBe('field4');
            });

            it("allows adding a set defaults button by passing true to the setdefaultsButton option", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values, {
                    setdefaultsButton: true
                });
                expect(element).not.toBe(null);

                // Check buttons
                expect(element.acceptButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.cancelButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.setdefaultsButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.resetButton).toBe(null);
            });

            it("allows adding a reset button by passing true to the resetButton option", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values, {
                    resetButton: true
                });
                expect(element).not.toBe(null);

                // Check buttons
                expect(element.acceptButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.cancelButton).toEqual(jasmine.any(StyledElements.Button));
                expect(element.setdefaultsButton).toBe(null);
                expect(element.resetButton).toEqual(jasmine.any(StyledElements.Button));
            });
        });

        describe("getData()", function () {

            it("returns an empty object if there are not fields", function () {
                var fields = [];
                var element = new StyledElements.Form(fields);
                expect(element.getData()).toEqual({});
            });

            it("returns an object with the values", function () {
                var fields = [
                    {name: "field1", type: "boolean", initialValue: true},
                    {name: "field2", type: "number", initialValue: 1},
                    {name: "field3", type: "text", initialValue: "hello world!"},
                    {name: "field4", type: "longtext", initialValue: "long hello world!"}
                ];
                var element = new StyledElements.Form(fields);
                expect(element.getData()).toEqual({
                    field1: true,
                    field2: 1,
                    field3: "hello world!",
                    field4: "long hello world!"
                });
            });

        });

        describe("setData()", function () {

            var check_invalid_parameter = function check_invalid_parameter(label, value) {
                it("raises a TypeError exception if the passed parameter is a function", function () {
                    var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                    expect(function () {element.setData(value);}).toThrow(jasmine.any(TypeError));
                });
            };

            check_invalid_parameter("raises a TypeError exception if the passed parameter is a function", function () {});
            check_invalid_parameter("raises a TypeError exception if the passed parameter is a number", 5);
            check_invalid_parameter("raises a TypeError exception if the passed parameter is a boolean", true);
            check_invalid_parameter("raises a TypeError exception if the passed parameter is a string", "hello");

            it("should allow to replace current values" , function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.setData({
                    field1: true,
                    field2: 200,
                    field3: "setData value",
                    field4: "setData long value"
                })).toBe(element);

                expect(element.getData()).toEqual({
                    field1: true,
                    field2: 200,
                    field3: "setData value",
                    field4: "setData long value"
                });
            });

            it("should use empty values if the attribute is undefined" , function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.setData({})).toBe(element);

                expect(element.getData()).toEqual({
                    field1: false,
                    field2: 0,
                    field3: "",
                    field4: ""
                });
            });

            it("should reset form values if the passed value is null", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.setData(null)).toBe(element);

                expect(element.getData()).toEqual({
                    field1: false,
                    field2: 1,
                    field3: "hello world!",
                    field4: "long hello world!"
                });
            });

            it("should reset form values if the passed value is undefined", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.setData()).toBe(element);

                expect(element.getData()).toEqual({
                    field1: false,
                    field2: 1,
                    field3: "hello world!",
                    field4: "long hello world!"
                });
            });

        });

        describe("reset()", function () {

            it("should reset form values", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.reset()).toBe(element);

                expect(element.getData()).toEqual({
                    field1: false,
                    field2: 1,
                    field3: "hello world!",
                    field4: "long hello world!"
                });
            });

        });

        describe("defaults()", function () {

            it("reset form values to their default values", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.defaults()).toBe(element);

                expect(element.getData()).toEqual({
                    field1: true,
                    field2: 10,
                    field3: "default text",
                    field4: "default long text"
                });
            });

        });

        describe("focus()", function () {

            it("should do nothing if the form has no fields", function () {
                var element = new StyledElements.Form([]);

                expect(element.focus()).toBe(element);
            });

            it("should reset form values", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);

                expect(element.focus()).toBe(element);
            });

        });

        describe("is_valid()", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Form(fields_with_defaults_and_initial_values);
            });

            it("returns true if all the fields contains valid data", function () {
                expect(element.is_valid()).toBe(true);
            });

            it("returns true if any of the fields contains invalid data", function () {
                element.update({field3: ""});  // field3 is required
                expect(element.is_valid()).toBe(false);
            });
        });

        describe("should support the enable/disable methods/attributes", function () {

            it("should support disabling the component using the disable() method", function () {
                var element = new StyledElements.Form(fields_with_defaults_and_initial_values);
                expect(element.disable()).toBe(element);
                expect(element.enabled).toBe(false);
                expect(element.acceptButton.enabled).toBe(false);
                expect(element.cancelButton.enabled).toBe(false);
            });

            it("should support disabling the component using the enabled attribute", function () {
                var element = new StyledElements.Form(
                    fields_with_defaults_and_initial_values,
                    {
                        acceptButton: true,
                        cancelButton: true,
                        resetButton: true,
                        setdefaultsButton: true
                    }
                );
                element.enabled = false;
                expect(element.enabled).toBe(false);
                expect(element.acceptButton.enabled).toBe(false);
                expect(element.cancelButton.enabled).toBe(false);
            });

            it("should work also if the form has not buttons", function () {
                var element = new StyledElements.Form(
                    fields_with_defaults_and_initial_values,
                    {
                        acceptButton: false,
                        cancelButton: false,
                        resetButton: false,
                        setdefaultsButton: false
                    }
                );
                element.enabled = false;
                expect(element.enabled).toBe(false);
            });

        });

        describe("should handle internal events -", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Form(fields_with_defaults_and_initial_values);
            });

            it("cancel event is triggered when the cancelButton is clicked", function () {
                var listener = jasmine.createSpy('listener');
                element.addEventListener('cancel', listener);

                element.cancelButton.click();

                expect(listener.calls.count()).toBe(1);
                expect(listener).toHaveBeenCalledWith(element);
            });

            it("submit event is triggered when the acceptButton is clicked and data is valid", function () {
                var listener = jasmine.createSpy('listener');
                element.addEventListener('submit', listener);

                element.acceptButton.click();

                expect(listener.calls.count()).toBe(1);
                expect(listener).toHaveBeenCalledWith(
                    element,
                    {
                        field1: false,
                        field2: 1,
                        field3: "hello world!",
                        field4: "long hello world!"
                    }
                );
            });

            it("submit event is not triggered when the acceptButton is clicked and current values are not valid", function () {
                var listener = jasmine.createSpy('listener');
                element.addEventListener('submit', listener);

                element.update({field3: ""});  // field3 is required
                element.acceptButton.click();

                expect(listener.calls.count()).toBe(0);
            });
        });

        describe("deprecated", function () {

            it("should support passing fields using a dict", function () {
                var element = new StyledElements.Form({
                    field1: {name: "field1", type: "boolean", default: true, initialValue: false},
                    field2: {name: "field2", type: "number", default: 10, initialValue: 1}
                });
                expect(element.focusField).toBe("field1");
            });

            it("should support passing fields using a dict without using the name property", function () {
                var element = new StyledElements.Form({
                    field1: {type: "boolean", default: true, initialValue: false},
                    field2: {type: "number", default: 10, initialValue: 1}
                });
                expect(element.focusField).toBe("field1");
            });
        });

    });

})();
