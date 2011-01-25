/* 
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/**
 * Base class for managing window menus whose HTML code is in templates/index.html.
 */
  
function WindowMenu(title) {
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	this.childWindow = null;
	this.htmlElement = document.createElement('div');  // create the root HTML element
	Element.extend(this.htmlElement);
	this.htmlElement.className = "window_menu";

	// Window Top
	var windowTop = document.createElement('div');
	windowTop.className = "window_top";
	this.htmlElement.appendChild(windowTop);

	this._closeListener = this._closeListener.bind(this);
	this.closeButton = document.createElement('a');
	Element.extend(this.closeButton);
	this.closeButton.type = "button";
	this.closeButton.className = "closebutton";
	windowTop.appendChild(this.closeButton);
	this.closeButton.observe("click", this._closeListener);

	this.titleElement = document.createElement('div');
	Element.extend(this.titleElement);
	this.titleElement.className = "window_title";
	windowTop.appendChild(this.titleElement);

	var clearer = document.createElement('div');
	Element.extend(clearer);
	clearer.addClassName("floatclearer");
	windowTop.appendChild(clearer);

	// Window Content
	this.windowContent = document.createElement('div');
	Element.extend(this.windowContent);
	this.windowContent.className = "window_content";
	this.htmlElement.appendChild(this.windowContent);

	this.msgElement = document.createElement('div');
	Element.extend(this.msgElement);
	this.msgElement.className = "msg";
	this.windowContent.appendChild(this.msgElement);

	// Window Bottom
	this.windowBottom = document.createElement('div');
	Element.extend(this.windowBottom);
	this.windowBottom.className = "window_bottom";
	this.htmlElement.appendChild(this.windowBottom);

	// Initial title
	this.titleElement.update(title);
}

/**
 * @private
 *
 * Click Listener for the close button.
 */
WindowMenu.prototype._closeListener = function(e) {
	this.hide();
}

/**
 * Updates the message displayed by this <code>WindowMenu</code>
 */
WindowMenu.prototype.setMsg = function (msg) {
	this.msgElement.update(msg);

	if (this.htmlElement.parentNode !== null)
		this.calculatePosition();
}

/**
 * @private
 *
 * Calculates a usable absolute position for the window
 */
WindowMenu.prototype.calculatePosition = function() {
	var coordenates = [];

	var windowHeight = BrowserUtilsFactory.getInstance().getHeight();
	var windowWidth = BrowserUtilsFactory.getInstance().getWidth();

	this.htmlElement.setStyle({'max-height' : 'none'});
	var menuHeight = this.htmlElement.getHeight();
	var menuWidth = this.htmlElement.getWidth();
	
	if (menuWidth > windowWidth/2) {
		menuWidth = windowWidth/2; //IE6 hack
		this.htmlElement.setStyle({'width': menuWidth+'px'});
	}

	coordenates[1] = windowHeight/2 - menuHeight/2;
	coordenates[0] = windowWidth/2 - menuWidth/2;

	if (windowHeight < menuHeight) {
		var windowStyle = document.defaultView.getComputedStyle(this.htmlElement, null);

		var padding;
		padding = windowStyle.getPropertyCSSValue("padding-top").
		          getFloatValue(CSSPrimitiveValue.CSS_PX);
		padding+= windowStyle.getPropertyCSSValue("padding-bottom").
		          getFloatValue(CSSPrimitiveValue.CSS_PX);

		this.htmlElement.setStyle({'max-height': windowHeight - padding + 'px',
		                           'top': '0px'});
	} else {
		this.htmlElement.style.top = coordenates[1]+"px";
	}
	this.htmlElement.style.left = coordenates[0]+"px";

	if (this.childWindow != null) {
	    this.childWindow.calculatePosition();
	}
}

/**
 *
 */
WindowMenu.prototype.setHandler = function (handler) {
	this.operationHandler = handler;
}

/**
 * Makes this WindowMenu visible.
 *
 * @param parentWindow
 */
WindowMenu.prototype.show = function (parentWindow) {
	this._parentWindowMenu = parentWindow;

	if (this._parentWindowMenu != null) {
		this._parentWindowMenu._addChildWindow(this);
	}

	document.body.insertBefore(this.htmlElement, $("header"));
	this.calculatePosition();
	this.htmlElement.style.display = "block";
	this.setFocus();
}

/**
 * Makes this WindowMenu hidden.
 */
WindowMenu.prototype.hide = function () {
	if (this.htmlElement.parentNode == null) {
		// This windowmenu is currently hidden => Nothing to do
		return;
	}

	this.htmlElement.parentNode.removeChild(this.htmlElement);
	this.msgElement.update();
	if (this.childWindow != null) {
	    this.childWindow.hide();
	}
	
	if (this._parentWindowMenu != null) {
		this._parentWindowMenu._removeChildWindow(this);
		this._parentWindowMenu = null;
	} else {
		LayoutManagerFactory.getInstance().hideCover();
	}
}

WindowMenu.prototype._addChildWindow = function (windowMenu) {
	this.childWindow = windowMenu;
};

WindowMenu.prototype._removeChildWindow = function (windowMenu) {
	if (this.childWindow === windowMenu) {
		this.childWindow = null;
	}
};

WindowMenu.prototype.setFocus = function () {
}

/**
*
*/
function ContratationWindow() {
	WindowMenu.call(this, gettext('Contratation Information'));

	this.iframe = document.createElement('iframe');
	this.iframe.setAttribute('src', '');
	this.iframe.setAttribute('width', 480);
	this.iframe.setAttribute('height', 550);
	this.windowContent.appendChild(this.iframe);
	
	// Finish button
	this.acceptButton = document.createElement('button');
	this.acceptButton.appendChild(document.createTextNode(gettext('Finish')));
	this._acceptListener = this._acceptListener.bind(this);
	this.acceptButton.observe("click", this._acceptListener);
	this.windowBottom.appendChild(this.acceptButton);
}

ContratationWindow.prototype = new WindowMenu();

ContratationWindow.prototype.setSrc = function(src) {
	this.iframe.src=src;
}

ContratationWindow.prototype.setCloseListener = function(closeListener) {
	this._closeListener = closeListener;
}

ContratationWindow.prototype.setHandler = function(acceptHandler) {
	this.acceptHandler = acceptHandler;
}

ContratationWindow.prototype._acceptListener = function(e) {
	this.acceptHandler();
	this.hide();
}

