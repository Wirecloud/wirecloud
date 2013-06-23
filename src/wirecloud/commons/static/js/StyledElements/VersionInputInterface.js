/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global InputValidationError, StyledElements, TextInputInterface*/

(function () {

    "use strict";

    var VERSION_RE = /^([1-9]\d*|0)(?:\.([1-9]\d*|0))*$/;

    var VersionInputInterface = function VersionInputInterface(fieldId, options) {
        if (options == null) {
            options = {};
        }

        if (options.placeholder == null) {
            options.placeholder = '1.0';
        }

        TextInputInterface.call(this, fieldId, options);
    };
    VersionInputInterface.prototype = new TextInputInterface();

    VersionInputInterface.prototype._checkValue = function _checkValue(newValue) {
        if (newValue.match(VERSION_RE) != null) {
            return InputValidationError.NO_ERROR;
        } else {
            return InputValidationError.VERSION_ERROR;
        }
    };

    StyledElements.VersionInputInterface = VersionInputInterface;

})();
