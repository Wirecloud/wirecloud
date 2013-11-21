/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*global CatalogueResource, gettext, Wirecloud*/

(function () {

    "use strict";

    var WirecloudCatalogue, _onSearchSuccess, _onSearchError, deleteSuccessCallback, deleteErrorCallback;

    _onSearchSuccess = function _onSearchSuccess(transport) {
        var i, data, raw_data, resources, resource;

        raw_data = JSON.parse(transport.responseText);
        if (raw_data.resources) {
            resources = [];

            for (i = 0; i < raw_data.resources.length; i += 1) {
                resource = new CatalogueResource(raw_data.resources[i]);
                resources.push(resource);
            }

            data = {
                'resources': resources,
                'current_page': this.options.starting_page,
                'total_count': parseInt(raw_data.items, 10)
            };

            this.onSuccess(data, data);
        }
    };

    _onSearchError = function _onSearchError() {
        this.onError();
    };

    deleteSuccessCallback = function deleteSuccessCallback() {
        this.onSuccess();
    };

    deleteErrorCallback = function deleteErrorCallback(transport, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error deleting resource: %(errorMsg)s."), transport, e);

        this.onError(msg);
    };

    /*************************************************************************/
    WirecloudCatalogue = function WirecloudCatalogue(options) {

        Object.defineProperty(this, 'name', {'value': options.name});
        Object.defineProperty(this, 'permissions', {'value': options.permissions});

        if (options.url == null) {
            options.url = Wirecloud.URLs.LOCAL_REPOSITORY;
        } else if (options.url[options.url.length - 1] !== '/') {
            options.url += '/';
        }

        this.view_all_template = new Wirecloud.Utils.Template(options.url + 'catalogue/resources/%(starting_page)s/%(resources_per_page)s');
        this.simple_search_template = new Wirecloud.Utils.Template(options.url + 'catalogue/search/and/%(starting_page)s/%(resources_per_page)s');

        Object.defineProperty(this, 'RESOURCE_ENTRY', {
            value: new Wirecloud.Utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s')
        });
        Object.defineProperty(this, 'RESOURCE_COLLECTION', {value: options.url + 'catalogue/resources'});
    };

    WirecloudCatalogue.prototype.isAllow = function isAllow(action) {
        if (action in this.permissions) {
            return this.permissions[action];
        } else {
            return false;
        }
    };

    WirecloudCatalogue.prototype.search = function search(onSuccess, onError, options) {
        var params, url, context;

        params = {
            'search_criteria': options.search_criteria,
            'search_boolean': options.search_boolean,
            'scope': options.scope
        };
        if (options.order_by !== '') {
            params.orderby = options.order_by;
        }

        context = {
            'options': options,
            'onSuccess': onSuccess,
            'onError': onError
        };

        if (options.search_criteria.trim() === '') {
            url = this.view_all_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
        } else {
            url = this.simple_search_template.evaluate({'starting_page': options.starting_page, 'resources_per_page': options.resources_per_page});
        }
        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            parameters: params,
            onSuccess: _onSearchSuccess.bind(context),
            onFailure: _onSearchError.bind(context)
        });
    };

    WirecloudCatalogue.prototype.is_purchased = function is_purchased() {
        return true;
    };

    WirecloudCatalogue.prototype.addPackagedResource = function addPackagedResource(data, options) {
        var url, requestHeaders;

        if (typeof options != 'object') {
            options = {};
        }

        if (this.name === 'local') {
            url = Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION;
        } else {
            url = this.RESOURCE_COLLECTION;


            if (this.accesstoken != null) {
                requestHeaders = {
                    'Authorization': 'Bearer ' + this.accesstoken
                };
            }
        }

        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            requestHeaders: requestHeaders,
            postBody: data,
            onSuccess: function (transport) {
                var response_data = JSON.parse(transport.responseText);

                if (typeof options.onSuccess === 'function') {
                    try {
                        options.onSuccess(response_data);
                    } catch (e) {}
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding packaged resource: %(errorMsg)s."), transport);

                if (typeof options.onFailure === 'function') {
                    try {
                        options.onFailure(msg);
                    } catch (e) {}
                }
            },
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    try {
                        options.onComplete();
                    } catch (e) {}
                }
            }
        });
    };

    WirecloudCatalogue.prototype.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(this.RESOURCE_COLLECTION, {
            method: 'POST',
            parameters: {'template_uri': url, packaged: !!options.packaged, force_create: !!options.forceCreate},
            onSuccess: function () {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding resource from URL: %(errorMsg)s."), transport);

                if (typeof options.onFailure === 'function') {
                    options.onFailure(msg);
                }
            },
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    WirecloudCatalogue.prototype.deleteResource = function deleteResource(resource, onSuccess, onError) {
        var url, context;

        url = this.RESOURCE_ENTRY.evaluate({
            vendor: resource.vendor,
            name: resource.name,
            version: resource.version.text
        });

        context = {
            catalogue: this,
            resource: resource,
            onSuccess: onSuccess,
            onError: onError
        };

        // Send request to delete de widget
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: deleteSuccessCallback.bind(context),
            onFailure: deleteErrorCallback.bind(context),
            onException: deleteErrorCallback.bind(context)
        });
    };

    Wirecloud.WirecloudCatalogue = WirecloudCatalogue;
})();
