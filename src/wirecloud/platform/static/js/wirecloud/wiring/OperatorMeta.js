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
    ns.OperatorMeta = function OperatorMeta(description) {

        if (description.type !== 'operator') {
            throw new TypeError('Invalid operator description');
        }

        Wirecloud.MashableApplicationComponent.call(this, description);

        // Properties
        this.properties = {};
        this.propertyList = [];
        for (var i = 0; i < description.properties.length; i++) {
            var property = new Wirecloud.PersistentVariableDef(description.properties[i]);
            this.properties[property.name] = property;
            this.propertyList.push(property);
        }
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
    };

    utils.inherit(ns.OperatorMeta, Wirecloud.MashableApplicationComponent);

})(Wirecloud.wiring, Wirecloud.Utils);
