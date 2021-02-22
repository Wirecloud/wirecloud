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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    /**
     * A menu item that opens a sub menu.
     *
     * @name StyledElements.SubMenuItem
     *
     * @param {String} title Label to display in the user interface
     * @param {Object} [options]
     * Available options:
     * - `enabled` {Boolean} initial state (available since version 0.11.0)
     * - `iconClass` {String} initial icon class (available since version 0.11.0)
     */
    se.SubMenuItem = class SubMenuItem extends se.PopupMenuBase {

        constructor(title, options) {
            options = utils.merge({
                placement: ['right-bottom', 'left-bottom']
            }, options);

            super(options);
            this.wrapperElement.classList.add('se-popup-submenu');

            let menuitem = new StyledElements.MenuItem(title, () => {
                this.show(menuitem);
            });
            menuitem.addClassName('submenu');
            Object.defineProperty(menuitem, "submenu", {"value": this});

            Object.defineProperties(this, {
                /**
                 * @memberOf StyledElements.SubMenuItem#
                 * @type {StyledElements.MenuItem}
                 */
                menuitem: {value: menuitem},
                title: {get: () => {return menuitem.title;}}
            });

            if (options.enabled != null) {
                this.enabled = options.enabled;
            }

            if (options.iconClass != null) {
                this.addIconClass(options.iconClass);
            }
        }

        _menuItemCallback(menuitem) {
            var currentMenu = this;
            while (currentMenu.parentMenu) {
                currentMenu = currentMenu.parentMenu;
            }
            currentMenu.hide();
            menuitem.run(currentMenu._context);
        }

        _setParentPopupMenu(popupMenu) {
            this.parentMenu = popupMenu;

            this.parentMenu.addEventListener('itemOver', (popupMenu, item) => {
                if (item === this.menuitem) {
                    this.show(this.menuitem);
                } else {
                    this.hide();
                }
            });
        }

        addEventListener(eventId, handler) {
            switch (eventId) {
            case 'mouseenter':
            case 'mouseleave':
            case 'click':
            case 'blur':
            case 'focus':
                this.menuitem.addEventListener(eventId, handler);
                return this;
            default:
                return super.addEventListener(eventId, handler);
            }
        }

        /**
         * Adds an icon class to this Menu Item
         *
         * @since 0.11.0
         *
         * @param {String} iconClass - css class to add to the icon
         * @returns {StyledElements.SubMenuItem} - The instance on which the member is called.
         */
        addIconClass(iconClass) {
            this.menuitem.addIconClass(iconClass);
            return this;
        }

        enable() {
            this.menuitem.enable();
            return this;
        }

        disable() {
            this.menuitem.disable();
            return this;
        }

        setDisabled(disabled) {
            this.menuitem.setDisabled(disabled);
            return this;
        }

        destroy() {
            this.menuitem.destroy();
            super.destroy();
        }

    }

})(StyledElements, StyledElements.Utils);
