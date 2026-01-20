/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    const refresh_zindex = function refresh_zindex() {
        for (let i = this.widgets.length - 1; i >= 0; i--) {
            if (this.widgets[i] == null) {
                this.widgets.splice(i, 1);
            }
        }

        this.widgets.forEach((widget, index) => {
            widget.setPosition({
                z: index
            }, false);
        });
    };

    ns.WorkspaceTabViewDragboard = class WorkspaceTabViewDragboard {

        constructor(tab) {
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
            this.customWidth = -1;
            this.widgetToMove = null;
            this.resetLayouts();
            Object.defineProperties(this, {
                layouts: {
                    get: () => {
                        return [
                            this.baseLayout,
                            this.freeLayout,
                            this.leftLayout,
                            this.rightLayout,
                            this.bottomLayout,
                            this.topLayout
                        ];
                    }
                }
            });
            if (this.tab.workspace.restricted) {
                this.tab.wrapperElement.classList.add("fixed");
            }
        }

        /**
         * Gets the width of the usable dragboard area.
         *
         * @returns The width of the usable dragboard area
         */
        getWidth() {
            return this.dragboardWidth;
        }

        /**
         * Gets the height of the usable dragboard area.
         *
         * @returns The height of the usable dragboard area
         */
        getHeight() {
            return this.dragboardHeight;
        }

        lowerToBottom(widget) {

            if (widget.position.z === 0) {
                return this;
            }

            this.widgets.splice(widget.position.z, 1);
            this.widgets.unshift(widget);
            this.widgets.forEach((value, index) => {
                value.setPosition({
                    z: index
                });
            });

            this.update();

            return this;
        }

        lower(widget) {
            const z = widget.position.z;

            if (z === 0) {
                return this;
            }

            const _widget = this.widgets[z - 1];

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
        }

        raiseToTop(widget) {

            if (widget.position.z === (this.widgets.length - 1)) {
                return this;
            }

            this.widgets.splice(widget.position.z, 1);
            this.widgets.push(widget);
            this.widgets.forEach((value, index) => {
                value.setPosition({
                    z: index
                });
            });

            this.update();

            return this;
        }

        raise(widget) {
            const z = widget.position.z;

            if (z === (this.widgets.length - 1)) {
                return this;
            }

            const _widget = this.widgets[z + 1];

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
        }

        refreshPositionBasedOnZIndex() {
            // Reorder widgets based on their z-index. This is used when the screen size changes
            // and the widgets are not in the correct order.
            this.widgets.sort((a, b) => {
                return a.position.z - b.position.z;
            });
        }

        paint() {

            if (this.painted) {
                return;
            }

            this._recomputeSize();

            this.baseLayout.initialize();
            this.freeLayout.initialize();
            this.fulldragboardLayout.initialize();
            this.leftLayout.initialize();
            this.rightLayout.initialize();
            this.bottomLayout.initialize();
            this.topLayout.initialize();

            refresh_zindex.call(this);

            this.painted = true;
        }

        resetLayouts() {
            this.painted = false;
            this.fulldragboardLayout = new Wirecloud.ui.FullDragboardLayout(this);
            this.baseLayout = this._buildLayoutFromPreferences();
            this.freeLayout = new Wirecloud.ui.FreeLayout(this);
            this.leftLayout = new Wirecloud.ui.SidebarLayout(this, {active: (this.leftLayout) ? this.leftLayout.isActive() : false});
            this.rightLayout = new Wirecloud.ui.SidebarLayout(this, {position: "right", active: (this.rightLayout) ? this.rightLayout.isActive() : false});
            this.bottomLayout = new Wirecloud.ui.SidebarLayout(this, {position: "bottom", active: (this.bottomLayout) ? this.bottomLayout.isActive() : false});
            this.topLayout = new Wirecloud.ui.SidebarLayout(this, {position: "top", active: (this.topLayout) ? this.topLayout.isActive() : false});
        }

        updateWidgetScreenSize(screenSize) {
            this.resetLayouts();
            this.widgets.forEach((widget) => {
                widget.updateWindowSize(screenSize);
            });
            this.refreshPositionBasedOnZIndex();
            this.paint();
        }

        updateWidgetScreenSizeWithId(id) {
            const screenSize = this.tab.model.preferences.get('screenSizes').find((screenSize) => screenSize.id === id);
            if (screenSize != null) {
                let size = screenSize.moreOrEqual + (screenSize.lessOrEqual - screenSize.moreOrEqual) / 2;
                if (screenSize.lessOrEqual === -1) {
                    size = screenSize.moreOrEqual;
                }
                this.updateWidgetScreenSize(size);
            }
        }

        /**
         *
         */
        update(ids, allLayoutConfigurations) {
            if (this.tab.workspace.editing === false) {
                return Promise.resolve(this);
            }

            const url = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                workspace_id: this.tab.workspace.model.id,
                tab_id: this.tab.model.id
            });

            ids = ids || Object.keys(this.tab.widgetsById);

            const content = this.widgets.filter((widget) => {
                return !widget.model.volatile && ids.indexOf(widget.id) !== -1;
            });

            if (!content.length) {
                return Promise.resolve(this);
            }

            // We convert the content to JSON
            const JSONcontent = content.map((widget) => {
                return widget.toJSON('update', allLayoutConfigurations);
            });

            return Wirecloud.io.makeRequest(url, {
                method: 'PUT',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(JSONcontent)
            }).then((response) => {
                if ([204, 401, 403, 404, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                this.widgets.filter((widget) => {
                    widget.persist();
                });
                return Promise.resolve(this);
            });
        }

        _buildLayoutFromPreferences(description) {
            const layoutInfo = this.tab.model.preferences.get('baselayout');

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
        }

        /**
         * Used by WorkspaceTabView to when the user changes the preferences
         * for the base layout.
         */
        _updateBaseLayout() {
            // Create the new Layout
            const newBaseLayout = this._buildLayoutFromPreferences();
            newBaseLayout.initialize();

            // Change our base layout
            const oldBaseLayout = this.baseLayout;
            this.baseLayout = newBaseLayout;
            oldBaseLayout.moveTo(newBaseLayout);
        }

        /**
         * Used by WorkspaceTabView to when the user changes the preferences
         * for the screen sizes.
         */
        _updateScreenSizes() {
            if (this.customWidth !== -1) {
                this.tab.quitEditingInterval();
            }

            const updatedScreenSizes = this.tab.model.preferences.get('screenSizes');
            const reqData = [];

            this.resetLayouts();
            this.widgets.forEach((widget) => {
                const currentConfigs = widget.model.layoutConfigurations;

                const widgetReqData = {
                    id: widget.model.id,
                    layoutConfigurations: []
                };

                let indexesToDelete = [];
                currentConfigs.forEach((config, i) => {
                    if (updatedScreenSizes.findIndex((screenSize) => screenSize.id === config.id) === -1) {
                        widgetReqData.layoutConfigurations.push({
                            id: config.id,
                            action: 'delete'
                        });
                        indexesToDelete.push(i);
                    }
                });

                indexesToDelete.sort((a, b) => b - a);

                if (indexesToDelete.length !== currentConfigs.length) {
                    indexesToDelete.forEach((index) => {
                        currentConfigs.splice(index, 1);
                    });
                    indexesToDelete = [];
                }

                const lastExistingScreenSize = currentConfigs[currentConfigs.length - 1];
                updatedScreenSizes.forEach((screenSize) => {
                    const currentConfig = currentConfigs.find((config) => config.id === screenSize.id);
                    if (!currentConfig) {
                        const newConfig = {
                            id: screenSize.id,
                            anchor: lastExistingScreenSize.anchor,
                            width: lastExistingScreenSize.width,
                            height: lastExistingScreenSize.height,
                            relwidth: lastExistingScreenSize.relwidth,
                            relheight: lastExistingScreenSize.relheight,
                            left: lastExistingScreenSize.left,
                            top: lastExistingScreenSize.top,
                            zIndex: lastExistingScreenSize.zIndex,
                            relx: lastExistingScreenSize.relx,
                            rely: lastExistingScreenSize.rely,
                            titlevisible: lastExistingScreenSize.titlevisible,
                            fulldragboard: lastExistingScreenSize.fulldragboard,
                            minimized: lastExistingScreenSize.minimized,
                            moreOrEqual: screenSize.moreOrEqual,
                            lessOrEqual: screenSize.lessOrEqual
                        };

                        currentConfigs.push(newConfig);

                        const reqNewConfig = utils.clone(newConfig);
                        reqNewConfig.action = 'update';

                        widgetReqData.layoutConfigurations.push(reqNewConfig);
                    } else {
                        let requiresUpdate = false;
                        const updatedConfig = {
                            id: screenSize.id,
                        };

                        if (currentConfig.moreOrEqual !== screenSize.moreOrEqual) {
                            updatedConfig.moreOrEqual = currentConfig.moreOrEqual = screenSize.moreOrEqual;
                            requiresUpdate = true;
                        }

                        if (currentConfig.lessOrEqual !== screenSize.lessOrEqual) {
                            updatedConfig.lessOrEqual = currentConfig.lessOrEqual = screenSize.lessOrEqual;
                            requiresUpdate = true;
                        }

                        if (requiresUpdate) {
                            updatedConfig.action = 'update';
                            widgetReqData.layoutConfigurations.push(updatedConfig);
                        }
                    }
                });

                indexesToDelete.forEach((index) => {
                    currentConfigs.splice(index, 1);
                });

                // After modifying all the layoutConfigurations, we need to sort them by moreOrEqual and call the updateWindowSize method
                // to refresh the current layout
                currentConfigs.sort((a, b) => a.moreOrEqual - b.moreOrEqual);
                widget.updateWindowSize(window.innerWidth);

                reqData.push(widgetReqData);
            });
            this.refreshPositionBasedOnZIndex();
            this.paint();

            const url = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                workspace_id: this.tab.workspace.model.id,
                tab_id: this.tab.model.id
            });

            return Wirecloud.io.makeRequest(url, {
                method: 'PUT',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(reqData)
            }).then((response) => {
                if ([204, 401, 403, 404, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                return Promise.resolve(this);
            });
        }

        setCustomDragboardWidth(width) {
            this.customWidth = width;
            this.updateWidgetScreenSize(width);
        }

        restoreDragboardWidth() {
            this.customWidth = -1;
            this.updateWidgetScreenSize(window.innerWidth);
        }

        _addWidget(widget) {
            const z = widget.position.z;

            if (z != null) {
                if (this.widgets[z] != null) {
                    this.widgets.splice(z, 1, this.widgets[z], widget);
                    this.widgets.forEach((value, index) => {
                        // forEach skips undefined indexes
                        value.setPosition({
                            z: index
                        });
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
        }

        _removeWidget(widget) {
            const z = widget.position.z;

            this.widgets.splice(z, 1);
            this.widgets.forEach((value, index) => {
                value.setPosition({
                    z: index
                });
            });

            this.tab.removeChild(widget);
        }

        // Window Resize event dispacher function
        _notifyWindowResizeEvent() {
            const oldWidth = this.dragboardWidth;
            const oldHeight = this.dragboardHeight;
            this._recomputeSize();
            const newWidth = this.dragboardWidth;
            const newHeight = this.dragboardHeight;

            const widthChanged = oldWidth !== newWidth;
            const heightChanged = oldHeight !== newHeight;
            if (widthChanged || heightChanged) {
                this._updateIWidgetSizes(widthChanged, heightChanged);
            }
        }

        /**
         * This function is slow. Please, only call it when really necessary.
         *
         * Updates the width and height info for this dragboard.
         *
         * @private
         */
        _recomputeSize() {
            const cssStyle = document.defaultView.getComputedStyle(this.tab.wrapperElement, null);
            if (cssStyle.getPropertyValue("display") === "none") {
                return; // Do nothing
            }

            // Read padding values
            this.topMargin = parseFloat(cssStyle.getPropertyValue("padding-top"));
            this.bottomMargin = parseFloat(cssStyle.getPropertyValue("padding-bottom"));
            this.leftMargin = parseFloat(cssStyle.getPropertyValue("padding-left"));
            this.rightMargin = parseFloat(cssStyle.getPropertyValue("padding-right"));

            this.dragboardWidth = parseInt(this.tab.wrapperElement.offsetWidth, 10) - this.leftMargin - this.rightMargin;
            this.dragboardHeight = parseInt(this.tab.wrapperElement.parentNode.clientHeight, 10) - this.topMargin - this.bottomMargin;
        }

        /**
         * This method forces recomputing of the iWidgets' sizes.
         *
         * @param {boolean} widthChanged
         * @param {boolean} heightChanged
         *
         * @private
        */
        _updateIWidgetSizes(widthChanged, heightChanged) {
            this.baseLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.freeLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.fulldragboardLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.leftLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.rightLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.bottomLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
            this.topLayout._notifyWindowResizeEvent(widthChanged, heightChanged);
        }

    }

})(Wirecloud.ui, Wirecloud.Utils);
