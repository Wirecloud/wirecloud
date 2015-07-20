(function () {

    "use strict";

    /**
     *
     */
    var TextInputInterface = function TextInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.StyledTextField(options);
        this.inputElement.addEventListener('change', function () {
            if (this.timeout != null) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(this.validate.bind(this), 700);
        }.bind(this));
        this.inputElement.addEventListener('blur', this.validate.bind(this));
    };
    TextInputInterface.prototype = new StyledElements.InputInterface();

    TextInputInterface.parse = function parse(value) {
        return value;
    };

    TextInputInterface.stringify = function stringify(value) {
        return value;
    };

    TextInputInterface.prototype.assignDefaultButton = function assignDefaultButton(button) {
        this.inputElement.addEventListener('submit', function () {
            button.click();
        });
    };

    StyledElements.TextInputInterface = TextInputInterface;

})();
