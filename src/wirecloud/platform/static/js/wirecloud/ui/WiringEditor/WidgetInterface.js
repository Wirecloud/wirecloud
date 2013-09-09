/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 Center for Open Middleware
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
    /**
     * WidgetInterface Class
     */
    var WidgetInterface = function WidgetInterface(wiringEditor, iwidget, manager, isMenubarRef, endPointPos) {
        var outputs, inputs, desc, label, key, anchorContext, i, isGhost;

        outputs = [];
        inputs = [];

        // TODO remove after finishing the new IWidget class
        if ('internal_iwidget' in iwidget) {
            iwidget = iwidget.internal_iwidget;
        }
        // End TODO
        this.iwidget = iwidget;
        this.wiringEditor = wiringEditor;

        if ('ghost' in iwidget) {
            // Ghost Operator
            isGhost = true;

            for (i = 0; i < endPointPos.sources.length; i += 1) {
                outputs[i] = {
                    'description': '',
                    'label': endPointPos.sources[i],
                    'name': endPointPos.sources[i],
                    'friendcode': 'ghost'
                };
            }
            for (i = 0; i < endPointPos.targets.length; i += 1) {
                inputs[i] = {
                    'description': '',
                    'label': endPointPos.targets[i],
                    'name': endPointPos.targets[i],
                    'friendcode': 'ghost'
                };
            }
        } else {
            isGhost = false;
        }

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, this.iwidget.name, manager, 'iwidget', isGhost);
        if (!isMenubarRef) {

            // Sort
            if (!isGhost) {
                if ((endPointPos.sources.length > 0) || (endPointPos.targets.length > 0)) {
                    for (i = 0; i < endPointPos.sources.length; i += 1) {
                        outputs[i] = iwidget.outputs[endPointPos.sources[i]];
                    }
                    for (i = 0; i < endPointPos.targets.length; i += 1) {
                        inputs[i] = iwidget.inputs[endPointPos.targets[i]];
                    }
                } else {
                    // No enpoint order info available, use default order
                    inputs = iwidget.widget.inputList.map(function (input) {return iwidget.inputs[input.name]});
                    outputs = iwidget.widget.outputList.map(function (output) {return iwidget.outputs[output.name]});
                }
            }

            // Sources & targets anchors (sourceAnchor and targetAnchor)
            for (i = 0; i < outputs.length; i++) {
                desc = outputs[i].description;
                label = outputs[i].label;
                anchorContext = {'data': outputs[i], 'iObject': this};
                this.addSource(label, desc, outputs[i].name, anchorContext);
            }
            for (i = 0; i < inputs.length; i++) {
                desc = inputs[i].description;
                label = inputs[i].label;
                anchorContext = {'data': inputs[i], 'iObject': this};
                this.addTarget(label, desc, inputs[i].name, anchorContext);
            }
        }
    };

    WidgetInterface.prototype = new Wirecloud.ui.WiringEditor.GenericInterface(true);

    /**
     * onFinish for draggable
     */
    WidgetInterface.prototype.onFinish = function onFinish(draggable, data, e) {
        var position, iwidget_interface, endPointPos, oc, scrollX, scrollY;

        position = {posX: 0, posY: 0};
        position = data.iObjectClon.getPosition();

        if (!this.wiringEditor.withinGrid(e)) {
            this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
            return;
        }

        //scroll correction
        oc = this.wiringEditor.layout.getCenterContainer();
        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);
        position.posX += scrollX;
        position.posY += scrollY;

        endPointPos = {'sources': [], 'targets': []};
        iwidget_interface = this.wiringEditor.addIWidget(this.wiringEditor, this.iwidget, endPointPos);

        position.posX -= this.wiringEditor.getGridElement().getBoundingClientRect().left;

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

    /**
     * get id
     */
    WidgetInterface.prototype.getId = function getId() {
        return this.iwidget.id;
    };

    /*************************************************************************
     * Make WidgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.WidgetInterface = WidgetInterface;
})();
