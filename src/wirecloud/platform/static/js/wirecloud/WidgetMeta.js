/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.WidgetMeta = utils.defineClass({

        constructor: function WidgetMeta(data) {

            var i, property;

            if (data.type == null) {
                data.type = 'widget';
            } else if (data.type !== 'widget') {
                throw new TypeError(utils.interpolate('Invalid component type for a widget: %(type)s.', {type: data.type}));
            }

            this.superClass(data);

            if (this.missing) {
                this.codeurl = Wirecloud.URLs.MISSING_WIDGET_CODE_ENTRY;
                this.codecontenttype = "application/xhtml+xml";
            } else {
                this.codeurl = Wirecloud.URLs.WIDGET_CODE_ENTRY.evaluate({
                    vendor: this.vendor,
                    name: this.name,
                    version: this.version.text
                });
                this.codecontenttype = data.contents.contenttype;
            }
            this.codeurl += "?v=" + Wirecloud.contextManager.get('version_hash') + "&theme=" + Wirecloud.contextManager.get('theme');

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

            Object.defineProperties(this, {
                "id": {value: this.uri},
                "default_width": {value: data.widget_width},
                "default_height": {value: data.widget_height},
            });

            /* FIXME */
            this.getIcon = function getIcon() { return data.smartphoneimage !== '' ? data.smartphoneimage : data.image; };
            this.getIPhoneImageURI = this.getIcon;
            /* END FIXME */

            Object.freeze(this);
        },

        inherit: Wirecloud.MashableApplicationComponent,

        members: {

            getInfoString: function getInfoString() {
                var transObj = {vendor: this.vendor, name: this.name, version: this.version};
                var msg = gettext("[Widget; Vendor: %(vendor)s, Name: %(name)s, Version: %(version)s]");
                return utils.interpolate(msg, transObj, true);
            },

            /**
             * Create a new instance of this WidgetMeta.
             *
             * @param {?Object} [options] options used for creating the instance
             * @returns {Wirecloud.WidgetMeta} The instance on which this method is called.
             */
            instantiate: function instantiate(options) {
                Wirecloud.activeWorkspace.addInstance(this, options);
                return this;
            }

        }
    });

})(Wirecloud, Wirecloud.Utils);