/**
*
*/
function AddingGadgetToApplicationWindow(service_facade) {
	WindowMenu.call(this, gettext('Assign Gadget to Application'));
	
	this.service_facade = service_facade;

	this.content = document.createElement('div');
	this.content.setAttribute('id', 'gadgetToAppWindow');
	Element.extend(this.content);
	
	this.content.innerHTML = '<b>Application:</b> <select class="app_appList"></select><br /><br /><div class="app_info"><b>Name:</b><div class="app_name"></div><b>Vendor:</b><div class="app_vendor"></div><b>Business model:</b><div class="app_business">App Business Model</div><b>List of Gadgets:</b><div class="app_gadgets"></div><b>Description:</b><div class="app_desc"></div></div><div class="app_img_container"><img class="app_image app_img" src="" /></div><div class="app_gadgets_desc"></div>';
	
	document.body.insertBefore(this.htmlElement, $("header"));
	
	this.windowContent.appendChild(this.content);
	
	this.link = document.createElement('div');
	this.link.className = ('show_external_link');
	
	this.link.innerHTML = '<a style="float: right; padding-top: 5px;" target="_blank" href="http://emarketplace1.hi.inet:3980/BOCL/BMPS_BOCL.html">View business model description</a>'
	
	this.windowContent.appendChild(this.link);
	
	this.app_select = this.content.getElementsBySelector('.app_appList')[0];
	this.app_name = this.content.getElementsBySelector('.app_name')[0];
	this.app_vendor = this.content.getElementsBySelector('.app_vendor')[0];
	this.app_image = this.content.getElementsBySelector('.app_img')[0];
	this.app_desc = this.content.getElementsBySelector('.app_desc')[0];
	this.app_gadgets = this.content.getElementsBySelector('.app_gadgets')[0];
	
	var catalogue = CatalogueFactory.getInstance();
	var apps = catalogue.get_available_apps();
	
	var select_options = "";
	
	for (var i=0; i<apps.length; i++) {
		var app = apps[i];
		var select_option = '<option value="' + app['app_code'] + '">' + app['short_name'] + '</option>'; 
		
		select_options += select_option;
	}
	
	this.app_select.innerHTML = select_options;
	
	Event.observe(this.app_select, 'change', function () { this.update_window() }.bind(this));
	
	// Finish button
	this.acceptButton = document.createElement('button');
	this.acceptButton.appendChild(document.createTextNode(gettext('Assign')));
	
	this._acceptListener = this._acceptListener.bind(this);
	this.acceptButton.observe("click", this._acceptListener);
	
	this.windowBottom.appendChild(this.acceptButton);
}

AddingGadgetToApplicationWindow.prototype = new WindowMenu();

AddingGadgetToApplicationWindow.prototype._acceptListener = function(e) {
	this.service_facade.add_gadget_to_app(this._gadget, this._appId);
	this.hide();
}

AddingGadgetToApplicationWindow.prototype.setExtraData = function(resource) {
	this._gadgetId = resource.getId();
	this._gadget = resource;
	
	this.update_window();
}

AddingGadgetToApplicationWindow.prototype._closeListener = function(e) {
	
}

AddingGadgetToApplicationWindow.prototype.update_window = function() {
	var selectedIndex = this.app_select.selectedIndex;
	
	if (selectedIndex != -1) {
		this._appId = this.app_select[selectedIndex].value;
		
		var apps = CatalogueFactory.getInstance().get_available_apps();
		
		var app = apps[selectedIndex];
		
		this.app_name.innerHTML = app['name'];
		this.app_vendor.innerHTML = app['vendor'];
		this.app_gadgets.innerHTML = app['gadget_list'];
		this.app_desc.innerHTML = app['description'];
		this.app_image.setAttribute('src', app['image_uri']);
	} 
}

/**
*
*/
function BuyingApplicationWindow(service_facade) {
	WindowMenu.call(this, gettext('Buying composed application'));
	
	this.service_facade = service_facade;

	// Text messages for SOLUTIONS
	this.text_introduction_solution = gettext("Buying this composed solution implies paying for the following applications.");
	this.text_hint_solution = gettext("Click on any of them to see a detailed description, including princing info.");
	
	// Text messages for GADGETS
	this.text_introduction_gadget = gettext("Buying this gadget implies paying for the following application.");
	this.text_hint_gadget = gettext("Click on it to see a detailed description, including princing info.");

	this.content = document.createElement('div');
	Element.extend(this.content);
	
	this.text_message = document.createElement('div');
	Element.extend(this.text_message);
	this.text_message.className = "purchase_window_text";
	this.content.appendChild(this.text_message);
	
	document.body.insertBefore(this.htmlElement, $("header"));
	this.windowContent.appendChild(this.content);
	
	this.help_menu = document.createElement('div');
	Element.extend(this.help_menu);
	this.help_menu.className = "help_text_disabled";
	document.body.insertBefore(this.help_menu, $("header"));
	
	this._apps_table = document.createElement('div');
	this.content.appendChild(this._apps_table);
	
	this.table_html = '<center><table cellpadding="0px" cellspacing="0px" id="purchase_window_table" class="purchase_window_table"><thead><th class="app_name">' + gettext("Name") + '</th><th class="app_signup_price">' + gettext("Sign-up fee") + '</th><th class="app_monthly_price">' + gettext("Monthly fee") + '</th></thead>';
	
	// Finish button
	this.acceptButton = document.createElement('button');
	this.acceptButton.appendChild(document.createTextNode(gettext('Buy')));
	
	this.acceptButton.className = 'contratable';
	
	this._acceptListener = this._acceptListener.bind(this);
	this.acceptButton.observe("click", this._acceptListener);
	
	this.windowBottom.appendChild(this.acceptButton);
}

BuyingApplicationWindow.prototype = new WindowMenu();

BuyingApplicationWindow.prototype.setCloseListener = function(closeHandler) {
	this._closeHandler = closeHandler;
}

BuyingApplicationWindow.prototype.setHandler = function(acceptHandler) {
	this.acceptHandler = function(){this.hideApplicationPopUp(this.help_menu); acceptHandler(this._resource);}.bind(this);
}

BuyingApplicationWindow.prototype._acceptListener = function(e) {
	this.service_facade.buy_resource_applications(this._resource);
	this.hide();
}

BuyingApplicationWindow.prototype._closeListener = function(e) {
	this.hideApplicationPopUp(this.help_menu);
	this.hide();
}

