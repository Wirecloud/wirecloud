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
/*global Constants, ColumnLayout, DragboardPosition, FreeLayout, FullDragboardLayout, IWidget, LayoutManagerFactory, LogManagerFactory, OpManagerFactory, Wirecloud, SmartColumnLayout*/

/**
 * @author aarranz
 */
function Dragboard(tab, workspace, dragboardElement) {
    // *********************************
    // PRIVATE VARIABLES
    // *********************************
    this.loaded = false;
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
    this.tabId = tab.tabInfo.id;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceState.id;
    this.readOnly = false;

    // ***********************
    // PRIVATE FUNCTIONS
    // ***********************
    Dragboard.prototype.paint = function () {
        var oldLength, i;

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

        this.tab.mark_as_painted();
    };

    /**
     * Update iwidget status in persistence
     */
    this._commitChanges = function (keys) {
        var onSuccess, onError;
        keys = keys || this.iWidgetsByCode.keys();

        onSuccess = function (transport) { };

        onError = function (transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        };

        // TODO only send real changes
        var iWidget, iWidgetInfo, uri, position, data, icon_position;
        data = [];

        for (var i = 0; i < keys.length; i++) {
            iWidget = this.iWidgetsByCode.get(keys[i]);
            iWidgetInfo = {};
            position = iWidget.getPosition();
            iWidgetInfo.id = iWidget.id;
            iWidgetInfo.tab = this.tabId;
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
            workspace_id: this.workspaceId,
            tab_id: this.tabId
        });
        Wirecloud.io.makeRequest(uri, {
            method: 'PUT',
            contentType: 'application/json',
            postBody: Object.toJSON(data),
            onSuccess: onSuccess,
            onFailure: onError
        });
    };

    /**
     *
     */
    Dragboard.prototype._buildLayoutFromPreferences = function (description) {
        var columns = this.tab.preferences.get('columns');
        var cell_height = this.tab.preferences.get('cell-height');
        var vertical_margin = this.tab.preferences.get('vertical-margin');
        var horizontal_margin = this.tab.preferences.get('horizontal-margin');

        if (this.tab.preferences.get('smart')) {
            return new SmartColumnLayout(this, columns, cell_height, vertical_margin, horizontal_margin);
        } else {
            return new ColumnLayout(this, columns, cell_height, vertical_margin, horizontal_margin);
        }
    };

    /**
     *
     */
    Dragboard.prototype._updateBaseLayout = function () {
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
    Dragboard.prototype.getWidth = function () {
        return this.dragboardWidth;
    };

    /**
     * Gets the height of the usable dragboard area.
     *
     * @returns The height of the usable dragboard area
     */
    Dragboard.prototype.getHeight = function () {
        return this.dragboardHeight;
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    Dragboard.prototype.destroy = function () {
        this.baseLayout.destroy();
        this.freeLayout.destroy();
        this.baseLayout = null;
        this.freeLayout = null;

        this.iWidgets = null;
        this.iWidgetsByCode = null;
        this.dragboardElement = null;
    };

    Dragboard.prototype.parseTab = function (tabInfo) {
        var curIWidget, position, icon_position, zPos, width, height, iwidget,
            widget, widgetid, minimized, layout, refusedVersion,
            opManager, i, readOnly;

        opManager = OpManagerFactory.getInstance();

        this.currentCode = 1;
        this.iWidgets = new Hash();
        this.iWidgetsByCode = new Hash();

        if (this.tab.readOnly || !this.workspace.isOwned()) {
            this.readOnly = true;
            this.dragboardElement.addClassName("fixed");
        }

        // For controlling when the iwidgets are totally loaded!
        for (i = 0; i < tabInfo.iwidgets.length; i++) {
            curIWidget = tabInfo.iwidgets[i];

            // Get widget model
            widget = Wirecloud.LocalCatalogue.getResourceId(curIWidget.widget);

            // Parse width, height and the position of the iwidget
            width = parseInt(curIWidget.width, 10);
            height = parseInt(curIWidget.height, 10);
            position = new DragboardPosition(parseInt(curIWidget.left, 10), parseInt(curIWidget.top, 10));
            icon_position = new DragboardPosition(parseInt(curIWidget.icon_left, 10), parseInt(curIWidget.icon_top, 10));
            zPos = parseInt(curIWidget.zIndex, 10);
            readOnly = curIWidget.readOnly;

            // Parse layout field
            if (curIWidget.layout === 0) {
                layout = this.baseLayout;
            } else {
                layout = this.freeLayout;
            }

            // Create instance model
            iwidget = new IWidget(widget,
                                  curIWidget.id,
                                  curIWidget.name,
                                  layout,
                                  position,
                                  icon_position,
                                  zPos,
                                  width,
                                  height,
                                  curIWidget.fulldragboard,
                                  curIWidget.minimized,
                                  curIWidget.refused_version,
                                  false,
                                  readOnly);
        }

        this.loaded = true;
    };

    /**
     * Creates a new instance of the given widget and inserts it into this
     * dragboard.
     *
     * @param widget the widget to use for creating the instance
     */
    Dragboard.prototype.addInstance = function (widget, options_) {
        var options = {
            "iwidgetName": widget.displayName,
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
        var minimized = false;
        var freeLayoutAfterLoading = false;
        var layout = this.baseLayout;

        if (this.tab.preferences.get('layout') === "Free") {
            minimized = false; //NOTE: this variable is useless, it could be used in the future to add widgets as icons directly
            freeLayoutAfterLoading = true; //To change the layout to FreeLayout after loading the widget
        }

        // Check if the widget doesn't fit in the dragboard
        if (layout instanceof ColumnLayout) {
            var maxColumns = layout.getColumns();
            if (width > maxColumns) {
                // TODO warning
                width = maxColumns;
            }
        }

        // Create the instance
        var iWidget = new IWidget(widget, null, options.iwidgetName, layout, null, null, null, width, height, false, minimized, null, freeLayoutAfterLoading, false);

        iWidget.save(options);
    };

    Dragboard.prototype.getNumberOfIWidgets = function () {
        return this.iWidgets.keys().length;
    };

    Dragboard.prototype.removeInstance = function (iWidgetId, orderFromServer) {
        var iwidget = this.iWidgets.get(iWidgetId);

        iwidget.remove(orderFromServer);
    };

    Dragboard.prototype.saveConfig = function (iWidgetId) {
        var iwidget = this.iWidgets.get(iWidgetId);
        try {
            iwidget.saveConfig();

            iwidget.setConfigurationVisible(false);
        } catch (e) {
        }
    };

    Dragboard.prototype.setDefaultPrefs = function (iWidgetId) {
        var iwidget = this.iWidgets.get(iWidgetId);
        iwidget.setDefaultPrefs();
    };

    Dragboard.prototype.notifyErrorOnIWidget = function (iWidgetId) {
        var iwidget = this.iWidgets.get(iWidgetId);
        iwidget.notifyError();
    };

    Dragboard.prototype.getIWidgets = function () {
        return this.iWidgets.values();
    };

    Dragboard.prototype.getIWidget = function (iWidgetId) {
        return this.iWidgets.get(iWidgetId);
    };

    Dragboard.prototype.hasReadOnlyIWidgets = function () {
        var iwidgetKeys = this.iWidgets.keys();
        for (var i = 0; i < iwidgetKeys.length; i++) {
            if (this.iWidgets.get(iwidgetKeys[i]).readOnly) {
                return true;
            }
        }
        return false;
    };

    Dragboard.prototype.getWorkspace = function () {
        return this.workspace;
    };

    /**
     * Registers an iWidget into this dragboard.
     *
     * @private
     * @param iWidget the iWidget to register
     */
    Dragboard.prototype._registerIWidget = function (iWidget) {
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
    Dragboard.prototype._deregisterIWidget = function (iWidget) {
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

    Dragboard.prototype.addIWidget = function (iWidget, iwidgetInfo, options) {
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

    Dragboard.prototype.fillFloatingWidgetsMenu = function (menu) {
        this.freeLayout.fillFloatingWidgetsMenu(menu);
    };

    Dragboard.prototype.lowerToBottom = function (iWidget) {
        var zPos = iWidget.getZPosition();
        delete this.orderList[zPos];
        this.orderList = [iWidget].concat(this.orderList).compact();

        for (var i = 0; i < this.orderList.length; i++) {
            this.orderList[i].setZPosition(i);
        }

        this._commitChanges();
    };

    Dragboard.prototype.lower = function (iWidget) {
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

    Dragboard.prototype.raiseToTop = function (iWidget) {
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

    Dragboard.prototype.raise = function (iWidget) {
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

    // Window Resize event dispacher function
    this._notifyWindowResizeEvent = function () {
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

    this.parseTab(tab.tabInfo);
}

/**
 * @private
 *
 * This function is slow. Please, only call it when really necessary.
 *
 * Updates the width and height info for this dragboard.
 */
Dragboard.prototype._recomputeSize = function () {
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

    if (tmp > this.scrollbarSpace)
        this.dragboardWidth -= tmp;
    else
        this.dragboardWidth -= this.scrollbarSpace;

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
Dragboard.prototype._updateIWidgetSizes = function (widthChanged, heightChanged) {
    this.baseLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
    this.freeLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
    this.fulldragboardLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
};


/////////////////////////////////////
// DragboardPosition
/////////////////////////////////////
function DragboardPosition(x, y) {
    this.x = x;
    this.y = y;
}

DragboardPosition.prototype.clone = function () {
    return new DragboardPosition(this.x, this.y);
};

/////////////////////////////////////
// DragboardCursor
/////////////////////////////////////

/**
 * @class This class represents a dragboard cursor. It is usually used in drag
 *        & drop operations and always represents the place where an iWidget is
 *        going to be placed.
 *
 * @author Álvaro Arranz
 *
 * @param iWidget iWidget that is going to be represented by the new dragboard
 *                cursor
 */
function DragboardCursor(iWidget) {
    this.refIWidget = iWidget;

    var positiontmp = iWidget.getPosition();
    this.position = positiontmp.clone();

    this.layout = iWidget.layout;
    this.width = iWidget.getWidth();
    this.height = iWidget.getHeight();
    this.heightInPixels = iWidget.element.offsetHeight;
    this.widthInPixels = iWidget.element.offsetWidth;
}

DragboardCursor.prototype.getWidth = function () {
    return this.width;
};

DragboardCursor.prototype.getHeight = function () {
    return this.height;
};

DragboardCursor.prototype.paint = function (dragboard) {
    var dragboardCursor = document.createElement("div");
    dragboardCursor.setAttribute("id", "dragboardcursor");

    // Set width and height
    dragboardCursor.style.height = this.heightInPixels + "px";
    dragboardCursor.style.width = this.widthInPixels + "px";

    // Set position
    dragboardCursor.style.left = (this.layout.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
    dragboardCursor.style.top = (this.layout.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

    dragboardCursor.style.zIndex = this.refIWidget.getZPosition();

    // assign the created element
    dragboard.insertBefore(dragboardCursor, this.refIWidget.element);
    this.element = dragboardCursor;
};

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardCursor.prototype.destroy = function () {
    if (isElement(this.element)) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
    }
};

DragboardCursor.prototype.getWidth = function () {
    return this.width;
};

DragboardCursor.prototype.getPosition = IWidget.prototype.getPosition;

DragboardCursor.prototype.setPosition = function (position) {
    this.position = position;

    if (this.element !== null) { // if visible
        this.element.style.left = (this.layout.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
        this.element.style.top = (this.layout.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
    }
};

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
    context.currentTab = context.dragboard.tabId;
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
        if (!tab.is_painted()) {
            tab.paint();
        }
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



/////////////////////////////////////
// resize support
/////////////////////////////////////

function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish, canBeResized) {
    var xDelta = 0, yDelta = 0;
    var xStart = 0, yStart = 0;
    var yScroll = 0;
    var dragboardCover;
    var x, y;
    var endresize, resize, startresize, scroll;
    canBeResized = canBeResized ? canBeResized : ResizeHandle._canBeResized;


    // remove the events
    endresize = function (e) {
        e = e || window.event; // needed for IE

        // Only attend to left button (or right button for left-handed persons) events
        if (e.button !== 0) {
            return;
        }

        Event.stopObserving(document, "mouseup", endresize);
        Event.stopObserving(document, "mousemove", resize);

        dragboardCover.parentNode.stopObserving("scroll", scroll);
        dragboardCover.parentNode.removeChild(dragboardCover);
        dragboardCover = null;

        handleElement.stopObserving("mouseup", endresize, true);
        handleElement.stopObserving("mousemove", resize, true);

        onFinish(resizableElement, handleElement, data);

        // Restore start event listener
        handleElement.observe("mousedown", startresize);

        document.onmousedown = null; // reenable context menu
        document.onselectstart = null; // reenable text selection in IE
        document.oncontextmenu = null; // reenable text selection

        return false;
    };

    // fire each time the mouse is moved while resizing
    resize = function (e) {
        e = e || window.event; // needed for IE

        xDelta = xStart - parseInt(e.screenX, 10);
        yDelta = yStart - parseInt(e.screenY, 10);
        xStart = parseInt(e.screenX, 10);
        yStart = parseInt(e.screenY, 10);
        y = y - yDelta;
        x = x - xDelta;

        onResize(resizableElement, handleElement, data, x, y);
    };

    // fire each time the dragboard is scrolled while dragging
    scroll = function () {
        var dragboard = dragboardCover.parentNode;
        dragboardCover.style.height = dragboard.scrollHeight + "px";
        var scrollTop = parseInt(dragboard.scrollTop, 10);
        var scrollDelta = yScroll - scrollTop;
        y -= scrollDelta;
        yScroll = scrollTop;

        onResize(resizableElement, handleElement, data, x, y);
    };

    // initiate the resizing
    startresize = function (e) {
        e = e || window.event; // needed for IE

        if (!canBeResized(resizableElement, data)) {
            return false;
        }

        // Only attend to left button (or right button for left-handed persons) events
        if (e.button !== 0) {
            return;
        }

        document.oncontextmenu = ResizeHandle._cancel; // disable context menu
        document.onmousedown = ResizeHandle._cancel; // disable text selection
        document.onselectstart = ResizeHandle._cancel; // disable text selection in IE
        handleElement.stopObserving("mousedown", startresize);

        xStart = parseInt(e.screenX, 10);
        yStart = parseInt(e.screenY, 10);
        x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
        y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);
        Event.observe(document, "mouseup", endresize);
        Event.observe(document, "mousemove", resize);

        var dragboard = EzWebEffectBase.findDragboardElement(resizableElement);
        dragboardCover = document.createElement("div");
        dragboardCover.addClassName("cover");
        dragboardCover.observe("mouseup", endresize, true);
        dragboardCover.observe("mousemove", resize, true);

        dragboardCover.style.zIndex = "1000000";
        dragboardCover.style.position = "absolute";
        dragboardCover.style.top = "0";
        dragboardCover.style.left = "0";
        dragboardCover.style.width = "100%";
        dragboardCover.style.height = dragboard.scrollHeight + "px";

        yScroll = parseInt(dragboard.scrollTop, 10);

        dragboard.observe("scroll", scroll);

        dragboard.insertBefore(dragboardCover, dragboard.firstChild);

        handleElement.observe("mouseup", endresize, true);
        handleElement.observe("mousemove", resize, true);

        onStart(resizableElement, handleElement, data);

        return false;
    };

    // Add event listener
    Event.observe(handleElement, "mousedown", startresize);

    this.setResizableElement = function (element) {
        resizableElement = element;
    };

    this.destroy = function () {
        Event.stopObserving(handleElement, "mousedown", startresize);
        startresize = null;
        resize = null;
        scroll = null;
        endresize = null;
        data = null;
        handleElement = null;
    };
}

ResizeHandle._canBeResized = function () {
    return true;
};

ResizeHandle._cancel = function () {
    return false;
};
