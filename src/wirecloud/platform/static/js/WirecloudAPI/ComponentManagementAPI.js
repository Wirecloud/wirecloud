/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals MashupPlatform */


(function () {

    "use strict";

    var platform = window.parent;
    var Wirecloud = platform.Wirecloud;

    /**
     * Install a component
     *
     * @since 1.0
     *
     * @param {String} resourceURL
     *      The URL where the resource is located.
     */
    var install = function install(resourceURL) {
        return new Promise (function (fulfill, reject) {
            var options =  {
                market_info: {
                    name: "admin/fiware-bae",
                    store: "fiware-bae"
                },
                onSuccess: function () { fulfill(true); },
                onFailure: function () { reject(false); },
            };
            Wirecloud.LocalCatalogue.addResourceFromURL(resourceURL, options);
        });
    };

    /**
     * Uninstall a component.
     *
     * @since 1.0
     *
     * @param {String} vendor
     *      The vendor of the component
     * @param {String} name
     *      The  name of the component
     * @param {String} version
     *      The version of the component. If undefined all versions will be uninstalled.
     */
    var uninstall = function uninstall(vendor, name, version) {
        return new Promise (function (fulfill, reject) {
            var options = {
                onSuccess: function () { fulfill(true); },
                onFailure: function () { reject(false); },
            };

            var resource;

            if (version) {
                resource = Wirecloud.LocalCatalogue.getResource(vendor, name, version);
            } else {
                resource = Wirecloud.LocalCatalogue.resourceVersions[[vendor, name].join('/')][0];
                options.allVersions = true;
            }
            if (resource) {
                Wirecloud.LocalCatalogue.uninstallResource (resource, options);
            } else { // If the resource does not exist, its already uninstalled
                fulfill(true);
            }
        });
    };

    /**
     * Returns if any version of a component is installed
     *
     * @since 1.0
     *
     * @param {String} vendor
     *      The vendor of the component
     * @param {String} name
     *      The  name of the component
     * @return {boolean} isInstalled
     *      If any version of the component is installed
     */
    var isAnyInstalled = function isAnyInstalled(vendor, name) {
        var mac = [vendor, name].join('/');
        return Wirecloud.LocalCatalogue.resourceVersions[mac].length > 0;
    };

    /**
     * Returns if a version of a component is installed
     *
     * @since 1.0
     *
     * @param {String} vendor
     *      The vendor of the component
     * @param {String} name
     *      The  name of the component
     * @param {String} version
     *      The version of the component.
     * @return {boolean} isInstalled
     *      If the component is installed
     */
    var isInstalled = function isInstalled(vendor, name, version) {
        return Wirecloud.LocalCatalogue.resourceExistsId([vendor, name, version].join('/'));
    };

    MashupPlatform.components = {};
    Object.defineProperties(MashupPlatform.components, {
        install: {value: install},
        uninstall: {value: uninstall},
        isInstalled: {value: isInstalled},
        isAnyInstalled: {value: isAnyInstalled},
    });
})();