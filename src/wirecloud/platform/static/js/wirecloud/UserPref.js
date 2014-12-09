/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    /**
     * @author aarranz
     */
    var UserPref = function UserPref(pref_def, readOnly, hidden, currentValue) {
        Object.defineProperty(this, 'meta', {value: pref_def});
        Object.defineProperty(this, 'readOnly', {value: !!readOnly});
        Object.defineProperty(this, 'hidden', {value: !!hidden});

        if (pref_def.type === 'boolean' && typeof currentValue === 'string') {
            this.value = currentValue.trim().toLowerCase() === 'true';
        } else if (pref_def.type === 'number' && typeof currentValue === 'string') {
            this.value = Number(currentValue);
        } else {
            this.value = currentValue;
        }
    };

    UserPref.prototype.getInterfaceDescription = function getInterfaceDescription() {
        var desc, type;

        type = this.meta.type;
        if (type === 'list') {
            type = 'select';
        }

        desc = Wirecloud.Utils.merge(this.meta.options, {
            'type': type,
            'defaultValue': this.meta.default,
            'initiallyDisabled': this.readOnly,
            'initialValue': this.value,
            'required': false
        });

        if (type === 'select') {
            desc.initialEntries = this.meta.options.options;
            desc.required = true;
        }

        return desc;
    };

    Wirecloud.UserPref = UserPref;

})();
