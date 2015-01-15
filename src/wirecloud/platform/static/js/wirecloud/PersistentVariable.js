/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var PersistentVariable = function PersistentVariable(def, commiter, readonly, currentValue) {
        Object.defineProperty(this, 'meta', {value: def});
        Object.defineProperty(this, 'readnOnly', {value: readonly});
        Object.defineProperty(this, 'commiter', {value: commiter});
        this.value = currentValue;
    };

    PersistentVariable.prototype.get = function get() {
        return this.value;
    };

    PersistentVariable.prototype.set = function set(new_value) {
        if (this.readOnly) {
            throw new Error('Read only properties cannot be modified');
        }

        this.value = new_value;
        this.commiter.add(this.meta.name, this.value);
    };

    Wirecloud.PersistentVariable = PersistentVariable;

})();
