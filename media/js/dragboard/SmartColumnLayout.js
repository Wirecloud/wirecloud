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
/*global gettext, Constants, DragboardLayout, DragboardPosition, DragboardCursor, IGadget, LogManagerFactory, MultiValuedSize, Hash*/

/////////////////////////////////////
// ColumnLayout
/////////////////////////////////////

/**
 * Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * @param dragboard        associated dragboard
 * @param columns          number of columns of the layout
 * @param cellHeight       the height of the layout's cells in pixels
 * @param verticalMargin   vertical margin between igadgets in pixels
 * @param horizontalMargin horizontal margin between igadgets in pixels
 * @param scrollbarSpace   space reserved for the right scroll bar in pixels
 */
function ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
    if (arguments.length === 0) {
        return; // Allow empty constructor (allowing hierarchy)
    }

    this.initialized = false;
    this.shadowMatrix = null;    // Temporal matrix of igadgets used for D&D
    this.shadowPositions = null;
    this.columns = columns;
    this.cellHeight = cellHeight;

    if ((verticalMargin % 2) === 0) {
        this.topMargin = verticalMargin / 2;
        this.bottomMargin = verticalMargin / 2;
    } else {
        this.topMargin = Math.floor(verticalMargin / 2);
        this.bottomMargin = Math.floor(verticalMargin / 2) + 1;
    }

    if ((horizontalMargin % 2) === 0) {
        this.leftMargin = horizontalMargin / 2;
        this.rightMargin = horizontalMargin / 2;
    } else {
        this.leftMargin = Math.floor(horizontalMargin / 2);
        this.rightMargin = Math.floor(horizontalMargin / 2) + 1;
    }

    this._clearMatrix();         // Matrix of igadgets
    this.dragboardCursor = null;
    this.igadgetToMove = null;

    DragboardLayout.call(this, dragboard, scrollbarSpace);
}

/*
 * ColumnLayout extends DragboardLayout
 */
ColumnLayout.prototype = new DragboardLayout();

/**
 * Returns the numbers of columns of this layout.
 */
ColumnLayout.prototype.getColumns = function () {
    return this.columns;
};

/**
 * Returns the number of rows currently present in this layout.
 */
ColumnLayout.prototype.getRows = function () {
    var x, rows = 0;
    for (x = 0; x < this.columns; x += 1) {
        rows = Math.max(rows, this.matrix[x].length);
    }
    return rows;
};

ColumnLayout.prototype.getCellHeight = function () {
    return this.cellHeight;
};

ColumnLayout.prototype.fromPixelsToVCells = function (pixels) {
    return pixels > 0 ? (pixels / this.cellHeight) : 0;
};

ColumnLayout.prototype.fromVCellsToPixels = function (cells) {
    return (cells * this.cellHeight);
};

ColumnLayout.prototype.getWidthInPixels = function (cells) {
    return this.fromHCellsToPixels(cells) - this.leftMargin - this.rightMargin;
};

ColumnLayout.prototype.getHeightInPixels = function (cells) {
    return this.fromVCellsToPixels(cells) - this.topMargin - this.bottomMargin;
};

ColumnLayout.prototype.fromPixelsToHCells = function (pixels) {
    var cells = pixels / this.fromHCellsToPixels(1);
    var truncatedCells = Math.floor(cells);

    if (Math.ceil(this.fromHCellsToPixels(truncatedCells)) === pixels) {
        return truncatedCells;
    } else {
        return cells;
    }
};

ColumnLayout.prototype.fromHCellsToPixels = function (cells) {
    return (this.getWidth() * this.fromHCellsToPercentage(cells)) / 100;
};

ColumnLayout.prototype.fromHCellsToPercentage = function (cells) {
    return cells * (100 / this.columns);
};

ColumnLayout.prototype.adaptColumnOffset = function (pixels) {
    var halfColumnWidth = Math.floor(this.fromHCellsToPixels(1) / 2);
    var offsetInLU = Math.floor(this.fromPixelsToHCells(pixels - this.leftMargin + halfColumnWidth));
    var offsetInPixels = this.fromHCellsToPixels(offsetInLU) + this.leftMargin;
    return new MultiValuedSize(offsetInPixels, offsetInLU);
};

