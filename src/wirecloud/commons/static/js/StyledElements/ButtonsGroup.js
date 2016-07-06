/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals StyledElements */


(function (utils) {

    "use strict";

    /**
     * Virtual input field grouping a set of radio buttons or checkboses
     */
    var ButtonsGroup = function ButtonsGroup(name) {
        StyledElements.InputElement.call(this, "", ['change']);

        Object.defineProperty(this, 'name', {value: name});
        this.buttons = [];
    };
    utils.inherit(ButtonsGroup, StyledElements.InputElement);

    /**
     * @private
     */
    ButtonsGroup.prototype.insertButton = function insertButton(button) {
        this.buttons[this.buttons.length] = button;
        button.addEventListener('change',
                                function () {
                                    this.dispatchEvent('change');
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

})(StyledElements.Utils);
