/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Wirecloud*/

(function () {

    "use strict";

    var Widget = function Widget(data) {

        var i, preference, property;

        Wirecloud.MashableApplicationComponent.call(this, data);

        this.id = this.uri;

        this.code_url = Wirecloud.URLs.WIDGET_CODE_ENTRY.evaluate({
            vendor: this.vendor,
            name: this.name,
            version: this.version.text
        }) + "?v=" + Wirecloud.contextManager.get('version_hash');
        this.code_content_type = data.code_content_type;
        this.doc = data.doc;

        // Preferences
        this.preferences = {};
        this.preferenceList = [];
        for (i = 0; i < data.preferences.length; i++) {
            preference = new Wirecloud.UserPrefDef(data.preferences[i].name, data.preferences[i].type, data.preferences[i]);
            this.preferences[preference.name] = preference;
            this.preferenceList.push(preference);
        }
        Object.freeze(this.preferences);
        Object.freeze(this.preferenceList);

        // Properties
        this.properties = {}
        this.propertyList = [];
        for (i = 0; i < data.properties.length; i++) {
            property = new Wirecloud.PersistentVariableDef(data.properties[i].name, data.properties[i].type, data.properties[i]);
            this.properties[property.name] = property;
            this.propertyList.push(property);
        }
        Object.freeze(this.properties);
        Object.freeze(this.propertyList);

        // Inputs
        this.inputList = data.wiring.inputs;
        this.inputs = {};
        for (i = 0; i < this.inputList.length; i++) {
            this.inputs[this.inputList[i].name] = this.inputList[i];
        }

        // Outputs
        this.outputList = data.wiring.outputs;
        this.outputs = {};
        for (i = 0; i < this.outputList.length; i++) {
            this.outputs[this.outputList[i].name] = this.outputList[i];
        }

        this.image = data.image;
        this.default_width = data.widget_width;
        this.default_height = data.widget_height;

        /* FIXME */
        this.getIcon = function getIcon() { return data.smartphoneimage !== '' ? data.smartphoneimage : data.image; };
        this.getIPhoneImageURI = this.getIcon;

        var lastVersion = this.version;
        var showcaseLastVersion = this.version;
        var catalogueLastVersion = null;
        var upToDate = true;

        this.getLastVersion = function getLastVersion() {
            if (lastVersion == null) {
                if (catalogueLastVersion == null || showcaseLastVersion.compareTo(catalogueLastVersion) >= 0) {
                    lastVersion = showcaseLastVersion;
                } else {
                    lastVersion = catalogueLastVersion;
                }
            }
            return lastVersion;
        };

        this.setLastVersion = function setLastVersion(v) {
            var oldVersion = this.getLastVersion();

            if (v.source === 'showcase') {
                showcaseLastVersion = v;
            } else {
                catalogueLastVersion = v;
            }
            lastVersion = null;

            var newVersion = this.getLastVersion();
            upToDate = this.version.compareTo(newVersion) === 0;

            return oldVersion.compareTo(newVersion) !== 0;
        };

        this.isUpToDate = function isUpToDate() { return upToDate; };
        /* END FIXME */

        Object.freeze(this);
    };

    Widget.prototype.getInfoString = function getInfoString() {
        var transObj = {vendor: this.vendor, name: this.name, version: this.version};
        var msg = gettext("[WidgetVendor: %(vendor)s, WidgetName: %(name)s, WidgetVersion: %(version)s]");
        return interpolate(msg, transObj, true);
    };

    Wirecloud.Widget = Widget;

})();
