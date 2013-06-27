/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var SubMenuItem = function SubMenuItem(text, handler) {
        StyledElements.PopupMenuBase.call(this);

        this.menuItem = new StyledElements.MenuItem(text, handler);
        this.menuItem.addClassName('submenu');
    };
    SubMenuItem.prototype = new StyledElements.PopupMenuBase({extending: true});

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
            var position;

            if (item === this.menuItem) {
                position = EzWebExt.getRelativePosition(this.menuItem.wrapperElement, this.menuItem.wrapperElement.ownerDocument.body);
                position.x += this.menuItem.wrapperElement.offsetWidth;
                this.show(position);
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
        case 'mouseover':
        case 'click':
            return this.menuItem.addEventListener(eventId, handler);
        default:
            return StyledElements.PopupMenuBase.prototype.addEventListener.call(this, eventId, handler);
        }
    };

    SubMenuItem.prototype.destroy = function destroy() {
        if (this.menuItem) {
            this.menuItem.destroy();
        }
        this.menuItem = null;

        StyledElements.PopupMenuBase.prototype.destroy.call(this);
    };


    StyledElements.SubMenuItem = SubMenuItem;

})();
