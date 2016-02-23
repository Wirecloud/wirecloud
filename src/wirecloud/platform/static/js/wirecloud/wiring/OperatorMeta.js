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

/* globals Wirecloud */

(function (ns, utils) {

    "use strict";

    /**
     * Create a new instance of class OperatorMeta.
     *
     * @constructor
     * @extends Wirecloud.MashableApplicationComponent
     * @name Wirecloud.wiring.OperatorMeta
     *
     * @param {Object} description metadata information of the Operator
     */
    ns.OperatorMeta = utils.defineClass({

        constructor: function OperatorMeta(description) {

            if (description.type !== 'operator') {
                throw new TypeError('Invalid operator description');
            }

            this.superClass(description);

            if (this.missing) {
                this.codeurl = Wirecloud.URLs.MISSING_WIDGET_CODE_ENTRY;
            } else {
                this.codeurl = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({
                    vendor: this.vendor,
                    name: this.name,
                    version: this.version.text
                });
            }
            this.codeurl += "?v=" + Wirecloud.contextManager.get('version_hash');

            Object.freeze(this);
        },

        inherit: Wirecloud.MashableApplicationComponent,

        members: {

            /**
             * Creates a new instance of this Operator
             *
             * @param {Number} operatorId id for the operator
             * @param {Wiring} wiringEngine wiring engine that is going to manage the new operator instance
             * @param {PlainObject} [businessInfo] business info for the instance
             * @returns {Wirecloud.wiring.Operator} a new operator instance
             */
            instantiate: function instantiate(operatorId, wiringEngine, businessInfo) {
                return new Wirecloud.Operator(operatorId, this, wiringEngine, businessInfo);
            }
        }

    });

})(Wirecloud.wiring, Wirecloud.Utils);
