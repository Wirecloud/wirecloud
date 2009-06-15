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

	this.htmlElement = document.createElement('div');  // create the root HTML element
	this.htmlElement.className = "window_menu";

	// Window Top
	var windowTop = document.createElement('div');
	windowTop.className = "window_top";
	this.htmlElement.appendChild(windowTop);

	this._closeListener = this._closeListener.bind(this);
	this.closeButton = document.createElement('input');
	this.closeButton.type = "button";
	this.closeButton.className = "closebutton button";
	windowTop.appendChild(this.closeButton);
	this.closeButton.observe("click", this._closeListener);

	this.titleElement = document.createElement('div');
	this.titleElement.className = "window_title";
	windowTop.appendChild(this.titleElement);

	// Window Content
	this.windowContent = document.createElement('div');
	this.windowContent.className = "window_content";
	this.htmlElement.appendChild(this.windowContent);

	this.msgElement = document.createElement('div');
	this.msgElement.className = "msg";
	this.windowContent.appendChild(this.msgElement);

	// Window Bottom
	this.windowBottom = document.createElement('div');
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
	LayoutManagerFactory.getInstance().hideCover();
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

	coordenates[1] = BrowserUtilsFactory.getInstance().getHeight()/2 - this.htmlElement.getHeight()/2;
	coordenates[0] = BrowserUtilsFactory.getInstance().getWidth()/2 - this.htmlElement.getWidth()/2;

	this.htmlElement.style.top = coordenates[1]+"px";
	this.htmlElement.style.left = coordenates[0]+"px";
//	this.htmlElement.style.right = coordenates[0]+"px";
}

/**
 *
 */
WindowMenu.prototype.setHandler = function (handler) {
	this.operationHandler = handler;
}

/**
 * Displays the window in the correct position.
 */
WindowMenu.prototype.show = function () {
	document.body.insertBefore(this.htmlElement, $("header"));
	this.calculatePosition();
	this.htmlElement.style.display = "block";
	this.setFocus();
}

WindowMenu.prototype.hide = function () {
	document.body.removeChild(this.htmlElement);
	this.msgElement.update();
}

