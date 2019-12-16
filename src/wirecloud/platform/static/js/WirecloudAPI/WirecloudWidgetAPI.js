/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

    // Init resource entry (in this case a widget) so other API files can make
    // use of it
    const view = MashupPlatform.priv.workspaceview.findWidget(MashupPlatform.priv.id);
    const model = view.model;
    MashupPlatform.priv.view = view;
    MashupPlatform.priv.resource = model;

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
    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperties(window.MashupPlatform.widget, {
        id: {
            value: MashupPlatform.priv.id
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

    Object.defineProperty(window.MashupPlatform.widget.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return model.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'get', {
        value: function get(name) {
            return model.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'registerCallback', {
        value: function registerCallback(callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            model.registerContextAPICallback('iwidget', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.widget.context);

    // Inputs
    const inputs = {};
    for (let endpoint_name in model.inputs) {
        inputs[endpoint_name] = new MashupPlatform.priv.InputEndpoint(model.inputs[endpoint_name], true);
    }
    Object.defineProperty(window.MashupPlatform.widget, 'inputs', {value: inputs});

    // Outputs
    const outputs = {};
    for (let endpoint_name in model.outputs) {
        outputs[endpoint_name] = new MashupPlatform.priv.OutputEndpoint(model.outputs[endpoint_name], true);
    }
    Object.defineProperty(window.MashupPlatform.widget, 'outputs', {value: outputs});

})();
