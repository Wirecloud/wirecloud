/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Wirecloud */

(function () {

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
        if (arguments.length === 0) {
            return; // Allow empty constructor (allowing hierarchy)
        }

        this.dragboard = dragboard;
        this.iWidgets = {};
    };

    /**
     *
     */
    DragboardLayout.prototype._notifyWindowResizeEvent = function _notifyWindowResizeEvent(widthChanged, heightChanged) {
        // Notify each iwidget
        var iwidget_key, iWidget;
        for (iwidget_key in this.iWidgets) {
            iWidget = this.iWidgets[iwidget_key];
            iWidget._notifyWindowResizeEvent();
        }
    };

    /**
     *
     */
    DragboardLayout.prototype._notifyResizeEvent = function (iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    };

    /**
     * Returns the size of the menu bar.
     *
     * @returns {Wirecloud.ui.MultiValuedSize} the size of the menu bar
     */
    DragboardLayout.prototype.getMenubarSize = function getMenubarSize() {
        var sizeInPixels = 18; // TODO calculate this
        var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
        return new Wirecloud.ui.MultiValuedSize(sizeInPixels, sizeInLU);
    };

    /**
     * Returns the size of the status bar.
     *
     * @returns {Wirecloud.ui.MultiValuedSize} the size of the menu bar
     */
    DragboardLayout.prototype.getStatusbarSize = function getStatusbarSize() {
        var sizeInPixels = 16; // TODO calculate this
        var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
        return new Wirecloud.ui.MultiValuedSize(sizeInPixels, sizeInLU);
    };

    /**
     * Returns the total vertical extra size that will have an iWidget. For now,
     * thats includes the menu bar and the status bar sizes.
     *
     * @returns {Wirecloud.ui.MultiValuedSize} vertical extra size
     */
    DragboardLayout.prototype.getExtraSize = function getExtraSize() {
        var sizeInPixels = this.getMenubarSize().inPixels +
                           this.getStatusbarSize().inPixels;
        var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
        return new Wirecloud.ui.MultiValuedSize(sizeInPixels, sizeInLU);
    };

    /////////////////////////////////////
    // Layout Units (LU) conversion.
    /////////////////////////////////////

    /**
     * Converts
     */
    DragboardLayout.prototype.adaptColumnOffset = function adaptColumnOffset(pixels) {
        var msg = gettext("method \"%(method)s\" must be implemented.");
        msg = interpolate(msg, {method: "adaptColumnOffset"}, true);
        throw new Error(msg);
    };

    DragboardLayout.prototype.adaptRowOffset = function adaptRowOffset(pixels) {
        var msg = gettext("method \"%(method)s\" must be implemented.");
        msg = interpolate(msg, {method: "adaptRowOffset"}, true);
        throw new Error(msg);
    };

    DragboardLayout.prototype.adaptHeight = function adaptHeight(contentHeight, fullSize, oldLayout) {
        var msg = gettext("method \"%(method)s\" must be implemented.");
        msg = interpolate(msg, {method: "adaptHeight"}, true);
        throw new Error(msg);
    };

    DragboardLayout.prototype.adaptWidth = function adaptWidth(contentWidth, fullSize, oldLayout) {
        var msg = gettext("method \"%(method)s\" must be implemented.");
        msg = interpolate(msg, {method: "adaptWidth"}, true);
        throw new Error(msg);
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

    Object.defineProperty(DragboardLayout.prototype, "dragboardTopMargin", {
        get: function () {
            return this.dragboard.topMargin;
        }
    });

    Object.defineProperty(DragboardLayout.prototype, "dragboardLeftMargin", {
        get: function () {
            return this.dragboard.leftMargin;
        }
    });

    /**
     * Adds an iWidget to this layout.
     *
     * @param {IWidget} iWidget          iWidget to add
     * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
     */
    DragboardLayout.prototype.addIWidget = function addIWidget(iWidget, affectsDragboard) {
        if (iWidget.layout != null) {
            var msg = gettext("the iWidget could not be associated with this layout as it already has an associated layout.");
            throw new Error(msg);
        }
        iWidget.layout = this;

        if (affectsDragboard) {
            this.dragboard._registerIWidget(iWidget);

            if (iWidget.isVisible()) { // TODO
                this.dragboard.dragboardElement.appendChild(iWidget.element);
                this.dragboard.dragboardElement.appendChild(iWidget.iconElement);
            }
        }

        this.iWidgets[iWidget.code] = iWidget;

        if (iWidget.isVisible()) {
            iWidget._recomputeSize();
        }
    };

    /**
     * @private
     *
     * This function should be called at the end of the implementation of addIWidget.
     */
    DragboardLayout.prototype._adaptIWidget = function _adaptIWidget(iWidget) {
        if (iWidget.element !== null) {
            this._ensureMinimalSize(iWidget, false);
        }
    };

    /**
     * @private
     *
     * Checks that the given iWidget has a minimal size. This check is performed using
     * iWidget content size.
     */
    DragboardLayout.prototype._ensureMinimalSize = function _ensureMinimalSize(iWidget, persist) {
        var minWidth = Math.ceil(this.fromPixelsToHCells(80));
        var minHeight = Math.ceil(this.fromPixelsToVCells(24));

        var sizeChange = false;
        var newWidth = iWidget.getContentWidth();
        var newHeight = iWidget.getContentHeight();

        if (newWidth < minWidth) {
            sizeChange = true;
            newWidth = minWidth;
        }

        if (newHeight < minHeight) {
            sizeChange = true;
            newHeight = minHeight;
        }

        if (sizeChange) {
            iWidget.setContentSize(newWidth, newHeight, false, persist);
        }
    };

    /**
     * Removes an iWidget from this layout.
     *
     * @param {IWidget} iWidget          iWidget to remove
     * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
     */
    DragboardLayout.prototype.removeIWidget = function removeIWidget(iWidget, affectsDragboard) {
        delete this.iWidgets[iWidget.code];

        if (affectsDragboard) {
            this.dragboard._deregisterIWidget(iWidget);

            if (iWidget.element !== null) {
                this.dragboard.dragboardElement.removeChild(iWidget.element);
            }
            if (iWidget.iconElement !== null) {
                this.dragboard.dragboardElement.removeChild(iWidget.iconElement);
            }
        }

        iWidget.layout = null;
    };

    /**
     * Moves this layout to another layout.
     *
     * @param {DragboardLayout} destLayout Layout where the iWidgets are going to be
     *        moved.
     */
    DragboardLayout.prototype.moveTo = function moveTo(destLayout) {
        var iwidget_key, iWidget;

        for (iwidget_key in this.iWidgets) {
            iWidget = this.iWidgets[iwidget_key];
            iWidget.moveToLayout(destLayout);
        }
    };

    /**
     * This method must be called to avoid memory leaks caused by circular
     * references.
     */
    DragboardLayout.prototype.destroy = function destroy() {
        var iwidget_key;

        for (iwidget_key in this.iWidgets) {
            this.iWidgets[iwidget_key].destroy();
        }
        this.iWidgets = null;
        this.dragboard = null;
    };

    /////////////////////////////////////
    // Drag & drop support
    /////////////////////////////////////

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

    /////////////////////////////////////
    // Css unit conversions
    /////////////////////////////////////

    /**
     * Measure the given test elmenet in the specified css units.
     *
     * @param testElement element to measure
     * @param units units to use in the measure
     *
     * @returns the horizontal and vertical size of the test element converted
     *          to the target css units.
     *
     * @see CSSPrimitiveValue
     */
    DragboardLayout.prototype.measure = function measure(testElement, units) {
        var res, cssStyle;

        testElement.style.visibility = "hidden";
        this.dragboard.dragboardElement.appendChild(testElement);

        // Retrieve target measurements
        res = [];
        cssStyle = document.defaultView.getComputedStyle(testElement, null);
        res[0] = cssStyle.getPropertyCSSValue("width").getFloatValue(units);
        res[1] = cssStyle.getPropertyCSSValue("height").getFloatValue(units);

        // Remove the test element
        testElement.parentNode.removeChild(testElement);

        return res;
    };

    /**
     * Converts a value from its initial units to the especified css units.
     *
     * @param {String} value css value to convert
     * @param newUnits units to convert to
     *
     * @returns the value converted to the target css units in horizontal and
     *          vertical
     *
     * @see CSSPrimitiveValue
     *
     * @example
     * layout.unitConvert("1cm", CSSPrimitiveValue.CSS_PX);
     */
    DragboardLayout.prototype.unitConvert = function unitConvert(value, newUnits) {
        // Create a square div using the given value
        var testDiv = document.createElement("div");
        testDiv.style.height = value;
        testDiv.style.width = value;

        return this.measure(testDiv, newUnits);
    };

    Wirecloud.ui.DragboardLayout = DragboardLayout;

})();
