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


function Workspace (workspaceState) {

    Workspace.prototype._updateAddTabButton = function () {
        if (this.addTabButton) {
            this.addTabButton.setDisabled(!this.isAllowed('add_tab'));
        }
    }

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
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);

        // Clean current status
        this.varmanager = null;
        this.contextManager = null;
        this.wiring = null;
        this.wiringInterface = null;

        // Failsafe workspace status
        layoutManager.currentViewType = "dragboard"; // workaround
        this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('workspace', {}, this)

        var initialTab = {
            'id': 0,
            'readOnly': "true",
            'iwidgets': [],
            'name': gettext("Unusable Tab"),
            'visible': 1,
            'preferences': {}
        };

        this.workspaceGlobalInfo = {
                                       'tabs': [
                                         initialTab
                                       ]
                                   };
        this.tabInstances = new Hash();
        // TODO
        this.notebook.clear()
        this.tabInstances[0] = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': initialTab, 'workspace': this});

        this.loaded = true;

        layoutManager.logStep('');
        OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
    };

    // Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
    var loadWorkspace = function (transport) {
        var layoutManager, params, param, preferencesWindow, preferenceValues, iwidgets;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logStep('');
        layoutManager.logSubTask(gettext('Processing workspace data'));

        try {
            // JSON-coded iWidget-variable mapping
            this.workspaceGlobalInfo = JSON.parse(transport.responseText);

            // Load workspace preferences
            params = this.workspaceGlobalInfo.empty_params;
            preferenceValues = this.workspaceGlobalInfo['preferences'];
            this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('workspace', preferenceValues, this, params);

            // Check if the workspace needs to ask some values before loading this workspace
            if (this.workspaceGlobalInfo.empty_params.length > 0) {
                preferenceValues = {};
                for (i = 0; i < params.length; i += 1) {
                    param = params[i];
                    if (this.workspaceGlobalInfo.preferences[param] != null) {
                        preferenceValues[param] = this.workspaceGlobalInfo.preferences[param];
                    }
                }

                this.preferences.addCommitHandler(function() {
                    setTimeout(function() {
                        OpManagerFactory.getInstance().changeActiveWorkspace(this);
                    }.bind(this), 0);
                }.bind(this));
                preferencesWindow = this.getPreferencesWindow();
                preferencesWindow.setCancelable(false);
                preferencesWindow.show();
                return;
            }

            // Load workspace tabs
            var tabs = this.workspaceGlobalInfo['tabs'];
            var visibleTabId = null;
            var loading_tab = this.notebook.createTab({'closeable': false});

            if (tabs.length > 0) {
                visibleTabId = tabs[0].id;

                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    var tabInstance = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': tab, 'workspace': this});
                    this.tabInstances.set(tab.id, tabInstance);

                    if (tab.visible) {
                        visibleTabId = tab.id;
                    }
                }
            }

            this.varManager = new VarManager(this);

            this.contextManager = new Wirecloud.ContextManager(this, this.workspaceGlobalInfo.context);
            this.wiring = new Wirecloud.Wiring(this);
            iwidgets = this.getIWidgets();
            for (i = 0; i < iwidgets.length; i += 1) {
                this.events.iwidgetadded.dispatch(this, iwidgets[i].internal_iwidget);
            }

            // FIXME
            LayoutManagerFactory.getInstance().mainLayout.repaint();
            LayoutManagerFactory.getInstance().header._notifyWorkspaceLoaded(this);
            // END FIXME

            this.restricted = !this.isOwned() && this.isShared();
            this.removable = !this.restricted && this.workspaceGlobalInfo.removable;
            this.valid = true;

            if (this.initial_tab_id && this.tabInstances.get(this.initial_tab_id)) {
                visibleTabId = this.initial_tab_id;
            }

            this.wiring.load(this.workspaceGlobalInfo.wiring);
            this.notebook.goToTab(this.tabInstances.get(visibleTabId));
            loading_tab.close();

        } catch (error) {
            // Error during initialization
            // Loading in failsafe mode
            _failsafeInit.call(this, transport, error);
            return;
        }

        this.loaded = true;

        layoutManager.logStep('');
        OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
        Wirecloud.GlobalLogManager.log(gettext('workspace loaded'), Constants.Logging.INFO_MSG);

        // tutorial layer for empty workspaces
        this.emptyWorkspaceInfoBox = document.createElement('div');
        this.emptyWorkspaceInfoBox.addClassName('emptyWorkspaceInfoBox');
        var subBox = document.createElement('div');
        subBox.addClassName('alert alert-info alert-block');

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
            this.emptyWorkspaceInfoBox.addClassName('hidden');
        }
    }

    var onError = function (transport, e) {
        _failsafeInit.call(this, transport, e);
    }

    var renameError = function(transport, e) {
        var layoutManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();

        msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error renaming workspace: %(errorMsg)s."), transport, e);
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    };

    var deleteSuccess = function (transport) {
        OpManagerFactory.getInstance().removeWorkspace(this.id);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Workspace renamed successfully'));
        LayoutManagerFactory.getInstance().logStep('');
    };

    var deleteError = function(transport, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error removing workspace, changes will not be saved: %(errorMsg)s."), transport, e);
        LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);

        LayoutManagerFactory.getInstance()._notifyPlatformReady();
    };

    var publishSuccess = function publishSuccess(options, transport) {
        var layoutManager, marketplaceView;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logSubTask(gettext('Workspace published successfully'));
        layoutManager.logStep('');
        layoutManager._notifyPlatformReady();

        marketplaceView = layoutManager.viewsByName.marketplace;
        marketplaceView.viewsByName.local.viewsByName.search.mark_outdated();

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
        opManager = OpManagerFactory.getInstance();
        opManager.changeActiveWorkspace(opManager.workspaceInstances.get(data.merged_workspace_id));
        LayoutManagerFactory.getInstance().hideCover();
    }

    var mergeError = function(transport, e) {
        var layoutManager, msg;

        msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error merging workspaces: %(errorMsg)s."), transport, e);

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logStep('');
        layoutManager._notifyPlatformReady();

        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    }

    //**** TAB CALLBACK*****
    var createTabSuccess = function(transport) {
        var layoutManager = LayoutManagerFactory.getInstance();

        var response = transport.responseText;
        var tabInfo = JSON.parse(response);

        tabInfo.iwidgets = [];
        tabInfo.preferences = {};

        var newTab = this.notebook.createTab({'tab_constructor': Tab, 'tab_info': tabInfo, 'workspace': this});
        this.tabInstances.set(tabInfo.id, newTab);

        layoutManager.logSubTask(gettext('Tab added successfully'));
        layoutManager.logStep('');
    };

    var createTabError = function(transport, e) {
        Wirecloud.GlobalLogManager.formatAndLog(gettext("Error creating a tab: %(errorMsg)s."), transport, e);
    };

    // ****************
    // PUBLIC METHODS
    // ****************


    Workspace.prototype.checkForWidgetUpdates = function() {
        var i, iwidgets;

        iwidgets = this.getIWidgets();
        for (i = 0; i < iwidgets.length; i += 1) {
            iwidgets[i]._updateVersionButton();
        }
    };

    Workspace.prototype.iwidgetUnloaded = function(iwidgetId) {
        var iwidget = this.getIWidget(iwidgetId);
        if (iwidget == null)
            return;

        iwidget._notifyUnloaded();
    }

    Workspace.prototype.sendBufferedVars = function (async) {
        if (this.varManager) this.varManager.sendBufferedVars(async);
    }

    Workspace.prototype.getHeader = function(){
        return this.headerHTML;
    }

    Workspace.prototype.rename = function rename(name) {
        var layoutManager, workspaceUrl, msg = null;

        name = name.strip()

        if (name === "") {
            msg = gettext("Invalid workspace name");
        } else if (OpManagerFactory.getInstance().workspaceExists(name)) {
            msg = interpolate(gettext("Error updating workspace: the name %(name)s is already in use."), {name: name}, true);
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
            postBody: JSON.stringify({name: name}),
            onSuccess: function () {
                var state, layoutManager = LayoutManagerFactory.getInstance();

                this.workspaceState.name = name;
                this.contextManager.modify({'name': name});
                layoutManager.header.refresh();
                state = {
                    workspace_creator: this.workspaceState.creator,
                    workspace_name: name,
                    view: "workspace",
                    tab: HistoryManager.getCurrentState().tab
                };
                HistoryManager.pushState(state);

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
            onSuccess: deleteSuccess.bind(this),
            onFailure: deleteError,
            onException: deleteError
        });
    };

    Workspace.prototype.getName = function () {
        return this.workspaceState.name;
    }

    Workspace.prototype.getVarManager = function () {
        return this.varManager;
    }

    Workspace.prototype.downloadWorkspaceInfo = function (initial_tab) {
        // TODO
        this.addTabButton = new StyledElements.StyledButton({
            'class': 'icon-add-tab',
            'plain': true,
            'title': gettext('Add a new tab')
        });

        this.poweredByWirecloudButton = new StyledElements.StyledButton({
            'class': 'powered-by-wirecloud'
        });

        this.notebook = new StyledElements.StyledNotebook({'class': 'workspace'});
        this.notebook.addButton(this.addTabButton);
        this.addTabButton.addEventListener('click', this.addTab.bind(this));
        this.notebook.addButton(this.poweredByWirecloudButton);
        this.poweredByWirecloudButton.addEventListener('click', function () {window.open('http://conwet.fi.upm.es/wirecloud/', '_blank')});
        LayoutManagerFactory.getInstance().viewsByName['workspace'].clear();
        LayoutManagerFactory.getInstance().viewsByName['workspace'].appendChild(this.notebook);

        LayoutManagerFactory.getInstance().logSubTask(gettext("Downloading workspace data"), 1);
        this.initial_tab_id = initial_tab;
        var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'GET',
            onSuccess: loadWorkspace.bind(this),
            onFailure: onError.bind(this)
        });
    };

    Workspace.prototype.getIWidget = function(iwidgetId) {
        var i, tab_keys = this.tabInstances.keys();
        for (i = 0; i < tab_keys.length; i += 1) {
            var tab = this.tabInstances.get(tab_keys[i]);
            var iwidget = tab.getDragboard().getIWidget(iwidgetId);

            if (iwidget) {
                return iwidget;
            }
        }
        return null;
    }

    Workspace.prototype.prepareToShow = function() {
        var layoutManager = LayoutManagerFactory.getInstance();

        if (!this.loaded) {
            return;
        }


    };

    Workspace.prototype.isValid = function() {
        return this.valid;
    }

    Workspace.prototype.getTab = function(tabId) {
        return this.tabInstances.get(tabId);
    }

    Workspace.prototype.setTab = function(tab) {
        if (!this.loaded || tab == null) {
            return;
        }
        if (!(tab instanceof Tab)) {
            throw new TypeError();
        }

        this.notebook.goToTab(tab);
    }

    Workspace.prototype.getVisibleTab = function() {
        if (!this.loaded)
            return;

        return this.notebook.getVisibleTab();
    }

    Workspace.prototype.tabExists = function(tabName){
        var tabValues = this.tabInstances.values();
        for (var i = 0; i < tabValues.length; i++) {
            if (tabValues[i].tabInfo.name === tabName) {
                return true;
            }
        }
        return false;
    }

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

        counter = this.tabInstances.keys().length + 1;
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
            postBody: Object.toJSON({name: tabName}),
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
        if (this.tabInstances.keys().length <= 1) {
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
            //LayoutManagerFactory.getInstance().hideCover();
            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            return false;
        }

        tab.delete();

        return true;
    }

    Workspace.prototype.unloadTab = function(tabId) {
        if (!this.valid)
            return;

        var tab = this.tabInstances.get(tabId);

        this.tabInstances.unset(tabId);
        tab.close();
        tab.destroy();
    };

    Workspace.prototype.unload = function() {

        var layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logSubTask(gettext("Unloading current workspace"));

        this.loaded = false;

        // Unload Wiring Interface
        // TODO Wiring Interface should be shared between Workspaces
        if (this.wiringInterface !== null) {
            this.wiringInterface.saveWiring();
        }

        this.sendBufferedVars(false);

        // After that, tab info is managed
        var tabKeys = this.tabInstances.keys();

        for (var i=0; i<tabKeys.length; i++) {
            this.unloadTab(tabKeys[i]);
        }

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
        Wirecloud.GlobalLogManager.log(gettext('workspace unloaded'), Constants.Logging.INFO_MSG);
        Wirecloud.GlobalLogManager.newCycle();
    }

    Workspace.prototype.addIWidget = function(tab, iwidget, iwidgetJSON, options) {
        // emptyWorkspaceInfoBox
        this.emptyWorkspaceInfoBox.addClassName('hidden');

        this.varManager.addInstance(iwidget, iwidgetJSON, tab);
        this.events.iwidgetadded.dispatch(this, iwidget.internal_iwidget);

        options.setDefaultValues.call(this, iwidget.id);

        iwidget.paint();
    };

    Workspace.prototype.removeIWidget = function(iWidgetId, orderFromServer) {

        var iwidget = this.getIWidget(iWidgetId);
        if (iwidget == null) {
            throw new TypeError();
        }

        var dragboard = iwidget.layout.dragboard;
        dragboard.removeInstance(iWidgetId, orderFromServer); // TODO split into hideInstance and removeInstance
        this.events.iwidgetremoved.dispatch(this, iwidget.internal_iwidget);

        iwidget.destroy();

        // emptyWorkspaceInfoBox
        if (this.getIWidgets().length == 0) {
            this.emptyWorkspaceInfoBox.removeClassName('hidden');
        }
    }

    Workspace.prototype.getIWidgets = function() {
        var iWidgets = [];
        var keys = this.tabInstances.keys();
        for (var i = 0; i < keys.length; i++) {
            iWidgets = iWidgets.concat(this.tabInstances.get(keys[i]).getDragboard().getIWidgets());
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

    // Checks if the current user is the creator of this workspace
    Workspace.prototype.isOwned = function() {
        return this.workspaceState['owned'];
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
        var nworkspaces;

        if (action !== "remove" && (!this.valid || this.restricted)) {
            return false;
        }

        switch (action) {
        case "remove":
            nworkspaces = OpManagerFactory.getInstance().workspaceInstances.keys().length;
            return /* opManager.isAllow('add_remove_workspaces') && */ (nworkspaces > 1) && this.removable;
        case "merge_workspaces":
            return this._isAllowed('add_remove_iwidgets') || this._isAllowed('merge_workspaces');
        case "catalogue_view_widgets":
            return this._isAllowed('add_remove_iwidgets');
        case "catalogue_view_mashups":
            return this.isAllowed('add_remove_workspaces') || this.isAllowed('merge_workspaces');
        default:
            return this._isAllowed(action);
        }
    };

    // *****************
    //  CONSTRUCTOR
    // *****************

    Object.defineProperty(this, 'id', {value: workspaceState.id});
    this.workspaceState = workspaceState;
    this.workspaceGlobal = null;
    this.wiringInterface = null;
    this.varManager = null;
    this.tabInstances = new Hash();
    this.highlightTimeouts = {};
    this.wiring = null;
    this.varManager = null;
    this.contextManager = null;
    this.loaded = false;
    this.wiringLayer = null;
    this.valid=false;

    StyledElements.ObjectWithEvents.call(this, ['iwidgetadded', 'iwidgetremoved']);

    /*
     * OPERATIONS
     */
    this.markAsActive = function () {
        var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': this.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'POST',
            contentType: 'application/json',
            postBody: JSON.stringify({active: true}),
            onSuccess: this.markAsActiveSuccess.bind(this),
            onFailure: this.markAsActiveError.bind(this)
        });
    }.bind(this);

    this.markAsActiveSuccess = function() {
        this.workspaceGlobalInfo.active = true;
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

Workspace.prototype.drawAttention = function(iWidgetId) {
    var iWidget = this.getIWidget(iWidgetId);
    if (iWidget !== null) {
        this.highlightTab(iWidget.layout.dragboard.tab);
        iWidget.layout.dragboard.raiseToTop(iWidget);
        iWidget.highlight();
    }
};

Workspace.prototype.highlightTab = function(tab) {
    var tabElement;

    if (typeof tab === 'number') {
        tab = this.tabInstances.get(tab);
    }

    if (!(tab instanceof Tab)) {
        throw new TypeError();
    }

    tabElement = tab.tabHTMLElement;
    tabElement.addClassName("selected");
    if (tab.tabInfo.id in this.highlightTimeouts) {
        clearTimeout(this.highlightTimeouts[tab.tabInfo.id]);
    }
    this.highlightTimeouts[tab.tabInfo.id] = setTimeout(function() {
        tabElement.removeClassName("selected");
        delete this.highlightTimeouts[tab.tabInfo.id];
    }.bind(this), 10000);
};
