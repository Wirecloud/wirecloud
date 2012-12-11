/**
 * Form
 */
function Form (fields, options) {
    var div, legend, requiredMark, buttonArea, defaultOptions;

    defaultOptions = {
        'readOnly': false,
        'acceptButton': true,
        'cancelButton': true,
        'useHtmlForm': true,
        'legend': 'auto'
    };
    if (options && options.readOnly) {
        defaultOptions.acceptButton = false;
        defaultOptions.cancelButton = false;
    }
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledElement.call(this, ['submit', 'cancel'])

    this.readOnly = options.readOnly;
    this.fields = {};
    this.fieldInterfaces = {};

    // Build GUI
    div = document.createElement('div');
    if (options.useHtmlForm) {
        this.wrapperElement = document.createElement('form');
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

    buttonArea = document.createElement('div');
    buttonArea.className = 'buttons';
    div.appendChild(buttonArea);

    // Accept button
    this.pAcceptHandler = EzWebExt.bind(this.pAcceptHandler, this);
    this.acceptButton = null;
    if (options.acceptButton instanceof StyledElements.StyledButton) {
        this.acceptButton = options.acceptButton;
    } else if (options.acceptButton === true) {
        this.acceptButton = new StyledElements.StyledButton({text: 'Accept'});
    }
    if (this.acceptButton != null) {
        this.acceptButton.addEventListener("click", this.pAcceptHandler);
        this.acceptButton.insertInto(buttonArea);
    }

    // Cancel button
    this.pCancelHandler = EzWebExt.bind(this.pCancelHandler, this);
    this.cancelButton = null;
    if (options.cancelButton instanceof StyledElements.StyledButton) {
        this.cancelButton = options.cancelButton;
    } else if (options.cancelButton === true) {
        this.cancelButton = new StyledElements.StyledButton({text: 'Cancel'});
    }
    if (this.cancelButton != null) {
        this.cancelButton.addEventListener("click", this.pCancelHandler);
        this.cancelButton.insertInto(buttonArea);
    }
};
Form.prototype = new StyledElements.StyledElement();

Form.prototype.pSetMsgs = function(msgs) {
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

Form.prototype.pBuildFieldTable = function(fields) {
    var table, tbody, fieldId, field, row, cell;

    table = document.createElement('table');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    tbody = document.createElement('tbody'); // IE6 and IE7 needs a tbody to display dynamic tables
    table.appendChild(tbody);

    for (fieldId in fields) {
        field = fields[fieldId];
        row = tbody.insertRow(-1);

        switch(field.type) {
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
        default:
            this.pInsertField(fieldId, field, row);
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
    var field, inputInterface, wrapperElement;

    for (fieldId in desc.fields) {
        field = desc.fields[fieldId];

        inputInterface = InterfaceFactory.createInterface(fieldId, field);
        inputInterface._insertInto(wrapper);
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
};

/**
 * @private
 */
Form.prototype.pInsertField = function (fieldId, field, row) {
    var separator, hr, labelRow;

    if (field.type === 'separator') {
        separator = row.insertCell(-1);
        separator.setAttribute('colSpan', '2');
        hr = document.createElement('hr');
        separator.appendChild(hr);
        return;
    }

    if (field.type === 'label') {
        var labelRow = row.insertCell(-1);
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
    var labelCell = row.insertCell(-1);
    EzWebExt.addClassName(labelCell, 'label');

    var label = document.createElement('label');
    EzWebExt.setTextContent(label, field.label);
    labelCell.appendChild(label);
    if (field.title != null)
        label.setAttribute('title', field.title);

    if (field.required && !this.readOnly) {
        var requiredMark = document.createElement('span');
        requiredMark.appendChild(document.createTextNode('*'));
        requiredMark.className = 'required_mark';
        labelCell.appendChild(requiredMark);
    }

    // Input Cell
    var inputCell = document.createElement('td');
    row.appendChild(inputCell);

    var inputInterface = InterfaceFactory.createInterface(fieldId, field);
    inputInterface._insertInto(inputCell);
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
Form.prototype.extraValidation = function(fields) {
    //Parent implementation, allways true if no redefined by child class!
    return [];
};

Form.prototype.getData = function() {
    var value, data, fieldId, field, value;

    data = {};
    for (fieldId in this.fieldInterfaces) {
        field = this.fieldInterfaces[fieldId];
        value = field.getValue();

        if (field.required || value !== "")
            data[fieldId] = value;
    }
    return data;
};

Form.prototype.setData = function (data) {
    var fieldId;

    for (fieldId in this.fieldInterfaces) {
        field = this.fieldInterfaces[fieldId];
        field._setValue(data[fieldId]);
    }
};

Form.prototype.is_valid = function () {
    // Validate input fields
    var validationManager = new ValidationErrorManager();
    for (var fieldId in this.fieldInterfaces)
        validationManager.validate(this.fieldInterfaces[fieldId]);

    // Extra validations
    var extraErrorMsgs = this.extraValidation(this.fields);

    // Build Error Message
    var errorMsgs = validationManager.toHTML();

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
Form.prototype.pAcceptHandler = function(e) {
    if (this.is_valid()) {
        var data = this.getData();
        this.events['submit'].dispatch(data);
    }
};

/**
 * @private
 */
Form.prototype.pCancelHandler = function(e) {
    this.events['cancel'].dispatch();
};

Form.prototype.reset = function () {
    for (var fieldId in this.fields) {
        var field = this.fieldInterfaces[fieldId];
        field.reset();
    }
    this.pSetMsgs([]);
};

Form.prototype.normalSubmit = function(method, url, options) {
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
}

Form.prototype.destroy = function() {
    this.pAcceptHandler = null;
    this.pCancelHandler = null;
}
