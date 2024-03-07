/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const _WidgetAPI = function _WidgetAPI(parent) {
        // Init resource entry (in this case a widget) so other API files can make
        // use of it
        const view = parent.MashupPlatform.priv.workspaceview.findWidget(parent.MashupPlatform.priv.id);
        const model = view.model;
        parent.MashupPlatform.priv.view = view;
        parent.MashupPlatform.priv.resource = model;

        class IWidgetVariable {

            constructor(variable) {
                this.set = function set(value) {
                    variable.set(value);
                };

                this.get = function get() {
                    return variable.get();
                };
                Object.freeze(this);
            }

        }

        // Widget module
        Object.defineProperty(parent.MashupPlatform, 'widget', {value: {}});
        Object.defineProperties(parent.MashupPlatform.widget, {
            id: {
                value: parent.MashupPlatform.priv.id
            },
            getVariable: {
                value: function getVariable(name) {
                    const variable = model.properties[name];
                    if (variable != null) {
                        return new IWidgetVariable(variable);
                    }
                }
            },
            drawAttention: {
                value: function drawAttention() {
                    view.tab.workspace.drawAttention(model.id);
                }
            },
            close: {
                value: function close() {
                    if (!model.volatile) {
                        throw new TypeError('Only volatile widgets can be closed');
                    }
                    model.remove();
                }
            },
            context: {
                value: {}
            },
            log: {
                value: function log(msg, level) {
                    model.logManager.log(msg, level);
                }
            }
        });

        Object.defineProperty(parent.MashupPlatform.widget.context, 'getAvailableContext', {
            value: function getAvailableContext() {
                return model.contextManager.getAvailableContext();
            }
        });
        Object.defineProperty(parent.MashupPlatform.widget.context, 'get', {
            value: function get(name) {
                return model.contextManager.get(name);
            }
        });
        Object.defineProperty(parent.MashupPlatform.widget.context, 'registerCallback', {
            value: function registerCallback(callback) {
                if (typeof callback !== "function") {
                    throw new TypeError('callback must be a function');
                }

                model.registerContextAPICallback('iwidget', callback);
            }
        });
        Object.preventExtensions(parent.MashupPlatform.widget.context);

        // Inputs
        const inputs = {};
        for (const endpoint_name in model.inputs) {
            inputs[endpoint_name] = new parent.MashupPlatform.priv.InputEndpoint(model.inputs[endpoint_name], true);
        }
        Object.defineProperty(parent.MashupPlatform.widget, 'inputs', {value: inputs});

        // Outputs
        const outputs = {};
        for (const endpoint_name in model.outputs) {
            outputs[endpoint_name] = new parent.MashupPlatform.priv.OutputEndpoint(model.outputs[endpoint_name], true);
        }
        Object.defineProperty(parent.MashupPlatform.widget, 'outputs', {value: outputs});
    };

    window._privs._WidgetAPI = _WidgetAPI;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._WidgetAPI(window);
    }
})();
