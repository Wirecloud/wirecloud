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
    var Anchor = function Anchor(extending, arrowCreator) {

        if (extending === true) {
            return;
        }
        StyledElements.StyledElement.call(this, ['startdrag', 'enddrag']);

        this.arrows = [];

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = 'anchor';
        this.menu = new StyledElements.PopupMenu({'position': ['bottom-left', 'top-left', 'bottom-right', 'top-right']});

        this._mousedown_callback = function _mousedown_callback(e) {
            var arrow, end, start;

            e.stopPropagation();
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                arrow = this.hasSelectedArrow();
                if (arrow != null) {
                    // ReadOnly control
                    if (arrow.readOnly) {
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
        this.wrapperElement.addEventListener('contextmenu',
            function (e) {
                e.preventDefault();
                this.menu.show(this.wrapperElement.getBoundingClientRect());
            }.bind(this), true);

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
                    } else {
                        arrowCreator.theArrow.setStart(pos);
                    }
                    arrowCreator.theArrow.redraw();
                }
            }
        }.bind(this);
        this._mouseout_callback = function _mouseout_callback(e) {
            // Only process left mouse button events
            if (this.enabled && e.button === 0) {
                if (arrowCreator.initAnchor != null) {
                    e.stopPropagation();
                    this.removeClassName('pointed');
                    document.addEventListener("mousemove", arrowCreator.drag, false);
                    if (this instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
                        this.unstick();
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
        var coordinates = {posX: this.wrapperElement.offsetLeft,
                           posY: this.wrapperElement.offsetTop};
        var parentNode = this.wrapperElement.parentNode;
        while (parentNode !== baseElement) {
            var cssStyle = document.defaultView.getComputedStyle(parentNode, null);
            var p = cssStyle.getPropertyValue('position');
            if (p !== 'static') {
                coordinates.posY += parentNode.offsetTop + cssStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
                coordinates.posX += parentNode.offsetLeft + cssStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            }
            // add the height of the widget/operator header
            if (parentNode.classList.contains("geContainer")) {
                coordinates.posY += parentNode.getElementsByClassName("container north_container header")[0].getBoundingClientRect().height;
            }
            // firefox correction
            if  (parentNode.classList.contains("anchorDiv") && this.context.iObject.wiringEditor.browser == "firefox") {
                coordinates.posY -= parentNode.getBoundingClientRect().height - 4;
            }
            if  (parentNode.classList.contains("reducedInt") && this.context.iObject.wiringEditor.browser == "firefox") {
                coordinates.posX -= 26;
                coordinates.posY += 30;
            }
            parentNode = parentNode.parentNode;
        }

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
     * Add new Arrow in the Anchor
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
     * emphasize compatible anchors
     */
    Anchor.prototype.emphasize = function emphasize() {
        return this.context.iObject.wiringEditor.emphasize(this);
    };

    /**
     * deemphasize compatible anchors
     */
    Anchor.prototype.deemphasize = function deemphasize() {
        return this.context.iObject.wiringEditor.deemphasize(this);
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
