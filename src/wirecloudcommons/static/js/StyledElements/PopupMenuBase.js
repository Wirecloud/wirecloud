/**
 * @abstract
 */
StyledElements.PopupMenuBase = function (options) {
    var defaultOptions = {
        'position': 'bottom-left',
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
    this._menuItemCallback = EzWebExt.bind(this._menuItemCallback, this);
    this._menuItemEnterCallback = EzWebExt.bind(this._menuItemEnterCallback, this);
};
StyledElements.PopupMenuBase.prototype = new StyledElements.ObjectWithEvents();

StyledElements.PopupMenuBase.prototype._append = function(child, where) {
    if (child instanceof StyledElements.MenuItem) {
        child.addEventListener('click', this._menuItemCallback);
        child.addEventListener('mouseover', this._menuItemEnterCallback);
    } else if (child instanceof StyledElements.SubMenuItem) {
        child.addEventListener('click', this._menuItemCallback);
        child.addEventListener('mouseover', this._menuItemEnterCallback);
        child._setParentPopupMenu(this);
    }
    where.push(child);
}

StyledElements.PopupMenuBase.prototype.append = function(child) {
    this._append(child, this._items);
}

StyledElements.PopupMenuBase.prototype.appendSeparator = function() {
    this.append(new StyledElements.Separator());
}

StyledElements.PopupMenuBase.prototype.setContext = function setContext (context) {
    this._context = context;
};

StyledElements.PopupMenuBase.prototype._menuItemCallback = function _menuItemCallback (menuItem) {
    this.hide();
    menuItem.run(this._context, menuItem.context);
};

StyledElements.PopupMenuBase.prototype.isVisible = function() {
    return EzWebExt.XML.isElement(this.wrapperElement.parentNode);
};

StyledElements.PopupMenuBase.prototype.show = function(refPosition) {
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
    this.events['visibilityChange'].dispatch(this);

    // TODO Hay que ajustar refPosition.y y refPosition.x para que el menú no
    // pueda salirse del área visible
    if ('x' in refPosition && 'y' in refPosition) {
        this.wrapperElement.style.top = refPosition.y + "px";
        this.wrapperElement.style.left = refPosition.x + "px";
    } else {
        switch (this._position) {
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
    }
    this.wrapperElement.style.display = 'block';
};

StyledElements.PopupMenuBase.prototype.hide = function() {
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

    this.events['visibilityChange'].dispatch(this);
};

StyledElements.PopupMenuBase.prototype._menuItemEnterCallback = function(menuItem) {
    this.events['itemOver'].dispatch(this, menuItem);
}

StyledElements.PopupMenuBase.prototype.destroy = function() {
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
