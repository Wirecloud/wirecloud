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

/*global gettext, interpolate, Wirecloud*/

(function () {

    "use strict";

    var TabPreferences = function TabPreferences(definitions, tab, values) {
        Wirecloud.Preferences.call(this, definitions, values);
        this._tab = tab;
        this._workspace = this._tab.workspace;

        this._workspace.preferences.addEventListener('pre-commit', this._handleParentChanges);
    };
    TabPreferences.prototype = new Wirecloud.Preferences();

    TabPreferences.prototype.buildTitle = function buildTitle() {
        var msg = gettext("Tab preferences (%(tabName)s)");
        return interpolate(msg, {tabName: this._tab.tabInfo.name}, true);
    };

    TabPreferences.prototype.getParentValue = function getParentValue(name) {
        return this._workspace.preferences.get(name);
    };

    TabPreferences.prototype._build_save_url = function _build_save_url(modifiedValues) {
        return Wirecloud.URLs.TAB_PREFERENCES.evaluate({workspace_id: this._workspace.workspaceState.id, tab_id: this._tab.tabInfo.id});
    };

    TabPreferences.prototype.destroy = function destroy() {
        this._workspace.preferences.removeEventListener('pre-commit', this._handleParentChanges);

        Wirecloud.Preferences.prototype.destroy.call(this);
        this._workspace = null;
        this._tab = null;
    };

    Wirecloud.TabPreferences = TabPreferences;

})();
