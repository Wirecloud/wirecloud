/*global WindowMenu*/

(function () {

    "use strict";

    /**
     * Specific class representing alert dialogs
     */
    var AlertWindowMenu = function AlertWindowMenu() {
        WindowMenu.call(this, gettext('Warning'));

        // Warning icon
        this.iconElement = document.createElement('div');
        Element.extend(this.iconElement);
        this.iconElement.className = "window-icon icon-size icon-warning";
        this.windowContent.insertBefore(this.iconElement, this.windowContent.childNodes[0]);

        // Accept button
        this.acceptButton = document.createElement('button');

        Element.extend(this.acceptButton);
        this.acceptButton.appendChild(document.createTextNode(gettext('Yes')));
        this._acceptListener = this._acceptListener.bind(this);
        this.acceptButton.observe("click", this._acceptListener);
        this.windowBottom.appendChild(this.acceptButton);

        // Cancel button
        this.cancelButton = document.createElement('button');
        Element.extend(this.cancelButton);
        this.cancelButton.appendChild(document.createTextNode(gettext('No')));
        this.cancelButton.observe("click", this._closeListener);
        this.windowBottom.appendChild(this.cancelButton);

        this.acceptHandler = null;
        this.cancelHandler = null;
    };
    AlertWindowMenu.prototype = new WindowMenu();

    AlertWindowMenu.prototype._acceptListener = function _acceptListener(e) {
        this.acceptHandler();
        this.hide();
    };

    AlertWindowMenu.prototype._closeListener = function _closeListener(e) {
        WindowMenu.prototype._closeListener.call(this, e);
        if (this.cancelHandler) {
            this.cancelHandler();
        }
    };

    AlertWindowMenu.prototype.setHandler = function setHandler(acceptHandler, cancelHandler) {
        this.acceptHandler = acceptHandler;
        this.cancelHandler = cancelHandler;
    };

    AlertWindowMenu.prototype.setFocus = function setFocus() {
        this.acceptButton.focus();
    };

    Wirecloud.ui.AlertWindowMenu = AlertWindowMenu;
})();
