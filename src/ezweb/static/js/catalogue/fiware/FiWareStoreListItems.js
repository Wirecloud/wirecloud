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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global OpManagerFactory, StyledElements*/

var FiWareStoreListItems = function (view) {
    StyledElements.DynamicMenuItems.call(this);

	this.view = view;
	// This function changes the current store when a store is selected in storeMenu 
	this.handler = function(store) {
		this.currentStore = store;
		this.viewsByName['cat-remote'].setCurrentStore(this.currentStore);
		LayoutManagerFactory.getInstance().header.refresh();
	};
};
FiWareStoreListItems.prototype = new StyledElements.DynamicMenuItems();

FiWareStoreListItems.prototype.build = function (store_info) {
    var workspace_keys, i, items, workspace;

    items = [];

	for (i = 0; i < store_info.length; i += 1) {
        items.push(new StyledElements.MenuItem(
            store_info[i].name,
            this.handler.bind(this.view, store_info[i].name)
        ));
    }

	items.push(new StyledElements.Separator());

	// This is used to delete the current store and update store list
	if (this.view.currentStore !== 'All stores') {
		items.push(new StyledElements.MenuItem(gettext('Delete'), function () {
			this.fiWareCatalogue.delete_store(this.currentStore);
			this.currentStore = 'All stores';
			this.viewsByName['cat-remote'].setCurrentStore(this.currentStore);
			this.refresh_store_info(); 
			LayoutManagerFactory.getInstance().header.refresh();
		}.bind(this.view)));
	}

	// To add a new store is necesary to have a form in order to take the information
	items.push(new StyledElements.MenuItem(gettext('Add store'), function () {
		
		menu = new CreateWindowMenu();
		menu.setTitle(gettext('Add Store'));

		url_label = document.createElement('label');
		url_label.appendChild(document.createTextNode(gettext('URI: ')));
		store_url = document.createElement('input');
		Element.extend(store_url);
		store_url.setAttribute('type','text');
		store_url.value='http://'
		url_label.appendChild(store_url);

		menu.windowContent.appendChild(url_label);

		// Form data is sent to server
		menu.operationHandler = function(e){
			var store_uri, store_name;
			store_uri = store_url.value;
			store_name = menu.nameInput.value;
			Event.stop(e);
			menu.hide();
			this.fiWareCatalogue.add_store(store_name,store_uri, this.refresh_store_info.bind(this));
			
		}.bind(this);

		menu.button.observe("click", menu.operationHandler);
		menu.show();

    }.bind(this.view)));

    return items;
};
