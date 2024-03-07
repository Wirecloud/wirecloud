/*
 *     Copyright (c) 2013-2023 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const _APICommon = function _APICommon(parent, platform, DOMElement, baseURL) {
        const Wirecloud = platform.Wirecloud;
        const workspaceview = parent.MashupPlatform.priv.workspaceview;
        const component = parent.MashupPlatform.priv.resource;
        const componentType = component instanceof Wirecloud.Widget ? "widget" : "operator";
        const guibuilder = new platform.StyledElements.GUIBuilder();

        // HTTP module
        Object.defineProperty(parent.MashupPlatform, 'http', {value: {}});
        Object.defineProperty(parent.MashupPlatform.http, 'buildProxyURL', {value: Wirecloud.io.buildProxyURL});
        Object.defineProperty(parent.MashupPlatform.http, 'makeRequest', {
            value: function makeRequest(url, options) {
                url = new platform.URL(url, window.location);
                if (!options.requestHeaders) {
                    options.requestHeaders = {};
                }
                options.requestHeaders["wirecloud-component-type"] = componentType;
                options.requestHeaders["wirecloud-component-id"] = component.id;
                return Wirecloud.io.makeRequest(url, options);
            }
        });
        Object.preventExtensions(parent.MashupPlatform.http);

        // Platform context module
        Object.defineProperty(parent.MashupPlatform, 'context', {value: {}});
        Object.defineProperty(parent.MashupPlatform.context, 'getAvailableContext', {
            value: function getAvailableContext() {
                return Wirecloud.contextManager.getAvailableContext();
            }
        });
        Object.defineProperty(parent.MashupPlatform.context, 'get', {
            value: function get(name) {
                return Wirecloud.contextManager.get(name);
            }
        });
        Object.defineProperty(parent.MashupPlatform.context, 'registerCallback', {
            value: function registerCallback(callback) {
                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                component.registerContextAPICallback('platform', callback);
            }
        });
        Object.preventExtensions(parent.MashupPlatform.context);

        // log module
        Object.defineProperty(parent.MashupPlatform, 'log', {value: {
            ERROR: 1,
            WARN: 2,
            INFO: 3
        }});
        Object.freeze(parent.MashupPlatform.log);

        // Mashup module
        Object.defineProperty(parent.MashupPlatform, 'mashup', {value: {}});
        Object.defineProperty(parent.MashupPlatform.mashup, 'context', {value: {}});
        Object.defineProperty(parent.MashupPlatform.mashup.context, 'getAvailableContext', {
            value: function getAvailableContext() {
                return workspaceview.model.contextManager.getAvailableContext();
            }
        });
        Object.defineProperty(parent.MashupPlatform.mashup.context, 'get', {
            value: function get(name) {
                return workspaceview.model.contextManager.get(name);
            }
        });
        Object.defineProperty(parent.MashupPlatform.mashup.context, 'registerCallback', {
            value: function registerCallback(callback) {
                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                component.registerContextAPICallback('mashup', callback);
            }
        });
        Object.preventExtensions(parent.MashupPlatform.mashup.context);


        // Prefs Module
        Object.defineProperty(parent.MashupPlatform, 'prefs', {value: {}});
        Object.defineProperty(parent.MashupPlatform.prefs, 'get', {
            value: function get(key) {
                if (key in component.meta.preferences) {
                    return component.preferences[key].value;
                } else {
                    const exception_msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                    throw new parent.MashupPlatform.prefs.PreferenceDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.prefs, 'registerCallback', {
            value: function registerCallback(callback) {
                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                component.registerPrefCallback(callback);
            }
        });
        Object.defineProperty(parent.MashupPlatform.prefs, 'set', {
            value: function set(key, value) {
                const newValues = typeof key === "string" ? {[key]: value} : arguments[0];
                if (newValues == null || typeof newValues !== "object") {
                    throw new TypeError();
                }

                Object.keys(newValues).forEach((key) => {
                    if (!(key in component.meta.preferences)) {
                        const msg = platform.interpolate('"%(pref)s" is not a valid preference name', {pref: key}, true);
                        throw new parent.MashupPlatform.prefs.PreferenceDoesNotExistError(msg);
                    }
                });

                component.setPreferences(newValues);
            }
        });
        Object.defineProperty(parent.MashupPlatform.prefs, 'PreferenceDoesNotExistError', {value: Wirecloud.PreferenceDoesNotExistError});
        Object.preventExtensions(parent.MashupPlatform.prefs);


        // Wiring Module
        Object.defineProperty(parent.MashupPlatform, 'wiring', {value: {}});
        Object.defineProperty(parent.MashupPlatform.wiring, 'registerCallback', {
            value: function registerCallback(inputName, callback) {
                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                if (inputName in component.inputs) {
                    component.inputs[inputName].callback = callback;
                } else {
                    const exception_msg = platform.interpolate('"%(endpoint)s" is not a valid input endpoint', {endpoint: inputName}, true);
                    throw new parent.MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'registerStatusCallback', {
            value: function registerCallback(callback) {
                let wiring;

                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                if ('wiring' in component) {
                    wiring = component.wiring;
                } else {
                    wiring = component.tab.workspace.wiring;
                }
                wiring.addEventListener('load', callback);
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'pushEvent', {
            value: function pushEvent(outputName, data, options) {
                if (outputName in component.outputs) {
                    component.outputs[outputName].propagate(data, options);
                } else {
                    const exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                    throw new parent.MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'hasInputConnections', {
            value: function hasInputConnections(inputName) {
                if (inputName in component.inputs) {
                    return component.inputs[inputName].inputs.length > 0;
                } else {
                    const exception_msg = platform.interpolate('"%(endpoint)s" is not a valid input endpoint', {endpoint: inputName}, true);
                    throw new parent.MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'hasOutputConnections', {
            value: function hasOutputConnections(outputName) {
                if (outputName in component.outputs) {
                    return component.outputs[outputName].outputList.length > 0;
                } else {
                    const exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                    throw new parent.MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'getReachableEndpoints', {
            value: function getReachableEndpoints(outputName) {
                if (outputName in component.outputs) {
                    return component.outputs[outputName].getReachableEndpoints();
                } else {
                    const exception_msg = platform.interpolate('"%(endpoint)s" is not a valid output endpoint', {endpoint: outputName}, true);
                    throw new parent.MashupPlatform.wiring.EndpointDoesNotExistError(exception_msg);
                }
            }
        });
        Object.defineProperty(parent.MashupPlatform.wiring, 'EndpointDoesNotExistError', {value: Wirecloud.wiring.EndpointDoesNotExistError});
        Object.defineProperty(parent.MashupPlatform.wiring, 'EndpointTypeError', {value: Wirecloud.wiring.EndpointTypeError});
        Object.defineProperty(parent.MashupPlatform.wiring, 'EndpointValueError', {value: Wirecloud.wiring.EndpointValueError});
        Object.preventExtensions(parent.MashupPlatform.wiring);


        // General error handler
        if (DOMElement) {
            DOMElement.addEventListener('error', function (event) {
                event.stopPropagation();

                let details;

                if (event.error) {
                    details = platform.gettext("<ul><li><b>File:</b> <t:file/></li><li><b>Line: </b><t:line/></li></ul><p>See the <a href=\"http://webmasters.stackexchange.com/questions/8525/how-to-open-the-javascript-console-in-different-browsers\" target=\"_blank\">browser console</a> for more details</p>");
                    details = guibuilder.parse(guibuilder.DEFAULT_OPENING + details + guibuilder.DEFAULT_CLOSING, {file: event.filename.replace(component.meta.base_url, ''), line: event.lineno});
                    component.logManager.log(event.message, {details: details, console: false});
                }
            });
        }

        // Location
        Object.defineProperty(parent.MashupPlatform, 'location', {value: baseURL});
    };

    window._privs._APICommon = _APICommon;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        // We keep just the first 8 parts of the URL, which is the base URL of the operator / widget
        window._privs._APICommon(window, window.parent, window, window.location.href.split("/").slice(0, 8).join("/"));
    }

})();
