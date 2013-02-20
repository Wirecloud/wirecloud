/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    var StyledTextArea, oninput, onfocus, onblur;

    oninput = function oninput() {
        this.events.change.dispatch(this);
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
     * Styled Text Area.
     */
    StyledTextArea = function StyledTextArea(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': ''
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['blur', 'change', 'focus']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = "styled_text_area";
        if (options['class'] !== "") {
            this.wrapperElement.className += " " + options['class'];
        }

        this.inputElement = document.createElement("textarea");

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.setValue(options.initialValue);

        var div = document.createElement("div");
        div.appendChild(this.inputElement);
        this.wrapperElement.appendChild(div);

        /* Internal events */
        this._oninput = oninput.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        EzWebExt.addEventListener(this.inputElement, 'mousedown', EzWebExt.stopPropagationListener, true);
        EzWebExt.addEventListener(this.inputElement, 'click', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
    };
    StyledTextArea.prototype = new StyledElements.StyledInputElement();

    StyledTextArea.prototype.destroy = function destroy() {

        EzWebExt.removeEventListener(this.inputElement, 'mousedown', EzWebExt.stopPropagationListener, true);
        EzWebExt.removeEventListener(this.inputElement, 'click', EzWebExt.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledTextArea = StyledTextArea;

})();
