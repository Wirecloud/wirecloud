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
            url = Wirecloud.URLs.FIWARE_RESOURCES_COLLECTION.evaluate({market: this.market_name});
        } else if (options.search_criteria !== '' && options.store === 'All stores') {
            url = Wirecloud.URLs.FIWARE_FULL_SEARCH.evaluate({market: this.market_name, search_string: options.search_criteria});
        } else if (options.search_criteria === '' && options.store !== 'All stores') {
            url = Wirecloud.URLs.FIWARE_STORE_RESOURCES_COLLECTION.evaluate({market: this.market_name, store: options.store});
        } else {
            url = Wirecloud.URLs.FIWARE_STORE_SEARCH.evaluate({market: this.market_name, store: options.store, search_string: options.search_criteria});
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

    FiWareCatalogue.prototype.is_purchased = function is_purchased(resource) {
        return resource.state === 'purchased';
    };

    FiWareCatalogue.prototype.deleteResource = function deleteResource(options) {
        var url;

        url = Wirecloud.URLs.FIWARE_RESOURCE_ENTRY.evaluate({market: this.market_name, store: options.store, entry: options.name});

        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting resource from marketplace"), 1);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting resource from marketplace'));

        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: function (transport) {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Resource deleted successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error deleting resource: %(errorMsg)s."), transport);
                LogManagerFactory.getInstance().log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                LayoutManagerFactory.getInstance().log(msg);
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }.bind(this)
        });
    };

    FiWareCatalogue.prototype.getStores = function getStores(onSuccess, onError) {
        var context, url = Wirecloud.URLs.FIWARE_STORE_COLLECTION.evaluate({market: this.market_name});

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
