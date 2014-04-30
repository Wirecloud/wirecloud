/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2013 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 the Center for Open Middleware
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

/*global StyledElements, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var Canvas = function Canvas() {
        StyledElements.ObjectWithEvents.call(this, ['arrowadded', 'arrowremoved', 'unselectall']);

        this.canvasElement = document.createElementNS(this.SVG_NAMESPACE, 'svg:svg');
        this.canvasElement.generalLayer = document.createElementNS(this.SVG_NAMESPACE, 'svg:g');
        this.canvasElement.appendChild(this.canvasElement.generalLayer);
        this.canvasElement.setAttribute('class', 'canvas');
        this.selectedArrow = null;
        this.canvasElement.addEventListener('click', function () {
            this.unselectArrow();
            this.events.unselectall.dispatch();
        }.bind(this), false);

    };
    Canvas.prototype = new StyledElements.ObjectWithEvents();

    Canvas.prototype.SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Adds a css class to this canvas.
     */
    Canvas.prototype.addClassName = function addClassName(className) {
        var atr;
        atr = this.canvasElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }

        this.canvasElement.setAttribute('class', Wirecloud.Utils.appendWord(atr, className));
    };

    /**
     * Draws an arrow into this canvas.
     */
    Canvas.prototype.drawArrow = function drawArrow(from, to, extraClass, readOnly, isGhost) {
        var arrow = new Wirecloud.ui.WiringEditor.Arrow(this);
        arrow.addClassName(extraClass);
        if (readOnly) {
            arrow.readOnly = true;
        }
        if (isGhost) {
            arrow.isGhost = true;
            arrow.addClassName('ghost');
        }
        arrow.setStart(from);
        arrow.setEnd(to);
        arrow.redraw();
        arrow.insertInto(this.canvasElement.generalLayer);

        if ((extraClass != 'multiconnector_arrow') && extraClass != 'arrow hollow') {
            this.events.arrowadded.dispatch(this, arrow);
        }
        return arrow;
    };

    /**
     * Removes an arrow from this canvas.
     */
    Canvas.prototype.removeArrow = function removeArrow(arrow) {
        if (this.selectedArrow === arrow) {
            this.unselectArrow();
        }
        if (arrow.multiId == null) {
            arrow.wrapperElement.parentNode.removeChild(arrow.wrapperElement);
        }
        this.events.arrowremoved.dispatch(this, arrow);
    };

    /**
     * Clean the svg canvas.
     */
    Canvas.prototype.clear = function clear() {
        this.canvasElement.classList.remove("elevated");
        while (this.canvasElement.generalLayer.childNodes.length > 0) {
            this.canvasElement.generalLayer.removeChild(this.canvasElement.generalLayer.firstChild);
        }
    };

    /**
     * Get the htmlElement of Canvas.
     */
    Canvas.prototype.getHTMLElement = function getHTMLElement() {
        return this.canvasElement;
    };

    /**
     * Sets the current selected arrow in canvas.
     */
    Canvas.prototype.selectArrow = function selectArrow(arrow) {
        this.unselectArrow();
        arrow.select();
        this.selectedArrow = arrow;
    };

    /**
     * Gets the current selected arrow in canvas.
     */
    Canvas.prototype.getSelectedArrow = function getSelectedArrow() {
        return this.selectedArrow;
    };

    /**
     * Sets the current selected arrow in canvas to null.
     */
    Canvas.prototype.unselectArrow = function unselectArrow() {
        if (this.selectedArrow !== null) {
            this.selectedArrow.unselect();
            this.selectedArrow = null;
        }
    };

    /*************************************************************************
     * Make Canvas public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Canvas = Canvas;
})();
