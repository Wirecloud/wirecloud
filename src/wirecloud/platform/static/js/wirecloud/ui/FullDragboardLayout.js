/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    /**
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    ns.FullDragboardLayout = class FullDragboardLayout extends ns.DragboardLayout {

        constructor(dragboard, scrollbarSpace) {
            super(dragboard, scrollbarSpace);
            this.initialized = false;
        }

        fromPixelsToVCells(pixels) {
            return 1;
        }

        fromVCellsToPixels(cells) {
            return this.getHeight();
        }

        getWidthInPixels(cells) {
            return null;
        }

        getHeightInPixels(cells) {
            return null;
        }

        fromPixelsToHCells(pixels) {
            return 1;
        }

        fromHCellsToPixels(cells) {
            return this.getWidth();
        }

        getColumnOffset(position, width) {
            return 0;
        }

        getRowOffset(position) {
            return 0;
        }

        adaptColumnOffset(size) {
            return new Wirecloud.ui.MultiValuedSize(this.dragboard.tab.wrapperElement.getBoundingClientRect().left, 0);
        }

        adaptRowOffset(size) {
            return new Wirecloud.ui.MultiValuedSize(this.dragboard.tab.wrapperElement.getBoundingClientRect().top, 0);
        }

        adaptHeight(size) {
            return new Wirecloud.ui.MultiValuedSize(this.getHeight(), 1);
        }

        adaptWidth(size, width) {
            return new Wirecloud.ui.MultiValuedSize(width || this.getWidth(), 1);
        }

        initialize() {
            var iWidget, key;

            // Insert iwidgets
            for (key in this.iWidgets) {
                iWidget = this.iWidgets[key];
                iWidget.paint(true);
            }

            this.initialized = true;
        }

        /**
         * Calculate what cell is at a given position in pixels
         */
        getCellAt(x, y) {
            return new Wirecloud.DragboardPosition(0, 0);
        }

        addWidget(iWidget, affectsDragboard) {
            iWidget.wrapperElement.classList.add('wc-widget-fulldragboard');

            super.addWidget(iWidget, affectsDragboard);

            if (!this.initialized) {
                return new Set();
            }

            iWidget.setPosition(new Wirecloud.DragboardPosition(0, 0), false);
            return new Set();
        }

        removeWidget(iWidget, affectsDragboard) {
            iWidget.wrapperElement.classList.remove('wc-widget-fulldragboard');

            return super.removeWidget(iWidget, affectsDragboard);
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
