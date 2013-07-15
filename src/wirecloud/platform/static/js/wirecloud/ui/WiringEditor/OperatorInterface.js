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

        if ('ghost' in ioperator) {
            // Ghost Operator
            isGhost = true;

            for (i = 0; i < endPointPos.sources.length; i += 1) {
                outputs[endPointPos.sources[i]] = {
                    'description': '',
                    'label': endPointPos.sources[i],
                    'name': endPointPos.sources[i],
                    'friendcode': 'ghost'
                };
            }
            for (i = 0; i < endPointPos.targets.length; i += 1) {
                inputs[endPointPos.targets[i]] = {
                    'description': '',
                    'label': endPointPos.targets[i],
                    'name': endPointPos.targets[i],
                    'friendcode': 'ghost'
                };
            }
        } else {
            isGhost = false;
        }

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, this.ioperator.display_name, manager, 'ioperator', isGhost);
        if (!isMenubarRef) {

            // Sort
            if (!isGhost) {
                if ((endPointPos.sources.length > 0) || (endPointPos.targets.length > 0)) {
                    for (i = 0; i < endPointPos.sources.length; i += 1) {
                        outputs[endPointPos.sources[i]] = ioperator.outputs[endPointPos.sources[i]];
                    }
                    for (i = 0; i < endPointPos.targets.length; i += 1) {
                        inputs[endPointPos.targets[i]] = ioperator.inputs[endPointPos.targets[i]];
                    }
                } else {
                    // No enpoint order info available
                    inputs = ioperator.inputs;
                    outputs = ioperator.outputs;
                }
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
