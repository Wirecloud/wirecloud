/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     *
     */
    var TextInputInterface = function TextInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.TextField(options);
        this.inputElement.addEventListener('change', function () {
            if (this.timeout != null) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(this.validate.bind(this), 700);
        }.bind(this));
        this.inputElement.addEventListener('blur', this.validate.bind(this));
    };
    utils.inherit(TextInputInterface, StyledElements.InputInterface);

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

})(StyledElements.Utils);
