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

/*jslint white: true, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, forin: true, sub: true*/
/*global gettext, IWidget, LayoutManagerFactory*/

/////////////////////////////////////
// FreeLayout
/////////////////////////////////////

/**
 * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
 *
 * This dragobard uses percentages for horizontal units and px for vertical units.
 *
 * @extends Wirecloud.ui.DragboardLayout
 */
function FreeLayout(dragboard, scrollbarSpace) {
    if (arguments.length === 0) {
        return; // Allow empty constructor (allowing hierarchy)
    }

    this.initialized = false;
    this.iwidgetToMove = null;
    Wirecloud.ui.DragboardLayout.call(this, dragboard, scrollbarSpace);
}
FreeLayout.prototype = new Wirecloud.ui.DragboardLayout();

FreeLayout.prototype.MAX_HLU = 1000000;

FreeLayout.prototype.fromPixelsToVCells = function (pixels) {
    return pixels;
};

FreeLayout.prototype.fromVCellsToPixels = function (cells) {
    return cells;
};

FreeLayout.prototype.getWidthInPixels = function (cells) {
    return this.fromHCellsToPixels(cells);
};

FreeLayout.prototype.getHeightInPixels = function (cells) {
    return this.fromVCellsToPixels(cells);
};

FreeLayout.prototype.fromPixelsToHCells = function (pixels) {
    return (pixels * this.MAX_HLU / this.getWidth());
};

FreeLayout.prototype.fromHCellsToPixels = function (cells) {
    return Math.ceil((this.getWidth() * cells) / this.MAX_HLU);
};

FreeLayout.prototype.fromHCellsToPercentage = function (cells) {
    return cells / (this.MAX_HLU / 100);
};

FreeLayout.prototype.getColumnOffset = function (column) {
    return Math.ceil((this.getWidth() * column) / this.MAX_HLU);
};

FreeLayout.prototype.getRowOffset = function (row) {
    return row;
};

FreeLayout.prototype.adaptColumnOffset = function (pixels) {
    var offsetInLU = Math.ceil(this.fromPixelsToHCells(pixels));
    return new Wirecloud.ui.MultiValuedSize(this.fromHCellsToPixels(offsetInLU), offsetInLU);
};

FreeLayout.prototype.adaptRowOffset = function (pixels) {
    return new Wirecloud.ui.MultiValuedSize(pixels, pixels);
};

FreeLayout.prototype.adaptHeight = function (contentHeight, fullSize, oldLayout) {
    return new Wirecloud.ui.MultiValuedSize(contentHeight, fullSize);
};

FreeLayout.prototype.adaptWidth = function (contentWidth, fullSize) {
    var widthInLU = Math.floor(this.fromPixelsToHCells(fullSize));
    return new Wirecloud.ui.MultiValuedSize(this.fromHCellsToPixels(widthInLU), widthInLU);
};

FreeLayout.prototype._notifyWindowResizeEvent = function (widthChanged, heightChanged) {
    if (widthChanged) {
        Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
    }
};


FreeLayout.prototype._notifyResizeEvent = function (iWidget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    if (resizeLeftSide) {
        var widthDiff = newWidth - oldWidth;
        var position = iWidget.getPosition();
        position.x -= widthDiff;

        if (persist) {
            iWidget.setPosition(position);
        } else {
            iWidget._notifyWindowResizeEvent();
        }
    }

    if (persist) {
        // Save new position into persistence
        this.dragboard._commitChanges([iWidget.code]);
    }
};

FreeLayout.prototype.initialize = function () {
    var iWidget, key;

    // Insert iwidgets
    for (key in this.iWidgets) {
        iWidget = this.iWidgets[key];
        iWidget.paint(true);
    }

    this.initialized = true;
};

/**
 * Calculate what cell is at a given position in pixels
 */
FreeLayout.prototype.getCellAt = function (x, y) {
    return new Wirecloud.DragboardPosition((x * this.MAX_HLU) / this.getWidth(), y);
};

FreeLayout.prototype.addIWidget = function (iWidget, affectsDragboard) {
    Wirecloud.ui.DragboardLayout.prototype.addIWidget.call(this, iWidget, affectsDragboard);

    if (!this.initialized) {
        return;
    }

    var position = iWidget.getPosition();
    if (!(position instanceof Wirecloud.DragboardPosition)) {
        position = new Wirecloud.DragboardPosition(0, 0);
    }

    iWidget.setPosition(position);

    this._adaptIWidget(iWidget);
};

FreeLayout.prototype.initializeMove = function (iwidget, draggable) {
    var msg;

    draggable = draggable || null; // default value for the draggable parameter

    // Check for pendings moves
    if (this.iwidgetToMove !== null) {
        msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.");
        Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
        this.cancelMove();
    }

    this.iwidgetToMove = iwidget;
    this.newPosition = iwidget.getPosition().clone();

    if (draggable) {
        draggable.setXOffset(0);
        draggable.setYOffset(0);
    }
};

FreeLayout.prototype.moveTemporally = function (x, y) {
    if (!(this.iwidgetToMove instanceof IWidget)) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
        return;
    }

    this.newPosition.x = x;
    this.newPosition.y = y;
};

FreeLayout.prototype.acceptMove = function () {
    if (!(this.iwidgetToMove instanceof IWidget)) {
        var msg = gettext("Function acceptMove called when there is not an started iwidget move.");
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
    // This is needed to check if the scrollbar status has changed (visible/hidden)
    this.dragboard._notifyWindowResizeEvent();
    // But at least "iwidgetToMove" must be updated, so force a call to its _notifyWindowResizeEvent method
    this.iwidgetToMove._notifyWindowResizeEvent();
    this.dragboard._commitChanges([this.iwidgetToMove.code]);

    this.iwidgetToMove = null;
    this.newPosition = null;
};

FreeLayout.prototype.cancelMove = function () {
    var msg;

    if (!(this.iwidgetToMove instanceof IWidget)) {
        msg = gettext("Trying to cancel an inexistant temporal move.");
        Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
        return;
    }

    this.iwidgetToMove._notifyWindowResizeEvent();
    this.iwidgetToMove = null;
    this.newPosition = null;
};

FreeLayout.prototype._raiseIWidgetCallback = function () {
    this.iwidget.setMinimizeStatus(false);
    this.iwidget.layout.dragboard.raiseToTop(this.iwidget);
};

FreeLayout.prototype.fillFloatingWidgetsMenu = function (menu) {
    var i, iwidgetKeys, curIWidget, key;

    iwidgetKeys = this.iWidgets.keys();
    if (iwidgetKeys.length > 0) {
        for (i = 0; i < iwidgetKeys.length; i++) {
            key = iwidgetKeys[i];
            curIWidget = this.iWidgets[key];

            menu.addOption(null, curIWidget.name, this._raiseIWidgetCallback.bind({"iwidget": curIWidget}), i);
        }
    } else {
        menu.addOption(null, gettext("No Floating Widgets"), function () {}, 0);
    }
};
