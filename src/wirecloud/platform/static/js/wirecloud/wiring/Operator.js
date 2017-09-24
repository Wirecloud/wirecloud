/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * @name Wirecloud.wiring.Operator
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Wirecloud.Wiring} wiring
     * @param {Wirecloud.OperatorMeta} meta
     * @param {Object} data
     */
    ns.Operator = function Operator(wiring, meta, data) {
        se.ObjectWithEvents.call(this, [
            'change',
            'load',
            'remove',
            'unload'
        ]);

        if (data == null) {
            throw new TypeError("invalid data parameter");
        }

        data = utils.merge({}, ns.Operator.JSON_TEMPLATE, {
            title: meta.title
        }, data);

        this.pending_events = [];
        this.prefCallback = null;

        this.permissions = utils.merge({
            close: true,
            configure: true,
            rename: true,
            upgrade: true
        }, data.permissions);

        privates.set(this, {
            meta: meta,
            status: STATUS.CREATED
        });

        Object.defineProperties(this, {
            /**
             * URL pointing to the html view of this operator.
             *
             * @memberOf Wirecloud.wiring.Operator#
             * @type {String}
             */
            codeurl: {
                get: function () {
                    var url = this.meta.codeurl + "#id=" + encodeURIComponent(this.id);
                    if ('workspaceview' in this.wiring.workspace) {
                        url += "&workspaceview=" + encodeURIComponent(this.wiring.workspace.workspaceview);
                    }
                    return url;
                }
            },
            /**
             * Id of this operator.
             *
             * @memberOf Wirecloud.wiring.Operator#
             * @type {String}
             */
            id: {
                value: data.id
            },
            /**
             * `true` if the operator has been loaded.
             *
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Boolean}
             */
            loaded: {
                get: function () {
                    return privates.get(this).status === STATUS.RUNNING;
                }
            },
            /**
             * Log manager for this operator.
             *
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Wirecloud.LogManager}
             */
            logManager: {
                value: new Wirecloud.LogManager(wiring.logManager)
            },
            /**
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Wirecloud.wiring.OperatorMeta}
             */
            meta: {
                get: function () {
                    return privates.get(this).meta;
                }
            },
            /**
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Boolean}
             */
            missing: {
                get: function () {
                    return this.meta.missing;
                }
            },
            /**
             * @memberOf Wirecloud.wiring.Operator#
             * @type {String}
             */
            title: {
                get: function () {
                    return this.contextManager.get('title');
                }
            },
            /**
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Boolean}
             */
            volatile: {
                value: !!data.volatile
            },
            /**
             * @memberOf Wirecloud.wiring.Operator#
             * @type {Wirecloud.Wiring}
             */
            wiring: {
                value: wiring
            }
        });

        this.contextManager = new Wirecloud.ContextManager(this, {
            'title': {
                label: utils.gettext("Title"),
                description: utils.gettext("Widget's title"),
                value: data.title
            }
        });

        this.wrapperElement = document.createElement('iframe');
        this.wrapperElement.className = "wc-operator wc-operator-content";
        this.wrapperElement.setAttribute('type', "application/xhtml+xml");
        this.wrapperElement.addEventListener('load', on_load.bind(this), true);

        build_endpoints.call(this);
        build_prefs.call(this, data.preferences);
        build_props.call(this, data.properties);

        this.logManager.log(utils.gettext("Operator created successfully."), Wirecloud.constants.LOGGING.DEBUG_MSG);
    };

    ns.Operator.JSON_TEMPLATE = {
        id: "",
        preferences: {},
        properties: {},
        volatile: false
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Operator, se.ObjectWithEvents, /** @lends Wirecloud.wiring.Operator.prototype */{

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
            return this.meta.hasPreferences();
        },

        is: function is(component) {
            return this.meta.type === component.meta.type && this.id === component.id;
        },

        /**
         * @param {String} name
         *
         * @returns {Boolean}
         */
        isAllowed: function isAllowed(name) {

            if (!(name in this.permissions)) {
                throw new TypeError("invalid name parameter");
            }

            if (!this.volatile) {
                switch (name) {
                case "close":
                    return this.permissions.close && this.wiring.workspace.isAllowed('edit_wiring');
                default:
                    return !this.wiring.workspace.restricted && this.permissions[name];
                }
            } else {
                return this.permissions[name];
            }
        },

        /**
         * @returns {Wirecloud.wiring.Operator}
         */
        load: function load() {

            if (privates.get(this).status !== STATUS.CREATED) {
                return this;
            }

            privates.get(this).status = STATUS.LOADING;
            this.wrapperElement.setAttribute('src', this.codeurl);

            return this;
        },

        /**
         * @param {Function} callback
         */
        registerPrefCallback: function registerPrefCallback(callback) {
            this.prefCallback = callback;
            return this;
        },

        /**
         * @returns {Promise}
         */
        remove: function remove() {
            this.fullDisconnect();

            if (this.loaded) {
                on_unload.call(this);
            }

            this.dispatchEvent('remove');
            return Promise.resolve(this);
        },

        /**
         * @returns {Wirecloud.wiring.Operator}
         */
        showLogs: function showLogs() {
            var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager, {
                title: utils.interpolate(utils.gettext("%(operator_title)s's logs"), {
                    operator_title: this.title
                })
            });
            dialog.htmlElement.classList.add("wc-component-logs-modal");
            dialog.show();
            return this;
        },

        /**
         * @returns {Wirecloud.wiring.Operator}
         */
        showSettings: function showSettings() {
            var dialog = new Wirecloud.ui.OperatorPreferencesWindowMenu();
            dialog.show(this);
            return this;
        },

        /**
         * @returns {Object}
         */
        toJSON: function toJSON() {
            var name, preferences = {}, properties = {};

            for (name in this.preferences) {
                preferences[name] = {
                    hidden: this.preferences[name].hidden,
                    readonly: this.preferences[name].readonly,
                    value: this.preferences[name].value
                };
            }

            for (name in this.properties) {
                properties[name] = {
                    hidden: this.properties[name].hidden,
                    readonly: this.properties[name].readonly,
                    value: this.properties[name].value
                };
            }

            return {
                id: this.id,
                name: this.meta.uri,
                preferences: preferences,
                properties: properties
            };
        },

        /**
         * Upgrade/downgrade this operator.
         *
         * @param {Wirecloud.wiring.OperatorMeta} meta
         */
        upgrade: function upgrade(meta) {
            var message;

            if (!is_valid_meta.call(this, meta)) {
                throw new TypeError("invalid meta parameter");
            }

            if (this.meta.uri === meta.uri) {
                // From/to missing
                return change_meta.call(this, meta);
            } else {
                var cmp = meta.version.compareTo(privates.get(this).meta.version);

                if (cmp > 0) { // upgrade
                    message = utils.gettext("The %(type)s was upgraded to v%(version)s successfully.");
                } else if (cmp < 0) { // downgrade
                    message = utils.gettext("The %(type)s was downgraded to v%(version)s successfully.");
                } else { // same version
                    // From/to a -dev version
                    message = utils.gettext("The %(type)s was replaced using v%(version)s successfully.");
                }
                message = utils.interpolate(message, {
                    type: this.meta.type,
                    version: meta.version.text
                });
                return change_meta.call(this, meta).then(() => {
                    this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                });
            }
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
            this.inputs[endpoint.name] = new Wirecloud.wiring.OperatorTargetEndpoint(this, endpoint);
        }, this);
        this.outputs = {};
        this.meta.outputList.forEach(function (endpoint) {
            this.outputs[endpoint.name] = new Wirecloud.wiring.OperatorSourceEndpoint(this, endpoint);
        }, this);
    };

    var build_prefs = function build_prefs(initial_values) {
        this.preferenceList = [];
        this.preferences = {};

        // Build preferences with default values
        this.meta.preferenceList.forEach((preference) => {
            if (preference.name in initial_values) {
                // Use the settings from persistence
                var pref_data = initial_values[preference.name];
                this.preferences[preference.name] = new Wirecloud.UserPref(preference, pref_data.readonly, pref_data.hidden, pref_data.value);
            } else {
                // Use the default settings for this preference
                this.preferences[preference.name] = new Wirecloud.UserPref(preference, false, false, preference.default);
            }

            this.preferenceList.push(this.preferences[preference.name]);
        });
    };

    var build_props = function build_props(initial_values) {
        this.propertyList = [];
        this.properties = {};
        this.propertyCommiter = new Wirecloud.PropertyCommiter(this);
        this.meta.propertyList.forEach((property) => {
            if (property.name in initial_values) {
                // Use the settings from persistence
                var prop_data = initial_values[property.name];
                this.properties[property.name] = new Wirecloud.PersistentVariable(property, this.propertyCommiter, prop_data.readonly, prop_data.value);
            } else {
                // Use the default settings for this property
                this.properties[property.name] = new Wirecloud.PersistentVariable(property, this.propertyCommiter, false, property.default);
            }

            this.propertyList.push(this.properties[property.name]);
        });
    }

    var send_pending_event = function send_pending_event(pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    var is_valid_meta = function is_valid_meta(meta) {
        return meta instanceof Wirecloud.wiring.OperatorMeta && meta.group_id === this.meta.group_id;
    };

    var change_meta = function change_meta(meta) {
        var sync_values;

        var old_value = privates.get(this).meta;
        privates.get(this).meta = meta;

        if (!meta.missing) {
            sync_values = Wirecloud.io.makeRequest(Wirecloud.URLs.OPERATOR_VARIABLES_ENTRY.evaluate({
                workspace_id: this.wiring.workspace.id,
                operator_id: this.id
            }), {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
            }).then((response) => {
                if (response.status !== 200) {
                    return Promise.reject("Unexpected response from server");
                }
                try {
                    return JSON.parse(response.responseText);
                } catch (e) {
                    return Promise.reject("Unexpected response from server");
                }
            });
        } else {
            sync_values = Promise.resolve({preferences: {}, properties: {}});
        }

        return sync_values.then((values) => {

            build_endpoints.call(this);
            build_prefs.call(this, values.preferences);
            build_props.call(this, values.properties);

            if (this.loaded) {
                on_unload.call(this);
                this.load();
            }

            this.dispatchEvent('change', ['meta'], {meta: old_value});
        });
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_load = function on_load() {

        if (!this.wrapperElement.hasAttribute('src')) {
            return;
        }

        privates.get(this).status = STATUS.RUNNING;
        this.wrapperElement.contentDocument.defaultView.addEventListener('unload', on_unload.bind(this), true);

        if (this.missing) {
            this.logManager.log(utils.gettext("Failed to load operator."), {
                level: Wirecloud.constants.LOGGING.ERROR_MSG,
                details: new se.Fragment(utils.gettext("<p>This operator is currently not available. You or an administrator probably uninstalled it.</p><h5>Suggestions:</h5><ul><li>Remove the operator.</li><li>Reinstall the same version of the operator.</li><li>Or install another version of the operator and then use the <em>Upgrade/Downgrade</em> option.</li></ul>"))
            });
        } else {
            this.logManager.log(utils.gettext("Operator loaded successfully."), {
                level: Wirecloud.constants.LOGGING.INFO_MSG
            });
        }

        this.dispatchEvent('load');

        this.pending_events.forEach(send_pending_event, this);
        this.pending_events = [];
    };

    var on_unload = function on_unload() {

        if (!this.loaded) {
            return;
        }

        privates.get(this).status = STATUS.CREATED;
        this.prefCallback = null;

        for (var name in this.inputs) {
            this.inputs[name].callback = null;
        }

        this.logManager.log(utils.gettext("Operator unloaded successfully."), {
            level: Wirecloud.constants.LOGGING.INFO_MSG
        });
        this.logManager.newCycle();

        this.dispatchEvent('unload');
    };

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
