/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var StyledPasswordField, oninput, onfocus, onblur;

    oninput = function oninput() {
        this.events.change.dispatch(this);
    };

    onfocus = function onfocus() {
        this.events.focus.dispatch(this);
    };

    onblur = function onblur() {
        this.events.blur.dispatch(this);
    };

    /**
     * Añade un campo de texto.
     */
    StyledPasswordField = function StyledPasswordField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': ''
        };
        options = Wirecloud.Utils.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "password");

        this.wrapperElement = this.inputElement;
        this.wrapperElement.className = "se-password-field";
        if (options['class'] !== "") {
            this.wrapperElement.className += " " + options['class'];
        }

        if ('name' in options) {
            this.inputElement.setAttribute("name", options.name);
        }

        if ('id' in options) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        /* Internal events */
        this._oninput = oninput.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
    };
    StyledPasswordField.prototype = new StyledElements.StyledInputElement();

    StyledPasswordField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', Wirecloud.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledPasswordField = StyledPasswordField;

})();
