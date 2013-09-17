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
        opManager.addWorkspace('Basic concepts tutorial', {
            allow_renaming: true,
            onSuccess: function () {
                autoAction.nextHandler();
            }
        });
    };

    var build_static_url = function build_static_url(path) {
        return base_url + path;
    };

    var reset_marketplace_view = function reset_marketplace_view(autoAction) {
        if (LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local != null) {
            LayoutManagerFactory.getInstance().viewsByName.marketplace.changeCurrentMarket('local');
            LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.home();
        }

        autoAction.nextHandler();
    };

    var install_flickr = function install_flickr(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/flickr/2.7')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_flickr_2.7.wgt'), {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_multimediaViewer = function install_multimediaViewer(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/multimedia-viewer/1.0.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_multimedia-viewer_1.0.1.wgt'), {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_search = function install_search(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/search/1.3.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_search_1.3.1.wgt'), {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_youtubeSearch = function install_youtubeSearch(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/youtube-video-search/2.45.0')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_youtube-video-search_2.45.0.wgt'), {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var ResizeButton = function() {
        return document.getElementsByClassName("rightResizeHandle")[0];
    };

    var widgetHeader = function() {
        return document.getElementsByClassName("widget_menu")[0].getElementsByTagName('span')[0];
    };

    var refreshMarketplace = function refreshMarketplace(autoAction) {
        LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.refresh_search_results();
        autoAction.nextHandler();
    };

    var searchAction = function(autoAction, elem) {
        elem.value = "";
        setTimeout(function() {elem.value = 'y'}, 1000);
        setTimeout(function() {elem.value += 'o'}, 1300);
        setTimeout(function() {elem.value += 'u'}, 1600);
        setTimeout(function() {elem.value += 't'}, 1900);
        setTimeout(function() {elem.value += 'u'}, 2200);
        setTimeout(function() {elem.value += 'b'}, 2500);
        setTimeout(function() {elem.value += 'e'}, 2800);
        setTimeout(function() {elem.value += ' '}, 3100);
        setTimeout(function() {elem.value += 's'}, 3400);
        setTimeout(function() {elem.value += 'e'}, 3700);
        setTimeout(function() {elem.value += 'a'}, 4000);
        setTimeout(function() {elem.value += 'r'}, 4300);
        setTimeout(function() {elem.value += 'c'}, 4600);
        setTimeout(function() {
            elem.value += 'h';
            LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.viewsByName.search._onSearchInput();
        }, 4900);
        setTimeout(function() {autoAction.nextHandler();}, 6500);
    };

    var searchAction2 = function(autoAction, elem) {
        elem.value = "";
        setTimeout(function() {elem.value = 's'}, 1000);
        setTimeout(function() {elem.value += 'e'}, 1300);
        setTimeout(function() {elem.value += 'a'}, 1600);
        setTimeout(function() {elem.value += 'r'}, 1900);
        setTimeout(function() {elem.value += 'c'}, 2200);
        setTimeout(function() {
            elem.value += 'h';
            LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.viewsByName.search._onSearchInput();
        }, 2500);
        setTimeout(function() {autoAction.nextHandler();}, 4100);
    };

    var searchInputMarketplace = function() {
        return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('simple_search_text')[0];
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

    var addbuttonSearch = function() {
        var resources, widget;

        resources = LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('resource_name');
        widget = findElementByTextContent(resources, "Search");
        return widget.parentNode.getElementsByClassName("mainbutton")[0];
    };

    var addbuttonYoutubeSearch = function() {
        var resources, widget;

        resources = LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('resource_name');
        widget = findElementByTextContent(resources, "Youtube Video Search");
        return widget.parentNode.getElementsByClassName("mainbutton")[0];
    };

    var getDocument = function() {
        return document;
    };

    var wirecloud_header = function wirecloud_header() {
        return document.getElementById('wirecloud_header');
    };

    var main_view_button = function(view) {
        return document.getElementById("wirecloud_header").getElementsByClassName(view)[0];
    };

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

    var get_mini_widget = function get_mini_widget(index) {
        var widget_id = opManager.activeWorkspace.getIWidgets()[index].id;
        return LayoutManagerFactory.getInstance().viewsByName.wiring.mini_widgets[widget_id].wrapperElement;
    };

    var deploy_tutorial_menu = function deploy_tutorial_menu(autoAction) {
        var header = document.getElementById('wirecloud_header');
        var button = header.getElementsByClassName('arrow-down-settings')[0];
        button.click();
        autoAction.nextHandler();
    };

    var get_tutorial_menu_item = function get_tutorial_menu_item() {
        var popup_menu = document.getElementsByClassName('popup_menu')[0];
        return findElementByTextContent(popup_menu.getElementsByClassName('menu_item'), 'Tutorials');
    };

    var get_endpoint = function get_endpoint(index, name) {
        var widget_id = opManager.activeWorkspace.getIWidgets()[index].id;
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.iwidgets[widget_id].getAnchor(name).wrapperElement;
    };

    var get_wiring_canvas = function get_wiring_canvas() {
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.canvas;
    };

    var input_box_input = function input_box_input() {
        var widget = opManager.activeWorkspace.getIWidgets()[1];
        return new Wirecloud.ui.Tutorial.WidgetElement(widget, widget.content.contentDocument.getElementById('text'));
    };

    Wirecloud.TutorialCatalogue.add(new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            // Editor
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Welcome to Wirecloud!!</p><p>This tutorial will show you the basic concepts behind Wirecloud.</p>"), 'elem': null},
            {'type': 'autoAction', 'action': create_workspace},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>This is the <em>Editor</em> view. In this view, you can use and modify your workspaces. Currently you are in a newly created workspace: <em>Basic concepts tutorial</em>. This workspace is empty, so the first step is to add widgets from the Wirecloud marketplace.</p>"), 'elem': null},
            // MarketPlace
            {'type': 'autoAction', 'action': reset_marketplace_view},
            {'type': 'userAction', 'msg': gettext("Click <em>Marketplace</em>"), 'elem': main_view_button.bind(null, 'marketplace'), 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext('<p>This is the <em>Marketplace</em> view. In this view you can browse the <em>Mashable Application Components</em> (<em>Widgets, operators</em> and <em>mashups</em>) that are currently available to you. Also, you can browse external catalogues too.</p><div class="alert alert-info"><p>In next steps we need some widgets, so we are going to install them for you in the catalogue. You can safetly uninstall these widgets after finishing the tutorial.</p></div>'), 'elem': null},
            {'type': 'autoAction', 'action': install_flickr},
            {'type': 'autoAction', 'action': install_multimediaViewer},
            {'type': 'autoAction', 'action': install_search},
            {'type': 'autoAction', 'action': install_youtubeSearch},
            {'type': 'autoAction', 'action': refreshMarketplace},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Ok, widgets have been installed successfuly and you can find them in your local catalogue.</p><p>Next step is to add the <em>YouTube Video Search</em> widget to the workspace. You can directly select the widget or, alternatively, you can reduce the list using the keyword search feature.</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': gettext('Typing "youtube search" we can filter widgets that contains in their name or description these words'), 'elem': searchInputMarketplace, 'pos': 'downRight', 'action': searchAction},
            {'type': 'userAction', 'msg': gettext("Once you have the results, you can add the widget. So click <em>Add to workspace</em>"), 'elem': addbuttonYoutubeSearch, 'pos': 'downRight'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p><span class=\"label label-success\">Great!</span> That was easy, wasn't it?.</p><p>Let's continue adding the <em>Search</em> widget.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Click <em>Marketplace</em>"), 'elem': main_view_button.bind(null, 'marketplace'), 'pos': 'downLeft'},
            {'type': 'autoAction', 'msg': gettext('Typing <em>search</em>...'), 'elem': searchInputMarketplace, 'pos': 'downRight', 'action': searchAction2},
            {'type': 'userAction', 'msg': gettext("Click <em>Add to workspace</em>"), 'elem': addbuttonSearch, 'pos': 'downRight'},

            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>One of the main features of Wirecloud is that you can edit your workspaces' layout not only by adding and removing widgets, but also moving and resizing them.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to resize the widget"), 'elem': ResizeButton, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown'},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop to move the widget"), 'elem': widgetHeader, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},

            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Play with the widgets of the wokspace moving, resizing, ... widgets as you like before going into the <em>Wiring</em> view.</p>"), 'elem': null},
            {'type': 'userAction', 'nextStepMsg': gettext("Click <em>Wiring</em> to continue"), 'elem': main_view_button.bind(null, 'wiring'), 'pos': 'downLeft', 'eventToDeactivateLayer': 'mousemove', 'elemToApplyDeactivateLayerEvent': getDocument, 'disableElems': [getMenuWorkspaceButton, getAdminButton, get_close_buttons, main_view_button.bind(null, 'marketplace')]},


            // WiringEditor
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>This is the <em>Wiring</em> view.</p><p>Here you can wire widgets and operators together turning your workspace into and <em>application mashup</em>.</p>"), 'elem': null},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>In left menu you can find all widgets added into your workspace.</p>"), 'elem': get_menubar},

            {'type': 'userAction', 'msg': gettext("Drag &amp; drop Input Box"), 'elem': get_mini_widget.bind(null, 1), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'userAction', 'msg': gettext("Drag &amp; drop Youtube Video Search"), 'elem': get_mini_widget.bind(null, 0), 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},

            {
                'type': 'userAction',
                'msg': gettext("Drag &amp; drop a new connection from <em>Input Box</em>'s <em>keyword</em> endpoint ..."),
                'elem': get_endpoint.bind(null, 1, 'keyword'), 'eventToDeactivateLayer': 'mousedown', 'pos': 'downLeft',
                'restartHandlers': [
                    {'element': get_wiring_canvas, 'event': 'arrowremoved'},
                    {'element': get_wiring_canvas, 'event': 'arrowadded'}
                ],
                'disableElems': [wirecloud_header, get_menubar],
                'nextStepMsg': gettext("... to <em>YouTube Video Search</em>'s <em>keyword</em> endpoint"),
                'elemToApplyNextStepEvent': get_endpoint.bind(null, 0, 'keyword'), 'event': 'mouseup', 'second_pos': 'downLeft',
            },
            {'type': 'userAction', 'msg': gettext("Click <em>Editor</em>"), 'elem': main_view_button.bind(null, 'workspace'), 'pos': 'downLeft'},
            {'type': 'userAction', 'msg': gettext("Enter a search keyword and press Enter"), 'elem': input_box_input, 'pos': 'downLeft'},

            {'type': 'autoAction', 'action': deploy_tutorial_menu},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>This is the end of this tutorial. Remember that you can always go to the Tutorial menu for others.</p>"), 'elem': get_tutorial_menu_item},
    ]));

})();
