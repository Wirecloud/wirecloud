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

/* global LayoutManagerFactory, Wirecloud */

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
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent.toLowerCase() == text.toLowerCase()) {
                return nodes[i];
            }
        }
        return null;
    };

    var Utils = {
        basic_actions: {
            sleep: function sleep(milliseconds) {
                return function (autoAction, element) {
                    setTimeout(function () {
                        autoAction.nextHandler();
                    }, milliseconds);
                };
            },
            click: function click(milliseconds) {
                return function (autoAction, element) {
                    setTimeout(function () {
                        element.click();
                        autoAction.nextHandler();
                    }, milliseconds);
                };
            },
            create_workspace: function create_workspace(options) {
                return function (autoAction, element) {
                    options = Wirecloud.Utils.merge({
                        allow_renaming: true
                    },  options);
                    options.onSuccess = function (workspace) {
                        Wirecloud.changeActiveWorkspace(workspace, null, {
                            onSuccess: autoAction.nextHandler,
                            onFailure: autoAction.errorHandler
                        });
                    };
                    options.onFailure = autoAction.errorHandler;

                    Wirecloud.createWorkspace(options);
                };
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
                    setTimeout(function () {
                        autoAction.nextHandler();
                    }, timeout);
                };
            },
            uploadComponent: function uploadComponent(id) {
                return function (autoAction, element) {
                    if (!Wirecloud.LocalCatalogue.resourceExistsId(id)) {
                        Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/' + id.split('/').join('_') + '.wgt'), {
                            onSuccess: autoAction.nextHandler,
                            onFailure: autoAction.errorHandler
                        });
                    } else {
                        autoAction.nextHandler();
                    }
                };
            },
            wiringView: {
                open_component_sidebar: function open_component_sidebar(type) {
                    return function (autoAction, element) {
                        var sidebar_button = Utils.basic_selectors.toolbar_button('icon-archive')();
                        if (!sidebar_button.classList.contains('active')) {
                            sidebar_button.click();
                        }
                        var component_type_button = Utils.basic_selectors.button('.wiring-sidebar .btn-list-' + type + '-group')();
                        if (!component_type_button.classList.contains('active')) {
                            component_type_button.click();
                        }
                        autoAction.nextHandler();
                    };
                }
            }
        },
        basic_selectors: {
            back_button: function back_button() {
                return Utils.basic_selectors.button("#wirecloud_header .icon-caret-left");
            },
            button: function button(selector) {
                return function () {
                    var element = document.querySelector(selector);
                    if (element != null) {
                        if (element.classList.contains('se-btn')) {
                            return element;
                        } else {
                            return element.parentElement;
                        }
                    }
                    return null;
                };
            },
            element: function element(selector) {
                return function () {
                    return document.querySelector(selector);
                };
            },
            mac_wallet_close_button: function mac_wallet_close_button() {
                return Utils.basic_selectors.button('.widget_wallet .icon-remove');
            },
            mac_wallet_input: function mac_wallet_input() {
                return Utils.basic_selectors.element('.widget_wallet .se-text-field');
            },
            mac_wallet_resource_mainbutton: function mac_wallet_resource_mainbutton(resource_title) {
                var resources, widget, element;

                resources = document.querySelectorAll('.widget_wallet .widget_wallet_list .resource_name');
                widget = findElementByTextContent(resources, resource_title);
                element = widget.parentNode.getElementsByClassName("mainbutton")[0];

                return element;
            },
            toolbar_button: function toolbar_button(button_class) {
                return Utils.basic_selectors.button("#wirecloud_header .wc-toolbar ." + button_class);
            },
            workspaceView: {
                widget_by_title: function widget_by_title(title) {
                    return function () {
                        var i, widgetList;

                        widgetList = document.querySelectorAll('.workspace .iwidget');

                        for (i = 0; i < widgetList.length; i++) {
                            if (widgetList[i].querySelector('.widget_menu span').textContent === title) {
                                return widgetList[i];
                            }
                        }

                        return null;
                    };
                },
                widget_element: function widget_element(index, selector) {
                    return function () {
                        var widget = Wirecloud.activeWorkspace.getIWidgets()[index];
                        var element = widget.content.contentDocument.querySelector(selector);
                        return new Wirecloud.ui.Tutorial.WidgetElement(widget, element);
                    };
                }
            },
            wiringView: {
                btn_create_behaviour: function btn_create_behaviour() {
                    return function () {
                        return document.querySelector(".panel-behaviours .panel-options .btn-create");
                    };
                },
                btn_enable_behaviours: function btn_enable_behaviours() {
                    return function () {
                        return document.querySelector(".panel-behaviours .panel-options .btn-enable");
                    };
                },
                btn_show_behaviours: function btn_show_behaviours() {
                    return function () {
                        return document.querySelector(".wc-toolbar .btn-list-behaviours");
                    };
                },
                behaviour_engine: function behaviour_engine() {
                    return function () {
                        return LayoutManagerFactory.getInstance().viewsByName.wiring.behaviourEngine;
                    };
                },
                component_by_id: function component_by_id(type, id_) {
                    return function () {
                        var components, i, id;

                        // TODO
                        id = "" + id_;
                        if (type === 'widget') {
                            id = "" + Wirecloud.activeWorkspace.getIWidgets()[id_].id;
                        }
                        components = document.querySelectorAll('.wiring-diagram .component-' + type);

                        for (i = 0; i < components.length; i++) {
                            if (components[i].getAttribute('data-id') === id) {
                                return components[i];
                            }
                        }
                        return null;
                    };
                },
                connection_engine: function connection_engine() {
                    return function () {
                        return LayoutManagerFactory.getInstance().viewsByName.wiring.connectionEngine;
                    };
                },
                endpoint_by_name: function endpoint_by_name(component_type, component_id, endpoint_type, endpoint_name) {
                    return function () {
                        var component = Utils.basic_selectors.wiringView.component_by_id(component_type, component_id)();
                        if (component != null) {
                            var endpoints = component.querySelectorAll('.' + endpoint_type + '-endpoints .endpoint');

                            for (var i = 0; i < endpoints.length; i++) {
                                if (endpoints[i].getAttribute('data-name') === endpoint_name) {
                                    return endpoints[i].querySelector('.endpoint-anchor');
                                }
                            }
                        }

                        return null;
                    };
                },
                sidebarcomponentgroup_by_id: function sidecomponentgroup(id) {
                    return function () {
                        var i, componentgroups, componentgroup;

                        componentgroups = document.querySelectorAll('.panel-components .component-group');

                        for (i = 0; i < componentgroups.length; i++) {
                            componentgroup = componentgroups[i];
                            if (componentgroup.getAttribute('data-id') === id) {
                                return componentgroup;
                            }
                        }
                    };
                },
                sidebarcomponent_by_id: function sidebarcomponent_by_id(component_meta_id, component_id) {
                    return function () {
                        var componentgroup, components;

                        componentgroup = Utils.basic_selectors.wiringView.sidebarcomponentgroup_by_id(component_meta_id)();
                        if (componentgroup != null) {
                            components = componentgroup.querySelectorAll('.component');
                            return components[component_id]; // TODO use real id
                        }
                        return null;
                    };
                }
            }
        }
    };

    Wirecloud.ui.Tutorial.Utils = Utils;

})();
