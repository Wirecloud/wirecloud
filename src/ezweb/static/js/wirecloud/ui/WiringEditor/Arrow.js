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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global BrowserUtilsFactory, EzWebExt, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var Arrow = function Arrow(canvas) {
        this.wrapperElement = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:g");

        // Create a path for the arrow's border
        this.arrowElementBorder = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.arrowElementBorder.setAttribute('class', 'arrowborder');
        this.wrapperElement.appendChild(this.arrowElementBorder);

        // And another for the arrow's body
        this.arrowElement = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.wrapperElement.appendChild(this.arrowElement);

        this.wrapperElement.addEventListener('click', function (e) {
            if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button)) {
                return;
            }
            if (canvas.getSelectedArrow) {
                canvas.unSelectArrow();
                this.highlight();
                canvas.setSelectedArrow(this);
            }
        }.bind(this));

        // closer
        this.closerElement = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.closerElement.setAttribute('class', 'closer');
        this.closerElement.addEventListener('click', function (e) {
            if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button)) {
                return;
            }
            canvas.unSelectArrow();
            this.disconnect();
            this.destroy();
            e.stopPropagation();
        }.bind(this));

        // pullers definition
        this.pullerStartElement = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerEndElement = canvas.canvasElement.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerStartElement.setAttribute('class', 'pullerBall');
        this.pullerEndElement.setAttribute('class', 'pullerBall');

        // closer
        this.wrapperElement.appendChild(this.closerElement);

        // add pullers
        this.wrapperElement.appendChild(this.pullerStartElement);
        this.wrapperElement.appendChild(this.pullerEndElement);

        this.pullerStart = null;
        this.pullerEnd = null;
        this.start = null;
        this.end = null;
        this.startAnchor = null;
        this.endAnchor = null;
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
        //initial position for star puller
        if (this.PullerStart == null) {
            this.setPullerStart({posX: start.posX + 90, posY: start.posY + 40});
        }
    };

    /**
     *  Set the Arrow start point.
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
        //initial position for end puller
        if (this.PullerEnd == null) {
            this.setPullerEnd({posX: end.posX - 90, posY: end.posY - 40});
        }
    };

    /**
     *  Set the Arrow start point.
     */
    Arrow.prototype.setEndAnchor = function setEndAnchor(anchor) {
        if (anchor != null) {
            this.endAnchor = anchor;
        }
    };

    /*
     *  Set the Arrow pullerStart point.
     */
    Arrow.prototype.setPullerStart = function setPullerStart(pStart) {
        this.pullerStart = pStart;
        this.pullerStartElement.setAttribute("cx", pStart.posX);
        this.pullerStartElement.setAttribute("cy", pStart.posY);
        this.pullerStartElement.setAttribute("r", 5);
    };

    /**
     *  Set the Arrow pullerEnd point.
     */
    Arrow.prototype.setPullerEnd = function setPullerEnd(pEnd) {
        this.pullerEnd = pEnd;
        this.pullerEndElement.setAttribute("cx", pEnd.posX);
        this.pullerEndElement.setAttribute("cy", pEnd.posY);
        this.pullerEndElement.setAttribute("r", "5");
    };

    /**
     *  redraw the line.
     */
    Arrow.prototype.redraw = function redraw() {
        var from, to, middleX, pullerStart, pullerEnd, posCloser;
        from = this.start;
        to = this.end;
        pullerStart = this.pullerStart;
        pullerEnd = this.pullerEnd;

        this.arrowElementBorder.setAttribute("d",
                "M " + from.posX + "," + from.posY + " " +
                "C " + pullerStart.posX + "," + pullerStart.posY + " " + pullerEnd.posX + "," + pullerEnd.posY + " " +
                to.posX + "," + to.posY
        );

        this.arrowElement.setAttribute("d",
                "M " + from.posX + "," + from.posY + " " +
                "C " + pullerStart.posX + "," + pullerStart.posY + " " + pullerEnd.posX + "," + pullerEnd.posY + " " +
                to.posX + "," + to.posY
        );
        //closer
        posCloser = this.arrowElement.getPointAtLength(this.arrowElement.getTotalLength() / 2);
        this.closerElement.setAttribute("cx", posCloser.x);
        this.closerElement.setAttribute("cy", posCloser.y);
        this.closerElement.setAttribute("r", 8);
    };

    /**
     *  highlights the arrow
     */
    Arrow.prototype.highLight = function highlight() {
        this.addClassName('class', 'selected');
    };

    /**
     *  unhighlights the arrow
     */
    Arrow.prototype.unhighlight = function unhighlight() {
        this.removeClassName('class', 'selected');
    };

    /**
     *  add new class in to the arrow
     */
    Arrow.prototype.addClassName = function addClassName(className) {
        var atr = this.arrowElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.arrowElement.setAttribute('class', EzWebExt.appendWord(atr, className));
    };

    /**
     * removeClassName
     */
    Arrow.prototype.removeClassName = function removeClassName(className) {
        var atr = this.arrowElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.arrowElement.setAttribute('class', EzWebExt.removeWord(atr, className));
    };

    /**
     * Inverts the arrow.
     */
    Arrow.prototype.invert = function invert() {
        var k;

        k = this.end;
        this.end = this.start;
        this.start = k;
    };

    /**
     * destroy the arrow.
     */
    Arrow.prototype.destroy = function destroy() {
        this.wrapperElement.parentNode.removeChild(this.wrapperElement);
        this.wrapperElement = null;
        this.start = null;
        this.end = null;
    };

    /*
     * disconnet the arrow
     */
    Arrow.prototype.disconnect = function disconnect() {
        this.startAnchor.removeArrow(this);
        this.endAnchor.removeArrow(this);
    };

    /*************************************************************************
     * Make Arrow public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Arrow = Arrow;
})();