ColumnLayout.prototype.adaptRowOffset = function (pixels) {
    var halfRowHeight = Math.floor(this.fromVCellsToPixels(1) / 2);
    var offsetInLU = Math.floor(this.fromPixelsToVCells(pixels - this.topMargin + halfRowHeight));
    var offsetInPixels = this.fromVCellsToPixels(offsetInLU) + this.topMargin;
    return new MultiValuedSize(offsetInPixels, offsetInLU);
};

ColumnLayout.prototype.adaptHeight = function (contentHeight, fullSize, oldLayout) {
    oldLayout = oldLayout ? oldLayout : this;
    fullSize = oldLayout.padHeight(fullSize);

    var paddedFullSizeInCells = Math.ceil(this.fromPixelsToVCells(fullSize));
    var paddedFullSize = this.fromVCellsToPixels(paddedFullSizeInCells);

    return new MultiValuedSize(contentHeight + (paddedFullSize - fullSize), paddedFullSizeInCells);
};

ColumnLayout.prototype.adaptWidth = function (contentWidth, fullSize, oldLayout) {
    oldLayout = oldLayout ? oldLayout : this;
    fullSize = oldLayout.padWidth(fullSize);

    var paddedFullSizeInCells = Math.ceil(this.fromPixelsToHCells(fullSize));
    var paddedFullSize = this.fromHCellsToPixels(paddedFullSizeInCells);

    return new MultiValuedSize(contentWidth + (paddedFullSize - fullSize), paddedFullSizeInCells);
};

ColumnLayout.prototype.padWidth = function (width) {
    return width + this.leftMargin + this.rightMargin;
};

ColumnLayout.prototype.padHeight = function (height) {
    return height + this.topMargin + this.bottomMargin;
};

ColumnLayout.prototype.getColumnOffset = function (column) {
    var tmp = Math.floor((this.getWidth() * this.fromHCellsToPercentage(column)) / 100);
    tmp += this.leftMargin;
    return tmp;
};

ColumnLayout.prototype.getRowOffset = function (row) {
    return this.fromVCellsToPixels(row) + this.topMargin;
};

ColumnLayout.prototype._getPositionOn = function (_matrix, gadget) {
    if (_matrix === this.matrix) {
        return gadget.getPosition();
    } else {
        return this.shadowPositions[gadget.code];
    }
};

ColumnLayout.prototype._setPositionOn = function (_matrix, gadget, position) {
    if (_matrix === this.matrix) {
        gadget.setPosition(position);
    } else {
        this.shadowPositions[gadget.code] = position;
    }
};

ColumnLayout.prototype._clearMatrix = function () {
    this.matrix = [];

    for (var x = 0; x < this.getColumns(); x++) {
        this.matrix[x] = [];
    }
};

ColumnLayout.prototype._hasSpaceFor = function (_matrix, positionX, positionY, width, height) {
    var x, y;

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            if (_matrix[positionX + x][positionY + y] != null) {
                return false;
            }
        }
    }

    return true;
};

ColumnLayout.prototype._reserveSpace = function (_matrix, iGadget) {
    var x, y;
    var position = this._getPositionOn(_matrix, iGadget);
    var width = iGadget.getWidth();
    var height = iGadget.getHeight();

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            _matrix[position.x + x][position.y + y] = iGadget;
        }
    }
};

ColumnLayout.prototype._clearSpace = function (_matrix, iGadget) {
    var x, y;
    var position = this._getPositionOn(_matrix, iGadget);
    var width = iGadget.getWidth();
    var height = iGadget.getHeight();

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            delete _matrix[position.x + x][position.y + y];
        }
    }
};

ColumnLayout.prototype._searchInsertPoint = function (_matrix, x, y, width, height) {
    return y;
};

