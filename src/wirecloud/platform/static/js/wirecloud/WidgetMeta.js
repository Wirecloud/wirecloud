/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2021 Future Internet Consulting and Development Solutions S.L.
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

    ns.WidgetMeta = class WidgetMeta extends Wirecloud.MashableApplicationComponent {

        constructor(desc) {
            if (desc.type == null) {
                desc.type = 'widget';
            } else if (desc.type !== 'widget') {
                throw new TypeError(utils.interpolate('Invalid component type for a widget: %(type)s.', {type: desc.type}));
            }

            super(desc);

            if (this.missing) {
                this.codeurl = (new URL(Wirecloud.URLs.MISSING_WIDGET_CODE_ENTRY, Wirecloud.location.base)).href + '?lang=' + Wirecloud.contextManager.get('language');
                this.codecontenttype = "application/xhtml+xml";
            } else {
                this.codeurl = desc.contents.src;
                this.codecontenttype = desc.contents.contenttype || "application/xhtml+xml";
            }
            if (this.codeurl.indexOf('?') === -1) {
                this.codeurl += '?';
            } else {
                this.codeurl += '&';
            }
            this.codeurl += "entrypoint=true&v=" + Wirecloud.contextManager.get('version_hash') + "&theme=" + Wirecloud.contextManager.get('theme');

            // Properties
            this.properties = {};
            this.propertyList = [];
            desc.properties.forEach((property_info) => {
                const property = new Wirecloud.PersistentVariableDef(property_info);
                this.properties[property.name] = property;
                this.propertyList.push(property);
            });
            Object.freeze(this.properties);
            Object.freeze(this.propertyList);

            Object.defineProperties(this, {
                "default_width": {value: desc.widget_width},
                "default_height": {value: desc.widget_height},
            });

            Object.freeze(this);
        }

        getInfoString() {
            const transObj = {vendor: this.vendor, name: this.name, version: this.version};
            const msg = utils.gettext("[Widget; Vendor: %(vendor)s, Name: %(name)s, Version: %(version)s]");
            return utils.interpolate(msg, transObj, true);
        }

    }

})(Wirecloud, Wirecloud.Utils);
