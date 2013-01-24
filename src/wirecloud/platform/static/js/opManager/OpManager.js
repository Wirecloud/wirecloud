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


var OpManagerFactory = function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null;

    function OpManager () {

        // ****************
        // CALLBACK METHODS
        // ****************

        var loadEnvironment = function (transport) {
            // JSON-coded user tabspaces
            var response = transport.responseText;
            var workspacesStructure = JSON.parse(response);

            var workspaces = workspacesStructure.workspaces;

            for (var i = 0; i < workspaces.length; i++) {
                var workspace = workspaces[i];

                var workspace_instance = new Workspace(workspace);
                this.workspaceInstances.set(workspace.id, workspace_instance);
                if (!(workspace.creator in this.workspacesByUserAndName)) {
                    this.workspacesByUserAndName[workspace.creator] = {};
                }
                this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace_instance;
            }

            HistoryManager.init();
            var state = HistoryManager.getCurrentState();
            this.activeWorkspace = this.workspacesByUserAndName[state.workspace_creator][state.workspace_name];

            this.activeWorkspace.downloadWorkspaceInfo(HistoryManager.getCurrentState().tab);
        }

        var onError = function (transport, e) {
            var msg;
            try {
                var logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error loading Wirecloud Platform: %(errorMsg)s."), transport, e);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                logManager.log(msg);
            } catch (e) {
                if (msg != null)
                    alert(msg);
                else
                    alert (gettext("Error loading Wirecloud Platform"));
            }
        }

        /*****WORKSPACE CALLBACK***/
        var createWSSuccess = function(transport) {
            var response = transport.responseText;
            var wsInfo = JSON.parse(response);

            //create the new workspace and go to it
            var workspace = new Workspace(wsInfo.workspace);
            this.workspaceInstances.set(wsInfo.workspace.id, workspace);
            this.changeActiveWorkspace(workspace);
        };

        var createWSError = function(transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("Error creating a workspace: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        }


        // *********************************
        // PRIVATE VARIABLES AND FUNCTIONS
        // *********************************

        // Singleton modules
        this.showcaseModule = null;
        this.contextManagerModule = null;
        this.catalogue = null;
        this.logs = null;
        this.platformPreferences = null;

        this.loadCompleted = false;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workspaceInstances = new Hash();
        this.workspacesByUserAndName = {};

        this.activeWorkspace = null;

        // ****************
        // PUBLIC METHODS
        // ****************

        OpManager.prototype.showLogs = function (logManager) {
            logManager = arguments.length > 0 ? logManager : LogManagerFactory.getInstance();

            if (this.activeWorkspace && this.activeWorkspace.getVisibleTab()) {
                this.activeWorkspace.getVisibleTab().unmark();
                        }

            LogManagerFactory.getInstance().show(logManager);
        }

        OpManager.prototype.mergeMashupResource = function(resource) {
            var mergeOk = function(transport) {
                var response = transport.responseText;
                response = JSON.parse(response);

                LayoutManagerFactory.getInstance().logStep('');
                // Reload current workspace
                var workspace = this.workspaceInstances.get(response['workspace_id']);
                this.changeActiveWorkspace(workspace);
            }
            var mergeError = function(transport, e) {
                var logManager, layoutManager, msg;

                logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error merging workspace: %(errorMsg)s."), transport, e);
                logManager.log(msg);

                layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Merging with current workspace"));

            var active_ws_id = OpManagerFactory.getInstance().getActiveWorkspaceId();
            var mergeURL = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({to_ws_id: active_ws_id});

            Wirecloud.io.makeRequest(mergeURL, {
                method: 'POST',
                contentType: 'application/json',
                postBody: Object.toJSON({
                    'workspace': resource.getUriTemplate()
                }),
                onSuccess: mergeOk.bind(this),
                onFailure: mergeError.bind(this),
                onException: mergeError.bind(this)
            });
        };

        OpManager.prototype.addMashupResource = function(resource) {
            var cloneOk = function(transport) {
                var response = transport.responseText;
                var wsInfo = JSON.parse(response);

                LayoutManagerFactory.getInstance().logStep('');

                //create the new workspace and go to it
                var opManager = OpManagerFactory.getInstance();
                var workspace = new Workspace(wsInfo.workspace);
                opManager.workspaceInstances.set(wsInfo.workspace.id, workspace);
                opManager.changeActiveWorkspace(workspace);
            };

            var cloneError = function(transport, e) {
                var logManager, layoutManager, msg;

                logManager = LogManagerFactory.getInstance();
                                layoutManager = LayoutManagerFactory.getInstance();

                msg = logManager.formatError(gettext("Error adding the workspace: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            };

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Creating a new workspace"));

            Wirecloud.io.makeRequest(Wirecloud.URLs.ADD_WORKSPACE, {
                method: 'POST',
                contentType: 'application/json',
                postBody: Object.toJSON({
                    'workspace': resource.getUriTemplate(),
                }),
                onSuccess: cloneOk.bind(this),
                onFailure: cloneError.bind(this),
                onException: cloneError.bind(this)
            });
        };

        OpManager.prototype.showPlatformPreferences = function () {
            PreferencesManagerFactory.getInstance().show();
        }

        OpManager.prototype.changeActiveWorkspace = function (workspace, initial_tab) {
            var state, steps = this.activeWorkspace != null ? 2 : 1;

            state = {
                workspace_creator: workspace.workspaceState.creator,
                workspace_name: workspace.getName(),
                view: "workspace"
            };
            if (initial_tab) {
                state.tab = initial_tab;
            }
            HistoryManager.pushState(state);
            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Changing current workspace"), steps);

            if (this.activeWorkspace != null) {
                this.activeWorkspace.unload();
            }

            this.activeWorkspace = workspace;
            this.activeWorkspace.downloadWorkspaceInfo(initial_tab);
        }


        /**
         * Method called when the user clicks the logout link. As this action
         * changes the document URL, an unload event will be launched (so
         * unloadEnvironment will be called).
         */
        OpManager.prototype.logout = function () {
            window.location = "/logout";
        }

        OpManager.prototype.addInstance = function (widget, options) {
            if (!this.loadCompleted) {
                return;
            }

            this.activeWorkspace.getVisibleTab().getDragboard().addInstance(widget, options);
        };

        OpManager.prototype.removeInstance = function (iWidgetId, orderFromServer) {
            if (!this.loadCompleted)
                return;

            this.activeWorkspace.removeIWidget(iWidgetId, orderFromServer);
        }

        OpManager.prototype.getActiveWorkspaceId = function () {
            return this.activeWorkspace.getId();
        }

        OpManager.prototype.sendEvent = function (widget, event, value) {
            this.activeWorkspace.getWiring().sendEvent(widget, event, value);
        }

        /**
         * Loads the Wirecloud Platform.
         */
        OpManager.prototype.loadEnviroment = function () {
            // Init Layout Manager
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.resizeWrapper();
            layoutManager._startComplexTask(gettext('Loading Wirecloud Platform'), 3);
            layoutManager.logSubTask(gettext('Retrieving Wirecloud code'));
            layoutManager.logStep('');

            // Init log manager
            this.logs = LogManagerFactory.getInstance();

            Event.observe(window,
                          "beforeunload",
                          this.unloadEnvironment.bind(this),
                          true);

            // Load initial theme
            OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.THEME_MANAGER);
        }

        /**
         * Unloads the Wirecloud Platform. This method is called, by default, when
         * the unload event is captured.
         */
        OpManager.prototype.unloadEnvironment = function() {
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.hideCover();
            layoutManager._startComplexTask(gettext('Unloading Wirecloud Platform'));

            if (this.activeWorkspace) {
                this.activeWorkspace.unload();
            }

            //TODO: unloadCatalogue
        }

        OpManager.prototype.iwidgetLoaded = function (iwidgetId) {
            this.activeWorkspace.iwidgetLoaded(iwidgetId);
        }

        OpManager.prototype.iwidgetUnloaded = function (iwidgetId) {
            this.activeWorkspace.iwidgetUnloaded(iwidgetId);
        }

        OpManager.prototype.checkForWidgetUpdates = function () {
            this.activeWorkspace.checkForWidgetUpdates();
        }

        OpManager.prototype.showActiveWorkspace = function (refreshMenu) {
            // TODO
        }

        OpManager.prototype.preferencesChanged = function (modifiedValues) {
            if ('language' in modifiedValues) {
                window.location.reload();
            }
        };

        OpManager.prototype.continueLoadingGlobalModules = function (module) {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!
            var preferencesManager;

            switch (module) {
            case Modules.prototype.THEME_MANAGER:
                this.platformPreferences = PreferencesManagerFactory.getInstance();
                break;

            case Modules.prototype.PLATFORM_PREFERENCES:
                preferencesManager = PreferencesManagerFactory.getInstance();
                preferencesManager.getPlatformPreferences().addCommitHandler(this.preferencesChanged.bind(this), 'post-commit');
                Wirecloud.LocalCatalogue.reload({
                    onSuccess: function () {
                        this.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
                    }.bind(this),
                    onFailure: function () {
                        var msg, logManager = LogManagerFactory.getInstance();
                        msg = logManager.formatError(gettext("Error retrieving available resources: %(errorMsg)s."), transport, e);
                        logManager.log(msg);
                        LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                    }
                });
                break;

            case Modules.prototype.SHOWCASE:
            case Modules.prototype.CATALOGUE:
                // All singleton modules has been loaded!
                // It's time for loading tabspace information!
                this.loadActiveWorkspace();
                break;

            case Modules.prototype.ACTIVE_WORKSPACE:
                var layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logSubTask(gettext("Activating current Workspace"));

                this.showActiveWorkspace();

                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();
                this.loadCompleted = true;
            }
        }

        OpManager.prototype.loadActiveWorkspace = function () {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!

            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'GET',
                onSuccess: loadEnvironment.bind(this),
                onFailure: onError.bind(this)
            });
        }

        OpManager.prototype.logIWidgetError = function(iWidgetId, msg, level) {
            var iWidget = this.activeWorkspace.getIWidget(iWidgetId);
            if (iWidget == null) {
                var msg2 = gettext("Some pice of code tried to notify an error in the iWidget %(iWidgetId)s when it did not exist or it was not loaded yet. This is an error in Wirecloud Platform, please notify it.\nError Message: %(errorMsg)s");
                msg2 = interpolate(msg2, {iWidgetId: iWidgetId, errorMsg: msg}, true);
                this.logs.log(msg2);
                return;
            }

            iWidget.log(msg, level);
        }

        OpManager.prototype.drawAttention = function(iWidgetId) {
            this.activeWorkspace.drawAttention(iWidgetId);
        };

        //Operations on workspaces

        OpManager.prototype.workspaceExists = function (newName) {
            var workspace_keys, workspace, i;
            workspace_keys = this.workspaceInstances.keys();
            for (i = 0; i < workspace_keys.length; i += 1) {
                workspace = this.workspaceInstances.get(workspace_keys[i]);
                if (workspace.workspaceState.name === newName) {
                    return true;
                }
            }
            return false;
        }

        OpManager.prototype.addWorkspace = function addWorkspace(newName) {
            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'POST',
                contentType: 'application/json',
                postBody: Object.toJSON({name: newName}),
                onSuccess: createWSSuccess.bind(this),
                onFailure: createWSError.bind(this)
            });
        };

        OpManager.prototype.unloadWorkspace = function(workspaceId) {
            //Unloading the Workspace
            this.workspaceInstances.get(workspaceId).unload();
        }

        OpManager.prototype.removeWorkspace = function(workspaceId) {
            // Removing reference
            this.workspaceInstances.unset(workspaceId);

            // Set the first workspace as current
            this.changeActiveWorkspace(this.workspaceInstances.values()[0]);
        };


        OpManager.prototype.getWorkspaceCount = function(){
            return this.workspaceInstances.keys().length;
        }
    }

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new OpManager();
            }
            return instance;
        }
    }
}();

