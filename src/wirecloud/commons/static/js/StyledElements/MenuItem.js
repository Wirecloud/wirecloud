/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Creates a new Menu Item instance. This instance can be added into
     * {StyledElements.PopupMenuBase} instances
     *
     * @constructor
     * @extends {StyledElements.StyledElement}
     *
     * @since 0.5.0
     * @name StyledElements.MenuItem
     *
     * @param {String} title Label to display in the user interface
     * @param {Function} handler Callback to be called when this Menu Item is
     * executed
     * @param {Object} [context] Object to be passed as the second parameter
     * of the handler callback
     */
    se.MenuItem = function MenuItem(title, handler, context) {
        se.StyledElement.call(this, events);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "se-popup-menu-item";

        this.thumbnailElement = document.createElement('div');
        this.thumbnailElement.className = "se-popup-menu-item-thumbnail";

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = "se-popup-menu-item-body";
        this.wrapperElement.appendChild(this.bodyElement);

        this.titleElement = document.createElement('div');
        this.titleElement.className = "se-popup-menu-item-title";
        this.bodyElement.appendChild(this.titleElement);

        Object.defineProperties(this, {
            active: {get: property_active_get, set: property_active_set},
            description: {get: property_description_get},
            title: {get: property_title_get}
        });

        this.setTitle(title);

        this.run = handler;
        this.context = context;

        // Set up MouseEvent internal handlers.
        this._onclick_bound = element_onclick.bind(this);
        this._onmouseenter_bound = element_onmouseenter.bind(this);
        this._onmouseleave_bound = element_onmouseleave.bind(this);

        this.wrapperElement.addEventListener('click', this._onclick_bound, true);
        this.wrapperElement.addEventListener('mouseenter', this._onmouseenter_bound);
        this.wrapperElement.addEventListener('mouseleave', this._onmouseleave_bound);

        // Set up FocusEvent internal handlers and status
        this._onblur_bound = element_onblur.bind(this);
        this._onfocus_bound = element_onfocus.bind(this);

        this.wrapperElement.addEventListener('blur', this._onblur_bound);
        this.wrapperElement.addEventListener('focus', this._onfocus_bound);
        this._onenabled(true);

        // Set up KeyboardEvent internal handlers
        this._onkeydown_bound = element_onkeydown.bind(this);
        this.wrapperElement.addEventListener('keydown', this._onkeydown_bound);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(se.MenuItem, se.StyledElement, /** @lends StyledElements.MenuItem.prototype */{

        /**
         * @override
         */
        _onenabled: function _onenabled(enabled) {
            if (enabled) {
                this.wrapperElement.setAttribute('tabindex', -1);
            } else {
                this.wrapperElement.removeAttribute('tabindex');
            }
        },

        /**
         * Activates (highlights) this Menu Item
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        activate: function activate() {
            this.active = true;
            return this;
        },

        /**
         * Adds an icon class to this Menu Item
         *
         * @since 0.6.2
         *
         * @param {String} iconClass - [TODO: description]
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        addIconClass: function addIconClass(iconClass) {

            if (this.iconElement == null) {
                this.iconElement = document.createElement('span');
                this.thumbnailElement.appendChild(this.iconElement);
            }

            if (this.thumbnailElement.parentElement == null) {
                this.wrapperElement.insertBefore(this.thumbnailElement, this.wrapperElement.firstChild);
            }

            this.iconElement.className = "se-icon " + iconClass;

            return this;
        },

        /**
         * Deactivates this Menu Item.
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        deactivate: function deactivate() {
            this.active = false;
            return this;
        },

        /**
         * @deprecated since version 0.6
         * @since 0.5.0
         */
        destroy: function destroy() {

            if (this.wrapperElement.parentElement != null) {
                this.wrapperElement.parentElement.removeChild(this.wrapperElement);
            }

            this.wrapperElement.removeEventListener('click', this._onclick_bound, true);
            this.wrapperElement.removeEventListener('mouseenter', this._onmouseenter_bound);
            this.wrapperElement.removeEventListener('mouseleave', this._onmouseleave_bound);
            this.wrapperElement.removeEventListener('keydown', this._onkeydown_bound);
            this.wrapperElement.removeEventListener('blur', this._onblur_bound);
            this.wrapperElement.removeEventListener('focus', this._onfocus_bound);

            this._onclick_bound = null;
            this._onmouseenter_bound = null;
            this._onmouseleave_bound = null;
            this._onkeydown_bound = null;
            this._onblur_bound = null;
            this._onfocus_bound = null;

            se.StyledElement.prototype.destroy.call(this);
        },

        /**
         * Assigns the focus to this menu item
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        focus: function focus() {

            if (this.enabled && !this.hasFocus()) {
                this.wrapperElement.focus();
                this.dispatchEvent('focus');
            }

            return this;
        },

        /**
         * Checks if this menu item is currently focused
         *
         * @since 0.6.2
         *
         * @returns {Boolean} true if this menu item has the focus
         */
        hasFocus: function hasFocus() {
            return utils.hasFocus(this.wrapperElement);
        },

        /**
         * Simulates a click event over this Menu Item from the user interface.
         * This means that if the Menu Item is disalbed, this method will do nothing.
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        click: function click() {

            if (this.enabled) {
                this.dispatchEvent('click');
            }

            return this;
        },

        /**
         * Updates the description associated to this Menu Item
         *
         * @since 0.6.2
         *
         * @param {String} description - new description
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        setDescription: function setDescription(description) {

            if (this.descriptionElement == null) {
                this.descriptionElement = document.createElement('div');
                this.descriptionElement.className = "se-popup-menu-item-description";
                this.bodyElement.appendChild(this.descriptionElement);
            }

            if (description instanceof se.StyledElement) {
                this.descriptionElement.innerHTML = "";
                description.appendTo(this.descriptionElement);
            } else {
                this.descriptionElement.textContent = description;
            }

            return this;
        },

        /**
         * Updates the title associated to this Menu Item
         *
         * @since 0.6.2
         *
         * @param {String} title - new title
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        setTitle: function setTitle(title) {
            if (title instanceof se.StyledElement) {
                this.titleElement.innerHTML = "";
                title.appendTo(this.titleElement);
            } else {
                this.titleElement.textContent = title;
            }

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['blur', 'click', 'focus', 'mouseenter', 'mouseleave'];

    var property_active_get = function property_active_get() {
        return this.hasClassName("active");
    };

    var property_active_set = function property_active_set(active) {
        if (this.enabled && this.active !== active) {
            this.toggleClassName("active", active);
        }
    };

    var property_description_get = function property_description_get() {
        return this.descriptionElement != null ? this.descriptionElement.textContent : "";
    };

    var property_title_get = function property_title_get() {
        return this.titleElement.textContent;
    };

    var element_onclick = function element_onclick(event) {
        event.stopPropagation();
        this.click();
    };

    var element_onmouseenter = function element_onmouseenter(event) {
        if (this.enabled) {
            this.dispatchEvent('mouseenter');
        }
    };

    var element_onmouseleave = function element_onmouseleave(event) {
        if (this.enabled) {
            this.dispatchEvent('mouseleave');
        }
    };

    var element_onblur = function element_onblur(event) {
        if (this.enabled) {
            this.dispatchEvent('blur');
        }
    };

    var element_onfocus = function element_onfocus(event) {
        if (this.enabled) {
            this.dispatchEvent('focus');
        }
    };

    var element_onkeydown = function element_onkeydown(event) {
        var item, key;

        key = utils.normalizeKey(event);
        switch (key) {
        case ' ':
        case 'Enter':
            event.preventDefault();
            this.click();
            break;
        case 'Escape':
        case 'ArrowLeft':
            event.stopPropagation();
            event.preventDefault();
            this.parentElement.hide();
            if (this.parentElement instanceof StyledElements.SubMenuItem) {
                this.parentElement.menuItem.focus();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            this.parentElement.moveFocusUp();
            break;
        case 'Tab':
            event.preventDefault();
            if ('submenu' in this && this.submenu.isVisible()) {
                item = this.submenu;
            } else {
                item = this.parentElement;
            }
            if (event.shiftKey) {
                item.moveFocusUp();
            } else {
                item.moveFocusDown();
            }
            break;
        case 'ArrowDown':
            event.preventDefault();
            this.parentElement.moveFocusDown();
            break;
        case 'ArrowRight':
            event.preventDefault();
            if ('submenu' in this) {
                this.submenu.show(this.getBoundingClientRect());
                if (this.submenu.hasEnabledItem()) {
                    this.submenu.moveFocusDown();
                }
            }
            break;
        }
    };

})(StyledElements, StyledElements.Utils);
