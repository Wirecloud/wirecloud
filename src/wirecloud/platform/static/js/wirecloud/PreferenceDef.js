/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function () {

    "use strict";

    /**
     * @param {String} name
     * @param {Boolean} inheritable
     * @param {Boolean} inheritByDefault
     * @param {Boolean} hidden
     * @param {Object} options
     */
    var PreferenceDef = function PreferenceDef(name, inheritable, inheritByDefault, hidden, options) {
        Object.defineProperties(this, {
            name: {value: name},
            label: {value: options.label},
            description: {value: options.description},
            inheritable: {value: !!inheritable},
            inheritByDefault: {value: !!(inheritable && inheritByDefault)},
            default: {value: options.defaultValue},
            hidden: {value: !!hidden},
            options: {value: options}
        });

        Object.freeze(this);
    };

    Wirecloud.PreferenceDef = PreferenceDef;

})();


