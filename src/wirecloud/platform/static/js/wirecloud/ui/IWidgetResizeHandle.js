/*
 *     (C) Copyright 2008-2013 Universidad Politécnica de Madrid
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

/*global ResizeHandle, StyledElements*/

(function () {

    "use strict";

    var IWidgetResizeHandle = function IWidgetResizeHandle(iWidget, resizeLeftSide) {
        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement('div');

        ResizeHandle.call(this, iWidget.element, this.wrapperElement,
                                {iWidget: iWidget, resizeLeftSide: resizeLeftSide},
                                IWidgetResizeHandle.prototype.startFunc,
                                IWidgetResizeHandle.prototype.updateFunc,
                                IWidgetResizeHandle.prototype.finishFunc,
                                IWidgetResizeHandle.prototype.canBeResizedFunc);
    };
    IWidgetResizeHandle.prototype = new StyledElements.StyledElement();

    IWidgetResizeHandle.prototype.canBeResizedFunc = function canBeResizedFunc(resizableElement, data) {
        return data.iWidget.isAllowed('resize');
    };

    IWidgetResizeHandle.prototype.startFunc = function startFunc(resizableElement, handleElement, data) {
        handleElement.addClassName("inUse");
        // TODO merge with iwidget minimum sizes
        data.minWidth = Math.ceil(data.iWidget.layout.fromPixelsToHCells(80));
        data.minHeight = Math.ceil(data.iWidget.layout.fromPixelsToVCells(50));
        data.innitialWidth = data.iWidget.getWidth();
        data.innitialHeight = data.iWidget.getHeight();
        data.oldZIndex = data.iWidget.getZPosition();
        data.iWidget.setZPosition("999999");
        data.dragboard = data.iWidget.layout.dragboard;
    };

    IWidgetResizeHandle.prototype.updateFunc = function updateFunc(resizableElement, handleElement, data, x, y) {
        var iWidget = data.iWidget;

        // Skip if the mouse is outside the dragboard
        if (iWidget.layout.isInside(x, y)) {
            var position = iWidget.layout.getCellAt(x, y);
            var currentPosition = iWidget.getPosition();
            var width;

            if (data.resizeLeftSide) {
                width = currentPosition.x + iWidget.getWidth() - position.x;
            } else {
                width = position.x - currentPosition.x + 1;
            }
            var height = position.y - currentPosition.y + 1;

            // Minimum width
            if (width < data.minWidth) {
                width = data.minWidth;
            }

            // Minimum height
            if (height < data.minHeight) {
                height = data.minHeight;
            }

            if (width !== iWidget.getWidth() || height !== iWidget.getHeight()) {
                iWidget.setSize(width, height, data.resizeLeftSide, false);
            }
        }
    };

    IWidgetResizeHandle.prototype.finishFunc = function finishFunc(resizableElement, handleElement, data) {
        var iWidget = data.iWidget;
        data.iWidget.setZPosition(data.oldZIndex);
        if (data.innitialWidth !== data.iWidget.getWidth() || data.innitialHeight !== data.iWidget.getHeight()) {
            iWidget.setSize(iWidget.getWidth(), iWidget.getHeight(), data.resizeLeftSide, true);
        }
        handleElement.removeClassName("inUse");

        // This is needed to check if the scrollbar status has changed (visible/hidden)
        data.dragboard._notifyWindowResizeEvent();
    };

    window.IWidgetResizeHandle = IWidgetResizeHandle;

})();
