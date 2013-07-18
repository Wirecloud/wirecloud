/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global EzWebExt*/

(function () {

    "use strict";

    /**
     * @author aarranz
     */
    var UserPrefDef = function UserPrefDef(name, type, options) {
        if (type === 'list') {
            type = 'select';
        }

        // the value option is only used on the server side
        if ('value' in options) {
            delete options.value;
        }

        Object.defineProperty(this, 'name', {value: name});
        Object.defineProperty(this, 'type', {value: type});
        Object.defineProperty(this, 'label', {value: options.label});
        Object.defineProperty(this, 'description', {value: options.description});
        Object.defineProperty(this, 'options', {value: options});

        if (options.default_value == null) {
            Object.defineProperty(this, 'defaultValue', {value: ''});
        } else {
            Object.defineProperty(this, 'defaultValue', {value: options.default_value});
        }
    };

    Wirecloud.UserPrefDef = UserPrefDef;

})();
