/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var BS = Wirecloud.ui.Tutorial.Utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.Utils.basic_actions;

    var widget_title = function (index) {
        var widget = Wirecloud.activeWorkspace.view.widgets[index];
        return widget.wrapperElement.getElementsByClassName("wc-widget-heading")[0].getElementsByTagName('span')[0];
    };

    var get_menubar = function get_menubar() {
        return document.querySelector(".wiring-sidebar .we-panel-components");
    };

    var widget_menu = function widget_menu(index) {
        var widget = Wirecloud.activeWorkspace.view.widgets[index];
        return widget.wrapperElement.getElementsByClassName('wc-menu-button')[0];
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

    Wirecloud.TutorialCatalogue.add('basic-concepts', new Wirecloud.ui.Tutorial(utils.gettext('Basic concepts'), [
            // Editor
            {type: 'simpleDescription', title: utils.gettext('WireCloud Basic Tutorial'), msg: utils.gettext("<p>Welcome to WireCloud!!</p><p>This tutorial will show you the basic concepts behind WireCloud.</p>")},
            {type: 'autoAction', action: BA.switch_view('workspace')},
            {type: 'autoAction', action: BA.create_workspace({name: 'Basic concepts tutorial'})},
            {type: 'simpleDescription', title: utils.gettext('WireCloud Basic Tutorial'), msg: utils.gettext('<p>This is the <em>Editor</em> view. In this view, you can use and modify your workspaces. Currently you are in a newly created workspace: <em>Basic concepts tutorial</em>. This workspace is empty, so the first step is to add some widgets.</p><div class="alert alert-info"><p>In next steps we need some widgets, so we are going to install them for you. You can safely uninstall these widgets after finishing the tutorial.</p></div>')},

            // My Resources
            {'type': 'autoAction', 'action': BA.uploadComponent('CoNWeT/input-box/1.0')},
            {'type': 'autoAction', 'action': BA.uploadComponent('CoNWeT/youtube-browser/3.0')},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>Ok, widgets have been installed successfuly.</p><p>Next step is to add the <em>YouTube Browser</em> widget to the workspace.</p>")},
            {'type': 'userAction', 'msg': utils.gettext("Click the <em>Add components</em> button"), 'elem': BS.toolbar_button('wc-show-component-sidebar-button'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('wc-show-component-sidebar-button'), 'action': BA.sleep(500)},
            {'type': 'autoAction', 'msg': utils.gettext('By typing "browser" we can filter widgets that contains in their name or description these words'), 'elem': BS.mac_wallet_input(), 'pos': 'downRight', 'action': BA.input('browser', {send: true})},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.editorView.wait_mac_wallet_ready()},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.scrollIntoView(BS.mac_wallet_resource("YouTube Browser"))},
            {'type': 'userAction', 'msg': utils.gettext("Once you have the results, you can add the widget. So click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton("YouTube Browser"), 'pos': 'downRight'},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p><span class=\"label label-success\">Great!</span> That was easy, wasn't it?.</p><p>Let's continue adding the <em>Input Box</em> widget.</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': utils.gettext('Typing <em>input box</em>...'), 'elem': BS.mac_wallet_input(), 'pos': 'downRight', 'action': BA.input('input box', {send: true})},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.editorView.wait_mac_wallet_ready()},
            {'type': 'autoAction', 'elem': BS.mac_wallet_input(), 'action': BA.scrollIntoView(BS.mac_wallet_resource("Input Box"))},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Add to workspace</em>"), 'elem': BS.mac_wallet_resource_mainbutton("Input Box"), 'pos': 'downRight'},
            {'type': 'userAction', 'msg': utils.gettext("Close the component sidebar"), 'elem': BS.toolbar_button('wc-show-component-sidebar-button'), 'pos': 'downRight'},

            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>One of the main features of WireCloud is that you can edit your workspaces' layout not only by adding and removing widgets, but also moving, resizing, renaming, etc.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': utils.gettext("Drag &amp; drop to resize the widget"), 'elem': BS.element(".wc-bottom-right-resize-handle"), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': document},
            {'type': 'userAction', 'msg': utils.gettext("Drag &amp; drop to move the widget"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': document},
            {'type': 'userAction', 'msg': utils.gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': document},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Rename</em>"), 'elem': BS.menu_item(utils.gettext('Rename')), 'pos': 'downRight', 'event': 'click'},
            {'type': 'userAction', 'msg': utils.gettext("Enter a new name for the widget (e.g <em>Search</em>) and press <kbd>Enter</kbd> or click outside the title"), 'elem': widget_title.bind(null, 1), 'pos': 'downRight', 'event': 'blur'},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>Also, some widgets can be parameterized through settings giving you the chance to use them for very general purporses.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': utils.gettext("Open <em>Input Box</em> menu"), 'elem': widget_menu.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': document},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Settings</em>"), 'elem': BS.menu_item(utils.gettext('Settings')), 'pos': 'downRight', 'event': 'click'},
            {
                'type': 'formAction',
                'form': windowForm,
                'actionElements': [BS.form_field('input_label_pref'), BS.form_field('input_placeholder_pref'), BS.form_field('button_label_pref')],
                'actionElementsValidators': [isNotEmpty, isNotEmpty, isNotEmpty],
                'actionMsgs': [utils.gettext("Write a label for the input, e.g. <em>Multimedia</em>."), utils.gettext("Write a better placeholder text for the input, e.g. <em>Keywords</em>"), utils.gettext("Write a better label for the button, e.g <em>Search</em>.")],
                'actionElementsPos': ['topRight', 'topRight', 'topRight'],
                'endElementMsg': utils.gettext("Click here to submit"),
                'endElementPos': 'topLeft',
                'asynchronous': true
            },

            {'type': 'userAction', 'msg': utils.gettext("Click <em>Wiring</em> to continue"), 'elem': BS.toolbar_button('wc-show-wiring-button'), 'pos': 'downLeft'},

            // Wiring editor
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>This is the <em>Wiring Editor</em> view.</p><p>Here you can wire widgets and operators together turning your workspace into and <em>application mashup</em>.</p>")},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Find components</em> to open the sidebar"), 'elem': BS.toolbar_button('we-show-component-sidebar-button'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('we-show-component-sidebar-button'), 'action': BA.sleep(250)},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Widgets</em>"), 'elem': BS.button('.wiring-sidebar .btn-list-widget-group'), 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>In this sidebar you can find all the available widgets. In our example, we are interested in the widgets added to the workspace: the <em>YouTube Browser</em> and the <em>Input Box</em> (This last will be listed using the new name given in previous step).</p><p>You can also find <em>operators</em>. These components can act as source, transformators or data targets as well as a combination of these behaviours.</p>"), 'elem': get_menubar},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("<p>In the next steps, we are going to connect the <em>Input Box</em> and <em>YouTube Browser</em> widgets together. This will allow you to perform searches in the <em>YouTube Browser</em> through the <em>Input Box</em> widget.</p>"), 'elem': get_menubar},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.input('Input Box', {send: true, timeout: 0, padding: 0})},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.wiringView.wait_sidebar_ready()},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.scrollIntoView(BS.wiringView.sidebarcomponentgroup_by_id("CoNWeT/input-box"))},
            {
                'type': 'userAction',
                'msg': utils.gettext("Drag &amp; drop the <em>Input Box</em> widget"),
                'elem': BS.wiringView.sidebarcomponent_by_id("CoNWeT/input-box", 0),
                'pos': 'downRight',
                'event': 'change',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': BS.wiringView.behaviour_engine(),
            },
            {'type': 'autoAction', 'action': BA.sleep(200)},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.input('YouTube Browser', {send: true, timeout: 0, padding: 0})},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.wiringView.wait_sidebar_ready()},
            {'type': 'autoAction', 'elem': BS.wiringView.sidebar_input(), 'action': BA.scrollIntoView(BS.wiringView.sidebarcomponentgroup_by_id("CoNWeT/youtube-browser"))},
            {
                'type': 'userAction',
                'msg': utils.gettext("Drag &amp; drop the <em>YouTube Browser</em> widget"),
                'elem': BS.wiringView.sidebarcomponent_by_id("CoNWeT/youtube-browser", 0),
                'pos': 'downRight',
                'event': 'change',
                'eventToDeactivateLayer': 'mousedown',
                'elemToApplyNextStepEvent': BS.wiringView.behaviour_engine(),

            },
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Find components</em> to close the sidebar"), 'elem': BS.toolbar_button('we-show-component-sidebar-button'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'elem': BS.toolbar_button('we-show-component-sidebar-button'), 'action': BA.sleep(250)},
            {
                'type': 'userAction',
                'msg': utils.gettext("Drag &amp; drop a new connection from <em>Search Box</em>'s <em>keyword</em> endpoint ..."),
                'elem': BS.wiringView.endpoint_by_name('widget', 1, 'source', 'outputKeyword'),
                'eventToDeactivateLayer': 'mousedown', 'pos': 'downLeft',
                'restartHandlers': [
                    {'element': BS.wiringView.connection_engine(), 'event': 'cancel'}
                ],
                'nextStepMsg': utils.gettext("... to <em>YouTube Browser</em>'s <em>keyword</em> endpoint"),
                'elemToApplyNextStepEvent': BS.wiringView.connection_engine(), 'event': 'establish',
                'targetElement': BS.wiringView.endpoint_by_name('widget', 0, 'target', 'keyword'), 'secondPos': 'downLeft'
            },
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext("Now it's time to test our creation.")},
            {'type': 'userAction', 'msg': utils.gettext("Click <em>Back</em>"), 'elem': BS.back_button(), 'pos': 'downRight'},
            {'type': 'autoAction', 'action': BA.wait_transitions()},
            {'type': 'userAction', 'msg': utils.gettext("Enter a search keyword and press <kbd>Enter</kbd>"), 'elem': BS.workspaceView.widget_element(1, 'input'), 'pos': 'downLeft', 'event': 'keypress', 'eventFilterFunction': enter_keypress},

            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext('<p><span class="label label-success">Congratulations!</span> you have finished your first <em>application mashup</em>.</p><p>As you can see, the <em>YouTube Browser</em> widget has been updated successfuly.</p>'), 'elem': BS.workspaceView.widget_by_title('YouTube Browser')},
            {'type': 'autoAction', 'action': BA.click(100), 'elem': BS.button('#wirecloud_header .arrow-down-settings, #wirecloud_header .btn-success')},
            {'type': 'simpleDescription', 'title': utils.gettext('WireCloud Basic Tutorial'), 'msg': utils.gettext('<p>This is the end of this tutorial. Remember that you can always go to the Tutorial menu for others.</p>'), 'elem': BS.menu_item(utils.gettext('Tutorials'))}
    ]));

})(Wirecloud.Utils);
