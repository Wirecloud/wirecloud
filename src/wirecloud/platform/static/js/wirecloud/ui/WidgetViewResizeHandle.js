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

/* globals StyledElements, Wirecloud */


(function () {

    "use strict";

    var WidgetViewResizeHandle = function WidgetViewResizeHandle(widget, options) {
        if (options == null) {
            options = {};
        }
        options.resizeLeftSide = !!options.resizeLeftSide;
        options.resizeTopSide = !!options.resizeTopSide;
        options.fixHeight = !!options.fixHeight;
        options.fixWidth = !!options.fixWidth;
        options.widget = widget;

        if (options.fixWidth && options.fixHeight) {
            throw new Error('fixWidth and fixHeight cannot be true at the same time');
        }

        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement('div');

        Wirecloud.ui.ResizeHandle.call(this, widget.wrapperElement, this.wrapperElement,
                                options,
                                WidgetViewResizeHandle.prototype.ondragstart,
                                WidgetViewResizeHandle.prototype.ondrag,
                                WidgetViewResizeHandle.prototype.ondragend,
                                WidgetViewResizeHandle.prototype.canDrag);
    };
    WidgetViewResizeHandle.prototype = new StyledElements.StyledElement();

    WidgetViewResizeHandle.prototype.canDrag = function canDrag(resizableElement, data) {
        return data.widget.model.isAllowed('resize');
    };

    WidgetViewResizeHandle.prototype.ondragstart = function ondragstart(resizableElement, handleElement, data) {
        handleElement.classList.add("inUse");
        data.widget.wrapperElement.classList.add('dragging');

        // TODO merge with iwidget minimum sizes
        data.minWidth = Math.ceil(data.widget.layout.fromPixelsToHCells(80));
        data.minHeight = Math.ceil(data.widget.layout.fromPixelsToVCells(50));
        data.innitialWidth = data.widget.shape.width;
        data.innitialHeight = data.widget.shape.height;
        data.oldZIndex = data.widget.position.z;
        data.widget.setPosition({z: "999999"});
        data.dragboard = data.widget.layout.dragboard;
    };

    WidgetViewResizeHandle.prototype.ondrag = function ondrag(resizableElement, handleElement, data, x, y) {
        var widget = data.widget;

        // Skip if the mouse is outside the dragboard
        if (widget.layout.isInside(x, y)) {
            var position = widget.layout.getCellAt(x, y);
            var currentPosition = widget.position;
            var width, height;

            if (!data.fixWidth) {
                if (data.resizeLeftSide) {
                    width = currentPosition.x + widget.shape.width - position.x;
                } else {
                    width = position.x - currentPosition.x + 1;
                }
            } else {
                width = widget.shape.width;
            }

            if (!data.fixHeight) {
                height = position.y - currentPosition.y + 1;
            } else {
                height = widget.shape.height;
            }

            // Minimum width
            if (width < data.minWidth) {
                width = data.minWidth;
            }

            // Minimum height
            if (height < data.minHeight) {
                height = data.minHeight;
            }

            if (width !== widget.shape.width || height !== widget.shape.height) {
                widget.setShape({width: width, height: height}, data.resizeLeftSide);
            }
        }
    };

    WidgetViewResizeHandle.prototype.ondragend = function ondragend(resizableElement, handleElement, data) {
        var widget = data.widget;
        data.widget.wrapperElement.classList.remove('dragging');
        data.widget.setPosition({z: data.oldZIndex});
        if (data.innitialWidth !== data.widget.shape.width || data.innitialHeight !== data.widget.shape.height) {
            widget.setShape({width: widget.shape.width, height: widget.shape.height}, data.resizeLeftSide, true);
        }
        handleElement.classList.remove("inUse");

        // This is needed to check if the scrollbar status has changed (visible/hidden)
        data.dragboard._notifyWindowResizeEvent();
    };

    Wirecloud.ui.WidgetViewResizeHandle = WidgetViewResizeHandle;

})();
