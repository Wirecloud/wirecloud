/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global gettext, Wirecloud*/

(function () {

    "use strict";

    var PreferenceManager = function PreferenceManager() {

        this.preferencesDef = {};

        /**** PRIVATE METHODS ****/

        var definitions, i;

        // Platform Preferences
        var platformPreferences = {
            "language": {
                "label": gettext('Language'),
                "type": "select",
                "initialEntries": [
                    {value: 'default', label: gettext('Default setting')},
                    {value: 'browser', label: gettext('Browser detect')}
                ]
            }
        };

        // Workspace preferences
        var workspacePreferences = {
            "public": {
                "defaultValue":  false,
                "label":         gettext("Public"),
                "type":          "boolean",
                "description":   gettext("Allows other users to open this workspace (in read-only mode). (default: disabled)")
            },
            "layout": {
                "defaultValue":  "Fixed",
                "label":         gettext("Default grid layout"),
                "type":          "select",
                "initialEntries": [
                    {value: "Fixed", label: gettext("Fixed to the grid")},
                    {value: "Free", label: gettext("Out of the grid")}
                ],
                "description":   gettext("Default layout for the new widgets.")
            },
            "smart": {
                "defaultValue":  true,
                "label":         gettext("Smart grid for widgets fixed to the grid"),
                "type":          "boolean",
                "description":   gettext("iWidgets will be automatically reordered if this option is enabled. (default: enabled)")
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
                "label":         gettext("Horizontal Margin between iWidgets (in pixels)"),
                "type":          "integer",
                "description":   gettext("Horizontal Margin between iWidgets. Must be specified in pixel units. (default: 4)")
            },
            "vertical-margin": {
                "defaultValue":  3,
                "label":         gettext("Vertical Margin between iWidgets (in pixels)"),
                "type":          "integer",
                "description":   gettext("Vertical Margin between iWidgets. Must be specified in pixel units. (default: 3)")
            }
        };

        // Tab preferences
        var tabPreferences = {
            "layout": {
                "inheritable":   true,
                "inheritByDefault": true,
                "defaultValue":  "Fixed",
                "label":         gettext("Default grid layout"),
                "type":          "select",
                "initialEntries": [
                    {value: "Fixed", label: gettext("Fixed to the grid")},
                    {value: "Free", label: gettext("Out of the grid")}
                ],
                "description":   gettext("Default layout for the new widgets.")
            },
            "smart": {
                "inheritable":   true,
                "inheritByDefault": true,
                "defaultValue":  true,
                "label":         gettext("Smart grid for widgets fixed to the grid"),
                "type":          "boolean",
                "description":   gettext("iWidgets will be automatically reordered if this option is enabled. (default: enabled)")
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
                "label":         gettext("Horizontal Margin between iWidgets (in pixels)"),
                "type":          "integer",
                "description":   gettext("Horizontal Margin between iWidgets. Must be specified in pixel units. (default: 4)")
            },
            "vertical-margin": {
                "inheritable":   true,
                "inheritByDefault": true,
                "defaultValue":  3,
                "label":         gettext("Vertical Margin between iWidgets (in pixels)"),
                "type":          "integer",
                "description":   gettext("Vertical Margin between iWidgets. Must be specified in pixel units. (default: 3)")
            }
        };

        // Initialize some dynamic preferences (language)
        for (i = 0; i < Wirecloud.constants.AVAILABLE_LANGUAGES.length; i += 1) {
            platformPreferences.language.initialEntries.push(Wirecloud.constants.AVAILABLE_LANGUAGES[i]);
        }

        // Save they into our structures
        definitions = this.processDefinitions(platformPreferences);
        this.preferencesDef.platform = [Wirecloud.PlatformPreferencesDef, definitions];
        definitions = this.processDefinitions(workspacePreferences);
        this.preferencesDef.workspace = [Wirecloud.WorkspacePreferencesDef, definitions];
        definitions = this.processDefinitions(tabPreferences);
        this.preferencesDef.tab = [Wirecloud.TabPreferencesDef, definitions];
    };

    PreferenceManager.prototype.processDefinitions = function processDefinitions(preferences) {
        var definitions = {};
        for (var key in preferences) {
            var preference_data = preferences[key];
            var preferenceDef = new Wirecloud.PreferenceDef(key, preference_data.inheritable, preference_data.inheritByDefault, preference_data.hidden, preference_data);
            definitions[key] = preferenceDef;
        }
        return definitions;
    };

    /**
     * Builds a <code>Wirecloud.Preferences</code> instance suitable for the given scope.
     *
     * @param {String} scope
     *
     * @return {Preferences}
     */
    PreferenceManager.prototype.buildPreferences = function buildPreferences(scope, values) {
        var args = Array.prototype.slice.call(arguments, 1); // Remove scope argument

        if (!(scope in this.preferencesDef)) {
            throw new TypeError();
        }
        var manager = new (this.preferencesDef[scope][0])(this.preferencesDef[scope][1], args);

        return manager.buildPreferences.apply(manager, args);
    };

    Wirecloud.PreferenceManager = new PreferenceManager();

})();
