/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var onMenuClick = function onMenuClick(view_name) {
        LayoutManagerFactory.getInstance().changeCurrentView(view_name);
    };

    var WirecloudHeader = function WirecloudHeader() {
    };

    WirecloudHeader.prototype._initUserMenu = function _initUserMenu() {
    };

    WirecloudHeader.prototype._paintBreadcrum = function _paintBreadcrum(newView) {
    };

    WirecloudHeader.prototype._notifyViewChange = function _notifyViewChange(newView) {
    };

    WirecloudHeader.prototype._notifyWorkspaceLoaded = function _notifyWorkspaceLoaded(workspace) {
    };

    WirecloudHeader.prototype.refresh = function refresh() {
    };

    Wirecloud.ui.WirecloudHeader = WirecloudHeader;

})();
