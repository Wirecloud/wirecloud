/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    ns.TabPreferences = class TabPreferences extends ns.Preferences {

        constructor(definitions, tab, values) {
            super(definitions, values);

            Object.defineProperties(this, {
                tab: {
                    value: tab
                }
            });

            this.tab.workspace.preferences.addEventListener('post-commit', this._handleParentChanges);
        }

        buildTitle() {
            return utils.gettext("Settings");
        }

        getParentValue(name) {
            return this.tab.workspace.preferences.get(name);
        }

        _build_save_url(modifiedValues) {
            return Wirecloud.URLs.TAB_PREFERENCES.evaluate({workspace_id: this.tab.workspace.id, tab_id: this.tab.id});
        }

        destroy() {
            this.tab.workspace.preferences.removeEventListener('post-commit', this._handleParentChanges);
            super.destroy();
        }

    }

})(Wirecloud, Wirecloud.Utils);
