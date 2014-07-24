/*
 *     Copyright (c) 2012 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CatalogueView, gettext, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var market_types, MarketManager;

    market_types = {
        'wirecloud': {
            label: 'Wirecloud',
            view_class: CatalogueView
        }
    };
    MarketManager = {};

    MarketManager.getMarkets = function getMarkets(callback, onFailureCallback, onCompleteCallback) {
        Wirecloud.io.makeRequest(Wirecloud.URLs.MARKET_COLLECTION, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: function onSuccess(transport) {
                var raw_data = JSON.parse(transport.responseText);
                for (var key in raw_data) {
                    if (raw_data[key].url == null) {
                        delete raw_data[key];
                    }
                }
                callback(raw_data);
            },
            onFailure: function onFailure(transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error retrieving market list from the server: %(errorMsg)s."), transport);

                if (typeof onFailureCallback === 'function') {
                    onFailureCallback(msg);
                }
            },
            onComplete: function onComplete(transport) {
                if (typeof onCompleteCallback === 'function') {
                    onCompleteCallback();
                }
            }
        });
    };

    MarketManager.deleteMarket = function deleteMarket(marketplace, options) {

        var url;

        if (typeof options !== 'object') {
            options = {};
        }

        if (marketplace.user != null) {
            url = Wirecloud.URLs.MARKET_ENTRY.evaluate({user: marketplace.user, market: marketplace.name});
        } else {
            url = Wirecloud.URLs.GLOBAL_MARKET_ENTRY.evaluate({market: marketplace.name});
        }

        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: options.onSuccess,
            onFailure: function (transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error deleting marketplace: %(errorMsg)s."), transport);
                if (typeof options.onFailure === 'function') {
                    options.onFailure(msg);
                }
            },
            onComplete: options.onComplete
        });
    };

    MarketManager.addMarket = function addMarket(market_info, callback) {

        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding marketplace"), 1);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Adding marketplace'));

        Wirecloud.io.makeRequest(Wirecloud.URLs.MARKET_COLLECTION, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(market_info),

            onSuccess: function (transport) {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Marketplace added successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                callback();
            },
            onFailure: function (transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error adding marketplace: %(errorMsg)s."), transport);
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    MarketManager.addMarketType = function addMarketType(type, label, view_class) {
        market_types[type] = {
            label: label,
            view_class: view_class
        };
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
})();
