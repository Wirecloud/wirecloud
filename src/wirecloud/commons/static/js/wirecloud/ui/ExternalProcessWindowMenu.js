/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class representing alert dialogs.
     */
    var ExternalProcessWindowMenu = function ExternalProcessWindowMenu(title, url, msg) {
        Wirecloud.ui.WindowMenu.call(this, title);

        this.url = url;

        this.msgElement = document.createElement('div');
        this.msgElement.className = "msg";
        this.msgElement.textContent = msg;
        this.windowContent.appendChild(this.msgElement);

        // Start button
        this.start_button = new StyledElements.StyledButton({
            text: gettext('Start'),
            'class': 'btn-primary'
        });
        this.start_button.insertInto(this.windowBottom);
        this.start_button.addEventListener("click", function () {
            this.start_button.disable();
            this.external_window = window.open(this.url, '_blank');
            this.cancel_button.focus();
        }.bind(this));

        // Cancel button
        this.cancel_button = new StyledElements.StyledButton({
            text: gettext('Cancel'),
            'class': 'btn-danger'
        });
        this.cancel_button.insertInto(this.windowBottom);
        this.cancel_button.addEventListener("click", this._closeListener);
    };
    ExternalProcessWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    ExternalProcessWindowMenu.prototype.setFocus = function setFocus() {
        this.start_button.focus();
    };

    ExternalProcessWindowMenu.prototype.hide = function hide() {
        Wirecloud.ui.WindowMenu.prototype.hide.call(this);
        if (this.external_window) {
            this.external_window.close();
            this.external_window = null;
        }
    };

    ExternalProcessWindowMenu.prototype.show = function show(parentWindow) {
        Wirecloud.ui.WindowMenu.prototype.show.call(this, parentWindow);
    };
    Wirecloud.ui.ExternalProcessWindowMenu = ExternalProcessWindowMenu;

})();
