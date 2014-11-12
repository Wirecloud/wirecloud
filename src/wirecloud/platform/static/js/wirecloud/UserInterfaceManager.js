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

(function () {

    "use strict";

    var UserInterfaceManager = {
        currentWindowMenu: null
    };

    var coverLayerElement = null;

    /**
     * @private
     */
    var fadeInCover = function fadeInCover() {
        coverLayerElement.classList.add('in');
    };

    var showCover = function showCover() {
        coverLayerElement.style.display = "block";
        setTimeout(fadeInCover, 0);
    };

    var hideCover = function hideCover() {
        coverLayerElement.classList.remove('in');
        coverLayerElement.style.display = "none";
    };

    UserInterfaceManager.init = function init() {
        if (coverLayerElement != null) {
            return;
        }

        // disabling background layer
        coverLayerElement = document.createElement('div');
        coverLayerElement.id = 'menu_layer';
        coverLayerElement.className = 'disabled_background fade';
        coverLayerElement.style.display = 'none';
        document.body.insertBefore(coverLayerElement, document.body.firstChild);
    };

    /**
     * @private
     * Only to be used by WindowMenu.
     */
    UserInterfaceManager._showWindowMenu = function _showWindowMenu(window_menu) {

        if (window_menu != null && !(window_menu instanceof Wirecloud.ui.WindowMenu)) {
            throw TypeError('window_menu must be a WindowMenu instance');
        }

        if (this.currentWindowMenu != null) {
            // only if the layer is displayed.
            hideCover();
        }

        this.currentWindowMenu = window_menu;
        if (this.currentWindowMenu != null) {
            showCover();
        }
    };

    Wirecloud.UserInterfaceManager = UserInterfaceManager;

})();
