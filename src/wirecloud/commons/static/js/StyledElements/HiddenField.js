/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements */

(function () {

    "use strict";

    /**
     *
     */
    var HiddenField = function HiddenField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': ''
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, []);

        this.wrapperElement = document.createElement("div");

        this.wrapperElement.className = StyledElements.Utils.prependWord(options['class'], 'styled_hidden_field');

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "hidden");

        if (options.name != null) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        this.wrapperElement.appendChild(this.inputElement);
    };
    HiddenField.prototype = new StyledElements.StyledInputElement();

    StyledElements.HiddenField = HiddenField;

})();
