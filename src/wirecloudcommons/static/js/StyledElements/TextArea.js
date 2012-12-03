/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     * Styled Text Area.
     */
    var StyledTextArea = function StyledTextArea(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': ''
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

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
        EzWebExt.addEventListener(this.inputElement, 'mousedown', EzWebExt.stopPropagationListener, true);
        EzWebExt.addEventListener(this.inputElement, 'click', EzWebExt.stopPropagationListener, true);
    };
    StyledTextArea.prototype = new StyledElements.StyledInputElement();

    StyledElements.StyledTextArea = StyledTextArea;

})();
