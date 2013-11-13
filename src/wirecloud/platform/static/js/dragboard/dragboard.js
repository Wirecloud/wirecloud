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

/*global document, window, Error, gettext, interpolate, $, Hash, Event, isElement*/
/*global Constants, CSSPrimitiveValue, FreeLayout, FullDragboardLayout, IWidget, LayoutManagerFactory, OpManagerFactory, Wirecloud*/

(function () {

    "use strict";

    var parseTab = function parseTab(tabInfo) {
        var curIWidget, widget, layout, opManager, i;

        opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iWidgets = new Hash();
        this.iWidgetsByCode = new Hash();

        if (this.tab.readOnly || !this.workspace.isOwned()) {
            this.readOnly = true;
            this.dragboardElement.addClassName("fixed");
        }

        for (i = 0; i < tabInfo.iwidgets.length; i++) {
            curIWidget = tabInfo.iwidgets[i];

            // Get widget model
            widget = Wirecloud.LocalCatalogue.getResourceId(curIWidget.widget);

            // Parse layout field
            if (curIWidget.layout === 0) {
                layout = this.baseLayout;
            } else {
                layout = this.freeLayout;
            }

            // Create instance model
            new IWidget(widget,
                curIWidget.id,
                curIWidget.name,
                layout,
                new Wirecloud.DragboardPosition(curIWidget.left, curIWidget.top),
                new Wirecloud.DragboardPosition(curIWidget.icon_left, curIWidget.icon_top),
                curIWidget.zPos,
                curIWidget.width,
                curIWidget.height,
                curIWidget.fulldragboard,
                curIWidget.minimized,
                curIWidget.refused_version,
                curIWidget.readOnly,
                curIWidget.variables
            );
        }
    };

    var Dragboard = function Dragboard(tab, workspace, dragboardElement) {

        // *********************************
        // PRIVATE VARIABLES
        // *********************************
        this.currentCode = 1;
        this.scrollbarSpace = 17; // TODO make this configurable?
        // TODO or initialized with the scroll bar's real with?
        this.dragboardElement = null;
        this.dragboardWidth = 800;
        this.dragboardHeight = 600;
        this.baseLayout = null;
        this.freeLayout = null;
        this.widgetToMove = null;
        this.iWidgets = new Hash();
        this.iWidgetsByCode = new Hash();
        this.tab = tab;
        this.workspace = workspace;
        this.readOnly = false;

        // ***********************
        // PRIVATE FUNCTIONS
        // ***********************

        /**
         * Update iwidget status in persistence
         */
        this._commitChanges = function _commitChanges(keys) {
            var onSuccess, onError;
            keys = keys || this.iWidgetsByCode.keys();

            onSuccess = function (transport) { };

            onError = function (transport, e) {
                Wirecloud.GlobalLogManager.formatAndLog(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), transport, e);
            };

            // TODO only send real changes
            var iWidget, iWidgetInfo, uri, position, data, icon_position;
            data = [];

            for (var i = 0; i < keys.length; i++) {
                iWidget = this.iWidgetsByCode.get(keys[i]);
                iWidgetInfo = {};
                position = iWidget.getPosition();
                iWidgetInfo.id = iWidget.id;
                iWidgetInfo.tab = this.tab.id;
                if (this.workspace.isOwned()) {
                    iWidgetInfo.minimized = iWidget.isMinimized();
                }
                if (!iWidget.isInFullDragboardMode()) {
                    iWidgetInfo.top = iWidget.position.y;
                    iWidgetInfo.left = iWidget.position.x;
                    iWidgetInfo.zIndex = iWidget.zPos;
                    iWidgetInfo.width = iWidget.contentWidth;
                    iWidgetInfo.height = iWidget.height;
                    iWidgetInfo.fulldragboard = false;
                } else {
                    iWidgetInfo.fulldragboard = true;
                }

                iWidgetInfo.layout = iWidget.onFreeLayout() ? 1 : 0;

                icon_position = iWidget.getIconPosition();
                iWidgetInfo.icon_top = icon_position.y;
                iWidgetInfo.icon_left = icon_position.x;

                data.push(iWidgetInfo);
            }

            uri = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.tab.id
            });
            Wirecloud.io.makeRequest(uri, {
                method: 'PUT',
                contentType: 'application/json',
                postBody: JSON.stringify(data),
                onSuccess: onSuccess,
                onFailure: onError
            });
        };

        /**
         *
         */
        Dragboard.prototype._buildLayoutFromPreferences = function _buildLayoutFromPreferences(description) {
            var columns = this.tab.preferences.get('columns');
            var cell_height = this.tab.preferences.get('cell-height');
            var vertical_margin = this.tab.preferences.get('vertical-margin');
            var horizontal_margin = this.tab.preferences.get('horizontal-margin');

            if (this.tab.preferences.get('smart')) {
                return new Wirecloud.ui.SmartColumnLayout(this, columns, cell_height, vertical_margin, horizontal_margin);
            } else {
                return new Wirecloud.ui.ColumnLayout(this, columns, cell_height, vertical_margin, horizontal_margin);
            }
        };

        /**
         *
         */
        Dragboard.prototype._updateBaseLayout = function _updateBaseLayout() {
            // Create the new Layout
            var newBaseLayout = this._buildLayoutFromPreferences();
            newBaseLayout.initialize();

            // Change our base layout
            this.baseLayout.moveTo(newBaseLayout);
            this.baseLayout.destroy();
            this.baseLayout = newBaseLayout;
        };

        // ****************
        // PUBLIC METHODS
        // ****************

        /**
         * Gets the width of the usable dragboard area.
         *
         * @returns The width of the usable dragboard area
         */
        Dragboard.prototype.getWidth = function getWidth() {
            return this.dragboardWidth;
        };

        /**
         * Gets the height of the usable dragboard area.
         *
         * @returns The height of the usable dragboard area
         */
        Dragboard.prototype.getHeight = function getHeight() {
            return this.dragboardHeight;
        };

        /**
         * This method must be called to avoid memory leaks caused by circular references.
         */
        Dragboard.prototype.destroy = function destroy() {
            this.baseLayout.destroy();
            this.freeLayout.destroy();
            this.baseLayout = null;
            this.freeLayout = null;

            this.iWidgets = null;
            this.iWidgetsByCode = null;
            this.dragboardElement = null;
        };

        /**
         * Creates a new instance of the given widget and inserts it into this
         * dragboard.
         *
         * @param widget the widget to use for creating the instance
         */
        Dragboard.prototype.addInstance = function addInstance(widget, options_) {
            var options = {
                "iwidgetName": widget.display_name,
                "setDefaultValues" : function () {}
            };

            Object.extend(options, options_);

            if (!(widget instanceof Wirecloud.Widget)) {
                throw new TypeError();
            }

            if (this.readOnly) {
                var msg = gettext("The destination tab (%(tabName)s) is read only.");
                msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.WARN_MSG);
                return;
            }

            //var width = layout.unitConvert(widget.width + "cm", CSSPrimitiveValue.CSS_PX)[0];
            //width = layout.adaptWidth(width, width).inLU;
            var width = widget.default_width;
            var height = widget.default_height;
            var layout = this.tab.preferences.get('layout') === "Free" ? 1 : 0;

            // Check if the widget doesn't fit in the dragboard
            if (layout instanceof Wirecloud.ui.ColumnLayout) {
                var maxColumns = layout.getColumns();
                if (width > maxColumns) {
                    // TODO warning
                    width = maxColumns;
                }
            }

            var url = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                tab_id: this.tab.id,
                workspace_id: this.workspace.id
            });

            var data = JSON.stringify({
                'widget': widget.id,
                'width': width,
                'height': height,
                'name': options.iwidgetName,
                'layout': layout
            });

            Wirecloud.io.makeRequest(url, {
                method: 'POST',
                contentType: 'application/json',
                postBody: data,
                onSuccess: function onSuccess(response) {
                    var iwidgetinfo, widget, layout, iwidget;

                    iwidgetinfo = JSON.parse(response.responseText);

                    // Get widget model
                    widget = Wirecloud.LocalCatalogue.getResourceId(iwidgetinfo.widget);

                    // Parse layout field
                    if (iwidgetinfo.layout === 0) {
                        layout = this.baseLayout;
                    } else {
                        layout = this.freeLayout;
                    }

                    iwidget = new IWidget(widget,
                        iwidgetinfo.id,
                        iwidgetinfo.name,
                        layout,
                        new Wirecloud.DragboardPosition(iwidgetinfo.left, iwidgetinfo.top),
                        new Wirecloud.DragboardPosition(iwidgetinfo.icon_left, iwidgetinfo.icon_top),
                        iwidgetinfo.zPos,
                        iwidgetinfo.width,
                        iwidgetinfo.height,
                        iwidgetinfo.fulldragboard,
                        iwidgetinfo.minimized,
                        iwidgetinfo.refused_version,
                        iwidgetinfo.readOnly,
                        iwidgetinfo.variables
                    );
                    this.addIWidget(iwidget, iwidgetinfo, options);
                    iwidget.paint();
                }.bind(this),
                onFailure: function (response) {
                    Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding iwidget to persistence: %(errorMsg)s."), response);
                }
            });
        };

        Dragboard.prototype.removeInstance = function removeInstance(iWidgetId, orderFromServer) {
            var iwidget = this.iWidgets.get(iWidgetId);

            iwidget.remove(orderFromServer);
        };

        Dragboard.prototype.getIWidgets = function getIWidgets() {
            return this.iWidgets.values();
        };

        Dragboard.prototype.getIWidget = function getIWidget(iWidgetId) {
            return this.iWidgets.get(iWidgetId);
        };

        Dragboard.prototype.hasReadOnlyIWidgets = function hasReadOnlyIWidgets() {
            var iwidgetKeys = this.iWidgets.keys();
            for (var i = 0; i < iwidgetKeys.length; i++) {
                if (this.iWidgets.get(iwidgetKeys[i]).internal_iwidget.readOnly) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Registers an iWidget into this dragboard.
         *
         * @private
         * @param iWidget the iWidget to register
         */
        Dragboard.prototype._registerIWidget = function _registerIWidget(iWidget) {
            if (iWidget.id) {
                this.iWidgets.set(iWidget.id, iWidget);
            }

            iWidget.code = this.currentCode++;

            this.iWidgetsByCode.set(iWidget.code, iWidget);
            var zpos = iWidget.getZPosition();
            if (zpos !== null) {
                if (this.orderList[zpos] !== undefined) {
                    this.orderList.splice(zpos, 1, this.orderList[zpos], iWidget);

                    // Update following iWidgets
                    for (var i = zpos + 1; i < this.orderList.length; i++) {
                        if (this.orderList[i] !== undefined) {
                            this.orderList[i].setZPosition(i);
                        }
                    }
                } else {
                    this.orderList[zpos] = iWidget;
                }
            } else {
                zpos = this.orderList.length;
                iWidget.setZPosition(zpos);
                this.orderList[zpos] = iWidget;
            }
        };

        /**
         * Deregisters an iWidget from this dragboard.
         *
         * @private
         * @param iWidget the iWidget to register
         */
        Dragboard.prototype._deregisterIWidget = function _deregisterIWidget(iWidget) {
            this.iWidgets.unset(iWidget.id);
            this.iWidgetsByCode.unset(iWidget.code);

            // Update z order List
            var zpos = iWidget.getZPosition();
            this.orderList.splice(zpos, 1);
            iWidget.setZPosition(null);

            for (var i = zpos; i < this.orderList.length; i++) {
                this.orderList[i].setZPosition(i);
            }

            iWidget.code = null;
        };

        Dragboard.prototype.addIWidget = function addIWidget(iWidget, iwidgetInfo, options) {
            if (!this.iWidgetsByCode.get(iWidget.code)) {
                throw new Error();
            }

            var oldHeight = iWidget.getHeight();
            var oldWidth = iWidget.getWidth();

            this.workspace.addIWidget(this.tab, iWidget, iwidgetInfo, options);

            // Notify resize event
            iWidget.layout._notifyResizeEvent(iWidget, oldWidth, oldHeight, iWidget.getWidth(), iWidget.getHeight(), false, true);

            this.iWidgets.set(iWidget.id, iWidget);
        };

        Dragboard.prototype.fillFloatingWidgetsMenu = function fillFloatingWidgetsMenu(menu) {
            this.freeLayout.fillFloatingWidgetsMenu(menu);
        };

        Dragboard.prototype.lowerToBottom = function lowerToBottom(iWidget) {
            var zPos = iWidget.getZPosition();
            delete this.orderList[zPos];
            this.orderList = [iWidget].concat(this.orderList).compact();

            for (var i = 0; i < this.orderList.length; i++) {
                this.orderList[i].setZPosition(i);
            }

            this._commitChanges();
        };

        Dragboard.prototype.lower = function lower(iWidget) {
            var zPos = iWidget.getZPosition();
            if (zPos === 0) {
                // Nothing to do if we are already in the bottom
                return;
            }

            var prevIWidget = this.orderList[zPos - 1];
            this.orderList[zPos - 1] = iWidget;
            this.orderList[zPos] = prevIWidget;

            iWidget.setZPosition(zPos - 1);
            prevIWidget.setZPosition(zPos);

            this._commitChanges([iWidget.code, prevIWidget.code]);
        };

        Dragboard.prototype.raiseToTop = function raiseToTop(iWidget) {
            var oldZPos = iWidget.getZPosition();
            var newZPos = this.orderList.length - 1;

            if (oldZPos === newZPos) {
                return; // Nothing to do
            }

            delete this.orderList[oldZPos];
            this.orderList.push(iWidget);
            this.orderList = this.orderList.compact();

            var i = 0;
            for (; i < this.orderList.length; i++) {
                this.orderList[i].setZPosition(i);
            }

            this._commitChanges();
        };

        Dragboard.prototype.raise = function raise(iWidget) {
            var zPos = iWidget.getZPosition();
            if (zPos === (this.orderList.length - 1)) {
                // Nothing to do if we are already in the top
                return;
            }

            var nextIWidget = this.orderList[zPos + 1];
            this.orderList[zPos + 1] = iWidget;
            this.orderList[zPos] = nextIWidget;

            iWidget.setZPosition(zPos + 1);
            nextIWidget.setZPosition(zPos);

            this._commitChanges([iWidget.code, nextIWidget.code]);
        };

        // *******************
        // INITIALIZING CODE
        // *******************
        this.dragboardElement = dragboardElement;
        this.orderList = [];
        this.painted = false;
        this.painting = false;

        // Window Resize event dispacher function
        this._notifyWindowResizeEvent = function _notifyWindowResizeEvent() {
            var oldWidth = this.dragboardWidth;
            var oldHeight = this.dragboardHeight;
            this._recomputeSize();
            var newWidth = this.dragboardWidth;
            var newHeight = this.dragboardHeight;

            var widthChanged = oldWidth !== newWidth;
            var heightChanged = oldHeight !== newHeight;
            if (widthChanged || heightChanged) {
                this._updateIWidgetSizes(widthChanged, heightChanged);
            }
        }.bind(this);

        this.baseLayout = this._buildLayoutFromPreferences();
        this.freeLayout = new FreeLayout(this);
        this.fulldragboardLayout = new FullDragboardLayout(this);

        parseTab.call(this, tab.tabInfo);
    };

    Dragboard.prototype.paint = function paint() {
        var oldLength, i;

        if (this.painted || this.painting) {
            return;
        }
        this.painting = true;

        this.dragboardElement.innerHTML = "";

        this._recomputeSize();

        this.baseLayout.initialize();
        this.freeLayout.initialize();
        this.fulldragboardLayout.initialize();

        // Check if we have to readjust the z positions
        oldLength = this.orderList.length;
        this.orderList = this.orderList.compact();
        if (oldLength !== this.orderList.length) {
            for (i = 0; i < this.orderList.length; i += 1) {
                this.orderList[i].setZPosition(i);
            }
        }

        this.painted = true;
    };

    /**
     * @private
     *
     * This function is slow. Please, only call it when really necessary.
     *
     * Updates the width and height info for this dragboard.
     */
    Dragboard.prototype._recomputeSize = function _recomputeSize() {
        var cssStyle = document.defaultView.getComputedStyle(this.dragboardElement, null);
        if (cssStyle.getPropertyValue("display") === "none") {
            return; // Do nothing
        }

        /* Pre reserve scroll bar space */

        var dragboardElement = this.dragboardElement;
        this.dragboardWidth = parseInt(dragboardElement.clientWidth, 10);

        this.topMargin = cssStyle.getPropertyCSSValue("padding-top").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.bottomMargin = cssStyle.getPropertyCSSValue("padding-bottom").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.leftMargin = cssStyle.getPropertyCSSValue("padding-left").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.rightMargin = cssStyle.getPropertyCSSValue("padding-right").getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.dragboardWidth = parseInt(dragboardElement.offsetWidth, 10);
        this.dragboardWidth -= this.leftMargin + this.rightMargin;

        var tmp = this.dragboardWidth;
        tmp -= parseInt(dragboardElement.clientWidth, 10);

        if (tmp > this.scrollbarSpace) {
            this.dragboardWidth -= tmp;
        } else {
            this.dragboardWidth -= this.scrollbarSpace;
        }

        // TODO
        this.dragboardHeight = parseInt(dragboardElement.clientHeight, 10);
    };

    /**
     * @private
     *
     * This method forces recomputing of the iWidgets' sizes.
     *
     * @param {boolean} widthChanged
     * @param {boolean} heightChanged
     */
    Dragboard.prototype._updateIWidgetSizes = function _updateIWidgetSizes(widthChanged, heightChanged) {
        this.baseLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
        this.freeLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
        this.fulldragboardLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
    };

    window.Dragboard = Dragboard;

})();

