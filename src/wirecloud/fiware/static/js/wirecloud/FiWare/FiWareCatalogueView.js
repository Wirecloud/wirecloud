/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements, gettext, interpolate, LayoutManagerFactory, CatalogueSearchView, Wirecloud*/

(function () {

    "use strict";

    var change_store_filter = function change_store_filter(select) {
        var new_value = select.getValue();
        if (new_value !== '') {
            this.currentStore = new_value;
            this.refresh_search_results();
        }
    };

    var update_store_list = function update_store_list(store_info) {
        var i, entries = [];

        entries.push({
            label: gettext('All stores'),
            value: 'All stores'
        });

        for (i = 0; i < store_info.length; i += 1) {
            entries.push({
                label: store_info[i].name,
                value: store_info[i].name
            });
        }

        this.storeSelect.addEntries(entries);
    };

    var onBuySuccess = function onBuySuccess(offering, offering_entry) {
        var layoutManager, monitor;

        layoutManager = LayoutManagerFactory.getInstance();
        monitor = layoutManager._startComplexTask(gettext("Importing offering resources into local repository"), 3);

        this.catalogue.get_offering_info(offering.store, offering.id, {
            monitor: monitor,
            onSuccess: function (refreshed_offering) {
                refreshed_offering.install({
                    monitor: monitor,
                    onResourceSuccess: function (resource) {
                        var local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
                        local_catalogue_view.viewsByName.search.mark_outdated();
                        this.viewsByName.search.mark_outdated();
                    }.bind(this),
                    onFailure: function (msg) {
                        (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                    },
                    onComplete: function () {
                        if (this.alternatives.getCurrentAlternative() === this.viewsByName.details) {
                            this.createUserCommand('showDetails', refreshed_offering)();
                        } else {
                            this.refresh_search_results();
                            if (offering_entry) {
                                offering_entry.update_buttons();
                            }
                        }
                        layoutManager._notifyPlatformReady();
                    }.bind(this)
                });
            }.bind(this),
            onFailure: this.refresh_search_results.bind(this)
        });
    };

    var FiWareCatalogueView = function (id, options) {
        var search_view_options;

        options.class = 'catalogue fiware';
        StyledElements.Alternative.call(this, id, options);

        this.mainview = options.catalogue;
        this.alternatives = new StyledElements.StyledAlternatives();
        this.appendChild(this.alternatives);
        this.currentStore = 'All stores';
        Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
        if (this.desc.user != null) {
            Object.defineProperty(this, 'market_id', {value: this.desc.user + '/' + this.desc.name});
        } else {
            Object.defineProperty(this, 'market_id', {value: this.desc.name});
        }
        this.loading = null;
        this.error = false;
        this.callbacks = [];
        this.store_info = [];

        this.storeSelect = new StyledElements.StyledSelect({
            'class': 'store_select'
        });
        this.storeSelect.addEventListener('change', change_store_filter.bind(this));
        search_view_options = {
            catalogue: this,
            resource_painter: Wirecloud.FiWare.ui.OfferingPainter,
            resource_template: 'fiware_resource',
            gui_template: 'fiware_marketplace_search_interface',
            extra_context: {
                'store_select': this.storeSelect
            }
        };

        this.viewsByName = {
            'initial': this.alternatives.createAlternative(),
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: search_view_options}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.FiWare.ui.OfferingDetailsView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.catalogue = new Wirecloud.FiWare.Marketplace(this.desc);
        this.number_of_stores = 0;
        this.refresh_store_info();
        this.alternatives.addEventListener('preTransition', function () {
            LayoutManagerFactory.getInstance().header._notifyViewChange();
        });
        this.alternatives.addEventListener('postTransition', function (alternatives, out_alternative) {
            LayoutManagerFactory.getInstance().header.refresh();
        });

        this.addEventListener('show', function () {
            if (this.alternatives.getCurrentAlternative() === this.viewsByName.initial) {
                this.changeCurrentView('search', {
                    onComplete: function (alternatives, out_alternative) {
                        var new_status = this.mainview.buildStateData();
                        Wirecloud.HistoryManager.replaceState(new_status);
                    }.bind(this)
                });
            }
            this.refresh_if_needed();
        }.bind(this));
    };
    FiWareCatalogueView.prototype = new StyledElements.Alternative();

    FiWareCatalogueView.prototype.getLabel = function () {
        return this.desc.name;
    };

    FiWareCatalogueView.prototype.onHistoryChange = function onHistoryChange(state) {
        var offering_info, parts, currentOffering;

        if (state.subview === 'search') {
            this.changeCurrentView(state.subview, {});
        } else {
            parts = state.offering.split('/');
            offering_info = {
                store: parts[0],
                id: parts[1]
            };

            currentOffering = this.viewsByName.details.currentEntry;
            if (currentOffering != null && currentOffering.store == offering_info.store && currentOffering.id == offering_info.id) {
                currentOffering = currentOffering;
            }
            this.createUserCommand('showDetails', offering_info, {tab: state.tab})();
        }
    };

    // this functions are used to update and know the current store in diferent views
    FiWareCatalogueView.prototype.setCurrentStore = function (store) {
        this.currentStore = store;
    };

    FiWareCatalogueView.prototype.getCurrentStore = function () {
        return this.currentStore;
    };

    FiWareCatalogueView.prototype.getCurrentSearchContext = function getCurrentSearchContext() {
        return {
            'store': this.currentStore
        };
    };

    FiWareCatalogueView.prototype.goUp = function goUp() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            return false;
        }
        this.changeCurrentView('search');
        return true;
    };

    FiWareCatalogueView.prototype.search = function search(options) {
        options.onSuccess = this._onSearch.bind(this, options.onSuccess);
        this.catalogue.search(options);
    };

    FiWareCatalogueView.prototype._onSearch = function (callback, raw_data) {
        var i, data, offerings;

        if (raw_data.resources) {

            offerings = [];

            for (i = 0; i < raw_data.resources.length; i += 1) {
                offerings.push(new Wirecloud.FiWare.Offering(raw_data.resources[i], this.catalogue));
            }

            data = {
                'resources': offerings,
                'query_results_number': offerings.length,
                'resources_per_page': 10,
                'current_page': 1
            };

            callback(offerings, data);
        }
    };

    FiWareCatalogueView.prototype.getPublishEndpoints = function getPublishEndpoints() {
        var i, stores = [];

        for (i = 0; i < this.store_info.length; i += 1) {
            stores[i] = {
                'label': this.store_info[i].name,
                'value': this.store_info[i].name
            };
        }

        return stores;
    };

    FiWareCatalogueView.prototype.wait_ready = function wait_ready(onComplete) {
        if (typeof onComplete !== 'function') {
            throw new TypeError('invalid onComplete parameter');
        }

        if (this.loading === false) {
            onComplete();
        }

        this.callbacks.push(onComplete);
        if (this.loading === null) {
            this.refresh_store_info();
        }
    };

    FiWareCatalogueView.prototype.refresh_store_info = function refresh_store_info() {
        if (this.loading) {
            return;
        }

        this.loading = true;
        this.store_info = [];
        this.number_of_stores = 0;
        this.storeSelect.clear();
        this.storeSelect.addEntries([{label: gettext('loading...'), value: ''}]);
        this.storeSelect.disable();
        this.catalogue.getStores({
            onSuccess: this.addStoreInfo.bind(this),
            onFailure: this._getStoresErrorCallback.bind(this),
            onComplete: function () {
                for (var i = 0; i < this.callbacks.length; i+= 1) {
                    try {
                        this.callbacks[i]();
                    } catch (e) {}
                }
                this.callbacks = [];
            }.bind(this)
        });
    };

    FiWareCatalogueView.prototype._getStoresErrorCallback = function _getStoresErrorCallback() {
        this.loading = false;
        this.error = true;
        this.storeSelect.clear();
        this.storeSelect.addEntries([{label: gettext('list not available'), value: ''}]);
    };

    FiWareCatalogueView.prototype.addStoreInfo = function (store_info) {
        if (this.isVisible()) {
            this.refresh_search_results();
        }
        this.store_info = store_info;
        this.number_of_stores = store_info.length;

        this.loading = false;
        this.error = false;
        this.storeSelect.clear();
        update_store_list.call(this, store_info);
        this.storeSelect.enable();
    };

    FiWareCatalogueView.prototype.changeCurrentView = function changeCurrentView(view_name, options) {
        if (!(view_name in this.viewsByName)) {
            throw new TypeError();
        }

        if (options == null) {
            options = {
                onComplete: function (alternatives, out_alternative) {
                    var new_status = this.mainview.buildStateData();
                    Wirecloud.HistoryManager.pushState(new_status);
                }.bind(this)
            };
        }

        this.alternatives.showAlternative(this.viewsByName[view_name], options);
    };

    FiWareCatalogueView.prototype.home = function () {
        this.changeCurrentView('search');
    };

    FiWareCatalogueView.prototype.createUserCommand = function (command/*, ...*/) {
        return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    FiWareCatalogueView.prototype.ui_commands = {};

    FiWareCatalogueView.prototype.ui_commands.showDetails = function showDetails(offering, options) {
        if (options == null) {
            options = {};
        }

        return function () {
            var onSuccess = function onSuccess(offering) {
                this.viewsByName.details.paint(offering, {
                        tab: options.tab
                    });
                this.viewsByName.details.repaint();
            };
            var onComplete = function onComplete() {
                this.viewsByName.details.enable();
                Wirecloud.Utils.callCallback(options.onComplete);
            };

            this.viewsByName.details.disable();
            this.changeCurrentView('details');

            if (offering instanceof Wirecloud.FiWare.Offering) {
                onSuccess.call(this, offering);
                onComplete.call(this);
            } else {
                this.catalogue.get_offering_info(offering.store, offering.id, {
                    onSuccess: onSuccess.bind(this),
                    onComplete: onComplete.bind(this)
                });
            }
        }.bind(this);
    };

    FiWareCatalogueView.prototype.ui_commands.buy = function (offering, offering_entry) {
        return function () {
            this.catalogue.start_purchase(offering, {
                onSuccess: function (data) {
                    var dialog = new Wirecloud.ui.ExternalProcessWindowMenu(
                        interpolate(gettext('Buying %(offering)s'), {offering: offering.getDisplayName()}, true),
                        data.url,
                        gettext('The buying process will continue in a separate window. This window will be controled by the store where the offering is hosted. After finishing the buying process, the control will return to Wirecloud.'),
                        {
                            onSuccess: onBuySuccess.bind(this, offering, offering_entry)
                        }
                    );
                    dialog.show();
                }.bind(this)
            });
        }.bind(this);
    };

    FiWareCatalogueView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            this.viewsByName.search.refresh_if_needed();
        }
    };

    FiWareCatalogueView.prototype.refresh_search_results = function () {
        this.viewsByName.search.source.refresh();
    };


    Wirecloud.FiWare.FiWareCatalogueView = FiWareCatalogueView;

    Wirecloud.MarketManager.addMarketType('fiware', 'FI-WARE', FiWareCatalogueView);
})();
