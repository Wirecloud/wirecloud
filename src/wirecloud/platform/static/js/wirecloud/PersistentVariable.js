/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns) {

    "use strict";

    const privates = new WeakMap();

    const property_value_get = function property_value_get() {
        return privates.get(this);
    };

    ns.PersistentVariable = class PersistentVariable {

        constructor(meta, commiter, readonly, value) {
            if (meta == null || !(meta instanceof Wirecloud.PersistentVariableDef)) {
                throw new TypeError("invalid meta parameter");
            }

            Object.defineProperties(this, {
                meta: {value: meta},
                readonly: {value: readonly},
                commiter: {value: commiter},
                value: {get: property_value_get}
            });

            privates.set(this, value);
        }

        get() {
            return this.value;
        }

        set(new_value) {
            if (this.readonly) {
                throw new Error('Read only properties cannot be modified');
            }

            privates.set(this, new_value);
            this.commiter.add(this.meta.name, new_value);
        }
    }

})(Wirecloud);
