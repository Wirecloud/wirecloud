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
     * This dragobard uses percentages for horizontal units and px for vertical units.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    var FreeLayout = function FreeLayout(dragboard) {
        this.initialized = false;
        this.iwidgetToMove = null;
        Wirecloud.ui.DragboardLayout.call(this, dragboard);
    };
    utils.inherit(FreeLayout, Wirecloud.ui.DragboardLayout);

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
        return this.adaptHeight(size);
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

    FreeLayout.prototype._notifyResizeEvent = function _notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
        if (resizeLeftSide) {
            var widthDiff = newWidth - oldWidth;
            if (widthDiff !== 0) {
                var position = widget.position;
                position.x -= widthDiff;

                widget.setPosition(position);
                widget.repaint();
            }
        }

        if (persist) {
            // Save new position into persistence
            this.dragboard.update([widget.id]);
        }
    };

    FreeLayout.prototype.initialize = function initialize() {
        for (const widget of Object.values(this.widgets)) {
            widget.repaint();
        }

        this.initialized = true;

        return false;
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

        return new Set();
    };

    FreeLayout.prototype.initializeMove = function initializeMove(widget, draggable) {
        var msg;

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
        this.newPosition = widget.position;

        draggable.setXOffset(0).setYOffset(0);
    };

    FreeLayout.prototype.moveTemporally = function moveTemporally(x, y) {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        if (y < 0) {
            y = 0;
        }
        if (x < 0) {
            x = 0;
        } else {
            var maxX = this.MAX_HLU - this.iwidgetToMove.shape.width;
            if (x > maxX) {
                x = maxX;
            }
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

        // Y coordinate
        if (this.iwidgetToMove.position.rely) {
            this.newPosition.y -= this.dragboardTopMargin - 1;
        }
        if (["bottomcenter", "bottomleft", "bottomright"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.y = this.getHeight() - this.iwidgetToMove.shape.height - this.newPosition.y;
        }
        if (this.iwidgetToMove.position.rely) {
            this.newPosition.y = this.adaptRowOffset(this.newPosition.y + 'px').inLU;
        }

        // X coordinate
        if (this.iwidgetToMove.position.relx) {
            this.newPosition.x -= this.dragboardTopMargin - 1;
        }
        if (["bottomcenter", "topcenter"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.x += this.iwidgetToMove.shape.width / 2;
        } else if (["bottomright", "topright"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.x = this.getWidth() - this.iwidgetToMove.shape.width - this.newPosition.x;
        }
        if (this.iwidgetToMove.position.relx) {
            this.newPosition.x = this.adaptColumnOffset(this.newPosition.x + 'px').inLU;
        }
        this.iwidgetToMove.setPosition(this.newPosition);
        this.dragboard.update([this.iwidgetToMove.id]);

        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    FreeLayout.prototype.updatePosition = function updatePosition(widget, element) {
        switch (widget.position.anchor) {
        case "topleft":
        case "topright":
        case "topcenter":
            element.style.top = (widget.position.rely ? this.getRowOffset(widget.position.y) : widget.position.y) + "px";
            element.style.bottom = "";
            break;
        case "bottomleft":
        case "bottomright":
        case "bottomcenter":
            element.style.top = "";
            element.style.bottom = (widget.position.rely ? this.getRowOffset(widget.position.y) : widget.position.y) + "px";
            break;
        }

        switch (widget.position.anchor) {
        case "topright":
        case "bottomright":
            element.style.left = "";
            element.style.right = (widget.position.relx ? this.getColumnOffset(widget.position.x) : widget.position.x) + "px";
            element.style.marginLeft = "";
            break;
        case "topleft":
        case "bottomleft":
            element.style.left = (widget.position.relx ? this.getColumnOffset(widget.position.x) : widget.position.x) + "px";
            element.style.right = "";
            element.style.marginLeft = "";
            break;
        case "topcenter":
        case "bottomcenter":
            if (widget.position.relx) {
                element.style.left = (widget.position.x / 10000) + "%";
            } else {
                element.style.left = widget.position.x + "%";
            }
            element.style.right = "";
            if (widget.shape.relwidth) {
                element.style.marginLeft = '-' + (widget.shape.width / 2) + '%';
            } else {
                element.style.marginLeft = '-' + (widget.shape.width / 2) + 'px';
            }

            break;
        }
    };

    FreeLayout.prototype.updateShape = function updateShape(widget, element) {
        if (widget.shape.relwidth) {
            element.style.width = (widget.shape.width / 10000) + '%';
        } else {
            element.style.width = widget.shape.width + 'px';
        }
        element.style.height = widget.minimized ? "" : widget.shape.height + 'px';
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

    const setPosition = function setPosition(position, options, offset) {
        delete options.left;
        delete options.top;
        delete options.right;
        delete options.bottom;

        switch (position) {
        case "top-right":
            options.left = offset.x + options.refposition.left - this.dragboardLeftMargin;
            options.top = offset.y + options.refposition.top - this.dragboardTopMargin - this.getHeightInPixels(options.height);
            break;
        case "top-left":
            options.left = offset.x + options.refposition.right - this.dragboardLeftMargin - this.getWidthInPixels(options.width);
            options.top = offset.y + options.refposition.top - this.dragboardTopMargin - this.getHeightInPixels(options.height);
            break;
        case "bottom-right":
            options.left = offset.x + options.refposition.left - this.dragboardLeftMargin;
            options.top = offset.y + options.refposition.bottom - this.dragboardTopMargin;
            break;
        case "bottom-left":
            options.left = offset.x + options.refposition.right - this.dragboardLeftMargin - this.getWidthInPixels(options.width);
            options.top = offset.y + options.refposition.bottom - this.dragboardTopMargin;
            break;
        }
    };

    const standsOut = function standsOut(options) {
        var width_in_pixels = this.getWidthInPixels(options.width);
        var height_in_pixels = this.getHeightInPixels(options.height);

        var visible_width = width_in_pixels - Math.max(options.left + width_in_pixels - this.getWidth(), 0) - Math.max(-options.left, 0);
        var visible_height = height_in_pixels - Math.max(options.top + height_in_pixels - this.getHeight(), 0) - Math.max(-options.top, 0);
        var element_area = width_in_pixels * height_in_pixels;
        var visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    FreeLayout.prototype.searchBestPosition = function searchBestPosition(options) {
        var offset = {x: 0, y: 0};
        if (options.refiframe != null) {
            offset = Wirecloud.Utils.getRelativePosition(options.refiframe, this.dragboard.tab.wrapperElement);
        }

        var i = 0, weights = [];

        var placements = ["bottom-right", "bottom-left", "top-right", "top-left"];
        do {
            setPosition.call(this, placements[i], options, offset);
            weights.push(standsOut.call(this, options));
            i += 1;
        } while (weights[i - 1] > 0 && i < placements.length);

        if (weights[i - 1] > 0) {
            let best_weight = Math.min.apply(Math, weights);
            let index = weights.indexOf(best_weight);
            let placement = placements[index];
            setPosition.call(this, placement, options, offset);

            options.top = this.adaptRowOffset(options.top + "px").inLU;
            options.left = this.adaptColumnOffset(options.left + "px").inLU;

            if (options.top < 0) {
                options.height += options.top;
                options.top = 0;
            }

            if (options.left < 0) {
                options.width += options.left;
                options.left = 0;
            }

            if (options.left + options.width >= this.MAX_HLU) {
                options.width -= options.left + options.width - this.MAX_HLU;
            }
        } else {
            options.top = this.adaptRowOffset(options.top + "px").inLU;
            options.left = this.adaptColumnOffset(options.left + "px").inLU;
        }
    };

    Wirecloud.ui.FreeLayout = FreeLayout;

})(Wirecloud.Utils);