WindowMenu.prototype.setFocus = function () {
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
	this.htmlElement.addClassName('create_menu');

	// Accept button
	this.button = document.createElement('button');
	this.button.appendChild(document.createTextNode('Create'));
	this.windowBottom.appendChild(this.button);

	// Cancel button
	var cancelButton = document.createElement('button');
	cancelButton.appendChild(document.createTextNode('Cancel'));
	cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(cancelButton);

	// Name input
	var label = document.createElement('label');
	label.appendChild(document.createTextNode(gettext('Nombre: ')));

	this.nameInput = document.createElement('input');
	this.nameInput.setAttribute('type', 'text');
	this.nameInput.setAttribute('value', '');
	label.appendChild(this.nameInput);

	this.windowContent.insertBefore(label, this.msgElement);

	this.operationHandler = function(e) {
		if (e.target == this.nameInput && e.keyCode == Event.KEY_RETURN || e.target == this.button)
			this.executeOperation();
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

CreateWindowMenu.prototype.show = function () {
	this.nameInput.value = '';

	WindowMenu.prototype.show.call(this);
}

/**
 * Specific class representing alert dialogs
 */
function AlertWindowMenu () {
	WindowMenu.call(this, gettext('Warning'));

	// Warning icon
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('warning'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	// Accept button
	this.acceptButton = document.createElement('button');
	this.acceptButton.appendChild(document.createTextNode('Yes'));
	this._acceptListener = this._acceptListener.bind(this);
	this.acceptButton.observe("click", this._acceptListener);
	this.windowBottom.appendChild(this.acceptButton);

	// Cancel button
	this.cancelButton = document.createElement('button');
	this.cancelButton.appendChild(document.createTextNode('No'));
	this.cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(this.cancelButton);

	this.acceptHandler = null;
	this.cancelHandler = null;
}
AlertWindowMenu.prototype = new WindowMenu();

AlertWindowMenu.prototype._acceptListener = function(e) {
	this.acceptHandler();
	LayoutManagerFactory.getInstance().hideCover();
}

AlertWindowMenu.prototype._closeListener = function(e) {
	if (this.cancelHandler) this.cancelHandler();
	WindowMenu.prototype._closeListener(e);
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
	this.acceptButton.appendChild(document.createTextNode('New Workspace'));
	this.acceptButton.observe("click", this._newWorkspaceListener.bind(this));
	this.windowBottom.appendChild(this.acceptButton);

	// Cancel button
	this.cancelButton = document.createElement('button');
	this.cancelButton.appendChild(document.createTextNode('Current Workspace'));
	this.cancelButton.observe("click", this._currentWorkspaceListener.bind(this));
	this.windowBottom.appendChild(this.cancelButton);
	
	this.acceptHandler = null;
	this.cancelHandler = null;

}
AddMashupWindowMenu.prototype = new WindowMenu();

AddMashupWindowMenu.prototype._newWorkspaceListener = function(e) {
	this.acceptHandler();
	LayoutManagerFactory.getInstance().hideCover();
}

AddMashupWindowMenu.prototype._currentWorkspaceListener = function(e) {
	this.cancelHandler();
	LayoutManagerFactory.getInstance().hideCover();
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
	this.button.appendChild(document.createTextNode('Accept'));
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
	var iconDesc = ['', 'Error:', 'Warning:', 'Info:'];

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
	this.htmlElement.addClassName('info_menu');

	// Extra HTML Elements
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('info'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);

	this.checkbox = document.createElement('input');
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
	layoutManager.informationMessagesStatus[this.type] = true;
	CookieManager.createCookie('informationMessagesStatus',
		layoutManager.informationMessagesStatus,
		365);

	layoutManager.hideCover();
}

/**
 *
 */
InfoWindowMenu.prototype.show = function (type) {
	this.type = type;
	this.checkbox.checked = false;

	WindowMenu.prototype.show.call(this);
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
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	WindowMenu.call(this, title);

	this.fields = fields;
	this.not_valid_characters = ['/', '?', '&', ':', '#', '=']

	var table = document.createElement('table');
	for (var fieldId in this.fields) {
		var field = this.fields[fieldId];
		var row = document.createElement('tr');
		table.appendChild(row);

		if (field.type === 'separator') {
			var separator = document.createElement('td');
			separator.setAttribute('colspan', '2');
			var hr = document.createElement('hr');
			separator.appendChild(hr);
			row.appendChild(separator);
			delete this.fields[fieldId];
			continue;
		}

		// Label Cell
		var labelCell = document.createElement('td');
		row.appendChild(labelCell);

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
		row.appendChild(inputCell);

		var extraElements = [];
		switch (field.type) {
		case 'color':
			var input = document.createElement('input');
			input.setAttribute('maxlength', 6);
			input.setAttribute('type', 'text');
			input.setAttribute('class', 'color_input');
			var inputId = fieldId + '_input';
			input.setAttribute('id', inputId);

			var button = document.createElement('button');
			button.setAttribute('class', 'color_button');
			extraElements.push(button);

			var sample = document.createElement('input');
			var sampleId = fieldId + '_sample';
			sample.setAttribute('id', sampleId);
			sample.setAttribute('size', '1');
			sample.setAttribute('type', 'text');
			sample.setAttribute('disabled', 'disabled');
			extraElements.push(sample);

			button.observe('click',
			    function() {
			        showColorGrid3(inputId, sampleId);
			    });
			break;
		case 'select':
			var input = document.createElement('select');
			for (var i = 0; i < field.options.length; i++) {
				var option = document.createElement('option');
				option.textContent = field.options[i][1];
				option.setAttribute('value', field.options[i][0]);
				input.appendChild(option);
			}
			break;
		case 'longtext':
			var input = document.createElement('textarea');
			input.setAttribute('cols', '50');
			input.setAttribute('rows', '3');
			break;
		case 'id':
		case 'url':
		case 'text':
			var input = document.createElement('input');
			input.setAttribute('type', 'text');
			break;
		case 'boolean':
			var input = document.createElement('input');
			input.setAttribute('type', 'checkbox');
			break;
		}
		inputCell.appendChild(input);

		field.input = input;
		field.defaultValue = field.defaultValue ? field.defaultValue : "";

		for (var i = 0; i < extraElements.length; i++)
			inputCell.appendChild(extraElements[i]);
	}
	this.windowContent.insertBefore(table, this.msgElement);

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
	this.button.appendChild(document.createTextNode('Accept'));
	this.windowBottom.appendChild(this.button);
	this._acceptHandler = this._acceptHandler.bind(this);
	this.button.observe("click", this._acceptHandler);

	// Cancel button
	var cancelButton = document.createElement('button');
	cancelButton.appendChild(document.createTextNode('Cancel'));
	cancelButton.observe("click", this._closeListener);
	this.windowBottom.appendChild(cancelButton);
}
FormWindowMenu.prototype = new WindowMenu();

FormWindowMenu.prototype._isURL = function(string) {
	var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
	return regexp.test(string);
}

FormWindowMenu.prototype._isValidIdentifier = function(field_id) {
	var field = this.fields[field_id];

	for (var i = 0; i < this.not_valid_characters.length; i++) {
			var character = this.not_valid_characters[i];
			
			if (field.input.value.indexOf(character) >= 0)
				return false;
	}
	
	return true;
}

/**
 * Does extra checks for testing field validity. This method must be overwriten
 * by child classes for providing this extra checks.
 *
 * @param {Hash} form Hash with the current values
 */
FormWindowMenu.prototype.extraValidation = function(form) {
	//Parent implementation, allways true if no redefined by child class!
	return "";
}

FormWindowMenu.prototype._acceptHandler = function(e) {
	var emptyRequiredFields = "";
	var badURLFields = "";
	var badIdFields = "";
	var errorMsg = "";

	// Validate input fields
	for (var fieldId in this.fields) {
		var field = this.fields[fieldId];
		if (field.required && field.input.value == "")
			emptyRequiredFields += ", " + field.label;

		if (field.input.value == "")
			continue;

		switch (field.type) {
		case 'longtext':
		case 'text':
			break;
		case 'url':
			if (!this._isURL(field.input.value))
				badURLFields += ", " + field.label;
			break;
		case 'id':
			for (var i = 0; i < this.not_valid_characters.length; i++) {
				var character = this.not_valid_characters[i];
				if (field.input.value.indexOf(character) >= 0)
					badIdFields += ", " + field.label;
			}
			break;
		}
	}

	// Extra validations
	var extraErrorMsg = this.extraValidation(form);

	// Build Error Message
	if (emptyRequiredFields != "") {
		var msg = gettext("The following required fields are empty: %(fields)s.");
		msg = interpolate(msg, {'fields': emptyRequiredFields.substring(2)}, true);
		errorMsg += "<p>" + msg + "</p>";
	}

	if (badIdFields != "") {
		var msg = gettext("The following fields contain invalid characters: %(fields)s.");
		msg = interpolate(msg, {'fields': badIdFields.substring(2)}, true);
		errorMsg += "<p>" + msg + "</p>";
	}

	if (badURLFields != "") {
		var msg = gettext("The following fields does not contain a valid URL: %(fields)s.");
		msg = interpolate(msg, {'fields': badURLFields.substring(2)}, true);
		errorMsg += "<p>" + msg + "</p>";
	}

	if (extraErrorMsg !== null && extraErrorMsg != "")
		errorMsg += "<p>" + extraErrorMsg + "</p>";

	// Show error message if needed
	if (errorMsg != "") {
		this.setMsg(errorMsg);
		return;
	} else {
		// Otherwise process the data
		var value;
		var form = new Object();
		for (var fieldId in this.fields) {
			var field = this.fields[fieldId];
			switch (field.type) {
			case 'color':
				value = this.fields[fieldId].input.value;
				if (value.indexOf('#') !== -1)
					value = value.substring(1);
				break;
			case 'boolean':
				value = this.fields[fieldId].input.checked;
				break;
			default:
				value = this.fields[fieldId].input.value;
				break;
			}
			if (field.required || value !== "")
				form[fieldId] = value;
		}

		this.executeOperation(form);
		LayoutManagerFactory.getInstance().hideCover();
	}
}

FormWindowMenu.prototype.show = function () {
	for (var fieldId in this.fields) {
		var field = this.fields[fieldId];
		field.input.value = field.defaultValue;
	}

	WindowMenu.prototype.show.call(this);
}

/**
 * Especific class for publish windows
 */
function PublishWindowMenu (element, fields) {
	var fields = {
		'name': {label: gettext('Mashup Name'), type:'id', required: true},
		'vendor': {label: gettext('Vendor'), type:'id',  required: true},
		'version': {label: gettext('Version'), type:'id',  required: true},
		'author': {label: gettext('Author'), type:'text',  defaultValue: ezweb_user_name},
		'email': {label: gettext('Email'), type:'text',  required: true},
		'description': {label: gettext('Description'), type:'longtext'},
		'imageURI': {label: gettext('Image URL'), type:'url'},
		'wikiURI': {label: gettext('Wiki URL'), type:'url'},
		'organization'  : {label: gettext('Organization'), type: 'text'},
	}

	FormWindowMenu.call(this, fields, gettext('Publish Workspace'));
}
PublishWindowMenu.prototype = new FormWindowMenu();

PublishWindowMenu.prototype.setFocus = function() {
	this.fields['name'].input.focus();
}

PublishWindowMenu.prototype.executeOperation = function(form) {
	OpManagerFactory.getInstance().activeWorkSpace.publish(form);
}

/**
 * Specific class for Feed creator window.
 */
function AddFeedMenu (element) {
	var fields = {
		'name'          : {label: gettext('Name'), type: 'id', required: true},
		'URL'           : {label: gettext('URL'), type: 'url',  required: true},
		'separator1': {type: 'separator', required: true},
		'imageURI'      : {label: gettext('Image URL'), type: 'url'},
		'iPhoneImageURI': {label: gettext('iPhone Image URL'), type: 'url'},
		'feed_color'    : {label: gettext('Template color'),
		                   type: 'select',
		                   options: [
		                             ['blue', gettext('blue')],
		                             ['orange', gettext('orange')],
		                             ['red', gettext('red')],
		                             ['green', gettext('green')],
		                            ],
		                  },
		'menu_color'    : {label: gettext('Menu Color'), type: 'color'},
		'organization'  : {label: gettext('Organization'), type: 'text'},
	}

	FormWindowMenu.call(this, fields, gettext('Add new feed'));

	// TODO remove this hackism needed by color input fields
	var colorpicker301 = document.createElement('div');
	colorpicker301.setAttribute('id', 'colorpicker301');
	colorpicker301.setAttribute('class', 'colorpicker301');
	this.htmlElement.insertBefore(colorpicker301, this.htmlElement.firstChild);
}
AddFeedMenu.prototype = new FormWindowMenu();

AddFeedMenu.prototype.setFocus = function() {
	this.fields['name'].input.focus();
}

AddFeedMenu.prototype.executeOperation = function(form) {
	function onError(transport, e) {
		alert("error generando el template");
		this.hide();
	}

	function onSuccess(transport) {
		var response = transport.responseText;
		var data = eval ('(' + response + ')');
		UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', data.URL);
	}

	var data = {"template_data": Object.toJSON(form)};
	PersistenceEngineFactory.getInstance().send_post(URIs.GADGET_TEMPLATE_GENERATOR.evaluate({'gadget_type': 'feed_reader'}), data, this, onSuccess, onError);
}

/**
 * Specific class for Site creator window.
 */
function AddSiteMenu (element) {
	var fields = {
		'name': {label: gettext('Name'), type: 'id', required: true},
		'URL': {label: gettext('URL'), type: 'url', required: true},
		'separator1': {type: 'separator', required: true},
		'parse_parameters': {label: gettext('Parse URL Parameters'), type: 'boolean'},
		'fixed_params': {label: gettext('Fixed Params'), type: 'text'},
		'default_params': {label: gettext('Default Param Values'), type: 'text'},
		'events': {label: gettext('Events'), type: 'text'},
		'separator2': {type: 'separator', required: true},
		'home_URL': {label: gettext('Home URL'), type: 'url'},
		'imageURI': {label: gettext('Image URL'), type: 'url'},
		'iPhoneImageURI': {label: gettext('iPhone Image URL'), type: 'url'},
		'menu_color': {label: gettext('Menu Color (Hex.)'), type: 'color'},
		'organization': {label: gettext('Organization'), type: 'text'},
		'source': {label: gettext('Source'), type: 'text'},
		'source_URL': {label: gettext('Source URL'), type: 'url'},
	}

	FormWindowMenu.call(this, fields, gettext('Add new site'));

	// TODO remove this hackism needed by color input fields
	var colorpicker301 = document.createElement('div');
	colorpicker301.setAttribute('id', 'colorpicker301');
	colorpicker301.setAttribute('class', 'colorpicker301');
	this.htmlElement.insertBefore(colorpicker301, this.htmlElement.firstChild);
}
AddSiteMenu.prototype = new FormWindowMenu();

AddSiteMenu.prototype.setFocus = function() {
	this.fields['name'].input.focus();
}

AddSiteMenu.prototype.executeOperation = function(form) {
	function onError(transport, e) {
		alert("error generando el template");
		this.hide();
	}

	function onSuccess(transport) {
		var response = transport.responseText;
		var data = eval ('(' + response + ')');
		UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', data.URL);
	}

	var data = {"template_data": Object.toJSON(form)};
	PersistenceEngineFactory.getInstance().send_post(URIs.GADGET_TEMPLATE_GENERATOR.evaluate({'gadget_type': 'web_browser'}), data, this, onSuccess, onError);
}

/**
 * Specific class for Sharing workspace results window!
 */
function SharedWorkSpaceMenu() {
	WindowMenu.call(this, gettext('Shared WorkSpace Info'));
	this.htmlElement.addClassName('info_menu');

	// Extra HTML Elements
	var icon = document.createElement('img');
	icon.setAttribute('src', _currentTheme.getIconURL('info'));
	icon.setAttribute('alt', gettext('Info:'));
	this.windowContent.insertBefore(icon, this.msgElement);
	
	// Extra HTML Elements (url and html_code)
	//Table
	this.addElement('tableElement', 'table', 'windowContent');
	
	//TR1
	this.addElement('tr1Element', 'tr', 'tableElement');
	
	//TD11
	this.addElement('td11Element', 'td', 'tr1Element');
	
	//LABEL1
	this.addElement('label1', 'label', 'td11Element');
	this.label1.innerHTML = 'URL:';
	
	//TD12
	this.addElement('td12Element', 'td', 'tr1Element');
	
	//URL
	this.addElement('urlElement', 'input', 'td12Element');
	
	//TR2
	this.addElement('tr2Element', 'tr', 'tableElement');
	
	//TD21
	this.addElement('td21Element', 'td', 'tr2Element');
	
	//LABEL2
	this.addElement('label2', 'label', 'td21Element');
	this.label2.innerHTML = 'HTML code:';
	
	//TD12
	this.addElement('td22Element', 'td', 'tr2Element');
	
	//HTML
	this.addElement('html_codeElement', 'textarea', 'td22Element');
	this.html_codeElement.setAttribute('cols', 30);
	this.html_codeElement.setAttribute('rows', 3);
}
SharedWorkSpaceMenu.prototype = new WindowMenu();

SharedWorkSpaceMenu.prototype.addElement = function(element_name, html_tag, father_name) {
	eval('this.' + element_name + '= document.createElement(html_tag)');
	eval('this.' + father_name + '.appendChild(this.' + element_name + ')');
}

SharedWorkSpaceMenu.prototype.setURL = function(url) {
	this.urlElement.value = url;
}

SharedWorkSpaceMenu.prototype.setHTML = function(url) {
    var html_code = '<object width="" height="" data="' + url + '"></object>';
	
	this.html_codeElement.value = html_code;
}
