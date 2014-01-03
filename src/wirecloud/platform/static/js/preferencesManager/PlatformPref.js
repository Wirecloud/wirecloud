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
	return new Wirecloud.WorkspacePreferences(this, workspace, values);
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
