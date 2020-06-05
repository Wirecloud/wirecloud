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


(function (se, utils) {

    "use strict";

    var onContinue = function onContinue(next) {
    };

    /*
     * Constructor
     */
    var MissingDependenciesWindowMenu = function MissingDependenciesWindowMenu(next, details) {
        var list, i, item;

        Wirecloud.ui.WindowMenu.call(this, utils.gettext('Missing dependencies'), 'wc-missing-dependencies-modal');

        this.msg1Element = document.createElement('p');
        this.windowContent.appendChild(this.msg1Element);
        this.msg1Element.textContent = utils.gettext('The following dependencies are missing:');

        list = document.createElement('ul');
        for (i = 0; i < details.missingDependencies.length; i++) {
            item = document.createElement('li');
            item.textContent = details.missingDependencies[i];
            list.appendChild(item);
        }
        this.windowContent.appendChild(list);

        this.msg2Element = document.createElement('p');
        this.windowContent.appendChild(this.msg2Element);
        this.msg2Element.textContent = utils.gettext('You will be able to continue after installing all the required dependencies.');

        // New Workspace button
        this.continueButton = new se.Button({
            class: 'btn-accept',
            text: utils.gettext('Continue'),
        });
        this.continueButton.addEventListener("click", onContinue.bind(this, next));
        this.continueButton.insertInto(this.windowBottom);
        this.continueButton.disable();

        // Cancel button
        this.cancelButton = new se.Button({
            class: 'btn-cancel btn-primary',
            text: utils.gettext('Cancel')
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);
    };
    utils.inherit(MissingDependenciesWindowMenu, Wirecloud.ui.WindowMenu);

    MissingDependenciesWindowMenu.prototype.setFocus = function setFocus() {
        this.continueButton.focus();
    };

    MissingDependenciesWindowMenu.prototype.destroy = function destroy() {
        this.hide();
        this.continueButton.destroy();
        this.cancelButton.destroy();
    };

    Wirecloud.ui.MissingDependenciesWindowMenu = MissingDependenciesWindowMenu;

})(StyledElements, Wirecloud.Utils);
