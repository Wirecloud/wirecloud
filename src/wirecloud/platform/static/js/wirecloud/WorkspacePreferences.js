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

    var WorkspacePreferences = function WorkspacePreferences(definitions, workspace, values) {
        Wirecloud.Preferences.call(this, definitions, values);
        this._workspace = workspace;

        Wirecloud.preferences.addEventListener('pre-commit', this._handleParentChanges);
    };
    WorkspacePreferences.prototype = new Wirecloud.Preferences();

    WorkspacePreferences.prototype.buildTitle = function buildTitle() {
        var msg = gettext("Workspace preferences (%(workspaceName)s)");
        return interpolate(msg, {workspaceName: this._workspace.workspaceState.name}, true);
    };

    WorkspacePreferences.prototype.getParentValue = function getParentValue(name) {
        return Wirecloud.preferences.get(name);
    };

    WorkspacePreferences.prototype._build_save_url = function _build_save_url() {
        return Wirecloud.URLs.WORKSPACE_PREFERENCES.evaluate({workspace_id: this._workspace.workspaceState.id});
    };

    WorkspacePreferences.prototype.destroy = function destroy() {
        Wirecloud.preferences.removeEventListener('pre-commit', this._handleParentChanges);

        Wirecloud.Preferences.prototype.destroy.call(this);
        this._workspace = null;
    };

    Wirecloud.WorkspacePreferences = WorkspacePreferences;

})();

