/*global Hash, $, OpManagerFactory, IWidget */
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
    this.loaded = false;
    this.currentCode = 1;

    // HTML Elements
    this.dragboardElement = $('dragboard');
    this.barElement = $('bar');

    //Atributes
    this.iWidgets = new Hash();
    this.tab = tab;
    this.tabId = tab.tabInfo.id;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceState.id;

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

    Dragboard.prototype.paintRelatedIWidget = function (iWidgetId) {
        var tabId = this.getIWidget(iWidgetId).getTabId(),
            tabIndex = this.workspace.tabView.getTabIndexById(tabId);

        if (tabIndex !== null && tabIndex !== undefined) { // the widget-tab is already visible
            this.setVisibleIWidget(iWidgetId);
            this.workspace.tabView.set('activeTab', this.workspace.tabView.getTab(tabIndex));
        } else {
            this.paint(iWidgetId);
        }
    };

    Dragboard.prototype.markRelatedIwidget = function (iWidgetId) {
        $("related_" + iWidgetId).addClassName("active");

        // highlight related tabs
        var iwidget = this.getIWidget(iWidgetId),
            tabId, tabIndex;
        if (iwidget) {
            tabId = iwidget.getTabId();
            tabIndex = this.workspace.tabView.getTabIndexById(tabId);
            if (tabIndex !== null && tabIndex !== undefined) { // the tab is already visible
                this.workspace.tabView.getTab(tabIndex).set('highlight', true);
            }
        }
    };

    Dragboard.prototype.parseTab = function (tabInfo) {
        var curIWidget, position, width, height, iwidget, widget, minimized, i,
            container, opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iWidgets = new Hash();

        // For controlling when the iwidgets are totally loaded!
        this.iwidgets = tabInfo.iwidgets;
        for (i = 0; i < this.iwidgets.length; i += 1) {
            curIWidget = this.iwidgets[i];

            // Get widget model
            widget = Wirecloud.LocalCatalogue.getResourceId(curIWidget.widget);

            // Create instance model
            container = opManager.globalDragboard.newIWidgetContainer();
            iwidget = new IWidget(widget, curIWidget.id, curIWidget.code, curIWidget.name, this, container);
            this.iWidgets.set(curIWidget.id, iwidget);

            if (curIWidget.code >= this.currentCode) {
                this.currentCode =  curIWidget.code + 1;
            }
        }
        this.loaded = true;
    };

    Dragboard.prototype.iwidgetLoaded = function (iWidgetId) {
        //DO NOTHING
    };

    Dragboard.prototype.destroy = function () {
        var keys = this.iWidgets.keys(),
            i, iwidget;

        //disconect and delete the connectables and variables of all tab iWidgets
        for (i = 0; i < keys.length; i += 1) {
            iwidget = this.iWidgets.get(keys[i]);
            this.iWidgets.unset(keys[i]);
            iwidget.destroy();
        }
        this.iWidgets = null;
    };

    Dragboard.prototype.showInstance = function (iwidget) {
        iwidget.paint();
    };

    Dragboard.prototype.getIWidgets = function () {
        return this.iWidgets.values();
    };

    Dragboard.prototype.getIWidget = function (iWidgetId) {
        return this.iWidgets.get(iWidgetId);
    };

    Dragboard.prototype.getWorkspace = function () {
        return this.workspace;
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
