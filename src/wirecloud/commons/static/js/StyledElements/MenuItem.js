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
     * Create a new instance of class MenuItem.
     *
     * @constructor
     * @extends {StyledElements.StyledElement}
     *
     * @version 0.5.0
     * @alias StyledElements.MenuItem
     *
     * @param {String} title - [TODO: description]
     * @param {Object} [options] - [TODO: description]
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
            selectable: {get: property_selectable_get},
            tabIndex: {get: property_tabIndex_get},
            title: {get: property_title_get}
        });

        this.setTitle(title);
        this.setFocusable(true);

        this.run = handler;
        this.context = context;

        // Set up MouseEvent internal handlers.
        this._onclick_bound = element_onclick.bind(this);
        this._onmouseenter_bound = element_onmouseenter.bind(this);
        this._onmouseleave_bound = element_onmouseleave.bind(this);

        this.wrapperElement.addEventListener('click', this._onclick_bound, true);
        this.wrapperElement.addEventListener('mouseenter', this._onmouseenter_bound);
        this.wrapperElement.addEventListener('mouseleave', this._onmouseleave_bound);

        // Set up FocusEvent internal handlers.
        this._onblur_bound = element_onblur.bind(this);
        this._onfocus_bound = element_onfocus.bind(this);

        this.wrapperElement.addEventListener('blur', this._onblur_bound);
        this.wrapperElement.addEventListener('focus', this._onfocus_bound);

        // Set up KeyboardEvent internal handlers.
        this._onkeydown_bound = element_onkeydown.bind(this);
        this.wrapperElement.addEventListener('keydown', this._onkeydown_bound);
    };

    // ==================================================================================
    // PUBLIC MEMBERS
    // ==================================================================================

    utils.inherit(se.MenuItem, se.StyledElement, /** @lends StyledElements.MenuItem.prototype */{

        /**
         * @override
         */
        _onenabled: function _onenabled(enabled) {
            this.setFocusable(enabled);
        },

        /**
         * [TODO: activate description]
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
         * [TODO: addIconClass description]
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
         * [TODO: deactivate description]
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
         * [TODO: destroy description]
         *
         * @since 0.5.0
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        destroy: function destroy() {

            if (this.wrapperElement.parentElement != null) {
                this.wrapperElement.parentElement.removeChild(this.wrapperElement);
            }

            this.wrapperElement.removeEventListener('click', this._onclick_bound, true);
            this.wrapperElement.removeEventListener('mouseenter', this._onmouseenter_bound, false);
            this.wrapperElement.removeEventListener('mouseleave', this._onmouseleave_bound, false);

            this._onclick_bound = null;
            this._onmouseenter_bound = null;
            this._onmouseleave_bound = null;

            se.StyledElement.prototype.destroy.call(this);

            return this;
        },

        /**
         * [TODO: focus description]
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        focus: function focus() {

            if (this.selectable && !this.hasFocus()) {
                this.wrapperElement.focus();
                this.trigger('focus');
            }

            return this;
        },

        /**
         * [TODO: hasFocus description]
         *
         * @since 0.6.2
         *
         * @returns {Boolean} - [TODO: description]
         */
        hasFocus: function hasFocus() {
            return utils.hasFocus(this.wrapperElement);
        },

        /**
         * [TODO: select description]
         *
         * @since 0.6.2
         *
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        select: function select() {

            if (this.selectable) {
                this.trigger('click');
            }

            return this;
        },

        /**
         * [TODO: setDescription description]
         *
         * @since 0.6.2
         *
         * @param {String} description - [TODO: description]
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        setDescription: function setDescription(description) {

            if (this.descriptionElement == null) {
                this.descriptionElement = document.createElement('div');
                this.descriptionElement.className = "se-popup-menu-item-description";
                this.bodyElement.appendChild(this.descriptionElement);
            }

            this.descriptionElement.innerHTML = description;

            return this;
        },

        /**
         * [TODO: setFocusable description]
         *
         * @since 0.6.2
         *
         * @param {Boolean} focusable - [TODO: description]
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        setFocusable: function setFocusable(focusable) {

            if (this.enabled && focusable) {
                this.wrapperElement.setAttribute('tabindex', 0);
            } else {
                this.wrapperElement.removeAttribute('tabindex');
            }

            return this;
        },

        /**
         * [TODO: setTitle description]
         *
         * @since 0.6.2
         *
         * @param {String} title - [TODO: description]
         * @returns {StyledElements.MenuItem} - The instance on which the member is called.
         */
        setTitle: function setTitle(title) {

            if (this.titleElement == null) {
                this.titleElement = document.createElement('div');
                this.titleElement.className = "se-popup-menu-item-title";
                this.bodyElement.insertBefore(this.titleElement, this.bodyElement.firstChild);
            }

            this.titleElement.innerHTML = title;

            return this;
        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

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

    var property_selectable_get = function property_selectable_get() {
        return this.enabled && this.tabIndex !== -1;
    };

    var property_tabIndex_get = function property_tabIndex_get() {
        return this.wrapperElement.tabIndex;
    };

    var property_title_get = function property_title_get() {
        return this.titleElement != null ? this.titleElement.textContent : "";
    }

    var element_onclick = function element_onclick(event) {
        event.stopPropagation();
        this.select();
    };

    var element_onmouseenter = function element_onmouseenter(event) {
        if (this.selectable) {
            this.trigger('mouseenter');
        }
    };

    var element_onmouseleave = function element_onmouseleave(event) {
        if (this.selectable) {
            this.trigger('mouseleave');
        }
    };

    var element_onblur = function element_onblur(event) {
        if (this.selectable) {
            this.trigger('blur');
        }
    };

    var element_onfocus = function element_onfocus(event) {
        if (this.selectable) {
            this.trigger('focus');
        }
    };

    var element_onkeydown = function element_onkeydown(event) {
        if (this.selectable && utils.isPressedEnterKey(event)) {
            event.preventDefault();
            this.select();
        }
    };

})(StyledElements, StyledElements.Utils);
