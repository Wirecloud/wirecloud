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

/* globals StyledElements */


(function (utils) {

    "use strict";

    /**
     *
     */
    var SubMenuItem = function SubMenuItem(text, options) {

        if (arguments.length === 0) {
            return true;
        }

        options = utils.merge({
            'position': ['right-bottom', 'left-bottom']
        }, options);

        StyledElements.PopupMenuBase.call(this, options);
        this.wrapperElement.classList.add('se-popup-submenu');

        this.menuItem = new StyledElements.MenuItem(text, function () {
            this.submenu.show(this.getBoundingClientRect());
        });
        this.menuItem.addClassName('submenu');
        this.menuItem.submenu = this;
    };
    utils.inherit(SubMenuItem, StyledElements.PopupMenuBase);

    SubMenuItem.prototype._getContext = function _getContext() {
        if (this.parentMenu instanceof SubMenuItem) {
            return this.parentMenu._getContext();
        } else {
            return this.parentMenu._context;
        }
    };

    SubMenuItem.prototype._menuItemCallback = function _menuItemCallback(menuItem) {
        var currentMenu = this;
        while (currentMenu.parentMenu) {
            currentMenu = currentMenu.parentMenu;
        }
        currentMenu.hide();
        menuItem.run(currentMenu._context);
    };

    SubMenuItem.prototype._setParentPopupMenu = function _setParentPopupMenu(popupMenu) {
        this.parentMenu = popupMenu;

        this.parentMenu.addEventListener('itemOver', function (popupMenu, item) {
            if (item === this.menuItem) {
                this.show(this.menuItem.getBoundingClientRect());
            } else {
                this.hide();
            }
        }.bind(this));
    };

    SubMenuItem.prototype._getMenuItem = function _getMenuItem() {
        return this.menuItem;
    };

    SubMenuItem.prototype.addEventListener = function addEventListener(eventId, handler) {
        switch (eventId) {
        case 'mouseenter':
        case 'mouseleave':
        case 'click':
        case 'blur':
        case 'focus':
            return this.menuItem.addEventListener(eventId, handler);
        default:
            return StyledElements.PopupMenuBase.prototype.addEventListener.call(this, eventId, handler);
        }
    };

    SubMenuItem.prototype.enable = function enable() {
        this.menuItem.enable();
    };

    SubMenuItem.prototype.disable = function disable() {
        this.menuItem.disable();
    };

    SubMenuItem.prototype.setDisabled = function setDisabled(disabled) {
        this.menuItem.setDisabled(disabled);
    };

    SubMenuItem.prototype.destroy = function destroy() {
        if (this.menuItem) {
            this.menuItem.destroy();
        }
        this.menuItem = null;

        StyledElements.PopupMenuBase.prototype.destroy.call(this);
    };


    StyledElements.SubMenuItem = SubMenuItem;

})(StyledElements.Utils);
