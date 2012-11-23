/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/*global Element, gettext, StyledElements, WindowMenu, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class representing alert dialogs.
     */
    var MessageWindowMenu = function MessageWindowMenu(element) {
        WindowMenu.call(this, '');

        // Warning icon
        this.iconElement = document.createElement('div');
        Element.extend(this.iconElement);
        this.iconElement.className = "window-icon icon-size icon-warning";
        this.windowContent.insertBefore(this.iconElement, this.windowContent.childNodes[0]);

        // Accept button
        this.button = new StyledElements.StyledButton({
            text: gettext('Accept')
        });
        this.button.insertInto(this.windowBottom);
        this.button.addEventListener("click", this._closeListener);
    };
    MessageWindowMenu.prototype = new WindowMenu();

    MessageWindowMenu.prototype.setFocus = function setFocus() {
        // TODO
        //setTimeout(this.button.focus.bind(this.button), 0);
    };

    MessageWindowMenu.prototype.show = function show(parentWindow) {
        WindowMenu.prototype.show.call(this, parentWindow);
        this.setFocus();
    };

    MessageWindowMenu.prototype.setType = function setType(type) {
        var titles = ['', gettext('Error'), gettext('Warning'), gettext('Info')];
        var icons = ['', 'icon-error', 'icon-warning', 'icon-info'];

        // Update title
        this.setTitle(titles[type]);

        // Update icon
        this.iconElement.className += ' ' + icons[type];
    };

    Wirecloud.ui.MessageWindowMenu = MessageWindowMenu;
})();
