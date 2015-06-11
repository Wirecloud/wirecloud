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


Wirecloud.ui.WiringEditor.Anchor = (function () {

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
    var Anchor = function Anchor(arrowCreator) {

        this.superClass(['startdrag', 'enddrag']);

        this.arrows = [];

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "endpoint-anchor";

        this._mousedown_callback = function _mousedown_callback(e) {
            var arrow, end, start;

            e.stopPropagation();
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                arrow = this.hasSelectedArrow();
                if (arrow != null) {
                    // ReadOnly & subdata control
                    if (arrow.readOnly) {
                        return;
                    }

                    // Changing the imput/output endpoint of an arow
                    if (arrow.startAnchor === this) {
                        // Click in startAnchor
                        arrow.endAnchor.arrowCreator.startdrag(e, arrow.endAnchor);
                        this.events.startdrag.dispatch(arrow.endAnchor);
                        arrow.remove();
                    } else {
                        // Click in endAnchor
                        arrow.startAnchor.arrowCreator.startdrag(e, arrow.startAnchor);
                        this.events.startdrag.dispatch(arrow.startAnchor);
                        arrow.remove();
                    }
                } else {
                    // No selected arrows in this anchor
                    arrowCreator.startdrag(e, this);
                    this.events.startdrag.dispatch(this);
                }
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
                    pos = this.getCoordinates(arrowCreator.layer);

                    if (!arrowCreator.invert) {
                        arrowCreator.theArrow.setEnd(pos);
                        if (!arrowCreator.theArrow.isGhost &&
                            this.context.data instanceof Wirecloud.wiring.GhostTargetEndpoint) {
                            //Ghost Arrow
                            arrowCreator.theArrow.isGhost = true;
                            arrowCreator.theArrow.addClassName('missing');
                        }
                    } else {
                        arrowCreator.theArrow.setStart(pos);
                        if (!arrowCreator.theArrow.isGhost &&
                            this.context.data instanceof Wirecloud.wiring.GhostSourceEndpoint) {
                            //Ghost Arrow
                            arrowCreator.theArrow.isGhost = true;
                            arrowCreator.theArrow.addClassName('missing');
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
                    initEndpoint = arrowCreator.initAnchor.context.data;
                    if (arrowCreator.theArrow.isGhost &&
                        !(initEndpoint instanceof Wirecloud.wiring.GhostSourceEndpoint || initEndpoint instanceof Wirecloud.wiring.GhostTargetEndpoint)) {
                        //Clean Ghost Arrow
                        arrowCreator.theArrow.isGhost = false;
                        arrowCreator.theArrow.removeClassName('missing');
                    }
                }
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mouseover', this._mouseover_callback, false);
        this.wrapperElement.addEventListener('mouseout', this._mouseout_callback, false);
    };

    StyledElements.Utils.inherit(Anchor, StyledElements.StyledElement);

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
        var anchor_bcr, base_bcr, coordinates, anchorWidth;

        anchor_bcr = this.wrapperElement.getBoundingClientRect();
        base_bcr = baseElement.getBoundingClientRect();

        coordinates = {
            x: anchor_bcr.left - base_bcr.left + baseElement.scrollLeft,
            y: anchor_bcr.top - base_bcr.top + baseElement.scrollTop
        };

        if (this.type == 'source') {
            anchorWidth = this.wrapperElement.offsetWidth;
        } else {
            anchorWidth = 0;
        }

        return {
            x: Math.round(coordinates.x + anchorWidth - 1),
            y: Math.round(coordinates.y + (this.wrapperElement.offsetHeight / 2) -1)
        };
    };

    /**
     * Get the arrow list
     */
    Anchor.prototype.getArrows = function getArrows() {
        return this.arrows;
    };

    Anchor.prototype.hasConnections = function hasConnections() {
        return this.arrows.length != 0;
    };

    /**
     * Return true when the Anchor has connected arrows
     */
    Anchor.prototype.isConnected = function isConnected() {
        return this.connectionArrows.length > 0;
    };

    Anchor.prototype.getEndpoint = function getEndpoint() {
        return this.wrapperElement.parentElement;
    }

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

    Anchor.prototype.getComponent = function getComponent() {
        return this.context.iObject;
    };

    Anchor.prototype.getName = function getName() {
        return [this.context.iObject.componentType, this.context.iObject.componentId, this.context.data.name].join('/');
    };

    /**
     * Serialize an Anchor
     */
    Anchor.prototype.serialize = function serialize() {
        var endpoint;

        return {
            'type': this.getComponent().componentType,
            'id': this.getComponent().componentId,
            'endpoint': this.context.data.name
        };
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

    return Anchor;

})();
