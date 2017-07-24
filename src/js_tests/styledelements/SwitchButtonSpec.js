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
/* globals StyledElements, describe, beforeEach, beforeAll, afterEach, it, expect, spyOn */

(function () {

    "use strict";

    describe("Styled SwitchButtons", function () {

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

        it("can be created without passing any option", function () {

            var element = new StyledElements.SwitchButton();
            expect(element.wrapperElement.textContent).toBe("On Off ");
            expect(element.buttons.length).toEqual(2);
            expect(element.wrapperElement.children.length).toBe(2);
            expect(element.wrapperElement.className).toBe("btn-group");
            expect(element.buttons[0].className).toEqual("se-btn btn-primary");
            expect(element.buttons[1].className).toEqual("se-btn");
        });

        it("can be created with only a text label", function () {
            var options = {
                buttons: [
                    {name: "hello"},
                    {name: "world!!"}
                ]
            };
            var element = new StyledElements.SwitchButton(options);
            expect(element.wrapperElement.textContent).toBe("hello world!! ");
        });

        it("can be created with icons", function () {
            var options = {
                buttons: [
                    {name: "hello", iconClass: "icon"},
                    {name: "world!!", iconClass: "icon2"}
                ]
            };
            var element = new StyledElements.SwitchButton(options);
            expect(element.wrapperElement.textContent).toBe("hello world!! ");
            expect(element.buttons[0].children[0].className).toBe("icon");
            expect(element.buttons[1].children[0].className).toBe("icon2");
        });

        describe("Should toggle status on click", function () {
            var element;

            var testCallback = function testCallback(bool) {};

            beforeAll(function () {
                var options = {
                    buttons: [
                        {name: "one"},
                        {name: "two"},
                        {name: "three"}
                    ]
                }
                element = new StyledElements.SwitchButton(options);
                element.setCallback(testCallback);
            });
            it("Should toggle buttons status", function () {
                expect(element.selected).toEqual(0);
                expect(element.buttons[0].className).toEqual("se-btn btn-primary");
                expect(element.buttons[1].className).toEqual("se-btn");
                expect(element.buttons[2].className).toEqual("se-btn");

                element.toggleActiveButton(1);
                expect(element.selected).toEqual(1);
                expect(element.buttons[1].className).toEqual("se-btn btn-primary");
                expect(element.buttons[0].className).toEqual("se-btn");
                expect(element.buttons[2].className).toEqual("se-btn");

                element.toggleActiveButton(2);
                expect(element.selected).toEqual(2);
                expect(element.buttons[2].className).toEqual("se-btn btn-primary");
                expect(element.buttons[0].className).toEqual("se-btn");
                expect(element.buttons[1].className).toEqual("se-btn");

                element.toggleActiveButton(0);
                expect(element.selected).toEqual(0);
                expect(element.buttons[0].className).toEqual("se-btn btn-primary");
                expect(element.buttons[1].className).toEqual("se-btn");
                expect(element.buttons[2].className).toEqual("se-btn");
            });

            it("Should call the callback function", function () {
                spyOn(element, "callback");

                element.toggleActiveButton(1);
                expect(element.callback).toHaveBeenCalledWith(1);

                element.callback.calls.reset();
                element.toggleActiveButton(0);
                expect(element.callback).toHaveBeenCalledWith(0);
            });

            it("Should not call the callback function when the button was already on", function () {
                spyOn(element, "callback");

                expect(element.selected).toEqual(0);
                element.toggleActiveButton(0);
                expect(element.selected).toEqual(0);
                expect(element.callback).not.toHaveBeenCalled();
            });
        });

        describe("deselectButtons()", function () {
            it("Should deselect current active button", function () {
                var element = new StyledElements.SwitchButton();
                element.deselectButtons();
                expect(element.buttons[0].className).toEqual("se-btn");
                expect(element.buttons[1].className).toEqual("se-btn");
                expect(element.selected).toEqual(null);
            });
        });

        describe("setBadge(content, state, isAlert", function () {
            var element;
            beforeEach(function () {
                element = new StyledElements.SwitchButton();
            });

            it("Should not create badges without content", function () {
                element.setBadge();
                expect(element.wrapperElement.children.length).toBe(2);
            });

            it("Should create badges without state", function () {
                element.setBadge("hello");

                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.badgeElement).toBeTruthy();
                expect(element.wrapperElement.children[0]).toEqual(element.badgeElement);
                expect(element.badgeElement.textContent).toEqual("hello");
            });

            it("Should create badges with state", function () {
                element.setBadge("hello", "warning");

                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.wrapperElement.children[0]).toEqual(element.badgeElement);
                expect(element.badgeElement.textContent).toEqual("hello");
                expect(element.badgeElement.className).toEqual("badge badge-warning");
            });

            it("Should not set wrong states", function () {
                element.setBadge("hello", "stateIJustMadeUp");
                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.wrapperElement.children[0]).toEqual(element.badgeElement);
                expect(element.badgeElement.textContent).toEqual("hello");
                expect(element.badgeElement.className).toEqual("badge");
            });

            it("Should create badges without state", function () {
                element.setBadge("hello");

                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.wrapperElement.children[0]).toEqual(element.badgeElement);
                expect(element.badgeElement.textContent).toEqual("hello");
            });

            it("Should remove badges", function () {
                element.setBadge("hello");
                expect(element.wrapperElement.children.length).toBe(3);
                element.setBadge();
                expect(element.wrapperElement.children.length).toBe(2);
            });

            it("Should overwrite badges content", function () {
                element.setBadge("hello");
                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.badgeElement.textContent).toEqual("hello");
                element.setBadge("world");
                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.badgeElement.textContent).toEqual("world");
            });

            it("Should not overwrite badges state", function () {
                element.setBadge("hello", "warning");
                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.badgeElement.textContent).toEqual("hello");
                expect(element.badgeElement.className).toEqual("badge badge-warning");
                element.setBadge("world", "success");
                expect(element.wrapperElement.children.length).toBe(3);
                expect(element.badgeElement.textContent).toEqual("world");
                expect(element.badgeElement.className).toEqual("badge badge-warning");
            });
        });
    });

})();
