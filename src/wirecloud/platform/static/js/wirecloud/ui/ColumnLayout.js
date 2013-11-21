/*
 *     Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, Constants, DragboardLayout, IWidget, MultiValuedSize, Wirecloud */

(function () {

    "use strict";

    /**
     * Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @param dragboard        associated dragboard
     * @param columns          number of columns of the layout
     * @param cellHeight       the height of the layout's cells in pixels
     * @param verticalMargin   vertical margin between iwidgets in pixels
     * @param horizontalMargin horizontal margin between iwidgets in pixels
     * @param scrollbarSpace   space reserved for the right scroll bar in pixels
     */
    function ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
        if (arguments.length === 0) {
            return; // Allow empty constructor (allowing hierarchy)
        }

        this.initialized = false;
        this.shadowMatrix = null;    // Temporal matrix of iwidgets used for D&D
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

        this._clearMatrix();         // Matrix of iwidgets
        this.dragboardCursor = null;
        this.iwidgetToMove = null;

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
        tmp += this.leftMargin + this.dragboardLeftMargin;
        return tmp;
    };

    ColumnLayout.prototype.getRowOffset = function (row) {
        return this.dragboardTopMargin + this.fromVCellsToPixels(row) + this.topMargin;
    };

    ColumnLayout.prototype._getPositionOn = function (_matrix, widget) {
        if (_matrix === this.matrix) {
            return widget.getPosition();
        } else {
            return this.shadowPositions[widget.code];
        }
    };

    ColumnLayout.prototype._setPositionOn = function (_matrix, widget, position) {
        if (_matrix === this.matrix) {
            widget.setPosition(position);
        } else {
            this.shadowPositions[widget.code] = position;
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

    ColumnLayout.prototype._reserveSpace = function (_matrix, iWidget) {
        var x, y;
        var position = this._getPositionOn(_matrix, iWidget);
        var width = iWidget.getWidth();
        var height = iWidget.getHeight();

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                _matrix[position.x + x][position.y + y] = iWidget;
            }
        }
    };

    ColumnLayout.prototype._clearSpace = function (_matrix, iWidget) {
        var x, y;
        var position = this._getPositionOn(_matrix, iWidget);
        var width = iWidget.getWidth();
        var height = iWidget.getHeight();

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                delete _matrix[position.x + x][position.y + y];
            }
        }
    };

    ColumnLayout.prototype._searchInsertPoint = function (_matrix, x, y, width, height) {
        return y;
    };

    ColumnLayout.prototype._moveSpaceDown = function (_matrix, iWidget, offsetY) {
        var affectedIWidgets, position, finalPosition, edgeY, iwidget, x, y, key;

        affectedIWidgets = {};
        position = this._getPositionOn(_matrix, iWidget);
        finalPosition = new Wirecloud.DragboardPosition(position.x, position.y + offsetY);

        edgeY = position.y + iWidget.getHeight();

        // Search affected widgets
        // TODO move widgets according to the biggest offset for optimizing
        for (x = 0; x < iWidget.getWidth(); x++) {
            for (y = 0; y < offsetY; y++) {
                iwidget = _matrix[position.x + x][edgeY + y];
                if (iwidget != null) {
                    affectedIWidgets[iwidget.code] = offsetY - y; // calculate the offset for this iwidget
                    break; // continue whit the next column
                }
            }
        }

        // Move affected widgets instances
        for (key in affectedIWidgets) {
            iwidget = this.iWidgets[key];
            this._moveSpaceDown(_matrix, iwidget, affectedIWidgets[key]);
        }

        // Move the widget
        this._clearSpace(_matrix, iWidget);
        this._setPositionOn(_matrix, iWidget, finalPosition);
        this._reserveSpace(_matrix, iWidget);
    };

    ColumnLayout.prototype._moveSpaceUp = function (_matrix, iWidget) {
        var position, edgeY, offsetY, affectedIWidgets, finalPosition, iwidget,
            x, y, columnsize, key;

        position = this._getPositionOn(_matrix, iWidget);
        edgeY = position.y + iWidget.getHeight();

        offsetY = 1;
        while (((position.y - offsetY) >= 0) && this._hasSpaceFor(_matrix, position.x, position.y - offsetY, iWidget.getWidth(), 1)) {
            offsetY += 1;
        }
        offsetY -= 1;

        if (offsetY > 0) {
            affectedIWidgets = {};
            finalPosition = new Wirecloud.DragboardPosition(position.x, position.y - offsetY);

            // Search affected widgets
            // TODO move the topmost widget for optimizing
            for (x = 0; x < iWidget.getWidth(); x++) {
                columnsize = _matrix[position.x + x].length;
                for (y = edgeY; y < columnsize; y++) {
                    iwidget = _matrix[position.x + x][y];
                    if (iwidget != null) {
                        affectedIWidgets[iwidget.code] = iwidget;
                        break; // continue whit the next column
                    }
                }
            }

            // Move the representation of the widget
            this._clearSpace(_matrix, iWidget);
            this._setPositionOn(_matrix, iWidget, finalPosition);
            this._reserveSpace(_matrix, iWidget);

            // Move affected widgets instances
            for (key in affectedIWidgets) {
                this._moveSpaceUp(_matrix, affectedIWidgets[key]);
            }

            //return true if the iwidget position has been modified
            return true;
        }
        return false;
    };

    ColumnLayout.prototype._removeFromMatrix = function (_matrix, iWidget) {
        this._clearSpace(_matrix, iWidget);
        return false;
    };

    ColumnLayout.prototype._reserveSpace2 = function (_matrix, iWidget, positionX, positionY, width, height) {
        var x, y;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                _matrix[positionX + x][positionY + y] = iWidget;
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

    ColumnLayout.prototype._notifyResizeEvent = function (iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        var x, y;
        var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
        var position = iWidget.getPosition();
        var step2X, iWidgetToMove, finalYPos, widthDiff;
        step2X = position.x;

        // First Step
        if (newWidth > oldWidth) {
            // Calculate the width for the next step
            step2Width = oldWidth;

            finalYPos = position.y + newHeight;

            if (resizeLeftSide) {
                // Move affected iwidgets
                widthDiff = newWidth - oldWidth;
                for (x = position.x - widthDiff; x < position.x; ++x) {
                    for (y = 0; y < newHeight; ++y) {
                        iWidgetToMove = this.matrix[x][position.y + y];
                        if (iWidgetToMove != null) {
                            this._moveSpaceDown(this.matrix, iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                            break; // Continue with the next column
                        }
                    }
                }

                // Move the widget
                position.x -= widthDiff;
                if (persist) {
                    iWidget.setPosition(position);
                }

                // Reserve the new space
                this._reserveSpace2(this.matrix, iWidget,
                                                 position.x, position.y,
                                                 widthDiff, newHeight);
            } else {
                // Move affected iwidgets
                for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
                    for (y = 0; y < newHeight; ++y) {
                        iWidgetToMove = this.matrix[x][position.y + y];
                        if (iWidgetToMove != null) {
                            this._moveSpaceDown(this.matrix, iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                            break; // Continue with the next column
                        }
                    }
                }

                // Reserve this space
                this._reserveSpace2(this.matrix, iWidget,
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

                // Move the widget
                position.x += widthDiff;
                if (persist) {
                    iWidget.setPosition(position);
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
            this._reserveSpace2(this.matrix, iWidget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
        } else if (newHeight < oldHeight) {
            // Clear freed space
            this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);
        }

        this._notifyWindowResizeEvent(true, true); // TODO
        if (persist) {
            this.dragboard._commitChanges(); // FIXME
        }
    };

    ColumnLayout.prototype._insertAt = function (iWidget, x, y) {
        var newPosition = new Wirecloud.DragboardPosition(x > 0 ? x : 0, y > 0 ? y : 0);

        // Move other instances
        var affectedwidget, offset, affectedY;
        var affectedWidgets = false;
        var lastX = newPosition.x + iWidget.getWidth();
        var lastY = newPosition.y + iWidget.getHeight();

        for (x = newPosition.x; x < lastX; x++) {
            for (y = newPosition.y; y < lastY; y++) {
                affectedwidget = this.matrix[x][y];
                if (affectedwidget != null) {
                    // only move the widget if we didn't move it before
                    affectedY = affectedwidget.getPosition().y;
                    // y + iWidget.getHeight() - affectedY - (newPosition.y - y);
                    offset = lastY - affectedY;
                    this._moveSpaceDown(this.matrix, affectedwidget,  offset);
                    // move only the topmost widget in the column
                    affectedWidgets = true;
                    break;
                }
            }
        }

        // Change Widget instance position (insert it)
        iWidget.setPosition(newPosition);

        this._reserveSpace(this.matrix, iWidget);

        //returns if any widget's position has been modified
        return affectedWidgets;
    };

    ColumnLayout.prototype._searchFreeSpace = function (width, height) {
        var positionX = 0, positionY = 0;
        var columns = this.getColumns() - width + 1;

        for (positionY = 0; true ; positionY++) {
            for (positionX = 0; positionX < columns; positionX++) {
                if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
                    return new Wirecloud.DragboardPosition(positionX, positionY);
                }
            }
        }
    };

    ColumnLayout.prototype.initialize = function () {
        var iWidget, i, key, position, iWidgetsToReinsert = [];

        this._clearMatrix();

        // Insert iwidgets
        for (key in this.iWidgets) {
            iWidget = this.iWidgets[key];

            position = iWidget.getPosition();

            iWidget.paint(true);

            if (iWidget.getWidth() > this.getColumns()) {
                iWidget.contentWidth = this.getColumns();
            }

            if (iWidget.getWidth() + position.x > this.getColumns()) {
                iWidgetsToReinsert.push(iWidget);
            } else if (this._hasSpaceFor(this.matrix, position.x, position.y, iWidget.getWidth(), iWidget.getHeight())) {
                this._reserveSpace(this.matrix, iWidget);
            } else {
                iWidgetsToReinsert.push(iWidget);
            }
        }

        var modified = false;
        if (iWidgetsToReinsert.length > 0) {
            // Reinsert the iwidgets that didn't fit in their positions
            for (i = 0; i < iWidgetsToReinsert.length; i++) {
                position = this._searchFreeSpace(iWidgetsToReinsert[i].getWidth(),
                                                 iWidgetsToReinsert[i].getHeight());
                iWidgetsToReinsert[i].setPosition(position);
                this._reserveSpace(this.matrix, iWidgetsToReinsert[i]);
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

        return new Wirecloud.DragboardPosition(Math.floor(x / columnWidth),
            Math.floor(y / this.getCellHeight()));
    };

    /**
     * Inserts the given iWidget into this layout.
     *
     * @param iWidget the iWidget to insert in this layout
     * @param affectsDragboard if true, the dragboard associated to this layout will be notified
     * @return whether any widget's position has been modified
     */
    ColumnLayout.prototype.addIWidget = function (iWidget, affectsDragboard) {
        var affectedWidgets = false;

        DragboardLayout.prototype.addIWidget.call(this, iWidget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        if (iWidget.getWidth() > this.getColumns()) {
            iWidget.contentWidth = this.getColumns();
            iWidget._recomputeSize(true);
        }

        var position = iWidget.getPosition();
        if (position) {
            var diff = iWidget.getWidth() + position.x - this.getColumns();
            if (diff > 0) {
                position.x -= diff;
            }

            // Insert it. Returns if there are any affected widget
            affectedWidgets = this._insertAt(iWidget, position.x, position.y);
        } else {
            // Search a position for the widget
            position = this._searchFreeSpace(iWidget.getWidth(), iWidget.getHeight());
            iWidget.setPosition(position);

            // Reserve the cells for the widget instance
            this._reserveSpace(this.matrix, iWidget);
        }

        this._adaptIWidget(iWidget);
        return affectedWidgets;
    };

    //Returns if any widget's position has been modified
    ColumnLayout.prototype.removeIWidget = function (iWidget, affectsDragboard) {
        var affectedWidgets;

        affectedWidgets = this._removeFromMatrix(this.matrix, iWidget);
        DragboardLayout.prototype.removeIWidget.call(this, iWidget, affectsDragboard);
        return affectedWidgets;
    };

    ColumnLayout.prototype.moveTo = function (destLayout) {
        var movedWidgets, orderedWidgets, x, y, i, columns, rows, iWidget;

        /*
         * Always use ColumnLayout._removeFromMatrix for removing widgets
         * when moving widgets to another layout.
         */
        this._removeFromMatrix = ColumnLayout.prototype._removeFromMatrix;

        movedWidgets = {};
        orderedWidgets = [];
        columns = this.getColumns();
        rows = this.getRows();
        for (y = 0; y < rows; y += 1) {
            for (x = 0; x < columns; x += 1) {
                var iwidget = this.matrix[x][y];
                if (iwidget != null && !(iwidget.id in movedWidgets)) {
                    orderedWidgets.push(iwidget);
                    movedWidgets[iwidget.id] = true;
                }
            }
        }

        for (i = 0; i < orderedWidgets.length; i += 1) {
            iWidget = orderedWidgets[i];
            iWidget.moveToLayout(destLayout);
        }

        /* Restore _removeFromMatrix */
        delete this._removeFromMatrix;
    };

    ColumnLayout.prototype.initializeMove = function (iwidget, draggable) {
        var msg, key, i, lastWidget, lastY, tmp;

        draggable = draggable || null; // default value of draggable argument

        // Check for pendings moves
        if (this.iwidgetToMove !== null) {
            msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.");
            Wirecloud.GlobalLogManager.log(msg, Constants.WARN_MSG);
            this.cancelMove();
        }

        this.iwidgetToMove = iwidget;

        // Make a copy of the positions of the widgets
        this.shadowPositions = [];

        for (key in this.iWidgets) {
            this.shadowPositions[key] = this.iWidgets[key].getPosition().clone();
        }

        // Shadow matrix = current matrix without the widget to move
        // Initialize shadow matrix and searchInsertPointCache
        lastY = 0;
        this.shadowMatrix = [];
        this.searchInsertPointCache = [];
        for (i = 0; i < this.columns; i++) {
            this.searchInsertPointCache[i] = [];
            this.shadowMatrix[i] = this.matrix[i].clone();
        }
        this._removeFromMatrix(this.shadowMatrix, iwidget);

        // search bottommost row
        for (i = 0; i < this.columns; i++) {
            lastWidget = this.matrix[i][this.matrix[x].length - 1];

            if (!lastWidget) {
                continue;
            }

            tmp = lastWidget.getPosition().y + lastWidget.getHeight();
            if (tmp > lastY) {
                lastY = tmp;
            }
        }
        this.searchInsertPointYLimit = lastY + 1;

        // Create dragboard cursor
        this.dragboardCursor = new Wirecloud.ui.DragboardCursor(iwidget);
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

        var key;
        for (key in this.iWidgets) {
            var curIWidget = this.iWidgets[key];
            if (curIWidget !== this.iwidgetToMove) {
                curIWidget.setPosition(this._getPositionOn(this._matrix, curIWidget));

                this._reserveSpace(this.matrix, curIWidget);
            }
        }
    };

    ColumnLayout.prototype.moveTemporally = function (x, y) {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
            Wirecloud.GlobalLogManager.log(msg, Constants.WARN_MSG);
            return;
        }

        var maxX = this.getColumns() - this.iwidgetToMove.getWidth();
        if (x > maxX) {
            x = maxX;
        }

        if (this.dragboardCursor != null) {
            var cursorpos = this.dragboardCursor.getPosition();

            if ((cursorpos.y !== y) || (cursorpos.x !== x)) {
                this._restorePositions();

                // Change cursor position
                //this._removeFromMatrix(this.matrix, this.dragboardCursor); Done at _restorePositions
                this._insertAt(this.dragboardCursor, x, y);
            }
        } else {
            this.dragboardCursor = new Wirecloud.ui.DragboardCursor(this.iwidgetToMove);
            this.dragboardCursor.paint(this.dragboard.dragboardElement);
            this._insertAt(this.dragboardCursor, x, y);
        }
    };

    ColumnLayout.prototype.cancelMove = function () {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Trying to cancel an inexistant temporal move.");
            Wirecloud.GlobalLogManager.log(msg, Constants.WARN_MSG);
            return;
        }

        this._destroyCursor(true);
        var position = this.iwidgetToMove.getPosition();
        this._insertAt(this.iwidgetToMove, position.x, position.y);
        this.shadowMatrix = null;
        this.iwidgetToMove = null;
        this.dragboardCursor = null;
    };

    ColumnLayout.prototype.acceptMove = function () {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Function acceptMove called when there is not an started iwidget move.");
            Wirecloud.GlobalLogManager.log(msg, Constants.WARN_MSG);
            return;
        }

        var oldposition = this.iwidgetToMove.getPosition();
        var newposition = this.dragboardCursor.getPosition();
        this._destroyCursor(false);

        // Needed to force repaint of the iwidget at the correct position
        this.iwidgetToMove.setPosition(newposition);

        // Needed to overwriting the cursor cells
        this._reserveSpace(this.matrix, this.iwidgetToMove);

        // Update iwidgets positions in persistence
        if (oldposition.y !== newposition.y || oldposition.x !== newposition.x) {
            this.dragboard._commitChanges();
        }

        // This is needed to check if the scrollbar status has changed (visible/hidden)
        this.dragboard._notifyWindowResizeEvent();

        this.shadowMatrix = null;
        this.iwidgetToMove = null;
        this.dragboardCursor = null;
    };

    Wirecloud.ui.ColumnLayout = ColumnLayout;

})();
