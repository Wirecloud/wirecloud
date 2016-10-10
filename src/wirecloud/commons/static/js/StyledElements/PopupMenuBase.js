/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var POPUP_POSITIONS = ['left-bottom', 'right-bottom', 'top-left', 'top-right', 'bottom-right', 'bottom-left'];
    Object.freeze(POPUP_POSITIONS);

    var DEFAULT_PLACEMENT = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
    Object.freeze(DEFAULT_PLACEMENT);


    var setPosition = function setPosition(refPosition, placement) {
        var i = 0;
        for (i = 0; i < POPUP_POSITIONS.length; i++) {
            this.wrapperElement.classList.remove('se-popup-menu-' + POPUP_POSITIONS[i]);
        }

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
            this.wrapperElement.style.top = (refPosition.top - this.wrapperElement.offsetHeight + 1) + "px";
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
        default:
        case 'bottom-left':
            this.wrapperElement.style.top = (refPosition.bottom - 1) + "px";
            this.wrapperElement.style.left = refPosition.left + "px";
            break;
        }
    };

    var standsOut = function standsOut() {
        var parent_box = this.wrapperElement.parentElement.getBoundingClientRect();
        var element_box = this.wrapperElement.getBoundingClientRect();

        var visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        var visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        var element_area = element_box.width * element_box.height;
        var visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    var fixPosition = function fixPosition(refPosition, weights, placements) {
        var best_weight = Math.min.apply(Math, weights);
        var index = weights.indexOf(best_weight);
        var placement = placements[index];

        setPosition.call(this, refPosition, placement);

        var parent_box = this.wrapperElement.parentElement.getBoundingClientRect();
        var element_box = this.wrapperElement.getBoundingClientRect();

        if (element_box.bottom > parent_box.bottom) {
            this.wrapperElement.style.top = "";
            this.wrapperElement.style.bottom = "10px";
            element_box = this.wrapperElement.getBoundingClientRect();
        }

        if (element_box.top < parent_box.top) {
            this.wrapperElement.style.top = "10px";
        }
    };

    /**
     * @interface
     * @mixes StyledElements.ObjectWithEvents
     */
    var PopupMenuBase = function PopupMenuBase(options) {
        var defaultOptions = {
            oneActiveAtLeast: false,
            placement: null,
            useRefElementWidth: false
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.ObjectWithEvents.call(this, ['itemOver', 'visibilityChange', 'click']);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = 'se-popup-menu hidden';
        this._context = null;
        if ('position' in options) {
            // Backwards compatibility
            if (Array.isArray(options.position)) {
                this._placement = options.position;
            } else if (typeof options.position === 'string') {
                this._placement = [options.placement];
            } else {
                this._placement = DEFAULT_PLACEMENT;
            }
        } else {
            if (Array.isArray(options.placement)) {
                this._placement = options.placement;
            } else if (typeof options.placement === 'string') {
                this._placement = [options.placement];
            } else {
                this._placement = DEFAULT_PLACEMENT;
            }
        }

        Object.defineProperties(this, {
            activeItem: {get: property_activeItem_get},
            firstEnabledItem: {get: property_firstEnabledItem_get},
            hidden: {get: property_hidden_get},
            lastEnabledItem: {get: property_lastEnabledItem_get},
            oneActiveAtLeast: {value: options.oneActiveAtLeast},
            useRefElementWidth: {value: options.useRefElementWidth}
        });

        this._items = [];
        this._dynamicItems = [];
        this._submenus = [];
        this._menuItemCallback = this._menuItemCallback.bind(this);

        this._menuItem_onactivate_bound = menuItem_onactivate.bind(this);
        this._menuItem_ondeactivate_bound = menuItem_ondeactivate.bind(this);
        this._menuItem_onfocus_bound = menuItem_onfocus.bind(this);
        this._menuItem_onblur_bound = menuItem_onblur.bind(this);
    };
    utils.inherit(PopupMenuBase, StyledElements.ObjectWithEvents);

    var _append = function _append(child, where) {
        if (child instanceof StyledElements.MenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.addEventListener('mouseenter', this._menuItem_onactivate_bound);
            child.addEventListener('mouseleave', this._menuItem_ondeactivate_bound);
            child.addEventListener('focus', this._menuItem_onfocus_bound);
            child.addEventListener('blur', this._menuItem_onblur_bound);
        } else if (child instanceof StyledElements.SubMenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.menuItem.addEventListener('mouseenter', this._menuItem_onactivate_bound);
            child.menuItem.addEventListener('mouseleave', this._menuItem_ondeactivate_bound);
            child.menuItem.addEventListener('focus', this._menuItem_onfocus_bound);
            child.menuItem.addEventListener('blur', this._menuItem_onblur_bound);
            child._setParentPopupMenu(this);
        } else if (child instanceof StyledElements.DynamicMenuItems || child instanceof StyledElements.Separator) {
            // nothing to do
        } else if (child != null) {
            throw new TypeError('Invalid chlid element');
        } else {
            throw new TypeError('The new child element is null');
        }
        where.push(child);
    };

    PopupMenuBase.prototype.append = function append(child) {
        _append.call(this, child, this._items);

        if (this.isVisible()) {
            display.call(this, child);

            if ((this._enabledItems.length > 0) && this.oneActiveAtLeast) {
                activateMenuItem.call(this, this._enabledItems[0]);
            }
        }
    };

    PopupMenuBase.prototype.appendSeparator = function appendSeparator() {
        this.append(new StyledElements.Separator());
    };

    /**
     * Remove all child nodes from the wrapperElement.
     * @since 0.6.1
     *
     * @returns {PopupMenuBase}
     *      The instance on which the member is called.
     */
    PopupMenuBase.prototype.clear = function clear() {
        var i;

        if (!this.hidden) {
            hideContent.call(this);
        }

        for (i = 0; i < this._items.length; i++) {
            this._items[i].removeEventListener('click', this._menuItemCallback);
        }

        this._items = [];

        return this;
    };

    PopupMenuBase.prototype.setContext = function setContext(context) {
        this._context = context;
    };

    PopupMenuBase.prototype._menuItemCallback = function _menuItemCallback(menuItem) {
        this.dispatchEvent('click', menuItem);

        // This if is necessary for touch screens where mouseenter and
        // mouseleave events are not raised
        // In that case, the user will "click" the menu item and
        // the popup menu should continue to be displayed
        if (!menuItem.hasClassName('submenu')) {
            this.hide();
        }

        if (typeof menuItem.run === 'function') {
            menuItem.run(this._context, menuItem.context);
        }
    };

    PopupMenuBase.prototype.isVisible = function isVisible() {
        return !this.hidden;
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
                } else if (generatedItem instanceof StyledElements.SubMenuItem) {
                    generatedItem._getMenuItem().insertInto(this.wrapperElement);
                    generatedItem.parentElement = this;
                    this._enabledItems.push(generatedItem.menuItem);
                }
            }
        } else if (item instanceof StyledElements.MenuItem || item instanceof StyledElements.Separator) {
            item.insertInto(this.wrapperElement);
            item.parentElement = this;

            if (item instanceof StyledElements.MenuItem && item.enabled) {
                this._enabledItems.push(item);
            }
        } else if (item instanceof StyledElements.SubMenuItem) {
            item._getMenuItem().insertInto(this.wrapperElement);
            item._getMenuItem().parentElement = this;
            this._submenus.push(item);
            this._enabledItems.push(item.menuItem);
        } else {
            this.wrapperElement.appendChild(item);
        }
    };

    PopupMenuBase.prototype.show = function show(refPosition) {
        var i;

        if (this.isVisible()) {
            return; // This Popup Menu is already visible => nothing to do
        }

        this._enabledItems = [];
        this._activeMenuItem = null;
        this._focusedMenuItem = null;

        for (i = 0; i < this._items.length; i += 1) {
            display.call(this, this._items[i]);
        }

        if ((this._enabledItems.length > 0) && this.oneActiveAtLeast) {
            activateMenuItem.call(this, this._enabledItems[0]);
        }

        this.wrapperElement.classList.remove('hidden');

        var baseelement = utils.getFullscreenElement() || document.body;
        baseelement.appendChild(this.wrapperElement);

        Wirecloud.UserInterfaceManager._registerPopup(this);
        this.dispatchEvent("visibilityChange");

        if (!('left' in refPosition) && 'x' in refPosition && 'y' in refPosition) {

            this.wrapperElement.style.top = refPosition.y + "px";
            this.wrapperElement.style.left = refPosition.x + "px";
        } else {
            i = 0;
            var weights = [];
            do {
                setPosition.call(this, refPosition, this._placement[i]);
                weights.push(standsOut.call(this));
                i += 1;
            } while (weights[i - 1] > 0 && i < this._placement.length);

            if (weights[i - 1] > 0) {
                fixPosition.call(this, refPosition, weights, this._placement);
            }
        }

        if (this.useRefElementWidth) {
            this.wrapperElement.style.width = refPosition.width + "px";
        }
    };

    PopupMenuBase.prototype.moveCursorDown = function moveCursorDown() {
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
    };

    PopupMenuBase.prototype.moveCursorUp = function moveCursorUp() {
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
    };

    PopupMenuBase.prototype.moveFocusDown = function moveFocusDown() {
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
    };

    PopupMenuBase.prototype.moveFocusUp = function moveFocusUp() {
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
    };

    PopupMenuBase.prototype.hide = function hide() {

        if (this.hidden) {
            return this;
        }

        this.wrapperElement.classList.add("hidden");
        this.wrapperElement.style.bottom = "";
        hideContent.call(this);

        this.wrapperElement.remove();
        Wirecloud.UserInterfaceManager._unregisterPopup(this);

        return this.dispatchEvent('visibilityChange');
    };

    PopupMenuBase.prototype.destroy = function destroy() {
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

        StyledElements.ObjectWithEvents.prototype.destroy.call(this);
    };

    /**
     * Checks whether this Popup Menu contains at least one enabled menu item
     *
     * @since 0.6.2
     *
     * @returns {Boolean} true if this Popup Menu has at least one enabled
     * child, false in other case
     */
    PopupMenuBase.prototype.hasEnabledItem = function hasEnabledItem() {
        return !this.hidden && (this._enabledItems.length > 0);
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================


    var property_activeItem_get = function property_activeItem_get() {
        return !this.hidden ? this._activeMenuItem : null;
    };

    var property_firstEnabledItem_get = function property_firstEnabledItem_get() {
        return this.hasEnabledItem() ? this._enabledItems[0] : null;
    };

    var property_lastEnabledItem_get = function property_lastEnabledItem_get() {
        return this.hasEnabledItem() ? this._enabledItems[this._enabledItems.length - 1] : null;
    };

    var property_hidden_get = function property_hidden_get() {
        return this.wrapperElement.parentElement == null;
    };

    var activateMenuItem = function activateMenuItem(menuItem) {
        this._activeMenuItem = menuItem.activate();
        this.dispatchEvent('itemOver', menuItem);
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

    var menuItem_onactivate = function menuItem_onactivate(menuItem) {
        var i;

        for (i = 0; i < this._enabledItems.length; i++) {
            this._enabledItems[i].deactivate();
        }

        activateMenuItem.call(this, menuItem);
    };

    var menuItem_ondeactivate = function menuItem_ondeactivate(menuItem) {

        if (this.oneActiveAtLeast) {
            if (this._activeMenuItem !== menuItem) {
                menuItem.deactivate();
            }
        } else {
            if (this._activeMenuItem === menuItem) {
                this._activeMenuItem = null;
            }
            menuItem.deactivate();
        }
    };

    var menuItem_onfocus = function menuItem_onfocus(menuItem) {
        this._focusedMenuItem = menuItem;
    };

    var menuItem_onblur = function menuItem_onblur(menuItem) {
        if (this._focusedMenuItem === menuItem) {
            this._focusedMenuItem = null;
        }
    };

    StyledElements.PopupMenuBase = PopupMenuBase;

})(StyledElements, StyledElements.Utils);