ColumnLayout.prototype._moveSpaceDown = function (_matrix, iGadget, offsetY) {
    var affectedIGadgets, position, finalPosition, edgeY, igadget, x, y, i, keys, key;

    affectedIGadgets = new Hash();
    position = this._getPositionOn(_matrix, iGadget);
    finalPosition = position.clone();
    finalPosition.y += offsetY;

    edgeY = position.y + iGadget.getHeight();

    // Search affected gadgets
    // TODO move gadgets according to the biggest offset for optimizing
    for (x = 0; x < iGadget.getWidth(); x++) {
        for (y = 0; y < offsetY; y++) {
            igadget = _matrix[position.x + x][edgeY + y];
            if (igadget != null) {
                affectedIGadgets[igadget.code] = offsetY - y; // calculate the offset for this igadget
                break; // continue whit the next column
            }
        }
    }

    // Move affected gadgets instances
    keys = affectedIGadgets.keys();
    for (i = 0; i < keys.length; i++) {
        key = keys[i];
        igadget = this.iGadgets[key];
        this._moveSpaceDown(_matrix, igadget, affectedIGadgets[key]);
    }

    // Move the gadget
    this._clearSpace(_matrix, iGadget);
    this._setPositionOn(_matrix, iGadget, finalPosition);
    this._reserveSpace(_matrix, iGadget);
};

ColumnLayout.prototype._moveSpaceUp = function (_matrix, iGadget) {
    var position = this._getPositionOn(_matrix, iGadget);
    var edgeY = position.y + iGadget.getHeight();

    var offsetY = 1;
    while (((position.y - offsetY) >= 0) && this._hasSpaceFor(_matrix, position.x, position.y - offsetY, iGadget.getWidth(), 1)) {
        offsetY += 1;
    }
    offsetY -= 1;

    if (offsetY > 0) {
        var affectedIGadgets = new Hash();
        var finalPosition = position.clone();
        finalPosition.y -= offsetY;

        // Search affected gadgets
        // TODO move the topmost gadget for optimizing
        var igadget, x, y, columnsize;
        for (x = 0; x < iGadget.getWidth(); x++) {
            columnsize = _matrix[position.x + x].length;
            for (y = edgeY; y < columnsize; y++) {
                igadget = _matrix[position.x + x][y];
                if (igadget != null) {
                    affectedIGadgets[igadget.code] = igadget;
                    break; // continue whit the next column
                }
            }
        }

        // Move the representation of the gadget
        this._clearSpace(_matrix, iGadget);
        this._setPositionOn(_matrix, iGadget, finalPosition);
        this._reserveSpace(_matrix, iGadget);

        // Move affected gadgets instances
        var keys = affectedIGadgets.keys();
        var i;
        for (i = 0; i < keys.length; i++) {
            this._moveSpaceUp(_matrix, affectedIGadgets[keys[i]]);
        }

        //return true if the igadget position has been modified
        return true;
    }
    return false;
};

ColumnLayout.prototype._removeFromMatrix = function (_matrix, iGadget) {
    this._clearSpace(_matrix, iGadget);
    return false;
};

ColumnLayout.prototype._reserveSpace2 = function (_matrix, iGadget, positionX, positionY, width, height) {
    var x, y;

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            _matrix[positionX + x][positionY + y] = iGadget;
        }
    }
};

ColumnLayout.prototype._clearSpace2 = function (_matrix, positionX, positionY, width, height) {
    var x, y;

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            delete _matrix[positionX + x][positionY + y];
        }
    }
};

ColumnLayout.prototype._notifyResizeEvent = function (iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    var x, y;
    var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
    var position = iGadget.getPosition();
    var step2X, iGadgetToMove, finalYPos, widthDiff;
    step2X = position.x;

    // First Step
    if (newWidth > oldWidth) {
        // Calculate the width for the next step
        step2Width = oldWidth;

        finalYPos = position.y + newHeight;

        if (resizeLeftSide) {
            // Move affected igadgets
            widthDiff = newWidth - oldWidth;
            for (x = position.x - widthDiff; x < position.x; ++x) {
                for (y = 0; y < newHeight; ++y) {
                    iGadgetToMove = this.matrix[x][position.y + y];
                    if (iGadgetToMove != null) {
                        this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
                        break; // Continue with the next column
                    }
                }
            }

            // Move the gadget
            position.x -= widthDiff;
            if (persist) {
                iGadget.setPosition(position);
            }

            // Reserve the new space
            this._reserveSpace2(this.matrix, iGadget,
                                             position.x, position.y,
                                             widthDiff, newHeight);
        } else {
            // Move affected igadgets
            for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
                for (y = 0; y < newHeight; ++y) {
                    iGadgetToMove = this.matrix[x][position.y + y];
                    if (iGadgetToMove != null) {
                        this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
                        break; // Continue with the next column
                    }
                }
            }

            // Reserve this space
            this._reserveSpace2(this.matrix, iGadget,
                                             position.x + oldWidth, position.y,
                                             newWidth - oldWidth, newHeight);
        }

    } else if (newWidth < oldWidth) {
        // Calculate the width for the next step
        step2Width = newWidth;

        widthDiff = oldWidth - newWidth;
        if (resizeLeftSide) {

            // Clear space
            this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

            // Move the gadget
            position.x += widthDiff;
            if (persist) {
                iGadget.setPosition(position);
            }

            step2X = position.x;
        } else {
            // Clear space
            this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);
        }
    }


    // Second Step
    if (newHeight > oldHeight) {
        var limitY = position.y + newHeight;
        var limitX = step2X + step2Width;
        for (y = position.y + oldHeight; y < limitY; y++) {
            for (x = step2X; x < limitX; x++) {
                if (this.matrix[x][y] != null) {
                    this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);
                }
            }
        }

        // Reserve Space
        this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
    } else if (newHeight < oldHeight) {
        // Clear freed space
        this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);
    }

    this._notifyWindowResizeEvent(true, true); // TODO
    if (persist) {
        this.dragboard._commitChanges(); // FIXME
    }
};

