/*
 *     (C) Copyright 2012-2014 Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud, LayoutManagerFactory*/

(function () {

    "use strict";

    var MarketplaceViewMenuItems, clickCallback;

    MarketplaceViewMenuItems = function MarketplaceViewMenuItems(marketplace_view) {
        this.market = marketplace_view;

        StyledElements.DynamicMenuItems.call(this);

        this._click_callback = function _click_callback(menu_context, menu_item_context) {
            marketplace_view.alternatives.showAlternative(menu_item_context);
        };
    };
    MarketplaceViewMenuItems.prototype = new StyledElements.DynamicMenuItems();

    MarketplaceViewMenuItems.prototype.build = function build(context) {
        var current_catalogue, key, items = [], item;

        current_catalogue = this.market.alternatives.getCurrentAlternative();

        // If no view exits no view is pushed
        if (this.market.number_of_alternatives > 0) {

            for (key in this.market.viewsByName) {
                items.push(new StyledElements.MenuItem(this.market.viewsByName[key].getLabel(),
                    this._click_callback,
                    this.market.viewsByName[key]
                ));
            }

            items.push(new StyledElements.Separator());

            if (typeof current_catalogue.show_upload_view === 'function') {
                items.push(new StyledElements.MenuItem(gettext('Upload'), function () {
                    this.show_upload_view();
                }.bind(current_catalogue)));
            }
        }

        if (!this.loading && !this.error) {
            items.push(new StyledElements.MenuItem(gettext('Add new marketplace'), function () {
                var menu, fields, type_entries;

                fields = {
                    'name': {
                        'type': 'text',
                        'label': gettext('Name'),
                        'required': true
                    },
                    'url': {
                        'type': 'text',
                        'label': gettext('URL'),
                        'required': true,
                        'initialValue': 'http://'
                    },
                    'type': {
                        'type': 'select',
                        'initialEntries': Wirecloud.MarketManager.getMarketTypes(),
                        'label': gettext('Type'),
                        'required': true
                    }
                };
                if (Wirecloud.contextManager.get('issuperuser')) {
                    fields['public'] = {
                        'type': 'boolean',
                        'label': gettext('Public')
                    }
                }
                menu = new Wirecloud.ui.FormWindowMenu(fields, gettext('Add Marketplace'));

                // Form data is sent to server
                menu.executeOperation = function (data) {
                    var market_info = {
                        "name": data.name,
                        "options": {
                            "name": data.name,
                            "url": data.url,
                            "type": data.type,
                        }
                    };
                    if (data['public'] === true) {
                        market_info.options['user'] = null;
                    } else {
                        market_info.options['user'] = Wirecloud.contextManager.get('username');
                    }
                    Wirecloud.MarketManager.addMarket(market_info, this.market.addMarket.bind(this.market, market_info.options));
                }.bind(this);

                menu.show();
            }.bind(this)));

            item = new StyledElements.MenuItem(gettext('Delete marketplace'), function () {
                //First ask if the user really wants to remove the marketplace
                var msg = gettext('Do you really want to remove the marketplace "%(marketName)s"?');
                msg = Wirecloud.Utils.interpolate(msg, {'marketName': this.market.alternatives.getCurrentAlternative().getLabel()});
                var dialog = new Wirecloud.ui.AlertWindowMenu();
                dialog.setMsg(msg);
                dialog.setHandler(function () {
                        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Deleting marketplace"), 1);
                        LayoutManagerFactory.getInstance().logSubTask(gettext('Deleting marketplace'));

                        Wirecloud.MarketManager.deleteMarket(this.market.alternatives.getCurrentAlternative().desc, {
                            onSuccess: function () {
                                LayoutManagerFactory.getInstance().logSubTask(gettext('Marketplace deleted successfully'));
                                LayoutManagerFactory.getInstance().logStep('');
                                this.market.refreshViewInfo({
                                    onComplete: function () {
                                        LayoutManagerFactory.getInstance()._notifyPlatformReady();
                                    }
                                });
                            }.bind(this),
                            onFailure: function (msg) {
                                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                                Wirecloud.GlobalLogManager.log(msg);
                                LayoutManagerFactory.getInstance()._notifyPlatformReady();
                            }
                        });
                    }.bind(this));
                dialog.show();
            }.bind(this));
            item.setDisabled(current_catalogue == null || !current_catalogue.catalogue || !current_catalogue.catalogue.isAllow('delete'));
            items.push(item);
        }

        return items;
    };


    Wirecloud.ui.MarketplaceViewMenuItems = MarketplaceViewMenuItems;
})();
