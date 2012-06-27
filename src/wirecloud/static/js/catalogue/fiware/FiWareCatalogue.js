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

    var FiWareCatalogue, _onSearchSuccess;

    _onSearchSuccess = function _onSearchSuccess(transport) {
        var raw_data = JSON.parse(transport.responseText);
        this.callback(raw_data);
    };


    FiWareCatalogue = function FiWareCatalogue(market_name) {
        this.market_name = market_name;
    };

    FiWareCatalogue.prototype.search = function search(callback, options) {
        var url;

        if (options.search_criteria === '' && options.store === 'All stores') {
            url = Wirecloud.URLs.FIWARE_RESOURCES_COLLECTION.evaluate({market: this.market_name});
        } else if (options.search_criteria !== '' && options.store === 'All stores') {
            url = Wirecloud.URLs.FIWARE_FULL_SEARCH.evaluate({market: this.market_name, search_string: options.search_criteria});
        } else if (options.search_criteria === '' && options.store !== 'All stores') {
            url = Wirecloud.URLs.FIWARE_STORE_RESOURCES_COLLECTION.evaluate({market: this.market_name, store: options.store});
        } else {
            url = Wirecloud.URLs.FIWARE_STORE_SEARCH.evaluate({market: this.market_name, store: options.store, search_string: options.search_criteria});
        }

        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            onSuccess: _onSearchSuccess.bind({'callback': callback})
        });
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

    FiWareCatalogue.prototype.getStores = function getStores(callback) {
        var url = Wirecloud.URLs.FIWARE_STORE_COLLECTION.evaluate({market: this.market_name});

        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            onSuccess: _onSearchSuccess.bind({'callback': callback})
        });

    };

    FiWareCatalogue.prototype.delete_store = function delete_store(store, callback) {
        var url = Wirecloud.URLs.FIWARE_STORE_ENTRY.evaluate({market: this.market_name, store: store});

        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting store from marketplace"), 1);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting store from marketplace'));

        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: function (transport) {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Store deleted successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                callback();
            },
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error deleting store: %(errorMsg)s."), transport);
                LogManagerFactory.getInstance().log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                LayoutManagerFactory.getInstance().log(msg);
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    FiWareCatalogue.prototype.add_store = function (store, store_uri, callback) {
        var url;
        url = Wirecloud.URLs.FIWARE_STORE_COLLECTION.evaluate({market: this.market_name});

        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding store to  marketplace"), 1);
        LayoutManagerFactory.getInstance().logSubTask(gettext('Adding store to marketplace'));

        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            parameters: {'uri': store_uri, 'store': store},
            onSuccess: function (transport) {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Store added successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                callback();
            },
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error adding store: %(errorMsg)s."), transport);
                LogManagerFactory.getInstance().log(msg);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                LayoutManagerFactory.getInstance().log(msg);
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });

    };

    window.FiWareCatalogue = FiWareCatalogue;
})();
