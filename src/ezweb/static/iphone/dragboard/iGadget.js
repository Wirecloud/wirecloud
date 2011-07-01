/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $, Event, OpManagerFactory, MYMW, window, interpolate, gettext, LogManagerFactory, LayoutManagerFactory, PersistenceEngineFactory, Hash, URIs */
"use strict";

/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/**
* This class represents a instance of a Gadget.
* @author aarranz
*/
function IGadget(gadget, iGadgetId, iGadgetCode, iGadgetName, dragboard) {
    this.id = iGadgetId;
    this.code = iGadgetCode;
    this.name = iGadgetName;
    this.gadget = gadget;

    this.dragboard = dragboard;
    this.iGadgetElement = $('mymw-content');
    this.iGadgetTabBar = $('mymw-nav');

    this.loaded = false;
}

/**
* Returns the associated Gadget class.
*/
IGadget.prototype.getGadget = function () {
    return this.gadget;
};

/**
* Return the Tab of the IGadget
*/
IGadget.prototype.getTab = function () {
    return this.dragboard.tab;
};

IGadget.prototype.getId = function () {
    return this.id;
};

IGadget.prototype.getVisibleName = function () {
    var visibleName = this.name;
    if (visibleName.length > 13) {
        visibleName = visibleName.substring(0, 11) + "...";
    }
    return visibleName;
};

/**
* Paints the gadget instance
* @param where HTML Element where the igadget will be painted
*/
IGadget.prototype.paint = function () {

    //Generate the related gadgets html
    var relatedhtml = "",
        related = this.dragboard.workSpace.getRelatedIGadgets(this.id),
        i, html, tab;

    if (related.length > 0) {
        relatedhtml += '<div id="related_gadgets" class="related_gadgets">';
        for (i = 0; i < related.length; i += 1) {
            relatedhtml += '<div class="related_gadget_div" onclick="OpManagerFactory.getInstance().showRelatedIgadget(' + related[i].id + ',' + related[i].dragboard.tab.tabInfo.id + ')" >';
            relatedhtml += '<img id="related_' + related[i].getId() + '" class="related_gadget" src="' + related[i].getGadget().getIPhoneImageURI() + '" />';
            relatedhtml += '</div>';
        }
        relatedhtml += '</div>';
    }

    // Generate the Gadget html
    html = '<div id="gadget_' + this.id + '" class="';
    if (related.length > 0) {
        html += 'gadget_content">';
    } else {
        html += 'gadget_content_full">';
    }
    html += '<object id="object_' + this.id + '" onload=\'OpManagerFactory.getInstance().igadgetLoaded(' + this.id + ');\' class="gadget_object" type="text/html" data="' + this.gadget.getXHtml().getURICode() + '?id=' + this.id + '" standby="Loading...">';
    html += '"Loading...."';
    html += '</object></div>';

    //create a new Tab and add the new content
    tab = new MYMW.ui.Tab({
        id : this.getTabId(),
        label : this.getVisibleName(),
        content : html + relatedhtml,
        onclick : function () {
            this.dragboard.unmarkRelatedIgadget(this.id);
            this.dragboard.updateTab();
        }.bind(this)
    });
    this.dragboard.workSpace.tabView.addTab(tab);
    this.dragboard.workSpace.tabView.set('activeTab', tab);
};

IGadget.prototype.privateNotifyLoaded = function () {
    if (this.loaded) {
        return;
    }

    this.loaded = true;

    var unloadElement = $("object_" + this.id).contentDocument.defaultView;

    Event.observe(unloadElement, 'unload', function () {
        OpManagerFactory.getInstance().igadgetUnloaded(this.id);
    }.bind(this), true);
};

IGadget.prototype.privateNotifyUnloaded = function () {
    if (!this.loaded) {
        return;
    }

    this.loaded = false;
};

IGadget.prototype.getTabId = function () {
    return "mymwtab_" + this.id;
};

/**
* Saves the igadget into persistence. Used only for the first time, that is, for creating igadgets.
*/
IGadget.prototype.save = function () {
    function onSuccess(transport) {
        var igadgetInfo = JSON.parse(transport.responseText);
        window.id = igadgetInfo.id;
        window.dragboard.addIGadget(window, igadgetInfo);
    }

    function onError(transport, e) {
        var msg;
        if (e) {
            msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
                {
                    errorFile: e.fileName,
                    errorLine: e.lineNumber,
                    errorDesc: e
                }, true);
        } else if (transport.responseXML) {
            msg = transport.responseXML.documentElement.textContent;
        } else {
            msg = "HTTP Error " + transport.status + " - " + transport.statusText;
        }

        msg = interpolate(gettext("Error adding igadget to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
        LogManagerFactory.getInstance().log(msg);
    }

    if (this.dragboard.isLocked()) {
        LayoutManagerFactory.getInstance().showMessageMenu(
            interpolate(gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab."), {
                'tabName': this.dragboard.tab.tabInfo.name
            }, true));
        return;
    }

    var persistenceEngine = PersistenceEngineFactory.getInstance(),
        data = new Hash(),
        uri;

    data.left = this.position.x;
    data.top = this.position.y;
    data.width = this.contentWidth;
    data.height = this.contentHeight;
    data.code = this.code;
    data.name = this.name;

    uri = URIs.POST_IGADGET.evaluate({
        tabId: this.dragboard.tabId,
        workspaceId: this.dragboard.workSpaceId
    });

    data.uri = uri;
    data.gadget = URIs.GET_GADGET.evaluate({
        vendor: this.gadget.getVendor(),
        name: this.gadget.getName(),
        version: this.gadget.getVersion()
    });
    data = {
        igadget: data.toJSON()
    };
    persistenceEngine.send_post(uri, data, this, onSuccess, onError);
};

/*
* Perform the properly actions to show to the user that the gadget has received and event
*/
IGadget.prototype.notifyEvent = function () {
    // nothing to do in iphone
};
