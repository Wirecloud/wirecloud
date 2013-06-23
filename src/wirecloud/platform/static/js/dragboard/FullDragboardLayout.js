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
/*global gettext, Constants, DragboardLayout, DragboardPosition, IWidget, LogManagerFactory, MultiValuedSize*/

/////////////////////////////////////
// FullDragboard
/////////////////////////////////////

/**
 * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
 *
 * This dragobard uses percentages for horizontal units and px for vertical units.
 *
 * @extends DragboardLayout
 */
function FullDragboardLayout(dragboard, scrollbarSpace) {
    if (arguments.length === 0) {
        return; // Allow empty constructor (allowing hierarchy)
    }

    this.initialized = false;
    DragboardLayout.call(this, dragboard, scrollbarSpace);
}

FullDragboardLayout.prototype = new DragboardLayout();

FullDragboardLayout.prototype.fromPixelsToVCells = function (pixels) {
    return 1;
};

FullDragboardLayout.prototype.fromVCellsToPixels = function (cells) {
    return this.getHeight();
};

FullDragboardLayout.prototype.getWidthInPixels = function (cells) {
    return this.getWidth();
};

FullDragboardLayout.prototype.getHeightInPixels = function (cells) {
    return this.getHeight();
};

FullDragboardLayout.prototype.fromPixelsToHCells = function (pixels) {
    return 1;
};

FullDragboardLayout.prototype.fromHCellsToPixels = function (cells) {
    return this.getWidth();
};

FullDragboardLayout.prototype.fromHCellsToPercentage = function (cells) {
    return this.getHeight();
};

FullDragboardLayout.prototype.getColumnOffset = function (column) {
    return this.dragboard.dragboardElement.getBoundingClientRect().left;
};

FullDragboardLayout.prototype.getRowOffset = function (row) {
    return this.dragboard.dragboardElement.getBoundingClientRect().top;
};

FullDragboardLayout.prototype.adaptColumnOffset = function (pixels) {
    return new MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().left, 0);
};

FullDragboardLayout.prototype.adaptRowOffset = function (pixels) {
    return new MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().top, 0);
};

FullDragboardLayout.prototype.adaptHeight = function (contentHeight, fullSize, oldLayout) {
    var diff = fullSize - contentHeight;
    return new MultiValuedSize(contentHeight - diff, 1);
};

FullDragboardLayout.prototype.adaptWidth = function (contentWidth, fullSize) {
    return new MultiValuedSize(this.getWidth(), 1);
};

FullDragboardLayout.prototype.initialize = function () {
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
FullDragboardLayout.prototype.getCellAt = function (x, y) {
    return new DragboardPosition(0, 0);
};

FullDragboardLayout.prototype.addIWidget = function (iWidget, affectsDragboard) {
    iWidget.element.addClassName('fulldragboard');

    DragboardLayout.prototype.addIWidget.call(this, iWidget, affectsDragboard);

    if (!this.initialized) {
        return;
    }

    iWidget.setPosition(new DragboardPosition(0, 0));
};

FullDragboardLayout.prototype.removeIWidget = function (iWidget, affectsDragboard) {
    iWidget.element.removeClassName('fulldragboard');

    DragboardLayout.prototype.removeIWidget.call(this, iWidget, affectsDragboard);
};


FullDragboardLayout.prototype.initializeMove = function (iwidget, draggable) {
    // Check for pendings moves
    if (this.iwidgetToMove !== null) {
        var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        this.cancelMove();
    }

    this.iwidgetToMove = iwidget;
};

FullDragboardLayout.prototype.moveTemporally = function (x, y) {
    if (!(this.iwidgetToMove instanceof IWidget)) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }
};

FullDragboardLayout.prototype.acceptMove = function () {
    if (!(this.iwidgetToMove instanceof IWidget)) {
        var msg = gettext("Function acceptMove called when there is not an started iwidget move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.iwidgetToMove = null;
};

FullDragboardLayout.prototype.cancelMove = function () {
    if (!(this.iwidgetToMove instanceof IWidget)) {
        var msg = gettext("Trying to cancel an inexistant temporal move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.iwidgetToMove._notifyWindowResizeEvent();
    this.iwidgetToMove = null;
    this.newPosition = null;
};
