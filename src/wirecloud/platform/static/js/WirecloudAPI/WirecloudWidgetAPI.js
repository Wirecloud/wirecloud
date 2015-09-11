/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var platform, iwidget, IWidgetVariable, endpoint_name, inputs, outputs;

    platform = window.parent;

    // Init resource entry (in this case a widget) so other API files can make
    // use of it
    iwidget = platform.Wirecloud.activeWorkspace.getIWidget(MashupPlatform.priv.id).internal_iwidget;
    MashupPlatform.priv.resource = iwidget;

    IWidgetVariable = function IWidgetVariable(variable) {
        this.set = function set(value) {
            variable.set(value);
        };

        this.get = function get() {
            return variable.get();
        };
        Object.freeze(this);
    };

    // Widget module
    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'id', {value: MashupPlatform.priv.id});
    Object.defineProperty(window.MashupPlatform.widget, 'getVariable', {
        value: function getVariable(name) {
            var variable = iwidget.properties[name];
            if (variable != null) {
                return new IWidgetVariable(variable);
            }
        }
    });

    Object.defineProperty(window.MashupPlatform.widget, 'drawAttention', {
        value: function drawAttention() {
            iwidget.workspace.drawAttention(iwidget.id);
        }
    });

    Object.defineProperty(window.MashupPlatform.widget, 'context', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'log', {
        value: function log(msg, level) {
            iwidget.logManager.log(msg, level);
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'getAvailableContext', {
        value: function getAvailableContext() {
            return iwidget.contextManager.getAvailableContext();
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'get', {
        value: function get(name) {
            return iwidget.contextManager.get(name);
        }
    });
    Object.defineProperty(window.MashupPlatform.widget.context, 'registerCallback', {
        value: function registerCallback(callback) {
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }

            iwidget.registerContextAPICallback('iwidget', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.widget.context);

    // Inputs
    inputs = {};
    for (endpoint_name in iwidget.inputs) {
        inputs[endpoint_name] = new MashupPlatform.priv.InputEndpoint(iwidget.inputs[endpoint_name], true);
    }
    Object.defineProperty(window.MashupPlatform.widget, 'inputs', {value: inputs});

    // Outputs
    outputs = {};
    for (endpoint_name in iwidget.outputs) {
        outputs[endpoint_name] = new MashupPlatform.priv.OutputEndpoint(iwidget.outputs[endpoint_name], true);
    }
    Object.defineProperty(window.MashupPlatform.widget, 'outputs', {value: outputs});

})();
