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

/*global Draggable, Wirecloud */

(function () {

    "use strict";

    var _cancel = function () {
        return false;
    };


    /*************************************************************************
     * Constructor
     *************************************************************************/
    /**
     * ArrowCreator.
     */
    var ArrowCreator = function ArrowCreator(canvas, data, onStart, onDrag, onFinish) {
        var theArrow;
        var draggable = this;
        var currentSource, currentTarget;
        var layer = canvas.containment.wrapperElement; // TODO Trampa
        this.layer = layer;
        /*************************************************************************
         * Public methods
         *************************************************************************/

        /**
         * stardrag, first step to draw a dragable arrow
         */
        this.startdrag = function startdrag(e, initAnchor) {
            var tmpPos, xStart, yStart, endpoint, isGhost;
            // Only process left mouse button events
            if (e.button !== 0) {
                return;
            }

            this.initAnchor = initAnchor;
            initAnchor.context.iObject.wiringEditor.recommendations.emphasize(initAnchor, true);

            document.oncontextmenu = _cancel; // disable context menu
            document.onmousedown = _cancel; // disable text selection in Firefox
            document.onselectstart = _cancel; // disable text selection in IE

            // enddrag when mouseup in no-anchor
            document.addEventListener('mouseup', this.enddrag, false);

            xStart = parseInt(e.clientX, 10);
            yStart = parseInt(e.clientY, 10);

            tmpPos = initAnchor.getCoordinates(layer);

            // Arrow pointer
            endpoint = initAnchor.context.data;
            if (endpoint instanceof Wirecloud.wiring.GhostSourceEndpoint || endpoint instanceof Wirecloud.wiring.GhostTargetEndpoint) {
                //Arrow from Ghost Endpoint. Ghost Arrow
                isGhost = true;
            }
            theArrow = canvas.drawArrow(tmpPos, tmpPos, "connection", false, isGhost);

            // Minimized operators
            this.initAnchor.context.iObject.potentialArrow = theArrow;
            this.theArrow = theArrow;
            theArrow.emphasize();
            // we can draw invert arrows from the end to the start
            if (initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
                this.invert = true;
                currentSource = null;
                currentTarget = initAnchor;
                theArrow.setEnd(tmpPos, initAnchor);
            } else if (initAnchor instanceof Wirecloud.ui.WiringEditor.SourceAnchor) {
                this.invert = false;
                currentSource = initAnchor;
                currentTarget = null;
                theArrow.setStart(tmpPos, initAnchor);
            }

            document.addEventListener("mousemove", this.drag, false);
            onStart(draggable, data);
            return false;
        };

        /**
         * drag, second step to draw a dragable arrow.
         */
        this.drag = function drag(e) {

            e = e || window.event; // needed for IE
            var x = parseInt(e.clientX, 10);
            var y = parseInt(e.clientY, 10);
            if (!this.invert) {
                theArrow.setEnd(getRelativeScreenPosition(x, y, layer));
            } else {
                theArrow.setStart(getRelativeScreenPosition(x, y, layer));
            }
            theArrow.redraw();
            onDrag(e, draggable, data, x, y);
        }.bind(this);

        /**
         * enddrag, last step to draw a dragable arrow.
         */
        this.enddrag = function enddrag(e, fAnchor) {
            // Only process left mouse button events
            if (e.button !== 0) {
                return;
            }
            this.initAnchor.context.iObject.potentialArrow = null;
            if (fAnchor !== this.initAnchor) {
                if (fAnchor != null) {
                    if (!this.invert) {
                        currentTarget = fAnchor;
                        theArrow.setEnd(fAnchor.getCoordinates(layer), fAnchor);
                    } else {
                        currentSource = fAnchor;
                        theArrow.setStart(fAnchor.getCoordinates(layer), fAnchor);
                    }
                    theArrow.deemphasize();

                    switch (validateConnection(currentSource, currentTarget)) {
                    case ArrowCreator.CONNECTION_ALLOWED:
                        theArrow.calculateEmphasize();
                        theArrow.redraw();
                        // Add the arrow to the arrow list of both anchors
                        this.initAnchor.addArrow(theArrow);
                        fAnchor.addArrow(theArrow);
                        canvas.events.establish.dispatch({
                            'connection': theArrow,
                            'sourceComponent': theArrow.sourceComponent,
                            'sourceEndpoint': theArrow.startAnchor,
                            'sourceName': theArrow.sourceName,
                            'targetComponent': theArrow.targetComponent,
                            'targetEndpoint': theArrow.endAnchor,
                            'targetName': theArrow.targetName
                        });
                        break;
                    case ArrowCreator.CONNECTION_DUPLICATE:
                        canvas.events.duplicate.dispatch({
                            'connection': theArrow,
                            'sourceComponent': theArrow.sourceComponent,
                            'sourceEndpoint': theArrow.startAnchor,
                            'sourceName': theArrow.sourceName,
                            'targetComponent': theArrow.targetComponent,
                            'targetEndpoint': theArrow.endAnchor,
                            'targetName': theArrow.targetName
                        });
                    default:
                        theArrow.destroy();
                    }
                // mouseup out of an anchor
                } else {
                    theArrow.destroy();
                }
            } else {
                theArrow.destroy();
            }

            this.initAnchor.context.iObject.wiringEditor.recommendations.deemphasize(this.initAnchor,true);

            document.removeEventListener("mouseup", this.enddrag, false);
            document.removeEventListener("mousemove", this.drag, false);
            onFinish(draggable, data);
            document.onmousedown = null; // reenable context menu
            document.onselectstart = null; // reenable text selection in IE
            document.oncontextmenu = null; // reenable text selection
            currentTarget = null;
            currentSource = null;
            this.initAnchor = null;
            this.invert = null;
            return theArrow;
        }.bind(this);
    };

    ArrowCreator.CONNECTION_ALLOWED = 1;

    ArrowCreator.CONNECTION_DUPLICATE = 0;

    ArrowCreator.CONNECTION_SAME_COMPONENT = -1;

    ArrowCreator.CONNECTION_SAME_ENDPOINT = -2;

    ArrowCreator.ENDPOINT_MISTAKEN = -3;

    /**
     * Check if the source and target endpoints are valid.
     *
     * @private
     * @function
     */
    var validateConnection = function validateConnection(sourceEndpoint, targetEndpoint) {
        var connections, i;

        if (!(sourceEndpoint instanceof Wirecloud.ui.WiringEditor.SourceAnchor)) {
            return ArrowCreator.ENDPOINT_MISTAKEN;
        }

        if (!(targetEndpoint instanceof Wirecloud.ui.WiringEditor.TargetAnchor)) {
            return ArrowCreator.ENDPOINT_MISTAKEN;
        }

        if (sourceEndpoint === targetEndpoint) {
            return ArrowCreator.CONNECTION_SAME_ENDPOINT;
        }

        if (targetEndpoint.context.iObject === sourceEndpoint.context.iObject) {
            return ArrowCreator.CONNECTION_SAME_COMPONENT;
        }

        connections = sourceEndpoint.getArrows();

        for (i = 0; i < connections.length; i++) {
            if (connections[i].endAnchor === targetEndpoint) {
                return ArrowCreator.CONNECTION_DUPLICATE;
            }
        }

        return ArrowCreator.CONNECTION_ALLOWED;
    };

    /**
     * Get Relative Screen Position, about from (x,y) to another element
     */
    var getRelativeScreenPosition = function getRelativeScreenPosition(x, y, element) {
        var bounding_box = element.getBoundingClientRect();
        return {
            x: x - bounding_box.left + element.scrollLeft,
            y: y - bounding_box.top + element.scrollTop
        };
    };

    /*************************************************************************
     * Make ArrowCreator public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.ArrowCreator = ArrowCreator;
})();
