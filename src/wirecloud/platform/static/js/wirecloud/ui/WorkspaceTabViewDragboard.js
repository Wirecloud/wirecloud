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

/* globals CSSPrimitiveValue, Wirecloud */


(function (ns) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var WorkspaceTabViewDragboard = function WorkspaceTabViewDragboard(tab) {

        Object.defineProperties(this, {
            tab: {
                value: tab
            },
            widgets: {
                value: []
            }
        });

        this.scrollbarSpace = 17; // TODO make this configurable?
        // TODO or initialized with the scroll bar's real with?
        this.dragboardWidth = 800;
        this.dragboardHeight = 600;
        this.widgetToMove = null;
        this.painted = false;
        this.baseLayout = this._buildLayoutFromPreferences();
        this.freeLayout = new Wirecloud.ui.FreeLayout(this);
        this.fulldragboardLayout = new Wirecloud.ui.FullDragboardLayout(this);

        if (this.tab.workspace.restricted) {
            this.tab.wrapperElement.classList.add("fixed");
        }
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    /**
     * Gets the width of the usable dragboard area.
     *
     * @returns The width of the usable dragboard area
     */
    WorkspaceTabViewDragboard.prototype.getWidth = function getWidth() {
        return this.dragboardWidth;
    };

    /**
     * Gets the height of the usable dragboard area.
     *
     * @returns The height of the usable dragboard area
     */
    WorkspaceTabViewDragboard.prototype.getHeight = function getHeight() {
        return this.dragboardHeight;
    };

    WorkspaceTabViewDragboard.prototype.lowerToBottom = function lowerToBottom(widget) {

        if (widget.position.z === 0) {
            return this;
        }

        this.widgets.splice(widget.position.z, 1);
        this.widgets.unshift(widget);
        this.widgets.forEach(function (value, index) {
            value.setPosition({
                z: index
            });
        });

        this.update();

        return this;
    };

    WorkspaceTabViewDragboard.prototype.lower = function lower(widget) {
        var z = widget.position.z;

        if (z === 0) {
            return this;
        }

        var _widget = this.widgets[z - 1];

        this.widgets[z - 1] = widget;
        this.widgets[z] = _widget;

        widget.setPosition({
            z: z - 1
        });
        _widget.setPosition({
            z: z
        });

        this.update([widget.id, _widget.id]);

        return this;
    };

    WorkspaceTabViewDragboard.prototype.raiseToTop = function raiseToTop(widget) {

        if (widget.position.z === (this.widgets.length - 1)) {
            return this;
        }

        this.widgets.splice(widget.position.z, 1);
        this.widgets.push(widget);
        this.widgets.forEach(function (value, index) {
            value.setPosition({
                z: index
            });
        });

        this.update();

        return this;
    };

    WorkspaceTabViewDragboard.prototype.raise = function raise(widget) {
        var z = widget.position.z;

        if (z === (this.widgets.length - 1)) {
            return this;
        }

        var _widget = this.widgets[z + 1];

        this.widgets[z + 1] = widget;
        this.widgets[z] = _widget;

        widget.setPosition({
            z: z + 1
        });
        _widget.setPosition({
            z: z
        });

        this.update([widget.id, _widget.id]);

        return this;
    };

    WorkspaceTabViewDragboard.prototype.paint = function paint() {

        if (this.painted) {
            return;
        }

        this._recomputeSize();

        this.baseLayout.initialize();
        this.freeLayout.initialize();
        this.fulldragboardLayout.initialize();

        refresh_zindex.call(this);

        this.painted = true;
    };

    WorkspaceTabViewDragboard.prototype.update = function update(ids) {
        return new Promise(function (resolve, reject) {
            var url = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                workspace_id: this.tab.workspace.model.id,
                tab_id: this.tab.model.id
            });

            ids = ids || Object.keys(this.tab.widgetsById);

            var content = this.widgets.filter(function (widget) {
                return !widget.model.volatile && ids.indexOf(widget.id) !== -1;
            });

            if (!content.length) {
                return resolve(this);
            }

            Wirecloud.io.makeRequest(url, {
                method: 'PUT',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(content),
                onComplete: function (response) {
                    if (response.status === 204) {
                        this.widgets.filter(function (widget) {
                            widget.persist();
                        });
                        resolve(this);
                    } else {
                        reject(/* TODO */);
                    }
                }.bind(this)
            });
        }.bind(this));
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var refresh_zindex = function refresh_zindex() {
        var i;

        for (i = this.widgets.length - 1; i >= 0; i--) {
            if (this.widgets[i] == null) {
                this.widgets.splice(i, 1);
            }
        }

        this.widgets.forEach(function (widget, index) {
            widget.setPosition({
                z: index
            });
        });
    };

    WorkspaceTabViewDragboard.prototype._buildLayoutFromPreferences = function _buildLayoutFromPreferences(description) {
        var layoutInfo = this.tab.model.preferences.get('baselayout');

        switch (layoutInfo.type) {
        case 'columnlayout':
            if (layoutInfo.smart) {
                return new Wirecloud.ui.SmartColumnLayout(this, layoutInfo.columns, layoutInfo.cellheight, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
            } else {
                return new Wirecloud.ui.ColumnLayout(this, layoutInfo.columns, layoutInfo.cellheight, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
            }
            break;
        case 'gridlayout':
            return new Wirecloud.ui.GridLayout(this, layoutInfo.columns, layoutInfo.rows, layoutInfo.verticalmargin, layoutInfo.horizontalmargin);
        }
    };

    /**
     *
     */
    WorkspaceTabViewDragboard.prototype._updateBaseLayout = function _updateBaseLayout() {
        // Create the new Layout
        var newBaseLayout = this._buildLayoutFromPreferences();
        newBaseLayout.initialize();

        // Change our base layout
        this.baseLayout.moveTo(newBaseLayout);
        this.baseLayout.destroy();
        this.baseLayout = newBaseLayout;
    };

    WorkspaceTabViewDragboard.prototype._addWidget = function _addWidget(widget) {
        var z = widget.position.z;

        if (z != null) {
            if (this.widgets[z] != null) {
                this.widgets.splice(z, 1, this.widgets[z], widget);
                this.widgets.forEach(function (value, index) {
                    if (value != null) {
                        value.setPosition({
                            z: index
                        });
                    }
                });
            } else {
                this.widgets[z] = widget;
            }
        } else {
            widget.setPosition({
                z: this.widgets.push(widget) - 1
            });
        }

        this.tab.appendChild(widget);
    };

    WorkspaceTabViewDragboard.prototype._removeWidget = function _removeWidget(widget) {
        var z = widget.position.z;

        this.widgets.splice(z, 1);
        this.widgets.forEach(function (value, index) {
            if (value != null) {
                value.setPosition({
                    z: index
                });
            }
        });

        this.tab.removeChild(widget);
    };

    // Window Resize event dispacher function
    WorkspaceTabViewDragboard.prototype._notifyWindowResizeEvent = function _notifyWindowResizeEvent() {
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
    };

    /**
     * @private
     *
     * This function is slow. Please, only call it when really necessary.
     *
     * Updates the width and height info for this dragboard.
     */
    WorkspaceTabViewDragboard.prototype._recomputeSize = function _recomputeSize() {
        var cssStyle = document.defaultView.getComputedStyle(this.tab.wrapperElement, null);
        if (cssStyle.getPropertyValue("display") === "none") {
            return; // Do nothing
        }

        // Read padding values
        this.topMargin = cssStyle.getPropertyCSSValue("padding-top").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.bottomMargin = cssStyle.getPropertyCSSValue("padding-bottom").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.leftMargin = cssStyle.getPropertyCSSValue("padding-left").getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.rightMargin = cssStyle.getPropertyCSSValue("padding-right").getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.dragboardWidth = parseInt(this.tab.wrapperElement.offsetWidth, 10) - this.leftMargin - this.rightMargin;
        this.dragboardHeight = parseInt(this.tab.wrapperElement.parentNode.clientHeight, 10) - this.topMargin - this.bottomMargin;
    };

    /**
     * @private
     *
     * This method forces recomputing of the iWidgets' sizes.
     *
     * @param {boolean} widthChanged
     * @param {boolean} heightChanged
     */
    WorkspaceTabViewDragboard.prototype._updateIWidgetSizes = function _updateIWidgetSizes(widthChanged, heightChanged) {
        this.baseLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
        this.freeLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
        this.fulldragboardLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
    };

    ns.WorkspaceTabViewDragboard = WorkspaceTabViewDragboard;

})(Wirecloud.ui);
