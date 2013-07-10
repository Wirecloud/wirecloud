/*global gettext, interpolate, WidgetTemplate, Wirecloud*/

(function () {

    "use strict";

    var Widget = function Widget(data) {

        this.vendor = data.vendor;
        this.name = data.name;
        this.version = new Wirecloud.Version(data.version, 'showcase');
        this.id = this.vendor + '/' + this.name + '/' + this.version.text;

        this.displayName = data.display_name;
        this.code_url = Wirecloud.URLs.WIDGET_CODE_ENTRY.evaluate({
            vendor: this.vendor,
            name: this.name,
            version: this.version.text
        });
        this.code_content_type = data.code_content_typ;

        this.inputs = data.wiring.inputs;
        if (this.inputs == null) {
            this.inputs = {};
        }

        this.outputs = data.wiring.outputs;
        if (this.outputs == null) {
            this.outputs = {};
        }

        this.default_width = data.widget_width;
        this.default_height = data.widget_height;

        /* FIXME */
        var template = new WidgetTemplate(data);
        this.getTemplate = function getTemplate() { return template };
        this.getUriWiki = function getUriWiki() { return data.uriWiki; };
        this.getImage = function getImage() { return data.imageURI; };
        this.getIcon = function getIcon() { return data.iPhoneImageURI !== '' ? data.iPhoneImageURI : data.imageURI; };
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
