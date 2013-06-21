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

/*global Draggable, EzWebExt, Wirecloud*/

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
            // Only process left mouse button events
            if (e.button !== 0) {
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
            // Only process left mouse button events
            if (e.button !== 0) {
                return;
            }
            // readOnly control
            if (this.readOnly) {
                e.stopPropagation();
                return;
            }
            if (this.hasClassName('hollow')) {
                // TODO open subdata tree
                return;
            }
            if (this.hasClassName('subdataConnection')) {
                // remove subconnection
                if (this.hasClassName('full')) {
                    // remove full connection from subdata view
                    // borrar la conexion de toooodas partes, así como su conexion normal asociada
                    this.startAnchor.context.iObject.removeSubdataConnection(this.startAnchor.context.data.name.split("/")[0], this.startAnchor.context.data.name, this);
                } else {
                    //remove subconnection from subdata view
                    if (this.startAnchor.isSubAnchor) {
                        // removeSubdataConnection
                        this.startAnchor.context.iObject.removeSubdataConnection(this.startAnchor.context.data.name.split("/")[0], this.startAnchor.context.data.name, this);
                    }
                }
                return;
            }
            this.destroy();
            e.stopPropagation();
        }.bind(this));

        // semantic Info
        /*  raro raro.. y sin el switch tampoco va
        this.semanticAdvertiserFO = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "foreign-object");
        this.semanticAdvertiser = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "switch");
        this.semanticAdvertiserFO.setAttribute('width', '100');
        this.semanticAdvertiserFO.setAttribute('height', '100');
        this.semanticAdvertiserBody = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "body");
        this.semanticAdvertiserDiv = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "div");
        this.semanticAdvertiserBody.appendChild(this.semanticAdvertiserDiv);
        this.semanticAdvertiserFO.appendChild(this.semanticAdvertiserBody);
        this.semanticAdvertiser.appendChild(this.semanticAdvertiserFO);
        this.semanticAdvertiserDiv.setAttribute('class', 'semanticAdvertiser icon-warning-sign');
        */
        /* no se muestra la imagen de ninguna forma dentro del svg, si lo sacodel svg, si.
        this.semanticAdvertiser = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "image");
        //this.semanticAdvertiser.setAttribute('xlink:href', "/static/images/wiring/warning.png");
        this.semanticAdvertiser.setAttribute('xlink:href', "http://www.google.co.uk/images/srpr/logo3w.png");
        this.semanticAdvertiser.setAttribute('xmlns', "http://www.w3.org/2000/svg");
        this.semanticAdvertiser.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
        this.semanticAdvertiser.setAttribute('width', "400");
        this.semanticAdvertiser.setAttribute('height', "400");
        this.semanticAdvertiser.addEventListener('click', function (e) {
            // TODO Open subdata structure
            e.stopPropagation();
        }.bind(this));
        */

        /* tampoco va como object ni dentro ni fuera
        this.semanticAdvertiser = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "object");
        this.semanticAdvertiser.setAttribute('data', "image-svg.svg");
        this.semanticAdvertiser.setAttribute('type', "image/svg+xml");
        this.semanticAdvertiser.setAttribute('width', '100');
        this.semanticAdvertiser.setAttribute('height', '100');
        this.semanticAdvertiserImage = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "img");
        this.semanticAdvertiserImage.setAttribute('width', '100');
        this.semanticAdvertiserImage.setAttribute('height', '100');
        this.semanticAdvertiserImage.setAttribute('src', "/static/images/wiring/warning.png");
        this.semanticAdvertiserImage.setAttribute('alt', "this is a PNG");
        this.semanticAdvertiser.appendChild(this.semanticAdvertiserImage);
        */

        /*
        this.semanticAdvertiser = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "polygon");
        this.semanticAdvertiser.setAttribute('class', 'semanticAdvertiser');
        */
        this.semanticAdvertiser = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "text");
        this.semanticAdvertiser.textContent = "";
        this.semanticAdvertiser.setAttribute('class', 'semanticAdvertiser');

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
        // semanticAdvertiser
        this.wrapperElement.appendChild(this.semanticAdvertiser);
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
        this.readOnly = false;
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
    Arrow.prototype.setReadOnly = function setReadOnly(isReadOnly) {

        if (isReadOnly) {
            // Set readOnly true
            this.readOnly = true;
            // Forbidden remove the arrow with class name
            this.addClassName('readOnly');
        } else {
            // Set readOnly false
            this.readOnly = false;
        }
    };

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

    /**
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

    /**
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

    /**
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

    /**
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
        var posCloser, posSemAdv, startPuller, endPuller, from, to;

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
            // closer
            posCloser = this.calculateMid();

            this.closerElement.setAttribute("cx", posCloser.posX);
            this.closerElement.setAttribute("cy", posCloser.posY);
            this.closerElement.setAttribute("r", 8);

            // semanticAdvertiser
            /*posSemAdv = this.calculatePosInArrow(0.7);
            this.semanticAdvertiser.setAttribute("cx", posSemAdv.posX);
            this.semanticAdvertiser.setAttribute("cy", posSemAdv.posY);
            this.semanticAdvertiser.setAttribute("r", 6);*/
            posSemAdv = this.calculatePosInArrow(0.6);
            this.semanticAdvertiser.setAttribute('x', posSemAdv.posX);
            this.semanticAdvertiser.setAttribute('y', posSemAdv.posY);
            /*posSemAdv.posY -= 6;
            var points = posSemAdv.posX + "," + posSemAdv.posY + " " +
                         (posSemAdv.posX - 6) + "," + (posSemAdv.posY + 12) + " " +
                         (posSemAdv.posX + 6) + "," + (posSemAdv.posY + 12);
            this.semanticAdvertiser.setAttribute("points", points);*/
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
        return this.calculatePosInArrow(0.5);
    };

    /**
     *  calculate coordinates de la posicithe arrow path middle position
     *  with a bercier curves aproximation.
     */
    Arrow.prototype.calculatePosInArrow = function calculatePosInArrow(PathPos) {
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

        return getBercier(PathPos, this.start, this.getPullerStart(true), this.getPullerEnd(true), this.end);
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

    /**
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

    /**
     * hide the arrow
     */
    Arrow.prototype.hide = function hide() {
        this.addClassName('hidden');
    };

    /**
     * show the arrow
     */
    Arrow.prototype.show = function show() {
        this.removeClassName('hidden');
    };
    /*************************************************************************
     * Make Arrow public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Arrow = Arrow;
})();
