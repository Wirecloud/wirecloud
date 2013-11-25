/*global OpManagerFactory, IWidget */
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
* @author aarranz
*/
function Dragboard(tab, workspace, dragboardElement) {
    // *********************************
    // PRIVATE VARIABLES
    // *********************************
    this.currentCode = 1;

    // HTML Elements
    this.dragboardElement = document.getElementById('dragboard');
    this.barElement = document.getElementById('bar');

    //Atributes
    this.iWidgets = {};
    this.tab = tab;
    this.workspace = workspace;

    // ****************
    // PUBLIC METHODS
    // ****************

    Dragboard.prototype.paint = function (iWidgetId) {
        var opManager, iWidget;

        opManager = OpManagerFactory.getInstance();
        iWidget = this.getIWidget(iWidgetId);

        opManager.alternatives.showAlternative(opManager.iwidgetViewAlternative);
        opManager.globalDragboard.show(iWidget.alternative);
        opManager.visibleLayer = "dragboard";
        updateLayout();
    };

    Dragboard.prototype.parseTab = function (tabInfo) {
        var curIWidget, position, width, height, iwidget, widget, minimized, i,
            container, opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iWidgets = {};

        // For controlling when the iwidgets are totally loaded!
        this.iwidgets = tabInfo.iwidgets;
        for (i = 0; i < this.iwidgets.length; i += 1) {
            curIWidget = this.iwidgets[i];

            // Get widget model
            widget = Wirecloud.LocalCatalogue.getResourceId(curIWidget.widget);

            // Create instance model
            container = opManager.globalDragboard.newIWidgetContainer();
            iwidget = new IWidget(widget, curIWidget.id, curIWidget.code, curIWidget.name, this, container, curIWidget.variables);
            this.iWidgets[curIWidget.id] = iwidget;

            if (curIWidget.code >= this.currentCode) {
                this.currentCode =  curIWidget.code + 1;
            }
        }
    };

    Dragboard.prototype.iwidgetLoaded = function (iWidgetId) {
        //DO NOTHING
    };

    Dragboard.prototype.destroy = function () {
        var key;

        //disconect and delete the connectables and variables of all tab iWidgets
        for (key in this.iWidgets) {
            this.iWidgets[key].destroy();
        }
        this.iWidgets = null;
    };

    Dragboard.prototype.getIWidgets = function () {
        return Wirecloud.Utils.values(this.iWidgets);
    };

    Dragboard.prototype.getIWidget = function (iWidgetId) {
        return this.iWidgets[iWidgetId];
    };

    Dragboard.prototype._updateIWidgetInfo = function (iWidget) {
        OpManagerFactory.getInstance().globalDragboard._updateIWidgetInfo(iWidget);
        this.workspace.updateVisibleTab(this.tab.index);
    };

    // *******************
    // INITIALIZING CODE
    // *******************

    this.parseTab(tab.tabInfo);
}
