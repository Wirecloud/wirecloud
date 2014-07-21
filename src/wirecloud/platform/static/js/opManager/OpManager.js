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

        OpManager.prototype.mergeMashupResource = function(resource, options) {

            var mergeOk = function(transport) {
                LayoutManagerFactory.getInstance().logStep('');
                Wirecloud.changeActiveWorkspace(Wirecloud.activeWorkspace.workspaceState);
            };

            var onMergeFailure = function onMergeFailure(response, e) {
                var msg, details;

                msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error merging the mashup: %(errorMsg)s."), response, e);

                if (typeof options.onFailure === 'function') {
                    try {
                        if (response.status === 422) {
                            details = JSON.parse(response.responseText).details;
                        }
                    } catch (e) {}

                    try {
                        options.onFailure(msg, details);
                    } catch (e) {}
                }
            };

            if (options == null) {
                options = {};
            }

            if (options.monitor) {
                options.monitor.logSubTask(gettext("Merging mashup"));
            }

            var active_ws_id = Wirecloud.activeWorkspace.id;
            var mergeURL = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({to_ws_id: active_ws_id});

            Wirecloud.io.makeRequest(mergeURL, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({'mashup': resource.uri}),
                onSuccess: mergeOk.bind(this),
                onFailure: onMergeFailure,
            });
        };

        OpManager.prototype.showPlatformPreferences = function () {
            if (this.pref_window_menu == null) {
                this.pref_window_menu = new Wirecloud.ui.PreferencesWindowMenu('platform', Wirecloud.preferences);
            }
            this.pref_window_menu.show();
        };

        //Operations on workspaces

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

