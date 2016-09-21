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

        _private.set(this, {
            initial: data.initial,
            name: data.name,
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
                    return _private.get(this).initial;
                }
            },
            /**
             * @type {String}
             */
            name: {
                get: function () {
                    return _private.get(this).name;
                }
            },
            /**
             * @type {Array.<Wirecloud.Widget>}
             */
            widgets: {
                get: function () {
                    return _private.get(this).widgets.slice(0);
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

        this.workspace.addEventListener('changetab', _private.get(this).on_changetab);
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
                    widget: resource.id
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
                return !this.workspace.restricted && Object.keys(this.workspace.tabs).length > 1 && !_private.get(this).widgets.some(function (widget) {
                    return !widget.volatile && !widget.isAllowed('close');
                });
            default:
                throw new TypeError("invalid permission parameter");
            }
        },

        /**
         */
        remove: function remove() {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.TAB_ENTRY.evaluate({
                    workspace_id: this.workspace.id,
                    tab_id: this.id
                });

                Wirecloud.io.makeRequest(url, {
                    method: 'DELETE',
                    requestHeaders: {'Accept': 'application/json'},
                    onComplete: function (response) {
                        if (response.status === 204) {
                            remove_tab.call(this);
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        /**
         * @param {String} name
         */
        rename: function rename(name) {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.TAB_ENTRY.evaluate({
                    workspace_id: this.workspace.id,
                    tab_id: this.id
                });

                try {
                    name = clean_name.call(this, name);
                } catch (e) {
                    reject(e);
                }

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
                            change_name.call(this, name);
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
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

    var _private = new WeakMap();

    var events = ['change', 'createwidget', 'preremove', 'remove', 'removewidget'];

    var change_initial = function change_initial(initial) {
        _private.get(this).initial = initial;
        this.trigger('change', ['initial']);
    };

    var change_name = function change_name(name) {
        _private.get(this).name = name;
        this.trigger('change', ['name']);
    };

    var clean_data = function clean_data(data) {
        data = utils.merge({
            preferences: {}
        }, data);

        data.initial = !!data.visible;
        data.name = data.name;

        return data;
    };

    var clean_name = function clean_name(name) {
        /*jshint validthis:true */
        if (typeof name !== 'string' || !name.trim().length) {
            throw utils.gettext("Error to update a tab: invalid name");
        }

        name = name.trim();

        var already_taken = this.workspace.tabs.some(function (tab) {
            return tab.id !== this.id && tab.name === name;
        }, this);

        if (already_taken) {
            throw utils.interpolate(utils.gettext("Error to update tab: the name %(name)s is already taken in this workspace"), {
                name: name
            });
        }

        return name;
    };

    var create_preferences = function create_preferences(preferences) {
        /*jshint validthis:true */
        return Wirecloud.PreferenceManager.buildPreferences('tab', preferences, this);
    };

    var create_widget = function create_widget(resource, data) {
        /*jshint validthis:true */
        var widget = new Wirecloud.Widget(this, resource, data);

        widget.addEventListener('remove', _private.get(this).on_removewidget);
        _private.get(this).widgets.push(widget);
        this.trigger('createwidget', widget);

        return widget;
    };

    var get_widgets_by_id = function get_widgets_by_id() {
        /*jshint validthis:true */
        var widgets = {};

        _private.get(this).widgets.forEach(function (widget) {
            widgets[widget.id] = widget;
        });

        return widgets;
    };

    var remove_tab = function remove_tab() {
        /*jshint validthis:true */
        this.trigger('preremove');
        this.workspace.removeEventListener('changetab', _private.get(this).on_changetab);
        this.trigger('remove');
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changetab = function on_changetab(workspace, tab, changes) {
        /*jshint validthis:true */
        if (tab !== this && changes.initial && tab.initial && this.initial) {
            change_initial.call(this, false);
        }
    };

    var on_removewidget = function on_removewidget(widget) {
        /*jshint validthis:true */
        widget.removeEventListener('remove', _private.get(this).on_removewidget);
        _private.get(this).widgets.splice(_private.get(this).widgets.indexOf(widget), 1);
        this.trigger('removewidget', widget);
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
