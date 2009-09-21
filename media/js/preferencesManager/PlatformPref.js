/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2009 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
 */


/**
 * @param {InputInterface} inputInterface
 */
function PreferenceDef(name, inputInterface) {
	this.name = name;
	this.inputInterface = inputInterface;

	this.handlers = new Array();
}

PreferenceDef.prototype.getLabelInterface = function () {
	var label = document.createElement("label");
	label.appendChild(document.createTextNode(gettext(this.inputInterface.getLabel())));
	label.setAttribute("title", gettext(this.inputInterface.getDescription()));
	//label.setAttribute("for", this.name);
	return label;
}

PreferenceDef.prototype.getInterface = function () {
	return this.inputInterface;
}


/**
 * abstract
 * @author jmostazo-upm
 *
 * @param {PreferenceDef} preferenceDef
 * @param {Object} value current value
 */
function PlatformPref(preferenceDef, value) {
	this.definition = preferenceDef;
	this.value = value;

	this.handlers = new Array();
}

PlatformPref.prototype.getName = function () {
	return this.definition.name;
}

PlatformPref.prototype.getLabel = function () {
	return this.definition.inputInterface.label;
}

PlatformPref.prototype.getDescription = function () {
	return this.definition.inputInterface.description;
}

PlatformPref.prototype.getDefaultValue = function () {
	return this.definition.inputInterface.getDefaultValue();
}

PlatformPref.prototype.getValue = function () {
	return this.value;
}

PlatformPref.prototype.setValue = function (value) {
	if (this.definition.inputInterface.isValidValue(value)) {
		this.value = value;
	}
}

PlatformPref.prototype.addHandler = function(handler) {
	this.handlers.push(handler);
}

PlatformPref.prototype._propagate = function () {
	// Handlers
	for (var i = 0; i < this.handlers.length; i++) {
		try {
			this.handlers[i](this.scope, this.name, this.value);
		} catch (e) {
			// FIXME
		}
	}
}

PlatformPref.prototype.setDefaultValue = function () {
	this.setValue(this.definition.inputInterface.getDefaultValue());
}

PlatformPref.prototype.getValueFromInterface = function () {
	return this.definition.inputInterface.getValue();
}

PlatformPref.prototype.setValueInInterface = function (newValue) {
	this.definition.inputInterface.setValue(newValue);
}

PlatformPref.prototype.resetInterfaceValue = function () {
	this.definition.inputInterface._setValue(this.value);
}


/**
 * 
 */
function PreferencesDef(definitions) {
	if (arguments.length == 0)
		return;

	this._preferences = definitions;

	// Build a form skeleton for changing this gruop of preferences
	this._table = document.createElement('table');
	var tbody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
	this._table.appendChild(tbody);

	for (var key in this._preferences) {
		var preference = this._preferences[key];

		var row = tbody.insertRow(-1);
		var columnLabel = row.insertCell(-1);
		columnLabel.className = "label";
		var columnValue = row.insertCell(-1);
		columnLabel.appendChild(preference.getLabelInterface());
		preference.getInterface()._insertInto(columnValue);
	}
}

PreferencesDef.prototype.getInterface = function() {
	return this._table;
}

/**
 *
 */
function PlatformPreferencesDef(definitions) {
	PreferencesDef.call(this, definitions);
}
PlatformPreferencesDef.prototype = new PreferencesDef();

PlatformPreferencesDef.prototype.buildPreferences = function(values) {
	return new PlatformPreferences(this._preferences, values);
}

/**
 *
 */
function TabPreferencesDef(definitions) {
	PreferencesDef.call(this, definitions);
}
TabPreferencesDef.prototype = new PreferencesDef();

TabPreferencesDef.prototype.buildPreferences = function(values, tab) {
	return new TabPreferences(this._preferences, tab, values);
}

/**
 * @abstract
 */
function Preferences(definitions, values) {
	if (arguments.length == 0)
		return;

	this._preferences = new Object();
	for (var key in definitions) {
		var definition = definitions[key];

		if (definition.name in values) {
			value = definition.inputInterface.parseFromPersistence(values[definition.name]);
		} else {
			value = definition.inputInterface.getDefaultValue();
		}

		this._preferences[definition.name] = new PlatformPref(definition, value);
	}

	this.handlers = [];
}

Preferences.prototype.resetInterface = function() {
	for (var key in this._preferences) {
		var preference = this._preferences[key];
		preference.resetInterfaceValue();
	}
}

Preferences.prototype.addCommitHandler = function(handler) {
	this.handlers.push(handler);
}

Preferences.prototype.get = function(name) {
	return this._preferences[name].getValue();
}

Preferences.prototype.set = function(name, newValue) {
	this._preferences[name].setValue(newValue);

	var modifiedValues = {};
	modifiedValues[name] = newValue;
	this._notifyCommitHandlers(modifiedValues)
	this._save(modifiedValues);
}

Preferences.prototype._onSuccessSavePreferences = function() {
}

Preferences.prototype._onErrorSavePreferences = function() {
}

/**
 * @private
 *
 * Notifies modified values to commit handlers. This method does not
 * notify modified values to each specific preference handlers.
 */
Preferences.prototype._notifyCommitHandlers = function(modifiedValues) {
	var len = this.handlers.length
	for (var i = 0; i < len; i++) {
		this.handlers[i](modifiedValues);
	}
}

Preferences.prototype.save = function(modifiedPreferences) {
	var modifiedPreferences = [];
	var modifiedValues = {};

	for (var key in this._preferences) {
		var preference = this._preferences[key];
		var newValue = preference.getValueFromInterface();
		if (preference.getValue() != newValue) {
			preference.setValue(newValue);
			modifiedPreferences.push(preference);
			modifiedValues[key] = newValue;
		}
	}

	if (modifiedPreferences.length != 0) {
		// Notify changes
		// this._propagateModifiedValues(modifiedPreferences);

		this._notifyCommitHandlers(modifiedValues);
		this._save(modifiedValues);
	}
}

/**
 *
 */
function PlatformPreferences(definitions, values) {
	Preferences.call(this, definitions, values);
}
PlatformPreferences.prototype = new Preferences();

PlatformPreferences.prototype._save = function(modifiedValues) {
	PersistenceEngineFactory.getInstance().send_update(URIs.PLATFORM_PREFERENCES, {"preferences": JSON.stringify(modifiedValues)},
	     this, this._onSuccessSavePreferences, this._onErrorSavePreferences);
}

/**
 *
 */
function TabPreferences(definitions, tab, values) {
	Preferences.call(this, definitions, values);
	this._tab = tab;
}
TabPreferences.prototype = new Preferences();

TabPreferences.prototype._save = function(modifiedValues) {
	var url = URIs.TAB_PREFERENCES.evaluate({workspace_id: this._tab.workSpace.workSpaceState.id, tab_id: this._tab.tabInfo.id});

	PersistenceEngineFactory.getInstance().send_update(url, {"preferences": JSON.stringify(modifiedValues)},
	     this, this._onSuccessSavePreferences, this._onErrorSavePreferences);
}

