/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
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

/*global EzWebExt, Wirecloud*/

(function () {

    "use strict";

    var OperatorUserPref = function UserPref(options) {
        Object.defineProperty(this, 'name', {value: options.name});
        Object.defineProperty(this, 'type', {value: options.type});
        Object.defineProperty(this, 'label', {value: options.label});
        Object.defineProperty(this, 'description', {value: options.description});
        Object.defineProperty(this, 'options', {value: options});

        if (options.default_value == null) {
            Object.defineProperty(this, 'default_value', {value: ''});
        } else {
            Object.defineProperty(this, 'default_value', {value: options.default_value});
        }
    };

    OperatorUserPref.prototype.getInterfaceDescription = function getInterfaceDescription(ioperator) {
        var preference = ioperator.meta.preferences[this.name];

        var desc = EzWebExt.merge(this.options, {
            'initiallyDisabled': preference.readonly,
            'initialValue': preference.value,
            'required': false
        });

        if (this.type === 'select') {
            desc.initialEntries = this.options.value_options;
            desc.required = true;
        }

        return desc;
    };

    Wirecloud.wiring.OperatorUserPref = OperatorUserPref;

})();
