/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/*jslint white: true, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, forin: true, sub: true*/
/*global document, Error, gettext, interpolate */

/////////////////////////////////////
// MultiValuedSize
/////////////////////////////////////

/**
 * @class Represents a size in several units.
 */
function MultiValuedSize(inPixels, inLU) {
    this.inPixels = inPixels;
    this.inLU = inLU;
}

/////////////////////////////////////
// DragboardLayout
/////////////////////////////////////

/**
 * This constructor initializes the common resources of a DragboardLayout. As
 * DragboardLayout is an abstract class, this can not be called directly and is
 * intented to be used by child classes.
 *
 * @class Represents a dragboard layout to be used to place igadgets into the
 * dragboard. Despite javascript not having a way to mark classes abstract, this
 * class is abstract, so please do not try to create an instance of this class.
 *
 * @private
 *
 * @param {Dragboard} dragboard      associated dragboard
 */
function DragboardLayout(dragboard) {
    if (arguments.length === 0) {
        return; // Allow empty constructor (allowing hierarchy)
    }

    this.dragboard = dragboard;
    this.iGadgets = {};
    this.dragboardTopMargin = 5;
}

/**
 *
 */
DragboardLayout.prototype._notifyWindowResizeEvent = function (widthChanged, heightChanged) {
    // Notify each igadget
    var igadget_key, iGadget;
    for (igadget_key in this.iGadgets) {
        iGadget = this.iGadgets[igadget_key];
        iGadget._notifyWindowResizeEvent();
    }
};

/**
 *
 */
DragboardLayout.prototype._notifyResizeEvent = function (iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
};

/**
 * Returns the size of the menu bar.
 *
 * @returns {MultiValuedSize} the size of the menu bar
 */
DragboardLayout.prototype.getMenubarSize = function () {
    var sizeInPixels = 18; // TODO calculate this
    var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
    return new MultiValuedSize(sizeInPixels, sizeInLU);
};

/**
 * Returns the size of the status bar.
 *
 * @returns {MultiValuedSize} the size of the menu bar
 */
DragboardLayout.prototype.getStatusbarSize = function () {
    var sizeInPixels = 16; // TODO calculate this
    var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
    return new MultiValuedSize(sizeInPixels, sizeInLU);
};

/**
 * Returns the total vertical extra size that will have an iGadget. For now,
 * thats includes the menu bar and the status bar sizes.
 *
 * @returns {MultiValuedSize} vertical extra size
 */
DragboardLayout.prototype.getExtraSize = function () {
    var sizeInPixels = this.getMenubarSize().inPixels +
                       this.getStatusbarSize().inPixels;
    var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
    return new MultiValuedSize(sizeInPixels, sizeInLU);
};

/////////////////////////////////////
// Layout Units (LU) conversion.
/////////////////////////////////////

/**
 * Converts
 */
DragboardLayout.prototype.adaptColumnOffset = function (pixels) {
    var msg = gettext("method \"%(method)s\" must be implemented.");
    msg = interpolate(msg, {method: "adaptColumnOffset"}, true);
    throw new Error(msg);
};

DragboardLayout.prototype.adaptRowOffset = function (pixels) {
    var msg = gettext("method \"%(method)s\" must be implemented.");
    msg = interpolate(msg, {method: "adaptRowOffset"}, true);
    throw new Error(msg);
};

DragboardLayout.prototype.adaptHeight = function (contentHeight, fullSize, oldLayout) {
    var msg = gettext("method \"%(method)s\" must be implemented.");
    msg = interpolate(msg, {method: "adaptHeight"}, true);
    throw new Error(msg);
};

DragboardLayout.prototype.adaptWidth = function (contentWidth, fullSize, oldLayout) {
    var msg = gettext("method \"%(method)s\" must be implemented.");
    msg = interpolate(msg, {method: "adaptWidth"}, true);
    throw new Error(msg);
};

DragboardLayout.prototype.padWidth = function (width) {
    return width;
};

