/*global gettext, interpolate, UserPref, Wirecloud*/

(function () {

    "use strict";

    var Widget = function Widget(data) {

        var i, preference;

        this.vendor = data.vendor;
        this.name = data.name;
        this.version = new Wirecloud.Version(data.version, 'showcase');
        this.uri = this.vendor + '/' + this.name + '/' + this.version.text;
        this.id = this.uri;

        this.display_name = data.display_name;
        this.code_url = Wirecloud.URLs.WIDGET_CODE_ENTRY.evaluate({
            vendor: this.vendor,
            name: this.name,
            version: this.version.text
        });
        this.code_content_type = data.code_content_type;

        // Preferences
        this.preferences = {};
        this.preferenceList = [];
        for (i = 0; i < data.preferences.length; i++) {
            preference = new UserPref(data.preferences[i].name, data.preferences[i].type, data.preferences[i]);
            this.preferences[preference.varName] = preference;
            this.preferenceList.push(preference);
        }

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

        this.default_width = data.widget_width;
        this.default_height = data.widget_height;

        /* FIXME */
        this.getUriWiki = function getUriWiki() { return data.doc_uri; };
        this.getImage = function getImage() { return data.image_uri; };
        this.getIcon = function getIcon() { return data.iphone_image_uri !== '' ? data.iphone_image_uri : data.image_uri; };
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

        this.variables = {};

        var varname, variable;

        for (i = 0; i < data.wiring.inputs.length; i += 1) {
            this.variables[data.wiring.inputs[i].name] = data.wiring.inputs[i];
            this.variables[data.wiring.inputs[i].name].aspect = 'SLOT';
        }

        for (i = 0; i < data.wiring.outputs.length; i += 1) {
            this.variables[data.wiring.outputs[i].name] = data.wiring.outputs[i];
            this.variables[data.wiring.outputs[i].name].aspect = 'EVEN';
        }

        for (i = 0; i < data.preferences.length; i += 1) {
            this.variables[data.preferences[i].name] = data.preferences[i];
            this.variables[data.preferences[i].name].aspect = 'PREF';
        }

        for (i = 0; i < data.properties.length; i += 1) {
            this.variables[data.properties[i].name] = data.properties[i];
            this.variables[data.properties[i].name].aspect = 'PROP';
        }

        for (i = 0; i < data.context.length; i += 1) {
            this.variables[data.context[i].name] = data.context[i];
        }

        for (varname in this.variables) {
            variable = this.variables[varname];
            if (typeof variable.label === 'undefined' || variable.label === null || variable.label === '') {
                variable.label = variable.name;
            }
        }
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
