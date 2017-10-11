/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var retry = function retry(data) {
        Wirecloud.UserInterfaceManager.monitorTask(
            Wirecloud.createWorkspace({
                title: data.title,
                mashup: data.mashup
            }).then(
                function (workspace) {
                    Wirecloud.changeActiveWorkspace(workspace);
                },
                function (msg, details) {
                    var dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);
                    dialog.show();
                }
            )
        );
    };

    var NewWorkspaceWindowMenu = function NewWorkspaceWindowMenu() {
        var fields = {
            'title': {
                label: utils.gettext('Name'),
                type: 'text'
            },
            'mashup': {
                label: utils.gettext('Template'),
                type: 'mac',
                scope: 'mashup',
                dialog_title: utils.gettext('Select a mashup template'),
                required: false,
                parent_dialog: this
            }
        };
        Wirecloud.ui.FormWindowMenu.call(this, fields, utils.gettext('Create Workspace'), 'wc-new-workspace-modal');
    };
    NewWorkspaceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    NewWorkspaceWindowMenu.prototype.executeOperation = function executeOperation(data) {
        var task_title;

        if (data.name) {
            if (data.mashup) {
                task_title = utils.gettext("Creating a %(owner)s/%(name)s workspace using %(mashup)s as template");
            } else {
                task_title = utils.gettext("Creating a %(owner)s/%(name)s workspace");
            }
        } else {
            task_title = utils.gettext("Creating a new workspace using %(mashup)s as template");
        }
        task_title = utils.interpolate(task_title, {
            owner: Wirecloud.contextManager.get('username'),
            name: data.name,
            mashup: data.mashup
        });

        Wirecloud.UserInterfaceManager.monitorTask(
            Wirecloud.createWorkspace({
                title: data.title,
                mashup: data.mashup
            }).then(function (workspace) {
                return Wirecloud.changeActiveWorkspace(workspace);
            }, function (error) {
                var dialog;
                if (error.details != null && 'missingDependencies' in error.details) {
                    // Show missing dependencies
                    dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(retry.bind(null, data), error.details);
                } else {
                    dialog = new Wirecloud.ui.MessageWindowMenu(error, Wirecloud.constants.LOGGING.ERROR_MSG);
                }
                dialog.show();
            }).toTask(task_title)
        );
    };

    Wirecloud.ui.NewWorkspaceWindowMenu = NewWorkspaceWindowMenu;

})(Wirecloud.Utils);
