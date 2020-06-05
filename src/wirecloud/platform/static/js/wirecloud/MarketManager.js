/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals CatalogueView, Wirecloud */


(function (utils) {

    "use strict";

    var market_types, MarketManager;

    market_types = {
        'wirecloud': {
            label: 'Wirecloud',
            view_class: CatalogueView
        }
    };
    MarketManager = {};

    /**
     * Returns all the available marketplaces.
     *
     * @returns {Wirecloud.Task}
     */
    MarketManager.getMarkets = function getMarkets() {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.MARKET_COLLECTION, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then(function (response) {
            if ([200, 401, 403, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if (response.status !== 200) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }

            var raw_data = JSON.parse(response.responseText);
            for (var key in raw_data) {
                if (raw_data[key].url == null) {
                    delete raw_data[key];
                }
            }
            return Promise.resolve(raw_data);
        }).toTask("Requesting available marketplaces");
    };

    /**
     * Removes a marketplace form WireCloud.
     *
     * @param {Object} marketplace
     *     marketplace to remove
     * @returns {Wirecloud.Task}
     */
    MarketManager.deleteMarket = function deleteMarket(marketplace) {
        return new Wirecloud.Task("Deleting marketplace", function (resolve, reject) {
            var url = Wirecloud.URLs.MARKET_ENTRY.evaluate({user: marketplace.user, market: marketplace.name});

            Wirecloud.io.makeRequest(url, {
                method: 'DELETE',
                requestHeaders: {'Accept': 'application/json'}
            }).then((response) => {
                if ([204, 401, 403, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if (response.status !== 204) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                return Promise.resolve(marketplace);
            }).then(resolve, reject);
        });
    };

    /**
     * Adds a marketplace into WireCloud.
     *
     * @param {Object} market_info
     *     Info about the new marketplace
     * @returns {Wirecloud.Task}
     *
     * @example
     * manager.addMarket({
     * }).then();
     *
     */
    MarketManager.addMarket = function addMarket(market_info) {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.MARKET_COLLECTION, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(market_info)
        }).then((response) => {
            if ([201, 401, 403, 409, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if (response.status !== 201) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }

            return Promise.resolve(market_info);
        }).toTask(utils.gettext("Adding marketplace"));
    };

    /**
     * Registers a new marketplace type and the associated view class.
     *
     * @param {String} type
     * @param {String} label
     * @param {Function} view_class
     *
     * @returns {Wirecloud.MarketManager}
     */
    MarketManager.addMarketType = function addMarketType(type, label, view_class) {
        market_types[type] = {
            label: label,
            view_class: view_class
        };
        return this;
    };

    MarketManager.getMarketViewClass = function getMarketplaceViewClass(type) {
        if (type in market_types) {
            return market_types[type].view_class;
        } else {
            return null;
        }
    };

    MarketManager.getMarketTypes = function getMarketTypes() {
        var key, market_type, types = [];

        for (key in market_types) {
            market_type = market_types[key];

            types.push({label: market_type.label, value: key});
        }

        return types;
    };

    Wirecloud.MarketManager = MarketManager;

})(Wirecloud.Utils);
