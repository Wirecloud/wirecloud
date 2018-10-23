/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    /**
     * @abstract
     */
    var Preferences = function Preferences(preferencesDef, values) {
        if (preferencesDef == null) {
            throw new TypeError("missing preferencesDef parameter");
        }

        if (values == null) {
            values = {};
        }

        Object.defineProperty(this, 'meta', {value: preferencesDef});
        Object.defineProperty(this, 'preferences', {value: {}});

        var inherit, value, definition;
        for (var key in preferencesDef.preferences) {
            definition = preferencesDef.preferences[key];

            if (key in values) {
                inherit = values[definition.name].inherit;
                value = values[key].value;
            } else {
                value = null;
                inherit = definition.inheritByDefault;
            }

            this.preferences[definition.name] = new Wirecloud.PlatformPref(this, definition, inherit, value);
        }

        // Bind _handleParentChanges method
        this._handleParentChanges = this._handleParentChanges.bind(this);

        StyledElements.ObjectWithEvents.call(this, ['pre-commit', 'post-commit']);
    };
    Preferences.prototype = new StyledElements.ObjectWithEvents();

    Preferences.prototype.get = function get(name) {
        return name in this.preferences ? this.preferences[name].getEffectiveValue() : undefined;
    };

    /**
     * Allows to change some preferences programatically.
     *
     * Example:
     *
     * ```javascript
     * preferences.set({
     *    'theme':  {inherit: true},
     *    'locked': {value: true}
     * });
     * ```
     *
     * @param {Object} newValues a hash with preferenceName/changes pairs
     */
    Preferences.prototype.set = function set(newValues) {
        var newEffectiveValues = {};
        var modifiedValues = {};

        for (var name in newValues) {
            var preference = this.preferences[name];
            var changes = newValues[name];
            let changed = false;
            let previousValue = preference.getEffectiveValue();

            if ('inherit' in changes) {
                changed = preference.inherit !== changes.inherit;
                preference.inherit = changes.inherit;
            }

            if ('value' in changes) {
                changed = changed || (preference.value !== changes.value);
                preference.value = changes.value;
                changes.value = Wirecloud.ui.InputInterfaceFactory.stringify(preference.meta.options.type, preference.value);
            }

            if (changed) {
                modifiedValues[name] = changes;
                let newValue = preference.getEffectiveValue();
                if (previousValue !== newValue) {
                    newEffectiveValues[name] = newValue;
                }
            }
        }

        if (Object.keys(modifiedValues).length === 0) {
            // Nothing changed
            return Promise.resolve();
        }

        this.dispatchEvent('pre-commit', newEffectiveValues);
        return Wirecloud.io.makeRequest(this._build_save_url(), {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(modifiedValues)
        }).then(() => {
            this.dispatchEvent('post-commit', modifiedValues);
        });
    };

    Preferences.prototype._handleParentChanges = function _handleParentChanges(parentPreferences, modifiedValues) {
        var valuesToPropagate = {};
        var propagate = false;

        for (var preferenceName in modifiedValues) {
            if (preferenceName in this.preferences && this.preferences[preferenceName].inherit) {
                propagate = true;
                valuesToPropagate[preferenceName] = modifiedValues[preferenceName];
            }
        }

        if (propagate) {
            this.dispatchEvent('pre-commit', valuesToPropagate);
        }
    };

    Wirecloud.Preferences = Preferences;

})(Wirecloud.Utils);
