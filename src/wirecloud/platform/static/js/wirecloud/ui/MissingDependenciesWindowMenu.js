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

/*global Element, gettext, OpManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var onContinue = function onContinue(next) {
    };

    /*
     * Constructor
     */
    var MissingDependenciesWindowMenu = function MissingDependenciesWindowMenu(next) {
        Wirecloud.ui.WindowMenu.call(this, gettext('Add Mashup'));

        this.msg1Element = document.createElement('p');
        this.windowContent.appendChild(this.msg1Element);
        this.msg1Element.textContent = gettext('The following dependencies are missing:');

        this.msg2Element = document.createElement('p');
        this.windowContent.appendChild(this.msg2Element);
        this.msg2Element.textContent = gettext('You will be able to contine after installing all the required.');

        // New Workspace button
        this.continueButton = new StyledElements.StyledButton({
            text: gettext('Continue'),
        });
        this.continueButton.addEventListener("click", onContinue.bind(this, next));
        this.continueButton.insertInto(this.windowBottom);
        this.continueButton.disable();

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            'class': 'btn-primary',
            text: gettext('Cancel')
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);
    };
    MissingDependenciesWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    MissingDependenciesWindowMenu.prototype.setFocus = function setFocus() {
        this.continueButton.focus();
    };

    MissingDependenciesWindowMenu.prototype.destroy = function destroy() {
        this.hide();
        this.continueButton.destroy();
        this.cancelButton.destroy();
    };

    Wirecloud.ui.MissingDependenciesWindowMenu = MissingDependenciesWindowMenu;
})();
