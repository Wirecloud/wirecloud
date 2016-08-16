/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * This dragobard uses percentages for horizontal units and px for vertical units.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    var FreeLayout = function FreeLayout(dragboard, scrollbarSpace) {
        if (arguments.length === 0) {
            return; // Allow empty constructor (allowing hierarchy)
        }

        this.initialized = false;
        this.iwidgetToMove = null;
        Wirecloud.ui.DragboardLayout.call(this, dragboard, scrollbarSpace);
    };
    FreeLayout.prototype = new Wirecloud.ui.DragboardLayout();

    FreeLayout.prototype.MAX_HLU = 1000000;

    FreeLayout.prototype.fromPixelsToVCells = function fromPixelsToVCells(pixels) {
        return pixels;
    };

    FreeLayout.prototype.fromVCellsToPixels = function fromVCellsToPixels(cells) {
        return cells;
    };

    FreeLayout.prototype.getWidthInPixels = function getWidthInPixels(cells) {
        return this.fromHCellsToPixels(cells);
    };

    FreeLayout.prototype.getHeightInPixels = function getHeightInPixels(cells) {
        return this.fromVCellsToPixels(cells);
    };

    FreeLayout.prototype.fromPixelsToHCells = function fromPixelsToHCells(pixels) {
        return (pixels * this.MAX_HLU / this.getWidth());
    };

    FreeLayout.prototype.fromHCellsToPixels = function fromHCellsToPixels(cells) {
        return Math.round((this.getWidth() * cells) / this.MAX_HLU);
    };

    FreeLayout.prototype.fromHCellsToPercentage = function fromHCellsToPercentage(cells) {
        return cells / (this.MAX_HLU / 100);
    };

    FreeLayout.prototype.getColumnOffset = function getColumnOffset(column) {
        return this.dragboardLeftMargin + this.fromHCellsToPixels(column);
    };

    FreeLayout.prototype.getRowOffset = function getRowOffset(row) {
        return this.dragboardTopMargin + row;
    };

    FreeLayout.prototype.adaptColumnOffset = function adaptColumnOffset(size) {
        var offsetInLU, offsetInPixels, pixels, parsedSize;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            offsetInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
            } else {
                pixels = parsedSize[0];
            }
            offsetInLU = Math.round(this.fromPixelsToHCells(pixels));
        }
        offsetInPixels = this.fromHCellsToPixels(offsetInLU);
        return new Wirecloud.ui.MultiValuedSize(offsetInPixels, offsetInLU);
    };

    FreeLayout.prototype.adaptRowOffset = function adaptRowOffset(size) {
        var pixels, parsedSize;

        parsedSize = this.parseSize(size);
        switch (parsedSize[1]) {
        case "%":
            pixels = Math.round((parsedSize[0] * this.getHeight()) / 100);
            break;
        case "cells":
            /* falls through */
        case "px":
            pixels = parsedSize[0];
            break;
        }
        return new Wirecloud.ui.MultiValuedSize(pixels, pixels);
    };

    FreeLayout.prototype.adaptHeight = function adaptHeight(size) {
        var pixels, parsedSize;

        parsedSize = this.parseSize(size);
        switch (parsedSize[1]) {
        case "%":
            pixels = Math.round((parsedSize[0] * this.getHeight()) / 100);
            break;
        case "cells":
            /* falls through */
        case "px":
            pixels = parsedSize[0];
            break;
        }
        return new Wirecloud.ui.MultiValuedSize(pixels, pixels);
    };

    FreeLayout.prototype._notifyWindowResizeEvent = function _notifyWindowResizeEvent(widthChanged, heightChanged) {
        if (widthChanged) {
            Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
        }
    };


    FreeLayout.prototype._notifyResizeEvent = function _notifyResizeEvent(iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        if (resizeLeftSide) {
            var widthDiff = newWidth - oldWidth;
            var position = iWidget.position;
            position.x -= widthDiff;

            iWidget.setPosition(position);
            iWidget.repaint();
        }

        if (persist) {
            // Save new position into persistence
            this.dragboard.update([iWidget.id]);
        }
    };

    FreeLayout.prototype.initialize = function initialize() {
        var iWidget, key;

        // Insert iwidgets
        for (key in this.widgets) {
            iWidget = this.widgets[key];
            iWidget.repaint();
        }

        this.initialized = true;
    };

    /**
     * Calculate what cell is at a given position in pixels
     */
    FreeLayout.prototype.getCellAt = function getCellAt(x, y) {
        return new Wirecloud.DragboardPosition(((x - this.dragboardLeftMargin) * this.MAX_HLU) / this.getWidth(), y - this.dragboardTopMargin);
    };

    FreeLayout.prototype.addWidget = function addWidget(iWidget, affectsDragboard) {
        Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, iWidget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        this._adaptIWidget(iWidget);
    };

    FreeLayout.prototype.initializeMove = function initializeMove(iwidget, draggable) {
        var msg;

        draggable = draggable || null; // default value for the draggable parameter

        if (!(iwidget instanceof Wirecloud.ui.WidgetView)) {
            throw new TypeError("widget must be an WidgetView instance");
        }

        // Check for pendings moves
        if (this.iwidgetToMove !== null) {
            msg = "Dragboard: There was a pending move that was cancelled because initializedMove function was called before it was finished.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            this.cancelMove();
        }

        this.iwidgetToMove = iwidget;
        this.newPosition = iwidget.position;

        if (draggable) {
            draggable.setXOffset(0);
            draggable.setYOffset(0);
        }
    };

    FreeLayout.prototype.moveTemporally = function moveTemporally(x, y) {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        this.newPosition.x = x;
        this.newPosition.y = y;
    };

    FreeLayout.prototype.acceptMove = function acceptMove() {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: Function acceptMove called when there is not an started iwidget move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        if (this.newPosition.x > (this.MAX_HLU - 1)) {
            this.newPosition.x = (this.MAX_HLU - 1);
        }
        if (this.newPosition.y < 0) {
            this.newPosition.y = 0;
        }

        this.iwidgetToMove.setPosition(this.newPosition);
        this.dragboard.update([this.iwidgetToMove.id]);

        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    FreeLayout.prototype.cancelMove = function cancelMove() {
        var msg;

        if (this.iwidgetToMove == null) {
            msg = "Trying to cancel an inexistant temporal move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        // We have only update the CSS of the widget but not the position attribute
        // Repaint it using the initial position
        this.iwidgetToMove.repaint();
        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    Wirecloud.ui.FreeLayout = FreeLayout;

})(Wirecloud.Utils);
