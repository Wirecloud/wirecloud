/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns, utils) {

    "use strict";

    ns.MashableApplicationComponent = function MashableApplicationComponent(desc) {
        var vendor, name, version, i, inputs, outputs, preference;

        // Vendor
        if (!('vendor' in desc) || desc.vendor.trim() === '') {
            throw new TypeError(utils.gettext('missing vendor'));
        }
        vendor = desc.vendor.trim();

        // Name
        if (!('name' in desc) || desc.name.trim() === '') {
            throw new TypeError(utils.gettext('missing name'));
        }
        name = desc.name.trim();

        // Version
        if (!('version' in desc) || desc.version.trim() === '') {
            throw new TypeError(utils.gettext('missing version'));
        }
        version = new Wirecloud.Version(desc.version.trim());

        // Type
        if (typeof desc.type !== 'string') {
            throw new TypeError(utils.gettext('missing type'));
        }

        // Basic info
        Object.defineProperties(this, {
            missing: {value: !!desc.missing},
            vendor: {value: vendor},
            name: {value: name},
            version: {value: version},
            uri: {value: vendor + '/' + name + '/' + version.text},
            group_id: {value: vendor + '/' + name},
            type: {value: desc.type},
            image: {value: desc.image},
            description: {
                value: desc.description != null ? desc.description.trim() : ''
            },
            doc: {
                value: desc.doc != null ? desc.doc.trim() : ''
            },
            changelog: {
                value: desc.changelog != null ? desc.changelog.trim() : ''
            },
            title: {
                value: desc.title == null || desc.title.trim() === '' ? name : desc.title
            },
            base_url: {
                value: location.origin + Wirecloud.URLs.MAC_BASE_URL.evaluate({
                    vendor: vendor,
                    name: name,
                    version: version.text,
                    file_path: ''
                })
            }
        });

        // Preferences
        this.preferences = {};
        this.preferenceList = [];
        for (i = 0; i < desc.preferences.length; i++) {
            preference = new Wirecloud.UserPrefDef(desc.preferences[i]);
            this.preferences[preference.name] = preference;
            this.preferenceList.push(preference);
        }
        Object.freeze(this.preferences);
        Object.freeze(this.preferenceList);

        // Requirements
        this.requirements = desc.requirements;
        Object.freeze(this.requirements);

        // Inputs
        if (desc.wiring.inputs == null) {
            desc.wiring.inputs = [];
        }
        Object.defineProperty(this, 'inputList', {value: desc.wiring.inputs});
        inputs = {};
        for (i = 0; i < this.inputList.length; i++) {
            inputs[this.inputList[i].name] = this.inputList[i];
        }
        Object.defineProperty(this, 'inputs', {value: inputs});

        // Outputs
        if (desc.wiring.outputs == null) {
            desc.wiring.outputs = [];
        }
        Object.defineProperty(this, 'outputList', {value: desc.wiring.outputs});
        outputs = {};
        for (i = 0; i < this.outputList.length; i++) {
            outputs[this.outputList[i].name] = this.outputList[i];
        }
        Object.defineProperty(this, 'outputs', {value: outputs});
    };

    ns.MashableApplicationComponent.prototype = {

        hasEndpoints: function hasEndpoints() {
            return (this.inputList.length + this.outputList.length) > 0;
        },

        hasPreferences: function hasPreferences() {
            return this.preferenceList.length > 0;
        },

        is: function is(other) {
            return other != null && this.type == other.type && this.uri == other.uri;
        }

    };

})(Wirecloud, Wirecloud.Utils);
