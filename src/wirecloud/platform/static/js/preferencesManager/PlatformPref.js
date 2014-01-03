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


var build_pref_label = function build_pref_label(preference) {
   var label = document.createElement("label");
   label.appendChild(document.createTextNode(preference.label));
   label.setAttribute("title", gettext(preference.description));
   //label.setAttribute("for", preference.name);
   return label;
};

var build_inherit_input = function build_inherit_input(preference) {
    return StyledElements.DefaultInputInterfaceFactory.createInterface('inherit-' + preference.name, {'type': 'boolean'});
};

var build_pref_input = function build_pref_input(preference) {
    return StyledElements.DefaultInputInterfaceFactory.createInterface(preference.name, preference.options);
};

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

		if (preference.hidden) {
			continue;
        }

        var input_interface = build_pref_input(preference);
		if (!preference.inheritable) {
			var row = tbody.insertRow(-1);
			var columnLabel = row.insertCell(-1);
			columnLabel.className = "label-cell";
			var columnValue = row.insertCell(-1);
			columnLabel.appendChild(build_pref_label(preference));
			input_interface.insertInto(columnValue);
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

			var inheritInput = build_inherit_input(preference);
			inheritInput.insertInto(inheritCell);
			inheritCell.appendChild(document.createTextNode(gettext('Inherit')));
			inheritInput.inputElement.addEventListener(
			    'change',
			    function() {
			        this.input_interface.setDisabled(this.inherit_interface.getValue());
			    }.bind({input_interface: input_interface, inherit_interface: inheritInput}));

			var columnValue = prefRow.insertCell(-1);
			columnLabel.appendChild(build_pref_label(preference));
			input_interface.insertInto(columnValue);
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
	return new Wirecloud.PlatformPreferences(this, values);
}

/**
 *
 */
function WorkspacePreferencesDef(definitions, args) {
	var extra_prefs, empty_params, param, workspace = args[1];

	extra_prefs = Wirecloud.PreferenceManager.processDefinitions(workspace.workspaceState.extra_prefs);
	if (Array.isArray(args[2]) && args[2].length > 0) {
		empty_params = args[2];
		definitions = {};
		for (i = 0; i < empty_params.length; i += 1) {
			param = empty_params[i];
			definitions[param] = extra_prefs[param];
		}
	} else if (workspace.workspaceState != null) {
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
	return new Wirecloud.TabPreferences(this, tab, values);
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
			value = values[key].value;
		} else {
			value = definition.default_value;
			inherit = definition.inheritByDefault;
		}

		this._preferences[definition.name] = new Wirecloud.PlatformPref(this, definition, inherit, value);
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
        requestHeaders: {'Accept': 'application/json'},
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

Preferences.prototype.destroy = function destroy() {
};

/**
 *
 */
function WorkspacePreferences(definitions, workspace, values) {
	Preferences.call(this, definitions, values);
	this._workspace = workspace;

	Wirecloud.preferences.addCommitHandler(this._handleParentChanges);
}
WorkspacePreferences.prototype = new Preferences();

WorkspacePreferences.prototype.buildTitle = function() {
	var msg = gettext("Workspace preferences (%(workspaceName)s)");
	return interpolate(msg, {workspaceName: this._workspace.workspaceState.name}, true);
}

WorkspacePreferences.prototype.getParentValue = function(name) {
	return Wirecloud.preferences.get(name);
}

WorkspacePreferences.prototype._build_save_url = function () {
    return Wirecloud.URLs.WORKSPACE_PREFERENCES.evaluate({workspace_id: this._workspace.workspaceState.id});
};

WorkspacePreferences.prototype.destroy = function() {
	Wirecloud.preferences.removeCommitHandler(this._handleParentChanges);

	Preferences.prototype.destroy.call(this);
	this._workspace = null;
}
