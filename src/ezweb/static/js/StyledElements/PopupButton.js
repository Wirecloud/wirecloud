StyledElements.PopupButton = function PopupButton (options) {
    var defaultOptions = {
        'menu': null
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledButton.call(this, options);

    if (options.menu != null) {
        this.popup_menu = options.menu;
    } else {
        this.popup_menu = new StyledElements.PopupMenu(options.menuOptions);
    }

    this.addEventListener('click', function () {
        if (this.popup_menu.isVisible()) {
            this.popup_menu.hide();
        } else {
            this.popup_menu.show(this.getBoundingClientRect());
        }
    }.bind(this));
    this.popup_menu.addEventListener('visibilityChange', function () {
        if (this.popup_menu.isVisible()) {
            this.wrapperElement.addClassName('open');
        } else {
            this.wrapperElement.removeClassName('open');
        }
    }.bind(this));
};
StyledElements.PopupButton.prototype = new StyledElements.StyledButton({extending: true});

StyledElements.PopupButton.prototype.getPopupMenu = function getPopupMenu () {
    return this.popup_menu;
};
