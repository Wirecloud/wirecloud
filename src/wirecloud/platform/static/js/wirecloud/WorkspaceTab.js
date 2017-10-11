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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * @name Wirecloud.WorkspaceTab
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Wirecloud.Workspace} workspace
     * @param {Object} data
     * @param {String} data.id
     * @param {String} datan.name
     * @param {Boolean} [data.initial]
     */
    ns.WorkspaceTab = function WorkspaceTab(workspace, data) {

        if (!(workspace instanceof Wirecloud.Workspace)) {
            throw new TypeError("invalid workspace parameter");
        }

        se.ObjectWithEvents.call(this, events);
        data = clean_data.call(this, data);

        privates.set(this, {
            initial: data.initial,
            name: data.name,
            title: data.title != null && data.title.trim() != "" ? data.title : data.name,
            widgets: [],
            on_changetab: on_changetab.bind(this),
            on_removewidget: on_removewidget.bind(this)
        });

        Object.defineProperties(this, /** @lends Wirecloud.WorkspaceTab# */{
            /**
             * @type {String}
             */
            id: {
                value: data.id
            },
            /**
             * @type {Boolean}
             */
            initial: {
                get: function () {
                    return privates.get(this).initial;
                }
            },
            /**
             * @type {String}
             */
            name: {
                get: function () {
                    return privates.get(this).name;
                }
            },
            /**
             * @type {String}
             */
            title: {
                get: function () {
                    return privates.get(this).title;
                }
            },
            /**
             * @type {Array.<Wirecloud.Widget>}
             */
            widgets: {
                get: function () {
                    return privates.get(this).widgets.slice(0);
                }
            },
            /**
             * @type {Object.<String, Wirecloud.Widget>}
             */
            widgetsById: {
                get: function () {
                    return get_widgets_by_id.call(this);
                }
            },
            /**
             * @type {Wirecloud.Workspace}
             */
            workspace: {
                value: workspace
            }
        });

        Object.defineProperties(this, /** @lends Wirecloud.WorkspaceTab# */{
            /**
             * @type {Wirecloud.WorkspaceTabPreferences}
             */
            preferences: {
                value: create_preferences.call(this, data.preferences)
            }
        });

        this.workspace.addEventListener('changetab', privates.get(this).on_changetab);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WorkspaceTab, se.ObjectWithEvents, /** @lends Wirecloud.WorkspaceTab.prototype */{

        /**
         * @param {Wirecloud.WidgetMeta} resource
         * @param {Object} [options]
         * @param {String} [options.title]
         * @param {Boolean} [options.commit]
         * @returns {Promise} A promise that returns a {Widget} instance if
         * resolved, or an Error if rejected.
         */
        createWidget: function createWidget(resource, options) {
            options = utils.merge({
                commit: true,
                title: resource.title
            }, options);

            if (!options.commit) {
                return create_widget.call(this, resource, options);
            }

            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.IWIDGET_COLLECTION.evaluate({
                    workspace_id: this.workspace.id,
                    tab_id: this.id
                });

                if (this.workspace.restricted) {
                    reject(utils.interpolate(utils.gettext("The destination tab (%(title)s) is readonly"), {
                        title: this.title
                    }));
                }

                var content = utils.merge(options, {
                    widget: resource.uri
                });

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(content),
                    onComplete: function (response) {
                        if (response.status === 201) {
                            resolve(create_widget.call(this, resource, JSON.parse(response.responseText)));
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
        findWidget: function findWidget(id) {
            return get_widgets_by_id.call(this)[id];
        },

        /**
         * @param {String} permission
         */
        isAllowed: function isAllowed(permission) {
            switch (permission) {
            case 'remove':
                return !this.workspace.restricted && Object.keys(this.workspace.tabs).length > 1 && !privates.get(this).widgets.some(function (widget) {
                    return !widget.volatile && !widget.isAllowed('close');
                });
            default:
                throw new TypeError("invalid permission parameter");
            }
        },

        /**
         * Removes this workspace tab from the server.
         *
         * @returns {Wirecloud.Task}
         */
        remove: function remove() {
            var url = Wirecloud.URLs.TAB_ENTRY.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.id
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

                remove_tab.call(this);
                return Promise.resolve(this);
            });
        },

        /**
         * Renames this tab.
         *
         * @param {String} title new title for this workspace tab
         * @param {String} [name] new name for this workspace tab. This is the identifier used on URLs
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

            var url = Wirecloud.URLs.TAB_ENTRY.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.id
            });

            var content = {
                title: title,
                name: name
            };

            return Wirecloud.io.makeRequest(url, {
                method: 'POST',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(content),
            }).then((response) => {
                if ([204, 401, 403, 409, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 409, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }
                change_name.call(this, title, name);
                return Promise.resolve(this);
            });
        },

        /**
         */
        setInitial: function setInitial() {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.TAB_ENTRY.evaluate({
                    workspace_id: this.workspace.id,
                    tab_id: this.id
                });

                var content = {
                    visible: true // TODO: initial: true
                };

                Wirecloud.io.makeRequest(url, {
                    method: 'POST',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(content),
                    onComplete: function (response) {
                        if (response.status === 204) {
                            change_initial.call(this, true);
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var events = ['change', 'createwidget', 'preremove', 'remove', 'removewidget'];

    var change_initial = function change_initial(initial) {
        privates.get(this).initial = initial;
        this.dispatchEvent('change', ['initial']);
    };

    var change_name = function change_name(title, name) {
        var priv = privates.get(this);

        var old_title = priv.title;
        var old_name = priv.name;
        priv.title = title;
        priv.name = name;
        this.dispatchEvent('change', ['name', 'title'], {name: old_name, title: old_title});
    };

    var clean_data = function clean_data(data) {
        data = utils.merge({
            preferences: {}
        }, data);

        data.initial = !!data.visible;
        data.name = data.name;

        return data;
    };

    var create_preferences = function create_preferences(preferences) {
        return Wirecloud.PreferenceManager.buildPreferences('tab', preferences, this);
    };

    var create_widget = function create_widget(resource, data) {
        var widget = new Wirecloud.Widget(this, resource, data);

        widget.addEventListener('remove', privates.get(this).on_removewidget);
        privates.get(this).widgets.push(widget);
        this.dispatchEvent('createwidget', widget);

        return widget;
    };

    var get_widgets_by_id = function get_widgets_by_id() {
        var widgets = {};

        privates.get(this).widgets.forEach(function (widget) {
            widgets[widget.id] = widget;
        });

        return widgets;
    };

    var remove_tab = function remove_tab() {
        this.dispatchEvent('preremove');
        this.workspace.removeEventListener('changetab', privates.get(this).on_changetab);
        this.dispatchEvent('remove');
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changetab = function on_changetab(workspace, tab, changes) {
        if (tab !== this && changes.initial && tab.initial && this.initial) {
            change_initial.call(this, false);
        }
    };

    var on_removewidget = function on_removewidget(widget) {
        widget.removeEventListener('remove', privates.get(this).on_removewidget);
        privates.get(this).widgets.splice(privates.get(this).widgets.indexOf(widget), 1);
        this.dispatchEvent('removewidget', widget);
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