ColumnLayout.prototype._insertAt = function (iGadget, x, y) {
    var newPosition = new DragboardPosition(x > 0 ? x : 0, y > 0 ? y : 0);

    // Move other instances
    var affectedgadget, offset, affectedY;
    var affectedGadgets = false;
    var lastX = newPosition.x + iGadget.getWidth();
    var lastY = newPosition.y + iGadget.getHeight();

    for (x = newPosition.x; x < lastX; x++) {
        for (y = newPosition.y; y < lastY; y++) {
            affectedgadget = this.matrix[x][y];
            if (affectedgadget != null) {
                // only move the gadget if we didn't move it before
                affectedY = affectedgadget.getPosition().y;
                // y + iGadget.getHeight() - affectedY - (newPosition.y - y);
                offset = lastY - affectedY;
                this._moveSpaceDown(this.matrix, affectedgadget,  offset);
                // move only the topmost gadget in the column
                affectedGadgets = true;
                break;
            }
        }
    }

    // Change Gadget instance position (insert it)
    iGadget.setPosition(newPosition);

    this._reserveSpace(this.matrix, iGadget);

    //returns if any gadget's position has been modified
    return affectedGadgets;
};

ColumnLayout.prototype._searchFreeSpace = function (width, height) {
    var positionX = 0, positionY = 0;
    var columns = this.getColumns() - width + 1;

    for (positionY = 0; true ; positionY++) {
        for (positionX = 0; positionX < columns; positionX++) {
            if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
                return new DragboardPosition(positionX, positionY);
            }
        }
    }
};

ColumnLayout.prototype.initialize = function () {
    var iGadget, i, key, position, iGadgetsToReinsert = [];

    this._clearMatrix();

    // Insert igadgets
    var igadgetKeys = this.iGadgets.keys();
    for (i = 0; i < igadgetKeys.length; i++) {
        key = igadgetKeys[i];

        iGadget = this.iGadgets[key];

        position = iGadget.getPosition();

        iGadget.paint(true);
        this._ensureMinimalSize(iGadget);

        if (iGadget.getWidth() > this.getColumns()) {
            iGadget.contentWidth = this.getColumns();
        }

        if (iGadget.getWidth() + position.x > this.getColumns()) {
            iGadgetsToReinsert.push(iGadget);
        } else if (this._hasSpaceFor(this.matrix, position.x, position.y, iGadget.getWidth(), iGadget.getHeight())) {
            this._reserveSpace(this.matrix, iGadget);
        } else {
            iGadgetsToReinsert.push(iGadget);
        }
    }

    var modified = false;
    if (iGadgetsToReinsert.length > 0) {
        // Reinsert the igadgets that didn't fit in their positions
        for (i = 0; i < iGadgetsToReinsert.length; i++) {
            position = this._searchFreeSpace(iGadgetsToReinsert[i].getWidth(),
                                             iGadgetsToReinsert[i].getHeight());
            iGadgetsToReinsert[i].setPosition(position);
            this._reserveSpace(this.matrix, iGadgetsToReinsert[i]);
        }
        modified = true;
    }

    this.initialized = true;
    return modified;
};

/**
 * Calculate what cell is at a given position in pixels
 */
