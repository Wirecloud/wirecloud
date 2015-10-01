/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Operator.
     * @extends {ObjectWithEvents}
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {PlainObject} meta
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     * @param {PlainObject} [businessInfo]
     *      [TODO: description]
     */
    ns.Operator = utils.defineClass({

        constructor: function Operator(id, meta, wiringEngine, businessInfo) {
            var preferenceList = [], preferences = {};

            this.superClass(['load', 'remove', 'unload']);

            businessInfo = utils.merge(ns.Operator.JSON_TEMPLATE, businessInfo);

            this.loaded = false;
            this.pending_events = [];

            this.permissions = Wirecloud.Utils.merge({
                'close': true,
                'configure': true,
                'rename': true
            }, businessInfo.permissions);

            meta.preferenceList.forEach(function (option) {
                var hidden = false, readonly = false, value;

                if (option.name in businessInfo.preferences) {
                    hidden = businessInfo.preferences[option.name].hidden;
                    readonly = businessInfo.preferences[option.name].readonly;
                    value = businessInfo.preferences[option.name].value;
                } else {
                    value = option.default;
                }

                preferences[option.name] = new Wirecloud.UserPref(option, readonly, hidden, value);
                preferenceList.push(preferences[option.name]);
            }, this);

            Object.defineProperties(this, {
                id: {value: id},
                logManager: {value: new Wirecloud.wiring.OperatorLogManager(this, wiringEngine)},
                meta: {value: meta},
                missing: {value: false},
                preferenceList: {value: Object.freeze(preferenceList)},
                preferences: {value: Object.freeze(preferences)},
                title: {value: meta.title}, // TODO: businessInfo.title ? businessInfo.title : meta.title
                volatile: {value: businessInfo.volatile},
                wiring: {value: wiringEngine} // TODO: remove this property.
            });

            this.inputs = {};
            meta.inputList.forEach(function (endpoint) {
                this.inputs[endpoint.name] = new Wirecloud.wiring.OperatorTargetEndpoint(this, endpoint);
            }, this);

            this.outputs = {};
            meta.outputList.forEach(function (endpoint) {
                this.outputs[endpoint.name] = new Wirecloud.wiring.OperatorSourceEndpoint(this, endpoint);
            }, this);
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

            /**
             * [TODO: hasSettings description]
             *
             * @returns {Operator}
             *      The instance on which the member is called.
             */
            hasSettings: function hasSettings() {
                return this.preferenceList.length > 0;
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
             * @returns {Operator}
             *      The instance on which the member is called.
             */
            load: function load() {
                var operatorURL;

                if (this.loaded || this.loading) {
                    return this;
                }

                operatorURL = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({
                    vendor: this.meta.vendor,
                    name: this.meta.name,
                    version: this.meta.version.text
                });

                this.loading = true;

                this.wrapperElement = document.createElement('iframe');
                this.wrapperElement.className = "ioperator";

                this.wrapperElement.setAttribute('type', "text/html");
                this.wrapperElement.setAttribute('src', operatorURL + "#id=" + this.id);

                this.wrapperElement.addEventListener('load', operator_onload.bind(this), true);
                this.wrapperElement.addEventListener('unload', operator_onunload.bind(this), true);

                document.getElementById('workspace').appendChild(this.wrapperElement);

                return this;
            },

            /**
             * [TODO: registerPrefCallback description]
             *
             * @param {[type]} prefCallback [description]
             * @returns {Operator}
             *      The instance on which the member is called.
             */
            registerPrefCallback: function registerPrefCallback(prefCallback) {

                this.prefCallback = prefCallback;

                return this;
            },

            /**
             * [TODO: remove description]
             *
             * @returns {Operator}
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
             * @returns {Operator}
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
             * @returns {Operator}
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
             * @returns {PlainObject}
             *      [TODO: description]
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

    var send_pending_event = function (pendingEvent) {
        this.inputs[pendingEvent.endpoint].propagate(pendingEvent.value);
    };

    var operator_onload = function operator_onload() {

        delete this.loading;

        this.loaded = true;
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
