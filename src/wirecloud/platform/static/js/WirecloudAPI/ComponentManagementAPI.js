/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.
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


(function () {

    "use strict";

    const _ComponentManagementAPI = function _ComponentManagementAPI(parent, platform, _) {
        const Wirecloud = platform.Wirecloud;

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
        const install = function install(options) {
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
        const uninstall = function uninstall(vendor, name, version) {
            if (vendor == null) {
                throw new TypeError("missing vendor parameter");
            }

            if (name == null) {
                throw new TypeError("missing name parameter");
            }

            return new Promise(function (resolve, reject) {
                let component;
                const options = {};

                if (version) {
                    component = Wirecloud.LocalCatalogue.getResource(vendor, name, version);
                } else {
                    component = Wirecloud.LocalCatalogue.resourceVersions[[vendor, name].join('/')][0];
                    options.allVersions = true;
                }
                if (component) {
                    Wirecloud.LocalCatalogue.deleteResource(component, options).then(
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
        const isInstalled = function isInstalled(vendor, name, version) {
            if (version !== null) {
                return Wirecloud.LocalCatalogue.resourceExistsId([vendor, name, version].join('/'));
            } else {
                const mac = [vendor, name].join('/');
                return Wirecloud.LocalCatalogue.resourceVersions[mac].length > 0;
            }
        };

        parent.MashupPlatform.components = {};
        Object.defineProperties(parent.MashupPlatform.components, {
            install: {value: install},
            uninstall: {value: uninstall},
            isInstalled: {value: isInstalled}
        });
    };

    window._privs._ComponentManagementAPI = _ComponentManagementAPI;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._ComponentManagementAPI(window, window.parent);
    }

})();
