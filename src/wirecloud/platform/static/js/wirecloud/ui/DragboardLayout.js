/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    const UNIT_RE = /^([-+]?\d+(?:\.\d+)?)\s*(px|%|)$/;

    const on_remove_widget = function on_remove_widget(widget) {
        this.removeWidget(widget, true);
        this.dragboard.update();
    };

    /**
     * Checks that the given widget has a minimal size. This check is performed using
     * widget content size.
     *
     * @private
     */
    const ensureMinimalSize = function ensureMinimalSize(widget, persist) {
        const minWidth = Math.ceil(this.fromPixelsToHCells(80));
        const minHeight = Math.ceil(this.fromPixelsToVCells(80));

        let sizeChange = false;
        let newWidth = widget.shape.width;
        let newHeight = widget.shape.height;

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
    ns.DragboardLayout = class DragboardLayout {

        constructor(dragboard) {
            this.dragboard = dragboard;
            this.widgets = {};

            this._on_remove_widget_bound = on_remove_widget.bind(this);
        }

        /**
         *
         */
        _notifyWindowResizeEvent(widthChanged, heightChanged) {
            if (widthChanged || heightChanged) {
                // Notify each iwidget
                Object.values(this.widgets).forEach((widget) => {
                    widget.repaint();
                });
            }
        }

        /**
         *
         */
        _notifyResizeEvent(iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist) {
        }

        // =========================================================================
        // LAYOUT UNITS (LU) CONVERSION.
        // =========================================================================

        /**
         * Converters
         */
        parseSize(value) {
            if (typeof value === 'number') {
                return [value, 'cells'];
            } else if (typeof value === 'string') {
                value = value.trim();
                const matches = value.match(UNIT_RE);
                if (matches[2] !== '') {
                    return [Number(matches[1]), matches[2]];
                } else {
                    return [Number(matches[1]), "cells"];
                }
            } else {
                throw new TypeError();
            }
        }

        adaptColumnOffset(pixels, width) {
            const msg = utils.interpolate(
                "method \"%(method)s\" must be implemented.",
                {method: "adaptColumnOffset"},
                true
            );
            throw new Error(msg);
        }

        adaptRowOffset(pixels) {
            const msg = utils.interpolate(
                "method \"%(method)s\" must be implemented.",
                {method: "adaptRowOffset"},
                true
            );
            throw new Error(msg);
        }

        adaptHeight(size) {
            let pixels, sizeInLU;

            const parsedSize = this.parseSize(size);
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
        }

        adaptWidth(size, width) {
            let pixels, sizeInLU;

            const parsedSize = this.parseSize(size);
            if (parsedSize[1] === 'cells') {
                sizeInLU = Math.round(parsedSize[0]);
            } else {
                if (parsedSize[1] === '%') {
                    pixels = Math.round((parsedSize[0] * (width || this.getWidth())) / 100);
                } else {
                    pixels = this.padWidth(parsedSize[0]);
                }
                sizeInLU = Math.round(this.fromPixelsToHCells(pixels, width));
            }
            sizeInLU = Math.max(1, sizeInLU);
            return new Wirecloud.ui.MultiValuedSize(this.getWidthInPixels(sizeInLU, width), sizeInLU);
        }

        updatePosition(widget, element) {
            element.style.left = this.getColumnOffset(widget.position) + "px";
            element.style.top = this.getRowOffset(widget.position) + "px";
            element.style.bottom = "";
            element.style.right = "";
        }

        updateShape(widget, element) {
            const width = this.getWidthInPixels(widget.shape.width);
            if (width != null) {
                element.style.width = width + 'px';
            } else {
                element.style.width = "";
            }

            const height = widget.minimized ? null : this.getHeightInPixels(widget.shape.height);
            if (height != null) {
                element.style.height = height + 'px';
            } else {
                element.style.height = "";
            }
        }

        padWidth(width) {
            return width;
        }

        padHeight(height) {
            return height;
        }

        /**
         * Checks if the point is inside the dragboard.
         *
         * @param x  X coordinate
         * @param y  Y coordinate
         *
         * @returns true if the point is inside
         */
        isInside(x, y) {
            return (x >= 0) && (x < this.getWidth()) && (y >= 0);
        }

        /**
         * Gets the width of the usable dragboard area.
         *
         * @returns The width of the usable dragboard area
         */
        getWidth() {
            return this.dragboard.getWidth();
        }

        /**
         * Gets the height of the usable dragboard area.
         *
         * @returns The height of the usable dragboard area
         */
        getHeight() {
            return this.dragboard.getHeight();
        }

        addWidget(widget, affectsDragboard) {
            if (widget.layout != null) {
                const msg = utils.gettext("the widget could not be associated with this layout as it already has an associated layout.");
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
        }

        /**
         * This function should be called at the end of the implementation of addWidget.
         *
         * @private
        */
        _adaptIWidget(widget) {
            if (widget.element != null) {
                ensureMinimalSize.call(this, widget, false);
            }
        }

        /**
         * Removes the indicated widget from this layout
         *
         * @returns true if any of the other widgets of this layout has been moved
         */
        removeWidget(widget, affectsDragboard) {
            delete this.widgets[widget.id];

            if (affectsDragboard) {
                this.dragboard._removeWidget(widget);
            }

            widget.layout = null;
            widget.removeEventListener('remove', this._on_remove_widget_bound);

            return new Set();
        }

        /**
         * Removes all event listeners associated with the widget
         *
         * @param {WidgetView} widget
         */
        removeWidgetEventListeners(widget) {
            widget.removeEventListener('remove', this._on_remove_widget_bound);
        }

        /**
         * Moves all widget in this layout to another layout.
         *
         * @param {DragboardLayout} destLayout Layout where the iWidgets are going to be
         *        moved.
         */
        moveTo(destLayout) {
            Object.values(this.widgets).forEach((widget) => {
                widget.moveToLayout(destLayout);
            });

            return this;
        }

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
        initializeMove(iWidget, draggable) {
        }

        /**
         * Moves temporally the configured iWidget (or cursor) to the given position.
         *
         * @param {Number} x new X coordinate
         * @param {Number} y new Y coordinate
         *
         * @see DragboardLayout.initializeMove
         */
        moveTemporally(x, y) {
        }

        /**
         * Finish the current temporal move accepting the current position.
         *
         * @see DragboardLayout.initializeMove
         */
        acceptMove() {
        }

        /**
         * Finish the current temporal move restoring the layout to the status before
         * to the call to initializeMove.
         *
         * @see DragboardLayout.initializeMove
         */
        cancelMove() {
        }

        /**
         * Disables the cursor if it is active. This method must be implemented by
         * real Layout classes whether they use cursors. The default implementation
         * does nothing.
         */
        disableCursor() {
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
