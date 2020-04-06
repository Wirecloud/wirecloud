/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const privates = new WeakMap();

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
     * @param {Object.<String, *>|Function} [options] For backwards compability,
     * this parameter accepts function values, in that case the value will be
     * used for the "handler" option.
     *
     * Available options:
     * - `context` (`Any`) Context to be provided to the handler function.
     * - `enabled` (`Boolean`) Initial enablement status (default: `true`)
     * - `handler` (`Function`) Callback to be called when this Menu Item is
     * executed
     * - `iconClass` (`String`) Initial icon class.
     *
     * @param {Object} [context] Object to be passed as the second parameter
     * of the handler callback. Not used when passing a options object as parameter.
     */
    se.MenuItem = function MenuItem(title, handler, context) {

        se.StyledElement.call(this, events);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "se-popup-menu-item";

        let options;
        if (handler != null && typeof handler === "object") {
            options = handler;
        } else {
            options = {
                handler: handler,
                context: context
            };
        }

        let priv = {
            bodyelement: document.createElement('div'),
            thumbnailelement: document.createElement('div'),
            titleelement: document.createElement('div'),
            element_onclick: element_onclick.bind(this),
            element_onmouseenter: element_onmouseenter.bind(this),
            element_onmouseleave: element_onmouseleave.bind(this),
            element_onblur: element_onblur.bind(this),
            element_onfocus: element_onfocus.bind(this),
            element_onkeydown: element_onkeydown.bind(this)
        };
        privates.set(this, priv);

        priv.bodyelement.className = "se-popup-menu-item-body";
        priv.thumbnailelement.className = "se-popup-menu-item-thumbnail";
        priv.titleelement.className = "se-popup-menu-item-title";

        priv.bodyelement.appendChild(priv.titleelement);
        this.wrapperElement.appendChild(priv.bodyelement);

        Object.defineProperties(this, {
            active: {get: property_active_get, set: property_active_set},
            description: {get: property_description_get},
            title: {get: property_title_get}
        });

        this.setTitle(title);

        this.run = options.handler;
        this.context = options.context;

        this.wrapperElement.addEventListener('click', priv.element_onclick, true);
        this.wrapperElement.addEventListener('mouseenter', priv.element_onmouseenter);
        this.wrapperElement.addEventListener('mouseleave', priv.element_onmouseleave);
        this.wrapperElement.addEventListener('blur', priv.element_onblur);
        this.wrapperElement.addEventListener('focus', priv.element_onfocus);
        this._onenabled(true);

        this.wrapperElement.addEventListener('keydown', priv.element_onkeydown);

        if (options.enabled != null) {
            this.enabled = options.enabled;
        }
        if (options.iconClass != null) {
            this.addIconClass(options.iconClass);
        }
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
            const priv = privates.get(this);

            if (priv.iconelement == null) {
                priv.iconelement = document.createElement('span');
                priv.thumbnailelement.appendChild(priv.iconelement);
            }

            if (priv.thumbnailelement.parentElement == null) {
                this.wrapperElement.insertBefore(priv.thumbnailelement, this.wrapperElement.firstChild);
            }

            priv.iconelement.className = "se-icon " + iconClass;

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
            const priv = privates.get(this);

            if (this.wrapperElement.parentElement != null) {
                this.wrapperElement.parentElement.removeChild(this.wrapperElement);
            }

            this.wrapperElement.removeEventListener('click', priv.element_onclick, true);
            this.wrapperElement.removeEventListener('mouseenter', priv.element_onmouseenter);
            this.wrapperElement.removeEventListener('mouseleave', priv.element_onmouseleave);
            this.wrapperElement.removeEventListener('keydown', priv.element_onkeydown);
            this.wrapperElement.removeEventListener('blur', priv.element_onblur);
            this.wrapperElement.removeEventListener('focus', priv.element_onfocus);
            this.wrapperElement.removeEventListener('keydown', priv.element_onkeydown);

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
            const priv = privates.get(this);

            if (priv.descriptionelement == null) {
                priv.descriptionelement = document.createElement('div');
                priv.descriptionelement.className = "se-popup-menu-item-description";
                priv.bodyelement.appendChild(priv.descriptionelement);
            }

            if (description instanceof se.StyledElement) {
                priv.descriptionelement.innerHTML = "";
                description.appendTo(priv.descriptionelement);
            } else {
                priv.descriptionelement.textContent = description;
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
            const priv = privates.get(this);

            if (title instanceof se.StyledElement) {
                priv.titleelement.innerHTML = "";
                title.appendTo(priv.titleelement);
            } else {
                priv.titleelement.textContent = title;
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
        return privates.get(this).descriptionelement.textContent;
    };

    var property_title_get = function property_title_get() {
        return privates.get(this).titleelement.textContent;
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
                this.parentElement.menuitem.focus();
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
