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

    const _OperatorAPI = function _OperatorAPI(parent) {
        const IOperatorVariable = function IOperatorVariable(variable) {
            this.set = function set(value) {
                variable.set(value);
            };

            this.get = function get() {
                return variable.get();
            };
            Object.freeze(this);
        };


        // Init resource entry (in this case an operator) so other API files can make
        // use of it
        const ioperator = parent.MashupPlatform.priv.workspaceview.model.findOperator(parent.MashupPlatform.priv.id);
        parent.MashupPlatform.priv.resource = ioperator;

        // Operator Module
        Object.defineProperty(parent.MashupPlatform, 'operator', {value: {}});
        Object.defineProperty(parent.MashupPlatform.operator, 'id', {value: parent.MashupPlatform.priv.id});
        Object.defineProperty(parent.MashupPlatform.operator, 'log', {
            value: function log(msg, level) {
                ioperator.logManager.log(msg, level);
            }
        });

        Object.defineProperty(parent.MashupPlatform.operator, 'getVariable', {
            value: function getVariable(name) {
                const variable = ioperator.properties[name];
                if (variable != null) {
                    return new IOperatorVariable(variable);
                }
            }
        });

        // Inputs
        const inputs = {};
        for (const endpoint_name in ioperator.inputs) {
            inputs[endpoint_name] = new parent.MashupPlatform.priv.InputEndpoint(ioperator.inputs[endpoint_name], true);
        }
        Object.defineProperty(parent.MashupPlatform.operator, 'inputs', {value: inputs});

        // Outputs
        const outputs = {};
        for (const endpoint_name in ioperator.outputs) {
            outputs[endpoint_name] = new parent.MashupPlatform.priv.OutputEndpoint(ioperator.outputs[endpoint_name], true);
        }
        Object.defineProperty(parent.MashupPlatform.operator, 'outputs', {value: outputs});
    };

    window._privs._OperatorAPI = _OperatorAPI;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window. _privs._OperatorAPI(window);
    }

})();
