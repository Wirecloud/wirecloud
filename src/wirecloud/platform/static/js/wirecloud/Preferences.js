/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, se, utils) {

    "use strict";

    /**
     * @abstract
     */
    ns.Preferences = class Preferences extends se.ObjectWithEvents {

        constructor(preferencesDef, values) {
            if (preferencesDef == null) {
                throw new TypeError("missing preferencesDef parameter");
            }

            if (values == null) {
                values = {};
            }

            super(['pre-commit', 'post-commit']);

            Object.defineProperty(this, 'meta', {value: preferencesDef});
            Object.defineProperty(this, 'preferences', {value: {}});

            let inherit, value;
            for (let key in preferencesDef.preferences) {
                const definition = preferencesDef.preferences[key];

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
        }

        get(name) {
            return name in this.preferences ? this.preferences[name].getEffectiveValue() : undefined;
        }

        /**
         * Allows to change some preferences programatically.
         *
         * Example:
         *
         * ```javascript
         * preferences.set({
         *    theme:  {inherit: true},
         *    locked: {value: true}
         * });
         * ```
         *
         * @param {Object} newValues a hash with preferenceName/changes pairs
         */
        set(newValues) {
            var modifiedValues = {};
            let persist = false;

            for (let name in newValues) {
                let preference = this.preferences[name];
                let changes = utils.clone(newValues[name]);
                let changed = false;

                if ('inherit' in changes) {
                    if (preference.inherit !== changes.inherit) {
                        changed = persist = true;
                    } else {
                        delete changes.inherit;
                    }
                }

                if ('value' in changes) {
                    if (preference.value !== changes.value) {
                        changed = persist = true;
                        changes.value = Wirecloud.ui.InputInterfaceFactory.stringify(preference.meta.options.type, changes.value);
                    } else {
                        delete changes.value;
                    }
                }

                if (changed) {
                    modifiedValues[name] = changes;
                }
            }

            if (!persist) {
                // Nothing changed
                return Promise.resolve();
            }

            this.dispatchEvent('pre-commit', modifiedValues);
            return Wirecloud.io.makeRequest(this._build_save_url(), {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify(modifiedValues)
            }).then((response) => {
                if ([204, 401, 403, 422, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if (response.status !== 204) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                let newEffectiveValues = {};
                for (let name in modifiedValues) {
                    let preference = this.preferences[name];
                    let previousValue = preference.getEffectiveValue();
                    let changes = modifiedValues[name];

                    if ('inherit' in changes) {
                        preference.inherit = changes.inherit;
                    }

                    if ('value' in changes) {
                        preference.value = newValues[name].value;
                    }

                    let newValue = preference.getEffectiveValue();
                    if (previousValue !== newValue) {
                        newEffectiveValues[name] = newValue;
                    }
                }

                this.dispatchEvent('post-commit', newEffectiveValues);
            });
        }

        _handleParentChanges(parentPreferences, modifiedValues) {
            var valuesToPropagate = {};
            var propagate = false;

            for (var preferenceName in modifiedValues) {
                if (preferenceName in this.preferences && this.preferences[preferenceName].inherit) {
                    propagate = true;
                    valuesToPropagate[preferenceName] = modifiedValues[preferenceName];
                }
            }

            if (propagate) {
                this.dispatchEvent('post-commit', valuesToPropagate);
            }
        }

    }

})(Wirecloud, StyledElements, Wirecloud.Utils);
