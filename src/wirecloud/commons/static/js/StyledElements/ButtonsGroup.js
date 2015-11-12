/*global StyledElements*/

(function () {

    "use strict";

    /**
     * Virtual input field grouping a set of radio buttons or checkboses
     */
    var ButtonsGroup = function ButtonsGroup(name) {
        StyledElements.InputElement.call(this, "", ['change']);

        Object.defineProperty(this, 'name', {value: name});
        this.buttons = [];
    };
    ButtonsGroup.prototype = new StyledElements.InputElement();

    /**
     * @private
     */
    ButtonsGroup.prototype.insertButton = function insertButton(button) {
        this.buttons[this.buttons.length] = button;
        button.addEventListener('change',
                                function () {
                                    this.events.change.dispatch(this);
                                }.bind(this));

        return this;
    };

    ButtonsGroup.prototype.getValue = function getValue() {
        var i, result = [];

        if (this.buttons[0] instanceof StyledElements.CheckBox) {

            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].inputElement.checked) {
                    result.push(this.buttons[i].getValue());
                }
            }

        } else {

            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].inputElement.checked) {
                    return this.buttons[i].getValue();
                }
            }
        }

        return result;
    };

    ButtonsGroup.prototype.setValue = function setValue(newValue) {
        if (newValue == null) {
            newValue = [];
        } else if (typeof newValue === 'string') {
            newValue = [newValue];
        }

        for (var i = 0; i < this.buttons.length; i++) {
            if (newValue.indexOf(this.buttons[i].inputElement.value) !== -1) {
                this.buttons[i].setValue(true);
            } else {
                this.buttons[i].setValue(false);
            }
        }

        return this;
    };

    ButtonsGroup.prototype.reset = function reset() {
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].reset();
        }

        return this;
    };

    /**
     * Devuelve una lista de los elementos CheckBox o RadioButton
     * seleccionados. En caso de que la selección este vacía, este método devolverá
     * una lista vacía y en caso de que este ButtonGroup este formado por
     * RadioButtons, la selección será como mucho de un elemento.
     */
    ButtonsGroup.prototype.getSelectedButtons = function getSelectedButtons() {
        var i;

        if (this.buttons.length === 0) {
            return [];
        }

        if (this.buttons[0] instanceof StyledElements.CheckBox) {
            var result = [];

            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].inputElement.checked) {
                    result[result.length] = this.buttons[i];
                }
            }

            return result;
        } else {
            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].inputElement.checked) {
                    return [this.buttons[i]];
                }
            }
            return [];
        }
    };

    StyledElements.ButtonsGroup = ButtonsGroup;

})();
