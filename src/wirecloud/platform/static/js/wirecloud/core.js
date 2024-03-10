/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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

    window.parent = window; // Avoid problems with embedded Wirecloud instances

    const preferencesChanged = function preferencesChanged(preferences, modifiedValues) {
        /* istanbul ignore if */
        if ('language' in modifiedValues) {
            window.location.reload();
        }
    };

    const process_workspace_data = function process_workspace_data(response, options) {

        const workspace_data = JSON.parse(response.responseText);
        const workspace_resources = new Wirecloud.WorkspaceCatalogue(workspace_data.id);

        return workspace_resources.reload().then(function () {
            return new Wirecloud.Task("Processing workspace data", (resolve, reject, update) => {
                const workspace = new Wirecloud.Workspace(workspace_data, workspace_resources);
                cache_workspace(workspace);
                resolve(workspace);
            });
        });
    };

    const switch_active_workspace = function switch_active_workspace(options, workspace) {

        return new Wirecloud.Task(gettext("Switching active workspace"), (resolve, reject) => {

            const state = {
                workspace_owner: workspace.owner,
                workspace_name: workspace.name,
                workspace_title: workspace.title,
                view: "workspace"
            };

            if (options.initialtab != null) {
                state.tab = options.initialtab;
            }

            document.title = workspace.owner + '/' + workspace.name;

            if (options.history === "push") {
                Wirecloud.HistoryManager.pushState(state);
            } else if (options.history === "replace") {
                Wirecloud.HistoryManager.replaceState(state);
            }

            if (this.activeWorkspace) {
                this.activeWorkspace.unload();
                this.activeWorkspace = null;
            }

            this.activeWorkspace = workspace;
            Wirecloud.dispatchEvent('viewcontextchanged');

            // The activeworkspacechanged event will be captured by WorkspaceView
            Wirecloud.dispatchEvent('activeworkspacechanged', this.activeWorkspace);
            resolve(workspace);
        });

    };

    const report_error_switching_workspace = function report_error_switching_workspace(error) {
        if (error === "Please log in") {
            Wirecloud.login();
        } else {
            const dialog = new Wirecloud.ui.MessageWindowMenu(error, Wirecloud.constants.LOGGING.ERROR_MSG);
            dialog.show();
        }
    };

    const on_url_get = function on_url_get() {
        const path = Wirecloud.URLs.WORKSPACE_VIEW.evaluate({owner: encodeURIComponent(this.owner), name: encodeURIComponent(this.name)});
        return Wirecloud.location.protocol + '://' + Wirecloud.location.host + path;
    };

    const cache_workspace = function cache_workspace(workspace) {
        Wirecloud.workspaceInstances[workspace.id] = workspace;
        if (!(workspace.owner in Wirecloud.workspacesByUserAndName)) {
            Wirecloud.workspacesByUserAndName[workspace.owner] = {};
        }
        Wirecloud.workspacesByUserAndName[workspace.owner][workspace.name] = workspace;

        if (workspace instanceof Wirecloud.Workspace) {
            workspace.addEventListener("change", (workspace, updated_attributes, old_values) => {
                if (updated_attributes.indexOf('name') !== -1) {
                    delete Wirecloud.workspacesByUserAndName[workspace.owner][old_values.name];

                    Wirecloud.workspacesByUserAndName[workspace.owner][workspace.name] = workspace;
                }
            });
        } else {
            Object.defineProperty(workspace, 'url', {
                get: on_url_get
            });
        }
    };

    const _logout = function _logout() {
        const logout_url = new URL(Wirecloud.URLs.LOGOUT_VIEW, document.location);
        const publicdashboard = Wirecloud.activeWorkspace.preferences.get("public");
        const requireauth = Wirecloud.activeWorkspace.preferences.get("requireauth");

        if (publicdashboard && !requireauth) {
            const next_url = window.location.pathname + window.location.search + window.location.hash;
            logout_url.searchParams.set("next", next_url);
        }
        window.location = logout_url;
    };

    /**
     * @namespace Wirecloud
     */
    Object.defineProperty(Wirecloud, 'events', {
        value: {
            'contextloaded': new StyledElements.Event(Wirecloud),
            'loaded': new StyledElements.Event(Wirecloud),
            'activeworkspacechanged': new StyledElements.Event(Wirecloud),
            'viewcontextchanged': new StyledElements.Event(Wirecloud),
            'unload': new StyledElements.Event(Wirecloud)
        }
    });
    Object.freeze(Wirecloud.events);
    Wirecloud.addEventListener = StyledElements.ObjectWithEvents.prototype.addEventListener;
    Wirecloud.clearEventListeners = StyledElements.ObjectWithEvents.prototype.clearEventListeners;
    Wirecloud.dispatchEvent = StyledElements.ObjectWithEvents.prototype.dispatchEvent;

    const onCreateWorkspaceSuccess = function onCreateWorkspaceSuccess(response) {
        let workspace = null;

        if ([201, 401, 403, 409, 422, 500].indexOf(response.status) === -1) {
            return Promise.reject(utils.gettext("Unexpected response from server"));
        } else if (response.status === 422) {
            let error;
            try {
                error = JSON.parse(response.responseText);
            } catch (e) {
                return Promise.reject(e);
            }
            return Promise.reject(error);
        } else if ([401, 403, 500].indexOf(response.status) !== -1) {
            return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
        }

        workspace = JSON.parse(response.responseText);
        cache_workspace(workspace);
        return Promise.resolve(workspace);
    };

    /**
     * Loads and init all the required components for running the Wirecloud
     * Platform. Those components initialized includes the @{link
     * Wirecloud.UserInterfaceManager}, @{link Wirecloud.HistoryManager},
     * @{link Wirecloud.LocalCatalogue}, @{link Wirecloud#contextManager},
     * @{link Wirecloud#currentTheme}, @{link Wirecloud#preferences} and the
     * workspace list.
     *
     * @param {Object} options
     *     - `preventDefault` use this to not monitor the progress of the Task
     *     and to not load the initial workspace.
     *
     * @returns {Wirecloud.Task}
     */
    Wirecloud.init = function init(options) {

        this.workspaceInstances = {};
        this.workspacesByUserAndName = {};

        options = utils.merge({
            'preventDefault': false
        }, options);

        Wirecloud.UserInterfaceManager.init();

        if (options.preventDefault !== true) {
            window.addEventListener(
                "beforeunload",
                () => {
                    Wirecloud.UserInterfaceManager.monitorTask(
                        new Wirecloud.Task(gettext('Unloading WireCloud'), () => {})
                    );
                    Wirecloud.dispatchEvent('unload');
                },
                true);
        }

        // Init platform context
        const contextTask = Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_CONTEXT_COLLECTION, {
            method: 'GET',
            parameters: {
                lang: Wirecloud.constants.CURRENT_LANGUAGE,
                theme: Wirecloud.constants.CURRENT_THEME
            },
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            const context_info = JSON.parse(response.responseText);
            Wirecloud.constants.WORKSPACE_CONTEXT = context_info.workspace;
            Object.freeze(Wirecloud.constants.WORKSPACE_CONTEXT);
            Wirecloud.contextManager = new Wirecloud.ContextManager(Wirecloud, context_info.platform);
            Wirecloud.contextManager.modify({'mode': Wirecloud.constants.CURRENT_MODE});

            // Init moment locale
            moment.locale(Wirecloud.contextManager.get('language'));

            return Promise.resolve();
        }).toTask("Retrieving context information");

        const themeTask = contextTask.then(() => {
            // Init theme
            const url =  Wirecloud.URLs.THEME_ENTRY.evaluate({name: Wirecloud.contextManager.get('theme')});
            return Wirecloud.io.makeRequest(url, {
                method: 'GET',
                parameters: {
                    lang: Wirecloud.constants.CURRENT_LANGUAGE,
                    v: Wirecloud.contextManager.get('version_hash')
                },
                requestHeaders: {'Accept': 'application/json'}
            }).then((response) => {
                Wirecloud.currentTheme = new Wirecloud.ui.Theme(JSON.parse(response.responseText));
                Wirecloud.dispatchEvent('contextloaded');
                return Promise.resolve();
            });
        });

        const localCatalogueTask = contextTask.then(() => {
            return Wirecloud.LocalCatalogue.reload();
        });

        // Init platform preferences
        const preferencesTask = Wirecloud.io.makeRequest(Wirecloud.URLs.PLATFORM_PREFERENCES, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            const values = JSON.parse(response.responseText);

            Wirecloud.preferences = Wirecloud.PreferenceManager.buildPreferences('platform', values);
            Wirecloud.preferences.addEventListener('post-commit', preferencesChanged.bind(this));
            if ('WEBSOCKET' in Wirecloud.URLs) {
                const url = new URL(Wirecloud.URLs.WEBSOCKET, document.location);
                url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
                const livews = new WebSocket(url);
                livews.addEventListener('message', (event) => {
                    const msg = JSON.parse(event.data);

                    Wirecloud.live.dispatchEvent(msg.category, msg);
                });
                const LiveManager = class LiveManager extends StyledElements.ObjectWithEvents {
                    constructor() {
                        super(["workspace", "component"]);
                    }
                };
                Wirecloud.live = new LiveManager();
            }
            return Promise.resolve();
        });

        // Load workspace list
        const workspaceListTask = Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            const workspaces = JSON.parse(response.responseText);
            workspaces.forEach(cache_workspace);
            return Promise.resolve();
        });

        let initTask = new Wirecloud.Task(gettext('Retrieving WireCloud code'), function (resolve) {
            resolve();
        }).then(() => {
            return new Wirecloud.Task(gettext('Retrieving initial data'), [
                themeTask,
                localCatalogueTask,
                preferencesTask,
                workspaceListTask
            ]);
        });

        if (options.preventDefault !== true) {
            initTask = initTask.then(() => {
                Wirecloud.HistoryManager.init();
                const state = Wirecloud.HistoryManager.getCurrentState();
                Wirecloud.UserInterfaceManager.changeCurrentView('workspace', true);

                Wirecloud.dispatchEvent('loaded');
                return Wirecloud.changeActiveWorkspace(
                    {
                        owner: state.workspace_owner,
                        name: state.workspace_name
                    }, {
                        initialtab: state.tab,
                        history: "replace"
                    }
                );
            }, (error) => {
                const msg = gettext("Error loading WireCloud");
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                return Promise.reject();
            });
        }

        initTask.catch((error) => {
            Wirecloud.GlobalLogManager.log(error);
            return Promise.reject();
        });

        const task = initTask.toTask(gettext('Loading WireCloud Platform'));
        if (options.preventDefault !== true) {
            Wirecloud.UserInterfaceManager.monitorTask(task);
        }

        return task;
    };

    /**
     * Redirects to the login view.
     **/
    Wirecloud.login = function login(force) {
        const login_url = new URL(Wirecloud.URLs.LOGIN_VIEW, document.location);

        const next_url = window.location.pathname + window.location.search + window.location.hash;
        if (next_url !== '/') {
            login_url.searchParams.set("next", next_url);
        }
        if (force) {
            login_url.searchParams.set("force", "true");
        }

        window.location = login_url;
    };

    /**
     * Logouts from WireCloud
     */
    Wirecloud.logout = function logout() {
        if (Wirecloud.constants.FIWARE_PORTALS) {

            const promises = [];
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
            Promise.all(promises).then(_logout(), _logout());

        } else {
            _logout();
        }

    };

    /**
     * Requests workspace data and provides a {@link Wirecloud.Workspace} instance.
     *
     * @since 1.1
     *
     * @param {Object} workspace
     *      workspace information to use for requesting full workspace details
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
        let url;

        if ('id' in workspace) {
            url = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': workspace.id});
        } else if ('owner' in workspace && 'name' in workspace) {
            url = Wirecloud.URLs.WORKSPACE_ENTRY_OWNER_NAME.evaluate({'owner': workspace.owner, 'name': workspace.name});
        } else {
            throw new TypeError('use the id parameter or the owner/name pair of parameters');
        }

        return Wirecloud.io.makeRequest(url, {
            method: "GET",
            requestHeaders: {'Accept': 'application/json'}
        }).renameTask(utils.gettext("Requesting workspace data")).then((response) => {
            if ([200, 401, 403, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if (response.status === 403 && workspace.public === true) {
                return Promise.reject('Please log in');
            } else if (response.status !== 200) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }
            return process_workspace_data.call(this, response, options);
        }).toTask("Downloading workspace");
    };

    /**
     * Changes the active workspace by the indicated one.
     *
     * @since 1.1
     *
     * @param {Object} workspace
     *     workspace information to use for switching to the new workspace
     *
     * @returns {Wirecloud.Task}
     *
     * @example
     * Wirecloud.changeActiveWorkspace({"id": 1}).then(() => {
     *     // Workspace loaded and activated successfully
     * }, (error) => {
     *     // Error loading or activating the workspace
     * });
     */
    Wirecloud.changeActiveWorkspace = function changeActiveWorkspace(workspace, options) {
        options = utils.merge({
            initialtab: null,
            history: "push"
        }, options);

        if (!('owner' in workspace && 'name' in workspace) && !('id' in workspace)) {
            throw new TypeError('use the id parameter or the owner/name pair of parameters');
        }

        if (!('owner' in workspace) || !('name' in workspace)) {
            workspace = this.workspaceInstances[workspace.id];
        }

        return this.loadWorkspace(workspace, options)
            .then(
                switch_active_workspace.bind(this, options),
                report_error_switching_workspace
            )
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
     * - `name` (String): This options is required if neither the `mashup` nor
     *   the `workspace` options are used and the `title` option is also not
     *   used. This parameter is optional in any other case.
     * - `title` (String): This options is required if neither the `mashup` nor
     *   the `workspace` options are used and the `name` option is also not
     *   used. This parameter is optional in any other case.
     * - `workspace` (String): id of the workspace to clone.
     *
     * @returns {Wirecloud.Task}
     *
     * @example <caption>Create an empty workspace</caption>
     * Wirecloud.createWorkspace({name: "my-workspace"}).then(function (workspace) {
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
        options = utils.merge({
            allow_renaming: true,
            dry_run: false
        }, options);

        const body = {
            allow_renaming: !!options.allow_renaming,
            dry_run: !!options.dry_run
        };

        if (options.mashup == null && options.workspace == null && options.name == null && options.title == null) {
            throw new Error(utils.gettext('Missing name or title parameter'));
        } else if (options.mashup != null && options.workspace != null) {
            throw new Error(utils.gettext('Workspace and mashup options cannot be used at the same time'));
        }

        if (options.mashup != null && options.mashup.trim() !== "") {
            body.mashup = options.mashup;
        }

        if (options.name != null) {
            body.name = options.name;
        }

        if (options.title != null) {
            body.title = options.title;
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

        const url = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({
            workspace_id: workspace.id
        });

        return Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            if ([204, 401, 403, 404, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }

            if (workspace.id in this.workspaceInstances) {
                // Remove internal references
                const stored_workspace = this.workspaceInstances[workspace.id];
                delete this.workspaceInstances[workspace.id];
                delete this.workspacesByUserAndName[stored_workspace.owner][stored_workspace.name];
            }

            return Promise.resolve();
        });
    };

    /**
     * Removes a workspace from the WireCloud server
     *
     * @since 1.1
     *
     * @param {Object} target_workspace
     *     Workspace where merge other workspaces or mashups
     * @param {Object} options
     *
     * @returns {Wirecloud.Task}
     *
     * @example
     * Wirecloud.mergeWorkspace({
     *     mashup: "Wirecloud/TestMashup/1.0",
     *  }).then(function () {
     *     // Workspace merged successfully
     * }, function (error) {
     *     // Error merging workspace
     * };
     */
    Wirecloud.mergeWorkspace = function mergeWorkspace(target_workspace, options) {

        if (options == null) {
            options = {};
        }

        if (target_workspace.id == null) {
            if (target_workspace.owner == null || target_workspace.name == null) {
                throw new TypeError("missing id or owner/name parameters");
            }
            target_workspace = this.workspacesByUserAndName[target_workspace.owner][target_workspace.name];
        } else {
            target_workspace = this.workspaceInstances[target_workspace.id];
        }

        if (!("mashup" in options) && !("workspace" in options)) {
            throw new TypeError('one of the following options must be provided: workspace or mashup');
        } else if ("mashup" in options && "workspace" in options) {
            throw new TypeError('workspace and mashup options cannot be used at the same time');
        }

        const url = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({to_ws_id: target_workspace.id});

        return Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({
                mashup: options.mashup,
                workspace: options.workspace
            })
        }).then((response) => {
            if ([204, 401, 403, 404, 422, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if (response.status === 422) {
                let error;
                try {
                    error = JSON.parse(response.responseText);
                } catch (e) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                }
                return Promise.reject(error);
            } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }

            const workspace = {
                id: target_workspace.id,
                owner: target_workspace.owner,
                name: target_workspace.name
            };
            cache_workspace(workspace);
            return Promise.resolve(workspace);
        });
    };

    /**
     * Logs in as another user/organization using current user
     * credentials/permissions
     *
     * @since 1.4
     *
     * @param {String} targetuser
     *     Username of the user to change to. Current user should be and
     *     administrator or being owner of the target organization.
     *
     * @returns {Wirecloud.Task}
     *
     * @example
     * Wirecloud.switchUser("usertoimpersonate").then(
     *   () => {
     *     // User switched successfully
     *   },
     *   (error) => {
     *     // Error switching current user
     *   };
     */
    Wirecloud.switchUser = function switchUser(targetuser) {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.SWITCH_USER_SERVICE, {
            method: 'POST',
            contentType: 'application/json',
            postBody: JSON.stringify({username: targetuser})
        }).then(
            (response) => {
                if ([401, 403, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                } else if (response.status !== 204) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                }
                const location = response.getHeader('Location');
                document.location.assign(location != null ? location : Wirecloud.URLs.ROOT_URL);
            }
        );
    };

})(Wirecloud.Utils);
