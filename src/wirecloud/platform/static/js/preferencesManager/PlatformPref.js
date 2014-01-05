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
 *
 */
function PlatformPreferencesDef(definitions) {
	Wirecloud.PreferencesDef.call(this, definitions);
}
PlatformPreferencesDef.prototype = new Wirecloud.PreferencesDef();

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
	Wirecloud.PreferencesDef.call(this, definitions);
}
WorkspacePreferencesDef.prototype = new Wirecloud.PreferencesDef();

WorkspacePreferencesDef.prototype.buildPreferences = function(values, workspace) {
	return new Wirecloud.WorkspacePreferences(this, workspace, values);
}

/**
 *
 */
function TabPreferencesDef(definitions) {
	Wirecloud.PreferencesDef.call(this, definitions);
}
TabPreferencesDef.prototype = new Wirecloud.PreferencesDef();

TabPreferencesDef.prototype.buildPreferences = function(values, tab) {
	return new Wirecloud.TabPreferences(this, tab, values);
}
