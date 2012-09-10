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

/*global CatalogueResource, CookieManager, Wirecloud, Template, URIs*/

(function () {

    "use strict";

    var WirecloudCatalogue, _onSearchSuccess, _onSearchError;

    _onSearchSuccess = function _onSearchSuccess(transport) {
        var preferred_versions, i, data, key, raw_data, resources, resource;

        raw_data = JSON.parse(transport.responseText);
        if (raw_data.resources) {
            preferred_versions = CookieManager.readCookie('preferred_versions', true);
            if (preferred_versions === null) {
                preferred_versions = {};
            }

            resources = [];

            for (i = 0; i < raw_data.resources.length; i += 1) {
                resource = new CatalogueResource(raw_data.resources[i]);
                resources.push(resource);
                key = resource.getVendor() + '/' + resource.getName();
                if (key in preferred_versions) {
                    resource.changeVersion(preferred_versions[key]);
                }
            }

            data = {
                'resources': resources,
                'preferred_versions': preferred_versions,
                'current_page': this.options.starting_page,
                'total_count': parseInt(raw_data.items, 10)
            };

            this.onSuccess(data, data);
        }
    };

    _onSearchError = function _onSearchError(transport) {
        this.onError();
    };

    WirecloudCatalogue = function (options) {

        Object.defineProperty(this, 'name', {'value': options.name});

        if (options.url == null) {
            options.url = Wirecloud.URLs.LOCAL_REPOSITORY;
        } else if (options.url[options.url.length - 1] !== '/') {
            options.url += '/';
        }

        this.view_all_template = new Template(options.url + URIs.GET_POST_RESOURCES + '/#{starting_page}/#{resources_per_page}');
        this.simple_search_template = new Template(options.url + URIs.GET_RESOURCES_SIMPLE_SEARCH + '/simple_or/#{starting_page}/#{resources_per_page}');
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

        if (options.search_criteria.strip() === '') {
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

    Wirecloud.WirecloudCatalogue = WirecloudCatalogue;
})();
