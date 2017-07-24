/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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
    var PersistentVariableDef = function PersistentVariableDef(options) {

        if (options == null || typeof options !== "object") {
            throw new TypeError('Invalid options parameter');
        }

        if (options.default != null && typeof options.default !== "string") {
            throw new TypeError('Invalid default option');
        }

        Object.defineProperties(this, {
            name: {value: options.name},
            type: {value: options.type},
            label: {value: options.label},
            description: {value: options.description},
            multiuser: {value: options.multiuser},
            secure: {value: options.secure},
            options: {value: options},
            default: {value: options.default}
        });
    };

    Wirecloud.PersistentVariableDef = PersistentVariableDef;

})();
