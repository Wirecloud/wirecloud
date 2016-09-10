/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.wiring = {}; // TODO: move to another file

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
            operatorId: 1,
            operators: [],
            connections: [],
            on_changecomponent: on_changecomponent.bind(this),
            on_createwidget: on_createwidget.bind(this),
            on_removeconnection: on_removeconnection.bind(this),
            on_removeoperator: on_removeoperator.bind(this),
            on_removewidget: on_removewidget.bind(this)
        });

        Object.defineProperties(this, /** @lends Wirecloud.Wiring# */{
            /**
             * @type {Array.<Wirecloud.Wiring.Connection>}
             */
            connections: {
                get: function () {
                    return privates.get(this).connections.slice(0);
                }
            },
            /**
             * @type {Wirecloud.LogManager}
             */
            logManager: {
                value: new Wirecloud.wiring.LogManager(this)
            },
            /**
             * @type {Array.<Wirecloud.Wiring.Operator>}
             */
            operators: {
                get: function () {
                    return privates.get(this).operators.slice(0);
                }
            },
            /**
             * @type {Object.<String, Wirecloud.Wiring.Operator>}
             */
            operatorsById: {
                get: function () {
                    return get_operators_by_id.call(this);
                }
            },
            status: {
                get: on_status_get
            },
            /**
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
         * @param {Wirecloud.OperatorMeta} resource
         * @param {Object} [data]
         *
         * @returns {Promise}
         */
        createOperator: function createOperator(resource, data) {
            data = utils.merge({
                id: (privates.get(this).operatorId).toString(),
                volatile: false
            }, data);

            if (data.volatile) {
                return append_operator.call(this, create_operator.call(this, resource, data));
            }

            return new Promise(function (resolve, reject) {
                resolve(create_operator.call(this, resource, data));
            }.bind(this));
        },

        /**
         * @param {String} id
         *
         * @returns {*}
         */
        findOperator: function findOperator(id) {
            return this.operatorsById[id];
        },

        load: function load(status) {
            var connection, i, id, operator;

            privates.get(this).connections.forEach(function (connection) {
                connection.detach();
            });

            for (i = privates.get(this).operators.length - 1; i >= 0; i--) {
                operator = privates.get(this).operators[i];
                if (!operator.volatile && !(operator.id in status.operators)) {
                    operator.remove();
                }
            }

            for (i = privates.get(this).connections.length - 1; i >= 0; i--) {
                connection = privates.get(this).connections[i];

                if (!connection.volatile) {
                    connection.removeEventListener('remove', privates.get(this).on_removeconnection);
                    privates.get(this).connections.splice(i, 1);
                }
            }

            this.logManager.newCycle();

            for (id in status.operators) {
                operator = status.operators[id];

                if (this.findOperator(id) == null) {
                    append_operator.call(this, operator);
                }
            }

            privates.get(this).operatorId = 1;

            privates.get(this).operators.forEach(function (operator) {

                if (Number(operator.id) >= privates.get(this).operatorId) {
                    privates.get(this).operatorId = Number(operator.id) + 1;
                }
            }, this);

            status.connections.forEach(function (connection) {
                connection.addEventListener('remove', privates.get(this).on_removeconnection);
                privates.get(this).connections.push(connection);
            }, this);

            privates.get(this).connections.forEach(function (connection) {
                connection.establish();
            });

            this.visualdescription = status.visualdescription;

            return this.trigger('load');
        },

        /**
         * @returns {Promise}
         */
        save: function save(status) {
            if (status == null) {
                status = this.status;
            }

            return new Promise(function (resolve, reject) {
                var url = Wirecloud.URLs.WIRING_ENTRY.evaluate({
                    workspace_id: this.workspace.id
                });

                Wirecloud.io.makeRequest(url, {
                    method: 'PUT',
                    requestHeaders: {'Accept': 'application/json'},
                    contentType: 'application/json',
                    postBody: JSON.stringify(this.toJSON(status)),
                    onComplete: function (response) {
                        if (response.status === 204) {
                            resolve(this);
                        } else {
                            reject(/* TODO */);
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        /**
         * @returns {Object}
         */
        toJSON: function toJSON(status) {
            var operators = {}, id;

            if (status == null) {
                status = this.status;
            }

            for (id in status.operators) {
                if (!status.operators[id].volatile) {
                    operators[id] = status.operators[id];
                }
            }

            return {
                version: '2.0',
                connections: status.connections.filter(function (connection) {
                    return !connection.volatile;
                }),
                operators: operators,
                visualdescription: status.visualdescription
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
            veresion: '2.0',
            connections: priv.connections.slice(0),
            operators: utils.clone(this.operatorsById),
            visualdescription: utils.clone(this.visualdescription, true)
        };
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
            append_operator.call(this, status.operators[id]);
        }

        // Convert connections into instances
        for (i = status.connections.length - 1; i >= 0; i--) {
            connection_info = utils.merge({}, Wirecloud.wiring.Connection.JSON_TEMPLATE, status.connections[i]);

            source = getEndpoint.call(this, 'outputs', connection_info.source);
            target = getEndpoint.call(this, 'inputs', connection_info.target);

            if (source != null && target != null) {
                status.connections[i] = new Wirecloud.wiring.Connection(this, source, target, {
                    readonly: connection_info.readonly
                });
                status.connections[i] = status.connections[i];
            } else {
                status.connections.splice(i, 1);
            }
        }

        this.visualdescription = status.visualdescription;

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
        var endpoint, info;

        info = {
            name: name,
            friendcode: ''
        };

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

    var getEndpoint = function getEndpoint(endpointGroup, endpointInfo) {
        var component;

        switch (endpointInfo.type) {
        case 'widget':
            component = this.workspace.findWidget(endpointInfo.id.toString());
            break;
        case 'operator':
            component = this.findOperator(endpointInfo.id.toString());
            break;
        }

        if (component == null) {
            return null;
        }

        return getEndpointOrCreateMissing(component, endpointGroup, endpointInfo.endpoint);
    };

    var reconnect = function reconnect(component) {
        this.logManager.newCycle();
        privates.get(this).connections.forEach(function (connection) {
            if (connection.source.component.is(component)) {
                connection.updateEndpoint(getEndpointOrCreateMissing(component, 'outputs', connection.source.name));
            } else if (connection.target.component.is(component)) {
                connection.updateEndpoint(getEndpointOrCreateMissing(component, 'inputs', connection.target.name));
            }
        });
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

    var get_operators_by_id = function get_operators_by_id() {
        /*jshint validthis:true */
        var operators = {};

        privates.get(this).operators.forEach(function (operator) {
            operators[operator.id] = operator;
        });

        return operators;
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

        removeComponentInfo(component, this.visualdescription);

        for (i = this.visualdescription.behaviours.length - 1; i >= 0; i--) {
            removeComponentInfo(component, this.visualdescription.behaviours[i]);
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
        /*jshint validthis:true */
        var priv = privates.get(this);

        priv.operators.push(operator);

        operator.addEventListener('change', priv.on_changecomponent);
        operator.addEventListener('remove', priv.on_removeoperator);
        this.trigger('createoperator', operator.load());

        return operator;
    };

    var create_operator = function create_operator(resource, data) {
        var operator, priv;

        priv = privates.get(this);
        operator = new Wirecloud.wiring.Operator(this, resource, data);

        if (Number(operator.id) >= priv.operatorId) {
            priv.operatorId = Number(operator.id) + 1;
        }

        return operator;
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_changecomponent = function on_changecomponent(component, changes) {

        if (changes.indexOf('meta') !== -1) {
            component.fullDisconnect();
            reconnect.call(this, component);
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
        /*jshint validthis:true */
        var priv = privates.get(this);

        priv.operators.splice(priv.operators.indexOf(operator), 1);

        removeComponent.call(this, operator);

        operator.removeEventListener('change', priv.on_changecomponent);
        operator.removeEventListener('remove', priv.on_removeoperator);
        this.trigger('removeoperator', operator);
    };

    var on_removewidget = function on_removewidget(widget) {
        /*jshint validthis:true */
        var priv = privates.get(this);

        removeComponent.call(this, widget);
        widget.removeEventListener('change', priv.on_changecomponent);
        widget.removeEventListener('remove', priv.on_removewidget);
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
