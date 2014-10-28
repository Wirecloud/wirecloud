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
        var platformPreferences = [
            {
                "name": "language",
                "label": gettext('Language'),
                "type": "select",
                "initialEntries": [
                    {value: 'default', label: gettext('Default setting')},
                    {value: 'browser', label: gettext('Browser detect')}
                ]
            }
        ];

        // Tab preferences
        var tabPreferences = [
            {
                "name":             "layout",
                "inheritable":      true,
                "inheritByDefault": true,
                "defaultValue":     "Fixed",
                "label":            gettext("Default grid layout"),
                "type":             "select",
                "initialEntries": [
                    {value: "Fixed", label: gettext("Fixed to the grid")},
                    {value: "Free", label: gettext("Out of the grid")}
                ],
                "description":      gettext("Default layout for the new widgets.")
            },
            {
                "name":             "smart",
                "inheritable":      true,
                "inheritByDefault": true,
                "defaultValue":     true,
                "label":            gettext("Smart grid for widgets fixed to the grid"),
                "type":             "boolean",
                "description":      gettext("iWidgets will be automatically reordered if this option is enabled. (default: enabled)")
            },
            {
                "name":          "columns",
                "inheritable":   true,
                "inheritByDefault": true,
                "defaultValue":  20,
                "label":         gettext("Grid columns"),
                "type":          "number",
                "description":   gettext("Grid columns. (default: 20)")
            },
            {
                "name":          "cell-height",
                "inheritable":   true,
                "inheritByDefault": true,
                "defaultValue":  12,
                "label":         gettext("Cell Height (in pixels)"),
                "type":          "number",
                "description":   gettext("Cell Height. Must be specified in pixel units. (default: 13)")
            },
            {
                "name":             "horizontal-margin",
                "inheritable":      true,
                "inheritByDefault": true,
                "defaultValue":     4,
                "label":            gettext("Horizontal Margin between iWidgets (in pixels)"),
                "type":             "number",
                "description":      gettext("Horizontal Margin between iWidgets. Must be specified in pixel units. (default: 4)")
            },
            {
                "name":             "vertical-margin",
                "inheritable":      true,
                "inheritByDefault": true,
                "defaultValue":     3,
                "label":            gettext("Vertical Margin between iWidgets (in pixels)"),
                "type":             "number",
                "description":      gettext("Vertical Margin between iWidgets. Must be specified in pixel units. (default: 3)")
            }
        ];

        // Initialize some dynamic preferences (language)
        for (i = 0; i < Wirecloud.constants.AVAILABLE_LANGUAGES.length; i += 1) {
            platformPreferences[0].initialEntries.push(Wirecloud.constants.AVAILABLE_LANGUAGES[i]);
        }

        // Save them into our structures
        definitions = this.processDefinitions(platformPreferences);
        this.preferencesDef.platform = [Wirecloud.PlatformPreferencesDef, definitions];
        definitions = this.processDefinitions(Wirecloud.constants.WORKSPACE_PREFERENCES);
        this.preferencesDef.workspace = [Wirecloud.WorkspacePreferencesDef, definitions];
        definitions = this.processDefinitions(tabPreferences);
        this.preferencesDef.tab = [Wirecloud.TabPreferencesDef, definitions];
    };

    PreferenceManager.prototype.processDefinitions = function processDefinitions(preferences) {
        var i, preference_data, preferenceDef, definitions = {};

        for (i = 0; i < preferences.length; i++) {
            preference_data = preferences[i];
            preferenceDef = new Wirecloud.PreferenceDef(preference_data.name, preference_data.inheritable, preference_data.inheritByDefault, preference_data.hidden, preference_data);
            definitions[preference_data.name] = preferenceDef;
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
