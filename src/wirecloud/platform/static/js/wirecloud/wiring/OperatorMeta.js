/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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
     * @param {Object} desc metadata information of the Operator
     */
    ns.OperatorMeta = class OperatorMeta extends Wirecloud.MashableApplicationComponent {

        constructor(desc) {
            if (desc.type == null) {
                desc.type = 'operator';
            } else if (desc.type !== 'operator') {
                throw new TypeError(utils.interpolate('Invalid component type for a operator: %(type)s.', {type: desc.type}));
            }

            super(desc);

            // Properties
            this.properties = {};
            this.propertyList = [];
            desc.properties.forEach((property_info) => {
                const property = new Wirecloud.PersistentVariableDef(property_info);
                this.properties[property.name] = property;
                this.propertyList.push(property);
            });
            Object.freeze(this.properties);
            Object.freeze(this.propertyList);

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
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
