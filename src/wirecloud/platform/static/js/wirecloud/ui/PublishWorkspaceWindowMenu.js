/*
 *     Copyright 2012-2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, LayoutManagerFactory, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishWorkspaceWindowMenu = function PublishWorkspaceWindowMenu(workspace) {

        var fields, user_name, marketFields;

        user_name = Wirecloud.contextManager.get('username');
        fields = [
            {
                'type': 'group',
                'shortTitle': gettext('General info'),
                'fields': [
                    {name: 'name', label: gettext('Mashup Name'), type: 'text', required: true, initialValue: workspace.getName(), defaultValue: workspace.getName()},
                    {name: 'vendor', label: gettext('Vendor'), type: 'text',  required: true},
                    {name: 'version', label: gettext('Version'), type: 'version',  required: true},
                    {name: 'email', label: gettext('Email'), type: 'text',  required: true},
                    {name: 'description', label: gettext('Description'), type: 'longtext'},
                    {name: 'doc', label: gettext('Homepage'), type: 'text'},
                    {name: 'authors', label: gettext('Author'), type: 'text',  initialValue: user_name, defaultValue: user_name}
                ]
            },
            {
                'type': 'group',
                'shortTitle': gettext('Media'),
                'fields': [
                    {
                        name: 'image',
                        label: gettext('Image shown in catalogue (170x80 px)'),
                        type: 'file'
                    }
                ]
            },
            {
                'type': 'group',
                'shortTitle': gettext('Advanced'),
                'fields': [
                    {name: 'readOnlyWidgets', label: gettext('Block widgets'), type: 'boolean'},
                    {name: 'readOnlyConnectables', label: gettext('Block connections'), type: 'boolean'},
                    {name: 'embedmacs', label: gettext('Embed used widgets/operators'), type: 'boolean'}
                ]
            }
        ];

        // Disable preference and property parametrization for now
        //this._addVariableParametrization(workspace, fields);
        Wirecloud.ui.FormWindowMenu.call(this, fields, gettext('Upload workspace to local catalogue'), 'publish_workspace', {autoHide: false});

        //fill a warning message
        var warning = document.createElement('div');
        warning.className = 'alert';
        warning.innerHTML = gettext("<strong>Warning!</strong> Configured and stored data in your workspace (properties and preferences except passwords) will be shared by default!");
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

        var i, j, iwidget, iwidgets, iwidget_params, pref_params,
            prop_params, var_elements, fields;

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
                    label: gettext('Preferences'),
                    type: 'fieldset',
                    fields: pref_params
                };
            }
            if (prop_params.length !== 0) {
                var_elements.props = {
                    label: gettext('Properties'),
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
            if (Wirecloud.Utils.startsWith(key, 'tab-')) {
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
})();
