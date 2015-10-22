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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Creates a new Menu Item instance. This instance can be added into
     * {StyledElements.PopupMenuBase} instances
     *
     * @constructor
     * @extends {StyledElements.StyledElement}
     *
     * @since 0.5.0
     * @alias StyledElements.MenuItem
     *
     * @param {String} title - Label to display in the user interface
     * @param {Function} handler - Callback to be called when this Menu Item is
     * executed
     * @param {Object} [context] - Object to be passed as the second parameter
     * of the handler callback
     */
    se.MenuItem = function MenuItem(title, handler, context) {
        this.superClass(events);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "se-popup-menu-item";

        this.thumbnailElement = document.createElement('div');
        this.thumbnailElement.className = "se-popup-menu-item-thumbnail";

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = "se-popup-menu-item-body";
        this.wrapperElement.appendChild(this.bodyElement);

        Object.defineProperties(this, {
            active: {get: property_active_get, set: property_active_set},
            description: {get: property_description_get},
            title: {get: property_title_get}
        });

        this.setTitle(title);

        this.run = handler;
        this.context = context;

        // Internal events
        this._onmouseenter = function (event) {
            if (this.enabled) {
                this.trigger('mouseenter');
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mouseenter', this._onmouseenter, false);

        this._onmouseleave = function (event) {
            if (this.enabled) {
                this.trigger('mouseleave');
            }
        }.bind(this);
        this.wrapperElement.addEventListener('mouseleave', this._onmouseleave, false);

        this._onclick = function (event) {
            event.stopPropagation();
            this.click();
        }.bind(this);
        this.wrapperElement.addEventListener('click', this._onclick, true);
    };

    // ==================================================================================
    // PUBLIC MEMBERS
    // ==================================================================================

    utils.inherit(se.MenuItem, se.StyledElement, /** @lends StyledElements.MenuItem.prototype */{

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

            this.wrapperElement.removeEventListener('click', this._onclick, true);
            this.wrapperElement.removeEventListener('mouseenter', this._onmouseenter, false);
            this.wrapperElement.removeEventListener('mouseleave', this._onmouseleave, false);

            this._onclick = null;
            this._onmouseenter = null;
            this._onmouseleave = null;

            se.StyledElement.prototype.destroy.call(this);
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
                this.trigger('click');
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

            this.descriptionElement.textContent = description;

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

            if (this.titleElement == null) {
                this.titleElement = document.createElement('div');
                this.titleElement.className = "se-popup-menu-item-title";
                this.bodyElement.insertBefore(this.titleElement, this.bodyElement.firstChild);
            }

            this.titleElement.textContent = title;

            return this;
        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['click', 'mouseenter', 'mouseleave'];

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
        return this.titleElement != null ? this.titleElement.textContent : "";
    }

})(StyledElements, StyledElements.Utils);
