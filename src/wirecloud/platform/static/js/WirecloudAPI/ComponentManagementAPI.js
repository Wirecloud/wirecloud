/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * Installs a component
     *
     * @since 1.0
     *
     * @param {String} url
     *      The URL where the component is located.
     *
     * @returns {Wirecloud.Task}
     */
    var install = function install(options) {
        return Wirecloud.LocalCatalogue.addComponent(options);
    };

    /**
     * Uninstalls a component.
     *
     * @since 1.0
     *
     * @param {String} vendor
     *      The vendor of the component
     * @param {String} name
     *      The  name of the component
     * @param {String} [version]
     *      The version of the component. If undefined all versions will be uninstalled.
     *
     * @returns {Promise}
     */
    var uninstall = function uninstall(vendor, name, version) {
        if (vendor == null) {
            throw new TypeError("missing vendor parameter");
        }

        if (name == null) {
            throw new TypeError("missing name parameter");
        }

        return new Promise(function (resolve, reject) {
            var component, options = {};

            if (version) {
                component = Wirecloud.LocalCatalogue.getResource(vendor, name, version);
            } else {
                component = Wirecloud.LocalCatalogue.resourceVersions[[vendor, name].join('/')][0];
                options.allVersions = true;
            }
            if (component) {
                Wirecloud.LocalCatalogue.uninstallResource(component, options).then(
                    resolve.bind(null, undefined),
                    reject
                );
            } else {
                // Do nothing if the component is already uninstalled
                resolve();
            }
        });
    };

    /**
     * Checks if the component is currently installed.
     *
     * @since 1.0
     *
     * @param {String} vendor
     *      The vendor of the component
     * @param {String} name
     *      The  name of the component
     * @param {String} [version]
     *      Version of the component to check
     *
     * @returns {boolean}
     *      `true` if the component is installed
     */
    var isInstalled = function isInstalled(vendor, name, version) {
        if (version !== null) {
            return Wirecloud.LocalCatalogue.resourceExistsId([vendor, name, version].join('/'));
        } else {
            var mac = [vendor, name].join('/');
            return Wirecloud.LocalCatalogue.resourceVersions[mac].length > 0;
        }
    };

    MashupPlatform.components = {};
    Object.defineProperties(MashupPlatform.components, {
        install: {value: install},
        uninstall: {value: uninstall},
        isInstalled: {value: isInstalled}
    });

})();
