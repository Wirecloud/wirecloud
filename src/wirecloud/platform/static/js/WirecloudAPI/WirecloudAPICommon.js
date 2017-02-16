/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals MashupPlatform */


(function () {

    "use strict";

    var platform = window.parent;
    var Wirecloud = platform.Wirecloud;
    var workspaceview = MashupPlatform.priv.workspaceview;
    var resource = MashupPlatform.priv.resource;
    var componentType = resource instanceof Wirecloud.Widget ? "widget" : "operator";
    var guibuilder = new platform.StyledElements.GUIBuilder();

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {
        value: function makeRequest(url, options) {
            url = new platform.URL(url, window.location);
            if (!options.requestHeaders) {
                options.requestHeaders = {};
            }
            options.requestHeaders["wirecloud-component-type"] = componentType;
            options.requestHeaders["wirecloud-component-id"] = resource.id;
            return Wirecloud.io.makeRequest(url, options);
        }
    });
    Object.preventExtensions(window.MashupPlatform.http);

    // Platform context module
    Object.defineProperty(window.MashupPlatform, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return Wirecloud.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'get', {
        value: function get(name) {
            return Wirecloud.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'registerCallback', {
        value: function registerCallback(callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            resource.registerContextAPICallback('platform', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.context);

    // log module
    Object.defineProperty(window.MashupPlatform, 'log', {value: {
        ERROR: 1,
        WARN: 2,
        INFO: 3
    }});
    Object.freeze(window.MashupPlatform.log);

    // Mashup module
    Object.defineProperty(window.MashupPlatform, 'mashup', {value: {}});
    Object.defineProperty(window.MashupPlatform.mashup, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.mashup.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return workspaceview.model.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'get', {
        value: function get(name) {
            return workspaceview.model.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'registerCallback', {
        value: function registerCallback(callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            resource.registerContextAPICallback('mashup', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.mashup.context);


    // Prefs Module
    Object.defineProperty(window.MashupPlatform, 'prefs', {value: {}});
    Object.defineProperty(window.MashupPlatform.prefs, 'get', {
        value: function get(key) {
            if (key in resource.meta.preferences) {
                return resource.preferences[key].value;
            } else {
                var exception_msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                throw new MashupPlatform.prefs.PreferenceDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'registerCallback', {
        value: function registerCallback(callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            resource.registerPrefCallback(callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'set', {
        value: function set(key, value) {
            if (key in resource.meta.preferences) {
                resource.preferences[key].value = value;
            } else {
                var exception_msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                throw new MashupPlatform.prefs.PreferenceDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'PreferenceDoesNotExistError', {value: Wirecloud.PreferenceDoesNotExistError});
    Object.preventExtensions(window.MashupPlatform.prefs);


    // Wiring Module
    Object.defineProperty(window.MashupPlatform, 'wiring', {value: {}});
    Object.defineProperty(window.MashupPlatform.wiring, 'registerCallback', {
        value: function registerCallback(inputName, callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            if (inputName in resource.inputs) {
                resource.inputs[inputName].callback = callback;
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid input endpoint', {endpoint: inputName}, true);
                throw new MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'registerStatusCallback', {
        value: function registerCallback(callback) {
            var wiring;

            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            if ('wiring' in resource) {
                wiring = resource.wiring;
            } else {
                wiring = resource.tab.workspace.wiring;
            }
            wiring.addEventListener('load', callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'pushEvent', {
        value: function pushEvent(outputName, data, options) {
            if (outputName in resource.outputs) {
                resource.outputs[outputName].propagate(data, options);
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                throw new MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'hasInputConnections', {
        value: function hasInputConnections(inputName) {
            if (inputName in resource.inputs) {
                return resource.inputs[inputName].inputs.length > 0;
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid input endpoint', {endpoint: inputName}, true);
                throw new MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'hasOutputConnections', {
        value: function hasOutputConnections(outputName) {
            if (outputName in resource.outputs) {
                return resource.outputs[outputName].outputList.length > 0;
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                throw new MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'getReachableEndpoints', {
        value: function getReachableEndpoints(outputName) {
            if (outputName in resource.outputs) {
                return resource.outputs[outputName].getReachableEndpoints();
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                throw new MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'EndpointDoesNotExistError', {value: Wirecloud.wiring.EndpointDoesNotExistError});
    Object.defineProperty(window.MashupPlatform.wiring, 'EndpointTypeError', {value: Wirecloud.wiring.EndpointTypeError});
    Object.defineProperty(window.MashupPlatform.wiring, 'EndpointValueError', {value: Wirecloud.wiring.EndpointValueError});
    Object.preventExtensions(window.MashupPlatform.wiring);


    // General error handler
    window.onerror = function (message, url, line, column, error) {
        var details;

        if (error) {
            details = platform.gettext("<ul><li><b>File:</b> <t:file/></li><li><b>Line: </b><t:line/></li></ul><p>See the <a href=\"http://webmasters.stackexchange.com/questions/8525/how-to-open-the-javascript-console-in-different-browsers\" target=\"_blank\">browser console</a> for more details</p>");
            details = guibuilder.parse(guibuilder.DEFAULT_OPENING + details + guibuilder.DEFAULT_CLOSING, {file: url.replace(resource.meta.base_url, ''), line: line});
            resource.logManager.log(message, {details: details, console: false});
        }
    };
})();
