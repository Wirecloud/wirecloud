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
    var UserPrefDef = function UserPrefDef(options) {

        if (options == null || typeof options !== "object") {
            throw new TypeError('Invalid options parameter');
        }

        if (options.default != null && typeof options.default !== "string") {
            throw new TypeError('Invalid default option');
        }

        if (options.type === 'list') {
            options.type = 'select';
        }

        Object.defineProperties(this, {
            name: {value: options.name},
            type: {value: options.type},
            label: {value: options.label},
            description: {value: options.description},
            required: {value: options.required},
            options: {value: options.options}
        });

        var default_value = '';
        if (options.type === 'boolean') {
            default_value = options.default.trim().toLowerCase() === 'true';
        } else if (options.type === 'number' && options.default != null) {
            default_value = Number(options.default);
        } else if (options.default != null) {
            default_value = options.default;
        }
        Object.defineProperty(this, 'default', {value: default_value});
    };

    Wirecloud.UserPrefDef = UserPrefDef;

})();
