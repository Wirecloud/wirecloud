/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */

(function () {

    "use strict";

    var OperatorPreferencesWindowMenu = function OperatorPreferencesWindowMenu() {
        Wirecloud.ui.WindowMenu.call(this, Wirecloud.Utils.gettext('Operator Settings'), 'wc-component-preferences-dialog');
    };
    OperatorPreferencesWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    OperatorPreferencesWindowMenu.prototype._savePrefs = function _savePrefs(form, new_values) {
        var key, details;

        for (key in new_values) {
            if (this._current_ioperator.preferences[key].value !== new_values[key]) {
                this._current_ioperator.preferences[key].value = new_values[key];
            } else {
                delete new_values[key];
            }
        }

        if (typeof this._current_ioperator.prefCallback === 'function') {
            try {
                this._current_ioperator.prefCallback(new_values);
            } catch (error) {
                details = this._current_ioperator.logManager.formatException(error);
                this._current_ioperator.logManager.log(Wirecloud.Utils.gettext('Exception catched while processing preference changes'), {details: details});
            }
        }

        this.hide();
    };

    OperatorPreferencesWindowMenu.prototype.show = function show(ioperator, parentWindow) {
        var i, prefs, pref, fields;

        fields = {};
        prefs = ioperator.preferenceList;

        for (i = 0; i < prefs.length; i++) {
            pref = prefs[i];

            if (!pref.hidden) {
                fields[pref.meta.name] = pref.getInterfaceDescription();
            }
        }
        this._current_ioperator = ioperator;
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

    Wirecloud.ui.OperatorPreferencesWindowMenu = OperatorPreferencesWindowMenu;
})();
