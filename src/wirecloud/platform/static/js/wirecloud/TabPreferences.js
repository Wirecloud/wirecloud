/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var TabPreferences = function TabPreferences(definitions, tab, values) {
        Wirecloud.Preferences.call(this, definitions, values);

        Object.defineProperties(this, {
            tab: {
                value: tab
            }
        });

        this.tab.workspace.preferences.addEventListener('pre-commit', this._handleParentChanges);
    };
    TabPreferences.prototype = new Wirecloud.Preferences();

    TabPreferences.prototype.buildTitle = function buildTitle() {
        return utils.gettext("Settings");
    };

    TabPreferences.prototype.getParentValue = function getParentValue(name) {
        return this.tab.workspace.preferences.get(name);
    };

    TabPreferences.prototype._build_save_url = function _build_save_url(modifiedValues) {
        return Wirecloud.URLs.TAB_PREFERENCES.evaluate({workspace_id: this.tab.workspace.id, tab_id: this.tab.id});
    };

    TabPreferences.prototype.destroy = function destroy() {
        this.tab.workspace.preferences.removeEventListener('pre-commit', this._handleParentChanges);
        Wirecloud.Preferences.prototype.destroy.call(this);
    };

    Wirecloud.TabPreferences = TabPreferences;

})(Wirecloud, Wirecloud.Utils);
