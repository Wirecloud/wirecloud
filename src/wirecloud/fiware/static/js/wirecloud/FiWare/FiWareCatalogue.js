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
/*global Constants, gettext, LayoutManagerFactory, LogManagerFactory, Wirecloud */

(function () {

    "use strict";

    var FiWareCatalogue, _onSearchSuccess, _onSearchError;

    _onSearchSuccess = function _onSearchSuccess(transport) {
        var raw_data = JSON.parse(transport.responseText);
        this.onSuccess(raw_data);
    };

    _onSearchError = function _onSearchError(transport) {
        this.onError();
    };

    FiWareCatalogue = function FiWareCatalogue(options) {
        if (options.user != null) {
            this.market_user = options.user;
        } else {
            this.market_user = 'public';
        }
        this.market_name = options.name;
        Object.defineProperty(this, 'permissions', {'value': options.permissions});
    };

    FiWareCatalogue.prototype.isAllow = function isAllow(action) {
        if (action in this.permissions) {
            return this.permissions[action];
        } else {
            return false;
        }
    };

    FiWareCatalogue.prototype.search = function search(onSuccess, onError, options) {
        var url, context;

        if (options.search_criteria === '' && options.store === 'All stores') {
            url = Wirecloud.URLs.FIWARE_RESOURCES_COLLECTION.evaluate({market_user: this.market_user, market_name: this.market_name});
        } else if (options.search_criteria !== '' && options.store === 'All stores') {
            url = Wirecloud.URLs.FIWARE_FULL_SEARCH.evaluate({market_user: this.market_user, market_name: this.market_name, search_string: options.search_criteria});
        } else if (options.search_criteria === '' && options.store !== 'All stores') {
            url = Wirecloud.URLs.FIWARE_STORE_RESOURCES_COLLECTION.evaluate({market_user: this.market_user, market_name: this.market_name, store: options.store});
        } else {
            url = Wirecloud.URLs.FIWARE_STORE_SEARCH.evaluate({market_user: this.market_user, market_name: this.market_name, store: options.store, search_string: options.search_criteria});
        }

        context = {
            'onSuccess': onSuccess,
            'onError': onError
        };

        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            onSuccess: _onSearchSuccess.bind(context),
            onFailure: _onSearchError.bind(context)
        });
    };

    FiWareCatalogue.prototype.is_purchased = function is_purchased(offering) {
        return offering.state === 'purchased' || offering.state === 'rated';
    };

    FiWareCatalogue.prototype.start_purchase = function start_purchase(resource, options) {

        if (options == null) {
            options = {};
        }

        var url = Wirecloud.URLs.FIWARE_STORE_START_PURCHASE.evaluate({market_user: this.market_user, market_name: this.market_name, store: resource.store});
        Wirecloud.io.makeRequest(
            url,
            {
                contentType: 'application/json',
                postBody: JSON.stringify({offering_url: resource.usdl_url}),
                onSuccess: function (transport) {
                    var data = JSON.parse(transport.responseText);

                    if (typeof options.onSuccess === 'function') {
                        options.onSuccess(data);
                    }
                }.bind(this),
            }
        );
    };

    FiWareCatalogue.prototype.getStores = function getStores(onSuccess, onError) {
        var context, url = Wirecloud.URLs.FIWARE_STORE_COLLECTION.evaluate({market_user: this.market_user, market_name: this.market_name});

        context = {
            onSuccess: onSuccess,
            onError: onError
        };

        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            onSuccess: _onSearchSuccess.bind(context),
            onFailure: _onSearchError.bind(context)
        });
    };

    Wirecloud.FiWare.FiWareCatalogue = FiWareCatalogue;
})();
