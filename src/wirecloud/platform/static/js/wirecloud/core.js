/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals gettext, moment, StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    var preferencesChanged = function preferencesChanged(preferences, modifiedValues) {
        if ('language' in modifiedValues) {
            window.location.reload();
        }
    };

    /**
     * @namespace Wirecloud
     */
    Object.defineProperty(Wirecloud, 'events', {
        value: {
            'contextloaded': new StyledElements.Event(Wirecloud),
            'loaded': new StyledElements.Event(Wirecloud),
            'activeworkspacechanged': new StyledElements.Event(Wirecloud),
            'viewcontextchanged': new StyledElements.Event(Wirecloud)
        }
    });
    Object.freeze(Wirecloud.events);
    Wirecloud.addEventListener = StyledElements.ObjectWithEvents.prototype.addEventListener;
    Wirecloud.dispatchEvent = StyledElements.ObjectWithEvents.prototype.dispatchEvent;

    var onCreateWorkspaceSuccess = function onCreateWorkspaceSuccess(response) {
        return new Promise((resolve, reject) => {
            var workspace = null;

            if ([201, 401, 403, 409, 422, 500].indexOf(response.status) === -1) {
                return reject(utils.gettext("Unexpected response from server"));
            } else if (response.status === 422) {
                try {
                    var error = JSON.parse(response.responseText);
                } catch (e) {
                    return reject(e);
                }
                return reject(error);
            } else if ([401, 403, 500].indexOf(response.status) !== -1) {
                return reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }

            workspace = JSON.parse(response.responseText);
            // TODO
            Object.defineProperty(workspace, 'url', {
                get: function () {
                    var path = Wirecloud.URLs.WORKSPACE_VIEW.evaluate({owner: encodeURIComponent(this.owner), name: encodeURIComponent(this.name)});
                    return document.location.protocol + '//' + document.location.host + path;
                }
            });
            this.workspaceInstances[workspace.id] = workspace;
            if (!(workspace.owner in this.workspacesByUserAndName)) {
                this.workspacesByUserAndName[workspace.owner] = {};
            }
            this.workspacesByUserAndName[workspace.owner][workspace.name] = workspace;
            resolve(workspace);
        });
    };

    var onMergeSuccess = function onMergeSuccess(options, response) {
        var workspace = {
            id: Wirecloud.activeWorkspace.id,
            owner: Wirecloud.activeWorkspace.owner,
            name: Wirecloud.activeWorkspace.name
        };
        Wirecloud.changeActiveWorkspace(workspace, null, options);
    };

    var onMergeFailure = function onMergeFailure(options, response, e) {
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

    /**
     * Loads the Wirecloud Platform.
     */
    Wirecloud.init = function init(options) {

        this.workspaceInstances = {};
        this.workspacesByUserAndName = {};

        options = utils.merge({
            'preventDefault': false
        }, options);

        Wirecloud.UserInterfaceManager.init();

        window.addEventListener(
                      "beforeunload",
                      Wirecloud.unload.bind(this),
                      true);

        // Init platform context
        var contextTask = Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_CONTEXT_COLLECTION, {
            method: 'GET',
            parameters: {theme: Wirecloud.constants.CURRENT_THEME},
            requestHeaders: {'Accept': 'application/json'}
        }).then(function (response) {
            return new Promise(function (resolve, reject) {
                var context_info = JSON.parse(response.responseText);
                Wirecloud.constants.WORKSPACE_CONTEXT = context_info.workspace;
                Object.freeze(Wirecloud.constants.WORKSPACE_CONTEXT);
                Wirecloud.contextManager = new Wirecloud.ContextManager(Wirecloud, context_info.platform);
                Wirecloud.contextManager.modify({'mode': Wirecloud.constants.CURRENT_MODE});
                resolve();
            });
        }).toTask("Retrieve platform context");

        var themeTask = contextTask.then(function () {
            // Init theme
            var url =  Wirecloud.URLs.THEME_ENTRY.evaluate({name: Wirecloud.contextManager.get('theme')}) + "?v=" + Wirecloud.contextManager.get('version_hash');
            return Wirecloud.io.makeRequest(url, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'}
            }).then(function (response) {
                return new Promise(function (resolve, reject) {
                    Wirecloud.currentTheme = new Wirecloud.ui.Theme(JSON.parse(response.responseText));
                    moment.locale(Wirecloud.contextManager.get('language'));
                    Wirecloud.dispatchEvent('contextloaded');
                    resolve();
                });
            });
        });

        var localCatalogueTask = contextTask.then(function () {
            return new Wirecloud.Task("Loading component catalog", function (resolve, reject) {
                // Load local catalogue
                Wirecloud.LocalCatalogue.reload({
                    onSuccess: resolve,
                    onFailure: function (response) {
                        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving available resources: %(errorMsg)s."), response);
                        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                        reject();
                    }
                });
            });
        });

        // Init platform preferences
        var preferencesTask = Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_PREFERENCES, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then(function (response) {
            return new Promise(function (resolve, reject) {
                var url, values = JSON.parse(response.responseText);

                Wirecloud.preferences = Wirecloud.PreferenceManager.buildPreferences('platform', values);
                if ('WEBSOCKET' in Wirecloud.URLs) {
                    url = new URL(Wirecloud.URLs.WEBSOCKET, document.location);
                    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
                    var livews = new WebSocket(url);
                    livews.addEventListener('message', function (event) {
                        var msg = JSON.parse(event.data);

                        Wirecloud.live.dispatchEvent(msg.category, msg);
                    });
                    var LiveManager = function LiveManager() {
                        StyledElements.ObjectWithEvents.call(this, ["workspace", "component"]);
                    };
                    utils.inherit(LiveManager, StyledElements.ObjectWithEvents);
                    Wirecloud.live = new LiveManager();
                }
                resolve();
            });
        }).catch(function (error) {
            return new Promise(function (resolve, reject) {
                Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving platform preferences data: %(errorMsg)s"), error);
                Wirecloud.preferences = Wirecloud.PreferenceManager.buildPreferences('platform', {});
            });
        }).then(function () {
            Wirecloud.preferences.addEventListener('post-commit', preferencesChanged.bind(this));
        });

        // Load workspace list
        var workspaceListTask = Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then(function (response) {
            return new Promise(function (resolve, reject) {
                var workspaces = JSON.parse(response.responseText);

                for (var i = 0; i < workspaces.length; i++) {
                    var workspace = workspaces[i];

                    Wirecloud.workspaceInstances[workspace.id] = workspace;
                    if (!(workspace.owner in Wirecloud.workspacesByUserAndName)) {
                        Wirecloud.workspacesByUserAndName[workspace.owner] = {};
                    }
                    Wirecloud.workspacesByUserAndName[workspace.owner][workspace.name] = workspace;
                }
                resolve();
            });
        }).catch(function (error) {
            return new Promise(function (resolve, reject) {
                Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving workspace list"), error);
                reject(error);
            });
        });

        var initTask = new Wirecloud.Task(gettext('Retrieving WireCloud code'), function (resolve) {
            resolve();
        }).then(function () {
            return new Wirecloud.Task(gettext('Retrieving initial data'), [
                themeTask,
                localCatalogueTask,
                preferencesTask,
                workspaceListTask
            ]);
        });

        if (options.preventDefault !== true) {
            initTask = initTask.then(function () {
                Wirecloud.HistoryManager.init();
                var state = Wirecloud.HistoryManager.getCurrentState();
                Wirecloud.UserInterfaceManager.changeCurrentView('workspace', true);

                this.dispatchEvent('loaded');
                var workspace = this.workspacesByUserAndName[state.workspace_owner][state.workspace_name];
                return this.changeActiveWorkspace(workspace, state.tab, {replaceNavigationState: true});
            }.bind(this));
        }

        var task = initTask.toTask(gettext('Loading WireCloud Platform'));
        if (options.preventDefault !== true) {
            Wirecloud.UserInterfaceManager.monitorTask(task);
        }

        return task;
    };

    /**
     * Unloads the WireCloud Platform. This method is called, by default, when
     * the unload event is captured.
     */
    Wirecloud.unload = function unload() {
        Wirecloud.UserInterfaceManager.monitorTask(
            new Wirecloud.Task(gettext('Unloading WireCloud'), () => {})
        );
    };

    /**
     * Logouts from WireCloud
     */
    Wirecloud.logout = function logout() {
        if (Wirecloud.constants.FIWARE_PORTALS) {

            var promises = [];
            Wirecloud.constants.FIWARE_PORTALS.forEach((portal) => {
                if ('logout_path' in portal) {
                    promises.push(Wirecloud.io.makeRequest(portal.url + portal.logout_path, {
                        method: 'GET',
                        supportsAccessControl: true,
                        withCredentials: true,
                        requestHeaders: {
                            'X-Requested-With': null
                        }
                    }).catch(function (error) {}));
                }
            });
            Promise.all(promises).then(() => {window.location = Wirecloud.URLs.LOGOUT_VIEW;});

        } else {
            window.location = Wirecloud.URLs.LOGOUT_VIEW;
        }

    };

    /**
     * Requests workspace data and provides a {@link Wirecloud.Workspace} instance.
     *
     * @since 1.1
     *
     * @param {Object} workspace workspace information to use for requesting
     *      Workspace information
     *
     * @returns {Wirecloud.Task}
     *
     * @example <caption>Load workspace by id</caption>
     * Wirecloud.loadWorkspace({id: 100}).then(function (workspace) {
     *     // Workspace loaded successfully
     * }, function (error) {
     *     // Error loading workspace
     * };
     *
     * @example <caption>Load workspace by owner/name</caption>
     * Wirecloud.loadWorkspace({owner: "user", name: "dashboard"});
     */
    Wirecloud.loadWorkspace = function loadWorkspace(workspace, options) {
        if (!('id' in workspace)) {
            workspace = this.workspacesByUserAndName[workspace.owner][workspace.name];
        }

        var workspace_resources = new Wirecloud.WorkspaceCatalogue(workspace.id);
        return workspace_resources.reload().then(function () {
            var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': workspace.id});
            return Wirecloud.io.makeRequest(workspaceUrl, {
                method: "GET",
                requestHeaders: {'Accept': 'application/json'}
            }).renameTask(utils.gettext("Requesting workspace data"));
        }).then(function (response) {
            if (response.status !== 200) {
                throw new Error("Unexpected error code");
            }
            return process_workspace_data.call(this, response, workspace_resources, options);
        }.bind(this)).toTask("Downloading workspace");
    };

    Wirecloud.changeActiveWorkspace = function changeActiveWorkspace(workspace, initial_tab, options) {
        var workspace_full_name, state;

        options = utils.merge({
            replaceNavigationState: false
        }, options);

        if (!('id' in workspace)) {
            workspace = this.workspacesByUserAndName[workspace.owner][workspace.name];
        }

        state = {
            workspace_owner: workspace.owner,
            workspace_name: workspace.name,
            view: "workspace"
        };
        if (initial_tab) {
            options.initial_tab = initial_tab;
            state.tab = initial_tab;
        }
        workspace_full_name = workspace.owner + '/' + workspace.name;
        document.title = workspace_full_name;
        if (options.replaceNavigationState === true) {
            Wirecloud.HistoryManager.replaceState(state);
        } else if (options.replaceNavigationState !== 'leave') {
            Wirecloud.HistoryManager.pushState(state);
        }

        return this.loadWorkspace(workspace, options)
            .then(switch_active_workspace.bind(this))
            .toTask(gettext("Switching active workspace"));
    };

    /**
     * Creates a new workspace.
     *
     * @since 1.1
     *
     * @param {Object} options
     * - `allow_renaming` (Boolean, default: `true`)
     * - `mashup` (String): Mashup reference to use as template.
     * - `name` (String): This options is required if the `mashup` and
     *   `workspace` options are not used and optional in any other case.
     * - `workspace` (String): id of the workspace to clone.
     *
     * @returns {Wirecloud.Task}
     *
     * @example <caption>Create an empty workspace</caption>
     * Wirecloud.createWorkspace({name: "MyWorkspace"}).then(function (workspace) {
     *     // Workspace created successfully
     * }, function (error) {
     *     // Error creating workspace
     * };
     *
     * @example <caption>Create a workspace using a mashup as template</caption>
     * Wirecloud.createWorkspace({mashup: "Wirecloud/Mashup/1.0"});
     *
     * @example <caption>Create a workspace copy</caption>
     * Wirecloud.createWorkspace({workspace: 123});
     */
    Wirecloud.createWorkspace = function createWorkspace(options) {
        var body;

        options = utils.merge({
            allow_renaming: true,
            dry_run: false
        }, options);

        body = {
            allow_renaming: !!options.allow_renaming,
            dry_run: !!options.dry_run
        };

        if (options.mashup == null && options.workspace == null && options.name == null) {
            throw new Error(utils.gettext('Missing name parameter'));
        } else if (options.mashup != null && options.workspace != null) {
            throw new Error(utils.gettext('Workspace and mashup options cannot be used at the same time'));
        }

        if (options.mashup != null) {
            body.mashup = options.mashup;
        }

        if (options.name != null) {
            body.name = options.name;
        }

        if (options.preferences != null) {
            body.preferences = options.preferences;
        }

        if (options.workspace != null) {
            body.workspace = options.workspace;
        }

        return Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(body)
        }).then(onCreateWorkspaceSuccess.bind(this));
    };

    /**
     * Removes a workspace from the WireCloud server
     *
     * @since 1.1
     *
     * @param {Object|Wirecloud.Workspace} workspace
     *  workspace to remove.
     *
     * @returns {Wirecloud.Task}
     *
     * @example <caption>Remove a workspace using a {@link Wirecloud.Workspace} instance</caption>
     * Wirecloud.removeWorkspace(workspace).then(function () {
     *     // Workspace removed successfully
     * }, function (error) {
     *     // Error removing workspace
     * };
     *
     * @example <caption>Remove a workspace by id</caption>
     * Wirecloud.removeWorkspace({id: 1});
     *
     * @example <caption>Remove a workspace by owner/name</caption>
     * Wirecloud.removeWorkspace({owner: "user", name: "dashboard"});
     */
    Wirecloud.removeWorkspace = function removeWorkspace(workspace) {
        if (workspace.id == null) {
            if (workspace.owner == null || workspace.name == null) {
                throw new TypeError("missing id or owner/name parameters");
            }
            workspace = this.workspacesByUserAndName[workspace.owner][workspace.name];
        }

        var url = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({
            workspace_id: workspace.id
        });

        return Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            return new Promise((resolve, reject) => {
                if ([204, 401, 403, 404, 500].indexOf(response.status) === -1) {
                    return reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                    return reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                if (workspace.id in this.workspaceInstances) {
                    // Remove internal references
                    var stored_workspace = this.workspaceInstances[workspace.id];
                    delete this.workspaceInstances[workspace.id];
                    delete this.workspacesByUserAndName[stored_workspace.owner][stored_workspace.name];
                }

                resolve();
            });
        });
    };

    Wirecloud.mergeWorkspace = function mergeWorkspace(resource, options) {

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
            onSuccess: onMergeSuccess.bind(this, options),
            onFailure: onMergeFailure.bind(this, options)
        });
    };


    var process_workspace_data = function process_workspace_data(response, workspace_resources, options) {

        return new Wirecloud.Task("Processing workspace data", function (resolve, reject, update) {
            var workspace_data = JSON.parse(response.responseText);

            // Check if the workspace needs to ask some values before loading this workspace
            if (workspace_data.empty_params.length > 0) {
                var preferences, preferenceValues, param, i, dialog;

                preferenceValues = {};
                for (i = 0; i < workspace_data.empty_params.length; i += 1) {
                    param = workspace_data.empty_params[i];
                    if (workspace_data.preferences[param] != null) {
                        preferenceValues[param] = workspace_data.preferences[param];
                    }
                }

                Wirecloud.dispatchEvent('viewcontextchanged');
                preferences = Wirecloud.PreferenceManager.buildPreferences('workspace', preferenceValues, workspace_data, workspace_data.extra_prefs, workspace_data.empty_params);
                preferences.addEventListener('post-commit', function () {
                    setTimeout(function () {
                        Wirecloud.changeActiveWorkspace(workspace, options.initial_tab, options);
                    }, 0);
                }.bind(this));

                dialog = new Wirecloud.ui.PreferencesWindowMenu('workspace', preferences);
                dialog.setCancelable(false);
                dialog.show();
                return;
            }

            var workspace = new Wirecloud.Workspace(workspace_data, workspace_resources);
            this.workspaceInstances[workspace.id] = workspace;
            resolve(workspace);
        }.bind(this));
    };

    var switch_active_workspace = function switch_active_workspace(workspace) {

        return new Wirecloud.Task(gettext("Switching active workspace"), function (resolve, reject) {

            if (this.activeWorkspace) {
                this.activeWorkspace.unload();
                this.activeWorkspace = null;
            }

            this.activeWorkspace = workspace;
            Wirecloud.dispatchEvent('viewcontextchanged');

            this.activeWorkspace.contextManager.addCallback(function (updated_attributes) {
                var workspace, old_name;

                if ('name' in updated_attributes) {
                    workspace = this.workspaceInstances[this.activeWorkspace.id];
                    old_name = workspace.name;
                    delete this.workspacesByUserAndName[workspace.owner][old_name];

                    workspace.name = updated_attributes.name;
                    this.workspacesByUserAndName[workspace.owner][workspace.name] = workspace;
                }
            }.bind(this));

            // The activeworkspacechanged event will be captured by WorkspaceView
            Wirecloud.dispatchEvent('activeworkspacechanged', this.activeWorkspace);
            resolve(workspace);
        }.bind(this));

    };

})(Wirecloud.Utils);
