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


(function (ns) {

    "use strict";

    const on_mouseenter_tab = function on_mouseenter_tab(event) {
        const tab = this.widget.tab.workspace.findTab(event.target.getAttribute('data-id'));
        this.tab = tab;
        this.tab.tabElement.classList.add("selected");
        this.widget.layout.disableCursor();
    };

    const on_mouseleave_tab = function on_mouseleave_tab(event) {
        const tab = this.widget.tab.workspace.findTab(event.target.getAttribute('data-id'));
        if (tab === this.tab) {
            this.tab.tabElement.classList.remove("selected");
            this.tab = null;
        }
    };

    ns.WidgetViewDraggable = class WidgetViewDraggable {

        constructor(widget) {
            const context = {
                widget: widget
            };

            context._on_mouseenter_tab = on_mouseenter_tab.bind(context);
            context._on_mouseleave_tab = on_mouseleave_tab.bind(context);

            Wirecloud.ui.Draggable.call(
                this,
                widget.heading,
                context,
                WidgetViewDraggable.prototype.ondragstart,
                WidgetViewDraggable.prototype.ondrag,
                WidgetViewDraggable.prototype.ondragend,
                WidgetViewDraggable.prototype.canDrag
            );

            this.setXOffset = function setXOffset(xOffset) {
                context.xOffset = xOffset;
                return this;
            };

            this.setYOffset = function setYOffset(yOffset) {
                context.yOffset = yOffset;
                return this;
            };
        }

        canDrag(draggable, context, role) {
            if (role == null) {
                role = context.widget.tab.workspace.editing ? "editor" : "viewer";
            }
            return (
                context.widget.model.volatile
                || context.widget.layout instanceof Wirecloud.ui.FreeLayout
                || context.widget.tab.workspace.editing
            )
            && context.widget.model.isAllowed('move', role)
            && !(context.widget.layout instanceof Wirecloud.ui.FullDragboardLayout);
        }

        ondragstart(draggable, context) {
            const layout = context.widget.layout;
            layout.dragboard.raiseToTop(context.widget);
            layout.initializeMove(context.widget, draggable);

            context.widget.wrapperElement.classList.add('dragging');
            context.widget.tab.wrapperElement.classList.add('dragging');

            context.tabs = context.widget.tab.workspace.tabs.filter((tab) => {
                if (tab.id !== context.widget.tab.id) {
                    tab.tabElement.addEventListener('mouseenter', context._on_mouseenter_tab);
                    tab.tabElement.addEventListener('mouseleave', context._on_mouseleave_tab);
                    return true;
                }
            });

            context.y = context.widget.wrapperElement.offsetTop;
            context.x = context.widget.wrapperElement.offsetLeft;

            return {
                dragboard: context.widget.tab.wrapperElement
            };
        }

        ondrag(event, draggable, context, xDelta, yDelta) {
            context.widget.wrapperElement.style.left = (context.x + xDelta) + 'px';
            context.widget.wrapperElement.style.top = (context.y + yDelta) + 'px';
            context.widget.wrapperElement.style.bottom = "";
            context.widget.wrapperElement.style.right = "";
            context.widget.wrapperElement.style.marginLeft = "";

            const x = context.x + xDelta + context.xOffset;
            const y = context.y + yDelta + context.yOffset;

            // Check if the mouse is over a tab
            if (context.tab != null) {
                return;
            }

            // The mouse is not over a tab
            // The cursor must allways be inside the dragboard
            context.widget.layout.moveTemporally(x, y);
        }

        ondragend(draggable, context) {
            let destDragboard, destLayout;

            context.widget.wrapperElement.classList.remove('dragging');
            context.widget.tab.wrapperElement.classList.remove('dragging');

            context.tabs.forEach((tab) => {
                tab.tabElement.removeEventListener('mouseenter', context._on_mouseenter_tab);
                tab.tabElement.removeEventListener('mouseleave', context._on_mouseleave_tab);
            });

            if (context.tab != null) {
                context.widget.layout.cancelMove();

                // On-demand loading of tabs!
                // TODO: context.tab.load();
                destDragboard = context.tab.dragboard;

                if (context.widget.layout === context.widget.tab.dragboard.freeLayout) {
                    destLayout = destDragboard.freeLayout;
                } else {
                    destLayout = destDragboard.baseLayout;
                }

                context.widget.moveToLayout(destLayout);

                context.tab.tabElement.classList.remove("selected");
                context.tab = null;
            } else {
                context.widget.layout.acceptMove();
            }
        }

    }

})(Wirecloud.ui);
