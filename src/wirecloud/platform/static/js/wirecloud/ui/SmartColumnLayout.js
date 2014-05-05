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

/*global gettext, Wirecloud*/

(function () {

    "use strict";

    var SmartColumnLayout = function SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
        Wirecloud.ui.ColumnLayout.call(this,
                          dragboard,
                          columns,
                          cellHeight,
                          verticalMargin,
                          horizontalMargin,
                          scrollbarSpace);
    };
    SmartColumnLayout.prototype = new Wirecloud.ui.ColumnLayout();

    SmartColumnLayout.prototype._realSearchInsertPoint = function (_matrix, x, y, width, height) {
        var widthDiff, lastY, offsetX;

        /* Check for special cases
           y == 0                             => we are on the topmost position
                                              so this is the insert point
           _matrix[x][y - 1] != _matrix[x][y] => we are in a edge, so this is
                                              the insert point.
           _matrix[x][y] != null              => there is already a widget in
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
                // The widget at (x,y) has the same or a bigger width
                // than the widget to move, so as the widget to move
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
        // Search the topmost position for the widget

        if (y > this.searchInsertPointYLimit) {
            y = this.searchInsertPointYLimit;
        }

        if (!this.searchInsertPointCache[x][y]) {
            this.searchInsertPointCache[x][y] = this._realSearchInsertPoint(_matrix, x, y, width, height);
        }

        return this.searchInsertPointCache[x][y];
    };

    SmartColumnLayout.prototype.initialize = function () {
        var modified = Wirecloud.ui.ColumnLayout.prototype.initialize.call(this);

        // remove holes moving iwidgets to the topmost positions
        var iWidget, key, keys = [];
        for (key in this.iWidgets) {
            keys.push(key);
            iWidget = this.iWidgets[key];
            modified = modified || this._moveSpaceUp("base", iWidget);
        }
        if (modified) {
            //save these changes in the server side
            this.dragboard._commitChanges(keys);
        }
    };

    SmartColumnLayout.prototype._notifyWindowResizeEvent = function (widthChanged, heightChanged) {
        if (widthChanged) {
            Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
        }
    };

    SmartColumnLayout.prototype._notifyResizeEvent = function (iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        var x, y;
        var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
        var position = iWidget.getPosition();
        var step2X, finalYPos, widthDiff, iWidgetToMove, limitX, limitY;
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
                            this._moveSpaceDown("base", iWidgetToMove, finalYPos - iWidgetToMove.position.y);
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

                // Move affected iwidgets
                y = position.y + oldHeight;
                limitX = position.x + widthDiff;
                for (x = position.x; x < limitX; ++x) {
                    if (this.matrix[x][y] != null) {
                        this._moveSpaceUp("base", this.matrix[x][y]);
                    }
                }

                // Move the widget
                position.x += widthDiff;
                if (persist) {
                    iWidget.setPosition(position);
                }

                step2X = position.x;
            } else {
                // Clear space
                this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);

                // Move affected iwidgets
                y = position.y + oldHeight;
                limitX = position.x + oldWidth;
                for (x = position.x + newWidth; x < limitX; ++x) {
                    if (this.matrix[x][y] != null) {
                        this._moveSpaceUp("base", this.matrix[x][y]);
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
                        this._moveSpaceDown("base", this.matrix[x][y], limitY - y);
                    }
                }
            }

            // Reserve Space
            this._reserveSpace2(this.matrix, iWidget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
        } else if (newHeight < oldHeight) {
            // Clear freed space
            this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);

            y = position.y + oldHeight;
            limitX = step2X + step2Width;
            for (x = step2X; x < limitX; x++) {
                if (this.matrix[x][y] != null) {
                    this._moveSpaceUp("base", this.matrix[x][y]);
                }
            }
        }

        this._notifyWindowResizeEvent(true, true); // TODO
        if (persist) {
            this._moveSpaceUp("base", iWidget);
            // Save new positions into persistence
            this.dragboard._commitChanges(); // FIXME
        }
    };

    //Returns if any widget's position has been modified
    SmartColumnLayout.prototype._insertAt = function (iWidget, x, y, buffer) {

        var affectedWidgets = Wirecloud.ui.ColumnLayout.prototype._insertAt.call(this, iWidget, x, y, buffer);
        this._moveSpaceUp(buffer, iWidget);

        return affectedWidgets;
    };

    //Returns if any widget's position has been modified
    SmartColumnLayout.prototype._removeFromMatrix = function (buffer, iWidget) {
        this._clearSpace(buffer, iWidget);

        var modified = false, affectedIWidgets = {};
        var affectedwidget, x, y, columnsize;
        var position = this._getPositionOn(buffer, iWidget);
        var edgeY = position.y + iWidget.getHeight();

        var _matrix = this._buffers[buffer].matrix;

        // check if we have to update the representations of the widget instances
        for (x = 0; x < iWidget.getWidth(); x++) {
            columnsize = _matrix[position.x + x].length;
            for (y = edgeY; y < columnsize; y++) {
                affectedwidget = _matrix[position.x + x][y];
                if ((affectedwidget != null) && (typeof affectedIWidgets[affectedwidget.code] !== true)) {
                    affectedIWidgets[affectedwidget.code] = true;
                    modified = true;
                    this._moveSpaceUp(buffer, affectedwidget);
                    break;
                }
            }
        }
        return modified;
    };

    Wirecloud.ui.SmartColumnLayout = SmartColumnLayout;

})();
