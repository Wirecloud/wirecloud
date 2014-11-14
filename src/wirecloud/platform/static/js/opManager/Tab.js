/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


/*global Dragboard, gettext, interpolate, LayoutManagerFactory, TabMenuItems, StyledElements, Wirecloud*/

(function () {

    "use strict";

    //CALLBACK METHODS
    var renameSuccess = function renameSuccess(transport) {
        var currentState, layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();

        delete this.tab.workspace.tabsByName[this.tab.getName()];
        this.tab.workspace.tabsByName[this.newName] = this.tab;

        this.tab.tabInfo.name = this.newName;
        this.tab.rename(this.newName);

        if (this.tab.workspace.getVisibleTab() === this.tab) {
            var currentState = Wirecloud.HistoryManager.getCurrentState();
            var newState = Wirecloud.Utils.clone(currentState);
            newState.tab = this.newName;
            Wirecloud.HistoryManager.replaceState(newState);
        }

        layoutManager.logSubTask(gettext('Tab renamed successfully'));
        layoutManager.logStep('');
    };

    var renameError = function renameError(transport, e) {
        var msg = Wirecloud.GlobaLogManager.formatError(gettext("Error renaming tab: %(errorMsg)s."), transport, e);
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
    };

    var deleteSuccess = function deleteSuccess(transport) {
        var iwidgets, i, layoutManager = LayoutManagerFactory.getInstance();

        iwidgets = this.getIWidgets();
        for (i = 0; i < iwidgets.length; i++) {
            iwidgets[i].remove(true);
        }
        this.close();

        layoutManager.logSubTask(gettext('Tab deleted successfully'));
        layoutManager.logStep('');
    };

    var deleteError = function deleteError(transport, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error removing tab: %(errorMsg)s."), transport, e);
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
    };

    /**
     * @private
     *
     * This method is called when tab preferences are changed
     */
    var preferencesChanged = function preferencesChanged(preferences, modifiedValues) {
        var preferenceName;

        if ('baselayout' in modifiedValues) {
            this.dragboard._updateBaseLayout();
        }
    };

    /**
     * @class
     *
     * @param id id inside the notebook
     * @param notebook notebook owner of this Tab
     * @param options options of this Tab
     */
    var Tab = function Tab(id, notebook, options) {

        var button, tabInfo = options.tab_info;
        options.name = tabInfo.name;
        options.closable = false;
        StyledElements.Tab.call(this, id, notebook, options);

        Object.defineProperty(this, 'id', {value: tabInfo.id});
        Object.defineProperty(this, 'workspace', {value: options.workspace});

        this.addEventListener('show', function (tab) {
            var currentState = Wirecloud.HistoryManager.getCurrentState();
            var newState = Wirecloud.Utils.clone(currentState);
            newState.tab = tab.getName();
            if (currentState.tab != null) {
                if (currentState.tab !== newState.tab) {
                    Wirecloud.HistoryManager.pushState(newState);
                }
            } else {
                Wirecloud.HistoryManager.replaceState(newState);
            }
            tab.paint();
        });

        if (!this.workspace.restricted) {
            this.menu_button = new StyledElements.PopupButton({
                'class': 'icon-tab-menu',
                'plain': true,
                'menuOptions': {
                    'position': ['top-left', 'top-right']
                }
            });
            this.menu_button.getPopupMenu().append(new TabMenuItems(this));
            this.menu_button.insertInto(this.tabElement, this.tabElement.childNodes[0]);
        }

        this.tabInfo = tabInfo;
        this.dragboardLayerName = "dragboard_" + this.workspace.workspaceState.id + "_" + this.id;

        this.FloatingWidgetsMenu = null;

        this.preferences = Wirecloud.PreferenceManager.buildPreferences('tab', this.tabInfo.preferences, this);
        this.preferences.addEventListener('pre-commit', preferencesChanged.bind(this));

        this.readOnly = this.workspace.restricted;

        this.dragboard = new Dragboard(this, this.workspace, this.wrapperElement);

        this.markAsVisible = function markAsVisible() {
            var tabUrl = Wirecloud.URLs.TAB_ENTRY.evaluate({'workspace_id': this.workspace.workspaceState.id, 'tab_id': this.id});
            Wirecloud.io.makeRequest(tabUrl, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({visible: "true"}),
                onSuccess: this.markAsVisibleSuccess,
                onFailure: this.markAsVisibleError,
                onException: this.markAsVisibleError
            });
        }.bind(this);

        this.markAsVisibleSuccess = function markAsVisibleSuccess() {
            for (var key in this.workspace.tabInstances) {
                var tab = this.workspace.tabInstances[key];
                tab.tabInfo.visible = false;
            }
            this.tabInfo.visible = true;
        }.bind(this);

        this.markAsVisibleError = function markAsVisibleError(transport, e) {
            Wirecloud.GlobalLogManager.formatAndLog(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), transport, e);
        }.bind(this);
    };
    Tab.prototype = new StyledElements.Tab();

    // ****************
    // PUBLIC METHODS
    // ****************

    Tab.prototype.getName = function getName() {
        return this.tabInfo.name;
    };

    /**
     * NOTE: rename conflicts with StyledElements.Tab.rename
     */
    Tab.prototype.updateInfo = function updateInfo(tabName) {
        var layoutManager, tabUrl, msg = null;

        tabName = tabName.trim();

        if (tabName === "") {
            msg = interpolate(gettext("Error updating a tab: invalid name"), true);
        } else if (this.workspace.tabExists(tabName)) {
            msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workspace.workspaceState.name}, true);
        }

        if (msg !== null) {
            Wirecloud.GlobalLogManager.log(msg);
            return;
        }

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Renaming tab"), 1);
        msg = gettext('Renaming "%(tabname)s" to "%(newname)s"');
        msg = interpolate(msg, {tabname: this.tabInfo.name, newname: tabName}, true);
        layoutManager.logSubTask(msg);

        tabUrl = Wirecloud.URLs.TAB_ENTRY.evaluate({'workspace_id': this.workspace.workspaceState.id, 'tab_id': this.id});
        Wirecloud.io.makeRequest(tabUrl, {
            method: 'PUT',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({'name': tabName}),
            onSuccess: renameSuccess.bind({tab: this, newName: tabName}),
            onFailure: renameError,
            onException: renameError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Tab.prototype.delete = function () {
        var layoutManager, tabUrl, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Removing tab"), 1);
        msg = gettext('Removing "%(tabname)s" from server');
        msg = interpolate(msg, {tabname: this.tabInfo.name}, true);
        layoutManager.logSubTask(msg);

        tabUrl = Wirecloud.URLs.TAB_ENTRY.evaluate({'workspace_id': this.workspace.workspaceState.id, 'tab_id': this.id});
        Wirecloud.io.makeRequest(tabUrl, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: deleteSuccess.bind(this),
            onFailure: deleteError,
            onException: deleteError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Tab.prototype.paint = function paint() {
        this.getDragboard().paint();
    };

    Tab.prototype.getDragboard = function getDragboard() {
        return this.dragboard;
    };

    Tab.prototype.getIWidgets = function getIWidgets() {
        return this.dragboard.getIWidgets();
    };

    /**
    * Gets the banner related to the workspace this dragboard belongs to
    */
    Tab.prototype.getHeader = function getHeader() {
        return this.workspace.getHeader();
    };

    Tab.prototype.hasIWidget = function hasIWidget(iWidgetIds) {
        var i;

        for (i in iWidgetIds) {
            if (this.dragboard.getIWidget(iWidgetIds[i])) {
                return true;
            }
        }

        return false;
    };

    Tab.prototype.hasReadOnlyIWidgets = function hasReadOnlyIWidgets() {
        return this.dragboard.hasReadOnlyIWidgets();
    };

    Tab.prototype.getPreferencesWindow = function getPreferencesWindow() {
        if (this.pref_window_menu == null) {
            this.pref_window_menu = new Wirecloud.ui.PreferencesWindowMenu('tab', this.preferences);
        }
        return this.pref_window_menu;
    };

    Tab.prototype.isAllowed = function isAllowed(action) {
        switch (action) {
        case "remove":
            return !this.readOnly && Object.keys(this.workspace.tabInstances).length > 1 && !this.hasReadOnlyIWidgets();
        default:
            return false;
        }
    };

    Tab.prototype.repaint = function repaint(temporal) {
        StyledElements.Tab.prototype.repaint.call(this, temporal);

        if (!temporal) {
            this.dragboard._notifyWindowResizeEvent();
        }
    };

    Tab.prototype.destroy = function destroy() {
        if (this.pref_window_menu != null) {
            this.pref_window_menu.destroy();
            this.pref_window_menu = null;
        }

        this.preferences.destroy();
        this.preferences = null;

        if (this.menu_button) {
            this.menu_button.destroy();
            this.menu_button = null;
        }

        this.dragboard.destroy();
        this.dragboard = null;

        StyledElements.Alternative.prototype.destroy.call(this);
    };

    window.Tab = Tab;
})();
