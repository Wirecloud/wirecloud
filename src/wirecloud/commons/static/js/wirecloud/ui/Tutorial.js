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

/*global Wirecloud*/

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var Tutorial = function Tutorial(instructions) {
        var i, key;

        this.stepActive = null;
        this.steps = [];

        this.controlLayer = document.createElement("div");
        this.controlLayerUp = document.createElement("div");
        this.controlLayerDown = document.createElement("div");
        this.controlLayerLeft = document.createElement("div");
        this.controlLayerRight = document.createElement("div");
        this.controlLayer.addClassName("controlLayer");
        this.controlLayerUp.addClassName("controlLayerUp");
        this.controlLayerDown.addClassName("controlLayerDown");
        this.controlLayerLeft.addClassName("controlLayerLeft");
        this.controlLayerRight.addClassName("controlLayerRight");
        this.controlLayer.appendChild(this.controlLayerUp);
        this.controlLayer.appendChild(this.controlLayerDown);
        this.controlLayer.appendChild(this.controlLayerLeft);
        this.controlLayer.appendChild(this.controlLayerRight);

        document.body.appendChild(this.controlLayer);
        this.resetControlLayer();

        this.msgLayer = document.createElement("div");
        this.msgLayer.addClassName("msgLayer");
        document.body.appendChild(this.msgLayer);

        this.instructions = instructions;

        var mapping = {
            'simpleDescription': Wirecloud.ui.Tutorial.SimpleDescription,
            'userAction': Wirecloud.ui.Tutorial.UserAction,
            'formAction': Wirecloud.ui.Tutorial.FormAction,
            'autoAction': Wirecloud.ui.Tutorial.AutoAction,
        };

        // creating simpleDescriptions
        for (i = 0; i < this.instructions.length; i ++) {
            var constructor = mapping[this.instructions[i].type];
            this.steps[i] = new constructor(this, this.instructions[i]);

            if (i == 0) {
                this.steps[i].wrapperElement.addClassName("activeStep");
                this.stepActive = this.steps[i];
            }
            if (i == this.instructions.length-1) {
                this.steps[i].setLast();
            } else {
                this.steps[i].setNext();
            }
        }
    };

    /**
     * Next Step
     */
    Tutorial.prototype.nextStep = function nextStep() {
        var order;

        order = this.steps.indexOf(this.stepActive );
        if (order < this.steps.length) {
            this.stepActive.destroy();
            this.resetControlLayer(false);
            this.stepActive = this.steps[this.steps.indexOf(this.stepActive) + 1];
            this.stepActive.activate();
        } else {
            this.destroy;
        }
    };

    /**
     * reset controlLayers positions
     */
    Tutorial.prototype.resetControlLayer = function resetControlLayer(isTransparent) {
        this.controlLayerUp.style.opacity = 0.4;
        //up
        this.controlLayerUp.style.height = '100%';
        this.controlLayerUp.style.width = '100%';
        this.controlLayerUp.style.top = 0;
        this.controlLayerUp.style.left = 0;
        //down
        this.controlLayerDown.style.height = 0;
        this.controlLayerDown.style.width = 0;
        this.controlLayerDown.style.top = 0;
        this.controlLayerDown.style.left = 0;
        //right
        this.controlLayerRight.style.height = 0;
        this.controlLayerRight.style.width = 0;
        this.controlLayerRight.style.top = 0;
        this.controlLayerRight.style.left = 0;
        //left
        this.controlLayerLeft.style.height = 0;
        this.controlLayerLeft.style.width = 0;
        this.controlLayerLeft.style.top = 0;
        this.controlLayerLeft.style.left = 0;
        if (isTransparent) {
            this.controlLayerUp.style.opacity = 0;
        }
    }

    /**
     * set controlLayers positions
     */
    Tutorial.prototype.setControlLayer = function setControlLayer(element) {
        var pos;
        if (typeof element !== 'object') {
            return;
        }
        this.controlLayerUp.style.opacity = 0.4;
        pos = element.getBoundingClientRect();
        //up
        this.controlLayerUp.style.height = pos.top + 'px';
        this.controlLayerUp.style.width = '100%';
        //down
        this.controlLayerDown.style.top = (pos.top + pos.height) + 'px';
        this.controlLayerDown.style.width = '100%';
        this.controlLayerDown.style.height = '100%';
        //right
        this.controlLayerRight.style.left = (pos.left + pos.width) + 'px';
        this.controlLayerRight.style.top = pos.top + 'px';
        this.controlLayerRight.style.height = pos.height + 'px';
        this.controlLayerRight.style.width = '100%';
        //left
        this.controlLayerLeft.style.width = pos.left + 'px';
        this.controlLayerLeft.style.height = pos.height + 'px';
        this.controlLayerLeft.style.top = pos.top + 'px';
    };

    /**
     * find the element that content the text
     */
    Tutorial.prototype.findElementByTextContent = function findElementByTextContent(nodes, text) {
        var i;
        for (i = 0; i < nodes.length; i ++) {
            if (nodes[i].textContent() == text) {
                return nodes[i];
            }
        }
        return null;
    }

    /**
     * Destroy
     */
    Tutorial.prototype.destroy = function destroy() {
        var stepActivePos, i;

        stepActivePos = this.steps.indexOf(this.stepActive);
        for (i = stepActivePos; i < this.steps.length; i ++) {
            this.steps[i].destroy();
        }
        document.body.removeChild(this.controlLayer);
        document.body.removeChild(this.msgLayer);
        this.controlLayer = null;
        this.msgLayer = null;
        this.steps = null;
    };

    /*************************************************************************
     * Make Tutorial public
     *************************************************************************/
    Wirecloud.ui.Tutorial = Tutorial;
})();
