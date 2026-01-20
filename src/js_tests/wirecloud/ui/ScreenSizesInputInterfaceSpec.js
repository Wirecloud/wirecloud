/*
 *     Copyright (c) 2024 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */

(function (ns, se, utils) {

    "use strict";

    describe('ScreenSizesInputInterface', function () {

        it("is a class constructor", () => {
            expect(() => {
                ns.ScreenSizesInputInterface("pass", {});  // eslint-disable-line new-cap
            }).toThrowError(TypeError);
        });

        it("requires fieldId and description parameters", () => {
            expect(() => {
                new ns.ScreenSizesInputInterface();
            }).toThrowError(TypeError);
        });

        it("should work by providing the minimum details", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            expect(field.id).toBe("code");
            expect(field).toEqual(jasmine.any(se.InputInterface));
        });

    });

    describe("ScreenSizesInputInterface.parse(value)", () => {

        it("should return the JSON parsed value", () => {
            expect(ns.ScreenSizesInputInterface.parse(1)).toBe(1);
        });

    });

    describe("ScreenSizesInputInterface.stringify(value)", () => {

        it("should return the JSON stringified value", () => {
            expect(ns.ScreenSizesInputInterface.stringify("value")).toBe('"value"');
        });

    });

    describe("ScreenSizesInputInterface._normalize()", () => {

        it("should return the value as is", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            expect(field._normalize("value")).toBe("value");
        });

    });

    describe("ScreenSizesInputInterface.insertInto()", () => {

        it("should insert the input element into the provided container", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            const container = document.createElement("div");
            field.insertInto(container);
            expect(container.children.length).toBe(1);
        });

    });

    describe("ScreenSizesInputInterface.repaint()", () => {

        it("should repaint the input element", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            field.wrapperElement.repaint = jasmine.createSpy("repaint");
            field.repaint();
            expect(field.wrapperElement.repaint).toHaveBeenCalled();
        });

    });

    describe("ScreenSizesInputInterface.setDisabled()", () => {

        it("should set the disabled state of the input element", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            field.addButton.setDisabled = jasmine.createSpy("setDisabled");

            field.setDisabled(true);
            expect(field.addButton.setDisabled).toHaveBeenCalledWith(true);

            field.setDisabled(false);
            expect(field.addButton.setDisabled).toHaveBeenCalledWith(false);
        });

    });

    describe("ScreenSizesInputInterface._checkValue()", () => {

        it("should return an error if the value is not a valid screen size", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            expect(field._checkValue("value")).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);
            expect(field._checkValue({})).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);
            expect(field._checkValue([])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);
            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);

            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 802,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);

            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 700,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);

            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);

            expect(field._checkValue([{
                "moreOrEqual": 1,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 0
            }])).toBe(se.InputValidationError.SCREEN_SIZES_ERROR);
        });

        it("should return no error if the value is a valid screen size", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default",
                "id": 0
            }])).toBe(se.InputValidationError.NO_ERROR);

            expect(field._checkValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }])).toBe(se.InputValidationError.NO_ERROR);
        });

    });

    describe("ScreenSizesInputInterface._update()", () => {

        it("should update the input element", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            const value = [{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }];

            field.setValue(value);
            expect(field.getValue()).toBe(value);
        });

        it("should sort the screen sizes", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            const value = [{
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }, {
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }];

            field.setValue(value);
            expect(field.getValue()).toEqual([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]);
        });

    });

    describe("ScreenSizesInputInterface.on_addScreenSize()", () => {

        it("should add a screen size accordingly", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            field._setValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }]);

            field.on_addScreenSize();

            expect(field.getValue()).toEqual([{
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]);
        });

    });

    describe("ScreenSizesInputInterface.on_deleteScreenSize()", () => {

        it("should delete a screen size accordingly", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            field.setValue([{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]);

            field.on_deleteScreenSize(0);

            expect(field.getValue()).toEqual([{
                "moreOrEqual": 0,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]);
        });

    });

    describe("ScreenSizesInputInterface.on_valueChange()", () => {

        it("should update the input element", () => {
            const field = new ns.ScreenSizesInputInterface("code", {});
            const value = [{
                "moreOrEqual": 0,
                "lessOrEqual": 800,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 801,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }];

            field.setValue(value);
            field.on_valueChange(1, "moreOrEqual", 100);

            expect(JSON.stringify(field.getValue())).toBe(JSON.stringify([{
                "moreOrEqual": 0,
                "lessOrEqual": 99,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 100,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]));

            field.on_valueChange(0, "lessOrEqual", 1000);

            expect(field.getValue()).toEqual([{
                "moreOrEqual": 0,
                "lessOrEqual": 1000,
                "name": "Default",
                "id": 0
            }, {
                "moreOrEqual": 1001,
                "lessOrEqual": -1,
                "name": "Default-1",
                "id": 1
            }]);
        });

    });

})(Wirecloud.ui, StyledElements, StyledElements.Utils);