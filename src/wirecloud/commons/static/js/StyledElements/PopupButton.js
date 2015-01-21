/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*globals StyledElements*/

(function () {

    "use strict";

    var visibilityChangeListener = function visibilityChangeListener() {
        if (this.popup_menu.isVisible()) {
            this.wrapperElement.classList.add('open');
        } else {
            this.wrapperElement.classList.remove('open');
        }
    };

    var PopupButton = function PopupButton(options) {
        var defaultOptions = {
            'menuOptions': null,
            'menu': null
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.StyledButton.call(this, options);

        if (options.menu != null) {
            this.popup_menu = options.menu;
            this._owned_popup_menu = false;
        } else {
            this.popup_menu = new this.PopupMenu(options.menuOptions);
            this._owned_popup_menu = true;
        }

        this.addEventListener('click', function () {
            if (this.popup_menu.isVisible()) {
                this.popup_menu.hide();
            } else {
                this.popup_menu.show(this.getBoundingClientRect());
            }
        }.bind(this));

        this._visibilityChangeListener = visibilityChangeListener.bind(this);
        this.popup_menu.addEventListener('visibilityChange', this._visibilityChangeListener);
    };
    PopupButton.prototype = new StyledElements.StyledButton({extending: true});
    PopupButton.prototype.PopupMenu = StyledElements.PopupMenu;

    PopupButton.prototype.getPopupMenu = function getPopupMenu() {
        return this.popup_menu;
    };

    PopupButton.prototype.replacePopupMenu = function replacePopupMenu(new_popup_menu) {
        if (this._owned_popup_menu) {
            this.popup_menu.destroy();
            this._owned_popup_menu = false;
        }
        this.popup_menu = new_popup_menu;
    };

    PopupButton.prototype.destroy = function destroy() {
        StyledElements.StyledButton.prototype.destroy.call(this);

        if (this._owned_popup_menu) {
            this.popup_menu.destroy();
        } else {
            this.popup_menu.removeEventListener('visibilityChange', this._visibilityChangeListener);
        }
        this.popup_menu = null;
    };

    StyledElements.PopupButton = PopupButton;
})();
