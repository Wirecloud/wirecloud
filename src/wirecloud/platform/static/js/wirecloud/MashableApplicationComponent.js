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

    ns.MashableApplicationComponent = utils.defineClass({

        constructor: function MashableApplicationComponent(desc) {
            var vendor, name, version, title, description, changelog, i, inputs, outputs, preference;

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

            // Basic info
            Object.defineProperties(this, {
                missing: {value: !!desc.missing},
                vendor: {value: vendor},
                name: {value: name},
                version: {value: version},
                uri: {value: vendor + '/' + name + '/' + version.text},
                group_id: {value: vendor + '/' + name}
            });

            // Type
            if (typeof desc.type !== 'string') {
                throw new TypeError(utils.gettext('missing type'));
            }
            Object.defineProperty(this, 'type', {value: desc.type});

            // Image
            Object.defineProperty(this, 'image', {value: desc.image});

            // Doc
            Object.defineProperty(this, 'doc', {value: desc.doc});

            // Change log url
            if (!('changelog' in desc) || desc.changelog.trim() === '') {
                changelog = '';
            } else {
                changelog = desc.changelog;
            }
            Object.defineProperty(this, 'changelog', {value: changelog});

            if (!('title' in desc) || desc.title.trim() === '') {
                title = name;
            } else {
                title = desc.title;
            }
            Object.defineProperty(this, 'title', {value: title});

            description = desc.description;
            if (description == null || description.trim() === '') {
                description = '';
            }
            Object.defineProperty(this, 'description', {value: description});

            // Base URL
            Object.defineProperty(this, 'base_url', {
                value: location.origin + Wirecloud.URLs.MAC_BASE_URL.evaluate({
                    vendor: this.vendor,
                    name: this.name,
                    version: this.version.text,
                    file_path: ''
                })
            });

            // Preferences
            this.preferences = {};
            this.preferenceList = [];
            for (i = 0; i < desc.preferences.length; i++) {
                preference = new Wirecloud.UserPrefDef(desc.preferences[i].name, desc.preferences[i].type, desc.preferences[i]);
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
        },

        members: {

            is: function is(other) {
                return other != null && this.type == other.type && this.uri == other.uri;
            },

            hasEndpoints: function hasEndpoints() {
                return (this.inputList.length + this.outputList.length) > 0;
            }

        }
    });

})(Wirecloud, Wirecloud.Utils);
