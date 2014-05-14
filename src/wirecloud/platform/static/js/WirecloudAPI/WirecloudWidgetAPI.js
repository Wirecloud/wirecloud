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

    var platform, id, idx, tmp, i, iwidget, current, IWidgetVariable;

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

    iwidget = platform.Wirecloud.activeWorkspace.getIWidget(id).internal_iwidget;

    IWidgetVariable = function IWidgetVariable(variable) {
        this.set = function set(value) {
            variable.set(value);
        };

        this.get = function get() {
            return variable.get();
        };
        Object.freeze(this);
    };

    // API declaration
    Object.defineProperty(window, 'MashupPlatform', {value: {}});

    // Temporal reference to the resource (in this case a widget) so other API files can make use of it. This attribute is removed in WirecloudAPIClosure.js
    MashupPlatform.resource = iwidget;

    // HTTP module
    Object.defineProperty(window.MashupPlatform, 'http', {value: {}});
    Object.defineProperty(window.MashupPlatform.http, 'buildProxyURL', {value: platform.Wirecloud.io.buildProxyURL});
    Object.defineProperty(window.MashupPlatform.http, 'makeRequest', {value: platform.Wirecloud.io.makeRequest});
    Object.preventExtensions(window.MashupPlatform.http);

    // Widget module
    Object.defineProperty(window.MashupPlatform, 'widget', {value: {}});
    Object.defineProperty(window.MashupPlatform.widget, 'id', {value: id});
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
            iwidget.registerContextAPICallback('iwidget', callback);
        }
    });
    Object.preventExtensions(window.MashupPlatform.widget.context);

    Object.preventExtensions(window.MashupPlatform.widget);

})();
