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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class MissingOperator.
     * @extends {MissingComponent}
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     * @param {PlainObject} businessInfo
     *      [TODO: description]
     * @param {String} reason
     *      [TODO: description]
     */
    ns.MissingOperator = utils.defineClass({

        constructor: function MissingOperator(id, wiringEngine, businessInfo, reason) {
            this.superClass(id, 'operator', wiringEngine, reason);
            this.loadBusinessInfo(businessInfo);
            Object.defineProperties(this, {
                reason: {value: utils.interpolate(reason, {id: this.id, uri: this.meta.uri})},
            });
            this.logManager.log(this.reason, Wirecloud.constants.LOGGING.ERROR_MSG);
        },

        inherit: ns.MissingComponent,

        statics: {
            DEFAULT_PERMISSIONS: {
                'close': true,
                'configure': true,
                'rename': true
            }
        },

        members: {

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

                return {
                    id: this.id,
                    name: this.meta.uri,
                    preferences: preferences
                };
            }

        }

    });

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