ColumnLayout.prototype.getCellAt = function (x, y) {
    var columnWidth = this.getWidth() / this.getColumns();

    return new DragboardPosition(Math.floor(x / columnWidth),
                                 Math.floor(y / this.getCellHeight()));
};

/**
 * Inserts the given iGadget into this layout.
 *
 * @param iGadget the iGadget to insert in this layout
 * @param affectsDragboard if true, the dragboard associated to this layout will be notified
 * @return whether any gadget's position has been modified
 */
ColumnLayout.prototype.addIGadget = function (iGadget, affectsDragboard) {
    var affectedGadgets = false;

    DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

    if (!this.initialized) {
        return;
    }

    if (iGadget.getWidth() > this.getColumns()) {
        iGadget.contentWidth = this.getColumns();
        iGadget._recomputeSize(true);
    }

    var position = iGadget.getPosition();
    if (position) {
        var diff = iGadget.getWidth() + position.x - this.getColumns();
        if (diff > 0) {
            position.x -= diff;
        }

        // Insert it. Returns if there are any affected gadget
        affectedGadgets = this._insertAt(iGadget, position.x, position.y);
    } else {
        // Search a position for the gadget
        position = this._searchFreeSpace(iGadget.getWidth(), iGadget.getHeight());
        iGadget.setPosition(position);

        // Reserve the cells for the gadget instance
        this._reserveSpace(this.matrix, iGadget);
    }

    this._adaptIGadget(iGadget);
    return affectedGadgets;
};

//Returns if any gadget's position has been modified
ColumnLayout.prototype.removeIGadget = function (iGadget, affectsDragboard) {
    var affectedGadgets;

    affectedGadgets = this._removeFromMatrix(this.matrix, iGadget);
    DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
    return affectedGadgets;
};

ColumnLayout.prototype.moveTo = function (destLayout) {
    var movedGadgets, orderedGadgets, x, y, i, columns, rows, iGadget;

    /*
     * Always use ColumnLayout._removeFromMatrix for removing gadgets
     * when moving gadgets to another layout.
     */
    this._removeFromMatrix = ColumnLayout.prototype._removeFromMatrix;

    movedGadgets = {};
    orderedGadgets = [];
    columns = this.getColumns();
    rows = this.getRows();
    for (y = 0; y < rows; y += 1) {
        for (x = 0; x < columns; x += 1) {
            var igadget = this.matrix[x][y];
            if (igadget != null && !(igadget.id in movedGadgets)) {
                orderedGadgets.push(igadget);
                movedGadgets[igadget.id] = true;
            }
        }
    }

    for (i = 0; i < orderedGadgets.length; i += 1) {
        iGadget = orderedGadgets[i];
        iGadget.moveToLayout(destLayout);
    }

    /* Restore _removeFromMatrix */
    delete this._removeFromMatrix;
};

ColumnLayout.prototype.initializeMove = function (igadget, draggable) {
    var msg, keys, i, lastGadget, lastY, tmp;

    draggable = draggable || null; // default value of draggable argument

    // Check for pendings moves
    if (this.igadgetToMove !== null) {
        msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        this.cancelMove();
    }

    this.igadgetToMove = igadget;

    // Make a copy of the positions of the gadgets
    this.shadowPositions = [];

    keys = this.iGadgets.keys();
    for (i = 0; i < keys.length; i++) {
        this.shadowPositions[keys[i]] = this.iGadgets[keys[i]].getPosition().clone();
    }

    // Shadow matrix = current matrix without the gadget to move
    // Initialize shadow matrix and searchInsertPointCache
    lastY = 0;
    this.shadowMatrix = [];
    this.searchInsertPointCache = [];
    for (i = 0; i < this.columns; i++) {
        this.searchInsertPointCache[i] = [];
        this.shadowMatrix[i] = this.matrix[i].clone();
    }
    this._removeFromMatrix(this.shadowMatrix, igadget);

    // search bottommost row
    for (i = 0; i < this.columns; i++) {
        lastGadget = this.matrix[i].compact().last();

        if (!lastGadget) {
            continue;
        }

        tmp = lastGadget.getPosition().y + lastGadget.getHeight();
        if (tmp > lastY) {
            lastY = tmp;
        }
    }
    this.searchInsertPointYLimit = lastY + 1;

    // Create dragboard cursor
    this.dragboardCursor = new DragboardCursor(igadget);
    this.dragboardCursor.paint(this.dragboard.dragboardElement);
    this._reserveSpace(this.matrix, this.dragboardCursor);

    if (draggable) {
        draggable.setXOffset(this.fromHCellsToPixels(1) / 2);
        draggable.setYOffset(this.getCellHeight());
    }
};

