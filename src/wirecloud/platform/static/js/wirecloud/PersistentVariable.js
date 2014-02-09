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

    var PersistentVariable = function PersistentVariable(def, id, readonly, currentValue) {
        Object.defineProperty(this, 'meta', {value: def});
        Object.defineProperty(this, 'id', {value: id});
        Object.defineProperty(this, 'readnOnly', {value: readonly});
        this.value = currentValue;
    };

    PersistentVariable.prototype.get = function get() {
        return this.value;
    };

    PersistentVariable.prototype.set = function set(new_value) {
        var varManager = Wirecloud.activeWorkspace.varManager;

        this.value = new_value;
        varManager.markVariablesAsModified([this]);
        if (this.meta.secure === true) {
            varManager.forceCommit();
            this.value = '';
        }

        varManager.commitModifiedVariables();
    };

    Wirecloud.PersistentVariable = PersistentVariable;

})();
