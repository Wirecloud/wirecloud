/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    var ResourceDetails = function ResourceDetails(data, catalogue) {

        ///////////////////////
        // PRIVATE VARIABLES
        ///////////////////////
        var currentVersion = null,
            allVersions = [],
            data_by_version = {};

        //////////////////////////
        // GETTERS
        /////////////////////////
        this.getLastVersion = function () {
            return allVersions[0];
        };

        this.getAllVersions = function () {
            return allVersions;
        };

        this.isAllow = function isAllow(action) {

            switch (action) {
            case 'uninstall':
            case 'uninstall-all':
                return currentVersion.permissions.uninstall;
            case 'delete':
            case 'delete-all':
                return currentVersion.permissions.delete;
            }
        };

        Object.defineProperties(this, {
            'catalogue': {value: catalogue},
            'vendor': {value: data.vendor},
            'name': {value: data.name},
            'version': {
                get: function () {
                    return currentVersion.version;
                }
            },
            'authors': {
                get: function () {
                    return currentVersion.authors;
                }
            },
            'contributors': {
                get: function () {
                    return currentVersion.contributors;
                }
            },
            'uri': {
                get: function () { return [this.vendor, this.name, currentVersion.version.text].join('/'); }
            },
            'type': {value: data.type},
            'image': {
                get: function () { return currentVersion.image; }
            },
            'description_url': {
                get: function () { return currentVersion.uriTemplate; }
            },
            'description': {
                get: function () { return currentVersion.description; }
            },
            'longdescription': {
                get: function () { return currentVersion.longdescription; }
            },
            'homepage': {
                get: function () { return currentVersion.homepage; }
            },
            'doc': {
                get: function () { return currentVersion.doc; }
            },
            'changelog': {
                get: function () { return currentVersion.changelog; }
            },
            'size': {
                get: function () { return currentVersion.size; }
            },
            'title': {
                get: function () { return currentVersion.title; }
            },
            'tags': {
                get: function () { return []; }
            },
            'rating': {
                get: function () { return 0; }
            },
            'date': {
                get: function () { return currentVersion.date; }
            },
            'license': {
                get: function () { return currentVersion.license; }
            },
            'licenseurl': {
                get: function () { return currentVersion.licenseurl; }
            }
        });

        /////////////////////////////
        // CONVENIENCE FUNCTIONS
        /////////////////////////////
        this.changeVersion = function changeVersion(version) {
            if (version instanceof Wirecloud.Version) {
                version = version.text;
            }

            if (version in data_by_version) {
                currentVersion = data_by_version[version];
            } else {
                currentVersion = data_by_version[allVersions[0].text];
            }

            return this;
        };

        ////////////////////////
        // CONSTRUCTOR
        ////////////////////////
        var i, version_data;

        for (i = 0; i < data.versions.length; i += 1) {
            version_data = data.versions[i];

            version_data.version = new Wirecloud.Version(version_data.version, 'catalogue');
            version_data.date = new Date(version_data.date);

            allVersions.push(version_data.version);
            data_by_version[version_data.version.text] = version_data;
        }
        allVersions = allVersions.sort(function (version1, version2) {
            return -version1.compareTo(version2);
        });
        this.changeVersion(allVersions[0]);

        Object.freeze(this);
    };

    Wirecloud.WirecloudCatalogue.ResourceDetails = ResourceDetails;

})();
