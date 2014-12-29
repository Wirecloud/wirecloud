/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class representing alert dialogs
     */
    var AlertWindowMenu = function AlertWindowMenu(options) {

        Wirecloud.ui.WindowMenu.call(this, gettext('Warning'), 'wc-alert-dialog');

        this.msgElement = document.createElement('div');
        this.msgElement.className = "msg";
        this.windowContent.appendChild(this.msgElement);

        options = Wirecloud.Utils.merge({
            acceptLabel: gettext('Yes'),
            cancelLabel: gettext('No')
        }, options);

        this.acceptButton = new StyledElements.StyledButton({
            text: options.acceptLabel,
            'class': 'btn-danger'
        });
        this._acceptListener = this._acceptListener.bind(this);
        this.acceptButton.addEventListener("click", this._acceptListener);
        this.acceptButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            text: options.cancelLabel,
            'class': 'btn-primary'
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);

        this.acceptHandler = null;
        this.cancelHandler = null;
    };
    AlertWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    /**
     * Updates the message displayed by this <code>WindowMenu</code>
     */
    AlertWindowMenu.prototype.setMsg = function setMsg(msg) {
        if (msg instanceof StyledElements.StyledElement) {
            this.msgElement.innerHTML = '';
            msg.insertInto(this.msgElement);
        } else {
            this.msgElement.textContent = msg;
        }

        this.calculatePosition();
    };

    /**
     * Updates the message displayed by this <code>WindowMenu</code>
     */
    AlertWindowMenu.prototype.setHTMLMsg = function setHTMLMsg(msg) {
        this.msgElement.innerHTML = msg;

        if (Wirecloud.Utils.XML.isElement(this.htmlElement.parentNode)) {
            this.calculatePosition();
        }
    };

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
