/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * @name Wirecloud.Wiring.Operator
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Wirecloud.Wiring} wiring
     * @param {Wirecloud.OperatorMeta} resource
     * @param {Object} data
     */
    ns.Operator = function Operator(wiring, resource, data) {
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

        _private.set(this, {
            resource: resource,
            status: STATUS.CREATED
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
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {String}
             */
            id: {
                value: data.id
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {Boolean}
             */
            loaded: {
                get: function () {
                    return _private.get(this).status === STATUS.RUNNING;
                }
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {Wirecloud.LogManager}
             */
            logManager: {
                value: new Wirecloud.wiring.OperatorLogManager(this, wiring)
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {Wirecloud.Wiring.OperatorMeta}
             */
            meta: {
                get: function () {
                    return _private.get(this).resource;
                }
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {Boolean}
             */
            missing: {
                get: function () {
                    return this.meta.missing;
                }
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {String}
             */
            title: {
                get: function () {
                    return this.meta.title;
                }
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
             * @type {Boolean}
             */
            volatile: {
                value: !!data.volatile
            },
            /**
             * @memberOf Wirecloud.Wiring.Operator#
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

        this.logManager.log(utils.gettext("Operator created successfully."), Wirecloud.constants.LOGGING.DEBUG_MSG);
    };

    ns.Operator.JSON_TEMPLATE = {
        id: "",
        name: "",
        preferences: {},
        volatile: false
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Operator, se.ObjectWithEvents, /** @lends Wirecloud.Wiring.Operator.prototype */{

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

            if (!(name in this.permissions)) {
                throw new TypeError("invalid name parameter");
            }

            return this.permissions[name];
        },

        /**
         * @returns {Wirecloud.Wiring.Operator}
         */
        load: function load() {

            if (_private.get(this).status !== STATUS.CREATED) {
                return this;
            }

            _private.get(this).status = STATUS.LOADING;
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

                this.trigger('remove');
                resolve(this);
            }.bind(this));
        },

        /**
         * @returns {Wirecloud.Wiring.Operator}
         */
        showLogs: function showLogs() {
            var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
            dialog.htmlElement.classList.add("wc-component-logs-modal");
            dialog.show();
            return this;
        },

        /**
         * @returns {Wirecloud.Wiring.Operator}
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
            var name, preferences = {};

            for (name in this.preferences) {
                preferences[name] = {
                    hidden: this.preferences[name].hidden,
                    readonly: this.preferences[name].readonly,
                    value: this.preferences[name].value
                };
            }

            return {
                id: this.id,
                name: this.meta.uri,
                preferences: preferences
            };
        },

        /**
         * @param {Wirecloud.Wiring.OperatorMeta} resource
         */
        upgrade: function upgrade(resource) {

            if (!is_valid_resource.call(this, resource)) {
                throw new TypeError("invalid resource parameter");
            }

            return new Promise(function (resolve, reject) {
                var message;

                if (this.meta.uri === resource.uri) {
                    // From/to missing
                    change_meta.call(this, resource);
                    resolve(this);
                } else {
                    switch (resource.version.compareTo(_private.get(this).resource.version)) {
                    case 1: // upgrade
                        message = utils.interpolate(utils.gettext("The %(type)s was upgraded to v%(version)s successfully."), {
                            type: this.meta.type,
                            version: resource.version.text
                        });
                        this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                        break;
                    case -1: // downgrade
                        message = utils.interpolate(utils.gettext("The %(type)s was downgraded to v%(version)s successfully."), {
                            type: this.meta.type,
                            version: resource.version.text
                        });
                        this.logManager.log(message, Wirecloud.constants.LOGGING.INFO_MSG);
                        break;
                    }

                    change_meta.call(this, resource);
                    resolve(this);
                }
            }.bind(this));
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var _private = new WeakMap();

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

    var send_pending_event = function send_pending_event(pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    var is_valid_resource = function is_valid_resource(resource) {
        /*jshint validthis:true */
        return resource instanceof Wirecloud.wiring.OperatorMeta && resource.group_id === this.meta.group_id;
    };

    var change_meta = function change_meta(resource) {
        _private.get(this).resource = resource;
        build_endpoints.call(this);
        build_prefs.call(this, this.preferences);

        if (this.loaded) {
            on_unload.call(this);
            this.load();
        }

        this.trigger('change', ['meta']);
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_load = function on_load() {

        if (!this.wrapperElement.hasAttribute('src')) {
            return;
        }

        _private.get(this).status = STATUS.RUNNING;
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

        this.trigger('load');

        this.pending_events.forEach(send_pending_event, this);
        this.pending_events = [];
    };

    var on_unload = function on_unload() {

        if (!this.loaded) {
            return;
        }

        _private.get(this).status = STATUS.CREATED;
        this.prefCallback = null;

        for (var name in this.inputs) {
            this.inputs[name].callback = null;
        }

        this.logManager.log(utils.gettext("Operator unloaded successfully."), {
            level: Wirecloud.constants.LOGGING.INFO_MSG
        });
        this.logManager.newCycle();

        this.trigger('unload');
    };

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
