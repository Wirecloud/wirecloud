/*
 *     Copyright (c) CoNWeT Lab., 2012-2014 Universidad Politécnica de Madrid
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

/*globals gettext, Wirecloud*/

(function () {

    "use strict";

    var OperatorMeta = function OperatorMeta(desc) {
        var inputs, outputs, prefList, prefs, pref, i;

        Wirecloud.MashableApplicationComponent.call(this, desc);

        prefList = desc.preferences;
        if (!Array.isArray(prefList)) {
            prefList = [];
        }
        prefs = {};
        for (i = 0; i < prefList.length; i += 1) {
            pref = prefList[i] = new Wirecloud.UserPrefDef(prefList[i].name, prefList[i].type, prefList[i]);
            prefs[pref.name] = pref;
        }
        Object.defineProperty(this, 'preferences', {value: prefs});
        Object.defineProperty(this, 'preferenceList', {value: prefList});

        inputs = desc.wiring.inputs;
        if (inputs == null) {
            inputs = {};
        }
        Object.defineProperty(this, 'inputs', {value: inputs});

        outputs = desc.wiring.outputs;
        if (outputs == null) {
            outputs = {};
        }
        Object.defineProperty(this, 'outputs', {value: outputs});
    };

    OperatorMeta.prototype.instantiate = function instantiate(id, operator_status, wiring) {
        return new Wirecloud.Operator(this, id, operator_status, wiring);
    };

    Wirecloud.wiring.OperatorMeta = OperatorMeta;
})();
