/*
 *     Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    /**
     * Form
     *
     * @constructor
     * @extends StyledElements.StyledElement
     * @name StyledElements.Form
     * @since 0.5
     * @param {Object[]} fields form field descriptions
     * @param {Object.<String, *>} [options] form options
     */
    var Form = function Form(fields, options) {
        var div, buttonArea, defaultOptions;

        defaultOptions = {
            readOnly: false,
            buttonArea: null,
            setdefaultsButton: false,
            resetButton: false,
            acceptButton: true,
            cancelButton: true,
            useHtmlForm: true,
            factory: StyledElements.DefaultInputInterfaceFactory
        };
        if (options && options.readOnly) {
            defaultOptions.acceptButton = false;
            defaultOptions.cancelButton = false;
        }
        options = utils.merge(defaultOptions, options);

        if (fields == null || typeof fields !== "object") {
            throw new TypeError("invalid fields parameter");
        } else if (!Array.isArray(fields)) {
            fields = norm_fields(fields);
        }

        // Parse setdefaultsButton
        this.setdefaultsButton = null;
        if (options.setdefaultsButton instanceof StyledElements.Button) {
            this.setdefaultsButton = options.setdefaultsButton;
        } else if (options.setdefaultsButton === true) {
            this.setdefaultsButton = new StyledElements.Button({
                usedInForm: options.useHtmlForm,
                text: utils.gettext('Set Defaults')
            });
        }

        // Parse resetButton
        this.resetButton = null;
        if (options.resetButton instanceof StyledElements.Button) {
            this.resetButton = options.resetButton;
        } else if (options.resetButton === true) {
            this.resetButton = new StyledElements.Button({
                usedInForm: options.useHtmlForm,
                text: utils.gettext('Reset')
            });
        }

        // Parse acceptButton
        this.acceptButton = null;
        if (options.acceptButton instanceof StyledElements.Button) {
            this.acceptButton = options.acceptButton;
        } else if (options.acceptButton === true) {
            this.acceptButton = new StyledElements.Button({
                'usedInForm': options.useHtmlForm,
                'class': 'btn-primary',
                'text': utils.gettext('Accept')
            });
        }

        // Parse cancelButton
        this.cancelButton = null;
        if (options.cancelButton instanceof StyledElements.Button) {
            this.cancelButton = options.cancelButton;
        } else if (options.cancelButton === true) {
            this.cancelButton = new StyledElements.Button({
                usedInForm: options.useHtmlForm,
                text: utils.gettext('Cancel')
            });
        }

        StyledElements.StyledElement.call(this, ['submit', 'cancel']);

        this.childComponents = [];
        this.readOnly = options.readOnly;
        this.fields = {};
        this.fieldList = fields;
        this.focusField = fields.length > 0 ? fields[0].name : null;
        this.fieldInterfaces = {};
        this.factory = options.factory;

        // Build GUI
        div = document.createElement('div');
        if (options.useHtmlForm) {
            this.wrapperElement = document.createElement('form');
            this.wrapperElement.addEventListener('submit', function (e) {
                e.preventDefault();
            }, true);
            this.wrapperElement.appendChild(div);
        } else {
            this.wrapperElement = div;
        }
        div.appendChild(this.pBuildFieldTable(fields));
        this.wrapperElement.className = "styled_form";

        // Mark our message div as an error msg
        this.msgElement = document.createElement('div');
        this.msgElement.className = 'alert alert-error';
        div.appendChild(this.msgElement);
        setMsgs.call(this, []);

        if (options.buttonArea != null) {
            buttonArea = options.buttonArea;
        } else if (options.acceptButton !== false || options.cancelButton !== false) {
            buttonArea = document.createElement('div');
            buttonArea.className = 'buttons';
            div.appendChild(buttonArea);
        }

        // Set Defaults button
        if (this.setdefaultsButton != null) {
            this.setdefaultsButton.addEventListener("click", this.defaults.bind(this));
            this.setdefaultsButton.insertInto(buttonArea);
        }

        // Reset button
        if (this.resetButton != null) {
            this.resetButton.addEventListener("click", this.reset.bind(this));
            this.resetButton.insertInto(buttonArea);
        }

        // Accept button
        if (this.acceptButton != null) {
            this.acceptButton.addEventListener("click", acceptHandler.bind(this));
            this.acceptButton.insertInto(buttonArea);
        }

        // Cancel button
        if (this.cancelButton != null) {
            this.cancelButton.addEventListener("click", cancelHandler.bind(this));
            this.cancelButton.insertInto(buttonArea);
        }
    };
    utils.inherit(Form, StyledElements.StyledElement);

    Form.prototype.repaint = function repaint(temporal) {
        var i;

        for (i = 0; i < this.childComponents.length; i += 1) {
            this.childComponents[i].repaint(temporal);
        }

        for (i in this.fieldInterfaces) {
            this.fieldInterfaces[i].repaint();
        }

        return this;
    };

    Form.prototype.pBuildFieldGroups = function (fields) {
        var notebook, tab, tmp_field, tmp_input;

        notebook = new StyledElements.Notebook({full: false});
        this.childComponents.push(notebook);

        fields.forEach(function (field) {
            tab = notebook.createTab({
                label: field.shortTitle,
                closable: false
            });
            tab.addEventListener('show', this.repaint.bind(this));
            if (field.nested === true) {
                tmp_field = {
                    'name': field.name,
                    'type': 'fieldset',
                    'fields': field.fields
                };
                tmp_input = this.factory.createInterface(field.name, tmp_field);
                tmp_input.assignDefaultButton(this.acceptButton);

                this.fieldInterfaces[field.name] = tmp_input;
                this.fields[field.name] = tmp_field;
                tab.appendChild(tmp_input);
            } else {
                tab.appendChild(this.pBuildFieldTable(field.fields));
            }
        }, this);

        return notebook.wrapperElement;
    };

    Form.prototype.pBuildFieldTable = function (fields) {
        var table, tbody;

        // TODO
        if (fields[0] && fields[0].type === 'group') {
            return this.pBuildFieldGroups(fields);
        }

        table = document.createElement('table');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');
        tbody = document.createElement('tbody');
        table.appendChild(tbody);

        fields.forEach(function (field) {
            var row, cell, fieldId = field.name;
            row = tbody.insertRow(-1);

            switch (field.type) {
            case 'columnLayout':
                cell = row.insertCell(-1);
                cell.setAttribute('colspan', 2);
                insertColumnLayout.call(this, field, cell);
                break;
            case 'lineLayout':
                cell = row.insertCell(-1);
                cell.setAttribute('colspan', 2);
                insertLineLayout.call(this, field, cell);
                break;
            case 'hidden':
                row.className = "hidden";
                /* falls through */
            default:
                insertField.call(this, fieldId, field, row);
            }
        }, this);

        return table;
    };

    /**
     * Does extra checks for testing field validity. This method must be overwriten
     * by child classes for providing these extra checks.
     *
     * @param {Object} fields Hash with the current fields
     */
    Form.prototype.extraValidation = function (fields) {
        // Parent implementation, allways true if no redefined by child class!
        return [];
    };

    /**
     * Gets the value for the fields of this form as a whole
     *
     * @since 0.5
     *
     * @returns {StyledElements.Form}
     *      The instance on which the member is called.
     */
    Form.prototype.getData = function getData() {
        var data, fieldId, field;

        data = {};
        for (fieldId in this.fieldInterfaces) {
            field = this.fieldInterfaces[fieldId];
            data[fieldId] = field.getValue();
        }
        return data;
    };

    /**
     * Sets the value for the fields of this form as a whole. If data is null
     * all field inputs will be reset to their initial value.
     *
     * @since 0.5
     *
     * @param {Object} [data]
     *      New values. `null` or `undefined` for reseting all the fields to
     *      their initial values.
     * @returns {StyledElements.Form}
     *      The instance on which the member is called.
     */
    Form.prototype.setData = function setData(data) {
        var field, fieldId;

        if (typeof data !== 'object' && typeof data !== 'undefined') {
            throw new TypeError();
        }

        setMsgs.call(this, []);
        if (data != null) {
            for (fieldId in this.fieldInterfaces) {
                field = this.fieldInterfaces[fieldId];
                field._setValue(data[fieldId]);
            }
        } else {
            for (fieldId in this.fields) {
                field = this.fieldInterfaces[fieldId];
                field.reset();
            }
        }

        return this;
    };

    /**
     * Updates the values of the fields managed by this form.
     *
     * @since 0.8
     *
     * @param {Object} data
     *      New values.
     * @returns {StyledElements.Form}
     *      The instance on which the member is called.
     */
    Form.prototype.update = function update(data) {
        var field, fieldId;

        if (data == null || typeof data !== 'object') {
            throw new TypeError("Invalid data value");
        }

        setMsgs.call(this, []);
        for (fieldId in this.fieldInterfaces) {
            if (fieldId in data) {
                field = this.fieldInterfaces[fieldId];
                field._setValue(data[fieldId]);
            }
        }

        return this;
    };

    Form.prototype.is_valid = function () {
        // Validate input fields
        var fieldId, extraErrorMsgs, errorMsgs,
            validationManager = new StyledElements.ValidationErrorManager();
        for (fieldId in this.fieldInterfaces) {
            validationManager.validate(this.fieldInterfaces[fieldId]);
        }

        // Extra validations
        extraErrorMsgs = this.extraValidation(this.fields);

        // Build Error Message
        errorMsgs = validationManager.toHTML();

        if (extraErrorMsgs !== null) {
            errorMsgs = errorMsgs.concat(extraErrorMsgs);
        }

        // Show error message if needed
        setMsgs.call(this, errorMsgs);
        return errorMsgs.length === 0;
    };

    /**
     * Resets form values using the initial values
     *
     * @since 0.5
     */
    Form.prototype.reset = function reset() {
        return this.setData();
    };

    /**
     * Resets form values using the default values
     *
     * @since 0.5
     */
    Form.prototype.defaults = function defaults() {
        var field, fieldId;

        setMsgs.call(this, []);
        for (fieldId in this.fields) {
            field = this.fieldInterfaces[fieldId];
            field._setValue(field._defaultValue);
        }

        return this;
    };

    Form.prototype.destroy = function destroy() {
        var i = 0;

        for (i = 0; i < this.childComponents.length; i += 1) {
            this.childComponents[i].destroy();
        }
        this.childComponents = null;

        if (this.setdefaultsButton) {
            this.setdefaultsButton.destroy();
            this.setdefaultsButton = null;
        }

        if (this.resetButton) {
            this.resetButton.destroy();
            this.resetButton = null;
        }

        if (this.acceptButton) {
            this.acceptButton.destroy();
            this.acceptButton = null;
        }

        if (this.cancelButton) {
            this.cancelButton.destroy();
            this.cancelButton = null;
        }
    };

    /**
     * Enables/disables this Form
     * @private
     */
    Form.prototype._onenabled = function _onenabled(enabled) {
        var fieldId, inputInterface;

        for (fieldId in this.fieldInterfaces) {
            inputInterface = this.fieldInterfaces[fieldId];
            inputInterface.setDisabled(!enabled || this.readOnly || inputInterface._readOnly);
        }
        if (this.resetButton != null) {
            this.resetButton.enabled = enabled;
        }
        if (this.setdefaultsButton != null) {
            this.setdefaultsButton.enabled = enabled;
        }
        if (this.acceptButton != null) {
            this.acceptButton.enabled = enabled;
        }
        if (this.cancelButton != null) {
            this.cancelButton.enabled = enabled;
        }
    };

    /**
     * Focus this Form
     * @since 0.7
     *
     * @returns {StyledElements.Form}
     *      The instance on which the member is called.
     */
    Form.prototype.focus = function focus() {

        var field = this.fieldInterfaces[this.focusField];
        if (field) {
            field.focus();
        }

        return this;
    };

    Form.prototype.displayMessage = function displayMessage(message) {
        setMsgs.call(this, [message]);
    };

    Form.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
        this.repaint();
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var norm_fields = function norm_fields(fields) {
        var key, field, list = [];

        // backwards compatilibity
        for (key in fields) {
            field = fields[key];

            if (!('name' in field)) {
                field.name = key;
            }

            list.push(field);
        }

        return list;
    };

    var acceptHandler = function acceptHandler() {
        if (this.is_valid()) {
            var data = this.getData();
            this.dispatchEvent('submit', data);
        }
    };

    var cancelHandler = function cancelHandler() {
        this.dispatchEvent('cancel');
    };

    var insertColumnLayout = function insertColumnLayout(desc, wrapper) {
        var table, tbody, row, cell, i;

        table = document.createElement('table');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        row = tbody.insertRow(-1);

        for (i = 0; i < desc.columns.length; i += 1) {
            cell = row.insertCell(-1);
            cell.appendChild(this.pBuildFieldTable(desc.columns[i]));
        }
        wrapper.appendChild(table);
    };

    var insertLineLayout = function insertLineLayout(desc, wrapper) {

        var fields = norm_fields(desc.fields);
        fields.forEach(function (field) {
            var  fieldId, inputInterface, wrapperElement;

            fieldId = field.name;

            inputInterface = this.factory.createInterface(fieldId, field);
            inputInterface.assignDefaultButton(this.acceptButton);
            inputInterface.insertInto(wrapper);
            // TODO
            wrapperElement = null;
            if (inputInterface.wrapperElement && inputInterface.wrapperElement.wrapperElement) {
                wrapperElement = inputInterface.wrapperElement.wrapperElement;
            } else if (inputInterface.inputElement && inputInterface.inputElement.wrapperElement) {
                wrapperElement = inputInterface.inputElement.wrapperElement;
            }
            if (wrapperElement) {
                wrapperElement.style.display = 'inline-block';
                wrapperElement.style.verticalAlign = 'middle';
            }

            this.fieldInterfaces[fieldId] = inputInterface;

            this.fields[fieldId] = field;
        }, this);
    };

    var insertField = function insertField(fieldId, field, row) {
        var separator, hr, labelRow, labelCell, label, requiredMark, inputCell, inputInterface, tooltip;

        if (field.type === 'separator') {
            separator = row.insertCell(-1);
            separator.setAttribute('colspan', '2');
            hr = document.createElement('hr');
            separator.appendChild(hr);
            return;
        }

        if (field.type === 'label') {
            labelRow = row.insertCell(-1);
            labelRow.setAttribute('colspan', '2');
            labelRow.addClassName('label-row');
            if (field.url) {
                label = document.createElement('a');
                label.setAttribute("href", field.url);
                label.setAttribute("target", "_blank");
            } else {
                label = document.createElement('label');
            }
            label.appendChild(document.createTextNode(field.label));
            labelRow.appendChild(label);
            return;
        }

        inputInterface = this.factory.createInterface(fieldId, field);

        // Label Cell
        labelCell = row.insertCell(-1);
        labelCell.classList.add('label-cell');

        label = document.createElement('label');
        label.textContent = field.label;
        labelCell.appendChild(label);
        if (field.description != null) {
            tooltip = new StyledElements.Tooltip({content: field.description, placement: ['right', 'bottom', 'top', 'left']});
            tooltip.bind(label);
        }

        if (field.required && !this.readOnly) {
            requiredMark = document.createElement('span');
            requiredMark.appendChild(document.createTextNode('*'));
            requiredMark.className = 'required_mark';
            labelCell.appendChild(requiredMark);
        }

        // Input Cell
        inputCell = document.createElement('td');
        row.appendChild(inputCell);

        inputInterface.assignDefaultButton(this.acceptButton);
        inputInterface.insertInto(inputCell);
        if (this.readOnly || inputInterface._readOnly) {
            inputInterface.setDisabled(true);
        }

        this.fieldInterfaces[fieldId] = inputInterface;

        this.fields[fieldId] = field;
    };

    var setMsgs = function setMsgs(msgs) {
        var i, wrapper;

        this.msgElement.innerHTML = '';

        if (msgs.length > 0) {
            for (i = 0; i < msgs.length; i += 1) {
                wrapper = document.createElement('p');
                wrapper.textContent = msgs[i];
                this.msgElement.appendChild(wrapper);
            }
            this.msgElement.style.display = '';
        } else {
            this.msgElement.style.display = 'none';
        }
    };

    StyledElements.Form = Form;

})(StyledElements, StyledElements.Utils);
