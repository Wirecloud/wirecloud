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

/*global Wirecloud*/

var OpManagerFactory = function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null;

    function OpManager () {

        // ****************
        // CALLBACK METHODS
        // ****************

        /*****WORKSPACE CALLBACK***/
        var createWSSuccess = function(onSuccess, response) {
            var workspace = JSON.parse(response.responseText);
            this.workspaceInstances[workspace.id] = workspace;
            this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace;
            this.changeActiveWorkspace(workspace);

            if (typeof onSuccess === 'function') {
                try {
                    onSuccess(workspace);
                } catch (e) {}
            }
        };

        var createWSError = function(onFailure, response) {
            var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error creating a workspace: %(errorMsg)s."), response);

            if (typeof onFailure === 'function') {
                try {
                    onFailure(msg);
                } catch (e) {}
            }
        };


        // *********************************
        // PRIVATE VARIABLES AND FUNCTIONS
        // *********************************

        // Singleton modules
        this.showcaseModule = null;
        this.catalogue = null;
        this.logs = null;

        this.loadCompleted = false;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workspaceInstances = {};
        this.workspacesByUserAndName = {};

        this.activeWorkspace = null;

        // ****************
        // PUBLIC METHODS
        // ****************

        OpManager.prototype.mergeMashupResource = function(resource) {

            var mergeOk = function(transport) {
                LayoutManagerFactory.getInstance().logStep('');
                this.changeActiveWorkspace(this.activeWorkspace);
            }
            var mergeError = function(transport, e) {
                var layoutManager, msg;

                msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error merging workspace: %(errorMsg)s."), transport, e);

                layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Merging with current workspace"));

            var active_ws_id = this.activeWorkspace.id;
            var mergeURL = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({to_ws_id: active_ws_id});

            Wirecloud.io.makeRequest(mergeURL, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({'mashup': resource.uri}),
                onSuccess: mergeOk.bind(this),
                onFailure: mergeError.bind(this),
                onException: mergeError.bind(this)
            });
        };

        OpManager.prototype.addWorkspaceFromMashup = function addWorkspaceFromMashup(resource, options) {

            options = Wirecloud.Utils.merge({
                allow_renaming: true,
                dry_run: false
            }, options);

            var cloneOk = function(response) {
                var workspace = null;

                if ([201, 204].indexOf(response.status) === -1) {
                    cloneError(response);
                }

                if (response.status === 201) {
                    workspace = JSON.parse(response.responseText);
                    this.workspaceInstances[workspace.id] = workspace;
                    this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace;

                }

                if (typeof options.onSuccess === 'function') {
                    try {
                        options.onSuccess(workspace);
                    } catch (e) {}
                }
            };

            var cloneError = function(transport, e) {
                var msg, details;

                msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding the workspace: %(errorMsg)s."), transport, e);

                if (typeof options.onFailure === 'function') {
                    try {
                        if (transport.status === 422) {
                            details = JSON.parse(transport.responseText).details;
                        }
                    } catch (e) {}

                    try {
                        options.onFailure(msg, details);
                    } catch (e) {}
                }
            };

            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({
                    'allow_renaming': options.allow_renaming,
                    'mashup': resource.uri,
                    'dry_run': options.dry_run
                }),
                onSuccess: cloneOk.bind(this),
                onFailure: cloneError.bind(this)
            });
        };

        OpManager.prototype.showPlatformPreferences = function () {
            if (this.pref_window_menu == null) {
                this.pref_window_menu = new Wirecloud.ui.PreferencesWindowMenu('platform', Wirecloud.preferences);
            }
            this.pref_window_menu.show();
        };

        OpManager.prototype.changeActiveWorkspace = function changeActiveWorkspace(workspace, initial_tab, options) {
            var state, steps = this.activeWorkspace != null ? 2 : 1;

            if (options == null) {
                options = {};
            }

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Changing current workspace"), steps);

            if (this.activeWorkspace != null) {
                this.activeWorkspace.unload();
            }

            state = {
                workspace_creator: workspace.creator,
                workspace_name: workspace.name,
                view: "workspace"
            };
            if (initial_tab) {
                state.tab = initial_tab;
            }
            HistoryManager.pushState(state);

            LayoutManagerFactory.getInstance().logSubTask(gettext("Downloading workspace data"), 1);
            new Wirecloud.WorkspaceCatalogue(workspace.id, {
                onSuccess: function (workspace_resources) {
                    var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': workspace.id});
                    Wirecloud.io.makeRequest(workspaceUrl, {
                        method: 'GET',
                        requestHeaders: {'Accept': 'application/json'},
                        onSuccess: function (response) {
                            var workspace_data = JSON.parse(response.responseText);
                            this.activeWorkspace = new Workspace(workspace_data, workspace_resources);
                            this.activeWorkspace.contextManager.addCallback(function (updated_attributes) {
                                var workspace, old_name;

                                if ('name' in updated_attributes) {
                                    workspace = this.workspaceInstances[this.activeWorkspace.id];
                                    old_name = workspace.name;
                                    delete this.workspacesByUserAndName[workspace.creator][old_name];

                                    workspace.name = updated_attributes.name;
                                    this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace;
                                }
                            }.bind(this));

                            LayoutManagerFactory.getInstance().header.refresh(); // FIXME

                            if (typeof options.onSuccess === "function") {
                                try {
                                    options.onSuccess();
                                } catch (e) {}
                            }
                        }.bind(this)
                    });
                }.bind(this)
            });
        }

        OpManager.prototype.logout = function logout() {
            window.location = Wirecloud.URLs.LOGOUT_VIEW;
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

            window.addEventListener(
                          "beforeunload",
                          this.unloadEnvironment.bind(this),
                          true);

            var loaded_modules = 0;
            var checkPlatformReady = function checkPlatformReady() {
                // TODO remove hardcoded module count
                loaded_modules += 1;
                if (loaded_modules === 4) {
                    HistoryManager.init();
                    var state = HistoryManager.getCurrentState();
                    var workspace = this.workspacesByUserAndName[state.workspace_creator][state.workspace_name];
                    this.changeActiveWorkspace(workspace, null, {
                        onSuccess: function () {
                            var layoutManager = LayoutManagerFactory.getInstance();
                            layoutManager.logSubTask(gettext("Activating current Workspace"));

                            layoutManager.logStep('');
                            layoutManager._notifyPlatformReady();
                            this.loadCompleted = true;
                        }.bind(this)
                    });
                }
            }.bind(this);

            // Init platform context
            Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_CONTEXT_COLLECTION, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                onSuccess: function (response) {
                    this.contextManager = new Wirecloud.ContextManager(this, JSON.parse(response.responseText));
                    Wirecloud.contextManager = this.contextManager;
                    LayoutManagerFactory.getInstance().header._initUserMenu();

                    // Init theme
                    Wirecloud.io.makeRequest(Wirecloud.URLs.THEME_ENTRY.evaluate({name: this.contextManager.get('theme')}), {
                        method: 'GET',
                        requestHeaders: {'Accept': 'application/json'},
                        onSuccess: function (response) {
                            Wirecloud.currentTheme = new Wirecloud.ui.Theme(JSON.parse(response.responseText));
                            checkPlatformReady();
                        }
                    });

                    // Load local catalogue
                    Wirecloud.LocalCatalogue.reload({
                        onSuccess: checkPlatformReady,
                        onFailure: function () {
                            var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving available resources: %(errorMsg)s."), transport, e);
                            LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                        }
                    });

                }.bind(this)
            });

            // Init platform preferences
            Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_PREFERENCES, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                onSuccess: function (response) {
                    var values = JSON.parse(response.responseText);

                    Wirecloud.preferences = Wirecloud.PreferenceManager.buildPreferences('platform', values);
                },
                onFailure: function (response) {
                    Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving platform preferences data: %(errorMsg)s"), response);
                    Wirecloud.preferences = Wirecloud.PreferenceManager.buildPreferences('platform', {});
                },
                onComplete: function () {
                    Wirecloud.preferences.addCommitHandler(this.preferencesChanged.bind(this), 'post-commit');
                    checkPlatformReady();
                }.bind(this)
            });

            // Load workspace list
            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                onSuccess: function (response) {
                    var workspaces = JSON.parse(response.responseText);

                    for (var i = 0; i < workspaces.length; i++) {
                        var workspace = workspaces[i];

                        this.workspaceInstances[workspace.id] = workspace;
                        if (!(workspace.creator in this.workspacesByUserAndName)) {
                            this.workspacesByUserAndName[workspace.creator] = {};
                        }
                        this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace;
                    }

                    checkPlatformReady();
                }.bind(this),
                onFailure: function (response) {
                    Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving workspace list"), response);
                }
            });

        };

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

        OpManager.prototype.checkForWidgetUpdates = function () {
            this.activeWorkspace.checkForWidgetUpdates();
        }

        OpManager.prototype.preferencesChanged = function (modifiedValues) {
            if ('language' in modifiedValues) {
                window.location.reload();
            }
        };

        OpManager.prototype.logIWidgetError = function(iWidgetId, msg, level) {
            var iWidget = this.activeWorkspace.getIWidget(iWidgetId);
            if (iWidget == null) {
                var msg2 = gettext("Some pice of code tried to notify an error in the iWidget %(iWidgetId)s when it did not exist or it was not loaded yet. This is an error in Wirecloud Platform, please notify it.\nError Message: %(errorMsg)s");
                msg2 = interpolate(msg2, {iWidgetId: iWidgetId, errorMsg: msg}, true);
                Wirecloud.GlobalLogManager.log(msg2);
                return;
            }

            iWidget.log(msg, level);
        }

        OpManager.prototype.drawAttention = function(iWidgetId) {
            this.activeWorkspace.drawAttention(iWidgetId);
        };

        //Operations on workspaces

        OpManager.prototype.workspaceExists = function (newName) {
            var workspaces;

            workspaces = Object.keys(this.workspacesByUserAndName[this.contextManager.get('username')]);
            return workspaces.indexOf(newName) !== -1;
        }

        OpManager.prototype.addWorkspace = function addWorkspace(newName, options) {
            if (options == null) {
                options = {};
            }

            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({
                    allow_renaming: !!options.allow_renaming,
                    name: newName
                }),
                onSuccess: createWSSuccess.bind(this, options.onSuccess),
                onFailure: createWSError.bind(this, options.onFailure)
            });
        };

        OpManager.prototype.removeWorkspace = function(workspace) {
            // Removing reference
            delete this.workspacesByUserAndName[workspace.workspaceState.creator][workspace.workspaceState.name];
            delete this.workspaceInstances[workspace.id];

            // Set the first workspace as current
            var username = this.contextManager.get('username');
            this.changeActiveWorkspace(Wirecloud.Utils.values(this.workspacesByUserAndName[username])[0]);
        };

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

