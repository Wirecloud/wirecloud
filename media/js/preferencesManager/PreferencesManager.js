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
 * @author jmostazo-upm
 */
var PreferencesManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function PreferencesManager () {
		/**** PRIVATE VARIABLES ****/
		this.preferencesDef = new Hash();
                this.preferenceManagers = new Hash();
		this.preferences = null;
		this.languageModified = false; // Language preference has a special behavior

		/**** PRIVATE METHODS ****/
		var _onSuccessInitPreferences = function(transport_) {
			var response = JSON.parse(transport_.responseText);

			this.preferences = this.preferencesDef['platform'].buildPreferences(response);

			// Continue loading EzWeb Platform
			OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.PLATFORM_PREFERENCES);
		}

		var _onErrorInitPreferences = function(transport, e) {
			var logManager = LogManagerFactory.getInstance();
			var msg = logManager.formatError(gettext("Error retrieving platform preferences data: %(errorMsg)s"), transport, e);
			logManager.log(msg);

			// Continue using the defaults preferences
			this.preferences = this.preferencesDef['platform'].buildPreferences({});

			// Continue loading EzWeb Platform
			OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.PLATFORM_PREFERENCES);
		}

		PreferencesManager.prototype._processDefinitions = function(preferences) {
			var definitions = new Object();
			for (var key in preferences) {
				var preference_data = preferences[key];
				var inputInterface = InterfaceFactory.createInterface(key, preference_data);
				var preferenceDef = new PreferenceDef(key, inputInterface, preference_data.inheritable, preference_data.inheritByDefault, preference_data.hidden);
				definitions[key] = preferenceDef;
			}
			return definitions;
		}

		/**** PUBLIC METHODS ****/

		/**
		 * Shows the platform preferences dialog.
		 */
		PreferencesManager.prototype.show = function() {
			LayoutManagerFactory.getInstance().showPreferencesWindow('platform', this.preferences);
		}

		/**
		 * Returns the platform preferences.
		 *
		 * return {PlatformPreferences}
		 */
		PreferencesManager.prototype.getPlatformPreferences = function() {
			return this.preferences;
		}

		/**
		 * Builds a <code>Preferences</code> instance suitable for the given scope.
		 *
		 * @param {String} scope
		 *
		 * @return {Preferences}
		 */
		PreferencesManager.prototype.buildPreferences = function(scope, values) {
			var args = Array.prototype.slice.call(arguments, 1); // Remove scope argument

			var defs = this.preferencesDef[scope];
			if (defs instanceof PreferencesDef) {
				manager = defs;
			} else {
				manager = new this.preferenceManagers[scope](defs, args)
			}

			return manager.buildPreferences.apply(manager, args);
		}


		/*
		 * Constructor code
		 */
		var definitions;

		// Platform Preferences
		var platformPreferences = {
		  "skin": {
		    "label":         gettext("Skin"),
		    "type":          "select",
		    "options":       []
		  },
		  "tip-0": {
		    "defaultValue": true,
		    "label":        gettext("Show catalogue help dialog"),
		    "type":         "boolean",
		    "description":  ''
		  },
		  "tip-1": {
		    "defaultValue": true,
		    "label":        gettext("Show wiring help dialog"),
		    "type":         "boolean",
		    "description":  ''
		  },
		  "tip-2": {
		    "defaultValue": true,
		    "label":        gettext("Show dragboard help dialog"),
		    "type":         "boolean",
		    "description":  ''
		  }
		};

		// Workspace preferences
		var workspacePreferences = {
		  "skin": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "label":         gettext("Skin"),
		    "type":          "select",
		    "options":       [],
		    "description":   gettext("Skin to use as default. (default: inherit)")
		  },
		  "layout": {
		    "defaultValue":  "Fixed",
		    "label":         gettext("Default grid layout"),
		    "type":          "select",
		    "options":       [{value:"Fixed",label:gettext("Fixed to the grid")},{value:"Free",label:gettext("Out of the grid")}],
		    "description":   gettext("Default layout for the new gadgets.")
		  },
		  "smart": {
		    "defaultValue":  true,
		    "label":         gettext("Smart grid for gadgets fixed to the grid"),
		    "type":          "boolean",
		    "description":   gettext("iGadgets will be automatically reordered if this option is enabled. (default: enabled)")
		  },
		  "columns": {
		    "defaultValue":  20,
		    "label":         gettext("Grid columns"),
		    "type":          "integer",
		    "description":   gettext("Grid columns. (default: 20)")
		  },
		  "cell-height": {
		    "defaultValue":  12,
		    "label":         gettext("Cell Height (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Cell Height. Must be specified in pixel units. (default: 13)")
		  },
		  "horizontal-margin": {
		    "defaultValue":  4,
		    "label":         gettext("Horizontal Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Horizontal Margin between iGadgets. Must be specified in pixel units. (default: 4)")
		  },
		  "vertical-margin": {
		    "defaultValue":  3,
		    "label":         gettext("Vertical Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Vertical Margin between iGadgets. Must be specified in pixel units. (default: 3)")
		  }
		}

		// Tab preferences
		var tabPreferences = {
		  "layout": {
		  	"inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  "Fixed",
		    "label":         gettext("Default grid layout"),
		    "type":          "select",
		    "options":       [{value:"Fixed",label:gettext("Fixed to the grid")},{value:"Free",label:gettext("Out of the grid")}],
		    "description":   gettext("Default layout for the new gadgets.")
		  },
		  "smart": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  true,
		    "label":         gettext("Smart grid for gadgets fixed to the grid"),
		    "type":          "boolean",
		    "description":   gettext("iGadgets will be automatically reordered if this option is enabled. (default: enabled)")
		  },
		  "columns": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  20,
		    "label":         gettext("Grid columns"),
		    "type":          "integer",
		    "description":   gettext("Grid columns. (default: 20)")
		  },
		  "cell-height": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  12,
		    "label":         gettext("Cell Height (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Cell Height. Must be specified in pixel units. (default: 13)")
		  },
		  "horizontal-margin": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  4,
		    "label":         gettext("Horizontal Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Horizontal Margin between iGadgets. Must be specified in pixel units. (default: 4)")
		  },
		  "vertical-margin": {
		    "inheritable":   true,
		    "inheritByDefault": true,
		    "defaultValue":  3,
		    "label":         gettext("Vertical Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Vertical Margin between iGadgets. Must be specified in pixel units. (default: 3)")
		  }
		}

		// Initialize some dynamic preferences (theme...)
		platformPreferences['skin']['defaultValue'] = _DEFAULT_SKIN;
		var desc = gettext("Skin to use by default. (default: %(defaultValue)s)");
		platformPreferences['skin']['description'] = interpolate(desc, {defaultValue: _DEFAULT_SKIN}, true);
		workspacePreferences['skin']['defaultValue'] = _DEFAULT_SKIN;
		var themes = _SKINS;

		for (var i = 0; i < themes.length; i++) {
			var themeName = themes[i];
			workspacePreferences['skin']['options'].push({value: themeName, label: themeName});
			platformPreferences['skin']['options'].push({value: themeName, label: themeName});
		}

		// Save they into our structures
		definitions = this._processDefinitions(platformPreferences);
		this.preferencesDef['platform'] = new PlatformPreferencesDef(definitions);

		this.preferencesDef['workspace'] = this._processDefinitions(workspacePreferences);
		this.preferenceManagers['workspace'] = WorkSpacePreferencesDef;

		definitions = this._processDefinitions(tabPreferences);
		this.preferencesDef['tab'] = new TabPreferencesDef(definitions);

		// Init platform preferences
		PersistenceEngineFactory.getInstance().send_get(URIs.PLATFORM_PREFERENCES, this,
			_onSuccessInitPreferences, _onErrorInitPreferences);
	}

	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
		this.getInstance = function() {
			if (instance == null) {
				instance = new PreferencesManager();
			}
		return instance;
		}
	}
}();
