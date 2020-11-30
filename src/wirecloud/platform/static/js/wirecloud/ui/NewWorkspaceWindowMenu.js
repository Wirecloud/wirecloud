/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

    const retry = function retry(data) {
        Wirecloud.UserInterfaceManager.monitorTask(
            Wirecloud.createWorkspace(data).then(
                (workspace) => {
                    Wirecloud.changeActiveWorkspace(workspace);
                },
                (msg, details) => {
                    const dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);
                    dialog.show();
                }
            )
        );
    };

    ns.NewWorkspaceWindowMenu = class NewWorkspaceWindowMenu extends ns.FormWindowMenu {

        constructor(options) {
            if (options == null) {
                options = {};
            }
            const fields = {
                "title": {
                    label: utils.gettext("Name"),
                    type: "text",
                    initialValue: options.title
                }
            };
            const title = options.workspace == null ? utils.gettext("Create Workspace") : utils.gettext("Copy Workspace");
            if (options.workspace == null) {
                fields.mashup = {
                    label: utils.gettext("Template"),
                    type: "mac",
                    scope: "mashup",
                    dialog_title: utils.gettext("Select a mashup template"),
                    required: false,
                    parent_dialog: null // TODO this
                };
            } else {
                fields.workspace = {
                    type: "hidden",
                    initialValue: options.workspace
                };
            }
            super(fields, title, "wc-new-workspace-modal");
        }

        executeOperation(data) {
            let task_title;

            if (data.title) {
                if (data.mashup) {
                    task_title = utils.gettext("Creating a %(owner)s/%(title)s workspace using %(mashup)s as template");
                } else {
                    task_title = utils.gettext("Creating a %(owner)s/%(title)s workspace");
                }
            } else {
                task_title = utils.gettext("Creating a new workspace using %(mashup)s as template");
            }
            task_title = utils.interpolate(task_title, {
                owner: Wirecloud.contextManager.get("username"),
                title: data.title,
                mashup: data.mashup
            });

            Wirecloud.UserInterfaceManager.monitorTask(
                Wirecloud.createWorkspace(data).then(
                    (workspace) => {
                        return Wirecloud.changeActiveWorkspace(workspace);
                    },
                    (error) => {
                        let dialog;
                        if (error.details != null && "missingDependencies" in error.details) {
                            // Show missing dependencies
                            dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(retry.bind(null, data), error.details);
                        } else {
                            dialog = new Wirecloud.ui.MessageWindowMenu(error, Wirecloud.constants.LOGGING.ERROR_MSG);
                        }
                        dialog.show();
                    }
                ).toTask(task_title)
            );
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
