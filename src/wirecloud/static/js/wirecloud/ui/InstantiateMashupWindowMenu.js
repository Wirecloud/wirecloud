/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global gettext, StyledElements*/

(function () {

    "use strict";

    var newWorkspace, mergeWorkspace, InstantiateMashupWindowMenu;

    newWorkspace = function (mashup) {
        OpManagerFactory.getInstance().addMashupResource(mashup);
        this.destroy();
    };

    mergeWorkspace = function (mashup) {
        OpManagerFactory.getInstance().mergeMashupResource(mashup);
        this.destroy();
    };

    /*
     * Constructor
     */
    InstantiateMashupWindowMenu = function InstantiateMashupWindowMenu (mashup) {
        WindowMenu.call(this, gettext('Add Mashup'));

        this.iconElement = document.createElement('div');
        Element.extend(this.iconElement);
        this.iconElement.className = "window-icon icon-size icon-warning";
        this.windowContent.insertBefore(this.iconElement, this.windowContent.childNodes[0]);

        this.setMsg(gettext('You are going to add a Mashup that could be composed by more than one widget. Do you want to add it to a new Workspace or to the current one?'));

        // New Workspace button
        this.acceptButton = new StyledElements.StyledButton({
            text: gettext('New Workspace'),
            useInForm: true
        });
        this.acceptButton.addEventListener("click", newWorkspace.bind(this, mashup));
        this.acceptButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            text: gettext('Current Workspace'),
            useInForm: true
        });
        this.cancelButton.addEventListener("click", mergeWorkspace.bind(this, mashup));
        this.cancelButton.insertInto(this.windowBottom);
    };
    InstantiateMashupWindowMenu.prototype = new WindowMenu();

    InstantiateMashupWindowMenu.prototype.destroy = function destroy () {
        this.hide();
        this.acceptButton.destroy();
        this.cancelButton.destroy();
    };

    Wirecloud.ui.InstantiateMashupWindowMenu = InstantiateMashupWindowMenu;
})();
