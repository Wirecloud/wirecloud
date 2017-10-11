/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals encodeURIComponent, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * @name Wirecloud.Workspace
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Object} data
     * @param {Wirecloud.WorkspaceResourceManager} resources
     */
    ns.Workspace = function Workspace(data, resources) {
        var priv;

        se.ObjectWithEvents.call(this, [
            'createoperator',
            'createtab',
            'createwidget',
            'change',
            'changetab',
            'remove',
            'removeoperator',
            'removetab',
            'removewidget',
            'unload'
        ]);

        priv = {
            tabs: [],
            on_livemessage: on_livemessage.bind(this),
            on_changetab: on_changetab.bind(this),
            on_createoperator: on_createoperator.bind(this),
            on_createwidget: on_createwidget.bind(this),
            on_removetab: on_removetab.bind(this),
            on_removeoperator: on_removeoperator.bind(this),
            on_removewidget: on_removewidget.bind(this)
        };
        privates.set(this, priv);

        Object.defineProperties(this, {
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Wirecloud.ContextManager}
             */
            contextManager: {
                value: new Wirecloud.ContextManager(this, Wirecloud.constants.WORKSPACE_CONTEXT)
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            description: {
                get: function () {
                    return this.contextManager.get('description');
                }
            },
            /**
             * List of required preferences in empty status.
             *
             * @memberOf Wirecloud.Workspace#
             * @type {Array.<String>}
             */
            emptyparams: {
                value: data.empty_params
            },
            /**
             * Extra preferences
             *
             * @memberOf Wirecloud.Workspace#
             */
            extraprefs: {
                value: data.extra_prefs
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            id: {
                value: data.id
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Wirecloud.WorkspaceTab}
             */
            initialtab: {
                get: on_initial_tab_get
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            longdescription: {
                get: function () {
                    return this.contextManager.get('longdescription');
                }
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            name: {
                get: function () {
                    return this.contextManager.get('name');
                }
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            title: {
                get: function () {
                    return this.contextManager.get('title');
                }
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            owner: {
                get: function () {
                    return this.contextManager.get('owner');
                }
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Wirecloud.WorkspaceResourceManager}
             */
            resources: {
                value: resources
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Boolean}
             */
            shared: {
                value: !!data.shared
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Array.<Wirecloud.WorkspaceTab>}
             */
            tabs: {
                get: on_tabs_get
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Object.<String, Wirecloud.WorkspaceTab>}
             */
            tabsById: {
                get: on_tabs_by_id_get
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Date}
             */
            updateDate: {
                value: new Date(data.lastmodified)
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Array.<User>}
             */
            users: {
                value: data.users
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            url: {
                get: on_url_get
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Array.<Wirecloud.Widget>}
             */
            widgets: {
                get: on_widgets_get
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Object.<String, Wirecloud.Widget>}
             */
            widgetsById: {
                get: on_widgets_by_id_get
            }
        });

        this.contextManager.modify({
            title: data.title != null && data.title.trim() != "" ? data.title : data.name,
            name: data.name,
            owner: data.owner,
            description: data.description,
            longdescription: data.longdescription
        });

        /* FIXME */
        this.restricted = data.owner !== Wirecloud.contextManager.get('username') || Wirecloud.contextManager.get('mode') === 'embedded';
        this.removable = !this.restricted && data.removable;
        /* END FIXME */

        Object.defineProperties(this, {
            preferences: {
                value: Wirecloud.PreferenceManager.buildPreferences('workspace', data.preferences, this, data.extra_prefs)
            }
        });

        if (Array.isArray(data.tabs)) {
            data.tabs.forEach(_create_tab, this);
        }

        Object.defineProperties(this, {
            operators: {
                get: on_operators_get
            },
            operatorsById: {
                get: on_operators_by_id_get
            },
            wiring: {
                value: new Wirecloud.Wiring(this, data.wiring)
            }
        });

        this.wiring.addEventListener('createoperator', priv.on_createoperator);
        this.wiring.addEventListener('removeoperator', priv.on_removeoperator);

        if (Wirecloud.live) {
            Wirecloud.live.addEventListener('workspace', priv.on_livemessage);
        }
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Workspace, se.ObjectWithEvents, /** @lends Wirecloud.Workspace.prototype */{

        /**
         * Creates a new tab inside this workspace
         *
         * @param {Object} [options]
         *
         * @returns {Wirecloud.Task}
         */
        createTab: function createTab(options) {
            if (options == null) {
                options = {};
            }

            var url = Wirecloud.URLs.TAB_COLLECTION.evaluate({
                workspace_id: this.id
            });

            if (options.title == null) {
                options.title = create_tabtitle.call(this);
            }

            if (options.name == null) {
                options.name = URLify(options.title);
            }

            var content = {
                name: options.name,
                title: options.title
            };

            return Wirecloud.io.makeRequest(url, {
                method: 'POST',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(content)
            }).then((response) => {
                if ([201, 401, 403, 409, 422, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if (response.status !== 201) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                var tab = _create_tab.call(this, JSON.parse(response.responseText));
                return Promise.resolve(tab);
            });
        },

        /**
         * Looks up an operator in this workspace.
         *
         * @param {String} id
         * @returns {Wirecloud.wiring.Operator}
         *     Matching {@link Wirecloud.wiring.Operator} instance, `null` if
         *     not found.
         */
        findOperator: function findOperator(id) {
            return this.wiring.findOperator(id);
        },

        /**
         * Looks up a tab in this workspace.
         *
         * @param {String} id
         *     Id of the wanted tab.
         * @returns {Wirecloud.WorkspaceTab}
         *     Matching {@link Wirecloud.WorkspaceTab} instance, `null` if not
         *     found.
         */
        findTab: function findTab(id) {
            if (id == null) {
                throw new TypeError("Missing id parameter");
            }

            // Force string ids
            id = String(id);

            return this.tabsById[id] || null;
        },

        /**
         * Looks up a widget insid this workspace.
         *
         * @param {String} id
         * @returns {Wirecloud.Widget}
         *     Matching {@link Wirecloud.Widget} instance, `null` if not found.
         */
        findWidget: function findWidget(id) {
            if (id == null) {
                throw new TypeError("Missing id parameter");
            }

            // Force string ids
            id = String(id);

            for (var i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].id === id) {
                    return this.widgets[i];
                }
            }

            return null;
        },

        /**
         * @param {String} permission
         */
        isAllowed: function isAllowed(permission) {

            if (this.restricted) {
                return false;
            }

            switch (permission) {
            case "remove":
                return this.removable;
            case "merge_workspaces":
                return is_allowed('add_remove_iwidgets') || is_allowed('merge_workspaces');
            case "update_preferences":
                return this.removable && is_allowed('change_workspace_preferences');
            case "rename":
                return this.removable && is_allowed('rename_workspaces');
            case "edit":
                return this.removable;
            default:
                return is_allowed(permission);
            }
        },

        /**
         * Merges other workspaces or mashups into this workspace. See
         * {@link Wirecloud.mergeWorkspace} for more details.
         *
         * @param {Object} options
         *
         * @returns {Wirecloud.Task}
         */
        merge: function merge(options) {
            return Wirecloud.mergeWorkspace(this, options);
        },

        /**
         * Creates a packaged version of this workspace and uploads it into My
         * Resources.
         *
         * @param {Object} options
         *
         * @returns {Wirecloud.Task}
         */
        publish: function publish(options) {

            if (options == null) {
                throw new TypeError("missing options parameter");
            }

            var url = Wirecloud.URLs.WORKSPACE_PUBLISH.evaluate({
                workspace_id: this.id
            });

            var content = new FormData();

            if (options.image) {
                content.append('image', options.image);
                delete options.image;
            }

            content.append('json', JSON.stringify(options));

            return Wirecloud.io.makeRequest(url, {
                method: 'POST',
                requestHeaders: {'Accept': 'application/json'},
                postBody: content
            }).then((response) => {
                if ([201, 401, 403, 409, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 409, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                Wirecloud.LocalCatalogue._includeResource(JSON.parse(response.responseText));
                return Promise.resolve();
            });
        },

        /**
         * Removes this workspace from the WireCloud server.
         *
         * @returns {Wirecloud.Task}
         */
        remove: function remove() {
            return Wirecloud.removeWorkspace(this).then(function () {
                this.dispatchEvent('remove');
            }.bind(this));
        },

        /**
         * Renames this workspace.
         *
         * @param {String} title new title for this workspace
         * @param {String} [name] new name for this workspace. This is the identifier used on URLs
         *
         * @returns {Wirecloud.Task}
         */
        rename: function rename(title, name) {

            if (typeof title !== 'string' || !title.trim().length) {
                throw new TypeError("invalid title parameter");
            }

            if (name == null) {
                name = URLify(title);
            }

            var url = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({
                workspace_id: this.id
            });

            var content = {
                title: title,
                name: name
            };

            return Wirecloud.io.makeRequest(url, {
                method: 'POST',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(content)
            }).then((response) => {
                if ([204, 401, 403, 409, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 409, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                var old_name = this.contextManager.get('name');
                var old_title = this.contextManager.get('title');
                this.contextManager.modify({
                    name: name,
                    title: title
                });
                this.dispatchEvent('change', ['name', 'title'], {name: old_name, title: old_title});
                return Promise.resolve(this);
            });
        },

        unload: function unload() {
            var priv = privates.get(this);
            if (Wirecloud.live) {
                Wirecloud.live.removeEventListener('workspace', priv.on_livemessage);
            }
            this.wiring.removeEventListener('removeoperator', priv.on_removeoperator);
            this.wiring.removeEventListener('createoperator', priv.on_createoperator);

            this.dispatchEvent('unload');

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var on_tabs_get = function on_tabs_get() {
        return privates.get(this).tabs.slice(0);
    };

    var on_tabs_by_id_get = function on_tabs_by_id_get() {
        var tabs = {};

        privates.get(this).tabs.forEach(function (tab) {
            tabs[tab.id] = tab;
        });

        return tabs;
    };

    var _create_tab = function _create_tab(data) {
        var tab = new Wirecloud.WorkspaceTab(this, data);
        var priv = privates.get(this);

        tab.addEventListener('change', priv.on_changetab);
        tab.addEventListener('createwidget', priv.on_createwidget);
        tab.addEventListener('remove', priv.on_removetab);
        tab.addEventListener('removewidget', priv.on_removewidget);

        priv.tabs.push(tab);

        this.dispatchEvent('createtab', tab);

        data.iwidgets.forEach(function (data) {
            var resource = this.resources.findResource('widget', data.widget, true);
            tab.createWidget(resource, utils.merge(data, {
                commit: false
            }));
        }, this);

        return tab;
    };

    var create_tabtitle = function create_tabtitle() {
        var copy, base, title, titles, priv;

        priv = privates.get(this);
        titles = priv.tabs.map(function (tab) {
            return tab.title;
        });

        copy = 1;
        base = title = utils.interpolate(utils.gettext("Tab %(index)s"), {
            index: priv.tabs.length + 1
        });

        while (titles.indexOf(title) !== -1) {
            copy += 1;
            title = utils.interpolate(utils.gettext("%(base) (%(copy)s)"), {
                base: base,
                copy: copy
            });
        }

        return title;
    };

    var on_initial_tab_get = function on_initial_tab_get() {
        var i, priv;

        priv = privates.get(this);

        for (i = 0; i < priv.tabs.length; i++) {
            if (priv.tabs[i].initial) {
                return priv.tabs[i];
            }
        }

        return null;
    };

    var on_operators_get = function on_operators_get() {
        return this.wiring.operators;
    };

    var on_operators_by_id_get = function on_operators_by_id_get() {
        return this.wiring.operatorsById;
    };

    var on_url_get = function on_url_get() {
        return new URL(
            Wirecloud.URLs.WORKSPACE_VIEW.evaluate({
                name: encodeURIComponent(this.name),
                owner: encodeURIComponent(this.owner)
            }),
            Wirecloud.location.base
        );
    };

    var on_widgets_get = function on_widgets_get() {
        return Array.prototype.concat.apply([], privates.get(this).tabs.map(function (tab) {
            return tab.widgets;
        }));
    };

    var on_widgets_by_id_get = function on_widgets_by_id_get() {
        var args = privates.get(this).tabs.map(function (tab) {
            return tab.widgetsById;
        })

        // Create an empty object where store the widgets
        args.unshift({});
        return utils.merge.apply(utils, args);
    };

    var is_allowed = function is_allowed(permission) {
        return Wirecloud.PolicyManager.evaluate('workspace', permission);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changetab = function on_changetab(tab, changes) {
        this.dispatchEvent('changetab', tab, changes);
    };

    var on_createoperator = function on_createoperator(wiring, operator) {
        this.resources.addComponent(operator.meta);
        this.dispatchEvent('createoperator', operator);
    };

    var on_createwidget = function on_createwidget(tab, widget) {
        this.resources.addComponent(widget.meta);
        this.dispatchEvent('createwidget', widget);
    };

    var on_livemessage = function on_livemessage(live, data) {
        if (data.workspace === this.id) {
            if ('name' in data) {
                var old_name = this.contextManager.get('name');
                this.contextManager.modify({
                    name: data.name
                });
                this.dispatchEvent('change', ['name'], {name: old_name});
            }
        }
    };

    var on_removetab = function on_removetab(tab) {
        var priv = privates.get(this);

        priv.tabs.splice(priv.tabs.indexOf(tab), 1);

        tab.removeEventListener('change', priv.on_changetab);
        tab.removeEventListener('createwidget', priv.on_createwidget);
        tab.removeEventListener('remove', priv.on_removetab);
        tab.removeEventListener('removewidget', priv.on_removewidget);

        this.dispatchEvent('removetab', tab);
    };

    var on_removeoperator = function on_removeoperator(wiring, operator) {
        this.dispatchEvent('removeoperator', operator);
    };

    var on_removewidget = function on_removewidget(tab, widget) {
        this.dispatchEvent('removewidget', widget);
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
