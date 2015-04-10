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

            for (i = 0; i < endPointPos.source.length; i += 1) {
                outputs[i] = {
                    'description': '',
                    'label': endPointPos.source[i],
                    'name': endPointPos.source[i],
                    'friendcode': 'ghost'
                };
            }
            for (i = 0; i < endPointPos.target.length; i += 1) {
                inputs[i] = {
                    'description': '',
                    'label': endPointPos.target[i],
                    'name': endPointPos.target[i],
                    'friendcode': 'ghost'
                };
            }
        } else {
            isGhost = false;
        }

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, wiringEditor, iwidget, this.iwidget.name, manager, 'widget', isGhost);
        if (!isMenubarRef) {

            // Sort
            if (!isGhost) {
                if ((endPointPos.source.length > 0) || (endPointPos.target.length > 0)) {
                    for (i = 0; i < endPointPos.source.length; i += 1) {
                        if (iwidget.outputs[endPointPos.source[i]]) {
                            outputs.push(iwidget.outputs[endPointPos.source[i]]);
                        } else {
                            // Lost endpoint.
                            outputs = iwidget.widget.outputList.map(function (output) {return iwidget.outputs[output.name]});
                            break;
                        }
                    }
                    for (i = 0; i < endPointPos.target.length; i += 1) {
                    if (iwidget.inputs[endPointPos.target[i]]) {
                            inputs.push(iwidget.inputs[endPointPos.target[i]]);
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

            if (!this.sourceAnchors.length && !this.targetAnchors.length) {
                this.wrapperElement.classList.add('no-endpoints');
                this.options.optionCollapse.hide();
            }
        }
    };

    StyledElements.Utils.inherit(WidgetInterface, Wirecloud.ui.WiringEditor.GenericInterface);

    /**
     * onFinish for draggable
     */
    WidgetInterface.prototype.onFinish = function onFinish(draggable, data, e) {
        var position, iwidget_interface, endPointPos, oc, scrollX, scrollY;

        position = {'x': 0, 'y': 0};
        position = data.iObjectClon.getPosition();

        if (!this.wiringEditor.withinGrid(e)) {
            this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
            this.wiringEditor.events.widgetaddfail.dispatch();
            return;
        }

        //scroll correction
        oc = this.wiringEditor.layout.content;
        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);
        position.x += scrollX;
        position.y += scrollY;

        position.x -= this.wiringEditor.getGridElement().getBoundingClientRect().left;

        endPointPos = {'source': [], 'target': []};
        iwidget_interface = this.wiringEditor.addIWidget(this.iwidget, endPointPos, position);

        if (!this.wiringEditor.layout.content.wrapperElement.contains(data.iObjectClon.wrapperElement)) {
            this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
        } else {
            this.wiringEditor.layout.content.removeChild(data.iObjectClon);
        }
        this.wiringEditor.layout.slideDown();
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


    WidgetInterface.prototype.serialize = function serialize() {
        return {
            'name': this.iwidget.widget.id,
            'collapsed': this.collapsed,
            'endpoints': this.getInOutPositions(),
            'position': this.position
        };
    };

    /*************************************************************************
     * Make WidgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.WidgetInterface = WidgetInterface;
})();
