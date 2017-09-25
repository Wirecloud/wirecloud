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

/* globals StyledElements, Wirecloud */


(function (se, utils) {

    "use strict";

    var MarketplaceViewMenuItems;

    MarketplaceViewMenuItems = function MarketplaceViewMenuItems(marketplace_view) {
        this.market = marketplace_view;

        StyledElements.DynamicMenuItems.call(this);

        this._click_callback = function _click_callback(menu_context, menu_item_context) {
            marketplace_view.changeCurrentMarket(menu_item_context);
        };
    };
    MarketplaceViewMenuItems.prototype = new StyledElements.DynamicMenuItems();

    MarketplaceViewMenuItems.prototype.build = function build(context) {
        var current_catalogue, catalogue, items = [], item, i;

        current_catalogue = this.market.alternatives.getCurrentAlternative();

        // If no view exits no view is pushed
        if (this.market.number_of_alternatives > 0) {

            for (i = 0; i < this.market.viewList.length; i++) {
                catalogue = this.market.viewList[i];
                items.push(new StyledElements.MenuItem(catalogue.getLabel(),
                    this._click_callback,
                    catalogue.market_id
                ));
            }

            items.push(new StyledElements.Separator());

            if (typeof current_catalogue.show_upload_view === 'function') {
                items.push(new StyledElements.MenuItem(utils.gettext('Upload'), function () {
                    this.show_upload_view();
                }.bind(current_catalogue)));
            }
        }

        if (!this.loading && !this.error) {
            item = new StyledElements.MenuItem(utils.gettext('Add new marketplace'), function () {
                var menu, fields;

                fields = {
                    'title': {
                        'type': 'text',
                        'label': utils.gettext('Name'),
                        'required': true
                    },
                    'url': {
                        'type': 'text',
                        'label': utils.gettext('URL'),
                        'required': true,
                        'initialValue': 'http://'
                    },
                    'type': {
                        'type': 'select',
                        'initialEntries': Wirecloud.MarketManager.getMarketTypes(),
                        'label': utils.gettext('Type'),
                        'required': true
                    }
                };
                if (Wirecloud.contextManager.get('issuperuser')) {
                    fields.public = {
                        'type': 'boolean',
                        'label': utils.gettext('Public')
                    };
                }
                menu = new Wirecloud.ui.FormWindowMenu(fields, utils.gettext('Add marketplace'), 'wc-add-external-catalogue-modal');

                // Form data is sent to server
                menu.executeOperation = (data) => {
                    data.name = URLify(data.title);
                    data.user = Wirecloud.contextManager.get("username");
                    var task = Wirecloud.MarketManager.addMarket(data);
                    // TODO move to use events
                    task.then(() => {
                        this.market.addMarket(data);
                    });
                    return task;
                };

                menu.show();
            }.bind(this));
            item.addIconClass('fa fa-plus');
            items.push(item);

            item = new StyledElements.MenuItem(utils.gettext('Delete marketplace'), function () {
                // First ask if the user really wants to remove the marketplace
                var msg = utils.gettext('Do you really want to remove the marketplace "%(marketName)s"?');
                msg = utils.interpolate(msg, {'marketName': this.market.alternatives.getCurrentAlternative().getLabel()});
                var dialog = new Wirecloud.ui.AlertWindowMenu();
                dialog.setMsg(msg);
                dialog.setHandler(function () {
                    Wirecloud.UserInterfaceManager.monitorTask(
                        Wirecloud.MarketManager.deleteMarket(this.market.alternatives.getCurrentAlternative().desc)
                            .then(this.market.refreshViewInfo.bind(this.market))
                            .catch(function (error) {
                                (new Wirecloud.ui.MessageWindowMenu(error, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
                                Wirecloud.GlobalLogManager.log(error);
                            })
                    );
                }.bind(this));
                dialog.show();
            }.bind(this));
            item.addIconClass('fa fa-trash');
            item.setDisabled(current_catalogue == null || current_catalogue.isAllow == null || !current_catalogue.isAllow('delete'));
            items.push(item);
        }

        return items;
    };


    Wirecloud.ui.MarketplaceViewMenuItems = MarketplaceViewMenuItems;
})(StyledElements, Wirecloud.Utils);
