/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var platform = window.parent;
    var resource = MashupPlatform.resource;

    // Platform context module
    Object.defineProperty(window.MashupPlatform, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return platform.Wirecloud.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'get', {
        value: function get(name) {
            return platform.Wirecloud.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.context, 'registerCallback', {
        value: function registerCallback(callback) {
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
            return platform.Wirecloud.activeWorkspace.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'get', {
        value: function get(name) {
            return platform.Wirecloud.activeWorkspace.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.mashup.context, 'registerCallback', {
        value: function registerCallback(callback) {
            resource.registerContextAPICallback('mashup', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.mashup.context);

    Object.preventExtensions(window.MashupPlatform.mashup);

    // Prefs Module
    Object.defineProperty(window.MashupPlatform, 'prefs', {value: {}});
    Object.defineProperty(window.MashupPlatform.prefs, 'get', {
        value: function get(key) {
            if (key in resource.meta.preferences) {
                return resource.preferences[key].value;
            } else {
                var exception_msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                var log_msg = platform.interpolate('Error calling MashupPlatform.prefs.get: %(msg)s', {msg: exception_msg}, true);
                resource.logManager.log(log_msg);
                throw new MashupPlatform.prefs.PreferenceError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'registerCallback', {
        value: function registerCallback(callback) {
            resource.registerPrefCallback(callback);
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'set', {
        value: function set(key, value) {
            if (key in resource.meta.preferences) {
                resource.preferences[key].value = value;
            } else {
                var exception_msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                var log_msg = platform.interpolate('Error calling MashupPlatform.prefs.set: %(msg)s', {msg: exception_msg}, true);
                resource.logManager.log(log_msg);
                throw new MashupPlatform.prefs.PreferenceError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.prefs, 'PreferenceError', {
        value: platform.Wirecloud.PreferenceError
    });
    Object.preventExtensions(window.MashupPlatform.prefs);

    // Wiring Module
    Object.defineProperty(window.MashupPlatform, 'wiring', {value: {}});
    Object.defineProperty(window.MashupPlatform.wiring, 'registerCallback', {
        value: function registerCallback(inputName, callback) {
            if (inputName in resource.inputs) {
                resource.inputs[inputName].callback = callback;
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid input endpoint', {endpoint: inputName}, true);
                var log_msg = platform.interpolate('Error calling MashupPlatform.wiring.registerCallback: %(msg)s', {msg: exception_msg}, true);
                resource.logManager.log(log_msg);
                throw new MashupPlatform.wiring.EndpointError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'pushEvent', {
        value: function pushEvent(outputName, data, options) {
            if (outputName in resource.outputs) {
                resource.outputs[outputName].propagate(data, options);
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                var log_msg = platform.interpolate('Error calling MashupPlatform.wiring.pushEvent: %(msg)s', {msg: exception_msg}, true);
                resource.logManager.log(log_msg);
                throw new MashupPlatform.wiring.EndpointError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'getReachableEndpoints', {
        value: function getReachableEndpoints(outputName) {
            if (outputName in resource.outputs) {
                return resource.outputs[outputName].getFinalSlots();
            } else {
                var exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                var log_msg = platform.interpolate('Error calling MashupPlatform.wiring.getReachableEndpoints: %(msg)s', {msg: exception_msg}, true);
                resource.logManager.log(log_msg);
                throw new MashupPlatform.wiring.EndpointError(exception_msg);
            }
        }
    });
    Object.defineProperty(window.MashupPlatform.wiring, 'EndpointError', {
        value: platform.Wirecloud.wiring.EndpointError
    });
    Object.preventExtensions(window.MashupPlatform.wiring);

})();
