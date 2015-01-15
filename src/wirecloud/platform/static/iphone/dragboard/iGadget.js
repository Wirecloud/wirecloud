/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global OpManagerFactory, MYMW, window, interpolate, gettext, LayoutManagerFactory, Wirecloud */
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
* This class represents a instance of a Widget.
* @author aarranz
*/
function IWidget(widget, iWidgetId, iWidgetCode, iWidgetName, dragboard, alternative, description) {
    this.code = iWidgetCode;

    this.dragboard = dragboard;
    this.element = null;
    this.content = null;

    this.internal_iwidget = new Wirecloud.IWidget(
        widget,
        dragboard.tab,
        description
    );
    Object.defineProperties(this, {
        'id': {get: function () {return this.internal_iwidget.id;}},
        'widget': {get: function () {return this.internal_iwidget.widget;}},
        'name': {get: function () {return this.internal_iwidget.name;}},
        'alternative': {value: alternative}
    });
    this.codeURL = this.internal_iwidget.widget.code_url + "#id=" + this.id;
    this.loaded = false;
    this.alternative.addEventListener('show', function () {
        this.dragboard._updateIWidgetInfo(this);
        this.paint();
    }.bind(this));

}

/**
* Paints the widget instance
* @param where HTML Element where the iwidget will be painted
*/
IWidget.prototype.paint = function () {

    if (this.element !== null) {
        return;
    }

    var contents = this.internal_iwidget.buildInterface(Wirecloud.currentTheme.templates['iwidget_smartphone'], this);

    this.element = contents.element;
    this.content = this.element.getElementsByTagName('iframe')[0];

    this.alternative.appendChild(this.element);

    this.internal_iwidget.addEventListener('load', function () {
        new MobileScrollManager(this.content.contentDocument, {
            'capture': true,
            'propagate': true
        });
    }.bind(this));

    this.content.setAttribute("src", this.codeURL);
};

IWidget.prototype.load = IWidget.prototype.paint;

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IWidget.prototype.destroy = function () {
    if (this.element) {
        Wirecloud.Utils.removeFromParent(this.element);
        this.element = null;
        this.content = null;
    }

    if (this.internal_iwidget != null) {
        this.internal_iwidget.destroy();
        this.internal_iwidget = null;
    }
};
