/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var SmartColumnLayout = function SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
        Wirecloud.ui.ColumnLayout.call(
            this,
            dragboard,
            columns,
            cellHeight,
            verticalMargin,
            horizontalMargin,
            scrollbarSpace
        );
    };
    utils.inherit(SmartColumnLayout, Wirecloud.ui.ColumnLayout);

    SmartColumnLayout.prototype.initialize = function initialize() {
        var modified = Wirecloud.ui.ColumnLayout.prototype.initialize.call(this);

        // remove holes by moving widgets to the topmost position available
        var widget, key, keys = [];
        for (key in this.widgets) {
            keys.push(key);
            widget = this.widgets[key];
            modified = modified || this.moveSpaceUp("base", widget);
        }
        if (modified) {
            // save these changes in the server side
            this.dragboard.update(keys);
        }

        return modified;
    };

    SmartColumnLayout.prototype._notifyResizeEvent = function _notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        var x, y;
        var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
        var position = widget.position;
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
                            this.moveSpaceDown("base", iWidgetToMove, finalYPos - iWidgetToMove.position.y);
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
                            this.moveSpaceDown("base", iWidgetToMove, finalYPos - iWidgetToMove.position.y);
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

                // Move affected iwidgets
                y = position.y + oldHeight;
                limitX = position.x + widthDiff;
                for (x = position.x; x < limitX; ++x) {
                    if (this.matrix[x][y] != null) {
                        this.moveSpaceUp("base", this.matrix[x][y]);
                    }
                }

                // Move the widget
                position.x += widthDiff;
                widget.setPosition(position);

                step2X = position.x;
            } else {
                // Clear space
                this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);

                // Move affected iwidgets
                y = position.y + oldHeight;
                limitX = position.x + oldWidth;
                for (x = position.x + newWidth; x < limitX; ++x) {
                    if (this.matrix[x][y] != null) {
                        this.moveSpaceUp("base", this.matrix[x][y]);
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
                        this.moveSpaceDown("base", this.matrix[x][y], limitY - y);
                    }
                }
            }

            // Reserve Space
            this._reserveSpace2(this.matrix, widget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
        } else if (newHeight < oldHeight) {
            // Clear freed space
            this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);

            y = position.y + oldHeight;
            limitX = step2X + step2Width;
            for (x = step2X; x < limitX; x++) {
                if (this.matrix[x][y] != null) {
                    this.moveSpaceUp("base", this.matrix[x][y]);
                }
            }
        }

        this._notifyWindowResizeEvent(true, true); // TODO
        if (persist) {
            this.moveSpaceUp("base", widget);
            // Save new positions into persistence
            this.dragboard.update(); // FIXME
        }
    };

    // Returns if any widget's position has been modified
    SmartColumnLayout.prototype._insertAt = function (widget, x, y, buffer) {
        var affectedwidgets = Wirecloud.ui.ColumnLayout.prototype._insertAt.call(this, widget, x, y, buffer);
        return utils.setupdate(affectedwidgets, this.moveSpaceUp(buffer, widget));
    };

    /**
     * @returns Returns true if any widget's position has been modified
     */
    SmartColumnLayout.prototype._removeFromMatrix = function (buffer, widget) {
        this._clearSpace(buffer, widget);

        var visitedwidgets = new Set(), modifiedwidgets = new Set();
        var position = this._getPositionOn(buffer, widget);
        var edgeY = position.y + widget.shape.height;

        var _matrix = this._buffers[buffer].matrix;

        // check if we have to update the representations of the widget instances
        for (let x = 0; x < widget.shape.width; x++) {
            let currentwidget = _matrix[position.x + x][edgeY];
            if (currentwidget != null && !visitedwidgets.has(currentwidget.id)) {
                visitedwidgets.add(currentwidget.id);
                utils.setupdate(modifiedwidgets, this.moveSpaceUp(buffer, currentwidget));
            }
        }
        return modifiedwidgets;
    };

    Wirecloud.ui.SmartColumnLayout = SmartColumnLayout;

})(Wirecloud.Utils);