/////////////////////////////////////
// Drag and drop support
/////////////////////////////////////
var EzWebEffectBase = {};
EzWebEffectBase.findDragboardElement = function (element) {
    var tmp = element.parentNode;
    while (isElement(tmp)) {
        //var position = tmp.getStyle("position");
        var position = document.defaultView.getComputedStyle(tmp, null).getPropertyValue("position");
        switch (position) {
        case "relative":
        case "absolute":
        case "fixed":
            return tmp;
        }

        tmp = tmp.parentNode;
    }
    return null; // Not found
};

/////////////////////////////////////
// IWidget drag & drop support
/////////////////////////////////////
function IWidgetDraggable(iWidget) {
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
}

IWidgetDraggable.prototype.canBeDraggedFunc = function (draggable, context) {
    return context.iWidget.isAllowed('move') && !(context.iWidget.layout instanceof FullDragboardLayout);
};


IWidgetDraggable.prototype.startFunc = function (draggable, context) {
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

IWidgetDraggable.prototype._findTabElement = function (curNode, maxRecursion) {
    if (maxRecursion === 0) {
        return null;
    }

    // Only check elements, skip other dom nodes.
    if (isElement(curNode) && curNode.hasClassName('tab')) {
        return curNode;
    } else {
        var parentNode = curNode.parentNode;
        if (isElement(parentNode)) {
            return this._findTabElement(parentNode, maxRecursion - 1);
        } else {
            return null;
        }
    }
};

IWidgetDraggable.prototype.updateFunc = function (event, draggable, context, xDelta, yDelta) {
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

IWidgetDraggable.prototype.finishFunc = function (draggable, context) {
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


/////////////////////////////////////
// IWidget Icon drag & drop support
/////////////////////////////////////
function IWidgetIconDraggable(iWidget) {
    var context = {
        iWidget: iWidget,
        x: null,
        y: null
    };
    Draggable.call(this, iWidget.iconImg, context,
                         IWidgetIconDraggable.prototype.startFunc,
                         IWidgetIconDraggable.prototype.updateFunc,
                         IWidgetIconDraggable.prototype.finishFunc,
                         IWidgetIconDraggable.prototype.canBeDraggedFunc);
}

IWidgetIconDraggable.prototype.canBeDraggedFunc = function (draggable, context) {
    return true;
};


IWidgetIconDraggable.prototype.startFunc = function (draggable, context) {
    context.x = null;
    context.y = null;
    context.oldZIndex = context.iWidget.getZPosition();
    context.iWidget.setZPosition("999999");
    context.dragboard = context.iWidget.layout.dragboard;

    return {
        dragboard: EzWebEffectBase.findDragboardElement(context.iWidget.element)
    };
};


IWidgetIconDraggable.prototype.updateFunc = function (event, draggable, context, x, y) {
    context.x = x;
    context.y = y;
    return;
};

IWidgetIconDraggable.prototype.finishFunc = function (draggable, context) {
    context.iWidget.setZPosition(context.oldZIndex);
    if (context.x) {
        var position = context.iWidget.layout.getCellAt(context.x, context.y);

        if (position.y < 0) {
            position.y = 0;
        }
        if (position.x < 0) {
            position.x = 0;
        }

        context.iWidget.setIconPosition(position);
        context.iWidget.layout.dragboard._commitChanges([context.iWidget.code]);
    } else {
        // It is here instead of in a click event due to the behaviour of the IE
        context.iWidget.setMinimizeStatus(false);
        context.iWidget.layout.dragboard.raiseToTop(context.iWidget);
    }

    // This is needed to check if the scrollbar status has changed (visible/hidden)
    context.dragboard._notifyWindowResizeEvent();
};
