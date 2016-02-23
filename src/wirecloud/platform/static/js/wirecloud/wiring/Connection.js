/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Connection.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {Boolean} readonly
     *      [TODO: description]
     * @param {SourceEndpoint} source
     *      [TODO: description]
     * @param {TargetEndpoint} target
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     */
    ns.Connection = utils.defineClass({

        constructor: function Connection(readonly, source, target, wiringEngine) {
            this.superClass(['detach', 'establish']);
            this.established = false;

            Object.defineProperties(this, {
                id : {
                    get: function get() {return this.source.id + "//" + this.target.id;}
                },
                logManager: {value: new ns.ConnectionLogManager(this, wiringEngine)},
                readonly: {value: readonly},
                source: {value: source, writable: true},
                target: {value: target, writable: true},
                volatile: {value: source.component.volatile || target.component.volatile}
            });
        },

        inherit: se.ObjectWithEvents,

        statics: {

            JSON_TEMPLATE: {
                readonly: false,
                source: {
                    type: "",
                    id: null,
                    endpoint: ""
                },
                target: {
                    type: "",
                    id: null,
                    endpoint: ""
                }
            }

        },

        members: {

            _connect: function _connect() {

                this.established = true;
                this.registerLog('info', utils.gettext("The connection ('%(source)s'-'%(target)s') was established."));

                return this.trigger('establish');
            },

            _disconnect: function _disconnect() {

                this.established = false;
                this.registerLog('info', utils.gettext("The connection ('%(source)s'-'%(target)s') was detached."));

                return this.trigger('detach');
            },

            detach: function detach() {

                if (!this.established) {
                    return this;
                }

                this.source.disconnect(this.target);
                this.established = false;

                return this;
            },

            equals: function equals(connection) {
                return connection instanceof ns.Connection && this.id === connection.id;
            },

            establish: function establish() {

                if (this.source.missing || this.target.missing) {
                    this.registerLog('error', utils.gettext("The connection ('%(source)s'-'%(target)s') has a missing endpoint."));
                    return this;
                }

                if (this.established) {
                    return this;
                }

                this.source.connect(this.target, this);
                this.established = true;

                return this;
            },

            updateEndpoint: function updateEndpoint(endpoint) {

                if (!(endpoint instanceof Wirecloud.wiring.Endpoint)) {
                    throw new TypeError("endpoint must be a Wirecloud.wiring.Endpoint instance");
                }

                this.detach();
                this.logManager.newCycle();

                if (endpoint instanceof Wirecloud.wiring.SourceEndpoint) {
                    this.source = endpoint;
                } else if (endpoint instanceof Wirecloud.wiring.TargetEndpoint) {
                    this.target = endpoint;
                }

                return this.establish();
            },

            /**
             * [TODO: registerLog description]
             *
             * @param {String} level
             *      [TODO: description]
             * @param {String} message
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            registerLog: function registerLog(level, message) {
                var levelNumber;

                switch (level) {
                case 'error':
                    levelNumber = Wirecloud.constants.LOGGING.ERROR_MSG;
                    break;
                case 'info':
                    levelNumber = Wirecloud.constants.LOGGING.INFO_MSG;
                    break;
                case 'warning':
                    levelNumber = Wirecloud.constants.LOGGING.WARN_MSG;
                    break;
                }

                this.logManager.log(utils.interpolate(message, this), levelNumber);

                return this;
            },

            showLogs: function showLogs() {
                var modal = new Wirecloud.ui.LogWindowMenu(this.logManager);
                    modal.show();

                return this;
            },

            toJSON: function toJSON() {
                return JSON.parse(JSON.stringify({
                    readonly: this.readonly,
                    source: this.source,
                    target: this.target
                }));
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
