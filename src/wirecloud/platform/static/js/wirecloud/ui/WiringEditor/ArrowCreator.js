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
        var layer = canvas.getHTMLElement().parentNode; // TODO Trampa
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

            if (initAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                initAnchor.context.iObject.wiringEditor.recommendations.emphasize(initAnchor.initAnchor, true);
            } else {
                initAnchor.context.iObject.wiringEditor.recommendations.emphasize(initAnchor, true);
            }

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
            theArrow = canvas.drawArrow(tmpPos, tmpPos, "arrow", false, isGhost);

            // Minimized operators
            this.initAnchor.context.iObject.potentialArrow = theArrow;
            if (initAnchor.context.iObject.isMinimized) {
                initAnchor.context.iObject.restore();
                this.initWasMinimized = true;
            } else {
                this.initWasMinimized = false;
            }

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
            } else if (initAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                if (initAnchor.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
                    this.invert = true;
                    currentSource = null;
                    currentTarget = initAnchor;
                    theArrow.setEnd(tmpPos, initAnchor.initAnchor);
                    theArrow.endMulti = initAnchor.id;
                } else if (initAnchor.initAnchor instanceof Wirecloud.ui.WiringEditor.SourceAnchor) {
                    this.invert = false;
                    currentSource = initAnchor;
                    currentTarget = null;
                    theArrow.startMulti = initAnchor.id;
                    theArrow.setStart(tmpPos, initAnchor.initAnchor);
                }
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
                    if (fAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                        if (!this.invert) {
                            currentTarget = fAnchor.initAnchor;
                            theArrow.setEnd(fAnchor.getCoordinates(layer), fAnchor.initAnchor);
                            theArrow.endMulti = fAnchor.id;
                        } else {
                            currentSource = fAnchor.initAnchor;
                            theArrow.setStart(fAnchor.getCoordinates(layer), fAnchor.initAnchor);
                            theArrow.startMulti = fAnchor.id;
                        }
                    } else {
                        if (!this.invert) {
                            currentTarget = fAnchor;
                            theArrow.setEnd(fAnchor.getCoordinates(layer), fAnchor);
                        } else {
                            currentSource = fAnchor;
                            theArrow.setStart(fAnchor.getCoordinates(layer), fAnchor);
                        }
                    }
                    theArrow.deemphasize();
                    if (isVal(currentSource, currentTarget)) {
                        theArrow.calculateEmphasize();
                        theArrow.redraw();
                        // Add the arrow to the arrow list of both anchors
                        this.initAnchor.addArrow(theArrow);
                        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                            this.initAnchor.initAnchor.addArrow(theArrow);
                        } else if (fAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                            fAnchor.initAnchor.addArrow(theArrow);
                        }
                        fAnchor.addArrow(theArrow);

                        // subdata connections
                        if (currentSource.isSubAnchor) {
                            currentSource.context.iObject.addSubdataConnection(currentSource.context.data.name.split("/")[0], currentSource.context.data.name, theArrow, currentSource, currentTarget, false);
                            theArrow.addClassName('subdataConnection');
                        } else if (currentTarget.isSubAnchor) {
                            currentTarget.context.iObject.addSubdataConnection(currentTarget.context.data.name.split("/")[0], currentTarget.context.data.name, theArrow, currentSource, currentTarget, false);
                            theArrow.addClassName('subdataConnection');
                        }

                        // minimized operators acctions
                        if (this.initWasMinimized) {
                            this.initAnchor.context.iObject.minimize();
                        }
                    } else {
                        theArrow.destroy();
                    }
                // mouseup out of an anchor
                } else {
                    theArrow.destroy();
                    if (this.initWasMinimized) {
                        this.initAnchor.context.iObject.minimize();
                    }
                }
            } else {
                theArrow.destroy();
            }

            if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                this.initAnchor.context.iObject.wiringEditor.recommendations.deemphasize(this.initAnchor.initAnchor,true);
            } else {
                this.initAnchor.context.iObject.wiringEditor.recommendations.deemphasize(this.initAnchor,true);
            }

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

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /**
     * isVal return if the relation between currentTarget and currentSource is
     * a valid connection or not.
     */
    var isVal = function isVal(currentSource, currentTarget) {
        var arrows, i, source, target;

        source = currentSource;
        target = currentTarget;

        if (source instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
            source = currentSource.initAnchor;
            if (source.isSubAnchor || target.isSubAnchor) {
                // multiconnectors are not compatible with subconnections
                return false;
            }
        }
        if (target instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
            target = currentTarget.initAnchor;
            if (source.isSubAnchor || target.isSubAnchor) {
                // multiconnectors are not compatible with subconnections
                return false;
            }
        }
        if (source === target) {
            return false;
        }

        if (!(source instanceof Wirecloud.ui.WiringEditor.SourceAnchor) || !(target instanceof Wirecloud.ui.WiringEditor.TargetAnchor)) {
            return false;
        }

        if (target.context.iObject === source.context.iObject) {
            return false;
        }
        if (source.isSubAnchor) {
            arrows = source.context.iObject.sourceAnchorsByName[source.context.data.name.split('/')[0]].getArrows();
        } else {
            arrows = source.getArrows();
        }

        for (i = 0; i < arrows.length; i++) {
            if (arrows[i].endAnchor === target) {
                return false;
            }
        }

        return true;
    };

    /**
     * Get Relative Screen Position, about from (x,y) to another element
     */
    var getRelativeScreenPosition = function getRelativeScreenPosition(x, y, element) {
        var bounding_box = element.getBoundingClientRect();
        return {
            posX: x - bounding_box.left + element.scrollLeft,
            posY: y - bounding_box.top + element.scrollTop
        };
    };

    /*************************************************************************
     * Make ArrowCreator public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.ArrowCreator = ArrowCreator;
})();
