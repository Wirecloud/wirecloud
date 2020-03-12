/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    var FullDragboardLayout = function FullDragboardLayout(dragboard, scrollbarSpace) {
        this.initialized = false;
        Wirecloud.ui.DragboardLayout.call(this, dragboard, scrollbarSpace);
    };
    utils.inherit(FullDragboardLayout, Wirecloud.ui.DragboardLayout);

    FullDragboardLayout.prototype.fromPixelsToVCells = function fromPixelsToVCells(pixels) {
        return 1;
    };

    FullDragboardLayout.prototype.fromVCellsToPixels = function fromVCellsToPixels(cells) {
        return this.getHeight();
    };

    FullDragboardLayout.prototype.getWidthInPixels = function getWidthInPixels(cells) {
        return null;
    };

    FullDragboardLayout.prototype.getHeightInPixels = function getHeightInPixels(cells) {
        return null;
    };

    FullDragboardLayout.prototype.fromPixelsToHCells = function fromPixelsToHCells(pixels) {
        return 1;
    };

    FullDragboardLayout.prototype.fromHCellsToPixels = function fromHCellsToPixels(cells) {
        return this.getWidth();
    };

    FullDragboardLayout.prototype.getColumnOffset = function getColumnOffset(position) {
        return 0;
    };

    FullDragboardLayout.prototype.getRowOffset = function getRowOffset(position) {
        return 0;
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
            return new Set();
        }

        iWidget.setPosition(new Wirecloud.DragboardPosition(0, 0));
        return new Set();
    };

    FullDragboardLayout.prototype.removeWidget = function removeWidget(iWidget, affectsDragboard) {
        iWidget.wrapperElement.classList.remove('wc-widget-fulldragboard');

        return Wirecloud.ui.DragboardLayout.prototype.removeWidget.call(this, iWidget, affectsDragboard);
    };

    Wirecloud.ui.FullDragboardLayout = FullDragboardLayout;

})(Wirecloud.Utils);
