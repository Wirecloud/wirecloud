/*
 *     Copyright 2012-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global Wirecloud */

(function (utils) {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishWorkspaceWindowMenu = function PublishWorkspaceWindowMenu(workspace) {

        var fields, user_name;

        user_name = Wirecloud.contextManager.get('fullname').trim() !== '' ? Wirecloud.contextManager.get('fullname') : Wirecloud.contextManager.get('username');
        fields = [
            {
                'type': 'group',
                'shortTitle': utils.gettext('General info'),
                'fields': [
                    {name: 'name', label: utils.gettext('Mashup Name'), type: 'text', required: true, initialValue: workspace.getName(), defaultValue: workspace.getName()},
                    {name: 'vendor', label: utils.gettext('Vendor'), type: 'text',  required: true},
                    {name: 'version', label: utils.gettext('Version'), type: 'version',  required: true},
                    {name: 'email', label: utils.gettext('Email'), type: 'email'},
                    {name: 'description', label: utils.gettext('Short Description (plain text)'), type: 'longtext'},
                    {name: 'longdescription', label: utils.gettext('Detailed description (Markdown)'), type: 'longtext'},
                    {name: 'homepage', label: utils.gettext('Home page'), type: 'url'},
                    {name: 'authors', label: utils.gettext('Authors'), type: 'text',  initialValue: user_name, defaultValue: user_name}
                ]
            },
            {
                'type': 'group',
                'shortTitle': utils.gettext('Media'),
                'fields': [
                    {
                        name: 'image',
                        label: utils.gettext('Image shown in catalogue (170x80 px)'),
                        type: 'file'
                    }
                ]
            },
            {
                'type': 'group',
                'shortTitle': utils.gettext('Advanced'),
                'fields': [
                    {name: 'readOnlyWidgets', label: utils.gettext('Block widgets'), type: 'boolean'},
                    {name: 'readOnlyConnectables', label: utils.gettext('Block connections'), type: 'boolean'},
                    {name: 'embedmacs', label: utils.gettext('Embed used widgets/operators'), type: 'boolean', initialValue: true}
                ]
            }
        ];

        // Disable preference and property parametrization for now
        //this._addVariableParametrization(workspace, fields);
        Wirecloud.ui.FormWindowMenu.call(this, fields, utils.gettext('Upload workspace to my resources'), 'publish_workspace', {autoHide: false});

        //fill a warning message
        var warning = document.createElement('div');
        warning.className = 'alert';
        warning.innerHTML = utils.gettext("<strong>Warning!</strong> Configured and stored data in your workspace (properties and preferences except passwords) will be shared by default!");
        this.windowContent.insertBefore(warning, this.form.wrapperElement);
    };
    PublishWorkspaceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    PublishWorkspaceWindowMenu.prototype._addVariableParametrization = function _addVariableParametrization(workspace, fields) {
        var key, tab_field;

        this.workspace = workspace;

        for (key in workspace.tabInstances) {
            tab_field = this._parseTab(workspace.tabInstances[key]);
            if (tab_field !== null) {
                fields.push(tab_field);
            }
        }
    };

    PublishWorkspaceWindowMenu.prototype._parseTab = function _parseTab(tab) {

        var i, j, iwidget, iwidgets, pref_params, prop_params, var_elements, fields;

        iwidgets = tab.getDragboard().getIWidgets();
        fields = [];

        for (i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i].internal_iwidget;
            pref_params = [];
            for (j = 0; j < iwidget.preferenceList.length; j += 1) {
                pref_params.push({
                    label: iwidget.preferenceList[j].label,
                    type: 'parametrizableValue',
                    variable: iwidget.preferenceList[j],
                    canBeHidden: true,
                    parentWindow: this
                });
            }

            prop_params = [];
            for (j = 0; j < iwidget.propertyList.length; j += 1) {
                prop_params.push({
                    label: iwidget.preferenceList[i].label,
                    type: 'parametrizableValue',
                    variable: iwidget.propertyList[j],
                    parentWindow: this
                });
            }

            var_elements = {};
            if (pref_params.length !== 0) {
                var_elements.pref = {
                    label: utils.gettext('Preferences'),
                    type: 'fieldset',
                    fields: pref_params
                };
            }
            if (prop_params.length !== 0) {
                var_elements.props = {
                    label: utils.gettext('Persistent variables'),
                    type: 'fieldset',
                    fields: prop_params.sort(this._sortVariables)
                };
            }

            if (pref_params.length + prop_params.length !== 0) {
                fields.push({
                    name: iwidget.id,
                    label: iwidget.name,
                    type: 'fieldset',
                    nested: true,
                    fields: var_elements
                });
            }
        }

        if (fields.length > 0) {
            return {
                'shortTitle': tab.tabInfo.name,
                'fields': fields,
                'nested': true,
                'name': 'tab-' + tab.tabInfo.name
            };
        } else {
            return null;
        }
    };

    PublishWorkspaceWindowMenu.prototype._sortVariables = function _sortVariables(var1, var2) {
        return var1.variable.vardef.order - var2.variable.vardef.order;
    };

    PublishWorkspaceWindowMenu.prototype.setFocus = function setFocus() {
        this.form.fieldInterfaces.name.focus();
    };

    PublishWorkspaceWindowMenu.prototype.executeOperation = function executeOperation(data) {
        var key;

        data.parametrization = {
            iwidgets: {},
            ioperators: {}
        };

        for (key in data) {
            if (key.startsWith('tab-')) {
                Wirecloud.Utils.merge(data.parametrization.iwidgets, data[key]);
                delete data[key];
            }
        }

        Wirecloud.activeWorkspace.publish(data, {
            onFailure: function (msg) {
                // TODO
                this.form.pSetMsgs([msg]);
            }.bind(this),
            onSuccess: function () {
                this.hide();
            }.bind(this),
            onComplete: function () {
                this.form.acceptButton.enable();
                this.form.cancelButton.enable();
            }.bind(this)
        });
    };

    Wirecloud.ui.PublishWorkspaceWindowMenu = PublishWorkspaceWindowMenu;

})(Wirecloud.Utils);
