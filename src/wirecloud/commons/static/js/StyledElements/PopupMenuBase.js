/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (se, utils) {

    "use strict";

    const POPUP_POSITION_CLASSES = [
        'se-popup-menu-left-bottom',
        'se-popup-menu-right-bottom',
        'se-popup-menu-top-left',
        'se-popup-menu-top-right',
        'se-popup-menu-bottom-right',
        'se-popup-menu-bottom-left'
    ];
    Object.freeze(POPUP_POSITION_CLASSES);

    const DEFAULT_PLACEMENT = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
    Object.freeze(DEFAULT_PLACEMENT);


    const setPosition = function setPosition(refPosition, placement) {
        this.wrapperElement.classList.remove.apply(
            this.wrapperElement.classList,
            POPUP_POSITION_CLASSES
        );
        this.wrapperElement.style.top = "";
        this.wrapperElement.style.left = "";
        this.wrapperElement.style.bottom = "";
        this.wrapperElement.style.right = "";

        this.wrapperElement.classList.add('se-popup-menu-' + placement);
        switch (placement) {
        case 'left-bottom':
            this.wrapperElement.style.left = (refPosition.left - this.wrapperElement.offsetWidth + 1) + "px";
            this.wrapperElement.style.top = (refPosition.top - 1) + "px";
            break;
        case 'right-bottom':
            this.wrapperElement.style.left = (refPosition.right - 1) + "px";
            this.wrapperElement.style.top = (refPosition.top - 1) + "px";
            break;
        case 'top-left':
            this.wrapperElement.style.bottom = (this.wrapperElement.parentElement.offsetHeight - refPosition.top - 1) + "px";
            this.wrapperElement.style.left = refPosition.left + "px";
            break;
        case 'top-right':
            this.wrapperElement.style.top = (refPosition.top - this.wrapperElement.offsetHeight + 1) + "px";
            this.wrapperElement.style.left = (refPosition.right - this.wrapperElement.offsetWidth) + "px";
            break;
        case 'bottom-right':
            this.wrapperElement.style.top = (refPosition.bottom - 1) + "px";
            this.wrapperElement.style.left = (refPosition.right - this.wrapperElement.offsetWidth) + "px";
            break;
        case 'bottom-left':
            this.wrapperElement.style.top = (refPosition.bottom - 1) + "px";
            this.wrapperElement.style.left = refPosition.left + "px";
            break;
        }
    };

    const standsOut = function standsOut() {
        const parent_box = this.wrapperElement.parentElement.getBoundingClientRect();
        const element_box = this.wrapperElement.getBoundingClientRect();

        const visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        const visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        const element_area = element_box.width * element_box.height;
        const visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    const FIX_PLANS = {
        "bottom": ["left", "right", "top", "bottom"],
        "left": ["right", "top", "bottom", "left"],
        "right": ["left", "top", "bottom", "right"],
        "top": ["left", "right", "bottom", "top"],
    };

    const fixPosition = function fixPosition(refPosition, weights, placements) {
        const best_weight = Math.min.apply(Math, weights);
        const index = weights.indexOf(best_weight);
        const placement = placements[index];

        setPosition.call(this, refPosition, placement);

        const parent_box = this.wrapperElement.parentElement.getBoundingClientRect();
        const element_box = this.wrapperElement.getBoundingClientRect();

        const plan = FIX_PLANS[placement.split('-')[0]];
        plan.forEach((placement) => {
            if (
                (placement === "top" || placement === "left") && element_box[placement] < parent_box[placement]
                || (placement === "bottom" || placement === "right") && element_box[placement] > parent_box[placement]
            ) {
                this.wrapperElement.style[placement] = "10px";
                this.wrapperElement_box = this.wrapperElement.getBoundingClientRect();
            }
        });
    };

    const _append = function _append(child, where) {
        if (child instanceof StyledElements.MenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.addEventListener('mouseenter', this._menuItem_onmouseenter_bound);
            child.addEventListener('mouseleave', this._menuItem_onmouseleave_bound);
            child.addEventListener('focus', this._menuItem_onfocus_bound);
            child.addEventListener('blur', this._menuItem_onblur_bound);
        } else if (child instanceof StyledElements.SubMenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.menuitem.addEventListener('mouseenter', this._menuItem_onmouseenter_bound);
            child.menuitem.addEventListener('mouseleave', this._menuItem_onmouseleave_bound);
            child.menuitem.addEventListener('focus', this._menuItem_onfocus_bound);
            child.menuitem.addEventListener('blur', this._menuItem_onblur_bound);
            child._setParentPopupMenu(this);
        } else if (child instanceof StyledElements.DynamicMenuItems || child instanceof StyledElements.Separator) {
            // nothing to do
        } else if (child != null) {
            throw new TypeError('Invalid chlid element');
        } else {
            throw new TypeError('child parameter cannot be null');
        }
        where.push(child);
    };

    var display = function display(item) {
        var i, generatedItems, generatedItem;

        if (item instanceof StyledElements.DynamicMenuItems) {
            generatedItems = item.build(this._context);
            for (i = 0; i < generatedItems.length; i += 1) {
                generatedItem = generatedItems[i];

                _append.call(this, generatedItem, this._dynamicItems);

                if (generatedItem instanceof StyledElements.MenuItem || generatedItem instanceof StyledElements.Separator) {
                    generatedItem.insertInto(this.wrapperElement);
                    generatedItem.parentElement = this;
                    if (generatedItem instanceof StyledElements.MenuItem && generatedItem.enabled) {
                        this._enabledItems.push(generatedItem);
                    }
                } else /* if (generatedItem instanceof StyledElements.SubMenuItem) */{
                    generatedItem.menuitem.insertInto(this.wrapperElement).parentElement = this;
                    this._enabledItems.push(generatedItem.menuitem);
                }
            }
        } else if (item instanceof StyledElements.MenuItem || item instanceof StyledElements.Separator) {
            item.insertInto(this.wrapperElement);
            item.parentElement = this;

            if (item instanceof StyledElements.MenuItem && item.enabled) {
                this._enabledItems.push(item);
            }
        } else /* if (item instanceof StyledElements.SubMenuItem) */ {
            item.menuitem.insertInto(this.wrapperElement).parentElement = this;
            this._submenus.push(item);
            this._enabledItems.push(item.menuitem);
        }
    };

    var searchBestPosition = function searchBestPosition(refPosition, positions) {
        if (!('left' in refPosition) && 'x' in refPosition && 'y' in refPosition) {
            this.wrapperElement.classList.remove.apply(
                this.wrapperElement.classList,
                POPUP_POSITION_CLASSES
            );
            this.wrapperElement.style.top = refPosition.y + "px";
            this.wrapperElement.style.left = refPosition.x + "px";
            return;
        } else if ("getBoundingClientRect" in refPosition) {
            refPosition = refPosition.getBoundingClientRect();
        }

        let i = 0;
        var weights = [];
        do {
            setPosition.call(this, refPosition, positions[i]);
            weights.push(standsOut.call(this));
            i += 1;
        } while (weights[i - 1] > 0 && i < positions.length);

        if (weights[i - 1] > 0) {
            fixPosition.call(this, refPosition, weights, positions);
        }
    };

    se.PopupMenuBase = class PopupMenuBase extends se.ObjectWithEvents {

        /**
         * @interface
         * @mixes StyledElements.ObjectWithEvents
         */
        constructor(options) {
            var defaultOptions = {
                oneActiveAtLeast: false,
                placement: null,
                useRefElementWidth: false
            };
            options = StyledElements.Utils.merge(defaultOptions, options);

            super(['itemOver', 'visibilityChange', 'click']);

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = 'se-popup-menu hidden';
            this._context = null;
            if (Array.isArray(options.placement)) {
                this._placement = options.placement;
            } else if (typeof options.placement === 'string') {
                this._placement = [options.placement];
            } else {
                this._placement = DEFAULT_PLACEMENT;
            }

            Object.defineProperties(this, {
                activeItem: {get: property_activeItem_get},
                firstEnabledItem: {get: on_firstEnabledItem_get},
                hidden: {get: property_hidden_get},
                lastEnabledItem: {get: property_lastEnabledItem_get},
                oneActiveAtLeast: {value: options.oneActiveAtLeast},
                useRefElementWidth: {value: options.useRefElementWidth}
            });

            this._items = [];
            this._dynamicItems = [];
            this._submenus = [];
            this._menuItemCallback = this._menuItemCallback.bind(this);

            this._menuItem_onmouseenter_bound = menuItem_onmouseenter.bind(this);
            this._menuItem_onmouseleave_bound = menuItem_onmouseleave.bind(this);
            this._menuItem_onfocus_bound = menuItem_onfocus.bind(this);
            this._menuItem_onblur_bound = menuItem_onblur.bind(this);
        }

        append(child) {
            _append.call(this, child, this._items);

            if (this.isVisible()) {
                display.call(this, child);

                if (this._activeMenuItem == null && this.oneActiveAtLeast && this._enabledItems.length > 0) {
                    activateMenuItem.call(this, this._enabledItems[0]);
                }
            }

            return this;
        }

        appendSeparator() {
            this.append(new StyledElements.Separator());
        }

        /**
         * Remove all child nodes from the wrapperElement.
         * @since 0.6.1
         *
         * @returns {PopupMenuBase}
         *      The instance on which the member is called.
         */
        clear() {
            var i;

            if (!this.hidden) {
                hideContent.call(this);
            }

            for (i = 0; i < this._items.length; i++) {
                this._items[i].removeEventListener('click', this._menuItemCallback);
            }

            this._items = [];

            return this;
        }

        setContext(context) {
            this._context = context;
        }

        _menuItemCallback(menuitem) {
            this.dispatchEvent('click', menuitem);

            // This if is necessary for touch screens where mouseenter and
            // mouseleave events are not raised
            // In that case, the user will "click" the menu item and
            // the popup menu should continue to be displayed
            if (!menuitem.hasClassName('submenu')) {
                this.hide();
            }

            if (typeof menuitem.run === 'function') {
                menuitem.run(this._context, menuitem.context);
            }
        }

        isVisible() {
            return !this.hidden;
        }

        show(refPosition) {

            if (this.isVisible()) {
                return this; // This Popup Menu is already visible => nothing to do
            }

            this._enabledItems = [];
            this._activeMenuItem = null;
            this._focusedMenuItem = null;

            for (let i = 0; i < this._items.length; i += 1) {
                display.call(this, this._items[i]);
            }

            if ((this._enabledItems.length > 0) && this.oneActiveAtLeast) {
                activateMenuItem.call(this, this._enabledItems[0]);
            }

            this.wrapperElement.classList.remove('hidden');

            var baseelement = utils.getFullscreenElement() || document.body;
            baseelement.appendChild(this.wrapperElement);

            if ('Wirecloud' in window) {
                Wirecloud.UserInterfaceManager._registerPopup(this);
            }
            this.dispatchEvent("visibilityChange");

            this.refPosition = refPosition;

            if (this.useRefElementWidth) {
                this.wrapperElement.style.width = this.refPosition.width + "px";
            }

            searchBestPosition.call(this, this.refPosition, this._placement);

            return this;
        }

        repaint() {
            if (this.refPosition) {
                searchBestPosition.call(this, this.refPosition, this._placement);
            }

            return this;
        }

        moveCursorDown() {
            var index;

            if (!this.hasEnabledItem()) {
                return this;
            }

            if (this._activeMenuItem != null) {
                this._activeMenuItem.deactivate();
                index = this._enabledItems.indexOf(this._activeMenuItem);

                if (index !== (this._enabledItems.length - 1)) {
                    this._activeMenuItem = this._enabledItems[index + 1];
                } else {
                    this._activeMenuItem = this.firstEnabledItem;
                }
            } else {
                this._activeMenuItem = this.firstEnabledItem;
            }

            this._activeMenuItem.activate();
            this.dispatchEvent('itemOver', this._activeMenuItem);

            return this;
        }

        moveCursorUp() {
            var index;

            if (!this.hasEnabledItem()) {
                return this;
            }

            if (this._activeMenuItem != null) {
                this._activeMenuItem.deactivate();
                index = this._enabledItems.indexOf(this._activeMenuItem);

                if (index !== 0) {
                    this._activeMenuItem = this._enabledItems[index - 1];
                } else {
                    this._activeMenuItem = this.lastEnabledItem;
                }
            } else {
                this._activeMenuItem = this.lastEnabledItem;
            }

            this._activeMenuItem.activate();
            this.dispatchEvent('itemOver', this._activeMenuItem);

            return this;
        }

        moveFocusDown() {
            var index;

            if (!this.hasEnabledItem()) {
                return this;
            }

            if (this._focusedMenuItem != null) {
                index = this._enabledItems.indexOf(this._focusedMenuItem);

                if (index !== (this._enabledItems.length - 1)) {
                    this._enabledItems[index + 1].focus();
                } else {
                    this.firstEnabledItem.focus();
                }
            } else {
                this.firstEnabledItem.focus();
            }

            return this;
        }

        moveFocusUp() {
            var index;

            if (!this.hasEnabledItem()) {
                return this;
            }

            if (this._focusedMenuItem != null) {
                index = this._enabledItems.indexOf(this._focusedMenuItem);

                if (index !== 0) {
                    this._enabledItems[index - 1].focus();
                } else {
                    this.lastEnabledItem.focus();
                }
            } else {
                this.lastEnabledItem.focus();
            }

            return this;
        }

        hide() {

            this.refPosition = null;
            if (this.hidden) {
                return this;
            }

            this.wrapperElement.classList.add("hidden");
            this.wrapperElement.style.bottom = "";
            hideContent.call(this);

            this.wrapperElement.remove();
            if ('Wirecloud' in window) {
                Wirecloud.UserInterfaceManager._unregisterPopup(this);
            }

            return this.dispatchEvent('visibilityChange');
        }

        destroy() {
            var i, item;

            this.hide();
            for (i = 0; i < this._items.length; i += 1) {
                item = this._items[i];
                if (item instanceof StyledElements.MenuItem) {
                    item.destroy();
                }
            }
            this._items = null;
            this._menuItemCallback = null;
            this._context = null;

            return super.destroy();
        }

        /**
         * Checks whether this Popup Menu contains at least one enabled menu item
         *
         * @since 0.6.2
         *
         * @returns {Boolean} true if this Popup Menu has at least one enabled
         * child, false in other case
         */
        hasEnabledItem() {
            return !this.hidden && (this._enabledItems.length > 0);
        }

    }

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================


    var property_activeItem_get = function property_activeItem_get() {
        return !this.hidden ? this._activeMenuItem : null;
    };

    var on_firstEnabledItem_get = function on_firstEnabledItem_get() {
        return this.hasEnabledItem() ? this._enabledItems[0] : null;
    };

    var property_lastEnabledItem_get = function property_lastEnabledItem_get() {
        return this.hasEnabledItem() ? this._enabledItems[this._enabledItems.length - 1] : null;
    };

    var property_hidden_get = function property_hidden_get() {
        return this.wrapperElement.parentElement == null;
    };

    var activateMenuItem = function activateMenuItem(menuitem) {
        this._activeMenuItem = menuitem.activate();
        this.dispatchEvent('itemOver', menuitem);
    };

    var hideContent = function hideContent() {
        var i, item;

        for (i = this._submenus.length - 1; i >= 0; i--) {
            this._submenus[i].hide();
            this._submenus.splice(i, 1);
        }

        for (i = this._dynamicItems.length - 1; i >= 0; i--) {
            item = this._dynamicItems[i];

            if (item instanceof se.SubMenuItem) {
                item.hide();
            }

            item.destroy();
            this._dynamicItems.splice(i, 1);
        }

        this._enabledItems = [];
        this._activeMenuItem = null;

        this.wrapperElement.innerHTML = "";
    };

    var menuItem_onmouseenter = function menuItem_onmouseenter(menuitem) {
        this._enabledItems.forEach((item) => {
            item.deactivate();
        });

        activateMenuItem.call(this, menuitem);
    };

    var menuItem_onmouseleave = function menuItem_onmouseleave(menuitem) {
        if (this.oneActiveAtLeast) {
            if (this._activeMenuItem !== menuitem) {
                menuitem.deactivate();
            }
        } else {
            if (this._activeMenuItem === menuitem) {
                this._activeMenuItem = null;
            }
            menuitem.deactivate();
        }
    };

    var menuItem_onfocus = function menuItem_onfocus(menuitem) {
        this._focusedMenuItem = menuitem;
    };

    var menuItem_onblur = function menuItem_onblur(menuitem) {
        if (this._focusedMenuItem === menuitem) {
            this._focusedMenuItem = null;
        }
    };

})(StyledElements, StyledElements.Utils);