ColumnLayout.prototype._destroyCursor = function (clearSpace) {
    if (this.dragboardCursor !== null) {
        if (clearSpace) {
            this._removeFromMatrix(this.matrix, this.dragboardCursor);
        }
        this.dragboardCursor.destroy();
        this.dragboardCursor = null;
    }
};

ColumnLayout.prototype.disableCursor = function () {
    this._destroyCursor(true);
};

/**
 * @private
 */
ColumnLayout.prototype._restorePositions = function () {
    this._clearMatrix();

    var keys = this.iGadgets.keys();
    for (var i = 0; i < keys.length; i++) {
        var curIGadget = this.iGadgets[keys[i]];
        if (curIGadget !== this.igadgetToMove) {
            curIGadget.setPosition(this._getPositionOn(this._matrix, curIGadget));

            this._reserveSpace(this.matrix, curIGadget);
        }
    }
};

ColumnLayout.prototype.moveTemporally = function (x, y) {
    if (!(this.igadgetToMove instanceof IGadget)) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    var maxX = this.getColumns() - this.igadgetToMove.getWidth();
    if (x > maxX) {
        x = maxX;
    }

    if (this.dragboardCursor !== null) {
        var cursorpos = this.dragboardCursor.getPosition();

        if ((cursorpos.y !== y) || (cursorpos.x !== x)) {
            this._restorePositions();

            // Change cursor position
            //this._removeFromMatrix(this.matrix, this.dragboardCursor); Done at _restorePositions
            this._insertAt(this.dragboardCursor, x, y);
        }
    } else {
        this.dragboardCursor = new DragboardCursor(this.igadgetToMove);
        this.dragboardCursor.paint(this.dragboard.dragboardElement);
        this._insertAt(this.dragboardCursor, x, y);
    }
};

ColumnLayout.prototype.cancelMove = function () {
    if (!(this.igadgetToMove instanceof IGadget)) {
        var msg = gettext("Trying to cancel an inexistant temporal move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this._destroyCursor(true);
    var position = this.igadgetToMove.getPosition();
    this._insertAt(this.igadgetToMove, position.x, position.y);
    this.shadowMatrix = null;
    this.igadgetToMove = null;
    this.dragboardCursor = null;
};

ColumnLayout.prototype.acceptMove = function () {
    if (!(this.igadgetToMove instanceof IGadget)) {
        var msg = gettext("Function acceptMove called when there is not an started igadget move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    var oldposition = this.igadgetToMove.getPosition();
    var newposition = this.dragboardCursor.getPosition();
    this._destroyCursor(false);

    // Needed to force repaint of the igadget at the correct position
    this.igadgetToMove.setPosition(newposition);

    // Needed to overwriting the cursor cells
    this._reserveSpace(this.matrix, this.igadgetToMove);

    // Update igadgets positions in persistence
    if (oldposition.y !== newposition.y || oldposition.x !== newposition.x) {
        this.dragboard._commitChanges();
    }

    // This is needed to check if the scrollbar status has changed (visible/hidden)
    this.dragboard._notifyWindowResizeEvent();

    this.shadowMatrix = null;
    this.igadgetToMove = null;
    this.dragboardCursor = null;
};

/////////////////////////////////////
// SmartColumnLayout
/////////////////////////////////////

function SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
    ColumnLayout.call(this,
                      dragboard,
                      columns,
                      cellHeight,
                      verticalMargin,
                      horizontalMargin,
                      scrollbarSpace);
}
SmartColumnLayout.prototype = new ColumnLayout();

SmartColumnLayout.prototype._realSearchInsertPoint = function (_matrix, x, y, width, height) {
    var widthDiff, lastY, offsetX;

    /* Check for special cases
       y == 0                             => we are on the topmost position
                                          so this is the insert point
       _matrix[x][y - 1] != _matrix[x][y] => we are in a edge, so this is
                                          the insert point.
       _matrix[x][y] != null              => there is already a gadget in
                                          this position, so we have to
                                          search an insert point ignoring
                                          it.
    */
    if (y === 0) {
        return 0;
    } else if ((_matrix[x][y - 1] != null) && (_matrix[x][y - 1] != _matrix[x][y])) {
        return y;
    } else if (_matrix[x][y]) {
        widthDiff = _matrix[x][y].getWidth() - width;
        widthDiff -= x - this._getPositionOn(_matrix, _matrix[x][y]).x;
        if (widthDiff > 0) {
            // The gadget at (x,y) has the same or a bigger width
            // than the gadget to move, so as the gadget to move
            // fits there, so at least we can insert here.
            y = this._getPositionOn(_matrix, _matrix[x][y]).y - 1;
            while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
                y--;
            }
            return ++y;
        } else if (widthDiff !== 0) {
            for (;y > 1; y--) {
                for (offsetX = 0; offsetX < width; offsetX++) {
                    if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
                        if (_matrix[x + offsetX][y - 1]) {
                            // Edge detected
                            return y;
                        }
                    }
                }
            }

            // edges not found
            return 0;
        } else {
            return this._getPositionOn(_matrix, _matrix[x][y]).y;
        }
    }

    lastY = y;
    while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
        y--;
    }
    if (y != lastY) {
        y++;
    } else {
        for (;y > 1; y--) {
            for (offsetX = 0; offsetX < width; offsetX++) {
                if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
                    if (_matrix[x + offsetX][y - 1]) {
                        // Edge detected
                        return y;
                    }
                }
            }
        }

        return 0;
    }
    return y;
};

