/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


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

    var fill_input = function fill_input(element, new_value) {
        element.value = new_value;
    };

    var findElementByTextContent = function findElementByTextContent(nodes, text) {
        var i;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent.trim().toLowerCase() == text.toLowerCase()) {
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

                    Wirecloud.createWorkspace(options).then((workspace) => {
                        Wirecloud.changeActiveWorkspace(workspace).then(
                            autoAction.nextHandler,
                            autoAction.errorHandler
                        );
                    }, autoAction.errorHandler);
                };
            },
            input: function input(text, options) {
                options = Wirecloud.Utils.merge({
                    timeout: 4000,
                    step: 200,
                    send: false,
                    padding: 1300
                }, options);

                return function (autoAction, element) {
                    var timeout, i;

                    if (['input', 'textarea'].indexOf(element.tagName) === -1) {
                        element = element.querySelector('input, textarea');
                    }

                    element.value = "";
                    timeout = 0;
                    for (i = 0; i < text.length && ((timeout + options.step) < options.timeout); i++) {
                        timeout += options.step;
                        setTimeout(append_character.bind(null, element, text[i]), timeout);
                    }
                    if (i != text.length) {
                        setTimeout(fill_input.bind(null, element, text), options.timeout);
                        timeout = options.timeout;
                    }
                    if (options.send) {
                        setTimeout(function () {
                            element.dispatchEvent(new KeyboardEvent("keydown", {
                                altKey: false,
                                ctrlKey: false,
                                key: "Enter",
                                keyCode: 13,
                                metaKey: false,
                                shiftKey: false
                            }));
                        }, timeout);
                        timeout += options.step;
                    }

                    timeout += options.padding;
                    setTimeout(function () {
                        autoAction.nextHandler();
                    }, timeout);
                };
            },
            scrollIntoView: function scrollIntoView(selector) {
                return function (autoAction) {
                    var element = selector();
                    element.scrollIntoView();
                    autoAction.nextHandler();
                };
            },
            switch_view: function switch_view(view) {
                return function (autoAction) {
                    Wirecloud.UserInterfaceManager.changeCurrentView(view);
                    autoAction.nextHandler();
                };
            },
            uploadComponent: function uploadComponent(id) {
                return function (autoAction, element) {
                    if (!Wirecloud.LocalCatalogue.resourceExistsId(id)) {
                        Wirecloud.LocalCatalogue.addComponent({
                            url: build_static_url('tutorial-data/' + id.split('/').join('_') + '.wgt')
                        }).then(
                            autoAction.nextHandler,
                            autoAction.errorHandler
                        );
                    } else {
                        autoAction.nextHandler();
                    }
                };
            },
            wait_transitions: function wait_transitions() {
                return function (autoAction, element) {
                    var interval = setInterval(function () {
                        var element = document.querySelector(".se-on-transition");
                        if (element == null) {
                            clearInterval(interval);
                            autoAction.nextHandler();
                        }
                    }, 200);
                }
            },
            editorView: {
                wait_mac_wallet_ready: function wait_mac_wallet_ready() {
                    return function (autoAction, element) {
                        var interval = setInterval(function () {
                            var widget_list = document.querySelector(".wc-workspace .wc-resource-results:not(.disabled)");
                            if (widget_list) {
                                clearInterval(interval);
                                autoAction.nextHandler();
                            }
                        }, 200);
                    };
                },

            },
            wiringView: {
                open_component_sidebar: function open_component_sidebar(type) {
                    return function (autoAction, element) {
                        var sidebar_button = Utils.basic_selectors.toolbar_button('we-show-component-sidebar-button')();
                        if (!sidebar_button.classList.contains('active')) {
                            sidebar_button.click();
                        }
                        var component_type_button = Utils.basic_selectors.button('.wiring-sidebar .btn-list-' + type + '-group')();
                        if (!component_type_button.classList.contains('active')) {
                            component_type_button.click();
                        }
                        autoAction.nextHandler();
                    };
                },
                wait_sidebar_ready: function wait_sidebar_ready() {
                    return function (autoAction, element) {
                        var interval = setInterval(function () {
                            var widget_list = document.querySelector(".we-panel-components .wc-resource-results:not(.disabled)");
                            if (widget_list) {
                                clearInterval(interval);
                                autoAction.nextHandler();
                            }
                        }, 200);
                    };
                },
            }
        },
        basic_selectors: {
            back_button: function back_button() {
                return Utils.basic_selectors.button("#wirecloud_header .wc-back-button");
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
            form_field: function form_field(fieldName) {
                return function () {
                    var currentWindowMenu = Wirecloud.UserInterfaceManager.currentWindowMenu;
                    return currentWindowMenu.form.fieldInterfaces[fieldName].inputElement.inputElement;
                };
            },
            mac_wallet_input: function mac_wallet_input() {
                return Utils.basic_selectors.element('.wc-workspace .wc-resource-list .se-field-search');
            },
            mac_wallet_resource: function mac_wallet_resource(resource_title) {
                return function () {
                    var resources, widget;

                    resources = document.querySelectorAll('.wc-workspace .we-component-meta .panel-heading');
                    widget = findElementByTextContent(resources, resource_title);
                    return widget.parentNode;
                };
            },
            mac_wallet_resource_mainbutton: function mac_wallet_resource_mainbutton(resource_title) {
                return function () {
                    var widget = Utils.basic_selectors.mac_wallet_resource(resource_title)();
                    return widget.querySelector(".panel-body .wc-create-resource-component");
                };
            },
            menu_item: function menu_item(title) {
                return function () {
                    var i, items = document.querySelectorAll(".se-popup-menu-item");

                    for (i = items.length - 1; i >= 0; i--) {
                        if (items[i].textContent == title) {
                            return items[i];
                        }
                    }

                    return null;
                };
            },
            toolbar_button: function toolbar_button(button_class) {
                return Utils.basic_selectors.button("#wirecloud_header .wc-toolbar ." + button_class);
            },
            workspaceView: {
                widget_by_title: function widget_by_title(title) {
                    return function () {
                        var i, widgetList;

                        widgetList = document.querySelectorAll('.wc-workspace .wc-widget');

                        for (i = 0; i < widgetList.length; i++) {
                            if (widgetList[i].querySelector('.wc-widget-heading span').textContent === title) {
                                return widgetList[i];
                            }
                        }

                        return null;
                    };
                },
                widget_element: function widget_element(index, selector) {
                    return function () {
                        var widget = Wirecloud.activeWorkspace.widgets[index];
                        var element = widget.wrapperElement.contentDocument.querySelector(selector);
                        return new Wirecloud.ui.Tutorial.WidgetElement(widget, element);
                    };
                }
            },
            wiringView: {
                create_behaviour_button: function create_behaviour_button() {
                    return Utils.basic_selectors.button(".we-panel-behaviours .panel-heading .btn-create");
                },
                enable_behaviours_button: function enable_behaviours_button() {
                    return Utils.basic_selectors.button(".we-panel-behaviours .panel-heading .btn-enable");
                },
                show_behaviours_button: function show_behaviours_button() {
                    return Utils.basic_selectors.button(".wc-toolbar .we-show-behaviour-sidebar-button");
                },
                behaviour_engine: function behaviour_engine() {
                    return function () {
                        return Wirecloud.UserInterfaceManager.views.wiring.behaviourEngine;
                    };
                },
                component_by_id: function component_by_id(type, id_) {
                    return function () {
                        var query, id;

                        // TODO
                        id = "" + id_;
                        if (type === 'widget') {
                            id = "" + Wirecloud.activeWorkspace.widgets[id_].id;
                        }
                        query = Wirecloud.Utils.interpolate(
                            '.wiring-diagram .component-%(type)s[data-id="%(id)s"]',
                            {
                                type: type,
                                id: id
                            }
                        );
                        return document.querySelector(query);
                    };
                },
                connection_engine: function connection_engine() {
                    return function () {
                        return Wirecloud.UserInterfaceManager.views.wiring.connectionEngine;
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
                show_behaviour_prefs_button: function show_behaviour_prefs_button(behaviourId) {
                    return function () {
                        var behaviour = document.querySelectorAll(".we-panel-behaviours .behaviour")[behaviourId];

                        return behaviour.querySelector(".we-prefs-btn");
                    };
                },
                sidebar_input: function sidebar_input() {
                    return Utils.basic_selectors.element('.wc-workspace-wiring .we-panel-components .se-field-search');
                },
                sidebarcomponentgroup_by_id: function sidecomponentgroup(id) {
                    return function () {
                        var query = Wirecloud.Utils.interpolate('.wc-workspace-wiring .we-panel-components .we-component-group[data-id="%(id)s"]', {id: id});
                        return document.querySelector(query);
                    };
                },
                sidebarcomponent_by_id: function sidebarcomponent_by_id(component_meta_id, component_id) {
                    return function () {
                        var componentgroup, components;

                        componentgroup = Utils.basic_selectors.wiringView.sidebarcomponentgroup_by_id(component_meta_id)();
                        if (componentgroup != null) {
                            components = componentgroup.querySelectorAll('.we-component');
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
