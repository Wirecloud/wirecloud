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
		this.inheritInterface = StyledElements.DefaultInputInterfaceFactory.createInterface('inherit-' + this.name, {'type': 'boolean'});

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

	var tbody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
	this._table.appendChild(tbody);

	for (var key in this._preferences) {
		var preference = this._preferences[key];

		if (preference.isHidden())
			continue;

		if (!preference.isInheritable()) {
			var row = tbody.insertRow(-1);
			var columnLabel = row.insertCell(-1);
			columnLabel.className = "label-cell";
			var columnValue = row.insertCell(-1);
			columnLabel.appendChild(preference.getLabelInterface());
			preference.getInterface().insertInto(columnValue);
		} else {
			var complexRow = tbody.insertRow(-1);
			var complexCell = complexRow.insertCell(-1);
			complexCell.colSpan = "2";

			var complexTable = document.createElement('table');
			complexTable.classList.add('complexTable');
			complexTable.setAttribute('cellspacing', '0');
			complexTable.setAttribute('cellpadding', '0');
			complexCell.appendChild(complexTable);

			var complexTBody = document.createElement('tbody'); // IE7 needs a tbody to display dynamic tables
			complexTable.appendChild(complexTBody);

			var labelRow = complexTBody.insertRow(-1);
			var columnLabel = labelRow.insertCell(-1);
			columnLabel.className = "label-cell";
			columnLabel.colSpan = "2";

			var prefRow = complexTBody.insertRow(-1);
			var inheritCell = prefRow.insertCell(-1);
			inheritCell.classList.add('inheritCell');

			var inheritInput = preference.getInheritInterface();
			inheritInput.insertInto(inheritCell);
			inheritCell.appendChild(document.createTextNode(gettext('Inherit')));
			inheritInput.inputElement.addEventListener(
			    'change',
			    function() {
			        this.getInterface().setDisabled(this.inheritInterface.getValue());
			    }.bind(preference));

			var columnValue = prefRow.insertCell(-1);
			columnLabel.appendChild(preference.getLabelInterface());
			preference.getInterface().insertInto(columnValue);
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
	return new PlatformPreferences(this, values);
}

/**
 *
 */
function WorkspacePreferencesDef(definitions, args) {
	var extra_prefs, prefManager, empty_params, param, workspace = args[1];

	if (args[2] instanceof Array && args[2].length > 0) {
		prefManager = PreferencesManagerFactory.getInstance();
		extra_prefs = prefManager._processDefinitions(workspace.workspaceGlobalInfo.extra_prefs);
		empty_params = args[2];
		definitions = {};
		for (i = 0; i < empty_params.length; i += 1) {
			param = empty_params[i];
			definitions[param] = extra_prefs[param];
		}
	} else if (workspace.workspaceGlobalInfo != null) {
		prefManager = PreferencesManagerFactory.getInstance();
		extra_prefs = prefManager._processDefinitions(workspace.workspaceGlobalInfo.extra_prefs);
		definitions = Wirecloud.Utils.merge(definitions, extra_prefs);
	}
	PreferencesDef.call(this, definitions);
}
WorkspacePreferencesDef.prototype = new PreferencesDef();

WorkspacePreferencesDef.prototype.buildPreferences = function(values, workspace) {
	return new WorkspacePreferences(this, workspace, values);
}

/**
 *
 */
function TabPreferencesDef(definitions) {
	PreferencesDef.call(this, definitions);
}
TabPreferencesDef.prototype = new PreferencesDef();

TabPreferencesDef.prototype.buildPreferences = function(values, tab) {
	return new TabPreferences(this, tab, values);
}

/**
 * @abstract
 */
function Preferences(preferencesDef, values) {
	if (arguments.length == 0)
		return;

	var definitions = preferencesDef._preferences;
	this._preferencesDef = preferencesDef;

	this._preferences = new Object();

	var inherit, value, definition;
	for (var key in definitions) {
		definition = definitions[key];

		if (key in values) {
			inherit = values[definition.name].inherit;
			value = definition.inputInterface.parseFromPersistence(values[key].value);
		} else {
			value = definition.inputInterface.getDefaultValue();
			inherit = definition.inheritByDefault;
		}

		this._preferences[definition.name] = new PlatformPref(this, definition, inherit, value);
	}

	// Bind _handleParentChanges method
	this._handleParentChanges = this._handleParentChanges.bind(this);

    // Init handlers attribute
    this.handlers = {
        'pre-commit': [],
        'post-commit': []
    };
}

Preferences.prototype.resetInterface = function() {
	for (var key in this._preferences) {
		var preference = this._preferences[key];
		preference.resetInterfaceValue();
	}
}

Preferences.prototype.addCommitHandler = function(handler, _event) {
    _event = _event ? _event : 'pre-commit';

    if (_event in this.handlers) {
        this.handlers[_event].push(handler);
    }
};

Preferences.prototype.removeCommitHandler = function(handler, _event) {
    var index;

    _event = _event ? _event : 'pre-commit';
    if (_event in this.handlers) {
        index = this.handlers['pre-commit'].indexOf(handler);
        if (index !== -1) {
            this.handlers['pre-commit'].splice(index, 1);
        }
    }
};

Preferences.prototype.get = function(name) {
	return this._preferences[name].getEffectiveValue();
}

/**
 * Returns the preferences definitions for the given scope.
 *
 * @return {PreferencesDef}
 */
Preferences.prototype.getPreferencesDef = function() {
	return this._preferencesDef;
}

/**
 * Allows to change some preferences programatically.
 *
 * Example:
 * <code>
 * preferences.set({
 *                  'theme':  {inherit: true},
 *                  'locked': {value: true}
 *                 });
 * </code>
 *
 * @param {Object} newValues a hash with preferenceName/changes pairs
 */
Preferences.prototype.set = function(newValues) {
	var newEffectiveValues = {};
	var modifiedValues = {};

	for (var name in newValues) {
		var preference = this._preferences[name];
		var changes = newValues[name];

		if ('inherit' in changes)
			preference.setInheritValue(changes.inherit);

		if ('value' in changes)
			preference.setValue(changes.value);

		modifiedValues[name] = changes;
		newEffectiveValues[name] = preference.getEffectiveValue();
	}

	this._notifyCommitHandlers(newEffectiveValues)
	this._save(modifiedValues);
}

Preferences.prototype._onSuccessSavePreferences = function() {
    var i, handlers;

    handlers = this.preferences.handlers['post-commit'];

    for (i = 0; i < handlers.length; i += 1) {
        handlers[i](this.modifiedValues);
    }
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
    var len = this.handlers['pre-commit'].length;
    for (var i = 0; i < len; i++) {
	this.handlers['pre-commit'][i](modifiedValues);
    }
};

Preferences.prototype._save = function(modifiedValues) {
    var context = {
        preferences: this,
        modifiedValues: modifiedValues
    };

    Wirecloud.io.makeRequest(this._build_save_url(), {
        method: 'POST',
        contentType: 'application/json',
        postBody: JSON.stringify(modifiedValues),
        onSuccess: this._onSuccessSavePreferences.bind(context),
        onFailure: this._onErrorSavePreferences.bind(context),
        onException: this._onErrorSavePreferences.bind(context)
    });
};

/**
 * Saves the modified preferences. The new values are taken from the relevant
 * <code>Wirecloud.ui.PreferencesWindowMenu</code>.
 */
Preferences.prototype.save = function() {
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

		//if the value of the combo has changed or we don't want to use the inherited value
		//take the value of the combo.
		if (newInheritanceSetting == false || valueChange) {
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

PlatformPreferences.prototype._build_save_url = function () {
    return Wirecloud.URLs.PLATFORM_PREFERENCES;
};

/**
 *
 */
function WorkspacePreferences(definitions, workspace, values) {
	Preferences.call(this, definitions, values);
	this._workspace = workspace;

	PreferencesManagerFactory.getInstance().getPlatformPreferences().addCommitHandler(this._handleParentChanges);
}
WorkspacePreferences.prototype = new Preferences();

WorkspacePreferences.prototype.buildTitle = function() {
	var msg = gettext("Workspace preferences (%(workspaceName)s)");
	return interpolate(msg, {workspaceName: this._workspace.workspaceState.name}, true);
}

WorkspacePreferences.prototype.getParentValue = function(name) {
	return PreferencesManagerFactory.getInstance().getPlatformPreferences().get(name);
}

WorkspacePreferences.prototype._build_save_url = function () {
    return Wirecloud.URLs.WORKSPACE_PREFERENCES.evaluate({workspace_id: this._workspace.workspaceState.id});
};

WorkspacePreferences.prototype.destroy = function() {
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
	this._workspace = this._tab.workspace;

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

TabPreferences.prototype._build_save_url = function(modifiedValues) {
    return Wirecloud.URLs.TAB_PREFERENCES.evaluate({workspace_id: this._workspace.workspaceState.id, tab_id: this._tab.tabInfo.id});
};

TabPreferences.prototype.destroy = function() {
	this._workspace.preferences.removeCommitHandler(this._handleParentChanges);

	Preferences.prototype.destroy.call(this);
	this._workspace = null;
	this._tab = null;
}