SmartColumnLayout.prototype._searchInsertPoint = function (_matrix, x, y, width, height) {
    // Search the topmost position for the gadget

    if (y > this.searchInsertPointYLimit) {
        y = this.searchInsertPointYLimit;
    }

    if (!this.searchInsertPointCache[x][y]) {
        this.searchInsertPointCache[x][y] = this._realSearchInsertPoint(_matrix, x, y, width, height);
    }

    return this.searchInsertPointCache[x][y];
};

SmartColumnLayout.prototype.moveTemporally = function (x, y) {
    if (this.igadgetToMove == null) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    var maxX = this.getColumns() - this.igadgetToMove.getWidth();
    if (x > maxX) {
        x = maxX;
    }

    // Check if we have to change the position of the cursor
    y = this._searchInsertPoint(this.shadowMatrix, x, y, this.igadgetToMove.getWidth(), this.igadgetToMove.getHeight());

    if (this.dragboardCursor !== null) {
        var cursorpos = this.dragboardCursor.getPosition();

        if ((cursorpos.y !== y) || (cursorpos.x !== x)) {
            // Change cursor position
            this._removeFromMatrix(this.matrix, this.dragboardCursor);
            this._insertAt(this.dragboardCursor, x, y);
        }
    } else {
        this.dragboardCursor = new DragboardCursor(this.igadgetToMove);
        this.dragboardCursor.paint(this.dragboard.dragboardElement);
        this._insertAt(this.dragboardCursor, x, y);
    }
};

SmartColumnLayout.prototype.initialize = function () {
    var modified = ColumnLayout.prototype.initialize.call(this);

    // remove holes moving igadgets to the topmost positions
    var iGadget;
    var keys = this.iGadgets.keys();
    for (var i = 0; i < keys.length; i++) {
        iGadget = this.iGadgets[keys[i]];
        modified = modified || this._moveSpaceUp(this.matrix, iGadget);
    }
    if (modified) {
        //save these changes in the server side
        this.dragboard._commitChanges(keys);
    }
};

SmartColumnLayout.prototype._notifyWindowResizeEvent = function (widthChanged, heightChanged) {
    if (widthChanged) {
        DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
    }
};

