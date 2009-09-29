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
 * @param {String} name
 * @param {InputInterface} inputInterface
 * @param {Boolean} inheritable
 * @param {Boolean} inheritByDefault
 * @param {Boolean} hidden
 */
function PreferenceDef(name, inputInterface, inheritable, inheritByDefault, hidden) {
	this.name = name;
	this.inputInterface = inputInterface;
	this.inheritable = inheritable === true;
	this.inheritByDefault = inheritable && inheritByDefault;
	this.hidden = hidden === true;

	// Interfaces
	if (this.inheritable)
		this.inheritInterface = InterfaceFactory.createInterface('inherit-' + this.name, {'type': 'boolean'});

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

PreferenceDef.prototype.getInheritInterface = function () {
	return this.inheritInterface;
}

PreferenceDef.prototype.isHidden = function () {
	return this.hidden;
}

PreferenceDef.prototype.isInheritable = function () {
	return this.inheritable;
}

/**
 * abstract
 * @author jmostazo-upm
 *
 * @param {PreferenceDef} preferenceDef
 * @param {Preferences}   manager The preference Group this preference belongs to
 * @param {Boolean}       inherit Use the value from the parent preference group
 * @param {Object}        value   Current value
 */
function PlatformPref(manager, preferenceDef, inherit, value) {
	this.definition = preferenceDef;
	this.manager = manager;
	this.inherit = inherit;
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

PlatformPref.prototype.getValue = function() {
	return this.value;
}

PlatformPref.prototype._getParentValue = function() {
	return this.manager.getParentValue(this.definition.name);
}

PlatformPref.prototype.setInheritValue = function (newValue) {
	this.inherit = newValue;
}

PlatformPref.prototype.getEffectiveValue = function() {
	if (this.inherit)
		return this._getParentValue();

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

PlatformPref.prototype._setManager = function(manager) {
	this.manager = manager;
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
	if (this.definition.inheritInterface) {
		this.definition.inheritInterface._setValue(this.inherit);
		this.definition.inputInterface.setDisabled(this.inherit);
	}
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
	this._table.setAttribute('cellspacing', '0');
	this._table.setAttribute('cellpadding', '0');

	var tbody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
	this._table.appendChild(tbody);

	for (var key in this._preferences) {
		var preference = this._preferences[key];

		if (preference.isHidden())
			continue;

		if (!preference.isInheritable()) {
			var row = tbody.insertRow(-1);
			var columnLabel = row.insertCell(-1);
			columnLabel.className = "label";
			var columnValue = row.insertCell(-1);
			columnLabel.appendChild(preference.getLabelInterface());
			preference.getInterface()._insertInto(columnValue);
		} else {
			var complexRow = tbody.insertRow(-1);
			var complexCell = complexRow.insertCell(-1);
			complexCell.colSpan = "2";

			var complexTable = $(document.createElement('table'));
			complexTable.addClassName('complexTable');
			complexTable.setAttribute('cellspacing', '0');
			complexTable.setAttribute('cellpadding', '0');
			complexCell.appendChild(complexTable);

			var complexTBody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
			complexTable.appendChild(complexTBody);

			var labelRow = complexTBody.insertRow(-1);
			var columnLabel = labelRow.insertCell(-1);
			columnLabel.className = "label";
			columnLabel.colSpan = "2";

			var prefRow = complexTBody.insertRow(-1);
			var inheritCell = $(prefRow.insertCell(-1));
			inheritCell.addClassName('inheritCell');

			var inheritInput = preference.getInheritInterface();
			inheritInput._insertInto(inheritCell);
			inheritCell.appendChild(document.createTextNode(gettext('Inherit')));
			Event.observe(inheritInput.inputElement,
			    'change',
			    function() {
			        this.getInterface().setDisabled(this.inheritInterface.getValue());
			    }.bind(preference));

			var columnValue = prefRow.insertCell(-1);
			columnLabel.appendChild(preference.getLabelInterface());
			preference.getInterface()._insertInto(columnValue);
		}
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
function WorkSpacePreferencesDef(definitions) {
	PreferencesDef.call(this, definitions);
}
WorkSpacePreferencesDef.prototype = new PreferencesDef();

WorkSpacePreferencesDef.prototype.buildPreferences = function(values, workspace) {
	return new WorkSpacePreferences(this._preferences, workspace, values);
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
			inherit = values[definition.name].inherit;
			value = definition.inputInterface.parseFromPersistence(values[definition.name].value);
		} else {
			value = definition.inputInterface.getDefaultValue();
			inherit = definition.inheritByDefault;
		}

		this._preferences[definition.name] = new PlatformPref(this, definition, inherit, value);
	}

	// Bind _handleParentChanges method
	this._handleParentChanges = this._handleParentChanges.bind(this);

	// Init handlers attribute
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

Preferences.prototype.removeCommitHandler = function(handler) {
	var index = this.handlers.indexOf(handler);
	if (index != -1)
		this.handlers.splice(index, 1);
}

Preferences.prototype.get = function(name) {
	return this._preferences[name].getEffectiveValue();
}

Preferences.prototype.set = function(name, newValue) {
	this._preferences[name].setValue(newValue);

	var modifiedValues = {};
	modifiedValues[name] = {value: newValue};
	this._notifyCommitHandlers(modifiedValues)
	this._save(modifiedValues);
}

Preferences.prototype._onSuccessSavePreferences = function() {
}

Preferences.prototype._onErrorSavePreferences = function() {
}

Preferences.prototype._handleParentChanges = function(modifiedValues) {
	var valuesToPropagate = {};
	var propagate = false;

	for (var preferenceName in modifiedValues) {
		if (preferenceName in this._preferences && this._preferences[preferenceName].inherit) {
			propagate = true;
			valuesToPropagate[preferenceName] = modifiedValues[preferenceName];
		}
	}

	if (propagate) {
		this._notifyCommitHandlers(valuesToPropagate);
	}
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
	var newEffectiveValues = {};
	var notify = false;

	for (var key in this._preferences) {
		var preference = this._preferences[key];

		// Check if this preference has changed
		var inheritSettingChange = false;
		if (preference.definition.inheritInterface) {
			var newInheritanceSetting = preference.definition.inheritInterface.getValue();
			inheritSettingChange = newInheritanceSetting != preference.inherit;
		}

		var newValue = preference.getValueFromInterface();
		var valueChange = preference.getValue() != newValue;

		if (!inheritSettingChange && !valueChange)
			continue; // This preference has not changed

		// Process preference changes
		modifiedPreferences.push(preference);
		var oldEffectiveValue = preference.getEffectiveValue();
		var changes = {}

		if (inheritSettingChange) {
			changes['inherit'] = newInheritanceSetting;
			preference.setInheritValue(newInheritanceSetting);
		}

		if (valueChange) {
			changes['value'] = newValue;
			preference.setValue(newValue);
		}

		var newEffectiveValue = preference.getEffectiveValue();
		if (oldEffectiveValue != newEffectiveValue) {
			notify = true;
			newEffectiveValues[key] = newEffectiveValue;
		}

		modifiedValues[key] = changes;
	}

	if (notify) {
		this._notifyCommitHandlers(newEffectiveValues);
	}

	if (modifiedPreferences.length != 0) {
		this._save(modifiedValues);
	}
}

Preferences.prototype.destroy = function() {
}

/**
 *
 */
function PlatformPreferences(definitions, values) {
	Preferences.call(this, definitions, values);
}
PlatformPreferences.prototype = new Preferences();

PlatformPreferences.prototype.buildTitle = function() {
	return gettext("Platform Preferences");
}

PlatformPreferences.prototype._save = function(modifiedValues) {
	PersistenceEngineFactory.getInstance().send_update(URIs.PLATFORM_PREFERENCES, {"preferences": JSON.stringify(modifiedValues)},
	     this, this._onSuccessSavePreferences, this._onErrorSavePreferences);
}

/**
 *
 */
function WorkSpacePreferences(definitions, workspace, values) {
	Preferences.call(this, definitions, values);
	this._workspace = workspace;

	PreferencesManagerFactory.getInstance().getPlatformPreferences().addCommitHandler(this._handleParentChanges);
}
WorkSpacePreferences.prototype = new Preferences();

WorkSpacePreferences.prototype.buildTitle = function() {
	var msg = gettext("WorkSpace preferences (%(workspaceName)s)");
	return interpolate(msg, {workspaceName: this._workspace.workSpaceState.name}, true);
}

WorkSpacePreferences.prototype.getParentValue = function(name) {
	return PreferencesManagerFactory.getInstance().getPlatformPreferences().get(name);
}

WorkSpacePreferences.prototype._save = function(modifiedValues) {
	var url = URIs.WORKSPACE_PREFERENCES.evaluate({workspace_id: this._workspace.workSpaceState.id});

	PersistenceEngineFactory.getInstance().send_update(url, {"preferences": JSON.stringify(modifiedValues)},
	     this, this._onSuccessSavePreferences, this._onErrorSavePreferences);
}

WorkSpacePreferences.prototype.destroy = function() {
	PreferencesManagerFactory.getInstance().getPlatformPreferences().removeCommitHandler(this._handleParentChanges);

	Preferences.prototype.destroy.call(this);
	this._workspace = null;
}

/**
 *
 */
function TabPreferences(definitions, tab, values) {
	Preferences.call(this, definitions, values);
	this._tab = tab;
	this._workspace = this._tab.workSpace;

	this._workspace.preferences.addCommitHandler(this._handleParentChanges);
}
TabPreferences.prototype = new Preferences();

TabPreferences.prototype.buildTitle = function() {
	var msg = gettext("Tab preferences (%(tabName)s)");
	return interpolate(msg, {tabName: this._tab.tabInfo.name}, true);
}

TabPreferences.prototype.getParentValue = function(name) {
	return this._workspace.preferences.get(name);
}

TabPreferences.prototype._save = function(modifiedValues) {
	var url = URIs.TAB_PREFERENCES.evaluate({workspace_id: this._workspace.workSpaceState.id, tab_id: this._tab.tabInfo.id});

	PersistenceEngineFactory.getInstance().send_update(url, {"preferences": JSON.stringify(modifiedValues)},
	     this, this._onSuccessSavePreferences, this._onErrorSavePreferences);
}

TabPreferences.prototype.destroy = function() {
	this._workspace.preferences.removeCommitHandler(this._handleParentChanges);

	Preferences.prototype.destroy.call(this);
	this._workspace = null;
	this._tab = null;
}
