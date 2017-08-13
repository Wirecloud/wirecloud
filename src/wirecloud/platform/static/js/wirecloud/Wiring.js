/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // TODO: move to another file
    /**
     * @namespace Wirecloud.wiring
     */
    ns.wiring = {};

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * @name Wirecloud.Wiring
     *
     * @extends {StyledElements.ObjectWithEvents}
     * @constructor
     *
     * @param {Wirecloud.Workspace} workspace
     * @param {Object} data
     * @param {Array.<Object>} data.connections
     * @param {Object} data.operators
     */
    ns.Wiring = function Wiring(workspace, data) {
        se.ObjectWithEvents.call(this, [
            'createoperator',
            'load',
            'removeoperator'
        ]);

        privates.set(this, {
            fixederrors: 0,
            freezedOperatorsById: null,
            operatorId: 1,
            operators: [],
            operatorsById: {},
            connections: [],
            on_changecomponent: on_changecomponent.bind(this),
            on_createwidget: on_createwidget.bind(this),
            on_removeconnection: on_removeconnection.bind(this),
            on_removeoperator: on_removeoperator.bind(this),
            on_removewidget: on_removewidget.bind(this)
        });

        Object.defineProperties(this, /** @lends Wirecloud.Wiring# */{
            /**
             * List of the connections handled by the current wiring
             * configuration.
             *
             * @type {Array.<Wirecloud.Wiring.Connection>}
             */
            connections: {
                get: on_connections_get
            },
            errorCount: {
                get: on_error_count_get
            },
            /**
             * @type {Wirecloud.LogManager}
             */
            logManager: {
                value: new Wirecloud.LogManager(Wirecloud.GlobalLogManager)
            },
            /**
             * List of the operators handled by the current wiring
             * configuration.
             *
             * @type {Array.<Wirecloud.Wiring.Operator>}
             */
            operators: {
                get: on_operators_get
            },
            /**
             * Operators handled by the current wiring configuration indexed by
             * id.
             *
             * @type {Object.<String, Wirecloud.Wiring.Operator>}
             */
            operatorsById: {
                get: on_operators_by_id_get
            },
            status: {
                get: on_status_get
            },
            visualdescription: {
                get: on_visualdescription_get
            },
            /**
             * Workspace owning this wiring engine.
             *
             * @type {Wirecloud.Workspace}
             */
            workspace: {
                value: workspace
            }
        });

        this.workspace.widgets.forEach(function (widget) {
            on_createwidget.call(this, this.workspace, widget);
        }, this);
        this.workspace.addEventListener('createwidget', privates.get(this).on_createwidget);

        this.load(unmarshall.call(this, utils.clone(data)));
    };

    ns.Wiring.normalize = function normalize(status) {
        var new_status = utils.update({
            version: '2.0',
            connections: [],
            operators: {},
            visualdescription: {
                behaviours: [],
                components: {
                    operator: {},
                    widget: {}
                },
                connections: []
            }
        }, status);

        normalize_object(new_status.visualdescription.components.operator, normalize_visual_component);
        normalize_object(new_status.visualdescription.components.widget, normalize_visual_component);

        return new_status;
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.Wiring, se.ObjectWithEvents, /** @lends Wirecloud.Wiring.prototype */{

        _notifyOperatorInstall: function _notifyOperatorInstall(resource) {
            privates.get(this).operators.forEach(function (operator) {
                if (operator.missing && operator.meta.uri === resource.uri) {
                    operator.upgrade(resource);
                }
            });
        },

        /**
         * @param {Wirecloud.Wiring.SourceEndpoint} source
         * @param {Wirecloud.Wiring.TargetEndpoint} target
         * @param {Object} [options]
         * @param {Boolean} [options.readonly]
         *
         * @returns {Wirecloud.Wiring.Connection}
         */
        createConnection: function createConnection(source, target, options) {
            options = utils.merge({
                commit: false
            }, options);

            var connection = new Wirecloud.wiring.Connection(this, source, target, options);

            if (options.commit) {
                connection.addEventListener('remove', privates.get(this).on_removeconnection);
                connection.establish();
                privates.get(this).connections.push(connection);
            }

            return connection;
        },

        /**
         * Adds a new operator instance into the wiring status on the WireCloud
         * server.
         *
         * @param {Wirecloud.OperatorMeta} meta
         *     Operator meta to instantiate
         * @param {Object} [data]
         *     Initial operator data
         *
         * @returns {Wirecloud.Task|Wirecloud.Operator}
         *     This method returns a task except when creating volatile
         *     operators. This method will return a {@link Wirecloud.Operator}
         *     when creating volatile operators.
         */
        createOperator: function createOperator(meta, data) {
            var priv = privates.get(this);

            data = utils.merge({
                id: (priv.operatorId).toString(),
                volatile: false
            }, data);

            var operator = create_operator.call(this, meta, data);

            if (data.volatile) {
                return append_operator.call(this, operator);
            }

            var requestContent = [{
                op: "add",
                path: "/operators/" + operator.id,
                value: operator
            }];
            return Wirecloud.io.makeRequest(Wirecloud.URLs.WIRING_ENTRY.evaluate({
                workspace_id: this.workspace.id,
            }), {
                method: 'PATCH',
                contentType: 'application/json-patch+json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify(requestContent)
            }).then((response) => {
                if ([204, 401, 403, 404, 500].indexOf(response.status) === -1) {
                    return Promise.reject(utils.gettext("Unexpected response from server"));
                } else if ([401, 403, 404, 500].indexOf(response.status) !== -1) {
                    return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
                }

                append_operator.call(this, operator);
                return Promise.resolve(operator);
            });
        },

        /**
         * Looks up for an operator with the given id inside the list of operators handled by this wiring engine instance.
         *
         * @param {String} id
         *
         * @returns {Wirecloud.wiring.Operator}
         */
        findOperator: function findOperator(id) {
            if (id == null) {
                throw new TypeError("Missing id parameter");
            }

            // Force string ids
            id = String(id);

            return this.operatorsById[id] || null;
        },

        load: function load(status) {
            var connection, i, id, operator, priv;

            status = ns.Wiring.normalize(status);

            priv = privates.get(this);

            priv.connections.forEach(function (connection) {
                if (!connection.volatile) {
                    connection.detach();
                }
            });

            for (i = priv.operators.length - 1; i >= 0; i--) {
                operator = priv.operators[i];
                if (!operator.volatile && !(operator.id in status.operators)) {
                    operator.remove();
                    // Force on_removeoperator call
                    // does nothing if previously called using events
                    on_removeoperator.call(this, operator);
                }
            }

            for (i = priv.connections.length - 1; i >= 0; i--) {
                connection = priv.connections[i];

                if (!connection.volatile) {
                    connection.removeEventListener('remove', priv.on_removeconnection);
                    priv.connections.splice(i, 1);
                }
            }

            this.logManager.newCycle();
            priv.fixederrors = 0;

            for (id in status.operators) {
                operator = status.operators[id];

                if (priv.operatorsById[id] == null) {
                    append_operator.call(this, operator);
                } else if (operator.missing) {
                    this.logManager.log(utils.gettext("Failed to load operator."));
                }
            }
            this.workspace.widgets.forEach(function (widget) {
                if (widget.loaded && widget.missing) {
                    this.logManager.log(utils.gettext("Failed to load widget."));
                }
            }, this);

            // Init operatorId counter
            priv.operatorId = 1;
            priv.operators.forEach(function (operator) {
                if (Number(operator.id) >= priv.operatorId) {
                    priv.operatorId = Number(operator.id) + 1;
                }
            }, this);

            status.connections.forEach(function (connection) {
                connection.addEventListener('remove', priv.on_removeconnection);
                priv.connections.push(connection);
            }, this);

            priv.connections.forEach(function (connection) {
                connection.establish();
            });

            priv.visualdescription = status.visualdescription;

            return this.dispatchEvent('load');
        },

        /**
         * Persists current wiring status into the WireCloud server.
         *
         * @returns {Promise}
         */
        save: function save() {
            var url = Wirecloud.URLs.WIRING_ENTRY.evaluate({
                workspace_id: this.workspace.id
            });

            return Wirecloud.io.makeRequest(url, {
                method: 'PUT',
                requestHeaders: {'Accept': 'application/json'},
                contentType: 'application/json',
                postBody: JSON.stringify(this)
            }).then(function (response) {
                if (response.status === 204) {
                    return Promise.resolve();
                } else {
                    // TODO
                    return Promise.reject(new Error("Unexpected error response"));
                }
            });
        },

        /**
         * Creates a representation of the status of this wiring engine to be
         * used for being stored in persistence. Volatile components,
         * connections, ... will be filtered.
         *
         * @returns {Object}
         */
        toJSON: function toJSON() {
            var operators = {}, id, priv;

            priv = privates.get(this);

            for (id in priv.operatorsById) {
                if (!priv.operatorsById[id].volatile) {
                    operators[id] = priv.operatorsById[id];
                }
            }

            return {
                version: '2.0',
                connections: priv.connections.filter(function (connection) {
                    return !connection.volatile;
                }),
                operators: operators,
                visualdescription: priv.visualdescription
            };
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var on_status_get = function on_status_get() {
        var priv = privates.get(this);
        return {
            version: '2.0',
            connections: priv.connections.slice(0),
            operators: this.operatorsById,
            visualdescription: this.visualdescription
        };
    };

    var on_visualdescription_get = function on_visualdescription_get() {
        return utils.clone(privates.get(this).visualdescription, true);
    };

    var unmarshall = function unmarshall(status) {
        var connection_info, i, id, operator_info, meta, source, target;

        status = ns.Wiring.normalize(status);

        // Convert operator into instances
        for (id in status.operators) {
            operator_info = status.operators[id];

            meta = this.workspace.resources.getOrCreateMissing(operator_info.name, 'operator');
            operator_info.id = id;
            status.operators[id] = new Wirecloud.wiring.Operator(this, meta, operator_info);
        }

        // Convert connections into instances
        for (i = status.connections.length - 1; i >= 0; i--) {
            connection_info = utils.merge({}, Wirecloud.wiring.Connection.JSON_TEMPLATE, status.connections[i]);

            source = getEndpoint.call(this, 'outputs', connection_info.source, status);
            target = getEndpoint.call(this, 'inputs', connection_info.target, status);

            if (source != null && target != null) {
                status.connections[i] = new Wirecloud.wiring.Connection(this, source, target, {
                    readonly: connection_info.readonly
                });
                status.connections[i] = status.connections[i];
            } else {
                status.connections.splice(i, 1);
            }
        }

        return status;
    };

    var normalize_visual_component = function normalize_visual_component(component) {
        return utils.updateObject({
            name: "",
            position: {
                x: 0,
                y: 0
            },
            collapsed: false,
            endpoints: {
                source: [],
                target: []
            }
        }, component);
    };

    var normalize_object = function normalize_object(object, normalizer) {
        for (var key in object) {
            object[key] = normalizer(object[key]);
        }
    };

    var addMissingEndpoint = function addMissingEndpoint(component, endpointGroup, name) {
        var endpoint;

        switch (endpointGroup) {
        case 'inputs':
            endpoint = new ns.wiring.GhostTargetEndpoint(component, name);
            component.inputs[name] = endpoint;
            break;
        case 'outputs':
            endpoint = new ns.wiring.GhostSourceEndpoint(component, name);
            component.outputs[name] = endpoint;
            break;
        }

        return endpoint;
    };

    var getEndpointOrCreateMissing = function getEndpointOrCreateMissing(component, type, name) {
        if (name in component[type]) {
            return component[type][name];
        } else {
            return addMissingEndpoint(component, type, name);
        }
    };

    var getEndpoint = function getEndpoint(endpointGroup, endpointInfo, status) {
        var component;

        switch (endpointInfo.type) {
        case 'widget':
            component = this.workspace.findWidget(endpointInfo.id);
            break;
        case 'operator':
            component = status.operators[endpointInfo.id];
            break;
        }

        if (component == null) {
            return null;
        }

        return getEndpointOrCreateMissing(component, endpointGroup, endpointInfo.endpoint);
    };

    var getEndpointInfo = function getEndpointInfo(endpointName) {
        var splitText = endpointName.split("/");

        return {type: splitText[0], id: splitText[1], endpoint: splitText[2]};
    };

    var connection_hasComponent = function connection_hasComponent(connectionInfo, component) {
        var source = getEndpointInfo(connectionInfo.sourcename),
            target = getEndpointInfo(connectionInfo.targetname);

        if (source.type === component.meta.type && source.id === component.id) {
            return true;
        }

        if (target.type === component.meta.type && target.id === component.id) {
            return true;
        }

        return false;
    };

    var on_connections_get = function on_connections_get() {
        return privates.get(this).connections.slice(0);
    };

    var on_error_count_get = function on_error_count_get() {
        var priv = privates.get(this);
        return this.logManager.errorCount - priv.fixederrors;
    };

    var on_operators_get = function on_operators_get() {
        return privates.get(this).operators.slice(0);
    };

    var on_operators_by_id_get = function on_operators_by_id_get() {
        var priv = privates.get(this);

        if (priv.freezedOperatorsById == null) {
            priv.freezedOperatorsById = Object.freeze(utils.clone(priv.operatorsById));
        }

        return priv.freezedOperatorsById;
    };

    var removeComponent = function removeComponent(component) {
        var connection, i, priv;

        priv = privates.get(this);

        for (i = priv.connections.length - 1; i >= 0; i--) {
            connection = priv.connections[i];

            if (connection.source.component === component || connection.target.component === component) {
                connection.detach();
                priv.connections.splice(i, 1);
            }
        }

        removeComponentInfo(component, priv.visualdescription);

        for (i = priv.visualdescription.behaviours.length - 1; i >= 0; i--) {
            removeComponentInfo(component, priv.visualdescription.behaviours[i]);
        }

        return this;
    };

    var removeComponentInfo = function removeComponentInfo(component, status) {
        var i;

        for (i = status.connections.length - 1; i >= 0; i--) {
            if (connection_hasComponent(status.connections[i], component)) {
                status.connections.splice(i, 1);
            }
        }

        delete status.components[component.meta.type][component.id];
    };

    var append_operator = function append_operator(operator) {
        var priv = privates.get(this);

        priv.operatorsById[operator.id] = operator;
        priv.operators.push(operator);
        priv.freezedOperatorsById = null;

        operator.addEventListener('change', priv.on_changecomponent);
        operator.addEventListener('remove', priv.on_removeoperator);
        this.dispatchEvent('createoperator', operator.load());

        return operator;
    };

    var create_operator = function create_operator(meta, data) {
        var operator, priv;

        priv = privates.get(this);
        operator = new Wirecloud.wiring.Operator(this, meta, data);

        if (Number(operator.id) >= priv.operatorId) {
            priv.operatorId = Number(operator.id) + 1;
        }

        return operator;
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changecomponent = function on_changecomponent(component, changes, old_values) {

        if (changes.indexOf('meta') !== -1) {
            component.fullDisconnect();
            var priv = privates.get(this);
            priv.connections.forEach((connection) => {
                if (connection.source.component.is(component)) {
                    connection.updateEndpoint(getEndpointOrCreateMissing(component, 'outputs', connection.source.name));
                    if (old_values.meta.missing && !connection.missing) {
                        priv.fixederrors += 1;
                    }
                } else if (connection.target.component.is(component)) {
                    connection.updateEndpoint(getEndpointOrCreateMissing(component, 'inputs', connection.target.name));
                    if (old_values.meta.missing && !connection.missing) {
                        priv.fixederrors += 1;
                    }
                }
            });
            if (old_values.meta.missing) {
                priv.fixederrors += 1;
            }
        }
    };

    var on_createwidget = function on_createwidget(workspace, widget) {
        var priv = privates.get(this);

        widget.addEventListener('change', priv.on_changecomponent);
        widget.addEventListener('remove', priv.on_removewidget);
    };

    var on_removeconnection = function on_removeconnection(connection) {
        var priv = privates.get(this);

        connection.removeEventListener('remove', priv.on_removeconnection);
        priv.connections.splice(priv.connections.indexOf(connection), 1);
    };

    var on_removeoperator = function on_removeoperator(operator) {
        var priv = privates.get(this);

        if (!(operator.id in priv.operatorsById)) {
            return;
        }
        priv.operators.splice(priv.operators.indexOf(operator), 1);
        delete priv.operatorsById[operator.id];
        priv.freezedOperatorsById = null;

        removeComponent.call(this, operator);

        operator.removeEventListener('change', priv.on_changecomponent);
        operator.removeEventListener('remove', priv.on_removeoperator);
        this.dispatchEvent('removeoperator', operator);
    };

    var on_removewidget = function on_removewidget(widget) {
        var priv = privates.get(this);

        removeComponent.call(this, widget);
        widget.removeEventListener('change', priv.on_changecomponent);
        widget.removeEventListener('remove', priv.on_removewidget);
        if (widget.missing) {
            priv.fixederrors += 1;
        }
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
