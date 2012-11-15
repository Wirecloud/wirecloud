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

/*global Event, OpManagerFactory, StyledElements, gettext, interpolate, LayoutManagerFactory, CatalogueSearchView, FiWareResourceDetailsView, FiWareCataloguePublishView, FiWareCatalogue, Wirecloud, FiWareCatalogueResource, ShowcaseFactory, FiWareStoreListItems*/

(function () {

    "use strict";

    var FiWareCatalogueView = function (id, options) {
        options.class = 'catalogue fiware';
        StyledElements.Alternative.call(this, id, options);

        this.alternatives = new StyledElements.StyledAlternatives();
        this.appendChild(this.alternatives);
        this.currentStore = 'All stores';
        Object.defineProperty(this, 'desc', {value: options.marketplace_desc});
        this.marketplace = this.desc.name;
        this.loading = false;
        this.error = false;
        this.store_info = [];

        this.viewsByName = {
            'search': this.alternatives.createAlternative({alternative_constructor: CatalogueSearchView, containerOptions: {catalogue: this, resource_painter: Wirecloud.ui.ResourcePainter}}),
            'details': this.alternatives.createAlternative({alternative_constructor: Wirecloud.FiWare.ui.ResourceDetailsView, containerOptions: {catalogue: this}}),
            'publish': this.alternatives.createAlternative({alternative_constructor: FiWareCataloguePublishView, containerOptions: {catalogue: this}})
        };
        this.viewsByName.search.init();

        this.fiWareCatalogue = new Wirecloud.FiWare.FiWareCatalogue(this.desc);
        this.number_of_stores = 0;
        this.generateStoreMenu();
        this.addEventListener('show', this.refresh_if_needed.bind(this));
    };

    FiWareCatalogueView.prototype = new StyledElements.Alternative();

    FiWareCatalogueView.prototype.getLabel = function () {
        return this.marketplace;
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

    FiWareCatalogueView.prototype.search = function search(onSuccess, onFailure, options) {
        this.fiWareCatalogue.search(this._onSearch.bind(this, onSuccess), onFailure, options);
    };

    FiWareCatalogueView.prototype._onSearch = function (callback, raw_data) {
        var preferred_versions, i, data, key, resources, resource, fiWareCatalogue;

        if (raw_data.resources) {
            preferred_versions = Wirecloud.utils.CookieManager.readCookie('preferred_versions', true);

            if (preferred_versions === null) {
                preferred_versions = {};
            }

            resources = [];

            for (i = 0; i < raw_data.resources.length; i += 1) {
                resource = new FiWareCatalogueResource(raw_data.resources[i]);
                resources.push(resource);
                key = resource.getVendor() + '/' + resource.getName();
                if (key in preferred_versions) {
                    resource.changeVersion(preferred_versions[key]);
                }
            }

            data = {
                'resources': resources,
                'preferred_versions': preferred_versions,
                'query_results_number': resources.length,
                'resources_per_page': 10,
                'current_page': 1
            };

            callback(data, data);
        }
    };

    FiWareCatalogueView.prototype.instantiate = function (resource) {
        //is mashup?
        if (resource.isMashup()) {
            (new Wirecloud.ui.InstantiateMashupWindowMenu(resource)).show();
        } else {
            ShowcaseFactory.getInstance().addWidget(
                resource.getVendor(),
                resource.getName(),
                resource.getVersion().text,
                resource.getUriTemplate(),
                {packaged: false}
            );
        }
    };

    FiWareCatalogueView.prototype.getExtraBreadcrum = function () {
        var label = this.currentStore;

        if (this.loading) {
            label = gettext('loading...');
        } else if (this.error) {
            label = gettext('list not available');
        } else if (this.number_of_stores === 0) {
            label = gettext('no registered stores');
        }
        return [{
            'label': label,
            'menu': this.storeMenu
        }];
    };

    FiWareCatalogueView.prototype.getPublishEndpoint = function getPublishEndpoint() {
        var i, form, stores = [];

        form = [{
            'name': this.marketplace,
            'label': this.marketplace,
            'type': 'boolean'
        }];

        for (i = 0; i < this.store_info.length; i += 1) {
            stores[i] = {
                'label': this.store_info[i].name,
                'value': this.store_info[i].name
            };
        }

        form[1] = {
            'name': this.marketplace + 'Store',
            'label': this.marketplace + ' store',
            'type': 'select',
            'initialEntries': stores
        };
        return form;
    };

    FiWareCatalogueView.prototype.getPublishData = function getPublishData(data) {
        var publishData = [];

        if (data[this.marketplace]) {
            publishData = [{
                'market': this.marketplace,
                'store': data[this.marketplace + 'Store']
            }];
        }
        return publishData;
    };

    FiWareCatalogueView.prototype.refresh_store_info = function refresh_store_info() {
        if (this.loading) {
            return;
        }

        this.loading = true;
        this.store_info = [];
        this.number_of_stores = 0;
        LayoutManagerFactory.getInstance().header.refresh();
        this.fiWareCatalogue.getStores(this.addStoreInfo.bind(this), this._getStoresErrorCallback.bind(this));
    };

    FiWareCatalogueView.prototype._getStoresErrorCallback = function _getStoresErrorCallback() {
        this.loading = false;
        this.error = true;
        LayoutManagerFactory.getInstance().header.refresh();
    };

    FiWareCatalogueView.prototype.addStoreInfo = function (store_info) {
        this.refresh_search_results();
        this.store_info = store_info;
        this.number_of_stores = store_info.length;
        this.storeMenu.setContext(store_info);

        this.loading = false;
        this.error = false;
        LayoutManagerFactory.getInstance().header.refresh();
    };

    FiWareCatalogueView.prototype.generateStoreMenu = function () {
        this.storeMenu = new StyledElements.PopupMenu();

        this.refresh_store_info();

        this.storeMenu.append(new FiWareStoreListItems(this));
    };

    FiWareCatalogueView.prototype.changeCurrentView = function (view_name) {
        if (!(view_name in this.viewsByName)) {
            throw new TypeError();
        }

        this.alternatives.showAlternative(this.viewsByName[view_name]);
    };

    FiWareCatalogueView.prototype.home = function () {
        this.changeCurrentView('search');
    };

    FiWareCatalogueView.prototype.createUserCommand = function (command/*, ...*/) {
        return this.ui_commands[command].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    FiWareCatalogueView.prototype.ui_commands = {};

    FiWareCatalogueView.prototype.ui_commands.instantiate = function (resource) {
        return function (e) {
            this.instantiate(resource);
            LayoutManagerFactory.getInstance().changeCurrentView('workspace');
        }.bind(this);
    };

    FiWareCatalogueView.prototype.ui_commands.showDetails = function (resource) {
        return function (e) {
            Event.stop(e);
            this.viewsByName.details.paint(resource);
            this.alternatives.showAlternative(this.viewsByName.details);
        }.bind(this);
    };

    FiWareCatalogueView.prototype.ui_commands.publish = function (resource) {
        return function (e) {
            this.alternatives.showAlternative(this.viewsByName.publish);
        }.bind(this);
    };

    FiWareCatalogueView.prototype.ui_commands.delete = function (resource, options) {
        // First ask the user
        var context, doRequest, msg;

        msg = gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") widget?');
        context = {
            name: resource.getName(),
            vendor: resource.getVendor(),
            version: resource.getVersion().text
        };

        options.onSuccess = this.refresh_search_results.bind(this);
        options.onComplete = this.home.bind(this);

        doRequest = function () {
            this.fiWareCatalogue.deleteResource(options);
        };

        msg = interpolate(msg, context, true);

        return function () {
            LayoutManagerFactory.getInstance().showYesNoDialog(msg, doRequest.bind(this));
        }.bind(this);
    };

    FiWareCatalogueView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.alternatives.getCurrentAlternative() === this.viewsByName.search) {
            this.viewsByName.search.refresh_if_needed();
        }
    };

    FiWareCatalogueView.prototype.refresh_search_results = function () {
        this.viewsByName.search.pagination.refresh();
    };


    Wirecloud.FiWare.FiWareCatalogueView = FiWareCatalogueView;

    Wirecloud.MarketManager.addMarketType('fiware', 'FiWare', FiWareCatalogueView);
})();
