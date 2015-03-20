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

/*global Wirecloud, EzWebEffectBase */

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
        this.arrowElementBorder.setAttribute('class', "connection-border");
        this.arrowBodyElement.appendChild(this.arrowElementBorder);

        // And another for the arrow's body
        this.arrowElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.arrowElement.setAttribute('class', "connection-body");
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

        /* Connection - Background */

        var onbackground = false;

        Object.defineProperty(this, 'onbackground', {
            'get': function get() {
                return onbackground;
            },
            'set': function set(state) {
                if (typeof state === 'boolean') {
                    this.hidden = false;
                    if ((onbackground=state)) {
                        this.wrapperElement.classList.add('on-background');
                    } else {
                        this.wrapperElement.classList.remove('on-background');
                    }
                }
            }
        });

        var hidden = false;

        Object.defineProperty(this, 'hidden', {
            'get': function get() {
                return hidden;
            },
            'set': function set(state) {
                if (typeof state === 'boolean') {
                    if ((hidden=state)) {
                        this.wrapperElement.classList.add('hidden');
                    } else {
                        this.wrapperElement.classList.remove('hidden');
                        this.redraw();
                    }
                }
            }
        });

        // Closer
        this.closerElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.closerElement.setAttribute('class', "option-remove");
        this.closerElement.addEventListener('click', function (e) {
            // Only process left mouse button events
            if (e.button !== 0) {
                return;
            }

            // ReadOnly control
            if (this.readOnly) {
                e.stopPropagation();
                return;
            }

            if (this.onbackground) {
                this.canvas.events.share.dispatch({
                    'connection': this,
                    'sourceComponent': this.sourceComponent,
                    'sourceEndpoint': this.startAnchor,
                    'sourceName': this.sourceName,
                    'targetComponent': this.targetComponent,
                    'targetEndpoint': this.endAnchor,
                    'targetName': this.targetName
                });
            } else {
                if (!this.controlledDestruction()) {
                    this.remove();
                }
            }
            e.stopPropagation();
        }.bind(this));

        // Pullers definition
        this.pullerStartElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerStartElement.setAttribute("r", '0.4em');
        this.pullerStartElement.addEventListener("click", Wirecloud.Utils.stopPropagationListener, false);
        this.pullerEndElement = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:circle");
        this.pullerEndElement.setAttribute("r", '0.4em');
        this.pullerEndElement.addEventListener("click", Wirecloud.Utils.stopPropagationListener, false);

        this.pullerStartElement.setAttribute('class', "controller-ball");
        this.pullerEndElement.setAttribute('class', "controller-ball");

        // PullerLines
        this.pullerStartLine = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.pullerStartLine.setAttribute('class', "controller-line");
        this.pullerEndLine = canvas.canvasElement.generalLayer.ownerDocument.createElementNS(canvas.SVG_NAMESPACE, "svg:path");
        this.pullerEndLine.setAttribute('class', "controller-line");

        // Draggable pullers
        this.pullerStartDraggable = new Wirecloud.ui.Draggable(this.pullerStartElement, {arrow: this},
            function onStart(draggable, data) {
                data.refPos = data.arrow.getPullerStart();
            },
            function onDrag(e, draggable, data, x, y) {
                data.arrow.setPullerStart({x: data.refPos.x + x, y: data.refPos.y + y});
                data.arrow.redraw();
            },
            function onFinish(draggable, data) {
                data.arrow.redraw();

                canvas.events.update.dispatch({
                    'connection': data.arrow,
                    'sourceComponent': data.arrow.sourceComponent,
                    'sourceEndpoint': data.arrow.startAnchor,
                    'sourceName': data.arrow.sourceName,
                    'targetComponent': data.arrow.targetComponent,
                    'targetEndpoint': data.arrow.endAnchor,
                    'targetName': data.arrow.targetName
                });
            },
            function () {return true; }
        );
        this.pullerEndDraggable = new Wirecloud.ui.Draggable(this.pullerEndElement, {arrow: this},
            function onStart(draggable, data) {
                data.refPos = data.arrow.getPullerEnd();
            },
            function onDrag(e, draggable, data, x, y) {
                data.arrow.setPullerEnd({x: data.refPos.x + x, y: data.refPos.y + y});
                data.arrow.redraw();
            },
            function onFinish(draggable, data) {
                data.arrow.redraw();

                canvas.events.update.dispatch({
                    'connection': data.arrow,
                    'sourceComponent': data.arrow.sourceComponent,
                    'sourceEndpoint': data.arrow.startAnchor,
                    'sourceName': data.arrow.sourceName,
                    'targetComponent': data.arrow.targetComponent,
                    'targetEndpoint': data.arrow.endAnchor,
                    'targetName': data.arrow.targetName
                });
            },
            function () {return true; }
        );

        // Closer
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
        this.readOnly = false;
        this.isGhost = false;
    };

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     *  Insert into.
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
            this.sourceName = this.startAnchor.getName();
            this.sourceComponent = this.startAnchor.getComponent();
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
            this.targetName = this.endAnchor.getName();
            this.targetComponent = this.endAnchor.getComponent();
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
            // Error: getPullerStart in a inconsistent arrow;
            return;
        }
        if (this.pullerStart == null) {
            difX = Math.abs(from.x - to.x);
            difY = Math.abs(from.y - to.y);
            if (difX > 150) {
                difX = 150;
            }
            if (difX < 25) {
                difX = 25;
            }
            result = {x: difX, y: 0};
        } else {
            result = this.pullerStart;
        }

        if (absolute) {
            return {x: from.x + result.x, y: from.y + result.y};
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
            difX = Math.abs(from.x - to.x);
            difY = Math.abs(from.y - to.y);
            if (difX > 150) {
                difX = 150;
            }
            if (difX < 25) {
                difX = 25;
            }
            result = {x: -difX, y: 0};
        } else {
            result = this.pullerEnd;
        }

        if (absolute) {
            return {x: to.x + result.x, y: to.y + result.y};
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
     *  Redraw the line.
     */
    Arrow.prototype.redraw = function redraw() {
        var posCloser, startPuller, endPuller, from, to;

        from = this.start;
        to = this.end;

        // Start puller
        startPuller = this.getPullerStart(true);
        this.pullerStartLine.setAttribute("d",
                "M " + from.x + "," + from.y + " " + startPuller.x + "," + startPuller.y);
        this.pullerStartElement.setAttribute("cx", startPuller.x);
        this.pullerStartElement.setAttribute("cy", startPuller.y);

        // End puller
        endPuller = this.getPullerEnd(true);
        this.pullerEndLine.setAttribute("d",
                "M " + to.x + "," + to.y + " " + endPuller.x + "," + endPuller.y);
        this.pullerEndElement.setAttribute("cx", endPuller.x);
        this.pullerEndElement.setAttribute("cy", endPuller.y);

        this.arrowElementBorder.setAttribute("d",
                "M " + from.x + "," + from.y + " " +
                "C " + startPuller.x + "," + startPuller.y + " " + endPuller.x + "," + endPuller.y + " " +
                to.x + "," + to.y
        );
        this.arrowElement.setAttribute("d",
                "M " + from.x + "," + from.y + " " +
                "C " + startPuller.x + "," + startPuller.y + " " + endPuller.x + "," + endPuller.y + " " +
                to.x + "," + to.y
        );

        try {
            // Closer
            posCloser = this.calculateMid();

            this.closerElement.setAttribute("cx", posCloser.x);
            this.closerElement.setAttribute("cy", posCloser.y);
            this.closerElement.setAttribute("r", '0.65em');
        }
        catch (err) {
            //TODO: error msg
        }
    };

    /**
     *  Calculate the arrow path middle position
     *  with a bercier curves aproximation.
     */
    Arrow.prototype.calculateMid = function calculateMid() {
        var B1, B2, B3, B4, getBercier;

        B1 = function B1(t) { return t * t * t; };
        B2 = function B2(t) { return 3 * t * t * (1 - t); };
        B3 = function B3(t) { return 3 * t * (1 - t) * (1 - t); };
        B4 = function B4(t) { return (1 - t) * (1 - t) * (1 - t); };

        getBercier = function getBezier(percent, C1, C2, C3, C4) {
            var X = C1.x * B1(percent) + C2.x * B2(percent) + C3.x * B3(percent) + C4.x * B4(percent);
            var Y = C1.y * B1(percent) + C2.y * B2(percent) + C3.y * B3(percent) + C4.y * B4(percent);
            return {x : X, y : Y};
        };

        return getBercier(0.5, this.start, this.getPullerStart(true), this.getPullerEnd(true), this.end);
    };

    /**
     *  Select the arrow
     */
    Arrow.prototype.select = function select() {
        this.addClassName('selected');
    };

    /**
     *  Unselect the arrow
     */
    Arrow.prototype.unselect = function unselect() {
        this.removeClassName('selected');
    };

    /**
     *  Emphasize the arrow
     */
    Arrow.prototype.emphasize = function emphasize() {
        if (this.emphasize_counter < 2) {
            this.emphasize_counter += 1;
            this.addClassName('highlighted');
        } else if (this.emphasize_counter == 2) {
            return;
        }
    };

    /**
     *  Deemphasize the arrow
     */
    Arrow.prototype.deemphasize = function deemphasize() {
        this.emphasize_counter -= 1;
        if (this.emphasize_counter === 0) {
            this.removeClassName('highlighted');
        } else if (this.emphasize_counter < 0) {
            this.emphasize_counter = 0;
            return;
        }
    };

    /**
     *  Recalculate if the arrow may be emphasize or not
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
     *  Add new class in to the arrow
     */
    Arrow.prototype.addClassName = function addClassName(className) {
        this.wrapperElement.classList.add(className);
    };

    /**
     * RemoveClassName
     */
    Arrow.prototype.removeClassName = function removeClassName(className) {
        this.wrapperElement.classList.remove(className);
    };

    /**
     * HasClassName
     */
    Arrow.prototype.hasClassName = function hasClassName(className) {
        return this.wrapperElement.classList.contains(className);
    };

    /**
     * Controlled arrow destruction.
     */
    Arrow.prototype.controlledDestruction = function controlledDestruction() {
        // Destroyed arrow control
        if (this.wrapperElement == null) {
            return true;
        }
        // Subdata tree control
        if (this.hasClassName('hollow')) {
            // TODO open subdata tree
            return true;
        }
        if (this.hasClassName('subdataConnection')) {
            // Remove subconnection
            if (this.hasClassName('full')) {
                // Remove full connection from subdata view
                // Remove connection real and hollow
                this.startAnchor.context.iObject.removeSubdataConnection(this.startAnchor.context.data.name.split("/")[0], this.startAnchor.context.data.name, this);
                return true;
            } else {
                // Remove subconnection from subdata view
                if (this.startAnchor.isSubAnchor) {
                    // RemoveSubdataConnection
                    this.startAnchor.context.iObject.removeSubdataConnection(this.startAnchor.context.data.name.split("/")[0], this.startAnchor.context.data.name, this);
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Destroy the arrow.
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
     * Disconnet the arrow
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

    Arrow.prototype.remove = function remove(force) {
        if (typeof force !== 'boolean') {
            force = false;
        }

        this.canvas.events.detach.dispatch({
            'connection': this,
            'sourceComponent': this.sourceComponent,
            'sourceEndpoint': this.startAnchor,
            'sourceName': this.sourceName,
            'targetComponent': this.targetComponent,
            'targetEndpoint': this.endAnchor,
            'targetName': this.targetName,
            'cascadeRemove': force
        });

        if (force || !this.onbackground) {
            this.destroy();
        }
    };

    Arrow.prototype.serialize = function serialize() {
        var sourcehandle, targethandle;

        sourcehandle = this.getPullerStart();
        targethandle = this.getPullerEnd();

        return {
            'sourcename': this.sourceName,
            'sourcehandle': {
                'x': sourcehandle.x,
                'y': sourcehandle.y
            },
            'targetname': this.targetName,
            'targethandle': {
                'x': targethandle.x,
                'y': targethandle.y
            }
        };
    };

    Arrow.prototype.getBusinessInfo = function getBusinessInfo() {
        return {
            'readonly': this.readOnly,
            'source': this.startAnchor.serialize(),
            'target': this.endAnchor.serialize()
        };
    };

    /**
     * Hide the arrow
     */
    Arrow.prototype.hide = function hide() {
        this.addClassName('hidden');
    };

    /**
     * Show the arrow
     */
    Arrow.prototype.show = function show() {
        this.removeClassName('hidden');
    };
    /*************************************************************************
     * Make Arrow public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Arrow = Arrow;
})();
