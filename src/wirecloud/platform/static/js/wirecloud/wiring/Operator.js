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

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Operator.
     *
     * @extends StyledElements.ObjectWithEvents
     * @name Wirecloud.wiring.Operator
     *
     * @constructor
     * @param {Number} id id of the operator
     * @param {Wirecloud.wiring.OperatorMeta} meta OperatorMeta used by this operator
     * @param {Wirecloud.Wiring} wiringEngine Wiring Engine associated with this operator
     * @param {Object} [businessInfo] operator info from persistence
     */
    ns.Operator = utils.defineClass({

        constructor: function Operator(id, meta, wiringEngine, businessInfo) {
            var upgrade, get_meta, set_meta;

            if (!(meta instanceof Wirecloud.wiring.OperatorMeta)) {
                throw new TypeError('meta must be an instance of Wirecloud.wiring.OperatorMeta');
            }

            if (!(wiringEngine instanceof Wirecloud.Wiring)) {
                throw new TypeError('wiringEngine must be an instance of Wirecloud.Wiring');
            }

            this.superClass(['load', 'remove', 'unload', 'upgraded', 'upgradeerror']);

            businessInfo = utils.merge(ns.Operator.JSON_TEMPLATE, businessInfo);

            this.loading = false;
            this.loaded = false;
            this.pending_events = [];

            this.permissions = Wirecloud.Utils.merge({
                'close': true,
                'configure': true,
                'rename': true,
                'upgrade': true
            }, businessInfo.permissions);

            upgrade = function upgrade(new_meta) {
                meta = new_meta;
                build_endpoints.call(this);
                build_prefs.call(this, this.preferences);
                this.trigger('upgraded', new_meta);
                if (this.loaded) {
                    this.loading = true;
                    this.wrapperElement.src = this.meta.codeurl + "#id=" + this.id;
                }
            };

            get_meta = function get_meta() {return meta;};
            set_meta = function set_meta(new_meta) {
                if (!(new_meta instanceof Wirecloud.wiring.OperatorMeta)) {
                    throw new TypeError();
                }

                if (meta.uri !== new_meta.uri) {
                    this.persist.call(this,
                        {operator: new_meta.id},
                        upgrade.bind(this, new_meta),
                        function (error) {
                            this.events.upgradeerror.dispatch(error);
                        }.bind(this)
                    );
                } else if (meta !== new_meta) {
                    upgrade.call(this, new_meta);
                }
            };

            Object.defineProperties(this, {
                id: {value: id},
                logManager: {value: new Wirecloud.wiring.OperatorLogManager(this, wiringEngine)},
                meta: {
                    get: get_meta,
                    set: set_meta
                },
                missing: {get: function () {return this.meta.missing;}},
                title: {get: function () {return this.meta.title}},
                volatile: {value: businessInfo.volatile},
                wiring: {value: wiringEngine}
            });

            build_endpoints.call(this);
            build_prefs.call(this, businessInfo.preferences);

            this.logManager.log(utils.gettext("The operator was created successfully."), Wirecloud.constants.LOGGING.INFO_MSG);
        },

        inherit: se.ObjectWithEvents,

        statics: {

            JSON_TEMPLATE: {
                id: null,
                name: "",
                preferences: {},
                volatile: false
            }

        },

        members: {

            persist: function persist(changes, onSuccess, onFailure) {
                onSuccess();
            },

            /**
             * [TODO: destroy description]
             *
             * @returns {Operator}
             *      The instance on which the member is called.
             */
            destroy: function destroy() {
                this.fullDisconnect();

                if (this.loaded) {
                    this.trigger('unload');
                }

                if (this.wrapperElement.parentNode) {
                    this.wrapperElement.parentNode.removeChild(this.wrapperElement);
                }

                return this;
            },

            /**
             * [TODO: fullDisconnect description]
             *
             * @returns {Operator}
             *      The instance on which the member is called.
             */
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

            is: function is(component) {
                return this.meta.type == component.meta.type && this.id == component.id;
            },

            /**
             * Returns whether an user can carry out a given action over this
             * operator
             *
             * @returns {Boolean}
             *      true if the user is able to do the queried action
             */
            isAllowed: function isAllowed(action) {
                if (action in this.permissions) {
                    return this.permissions[action];
                } else {
                    return false;
                }
            },

            /**
             * [TODO: load description]
             *
             * @returns {Wirecloud.wiring.Operator}
             *      The instance on which the member is called.
             */
            load: function load() {

                if (this.loaded || this.loading) {
                    return this;
                }

                this.loading = true;

                this.wrapperElement = document.createElement('iframe');
                this.wrapperElement.className = "ioperator";

                this.wrapperElement.setAttribute('type', "application/xhtml+xml");
                this.wrapperElement.setAttribute('src', this.meta.codeurl + "#id=" + this.id);

                this.wrapperElement.addEventListener('load', operator_onload.bind(this), true);

                document.getElementById('workspace').appendChild(this.wrapperElement);

                return this;
            },

            /**
             * [TODO: registerPrefCallback description]
             *
             * @param {[type]} prefCallback [description]
             * @returns {Wirecloud.wiring.Operator}
             *      The instance on which the member is called.
             */
            registerPrefCallback: function registerPrefCallback(prefCallback) {

                this.prefCallback = prefCallback;

                return this;
            },

            /**
             * [TODO: remove description]
             *
             * @returns {Wirecloud.wiring.Operator}
             *      The instance on which the member is called.
             */
            remove: function remove() {
                this.destroy();
                this.trigger('remove');

                return this;
            },

            /**
             * [TODO: showLogs description]
             *
             * @returns {Wirecloud.wiring.Operator}
             *      The instance on which the member is called.
             */
            showLogs: function showLogs() {
                var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
                dialog.htmlElement.classList.add("wc-component-logs-dialog");
                dialog.show();

                return this;
            },

            /**
             * [TODO: showSettings description]
             *
             * @returns {Wirecloud.wiring.Operator}
             *      The instance on which the member is called.
             */
            showSettings: function showSettings() {
                var dialog = new Wirecloud.ui.OperatorPreferencesWindowMenu();
                dialog.show(this);

                return this;
            },

            /**
             * [TODO: toJSON description]
             *
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

                return JSON.parse(JSON.stringify({
                    id: this.id,
                    name: this.meta.uri,
                    preferences: preferences
                }));
            }
        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

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

    var send_pending_event = function (pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    var operator_onload = function operator_onload() {

        this.loading = false;
        this.loaded = true;

        this.wrapperElement.contentDocument.defaultView.addEventListener('unload', operator_onunload.bind(this), true);

        this.pending_events.forEach(send_pending_event, this);
        this.pending_events = [];

        var msg = utils.interpolate(utils.gettext("The operator (%(title)s) was loaded."), this);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);
        this.trigger('load');
    };

    var operator_onunload = function operator_onunload() {

        this.loaded = false;

        var msg = utils.interpolate(utils.gettext("The operator (%(title)s) was unloaded."), this);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);
        this.trigger('unload');
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
