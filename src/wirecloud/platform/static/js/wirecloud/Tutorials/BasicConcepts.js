/*global Wirecloud*/

(function () {

    "use strict";

    var create_workspace = function create_workspace(autoAction) {
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        opManager.addWorkspace('Basic concepts tutorial', {
            onSuccess: function () {
                autoAction.nextHandler();
            }
        });
    };

    var install_flickr = function install_flickr(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/flickr/2.7')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://192.168.1.125:8000/loswidgetdeltutorial/Flickr.wgt', {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_multimediaViewer = function install_multimediaViewer(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/multimedia-viewer/1.0.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://192.168.1.125:8000/loswidgetdeltutorial/MultimediaViewer.wgt', {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_search = function install_search(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/search/1.3.1')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://192.168.1.125:8000/loswidgetdeltutorial/Search.wgt', {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var install_youtubeSearch = function install_youtubeSearch(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/youTube-video-search/2.45.0')) {
            Wirecloud.LocalCatalogue.addResourceFromURL('http://192.168.1.125:8000/loswidgetdeltutorial/YoutubeSearch.wgt', {
                packaged: true,
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var marketplaceButton = function() {
        return document.getElementById("wirecloud_header").childNodes[0].childNodes[0].childNodes[2];
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

    var addbuttonYoutubeSearch = function() {
        var resources, widget;

        resources = LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().viewsByName.search.wrapperElement.getElementsByClassName('resource_name');
        widget = findElementByTextContent(resources, "Youtube Video Search");
        return widget.parentNode.getElementsByClassName("mainbutton")[0];
    };
    
    var getDocument = function() {
        return document;
    };
    
    Wirecloud.TutorialCatalogue.add(new Wirecloud.ui.Tutorial(gettext('Basic concepts'), [
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Welcome to Wirecloud!!</p><p>This tutorial will show you the basic concepts behind Wirecloud.</p>"), 'elem': null},
            {'type': 'autoAction', 'action': create_workspace},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>This is the Editor view. In this view, you can see your current workspace. Currently you are in the 'Basic concepts tutorial' workspace and it's empty.</p><p>To add new widgets to this workspace need to visit the Wirecloud marketplace.</p>"), 'elem': null},
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
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Once you have added your widget, you can use it in the workspace.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': "Drag and drop to resize the widget", 'elem': ResizeButton, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>You can move widgets too.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': "Drag and drop to move the widget", 'elem': widgetHeader, 'pos': 'downRight', 'event': 'mouseup', 'eventToDeactivateLayer': 'mousedown', 'elemToApplyNextStepEvent': getDocument},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>In order to design a useful mashup, we need to add more widgets from marketplace.</p>"), 'elem': null},
            {'type': 'userAction', 'msg': "Click to open Marketplace", 'elem': marketplaceButton, 'pos': 'downLeft'},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p></p>"), 'elem': null},
            {'type': 'simpleDescription', 'title': gettext('Wirecloud Basic Tutorial'), 'msg': gettext("<p>Congratulations! You have finished the basic concepts tutorial.</p><p>Now you should be ready for using Wirecloud.</p>"), 'elem': null}
    ]));

})();
