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

/*global EzWebExt, StyledElements, Wirecloud */

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

        this.canvasElement.setAttribute('class', EzWebExt.appendWord(atr, className));
    };

    /**
     * Draws an arrow into this canvas.
     */
    Canvas.prototype.drawArrow = function drawArrow(from, to, extraClass, readOnly) {
        var arrow = new Wirecloud.ui.WiringEditor.Arrow(this);
        arrow.addClassName(extraClass);
        if (readOnly) {
            arrow.readOnly = true;
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
            this.canvasElement.generalLayer.removeChild(this.canvasElement.generalLayer.childNodes[0]);
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
