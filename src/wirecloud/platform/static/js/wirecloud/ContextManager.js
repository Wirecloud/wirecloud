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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var ContextManager = function ContextManager(contextInstance, context_description) {

        if (context_description == null || typeof context_description !== 'object') {
            throw new TypeError('invalid context_description parameter');
        }

        context_description = utils.clone(context_description, true);
        Object.defineProperty(this, 'instance', {value: contextInstance});

        var context = {};
        var handlers = [];

        for (var key in context_description) {
            if (context_description == null || typeof context_description[key] !== 'object') {
                delete context_description[key];
            }

            context_description[key].name = key;
            if ('value' in context_description[key]) {
                context[key] = context_description[key].value;
                delete context_description[key].value;
            } else {
                context[key] = null;
            }
            Object.freeze(context_description[key]);
        }
        Object.freeze(context_description);

        Object.defineProperty(this, 'getAvailableContext', {
            value: function getAvailableContext() {
                return context_description;
            }
        });

        Object.defineProperty(this, 'addCallback', {
            value: function addCallback(handler) {
                if (typeof handler !== 'function') {
                    throw new TypeError();
                }

                handlers.push(handler);
            }
        });

        Object.defineProperty(this, 'removeCallback', {
            value: function removeCallback(handler) {
                var index;

                if (typeof handler !== 'function') {
                    throw new TypeError();
                }

                index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        });

        Object.defineProperty(this, 'get', {
            value: function get(key) {
                return context[key];
            }
        });

        Object.defineProperty(this, 'modify', {
            value: function get(values) {
                var key, i, updated_values = {};

                if (typeof values !== 'object') {
                    throw new TypeError();
                }

                for (key in values) {
                    if (!context.hasOwnProperty(key)) {
                        throw new TypeError(key);
                    }
                }

                for (key in values) {
                    if (context[key] !== values[key]) {
                        context[key] = values[key];
                        updated_values[key] = values[key];
                    }
                }

                if (!utils.isEmpty(updated_values)) {
                    for (i = 0; i < handlers.length; i += 1) {
                        try {
                            handlers[i](updated_values);
                        } catch (e) {}
                    }
                }
            }
        });
    };

    Wirecloud.ContextManager = ContextManager;

})(Wirecloud.Utils);
