/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CSSPrimitiveValue, FreeLayout, FullDragboardLayout, IWidget, LayoutManagerFactory, Wirecloud*/

(function () {

    "use strict";

    var parseTab = function parseTab(tabInfo) {
        var curIWidget, widget, layout, i;

        this.currentCode = 1;
        this.iWidgets = {};
        this.iWidgetsByCode = {};

        if (this.tab.readOnly || this.workspace.restricted) {
            this.readOnly = true;
            this.dragboardElement.classList.add("fixed");
        }

        for (i = 0; i < tabInfo.iwidgets.length; i++) {
            curIWidget = tabInfo.iwidgets[i];

            // Get widget model
            widget = this.workspace.resources.getResourceId(curIWidget.widget);

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
                curIWidget.zIndex,
                curIWidget.width,
                curIWidget.height,
                curIWidget.fulldragboard,
                curIWidget.minimized,
                curIWidget.refused_version,
                curIWidget.readOnly,
                curIWidget
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
        this.iWidgets = {};
        this.iWidgetsByCode = {};
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
            keys = keys || Object.keys(this.iWidgetsByCode);

            onSuccess = function (transport) { };

            onError = function (transport, e) {
                Wirecloud.GlobalLogManager.formatAndLog(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), transport, e);
            };

            // TODO only send real changes
            var iWidget, iWidgetInfo, uri, position, data, icon_position;
            data = [];

            for (var i = 0; i < keys.length; i++) {
                iWidget = this.iWidgetsByCode[keys[i]];
                iWidgetInfo = {};
                position = iWidget.getPosition();
                iWidgetInfo.id = iWidget.id;
                iWidgetInfo.tab = this.tab.id;
                if (!this.workspace.restricted) {
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
                requestHeaders: {'Accept': 'application/json'},
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
            var layoutInfo = this.tab.preferences.get('baselayout');

            switch (layoutInfo.type) {
            case 'columnlayout':
                if (layoutInfo.smart) {
                    return new Wirecloud.ui.SmartColumnLayout(this, layoutInfo.columns, layoutInfo.cellheight, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
                } else {
                    return new Wirecloud.ui.ColumnLayout(this, layoutInfo.columns, layoutInfo.cellheight, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
                }
            case 'gridlayout':
                return new Wirecloud.ui.GridLayout(this, layoutInfo.columns, layoutInfo.rows, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
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
                "iwidgetName": widget.title,
                "setDefaultValues" : function () {}
            };

            Wirecloud.Utils.merge(options, options_);

            if (!(widget instanceof Wirecloud.Widget)) {
                throw new TypeError();
            }

            if (this.readOnly) {
                var msg = gettext("The destination tab (%(tabName)s) is read only.");
                msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                return;
            }

            //var width = layout.unitConvert(widget.width + "cm", CSSPrimitiveValue.CSS_PX)[0];
            //width = layout.adaptWidth(width, width).inLU;
            var width = widget.default_width;
            var height = widget.default_height;
            var layout = this.tab.preferences.get('initiallayout') === "Free" ? 1 : 0;

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
                requestHeaders: {'Accept': 'application/json'},
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
                        iwidgetinfo.zIndex,
                        iwidgetinfo.width,
                        iwidgetinfo.height,
                        iwidgetinfo.fulldragboard,
                        iwidgetinfo.minimized,
                        iwidgetinfo.refused_version,
                        iwidgetinfo.readOnly,
                        iwidgetinfo
                    );
                    this.addIWidget(iwidget, iwidgetinfo, options);
                    iwidget.paint();
                }.bind(this),
                onFailure: function (response) {
                    Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding iwidget to persistence: %(errorMsg)s."), response);
                }
            });
        };

        Dragboard.prototype.getIWidgets = function getIWidgets() {
            return Wirecloud.Utils.values(this.iWidgets);
        };

        Dragboard.prototype.getIWidget = function getIWidget(iWidgetId) {
            return this.iWidgets[iWidgetId];
        };

        Dragboard.prototype.hasReadOnlyIWidgets = function hasReadOnlyIWidgets() {
            for (var key in this.iWidgets) {
                if (this.iWidgets[key].internal_iwidget.readOnly) {
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
                this.iWidgets[iWidget.id] = iWidget;
            }

            iWidget.code = this.currentCode++;

            this.iWidgetsByCode[iWidget.code] = iWidget;
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
            delete this.iWidgets[iWidget.id];
            delete this.iWidgetsByCode[iWidget.code];

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
            if (!this.iWidgetsByCode[iWidget.code]) {
                throw new Error();
            }

            var oldHeight = iWidget.getHeight();
            var oldWidth = iWidget.getWidth();

            this.workspace.addIWidget(this.tab, iWidget, iwidgetInfo, options);

            // Notify resize event
            iWidget.layout._notifyResizeEvent(iWidget, oldWidth, oldHeight, iWidget.getWidth(), iWidget.getHeight(), false, true);

            this.iWidgets[iWidget.id] = iWidget;
        };

        Dragboard.prototype.fillFloatingWidgetsMenu = function fillFloatingWidgetsMenu(menu) {
            this.freeLayout.fillFloatingWidgetsMenu(menu);
        };

        Dragboard.prototype.lowerToBottom = function lowerToBottom(iWidget) {
            var zPos = iWidget.getZPosition();
            this.orderList.splice(zPos, 1);
            this.orderList = [iWidget].concat(this.orderList);

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

            this.orderList.splice(oldZPos, 1);
            this.orderList.push(iWidget);

            for (var i = oldZPos; i < this.orderList.length; i++) {
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
        this.orderList = this.orderList.filter(function (iwidget) { return iwidget != null; });
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

        // Read padding values
        this.topMargin = cssStyle.getPropertyCSSValue("padding-top").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.bottomMargin = cssStyle.getPropertyCSSValue("padding-bottom").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.leftMargin = cssStyle.getPropertyCSSValue("padding-left").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.rightMargin = cssStyle.getPropertyCSSValue("padding-right").getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.dragboardWidth = parseInt(this.dragboardElement.offsetWidth, 10) - this.leftMargin - this.rightMargin;
        this.dragboardHeight = parseInt(this.dragboardElement.parentNode.clientHeight, 10) - this.topMargin - this.bottomMargin;
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
    while (Wirecloud.Utils.XML.isElement(tmp)) {
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
// IWidget Icon drag & drop support
/////////////////////////////////////
function IWidgetIconDraggable(iWidget) {
    var context = {
        iWidget: iWidget,
        x: null,
        y: null
    };
    Wirecloud.ui.Draggable.call(this, iWidget.iconImg, context,
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
