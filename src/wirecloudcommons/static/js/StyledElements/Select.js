/*globals EzWebExt, StyledElements*/

(function () {

    "use strict";

    var StyledSelect, onchange, onfocus, onblur;

    onchange = function onchange(event) {
        if (this.enabled) {
            var optionList = event.target;
            EzWebExt.setTextContent(this.textDiv, optionList[optionList.selectedIndex].text);
            this.events.change.dispatch(this);
        }
    };

    onfocus = function onfocus() {
        EzWebExt.addClassName(this.wrapperElement, 'focus');
        this.events.focus.dispatch(this);
    };

    onblur = function onblur() {
        EzWebExt.removeClassName(this.wrapperElement, 'focus');
        this.events.blur.dispatch(this);
    };

    /**
     *
     * Options:
     *     * initialEntries:
     *     * initialValue:
     *     * idFunc: In case you want to assign non-string values, you must provide
     *     a function for converting them into strings.
     */
    StyledSelect = function StyledSelect(options) {
        options = EzWebExt.merge({
            'class': '',
            'initialEntries': [],
            'initialValue': null,
            'idFunc': function (value) {
                if (typeof value === 'string') {
                    return value;
                } else if (value === null || value === undefined) {
                    return '';
                } else if (typeof value === 'number') {
                    return '' + value;
                } else {
                    throw new TypeError();
                }
            }
        },
        options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = EzWebExt.prependWord(options['class'], "styled_select");

        var wrapper = document.createElement("div");
        this.wrapperElement.appendChild(wrapper);

        var div =  document.createElement("div");
        div.className = "arrow";
        this.inputElement = document.createElement("select");

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.textDiv = document.createElement("div");
        this.textDiv.className = "text";

        wrapper.appendChild(this.textDiv);
        wrapper.appendChild(div);
        wrapper.appendChild(this.inputElement);

        this.optionsByValue = {};
        this.optionValues = {};
        this.idFunc = options.idFunc;
        this.addEntries(options.initialEntries);

        /* Internal events */
        this._onchange = onchange.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('click', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('change', this._onchange, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);

        // initialize the textDiv with the initial selection
        var selectedIndex = this.inputElement.options.selectedIndex;
        if (selectedIndex !== -1) {
            EzWebExt.setTextContent(this.textDiv, this.inputElement.options[selectedIndex].text);
        }
    };
    StyledSelect.prototype = new StyledElements.StyledInputElement();

    StyledSelect.prototype.getLabel = function getLabel() {
        return EzWebExt.getTextContent(this.textDiv);
    };

    StyledSelect.prototype.getValue = function getValue() {
        return this.optionValues[this.inputElement.value];
    };

    StyledSelect.prototype.setValue = function setValue(newValue) {
        if (typeof newValue !== 'string') {
            try {
                newValue = this.idFunc(newValue);
            } catch (e) {
                newValue = null;
            }
        }

        // TODO exception if the newValue is not listened in the option list?
        if (newValue === null || !(newValue in this.optionValues)) {
            if (this.defaultValue != null) {
                newValue = this.defaultValue;
            } else if (this.inputElement.options.length > 0) {
                newValue = this.inputElement.options[0].value;
            } else {
                StyledElements.StyledInputElement.prototype.setValue.call(this, '');
                EzWebExt.setTextContent(this.textDiv, '');
                return;
            }
        }

        StyledElements.StyledInputElement.prototype.setValue.call(this, newValue);
        EzWebExt.setTextContent(this.textDiv, this.optionsByValue[newValue]);
    };

    /**
     * @param {null|Array} newEntries Entries to add. This method does nothing if
     * newEntries is null.
     */
    StyledSelect.prototype.addEntries = function addEntries(newEntries) {
        var oldSelectedIndex, optionValue, optionLabel;

        oldSelectedIndex = this.inputElement.options.selectedIndex;

        if (newEntries == null || newEntries.length === 0) {
            return;
        }

        for (var i = 0; i < newEntries.length; i++) {
            var option = document.createElement("option");
            if (newEntries[i] instanceof Array) {
                optionValue = newEntries[i][0];
                optionLabel = newEntries[i][1];
            } else {
                optionValue = newEntries[i].value;
                optionLabel = newEntries[i].label;
            }
            optionLabel = optionLabel ? optionLabel : optionValue;

            var realValue = optionValue;
            if (typeof optionValue !== 'string') {
                optionValue = this.idFunc(optionValue);
            }
            option.setAttribute("value", optionValue);
            option.appendChild(document.createTextNode(optionLabel));

            if (this.defaultValue == optionValue) {
                option.setAttribute("selected", "selected");
            }

            this.inputElement.appendChild(option);
            this.optionValues[optionValue] = realValue;
            this.optionsByValue[optionValue] = optionLabel;
        }

        // initialize the textDiv with the initial selection
        var selectedIndex = this.inputElement.options.selectedIndex;
        if (oldSelectedIndex !== selectedIndex) {
            EzWebExt.setTextContent(this.textDiv, this.inputElement.options[selectedIndex].text);
        }
    };

    StyledSelect.prototype.clear = function clear() {
        // Clear textDiv
        EzWebExt.setTextContent(this.textDiv, "");

        // Clear select element options
        EzWebExt.setTextContent(this.inputElement, "");

        this.optionsByValue = {};
        this.optionsValues = {};
    };

    StyledSelect.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', EzWebExt.stopPropagationListener, true);
        this.inputElement.removeEventListener('change', this._onchange, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledSelect = StyledSelect;

})();
