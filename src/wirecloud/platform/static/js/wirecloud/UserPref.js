/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    /**
     * @author aarranz
     */
    var UserPref = function UserPref(meta, readonly, hidden, currentValue) {
        if (meta == null || !(meta instanceof Wirecloud.UserPrefDef)) {
            throw new TypeError("invalid meta parameter");
        }

        Object.defineProperties(this, {
            meta: {value: meta},
            readonly: {value: !!readonly},
            hidden: {value: !!hidden}
        });

        if (meta.type === 'boolean' && typeof currentValue === 'string') {
            this.value = currentValue.trim().toLowerCase() === 'true';
        } else if (meta.type === 'number' && typeof currentValue === 'string') {
            this.value = Number(currentValue);
        } else {
            this.value = currentValue;
        }
    };

    UserPref.prototype.getInterfaceDescription = function getInterfaceDescription() {
        var type = this.meta.type;

        var desc = {
            type: type,
            label: this.meta.label,
            description: this.meta.description,
            defaultValue: this.meta.default,
            initiallyDisabled: this.readonly,
            initialValue: this.value,
            required: this.meta.required
        };

        if (type === 'select') {
            desc.initialEntries = this.meta.options;
            desc.required = true;
        }

        return desc;
    };

    Wirecloud.UserPref = UserPref;

})();
