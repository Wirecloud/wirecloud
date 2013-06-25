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

    var newWorkspace, mergeWorkspace, InstantiateMashupWindowMenu;

    newWorkspace = function (mashup) {
        LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
        LayoutManagerFactory.getInstance().logSubTask(gettext("Creating a new workspace"));

        OpManagerFactory.getInstance().addWorkspaceFromMashup(mashup, {
            onSuccess: function (workspace) {

                LayoutManagerFactory.getInstance().logStep('');

                // create the new workspace and go to it
                OpManagerFactory.getInstance().changeActiveWorkspace(workspace);
            },
            onFailure: function (msg) {
                var layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }
        });
        this.destroy();
    };

    mergeWorkspace = function (mashup) {
        OpManagerFactory.getInstance().mergeMashupResource(mashup);
        this.destroy();
    };

    /*
     * Constructor
     */
    InstantiateMashupWindowMenu = function InstantiateMashupWindowMenu(mashup) {
        Wirecloud.ui.WindowMenu.call(this, gettext('Add Mashup'));

        this.iconElement = document.createElement('div');
        Element.extend(this.iconElement);
        this.iconElement.className = "window-icon icon-size icon-warning";
        this.windowContent.insertBefore(this.iconElement, this.windowContent.childNodes[0]);

        this.msgElement = document.createElement('div');
        Element.extend(this.msgElement);
        this.msgElement.className = "msg";
        this.windowContent.appendChild(this.msgElement);
        this.msgElement.textContent = gettext('You are going to add a Mashup that could be composed by more than one widget. Do you want to add it to a new Workspace or to the current one?');

        // New Workspace button
        this.newWorkspaceButton = new StyledElements.StyledButton({
            text: gettext('New Workspace'),
            'class': 'btn-primary'
        });
        this.newWorkspaceButton.addEventListener("click", newWorkspace.bind(this, mashup));
        this.newWorkspaceButton.insertInto(this.windowBottom);

        // Cancel button
        this.mergeWorkspaceButton = new StyledElements.StyledButton({
            text: gettext('Current Workspace')
        });
        this.mergeWorkspaceButton.addEventListener("click", mergeWorkspace.bind(this, mashup));
        this.mergeWorkspaceButton.insertInto(this.windowBottom);
    };
    InstantiateMashupWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    InstantiateMashupWindowMenu.prototype.setFocus = function setFocus() {
        this.newWorkspaceButton.focus();
    };

    InstantiateMashupWindowMenu.prototype.destroy = function destroy() {
        this.hide();
        this.newWorkspaceButton.destroy();
        this.mergeWorkspaceButton.destroy();
    };

    Wirecloud.ui.InstantiateMashupWindowMenu = InstantiateMashupWindowMenu;
})();
