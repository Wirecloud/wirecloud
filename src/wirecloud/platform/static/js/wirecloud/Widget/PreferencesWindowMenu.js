/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var PreferencesWindowMenu = function PreferencesWindowMenu() {
        Wirecloud.ui.WindowMenu.call(this, Wirecloud.Utils.gettext('Widget Settings'), 'wc-component-preferences-dialog');
    };
    PreferencesWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    PreferencesWindowMenu.prototype._savePrefs = function _savePrefs(form, new_values) {
        var oldValue, newValue, varName, details;

        for (varName in new_values) {
            oldValue = this._current_iwidget.preferences[varName].value;
            newValue = new_values[varName];

            if (newValue !== oldValue) {
                this._current_iwidget.preferences[varName].value = newValue;
            } else {
                delete new_values[varName];
            }
        }

        this.hide();

        Wirecloud.io.makeRequest(Wirecloud.URLs.IWIDGET_PREFERENCES.evaluate({
                workspace_id: this._current_iwidget.workspace.id,
                tab_id: this._current_iwidget.tab.id,
                iwidget_id: this._current_iwidget.id
            }), {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify(new_values)
            }
        );

        if (typeof this._current_iwidget.prefCallback === 'function') {
            try {
                this._current_iwidget.prefCallback(new_values);
            } catch (error) {
                details = this._current_iwidget.logManager.formatException(error);
                this._current_iwidget.logManager.log(Wirecloud.Utils.gettext('Exception catched while processing preference changes'), {details: details});
            }
        }
    };

    PreferencesWindowMenu.prototype.show = function show(iwidget, parentWindow) {
        var i, prefs, pref, fields;

        fields = {};
        prefs = iwidget.preferenceList;

        for (i = 0; i < prefs.length; i++) {
            pref = prefs[i];

            if (!pref.hidden) {
                fields[pref.meta.name] = pref.getInterfaceDescription();
            }
        }
        this._current_iwidget = iwidget;
        this.form = new StyledElements.Form(fields, {
            setdefaultsButton: true,
            buttonArea: this.windowBottom
        });
        this.form.insertInto(this.windowContent);
        this.form.acceptButton.addClassName('btn-accept');
        this.form.addEventListener('submit', this._savePrefs.bind(this));
        this.form.addEventListener('cancel', this.hide.bind(this));

        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };

    Wirecloud.Widget.PreferencesWindowMenu = PreferencesWindowMenu;
})();
