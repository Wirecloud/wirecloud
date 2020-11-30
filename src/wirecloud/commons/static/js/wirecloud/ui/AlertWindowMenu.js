/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, se, utils) {

    "use strict";

    /**
     * Specific class representing alert dialogs
     *
     * @example
     *
     * var dialog = new Wirecloud.ui.AlertWindowMenu("Do you really want to continue?");
     * dialog.show();
     */
    ns.AlertWindowMenu = class AlertWindowMenu extends ns.WindowMenu {

        constructor(options) {
            // Process options
            if (options == null) {
                throw new TypeError("missing options parameter");
            } else if (typeof options === "string" || options instanceof se.StyledElement) {
                options = {
                    message: options
                };
            }

            options = utils.merge({
                acceptLabel: utils.gettext('Yes'),
                cancelLabel: utils.gettext('No')
            }, options);

            if (options.message == null) {
                throw new TypeError("invalid message option");
            }

            super(utils.gettext('Warning'), 'wc-alert-modal');

            this.msgElement = document.createElement('div');
            this.msgElement.className = "msg";
            this.windowContent.appendChild(this.msgElement);

            // Accept button
            this.acceptButton = new se.Button({
                text: options.acceptLabel,
                state: 'danger',
                class: "btn-accept"
            });
            this.acceptButton.addEventListener("click", _acceptListener.bind(this));
            this.acceptButton.insertInto(this.windowBottom);

            // Cancel button
            this.cancelButton = new se.Button({
                text: options.cancelLabel,
                state: 'primary',
                class: "btn-cancel"
            });
            this._closeListener = _closeListener.bind(this);
            this.cancelButton.addEventListener("click", this._closeListener);
            this.cancelButton.insertInto(this.windowBottom);

            this.setMsg(options.message);
            this.acceptHandler = null;
            this.cancelHandler = null;
        }

        /**
         * Updates the message displayed by this <code>WindowMenu</code>
         */
        setMsg(msg) {
            if (msg instanceof se.StyledElement) {
                this.msgElement.innerHTML = '';
                msg.insertInto(this.msgElement);
            } else {
                this.msgElement.textContent = msg;
            }

            return this.repaint();
        }

        setHandler(acceptHandler, cancelHandler) {
            this.acceptHandler = acceptHandler;
            this.cancelHandler = cancelHandler;
            return this;
        }

        setFocus() {
            this.cancelButton.focus();
            return this;
        }

    }

    var _acceptListener = function _acceptListener(e) {
        var task = this.acceptHandler();
        if (task != null && typeof task.then === "function") {
            this.acceptButton.addClassName("busy").disable();
            this.cancelButton.disable();
            task.then(
                () => {
                    this.hide();
                },
                (error) => {
                    this.acceptButton.removeClassName("busy").enable();
                    this.cancelButton.enable();
                }
            );
        } else {
            this.hide();
        }
    };

    var _closeListener = function _closeListener(e) {
        Wirecloud.ui.WindowMenu.prototype._closeListener.call(this, e);
        if (this.cancelHandler) {
            this.cancelHandler();
        }
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
