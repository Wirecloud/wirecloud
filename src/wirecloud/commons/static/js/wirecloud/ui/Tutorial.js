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

/* globals Wirecloud */


(function () {

    "use strict";

    var Tutorial = function Tutorial(label, instructions) {
        this.label = label;
        this.stepActive = null;
        this.steps = [];

        this.controlLayer = document.createElement("div");
        this.controlLayerUp = document.createElement("div");
        this.controlLayerDown = document.createElement("div");
        this.controlLayerLeft = document.createElement("div");
        this.controlLayerRight = document.createElement("div");
        this.controlLayerCenter = document.createElement("div");
        this.controlLayer.className = "controlLayer";
        this.controlLayerUp.className = "controlLayerUp";
        this.controlLayerDown.className = "controlLayerDown";
        this.controlLayerLeft.className = "controlLayerLeft";
        this.controlLayerRight.className = "controlLayerRight";
        this.controlLayerCenter.className = "controlLayerCenter";
        this.controlLayer.appendChild(this.controlLayerUp);
        this.controlLayer.appendChild(this.controlLayerDown);
        this.controlLayer.appendChild(this.controlLayerLeft);
        this.controlLayer.appendChild(this.controlLayerRight);
        this.controlLayer.appendChild(this.controlLayerCenter);

        this.instructions = instructions;
    };

    Tutorial.prototype.start = function start() {

        var i;

        var mapping = {
            'simpleDescription': Wirecloud.ui.Tutorial.SimpleDescription,
            'userAction': Wirecloud.ui.Tutorial.UserAction,
            'formAction': Wirecloud.ui.Tutorial.FormAction,
            'autoAction': Wirecloud.ui.Tutorial.AutoAction
        };

        // creating simpleDescriptions
        document.body.appendChild(this.controlLayer);
        this.resetControlLayer(true);

        this.msgLayer = document.createElement("div");
        this.msgLayer.classList.add("msgLayer");
        document.body.appendChild(this.msgLayer);

        for (i = 0; i < this.instructions.length; i++) {
            var Constructor = mapping[this.instructions[i].type];
            this.steps[i] = new Constructor(this, this.instructions[i]);

            if (i == (this.instructions.length - 1)) {
                this.steps[i].setLast();
            } else {
                this.steps[i].setNext();
            }
        }

        this.stepActive = this.steps[0];
        this.steps[0].activate();
    };

    /**
     * Next Step
     */
    Tutorial.prototype.nextStep = function nextStep() {

        var current_step_index = this.steps.indexOf(this.stepActive);
        if (current_step_index < (this.steps.length - 1)) {
            this.stepActive.destroy();
            this.stepActive = this.steps[current_step_index + 1];
            setTimeout(this.stepActive.activate.bind(this.stepActive), 200);
        } else {
            this.destroy();
        }
    };

    /**
     * reset controlLayers positions
     */
    Tutorial.prototype.resetControlLayer = function resetControlLayer(isTransparent) {
        this.controlLayer.classList.remove("hidden");
        if (isTransparent === true) {
            this.controlLayer.classList.add('transparent');
        } else if (isTransparent === false) {
            this.controlLayer.classList.remove('transparent');
        }

        // Up
        this.controlLayerUp.style.height =     '50%';
        this.controlLayerUp.style.width =      '100%';
        this.controlLayerUp.style.top =        '0';
        this.controlLayerUp.style.left =       '0';

        // Down
        this.controlLayerDown.style.height =   '50%';
        this.controlLayerDown.style.width =    '100%';
        this.controlLayerDown.style.top =      '50%';
        this.controlLayerDown.style.left =     '0';

        // Right
        this.controlLayerRight.style.height =  '0';
        this.controlLayerRight.style.width =   '50%';
        this.controlLayerRight.style.top =     '50%';
        this.controlLayerRight.style.left =    '50%';

        // Left
        this.controlLayerLeft.style.height =   '0';
        this.controlLayerLeft.style.width =    '50%';
        this.controlLayerLeft.style.top =      '50%';
        this.controlLayerLeft.style.left =     '0';

        // Center
        this.controlLayerCenter.style.height = '0';
        this.controlLayerCenter.style.width =  '0';
        this.controlLayerCenter.style.top =    '50%';
        this.controlLayerCenter.style.left =   '50%';
    };

    /**
     * set controlLayers positions
     */
    Tutorial.prototype.setControlLayer = function setControlLayer(element, disable_center) {
        var pos;

        if (typeof element !== 'object') {
            return;
        }

        this.controlLayer.classList.remove("hidden");
        this.controlLayer.classList.remove('transparent');
        pos = element.getBoundingClientRect();

        // Up
        this.controlLayerUp.style.height = pos.top + 'px';
        this.controlLayerUp.style.width = '100%';

        // Down
        this.controlLayerDown.style.top = (pos.top + pos.height) + 'px';
        this.controlLayerDown.style.width = '100%';
        this.controlLayerDown.style.height = '100%';

        // Right
        this.controlLayerRight.style.left = (pos.left + pos.width) + 'px';
        this.controlLayerRight.style.top = pos.top + 'px';
        this.controlLayerRight.style.height = pos.height + 'px';
        this.controlLayerRight.style.width = '100%';

        // Left
        this.controlLayerLeft.style.width = pos.left + 'px';
        this.controlLayerLeft.style.height = pos.height + 'px';
        this.controlLayerLeft.style.top = pos.top + 'px';

        // Center
        if (disable_center === true) {
            this.controlLayerCenter.style.left = pos.left + 'px';
            this.controlLayerCenter.style.top = pos.top + 'px';
            this.controlLayerCenter.style.height = pos.height + 'px';
            this.controlLayerCenter.style.width = pos.width + 'px';
            this.controlLayerCenter.style.display = 'block';
        } else {
            this.controlLayerCenter.style.display = 'none';
        }
    };

    /**
     * set controlLayers positions
     */
    Tutorial.prototype.deactivateLayer = function deactivateLayer() {
        this.controlLayer.classList.add("hidden");
    };

    /**
     * find the element that content the text
     */
    Tutorial.prototype.findElementByTextContent = function findElementByTextContent(nodes, text) {
        var i;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent.toLowerCase() == text.toLowerCase()) {
                return nodes[i];
            }
        }
        return null;
    };

    /**
     * Destroy
     */
    Tutorial.prototype.destroy = function destroy() {
        var stepActivePos, i;

        stepActivePos = this.steps.indexOf(this.stepActive);
        for (i = stepActivePos; i < this.steps.length; i++) {
            this.steps[i].destroy();
        }
        document.body.removeChild(this.controlLayer);
        document.body.removeChild(this.msgLayer);
        this.msgLayer = null;
        this.steps = [];
    };

    Wirecloud.ui.Tutorial = Tutorial;
})();
