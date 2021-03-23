/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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

    ns.PreferencesWindowMenu = class PreferencesWindowMenu extends Wirecloud.ui.WindowMenu {

        constructor() {
            super(utils.gettext("Settings"), 'wc-component-preferences-modal');
        }

        _savePrefs(form, new_values) {
            this.form.acceptButton.disable().addClassName('busy');
            this.widgetModel.setPreferences(new_values).then(() => {
                this.hide();
            }).finally(() => {
                this.form.acceptButton.removeClassName('busy').enable();
            });
        }

        show(widgetModel, parentWindow) {
            const fields = {};
            const prefs = widgetModel.preferenceList;

            for (let i = 0; i < prefs.length; i++) {
                const pref = prefs[i];

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
            this.form.setdefaultsButton.addClassName('btn-set-defaults');
            this.form.cancelButton.addClassName('btn-cancel');
            this.form.acceptButton.addClassName('btn-accept');
            this.form.addEventListener('submit', this._savePrefs.bind(this));
            this.form.addEventListener('cancel', this.hide.bind(this));

            super.show(parentWindow);
        }

    }

})(Wirecloud.Widget, StyledElements, Wirecloud.Utils);
