/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var CatalogueResource = function CatalogueResource(data) {

        ///////////////////////
        // PRIVATE VARIABLES
        ///////////////////////
        var currentVersion = null,
            allVersions = [],
            data_by_version = {},
        ///////////////////////////
        // CONSTRUCTOR VARIABLES
        ///////////////////////////
            i = 0,
            versions,
            version_data;

        //////////////////////////
        // GETTERS
        /////////////////////////
        this.getLastVersion = function () {
            return allVersions[0];
        };

        this.getAllVersions = function () {
            return allVersions;
        };

        this.getUriImage = function () {
            return currentVersion.uriImage;
        };

        this.getUriTemplate = function () {
            return currentVersion.uriTemplate;
        };

        this.isMashup = function () {
            return this.type === 'mashup';
        };

        this.isWidget = function () {
            return this.type === 'widget';
        };

        this.getTags = function () {
            return currentVersion.tags;
        };

        this.getVotes = function () {
            return currentVersion.votes.votes_number;
        };

        this.getUserVote = function () {
            return currentVersion.votes.user_vote;
        };

        this.isAllow = function isAllow(action) {

            switch (action) {
            case 'uninstall':
                return currentVersion.permissions.uninstall;
            case 'delete':
            case 'delete-all':
                return OpManagerFactory.getInstance().contextManager.get('issuperuser');
            }
        };

        Object.defineProperties(this, {
            'vendor': {value: data.vendor},
            'name': {value: data.name},
            'version': {
                get: function () {
                    return currentVersion.version;
                }
            },
            'uri': {
                get: function () { return [this.vendor, this.name, currentVersion.version.text].join('/'); }
            },
            'type': {value: data.type},
            'packaged': {
                get: function () { return !!currentVersion.packaged; }
            },
            'description': {
                get: function () { return currentVersion.description; }
            },
            'doc_url': {
                get: function () { return currentVersion.uriWiki; }
            },
            'displayname': {
                get: function () { return currentVersion.displayName; }
            },
            'uploader': {
                get: function () { return currentVersion.uploader; }
            },
            'rating': {
                get: function () { return currentVersion.votes.popularity; }
            },
            'date': {
                get: function () { return currentVersion.date; }
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
        };

        ////////////////////////
        // CONSTRUCTOR
        ////////////////////////
        versions = data.versions;

        for (i = 0; i < versions.length; i += 1) {
            version_data = versions[i];

            version_data.version = new Wirecloud.Version(version_data.version, 'catalogue');
            version_data.date = new Date(version_data.date);

            allVersions.push(version_data.version);
            data_by_version[version_data.version.text] = version_data;
        }
        allVersions = allVersions.sort(function (version1, version2) {
            return -version1.compareTo(version2);
        });
        this.changeVersion(allVersions[0]);
    };

    window.CatalogueResource = CatalogueResource;

})();
