/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    var setPosition = function setPosition(refPosition, position) {
        switch (position) {
        case 'top-left':
            this.wrapperElement.style.top = (refPosition.top - this.wrapperElement.offsetHeight + 1) + "px";
            this.wrapperElement.style.left = (refPosition.right - this.wrapperElement.offsetWidth) + "px";
            break;
        case 'top-right':
            this.wrapperElement.style.top = (refPosition.top - this.wrapperElement.offsetHeight + 1) + "px";
            this.wrapperElement.style.left = refPosition.left + "px";
            break;
        case 'bottom-right':
            this.wrapperElement.style.top = (refPosition.bottom - 1) + "px";
            this.wrapperElement.style.left = refPosition.left + "px";
            break;
        default:
        case 'bottom-left':
            this.wrapperElement.style.top = (refPosition.bottom - 1) + "px";
            this.wrapperElement.style.left = (refPosition.right - this.wrapperElement.offsetWidth) + "px";
            break;
        }
    };

    var standsOut = function () {
        return this.wrapperElement.offsetTop < 0 || this.wrapperElement.offsetLeft < 0;
    };

    /**
     * @abstract
     */
    var PopupMenuBase = function PopupMenuBase(options) {
        var defaultOptions = {
            'position': ['bottom-left', 'bottom-right', 'top-left', 'top-right']
        };
        options = EzWebExt.merge(defaultOptions, options);

        if (options.extending) {
            return;
        }

        StyledElements.ObjectWithEvents.call(this, ['itemOver', 'visibilityChange']);

        this.wrapperElement = window.parent.document.createElement('div');
        this.wrapperElement.className = 'popup_menu hidden';
        this._context = null;
        this._position = options.position;
        this._items = [];
        this._dynamicItems = [];
        this._submenus = [];
        this._menuItemCallback = this._menuItemCallback.bind(this);
        this._menuItemEnterCallback = this._menuItemEnterCallback.bind(this);
    };
    PopupMenuBase.prototype = new StyledElements.ObjectWithEvents();

    PopupMenuBase.prototype._append = function _append(child, where) {
        if (child instanceof StyledElements.MenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.addEventListener('mouseover', this._menuItemEnterCallback);
        } else if (child instanceof StyledElements.SubMenuItem) {
            child.addEventListener('click', this._menuItemCallback);
            child.addEventListener('mouseover', this._menuItemEnterCallback);
            child._setParentPopupMenu(this);
        }
        where.push(child);
    };

    PopupMenuBase.prototype.append = function append(child) {
        this._append(child, this._items);
    };

    PopupMenuBase.prototype.appendSeparator = function appendSeparator() {
        this.append(new StyledElements.Separator());
    };

    PopupMenuBase.prototype.setContext = function setContext(context) {
        this._context = context;
    };

    PopupMenuBase.prototype._menuItemCallback = function _menuItemCallback(menuItem) {
        this.hide();
        menuItem.run(this._context, menuItem.context);
    };

    PopupMenuBase.prototype.isVisible = function isVisible() {
        return EzWebExt.XML.isElement(this.wrapperElement.parentNode);
    };

    PopupMenuBase.prototype.show = function show(refPosition) {
        var i, j, item, generatedItems, generatedItem;

        if (this.isVisible()) {
            return; // This Popup Menu is already visible => nothing to do
        }

        for (i = 0; i < this._items.length; i += 1) {
            item = this._items[i];
            if (item instanceof StyledElements.DynamicMenuItems) {
                generatedItems = item.build(this._context);
                for (j = 0; j < generatedItems.length; j += 1) {
                    generatedItem = generatedItems[j];

                    this._append(generatedItem, this._dynamicItems);

                    if (generatedItem instanceof StyledElements.MenuItem || generatedItem instanceof StyledElements.Separator) {
                        generatedItem.insertInto(this.wrapperElement);
                    } else if (generatedItem instanceof StyledElements.SubMenuItem) {
                        generatedItem._getMenuItem().insertInto(this.wrapperElement);
                    }
                }
            } else if (item instanceof StyledElements.MenuItem || item instanceof StyledElements.Separator) {
                item.insertInto(this.wrapperElement);
            } else if (item instanceof StyledElements.SubMenuItem) {
                item._getMenuItem().insertInto(this.wrapperElement);
                this._submenus.push(item);
            } else {
                this.wrapperElement.appendChild(item);
            }
        }

        EzWebExt.removeClassName(this.wrapperElement, 'hidden');
        window.parent.document.body.appendChild(this.wrapperElement);
        this.events.visibilityChange.dispatch(this);

        // TODO Hay que ajustar refPosition.y y refPosition.x para que el menú no
        // pueda salirse del área visible
        if ('x' in refPosition && 'y' in refPosition) {
            this.wrapperElement.style.top = refPosition.y + "px";
            this.wrapperElement.style.left = refPosition.x + "px";
        } else {
            if (Array.isArray(this._position)) {
                var i = 0;
                do {
                    setPosition.call(this, refPosition, this._position[i]);
                    i += 1;
                } while (standsOut.call(this) && i < this._position.length)
            } else {
                setPosition.call(this, refPosition, this._position);
            }
        }
        this.wrapperElement.style.display = 'block';
    };

    PopupMenuBase.prototype.hide = function hide() {
        var i, aux;

        if (!this.isVisible()) {
            return; // This Popup Menu is already hidden => nothing to do
        }

        EzWebExt.addClassName(this.wrapperElement, 'hidden');

        for (i = 0; i < this._submenus.length; i += 1) {
            this._submenus[i].hide();
        }

        for (i = 0; i < this._dynamicItems.length; i += 1) {
            aux = this._dynamicItems[i];
            if (aux instanceof StyledElements.SubMenuItem) {
                aux.hide();
            }
            aux.destroy();
        }
        this._dynamicItems = [];
        this._submenus = [];
        this.wrapperElement.innerHTML = '';
        EzWebExt.removeFromParent(this.wrapperElement);

        this.events.visibilityChange.dispatch(this);
    };

    PopupMenuBase.prototype._menuItemEnterCallback = function _menuItemEnterCallback(menuItem) {
        this.events.itemOver.dispatch(this, menuItem);
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

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.PopupMenuBase = PopupMenuBase;
})();
