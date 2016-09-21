/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * @name Wirecloud.Widget
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Wirecloud.WorkspaceTab} tab
     * @param {Wirecloud.WidgetMeta} resource
     * @param {Object} data
     */
    ns.Widget = function Widget(tab, resource, data) {
        se.ObjectWithEvents.call(this, [
            'change',
            'load',
            'remove',
            'unload'
        ]);

        data = utils.merge({
            preferences: {},
            properties: {}
        }, data);

        this.pending_events = [];
        this.prefCallback = null;

        this.permissions = Wirecloud.Utils.merge({
            'close': true,
            'configure': true,
            'move': true,
            'rename': true,
            'resize': true,
            'minimize': true,
            'upgrade': true
        }, data.permissions);

        if (data.readonly) {
            this.permissions.close = false;
            this.permissions.move = false;
            this.permissions.resize = false;
            this.permissions.upgrade = false;
            this.permissions.minimize = false;
        }

        privates.set(this, {
            position: {
                x: data.left,
                y: data.top,
                z: data.zIndex
            },
            resource: resource,
            shape: {
                width: data.width,
                height: data.height
            },
            status: STATUS.CREATED,
            tab: tab,
            on_preremovetab: on_preremovetab.bind(this)
        });

        Object.defineProperties(this, {
            /**
             * @memberOf Wirecloud.Widget#
             * @type {String}
             */
            codeurl: {
                get: function () {
                    return this.meta.codeurl + "#id=" + this.id;
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {String}
             */
            id: {
                value: data.id
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Boolean}
             */
            loaded: {
                get: function () {
                    return privates.get(this).status === STATUS.RUNNING;
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Boolean}
             */
            logManager: {
                value: new Wirecloud.WidgetLogManager(this)
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Wirecloud.WidgetMeta}
             */
            meta: {
                get: function () {
                    return privates.get(this).resource;
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Boolean}
             */
            missing: {
                get: function () {
                    return this.meta.missing;
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Wirecloud.WorkspaceTab}
             */
            tab: {
                get: function () {
                    return privates.get(this).tab;
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {String}
             */
            title: {
                get: function () {
                    return this.contextManager.get('title');
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Boolean}
             */
            volatile: {
                value: !!data.volatile
            }
        });

        this.wrapperElement = document.createElement('iframe');
        this.wrapperElement.className = "wc-widget-content";
        this.wrapperElement.setAttribute('frameBorder', "0");
        this.wrapperElement.addEventListener('load', on_load.bind(this), true);

        this.meta.requirements.some(function (requirement) {
            if (requirement.type === 'feature' && requirement.name === 'FullscreenWidget') {
                this.wrapperElement.setAttribute('allowfullscreen', 'true');
                return true;
            }
        }, this);


        build_endpoints.call(this);
        build_prefs.call(this, data.preferences);

        Object.defineProperties(this, {
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Number}
             */
            layout: {
                writable: true,
                value: data.layout
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Boolean}
             */
            minimized: {
                writable: true,
                value: data.minimized
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Object}
             */
            position: {
                get: function () {
                    return utils.clone(privates.get(this).position);
                }
            },
            /**
             * @memberOf Wirecloud.Widget#
             * @type {Object}
             */
            shape: {
                get: function () {
                    return utils.clone(privates.get(this).shape);
                }
            }
        });

        var i, properties, prop_info;

        properties = this.meta.propertyList;
        this.propertyList = [];
        this.properties = {};
        this.propertyCommiter = new Wirecloud.PropertyCommiter(this);
        for (i = 0; i < properties.length; i++) {
            prop_info = data.properties[properties[i].name];
            if (prop_info != null) {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, prop_info.readonly, prop_info.value);
            } else {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, false, properties[i].default);
            }
            this.properties[properties[i].name] = this.propertyList[i];
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };

        this.contextManager = new Wirecloud.ContextManager(this, {
            'title': {
                label: utils.gettext("Title"),
                description: utils.gettext("Widget's title"),
                value: data.title
            },
            'xPosition': {
                label: utils.gettext("X-Position"),
                description: utils.gettext("Specifies the x-coordinate at which the widget is placed"),
                value: data.left
            },
            'yPosition': {
                label: utils.gettext("Y-Position"),
                description: utils.gettext("Specifies the y-coordinate at which the widget is placed"),
                value: data.top
            },
            'zPosition': {
                label: utils.gettext("Z-Position"),
                description: utils.gettext("Specifies the z-coordinate at which the widget is placed"),
                value: data.zIndex
            },
            'height': {
                label: utils.gettext("Height"),
                description: utils.gettext("Widget's height in layout cells"),
                value: data.height
            },
            'width': {
                label: utils.gettext("Width"),
                description: utils.gettext("Widget's width in layout cells"),
                value: data.width
            },
            'heightInPixels': {
                label: utils.gettext("Height in pixels (deprecated)"),
                description: utils.gettext("Widget's height in pixels"),
                value: 0
            },
            'widthInPixels': {
                label: utils.gettext("Width in pixels"),
                description: utils.gettext("Widget's width in pixels"),
                value: 0
            }
        });

        this.tab.addEventListener('preremove', privates.get(this).on_preremovetab);

        this.logManager.log(utils.gettext("Widget created successfully."), Wirecloud.constants.LOGGING.DEBUG_MSG);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Widget, se.ObjectWithEvents, /** @lends Wirecloud.Widget.prototype */{

        changeTab: function changeTab(tab) {
            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                    workspace_id: this.tab.workspace.id,
                    tab_id: this.tab.id,
                    iwidget_id: this.id
                });

                var content = {
                    tab: tab.id
                };

                if (privates.get(this).tab === tab) {
                    resolve(this);
                } else {
                    Wirecloud.io.makeRequest(url, {
                        method: 'POST',
                        requestHeaders: {'Accept': 'application/json'},
                        contentType: 'application/json',
                        postBody: JSON.stringify(content),
                        onComplete: function (response) {
                            if (response.status === 204) {
                                privates.get(this).tab = tab;
                                this.trigger('change', ['tab']);
                                resolve(this);
                            } else {
                                reject(/* TODO */);
                            }
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        fullDisconnect: function fullDisconnect() {
            var name;

            for (name in this.inputs) {
                this.inputs[name].fullDisconnect();
            }

            for (name in this.outputs) {
                this.outputs[name].fullDisconnect();
            }

            return this;
        },

        hasEndpoints: function hasEndpoints() {
            return this.meta.hasEndpoints();
        },

        hasPreferences: function hasPreferences() {
            return !!this.preferenceList.length;
        },

        is: function is(component) {
            return this.meta.type == component.meta.type && this.id == component.id;
        },

        /**
         * @param {String} name
         *
         * @returns {Boolean}
         */
        isAllowed: function isAllowed(name) {

            if (this.tab.workspace.restricted) {
                return false;
            }

            switch (name) {
            case "close":
                return this.permissions.close && this.tab.workspace.isAllowed('add_remove_iwidgets');
            case "move":
            case "resize":
                return this.permissions[name] && !this.tab.workspace.restricted && this.tab.workspace.isAllowed('edit_layout');
            case "minimize":
                return this.permissions.minimize && this.tab.workspace.isAllowed('edit_layout');
            }

            if (!(name in this.permissions)) {
                throw new TypeError("invalid name parameter");
            }

            return this.permissions[name];
        },

        /**
         * @returns {Wirecloud.Widget}
         */
        load: function load() {

            if (privates.get(this).status !== STATUS.CREATED) {
                return this;
            }

            privates.get(this).status = STATUS.LOADING;
            this.wrapperElement.contentWindow.location.replace(this.codeurl);
            this.wrapperElement.setAttribute('type', this.meta.codecontenttype);

            return this;
        },

        /**
         * @returns {Wirecloud.Widget}
         */
        reload: function reload() {
            this.wrapperElement.setAttribute('type', this.meta.codecontenttype);
            this.wrapperElement.contentWindow.location.reload();

            return this;
        },

        registerContextAPICallback: function registerContextAPICallback(scope, callback) {
            switch (scope) {
            case 'iwidget':
                this.contextManager.addCallback(callback);
                break;
            case 'mashup':
                this.tab.workspace.contextManager.addCallback(callback);
                break;
            case 'platform':
                Wirecloud.contextManager.addCallback(callback);
                break;
            default:
                throw new TypeError('invalid scope parameter');
            }

            this.callbacks[scope].push(callback);
        },

        /**
         * @param {Function} callback
         *
         * @returns {Wirecloud.Widget}
         */
        registerPrefCallback: function registerPrefCallback(callback) {
            this.prefCallback = callback;
            return this;
        },

        /**
         * @returns {Promise}
         */
        remove: function remove() {
            return new Promise(function (resolve, reject) {
                var url;

                if (this.volatile) {
                    _remove.call(this);
                    resolve(this);
                } else {
                    url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                        workspace_id: this.tab.workspace.id,
                        tab_id: this.tab.id,
                        iwidget_id: this.id
                    });

                    Wirecloud.io.makeRequest(url, {
                        method: 'DELETE',
                        requestHeaders: {'Accept': 'application/json'},
                        onComplete: function (response) {
                            if (response.status === 204) {
                                _remove.call(this);
                                resolve(this);
                            } else {
                                reject(/* TODO */);
                            }
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        /**
         * @param {String} title
         *
         * @returns {Promise}
         */
        rename: function rename(title) {
            title = clean_title.call(this, title);

            return new Promise(function (resolve, reject) {
                var content, url;

                if (this.volatile) {
                    _rename.call(this, title);
                    resolve(this);
                } else {
                    url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                        workspace_id: this.tab.workspace.id,
                        tab_id: this.tab.id,
                        iwidget_id: this.id
                    });

                    content = {
                        title: title
                    };

                    Wirecloud.io.makeRequest(url, {
                        method: 'POST',
                        requestHeaders: {'Accept': 'application/json'},
                        contentType: 'application/json',
                        postBody: JSON.stringify(content),
                        onComplete: function (response) {
                            if (response.status === 204) {
                                _rename.call(this, title);
                                resolve(this);
                            } else {
                                reject(/* TODO */);
                            }
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        setPosition: function setPosition(position) {
            utils.update(privates.get(this).position, position);
            return this;
        },

        setShape: function setShape(shape) {
            // TODO: is minimized
            utils.update(privates.get(this).shape, shape);
            return this;
        },

        /**
         * @returns {Wirecloud.Widget}
         */
        showLogs: function showLogs() {
            var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
            dialog.htmlElement.classList.add("wc-component-logs-modal");
            dialog.show();
            return this;
        },

        /**
         * @returns {Wirecloud.Widget}
         */
        showSettings: function showSettings() {
            var dialog = new Wirecloud.Widget.PreferencesWindowMenu();
            dialog.show(this);
            return this;
        },

        /**
         * @param {Wirecloud.WidgetMeta} resource
         */
        upgrade: function upgrade(resource) {

            if (!is_valid_resource.call(this, resource)) {
                throw new TypeError("invalid resource parameter");
            }

            return new Promise(function (resolve, reject) {
                var content, url;

                if (this.meta.uri === resource.uri) {
                    // From/to missing
                    change_meta.call(this, resource);
                    resolve(this);
                } else {
                    url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                        workspace_id: this.tab.workspace.id,
                        tab_id: this.tab.id,
                        iwidget_id: this.id
                    });

                    content = {
                        widget: resource.id
                    };

                    Wirecloud.io.makeRequest(url, {
                        method: 'POST',
                        requestHeaders: {'Accept': 'application/json'},
                        contentType: 'application/json',
                        postBody: JSON.stringify(content),
                        onComplete: function (response) {
                            var message;

                            if (response.status === 204) {
                                var cmp = resource.version.compareTo(privates.get(this).resource.version);

                                if (cmp > 0) { // upgrade
                                    message = utils.interpolate(utils.gettext("The %(type)s was upgraded to v%(version)s successfully."), {
                                        type: this.meta.type,
                                        version: resource.version.text
                                    });
                                    this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                                } else if (cmp < 0) { // downgrade
                                    message = utils.interpolate(utils.gettext("The %(type)s was downgraded to v%(version)s successfully."), {
                                        type: this.meta.type,
                                        version: resource.version.text
                                    });
                                    this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                                }

                                change_meta.call(this, resource);
                                resolve(this);
                            } else {
                                reject(/* TODO */);
                            }
                        }.bind(this)
                    });
                }
            }.bind(this));
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var STATUS = {
        CREATED: 0,
        LOADING: 1,
        RUNNING: 2
    };

    var build_endpoints = function build_endpoints() {
        this.inputs = {};
        this.meta.inputList.forEach(function (endpoint) {
            this.inputs[endpoint.name] = new Wirecloud.wiring.WidgetTargetEndpoint(this, endpoint);
        }, this);
        this.outputs = {};
        this.meta.outputList.forEach(function (endpoint) {
            this.outputs[endpoint.name] = new Wirecloud.wiring.WidgetSourceEndpoint(this, endpoint);
        }, this);
    };

    var build_prefs = function build_prefs(initial_values) {
        var preference_name, operator_pref_info;

        this.preferenceList = [];
        this.preferences = {};

        for (preference_name in initial_values) {
            operator_pref_info = initial_values[preference_name];
            this.preferences[preference_name] = new Wirecloud.UserPref(this.meta.preferences[preference_name], operator_pref_info.readonly, operator_pref_info.hidden, operator_pref_info.value);
        }

        this.meta.preferenceList.forEach(function (preference) {
            if (!(preference.name in this.preferences)) {
                this.preferences[preference.name] = new Wirecloud.UserPref(preference, false, false, preference.default);
            }

            this.preferenceList.push(this.preferences[preference.name]);
        }, this);
    };

    var _remove = function _remove() {
        /*jshint validthis:true */
        this.fullDisconnect();

        if (this.loaded) {
            on_unload.call(this);
        }

        this.trigger('remove');
    };

    var change_meta = function change_meta(resource) {
        privates.get(this).resource = resource;
        build_endpoints.call(this);
        build_prefs.call(this, this.preferences);

        if (this.loaded) {
            on_unload.call(this);
            this.load();
        }

        this.trigger('change', ['meta']);
    };

    var _rename = function _rename(title) {
        /*jshint validthis:true */
        this.contextManager.modify({
            title: title
        });
        this.trigger('change', ['title']);
    };

    var clean_title = function clean_title(title) {
        /*jshint validthis:true */
        if (typeof title !== 'string' || !title.trim().length) {
            throw new TypeError("invalid title parameter");
        }

        return title.trim();
    };

    var is_valid_resource = function is_valid_resource(resource) {
        /*jshint validthis:true */
        return resource instanceof Wirecloud.WidgetMeta && resource.group_id === this.meta.group_id;
    };

    var remove_context_callbacks = function remove_context_callbacks() {
        var i;

        for (i = 0; i < this.callbacks.iwidget.length; i += 1) {
            this.contextManager.removeCallback(this.callbacks.iwidget[i]);
        }

        for (i = 0; i < this.callbacks.mashup.length; i += 1) {
            this.tab.workspace.contextManager.removeCallback(this.callbacks.mashup[i]);
        }

        for (i = 0; i < this.callbacks.platform.length; i += 1) {
            Wirecloud.contextManager.removeCallback(this.callbacks.platform[i]);
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };
    };

    var send_pending_event = function send_pending_event(pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_preremovetab = function on_preremovetab(tab) {
        _remove.call(this);
        tab.removeEventListener('preremove', privates.get(this).on_preremovetab);
    };

    var on_load = function on_load() {

        if (this.wrapperElement.contentWindow.location.href !== this.codeurl) {
            return;
        }

        privates.get(this).status = STATUS.RUNNING;
        this.wrapperElement.contentDocument.defaultView.addEventListener('unload', on_unload.bind(this), true);

        if (this.missing) {
            this.logManager.log(utils.gettext("Failed to load widget."), {
                level: Wirecloud.constants.LOGGING.ERROR_MSG,
                details: new se.Fragment(utils.gettext("<p>This widget is currently not available. You or an administrator probably uninstalled it.</p><h5>Suggestions:</h5><ul><li>Remove this widget from the dashboard</li><li>Reinstall the appropiated version of the widget</li><li>Or install another version of the widget and then use the <em>Upgrade/Downgrade</em> option</li></ul>"))
            });
        } else {
            this.logManager.log(utils.gettext("Widget loaded successfully."), {
                level: Wirecloud.constants.LOGGING.INFO_MSG
            });
        }

        this.trigger('load');

        this.pending_events.forEach(send_pending_event, this);
        this.pending_events = [];
    };

    var on_unload = function on_unload() {

        if (!this.loaded) {
            return;
        }

        privates.get(this).status = STATUS.CREATED;
        this.prefCallback = null;

        remove_context_callbacks.call(this);
        this.propertyCommiter.commit();

        for (var name in this.inputs) {
            this.inputs[name].callback = null;
        }

        this.logManager.log(utils.gettext("Widget unloaded successfully."), {
            level: Wirecloud.constants.LOGGING.INFO_MSG
        });
        this.logManager.newCycle();

        this.trigger('unload');
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
