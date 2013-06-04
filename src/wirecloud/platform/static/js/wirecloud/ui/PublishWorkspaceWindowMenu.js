/*global EzWebExt, gettext, LayoutManagerFactory, OpManagerFactory, Variable, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishWorkspaceWindowMenu = function PublishWorkspaceWindowMenu(workspace) {

        var fields, user_name, marketFields;

        user_name = OpManagerFactory.getInstance().contextManager.get('username');
        fields = [
            {
                'type': 'group',
                'shortTitle': gettext('General info'),
                'fields': [
                    {name: 'name', label: gettext('Mashup Name'), type: 'text', required: true, initialValue: workspace.getName(), defaultValue: workspace.getName()},
                    {name: 'vendor', label: gettext('Vendor'), type: 'text',  required: true},
                    {name: 'version', label: gettext('Version'), type: 'text',  required: true},
                    {name: 'email', label: gettext('Email'), type: 'text',  required: true},
                    {name: 'description', label: gettext('Description'), type: 'longtext'},
                    {name: 'wikiURI', label: gettext('Homepage'), type: 'text'},
                    {name: 'author', label: gettext('Author'), type: 'text',  initialValue: user_name, defaultValue: user_name}
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
                    {name: 'readOnlyConnectables', label: gettext('Block connections'), type: 'boolean'}
                ]
            }
        ];

        this._addVariableParametrization(workspace, fields);
        Wirecloud.ui.FormWindowMenu.call(this, fields, gettext('Publish Workspace'), 'publish_workspace');

        //fill a warning message
        var warning = document.createElement('div');
        warning.addClassName('alert');
        warning.innerHTML = gettext("<strong>Warning!</strong> Configured and stored data in your workspace (properties and preferences except passwords) will be shared by default!");
        this.windowContent.insertBefore(warning, this.form.wrapperElement);
    };
    PublishWorkspaceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    PublishWorkspaceWindowMenu.prototype._addVariableParametrization = function _addVariableParametrization(workspace, fields) {
        var i, tab_keys, tab_field;

        this.workspace = workspace;
        tab_keys = workspace.tabInstances.keys();

        for (i = 0; i < tab_keys.length; i += 1) {
            tab_field = this._parseTab(workspace.tabInstances.get(tab_keys[i]));
            if (tab_field !== null) {
                fields.push(tab_field);
            }
        }
    };

    PublishWorkspaceWindowMenu.prototype._parseTab = function _parseTab(tab) {

        var i, name, iwidget, iwidgets, iwidget_params, pref_params,
            prop_params, variable, variables, varManager, var_elements,
            fields;

        varManager = tab.workspace.getVarManager();
        iwidgets = tab.getDragboard().getIWidgets();
        fields = [];

        for (i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i];
            variables = varManager.getIWidgetVariables(iwidget.getId());
            pref_params = [];
            prop_params = [];

            for (name in variables) {
                variable = variables[name];
                if (variable.vardef.aspect === Variable.prototype.USER_PREF) {
                    pref_params.push({
                        label: variable.getLabel(),
                        type: 'parametrizableValue',
                        variable: variable,
                        canBeHidden: true,
                        parentWindow: this
                    });
                } else if (variable.vardef.aspect === Variable.prototype.PROPERTY) {
                    prop_params.push({
                        label: variable.getLabel(),
                        type: 'parametrizableValue',
                        variable: variable,
                        parentWindow: this
                    });
                }
            }

            var_elements = {};
            if (pref_params.length !== 0) {
                var_elements.pref = {
                    label: gettext('Preferences'),
                    type: 'fieldset',
                    fields: pref_params.sort(this._sortVariables)
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

    PublishWorkspaceWindowMenu.prototype.show = function show(parentWindow) {
        Wirecloud.ui.FormWindowMenu.prototype.show.call(this, parentWindow);
        this.setValue(this.workspace.workspaceGlobalInfo.params);
    };

    PublishWorkspaceWindowMenu.prototype.setFocus = function setFocus() {
        this.form.fieldInterfaces.name.focus();
    };

    PublishWorkspaceWindowMenu.prototype.executeOperation = function executeOperation(data) {
        var key;

        data.parametrization = {};

        for (key in data) {
            if (key.startsWith('tab-')) {
                EzWebExt.merge(data.parametrization, data[key]);
                delete data[key];
            }
        }
        OpManagerFactory.getInstance().activeWorkspace.publish(data);
    };

    Wirecloud.ui.PublishWorkspaceWindowMenu = PublishWorkspaceWindowMenu;
})();
