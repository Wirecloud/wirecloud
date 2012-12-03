/**
 *
 */
StyledElements.SubMenuItem = function(text, handler) {
    StyledElements.PopupMenuBase.call(this);

    this.menuItem = new StyledElements.MenuItem(text, handler);
    this.menuItem.addClassName('submenu');
}
StyledElements.SubMenuItem.prototype = new StyledElements.PopupMenuBase({extending: true});

StyledElements.SubMenuItem.prototype._getContext = function() {
    if (this.parentMenu instanceof StyledElements.SubMenuItem) {
        return this.parentMenu._getContext();
    } else {
        return this.parentMenu._context;
    }
}

StyledElements.SubMenuItem.prototype._menuItemCallback = function(menuItem) {
    var currentMenu = this;
    while (currentMenu.parentMenu) {
        currentMenu = currentMenu.parentMenu;
    }
    currentMenu.hide();
    menuItem.run(currentMenu._context);
}

StyledElements.SubMenuItem.prototype._setParentPopupMenu = function(popupMenu) {
    this.parentMenu = popupMenu;

    this.parentMenu.addEventListener('itemOver', EzWebExt.bind(function(popupMenu, item) {
        var position;

        if (item === this.menuItem) {
            position = EzWebExt.getRelativePosition(this.menuItem.wrapperElement, this.menuItem.wrapperElement.ownerDocument.body);
            position.x += this.menuItem.wrapperElement.offsetWidth;
            this.show(position);
        } else {
            this.hide();
        }
    }, this));
}

StyledElements.SubMenuItem.prototype._getMenuItem = function() {
    return this.menuItem;
}

StyledElements.SubMenuItem.prototype.addEventListener = function(eventId, handler) {
    switch (eventId) {
    case 'mouseover':
    case 'click':
        return this.menuItem.addEventListener(eventId, handler);
    default:
        return StyledElements.PopupMenuBase.prototype.addEventListener.call(this, eventId, handler);
    }
}

StyledElements.SubMenuItem.prototype.destroy = function() {
    if (this.menuItem) {
        this.menuItem.destroy();
    }
    this.menuItem = null;

    StyledElements.PopupMenuBase.prototype.destroy.call(this);
}
