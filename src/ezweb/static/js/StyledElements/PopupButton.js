StyledElements.PopupButton = function PopupButton (options) {
    var defaultOptions = {
        'menu': null
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledButton.call(this, options);

    if (options.menu != null) {
        this.popup_menu = options.menu;
        this._owned_popup_menu = false;
    } else {
        this.popup_menu = new StyledElements.PopupMenu(options.menuOptions);
        this._owned_popup_menu = true;
    }

    this.addEventListener('click', function () {
        if (this.popup_menu.isVisible()) {
            this.popup_menu.hide();
        } else {
            this.popup_menu.show(this.getBoundingClientRect());
        }
    }.bind(this));

    this._visibilityChangeListener = function () {
        if (this.popup_menu.isVisible()) {
            this.wrapperElement.addClassName('open');
        } else {
            this.wrapperElement.removeClassName('open');
        }
    }.bind(this);
    this.popup_menu.addEventListener('visibilityChange', this._visibilityChangeListener);
};
StyledElements.PopupButton.prototype = new StyledElements.StyledButton({extending: true});

StyledElements.PopupButton.prototype.getPopupMenu = function getPopupMenu () {
    return this.popup_menu;
};

StyledElements.PopupButton.prototype.destroy = function getPopupMenu () {
    StyledElements.StyledButton.prototype.destroy.call(this);

    if (this._owned_popup_menu) {
        this.popup_menu.destroy();
    } else {
        this.popup_menu.removeEventListener('visibilityChange', this._visibilityChangeListener);
    }
    this.popup_menu = null;
};
