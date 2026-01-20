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

    const setPosition = function setPosition(position, layoutConfig, offset, screenWidth, options) {
        delete options.left;
        delete options.top;
        delete options.right;
        delete options.bottom;

        switch (position) {
        case "top-right":
            layoutConfig.left = offset.x + options.refposition.left - this.dragboard.leftMargin;
            layoutConfig.top = offset.y + options.refposition.top - this.dragboard.topMargin - layoutConfig.height;
            break;
        case "top-left":
            layoutConfig.left = offset.x + options.refposition.right - this.dragboard.leftMargin - this.getWidthInPixels(layoutConfig.width, screenWidth);
            layoutConfig.top = offset.y + options.refposition.top - this.dragboard.topMargin - layoutConfig.height;
            break;
        case "bottom-right":
            layoutConfig.left = offset.x + options.refposition.left - this.dragboard.leftMargin;
            layoutConfig.top = offset.y + options.refposition.bottom - this.dragboard.topMargin;
            break;
        case "bottom-left":
            layoutConfig.left = offset.x + options.refposition.right - this.dragboard.leftMargin - this.getWidthInPixels(layoutConfig.width, screenWidth);
            layoutConfig.top = offset.y + options.refposition.bottom - this.dragboard.topMargin;
            break;
        }
    };

    const standsOut = function standsOut(options, screenWidth) {
        const width_in_pixels = this.getWidthInPixels(options.width, screenWidth);
        const height_in_pixels = options.height;

        const visible_width = width_in_pixels - Math.max(options.left + width_in_pixels - this.getWidth(), 0) - Math.max(-options.left, 0);
        const visible_height = height_in_pixels - Math.max(options.top + height_in_pixels - this.getHeight(), 0) - Math.max(-options.top, 0);
        const element_area = width_in_pixels * height_in_pixels;
        const visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    /**
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * This dragobard uses percentages for horizontal units and px for vertical units.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    ns.FreeLayout = class FreeLayout extends ns.DragboardLayout {

        constructor(dragboard) {
            super(dragboard);
            this.initialized = false;
            this.iwidgetToMove = null;
        }

        fromPixelsToVCells(pixels) {
            return (pixels * this.MAX_HLU / this.getHeight());
        }

        fromVCellsToPixels(cells) {
            return Math.round((this.getHeight() * cells) / this.MAX_HLU);
        }

        getWidthInPixels(cells, width) {
            return this.fromHCellsToPixels(cells, width);
        }

        getHeightInPixels(cells) {
            return this.fromVCellsToPixels(cells);
        }

        fromPixelsToHCells(pixels, width) {
            return (pixels * this.MAX_HLU / (width || this.getWidth()));
        }

        fromHCellsToPixels(cells, width) {
            return Math.round(((width || this.getWidth()) * cells) / this.MAX_HLU);
        }

        getColumnOffset(position, width, css) {
            const margin = position.anchor.endsWith("left") ? this.dragboard.leftMargin : this.dragboard.rightMargin;
            if (css) {
                if (position.relx) {
                    const percentage = position.x / this.MAX_HLU_PERCENTAGE;
                    return "calc(" + percentage + "% + " + (margin - (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100)) + "px)";
                } else {
                    return (margin + position.x) + "px";
                }
            } else {
                return margin + (position.relx ? this.fromHCellsToPixels(position.x, width) : position.x);
            }
        }

        getRowOffset(position, css) {
            const margin = position.anchor.startsWith("bottom") ? this.dragboard.bottomMargin : this.dragboard.topMargin;
            if (css) {
                if (position.rely) {
                    const percentage = position.y / this. MAX_HLU_PERCENTAGE;
                    return "calc(" + percentage + "% + " + (margin - (percentage * (this.dragboard.topMargin + this.dragboard.bottomMargin) / 100)) + "px)";
                } else {
                    return (margin + position.y) + "px";
                }
            } else {
                return margin + (position.rely ? this.fromVCellsToPixels(position.y) : position.y);
            }
        }

        adaptColumnOffset(size, width) {
            let offsetInLU, pixels;

            const parsedSize = this.parseSize(size);
            if (parsedSize[1] === 'cells') {
                offsetInLU = Math.round(parsedSize[0]);
            } else {
                if (parsedSize[1] === '%') {
                    pixels = Math.round((parsedSize[0] * (width || this.getWidth())) / 100);
                } else {
                    pixels = parsedSize[0] < this.dragboard.leftMargin ? 0 : parsedSize[0] - this.dragboard.leftMargin;
                }
                offsetInLU = Math.round(this.fromPixelsToHCells(pixels, width));
            }
            const offsetInPixels = this.fromHCellsToPixels(offsetInLU, width);
            return new Wirecloud.ui.MultiValuedSize(offsetInPixels, offsetInLU);
        }

        adaptRowOffset(size) {
            let newsize = this.adaptHeight(size).inPixels;
            newsize = newsize >= this.dragboard.topMargin ? newsize - this.dragboard.topMargin : 0;
            const offsetLU = Math.round(this.fromPixelsToVCells(newsize));
            return new Wirecloud.ui.MultiValuedSize(newsize, offsetLU);
        }

        adaptHeight(size) {
            let pixels;

            const parsedSize = this.parseSize(size);
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
            const heightLU = Math.round(this.fromPixelsToVCells(pixels));
            return new Wirecloud.ui.MultiValuedSize(pixels, heightLU);
        }

        _notifyWindowResizeEvent(widthChanged, heightChanged) {
            if (widthChanged) {
                Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
            }
        }

        _notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist) {
            const position = {};
            if (
                (resizeLeftSide && widget.position.anchor.endsWith("left"))
                || (!resizeLeftSide && widget.position.anchor.endsWith("right"))
            ) {
                const widthDiff = newWidth - oldWidth;
                if (widthDiff !== 0) {
                    position.x = widget.position.x - widthDiff;
                }
            } else if (resizeLeftSide && widget.position.anchor.endsWith("center")) {
                const widthDiff = newWidth - oldWidth;
                if (widthDiff !== 0) {
                    position.x = widget.position.x - widthDiff / 2;
                }
            }

            if (
                (resizeTopSide && widget.position.anchor.startsWith("top"))
                || (!resizeTopSide && widget.position.anchor.startsWith("bottom"))
            ) {
                const heightDiff = newHeight - oldHeight;
                if (heightDiff !== 0) {
                    position.y = widget.position.y - heightDiff;
                }
            }

            if (Object.keys(position).length > 0) {
                widget.setPosition(position).repaint();
            }

            if (persist) {
                // Save new position into persistence
                this.dragboard.update([widget.id]);
            }
        }

        initialize() {
            for (const widget of Object.values(this.widgets)) {
                widget.repaint();
            }

            this.initialized = true;

            return false;
        }

        /**
         * Calculate what cell is at a given position in pixels
         */
        getCellAt(x, y) {
            return new Wirecloud.DragboardPosition(((x - this.dragboard.leftMargin) * this.MAX_HLU) / this.getWidth(), y - this.dragboard.topMargin);
        }

        addWidget(iWidget, affectsDragboard) {
            Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, iWidget, affectsDragboard);

            if (!this.initialized) {
                return;
            }

            this._adaptIWidget(iWidget);

            return new Set();
        }

        initializeMove(widget, draggable) {
            let msg;

            if (widget == null || !(widget instanceof Wirecloud.ui.WidgetView)) {
                throw new TypeError("widget must be an WidgetView instance");
            }

            // Check for pendings moves
            if (this.iwidgetToMove !== null) {
                msg = "Dragboard: There was a pending move that was cancelled because initializedMove function was called before it was finished.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                this.cancelMove();
            }

            this.iwidgetToMove = widget;
            this.newPosition = {
                x: widget.wrapperElement.offsetLeft,
                y: widget.wrapperElement.offsetTop
            };

            draggable.setXOffset(0).setYOffset(0);
        }

        moveTemporally(x, y) {
            if (this.iwidgetToMove == null) {
                const msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            if (y < 0) {
                y = 0;
            }
            if (x < 0) {
                x = 0;
            } else {
                const maxX = this.MAX_HLU - this.iwidgetToMove.shape.width;
                if (x > maxX) {
                    x = maxX;
                }
            }

            this.newPosition.x = x;
            this.newPosition.y = y;
        }

        acceptMove() {
            if (this.iwidgetToMove == null) {
                const msg = "Dragboard: Function acceptMove called when there is not an started iwidget move.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            // Y coordinate
            if (["bottom-center", "bottom-left", "bottom-right"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
                this.newPosition.y = this.getHeight() - this.iwidgetToMove.wrapperElement.offsetHeight - this.newPosition.y;
            }
            if (this.iwidgetToMove.position.rely) {
                this.newPosition.y = this.adaptRowOffset(this.newPosition.y + 'px').inLU;
            } else if (this.iwidgetToMove.position.anchor.startsWith("bottom")) {
                this.newPosition.y += this.dragboard.topMargin;
            } else {
                this.newPosition.y -= this.dragboard.topMargin;
            }

            // X coordinate
            if (["bottom-center", "top-center"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
                this.newPosition.x += (this.iwidgetToMove.shape.relwidth ? this.getWidthInPixels(this.iwidgetToMove.shape.width) : this.iwidgetToMove.shape.width) / 2;
            } else if (["bottom-right", "top-right"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
                this.newPosition.x = this.getWidth() - this.iwidgetToMove.wrapperElement.offsetWidth - this.newPosition.x;
            }
            if (this.iwidgetToMove.position.relx) {
                this.newPosition.x = this.adaptColumnOffset(this.newPosition.x + 'px').inLU;
            } else if (this.iwidgetToMove.position.anchor.endsWith("right")) {
                this.newPosition.x += this.dragboard.leftMargin;
            } else {
                this.newPosition.x -= this.dragboard.leftMargin;
            }
            this.iwidgetToMove.setPosition(this.newPosition);
            this.dragboard.update([this.iwidgetToMove.id]);

            this.iwidgetToMove = null;
            this.newPosition = null;
        }

        updatePosition(widget, element) {
            switch (widget.position.anchor) {
            case "top-left":
            case "top-right":
            case "top-center":
                element.style.top = this.getRowOffset(widget.position, true);
                element.style.bottom = "";
                break;
            case "bottom-left":
            case "bottom-right":
            case "bottom-center":
                element.style.top = "";
                element.style.bottom = this.getRowOffset(widget.position, true);
                break;
            }

            switch (widget.position.anchor) {
            case "top-right":
            case "bottom-right":
                element.style.left = "";
                element.style.right = this.getColumnOffset(widget.position, null, true);
                element.style.marginLeft = "";
                break;
            case "top-left":
            case "bottom-left":
                element.style.left = this.getColumnOffset(widget.position, null, true);
                element.style.right = "";
                element.style.marginLeft = "";
                break;
            case "top-center":
            case "bottom-center":
                element.style.left = this.getColumnOffset(widget.position, null, true);
                element.style.right = "";
                if (widget.shape.relwidth) {
                    const percentage = widget.shape.width / 2 / this.MAX_HLU_PERCENTAGE;
                    element.style.marginLeft = "calc(-" + percentage + '% + ' + (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100) + 'px)';
                } else {
                    element.style.marginLeft = '-' + (widget.shape.width / 2) + 'px';
                }

                break;
            }

            return this;
        }

        updateShape(widget, element) {
            if (widget.shape.relwidth) {
                const percentage = widget.shape.width / this.MAX_HLU_PERCENTAGE;
                element.style.width = "calc(" + percentage + '% - ' + (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100) + 'px)';
            } else {
                element.style.width = widget.shape.width + 'px';
            }
            if (widget.minimized) {
                element.style.height = "";
            } else if (widget.shape.relheight) {
                const percentage = widget.shape.height / this.MAX_HLU_PERCENTAGE;
                element.style.height = "calc(" + percentage + '% - ' + (percentage * (this.dragboard.topMargin + this.dragboard.bottomMargin) / 100) + 'px)';
            } else {
                element.style.height = widget.shape.height + 'px';
            }

            return this;
        }

        cancelMove() {
            if (this.iwidgetToMove == null) {
                const msg = "Trying to cancel an inexistant temporal move.";
                Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
                return;
            }

            // We have only update the CSS of the widget but not the position attribute
            // Repaint it using the initial position
            this.iwidgetToMove.repaint();
            this.iwidgetToMove = null;
            this.newPosition = null;
        }

        searchBestPosition(options, layoutConfig, screenWidth) {
            let offset = {x: 0, y: 0};
            if (options.refiframe != null) {
                offset = Wirecloud.Utils.getRelativePosition(options.refiframe, this.dragboard.tab.wrapperElement);
            }

            const weights = [];

            const placements = ["bottom-right", "bottom-left", "top-right", "top-left"];
            let i = 0;
            do {
                setPosition.call(this, placements[i], layoutConfig, offset, screenWidth, options);
                weights.push(standsOut.call(this, layoutConfig, screenWidth));
                i += 1;
            } while (weights[i - 1] > 0 && i < placements.length);

            if (weights[i - 1] > 0) {
                const best_weight = Math.min.apply(Math, weights);
                const index = weights.indexOf(best_weight);
                const placement = placements[index];
                setPosition.call(this, placement, layoutConfig, offset, screenWidth, options);

                layoutConfig.top = this.adaptRowOffset(layoutConfig.top + "px").inPixels;
                layoutConfig.left = this.adaptColumnOffset(layoutConfig.left + "px", screenWidth).inLU;

                if (layoutConfig.left + layoutConfig.width >= this.MAX_HLU) {
                    layoutConfig.width -= layoutConfig.left + layoutConfig.width - this.MAX_HLU;
                }
            } else {
                layoutConfig.top = this.adaptRowOffset(layoutConfig.top + "px").inPixels;
                layoutConfig.left = this.adaptColumnOffset(layoutConfig.left + "px", screenWidth).inLU;
            }
        }

    }

    ns.FreeLayout.prototype.MAX_HLU = 1000000;
    ns.FreeLayout.prototype.MAX_HLU_PERCENTAGE = 10000;

})(Wirecloud.ui, Wirecloud.Utils);
