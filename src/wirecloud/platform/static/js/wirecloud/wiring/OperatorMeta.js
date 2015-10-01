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

/* global Wirecloud */

(function (ns) {

    "use strict";

    /**
     * Create a new instance of class OperatorMeta.
     * @extends {MashableApplicationComponent}
     *
     * @constructor
     * @param {PlainObject} description
     *      [TODO: description]
     */
    ns.OperatorMeta = function OperatorMeta(description) {

        if (description.type !== 'operator') {
            throw new TypeError('Invalid operator description');
        }

        Wirecloud.MashableApplicationComponent.call(this, description);
        Object.freeze(this);
    };

    /**
     * [TODO: instantiate description]
     *
     * @param {Number} operatorId
     *      [TODO: description]
     * @param {StyledElement} targetView
     *      [TODO: description]
     * @param {PlainObject} [businessInfo]
     *      [TODO: description]
     * @returns {Operator}
     *      [TODO: description]
     */
    ns.OperatorMeta.prototype.instantiate = function instantiate(operatorId, targetView, businessInfo) {
        return new Wirecloud.Operator(operatorId, this, targetView, businessInfo);
    };

    /**
     * [TODO: hasEndpoints description]
     *
     * @returns {Boolean}
     *      [TODO: description]
     */
    ns.OperatorMeta.prototype.hasEndpoints = function hasEndpoints() {
        return (this.inputList.length + this.outputList.length) > 0;
    };

})(Wirecloud.wiring);
