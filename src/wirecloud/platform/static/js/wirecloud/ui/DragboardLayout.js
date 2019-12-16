/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    /**
     * This constructor initializes the common resources of a DragboardLayout. As
     * DragboardLayout is an abstract class, this can not be called directly and is
     * intented to be used by child classes.
     *
     * @class Represents a dragboard layout to be used to place iwidgets into the
     * dragboard. Despite javascript not having a way to mark classes abstract, this
     * class is abstract, so please do not try to create an instance of this class.
     *
     * @private
     *
     * @param {Dragboard} dragboard      associated dragboard
     */
    var DragboardLayout = function DragboardLayout(dragboard) {
        this.dragboard = dragboard;
        this.widgets = {};

        this._on_remove_widget_bound = on_remove_widget.bind(this);
    };

    /**
     *
     */
    DragboardLayout.prototype._notifyWindowResizeEvent = function _notifyWindowResizeEvent(widthChanged, heightChanged) {
        // Notify each iwidget
        Object.values(this.widgets).forEach((widget) => {
            widget.repaint();
        });
    };

    /**
     *
     */
    DragboardLayout.prototype._notifyResizeEvent = function (iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    };

    // =========================================================================
    // LAYOUT UNITS (LU) CONVERSION.
    // =========================================================================

    /**
     * Converters
     */
    var UNIT_RE = /^([-+]?\d+(?:\.\d+)?)\s*(px|%|)$/;
    DragboardLayout.prototype.parseSize = function parseSize(value) {
        var matches;

        if (typeof value === 'number') {
            return [value, 'cells'];
        } else if (typeof value === 'string') {
            value = value.trim();
            matches = value.match(UNIT_RE);
            if (matches[2] !== '') {
                return [Number(matches[1]), matches[2]];
            } else {
                return [Number(matches[1]), "cells"];
            }
        } else {
            throw new TypeError();
        }
    };

    DragboardLayout.prototype.adaptColumnOffset = function adaptColumnOffset(pixels) {
        var msg = "method \"%(method)s\" must be implemented.";
        msg = utils.interpolate(msg, {method: "adaptColumnOffset"}, true);
        throw new Error(msg);
    };

    DragboardLayout.prototype.adaptRowOffset = function adaptRowOffset(pixels) {
        var msg = "method \"%(method)s\" must be implemented.";
        msg = utils.interpolate(msg, {method: "adaptRowOffset"}, true);
        throw new Error(msg);
    };

    DragboardLayout.prototype.adaptHeight = function adaptHeight(size) {
        var parsedSize, pixels, sizeInLU;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            sizeInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getHeight()) / 100);
            } else {
                pixels = this.padHeight(parsedSize[0]);
            }
            sizeInLU = Math.round(this.fromPixelsToVCells(pixels));
        }
        sizeInLU = Math.max(1, sizeInLU);
        return new Wirecloud.ui.MultiValuedSize(this.getHeightInPixels(sizeInLU), sizeInLU);
    };

    DragboardLayout.prototype.adaptWidth = function adaptWidth(size) {
        var parsedSize, pixels, sizeInLU;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            sizeInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
            } else {
                pixels = this.padWidth(parsedSize[0]);
            }
            sizeInLU = Math.round(this.fromPixelsToHCells(pixels));
        }
        sizeInLU = Math.max(1, sizeInLU);
        return new Wirecloud.ui.MultiValuedSize(this.getWidthInPixels(sizeInLU), sizeInLU);
    };

    DragboardLayout.prototype.updatePosition = function updatePosition(widget, element) {
        element.style.left = this.getColumnOffset(widget.position.x) + "px";
        element.style.top = this.getRowOffset(widget.position.y) + "px";
        element.style.bottom = "";
        element.style.right = "";
    };

    DragboardLayout.prototype.updateShape = function updateShape(widget, element) {
        let width = this.getWidthInPixels(widget.shape.width);
        if (width != null) {
            element.style.width = width + 'px';
        } else {
            element.style.width = "";
        }

        let height = widget.minimized ? null : this.getHeightInPixels(widget.shape.height);
        if (height != null) {
            element.style.height = height + 'px';
        } else {
            element.style.height = "";
        }
    };

    DragboardLayout.prototype.padWidth = function padWidth(width) {
        return width;
    };

    DragboardLayout.prototype.padHeight = function padHeight(height) {
        return height;
    };

    /**
     * Checks if the point is inside the dragboard.
     *
     * @param x  X coordinate
     * @param y  Y coordinate
     *
     * @returns true if the point is inside
     */
    DragboardLayout.prototype.isInside = function isInside(x, y) {
        return (x >= 0) && (x < this.getWidth()) && (y >= 0);
    };

    /**
     * Gets the width of the usable dragboard area.
     *
     * @returns The width of the usable dragboard area
     */
    DragboardLayout.prototype.getWidth = function getWidth() {
        return this.dragboard.getWidth();
    };

    /**
     * Gets the height of the usable dragboard area.
     *
     * @returns The height of the usable dragboard area
     */
    DragboardLayout.prototype.getHeight = function getHeight() {
        return this.dragboard.getHeight();
    };

    Object.defineProperties(DragboardLayout.prototype, {
        "dragboardTopMargin": {
            get: function () {
                return this.dragboard.topMargin;
            }
        },
        "dragboardLeftMargin": {
            configurable: true,
            get: function () {
                return this.dragboard.leftMargin;
            }
        }
    });

    DragboardLayout.prototype.addWidget = function addWidget(widget, affectsDragboard) {
        if (widget.layout != null) {
            var msg = utils.gettext("the widget could not be associated with this layout as it already has an associated layout.");
            throw new Error(msg);
        }
        widget.layout = this;

        if (affectsDragboard) {
            this.dragboard._addWidget(widget);
        }

        this.widgets[widget.id] = widget;
        widget.addEventListener('remove', this._on_remove_widget_bound);
        widget.repaint();

        return new Set();
    };

    /**
     * @private
     *
     * This function should be called at the end of the implementation of addWidget.
     */
    DragboardLayout.prototype._adaptIWidget = function _adaptIWidget(widget) {
        if (widget.element != null) {
            ensureMinimalSize.call(this, widget, false);
        }
    };

    /**
     * @private
     *
     * Checks that the given widget has a minimal size. This check is performed using
     * widget content size.
     */
    var ensureMinimalSize = function ensureMinimalSize(widget, persist) {
        var minWidth = Math.ceil(this.fromPixelsToHCells(80));
        var minHeight = Math.ceil(this.fromPixelsToVCells(80));

        var sizeChange = false;
        var newWidth = widget.shape.width;
        var newHeight = widget.shape.height;

        if (newWidth < minWidth) {
            sizeChange = true;
            newWidth = minWidth;
        }

        if (newHeight < minHeight) {
            sizeChange = true;
            newHeight = minHeight;
        }

        if (sizeChange) {
            widget.setShape({width: newWidth, height: newHeight});
        }
    };

    /**
     * Removes the indicated widget from this layout
     *
     * @returns true if any of the other widgets of this layout has been moved
     */
    DragboardLayout.prototype.removeWidget = function removeWidget(widget, affectsDragboard) {
        delete this.widgets[widget.id];

        if (affectsDragboard) {
            this.dragboard._removeWidget(widget);
        }

        widget.layout = null;
        widget.removeEventListener('remove', this._on_remove_widget_bound);

        return new Set();
    };

    /**
     * Moves all widget in this layout to another layout.
     *
     * @param {DragboardLayout} destLayout Layout where the iWidgets are going to be
     *        moved.
     */
    DragboardLayout.prototype.moveTo = function moveTo(destLayout) {
        Object.values(this.widgets).forEach((widget) => {
            widget.moveToLayout(destLayout);
        });

        return this;
    };

    // =========================================================================
    // Drag & drop support
    // =========================================================================

    /**
     * Initializes a temporal iWidget move.
     *
     * @param {IWidget}          iWidget     iWidget to move
     * @param {IWidgetDraggable} [draggable] associated draggable object (only
     *                                       needed in drag & drop operations)
     *
     * @see DragboardLayout.initializeMove
     * @see DragboardLayout.moveTemporally
     * @see DragboardLayout.acceptMove
     * @see DragboardLayout.cancelMove
     *
     * @example
     * layout.initializeMove(iWidget, iWidgetDraggable);
     * layout.moveTemporally(1,0);
     * layout.moveTemporally(10,8);
     * layout.acceptMove();
     */
    DragboardLayout.prototype.initializeMove = function initializeMove(iWidget, draggable) {
    };

    /**
     * Moves temporally the configured iWidget (or cursor) to the given position.
     *
     * @param {Number} x new X coordinate
     * @param {Number} y new Y coordinate
     *
     * @see DragboardLayout.initializeMove
     */
    DragboardLayout.prototype.moveTemporally = function moveTemporally(x, y) {
    };

    /**
     * Finish the current temporal move accepting the current position.
     *
     * @see DragboardLayout.initializeMove
     */
    DragboardLayout.prototype.acceptMove = function acceptMove() {
    };

    /**
     * Finish the current temporal move restoring the layout to the status before
     * to the call to initializeMove.
     *
     * @see DragboardLayout.initializeMove
     */
    DragboardLayout.prototype.cancelMove = function cancelMove() {
    };

    /**
     * Disables the cursor if it is active. This method must be implemented by
     * real Layout classes whether they use cursors. The default implementation
     * does nothing.
     */
    DragboardLayout.prototype.disableCursor = function disableCursor() {
    };

    var on_remove_widget = function on_remove_widget(widget) {
        this.removeWidget(widget, true);
        this.dragboard.update();
    };

    Wirecloud.ui.DragboardLayout = DragboardLayout;

})(Wirecloud.Utils);