BuyingApplicationWindow.prototype.setExtraData = function(extra_data) {
	this.show();
	this._resource = extra_data;
	
	if (this._resource.isMashup()) {
		this.titleElement.update(gettext('Buying composed application'));
		this.text_message.update('<div class="purchase_window_text">' + this.text_introduction_solution + " " +  this.text_hint_solution + '</div>');
	} else {
		this.titleElement.update(gettext('Buying gadget'));
		this.text_message.update('<div class="purchase_window_text">' + this.text_introduction_gadget + " " +  this.text_hint_gadget + '</div>');
	}

	var resource_apps = this._resource.getGadgetApps();
	
	var apps_html = "<tbody>";
	
	var total_signup_price = 0;
	var total_monthly_price = 0;
	
	for (var i=0; i<resource_apps.length; i++) {
		var app = resource_apps[i];
		
		if (! app['has_contract']) {
			var signup_price = parseInt(app['subscription_price']) ;
			var monthly_price = parseInt(app['monthly_price']);
			
			total_signup_price += signup_price;
			total_monthly_price += monthly_price;
			
			signup_price += ' €';
			monthly_price += ' €';
			
			var html = '<tr><td class="app_name">' + app['name'] + '</td><td class="center_text">' + signup_price + '</td><td class="center_text right_border">' + monthly_price + '</td></tr>';
		} else {
			var html = '<tr><td class="app_name">' + app['name'] + '</td><td class="center_text">' + gettext('already paid') + '</td><td class="center_text right_border">' + gettext('already paid') + '</td></tr>';
		}
		
		apps_html += html;
	}
	
	total_signup_price += ' €';
	total_monthly_price += ' €';
	
	var total_row = '<tr class="total_row"><td class="total_name">' + gettext('TOTAL') + '</td><td class="center_text">' + total_signup_price + '</td><td class="center_text right_border">' + total_monthly_price + '</td></tr>'; 
	
	apps_html += total_row;
	apps_html += "</tbody></table></center>";
	final_html = this.table_html + apps_html;
	
	this._apps_table.update();
	this._apps_table.update(final_html);
	
	var app_names = $$(".purchase_window_table td.app_name");
	for (var i=0; i<app_names.length; i++) {
		var element = app_names[i];
		var app = resource_apps[i];
		
		app['window_menu'] = this;
		app['help_menu'] = this.help_menu;
		
		Event.observe(element, 'click', function (e) { BuyingApplicationWindow.prototype.showApplicationPopUp(e, this, this['help_menu']) }.bind(app));
	}
	
	BuyingApplicationWindow.prototype.showApplicationPopUp = function(e, app, help_menu) {
		var app_name = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_name');
		var app_image = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_image');
		var app_signup_fee = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_signup_fee', 'Sing-up fee:');
		var app_monthly_fee = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_monthly_fee', 'Monthly fee:');
		var app_vendor = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_vendor', 'Vendor:');
		var app_gadget_list = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_gadget_list', 'List of Gadgets:');
		var app_desc = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_desc', 'Description:');
		var app_close = BuyingApplicationWindow.prototype.getOrCreateById(help_menu, 'app_close');
		
		if (app['name'] == app_name.innerHTML && app['vendor'] == app_vendor.innerHTML) {
			help_menu.className = "help_text_enabled drop_down_menu";
			return;
		} 
		
		app_image.setAttribute('src', app['image_uri']);
		app_name.innerHTML = app['name'];
		app_vendor.innerHTML = app['vendor'];
		app_desc.innerHTML = app['description'];
		app_gadget_list.innerHTML = app['gadget_list'];
		app_signup_fee.innerHTML = app['subscription_price'] + ' €';
		app_monthly_fee.innerHTML = app['monthly_price'] + ' €' ;
		
		help_menu.className = "help_text_enabled drop_down_menu";
		
		var element = Event.element(e);
		var cumulativeOffset = Position.cumulativeOffset(element);
		
		help_menu.style.top = cumulativeOffset[1] + 'px';
		help_menu.style.left = element.getWidth() + cumulativeOffset[0] + 'px';
	}
	
	BuyingApplicationWindow.prototype.hideApplicationPopUp = function(help_menu) {
		help_menu.className = "help_text_disabled";
	}
	
	BuyingApplicationWindow.prototype.getOrCreateById = function (help_menu, id, text) {
		var element_type = 'div';
		if (id == 'app_image') 
			element_type = 'img';
			
		var selector =  element_type+'#'+id;
		var elements_by_id = help_menu.getElementsBySelector(selector);
		
		if (elements_by_id.length == 1) {
			return elements_by_id[0];
		} else {
			if (text) {	
				var container = document.createElement('div');
				container.innerHTML = gettext(text)
				help_menu.appendChild(container);
				if (id == 'app_desc' || id == "app_gadget_list") 
					container.className = "clearing_both";
				else
					container.className = "floating_left";
			}
				
			var element = document.createElement(element_type);
			Element.extend(element);
			help_menu.appendChild(element);
			element.setAttribute('id', id); 
			
			if (id == "app_close") {
				element.className = "closebutton"
				Event.observe (element, 'click', function () { BuyingApplicationWindow.prototype.hideApplicationPopUp(this) }.bind(help_menu));
			}
			
			return element;
		}
	}
	
}

/**
 * Specific class for dialogs about creating things.
 */
function CreateWindowMenu (element) {
	var title;
	this.element = element;
	switch (element) {
	case 'workSpace':
		title = gettext('Create workSpace');
		break;
	}

	WindowMenu.call(this, title);
	

	// Accept button
	this.button = document.createElement('button');
	Element.extend(this.button );
	this.button.appendChild(document.createTextNode(gettext('Create')));
	this.windowBottom.appendChild(this.button);

	// Cancel button
	var cancelButton = document.createElement('button');
	Element.extend(cancelButton);
	cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
	cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(cancelButton);

	// Name input
	var label = document.createElement('label');
	label.appendChild(document.createTextNode(gettext('Nombre: ')));

	this.nameInput = document.createElement('input');
	Element.extend(this.nameInput);
	this.nameInput.setAttribute('type', 'text');
	this.nameInput.setAttribute('value', '');
	label.appendChild(this.nameInput);

	this.windowContent.insertBefore(label, this.msgElement);

	this.operationHandler = function(e) {
		var target = BrowserUtilsFactory.getInstance().getTarget(e);
		if (target == this.nameInput && e.keyCode == Event.KEY_RETURN || target == this.button) {
			Event.stop(e);
			this.executeOperation();
		}
	}.bind(this);

	this.button.observe("click", this.operationHandler);
	this.nameInput.observe("keypress", this.operationHandler);
}
CreateWindowMenu.prototype = new WindowMenu();

CreateWindowMenu.prototype.setFocus = function() {
	this.nameInput.focus();
}

//Calls the Create operation (the task the window is made for).
CreateWindowMenu.prototype.executeOperation = function() {
	var newName = this.nameInput.value;
	switch (this.element) {
	case 'workSpace':
		if (!OpManagerFactory.getInstance().workSpaceExists(newName)) {
			OpManagerFactory.getInstance().addWorkSpace(newName);
		} else {
			var msg = gettext('Invalid name: the name \"%(newName)s\" is already in use');
			msg = interpolate(msg, {newName: newName}, true);
			this.setMsg(msg);
		}

		break;
	default:
		break;
	}
}

CreateWindowMenu.prototype.show = function (parentWindow) {
	this.nameInput.value = '';

	WindowMenu.prototype.show.call(this, parentWindow);
}


/**
 * Specific class representing alert dialogs
 */
