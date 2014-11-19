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


function Workspace(workspaceState, resources) {

    // ****************
    // CALLBACK METHODS
    // ****************

    /**
     * Initializes this Workspace in failsafe mode.
     */
    var _failsafeInit = function(transport, e) {
        this.valid = false;

        // Log it on the log console
        Wirecloud.GlobalLogManager.formatAndLog(gettext("Error loading workspace: %(errorMsg)s"), transport, e);

        // Show a user friend alert
        var layoutManager = LayoutManagerFactory.getInstance();
        var msg = gettext('Error loading workspace. Please, change active workspace or create a new one.');
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();

        // Clean current status
        this.varmanager = null;
        this.contextManager = null;
        this.wiring = null;

        // Failsafe workspace status
        layoutManager.currentViewType = "dragboard"; // workaround
        this.preferences = Wirecloud.PreferenceManager.buildPreferences('workspace', {}, this)

        var initialTab = {
            'id': 0,
            'readOnly': "true",
            'iwidgets': [],
            'name': gettext("Unusable Tab"),
            'visible': 1,
            'preferences': {}
        };

        this.workspaceState = {
            'tabs': [
                initialTab
            ]
        };
        this.tabInstances = {};
        this.tabsByName = {};
        // TODO
        this.notebook.clear()
        this.tabInstances[0] = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': initialTab, 'workspace': this});

        this.loaded = true;

        layoutManager.logStep('');
    };

    var loadWorkspace = function () {
        var layoutManager, params, preferenceValues, iwidgets;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logStep('');
        layoutManager.logSubTask(gettext('Processing workspace data'));

        try {
            // JSON-coded iWidget-variable mapping
            // Load workspace preferences
            params = this.workspaceState.empty_params;
            preferenceValues = this.workspaceState.preferences;
            this.preferences = Wirecloud.PreferenceManager.buildPreferences('workspace', preferenceValues, this, params);

            this.restricted = !this.owned /* TODO */ || Wirecloud.contextManager.get('mode') === 'embedded';
            this.removable = !this.restricted && this.workspaceState.removable;

            // Load workspace tabs
            var tabs = this.workspaceState.tabs;
            var default_initial_tab = null;
            var loading_tab = this.notebook.createTab({'closeable': false});

            if (tabs.length > 0) {
                default_initial_tab = tabs[0];

                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    var tabInstance = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': tab, 'workspace': this});
                    this.tabInstances[tab.id] = tabInstance;
                    this.tabsByName[tabInstance.getName()] = tabInstance;

                    if (tab.visible) {
                        default_initial_tab = tabInstance;
                    }
                }
            }

            this.contextManager = new Wirecloud.ContextManager(this, this.workspaceState.context);
            this.wiring = new Wirecloud.Wiring(this);
            iwidgets = this.getIWidgets();
            for (i = 0; i < iwidgets.length; i += 1) {
                iwidgets[i].internal_iwidget.addEventListener('removed', this._iwidget_removed);
                this.events.iwidgetadded.dispatch(this, iwidgets[i].internal_iwidget);
            }

            this.valid = true;

            // FIXME
            LayoutManagerFactory.getInstance().mainLayout.repaint();
            LayoutManagerFactory.getInstance().header._notifyWorkspaceLoaded(this);
            // END FIXME

            this.wiring.load(this.workspaceState.wiring);

            var initial_tab = Wirecloud.HistoryManager.getCurrentState().tab;
            if (initial_tab != null && this.tabsByName[initial_tab]) {
                this.notebook.goToTab(this.tabsByName[initial_tab]);
            } else if (default_initial_tab != null) {
                this.notebook.goToTab(default_initial_tab);
            }
            loading_tab.close();

        } catch (error) {
            // Error during initialization
            // Loading in failsafe mode
            _failsafeInit.call(this, transport, error);
            return;
        }

        this.loaded = true;

        layoutManager.logStep('');
        Wirecloud.GlobalLogManager.log(gettext('Workspace loaded'), Wirecloud.constants.LOGGING.INFO_MSG);

        // tutorial layer for empty workspaces
        this.emptyWorkspaceInfoBox = document.createElement('div');
        this.emptyWorkspaceInfoBox.className = 'emptyWorkspaceInfoBox';
        var subBox = document.createElement('div');
        subBox.className = 'alert alert-info alert-block';

        // Title
        var pTitle = document.createElement('h4');
        pTitle.textContent = gettext("Hey! Welcome to Wirecloud! This is an empty workspace");
        subBox.appendChild(pTitle);

        // Message
        var message = document.createElement('p');
        message.innerHTML = gettext("To create really impressive mashup applications, the first step to take is always to add widgets in this area. To do so, please surf the <strong>Marketplace</strong> the place where resources are all in there, by clicking on the proper button up in the right corner!");
        subBox.appendChild(message);

        subBox.appendChild(Wirecloud.TutorialCatalogue.buildTutorialReferences(['basic-concepts']));

        this.emptyWorkspaceInfoBox.appendChild(subBox);
        this.notebook.getTabByIndex(0).wrapperElement.appendChild(this.emptyWorkspaceInfoBox);
        if (this.getIWidgets().length !== 0) {
            this.emptyWorkspaceInfoBox.classList.add('hidden');
        }
    }

    var onError = function (transport, e) {
        _failsafeInit.call(this, transport, e);
    }

    var renameError = function(transport, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error renaming workspace: %(errorMsg)s."), transport, e);
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
    };

    var deleteSuccess = function (transport) {
        this.events.removed.dispatch(this);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Workspace removed successfully'));
        LayoutManagerFactory.getInstance().logStep('');
    };

    var deleteError = function(transport, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error removing workspace, changes will not be saved: %(errorMsg)s."), transport, e);
        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();

        LayoutManagerFactory.getInstance()._notifyPlatformReady();
    };

    var publishSuccess = function publishSuccess(options, response) {
        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logSubTask(gettext('Workspace published successfully'));
        layoutManager.logStep('');
        layoutManager._notifyPlatformReady();

        Wirecloud.LocalCatalogue._includeResource(JSON.parse(response.responseText));
        layoutManager.viewsByName.myresources.viewsByName.search.mark_outdated();

        if (typeof options.onSuccess === 'function') {
            try {
                options.onSuccess();
            } catch (e) {}
        }
    };

    var publishFailure = function publishFailure(options, transport, e) {
        var layoutManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();

        msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error publishing workspace: %(errorMsg)s."), transport, e);
        layoutManager._notifyPlatformReady();

        if (typeof options.onFailure === 'function') {
            try {
                options.onFailure(msg);
            } catch (e) {}
        }
    };

    var mergeSuccess = function(transport) {
        // JSON-coded new published workspace id and mashup url mapping
        var response = transport.responseText;
        var data = JSON.parse(response);
        //update the new wsInfo
        var workspace = new Workspace(Wirecloud.workspaceInstances[data.merged_workspace_id]);
        Wirecloud.changeActiveWorkspace(workspace);
        LayoutManagerFactory.getInstance().hideCover();
    }

    var mergeError = function(transport, e) {
        var layoutManager, msg;

        msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error merging workspaces: %(errorMsg)s."), transport, e);

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logStep('');
        layoutManager._notifyPlatformReady();

        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
    }

    //**** TAB CALLBACK*****
    var createTabSuccess = function(transport) {
        var layoutManager = LayoutManagerFactory.getInstance();

        var response = transport.responseText;
        var tabInfo = JSON.parse(response);

        tabInfo.iwidgets = [];
        tabInfo.preferences = {};

        var newTab = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': tabInfo, 'workspace': this});
        this.tabInstances[tabInfo.id] = newTab;
        this.tabsByName[newTab.getName()] = newTab;

        layoutManager.logSubTask(gettext('Tab added successfully'));
        layoutManager.logStep('');
    };

    var createTabError = function(transport, e) {
        Wirecloud.GlobalLogManager.formatAndLog(gettext("Error creating a tab: %(errorMsg)s."), transport, e);
    };

    var iwidget_removed = function iwidget_removed(iwidget) {
        this.events.iwidgetremoved.dispatch(this, iwidget);

        // emptyWorkspaceInfoBox
        if (this.getIWidgets().length == 0) {
            this.emptyWorkspaceInfoBox.classList.remove('hidden');
        }
    };

    // ****************
    // PUBLIC METHODS
    // ****************

    Workspace.prototype.addInstance = function addInstance(widget, options) {
        this.getVisibleTab().getDragboard().addInstance(widget, options);
    };

    Workspace.prototype.getHeader = function(){
        return this.headerHTML;
    }

    Workspace.prototype.rename = function rename(name) {
        var layoutManager, workspaceUrl, msg = null;

        name = name.trim();

        if (name === "") {
            throw new TypeError(gettext("Invalid workspace name"));
        }

        if (msg !== null) {
            Wirecloud.GlobalLogManager.log(msg);
            return;
        }

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Renaming workspace"), 1);
        msg = gettext('Renaming "%(workspacename)s" to "%(newname)s"');
        msg = interpolate(msg, {workspacename: this.workspaceState.name, newname: name}, true);
        layoutManager.logSubTask(msg);

        workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({workspace_id: this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({name: name}),
            onSuccess: function () {
                var state, layoutManager = LayoutManagerFactory.getInstance();

                this.workspaceState.name = name;
                this.contextManager.modify({'name': name});
                state = {
                    workspace_creator: this.workspaceState.creator,
                    workspace_name: name,
                    view: "workspace",
                    tab: Wirecloud.HistoryManager.getCurrentState().tab
                };
                Wirecloud.HistoryManager.replaceState(state);

                layoutManager.header.refresh();
                layoutManager.logSubTask(gettext('Workspace renamed successfully'));
                layoutManager.logStep('');
            }.bind(this),
            onFailure: renameError,
            onException: renameError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Workspace.prototype.delete = function () {
        var layoutManager, workspaceUrl;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Removing workspace"), 2);
        msg = gettext('Removing "%(workspacename)s"');
        msg = interpolate(msg, {workspacename: this.workspaceState.name}, true);
        layoutManager.logSubTask(msg);

        workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({workspace_id: this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: deleteSuccess.bind(this),
            onFailure: deleteError,
            onException: deleteError
        });
    };

    Workspace.prototype.getName = function () {
        return this.workspaceState.name;
    }

    Workspace.prototype.initGUI = function initGUI() {

        this.notebook.addEventListener("tabDeletion", function (notebook, tab) {
            delete this.tabInstances[tab.id];
            delete this.tabsByName[tab.getName()];
        }.bind(this));

        if (this.isAllowed('edit')) {
            this.notebook.addEventListener('newTab', this.addTab.bind(this));
        }

        if (Wirecloud.Utils.isFullscreenSupported()) {
            this.fullscreenButton = new StyledElements.StyledButton({'iconClass': 'icon-resize-full', title: gettext('Full screen')});
            this.notebook.addButton(this.fullscreenButton);
            Wirecloud.Utils.onFullscreenChange(this.notebook, function () {
                this.fullscreenButton.removeIconClassName('icon-resize-full');
                this.fullscreenButton.removeIconClassName('icon-resize-small');
                if (this.notebook.fullscreen) {
                    this.fullscreenButton.addIconClassName('icon-resize-small');
                    this.fullscreenButton.setTitle(gettext('Exit full screen'));
                    this.notebook.addClassName('fullscreen');
                } else {
                    this.fullscreenButton.addIconClassName('icon-resize-full');
                    this.fullscreenButton.setTitle(gettext('Full screen'));
                    this.notebook.removeClassName('fullscreen');
                }
            }.bind(this));
            this.fullscreenButton.addEventListener('click', function () {
                if (this.notebook.fullscreen) {
                    this.notebook.exitFullscreen();
                } else {
                    this.notebook.requestFullscreen();
                }
            }.bind(this));
        }

        if (Wirecloud.contextManager.get('mode') === 'embedded') {
            this.seeOnWirecloudButton = new StyledElements.StyledButton({
                'class': 'powered-by-wirecloud'
            });
            this.notebook.addButton(this.seeOnWirecloudButton);
            this.seeOnWirecloudButton.addEventListener('click', function () {
                var url = Wirecloud.URLs.WORKSPACE_VIEW.evaluate({owner: encodeURIComponent(this.workspaceState.creator), name: encodeURIComponent(this.workspaceState.name)});
                window.open(url, '_blank')
            }.bind(this));
        } else {
            this.poweredByWirecloudButton = new StyledElements.StyledButton({
                'class': 'powered-by-wirecloud'
            });
            this.notebook.addButton(this.poweredByWirecloudButton);
            this.poweredByWirecloudButton.addEventListener('click', function () {window.open('http://conwet.fi.upm.es/wirecloud/', '_blank')});
        }

        LayoutManagerFactory.getInstance().viewsByName.workspace.repaint();
    };

    Workspace.prototype.getIWidget = function(iwidgetId) {
        for (var key in this.tabInstances) {
            var tab = this.tabInstances[key];
            var iwidget = tab.getDragboard().getIWidget(iwidgetId);

            if (iwidget) {
                return iwidget;
            }
        }
        return null;
    }

    Workspace.prototype.isValid = function() {
        return this.valid;
    }

    Workspace.prototype.getTab = function(tabId) {
        return this.tabInstances[tabId];
    }

    Workspace.prototype.getVisibleTab = function() {
        if (!this.loaded)
            return;

        return this.notebook.getVisibleTab();
    }

    Workspace.prototype.tabExists = function (tabName) {
        return tabName in this.tabsByName;
    };

    Workspace.prototype.addTab = function() {
        var layoutManager, msg, counter, prefixName, tabName, url;

        if (!this.isValid()) {
            return;
        }

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Adding a tab to the workspace"), 1);
        msg = gettext('Adding tab to "%(workspacename)s"');
        msg = interpolate(msg, {workspacename: this.workspaceState.name}, true);
        layoutManager.logSubTask(msg);

        counter = Object.keys(this.tabInstances).length + 1;
        prefixName = gettext("Tab");
        tabName = prefixName + " " + counter.toString();
        //check if there is another tab with the same name
        while (this.tabExists(tabName)) {
            tabName = prefixName + " " + (counter++).toString();
        }
        url = Wirecloud.URLs.TAB_COLLECTION.evaluate({workspace_id: this.id});
        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({name: tabName}),
            onSuccess: createTabSuccess.bind(this),
            onFailure: createTabError,
            onException: createTabError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    }

    //It returns if the tab can be removed and shows an error window if it isn't possible
    Workspace.prototype.removeTab = function(tab) {
        var msg = null;
        if (Object.keys(this.tabInstances).length <= 1) {
            msg = gettext("there must be one tab at least");
            msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {
                errorMsg: msg
            }, true);
        } else if (tab.hasReadOnlyIWidgets()) {
            msg = gettext("it contains some widgets that cannot be removed");
            msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {
                errorMsg: msg
            }, true);
        }

        if (msg) { //It cannot be deleted
            Wirecloud.GlobalLogManager.log(msg);
            (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            return false;
        }

        tab.delete();

        return true;
    }

    Workspace.prototype.unload = function() {

        var layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logSubTask(gettext("Unloading current workspace"));

        this.loaded = false;

        this.notebook.clear();
        this.tabInstances = null;
        this.tabsByName = null;

        if (this.pref_window_menu != null) {
            this.pref_window_menu.destroy();
            this.pref_window_menu = null;
        }

        if (this.preferences) {
            this.preferences.destroy();
            this.preferences = null;
        }

        if (this.wiring !== null) {
            this.wiring.destroy();
            this.wiring = null;
        }

        this.contextManager = null;

        layoutManager.logStep('');
        Wirecloud.GlobalLogManager.log(gettext('workspace unloaded'), Wirecloud.constants.LOGGING.INFO_MSG);
        Wirecloud.GlobalLogManager.newCycle();
    }

    Workspace.prototype.addIWidget = function(tab, iwidget, iwidgetJSON, options) {
        // emptyWorkspaceInfoBox
        this.emptyWorkspaceInfoBox.classList.add('hidden');

        iwidget.internal_iwidget.addEventListener('removed', this._iwidget_removed);
        this.events.iwidgetadded.dispatch(this, iwidget.internal_iwidget);

        options.setDefaultValues.call(this, iwidget.id);

        iwidget.paint();
    };

    Workspace.prototype.getIWidgets = function() {
        var iWidgets = [];
        for (var keys in this.tabInstances) {
            iWidgets = iWidgets.concat(this.tabInstances[keys].getDragboard().getIWidgets());
        }

        return iWidgets;
    }

    Workspace.prototype.getActiveDragboard = function () {
        var current_tab = this.notebook.getVisibleTab();
        if (current_tab) {
            return current_tab.getDragboard();
        } else {
            return null;
        }
    };

    Workspace.prototype.publish = function(data, options) {
        var layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext('Publishing current workspace'), 1);

        if (options == null) {
            options = {};
        }

        var payload = new FormData();
        if (data.image != null) {
            payload.append('image', data.image);
        }
        delete data.image;
        payload.append('json', JSON.stringify(data));
        var workspaceUrl = Wirecloud.URLs.WORKSPACE_PUBLISH.evaluate({workspace_id: this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'POST',
            requestHeaders: {'Accept': 'application/json'},
            postBody: payload,
            context: {workspace: this, params: data, options: options},
            onSuccess: publishSuccess.bind(null, options),
            onFailure: publishFailure.bind(null, options),
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    Workspace.prototype.mergeWith = function(workspace) {
        var workspaceUrl, layoutManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Merging workspaces"), 1);
        msg = gettext('Merging "%(srcworkspace)s" into "%(dstworkspace)s"');
        msg = interpolate(msg, {srcworkspace: workspace.name, dstworkspace: this.getName()}, true);
        layoutManager.logSubTask(msg);

        workspaceUrl = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({to_ws_id: this.id});
        Wirecloud.io.markeRequest(workspaceUrl, {
            method: 'POST',
            contentType: 'application/json',
            postBody: JSON.stringify({'workspace': from_ws_id}),
            onSuccess: mergeSuccess,
            onFailure: mergeError
        });
    };

    // Checks if this workspace is shared with other users
    Workspace.prototype.isShared = function() {
        return this.workspaceState['shared'];
    };

    /**
     * Checks when an action, defined by a basic policy, can be performed.
     */
    Workspace.prototype._isAllowed = function _isAllowed(action) {
        return Wirecloud.PolicyManager.evaluate('workspace', action);
    };

    /**
     * Checks if an action can be performed in this workspace by current user.
     */
    Workspace.prototype.isAllowed = function (action) {
        var username, workspaces, nworkspaces;

        if (action !== "remove" && (!this.valid || this.restricted)) {
            return false;
        }

        switch (action) {
        case "remove":
            username = Wirecloud.contextManager.get('username');
            workspaces = Wirecloud.workspacesByUserAndName[username];
            if (workspaces != null) {
                nworkspaces = Object.keys(workspaces).length;
            } else {
                nworkspaces = 0;
            }
            return /* opManager.isAllow('add_remove_workspaces') && */ this.removable && (nworkspaces > 1);
        case "merge_workspaces":
            return this._isAllowed('add_remove_iwidgets') || this._isAllowed('merge_workspaces');
        case "catalogue_view_widgets":
            return this._isAllowed('add_remove_iwidgets');
        case "catalogue_view_mashups":
            return this.isAllowed('add_remove_workspaces') || this._isAllowed('merge_workspaces');
        case "update_preferences":
            return this.removable && this._isAllowed('change_workspace_preferences');
        case "rename":
            return this.removable && this._isAllowed('rename_workspaces');
        case "edit":
            return this.removable;
        default:
            return this._isAllowed(action);
        }
    };

    // *****************
    //  CONSTRUCTOR
    // *****************

    Object.defineProperty(this, 'id', {value: workspaceState.id});
    Object.defineProperty(this, 'resources', {value: resources});
    Object.defineProperty(this, 'owned', {value: workspaceState.owned});
    Object.defineProperty(this, '_iwidget_removed', {value: iwidget_removed.bind(this)});
    this.workspaceState = workspaceState;
    this.tabInstances = {};
    this.tabsByName = {};
    this.highlightTimeouts = {};
    this.wiring = null;
    this.contextManager = null;
    this.loaded = false;
    this.valid = false;

    StyledElements.ObjectWithEvents.call(this, ['iwidgetadded', 'iwidgetremoved', 'removed']);

    this.notebook = new StyledElements.StyledNotebook({'class': 'workspace se-notebook-bottom'});
    LayoutManagerFactory.getInstance().viewsByName['workspace'].clear();
    LayoutManagerFactory.getInstance().viewsByName['workspace'].appendChild(this.notebook);

    loadWorkspace.call(this);
    this.initGUI();

    /*
     * OPERATIONS
     */
    this.markAsActive = function () {
        var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({active: true}),
            onSuccess: this.markAsActiveSuccess.bind(this),
            onFailure: this.markAsActiveError.bind(this)
        });
    }.bind(this);

    this.markAsActiveSuccess = function() {
        this.workspaceState.active = true;
        if (this.activeEntryId != null) {
            this.confMenu.removeOption(this.activeEntryId);
            this.activeEntryId = null;
        }
    }.bind(this);

    this.markAsActiveError = function(transport, e) {
        Wirecloud.GlobalLogManager.formatAndLog(gettext("Error marking as first active workspace, changes will not be saved: %(errorMsg)s."), transport, e);
    }.bind(this);
};
Workspace.prototype = new StyledElements.ObjectWithEvents();

Workspace.prototype.getPreferencesWindow = function getPreferencesWindow() {
    if (this.pref_window_menu == null) {
        this.pref_window_menu = new Wirecloud.ui.PreferencesWindowMenu('workspace', this.preferences);
    }
    return this.pref_window_menu;
};

Workspace.prototype.drawAttention = function drawAttention(iWidgetId) {
    var iWidget = this.getIWidget(iWidgetId);
    if (iWidget !== null) {
        this.highlightTab(iWidget.layout.dragboard.tab);
        iWidget.layout.dragboard.raiseToTop(iWidget);
        iWidget.highlight();
    }
};

Workspace.prototype.highlightTab = function highlightTab(tab) {
    if (typeof tab === 'number') {
        tab = this.tabInstances[tab];
    }

    if (!(tab instanceof Tab)) {
        throw new TypeError();
    }

    tab.tabElement.classList.add("highlight");
};

Workspace.prototype.unhighlightTab = function unhighlightTab(tab) {
    if (typeof tab === 'number') {
        tab = this.tabInstances[tab];
    }

    if (!(tab instanceof Tab)) {
        throw new TypeError();
    }

    tab.tabElement.classList.remove("highlight");
};
