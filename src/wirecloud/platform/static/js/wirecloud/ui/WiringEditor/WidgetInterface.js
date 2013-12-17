/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2014 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2014 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */

/*global opManager, Wirecloud */

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

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, iwidget, this.iwidget.name, manager, 'iwidget', isGhost);
        if (!isMenubarRef) {

            // Sort
            if (!isGhost) {
                if ((endPointPos.sources.length > 0) || (endPointPos.targets.length > 0)) {
                    for (i = 0; i < endPointPos.sources.length; i += 1) {
                        if (iwidget.outputs[endPointPos.sources[i]]) {
                            outputs.push(iwidget.outputs[endPointPos.sources[i]]);
                        } else {
                            // Lost endpoint.
                            outputs = iwidget.widget.outputList.map(function (output) {return iwidget.outputs[output.name]});
                            break;
                        }
                    }
                    for (i = 0; i < endPointPos.targets.length; i += 1) {
                    if (iwidget.inputs[endPointPos.targets[i]]) {
                            inputs.push(iwidget.inputs[endPointPos.targets[i]]);
                        } else {
                            // Lost endpoint.
                            inputs = iwidget.widget.inputList.map(function (input) {return iwidget.inputs[input.name]});
                            break;
                        }
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
            this.wiringEditor.events.widgetaddfail.dispatch();
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
