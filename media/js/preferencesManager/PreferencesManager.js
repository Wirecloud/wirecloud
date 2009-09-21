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
				var preferenceDef = new PreferenceDef(key, inputInterface);
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
		 * Returns the preferences definitions for the given scope.
		 *
		 * @return {PreferencesDef}
		 */
		PreferencesManager.prototype.getPreferencesDef = function(scope) {
			return this.preferencesDef[scope];
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

			var manager = this.preferencesDef[scope];
			return manager.buildPreferences.apply(manager, args);
		}


		/*
		 * Constructor code
		 */
		var preferences;
		var definitions;

		// Platform Preferences
		preferences = {
		  "tip-0": {
		    "defaultValue": true,
		    "label":        gettext("Show catalogue tip"),
		    "type":         "boolean",
		    "description":  '',
		  },
		  "tip-1": {
		    "defaultValue": true,
		    "label":        gettext("Show wiring tip"),
		    "type":         "boolean",
		    "description":  '',
		  },
		  "tip-2": {
		    "defaultValue": true,
		    "label":        gettext("Show dragboard tip"),
		    "type":         "boolean",
		    "description":  '',
		  }
		};

		definitions = this._processDefinitions(preferences);
		this.preferencesDef['platform'] = new PlatformPreferencesDef(definitions);

		// Tab preferences
		preferences = {
		  "smart": {
		    "defaultValue":  true,
		    "label":         gettext("Smart grid"),
		    "type":          "boolean",
		    "description":   gettext(""),
		  },
		  "columns": {
		    "defaultValue":  20,
		    "label":         gettext("Grid columns"),
		    "type":          "integer",
		    "description":   gettext(""),
		  },
		  "cell-height": {
		    "defaultValue":  12,
		    "label":         gettext("Cell Heigth (in pixels)"),
		    "type":          "integer",
		    "description":   gettext(""),
		  },
		  "horizontal-margin": {
		    "defaultValue":  4,
		    "label":         gettext("Horizontal Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Horizontal Margin between iGadgets. Must be specified in pixel units."),
		  },
		  "vertical-margin": {
		    "defaultValue":  3,
		    "label":         gettext("Vertical Margin between iGadgets (in pixels)"),
		    "type":          "integer",
		    "description":   gettext("Vertical Margin between iGadgets. Must be specified in pixel units."),
		  }
		}
		definitions = this._processDefinitions(preferences);
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
