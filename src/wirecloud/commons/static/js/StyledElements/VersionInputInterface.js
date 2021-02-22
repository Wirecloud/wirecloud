/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    const VERSION_RE = /^([1-9]\d*|0)(?:\.([1-9]\d*|0))*$/;

    se.VersionInputInterface = class VersionInputInterface extends se.TextInputInterface {

        constructor(fieldId, options) {
            if (options == null) {
                options = {};
            }

            if (options.placeholder == null) {
                options.placeholder = '1.0';
            }

            super(fieldId, options);
        }

        _checkValue(newValue) {
            return se.InputValidationError[newValue.match(VERSION_RE) != null ? "NO_ERROR" : "VERSION_ERROR"];
        }

    }

})(StyledElements, StyledElements.Utils);
