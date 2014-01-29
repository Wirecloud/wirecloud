/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global Insertion, Dragboard */
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


function Tab(tabInfo, workspace, index) {

    // ****************
    // PUBLIC METHODS
    // ****************

    Tab.prototype.destroy = function () {
        this.dragboard.destroy();
    };

    /*                                                                       *
     *  Paint the iwidget list of this tab. It is used in the first charge.  *
     *                                                                       */
    Tab.prototype.paint = function (container, scrollLeft, index) {
        var iWidgets = this.dragboard.getIWidgets(),
            i, tabsLength, opManager, tabContent,
            iWidgetElement, icon, navBarElement;

        this.tabElement = document.createElement('div');
        this.tabElement.setAttribute('class', "wirecloud_tab");
        this.tabElement.style.left = scrollLeft + 'px';

        /*
         * Tab content
         */
        opManager = OpManagerFactory.getInstance();

        tabContent = document.createElement('div');
        tabContent.setAttribute('class', 'tab_content');
        for (i = 0; i < iWidgets.length; i += 1) {
            iWidgetElement = document.createElement('div');
            iWidgetElement.setAttribute('class', 'iwidget_item');
            icon = document.createElement('img');
            icon.setAttribute('class', "iwidget_icon");
            icon.setAttribute('src', iWidgets[i].widget.getIPhoneImageURI());
            iWidgetElement.appendChild(icon);

            iWidgetElement.appendChild(document.createTextNode(iWidgets[i].name));
            iWidgetElement.addEventListener('click', opManager.showDragboard.bind(opManager, iWidgets[i].id), false);
            tabContent.appendChild(iWidgetElement);
        }
        this.tabElement.appendChild(tabContent);

        container.appendChild(this.tabElement);
    };

    Tab.prototype.updateLayout = function (scrollLeft) {
        if (this.tabElement) {
            this.tabElement.style.left = scrollLeft + "px";
        }
    };

    Tab.prototype.getDragboard = function () {
        return this.dragboard;
    };

    // *****************
    //  PRIVATE METHODS
    // *****************

    Object.defineProperty(this, 'id', {value: tabInfo.id});
    this.workspace = workspace;
    this.tabInfo = tabInfo;
    this.index = index;

    this.dragboard = new Dragboard(this, this.workspace, this.dragboardElement);
    this.tabElement = null;
}
