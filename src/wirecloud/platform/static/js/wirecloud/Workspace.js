/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
            on_createwidget: on_createwidget.bind(this),
            on_removetab: on_removetab.bind(this),
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
            initialTab: {
                get: function get() {return find_initial_tab.call(this);}
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {String}
             */
            longDescription: {
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
                get: function () {
                    return privates.get(this).tabs.slice(0);
                }
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Object.<String, Wirecloud.WorkspaceTab>}
             */
            tabsById: {
                get: function () {
                    return get_tabs_by_id.call(this);
                }
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
                get: function get() {return get_url.call(this);}
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Array.<Wirecloud.Widget>}
             */
            widgets: {
                get: function get() {return get_widgets.call(this);}
            },
            /**
             * @memberOf Wirecloud.Workspace#
             * @type {Object.<String, Wirecloud.Widget>}
             */
            widgetsById: {
                get: function get() {return get_widgets_by_id.call(this);}
            }
        });

        this.contextManager.modify({
            name: data.name,
            owner: data.owner
        });

        /* FIXME */
        this.restricted = data.owner != Wirecloud.contextManager.get('username') || Wirecloud.contextManager.get('mode') === 'embedded';
        this.removable = !this.restricted && data.removable;
        /* END FIXME */

        Object.defineProperties(this, {
            preferences: {
                value: Wirecloud.PreferenceManager.buildPreferences('workspace', data.preferences, this, data.extra_prefs)
            }
        });

        data.tabs.forEach(_create_tab, this);

        Object.defineProperties(this, {
            operators: {
                get: function () {
                    return this.wiring.operators;
                }
            },
            operatorsById: {
                get: function () {
                    return this.wiring.operatorsById;
                }
            },
            wiring: {
                value: new Wirecloud.Wiring(this, data.wiring)
            }
        });

        this.wiring.addEventListener('createoperator', on_createoperator.bind(this));
        this.wiring.addEventListener('removeoperator', on_removeoperator.bind(this));

        if (Wirecloud.live) {
            Wirecloud.live.addEventListener('workspace', priv.on_livemessage);
        }
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Workspace, se.ObjectWithEvents, /** @lends Wirecloud.Workspace.prototype */{

        /**
         */
        createTab: function createTab() {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.TAB_COLLECTION.evaluate({
                    workspace_id: this.id
                });

                var content = {
                    name: create_tabtitle.call(this)
                };

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(content),
                    onComplete: function (response) {
                        if (response.status === 201) {
                            var tab = _create_tab.call(this, JSON.parse(response.transport.responseText));
                            resolve(tab);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        /**
         * @param {String} id
         */
        findOperator: function findOperator(id) {
            return this.wiring.findOperator(id);
        },

        /**
         * @param {String} id
         */
        findTab: function findTab(id) {
            return this.tabsById[id];
        },

        /**
         * @param {String} id
         */
        findWidget: function findWidget(id) {
            var widgets = this.widgets,
                i;

            for (i = 0; i < widgets.length; i++) {
                if (widgets[i].id === id) {
                    return widgets[i];
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
            case "catalogue_view_widgets":
                return is_allowed('add_remove_iwidgets');
            case "catalogue_view_mashups":
                return this.isAllowed('add_remove_workspaces') || is_allowed('merge_workspaces');
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
         * @param {Object} options
         */
        merge: function merge(options) {
            if (options == null || typeof options != "object") {
                throw new TypeError("options must be an object");
            }

            if (!("mashup" in options) && !("workspace" in options)) {
                throw new TypeError('one of the following options must be provided: workspace or mashup');
            } else if ("mashup" in options && "workspace" in options) {
                throw new TypeError('workspace and mashup options cannot be used at the same time');
            }

            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.WORKSPACE_MERGE.evaluate({
                    to_ws_id: this.id
                });

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(options),
                    onComplete: function (response) {
                        if (response.status === 204) {
                            resolve(this);
                            /*
                                Wirecloud.changeActiveWorkspace(this);
                             */
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        publish: function publish(data) {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.WORKSPACE_PUBLISH.evaluate({
                    workspace_id: this.id
                });

                var content = new FormData();

                if (data.image) {
                    content.append('image', data.image);
                }

                delete data.image;
                content.append('json', JSON.stringify(data));

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    postBody: content,
                    onComplete: function (response) {
                        if (response.status === 201) {
                            Wirecloud.LocalCatalogue._includeResource(JSON.parse(response.responseText));
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        remove: function remove() {
            return Wirecloud.removeWorkspace(this).then(function () {
                this.trigger('remove');
            }.bind(this));
        },

        /**
         * @param {String} name
         */
        rename: function rename(name) {

            if (typeof name !== 'string' || !name.trim().length) {
                throw new TypeError("invalid name parameter");
            }

            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({
                    workspace_id: this.id
                });

                var content = {
                    name: name
                };

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(content),
                    onComplete: function (response) {
                        if (response.status === 204) {
                            this.contextManager.modify({
                                name: name
                            });
                            this.trigger('change', ['name']);
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        unload: function unload() {
            if (Wirecloud.live) {
                var priv = privates.get(this);
                Wirecloud.live.removeEventListener('workspace', priv.on_livemessage);
            }
            this.wiring.removeEventListener('createoperator', on_createoperator.bind(this));
            this.wiring.removeEventListener('removeoperator', on_removeoperator.bind(this));

            this.trigger('unload');

            Wirecloud.GlobalLogManager.log(utils.gettext('Workspace unloaded successfully'), Wirecloud.constants.LOGGING.INFO_MSG);
            Wirecloud.GlobalLogManager.newCycle();

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var get_tabs_by_id = function get_tabs_by_id() {
        /*jshint validthis:true */
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

        this.trigger('createtab', tab);

        if (Array.isArray(data.iwidgets) && data.iwidgets.length) {
            data.iwidgets.forEach(function (data) {
                var resource = this.resources.findResource('widget', data.widget, true);
                tab.createWidget(resource, utils.merge(data, {
                    commit: false
                }));
            }, this);
        }

        return tab;
    };

    var create_tabtitle = function create_tabtitle() {
        var copy, title, titles, priv;

        priv = privates.get(this);

        titles = priv.tabs.map(function (tab) {
            return tab.title;
        });

        copy = 1;
        title = utils.interpolate(utils.gettext("Tab %(index)s"), {
            index: priv.tabs.length + 1
        });

        if (titles.indexOf(title) < 0) {
            return title;
        }

        while (titles.indexOf(title + "(" + copy + ")") !== -1) {
            copy += 1;
        }

        return title + "(" + copy + ")";
    };

    var find_initial_tab = function find_initial_tab() {
        var i, priv;

        priv = privates.get(this);

        for (i = 0; i < priv.tabs.length; i++) {
            if (priv.tabs[i].initial) {
                return priv.tabs[i];
            }
        }

        return null;
    };

    var get_url = function get_url() {
        return document.location.protocol + '//' + document.location.host + Wirecloud.URLs.WORKSPACE_VIEW.evaluate({
            name: encodeURIComponent(this.name),
            owner: encodeURIComponent(this.owner)
        });
    };

    var get_widgets = function get_widgets() {
        return Array.prototype.concat.apply([], privates.get(this).tabs.map(function (tab) {
            return tab.widgets;
        }));
    };

    var get_widgets_by_id = function get_widgets_by_id() {
        return utils.merge.apply(utils, privates.get(this).tabs.map(function (tab) {
            return tab.widgetsById;
        }));
    };

    var is_allowed = function is_allowed(permission) {
        return Wirecloud.PolicyManager.evaluate('workspace', permission);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changetab = function on_changetab(tab, changes) {
        this.trigger('changetab', tab, changes);
    };

    var on_createoperator = function on_createoperator(wiring, operator) {
        this.resources.addComponent(operator.meta);
        this.trigger('createoperator', operator);
    };

    var on_createwidget = function on_createwidget(tab, widget) {
        this.resources.addComponent(widget.meta);
        this.trigger('createwidget', widget);
    };

    var on_livemessage = function on_livemessage(live, data) {
        if (data.workspace === this.id) {
            if ('name' in data) {
                this.contextManager.modify({
                    name: data.name
                });
                this.trigger('change', ['name']);
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

        this.trigger('removetab', tab);
    };

    var on_removeoperator = function on_removeoperator(wiring, operator) {
        this.trigger('removeoperator', operator);
    };

    var on_removewidget = function on_removewidget(tab, widget) {
        this.trigger('removewidget', widget);
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
