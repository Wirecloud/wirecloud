/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * Returns the number of rows currently present in this layout.
     */
    const on_rows_get = function on_rows_get() {
        let rows = 0;
        for (let x = 0; x < this.columns; x += 1) {
            rows = Math.max(rows, this.matrix[x].length);
        }
        return rows;
    };

    /**
     * Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @name Wirecloud.ui.ColumnLayout
     *
     * @extends {Wirecloud.ui.DragboardLayout}
     * @constructor
     *
     * @param dragboard        associated dragboard
     * @param columns          number of columns of the layout
     * @param cellHeight       the height of the layout's cells in pixels
     * @param verticalMargin   vertical margin between iwidgets in pixels
     * @param horizontalMargin horizontal margin between iwidgets in pixels
     * @param scrollbarSpace   space reserved for the right scroll bar in pixels
     */
    ns.ColumnLayout = class ColumnLayout extends ns.DragboardLayout {

        constructor(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
            super(dragboard, scrollbarSpace);

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

            Object.defineProperties(this, {
                columns: {value: columns},
                rows: {get: on_rows_get}
            });
        }

        fromPixelsToVCells(pixels) {
            return pixels > 0 ? (pixels / this.cellHeight) : 0;
        }

        fromVCellsToPixels(cells) {
            return (cells * this.cellHeight);
        }

        getWidthInPixels(cells) {
            return this.fromHCellsToPixels(cells) - this.leftMargin - this.rightMargin;
        }

        getHeightInPixels(cells) {
            return this.fromVCellsToPixels(cells) - this.topMargin - this.bottomMargin;
        }

        fromPixelsToHCells(pixels) {
            if (pixels <= 0) {
                return 0;
            }

            let cells = pixels / this.fromHCellsToPixels(1);
            return Math.round(cells);
        }

        fromHCellsToPixels(cells) {
            return (this.getWidth() * this.fromHCellsToPercentage(cells)) / 100;
        }

        fromHCellsToPercentage(cells) {
            return cells * (100 / this.columns);
        }

        adaptColumnOffset(size) {
            let offsetInLU, pixels, parsedSize;

            parsedSize = this.parseSize(size);
            if (parsedSize[1] === 'cells') {
                offsetInLU = Math.round(parsedSize[0]);
            } else {
                if (parsedSize[1] === '%') {
                    pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
                } else {
                    pixels = parsedSize[0] < this.dragboard.leftMargin ? 0 : parsedSize[0] - this.dragboard.leftMargin;
                }
                offsetInLU = this.fromPixelsToHCells(pixels);
            }
            return new Wirecloud.ui.MultiValuedSize(this.getColumnOffset({x: offsetInLU}), offsetInLU);
        }

        adaptRowOffset(size) {
            var offsetInLU, pixels, parsedSize;

            parsedSize = this.parseSize(size);
            if (parsedSize[1] === 'cells') {
                offsetInLU = Math.round(parsedSize[0]);
            } else {
                if (parsedSize[1] === '%') {
                    pixels = Math.round((parsedSize[0] * this.getHeight()) / 100);
                } else {
                    pixels = parsedSize[0] < this.dragboard.topMargin ? 0 : parsedSize[0] - this.dragboard.topMargin;
                }
                offsetInLU = Math.round(this.fromPixelsToVCells(pixels - this.topMargin));
            }
            return new Wirecloud.ui.MultiValuedSize(this.getRowOffset({y: offsetInLU}), offsetInLU);
        }

        padWidth(width) {
            return width + this.leftMargin + this.rightMargin;
        }

        padHeight(height) {
            return height + this.topMargin + this.bottomMargin;
        }

        getColumnOffset(position) {
            var tmp = Math.floor((this.getWidth() * this.fromHCellsToPercentage(position.x)) / 100);
            tmp += this.leftMargin + this.dragboard.leftMargin;
            return tmp;
        }

        getRowOffset(position) {
            return this.dragboard.topMargin + this.fromVCellsToPixels(position.y) + this.topMargin;
        }

        _notifyWindowResizeEvent(widthChanged, heightChanged) {
            if (widthChanged) {
                Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
            }
        }

        _getPositionOn(buffer, widget) {
            if (buffer === this._buffers.base) {
                return widget.position;
            } else {
                return buffer.positions[widget.id];
            }
        }

        _setPositionOn(buffer, widget, position) {
            if (buffer === this._buffers.base) {
                widget.setPosition(position);
            } else {
                buffer.positions[widget.id] = position;
            }
        }

        _clearMatrix() {
            this.matrix = [];
            this._buffers.base.matrix = this.matrix;

            for (var x = 0; x < this.columns; x++) {
                this.matrix[x] = [];
            }
        }

        _hasSpaceFor(_matrix, positionX, positionY, width, height) {
            var x, y;

            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    if (_matrix[positionX + x][positionY + y] != null) {
                        return false;
                    }
                }
            }

            return true;
        }

        _clearSpace(buffer, widget) {
            let position = this._getPositionOn(buffer, widget);
            this._clearSpace2(
                buffer.matrix,
                position.x, position.y,
                widget.shape.width, widget.shape.height
            );
        }

        _compressColumns(_matrix, x, width) {
            var i, y;

            for (i = 0; i < width; i++) {
                for (y = _matrix[x + i].length - 1; y >= 0; y--) {
                    if (_matrix[x + i][y] != null) {
                        break;
                    }
                    _matrix[x + i].pop();
                }
            }
        }

        moveSpaceDown(buffer, widget, offsetY) {
            let widgetstomove, position, finalPosition, edgeY, curwidget, x, y;

            widgetstomove = {};
            let matrix = buffer.matrix;
            position = this._getPositionOn(buffer, widget);
            finalPosition = new Wirecloud.DragboardPosition(position.x, position.y + offsetY);

            edgeY = position.y + widget.shape.height;

            // Search affected widgets
            // TODO move widgets according to the biggest offset for optimizing
            for (x = 0; x < widget.shape.width; x++) {
                for (y = 0; y < offsetY; y++) {
                    curwidget = matrix[position.x + x][edgeY + y];
                    if (curwidget != null) {
                        widgetstomove[curwidget.id] = offsetY - y; // calculate the offset for this widget
                        break; // continue whit the next column
                    }
                }
            }

            // Move affected widgets instances
            var affectedwidgets = new Set(Object.keys(widgetstomove));
            for (let key in widgetstomove) {
                curwidget = this.widgets[key];
                utils.setupdate(affectedwidgets, this.moveSpaceDown(buffer, curwidget, widgetstomove[key]));
            }

            // Move the widget
            this._clearSpace(buffer, widget);
            this._setPositionOn(buffer, widget, finalPosition);
            this._reserveSpace(buffer, widget);

            return affectedwidgets;
        }

        /**
         * @returns Returns true if the widget position has been modified
         */
        moveSpaceUp(buffer, widget) {
            var position, edgeY, offsetY, finalPosition, curWidget,
                x, y, columnsize;

            let matrix = buffer.matrix;
            position = this._getPositionOn(buffer, widget);
            edgeY = position.y + widget.shape.height;

            offsetY = 1;
            while (((position.y - offsetY) >= 0) && this._hasSpaceFor(matrix, position.x, position.y - offsetY, widget.shape.width, 1)) {
                offsetY += 1;
            }
            offsetY -= 1;

            if (offsetY > 0) {
                let widgetstomove = {};
                finalPosition = new Wirecloud.DragboardPosition(position.x, position.y - offsetY);

                // Search affected widgets
                // TODO move the topmost widget for optimizing
                for (x = 0; x < widget.shape.width; x++) {
                    columnsize = matrix[position.x + x].length;
                    for (y = edgeY; y < columnsize; y++) {
                        curWidget = matrix[position.x + x][y];
                        if (curWidget != null) {
                            widgetstomove[curWidget.id] = curWidget;
                            break; // continue whit the next column
                        }
                    }
                }

                // Move the representation of the widget
                this._clearSpace(buffer, widget);
                this._setPositionOn(buffer, widget, finalPosition);
                this._reserveSpace(buffer, widget);

                // Move affected widgets instances
                let affectedwidgets = new Set(Object.keys(widgetstomove));
                affectedwidgets.add(widget.id);
                for (let key in widgetstomove) {
                    utils.setupdate(affectedwidgets, this.moveSpaceUp(buffer, widgetstomove[key]));
                }

                return affectedwidgets;
            }
            return new Set();
        }

        _removeFromMatrix(_matrix, widget) {
            this._clearSpace(_matrix, widget);
            return new Set();
        }

        _reserveSpace(buffer, widget) {
            var position = this._getPositionOn(buffer, widget);
            var width = widget.shape.width;
            var height = widget.shape.height;

            this._reserveSpace2(buffer.matrix, widget, position.x, position.y, width, height);
        }

        _reserveSpace2(matrix, widget, positionX, positionY, width, height) {
            var x, y;

            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    matrix[positionX + x][positionY + y] = widget;
                }
            }
        }

        _clearSpace2(_matrix, positionX, positionY, width, height) {
            var x, y;

            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    delete _matrix[positionX + x][positionY + y];
                }
            }

            this._compressColumns(_matrix, positionX, width);
        }

        _notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist) {
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
                                this.moveSpaceDown(this._buffers.base, iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                                break; // Continue with the next column
                            }
                        }
                    }

                    // Move the widget
                    position.x -= widthDiff;
                    widget.setPosition(position);

                    // Reserve the new space
                    this._reserveSpace2(
                        this.matrix,
                        widget,
                        position.x, position.y,
                        widthDiff, newHeight
                    );
                } else {
                    // Move affected iwidgets
                    for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
                        for (y = 0; y < newHeight; ++y) {
                            iWidgetToMove = this.matrix[x][position.y + y];
                            if (iWidgetToMove != null) {
                                this.moveSpaceDown(this._buffers.base, iWidgetToMove, finalYPos - iWidgetToMove.position.y);
                                break; // Continue with the next column
                            }
                        }
                    }

                    // Reserve this space
                    this._reserveSpace2(
                        this.matrix,
                        widget,
                        position.x + oldWidth, position.y,
                        newWidth - oldWidth, newHeight
                    );
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
                            this.moveSpaceDown(this._buffers.base, this.matrix[x][y], limitY - y);
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
        }

        /**
         * @returns returns if any widget's position has been modified
         */
        _insertAt(widget, x, y, buffer) {
            let newPosition = new Wirecloud.DragboardPosition(x > 0 ? x : 0, y > 0 ? y : 0);

            // Move other instances
            let affectedwidgets = new Set();
            let lastX = newPosition.x + widget.shape.width;
            let lastY = newPosition.y + widget.shape.height;
            let matrix = buffer.matrix;

            for (x = newPosition.x; x < lastX; x++) {
                for (y = newPosition.y; y < lastY; y++) {
                    let affectedwidget = matrix[x][y];
                    if (affectedwidget != null) {
                        // only move the widget if we didn't move it before
                        let affectedY = this._getPositionOn(buffer, affectedwidget).y;
                        // y + widget.shape.height - affectedY - (newPosition.y - y);
                        let offset = lastY - affectedY;
                        // move only the topmost widget in the column
                        affectedwidgets.add(affectedwidget.id);
                        utils.setupdate(affectedwidgets, this.moveSpaceDown(buffer, affectedwidget, offset));
                        break;
                    }
                }
            }

            // Change Widget instance position (insert it)
            this._setPositionOn(buffer, widget, newPosition);

            this._reserveSpace(buffer, widget);

            return affectedwidgets;
        }

        _searchFreeSpace(width, height) {
            var positionX = 0, positionY = 0;
            var maxX = this.columns - width;

            for (positionY = 0; true ; positionY++) {
                for (positionX = 0; positionX <= maxX; positionX++) {
                    if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
                        return {relx: true, x: positionX, rely: true, y: positionY};
                    }
                }
            }
        }

        initialize() {
            var widget, i, key, position, iWidgetsToReinsert = [];

            this._clearMatrix();

            // Insert iwidgets
            for (key in this.widgets) {
                widget = this.widgets[key];

                position = widget.position;

                widget.repaint();

                if (widget.shape.width > this.columns) {
                    widget.setShape({width: this.columns});
                }

                if (widget.shape.width + position.x > this.columns) {
                    iWidgetsToReinsert.push(widget);
                } else if (this._hasSpaceFor(this.matrix, position.x, position.y, widget.shape.width, widget.shape.height)) {
                    this._reserveSpace(this._buffers.base, widget);
                } else {
                    iWidgetsToReinsert.push(widget);
                }
            }

            var modified = false;
            if (iWidgetsToReinsert.length > 0) {
                // Reinsert the iwidgets that didn't fit in their positions
                for (i = 0; i < iWidgetsToReinsert.length; i++) {
                    position = this._searchFreeSpace(
                        iWidgetsToReinsert[i].shape.width,
                        iWidgetsToReinsert[i].shape.height
                    );
                    iWidgetsToReinsert[i].setPosition(position);
                    this._reserveSpace(this._buffers.base, iWidgetsToReinsert[i]);
                }
                modified = true;
            }

            this.initialized = true;
            return modified;
        }

        /**
         * Calculate what cell is at a given position in pixels
         */
        getCellAt(x, y) {
            var columnWidth = this.getWidth() / this.columns;

            return new Wirecloud.DragboardPosition(
                Math.floor(x / columnWidth),
                Math.floor(y / this.cellHeight)
            );
        }

        /**
         * Inserts the given widget into this layout.
         *
         * @param widget the widget to insert in this layout
         * @param affectsDragboard if true, the dragboard associated to this layout will be notified
         * @return whether any widget's position has been modified
         */
        addWidget(widget, affectsDragboard) {
            Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, widget, affectsDragboard);

            if (!this.initialized) {
                return;
            }

            if (widget.shape.width > this.columns) {
                widget.setShape({width: this.columns});
                // TODO: persist
            }

            var position = widget.position;
            var diff = widget.shape.width + position.x - this.columns;
            if (diff > 0) {
                position.x -= diff;
            }

            // Insert it. Returns if there are any affected widget
            let affectedwidgets = this._insertAt(widget, position.x, position.y, this._buffers.base);

            this._adaptIWidget(widget);
            return affectedwidgets;
        }

        removeWidget(widget, affectsDragboard) {
            var affectedwidgets = this._removeFromMatrix(this._buffers.base, widget);
            Wirecloud.ui.DragboardLayout.prototype.removeWidget.call(this, widget, affectsDragboard);
            return affectedwidgets;
        }

        moveTo(destLayout) {
            var movedWidgets, orderedWidgets, x, y, columns, rows, widget;

            /*
             * Always use ColumnLayout._removeFromMatrix for removing widgets
             * when moving widgets to another layout.
             */
            this._removeFromMatrix = ColumnLayout.prototype._removeFromMatrix;

            movedWidgets = {};
            orderedWidgets = [];
            columns = this.columns;
            rows = this.rows;
            for (y = 0; y < rows; y += 1) {
                for (x = 0; x < columns; x += 1) {
                    widget = this.matrix[x][y];
                    if (widget != null && !(widget.id in movedWidgets)) {
                        orderedWidgets.push(widget);
                        movedWidgets[widget.id] = true;
                    }
                }
            }

            orderedWidgets.forEach((widget) => {
                widget.moveToLayout(destLayout);
            });

            /* Restore _removeFromMatrix */
            delete this._removeFromMatrix;
        }

        _cloneMatrix(matrix) {
            var i, cloned_matrix = [];

            for (i = 0; i < this.columns; i++) {
                cloned_matrix[i] = utils.clone(matrix[i]);
            }

            return cloned_matrix;
        }

        _clonePositions(buffer) {
            let positions = {};

            for (let key in this.widgets) {
                positions[key] = utils.clone(this._getPositionOn(buffer, this.widgets[key]));
            }

            return positions;
        }

        initializeMove(widget, draggable) {

            if (widget == null || !(widget instanceof Wirecloud.ui.WidgetView)) {
                throw new TypeError("widget must be an WidgetView instance");
            }

            // Check for pendings moves
            if (this.iwidgetToMove != null) {
                let msg = "Dragboard: There was a pending move that was cancelled because initializedMove function was called before it was finished.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                this.cancelMove();
            }

            this.iwidgetToMove = widget;

            // Make a copy of the positions of the widgets
            this._buffers.backup = {
                matrix: this._cloneMatrix(this._buffers.base.matrix),
                positions: this._clonePositions(this._buffers.base)
            };
            this._buffers.shadow = {
                matrix: this.matrix
            };
            // Shadow matrix = current matrix without the widget to move
            // Initialize shadow matrix and searchInsertPointCache
            this._removeFromMatrix(this._buffers.backup, widget);

            // Create dragboard cursor
            this.dragboardCursor = new Wirecloud.ui.DragboardCursor(widget);

            draggable.setXOffset(this.fromHCellsToPixels(1) / 2).setYOffset(this.cellHeight);
        }

        disableCursor() {
            if (this.dragboardCursor !== null) {
                this.dragboardCursor.destroy();
                this.dragboardCursor = null;
            }
        }

        _setPositions() {
            var key, curIWidget;

            for (key in this.widgets) {
                curIWidget = this.widgets[key];
                if (curIWidget !== this.iwidgetToMove) {
                    curIWidget.setPosition(this._getPositionOn(this._buffers.shadow, curIWidget));
                }
            }

            this.dragboardCursor.setPosition(this._getPositionOn(this._buffers.shadow, this.dragboardCursor));
        }

        moveTemporally(x, y) {
            if (this.iwidgetToMove == null) {
                var msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            let position = this.getCellAt(x, y);
            x = position.x;
            y = position.y;
            if (y < 0) {
                y = 0;
            }
            if (x < 0) {
                x = 0;
            } else {
                var maxX = this.columns - this.iwidgetToMove.shape.width;
                if (x > maxX) {
                    x = maxX;
                }
            }

            if (this.dragboardCursor != null) {
                var cursorpos = this.dragboardCursor.position;

                if ((cursorpos.y !== y) || (cursorpos.x !== x)) {
                    this._buffers.shadow.positions = this._clonePositions(this._buffers.backup);
                    this._buffers.shadow.matrix = this._cloneMatrix(this._buffers.backup.matrix);

                    // Change cursor position
                    this._insertAt(this.dragboardCursor, x, y, this._buffers.shadow);
                    this._setPositions();
                }
            } else {
                this._buffers.shadow.positions = this._clonePositions(this._buffers.backup);
                this._buffers.shadow.matrix = this._cloneMatrix(this._buffers.backup.matrix);

                this.dragboardCursor = new Wirecloud.ui.DragboardCursor(this.iwidgetToMove);
                this._insertAt(this.dragboardCursor, x, y, this._buffers.shadow);
            }
        }

        cancelMove() {
            if (this.iwidgetToMove == null) {
                var msg = "Dragboard: Trying to cancel an inexistant temporal move.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            this.disableCursor();

            for (var key in this.widgets) {
                this.widgets[key].setPosition(this.widgets[key].position);
            }
            this.iwidgetToMove = null;
            this.dragboardCursor = null;
        }

        acceptMove() {
            if (this.iwidgetToMove == null) {
                var msg = "Dragboard: Function acceptMove called when there is not an started widget move.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            var oldposition = this.iwidgetToMove.position;
            var newposition = this.dragboardCursor.position;
            this.disableCursor();

            // Needed to force repaint of the widget at the correct position
            this.iwidgetToMove.setPosition(newposition);

            // Update iwidgets positions in persistence
            if (oldposition.y !== newposition.y || oldposition.x !== newposition.x) {
                this.matrix = this._buffers.shadow.matrix;
                this._buffers.base.matrix = this.matrix;
                this._reserveSpace(this._buffers.base, this.iwidgetToMove);
                this.dragboard.update();
            }

            // This is needed to check if the scrollbar status has changed (visible/hidden)
            this.dragboard._notifyWindowResizeEvent();

            this.iwidgetToMove = null;
            this.dragboardCursor = null;
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
