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


(function (utils) {

    "use strict";

    /**
     *
     */
    var PlatformPreferences = function PlatformPreferences(definitions, values) {
        Wirecloud.Preferences.call(this, definitions, values);
    };
    utils.inherit(PlatformPreferences, Wirecloud.Preferences);

    PlatformPreferences.prototype.buildTitle = function buildTitle() {
        return utils.gettext("Platform Preferences");
    };

    PlatformPreferences.prototype._build_save_url = function _build_save_url() {
        return Wirecloud.URLs.PLATFORM_PREFERENCES;
    };

    Wirecloud.PlatformPreferences = PlatformPreferences;

})(Wirecloud.Utils);
