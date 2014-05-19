/*
 *     Copyright 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var MashableApplicationComponent = function MashableApplicationComponent(desc) {
        var vendor, name, version, uri, title, description, changelog;

        // Vendor
        if (!('vendor' in desc) || desc.vendor.trim() === '') {
            throw new TypeError(gettext('missing vendor'));
        }
        vendor = desc.vendor.trim();
        Object.defineProperty(this, 'vendor', {value: vendor});

        // Name
        if (!('name' in desc) || desc.name.trim() === '') {
            throw new TypeError(gettext('missing name'));
        }
        name = desc.name.trim();
        Object.defineProperty(this, 'name', {value: name});

        // Version
        if (!('version' in desc) || desc.version.trim() === '') {
            throw new TypeError(gettext('missing version'));
        }
        version = new Wirecloud.Version(desc.version.trim());
        Object.defineProperty(this, 'version', {value: version});

        // URI
        uri = desc.name.trim();
        Object.defineProperty(this, 'uri', {value: vendor + '/' + name + '/' + version.text});

        // Type
        if (typeof desc.type !== 'string') {
            throw new TypeError(gettext('missing type'));
        }
        Object.defineProperty(this, 'type', {value: desc.type});

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
    };

    Wirecloud.MashableApplicationComponent = MashableApplicationComponent;

})();
