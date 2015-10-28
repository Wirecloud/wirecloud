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

/*global gettext, Wirecloud*/

(function () {

    "use strict";

    var BS = Wirecloud.ui.Tutorial.Utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.Utils.basic_actions;

    var widget_title = function (index) {
        var widget = Wirecloud.activeWorkspace.getIWidgets()[index];
        return widget.element.getElementsByClassName("widget_menu")[0].getElementsByTagName('span')[0];
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

    var getDocument = function () {
        return document;
    };

    var get_menubar = function get_menubar() {
        return document.querySelector(".wiring-sidebar .panel-components");
    };

    var widget_menu = function widget_menu(index) {
        var iwidget = Wirecloud.activeWorkspace.getIWidgets()[index];
        return iwidget.element.getElementsByClassName('icon-cogs')[0];
    };

    var enter_keypress = function (e) {
        return e.keyCode === 13;
    };

    var windowForm = function (callback) {
        var interval;

        interval = setInterval(function () {
            var currentWindowMenu = Wirecloud.UserInterfaceManager.currentWindowMenu;
            if (currentWindowMenu != null && "form" in currentWindowMenu) {
                clearInterval(interval);
                callback(currentWindowMenu.form);
            }
        }, 200);
    };

    var isNotEmpty = function isNotEmpty(input) {
        return input.value !== '';
    };

    Wirecloud.TutorialCatalogue.add('basic-concepts', new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            // Editor
            {type: 'simpleDescription', title: gettext('WireCloud Basic Tutorial'), msg: gettext("<p>Welcome to WireCloud!!</p><p>This tutorial will show you the basic concepts behind WireCloud.</p>")},
            {type: 'autoAction', action: BA.switch_view('workspace')},
            {type: 'autoAction', action: BA.create_workspace({name: 'Basic concepts tutorial'})},
            {type: 'simpleDescription', title: gettext('WireCloud Basic Tutorial'), msg: gettext('<p>This is the <em>Editor</em> view. In this view, you can use and modify your workspaces. Currently you are in a newly created workspace: <em>Basic concepts tutorial</em>. This workspace is empty, so the first step is to add some widgets.</p><div class="alert alert-info"><p>In next steps we need some widgets, so we are going to install them for you. You can safetly uninstall these widgets after finishing the tutorial.</p></div>')},

            // Marketplace
            {'type': 'autoAction', 'action': BA.uploadComponent('CoNWeT/input-box/1.0')},
            {'type': 'autoAction', 'action': BA.uploadComponent('CoNWeT/youtube-browser/3.0')},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>Ok, widgets have been installed successfuly.</p><p>Next step is to add the <em>YouTube Browser</em> widget to the workspace.</p>")},
            {'type': 'userAction', 'msg': gettext("Click the <em>Add widget</em> button"), 'elem': BS.toolbar_button('icon-plus'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('icon-plus'), 'action': BA.sleep(500)},
            {'type': 'autoAction', 'msg': gettext('By typing "browser" we can filter widgets that contains in their name or description these words'), 'elem': BS.mac_wallet_input(), 'pos': 'downRight', 'action': BA.input('browser', {send: true})},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.editorView.wait_mac_wallet_ready()},
            {'type': 'userAction', 'msg': gettext("Once you have the results, you can add the widget. So click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton("YouTube Browser"), 'pos': 'downRight'},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p><span class=\"label label-success\">Great!</span> That was easy, wasn't it?.</p><p>Let's continue adding the <em>Input Box</em> widget.</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': gettext('Typing <em>input box</em>...'), 'elem': BS.mac_wallet_input(), 'pos': 'downRight', 'action': BA.input('input box', {send: true})},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.editorView.wait_mac_wallet_ready()},
            {'type': 'userAction', 'msg': gettext("Click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton("Input Box"), 'pos': 'downRight'},
            {'type': 'userAction', 'msg': gettext("Close the widget wallet"), 'elem': BS.mac_wallet_close_button(), 'pos': 'downRight'},

            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>One of the main features of WireCloud is that you can edit your workspaces' layout not only by adding and removing widgets, but also moving, resizing, renaming, etc.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to resize the widget"), 'elem': BS.element(".rightResizeHandle"), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown'},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to move the widget"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Click <em>Rename</em>"), 'elem': BS.menu_item(gettext('Rename')), 'pos': 'downRight', 'event': 'click'},
            {'type': 'userAction', 'msg': gettext("Enter a new name for the widget (e.g <em>Search</em>) and press <kbd>Enter</kbd> or click outside the title"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'blur'},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>Also, some widgets can be parameterized through settings giving you the chance to use them for very general purporses.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Click <em>Settings</em>"), 'elem': BS.menu_item(gettext('Settings')), 'pos': 'downRight', 'event': 'click'},
            {
                'type': 'formAction',
                'form': windowForm,
                'actionElements': [BS.form_field('input_label_pref'), BS.form_field('input_placeholder_pref'), BS.form_field('button_label_pref')],
                'actionElementsValidators': [isNotEmpty, isNotEmpty, isNotEmpty],
                'actionMsgs': [gettext("Write a label for the input, e.g. <em>Multimedia</em>."), gettext("Write a better placeholder text for the input, e.g. <em>Keywords</em>"), gettext("Write a better label for the button, e.g <em>Search</em>.")],
                'actionElementsPos': ['topRight', 'topRight', 'topRight'],
                'endElementMsg': gettext("Click here to submit"),
                'endElementPos': 'topLeft',
                'asynchronous': true
            },

            {'type': 'userAction', 'msg': gettext("Click <em>Wiring</em> to continue"), 'elem': BS.toolbar_button('icon-puzzle-piece'), 'pos': 'downLeft'},

            // WiringEditor
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>This is the <em>Wiring Editor</em> view.</p><p>Here you can wire widgets and operators together turning your workspace into and <em>application mashup</em>.</p>")},
            {'type': 'userAction', 'msg': gettext("Click <em>Find components</em> to open the sidebar"), 'elem': BS.toolbar_button('icon-archive'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('icon-archive'), 'action': BA.sleep(250)},
            {'type': 'userAction', 'msg': gettext("Click <em>Widgets</em>"), 'elem': BS.button('.wiring-sidebar .btn-list-widget-group'), 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>In this sidebar you can find all the widgets that have been added into your workspace. In our example these widgets will be the <em>YouTube Browser</em> and the <em>Input Box</em> (It will be listed using the new name given in previous step).</p><p>You can also find <em>operators</em>. These components can act as source, transformators or data targets as well as a combination of these behaviours.</p>"), 'elem': get_menubar},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("<p>In the next steps, we are going to connect the <em>Input Box</em> and <em>YouTube Browser</em> widgets together. This will allow you to perform searches in the <em>YouTube Browser</em> through the <em>Input Box</em> widget.</p>"), 'elem': get_menubar},
            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop the <em>Input Box</em> widget"),
                'elem': BS.wiringView.sidebarcomponent_by_id("CoNWeT/input-box", 0),
                'pos': 'downRight',
                'event': 'change',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': BS.wiringView.behaviour_engine(),
            },
            {'type': 'autoAction', 'action': BA.sleep(200)},
            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop the <em>YouTube Browser</em> widget"),
                'elem': BS.wiringView.sidebarcomponent_by_id("CoNWeT/youtube-browser", 0),
                'pos': 'downRight',
                'event': 'change',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': BS.wiringView.behaviour_engine(),

            },
            {'type': 'userAction', 'msg': gettext("Click <em>Find components</em> to close the sidebar"), 'elem': BS.toolbar_button('icon-archive'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('icon-archive'), 'action': BA.sleep(250)},
            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop a new connection from <em>Search Box</em>'s <em>keyword</em> endpoint ..."),
                'elem': BS.wiringView.endpoint_by_name('widget', 1, 'source', 'outputKeyword'),
                'eventToDeactivateLayer': 'mousedown', 'pos': 'downLeft',
                'restartHandlers': [
                    {'element': BS.wiringView.connection_engine(), 'event': 'cancel'}
                ],
                'nextStepMsg': gettext("... to <em>YouTube Browser</em>'s <em>keyword</em> endpoint"),
                'elemToApplyNextStepEvent': BS.wiringView.connection_engine(), 'event': 'establish',
                'targetElement': BS.wiringView.endpoint_by_name('widget', 0, 'target', 'keyword'), 'secondPos': 'downLeft'
            },
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext("Now it's time to test our creation.")},
            {'type': 'userAction', 'msg': gettext("Click <em>Back</em>"), 'elem': BS.back_button(), 'pos': 'downRight'},
            {'type': 'userAction', 'msg': gettext("Enter a search keyword and press <kbd>Enter</kbd>"), 'elem': BS.workspaceView.widget_element(1, 'input'), 'pos': 'downLeft', 'event': 'keypress', 'eventFilterFunction': enter_keypress},

            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext('<p><span class="label label-success">Congratulations!</span> you have finished your first <em>application mashup</em>.</p><p>As you can see, the <em>YouTube Browser</em> widget has been updated successfuly.</p>'), 'elem': BS.workspaceView.widget_by_title('YouTube Browser')},
            {'type': 'autoAction', 'action': BA.click(100), 'elem': BS.button('#wirecloud_header .arrow-down-settings, #wirecloud_header .btn-success')},
            {'type': 'simpleDescription', 'title': gettext('WireCloud Basic Tutorial'), 'msg': gettext('<p>This is the end of this tutorial. Remember that you can always go to the Tutorial menu for others.</p>'), 'elem': BS.menu_item(gettext('Tutorials'))}
    ]));

})();
