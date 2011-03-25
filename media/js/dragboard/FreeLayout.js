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

/////////////////////////////////////
// FreeLayout
/////////////////////////////////////

/**
 * @class Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * This dragobard uses percentages for horizontal units and px for vertical units.
 *
 * @extends DragboardLayout
 */
function FreeLayout(dragboard, scrollbarSpace) {
    if (arguments.length == 0)
        return; // Allow empty constructor (allowing hierarchy)

    this.initialized = false;
    DragboardLayout.call(this, dragboard, scrollbarSpace);
}

FreeLayout.prototype = new DragboardLayout();

FreeLayout.prototype.MAX_HLU = 1000000;

FreeLayout.prototype.fromPixelsToVCells = function(pixels) {
    return pixels;
}

FreeLayout.prototype.fromVCellsToPixels = function(cells) {
    return cells;
}

FreeLayout.prototype.getWidthInPixels = function (cells) {
    return this.fromHCellsToPixels(cells);
}

FreeLayout.prototype.getHeightInPixels = function (cells) {
    return this.fromVCellsToPixels(cells);
}

FreeLayout.prototype.fromPixelsToHCells = function(pixels) {
    return (pixels  * this.MAX_HLU/ this.getWidth());
}

FreeLayout.prototype.fromHCellsToPixels = function(cells) {
    return Math.ceil((this.getWidth() * cells) / this.MAX_HLU);
}

FreeLayout.prototype.fromHCellsToPercentage = function(cells) {
    return cells / (this.MAX_HLU / 100);
}

FreeLayout.prototype.getColumnOffset = function(column) {
    return Math.ceil((this.getWidth() * column) / this.MAX_HLU);
}

FreeLayout.prototype.getRowOffset = function(row) {
    return row;
}

FreeLayout.prototype.adaptColumnOffset = function(pixels) {
    var offsetInLU = Math.ceil(this.fromPixelsToHCells(pixels));
    return new MultiValuedSize(this.fromHCellsToPixels(offsetInLU), offsetInLU);
}

FreeLayout.prototype.adaptRowOffset = function(pixels) {
    return new MultiValuedSize(pixels, pixels);
}

FreeLayout.prototype.adaptHeight = function(contentHeight, fullSize, oldLayout) {
    return new MultiValuedSize(contentHeight, fullSize);
}

FreeLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
    var widthInLU = Math.floor(this.fromPixelsToHCells(fullSize));
    return new MultiValuedSize(this.fromHCellsToPixels(widthInLU), widthInLU);
}

FreeLayout.prototype._notifyWindowResizeEvent = function(widthChanged, heightChanged) {
    if (widthChanged)
        DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
}


FreeLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
    if (resizeLeftSide) {
        var widthDiff = newWidth - oldWidth;
        var position = iGadget.getPosition();
        position.x -= widthDiff;

        if (persist)
            iGadget.setPosition(position);
        else
            iGadget._notifyWindowResizeEvent();
    }

    if (persist) {
        // Save new position into persistence
        this.dragboard._commitChanges([iGadget.code]);
    }
}

FreeLayout.prototype.initialize = function () {
    var iGadget, i, key;

    // Insert igadgets
    var igadgetKeys = this.iGadgets.keys();
    for (i = 0; i < igadgetKeys.length; i++) {
        key = igadgetKeys[i];
        iGadget = this.iGadgets[key];
        iGadget.paint(true);
    }

    this.initialized = true;
}

/**
 * Calculate what cell is at a given position in pixels
 */
FreeLayout.prototype.getCellAt = function (x, y) {
    return new DragboardPosition((x * this.MAX_HLU) / this.getWidth(),
                                 y);
}

FreeLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
    DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

    if (!this.initialized)
        return;

    var position = iGadget.getPosition();
    if (position == null)
        position = new DragboardPosition(0, 0)

    iGadget.setPosition(position);

    this._adaptIGadget(iGadget);
}

FreeLayout.prototype.initializeMove = function(igadget, draggable) {
    draggable = draggable || null; // default value for the draggable parameter

    // Check for pendings moves
    if (this.igadgetToMove != null) {
        var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.")
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        this.cancelMove();
    }

    this.igadgetToMove = igadget;
    this.newPosition = igadget.getPosition().clone();

    if (draggable) {
        draggable.setXOffset(0);
        draggable.setYOffset(0);
    }
}

FreeLayout.prototype.moveTemporally = function(x, y) {
    if (this.igadgetToMove == null) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.newPosition.x = x;
    this.newPosition.y = y;
}

FreeLayout.prototype.acceptMove = function() {
    if (this.igadgetToMove == null) {
        var msg = gettext("Function acceptMove called when there is not an started igadget move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    if (this.newPosition.x > (this.MAX_HLU - 1))
        this.newPosition.x = (this.MAX_HLU - 1);
    if (this.newPosition.y < 0)
        this.newPosition.y = 0;

    this.igadgetToMove.setPosition(this.newPosition);
    // This is needed to check if the scrollbar status has changed (visible/hidden)
    this.dragboard._notifyWindowResizeEvent();
    // But at least "igadgetToMove" must be updated, so force a call to its _notifyWindowResizeEvent method
    this.igadgetToMove._notifyWindowResizeEvent();
    this.dragboard._commitChanges([this.igadgetToMove.code]);

    this.igadgetToMove = null;
    this.newPosition = null;
}

FreeLayout.prototype.cancelMove = function() {
    if (this.igadgetToMove == null) {
        var msg = gettext("Trying to cancel an inexistant temporal move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.igadgetToMove._notifyWindowResizeEvent();
    this.igadgetToMove = null;
    this.newPosition = null;
}

FreeLayout.prototype.fillFloatingGadgetsMenu = function(menu) {
    var igadgetKeys = this.iGadgets.keys();
    if (igadgetKeys.length > 0) {
        for (i = 0; i < igadgetKeys.length; i++) {
            key = igadgetKeys[i];
            curIGadget = this.iGadgets[key];

            var context = {"igadget": curIGadget};
            menu.addOption(null, curIGadget.name, function() {
                    this.igadget.setMinimizeStatus(false);
                    this.igadget.layout.dragboard.raiseToTop(this.igadget);
                    LayoutManagerFactory.getInstance().hideCover();
                }.bind(context), i)
        }
    } else {
        menu.addOption(null, gettext("No Floating Gadgets"), function(){}, 0)
    }
}
