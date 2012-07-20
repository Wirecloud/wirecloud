/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $, Event, OpManagerFactory, MYMW, window, interpolate, gettext, LogManagerFactory, LayoutManagerFactory, Wirecloud, URIs */
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
function IGadget(gadget, iGadgetId, iGadgetCode, iGadgetName, dragboard, alternative) {
    this.id = iGadgetId;
    this.code = iGadgetCode;
    this.name = iGadgetName;
    this.gadget = gadget;

    this.dragboard = dragboard;
    this.element = null;
    this.content = null;

    this.tab = alternative;
    this.tab.addEventListener('show', function () {
        this.dragboard._updateIGadgetInfo(this);
        this.paint();
    }.bind(this));

    this.loaded = false;

    StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);

    this._notifyLoaded = this._notifyLoaded.bind(this);
    this._notifyUnloaded = this._notifyUnloaded.bind(this);
}
IGadget.prototype = new StyledElements.ObjectWithEvents();

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
    return this.tab;
};

IGadget.prototype.getId = function () {
    return this.id;
};

/**
* Paints the gadget instance
* @param where HTML Element where the igadget will be painted
*/
IGadget.prototype.paint = function () {
    var i, html, tab, opManager;

    if (this.element !== null) {
        return;
    }

    opManager = OpManagerFactory.getInstance();
    this.element = document.createElement('div');
    this.element.setAttribute('class', 'gadget_content');
    this.content = document.createElement('object');
    this.content.addEventListener('load', this._notifyLoaded, true);
    this.content.setAttribute('class', 'gadget_object');
    this.content.setAttribute('type', 'text/html');
    this.content.setAttribute('data', this.gadget.getXHtml().getURICode() + '#id=' + this.id);
    this.element.appendChild(this.content);

    this.tab.appendChild(this.element);
};

IGadget.prototype.load = IGadget.prototype.paint;

IGadget.prototype._notifyLoaded = function () {
    if (this.loaded) {
        return;
    }

    this.loaded = true;

    var opManager = OpManagerFactory.getInstance(),
        unloadElement = this.content.contentDocument.defaultView;

    unloadElement.addEventListener('unload', this._notifyLoaded, true);
    // FIXME
    new MobileScrollManager(this.content.contentDocument, {
        'capture': true,
        'propagate': true
    });

    this.events['load'].dispatch(this);
};

IGadget.prototype._notifyUnloaded = function () {
    if (!this.loaded) {
        return;
    }

    this.loaded = false;
    this.events['unload'].dispatch(this);
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

    var url, data = {};

    data.left = this.position.x;
    data.top = this.position.y;
    data.width = this.contentWidth;
    data.height = this.contentHeight;
    data.code = this.code;
    data.name = this.name;

    url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
        tab_id: this.dragboard.tabId,
        workspace_id: this.dragboard.workSpaceId
    });

    data.gadget = URIs.GET_GADGET.evaluate({
        vendor: this.gadget.getVendor(),
        name: this.gadget.getName(),
        version: this.gadget.getVersion()
    });
    data = {
        igadget: Object.toJSON(data)
    };
    Wirecloud.io.makeRequest(url, {
        method: 'POST',
        parameters: data,
        onSuccess: onSuccess,
        onFailure: onError,
        onException: onError
    });
};

/*
* Perform the properly actions to show to the user that the gadget has received and event
*/
IGadget.prototype.notifyEvent = function () {
    // nothing to do in iphone
};

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function () {
    if (this.element) {
        this.element.remove();
        this.element = null;
        this.content = null;
        this._notifyLoaded = null;
        this._notifyUnloaded = null;
    }
};
