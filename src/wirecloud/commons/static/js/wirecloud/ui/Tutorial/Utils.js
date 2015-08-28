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

    var anchor_element = document.createElement('a');
    anchor_element.href = Wirecloud.URLs.LOCAL_REPOSITORY;
    var base_url = anchor_element.href;
    if (base_url[base_url.length - 1] !== '/') {
        base_url += '/';
    }
    base_url += 'static/';

    var build_static_url = function build_static_url(path) {
        return base_url + path;
    };

    var append_character = function append_character(element, character) {
        element.value += character;
    };

    var findElementByTextContent = function findElementByTextContent(nodes, text) {
        var i;
        for (i = 0; i < nodes.length; i ++) {
            if (nodes[i].textContent.toLowerCase() == text.toLowerCase()) {
                return nodes[i];
            }
        }
        return null;
    };

    Wirecloud.ui.Tutorial.Utils = {
        basic_actions: {
            sleep: function sleep(milliseconds) {
                return function (autoAction, element) {
                    setTimeout(function () {
                        autoAction.nextHandler();
                    }, milliseconds);
                }
            },
            click: function click(milliseconds) {
                return function (autoAction, element) {
                    setTimeout(function () {
                        element.click();
                        autoAction.nextHandler();
                    }, milliseconds);
                }
            },
            input: function input(text) {
                return function (autoAction, element) {
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
            uploadComponent: function uploadComponent(id) {
                return function (autoAction, element) {
                    if (!Wirecloud.LocalCatalogue.resourceExistsId(id)) {
                        Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/' + id.split('/').join('_') + '.wgt'), {
                            onSuccess: autoAction.nextHandler.bind(autoAction)/*,
                            onFailure: autoAction.errorHandler.bind(autoAction)*/
                        });
                    } else {
                        autoAction.nextHandler();
                    }
                };
            }
        },
        basic_selectors: {
            back_button: function back_button() {
                return document.querySelector("#wirecloud_header .icon-caret-left").parentElement;
            },
            toolbar_button: function toolbar_button(button_class) {
                return document.querySelector("#wirecloud_header .wc-toolbar").getElementsByClassName(button_class)[0].parentElement;
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
            },
            workspaceView: {
                widget_by_title: function widget_by_title(title) {
                    return function() {
                        var i, widgetList;

                        widgetList = document.querySelectorAll('.workspace .iwidget');

                        for (i = 0; i < widgetList.length; i++) {
                            if (widgetList[i].querySelector('.widget_menu span').textContent === title) {
                                return widgetList[i];
                            }
                        }

                        return null;
                    };
                }
            }
        }
    };

})();
