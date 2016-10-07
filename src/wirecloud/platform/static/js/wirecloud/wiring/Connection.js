/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

        constructor: function Connection(wiring, source, target, options) {
            this.superClass(['detach', 'establish', 'remove']);
            this.established = false;

            options = utils.merge({
                readonly: false
            }, options);

            Object.defineProperties(this, {
                id: {
                    get: function get() {return this.source.id + "//" + this.target.id;}
                },
                logManager: {value: new ns.ConnectionLogManager(this, wiring)},
                readonly: {
                    value: options.readonly
                },
                source: {value: source, writable: true},
                target: {value: target, writable: true},
                volatile: {value: source.component.volatile || target.component.volatile},
                wiring: {
                    value: wiring
                }
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
                var message = utils.gettext("The connection ('%(source)s'-'%(target)s') was established.");

                this.established = true;
                this.logManager.log(utils.interpolate(message, this), Wirecloud.constants.LOGGING.INFO_MSG);

                return this.dispatchEvent('establish');
            },

            _disconnect: function _disconnect() {
                var message = utils.gettext("The connection ('%(source)s'-'%(target)s') was detached.");

                this.established = false;
                this.logManager.log(utils.interpolate(message, this), Wirecloud.constants.LOGGING.INFO_MSG);

                return this.dispatchEvent('detach');
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
                    var message = utils.gettext("The connection ('%(source)s'-'%(target)s') has a missing endpoint.");
                    this.logManager.log(utils.interpolate(message, this), Wirecloud.constants.LOGGING.ERROR_MSG);
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
                } else /* if (endpoint instanceof Wirecloud.wiring.TargetEndpoint) */ {
                    this.target = endpoint;
                }

                return this.establish();
            },

            remove: function remove() {
                this.detach();
                return this.dispatchEvent('remove');
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

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
