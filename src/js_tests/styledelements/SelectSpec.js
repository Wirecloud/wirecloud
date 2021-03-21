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

/* globals FocusEvent, StyledElements */


(function () {

    "use strict";

    describe("Styled Selects", function () {

        let dom = null;
        const object1 = {
            attr: 'value',
            toString: function () { return 'object1'; }
        };
        const object2 = {
            attr: 'other value',
            toString: function () { return 'object2'; }
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
        });

        it("can be created without passing any option", function () {

            const element = new StyledElements.Select();
            expect(element.wrapperElement.className).toBe("se-select");
            expect(element.value).toBe(undefined);
            expect(element.getLabel()).toBe('');

        });

        it("can be created using the name option", function () {

            const element = new StyledElements.Select({name: 'formname'});
            expect(element.wrapperElement.querySelector('select').getAttribute('name')).toBe("formname");

        });

        it("should handle initial entries", function () {

            // Use string values as they are the values handled by default
            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: "1"},
                    {label: 'other value', value: "2"},
                    {label: 'another value', value: "3"}
                ]
            });
            expect(element.value).toBe("1");
            expect(element.getLabel()).toBe('Label');

        });

        it("should handle objects with a valid toString method", function () {

            // Use string values as they are the values handled by default
            const element = new StyledElements.Select({
                initialEntries: [
                    object1,
                    object2
                ]
            });
            expect(element.value).toBe(object1);
            expect(element.getLabel()).toBe(object1.toString());

        });

        it("should handle initial entries with an initial value", function () {

            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: 1},
                    {label: 'other value', value: 2},
                    {label: 'another value', value: 3}
                ],
                initialValue: 2
            });
            expect(element.value).toBe(2);
            expect(element.getLabel()).toBe('other value');

        });

        it("should handle string entries", function () {
            const element = new StyledElements.Select();

            element.addEntries(["a", "b", "c"]);
            expect(element.value).toBe("a");
            expect(element.getLabel()).toBe("a");
        });

        it("should handle number entries", function () {
            const element = new StyledElements.Select();

            element.addEntries([1, 2, 3]);
            expect(element.value).toBe(1);
            expect(element.getLabel()).toBe("1");
        });

        it("should support changing the value using the setValue method", function () {

            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: 1},
                    {label: 'other value', value: 2},
                    {label: 'another value', value: 3}
                ]
            });
            element.setValue(2);
            expect(element.value).toBe(2);
            expect(element.getLabel()).toBe('other value');

        });

        it("should support changing the value using the setValue method to the first value if there is not a default value", function () {

            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: 1},
                    {label: 'other value', value: 2},
                    {label: 'another value', value: 3}
                ]
            });
            element.setValue(null);
            expect(element.value).toBe(1);
            expect(element.getLabel()).toBe('Label');

        });

        it("should support changing the value using the setValue method to the default value", function () {

            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: 1},
                    {label: 'other value', value: 2},
                    {label: 'another value', value: 3}
                ]
            });
            element.defaultValue = 3;
            element.setValue(null);
            expect(element.value).toBe(3);
            expect(element.getLabel()).toBe('another value');

        });

        it("should handle calls to the setValue method when there is not available options", function () {

            const element = new StyledElements.Select();
            element.setValue(5);
            expect(element.value).toBe(undefined);
            expect(element.getLabel()).toBe('');

        });

        it("should support cleaning the available options", function () {

            const element = new StyledElements.Select({
                initialEntries: [
                    {label: 'Label', value: 1},
                    {label: 'other value', value: 2},
                    {label: 'another value', value: 3}
                ]
            });
            element.clear();
            expect(element.value).toBe(undefined);
            expect(element.getLabel()).toBe('');

        });

        it("should trigger focus events", function (done) {

            const element = new StyledElements.Select();
            element.addEventListener('focus', function (select) {
                expect(select).toBe(element);
                expect(element.hasClassName('focus')).toBeTruthy();
                done();
            });
            element.inputElement.dispatchEvent(new FocusEvent("focus"));

        });

        it("should trigger blur events", function (done) {

            const element = new StyledElements.Select();
            element.addEventListener('blur', function (select) {
                expect(select).toBe(element);
                expect(element.hasClassName('focus')).toBeFalsy();
                done();
            });
            element.inputElement.dispatchEvent(new FocusEvent("focus"));
            element.inputElement.dispatchEvent(new FocusEvent("blur"));

        });

        describe("blur()", function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Select for testing
                element = new StyledElements.Select();
            });

            it("should trigger blur events", function () {
                spyOn(element.inputElement, 'blur');
                expect(element.blur()).toBe(element);
                expect(element.inputElement.blur.calls.count()).toBe(1);
            });

        });

        describe("focus()", function () {
            let element;

            beforeEach(function () {
                // Provide a default instance of Select for testing
                element = new StyledElements.Select();
            });

            it("should trigger a focus event", function () {
                spyOn(element.inputElement, 'focus');
                expect(element.focus()).toBe(element);
                expect(element.inputElement.focus.calls.count()).toBe(1);
            });

        });

    });

})();
