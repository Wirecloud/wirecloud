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

/*global StyledElements, LayoutManagerFactory, Wirecloud, gettext*/

(function () {

    "use strict";

    var MarketplaceView, onGetStoresSuccess, onGetStoresFailure, onGetStoresComplete;

    onGetStoresSuccess = function onGetStoresSuccess(options, view_info) {
        var info, old_views, view_element, view_constructor, first_element = null;

        this.loading = false;
        this.error = false;

        old_views = this.viewsByName;
        this.viewsByName = {};

        for (info in view_info) {

            view_element = view_info[info];

            if (info in old_views) {
                this.viewsByName[info] = old_views[info];
                delete old_views[info];
            } else {
                view_constructor = Wirecloud.MarketManager.getMarketViewClass(view_element.type);
                this.viewsByName[info] = this.alternatives.createAlternative({alternative_constructor: view_constructor, containerOptions: {catalogue: this, marketplace_desc: view_element}});
            }

            this.number_of_alternatives += 1;
            if (first_element === null) {
                first_element = this.viewsByName[info];
            }
        }

        for (info in old_views) {
            this.alternatives.removeAlternative(old_views[info]);
            old_views[info].destroy();
        }

        if (this.isVisible()) {
            if (this.alternatives.getCurrentAlternative() === this.emptyAlternative) {
                this.alternatives.showAlternative(this.viewsByName.local);
            } else {
                // Refresh wirecloud header as current marketplace may have been changed
                LayoutManagerFactory.getInstance().header.refresh();
            }
        }

        if (typeof options.onSuccess === 'function') {
            options.onSuccess();
        }
    };

    onGetStoresFailure = function onGetStoresFailure(options, msg) {
        this.loading = false;
        this.error = true;

        LayoutManagerFactory.getInstance().header.refresh();
        if (typeof options.onFailure === 'function') {
            options.onFailure();
        }
    };

    onGetStoresComplete = function onGetStoresComplete(options) {
        var i;

        for (i = 0; i < this.callbacks.length; i+= 1) {
            try {
                this.callbacks[i]();
            } catch (e) {}
        }
        this.callbacks = [];

        if (typeof options.onComplete === 'function') {
            options.onComplete();
        }
    };


    MarketplaceView = function MarketplaceView(id, options) {
        options.id = 'marketplace';
        StyledElements.Alternative.call(this, id, options);

        this.viewsByName = {};
        this.alternatives = new StyledElements.StyledAlternatives();
        this.emptyAlternative = this.alternatives.createAlternative();
        this.alternatives.addEventListener('postTransition', function () {
            LayoutManagerFactory.getInstance().header.refresh();
        });
        this.appendChild(this.alternatives);

        this.marketMenu = new StyledElements.PopupMenu();
        this.marketMenu.append(new Wirecloud.ui.MarketplaceViewMenuItems(this));

        this.addEventListener('show', function (view) {
            if (view.loading === null) {
                Wirecloud.MarketManager.getMarkets(onGetStoresSuccess.bind(view, {}), onGetStoresFailure.bind(view, {}), onGetStoresComplete.bind(view, {}));
                view.loading = true;
            }

            if (view.loading === false && !view.error) {
                if (view.alternatives.getCurrentAlternative() === view.emptyAlternative) {
                    view.alternatives.showAlternative(view.viewsByName.local);
                } else {
                    view.alternatives.getCurrentAlternative().refresh_if_needed();
                }
            }
        });

        this.number_of_alternatives = 0;
        this.loading = null;
        this.error = false;
        this.callbacks = [];
    };

    MarketplaceView.prototype = new StyledElements.Alternative();

    MarketplaceView.prototype.view_name = 'marketplace';

    MarketplaceView.prototype.getBreadcrum = function () {
        var label, breadcrum, user;

        user = null;
        if (this.loading !== false || (!this.error && this.alternatives.getCurrentAlternative() === this.emptyAlternative)) {
            label = gettext('loading...');
        } else if (this.error) {
            label = gettext('list not available');
        } else if (this.number_of_alternatives > 0) {
            label = this.alternatives.getCurrentAlternative().getLabel();
            user = this.alternatives.getCurrentAlternative().desc.user;
        } else {
            label = gettext('no registered marketplace');
        }

        breadcrum = [{'label': 'marketplace'}];
        if (user != null) {
            breadcrum.push({'label': user});
        }

        breadcrum.push({
            'label': label,
            'menu': this.marketMenu
        });

        return breadcrum;
    };

    MarketplaceView.prototype.waitMarketListReady = function waitMarketListReady(callback) {
        if (this.loading === false) {
            callback();
            return;
        }

        this.callbacks.push(callback);
        if (this.loading === null) {
            Wirecloud.MarketManager.getMarkets(onGetStoresSuccess.bind(this, {}), onGetStoresFailure.bind(this, {}), onGetStoresComplete.bind(this, {}));
            this.loading = true;
        }
    };

    MarketplaceView.prototype.refreshViewInfo = function refreshViewInfo(options) {

        if (this.loading === true) {
            return;
        }

        if (typeof options !== 'object') {
            options = {};
        }

        this.loading = true;
        LayoutManagerFactory.getInstance().header.refresh();

        this.number_of_alternatives = 0;

        Wirecloud.MarketManager.getMarkets(onGetStoresSuccess.bind(this, options), onGetStoresFailure.bind(this, options), onGetStoresComplete.bind(this, options));
    };

    MarketplaceView.prototype.addMarket = function addMarket(market_info) {
        var view_constructor = Wirecloud.MarketManager.getMarketViewClass(market_info.type);
        market_info.permissions = {'delete': true};
        this.viewsByName[market_info.name] = this.alternatives.createAlternative({alternative_constructor: view_constructor, containerOptions: {catalogue: this, marketplace_desc: market_info}});

        this.number_of_alternatives += 1;
        this.alternatives.showAlternative(this.viewsByName[market_info.name]);
    };

    window.MarketplaceView = MarketplaceView;
})();
