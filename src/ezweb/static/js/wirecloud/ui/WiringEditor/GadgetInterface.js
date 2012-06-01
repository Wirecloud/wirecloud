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

/*global opManager, Variable, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * GadgetInterface Class
     */
    var GadgetInterface = function GadgetInterface(wiringEditor, igadget, manager) {
        var variables, variable, desc, label, name;
        this.igadget = igadget;
        this.wiringEditor = wiringEditor;

        Wirecloud.ui.WiringEditor.GenericInterface.call(this, false, wiringEditor, this.igadget.name, manager, 'igadget');
        variables = opManager.activeWorkSpace.varManager.getIGadgetVariables(igadget.getId());
         //sources & targets anchors (sourceAnchor and targetAnchor)
        for (name in variables) {
            variable = variables[name];
            desc = variable.vardef.description;
            label = variable.vardef.label;
            //each Event
            if (variable.vardef.aspect === Variable.prototype.EVENT) {
                this.addSource(label, desc, variable.vardef.name, variables[name]);
            } else if (variable.vardef.aspect === Variable.prototype.SLOT) {
                this.addTarget(label, desc, variable.vardef.name, variables[name]);
            }
        }
    };

    GadgetInterface.prototype = new Wirecloud.ui.WiringEditor.GenericInterface(true);

    //function for the draggable gadgets
    GadgetInterface.prototype.onFinish = function onFinish(draggable, igadget_interface) {
        var position, initialPosition, movement, big_igadget_interface;

        big_igadget_interface = this.wiringEditor.addIGadget(this.wiringEditor, this.igadget);
        
        position = {posX: 0, posY: 0};
        initialPosition = igadget_interface.initialPos;
        movement = igadget_interface.entity.getStylePosition();
        position.posX = initialPosition.posX + movement.posX;
        position.posY = initialPosition.posY + movement.posY - 90;
        igadget_interface.entity.setPosition({posX: 0, posY: 0});
        if (position.posX < 0) {
            position.posX = 0;
        }
        if (position.posY < 0) {
            position.posY = 0;
        }
        big_igadget_interface.setPosition(position);
        igadget_interface.entity.disable();
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

     /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * get the igadget.
     */
    GadgetInterface.prototype.getIGadget = function getIGadget() {
        return this.igadget;
    };

    /*************************************************************************
     * Make GadgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GadgetInterface = GadgetInterface;
})();
