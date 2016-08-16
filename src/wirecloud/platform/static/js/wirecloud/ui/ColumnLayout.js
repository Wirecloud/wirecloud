/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @param dragboard        associated dragboard
     * @param columns          number of columns of the layout
     * @param cellHeight       the height of the layout's cells in pixels
     * @param verticalMargin   vertical margin between iwidgets in pixels
     * @param horizontalMargin horizontal margin between iwidgets in pixels
     * @param scrollbarSpace   space reserved for the right scroll bar in pixels
     */
    var ColumnLayout = function ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
        if (arguments.length === 0) {
            return; // Allow empty constructor (allowing hierarchy)
        }

        this.initialized = false;
        this._buffers = {"base": {}};
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

        this._clearMatrix();         // Matrix of iWidgets
        this._buffers.base = {
            matrix: this.matrix,
        };
        this.dragboardCursor = null;
        this.iwidgetToMove = null;

        Wirecloud.ui.DragboardLayout.call(this, dragboard, scrollbarSpace);
    };

    /*
     * ColumnLayout extends Wirecloud.ui.DragboardLayout
     */
    ColumnLayout.prototype = new Wirecloud.ui.DragboardLayout();

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

    ColumnLayout.prototype.adaptColumnOffset = function adaptColumnOffset(size) {
        var offsetInLU, pixels, parsedSize;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            offsetInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
            } else {
                pixels = parsedSize[0];
            }
            offsetInLU = Math.round(this.fromPixelsToHCells(pixels - this.leftMargin));
        }
        return new Wirecloud.ui.MultiValuedSize(this.getColumnOffset(offsetInLU), offsetInLU);
    };

    ColumnLayout.prototype.adaptRowOffset = function adaptRowOffset(size) {
        var offsetInLU, pixels, parsedSize;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            offsetInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
            } else {
                pixels = parsedSize[0];
            }
            offsetInLU = Math.round(this.fromPixelsToVCells(pixels - this.topMargin));
        }
        return new Wirecloud.ui.MultiValuedSize(this.getRowOffset(offsetInLU), offsetInLU);
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

    ColumnLayout.prototype._getPositionOn = function _getPositionOn(buffer, widget) {
        if (buffer === this.matrix || buffer === "base") {
            return widget.position;
        } else {
            return this._buffers[buffer].positions[widget.id];
        }
    };

    ColumnLayout.prototype._setPositionOn = function _setPositionOn(buffer, widget, position) {
        if (buffer === this.matrix || buffer === "base") {
            widget.setPosition(position);
        } else {
            this._buffers[buffer].positions[widget.id] = position;
        }
    };

    ColumnLayout.prototype._clearMatrix = function () {
        this.matrix = [];
        this._buffers.base.matrix = this.matrix;

        for (var x = 0; x < this.getColumns(); x++) {
            this.matrix[x] = [];
        }
    };

    ColumnLayout.prototype._hasSpaceFor = function (_matrix, positionX, positionY, width, height) {
        var x, y;

        if (typeof _matrix === "string") {
            _matrix = this._buffers[_matrix].matrix;
        }

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                if (_matrix[positionX + x][positionY + y] != null) {
                    return false;
                }
            }
        }

        return true;
    };

    ColumnLayout.prototype._reserveSpace = function (_matrix, widget) {
        var x, y;
        var position = this._getPositionOn(_matrix, widget);
        var width = widget.shape.width;
        var height = widget.shape.height;

        if (typeof _matrix === "string") {
            _matrix = this._buffers[_matrix].matrix;
        }

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                _matrix[position.x + x][position.y + y] = widget;
            }
        }
    };

    ColumnLayout.prototype._clearSpace = function (_matrix, widget) {
        var x, y;
        var position = this._getPositionOn(_matrix, widget);
        var width = widget.shape.width;
        var height = widget.shape.height;

        if (typeof _matrix === "string") {
            _matrix = this._buffers[_matrix].matrix;
        }

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                delete _matrix[position.x + x][position.y + y];
            }
        }

        this._compressColumns(_matrix, position.x, width);
    };

    ColumnLayout.prototype._compressColumns = function _compressColumns(_matrix, x, width) {
        var i, y;

        for (i = 0; i < width; i++) {
            for (y = _matrix[x + i].length - 1; y >= 0; y--) {
                if (_matrix[x + i][y] != null) {
                    break;
                }
                _matrix[x + i].pop();
            }
        }
    };

    ColumnLayout.prototype._searchInsertPoint = function _searchInsertPoint(_matrix, x, y, width, height) {
        return y;
    };

    ColumnLayout.prototype._moveSpaceDown = function _moveSpaceDown(buffer, widget, offsetY) {
        var affectedIWidgets, position, finalPosition, edgeY, curwidget, x, y, key, matrix;

        affectedIWidgets = {};
        matrix = this._buffers[buffer].matrix;
        position = this._getPositionOn(buffer, widget);
        finalPosition = new Wirecloud.DragboardPosition(position.x, position.y + offsetY);

        edgeY = position.y + widget.shape.height;

        // Search affected widgets
        // TODO move widgets according to the biggest offset for optimizing
        for (x = 0; x < widget.shape.width; x++) {
            for (y = 0; y < offsetY; y++) {
                curwidget = matrix[position.x + x][edgeY + y];
                if (curwidget != null) {
                    affectedIWidgets[curwidget.id] = offsetY - y; // calculate the offset for this widget
                    break; // continue whit the next column
                }
            }
        }

        // Move affected widgets instances
        for (key in affectedIWidgets) {
            curwidget = this.widgets[key];
            this._moveSpaceDown(buffer, curwidget, affectedIWidgets[key]);
        }

        // Move the widget
        this._clearSpace(buffer, widget);
        this._setPositionOn(buffer, widget, finalPosition);
        this._reserveSpace(buffer, widget);
    };

    /**
     * @returns Returns true if the widget position has been modified
     */
    ColumnLayout.prototype._moveSpaceUp = function (buffer, widget) {
        var position, edgeY, offsetY, affectedIWidgets, finalPosition, curWidget,
            x, y, columnsize, key, matrix;

        matrix = this._buffers[buffer].matrix;
        position = this._getPositionOn(buffer, widget);
        edgeY = position.y + widget.shape.height;

        offsetY = 1;
        while (((position.y - offsetY) >= 0) && this._hasSpaceFor(matrix, position.x, position.y - offsetY, widget.shape.width, 1)) {
            offsetY += 1;
        }
        offsetY -= 1;

        if (offsetY > 0) {
            affectedIWidgets = {};
            finalPosition = new Wirecloud.DragboardPosition(position.x, position.y - offsetY);

            // Search affected widgets
            // TODO move the topmost widget for optimizing
            for (x = 0; x < widget.shape.width; x++) {
                columnsize = matrix[position.x + x].length;
                for (y = edgeY; y < columnsize; y++) {
                    curWidget = matrix[position.x + x][y];
                    if (curWidget != null) {
                        affectedIWidgets[curWidget.id] = curWidget;
                        break; // continue whit the next column
                    }
                }
            }

            // Move the representation of the widget
            this._clearSpace(buffer, widget);
            this._setPositionOn(buffer, widget, finalPosition);
            this._reserveSpace(buffer, widget);

            // Move affected widgets instances
            for (key in affectedIWidgets) {
                this._moveSpaceUp(buffer, affectedIWidgets[key]);
            }

            return true;
        }
        return false;
    };

    ColumnLayout.prototype._removeFromMatrix = function (_matrix, widget) {
        this._clearSpace(_matrix, widget);
        return false;
    };

    ColumnLayout.prototype._reserveSpace2 = function (_matrix, widget, positionX, positionY, width, height) {
        var x, y;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                _matrix[positionX + x][positionY + y] = widget;
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

        this._compressColumns(_matrix, positionX, width);
    };

    ColumnLayout.prototype._notifyResizeEvent = function (widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        var x, y;
        var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
        var position = widget.position;
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
                            this._moveSpaceDown("base", iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                            break; // Continue with the next column
                        }
                    }
                }

                // Move the widget
                position.x -= widthDiff;
                widget.setPosition(position);

                // Reserve the new space
                this._reserveSpace2(this.matrix, widget,
                                                 position.x, position.y,
                                                 widthDiff, newHeight);
            } else {
                // Move affected iwidgets
                for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
                    for (y = 0; y < newHeight; ++y) {
                        iWidgetToMove = this.matrix[x][position.y + y];
                        if (iWidgetToMove != null) {
                            this._moveSpaceDown("base", iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                            break; // Continue with the next column
                        }
                    }
                }

                // Reserve this space
                this._reserveSpace2(this.matrix, widget,
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
                widget.setPosition(position);

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
                        this._moveSpaceDown("base", this.matrix[x][y], limitY - y);
                    }
                }
            }

            // Reserve Space
            this._reserveSpace2(this.matrix, widget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
        } else if (newHeight < oldHeight) {
            // Clear freed space
            this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);
        }

        this._notifyWindowResizeEvent(true, true); // TODO
        if (persist) {
            this.dragboard.update(); // FIXME
        }
    };

    /**
     * @returns returns if any widget's position has been modified
     */
    ColumnLayout.prototype._insertAt = function _insertAt(widget, x, y, buffer) {
        var newPosition = new Wirecloud.DragboardPosition(x > 0 ? x : 0, y > 0 ? y : 0);

        // Move other instances
        var affectedwidget, offset, affectedY, matrix;
        var affectedWidgets = false;
        var lastX = newPosition.x + widget.shape.width;
        var lastY = newPosition.y + widget.shape.height;

        if (buffer == null) {
            buffer = "base";
        }
        matrix = this._buffers[buffer].matrix;

        for (x = newPosition.x; x < lastX; x++) {
            for (y = newPosition.y; y < lastY; y++) {
                affectedwidget = matrix[x][y];
                if (affectedwidget != null) {
                    // only move the widget if we didn't move it before
                    affectedY = this._getPositionOn(buffer, affectedwidget).y;
                    // y + widget.shape.height - affectedY - (newPosition.y - y);
                    offset = lastY - affectedY;
                    this._moveSpaceDown(buffer, affectedwidget, offset);
                    // move only the topmost widget in the column
                    affectedWidgets = true;
                    break;
                }
            }
        }

        // Change Widget instance position (insert it)
        this._setPositionOn(buffer, widget, newPosition);

        this._reserveSpace(buffer, widget);

        return affectedWidgets;
    };

    ColumnLayout.prototype._searchFreeSpace = function (width, height) {
        var positionX = 0, positionY = 0;
        var maxX = this.columns - width;

        for (positionY = 0; true ; positionY++) {
            for (positionX = 0; positionX <= maxX; positionX++) {
                if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
                    return new Wirecloud.DragboardPosition(positionX, positionY);
                }
            }
        }
    };

    ColumnLayout.prototype.initialize = function () {
        var widget, i, key, position, iWidgetsToReinsert = [];

        this._clearMatrix();

        // Insert iwidgets
        for (key in this.widgets) {
            widget = this.widgets[key];

            position = widget.position;

            widget.repaint();

            if (widget.shape.width > this.getColumns()) {
                widget.contentWidth = this.getColumns();
            }

            if (widget.shape.width + position.x > this.getColumns()) {
                iWidgetsToReinsert.push(widget);
            } else if (this._hasSpaceFor(this.matrix, position.x, position.y, widget.shape.width, widget.shape.height)) {
                this._reserveSpace(this.matrix, widget);
            } else {
                iWidgetsToReinsert.push(widget);
            }
        }

        var modified = false;
        if (iWidgetsToReinsert.length > 0) {
            // Reinsert the iwidgets that didn't fit in their positions
            for (i = 0; i < iWidgetsToReinsert.length; i++) {
                position = this._searchFreeSpace(iWidgetsToReinsert[i].shape.width,
                                                 iWidgetsToReinsert[i].shape.height);
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
     * Inserts the given widget into this layout.
     *
     * @param widget the widget to insert in this layout
     * @param affectsDragboard if true, the dragboard associated to this layout will be notified
     * @return whether any widget's position has been modified
     */
    ColumnLayout.prototype.addWidget = function addWidget(widget, affectsDragboard) {
        var affectedWidgets = false;

        Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, widget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        if (widget.shape.width > this.getColumns()) {
            widget.setShape({width: this.getColumns()});
            // TODO: persist
        }

        var position = widget.position;
        if (position) {
            var diff = widget.shape.width + position.x - this.getColumns();
            if (diff > 0) {
                position.x -= diff;
            }

            // Insert it. Returns if there are any affected widget
            affectedWidgets = this._insertAt(widget, position.x, position.y, "base");
        } else {
            // Search a position for the widget
            position = this._searchFreeSpace(widget.shape.width, widget.shape.height);
            widget.setPosition(position);

            // Reserve the cells for the widget instance
            this._reserveSpace(this.matrix, widget);
        }

        this._adaptIWidget(widget);
        return affectedWidgets;
    };

    ColumnLayout.prototype.removeWidget = function removeWidget(widget, affectsDragboard) {
        var affectedWidgets;

        affectedWidgets = this._removeFromMatrix("base", widget);
        Wirecloud.ui.DragboardLayout.prototype.removeWidget.call(this, widget, affectsDragboard);
        return affectedWidgets;
    };

    ColumnLayout.prototype.moveTo = function (destLayout) {
        var movedWidgets, orderedWidgets, x, y, i, columns, rows, widget;

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
                widget = this.matrix[x][y];
                if (widget != null && !(widget.id in movedWidgets)) {
                    orderedWidgets.push(widget);
                    movedWidgets[widget.id] = true;
                }
            }
        }

        for (i = 0; i < orderedWidgets.length; i += 1) {
            widget = orderedWidgets[i];
            widget.moveToLayout(destLayout);
        }

        /* Restore _removeFromMatrix */
        delete this._removeFromMatrix;
    };

    ColumnLayout.prototype._cloneMatrix = function _cloneMatrix(matrix) {
        var i, cloned_matrix = [];

        for (i = 0; i < this.columns; i++) {
            cloned_matrix[i] = Wirecloud.Utils.clone(matrix[i]);
        }

        return cloned_matrix;
    };

    ColumnLayout.prototype._clonePositions = function _clonePositions(buffer) {
        var key, positions = {};

        for (key in this.widgets) {
            positions[key] = utils.clone(this._getPositionOn(buffer, this.widgets[key]));
        }

        return positions;
    };

    ColumnLayout.prototype.initializeMove = function (widget, draggable) {
        var msg, i, lastWidget, lastY, tmp;

        draggable = draggable || null; // default value of draggable argument

        if (!(widget instanceof Wirecloud.ui.WidgetView)) {
            throw new TypeError("widget must be an WidgetView instance");
        }

        // Check for pendings moves
        if (this.iwidgetToMove != null) {
            msg = "Dragboard: There was a pending move that was cancelled because initializedMove function was called before it was finished.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            this.cancelMove();
        }

        this.iwidgetToMove = widget;

        // Make a copy of the positions of the widgets
        this._buffers.backup = {};
        this._buffers.backup.positions = this._clonePositions(this.matrix);
        this._buffers.shadow = {
            "matrix": this.matrix
        };

        // Shadow matrix = current matrix without the widget to move
        // Initialize shadow matrix and searchInsertPointCache
        lastY = 0;
        this._buffers.backup.matrix = this._cloneMatrix(this.matrix);
        this._removeFromMatrix("backup", widget);

        this.searchInsertPointCache = [];
        // search bottommost row
        for (i = 0; i < this.columns; i++) {
            this.searchInsertPointCache[i] = [];
            lastWidget = this.matrix[i][this.matrix[i].length - 1];

            if (!lastWidget) {
                continue;
            }

            tmp = lastWidget.position.y + lastWidget.shape.height;
            if (tmp > lastY) {
                lastY = tmp;
            }
        }
        this.searchInsertPointYLimit = lastY + 1;

        // Create dragboard cursor
        this.dragboardCursor = new Wirecloud.ui.DragboardCursor(widget);

        if (draggable) {
            draggable.setXOffset(this.fromHCellsToPixels(1) / 2);
            draggable.setYOffset(this.getCellHeight());
        }
    };

    ColumnLayout.prototype._destroyCursor = function _destroyCursor() {
        if (this.dragboardCursor !== null) {
            this.dragboardCursor.destroy();
            this.dragboardCursor = null;
        }
    };

    ColumnLayout.prototype.disableCursor = function () {
        this._destroyCursor();
    };

    ColumnLayout.prototype._setPositions = function _setPositions() {
        var key, curIWidget;

        for (key in this.widgets) {
            curIWidget = this.widgets[key];
            if (curIWidget !== this.iwidgetToMove) {
                curIWidget.setPosition(this._getPositionOn("shadow", curIWidget));
            }
        }

        this.dragboardCursor.setPosition(this._getPositionOn("shadow", this.dragboardCursor));
    };

    ColumnLayout.prototype.moveTemporally = function moveTemporally(x, y) {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        var maxX = this.getColumns() - this.iwidgetToMove.shape.width;
        if (x > maxX) {
            x = maxX;
        }

        if (this.dragboardCursor != null) {
            var cursorpos = this.dragboardCursor.position;

            if ((cursorpos.y !== y) || (cursorpos.x !== x)) {
                this._buffers.shadow.positions = this._clonePositions("backup");
                this._buffers.shadow.matrix = this._cloneMatrix(this._buffers.backup.matrix);

                // Change cursor position
                this._insertAt(this.dragboardCursor, x, y, "shadow");
                this._setPositions();
            }
        } else {
            this._buffers.shadow.positions = this._clonePositions("backup");
            this._buffers.shadow.matrix = this._cloneMatrix(this._buffers.backup.matrix);

            this.dragboardCursor = new Wirecloud.ui.DragboardCursor(this.iwidgetToMove);
            this._insertAt(this.dragboardCursor, x, y, "shadow");
        }
    };

    ColumnLayout.prototype.cancelMove = function () {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: Trying to cancel an inexistant temporal move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        this._destroyCursor();

        for (var key in this.widgets) {
            this.widgets[key].setPosition(this.widgets[key].position);
        }
        this.iwidgetToMove = null;
        this.dragboardCursor = null;
    };

    ColumnLayout.prototype.acceptMove = function () {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: Function acceptMove called when there is not an started widget move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        var oldposition = this.iwidgetToMove.position;
        var newposition = this.dragboardCursor.position;
        this._destroyCursor();

        // Needed to force repaint of the widget at the correct position
        this.iwidgetToMove.setPosition(newposition);

        // Update iwidgets positions in persistence
        if (oldposition.y !== newposition.y || oldposition.x !== newposition.x) {
            this.matrix = this._buffers.shadow.matrix;
            this._buffers.base.matrix = this.matrix;
            this._reserveSpace("base", this.iwidgetToMove);
            this.dragboard.update();
        }

        // This is needed to check if the scrollbar status has changed (visible/hidden)
        this.dragboard._notifyWindowResizeEvent();

        this.iwidgetToMove = null;
        this.dragboardCursor = null;
    };

    Wirecloud.ui.ColumnLayout = ColumnLayout;

})(Wirecloud.Utils);
