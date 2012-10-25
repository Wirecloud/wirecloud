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

    var NewWorkspaceWindowMenu = function NewWorkspaceWindowMenu () {
        var fields = {
            'name': {
                label: gettext('Name'),
                type: 'text',
                required: true
            }
        }
        Wirecloud.ui.FormWindowMenu.call(this, fields, gettext('Create Workspace'));
    };
    NewWorkspaceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    NewWorkspaceWindowMenu.prototype.setFocus = function setFocus () {
        this.form.fieldInterfaces['name'].focus();
    };

    NewWorkspaceWindowMenu.prototype.executeOperation = function executeOperation (data) {
        OpManagerFactory.getInstance().addWorkspace(data.name);
    };

    Wirecloud.ui.NewWorkspaceWindowMenu = NewWorkspaceWindowMenu;
})();
