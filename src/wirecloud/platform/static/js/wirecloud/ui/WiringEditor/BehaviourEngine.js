/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    var viewpoints = {
        GLOBAL: 0,
        INDEPENDENT: 1
    };

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class BehaviorEngine.
     * @extends {Panel}
     *
     * @constructor
     */
    ns.BehaviorEngine = utils.defineClass({

        constructor: function BehaviorEngine() {

            this.btnCreate = new se.Button({
                'title': gettext("Add behavior"),
                'class': "btn-create",
                'iconClass': 'icon-plus'
            });
            this.btnCreate.on('click', handleOnCreate.bind(this));

            this.btnEnable = new se.Button({
                'title': gettext("Enable"),
                'class': "btn-enable",
                'iconClass': 'icon-lock'
            });
            this.btnEnable.on('click', handleOnEnable.bind(this));

            this.superClass({
                events: events,
                extraClass: 'panel-behaviors',
                title: gettext("Identified behaviors"),
                optionList: [this.btnCreate, this.btnEnable]
            });

            this.disabledAlert = new se.Alert({
                state: 'info',
                title: "New feature",
                message: "Enable the behaviors to enjoy with a new way to handle connections."
            });

            this.readonly = true;

            this.viewpoint = viewpoints.GLOBAL;
            this.behaviors = [];
        },

        inherit: se.Panel,

        statics: {

            OPERATION_NOT_ALLOWED: -1,

            COMPONENT_NOT_FOUND:     0,
            COMPONENT_UNREACHABLE:   1,
            COMPONENT_UNSUPPORTED:   2,
            COMPONENT_REMOVED:       3,
            COMPONENT_REMOVED_FULLY: 4,

            CONNECTION_NOT_FOUND:     0,
            CONNECTION_UNREACHABLE:   1,
            CONNECTION_UNSUPPORTED:   2,
            CONNECTION_REMOVED:       3,
            CONNECTION_REMOVED_FULLY: 4,

            viewpoints: viewpoints

        },

        members: {

            _onenabled: function _onenabled(enabled) {

                this.empty();

                if (enabled) {
                    this.btnEnable
                        .setTitle('Disable')
                        .replaceIconClass('icon-lock', 'icon-unlock');
                    this.btnCreate.show();
                    this.body.remove(this.disabledAlert);
                } else {
                    this.btnEnable
                        .setTitle('Enable')
                        .replaceIconClass('icon-unlock', 'icon-lock');
                    this.btnCreate.hide();
                    this.body.append(this.disabledAlert);
                }

                return this;
            },

            addLogger: function addLogger(behavior, connections, operators, widgets) {
                this.logger = {
                    behavior: behavior,
                    connections: connections,
                    operators: operators,
                    widgets: widgets
                };

                return this;
            },

            /**
             * [activate description]
             *
             * @param {Behavior} behavior
             *      [description]
             * @param {Boolean} [viewpoint]
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            activate: function activate(behavior, viewpoint) {

                if (!this.enabled) {
                    updateLogger.call(this);
                    return this;
                }

                desactivateAllExcept.call(this, behavior);
                toggleViewpoint.call(this, viewpoint);
                updateBehaviorLogger.call(this);

                return this.trigger('activate', this.behavior, this.viewpoint);
            },

            /**
             * [addBehavior description]
             *
             * @param {Object.<String, *>} behaviorInfo
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            createBehavior: function createBehavior(behaviorInfo) {
                var behavior;

                behavior = (new ns.Behavior(behaviorInfo))
                    .on('click', function () {
                        this.activate(behavior);
                    }.bind(this))
                    .on('remove', function () {
                        this.removeBehavior(behavior);
                    }.bind(this))
                    .on('update', function () {
                        if (this.behavior.equals(behavior)) {
                            updateBehaviorLogger.call(this);
                        }
                    }.bind(this));

                return insertBehavior.call(this, behavior);
            },

            /**
             * [empty description]
             * @override
             *
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            empty: function empty() {
                this.btnEnable.show();

                this.viewpoint = viewpoints.GLOBAL;
                this.description = Wirecloud.Wiring.normalize().visualdescription;
                this.behavior = null;
                this.behaviors.length = 0;

                return this.superMember('empty');
            },

            /**
             * [emptyBehavior description]
             *
             * @param {Behavior} [behavior]
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            emptyBehavior: function emptyBehavior(behavior) {
                var _behavior;

                if (!this.enabled) {
                    return this;
                }

                if (behavior == null) {
                    behavior = this.behavior;
                }

                if (!this.behavior.equals(behavior)) {
                    _behavior = this.behavior;
                    this.activate(behavior);
                }

                this.trigger('beforeEmpty', this.behavior);
                behavior.empty();

                if (_behavior != null) {
                    this.activate(_behavior);
                }

                return this;
            },

            /**
             * [findBehaviorByComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Behavior[]}
             *      [description]
             */
            findBehaviorByComponent: function findBehaviorByComponent(type, id) {
                return this.behaviors.filter(function (behavior) {
                    return behavior.hasComponent(type, id);
                });
            },

            /**
             * [findComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Object.<String, *>}
             *      [description]
             */
            findComponent: function findComponent(type, id) {
                var view;

                if (this.enabled && this.viewpoint === viewpoints.INDEPENDENT) {
                    if (this.behavior.hasComponentView(type, id)) {
                        return this.behavior.findComponent(type, id);
                    }
                }

                view = this.description.components[type][id];

                if (view != null && !Object.keys(view).length) {
                    view = null;
                }

                return view;
            },

            /**
             * [findConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @returns {Object.<String, *>}
             *      [description]
             */
            findConnection: function findConnection(sourceName, targetName) {
                var index;

                if (this.enabled && this.viewpoint === viewpoints.INDEPENDENT) {
                    return this.behavior.findConnection(sourceName, targetName);
                }

                index = getConnectionIndex.call(this, sourceName, targetName);

                return index < 0 ? null : this.description.connections[index];
            },

            /**
             * [hasComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            hasComponent: function hasComponent(type, id) {
                var found;

                if (this.enabled) {
                    found = this.behaviors.some(function (behavior) {
                        return behavior.hasComponent(type, id);
                    });
                } else {
                    found = id in this.description.components[type];
                }

                return found;
            },

            /**
             * [hasConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            hasConnection: function hasConnection(sourceName, targetName) {
                var found, i;

                if (this.enabled) {
                    found = this.behaviors.some(function (behavior) {
                        return behavior.hasConnection(sourceName, targetName);
                    });
                } else {
                    found = getConnectionIndex.call(this, sourceName, targetName) !== -1;
                }

                return found;
            },

            /**
             * [setUp description]
             *
             * @param {Object.<String, *>} status
             *      [description]
             * @returns {Object.<String, *>}
             *      [description]
             */
            setUp: function setUp(status) {
                status = Wirecloud.Wiring.normalize(status);

                this.enabled = status.visualdescription.behaviours.length > 0;
                this.description = status.visualdescription;

                if (this.enabled) {
                    this.description.behaviours.forEach(function (info) {
                        this.createBehavior(info);
                    }, this);

                    if (!this.behaviors.length) {
                        this.createBehavior();
                    }
                }

                return status;
            },

            /**
             * [removeBehavior description]
             *
             * @param {Behavior} behavior
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            removeBehavior: function removeBehavior(behavior) {
                var _behavior;

                if (!this.enabled) {
                    return this;
                }

                if (this.behavior.equals(behavior)) {
                    this.behaviors.some(function (existingBehavior) {
                        return !behavior.equals((_behavior=existingBehavior));
                    });
                } else {
                    _behavior = this.behavior;
                }

                this.emptyBehavior(behavior)
                    .activate(_behavior);

                this.body.remove(behavior);
                this.behaviors.splice(this.behaviors.indexOf(behavior), 1);
                enableRemoveBehavior.call(this);

                return this;
            },

            /**
             * [removeComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @param {Boolean} [cascade=false]
             *      [description]
             * @returns {Number}
             *      [description]
             */
            removeComponent: function removeComponent(type, id, cascade) {

                if (typeof cascade !== 'boolean') {
                    cascade = false;
                }

                if (this.readonly || (this.enabled && this.viewpoint !== viewpoints.GLOBAL)) {
                    return ns.BehaviorEngine.OPERATION_NOT_ALLOWED;
                }

                if (!this.hasComponent(type, id)) {
                    return ns.BehaviorEngine.COMPONENT_NOT_FOUND;
                }

                if (this.enabled) {
                    if (cascade) {
                        this.behaviors.forEach(function (behavior) {
                            behavior.removeComponent(type, id);
                        });
                    } else {
                        if (!this.behavior.hasComponent(type, id)) {
                            return ns.BehaviorEngine.COMPONENT_UNREACHABLE;
                        }

                        this.behavior.removeComponent(type, id);

                        if (this.hasComponent(type, id)) {
                            return ns.BehaviorEngine.COMPONENT_REMOVED;
                        }
                    }
                }

                delete this.description.components[type][id];
                updateLogger.call(this);

                return ns.BehaviorEngine.COMPONENT_REMOVED_FULLY;
            },

            /**
             * [removeConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @param {Boolean} [cascade=false]
             *      [description]
             * @returns {Number}
             *      [description]
             */
            removeConnection: function removeConnection(sourceName, targetName, cascade) {
                var index = getConnectionIndex.call(this, sourceName, targetName);

                if (typeof cascade !== 'boolean') {
                    cascade = false;
                }

                if (this.readonly || (this.enabled && this.viewpoint !== viewpoints.GLOBAL)) {
                    return ns.BehaviorEngine.OPERATION_NOT_ALLOWED;
                }

                if (index === -1) {
                    return ns.BehaviorEngine.CONNECTION_NOT_FOUND;
                }

                if (this.enabled) {
                    if (cascade) {
                        this.behaviors.forEach(function (behavior) {
                            behavior.removeConnection(sourceName, targetName);
                        });
                    } else {
                        if (!this.behavior.hasConnection(sourceName, targetName)) {
                            return ns.BehaviorEngine.CONNECTION_UNREACHABLE;
                        }

                        this.behavior.removeConnection(sourceName, targetName);

                        if (this.hasConnection(sourceName, targetName)) {
                            return ns.BehaviorEngine.CONNECTION_REMOVED;
                        }
                    }
                }

                this.description.connections.splice(index, 1);
                updateLogger.call(this);

                return ns.BehaviorEngine.CONNECTION_REMOVED_FULLY;
            },

            /**
             * [serialize description]
             *
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            serialize: function serialize() {
                var status = Wirecloud.Wiring.normalize();

                status.visualdescription.components = this.description.components;
                status.visualdescription.connections = this.description.connections;

                this.behaviors.forEach(function (behavior) {
                    status.visualdescription.behaviours.push(behavior.serialize());
                });

                return status;
            },

            /**
             * [toggleViewpoint description]
             *
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            toggleViewpoint: function toggleViewpoint() {
                return this.activate(this.behavior, true);
            },

            /**
             * [updateComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @param {Object.<String, *>} view
             *      [description]
             * @param {Boolean} [updateOnly=false]
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            updateComponent: function updateComponent(type, id, view, updateOnly) {

                if (typeof updateOnly !== 'boolean') {
                    updateOnly = false;
                }

                if (this.readonly) {
                    return this;
                }

                if (this.enabled) {
                    switch (this.viewpoint) {
                    case viewpoints.GLOBAL:
                        if (updateOnly) {
                            if (id in this.description.components[type]) {
                                this.description.components[type][id] = view;
                            }
                        } else {
                            this.description.components[type][id] = view;
                            this.behavior.updateComponent(type, id);
                        }
                        break;
                    case viewpoints.INDEPENDENT:
                        if (updateOnly && this.behavior.hasComponent(type, id)) {
                            this.behavior.updateComponent(type, id, view);
                            return this;
                        }
                    }
                } else {
                    this.description.components[type][id] = view;
                }

                updateLogger.call(this);

                return this;
            },

            /**
             * [updateConnection description]
             *
             * @param {Object.<String, *>} view
             *      [description]
             * @param {Boolean} [updateOnly=false]
             *      [description]
             * @returns {BehaviorEngine}
             *      The instance on which the member is called.
             */
            updateConnection: function updateConnection(view, updateOnly) {
                var index = getConnectionIndex.call(this, view.sourcename, view.targetname);

                if (typeof updateOnly !== 'boolean') {
                    updateOnly = false;
                }

                if (this.readonly || (this.enabled && this.viewpoint !== viewpoints.GLOBAL)) {
                    return this;
                }

                if (this.enabled) {

                    if (updateOnly) {
                        if (index !== -1) {
                            this.description.connections[index] = view;
                        }
                    } else {
                        if (index !== -1) {
                            this.description.connections[index] = view;
                        } else {
                            this.description.connections.push(view);
                        }
                        this.behavior.updateConnection(view);
                    }
                } else {
                    if (index !== -1) {
                        this.description.connections[index] = view;
                    } else {
                        this.description.connections.push(view);
                    }
                }

                updateLogger.call(this);

                return this;
            }

        }

    });

    var desactivateAllExcept = function desactivateAllExcept(behavior) {
        var i, found;

        for (found = false, i = 0; i < this.behaviors.length; i++) {
            this.behaviors[i].active = false;

            if (!found && this.behaviors[i].equals(behavior)) {
                this.behavior = this.behaviors[i];
                found = true;
            }
        }

        this.behavior.active = true;

        return this;
    };

    var enableRemoveBehavior = function enableRemoveBehavior() {
        var state = this.behaviors.length > 1;

        this.behaviors.forEach(function (behavior) {
            behavior.btnRemove.enabled = state;
        });

        return this;
    };

    var events = ['activate', 'beforeEmpty', 'enable'];

    var getConnectionIndex = function getConnectionIndex(sourceName, targetName) {
        var connection, found, i, index = -1;

        for (found = false, i = 0; !found && i < this.description.connections.length; i++) {
            connection = this.description.connections[i];

            if (connection.sourcename == sourceName && connection.targetname == targetName) {
                found = true;
                index = i;
            }
        }

        return index;
    };

    var handleOnCreate = function handleOnCreate() {
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: gettext("Title"), type: 'text'},
                {name: 'description', label: gettext("Description"), type: 'longtext'}
            ],
            gettext("New behavior"),
            'behavior-create-form');

        dialog.executeOperation = function (data) {
            this.appendBehavior(this.createBehavior(data));
        }.bind(this);
        dialog.show();
    };

    var handleOnEnable = function handleOnEnable() {
        var dialog, message;

        if (this.enabled) {
            message = gettext("The following operation is irreversible and removes all identified behaviors. " +
                "Would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                'acceptLabel': gettext("Yes"),
                'cancelLabel': gettext("No, thank you")
            });
            dialog.setMsg(message);
            dialog.acceptHandler = function () {
                this.enabled = false;
                this.trigger('enable', this.enabled, this);
            }.bind(this);
            dialog.show();
        } else {
            this.enabled = true;
            this.createBehavior();
            this.trigger('enable', this.enabled, this);
        }
    };

    var insertBehavior = function insertBehavior(behavior) {
        this.body.append(behavior);
        this.behaviors.push(behavior);

        if (behavior.active || !this.behavior) {
            desactivateAllExcept.call(this, behavior);
        }

        enableRemoveBehavior.call(this);

        return this;
    };

    var toggleViewpoint = function toggleViewpoint(value) {

        if (typeof value !== 'boolean') {
            value = false;
        }

        if (value) {
            if (this.viewpoint === viewpoints.GLOBAL) {
                this.viewpoint = viewpoints.INDEPENDENT;
                this.btnEnable.hide();
            } else {
                this.viewpoint = viewpoints.GLOBAL;
                this.btnEnable.show();
            }
        }

        return this;
    };

    var updateLogger = function updateLogger() {

        if (this.logger != null && !this.enabled) {
            this.logger.behavior
                .innerHTML = "";
            this.logger.connections
                .textContent = this.description.connections.length;
            this.logger.operators
                .textContent = Object.keys(this.description.components.operator).length;
            this.logger.widgets
                .textContent = Object.keys(this.description.components.widget).length;
        }
    };

    var updateBehaviorLogger = function updateBehaviorLogger() {

        if (this.logger != null) {
            this.logger.behavior
                .innerHTML = "<strong>Behavior:</strong> " + this.behavior.title.text();
            this.logger.connections
                .textContent = this.behavior.connections.length;
            this.logger.operators
                .textContent = Object.keys(this.behavior.components.operator).length;
            this.logger.widgets
                .textContent = Object.keys(this.behavior.components.widget).length;
        }
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
