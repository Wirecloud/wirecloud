/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

    var platform, id, idx, tmp, i, current;

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

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    // Operator Module
    Object.defineProperty(window.MashupPlatform, 'operator', {value: {}});
    Object.defineProperty(window.MashupPlatform.operator, 'id', {value: id});
    Object.preventExtensions(window.MashupPlatform.operator);

    // Pref Module
    Object.defineProperty(window.MashupPlatform, 'prefs', {value: {}});
    Object.defineProperty(window.MashupPlatform.prefs, 'get', {
        value: function get(key) {
            return platform.opManager.activeWorkspace.wiring.getOperatorPrefValue(id, key);
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'registerCallback', {
        value: function registerCallback(callback) {
            platform.opManager.activeWorkspace.wiring.registerOperatorPrefCallback(id, callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'set', {
        value: function get(key, value) {
            platform.opManager.activeWorkspace.wiring.setOperatorPrefValue(id, key, value);
        }
    });
    Object.preventExtensions(window.MashupPlatform.prefs);

    // Wiring Module
    Object.defineProperty(window.MashupPlatform, 'wiring', {value: {}});
    Object.defineProperty(window.MashupPlatform.wiring, 'registerCallback', {
        value: function registerCallback(inputName, callback) {
            platform.opManager.activeWorkspace.wiring.registerOperatorCallback(id, inputName, callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'pushEvent', {
        value: function pushEvent(outputName, data, options) {
            platform.opManager.activeWorkspace.wiring.pushOperatorEvent(id, outputName, data, options);
        }
    });
    Object.preventExtensions(window.MashupPlatform.wiring);

})();
