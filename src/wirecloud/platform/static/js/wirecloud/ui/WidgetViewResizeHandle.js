/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, se, utils) {

    "use strict";

    const MIN_WIDTH = 80;
    const MIN_HEIGTH = 50;

    ns.WidgetViewResizeHandle = class WidgetViewResizeHandle extends se.StyledElement {

        constructor(widget, options) {
            if (options == null) {
                options = {};
            }
            options.resizeLeftSide = !!options.resizeLeftSide;
            options.resizeTopSide = !!options.resizeTopSide;
            options.fixHeight = !!options.fixHeight;
            options.fixWidth = !!options.fixWidth;
            options.widget = widget;

            if (options.fixWidth && options.fixHeight) {
                throw new TypeError('fixWidth and fixHeight cannot be true at the same time');
            }

            super([]);

            this.wrapperElement = document.createElement('div');

            Wirecloud.ui.ResizeHandle.call(
                this, widget.wrapperElement, this.wrapperElement,
                options,
                WidgetViewResizeHandle.prototype.onresizestart,
                WidgetViewResizeHandle.prototype.onresize,
                WidgetViewResizeHandle.prototype.onresizeend,
                WidgetViewResizeHandle.prototype.canDrag
            );
        }

        canDrag(resizableElement, data, role) {
            let editing = data.widget.tab.workspace.editing;
            if (role == null) {
                role = editing ? "editor" : "viewer";
            }
            return (
                data.widget.model.volatile
                || data.widget.layout instanceof Wirecloud.ui.FreeLayout
                || editing
            )
            && data.widget.model.isAllowed('resize', role)
            && !(data.widget.layout instanceof Wirecloud.ui.FullDragboardLayout);
        }

        onresizestart(resizableElement, handleElement, data) {
            handleElement.classList.add("inUse");
            data.widget.wrapperElement.classList.add('dragging');

            data.initialWidth = data.widget.shape.width;
            data.initialWidthPixels = data.widget.wrapperElement.clientWidth;
            data.initialHeight = data.widget.shape.height;
            data.initialHeightPixels = data.widget.wrapperElement.clientHeight;
            data.oldZIndex = data.widget.position.z;
            data.widget.setPosition({z: "999999"});
            data.dragboard = data.widget.layout.dragboard;
        }

        onresize(resizableElement, handleElement, data, xDelta, yDelta) {
            let widget = data.widget;
            if (widget.position.anchor.endsWith("center")) {
                xDelta *= 2;
            }

            if (!data.fixWidth) {
                let width = data.resizeLeftSide ? data.initialWidthPixels - xDelta : data.initialWidthPixels + xDelta;

                // Minimum width
                if (width < MIN_WIDTH) {
                    width = MIN_WIDTH;
                }

                let newwidth = widget.layout.adaptWidth(width + 'px');
                data.width = widget.shape.relwidth ? newwidth.inLU : newwidth.inPixels;
            } else {
                data.width = widget.shape.width;
            }

            if (!data.fixHeight) {
                let height = data.resizeTopSide ? data.initialHeightPixels - yDelta : data.initialHeightPixels + yDelta;

                // Minimum height
                if (height < MIN_HEIGTH) {
                    height = MIN_HEIGTH;
                }

                let newheight = widget.layout.adaptHeight(height + 'px');
                data.height = widget.shape.relheight ? newheight.inLU : newheight.inPixels;
            } else {
                data.height = widget.shape.height;
            }

            if (data.width !== widget.shape.width || data.height !== widget.shape.height) {
                widget.setShape({width: data.width, height: data.height}, data.resizeLeftSide, data.resizeTopSide);
            }
        }

        onresizeend(resizableElement, handleElement, data) {
            var widget = data.widget;
            data.widget.wrapperElement.classList.remove('dragging');
            data.widget.setPosition({z: data.oldZIndex});

            if (data.initialWidth !== data.width || data.initialHeight !== data.height) {
                widget.setShape({width: data.width, height: data.height}, data.resizeLeftSide, data.resizeTopSide, true);
            }
            handleElement.classList.remove("inUse");

            // This is needed to check if the scrollbar status has changed (visible/hidden)
            data.dragboard._notifyWindowResizeEvent();
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
