/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    var anchor_element = document.createElement('a');
    anchor_element.href = Wirecloud.URLs.LOCAL_REPOSITORY;
    var base_url = anchor_element.href;
    if (base_url[base_url.length - 1] !== '/') {
        base_url += '/';
    }
    base_url += 'static/';

    var create_workspace = function create_workspace(autoAction) {
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        Wirecloud.createWorkspace({
            name: 'Basic concepts tutorial',
            allow_renaming: true,
            onSuccess: function (workspace) {
                Wirecloud.changeActiveWorkspace(workspace, null, {
                    onSuccess: function () {
                        autoAction.nextHandler();
                    },
                    onFailure: function () {
                        autoAction.fail(); // TODO
                    }
                });
            }
        });
    };

    var build_static_url = function build_static_url(path) {
        return base_url + path;
    };

    var install_input_box = function install_input_box(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/input-box/1.0')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_input-box_1.0.wgt'), {
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_youtubebrowser = function install_youtubebrowser(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/youtube-browser/2.99.0')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_youtube-browser_2.99.0.wgt'), {
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var ResizeButton = function() {
        return document.getElementsByClassName("rightResizeHandle")[0];
    };

    var widget = function(index) {
        var widget = Wirecloud.activeWorkspace.getIWidgets()[index];
        return widget.element;
    };

    var widget_title = function(index) {
        var widget = Wirecloud.activeWorkspace.getIWidgets()[index];
        return widget.element.getElementsByClassName("widget_menu")[0].getElementsByTagName('span')[0];
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

    var getDocument = function() {
        return document;
    };

    var wirecloud_header = function wirecloud_header() {
        return document.getElementById('wirecloud_header');
    };

    var append_character = function append_character(element, character) {
        element.value += character;
    };

    Wirecloud.ui.Tutorial.utils = {
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
    var BS = Wirecloud.ui.Tutorial.utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.utils.basic_actions;

    var get_menubar = function get_menubar() {
        var wiring_editor = document.getElementsByClassName('wiring_editor')[0];
        return wiring_editor.getElementsByClassName('menubar')[0];
    };

    var getMenuWorkspaceButton = function() {
        return document.getElementById('wirecloud_breadcrum').getElementsByClassName('icon-menu')[0];
    };

    var getAdminButton = function() {
        var header = document.getElementById('wirecloud_header');
        var elements = header.getElementsByClassName('user_menu_wrapper');
        if (elements.length == 0) {
            elements = header.getElementsByClassName('nav pull-right');
        }
        return elements[0];
    };

    var get_close_buttons = function get_close_buttons() {
        var workspace = document.getElementById('workspace');
        return workspace.getElementsByClassName('icon-remove');
    };

    var widget_menu = function widget_menu(index) {
        var iwidget = Wirecloud.activeWorkspace.getIWidgets()[index];
        return iwidget.element.getElementsByClassName('icon-cogs')[0];
    };

    var get_mini_widget = function get_mini_widget(index) {
        var widget_id = Wirecloud.activeWorkspace.getIWidgets()[index].id;
        return LayoutManagerFactory.getInstance().viewsByName.wiring.mini_widgets[widget_id].wrapperElement;
    };

    var deploy_tutorial_menu = function deploy_tutorial_menu(autoAction) {
        var header = document.getElementById('wirecloud_header');
        var button = header.getElementsByClassName('arrow-down-settings')[0];

        if (button == null) {
            button = header.getElementsByClassName('btn-success')[0].firstChild;
        }
        button.click();
        autoAction.nextHandler();
    };

    var get_menu_item = function get_menu_item(label) {
        var popup_menu = document.getElementsByClassName('se-popup-menu')[0];
        return findElementByTextContent(popup_menu.getElementsByClassName('se-popup-menu-item'), label);
    };

    var get_endpoint = function get_endpoint(index, name) {
        var widget_id = Wirecloud.activeWorkspace.getIWidgets()[index].id;
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.iwidgets[widget_id].getAnchor(name).wrapperElement;
    };

    var get_full_endpoint = function get_endpoint(index, name) {
        var widget_id = Wirecloud.activeWorkspace.getIWidgets()[index].id;
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.iwidgets[widget_id].getAnchor(name).wrapperElement.parentElement;
    };

    var get_wiring_canvas = function get_wiring_canvas() {
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.canvas;
    };

    var get_wiring = function get_wiring() {
        return LayoutManagerFactory.getInstance().viewsByName["wiring"];
    };

    var input_box_input = function input_box_input() {
        var widget = Wirecloud.activeWorkspace.getIWidgets()[1];
        return new Wirecloud.ui.Tutorial.WidgetElement(widget, widget.content.contentDocument.getElementsByTagName('input')[0]);
    };

    var enter_keypress = function (e) {
        return e.keyCode === 13;
    };

    var windowForm = function(callback) {
        var layoutManager, element, interval;

        layoutManager = LayoutManagerFactory.getInstance();
        interval = setInterval(function () {
            if ('_current_form' in layoutManager.currentMenu) {
                clearInterval(interval);
                callback(layoutManager.currentMenu._current_form);
            }
        }, 200);
    };

    function getField(inputName) {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
         return layoutManager.currentMenu._current_form.fieldInterfaces[inputName].inputElement.inputElement;
    };

    var isNotEmpty = function(input) {
        return input.value != '';
    };

    Wirecloud.TutorialCatalogue.add('basic-concepts', new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            // Editor
            {type: 'simpleDescription', title: gettext('WireCloud Basic Tutorial'), msg: gettext("<p>Welcome to WireCloud!!</p><p>This tutorial will show you the basic concepts behind WireCloud.</p>")},
            {type: 'autoAction', action: create_workspace},
            {type: 'simpleDescription', title: gettext('WireCloud Basic Tutorial'), msg: gettext('<p>This is the <em>Editor</em> view. In this view, you can use and modify your workspaces. Currently you are in a newly created workspace: <em>Basic concepts tutorial</em>. This workspace is empty, so the first step is to add some widgets.</p><div class="alert alert-info"><p>In next steps we need some widgets, so we are going to install them for you in the catalogue. You can safetly uninstall these widgets after finishing the tutorial.</p></div>')},

            // Marketplace
            {'type': 'autoAction', 'action': install_input_box},
            {'type': 'autoAction', 'action': install_youtubebrowser},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>Ok, widgets have been installed successfuly.</p><p>Next step is to add the <em>YouTube Browser</em> widget to the workspace.</p>")},
            {'type': 'userAction', 'msg': gettext("Click the <em>add widget button</em>"), 'elem': BS.toolbar_button.bind(null, 'icon-plus'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'action': BA.sleep.bind(null, 0.5)},
            {'type': 'autoAction', 'msg': gettext('Typing "browser" we can filter widgets that contains in their name or description these words'), 'elem': BS.mac_wallet_input, 'pos': 'downRight', 'action': BA.input.bind(null, 'browser')},
            {'type': 'userAction', 'msg': gettext("Once you have the results, you can add the widget. So click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton.bind(null, "YouTube Browser"), 'pos': 'downRight'},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p><span class=\"label label-success\">Great!</span> That was easy, wasn't it?.</p><p>Let's continue adding the <em>Input Box</em> widget.</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': gettext('Typing <em>input box</em>...'), 'elem': BS.mac_wallet_input, 'pos': 'downRight', 'action': BA.input.bind(null, 'input box')},
            {'type': 'userAction', 'msg': gettext("Click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton.bind(null, "Input Box"), 'pos': 'downRight'},
            {'type': 'userAction', 'msg': gettext("Close the widget wallet"), 'elem': BS.mac_wallet_close_button, 'pos': 'downRight'},

            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>One of the main features of WireCloud is that you can edit your workspaces' layout not only by adding and removing widgets, but also moving, resizing, renaming, etc.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to resize the widget"), 'elem': ResizeButton, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown'},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to move the widget"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Click <em>Rename</em>"), 'elem': get_menu_item.bind(null, gettext('Rename')), 'pos': 'downRight', 'event': 'click'},
            {'type': 'userAction', 'msg': gettext("Enter a new name for the widget (e.g <em>Search</em>) and press Enter"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'blur'},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>Also, some widgets can be parameterized through settings giving you the chance to use them for very general purporses.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Click <em>Settings</em>"), 'elem': get_menu_item.bind(null, gettext('Settings')), 'pos': 'downRight', 'event': 'click'},
            {
                'type': 'formAction',
                'form': windowForm,
                'actionElements': [getField.bind(null, 'input_label_pref'), getField.bind(null,'input_placeholder_pref'), getField.bind(null,'button_label_pref')],
                'actionElementsValidators': [isNotEmpty, isNotEmpty, isNotEmpty],
                'actionMsgs': [gettext("Write a label for the input, e.g. <em>Multimedia</em>."), gettext("Write a better placeholder text for the input, e.g. <em>Keywords</em>"), gettext("Write a better label for the button, e.g <em>Search</em>.")],
                'actionElementsPos': ['topRight', 'topRight', 'topRight'],
                'endElementMsg': gettext("Click here to submit"),
                'endElementPos': 'topLeft',
                'asynchronous': true
            },

            {'type': 'userAction', 'msg': gettext("Click <em>Wiring</em> to continue"), 'elem': BS.toolbar_button.bind(null, 'icon-puzzle-piece'), 'pos': 'downLeft'},


            // WiringEditor
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>This is the <em>Wiring</em> view.</p><p>Here you can wire widgets and operators together turning your workspace into and <em>application mashup</em>.</p>"), 'elem': null},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>In left menu you can find all the widgets that have been added into your workspace. In our example these widgets will be the <em>YouTube Browser</em> and the <em>Input Box</em> (It will be listed using the new name given in previous step).</p><p>You can also find <em>operators</em>. These components can act as source, transformators or data targets and a combination of these behaviours.</p>"), 'elem': get_menubar},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>In the next steps, we are going to connect the <em>Input Box</em> and <em>YouTube Browser</em> widgets together. This will allow you to perform searches in the <em>YouTube Browser</em> through the <em>Input Box</em> widget.</p>"), 'elem': get_menubar},

            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop the <em>Input Box</em> widget"),
                'elem': get_mini_widget.bind(null, 1),
                'pos': 'downRight',
                'restartHandlers': [
                    {'element': get_wiring, 'event': 'widgetaddfail'},
                ],
                'event': 'widgetadded',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': get_wiring,
            },            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop the <em>YouTube Browser</em> widget"),
                'elem': get_mini_widget.bind(null, 0),
                'pos': 'downRight',
                'restartHandlers': [
                    {'element': get_wiring, 'event': 'widgetaddfail'},
                ],
                'event': 'widgetadded',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': get_wiring,

            },
            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop a new connection from <em>Search Box</em>'s <em>keyword</em> endpoint ..."),
                'elem': get_endpoint.bind(null, 1, 'outputKeyword'), 'eventToDeactivateLayer': 'mousedown', 'pos': 'downLeft',
                'restartHandlers': [
                    {'element': get_wiring_canvas, 'event': 'arrowremoved'},
                    {'element': get_wiring_canvas, 'event': 'arrowadded'}
                ],
                'disableElems': [wirecloud_header, get_menubar],
                'nextStepMsg': gettext("... to <em>YouTube Browser</em>'s <em>keyword</em> endpoint"),
                'elemToApplyNextStepEvent': get_full_endpoint.bind(null, 0, 'keyword'), 'event': 'mouseup', 'secondPos': 'downLeft',
            },
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("Now it's time to test our creation.")},
            {'type': 'userAction', 'msg': gettext("Click <em>Editor</em>"), 'elem': BS.back_button, 'pos': 'downLeft'},
            {'type': 'userAction', 'msg': gettext("Enter a search keyword and press Enter"), 'elem': input_box_input, 'pos': 'downLeft', 'event': 'keypress', 'eventFilterFunction': enter_keypress},

            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext('<p><span class="label label-success">Congratulations!</span> you have finished your first <em>application mashup</em>.</p><p>As you can see, the <em>YouTube Browser</em> widget has been updated successfuly.</p>'), 'elem': widget.bind(null, 0)},
            {'type': 'autoAction', 'action': deploy_tutorial_menu},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext('<p>This is the end of this tutorial. Remember that you can always go to the Tutorial menu for others.</p>'), 'elem': get_menu_item.bind(null, 'Tutorials')},
    ]));

})();
