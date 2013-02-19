/*global gettext, Element, StyledElements, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class representing alert dialogs
     */
    var AlertWindowMenu = function AlertWindowMenu() {
        Wirecloud.ui.WindowMenu.call(this, gettext('Warning'));

        // Warning icon
        this.iconElement = document.createElement('div');
        Element.extend(this.iconElement);
        this.iconElement.className = "window-icon icon-size icon-warning";
        this.windowContent.insertBefore(this.iconElement, this.windowContent.childNodes[0]);

        // Accept button
        this.acceptButton = new StyledElements.StyledButton({
            text: gettext('Yes'),
            'class': 'btn-danger'
        });
        this._acceptListener = this._acceptListener.bind(this);
        this.acceptButton.addEventListener("click", this._acceptListener);
        this.acceptButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            text: gettext('No'),
            'class': 'btn-primary'
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);

        this.acceptHandler = null;
        this.cancelHandler = null;
    };
    AlertWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    AlertWindowMenu.prototype._acceptListener = function _acceptListener(e) {
        this.acceptHandler();
        this.hide();
    };

    AlertWindowMenu.prototype._closeListener = function _closeListener(e) {
        Wirecloud.ui.WindowMenu.prototype._closeListener.call(this, e);
        if (this.cancelHandler) {
            this.cancelHandler();
        }
    };

    AlertWindowMenu.prototype.setHandler = function setHandler(acceptHandler, cancelHandler) {
        this.acceptHandler = acceptHandler;
        this.cancelHandler = cancelHandler;
    };

    AlertWindowMenu.prototype.setFocus = function setFocus() {
        this.cancelButton.focus();
    };

    Wirecloud.ui.AlertWindowMenu = AlertWindowMenu;
})();
