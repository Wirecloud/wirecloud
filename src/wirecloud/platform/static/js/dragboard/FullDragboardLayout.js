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

/*global gettext, IWidget, Wirecloud */

(function () {

    "use strict";

    /**
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    var FullDragboardLayout = function FullDragboardLayout(dragboard, scrollbarSpace) {
        if (arguments.length === 0) {
            return; // Allow empty constructor (allowing hierarchy)
        }

        this.initialized = false;
        Wirecloud.ui.DragboardLayout.call(this, dragboard, scrollbarSpace);
    };
    FullDragboardLayout.prototype = new Wirecloud.ui.DragboardLayout();

    FullDragboardLayout.prototype.fromPixelsToVCells = function fromPixelsToVCells(pixels) {
        return 1;
    };

    FullDragboardLayout.prototype.fromVCellsToPixels = function fromVCellsToPixels(cells) {
        return this.getHeight();
    };

    FullDragboardLayout.prototype.getWidthInPixels = function getWidthInPixels(cells) {
        return this.getWidth();
    };

    FullDragboardLayout.prototype.getHeightInPixels = function getHeightInPixels(cells) {
        return this.getHeight();
    };

    FullDragboardLayout.prototype.fromPixelsToHCells = function fromPixelsToHCells(pixels) {
        return 1;
    };

    FullDragboardLayout.prototype.fromHCellsToPixels = function fromHCellsToPixels(cells) {
        return this.getWidth();
    };

    FullDragboardLayout.prototype.fromHCellsToPercentage = function fromHCellsToPercentage(cells) {
        return this.getHeight();
    };

    FullDragboardLayout.prototype.getColumnOffset = function getColumnOffset(column) {
        return this.dragboard.dragboardElement.getBoundingClientRect().left;
    };

    FullDragboardLayout.prototype.getRowOffset = function getRowOffset(row) {
        return this.dragboard.dragboardElement.getBoundingClientRect().top;
    };

    FullDragboardLayout.prototype.adaptColumnOffset = function adaptColumnOffset(pixels) {
        return new Wirecloud.ui.MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().left, 0);
    };

    FullDragboardLayout.prototype.adaptRowOffset = function adaptRowOffset(pixels) {
        return new Wirecloud.ui.MultiValuedSize(this.dragboard.dragboardElement.getBoundingClientRect().top, 0);
    };

    FullDragboardLayout.prototype.adaptHeight = function adaptHeight(contentHeight, fullSize, oldLayout) {
        var diff = fullSize - contentHeight;
        return new Wirecloud.ui.MultiValuedSize(contentHeight - diff, 1);
    };

    FullDragboardLayout.prototype.adaptWidth = function adaptWidth(contentWidth, fullSize) {
        return new Wirecloud.ui.MultiValuedSize(this.getWidth(), 1);
    };

    FullDragboardLayout.prototype.initialize = function initialize() {
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
    FullDragboardLayout.prototype.getCellAt = function getCellAt(x, y) {
        return new Wirecloud.DragboardPosition(0, 0);
    };

    FullDragboardLayout.prototype.addIWidget = function addIWidget(iWidget, affectsDragboard) {
        iWidget.element.classList.add('fulldragboard');

        Wirecloud.ui.DragboardLayout.prototype.addIWidget.call(this, iWidget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        iWidget.setPosition(new Wirecloud.DragboardPosition(0, 0));
    };

    FullDragboardLayout.prototype.removeIWidget = function removeIWidget(iWidget, affectsDragboard) {
        iWidget.element.classList.remove('fulldragboard');

        Wirecloud.ui.DragboardLayout.prototype.removeIWidget.call(this, iWidget, affectsDragboard);
    };


    FullDragboardLayout.prototype.initializeMove = function initializeMove(iwidget, draggable) {
        // Check for pendings moves
        if (this.iwidgetToMove !== null) {
            var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.");
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            this.cancelMove();
        }

        this.iwidgetToMove = iwidget;
    };

    FullDragboardLayout.prototype.moveTemporally = function moveTemporally(x, y) {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }
    };

    FullDragboardLayout.prototype.acceptMove = function acceptMove() {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Function acceptMove called when there is not an started iwidget move.");
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        this.iwidgetToMove = null;
    };

    FullDragboardLayout.prototype.cancelMove = function cancelMove() {
        if (!(this.iwidgetToMove instanceof IWidget)) {
            var msg = gettext("Trying to cancel an inexistant temporal move.");
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        this.iwidgetToMove._notifyWindowResizeEvent();
        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    window.FullDragboardLayout = FullDragboardLayout;

})();
