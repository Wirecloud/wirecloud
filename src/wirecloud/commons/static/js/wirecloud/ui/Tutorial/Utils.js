/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

(function () {

    "use strict";

    Wirecloud.ui.Tutorial.Utils = {
        basic_actions: {
            sleep: function sleep(milliseconds, autoAction) {
                setTimeout(function () {
                    autoAction.nextHandler();
                }, milliseconds);
            },
            input: function input(text, autoAction, element) {
                var timeout, i;

                if (element.tagName !== 'input') {
                    element = element.querySelector('input');
                }

                element.value = "";
                timeout = 0;
                for (i = 0; i < text.length; i++) {
                    timeout += 300;
                    setTimeout(append_character.bind(null, element, text[i]), timeout);
                }
                setTimeout(function () {
                    var evt = document.createEvent("KeyboardEvent");
                    if (evt.initKeyEvent != null) {
                        evt.initKeyEvent("keypress", true, true, window, false, false, false, false, 13, 0);
                    } else {
                        Object.defineProperty(evt, 'keyCode', {get: function () { return 13;}});
                        evt.initKeyboardEvent ("keypress", true, true, window, 0, 0, 0, 0, 0, 13);
                    }
                    element.dispatchEvent(evt);
                }, timeout);

                timeout += 1600;
                setTimeout(function() {
                    autoAction.nextHandler();
                }, timeout);
            }
        },
        basic_selectors: {
            back_button: function back_button() {
                return document.querySelector("#wirecloud_header .icon-caret-left").parentElement;
            },
            toolbar_button: function toolbar_button(button_class) {
                return document.querySelector("#wirecloud_header .wirecloud_toolbar").getElementsByClassName(button_class)[0].parentElement;
            },
            mac_wallet_close_button: function mac_wallet_close_button() {
                return document.querySelector('.widget_wallet .icon-remove');
            },
            mac_wallet_input: function mac_wallet_input() {
                return document.querySelector('.widget_wallet .se-text-field');
            },
            mac_wallet_resource_mainbutton: function mac_wallet_resource_mainbutton(resource_title) {
                var resources, widget, element;

                resources = document.querySelectorAll('.widget_wallet .widget_wallet_list .resource_name');
                widget = findElementByTextContent(resources, resource_title);
                element = widget.parentNode.getElementsByClassName("mainbutton")[0];

                return element;
            }
        }
    };

})();
