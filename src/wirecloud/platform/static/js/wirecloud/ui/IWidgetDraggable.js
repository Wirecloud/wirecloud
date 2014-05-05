/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global EzWebEffectBase, FullDragboardLayout, Wirecloud*/

(function () {

    "use strict";

    var findTab = function findTab(curNode, maxRecursion) {
        if (maxRecursion === 0) {
            return null;
        }

        // Only check elements, skip other dom nodes.
        if (Wirecloud.Utils.XML.isElement(curNode)) {
            for (var i = 0; i < this.length; i++) {
                if (this[i].tabElement == curNode) {
                    return this[i];
                }
            }
        } else {
            return null;
        }

        var parentNode = curNode.parentNode;
        return findTab.call(this, parentNode, maxRecursion - 1);
    };

    var IWidgetDraggable = function IWidgetDraggable(iWidget) {
        var context = {
            iWidget: iWidget
        };
        Wirecloud.ui.Draggable.call(this, iWidget.widgetMenu, context,
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
        var key;

        context.selectedTab = null;
        context.layout = context.iWidget.layout;
        context.dragboard = context.layout.dragboard;
        context.dragboard.raiseToTop(context.iWidget);
        context.layout.initializeMove(context.iWidget, draggable);

        context.iWidget.element.classList.add('draganddrop');

        context.currentTab = context.dragboard.tab;
        context.tabs = [];
        for (key in context.dragboard.tab.workspace.tabInstances) {
            if (context.dragboard.tab.workspace.tabInstances[key] !== context.currentTab) {
                context.tabs.push(context.dragboard.tab.workspace.tabInstances[key]);
            }
        }

        context.y = context.iWidget.element.style.top === "" ? 0 : parseInt(context.iWidget.element.style.top, 10);
        context.x = context.iWidget.element.style.left === "" ? 0 : parseInt(context.iWidget.element.style.left, 10);

        return {
            dragboard: EzWebEffectBase.findDragboardElement(context.iWidget.element)
        };
    };

    IWidgetDraggable.prototype.updateFunc = function updateFunc(event, draggable, context, xDelta, yDelta) {
        var x, y, clientX, clientY, element = null;

        context.iWidget.element.style.left = (context.x + xDelta) + 'px';
        context.iWidget.element.style.top = (context.y + yDelta) + 'px';

        x = context.x + xDelta + context.xOffset;
        y = context.y + yDelta + context.yOffset;

        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Check if the mouse is over a tab
        element = document.elementFromPoint(clientX, clientY);
        if (element != null) {
            element = findTab.call(context.tabs, element, 4);
        }

        if (element != null) {
            if (context.selectedTab === element) {
                return;
            }

            if (context.selectedTab != null) {
                context.selectedTab.tabElement.classList.remove("selected");
                context.selectedTab.tabElement.classList.remove("target");
            }

            context.selectedTab = element;
            context.selectedTab.tabElement.classList.add("selected");
            context.selectedTab.tabElement.classList.add("target");
            context.layout.disableCursor();
            return;
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
        if (context.selectedTab != null) {
            context.selectedTab.tabElement.classList.remove("selected");
            context.selectedTab.tabElement.classList.remove("target");
        }
        context.selectedTab = null;
        context.layout.moveTemporally(position.x, position.y);
        return;
    };

    IWidgetDraggable.prototype.finishFunc = function finishFunc(draggable, context) {
        var destDragboard, workspace, destLayout;

        context.iWidget.element.classList.remove('draganddrop');

        if (context.selectedTab !== null) {
            context.layout.cancelMove();
            context.selectedTab.tabElement.classList.remove("selected");
            context.selectedTab.tabElement.classList.remove("target");

            workspace = context.dragboard.workspace;

            // On-demand loading of tabs!
            context.selectedTab.paint();
            destDragboard = context.selectedTab.getDragboard();

            if (context.iWidget.onFreeLayout()) {
                destLayout = destDragboard.freeLayout;
            } else {
                destLayout = destDragboard.baseLayout;
            }

            context.iWidget.moveToLayout(destLayout);

            workspace.highlightTab(context.selectedTab);

            context.selectedTab = null;
        } else {
            context.layout.acceptMove();
        }

        context.dragboard = null;
    };

    Wirecloud.ui.IWidgetDraggable = IWidgetDraggable;

})();
