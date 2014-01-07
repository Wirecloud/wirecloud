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

/*global Wirecloud*/

(function () {

    "use strict";

    /**
     * @private
     */
    var onSuccessSavePreferences = function onSuccessSavePreferences() {
        var i, handlers;

        handlers = this.preferences.handlers['post-commit'];

        for (i = 0; i < handlers.length; i += 1) {
            handlers[i](this.modifiedValues);
        }
    };

    /**
     * @private
     */
    var onErrorSavePreferences = function onErrorSavePreferences() {
    };

    /**
     * @private
     */
    var persist = function persist(modifiedValues) {
        var context = {
            preferences: this,
            modifiedValues: modifiedValues
        };

        Wirecloud.io.makeRequest(this._build_save_url(), {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(modifiedValues),
            onSuccess: onSuccessSavePreferences.bind(context),
            onFailure: onErrorSavePreferences.bind(context)
        });
    };

    /**
     * @private
     *
     * Notifies modified values to commit handlers. This method does not
     * notify modified values to each specific preference handlers.
     */
    var notifyCommitHandlers = function notifyCommitHandlers(modifiedValues) {
        var len = this.handlers['pre-commit'].length;
        for (var i = 0; i < len; i++) {
            this.handlers['pre-commit'][i](modifiedValues);
        }
    };

    /**
     * @abstract
     */
    var Preferences = function Preferences(preferencesDef, values) {
        if (arguments.length === 0) {
            return;
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
                value = definition.default_value;
                inherit = definition.inheritByDefault;
            }

            this.preferences[definition.name] = new Wirecloud.PlatformPref(this, definition, inherit, value);
        }

        // Bind _handleParentChanges method
        this._handleParentChanges = this._handleParentChanges.bind(this);

        // Init handlers attribute
        this.handlers = {
            'pre-commit': [],
            'post-commit': []
        };
    };

    Preferences.prototype.addCommitHandler = function addCommitHandler(handler, _event) {
        _event = _event ? _event : 'pre-commit';

        if (_event in this.handlers) {
            this.handlers[_event].push(handler);
        }
    };

    Preferences.prototype.removeCommitHandler = function removeCommitHandler(handler, _event) {
        var index;

        _event = _event ? _event : 'pre-commit';
        if (_event in this.handlers) {
            index = this.handlers['pre-commit'].indexOf(handler);
            if (index !== -1) {
                this.handlers['pre-commit'].splice(index, 1);
            }
        }
    };

    Preferences.prototype.get = function get(name) {
        return this.preferences[name].getEffectiveValue();
    };

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
    Preferences.prototype.set = function set(newValues) {
        var newEffectiveValues = {};
        var modifiedValues = {};

        for (var name in newValues) {
            var preference = this.preferences[name];
            var changes = newValues[name];

            if ('inherit' in changes) {
                preference.inherit = changes.inherit;
            }

            if ('value' in changes) {
                preference.value = changes.value;
            }

            modifiedValues[name] = changes;
            newEffectiveValues[name] = preference.getEffectiveValue();
        }

        notifyCommitHandlers.call(this, newEffectiveValues);
        persist.call(this, modifiedValues);
    };

    Preferences.prototype._handleParentChanges = function _handleParentChanges(modifiedValues) {
        var valuesToPropagate = {};
        var propagate = false;

        for (var preferenceName in modifiedValues) {
            if (preferenceName in this.preferences && this.preferences[preferenceName].inherit) {
                propagate = true;
                valuesToPropagate[preferenceName] = modifiedValues[preferenceName];
            }
        }

        if (propagate) {
            notifyCommitHandlers.call(this, valuesToPropagate);
        }
    };

    Preferences.prototype.destroy = function destroy() {
    };

    Wirecloud.Preferences = Preferences;

})();
