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
// FullDragboard
/////////////////////////////////////

/**
 * @class Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * This dragobard uses percentages for horizontal units and px for vertical units.
 *
 * @extends DragboardLayout
 */
function FullDragboardLayout(dragboard, scrollbarSpace) {
    if (arguments.length == 0)
        return; // Allow empty constructor (allowing hierarchy)

    this.initialized = false;
    DragboardLayout.call(this, dragboard, scrollbarSpace);
}

FullDragboardLayout.prototype = new DragboardLayout();

FullDragboardLayout.prototype.fromPixelsToVCells = function(pixels) {
    return 1;
}

FullDragboardLayout.prototype.fromVCellsToPixels = function(cells) {
    return this.getHeight();
}

FullDragboardLayout.prototype.getWidthInPixels = function (cells) {
    return this.getWidth();
}

FullDragboardLayout.prototype.getHeightInPixels = function (cells) {
    return this.getHeight();
}

FullDragboardLayout.prototype.fromPixelsToHCells = function(pixels) {
    return 1;
}

FullDragboardLayout.prototype.fromHCellsToPixels = function(cells) {
    return this.getWidth();
}

FullDragboardLayout.prototype.fromHCellsToPercentage = function(cells) {
    return this.getHeight();
}

FullDragboardLayout.prototype.getColumnOffset = function(column) {
    return this.dragboard.dragboardElement.getBoundingClientRect().left;
}

FullDragboardLayout.prototype.getRowOffset = function(row) {
    return this.dragboard.dragboardElement.getBoundingClientRect().top;
}

FullDragboardLayout.prototype.adaptColumnOffset = function(pixels) {
    return new MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().left, 0);
}

FullDragboardLayout.prototype.adaptRowOffset = function(pixels) {
    return new MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().top, 0);
}

FullDragboardLayout.prototype.adaptHeight = function(contentHeight, fullSize) {
    var diff = fullSize - contentHeight;
    return new MultiValuedSize(contentHeight - diff, 1);
}

FullDragboardLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
    return new MultiValuedSize(this.getWidth(), 1);
}

FullDragboardLayout.prototype.initialize = function () {
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
FullDragboardLayout.prototype.getCellAt = function (x, y) {
    return new DragboardPosition(0, 0);
}

FullDragboardLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
    iGadget.element.addClassName('fulldragboard');

    DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

    if (!this.initialized)
        return;

    iGadget.setPosition(new DragboardPosition(0, 0));
}

FullDragboardLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
    iGadget.element.removeClassName('fulldragboard');

    DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
}


FullDragboardLayout.prototype.initializeMove = function(igadget, draggable) {
    // Check for pendings moves
    if (this.igadgetToMove != null) {
        var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.")
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        this.cancelMove();
    }

    this.igadgetToMove = igadget;
}

FullDragboardLayout.prototype.moveTemporally = function(x, y) {
    if (this.igadgetToMove == null) {
        var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }
}

FullDragboardLayout.prototype.acceptMove = function() {
    if (this.igadgetToMove == null) {
        var msg = gettext("Function acceptMove called when there is not an started igadget move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.igadgetToMove = null;
}

FullDragboardLayout.prototype.cancelMove = function() {
    if (this.igadgetToMove == null) {
        var msg = gettext("Trying to cancel an inexistant temporal move.");
        LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
        return;
    }

    this.igadgetToMove._notifyWindowResizeEvent();
    this.igadgetToMove = null;
    this.newPosition = null;
}

FullDragboardLayout.prototype._notifyDragboardVisibilityChange = function(visibility) {
    // Notify each igadget
    var iGadget;
    var igadgetKeys = this.iGadgets.keys();
    if (visibility) {
        for (var i = 0; i < igadgetKeys.length; i++) {
            iGadget = this.iGadgets[igadgetKeys[i]];
            iGadget.element.style.position = '';
        }
    } else {
        for (var i = 0; i < igadgetKeys.length; i++) {
            iGadget = this.iGadgets[igadgetKeys[i]];
            iGadget.element.style.position = 'absolute';
        }
    }
}
