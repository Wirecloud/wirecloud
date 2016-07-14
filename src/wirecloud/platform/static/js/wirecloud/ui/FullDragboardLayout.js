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
        return this.dragboard.tab.wrapperElement.getBoundingClientRect().left + this.dragboardLeftMargin;
    };

    FullDragboardLayout.prototype.getRowOffset = function getRowOffset(row) {
        return this.dragboard.tab.wrapperElement.getBoundingClientRect().top;
    };

    FullDragboardLayout.prototype.adaptColumnOffset = function adaptColumnOffset(size) {
        return new Wirecloud.ui.MultiValuedSize(this.dragboard.tab.wrapperElement.getBoundingClientRect().left, 0);
    };

    FullDragboardLayout.prototype.adaptRowOffset = function adaptRowOffset(size) {
        return new Wirecloud.ui.MultiValuedSize(this.dragboard.tab.wrapperElement.getBoundingClientRect().top, 0);
    };

    FullDragboardLayout.prototype.adaptHeight = function adaptHeight(size) {
        return new Wirecloud.ui.MultiValuedSize(this.getHeight(), 1);
    };

    FullDragboardLayout.prototype.adaptWidth = function adaptWidth(size) {
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

    FullDragboardLayout.prototype.addWidget = function addWidget(iWidget, affectsDragboard) {
        iWidget.wrapperElement.classList.add('wc-widget-fulldragboard');

        Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, iWidget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        iWidget.setPosition(new Wirecloud.DragboardPosition(0, 0));
    };

    FullDragboardLayout.prototype.removeWidget = function removeWidget(iWidget, affectsDragboard) {
        iWidget.wrapperElement.classList.remove('wc-widget-fulldragboard');

        Wirecloud.ui.DragboardLayout.prototype.removeWidget.call(this, iWidget, affectsDragboard);
    };

    Wirecloud.ui.FullDragboardLayout = FullDragboardLayout;

})();
