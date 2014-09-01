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

/*global Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /**
     * OperatorInterface Class
     */
    var OperatorInterface = function OperatorInterface(wiringEditor, ioperator, manager, isMenubarRef, endPointPos) {
        var outputs, inputs, desc, label, key, anchorContext, i, isGhost;

        outputs = {};
        inputs = {};
        this.ioperator = ioperator;
        this.wiringEditor = wiringEditor;

        isGhost = ioperator instanceof Wirecloud.wiring.GhostOperator;

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, ioperator, this.ioperator.title, manager, 'ioperator', isGhost);
        if (!isMenubarRef) {

            // Sort
            if ((endPointPos.sources.length > 0) || (endPointPos.targets.length > 0)) {
                for (i = 0; i < endPointPos.sources.length; i += 1) {
                    if (ioperator.outputs[endPointPos.sources[i]]) {
                        outputs[endPointPos.sources[i]] = ioperator.outputs[endPointPos.sources[i]];
                    } else {
                        // Lost endpoint.
                        outputs = ioperator.outputs;
                        break;
                    }
                }
                for (i = 0; i < endPointPos.targets.length; i += 1) {
                    if (ioperator.inputs[endPointPos.targets[i]]) {
                        inputs[endPointPos.targets[i]] = ioperator.inputs[endPointPos.targets[i]];
                    } else {
                        // Lost endpoint.
                        inputs = ioperator.inputs;
                        break;
                    }
                }
            } else {
                // No enpoint order info available
                inputs = ioperator.inputs;
                outputs = ioperator.outputs;
            }

            // Sources & targets anchors (sourceAnchor and targetAnchor)
            for (key in outputs) {
                desc = outputs[key].description;
                label = outputs[key].label;
                anchorContext = {'data': outputs[key], 'iObject': this};
                this.addSource(label, desc, outputs[key].name, anchorContext);
            }
            for (key in inputs) {
                desc = inputs[key].description;
                label = inputs[key].label;
                anchorContext = {'data': inputs[key], 'iObject': this};
                this.addTarget(label, desc, inputs[key].name, anchorContext);
            }
        }
    };

    OperatorInterface.prototype = new Wirecloud.ui.WiringEditor.GenericInterface(true);

    /**
     * onFinish for draggable
     */
    OperatorInterface.prototype.onFinish = function onFinish(draggable, data, e) {
        var operator_interface, position, endPointPos, oc, scrollX, scrollY;
        
        position = {posX: 0, posY: 0};
        position = data.iObjectClon.getPosition();

        //scroll correction
        oc = this.wiringEditor.layout.getCenterContainer();
        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);
        position.posX += scrollX;
        position.posY += scrollY;

        if (!this.wiringEditor.withinGrid(e)) {
            this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
            this.wiringEditor.events.operatoraddfail.dispatch();
            return;
        }

        endPointPos = {'sources': [], 'targets': []};
        operator_interface = this.wiringEditor.addIOperator(this.ioperator, endPointPos);

        position.posX -= this.wiringEditor.getGridElement().getBoundingClientRect().left;
        if (position.posX < 0) {
            position.posX = 8;
        }
        if (position.posY < 0) {
            position.posY = 8;
        }
        operator_interface.setPosition(position);
        this.wiringEditor.layout.wrapperElement.removeChild(data.iObjectClon.wrapperElement);
    };

    /**
     * get the ioperator
     */
    OperatorInterface.prototype.getIOperator = function getIOperator() {
        return this.ioperator;
    };

    /**
     * get id
     */
    OperatorInterface.prototype.getId = function getId() {
        return this.ioperator.id;
    };

    /**
     * gets name
     */
    OperatorInterface.prototype.getName = function getName() {
        return this.ioperator.name;
    };

    /*************************************************************************
     * Make OperatorInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.OperatorInterface = OperatorInterface;
})();
