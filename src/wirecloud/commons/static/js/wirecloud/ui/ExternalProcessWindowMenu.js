/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var detect_close_finish, open_external_window;

    detect_close_finish = function detect_close() {
        if (this.external_window.closed) {
            this.external_window = null;
            clearInterval(this.interval);
            this.interval = null;
            this.start_button.enable();
            this.start_button.focus();
        } else if ('href' in this.external_window.location && this.options.return_uri(this.external_window.location.href)) {

            if (typeof this.options.onSuccess === 'function') {
                try {
                    this.options.onSuccess(this.external_window.location.href);
                } catch (e) {
                }
            }

            this.hide();
        }
    };

    open_external_window = function open_external_window(url) {
        this.external_window = window.open(url, '_blank');
        this.interval = setInterval(detect_close_finish.bind(this), 200);
    };

    /**
     * This window menu eases the creation of modal windows that will wait for
     * a external process to finish. This window will show a message warning
     * that the process will continue on another browser window/tab.
     *
     * The external process should finish using the same domain of the current
     * web page for being able to detect this event.
     */
    var ExternalProcessWindowMenu = function ExternalProcessWindowMenu(title, url, msg, options) {

        if (options != null) {
            this.options = options;
        } else {
            this.options = {};
        }
        Wirecloud.ui.WindowMenu.call(this, title, this.options.class);
        this.url = url;

        this.msgElement = document.createElement('div');
        this.msgElement.className = "msg";
        this.msgElement.textContent = msg;
        this.windowContent.appendChild(this.msgElement);

        if (this.options.return_uri == null) {
            this.options.return_uri = function return_uri(uri) {
                return uri !== 'about:blank';
            };
        } else if (typeof this.options.return_uri !== 'function') {
            var base_uri = this.options.return_uri;
            this.options.return_uri = function return_uri(uri) {
                return uri.startsWith(base_uri);
            };
        }

        // Start button
        this.start_button = new StyledElements.Button({
            class: 'btn-primary btn-accept',
            text: utils.gettext('Start')
        });
        this.start_button.insertInto(this.windowBottom);
        this.start_button.addEventListener("click", function () {
            this.start_button.disable();
            this.cancel_button.focus();

            open_external_window.call(this, this.url);
        }.bind(this));

        // Cancel button
        this.cancel_button = new StyledElements.Button({
            class: 'btn-danger btn-cancel',
            text: utils.gettext('Cancel')
        });
        this.cancel_button.insertInto(this.windowBottom);
        this.cancel_button.addEventListener("click", this._closeListener);
    };
    utils.inherit(ExternalProcessWindowMenu, Wirecloud.ui.WindowMenu);

    ExternalProcessWindowMenu.prototype.setFocus = function setFocus() {
        this.start_button.focus();
    };

    ExternalProcessWindowMenu.prototype._closeListener = function _closeListener() {
        if (typeof this.options.onCancel === 'function') {
            try {
                this.options.onCancel();
            } catch (e) {
            }
        }
        Wirecloud.ui.WindowMenu.prototype._closeListener.call(this);
    };

    ExternalProcessWindowMenu.prototype.hide = function hide() {
        Wirecloud.ui.WindowMenu.prototype.hide.call(this);
        if (this.external_window) {
            this.external_window.close();
            this.external_window = null;
        }
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    };

    ExternalProcessWindowMenu.prototype.show = function show(parentWindow) {
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };
    Wirecloud.ui.ExternalProcessWindowMenu = ExternalProcessWindowMenu;

})(Wirecloud.Utils);
