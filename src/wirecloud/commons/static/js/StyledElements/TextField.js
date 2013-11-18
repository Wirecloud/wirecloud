/*global StyledElements */

(function () {

    "use strict";

    var StyledTextField, oninput, onfocus, onblur, onkeypress;

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

    onkeypress = function onkeypress(event) {
        if (event.keyCode === 13) { // enter
            this.events.submit.dispatch(this);
        }
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
        options = Wirecloud.Utils.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur', 'submit']);

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
        this._onkeypress = onkeypress.bind(this);

        this.inputElement.addEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
        this.inputElement.addEventListener('keypress', this._onkeypress, true);
    };
    StyledTextField.prototype = new StyledElements.StyledInputElement();

    StyledTextField.prototype.setPlaceholder = function setPlaceholder(placeholder) {
        this.inputElement.setAttribute('placeholder', placeholder);
    };

    StyledTextField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);
        this.inputElement.removeEventListener('keypress', this._onkeypress, true);

        delete this._oninput;
        delete this._onfocus;
        delete this._onblur;
        delete this._onkeypress;

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledTextField = StyledTextField;

})();
