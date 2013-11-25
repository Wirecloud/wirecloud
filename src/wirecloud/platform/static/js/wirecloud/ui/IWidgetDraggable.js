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

/*global Draggable, EzWebEffectBase, FullDragboardLayout, Wirecloud*/

(function () {

    "use strict";

    var IWidgetDraggable = function IWidgetDraggable(iWidget) {
        var context = {
            iWidget: iWidget
        };
        Draggable.call(this, iWidget.widgetMenu, context,
                             IWidgetDraggable.prototype.startFunc,
                             IWidgetDraggable.prototype.updateFunc,
                             IWidgetDraggable.prototype.finishFunc,
                             IWidgetDraggable.prototype.canBeDraggedFunc);

        this.setXOffset = function (xOffset) {
            context.xOffset = xOffset;
        };

        this.setYOffset = function (yOffset) {
            context.yOffset = yOffset;
        };
    };

    IWidgetDraggable.prototype.canBeDraggedFunc = function canBeDraggedFunc(draggable, context) {
        return context.iWidget.isAllowed('move') && !(context.iWidget.layout instanceof FullDragboardLayout);
    };


    IWidgetDraggable.prototype.startFunc = function startFunc(draggable, context) {
        context.selectedTab = null;
        context.selectedTabElement = null;
        context.layout = context.iWidget.layout;
        context.dragboard = context.layout.dragboard;
        context.currentTab = context.dragboard.tab.id;
        context.dragboard.raiseToTop(context.iWidget);
        context.layout.initializeMove(context.iWidget, draggable);

        context.y = context.iWidget.element.style.top === "" ? 0 : parseInt(context.iWidget.element.style.top, 10);
        context.x = context.iWidget.element.style.left === "" ? 0 : parseInt(context.iWidget.element.style.left, 10);

        return {
            dragboard: EzWebEffectBase.findDragboardElement(context.iWidget.element)
        };
    };

    IWidgetDraggable.prototype._findTabElement = function _findTabElement(curNode, maxRecursion) {
        if (maxRecursion === 0) {
            return null;
        }

        // Only check elements, skip other dom nodes.
        if (Wirecloud.Utils.XML.isElement(curNode) && curNode.hasClassName('tab')) {
            return curNode;
        } else {
            var parentNode = curNode.parentNode;
            if (Wirecloud.Utils.XML.isElement(parentNode)) {
                return this._findTabElement(parentNode, maxRecursion - 1);
            } else {
                return null;
            }
        }
    };

    IWidgetDraggable.prototype.updateFunc = function updateFunc(event, draggable, context, xDelta, yDelta) {
        var x, y, element = null;

        context.iWidget.element.style.left = (context.x + xDelta) + 'px';
        context.iWidget.element.style.top = (context.y + yDelta) + 'px';

        x = context.x + xDelta + context.xOffset;
        y = context.y + yDelta + context.yOffset;

        // Check if the mouse is over a tab
        element = document.elementFromPoint(event.clientX, event.clientY);
        if (element !== null) {
            // elementFromPoint may return inner tab elements
            element = draggable._findTabElement(element, 4);
        }

        var id = null;
        if (element !== null) {
            id = element.getAttribute("id");

            if (id !== null) {
                var result = id.match(/tab_(\d+)_(\d+)/);
                if (result !== null && result[2] !== context.currentTab) {
                    if (context.selectedTab === result[2]) {
                        return;
                    }

                    if (context.selectedTabElement !== null) {
                        context.selectedTabElement.removeClassName("selected");
                    }

                    context.selectedTab = result[2];
                    context.selectedTabElement = element;
                    context.selectedTabElement.addClassName("selected");
                    context.layout.disableCursor();
                    return;
                }
            }
        }

        // The mouse is not over a tab
        // The cursor must allways be inside the dragboard
        var position = context.layout.getCellAt(x, y);
        if (position.y < 0) {
            position.y = 0;
        }
        if (position.x < 0) {
            position.x = 0;
        }
        if (context.selectedTabElement !== null) {
            context.selectedTabElement.removeClassName("selected");
        }
        context.selectedTab = null;
        context.selectedTabElement = null;
        context.layout.moveTemporally(position.x, position.y);
        return;
    };

    IWidgetDraggable.prototype.finishFunc = function finishFunc(draggable, context) {
        var tab, destDragboard, workspace, destLayout;
        if (context.selectedTab !== null) {
            context.layout.cancelMove();

            workspace = context.dragboard.workspace;
            tab = workspace.getTab(context.selectedTab);

            // On-demand loading of tabs!
            tab.paint();
            destDragboard = tab.getDragboard();

            if (context.iWidget.onFreeLayout()) {
                destLayout = destDragboard.freeLayout;
            } else {
                destLayout = destDragboard.baseLayout;
            }

            context.iWidget.moveToLayout(destLayout);

            workspace.highlightTab(parseInt(context.selectedTab, 10));

            context.selectedTab = null;
            context.selectedTabElement = null;
        } else {
            context.layout.acceptMove();
        }

        context.dragboard = null;
    };

    Wirecloud.ui.IWidgetDraggable = IWidgetDraggable;

})();