SmartColumnLayout.prototype._notifyResizeEvent = function (iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    var x, y;
    var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
    var position = iGadget.getPosition();
    var step2X, finalYPos, widthDiff, iGadgetToMove, limitX, limitY;
    step2X = position.x;

    // First Step
    if (newWidth > oldWidth) {
        // Calculate the width for the next step
        step2Width = oldWidth;

        finalYPos = position.y + newHeight;

        if (resizeLeftSide) {
            // Move affected igadgets
            widthDiff = newWidth - oldWidth;
            for (x = position.x - widthDiff; x < position.x; ++x) {
                for (y = 0; y < newHeight; ++y) {
                    iGadgetToMove = this.matrix[x][position.y + y];
                    if (iGadgetToMove != null) {
                        this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
                        break; // Continue with the next column
                    }
                }
            }

            // Move the gadget
            position.x -= widthDiff;
            if (persist) {
                iGadget.setPosition(position);
            }

            // Reserve the new space
            this._reserveSpace2(this.matrix, iGadget,
                                             position.x, position.y,
                                             widthDiff, newHeight);
        } else {
            // Move affected igadgets
            for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
                for (y = 0; y < newHeight; ++y) {
                    iGadgetToMove = this.matrix[x][position.y + y];
                    if (iGadgetToMove != null) {
                        this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
                        break; // Continue with the next column
                    }
                }
            }

            // Reserve this space
            this._reserveSpace2(this.matrix, iGadget,
                                             position.x + oldWidth, position.y,
                                             newWidth - oldWidth, newHeight);
        }

    } else if (newWidth < oldWidth) {
        // Calculate the width for the next step
        step2Width = newWidth;

        widthDiff = oldWidth - newWidth;
        if (resizeLeftSide) {

            // Clear space
            this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

            // Move affected igadgets
            y = position.y + oldHeight;
            limitX = position.x + widthDiff;
            for (x = position.x; x < limitX; ++x) {
                if (this.matrix[x][y] != null) {
                    this._moveSpaceUp(this.matrix, this.matrix[x][y]);
                }
            }

            // Move the gadget
            position.x += widthDiff;
            if (persist) {
                iGadget.setPosition(position);
            }

            step2X = position.x;
        } else {
            // Clear space
            this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);

            // Move affected igadgets
            y = position.y + oldHeight;
            limitX = position.x + oldWidth;
            for (x = position.x + newWidth; x < limitX; ++x) {
                if (this.matrix[x][y] != null) {
                    this._moveSpaceUp(this.matrix, this.matrix[x][y]);
                }
            }
        }
    }

    // Second Step
    if (newHeight > oldHeight) {
        limitY = position.y + newHeight;
        limitX = step2X + step2Width;
        for (y = position.y + oldHeight; y < limitY; y++) {
            for (x = step2X; x < limitX; x++) {
                if (this.matrix[x][y] != null) {
                    this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);
                }
            }
        }

        // Reserve Space
        this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
    } else if (newHeight < oldHeight) {
        // Clear freed space
        this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);

        y = position.y + oldHeight;
        limitX = step2X + step2Width;
        for (x = step2X; x < limitX; x++) {
            if (this.matrix[x][y] != null) {
                this._moveSpaceUp(this.matrix, this.matrix[x][y]);
            }
        }
    }

    this._notifyWindowResizeEvent(true, true); // TODO
    if (persist) {
        this._moveSpaceUp(this.matrix, iGadget);
        // Save new positions into persistence
        this.dragboard._commitChanges(); // FIXME
    }
};

//Returns if any gadget's position has been modified
SmartColumnLayout.prototype._insertAt = function (iGadget, x, y) {

    var affectedGadgets = ColumnLayout.prototype._insertAt.call(this, iGadget, x, y);

    this._moveSpaceUp(this.matrix, iGadget);

    return affectedGadgets;
};

//Returns if any gadget's position has been modified
SmartColumnLayout.prototype._removeFromMatrix = function (_matrix, iGadget) {
    this._clearSpace(_matrix, iGadget);

    var affectedIGadgets = new Hash();
    var affectedgadget, x, y, columnsize;
    var position = this._getPositionOn(_matrix, iGadget);
    var edgeY = position.y + iGadget.getHeight();

    // check if we have to update the representations of the gadget instances
    for (x = 0; x < iGadget.getWidth(); x++) {
        columnsize = _matrix[position.x + x].length;
        for (y = edgeY; y < columnsize; y++) {
            affectedgadget = _matrix[position.x + x][y];
            if ((affectedgadget != null) && (affectedIGadgets[affectedgadget.code] == undefined)) {
                affectedIGadgets[affectedgadget.code] = 1;
                this._moveSpaceUp(_matrix, affectedgadget);
                break;
            }
        }
    }
    return affectedIGadgets.keys().length > 0;
};
