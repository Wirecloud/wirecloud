/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *     (C) Copyright 2012 Center for Open Middleware
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

/*global opManager, Variable, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * WidgetInterface Class
     */
    var WidgetInterface = function WidgetInterface(wiringEditor, iwidget, manager, isMenubarRef, endPointsPos) {
        var variables, variable, desc, label, name, anchorContext, i, wids;
        this.iwidget = iwidget;
        this.wiringEditor = wiringEditor;

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, this.iwidget.name, manager, 'iwidget');

        if (!isMenubarRef) {
            if ((endPointsPos.sources.length === 0) && (endPointsPos.targets.length === 0)) {
                wids = opManager.activeWorkspace.getIWidgets();
                endPointsPos.sources = wids[wids.indexOf(iwidget)].getWidget().getTemplate().getConnectables().events.slice();
                endPointsPos.targets = wids[wids.indexOf(iwidget)].getWidget().getTemplate().getConnectables().slots.slice();
                for (i = 0; i < endPointsPos.sources.length; i ++) {
                    endPointsPos.sources[i] = endPointsPos.sources[i].name;
                }
                for (i = 0; i < endPointsPos.targets.length; i ++) {
                    endPointsPos.targets[i] = endPointsPos.targets[i].name;
                }
            }
            variables = opManager.activeWorkspace.varManager.getIWidgetVariables(iwidget.getId());
            for (i = 0; i < endPointsPos.sources.length; i ++) {
                variable = variables[endPointsPos.sources[i]];
                desc = variable.vardef.description;
                label = variable.vardef.label;
                anchorContext = {'data': variable, 'iObject': this};
                this.addSource(label, desc, variable.vardef.name, anchorContext);
            }
            for (i = 0; i < endPointsPos.targets.length; i ++) {
                variable = variables[endPointsPos.targets[i]];
                desc = variable.vardef.description;
                label = variable.vardef.label;
                anchorContext = {'data': variable, 'iObject': this};
                this.addTarget(label, desc, variable.vardef.name, anchorContext);
            }
        }
    };

    WidgetInterface.prototype = new Wirecloud.ui.WiringEditor.GenericInterface(true);

    /**
     * onFinish for draggable
     */
    WidgetInterface.prototype.onFinish = function onFinish(draggable, data, e) {
        var position, initialPosition, movement, iwidget_interface, endPointPos;

        position = {posX: 0, posY: 0};
        position = data.iObjectClon.getPosition();

        if (!this.wiringEditor.withinGrid(e)) {
            this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
            return;
        }

        endPointPos = {'sources': [], 'targets': []};
        iwidget_interface = this.wiringEditor.addIWidget(this.wiringEditor, this.iwidget, endPointPos);

        position.posX -= 180;

        if (position.posX < 0) {
            position.posX = 8;
        }
        if (position.posY < 0) {
            position.posY = 8;
        }
        iwidget_interface.setPosition(position);
        this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
        this.disable();
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

     /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * get the iwidget.
     */
    WidgetInterface.prototype.getIWidget = function getIWidget() {
        return this.iwidget;
    };

    /*************************************************************************
     * Make WidgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.WidgetInterface = WidgetInterface;
})();
