/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * Specific class representing alert dialogs
     */
    var AlertWindowMenu = function AlertWindowMenu(options) {

        Wirecloud.ui.WindowMenu.call(this, utils.gettext('Warning'), 'wc-alert-modal');

        this.msgElement = document.createElement('div');
        this.msgElement.className = "msg";
        this.windowContent.appendChild(this.msgElement);

        options = utils.merge({
            acceptLabel: utils.gettext('Yes'),
            cancelLabel: utils.gettext('No')
        }, options);

        this.acceptButton = new se.Button({
            text: options.acceptLabel,
            state: 'danger',
            class: "btn-accept"
        });
        this._acceptListener = this._acceptListener.bind(this);
        this.acceptButton.addEventListener("click", this._acceptListener);
        this.acceptButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new se.Button({
            text: options.cancelLabel,
            state: 'primary',
            class: "btn-cancel"
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);

        this.acceptHandler = null;
        this.cancelHandler = null;
    };
    utils.inherit(AlertWindowMenu, Wirecloud.ui.WindowMenu);

    /**
     * Updates the message displayed by this <code>WindowMenu</code>
     */
    AlertWindowMenu.prototype.setMsg = function setMsg(msg) {
        if (msg instanceof se.StyledElement) {
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

        if (this.htmlElement.parentElement != null) {
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

})(StyledElements, StyledElements.Utils);
