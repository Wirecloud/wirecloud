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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    const visibilityChangeListener = function visibilityChangeListener() {
        if (this.popup_menu.isVisible()) {
            this.wrapperElement.classList.add('open');
        } else {
            this.wrapperElement.classList.remove('open');
        }
    };

    const defaultOptions = {
        menuOptions: null,
        menu: null
    };

    se.PopupButton = class PopupButton extends se.Button {

        constructor(options) {
            options = utils.merge({}, defaultOptions, options);

            super(options);

            if (options.menu != null) {
                this.popup_menu = options.menu;
                this._owned_popup_menu = false;
            } else {
                this.popup_menu = new this.PopupMenu(options.menuOptions);
                this._owned_popup_menu = true;
            }

            this.addEventListener('click', () => {
                if (this.popup_menu.isVisible()) {
                    this.popup_menu.hide();
                } else {
                    this.popup_menu.show(this);
                }
            });

            this._visibilityChangeListener = visibilityChangeListener.bind(this);
            this.popup_menu.addEventListener('visibilityChange', this._visibilityChangeListener);
        }

        /**
         * @override
         */
        _onkeydown(event, key) {

            switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                this.popup_menu.show(this.getBoundingClientRect()).moveFocusDown();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.popup_menu.show(this.getBoundingClientRect()).moveFocusUp();
                break;
            case ' ':
            case 'Enter':
                this._clickCallback(event);
                break;
            case 'Tab':
                if (this.popup_menu.hasEnabledItem()) {
                    event.preventDefault();
                    this.popup_menu.moveFocusDown();
                }
                break;
            default:
                // Quit when this doesn't handle the key event.
                break;
            }
        }

        getPopupMenu() {
            return this.popup_menu;
        }

        replacePopupMenu(new_popup_menu) {
            if (this._owned_popup_menu) {
                this.popup_menu.destroy();
                this._owned_popup_menu = false;
            }
            this.popup_menu = new_popup_menu;
        }

        destroy() {
            StyledElements.Button.prototype.destroy.call(this);

            if (this._owned_popup_menu) {
                this.popup_menu.destroy();
            } else {
                this.popup_menu.removeEventListener('visibilityChange', this._visibilityChangeListener);
            }
            this.popup_menu = null;
        }

    }

    se.PopupButton.prototype.PopupMenu = StyledElements.PopupMenu;

})(StyledElements, StyledElements.Utils);
