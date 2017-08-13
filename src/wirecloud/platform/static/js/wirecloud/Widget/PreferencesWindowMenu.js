/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (se, utils) {

    "use strict";

    var PreferencesWindowMenu = function PreferencesWindowMenu() {
        Wirecloud.ui.WindowMenu.call(this, utils.gettext("Settings"), 'wc-component-preferences-modal');
    };
    utils.inherit(PreferencesWindowMenu, Wirecloud.ui.WindowMenu);

    PreferencesWindowMenu.prototype._savePrefs = function _savePrefs(form, new_values) {
        var oldValue, newValue, varName;

        for (varName in new_values) {
            oldValue = this.widgetModel.preferences[varName].value;
            newValue = new_values[varName];

            if (newValue !== oldValue) {
                if (this.widgetModel.preferences[varName].meta.secure && newValue !== "") {
                    this.widgetModel.preferences[varName].value = "********";
                } else {
                    this.widgetModel.preferences[varName].value = newValue;
                }
            } else {
                delete new_values[varName];
            }
        }

        this.hide();
        if (!this.widgetModel.volatile) {
            Wirecloud.io.makeRequest(Wirecloud.URLs.IWIDGET_PREFERENCES.evaluate({
                    workspace_id: this.widgetModel.tab.workspace.id,
                    tab_id: this.widgetModel.tab.id,
                    iwidget_id: this.widgetModel.id
                }), {
                    method: 'POST',
                    contentType: 'application/json',
                    requestHeaders: {'Accept': 'application/json'},
                    postBody: JSON.stringify(new_values),
                    onSuccess: widgetCallback.call(this, new_values)
                }
            );
        }
    };

    // Notify preference changes to widget
    var widgetCallback = function widgetCallback(new_values) {
        if (typeof this.widgetModel.prefCallback === 'function') {
            try {
                // Censor secure preferences
                for (var varName in new_values) {
                    if (this.widgetModel.preferences[varName].meta.secure && this.widgetModel.preferences[varName].value !== "") {
                        new_values[varName] = "********";
                    }
                }
                this.widgetModel.prefCallback(new_values);
            } catch (error) {
                var details = this.widgetModel.logManager.formatException(error);
                this.widgetModel.logManager.log(utils.gettext('Exception catched while processing preference changes'), {details: details});
            }
        }
    };

    PreferencesWindowMenu.prototype.show = function show(widgetModel, parentWindow) {
        var i, prefs, pref, fields;

        fields = {};
        prefs = widgetModel.preferenceList;

        for (i = 0; i < prefs.length; i++) {
            pref = prefs[i];

            if (!pref.hidden) {
                fields[pref.meta.name] = pref.getInterfaceDescription();
            }
        }
        this.widgetModel = widgetModel;
        this.form = new se.Form(fields, {
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

})(StyledElements, Wirecloud.Utils);
