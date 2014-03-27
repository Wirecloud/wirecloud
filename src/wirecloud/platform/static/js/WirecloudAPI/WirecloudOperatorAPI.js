/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global MashupPlatform*/

(function () {

    "use strict";

    var platform, id, idx, tmp, i, current, ioperator;

    platform = window.parent;

    // Get id from the URL
    idx = document.URL.lastIndexOf('#');
    tmp = document.URL.substr(idx + 1);
    tmp = tmp.split("&");
    for (i = 0; i < tmp.length; i++) {
        current = tmp[i];
        current = current.split("=", 2);
        if (current[0] === "id") {
            id = parseInt(current[1], 10);
            break;
        }
    }

    // API declaration
    Object.defineProperty(window, 'MashupPlatform', {value: {}});

    // Temporal reference to the resource (in this case a widget) so other API files can make use of it. This attribute is removed in WirecloudAPIClosure.js
    ioperator = platform.Wirecloud.activeWorkspace.wiring.ioperators[id];
    MashupPlatform.resource = ioperator;

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    // Operator Module
    Object.defineProperty(window.MashupPlatform, 'operator', {value: {}});
    Object.defineProperty(window.MashupPlatform.operator, 'id', {value: id});
    Object.defineProperty(window.MashupPlatform.operator, 'log', {
        value: function log(msg, level) {
            ioperator.logManager.log(msg, level);
        }
    });
    Object.preventExtensions(window.MashupPlatform.operator);

})();
