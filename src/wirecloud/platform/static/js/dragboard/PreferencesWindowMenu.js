/*
 *     Copyright (c) 2012 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Form, gettext, Wirecloud*/

(function () {

    "use strict";

    var PreferencesWindowMenu = function PreferencesWindowMenu(css_class) {
        Wirecloud.ui.WindowMenu.call(this, gettext('Widget Settings'), css_class);
    };
    PreferencesWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    PreferencesWindowMenu.prototype._savePrefs = function _savePrefs(form, new_values) {
        var oldValue, newValue, varName, varManager, variable;
        
        varManager = this._current_iwidget.workspace.varManager;

        // Start propagation of the new values of the user pref variables
        varManager.incNestingLevel();

        /*
         * The new value is commited with 2 phases (first setting the value and then
         * propagating changes). This avoids the case where iwidgets read old values.
         */

        // Phase 1
        // Annotate new value of the variable without invoking callback function!
        for (varName in new_values) {
            variable = varManager.getVariableByName(this._current_iwidget.id, varName);

            oldValue = variable.get();
            newValue = new_values[varName];

            if (newValue !== oldValue) {
                variable.annotate(newValue);
            }
        }

        // Phase 2
        // Commit new value of the variable
        for (varName in new_values) {
            variable = varManager.getVariableByName(this._current_iwidget.id, varName);
            variable.set(new_values[varName]);
        }

        // Commit
        varManager.decNestingLevel();
        varManager.sendBufferedVars();
        this.hide();

        if (typeof this._current_iwidget.prefCallback === 'function') {
            this._current_iwidget.prefCallback(new_values);
        }
    };

    PreferencesWindowMenu.prototype.show = function show(iwidget, parentWindow) {
        var i, prefs, pref, fields;

        fields = {};
        prefs = iwidget.widget.preferences;

        for (i = 0; i < prefs.length; i++) {
            pref = prefs[i];

            if (!pref.isHidden(iwidget)) {
                fields[pref.varName] = pref.getInterfaceDescription(iwidget);
            }
        }
        this._current_iwidget = iwidget.internal_iwidget; // TODO
        this._current_form = new Form(fields, {
            buttonArea: this.windowBottom
        });
        this._current_form.insertInto(this.windowContent);
        this._current_form.addEventListener('submit', this._savePrefs.bind(this));
        this._current_form.addEventListener('cancel', this.hide.bind(this));

        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };

    Wirecloud.Widget.PreferencesWindowMenu = PreferencesWindowMenu;
})();
