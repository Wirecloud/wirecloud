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
            onSuccess: function () {
                autoAction.nextHandler();
            }
        });
    };

    var build_static_url = function build_static_url(path) {
        return base_url + path;
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
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_youtube-video-search/2.45.0.wgt'), {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var marketplaceButton = function() {
        return document.getElementById("wirecloud_header").getElementsByClassName('marketplace')[0];
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
        setTimeout(function() {elem.value = 'y'}, 100);
        setTimeout(function() {elem.value += 'o'}, 130);
        setTimeout(function() {elem.value += 'u'}, 160);
        setTimeout(function() {elem.value += 't'}, 190);
        setTimeout(function() {elem.value += 'u'}, 220);
        setTimeout(function() {elem.value += 'b'}, 250);
        setTimeout(function() {elem.value += 'e'}, 280);
        setTimeout(function() {elem.value += ' '}, 310);
        setTimeout(function() {elem.value += 's'}, 340);
        setTimeout(function() {elem.value += 'e'}, 370);
        setTimeout(function() {elem.value += 'a'}, 400);
        setTimeout(function() {elem.value += 'r'}, 430);
        setTimeout(function() {elem.value += 'c'}, 460);
        setTimeout(function() {elem.value += 'h'}, 490);
        setTimeout(function() {LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.viewsByName.search._onSearchInput()}, 520);
        setTimeout(function() {autoAction.nextHandler();}, 550);
    };

    var searchAction2 = function(autoAction, elem) {
        elem.value = "";
        setTimeout(function() {elem.value = 's'}, 100);
        setTimeout(function() {elem.value += 'e'}, 130);
        setTimeout(function() {elem.value += 'a'}, 160);
        setTimeout(function() {elem.value += 'r'}, 190);
        setTimeout(function() {elem.value += 'c'}, 220);
        setTimeout(function() {elem.value += 'h'}, 250);

        setTimeout(function() {LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local.viewsByName.search._onSearchInput()}, 280);
        setTimeout(function() {autoAction.nextHandler();}, 310);
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
        widget = findElementByTextContent(resources, "search");
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

    var wiringEditorButton = function() {
        return document.getElementById("wirecloud_header").getElementsByClassName('wiring')[0];
    };

    var getMenuBar = function() {
        return document.getElementsByClassName('menubar')[0];
    };

    Wirecloud.TutorialCatalogue.add(new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            // Editor
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Welcome to Wirecloud!!</p><p>This tutorial will show you the basic concepts behind Wirecloud.</p>"), 'elem': null},
            {'type': 'autoAction', 'action': create_workspace},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>This is the Editor view. In this view, you can see your current workspace. Currently you are in the 'Basic concepts tutorial' workspace and it's empty.</p><p>To add new widgets to this workspace need to visit the Wirecloud marketplace.</p>"), 'elem': null},
            // MarketPlace
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': marketplaceButton, 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>To continue with this tutorial you need to have installed some widgets. For this time, we help you installing it automatically.</p><p>To learn to upload your own widgets active the 'upload widget tutorial'</p>"), 'elem': null},
            {'type': 'autoAction', 'action': install_flickr},
            {'type': 'autoAction', 'action': install_multimediaViewer},
            {'type': 'autoAction', 'action': install_search},
            {'type': 'autoAction', 'action': install_youtubeSearch},
            {'type': 'autoAction', 'action': refreshMarketplace},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Now you can find in your local catalog installed a collection of widgets to continue with this tutorial.</p><p>We will start adding to your workspace a Youtube video search widget</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': 'Typing "youtube search" we can filter widgets that contains in their name or description this words', 'elem': searchInputMarketplace, 'pos': 'downRight', 'action': searchAction},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': "Now, you can see the search results", 'elem': null, 'pos': 'up'},
            {'type': 'userAction', 'msg': "Click here to add this widget in your workspace", 'elem': addbuttonYoutubeSearch, 'pos': 'downRight'},
            // Editor after add Youtube Search widget
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Once you have added your widget, you can use it in the workspace.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': "Drag and drop to resize the widget", 'elem': ResizeButton, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>You can move widgets too.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': "Drag and drop to move the widget", 'elem': widgetHeader, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>In order to design a useful mashup, we need to add more widgets from marketplace.</p>"), 'elem': null},
            // Marketplace
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': marketplaceButton, 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Now we are going to add the search widget in the workspace</p>"), 'elem': null},
            {'type': 'autoAction', 'msg': 'Typing "search" we can filter widgets that contains in their name or description this words', 'elem': searchInputMarketplace, 'pos': 'downRight', 'action': searchAction2},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': "This is the same process we followed previously", 'elem': null, 'pos': 'up'},
            {'type': 'userAction', 'msg': "Click here to add this widget in your workspace", 'elem': addbuttonSearch, 'pos': 'downRight'},
            // Editor after add search widget
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>You can move your widgets as you want.</p>"), 'elem': null},
            // WiringEditor
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': wiringEditorButton, 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Welcome to wiringEditor!</p><p>Here you can connect your widgets to complete your first litle mashup application</p>"), 'elem': null},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>In left menu you can find all widgets added into your workspace and all operators installed in your account</p>"), 'elem': getMenuBar},
            
            

    ]));

})();
