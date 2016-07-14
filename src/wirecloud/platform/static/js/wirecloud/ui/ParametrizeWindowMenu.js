/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var ParametrizeWindowMenu = function ParametrizeWindowMenu(inputInterface) {
        var fields, sourceOptions, statusOptions;

        statusOptions = [
            {label: utils.gettext('Normal'), value: 'normal'},
            {label: utils.gettext('Read Only'), value: 'readonly'}
        ];

        if (inputInterface.canBeHidden) {
            statusOptions.push({label: utils.gettext('Hidden'), value: 'hidden'});
        }

        sourceOptions = [
            {label: utils.gettext('Current value'), value: 'current'},
            {label: utils.gettext('Default value'), value: 'default'},
            {label: utils.gettext('Parametrized value'), value: 'custom'}
        ];

        fields = {
            'status': {label: utils.gettext('Status'), type: 'select', initialEntries: statusOptions, required: true},
            'source': {label: utils.gettext('Value source'), type: 'select', initialEntries: sourceOptions, required: true},
            'separator': {type: 'separator'},
            'value': {label: utils.gettext('Value'), type: 'parametrizedText', variable: inputInterface.variable}
        };
        Wirecloud.ui.FormWindowMenu.call(this, fields, utils.gettext('Parametrization'), 'variable_parametrization');

        this.inputInterface = inputInterface;

        // TODO
        var valueInput = this.form.fieldInterfaces.value;
        var sourceInput = this.form.fieldInterfaces.source.inputElement;
        var updateFunc = function () {
            this.valueInput.setDisabled(this.sourceInput.getValue() !== 'custom');
        }.bind({valueInput: valueInput, sourceInput: sourceInput});
        valueInput.update = updateFunc;
        sourceInput.inputElement.addEventListener('change', updateFunc);
    };
    ParametrizeWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    ParametrizeWindowMenu.prototype.setFocus = function setFocus() {
        this.form.fieldInterfaces.status.focus();
    };

    ParametrizeWindowMenu.prototype.executeOperation = function executeOperation(newValue) {
        this.inputInterface.setValue(newValue);
    };

    Wirecloud.ui.ParametrizeWindowMenu = ParametrizeWindowMenu;

})(Wirecloud.Utils);
