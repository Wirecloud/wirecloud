/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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
    var OperatorInterface = function OperatorInterface(wiringEditor, ioperator, manager) {
        var outputs, inputs, desc, label, i;
        this.ioperator = ioperator;
        this.wiringEditor = wiringEditor;

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, this.ioperator.getName(), manager, 'ioperator');
        inputs = ioperator.getInputs();
        outputs = ioperator.getOutputs();
        //sources & targets anchors (sourceAnchor and targetAnchor)
        for (i = 0; i < outputs.length; i++) {
            desc = outputs[i].meta.getDescription();
            label = outputs[i].meta.getLabel();
            this.addSource(label, desc, outputs[i].meta.getName(), outputs[i]);
        }
        for (i = 0; i < inputs.length; i++) {
            desc = inputs[i].meta.getDescription();
            label = inputs[i].meta.getLabel();
            this.addTarget(label, desc, inputs[i].meta.getName(), inputs[i]);
        }
    };

    OperatorInterface.prototype = new Wirecloud.ui.WiringEditor.GenericInterface(true);

    /**
     * onFinish for draggable
     */
    OperatorInterface.prototype.onFinish = function onFinish(draggable, data) {
        var operator_interface = this.wiringEditor.addIOperator(this.ioperator.meta);
        operator_interface.setPosition(data.getPosition());
        data.setPosition({posX: 0, posY: 0});
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
        return this.ioperator.getId();
    };

    /**
     * get id 
     */
    OperatorInterface.prototype.getName = function getName() {
        return this.ioperator.getName();
    };

    /*************************************************************************
     * Make OperatorInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.OperatorInterface = OperatorInterface;
})();