function AlertWindowMenu () {
	WindowMenu.call(this, gettext('Warning'));

	// Warning icon
	var icon = document.createElement('img');
	Element.extend(icon);
	icon.setAttribute('src', _currentTheme.getIconURL('warning'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	// Accept button
	this.acceptButton = document.createElement('button');

	Element.extend(this.acceptButton);
	this.acceptButton.appendChild(document.createTextNode(gettext('Yes')));
	this._acceptListener = this._acceptListener.bind(this);
	this.acceptButton.observe("click", this._acceptListener);
	this.windowBottom.appendChild(this.acceptButton);

	// Cancel button
	this.cancelButton = document.createElement('button');
	Element.extend(this.cancelButton);
	this.cancelButton.appendChild(document.createTextNode(gettext('No')));
	this.cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(this.cancelButton);

	this.acceptHandler = null;
	this.cancelHandler = null;
}
AlertWindowMenu.prototype = new WindowMenu();

AlertWindowMenu.prototype._acceptListener = function(e) {
	this.acceptHandler();
	this.hide();
}

AlertWindowMenu.prototype._closeListener = function(e) {
	WindowMenu.prototype._closeListener.call(this, e);
	if (this.cancelHandler) this.cancelHandler();
}

AlertWindowMenu.prototype.setHandler = function(acceptHandler, cancelHandler) {
	this.acceptHandler = acceptHandler;
	this.cancelHandler = cancelHandler;
}

AlertWindowMenu.prototype.setFocus = function() {
	this.acceptButton.focus();
}

/**
 * Specific class representing add mashup dialogs
 */
function AddMashupWindowMenu (actions) {
	WindowMenu.call(this, gettext('Add Mashup'));

	// Warning icon
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('warning'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	// New Workspace button
	this.acceptButton = document.createElement('button');
	Element.extend(this.acceptButton);
	this.acceptButton.appendChild(document.createTextNode(gettext('New Workspace')));
	this.acceptButton.observe("click", this._newWorkspaceListener.bind(this));
	this.windowBottom.appendChild(this.acceptButton);

	// Cancel button
	this.cancelButton = document.createElement('button');
	Element.extend(this.cancelButton);
	this.cancelButton.appendChild(document.createTextNode(gettext('Current Workspace')));
	this.cancelButton.observe("click", this._currentWorkspaceListener.bind(this));
	this.windowBottom.appendChild(this.cancelButton);

	this.acceptHandler = null;
	this.cancelHandler = null;
}
AddMashupWindowMenu.prototype = new WindowMenu();

AddMashupWindowMenu.prototype._newWorkspaceListener = function(e) {
	this.acceptHandler();
	this.hide();
}

AddMashupWindowMenu.prototype._currentWorkspaceListener = function(e) {
	this.cancelHandler();
	this.hide();
}

AddMashupWindowMenu.prototype.setHandler = function(acceptHandler, cancelHandler) {
	this.acceptHandler = acceptHandler;
	this.cancelHandler = cancelHandler;
}

AddMashupWindowMenu.prototype.setFocus = function() {
	this.acceptButton.focus();
}

/**
 * Specific class representing alert dialogs.
 */
function MessageWindowMenu (element) {
	WindowMenu.call(this, '');

	// Warning icon
	this.icon = document.createElement('img');
	this.windowContent.insertBefore(this.icon, this.msgElement);

	// Accept button
	this.button = document.createElement('button');
	Element.extend(this.button);
	this.button.appendChild(document.createTextNode(gettext('Accept')));
	this.windowBottom.appendChild(this.button);
	this.button.observe("click", this._closeListener);
}
MessageWindowMenu.prototype = new WindowMenu();

MessageWindowMenu.prototype.setFocus = function() {
	this.button.focus();
}

MessageWindowMenu.prototype.setType = function(type) {
	var titles = ['', gettext('Error'), gettext('Warning'), gettext('Info')];
	var icons = ['', 'error', 'warning', 'info'];
	var iconDesc = ['', gettext('Error:'), gettext('Warning:'), gettext('Info:')];

	// Update title
	this.titleElement.update(titles[type]);

	// Update icon
	this.icon.setAttribute('src', _currentTheme.getIconURL(icons[type]));
	this.icon.setAttribute('alt', gettext(iconDesc[type]));
}

/**
 * Specific class for info dialogs.
 */
function InfoWindowMenu(title) {
	if (arguments.length == 0)
		return;

	WindowMenu.call(this, title);

	// Extra HTML Elements
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('info'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	this.checkbox = document.createElement('input');
	Element.extend(this.checkbox);
	this.checkbox.setAttribute('type', 'checkbox');
	this.windowBottom.appendChild(this.checkbox);
	this.windowBottom.appendChild(document.createTextNode(gettext('Don\'t show me anymore')));

	// Event Listeners
	this._dontShowAnymore = this._dontShowAnymore.bind(this);

	this.checkbox.observe("click", this._dontShowAnymore);
}
InfoWindowMenu.prototype = new WindowMenu();

InfoWindowMenu.prototype._dontShowAnymore = function(e) {
	var layoutManager = LayoutManagerFactory.getInstance();
	var changes = {};
	changes['tip-' + this.type] = {value: false};
	PreferencesManagerFactory.getInstance().getPlatformPreferences().set(changes);

	this.hide();
}

/**
 *
 */
InfoWindowMenu.prototype.show = function (type, parentWindow) {
	this.type = type;
	this.checkbox.checked = false;

	WindowMenu.prototype.show.call(this, parentWindow);
}

/**
 * Specific class for tip dialogs.
 */
function TipWindowMenu() {
	InfoWindowMenu.call(this, gettext('Do you know what ... ?'));
}
TipWindowMenu.prototype = new InfoWindowMenu();

/**
 * Form dialog.
 */
function FormWindowMenu (fields, title) {
	
	this.fields = {};
	

	
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	WindowMenu.call(this, title);

	var table_ = this._buildFieldTable(fields, this.fields);
	this.windowContent.insertBefore(table_, this.msgElement);

	// Legend
	var legend = document.createElement('div');
	legend.className = "legend";
	var requiredMark = document.createElement('span');
	requiredMark.appendChild(document.createTextNode('*'));
	requiredMark.className = 'required_mark';
	legend.appendChild(requiredMark);
	legend.appendChild(document.createTextNode(gettext('required field')));
	this.windowContent.insertBefore(legend, this.msgElement);

	// Mark our message div as an error msg
	this.msgElement.addClassName("error");

	// Accept button
	this.button = document.createElement('button');
	Element.extend(this.button);
	this.button.appendChild(document.createTextNode(gettext('Accept')));
	this.windowBottom.appendChild(this.button);
	this._acceptHandler = this._acceptHandler.bind(this);
	this.button.observe("click", this._acceptHandler);

	// Cancel button
	var cancelButton = document.createElement('button');
	Element.extend(cancelButton);
	cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
	cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(cancelButton);
}
FormWindowMenu.prototype = new WindowMenu();

FormWindowMenu.prototype._buildFieldTable = function(fields, fieldHash) {
	var table_ = document.createElement('table');
	table_.setAttribute('cellspacing', '0');
	table_.setAttribute('cellpadding', '0');
	var table = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
	table_.appendChild(table);

	for (var fieldId in fields) {
		var field = fields[fieldId];
		var row = table.insertRow(-1);

		if (field.type === 'fieldset') {
			var fieldset = row.insertCell(-1);
			Element.extend(fieldset);
			fieldset.addClassName('fieldset');
			fieldset.setAttribute('colSpan', '2');

			var label = document.createElement('span')
			Element.extend(label);
			label.addClassName('section_name');

			label.appendChild(document.createTextNode(field.label));
			fieldset.appendChild(label);

			var sectionHash = fieldHash;
			if (field.nested === true) {
			    sectionHash = {};
			    fieldHash[fieldId] = sectionHash;
			}

			var section = this._buildFieldTable(field.elements, sectionHash);
			Element.extend(section);
			section.addClassName('section');
			section.setStyle({'display': 'none'});
			fieldset.appendChild(section);

			var context = {"section":section, "object":this}
			Event.observe(label, 'click', function () {
							this.section.toggle();
							this.object.calculatePosition();
						}.bind(context));

			continue;
		}

		this._insertField(fieldId, field, row, fieldHash);
	}

	return table_;
}

FormWindowMenu.prototype._insertField = function(fieldId, field, row, fieldHash) {
	if (field.type === 'separator') {
		var separator = row.insertCell(-1);
		separator.setAttribute('colSpan', '2');
		var hr = document.createElement('hr');
		separator.appendChild(hr);
		return;
	}
	if (field.type === 'label') {
		var labelRow = row.insertCell(-1);
		Element.extend(labelRow);
		labelRow.addClassName('label');
		if (field.url){
			var label = document.createElement('a');
			label.setAttribute("href",field.url);
			label.setAttribute("target","_blank");
		}else{
			var label = document.createElement('label');
		}
		label.appendChild(document.createTextNode(field.label));
		labelRow.appendChild(label);
		return;
	}
	// Label Cell
	var labelCell = row.insertCell(-1);
	Element.extend(labelCell);
	labelCell.addClassName('label');
	
	var label = document.createElement('label');
	label.appendChild(document.createTextNode(field.label));
	labelCell.appendChild(label);
	
	if (field.required) {
		var requiredMark = document.createElement('span');
		requiredMark.appendChild(document.createTextNode('*'));
		requiredMark.className = 'required_mark';
		labelCell.appendChild(requiredMark);
	}
	
	// Input Cell
	var inputCell = document.createElement('td');
	// TODO
	//if the field is radio type the label must go after te input
	if (field.type == 'radio') {
		row.insertBefore(inputCell, labelCell);
	} else {
		row.appendChild(inputCell);
	}

	var inputInterface = InterfaceFactory.createInterface(fieldId, field);
	inputInterface._insertInto(inputCell);
	
	field.inputInterface = inputInterface;

	fieldHash[fieldId] = field;
}

/**
 * Does extra checks for testing field validity. This method must be overwriten
 * by child classes for providing this extra checks.
 *
 * @param {Hash} fields Hash with the current fields
 */
FormWindowMenu.prototype.extraValidation = function(fields) {
	//Parent implementation, allways true if no redefined by child class!
	return "";
}

FormWindowMenu.prototype._validateFields = function (fields, validationManager) {
	var field, fieldId;
	for (fieldId in fields) {
		field = fields[fieldId];
		if (field.inputInterface != null && field.inputInterface instanceof InputInterface) {
			validationManager.validate(fields[fieldId].inputInterface);
		} else {
			this._validateFields(field, validationManager);
		}
	}
};

FormWindowMenu.prototype._parseForm = function (fields) {
	var value, field, fieldId, form = {};
	for (fieldId in fields) {
		field = fields[fieldId];
		if (field.inputInterface != null && field.inputInterface instanceof InputInterface) {
			value = field.inputInterface.getValue();

			if (field.required || value !== "")
				form[fieldId] = value;
		} else {
			form[fieldId] = this._parseForm(field);
		}
	}
	return form;
};

FormWindowMenu.prototype._setForm = function (fields, data) {
	var field, fieldId;
	for (fieldId in fields) {
		field = fields[fieldId];
		if (field.inputInterface != null && field.inputInterface instanceof InputInterface) {
			if (data != null) {
				field.inputInterface.setValue(data[fieldId]);
			} else {
				field.inputInterface.setValue(null);
			}
		} else {
			if (data != null) {
			    this._setForm(field, data[fieldId]);
			} else {
			    this._setForm(field, null);
			}
		}
	}
};

FormWindowMenu.prototype.setValue = function(data) {
	this._setForm(this.fields, data);
};

FormWindowMenu.prototype._acceptHandler = function(e) {

	// Validate input fields
	var validationManager = new ValidationErrorManager();
	this._validateFields(this.fields, validationManager);

	// Extra validations
	var extraErrorMsg = this.extraValidation(this.fields);

	// Build Error Message
	var errorMsg = validationManager.toHTML();

	if (extraErrorMsg !== null && extraErrorMsg != "")
		errorMsg += "<p>" + extraErrorMsg + "</p>";

	// Show error message if needed
	if (errorMsg != "") {
		this.setMsg(errorMsg);
		return;
	} else {
		// Otherwise process the data
		this.executeOperation(this._parseForm(this.fields));
		this.hide();
	}
}

FormWindowMenu.prototype._reset = function (fields) {
	var fieldId, field;

	for (fieldId in fields) {
		field = fields[fieldId];
		if (field.inputInterface != null && field.inputInterface instanceof InputInterface) {
			field.inputInterface.reset();
		} else {
			this._reset(field);
		}
	}
}

FormWindowMenu.prototype.show = function (parentWindow) {
	this._reset(this.fields);
	WindowMenu.prototype.show.call(this, parentWindow);
}

/**
 * Specific class for publish windows
 */
function PublishWindowMenu (workspace) {

	//ezweb_organizations as options to be used in select inputs
	var orgs = JSON.parse(ezweb_organizations);
	this.organizations = new Array();
	//first option (empty value)
	this.organizations.push({label: '------', value: ''});
	for (var i = 0; i < orgs.length; i++) {
		//org__groupname: name = groupname, value = org__groupname
		name = orgs[i].split('__')[1];
		this.organizations.push({label: name, value: orgs[i]});
	}

	var fields = {
		'name': {label: gettext('Mashup Name'), type:'id', required: true},
		'vendor': {label: gettext('Vendor'), type:'id',  required: true},
		'version': {label: gettext('Version'), type:'version',  required: true},
		'email': {label: gettext('Email'), type:'email',  required: true},
		'detailedInfo': {
			label: gettext('Detailed description'),
			type: 'fieldset',
			elements: {
				'description': {label: gettext('Description'), type:'longtext'},
				'wikiURI': {label: gettext('Wiki URL'), type:'url'},
				'author': {label: gettext('Author'), type:'text',  defaultValue: ezweb_user_name}
			}
		},
		'personalization': {
			label: gettext('Personalization'),
			type: 'fieldset',
			elements: {
				'create_skin': {
					label:gettext("Create your own skin for your application"),
					type:"label",
					url:URIs.WS_SKIN_GENERATOR
				},
				'imageURI': {
					label: gettext('Image for the catalogue (170x80 px)'),
					type: 'fileUrl',
					linkHandler: function(){
						this.openUploadWindow('imageURI');
					}.bind(this)
				},
				'noBranding': {
					label: gettext('Do not use any branding'),
					type: 'boolean'
				},
				'logo': {
					label: gettext('Banner logo (250x50 px)'),
					type: 'fileUrl',
					linkHandler: function(){
						this.openUploadWindow('logo');
					}.bind(this)
				},
				'viewerLogo': {
					label: gettext('Banner logo for viewer mode (150x30 px)'),
					type: 'fileUrl',
					linkHandler: function(){
						this.openUploadWindow('viewerLogo');
					}.bind(this)
				},
				'link': {
					label: gettext('Clicking on these logos will open this page'),
					type: 'url'
				}
			}
		},
		'advanced': {
			label: gettext('Advanced options'),
			type: 'fieldset',
			elements: {
				'organization': {label: gettext('Organization'), type: 'select', options: this.organizations},
				'readOnly': {label: gettext('Block gadgets and connections'), type: 'boolean'}
			}
		}
	}

	this._addVariableParametrization(workspace, fields);

	FormWindowMenu.call(this, fields, gettext('Publish Workspace'));

	//fill a warning message
	var warning = document.createElement('div');
	Element.extend(warning);
	warning.addClassName('msg warning');
	warning.update(gettext("WARNING: configured and stored data in your workspace (properties and preferences except passwords) will be shared!"));
	this.windowContent.appendChild(warning);
	
	//check whether to enable the branding fields or not
	var _checkIfBranding = function(){
		if(this.fields['noBranding'].inputInterface.getValue()){
			this.fields['logo'].inputInterface.setDisabled(true);
			this.fields['viewerLogo'].inputInterface.setDisabled(true);
			this.fields['link'].inputInterface.setDisabled(true);
		}
		else{
			this.fields['logo'].inputInterface.setDisabled(false);
			this.fields['viewerLogo'].inputInterface.setDisabled(false);
			this.fields['link'].inputInterface.setDisabled(false);
		}
	}.bind(this);
	
	this.fields['noBranding'].inputInterface.setOnclickHandler(_checkIfBranding);
	
	
	//Window for uploading local files
	this.uploadWindow = new UploadWindowMenu(gettext('Upload File'));
}
PublishWindowMenu.prototype = new FormWindowMenu();

FormWindowMenu.prototype._addVariableParametrization = function (workspace, fields) {
	var i, j, igadget, igadgets, igadget_params, pref_params, prop_params,
		variable, variables, varManager, label;

	varManager = workspace.getVarManager();
	igadgets = workspace.getIGadgets();
	igadget_params = {};

	for (i = 0; i < igadgets.length; i++) {
		igadget = igadgets[i];
		variables = varManager.getIGadgetVariables(igadget.getId());
		pref_params = {};
                prop_params = {};

		for (j in variables) {
			variable = variables[j];
			if (variable.aspect === Variable.prototype.USER_PREF) {
				pref_params[j] = {
					label: variable.label,
					type: 'parametrizableValue',
					variable: variable,
					parentWindow: this
				};
			} else if (variable.aspect === Variable.prototype.PROPERTY) {
				if (variable.label && variable.label != '') {
				    label = variable.label;
				} else {
				    label = variable.name;
				}
				prop_params[j] = {
					label: label,
					type: 'parametrizableValue',
					variable: variable,
					parentWindow: this
				};
			}
		}
		igadget_params[igadget.id] = {
			label: igadget.name,
			type: 'fieldset',
			nested: true,
			elements: {
				'pref' : {
					label: gettext('Preferences'),
					type: 'fieldset',
					elements: pref_params
				},
				'props': {
					label: gettext('Properties'),
					type: 'fieldset',
					elements: prop_params
				}
			}
		};
	}

	fields['advanced'].elements['parametrization'] = {
		label: gettext('Parametrization'),
		type: 'fieldset',
		nested: true,
		elements: igadget_params
	};
};

PublishWindowMenu.prototype.setFocus = function() {
	this.fields['name'].inputInterface.focus();
}

PublishWindowMenu.prototype.executeOperation = function(form) {
	OpManagerFactory.getInstance().activeWorkSpace.publish(form);
}

PublishWindowMenu.prototype.openUploadWindow = function(targetElementName){
	var targetElement = this.fields[targetElementName].inputInterface.inputElement;
	this.uploadWindow.show(this, targetElement);
}

/**
 * Specific class for sharing windows
 */
function ShareWindowMenu (element) {

	wsName = OpManagerFactory.getInstance().activeWorkSpace.workSpaceState.name;
	var label1 = interpolate(gettext('Share "%(workspace)s" workspace with everybody through either a public URL or an embed object'), {workspace: wsName}, true)
	var label2 = interpolate(gettext('Share "%(workspace)s" workspace only with the following groups'), {workspace: wsName}, true)

	var fields = {
		'public_sharing': {label: label1, type:'radio', defaultValue:true, name:'share', onclick: this.hideGroups.bind(this)},
		'group_sharing':  {label: label2, type:'radio', defaultValue:false, name:'share', onclick: this.showGroups.bind(this)},
		'groups':         {label: '', type: 'multiple', options: []}
	}

	FormWindowMenu.call(this, fields, gettext('Share Workspace'));
	// TODO Remove this workaround
	// hide the whole row where the groups select is
	this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'none';
	this.fields['groups'].inputInterface.inputElement.addClassName('window_multiple_select');

	var warning = document.createElement('div');
	Element.extend(warning);
	warning.addClassName('msg warning');
	warning.update(gettext("WARNING: configured and stored data in your workspace (properties and preferences except passwords) will be shared!"));
	this.windowContent.appendChild(warning);
}
ShareWindowMenu.prototype = new FormWindowMenu();

ShareWindowMenu.prototype.showGroups = function() {
	function onError(transport, e) {
		errorMsg = gettext('The available groups cannot be displayed');
		this.setMsg(errorMsg);
		this.calculatePosition();
	}

	function onSuccess(transport) {
		var response = transport.responseText;
		var groups = JSON.parse(response);

		// TODO Remove this workaround
		var select = this.fields['groups'].inputInterface.inputElement;
		select.update();
		var option;
		for (var i = 0; i < groups.length; i++) {
			option = new Option(groups[i]['name'], groups[i]['id']);
			if (groups[i]['sharing']=='true')
				option.disabled = 'disabled';
			try {
				select.add(option, null);
			} catch (e) {
				select.add(option); // IE < 8
			}
		}

		// TODO Remove this workaround
		// Show the row where the groups select is
		this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'table-row';

		this.calculatePosition();
	}

	var url = URIs.GET_SHARE_GROUPS.evaluate({'workspace_id': OpManagerFactory.getInstance().activeWorkSpace.workSpaceState.id});
	PersistenceEngineFactory.getInstance().send_get(url, this, onSuccess, onError);
}

ShareWindowMenu.prototype.hideGroups = function() {
	// TODO Remove this workaround
	// Hide the row where the groups select is
	this.fields['groups'].inputInterface.inputElement.parentNode.parentNode.style.display = 'none';
	this.calculatePosition();
}

ShareWindowMenu.prototype.setFocus = function() {
	this.fields['public_sharing'].inputInterface.focus();
}

ShareWindowMenu.prototype.extraValidation = function(form) {
	if (this.fields['group_sharing'].inputInterface.getValue() && this.fields['groups'].inputInterface.inputElement.selectedIndex == -1){
		return gettext('You must select a group');
	}
	return null
}

ShareWindowMenu.prototype.executeOperation = function(form) {
	var groups = this.fields['groups'].inputInterface.getValue();
	OpManagerFactory.getInstance().activeWorkSpace.shareWorkspace(true, groups);
}

ShareWindowMenu.prototype.show = function(parentWindow) {
	FormWindowMenu.prototype.show.call(this, parentWindow);
	// TODO remove this workaround
	this.hideGroups();
}


/**
 * Specific class for Feed creator window.
 */
function AddFeedMenu (element) {

	//ezweb_organizations as options to be used in select inputs
	var orgs = JSON.parse(ezweb_organizations);
	this.organizations = new Array();
	//first option (empty value)
	this.organizations.push({label: '------', value: ''});
	for (var i = 0; i < orgs.length; i++) {
		//org__groupname: name = groupname, value = org__groupname
		name = orgs[i].split('__')[1];
		this.organizations.push({label: name, value: orgs[i]});
	}

	var fields = {
		'name'          : {label: gettext('Name'), type: 'id', required: true},
		'URL'           : {label: gettext('URL'), type: 'url',  required: true},
		'separator1'    : {type: 'separator', required: true},
		'imageURI'      : {label: gettext('Image URL'),
							type: 'fileUrl',
							linkHandler: function(){
											this.openUploadWindow('imageURI');
										 }.bind(this)
						},
		'iPhoneImageURI': {label: gettext('iPhone Image URL'),
							type: 'fileUrl',
							linkHandler: function(){
											this.openUploadWindow('iPhoneImageURI');
										 }.bind(this)
							},
		'feed_color'    : {label: gettext('Template color'),
		                   type: 'select',
		                   options: [
		                              {value: 'blue', label: gettext('blue')},
		                              {value: 'orange', label: gettext('orange')},
		                              {value: 'red', label: gettext('red')},
		                              {value: 'green', label: gettext('green')}
		                            ]
		                  },
		'menu_color'    : {label: gettext('Menu Color'), type: 'color'},
		'organization'  : {label: gettext('Organization'), type: 'select', options:this.organizations}
	}

	FormWindowMenu.call(this, fields, gettext('Add new feed'));
	
	//Window for uploading local files
	this.uploadWindow = new UploadWindowMenu('Upload File');
}
AddFeedMenu.prototype = new FormWindowMenu();

AddFeedMenu.prototype.openUploadWindow = function(targetElementName){
	var targetElement = this.fields[targetElementName].inputInterface.inputElement;
	this.uploadWindow.show(this, targetElement);
}	

AddFeedMenu.prototype.setFocus = function() {
	this.fields['name'].inputInterface.focus();
}

AddFeedMenu.prototype.executeOperation = function(form) {
	function onError(transport, e) {
		alert("error generando el template");
		this.hide();
	}

	function onSuccess(transport) {
		var response = transport.responseText;
		var data = JSON.parse(response);
		
		CatalogueFactory.getInstance().add_resource_by_template(data.URL);
	}

	var data = {"template_data": Object.toJSON(form)};
	PersistenceEngineFactory.getInstance().send_post(URIs.GADGET_TEMPLATE_GENERATOR.evaluate({'gadget_type': 'feed_reader'}), data, this, onSuccess, onError);
}

/**
 * Specific class for Site creator window.
 */
function AddSiteMenu (element) {

	//ezweb_organizations as options to be used in select inputs
	var orgs = JSON.parse(ezweb_organizations);
	this.organizations = new Array();
	//first option (empty value)
	this.organizations.push({label: '------', value: ''});
	for (var i = 0; i < orgs.length; i++) {
		//org__groupname: name = groupname, value = org__groupname
		name = orgs[i].split('__')[1];
		this.organizations.push({label: name, value: orgs[i]});
	}

	var fields = {
		'name': {label: gettext('Name'), type: 'id', required: true},
		'URL': {label: gettext('URL'), type: 'url', required: true},
		'method': {label: gettext('Method'), type: 'select', options: [{value: 'GET', label: 'GET'}, {value: 'POST', label: 'POST'}]},
		'separator1': {type: 'separator', required: true},
		'parse_parameters': {label: gettext('Parse URL Parameters'), type: 'boolean'},
		'fixed_params': {label: gettext('Fixed Params'), type: 'text'},
		'default_params': {label: gettext('Default Param Values'), type: 'text'},
		'events': {label: gettext('Events'), type: 'text'},
		'separator2': {type: 'separator', required: true},
		'home_URL': {label: gettext('Home URL'), type: 'url'},
		'imageURI': {label: gettext('Image URL'),
					 type: 'fileUrl',
					 linkHandler: function(){
									this.openUploadWindow('imageURI');
								 }.bind(this)
						},
		'iPhoneImageURI': {label: gettext('iPhone Image URL'),
						   type: 'fileUrl',
						   linkHandler: function(){
											this.openUploadWindow('iPhoneImageURI');
										 }.bind(this)
						},
		'menu_color': {label: gettext('Menu Color (Hex.)'), type: 'color'},
		'organization': {label: gettext('Organization'), type: 'select', options:this.organizations},
		'source': {label: gettext('Source'), type: 'text'},
		'source_URL': {label: gettext('Source URL'), type: 'url'}
	}

	FormWindowMenu.call(this, fields, gettext('Add new site'));
	
	//Window for uploading local files
	this.uploadWindow = new UploadWindowMenu('Upload File');	
	
}
AddSiteMenu.prototype = new FormWindowMenu();

AddSiteMenu.prototype.openUploadWindow = function(targetElementName){
	var targetElement = this.fields[targetElementName].inputInterface.inputElement;
	this.uploadWindow.show(this, targetElement);
}	

AddSiteMenu.prototype.setFocus = function() {
	this.fields['name'].inputInterface.focus();
}

AddSiteMenu.prototype.executeOperation = function(form) {
	function onError(transport, e) {
		alert("error generando el template");
		this.hide();
	}

	function onSuccess(transport) {
		var response = transport.responseText;
		var data = JSON.parse(response);
		
		CatalogueFactory.getInstance().add_resource_by_template(data.URL);
	}

	var data = {"template_data": Object.toJSON(form)};
	PersistenceEngineFactory.getInstance().send_post(URIs.GADGET_TEMPLATE_GENERATOR.evaluate({'gadget_type': 'web_browser'}), data, this, onSuccess, onError);
}


/**
 *  Specific class to rename the workspace
 */
function RenameWindowMenu () {
	
	var fields = {
		'name': {label: gettext('New Name'),type: 'text', required: true}
	}
	FormWindowMenu.call(this, fields, gettext('Rename Workspace'));
}

RenameWindowMenu.prototype = new FormWindowMenu();

RenameWindowMenu.prototype.setFocus = function() {
	this.fields['name'].inputInterface.focus();
}

RenameWindowMenu.prototype.executeOperation = function(form) {
	var name = form["name"]; 
	OpManagerFactory.getInstance().activeWorkSpace.rename(name);
}

RenameWindowMenu.prototype.show = function(parentWindow) {
	FormWindowMenu.prototype.show.call(this, parentWindow);
	this.fields['name'].inputInterface.inputElement.value = OpManagerFactory.getInstance().activeWorkSpace.workSpaceState.name;
}

RenameWindowMenu.prototype.extraValidation = function(fields) {
	if (fields["name"].inputInterface.inputElement.value.length > 30) {
		return gettext("The new name is too long. It must have less than 30 characters.");
	}
	return null;
}


/**
 * Specific class for Sharing workspace results window!
 */
 //TODO: change this class to work as the rest of windows
function SharedWorkSpaceMenu() {
	WindowMenu.call(this, gettext('Shared WorkSpace Info'));

	// Extra HTML Elements
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('info'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	// Extra HTML Elements (url and html_code)
	// Table
	this.addElement('mainTable', 'table', 'windowContent');
	
	//IE6 and IE7 need a tbody for dynamic tables
	this.addElement('tableElement', 'tbody', 'mainTable');

	// TR1
	this.addElement('tr1Element', 'tr', 'tableElement');
	this.tr1Element.style.display = 'none';

	// TD11
	this.addElement('td11Element', 'td', 'tr1Element');

	// LABEL1
	this.addElement('label1', 'label', 'td11Element');
	this.label1.innerHTML = gettext('URL:');

	// TD12
	this.addElement('td12Element', 'td', 'tr1Element');

	// URL
	this.addElement('urlElement', 'input', 'td12Element');

	// TR2
	this.addElement('tr2Element', 'tr', 'tableElement');
	this.tr2Element.style.display = 'none';

	// TD21
	this.addElement('td21Element', 'td', 'tr2Element');

	// LABEL2
	this.addElement('label2', 'label', 'td21Element');
	this.label2.innerHTML = gettext('HTML code:');

	// TD12
	this.addElement('td22Element', 'td', 'tr2Element');

	// HTML
	this.addElement('html_codeElement', 'textarea', 'td22Element');
	this.html_codeElement.setAttribute('cols', 30);
	this.html_codeElement.setAttribute('rows', 3);
}
SharedWorkSpaceMenu.prototype = new WindowMenu();

SharedWorkSpaceMenu.prototype.addElement = function(element_name, html_tag, father_name) {
	this[element_name] = document.createElement(html_tag);
	Element.extend(this[element_name]);
	this[father_name].appendChild(this[element_name]);
}

SharedWorkSpaceMenu.prototype.setURL = function(url) {
	this.urlElement.value = url;
	this.tr1Element.style.display='table-row';
}

SharedWorkSpaceMenu.prototype.setHTML = function(url) {
	var html_code = '<object width="" height="" data="' + url + '"></object>';

	this.html_codeElement.value = html_code;
	this.tr2Element.style.display='table-row';
}

SharedWorkSpaceMenu.prototype.hide = function(url) {
	this.urlElement.value = "";
	this.html_codeElement.value = "";
	this.tr1Element.style.display='none';
	this.tr2Element.style.display='none';
	WindowMenu.prototype.hide.call(this);
}

/**
 * Specific class for platform preferences windows.
 *
 * @param scope
 *
 * @author jmostazo-upm
 */
function PreferencesWindowMenu(scope) {
	WindowMenu.call(this, '');
	
	var table = PreferencesManagerFactory.getInstance().getPreferencesDef(scope).getInterface();
	
	// Extra Elements
	if (scope=="platform"){
		var tbody = table.firstChild;
		
		var row = tbody.insertRow(0);
		var columnLabel = row.insertCell(-1);
		columnLabel.className = "label";
		var label = document.createElement("label")
		label.appendChild(document.createTextNode(gettext("Language")))
		columnLabel.appendChild(label);
		
		var columnValue = row.insertCell(-1);
		this.language = document.createElement("select");
		for (var index=0; index<LANGUAGES.length; index++){
			lang = LANGUAGES[index];
			var option = new Option(lang[1], lang[0]);
			try {
				this.language.add(option, null);
			} catch (e) {
				this.language.add(option); // IE < 8
			}
			if (LANGUAGE_CODE == lang[0]){
				option.setAttribute("selected","true");
			}
		}
		columnValue.appendChild(this.language);
		
	}
	
	this.windowContent.insertBefore(table, this.msgElement);

	// Accept button
	this.acceptButton = document.createElement('button');

	Element.extend(this.acceptButton);
	this.acceptButton.appendChild(document.createTextNode(gettext('Save')));
	this._executeOperation = this._executeOperation.bind(this);
	this.acceptButton.observe("click", this._executeOperation);
	this.windowBottom.appendChild(this.acceptButton);

	// Cancel button
	this.cancelButton = document.createElement('button');

	Element.extend(this.cancelButton);
	this.cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
	this.cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(this.cancelButton);
}
PreferencesWindowMenu.prototype = new WindowMenu();

PreferencesWindowMenu.prototype.setManager = function(manager) {
	this.manager = manager;
}

PreferencesWindowMenu.prototype._executeOperation = function() {
	// Validate input fields
	var validationManager = new ValidationErrorManager();
	for (var fieldId in this.fields)
		validationManager.validate(this.fields[fieldId].inputInterface);

	// Build Error Message
	var errorMsg = validationManager.toHTML();

	// Show error message if needed
	if (errorMsg != "") {
		this.setMsg(errorMsg);
	} else {
		this.manager.save();
		this.hide();
	}
	if (this.language && this.language.value != LANGUAGE_CODE){
		return setLanguage(this.language.value);
	}
}

PreferencesWindowMenu.prototype.show = function (parentWindow) {
	this.titleElement.setTextContent(this.manager.buildTitle());
	this.manager.resetInterface('platform');
	WindowMenu.prototype.show.call(this, parentWindow);
}

/**
 * Specific class for uploading files.
 *
 * @param scope
 *
 */
function UploadWindowMenu (title, targetElement) {
	WindowMenu.call(this, gettext(title));

	this.targetElement = null;
	this.iframe = document.createElement('iframe');
	this.iframe.setAttribute('id', 'uploader_frame');
	this.iframe.setAttribute('src', URIs.FILE_UPLOADER);
	this.iframe.setAttribute('width', "100%");
	this.iframe.setAttribute("frameBorder", "0");
	
	var iframeDiv = document.createElement('div');
	Element.extend(iframeDiv);
	iframeDiv.addClassName('iframeDiv');
	this.windowContent.appendChild(iframeDiv)
	
	iframeDiv.appendChild(this.iframe);
	
	var warning = document.createElement('div');
	Element.extend(warning);
	warning.addClassName('msg warning');
	warning.update(gettext("WARNING: Your file will be uploaded to a shared space. <br /> EzWeb is not responsible for the content of the uploaded files."));
	this.windowContent.appendChild(warning);
}

UploadWindowMenu.prototype = new WindowMenu();

UploadWindowMenu.prototype.show = function(parentWindow, targetElement) {
	//reload the iframe for IE
	this.iframe.setAttribute('src', URIs.FILE_UPLOADER);
	this.targetElement = targetElement;
	
	WindowMenu.prototype.show.call(this, parentWindow);
}

UploadWindowMenu.prototype._closeListener = function(){

	//Take the value of the URL if it succeed and set that value to the targetElement  
	try {
		if (this.iframe.contentDocument) {
			var urlElement = this.iframe.contentDocument.getElementById('url');
		}
		else { //IE
			var urlElement = this.iframe.contentWindow.document.getElementById('url')
		}
		
		if (urlElement) {
			this.targetElement.value = urlElement.innerHTML;
		}
	} 
	catch (err) {
	//do nothing
	}
	finally {
		//hide the window
		this.hide();
	}
	
}

function ParametrizeWindowMenu(inputInterface) {
    var fields, options;

    options = [
        {label: gettext('Use current value'), value: 'current'},
        {label: gettext('Use gadget default value'), value: 'default'},
        {label: gettext('Use parametrized value'), value: 'custom'}
    ];

    fields = {
        'readOnly': {label: gettext('read only'), type: 'boolean'},
        'source': {label: '', type: 'select', options: options},
        'value': {label: gettext('Value'), type: 'parametrizedText'}
    }
    FormWindowMenu.call(this, fields, gettext('Parametrization'));

    this.inputInterface = inputInterface;
}
ParametrizeWindowMenu.prototype = new FormWindowMenu();

ParametrizeWindowMenu.prototype.executeOperation = function(newValue) {
    this.inputInterface.setValue(newValue);
};

ParametrizeWindowMenu.prototype._closeListener = function() {
    this.hide();
};
