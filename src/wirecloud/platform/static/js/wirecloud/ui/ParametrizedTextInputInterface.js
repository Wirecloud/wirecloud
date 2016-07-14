/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    /**
     *
     */
    var ParametrizedTextInputInterface = function ParametrizedTextInputInterface(fieldId, options) {
        var i, param, option;

        StyledElements.InputInterface.call(this, fieldId, options);

        this.variable = options.variable;
        this.parameters = this.getAvailableParameters();

        this.wrapperElement = new StyledElements.Container({
            'class': 'parametrized_text_input'
        });

        this.resetButton = new StyledElements.Button({
            'text': StyledElements.Utils.gettext('Use current value')
        });
        this.resetButton.addEventListener('click', function () {
            this.inputElement.setValue(this.escapeValue(this.variable.value));
        }.bind(this));
        this.wrapperElement.appendChild(this.resetButton);

        this.selectorWrapperElement = new StyledElements.Container({
            'class': 'context_selector'
        });
        this.wrapperElement.appendChild(this.selectorWrapperElement);

        this.mainSelect = document.createElement('select');
        for (i = 0; i < this.parameters.length; i += 1) {
            param = this.parameters[i];
            option = new Option(param.label, param.value);
            try {
                this.mainSelect.add(option, null);
            } catch (e) {
                this.mainSelect.add(option);
            }
        }
        this.mainSelect.addEventListener('change', this._updateSecondSelect.bind(this), true);
        this.selectorWrapperElement.appendChild(this.mainSelect);

        this.secondSelect = document.createElement('select');
        this.selectorWrapperElement.appendChild(this.secondSelect);
        this.secondSelect.addEventListener('change', this._updateDescription.bind(this), true);

        this.addButton = new StyledElements.Button({
            'text': StyledElements.Utils.gettext('Add')
        });
        this.addButton.addEventListener('click', function () {
            var prefix, suffix, parameter, start, input;

            input = this.inputElement.inputElement;
            start = input.selectionStart;
            prefix = input.value.substr(0, start);
            suffix = input.value.substr(input.selectionEnd);
            parameter = this.mainSelect.value + '.' + this.secondSelect.value;

            this.inputElement.setValue(prefix + '%(' + parameter + ')' + suffix);
            input.selectionStart = start;
            input.selectionEnd = start + parameter.length + 3;
        }.bind(this));
        this.selectorWrapperElement.appendChild(this.addButton);

        this.descriptionDiv = document.createElement('div');
        this.descriptionDiv.className = 'description';
        this.wrapperElement.appendChild(this.descriptionDiv);

        this.inputElement = new StyledElements.TextArea();
        this.wrapperElement.appendChild(this.inputElement);

        // Initialize
        this._updateSecondSelect();
    };
    ParametrizedTextInputInterface.prototype = new StyledElements.InputInterface();

    ParametrizedTextInputInterface.prototype._ESCAPE_RE = new RegExp("(%+)(\\([a-zA-Z]\\w*(?:\\.[a-zA-Z]\\w*)*\\))");
    ParametrizedTextInputInterface.prototype._ESCAPE_FUNC = function () {
        var str, i;

        i = arguments[1].length * 2;
        str = '';
        while ((i -= 1) >= 0) {
            str += '%';
        }

        return str + arguments[2];
    };

    ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS = null;
    ParametrizedTextInputInterface.prototype.getAvailableParameters = function getAvailableParameters() {
        var concepts, contextFields, conceptName, dashIndex, provider, concept, parameters, label;

        if (ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS === null) {
            concepts = Wirecloud.activeWorkspace.contextManager._concepts;
            contextFields = {
                '': []
            };
            for (conceptName in concepts) {
                concept = concepts[conceptName];
                dashIndex = conceptName.indexOf('-');
                provider = conceptName.substring(0, dashIndex);
                if (!(provider in contextFields)) {
                    contextFields[provider] = [];
                }
                label = utils.interpolate('%(label)s (%(concept)s)', {
                    label: concept._label,
                    concept: conceptName
                });
                contextFields[provider].push({
                    label: label,
                    description: concept._description,
                    value: conceptName
                });
            }

            parameters = [
                {
                    label: StyledElements.Utils.gettext('User'),
                    value: 'user',
                    fields: [
                        {
                            label: StyledElements.Utils.gettext('User Name'),
                            description: '',
                            value: 'username'
                        },
                        {
                            label: StyledElements.Utils.gettext('First Name'),
                            description: '',
                            value: 'first_name'
                        },
                        {
                            label: StyledElements.Utils.gettext('Last Name'),
                            description: '',
                            value: 'last_name'
                        }
                    ]
                },
                {
                    label: StyledElements.Utils.gettext('Context'),
                    value: 'context',
                    fields: contextFields['']
                }
            ];
            delete contextFields[''];
            for (conceptName in contextFields) {
                parameters.push({
                    label: conceptName,
                    value: 'context',
                    fields: contextFields[conceptName]
                });
            }
            ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS = parameters;
        }

        return ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS;
    };

    ParametrizedTextInputInterface.prototype.escapeValue = function escapeValue(value) {
        switch (typeof value) {
        case "number":
        case "boolean":
            value = value.toString();
            break;
        default:
            if (value == null) {
                value = "";
            }
        }

        return value.replace(ParametrizedTextInputInterface.prototype._ESCAPE_RE,
            ParametrizedTextInputInterface.prototype._ESCAPE_FUNC);
    };

    ParametrizedTextInputInterface.prototype._updateSecondSelect = function _updateSecondSelect() {
        var fields, field, i;

        this.secondSelect.innerHTML = '';

        fields = this.parameters[this.mainSelect.selectedIndex].fields;

        for (i = 0; i < fields.length; i += 1) {
            field = fields[i];
            try {
                this.secondSelect.add(new Option(field.label, field.value), null);
            } catch (e) {
                this.secondSelect.add(new Option(field.label, field.value));
            }
        }

        this._updateDescription();
    };

    ParametrizedTextInputInterface.prototype._updateDescription = function _updateDescription() {
        var fields, field;

        fields = this.parameters[this.mainSelect.selectedIndex].fields;
        field = fields[this.secondSelect.selectedIndex];
        this.descriptionDiv.textContent = field.description;
    };

    ParametrizedTextInputInterface.prototype._setError = function _setError() {
    };

    ParametrizedTextInputInterface.prototype._setValue = function _setValue(newValue) {
        this.inputElement.value = newValue;
        if (this.update) {
            this.update();
        }
    };

    ParametrizedTextInputInterface.prototype.setDisabled = function setDisabled(disabled) {

        this.mainSelect.disabled = !!disabled;
        this.secondSelect.disabled = !!disabled;
        this.addButton.setDisabled(disabled);
        this.resetButton.setDisabled(disabled);
        this.inputElement.setDisabled(disabled);
    };

    ParametrizedTextInputInterface.prototype.insertInto = function insertInto(element) {
        this.wrapperElement.insertInto(element);
    };

    Wirecloud.ui.ParametrizedTextInputInterface = ParametrizedTextInputInterface;

})(Wirecloud.Utils);
