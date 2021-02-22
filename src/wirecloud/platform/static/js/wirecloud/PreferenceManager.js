/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    const PreferenceManager = class PreferenceManager {

        constructor() {
            this.preferencesDef = {};

            // Platform Preferences
            const platformPreferences = [
                {
                    "name": "language",
                    "label": utils.gettext('Language'),
                    "type": "select",
                    "initialEntries": [
                        {value: 'default', label: utils.gettext('Default setting')},
                        {value: 'browser', label: utils.gettext('Detect browser language')}
                    ]
                }
            ];

            // Initialize some dynamic preferences (language)
            Wirecloud.constants.AVAILABLE_LANGUAGES.forEach((language) => {
                platformPreferences[0].initialEntries.push(language);
            });

            // Save them into our structures
            let definitions = this.processDefinitions(platformPreferences);
            this.preferencesDef.platform = [Wirecloud.PlatformPreferencesDef, definitions];
            definitions = this.processDefinitions(Wirecloud.constants.WORKSPACE_PREFERENCES);
            this.preferencesDef.workspace = [Wirecloud.WorkspacePreferencesDef, definitions];
            definitions = this.processDefinitions(Wirecloud.constants.TAB_PREFERENCES);
            this.preferencesDef.tab = [Wirecloud.TabPreferencesDef, definitions];
        }

        /**
         * Builds a <code>Wirecloud.Preferences</code> instance suitable for the given scope.
         *
         * @param {String} scope
         *
         * @return {Preferences}
         */
        buildPreferences(scope, values) {
            const args = Array.prototype.slice.call(arguments, 1); // Remove scope argument

            if (!(scope in this.preferencesDef)) {
                throw new TypeError();
            }
            const PrefClass = this.preferencesDef[scope][0];
            const manager = new PrefClass(this.preferencesDef[scope][1], args);

            return manager.buildPreferences.apply(manager, args);
        }

        processDefinitions(preferences) {
            const definitions = {};

            preferences.forEach((preference_data) => {
                const preferenceDef = new Wirecloud.PreferenceDef(preference_data.name, preference_data.inheritable, preference_data.inheritByDefault, preference_data.hidden, preference_data);
                definitions[preference_data.name] = preferenceDef;
            });

            return definitions;
        }

    }

    Wirecloud.PreferenceManager = new PreferenceManager();

})(Wirecloud.Utils);
