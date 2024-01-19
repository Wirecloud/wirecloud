/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.
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

(function () {

    "use strict";

    const _APIClosure = function _APIClosure(parent) {
        // Remove reference to the private dict, removing also the reference to the
        // internal wirecloud resource
        delete parent.MashupPlatform.priv;

        Object.preventExtensions(parent.MashupPlatform.mashup);
        Object.preventExtensions(parent.MashupPlatform);

        if ('widget' in parent.MashupPlatform) {
            Object.preventExtensions(parent.MashupPlatform.widget);
        } else {
            Object.preventExtensions(parent.MashupPlatform.operator);
        }
    };

    window._privs._APIClosure = _APIClosure;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._APIClosure(window);

        // Remove references to the internal setup functions of the API
        delete window._privs;

        // Remove link to wirecloud
        window.parent = window;
    }

})();
