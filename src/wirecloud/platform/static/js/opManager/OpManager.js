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
        var createWSSuccess = function(replaceNavigationState, onSuccess, response) {
            var workspace = JSON.parse(response.responseText);
            this.workspaceInstances[workspace.id] = workspace;
            if (!(workspace.creator in this.workspacesByUserAndName)) {
                this.workspacesByUserAndName[workspace.creator] = {};
            }
            this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace;
            Wirecloud.changeActiveWorkspace(workspace, null, {replaceNavigationState: replaceNavigationState});

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

        this.loadCompleted = false;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workspaceInstances = {};
        this.workspacesByUserAndName = {};

        // ****************
        // PUBLIC METHODS
        // ****************

        OpManager.prototype.mergeMashupResource = function(resource) {

            var mergeOk = function(transport) {
                LayoutManagerFactory.getInstance().logStep('');
                Wirecloud.changeActiveWorkspace(Wirecloud.activeWorkspace);
            }
            var mergeError = function(transport, e) {
                var layoutManager, msg;

                msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error merging workspace: %(errorMsg)s."), transport, e);

                layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            }

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Merging with current workspace"));

            var active_ws_id = Wirecloud.activeWorkspace.id;
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


        OpManager.prototype.logout = function logout() {
            window.location = Wirecloud.URLs.LOGOUT_VIEW;
        }

        OpManager.prototype.checkForWidgetUpdates = function () {
            Wirecloud.activeWorkspace.checkForWidgetUpdates();
        }

        OpManager.prototype.logIWidgetError = function(iWidgetId, msg, level) {
            var iWidget = Wirecloud.activeWorkspace.getIWidget(iWidgetId);
            if (iWidget == null) {
                var msg2 = gettext("Some pice of code tried to notify an error in the iWidget %(iWidgetId)s when it did not exist or it was not loaded yet. This is an error in Wirecloud Platform, please notify it.\nError Message: %(errorMsg)s");
                msg2 = interpolate(msg2, {iWidgetId: iWidgetId, errorMsg: msg}, true);
                Wirecloud.GlobalLogManager.log(msg2);
                return;
            }

            iWidget.log(msg, level);
        }

        OpManager.prototype.drawAttention = function(iWidgetId) {
            Wirecloud.activeWorkspace.drawAttention(iWidgetId);
        };

        //Operations on workspaces

        OpManager.prototype.workspaceExists = function (newName) {
            var workspaces;

            workspaces = Object.keys(this.workspacesByUserAndName[Wirecloud.contextManager.get('username')]);
            return workspaces.indexOf(newName) !== -1;
        }

        OpManager.prototype.addWorkspace = function addWorkspace(newName, options) {
            options = Wirecloud.Utils.merge({
                replaceNavigationState: false
            }, options);

            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({
                    allow_renaming: !!options.allow_renaming,
                    name: newName
                }),
                onSuccess: createWSSuccess.bind(this, options.replaceNavigationState, options.onSuccess),
                onFailure: createWSError.bind(this, options.onFailure)
            });
        };

        OpManager.prototype.removeWorkspace = function(workspace) {
            // Removing reference
            delete this.workspacesByUserAndName[workspace.workspaceState.creator][workspace.workspaceState.name];
            delete this.workspaceInstances[workspace.id];

            // Set the first workspace as current
            var username = Wirecloud.contextManager.get('username');
            Wirecloud.changeActiveWorkspace(Wirecloud.Utils.values(this.workspacesByUserAndName[username])[0]);
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