DragboardLayout.prototype.padHeight = function (height) {
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
DragboardLayout.prototype.isInside = function (x, y) {
    return (x >= 0) && (x < this.getWidth()) && (y >= 0);
};

/**
 * Gets the width of the usable dragboard area.
 *
 * @returns The width of the usable dragboard area
 */
DragboardLayout.prototype.getWidth = function () {
    return this.dragboard.getWidth();
};

/**
 * Gets the height of the usable dragboard area.
 *
 * @returns The height of the usable dragboard area
 */
DragboardLayout.prototype.getHeight = function () {
    return this.dragboard.getHeight();
};

/**
 * Adds an iGadget to this layout.
 *
 * @param {IGadget} iGadget          iGadget to add
 * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
 */
DragboardLayout.prototype.addIGadget = function (iGadget, affectsDragboard) {
    if (iGadget.layout !== null && iGadget.layout !== undefined) {
        var msg = gettext("the iGadget could not be associated with this layout as it already has an associated layout.");
        throw new Error(msg);
    }
    iGadget.layout = this;

    if (affectsDragboard) {
        this.dragboard._registerIGadget(iGadget);

        if (iGadget.isVisible()) { // TODO
            this.dragboard.dragboardElement.appendChild(iGadget.element);
            this.dragboard.dragboardElement.appendChild(iGadget.iconElement);
        }
    }

    this.iGadgets[iGadget.code] = iGadget;

    if (iGadget.isVisible()) {
        iGadget._recomputeSize();
    }
};

/**
 * @private
 *
 * This function should be called at the end of the implementation of addIGadget.
 */
DragboardLayout.prototype._adaptIGadget = function (iGadget) {
    if (iGadget.element !== null) {
        this._ensureMinimalSize(iGadget, false);
    }
};

/**
 * @private
 *
 * Checks that the given iGadget has a minimal size. This check is performed using
 * iGadget content size.
 */
DragboardLayout.prototype._ensureMinimalSize = function (iGadget, persist) {
    var minWidth = Math.ceil(this.fromPixelsToHCells(80));
    var minHeight = Math.ceil(this.fromPixelsToVCells(24));

    var sizeChange = false;
    var newWidth = iGadget.getContentWidth();
    var newHeight = iGadget.getContentHeight();

    if (newWidth < minWidth) {
        sizeChange = true;
        newWidth = minWidth;
    }

    if (newHeight < minHeight) {
        sizeChange = true;
        newHeight = minHeight;
    }

    if (sizeChange) {
        iGadget.setContentSize(newWidth, newHeight, false, persist);
    }
};

/**
 * Removes an iGadget from this layout.
 *
 * @param {IGadget} iGadget          iGadget to remove
 * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
 */
DragboardLayout.prototype.removeIGadget = function (iGadget, affectsDragboard) {
    delete this.iGadgets[iGadget.code];

    if (affectsDragboard) {
        this.dragboard._deregisterIGadget(iGadget);

        if (iGadget.element !== null) {
            this.dragboard.dragboardElement.removeChild(iGadget.element);
        }
        if (iGadget.iconElement !== null) {
            this.dragboard.dragboardElement.removeChild(iGadget.iconElement);
        }
    }

    iGadget.layout = null;
};

/**
 * Moves this layout to another layout.
 *
 * @param {DragboardLayout} destLayout Layout where the iGadgets are going to be
 *        moved.
 */
DragboardLayout.prototype.moveTo = function (destLayout) {
    var igadget_key, iGadget;

    for (igadget_key in this.iGadgets) {
        iGadget = this.iGadgets[igadget_key];
        iGadget.moveToLayout(destLayout);
    }
};

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardLayout.prototype.destroy = function () {
    var igadget_key;

    for (igadget_key in this.iGadgets) {
        this.iGadgets[igadget_key].destroy();
    }
    this.iGadgets = null;
    this.dragboard = null;
};

/////////////////////////////////////
// Drag & drop support
/////////////////////////////////////

/**
 * Initializes a temporal iGadget move.
 *
 * @param {IGadget}          iGadget     iGadget to move
 * @param {IGadgetDraggable} [draggable] associated draggable object (only
 *                                       needed in drag & drop operations)
 *
 * @see DragboardLayout.initializeMove
 * @see DragboardLayout.moveTemporally
 * @see DragboardLayout.acceptMove
 * @see DragboardLayout.cancelMove
 *
 * @example
 * layout.initializeMove(iGadget, iGadgetDraggable);
 * layout.moveTemporally(1,0);
 * layout.moveTemporally(10,8);
 * layout.acceptMove();
 */
DragboardLayout.prototype.initializeMove = function (iGadget, draggable) {
};

/**
 * Moves temporally the configured iGadget (or cursor) to the given position.
 *
 * @param {Number} x new X coordinate
 * @param {Number} y new Y coordinate
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.moveTemporally = function (x, y) {
};

/**
 * Finish the current temporal move accepting the current position.
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.acceptMove = function () {
};

/**
 * Finish the current temporal move restoring the layout to the status before
 * to the call to initializeMove.
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.cancelMove = function () {
};

/**
 * Disables the cursor if it is active. This method must be implemented by
 * real Layout classes whether they use cursors. The default implementation
 * does nothing.
 */
DragboardLayout.prototype.disableCursor = function () {
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
DragboardLayout.prototype.measure = function (testElement, units) {
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
DragboardLayout.prototype.unitConvert = function (value, newUnits) {
    // Create a square div using the given value
    var testDiv = document.createElement("div");
    testDiv.style.height = value;
    testDiv.style.width = value;

    return this.measure(testDiv, newUnits);
};
