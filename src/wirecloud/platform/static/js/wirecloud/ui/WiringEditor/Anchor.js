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

/*global Coordinates, CSSPrimitiveValue, StyledElements, Wirecloud */


(function () {

    "use strict";

    /*************************************************************************
     * Constructor Anchor
     *************************************************************************/
    /**
     * This is the base class for the classes representing the anchors used to
     * connect the connectables on the wiring interface. They are usually
     * represented by a checkbox and used as target or source of arrows.
     *
     * @abstract
     */
    var Anchor = function Anchor(extending, arrowCreator, isGhost) {

        if (extending === true) {
            return;
        }
        StyledElements.StyledElement.call(this, ['startdrag', 'enddrag']);

        this.arrows = [];

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.classList.add('anchor');
        if (isGhost) {
            this.wrapperElement.classList.add('icon-exclamation-sign');
        } else {
            this.wrapperElement.classList.add('icon-circle');
        }
        this.menu = new StyledElements.PopupMenu({'position': ['bottom-left', 'top-left', 'bottom-right', 'top-right']});

        this._mousedown_callback = function _mousedown_callback(e) {
            var arrow, end, start;

            // Anchor Context Menu
            if (e.button == 2) {
                if (this.menu.isVisible()) {
                    this.menu.hide();
                } else {
                    this.menu.show(this.wrapperElement.getBoundingClientRect());
                }
                return;
            }

            e.stopPropagation();
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                arrow = this.hasSelectedArrow();
                if (arrow != null) {
                    // ReadOnly & subdata control
                    if (arrow.readOnly || arrow.hasClassName('hollow') || arrow.startAnchor.isSubAnchor) {
                        return;
                    }
                    if (arrow.hasClassName('multiconnector_arrow')) {
                        arrow.canvas.unselectArrow();
                    } else {
                        // Changing the imput/output endpoint of an arow
                        if (arrow.startAnchor === this) {
                            if (arrow.endMulti == null) {
                                // Normal arrow, click in startAnchor
                                arrow.endAnchor.arrowCreator.startdrag(e, arrow.endAnchor);
                                this.events.startdrag.dispatch(arrow.endAnchor);
                                arrow.destroy();
                            } else {
                                // Click in startAnchor, endAnchor is multiconector
                                arrow.destroy();
                                end = this.context.iObject.wiringEditor.multiconnectors[arrow.endMulti];
                                end.arrowCreator.startdrag(e, end);
                                end.events.startdrag.dispatch(end);
                            }
                        } else if (arrow.endAnchor === this) {
                            if (arrow.startMulti == null) {
                                // Normal arrow, click in endAnchor
                                arrow.startAnchor.arrowCreator.startdrag(e, arrow.startAnchor);
                                this.events.startdrag.dispatch(arrow.startAnchor);
                                arrow.destroy();
                            } else {
                                // Click in endAnchor, startAnchor is multiconector
                                arrow.destroy();
                                start = this.context.iObject.wiringEditor.multiconnectors[arrow.startMulti];
                                start.arrowCreator.startdrag(e, start);
                                start.events.startdrag.dispatch(start);
                            }
                        } else {
                            if ((arrow.startMulti != null) && (arrow.endMulti != null)) {
                                var multi;
                                start = this.context.iObject.wiringEditor.multiconnectors[arrow.startMulti];
                                end = this.context.iObject.wiringEditor.multiconnectors[arrow.endMulti];
                                arrow.destroy();
                                if (start === this) {
                                    // Start and end Anchor are multiconnectors, click in start Multiconnector
                                    multi = end;
                                } else {
                                    // Start and end Anchor are multiconnectors, click in end Multiconnector
                                    multi = start;
                                }
                                multi.arrowCreator.startdrag(e, multi);
                                multi.events.startdrag.dispatch(multi);
                            } else if (arrow.startMulti != null) {
                                // Click in startAnchor (multiconnector)
                                end = arrow.endAnchor;
                                end.arrowCreator.startdrag(e, end);
                                end.events.startdrag.dispatch(end);
                                arrow.destroy();
                            } else {
                                // Click in endAnchor (multiconnector)
                                start = arrow.startAnchor;
                                start.arrowCreator.startdrag(e, start);
                                start.events.startdrag.dispatch(start);
                                arrow.destroy();
                            }
                        }
                        return;
                    }
                    return;
                }
                // No selected arrows in this anchor
                arrowCreator.startdrag(e, this);
                this.events.startdrag.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mousedown', this._mousedown_callback, false);
        this.wrapperElement.addEventListener('contextmenu', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

        this._mouseup_callback = function _mouseup_callback(e) {
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                if (arrowCreator.initAnchor != null) {
                    e.stopPropagation();
                    arrowCreator.enddrag(e, this);
                    this.events.enddrag.dispatch(this);
                    this.removeClassName('pointed');
                }
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mouseup', this._mouseup_callback, false);

        // sticky arrows
        this._mouseover_callback = function _mouseover_callback(e) {
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                var pos;
                if (arrowCreator.initAnchor != null) {
                    this.addClassName('pointed');
                    document.removeEventListener("mousemove", arrowCreator.drag, false);
                    e.stopPropagation();
                    if (this instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                        pos = this.stick();
                    } else {
                        pos = this.getCoordinates(arrowCreator.layer);
                    }
                    if (!arrowCreator.invert) {
                        arrowCreator.theArrow.setEnd(pos);
                        if (!arrowCreator.theArrow.isGhost &&
                            this.context.data instanceof Wirecloud.wiring.GhostTargetEndpoint) {
                            //Ghost Arrow
                            arrowCreator.theArrow.isGhost = true;
                            arrowCreator.theArrow.addClassName('ghost');
                        }
                    } else {
                        arrowCreator.theArrow.setStart(pos);
                        if (!arrowCreator.theArrow.isGhost &&
                            this.context.data instanceof Wirecloud.wiring.GhostSourceEndpoint) {
                            //Ghost Arrow
                            arrowCreator.theArrow.isGhost = true;
                            arrowCreator.theArrow.addClassName('ghost');
                        }
                    }
                    arrowCreator.theArrow.redraw();
                }
            }
        }.bind(this);
        this._mouseout_callback = function _mouseout_callback(e) {
            var initEndpoint;

            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                if (arrowCreator.initAnchor != null) {
                    e.stopPropagation();
                    this.removeClassName('pointed');
                    document.addEventListener("mousemove", arrowCreator.drag, false);
                    if (this instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                        this.unstick();
                    }
                    initEndpoint = arrowCreator.initAnchor.context.data;
                    if (arrowCreator.theArrow.isGhost &&
                        !(initEndpoint instanceof Wirecloud.wiring.GhostSourceEndpoint || initEndpoint instanceof Wirecloud.wiring.GhostTargetEndpoint)) {
                        //Clean Ghost Arrow
                        arrowCreator.theArrow.isGhost = false;
                        arrowCreator.theArrow.removeClassName('ghost');
                    }
                }
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mouseover', this._mouseover_callback, false);
        this.wrapperElement.addEventListener('mouseout', this._mouseout_callback, false);
    };
    Anchor.prototype = new StyledElements.StyledElement();

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Retrieves the coordinates of this anchor relative to another HTML Element.
     *
     * @param {HTMLElement} baseElement element of reference.
     */
    Anchor.prototype.getCoordinates = function getCoordinates(baseElement) {

        var anchor_bcr, base_bcr, coordinates;

        anchor_bcr = this.wrapperElement.getBoundingClientRect();
        base_bcr = baseElement.getBoundingClientRect();

        coordinates = {
            posX: anchor_bcr.left - base_bcr.left + baseElement.scrollLeft,
            posY: anchor_bcr.top - base_bcr.top + baseElement.scrollTop
        };

        return {
            posX: Math.round(coordinates.posX + (this.wrapperElement.offsetWidth / 2)),
            posY: Math.round(coordinates.posY + (this.wrapperElement.offsetWidth / 2))
        };
    };

    /**
     * Get the arrow list
     */
    Anchor.prototype.getArrows = function getArrows() {
        return this.arrows;
    };

    /**
     * Return true when the Anchor has connected arrows
     */
    Anchor.prototype.isConnected = function isConnected() {
        return this.connectionArrows.length > 0;
    };

    /**
     * Add new Arrow to the Anchor
     */
    Anchor.prototype.addArrow = function addArrow(theArrow) {
        this.arrows.push(theArrow);
    };

    /**
     * Remove an Arrow from Anchor
     */
    Anchor.prototype.removeArrow = function removeArrow(theArrow) {
        var index = this.arrows.indexOf(theArrow);

        if (index !== -1) {
            this.arrows.splice(index, 1);
        }
    };

    /**
     * Highlight all Arrows from Anchor
     */
    Anchor.prototype.highlightArrows = function highlightArrows() {
        var i;

        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].highlight();
        }
    };

    /**
     * Unhighlight all Arrows from Anchor
     */
    Anchor.prototype.unhighlightArrows = function unhighlightArrows() {
        var i;

        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].unhighlight();
        }
    };

    /**
     * Serialize an Anchor
     */
    Anchor.prototype.serialize = function serialize() {
        if (!this.context.iObject.isGhost) {
            return this.context.data.serialize();
        } else {
            return {
                'type': this.context.iObject.className,
                'id': this.context.iObject[this.context.iObject.className].id,
                'endpoint': this.context.data.name
            };
        }
    };

    /**
     * Find selected arrow in Anchor
     */
    Anchor.prototype.hasSelectedArrow = function hasSelectedArrow() {
        var arrow, i;

        for (i = 0; i < this.arrows.length; i ++) {
            arrow = this.arrows[i];
            if (arrow.hasClassName('selected')) {
                return arrow;
            }
        }
        return null;
    };

    /**
     * Return if the widget/operator is Highlighted
     */
    Anchor.prototype.isHighlighted = function isHighlighted() {
        return this.context.iObject.highlighted;
    };

    /**
     * Return if the widget/operator is Emphasized
     */
    Anchor.prototype.isEmphasize = function isEmphasize() {
        return this.context.iObject.selected;
    };

    /**
     * Destroy the anchor
     */
    Anchor.prototype.destroy = function destroy() {
        StyledElements.StyledElement.prototype.destroy.call(this);

        this.wrapperElement.removeEventListener('mousedown', this._mousedown_callback, false);
        this.wrapperElement.removeEventListener('mouseup', this._mouseup_callback, false);
        this.wrapperElement = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Anchor = Anchor;
})();
