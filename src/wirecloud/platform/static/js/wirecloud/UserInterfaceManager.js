/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global Wirecloud */

(function (utils) {

    "use strict";

    var UserInterfaceManager = {
        rootKeydownHandler: null,
        currentWindowMenu: null,
        currentPopups: []
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

        // General keydown handler
        document.addEventListener('keydown', function (event) {
            var modifiers, key, consumed, popup;

            modifiers = {
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey
            };
            key = utils.normalizeKey(event);

            // if there are not modals, check if the current view can consume this keydown event
            if (UserInterfaceManager.currentWindowMenu == null) {
                consumed = utils.callCallback(UserInterfaceManager.rootKeydownHandler, key, modifiers);
            } else if (key === "Backspace") {
                // Ignore backspace keydown events if we are in a modals
                consumed = true;
            }

            // Handle default shortcuts
            if (!consumed && key === "Escape") {
                UserInterfaceManager.handleEscapeEvent();
            }

            if (consumed) {
                event.preventDefault();
            }
        }, false);

        // Init old Layout Manager (TODO: remove)
        LayoutManagerFactory.getInstance();
    };

    UserInterfaceManager.handleEscapeEvent = function handleEscapeEvent() {
        if (this.currentPopups.length > 0) {
            this.currentPopups[this.currentPopups.length - 1].hide();
        }
    };

    /**
     * @private
     * Only to be used by WindowMenu.
     */
    UserInterfaceManager._unregisterRootWindowMenu = function _unregisterRootWindowMenu(window_menu) {
        this._unregisterPopup(window_menu);
        this.currentWindowMenu = null;
        hideCover();
    };

    /**
     * @private
     * Only to be used by WindowMenu.
     */
    UserInterfaceManager._registerRootWindowMenu = function _registerRootWindowMenu(window_menu) {

        if (!(window_menu instanceof Wirecloud.ui.WindowMenu)) {
            throw TypeError('window_menu must be a WindowMenu instance');
        }

        if (this.currentWindowMenu != null) {
            this.currentWindowMenu.hide();
            hideCover();
        }

        this.currentWindowMenu = window_menu;
        this._registerPopup(window_menu);
        showCover();
    };

    UserInterfaceManager._unregisterPopup = function _unregisterPopup(popup) {
        var index = this.currentPopups.indexOf(popup);
        if (index !== -1) {
            this.currentPopups.splice(index, 1);
        }
    };

    UserInterfaceManager._registerPopup = function _registerPopup(popup) {
        if (popup != null && !('hide' in popup)) {
            throw new TypeError('invalid popup parameter');
        }

        this._unregisterPopup(popup);
        this.currentPopups.push(popup);
    };

    Wirecloud.UserInterfaceManager = UserInterfaceManager;

})(Wirecloud.Utils);
