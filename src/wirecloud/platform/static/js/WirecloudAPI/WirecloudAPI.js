/*
 *     (C) Copyright 2012-2013 Universidad Politécnica de Madrid
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

    // Platform context module
    Object.defineProperty(window.MashupPlatform, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.context, 'getAvailableContext', {
        value: function getAvailableContext(callback) {
            return platform.opManager.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'get', {
        value: function get(name) {
            return platform.opManager.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'registerCallback', {
        value: function registerCallback(callback) {
            platform.opManager.activeWorkspace.getIWidget(id).internal_iwidget.registerContextAPICallback('platform', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.context);

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    // Mashup module
    Object.defineProperty(window.MashupPlatform, 'mashup', {value: {}});
    Object.defineProperty(window.MashupPlatform.mashup, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.mashup.context, 'getAvailableContext', {
        value: function getAvailableContext(callback) {
            return platform.opManager.activeWorkspace.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'get', {
        value: function get(name) {
            return platform.opManager.activeWorkspace.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'registerCallback', {
        value: function registerCallback(callback) {
            platform.opManager.activeWorkspace.getIWidget(id).internal_iwidget.registerContextAPICallback('mashup', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.mashup.context);

    Object.preventExtensions(window.MashupPlatform.mashup);

    // Widget module
    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'id', {value: id});

    Object.defineProperty(window.MashupPlatform.widget, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return platform.opManager.activeWorkspace.getIWidget(id).internal_iwidget.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'get', {
        value: function get(name) {
            return platform.opManager.activeWorkspace.getIWidget(id).internal_iwidget.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'registerCallback', {
        value: function registerCallback(callback) {
            platform.opManager.activeWorkspace.getIWidget(id).internal_iwidget.registerContextAPICallback('iwidget', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.widget.context);

    Object.preventExtensions(window.MashupPlatform.widget);

    // Prefs Module
    Object.defineProperty(window.MashupPlatform, 'prefs', {value: {}});
    Object.defineProperty(window.MashupPlatform.prefs, 'get', {
        value: function get(key) {
            var variable = platform.opManager.activeWorkspace.varManager.getVariableByName(id, key);
            return variable.get();
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'registerCallback', {
        value: function registerCallback(callback) {
            platform.opManager.activeWorkspace.getIWidget(id).registerPrefCallback(callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'set', {
        value: function get(key, value) {
            var variable = platform.opManager.activeWorkspace.varManager.getVariableByName(id, key);
            variable.set(value, true);
        }
    });
    Object.preventExtensions(window.MashupPlatform.prefs);

    // Wiring Module
    Object.defineProperty(window.MashupPlatform, 'wiring', {value: {}});
    Object.defineProperty(window.MashupPlatform.wiring, 'registerCallback', {
        value: function registerCallback(inputName, callback) {
            platform.opManager.activeWorkspace.wiring.registerCallback(id, inputName, callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'pushEvent', {
        value: function pushEvent(outputName, data) {
            platform.opManager.activeWorkspace.wiring.pushEvent(id, outputName, data);
        }
    });
    Object.preventExtensions(window.MashupPlatform.wiring);

})();
