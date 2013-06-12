/*
 *     (C) Copyright 2012-2013 Universidad Politécnica de Madrid
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
        var vendor, name, version, uri, display_name, description, inputs,
            outputs, prefList, prefs, pref, i;

        // Vendor
        if (!('vendor' in desc) || desc.vendor.trim() === '') {
            throw new TypeError(gettext('missing operator vendor'));
        }
        vendor = desc.vendor.trim();
        Object.defineProperty(this, 'vendor', {value: vendor});

        // Name
        if (!('name' in desc) || desc.name.trim() === '') {
            throw new TypeError(gettext('missing operator name'));
        }
        name = desc.name.trim();
        Object.defineProperty(this, 'name', {value: name});

        // Version
        if (!('version' in desc) || desc.version.trim() === '') {
            throw new TypeError(gettext('missing operator version'));
        }
        version = desc.version.trim();
        Object.defineProperty(this, 'version', {value: version});

        // URI
        uri = desc.name.trim();
        Object.defineProperty(this, 'uri', {value: vendor + '/' + name + '/' + version});

        if (!('display_name' in desc) || desc.display_name.trim() === '') {
            display_name = name;
        } else {
            display_name = desc.display_name;
        }
        Object.defineProperty(this, 'display_name', {value: display_name});

        description = desc.description;
        if (description == null || description.trim() === '') {
            description = '';
        }
        Object.defineProperty(this, 'description', {value: description});

        prefList = desc.preferences;
        if (!Array.isArray(prefList)) {
            prefList = [];
        }
        prefs = {};
        for (i = 0; i < prefList.length; i += 1) {
            pref = prefList[i] = new Wirecloud.wiring.OperatorUserPref(prefList[i]);
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

    OperatorMeta.prototype.instantiate = function instantiate(id, operator_status /*TODO*/, wiringEditor) {
        return new Wirecloud.Operator(this, id, operator_status /* TODO */, wiringEditor);
    };

    Wirecloud.wiring.OperatorMeta = OperatorMeta;
})();
