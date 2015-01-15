/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global OpManagerFactory, IWidget, updateLayout, Wirecloud */

(function () {

    "use strict";

    var Dragboard = function Dragboard(tab, workspace, dragboardElement) {

        // *********************************
        // PRIVATE VARIABLES
        // *********************************
        this.currentCode = 1;

        // HTML Elements
        this.dragboardElement = document.getElementById('dragboard');
        this.barElement = document.getElementById('bar');

        // Atributes
        this.iWidgets = {};
        this.tab = tab;
        this.workspace = workspace;

        this.parseTab(tab.tabInfo);
    };

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
        var curIWidget, iwidget, widget, i,
            container, opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iWidgets = {};

        // For controlling when the iwidgets are totally loaded!
        this.iwidgets = tabInfo.iwidgets;
        for (i = 0; i < this.iwidgets.length; i += 1) {
            curIWidget = this.iwidgets[i];

            // Get widget model
            widget = this.workspace.resources.getResourceId(curIWidget.widget);

            // Create instance model
            container = opManager.globalDragboard.newIWidgetContainer();
            iwidget = new IWidget(widget, curIWidget.id, curIWidget.code, curIWidget.name, this, container, curIWidget);
            this.iWidgets[curIWidget.id] = iwidget;

            if (curIWidget.code >= this.currentCode) {
                this.currentCode =  curIWidget.code + 1;
            }
        }
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

    window.Dragboard = Dragboard;

})();
