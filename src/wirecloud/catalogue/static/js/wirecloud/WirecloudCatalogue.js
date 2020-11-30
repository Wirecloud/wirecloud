/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, utils, se) {

    "use strict";

    ns.WirecloudCatalogue = class WirecloudCatalogue extends se.ObjectWithEvents {

        /**
         * Class for accessing WireCloud catalogues.
         *
         * @constructor
         * @extends StyledElements.ObjectWithEvents
         * @name Wirecloud.WirecloudCatalogue
         *
         * @param {Object} options
         */
        constructor(options) {
            if (options == null) {
                options = {};
            }

            if (options.permissions == null) {
                options.permissions = {};
            }

            super(["change", "install", "uninstall"]);

            if (options.url == null) {
                options.url = Wirecloud.URLs.LOCAL_REPOSITORY;
                options.name = 'local';
            } else if (options.url[options.url.length - 1] !== '/') {
                options.url += '/';
            }

            Object.defineProperties(this, {
                'title': {'value': options.title || options.name},
                'name': {'value': options.name},
                'permissions': {'value': options.permissions},
                'url': {value: options.url},
                'RESOURCE_CHANGELOG_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s/changelog')},
                'RESOURCE_USERGUIDE_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s/userguide')},
                'RESOURCE_COLLECTION': {value: options.url + 'catalogue/resources'},
                'RESOURCE_UNVERSIONED_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s')},
                'RESOURCE_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s')},
            });
        }

        isAllow(action) {
            if (action in this.permissions) {
                return this.permissions[action];
            } else {
                return false;
            }
        }

        /**
         * Retrieves the available components from the server in a paginated way.
         *
         * @params {Object} options
         *
         * @returns {Wirecloud.Task}
         */
        search(options) {
            if (options == null) {
                options = {};
            }

            var params = {};

            if (options.lang != null) {
                params.lang = options.lang;
            }

            if (options.search_criteria != null && options.search_criteria !== '') {
                params.q = options.search_criteria;
            }

            if (options.scope != null && options.scope !== '' && options.scope !== 'all') {
                if (['widget', 'operator', 'mashup'].indexOf(options.scope) === -1) {
                    throw new TypeError('invalid scope value');
                }
                params.scope = options.scope;
            }

            if (options.order_by != null && options.order_by !== '') {
                params.orderby = options.order_by;
            }

            if (options.maxresults != null) {
                if (typeof options.maxresults !== 'number' || options.maxresults < 20) {
                    throw new TypeError('invalid maxresults value');
                }
                params.maxresults = options.maxresults;
            }

            if (options.pagenum != null) {
                if (typeof options.pagenum !== 'number' || options.pagenum < 0) {
                    throw new TypeError('invalid pagenum value');
                }
                params.pagenum = options.pagenum;
            }

            return Wirecloud.io.makeRequest(this.RESOURCE_COLLECTION, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                parameters: params
            }).then((response) => {
                if ([200, 401, 403, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                var raw_data = JSON.parse(response.responseText);
                var data = {
                    'resources': raw_data.results,
                    'current_page': parseInt(raw_data.pagenum, 10),
                    'total_count': parseInt(raw_data.total, 10)
                };
                if ('corrected_q' in raw_data) {
                    data.corrected_query = raw_data.corrected_q;
                }
                return Promise.resolve(data);
            }).toTask(utils.gettext("Doing catalogue search"));
        }

        getResourceDetails(vendor, name) {

            var url = this.RESOURCE_UNVERSIONED_ENTRY.evaluate({vendor: vendor, name: name});
            return Wirecloud.io.makeRequest(url, {
                method: 'GET'
            }).then((response) => {
                return Promise.resolve(new Wirecloud.WirecloudCatalogue.ResourceDetails(JSON.parse(response.responseText), this));
            });
        }

        /**
         * Installs a component into this catalogue.
         *
         * @param {Object} options
         *
         * @returns {Wirecloud.Task}
         */
        addComponent(options) {
            var url, parameters, requestHeaders, contentType, body;

            if (options == null) {
                throw new TypeError("missing options parameter");
            }

            options = utils.merge({
                install_embedded_resources: true
            }, options);

            if (this.name !== 'local' && options.market_endpoint != null) {
                throw new TypeError("market_endpoint option can only be used on local catalogues");
            } else if (options.market_endpoint == null && options.file == null && options.url == null) {
                throw new TypeError("at least one of the following options has to be used: file or market_endpoint");
            }

            requestHeaders = {
                'Accept': 'application/json'
            };

            if (this.name === 'local') {
                url = Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION;
            } else {
                url = this.RESOURCE_COLLECTION;
                /* TODO future support for external catalogues with authentication
                if (this.accesstoken != null) {
                    requestHeaders.Authorization = 'Bearer ' + this.accesstoken;
                }
                */
            }

            if (options.file != null) {
                var task_title = utils.interpolate(
                    utils.gettext('Uploading packaged component %(filename)s'),
                    {
                        filename: options.file.name
                    }
                );
                contentType = 'application/octet-stream';
                body = options.file;

                parameters = {};

                if (options.install_embedded_resources === true) {
                    parameters.install_embedded_resources = "true";
                }

                if (options.force_create === true) {
                    parameters.force_create = "true";
                }

            } else {
                var task_title = utils.interpolate(
                    utils.gettext('Installing component from %(url)s'),
                    {
                        url: options.url
                    }
                );
                contentType = 'application/json';
                body = JSON.stringify({
                    url: options.url,
                    headers: options.headers,
                    force_create: !!options.forceCreate,
                    install_embedded_resources: !!options.install_embedded_resources,
                    market_endpoint: options.market_endpoint
                });
            }

            return Wirecloud.io.makeRequest(url, {
                method: 'POST',
                contentType: contentType,
                requestHeaders: requestHeaders,
                postBody: body,
                parameters: parameters
            }).then((response) => {
                if ([201, 400, 403, 409, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if (response.status !== 201) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }
                var response_data = JSON.parse(response.responseText);
                return Promise.resolve(response_data);
            }).toTask(task_title);
        }

        /**
         * Completely removes a component from the server.
         *
         * @returns {Wirecloud.Task}
         */
        deleteResource(resource, options) {
            var url, msg;

            options = utils.merge({
                allversions: false
            }, options);

            if (options.allversions) {
                url = this.RESOURCE_UNVERSIONED_ENTRY.evaluate({
                    vendor: resource.vendor,
                    name: resource.name
                });
                msg = utils.interpolate(utils.gettext("Deleting all versions of %(title)s (%(group_id)s)"), resource);
            } else {
                url = this.RESOURCE_ENTRY.evaluate({
                    vendor: resource.vendor,
                    name: resource.name,
                    version: resource.version.text
                });
                msg = utils.interpolate(utils.gettext("Deleting %(title)s (%(uri)s)"), resource);
            }

            // Send request to delete de widget
            return Wirecloud.io.makeRequest(url, {
                method: 'DELETE',
                requestHeaders: {'Accept': 'application/json'}
            }).then(function (response) {
                return new Promise(function (resolve, reject) {
                    var result;
                    if (response.status !== 200) {
                        return reject(new Error("Unexpected response from server"));
                    }

                    try {
                        result = JSON.parse(response.responseText);
                        if (result.affectedVersions == null) {
                            result.affectedVersions = [resource.version.text];
                        }
                    } catch (e) {
                        return reject(new Error("Unexpected response from server"));
                    }
                    resolve(result);
                });
            }).toTask(msg);
        }

    }

})(Wirecloud, Wirecloud.Utils, StyledElements);
