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

        data = utils.merge({}, ns.Operator.JSON_TEMPLATE, data);

        this.pending_events = [];
        this.prefCallback = null;

        this.permissions = utils.merge({
            'close': true,
            'configure': true,
            'rename': true,
            'upgrade': true
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
                    if ('key' in this.wiring.workspace) {
                        url += "&workspaceview=" + encodeURIComponent(this.wiring.workspace.key);
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
                    return this.meta.title;
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
        name: "",
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
            return !!this.preferenceList.length;
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

            return this.permissions[name];
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
            return new Promise(function (resolve, reject) {
                this.fullDisconnect();

                if (this.loaded) {
                    on_unload.call(this);
                }

                this.dispatchEvent('remove');
                resolve(this);
            }.bind(this));
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

            if (!is_valid_meta.call(this, meta)) {
                throw new TypeError("invalid meta parameter");
            }

            return new Promise(function (resolve, reject) {
                var message;

                if (this.meta.uri === meta.uri) {
                    // From/to missing
                    change_meta.call(this, meta);
                    resolve(this);
                } else {
                    switch (meta.version.compareTo(privates.get(this).meta.version)) {
                    case 1: // upgrade
                        message = utils.interpolate(utils.gettext("The %(type)s was upgraded to v%(version)s successfully."), {
                            type: this.meta.type,
                            version: meta.version.text
                        });
                        this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                        break;
                    case -1: // downgrade
                        message = utils.interpolate(utils.gettext("The %(type)s was downgraded to v%(version)s successfully."), {
                            type: this.meta.type,
                            version: meta.version.text
                        });
                        this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                        break;
                    }

                    change_meta.call(this, meta);
                    resolve(this);
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
            this.inputs[endpoint.name] = new Wirecloud.wiring.OperatorTargetEndpoint(this, endpoint);
        }, this);
        this.outputs = {};
        this.meta.outputList.forEach(function (endpoint) {
            this.outputs[endpoint.name] = new Wirecloud.wiring.OperatorSourceEndpoint(this, endpoint);
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

    var build_props = function build_props(initial_values) {
        if (initial_values == null) {
            initial_values = {};
        }

        var properties = this.meta.propertyList;
        this.propertyList = [];
        this.properties = {};
        this.propertyCommiter = new Wirecloud.PropertyCommiter(this);
        properties.forEach((property, index) => {
            var prop_info = initial_values[property.name];

            if (prop_info != null) {
                this.propertyList[index] = new Wirecloud.PersistentVariable(property, this.propertyCommiter, prop_info.readonly, prop_info.value);
            } else {
                this.propertyList[index] = new Wirecloud.PersistentVariable(property, this.propertyCommiter, false, property.default);
            }
            this.properties[property.name] = this.propertyList[index];
        });
    }

    var send_pending_event = function send_pending_event(pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    var is_valid_meta = function is_valid_meta(meta) {
        return meta instanceof Wirecloud.wiring.OperatorMeta && meta.group_id === this.meta.group_id;
    };

    var change_meta = function change_meta(meta) {
        var old_value = privates.get(this).meta;
        privates.get(this).meta = meta;
        build_endpoints.call(this);
        build_prefs.call(this, this.preferences);
        build_props.call(this, this.properties);

        if (this.loaded) {
            on_unload.call(this);
            this.load();
        }

        this.dispatchEvent('change', ['meta'], {meta: old_value});
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
