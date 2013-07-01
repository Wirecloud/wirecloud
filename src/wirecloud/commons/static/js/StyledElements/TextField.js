/*global EzWebExt, StyledElements */

(function () {

    "use strict";

    var StyledTextField, oninput, onfocus, onblur;

    oninput = function oninput() {
        this.events.change.dispatch(this);
    };

    onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.events.focus.dispatch(this);
    };

    onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.events.blur.dispatch(this);
    };

    /**
     * Añade un campo de texto.
     */
    StyledTextField = function StyledTextField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': '',
            'placeholder': null
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = "styled_text_field";
        if (options['class'] !== "") {
            this.wrapperElement.className += " " + options['class'];
        }

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "text");

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.placeholder != null) {
            this.setPlaceholder(options.placeholder);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        var div = document.createElement("div");
        div.appendChild(this.inputElement);
        this.wrapperElement.appendChild(div);

        /* Internal events */
        this._oninput = oninput.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('click', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
    };
    StyledTextField.prototype = new StyledElements.StyledInputElement();

    StyledTextField.prototype.setPlaceholder = function setPlaceholder(placeholder) {
        this.inputElement.setAttribute('placeholder', placeholder);
    };

    StyledTextField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', EzWebExt.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        delete this._oninput;
        delete this._onfocus;
        delete this._onblur;

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledTextField = StyledTextField;

})();
