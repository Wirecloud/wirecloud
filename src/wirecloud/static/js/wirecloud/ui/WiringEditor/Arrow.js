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

/*global Draggable, BrowserUtilsFactory, EzWebExt, Wirecloud, Event, EzWebEffectBase, Element */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var Arrow = function Arrow(canvas) {
        this.highlight_counter = 2;
        this.emphasize_counter = 0;

        this.canvas = canvas;
        this.wrapperElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:g");

        this.arrowBodyElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:g");
        this.wrapperElement.appendChild(this.arrowBodyElement);

        // Create a path for the arrow's border
        this.arrowElementBorder = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.arrowElementBorder.setAttribute('class', 'arrowborder');
        this.arrowBodyElement.appendChild(this.arrowElementBorder);

        // And another for the arrow's body
        this.arrowElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.arrowElement.setAttribute('class', 'arrowbody');
        this.arrowBodyElement.appendChild(this.arrowElement);

        this.arrowBodyElement.addEventListener('click', function (e) {
            if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button)) {
                return;
            }
            e.stopPropagation();
            if (canvas.getSelectedArrow() === this) {
                canvas.unselectArrow();
            } else {
                canvas.selectArrow(this);
            }
        }.bind(this), true);

        // closer
        this.closerElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.closerElement.setAttribute('class', 'closer');
        this.closerElement.addEventListener('click', function (e) {
            if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button)) {
                return;
            }
            this.destroy();
            e.stopPropagation();
        }.bind(this));

        // pullers definition
        this.pullerStartElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerStartElement.setAttribute("r", 5);
        this.pullerStartElement.addEventListener("click", EzWebExt.stopPropagationListener, false);
        this.pullerEndElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerEndElement.setAttribute("r", 5);
        this.pullerEndElement.addEventListener("click", EzWebExt.stopPropagationListener, false);

        this.pullerStartElement.setAttribute('class', 'pullerBall');
        this.pullerEndElement.setAttribute('class', 'pullerBall');

        //pullerLines
        this.pullerStartLine = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.pullerStartLine.setAttribute('class', 'pullerLine');
        this.pullerEndLine = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.pullerEndLine.setAttribute('class', 'pullerLine');

        // draggable pullers
        this.pullerStartDraggable = new Draggable(this.pullerStartElement, {arrow: this},
            function onStart(draggable, data) {
                data.refPos = data.arrow.getPullerStart();
            },
            function onDrag(e, draggable, data, x, y) {
                data.arrow.setPullerStart({posX: data.refPos.posX + x, posY: data.refPos.posY + y});
                data.arrow.redraw();
            },
            function onFinish(draggable, data) {
                data.arrow.redraw();
            },
            function () {return true; }
        );
        this.pullerEndDraggable = new Draggable(this.pullerEndElement, {arrow: this},
            function onStart(draggable, data) {
                data.refPos = data.arrow.getPullerEnd();
            },
            function onDrag(e, draggable, data, x, y) {
                data.arrow.setPullerEnd({posX: data.refPos.posX + x, posY: data.refPos.posY + y});
                data.arrow.redraw();
            },
            function onFinish(draggable, data) {
                data.arrow.redraw();
            },
            function () {return true; }
        );

        // closer
        this.wrapperElement.appendChild(this.closerElement);

        // add pullerLines
        this.wrapperElement.appendChild(this.pullerStartLine);
        this.wrapperElement.appendChild(this.pullerEndLine);
        // add pullers
        this.wrapperElement.appendChild(this.pullerStartElement);
        this.wrapperElement.appendChild(this.pullerEndElement);

        this.pullerStart = null;
        this.pullerEnd = null;
        this.start = null;
        this.end = null;
        this.startAnchor = null;
        this.endAnchor = null;
        this.endMulti = null;
        this.startMulti = null;
        this.multiId = null;
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     *  insert into.
     */
    Arrow.prototype.insertInto = function insertInto(element) {
        element.appendChild(this.wrapperElement);
    };

    /**
     *  Set the Arrow start point.
     */
    Arrow.prototype.setStart = function setStart(start, anchor) {
        this.start = start;
        this.setStartAnchor(anchor);
    };

    /**
     *  Set the Arrow start Anchor.
     */
    Arrow.prototype.setStartAnchor = function setStartAnchor(anchor) {
        if (anchor != null) {
            this.startAnchor = anchor;
        }
    };

    /*
     *  Set the Arrow end point.
     */
    Arrow.prototype.setEnd = function setEnd(end, anchor) {
        this.end = end;
        this.setEndAnchor(anchor);
    };

    /**
     *  Set the Arrow end Anchor
     */
    Arrow.prototype.setEndAnchor = function setEndAnchor(anchor) {
        if (anchor != null) {
            this.endAnchor = anchor;
        }
    };

    /*
     *  Get the Arrow pullerStart point.
     */
    Arrow.prototype.getPullerStart = function getPullerStart(absolute) {
        var from, to, difX, difY, result;

        from = this.start;
        to = this.end;
        if (from == null || to == null) {
            //error: getPullerStart in a inconsistent arrow;
            return;
        }
        if (this.pullerStart == null) {
            difX = Math.abs(from.posX - to.posX);
            difY = Math.abs(from.posY - to.posY);
            if (difX > 150) {
                difX = 150;
            }
            if (difX < 25) {
                difX = 25;
            }
            result = {posX: difX, posY: 0};
        } else {
            result = this.pullerStart;
        }

        if (absolute) {
            return {posX: from.posX + result.posX, posY: from.posY + result.posY};
        } else {
            return result;
        }
    };

    /*
     *  Get the Arrow pullerEnd point.
     */
    Arrow.prototype.getPullerEnd = function getPullerEnd(absolute) {
        var from, to, difX, difY, result;

        from = this.start;
        to = this.end;
        if (from == null || to == null) {
            //error: getPullerEnd in a inconsistent arrow;
            return;
        }
        if (this.pullerEnd == null) {
            difX = Math.abs(from.posX - to.posX);
            difY = Math.abs(from.posY - to.posY);
            if (difX > 150) {
                difX = 150;
            }
            if (difX < 25) {
                difX = 25;
            }
            result = {posX: -difX, posY: 0};
        } else {
            result = this.pullerEnd;
        }

        if (absolute) {
            return {posX: to.posX + result.posX, posY: to.posY + result.posY};
        } else {
            return result;
        }
    };

    /*
     *  Set the Arrow pullerStart point.
     */
    Arrow.prototype.setPullerStart = function setPullerStart(pStart) {
        this.pullerStart = pStart;
    };

    /**
     *  Set the Arrow pullerEnd point.
     */
    Arrow.prototype.setPullerEnd = function setPullerEnd(pEnd) {
        this.pullerEnd = pEnd;
    };

    /**
     *  redraw the line.
     */
    Arrow.prototype.redraw = function redraw() {
        var middleX, posCloser, startPuller, endPuller, from, to;

        from = this.start;
        to = this.end;

        // Start puller
        startPuller = this.getPullerStart(true);
        this.pullerStartLine.setAttribute("d",
                "M " + from.posX + "," + from.posY + " " + startPuller.posX + "," + startPuller.posY);
        this.pullerStartElement.setAttribute("cx", startPuller.posX);
        this.pullerStartElement.setAttribute("cy", startPuller.posY);

        // End puller
        endPuller = this.getPullerEnd(true);
        this.pullerEndLine.setAttribute("d",
                "M " + to.posX + "," + to.posY + " " + endPuller.posX + "," + endPuller.posY);
        this.pullerEndElement.setAttribute("cx", endPuller.posX);
        this.pullerEndElement.setAttribute("cy", endPuller.posY);

        this.arrowElementBorder.setAttribute("d",
                "M " + from.posX + "," + from.posY + " " +
                "C " + startPuller.posX + "," + startPuller.posY + " " + endPuller.posX + "," + endPuller.posY + " " +
                to.posX + "," + to.posY
        );
        this.arrowElement.setAttribute("d",
                "M " + from.posX + "," + from.posY + " " +
                "C " + startPuller.posX + "," + startPuller.posY + " " + endPuller.posX + "," + endPuller.posY + " " +
                to.posX + "," + to.posY
        );

        try {
            posCloser = this.calculateMid();

            this.closerElement.setAttribute("cx", posCloser.posX);
            this.closerElement.setAttribute("cy", posCloser.posY);
            this.closerElement.setAttribute("r", 8);
        }
        catch (err) {
            //TODO: error msg
        }
    };

    /**
     *  calculate the arrow path middle position
     *  with a bercier curves aproximation.
     */
    Arrow.prototype.calculateMid = function calculateMid() {
        var B1, B2, B3, B4, getBercier;

        B1 = function B1(t) { return t * t * t; };
        B2 = function B2(t) { return 3 * t * t * (1 - t); };
        B3 = function B3(t) { return 3 * t * (1 - t) * (1 - t); };
        B4 = function B4(t) { return (1 - t) * (1 - t) * (1 - t); };

        getBercier = function getBezier(percent, C1, C2, C3, C4) {
            var X = C1.posX * B1(percent) + C2.posX * B2(percent) + C3.posX * B3(percent) + C4.posX * B4(percent);
            var Y = C1.posY * B1(percent) + C2.posY * B2(percent) + C3.posY * B3(percent) + C4.posY * B4(percent);
            return {posX : X, posY : Y};
        };

        return getBercier(0.5, this.start, this.getPullerStart(true), this.getPullerEnd(true), this.end);
    };
    /**
     *  highlights the arrow
     */
    Arrow.prototype.highlight = function highlight() {
        //this.addClassName('highlighted');
        this.highlight_counter += 1;
        this.removeClassName('disabled');
    };

    /**
     *  unhighlights the arrow
     */
    Arrow.prototype.unhighlight = function unhighlight() {
        //this.removeClassName('highlighted');
        this.highlight_counter -= 1;
        if (this.highlight_counter < 1) {
            this.addClassName('disabled');
        }
    };

    /**
     *  recalculate if the arrow may be Highlighted or not
     */
    Arrow.prototype.calculateHighlight = function calculateHighlight() {
        this.highlight_counter = 2;
        if (!this.endAnchor.isHighlighted()) {
            this.unhighlight();
        }
        if (!this.startAnchor.isHighlighted()) {
            this.unhighlight();
        }
        this.redraw();
    };

    /**
     *  select the arrow
     */
    Arrow.prototype.select = function select() {
        this.addClassName('selected');
    };

    /**
     *  unselect the arrow
     */
    Arrow.prototype.unselect = function unselect() {
        this.removeClassName('selected');
    };

    /**
     *  emphasize the arrow
     */
    Arrow.prototype.emphasize = function emphasize() {
        if (this.emphasize_counter < 2) {
            this.emphasize_counter += 1;
            this.addClassName('emphasize');
        } else if (this.emphasize_counter == 2) {
            return;
        }
    };

    /**
     *  deemphasize the arrow
     */
    Arrow.prototype.deemphasize = function deemphasize() {
        this.emphasize_counter -= 1;
        if (this.emphasize_counter === 0) {
            this.removeClassName('emphasize');
        } else if (this.emphasize_counter < 0) {
            this.emphasize_counter = 0;
            return;
        }
    };

    /**
     *  recalculate if the arrow may be emphasize or not
     */
    Arrow.prototype.calculateEmphasize = function calculateEmphasize() {
        this.emphasize_counter = 0;
        if (this.endAnchor.isEmphasize()) {
            this.emphasize();
        }
        if (this.startAnchor.isEmphasize()) {
            this.emphasize();
        }
        this.redraw();
    };

    /**
     *  add new class in to the arrow
     */
    Arrow.prototype.addClassName = function addClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', EzWebExt.appendWord(atr, className));
    };

    /**
     * removeClassName
     */
    Arrow.prototype.removeClassName = function removeClassName(className) {
        var atr;

        if (className == null || this.wrapperElement == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', EzWebExt.removeWord(atr, className));
    };

    /**
     * hasClassName
     */
    Arrow.prototype.hasClassName = function hasClassName(className) {
        var atr, exp;

        if (className == null || this.wrapperElement == null) {
            return false;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            return false;
        }
        exp = new RegExp("(^\\s*|\\s+)" + className + "(\\s+|\\s*$)", "g");
        return (atr.match(exp) != null);
    };

    /**
     * destroy the arrow.
     */
    Arrow.prototype.destroy = function destroy() {
        this.disconnect();
        if (this.canvas !== null) {
            this.canvas.removeArrow(this);
            this.canvas = null;
        }
        if (this.wrapperElement == null) {
            //error: trying to destroy a previously destroyed arrow;
            return;
        }
        if (this.wrapperElement.parentNode) {
            this.wrapperElement.parentNode.removeChild(this.wrapperElement);
        }
        this.wrapperElement = null;
        this.pullerStartElement = null;
        this.pullerEndElement = null;
        this.closerElement = null;
        this.start = null;
        this.end = null;
    };

    /*
     * disconnet the arrow
     */
    Arrow.prototype.disconnect = function disconnect() {
        if (this.startAnchor !== null) {
            this.startAnchor.removeArrow(this);
            this.startAnchor = null;
        }

        if (this.endAnchor !== null) {
            this.endAnchor.removeArrow(this);
            this.endAnchor = null;
        }
    };

    /*************************************************************************
     * Make Arrow public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Arrow = Arrow;
})();
