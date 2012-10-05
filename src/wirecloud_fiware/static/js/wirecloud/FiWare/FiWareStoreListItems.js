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

/*global OpManagerFactory, StyledElements, gettext, LayoutManagerFactory, FormWindowMenu*/

var FiWareStoreListItems = function FiWareStoreListItems(view) {
    StyledElements.DynamicMenuItems.call(this);

    this.view = view;
    // This function changes the current store when a store is selected in storeMenu
    this.handler = function (store) {
        this.currentStore = store;
        this.refresh_search_results();
        LayoutManagerFactory.getInstance().header.refresh();
    };
};
FiWareStoreListItems.prototype = new StyledElements.DynamicMenuItems();

FiWareStoreListItems.prototype.build = function build(store_info) {
    var workspace_keys, i, items, workspace;
    items = [];

    if (this.view.number_of_stores > 0) {
        items.push(new StyledElements.MenuItem(gettext('All stores'), function () {
            this.currentStore = 'All stores';
            this.refresh_search_results();
            LayoutManagerFactory.getInstance().header.refresh();
        }.bind(this.view)));

        items.push(new StyledElements.Separator());

        for (i = 0; i < store_info.length; i += 1) {
            items.push(new StyledElements.MenuItem(
                store_info[i].name,
                this.handler.bind(this.view, store_info[i].name)
            ));
        }

        items.push(new StyledElements.Separator());
    }

    items.push(new StyledElements.MenuItem(gettext('Refresh store list'), function () {
        this.refresh_store_info();
    }.bind(this.view)));

    if (!this.view.loading && this.view.number_of_stores > 0 && this.view.currentStore !== 'All stores') {
        // This is used to delete the current store
        items.push(new StyledElements.MenuItem(gettext('Delete store'), function () {
            //First ask if the user really wants to remove the store
            LayoutManagerFactory.getInstance().showYesNoDialog(gettext('Do you really want to remove the store ') + this.currentStore + '?',
            function () {
                this.fiWareCatalogue.delete_store(this.currentStore, this.refresh_store_info.bind(this));
                this.currentStore = 'All stores';
                this.number_of_stores -= 1;
            }.bind(this));
        }.bind(this.view)));

        items.push(new StyledElements.MenuItem(gettext('Publish service'),
        this.view.createUserCommand('publish')));
    }

    if (!this.view.loading && !this.view.error) {
        items.push(new StyledElements.Separator());

        // To add a new store is necesary to have a form in order to take the information
        items.push(new StyledElements.MenuItem(gettext('Add store'), function () {

            var menu, fields = {
                'label': {
                    'type': 'text',
                    'label': gettext('Name'),
                    'required': true
                },
                'uri': {
                    'type': 'text',
                    'label': gettext('URI'),
                    'required': true,
                    'initialValue': 'http://'
                }
            };
            menu = new FormWindowMenu(fields, gettext('Add Store'));

            // Form data is sent to server
            menu.executeOperation = function (data) {

                if (this.number_of_stores === 0) {
                    this.currentStore = 'All stores';
                }

                this.fiWareCatalogue.add_store(data.label, data.uri, this.refresh_store_info.bind(this));
            }.bind(this);

            menu.show();

        }.bind(this.view)));
    }

    return items;
};
