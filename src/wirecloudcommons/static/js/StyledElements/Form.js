/*global $, EzWebExt, gettext, InterfaceFactory, StyledElements, Element, ValidationErrorManager, Wirecloud */

(function () {

    "use strict";

    /**
     * Form
     */
    var Form = function Form(fields, options) {
        var div, legend, requiredMark, buttonArea, defaultOptions;

        defaultOptions = {
            'readOnly': false,
            'buttonArea': null,
            'acceptButton': true,
            'cancelButton': true,
            'useHtmlForm': true,
            'legend': 'auto',
            'edition': false,
            'factory': Wirecloud.form.WirecloudInterfaceFactory
        };
        if (options && options.readOnly) {
            defaultOptions.acceptButton = false;
            defaultOptions.cancelButton = false;
        }
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, ['submit', 'cancel']);

        this.childComponents = [];
        this.readOnly = options.readOnly;
        this.fields = {};
        this.fieldInterfaces = {};
        this.edition = options.edition;
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

        // Legend
        if (options.legend === true || (!this.readOnly && options.legend !== false)) {
            legend = document.createElement('div');
            legend.className = "legend";
            requiredMark = document.createElement('span');
            requiredMark.appendChild(document.createTextNode('*'));
            requiredMark.className = 'required_mark';
            legend.appendChild(requiredMark);
            legend.appendChild(document.createTextNode('required field'));
            div.appendChild(legend);
        }

        // Mark our message div as an error msg
        this.msgElement = document.createElement('div');
        this.msgElement.className = 'msg error';
        div.appendChild(this.msgElement);
        this.pSetMsgs([]);

        if (options.buttonArea != null) {
            buttonArea = options.buttonArea;
        } else {
            buttonArea = document.createElement('div');
            buttonArea.className = 'buttons';
            div.appendChild(buttonArea);
        }

        // Accept button
        this.pAcceptHandler = EzWebExt.bind(this.pAcceptHandler, this);
        this.acceptButton = null;
        if (options.acceptButton instanceof StyledElements.StyledButton) {
            this.acceptButton = options.acceptButton;
        } else if (options.acceptButton === true) {
            this.acceptButton = new StyledElements.StyledButton({
                'usedInForm': true,
                'class': 'btn-primary',
                'text': gettext('Accept')
            });
        }
        if (this.acceptButton !== null) {
            this.acceptButton.addEventListener("click", this.pAcceptHandler);
            this.acceptButton.insertInto(buttonArea);
        }

        // Cancel button
        this.pCancelHandler = EzWebExt.bind(this.pCancelHandler, this);
        this.cancelButton = null;
        if (options.cancelButton instanceof StyledElements.StyledButton) {
            this.cancelButton = options.cancelButton;
        } else if (options.cancelButton === true) {
            this.cancelButton = new StyledElements.StyledButton({
                usedInForm: true,
                text: gettext('Cancel')
            });
        }
        if (this.cancelButton !== null) {
            this.cancelButton.addEventListener("click", this.pCancelHandler);
            this.cancelButton.insertInto(buttonArea);
        }
    };
    Form.prototype = new StyledElements.StyledElement();

    Form.prototype.repaint = function repaint(temporal) {
        var i;

        for (i = 0; i < this.childComponents.length; i += 1) {
            this.childComponents[i].repaint(temporal);
        }
    };

    Form.prototype.pSetMsgs = function (msgs) {
        var i, wrapper;

        this.msgElement.innerHTML = '';

        if (msgs.length > 0) {
            for (i = 0; i < msgs.length; i += 1) {
                wrapper = document.createElement('p');
                EzWebExt.setTextContent(wrapper, msgs[i]);
                this.msgElement.appendChild(wrapper);
            }
            this.msgElement.style.display = '';
        } else {
            this.msgElement.style.display = 'none';
        }
    };

    Form.prototype.pBuildFieldGroups = function (fields) {
        var notebook, i, field, tab, tmp_field, tmp_input;

        notebook = new StyledElements.StyledNotebook();
        this.childComponents.push(notebook);

        for (i = 0; i < fields.length; i += 1) {
            field = fields[i];
            tab = notebook.createTab({name: field.shortTitle, closable: false});
            if (field.nested === true) {
                tmp_field = {
                    'name': field.name,
                    'type': 'fieldset',
                    'fields': field.fields
                };
                tmp_input = this.factory.createInterface(field.name, tmp_field);

                this.fieldInterfaces[field.name] = tmp_input;
                this.fields[field.name] = tmp_field;
                tab.appendChild(tmp_input);
            } else {
                tab.appendChild(this.pBuildFieldTable(field.fields));
            }
        }

        return notebook.wrapperElement;
    };

    Form.prototype.pBuildFieldTable = function (fields) {
        var table, tbody, fieldId, field, row, cell;

        // TODO
        if (fields[0] && fields[0].type === 'group') {
            return this.pBuildFieldGroups(fields);
        }

        table = document.createElement('table');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');
        tbody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
        table.appendChild(tbody);

        for (fieldId in fields) {
            if (fields.hasOwnProperty(fieldId)) {
                field = fields[fieldId];
                if ('name' in field) {
                    fieldId = field.name;
                }

                row = tbody.insertRow(-1);

                switch (field.type) {
                case 'columnLayout':
                    cell = row.insertCell(-1);
                    cell.setAttribute('colspan', 2);
                    this.pInsertColumnLayout(field, cell);
                    break;
                case 'lineLayout':
                    cell = row.insertCell(-1);
                    cell.setAttribute('colspan', 2);
                    this.pInsertLineLayout(field, cell);
                    break;
                case 'hidden':
                    row.className = "hidden";
                    this.pInsertField(fieldId, field, row);
                    break;
                default:
                    this.pInsertField(fieldId, field, row);
                }
            }
        }

        return table;
    };

    Form.prototype.pInsertColumnLayout = function (desc, wrapper) {
        var table, tbody, row, cell, i;

        table = document.createElement('table');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');
        tbody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
        table.appendChild(tbody);
        row = tbody.insertRow(-1);

        for (i = 0; i < desc.columns.length; i += 1) {
            cell = row.insertCell(-1);
            cell.appendChild(this.pBuildFieldTable(desc.columns[i]));
        }
        wrapper.appendChild(table);
    };

    Form.prototype.pInsertLineLayout = function (desc, wrapper) {
        var field, fieldId, inputInterface, wrapperElement;

        for (fieldId in desc.fields) {
            if (desc.fields.hasOwnProperty(fieldId)) {
                field = desc.fields[fieldId];

                inputInterface = this.factory.createInterface(fieldId, field);
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
            }
        }
    };

    /**
     * @private
     */
    Form.prototype.pInsertField = function (fieldId, field, row) {
        var separator, hr, labelRow, labelCell, label, requiredMark, inputCell, inputInterface;

        if (field.type === 'separator') {
            separator = row.insertCell(-1);
            separator.setAttribute('colspan', '2');
            hr = document.createElement('hr');
            separator.appendChild(hr);
            return;
        }

        if (field.type === 'label') {
            labelRow = row.insertCell(-1);
            Element.extend(labelRow);
            labelRow.addClassName('label');
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

        // Label Cell
        labelCell = row.insertCell(-1);
        EzWebExt.addClassName(labelCell, 'label');

        label = document.createElement('label');
        EzWebExt.setTextContent(label, field.label);
        labelCell.appendChild(label);
        if (field.description != null) {
            label.setAttribute('title', field.description);
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

        inputInterface = this.factory.createInterface(fieldId, field);
        inputInterface.insertInto(inputCell);
        if (this.readOnly || inputInterface._readOnly) {
            inputInterface.setDisabled(true);
        }

        this.fieldInterfaces[fieldId] = inputInterface;

        this.fields[fieldId] = field;
    };

    /**
     * Does extra checks for testing field validity. This method must be overwriten
     * by child classes for providing these extra checks.
     *
     * @param {Hash} fields Hash with the current fields
     */
    Form.prototype.extraValidation = function (fields) {
        //Parent implementation, allways true if no redefined by child class!
        return [];
    };

    Form.prototype.getData = function () {
        var value, data, fieldId, field;

        data = {};
        for (fieldId in this.fieldInterfaces) {
            if (this.fieldInterfaces.hasOwnProperty(fieldId)) {
                field = this.fieldInterfaces[fieldId];
                value = field.getValue();

                if (this.edition || field.required || value !== "") {
                    data[fieldId] = value;
                }
            }
        }
        return data;
    };

    Form.prototype.setData = function (data) {
        var field, fieldId;

        if (typeof data !== 'object' && typeof data !== 'undefined') {
            throw new TypeError();
        }

        if (data == null) {
            data = {};
        }

        for (fieldId in this.fieldInterfaces) {
            if (this.fieldInterfaces.hasOwnProperty(fieldId)) {
                field = this.fieldInterfaces[fieldId];
                field._setValue(data[fieldId]);
            }
        }
    };

    Form.prototype.is_valid = function () {
        // Validate input fields
        var fieldId, extraErrorMsgs, errorMsgs,
            validationManager = new ValidationErrorManager();
        for (fieldId in this.fieldInterfaces) {
            if (this.fieldInterfaces.hasOwnProperty(fieldId)) {
                validationManager.validate(this.fieldInterfaces[fieldId]);
            }
        }

        // Extra validations
        extraErrorMsgs = this.extraValidation(this.fields);

        // Build Error Message
        errorMsgs = validationManager.toHTML();

        if (extraErrorMsgs !== null) {
            errorMsgs = errorMsgs.concat(extraErrorMsgs);
        }

        // Show error message if needed
        this.pSetMsgs(errorMsgs);
        return errorMsgs.length === 0;
    };

    /**
     * @private
     */
    Form.prototype.pAcceptHandler = function (e) {
        if (this.is_valid()) {
            var data = this.getData();
            this.events.submit.dispatch(this, data);
        }
    };

    /**
     * @private
     */
    Form.prototype.pCancelHandler = function (e) {
        this.events.cancel.dispatch(this);
    };

    Form.prototype.reset = function () {
        var fieldId, field;
        for (fieldId in this.fields) {
            if (this.fields.hasOwnProperty(fieldId)) {
                field = this.fieldInterfaces[fieldId];
                field.reset();
            }
        }
        this.pSetMsgs([]);
    };

    Form.prototype.normalSubmit = function (method, url, options) {
        options = options ? options : {};

        this.wrapperElement.method = method;
        this.wrapperElement.action = url;

        if (options.enctype) {
            this.wrapperElement.setAttribute('enctype', options.enctype);
        } else {
            this.wrapperElement.removeAttribute('enctype');
        }

        if (options.target) {
            this.wrapperElement.setAttribute('target', options.target);
        } else {
            this.wrapperElement.removeAttribute('target');
        }

        this.wrapperElement.submit();
    };

    Form.prototype.destroy = function destroy() {
        var i = 0;

        for (i = 0; i < this.childComponents.length; i += 1) {
            this.childComponents[i].destroy();
        }
        this.childComponents = null;

        this.pAcceptHandler = null;
        this.pCancelHandler = null;
    };

    window.Form = Form;
})();
