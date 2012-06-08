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

/*global gettext, StyledElements, Wirecloud, FormWindowMenu, LayoutManagerFactory*/

if (!Wirecloud.ui) {
    Wirecloud.ui = {};
}

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
        var current_catalogue, key, items = [];

        // If no view exits no view is pushed
        if (this.market.number_of_alternatives > 0) {
            current_catalogue = this.market.alternatives.getCurrentAlternative();

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
        } else {
            items.push(new StyledElements.MenuItem(gettext('No marketplace registered'), function () { }));
            items.push(new StyledElements.Separator());
        }

        items.push(new StyledElements.MenuItem(gettext('Add new marketplace'), function () {
            var menu, fields, type_entries;
            //type_entries = this.market.market_types;

            fields = {
                'label': {
                    'type': 'text',
                    'label': gettext('Name'),
                    'required': true
                },
                'display_name': {
                    'type': 'text',
                    'label': gettext('Label'),
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
                    'initialEntries': [{
                        'label': 'Wirecloud',
                        'value': 'wirecloud'
                    },
                        {'label': 'Fi-ware',
                        'value': 'fiware'}],
                    'label': gettext('Type'),
                    'required': true
                }
            };
            menu = new FormWindowMenu(fields, gettext('Add Marketplace'));

            // Form data is sent to server
            menu.executeOperation = function (data) {
                var market_info = {
                    "name": data.label,
                    "options": {
                        "label": data.display_name,
                        "url": data.url,
                        "type": data.type
                    }
                };
                Wirecloud.MarketManager.addMarket(market_info, this.market.refreshViewInfo.bind(this.market));
            }.bind(this);

            menu.show();
        }.bind(this)));

        if (this.market.number_of_alternatives > 1) {
            items.push(new StyledElements.MenuItem(gettext('Delete marketplace'), function () {
                //First ask if the user really wants to remove the marketplace
                LayoutManagerFactory.getInstance().showYesNoDialog(gettext('Do you really want to remove the marketplace ') + this.market.alternatives.getCurrentAlternative().getLabel() + '?',
                function () {
                    Wirecloud.MarketManager.deleteMarket(this.market.alternatives.getCurrentAlternative().getLabel(), this.market.refreshViewInfo.bind(this.market));

                }.bind(this));
            }.bind(this)));
        }

        return items;
    };


    Wirecloud.ui.MarketplaceViewMenuItems = MarketplaceViewMenuItems;
})();
