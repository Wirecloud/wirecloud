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

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class BehaviourEngine.
     * @extends {Panel}
     *
     * @constructor
     */
    ns.BehaviourEngine = utils.defineClass({

        constructor: function BehaviourEngine() {

            this.btnCreate = new se.Button({
                title: gettext("Create behaviour"),
                extraClass: "btn-create",
                iconClass: "icon-plus"
            });
            this.btnCreate.on('click', btncreate_onclick.bind(this));

            this.btnEnable = new se.Button({
                title: gettext("Enable"),
                extraClass: "btn-enable",
                iconClass: "icon-lock"
            });
            this.btnEnable.on('click', btnenable_onclick.bind(this));

            this.superClass({
                events: events,
                extraClass: "panel-behaviours",
                title: gettext("Identified behaviours"),
                buttons: [this.btnCreate, this.btnEnable]
            });

            this.disabledAlert = new se.Alert({
                state: 'info',
                title: gettext("New feature"),
                message: gettext("Enable the behaviours to enjoy with a new way to handle connections.")
            });

            this.viewpoint = ns.BehaviourEngine.GLOBAL;

            this.behaviours = [];
            this.components = {operator: {}, widget: {}};
        },

        inherit: se.Panel,

        statics: {

            GLOBAL: 0,

            INDEPENDENT: 1

        },

        members: {

            /**
             * @override
             */
            _onenabled: function _onenabled(enabled) {

                if (enabled) {
                    this.btnEnable
                        .setTitle(gettext("Disable"))
                        .replaceIconClass('icon-lock', 'icon-unlock');
                    this.btnCreate.show();
                    this.body.remove(this.disabledAlert);
                } else {
                    this.btnEnable
                        .setTitle(gettext("Enable"))
                        .replaceIconClass('icon-unlock', 'icon-lock');
                    this.btnCreate.hide();
                    this.body.append(this.disabledAlert);
                }

                return this;
            },

            /**
             * [TODO: activate description]
             *
             * @param {Behaviour} behaviour
             *      [TODO: description]
             * @param {Boolean} [toggleViewpoint]
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            activate: function activate(behaviour, toggleViewpoint) {

                if (!this.enabled) {
                    return this;
                }

                desactivateAllExcept.call(this, behaviour);

                if (toggleViewpoint) {
                    this.viewpoint = this.viewpoint === ns.BehaviourEngine.GLOBAL ? ns.BehaviourEngine.INDEPENDENT : ns.BehaviourEngine.GLOBAL;
                }

                return this.trigger('activate', this.behaviour, this.viewpoint);
            },

            /**
             * [TODO: createBehaviour description]
             *
             * @param {PlainObject} behaviourInfo
             *      [TODO: description]
             * @returns {Behaviour}
             *      [TODO: description]
             */
            createBehaviour: function createBehaviour(behaviourInfo) {
                var behaviour;

                behaviour = (new ns.Behaviour(behaviourInfo))
                    .on('change', function () {
                        if (this.behaviour.equals(behaviour)) {
                            this.trigger('change', behaviour.getCurrentStatus(), this.enabled);
                        }
                    }.bind(this))
                    .on('click', function () {
                        this.activate(behaviour);
                    }.bind(this))
                    .on('optremove', function () {
                        this.removeBehaviour(behaviour);
                    }.bind(this));

                return insertBehaviour.call(this, behaviour);
            },

            /**
             * @override
             */
            empty: function empty() {
                var i;

                if (this.enabled) {

                    for (i = this.behaviours.length - 1; i >= 0; i--) {
                        this.removeBehaviour(this.behaviours[i]);
                    }

                    this.behaviours.length = 0;
                    this.viewpoint = ns.BehaviourEngine.GLOBAL;

                    delete this.behaviour;
                } else {
                    this.forEachComponent(function (component) {
                        this.removeComponent(component);
                    }.bind(this));
                }

                this.description = Wirecloud.Wiring.normalize().visualdescription;

                return this;
            },

            /**
             * [emptyBehaviour description]
             *
             * @param {Behaviour} [behaviour]
             *      [description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            emptyBehaviour: function emptyBehaviour(behaviour) {
                var _behaviour;

                if (!this.enabled) {
                    return this;
                }

                if (behaviour == null) {
                    behaviour = this.behaviour;
                }

                if (!this.behaviour.equals(behaviour)) {
                    _behaviour = this.behaviour;
                    this.activate(behaviour);
                }

                this.forEachComponent(function (component) {

                    if (behaviour.hasComponent(component)) {
                        _removeComponent.call(this, component);
                    }
                }.bind(this));
                behaviour.empty();

                if (_behaviour != null) {
                    this.activate(_behaviour);
                }

                return this;
            },

            /**
             * [TODO: filterBehaviours description]
             *
             * @param {Component} component
             *      [TODO: description]
             * @returns {Behaviour[]}
             *      [TODO: description]
             */
            filterBehaviours: function filterBehaviours(component) {
                return this.behaviours.filter(function (behaviour) {
                    return behaviour.hasComponent(component);
                });
            },

            /**
             * [TODO: forEachComponent description]
             *
             * @param {Function} callback
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            forEachComponent: function forEachComponent(callback) {
                var component, id, type;

                for (type in this.components) {
                    for (id in this.components[type]) {
                        callback(this.components[type][id]);
                    }
                }

                return this;
            },

            getConnectionIndex: function getConnectionIndex(connection) {
                var _connection, found, i, index = -1;

                for (found = false, i = 0; !found && i < this.description.connections.length; i++) {
                    _connection = this.description.connections[i];

                    if (_connection.sourcename == connection.sourceId && _connection.targetname == connection.targetId) {
                        found = true;
                        index = i;
                    }
                }

                return index;
            },

            getCurrentStatus: function getCurrentStatus() {
                return {
                    title: "",
                    connections: this.description.connections.length,
                    components: {
                        operator: Object.keys(this.description.components.operator).length,
                        widget: Object.keys(this.description.components.widget).length
                    }
                };
            },

            /**
             * [TODO: hasComponent description]
             *
             * @param {Component} component
             *      [TODO: description]
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasComponent: function hasComponent(component) {
                var found;

                if (this.enabled) {
                    found = this.behaviours.some(function (behaviour) {
                        return behaviour.hasComponent(component);
                    });
                } else {
                    found = component.id in this.description.components[component.type];
                }

                return found;
            },

            /**
             * [TODO: hasComponents description]
             *
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasComponents: function hasComponents() {
                return (Object.keys(this.components.operator).length + Object.keys(this.components.widget).length) > 0
            },

            /**
             * [TODO: hasConnection description]
             *
             * @param {Connection} connection
             *      [TODO: description]
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasConnection: function hasConnection(connection) {
                var found;

                if (this.enabled) {
                    found = this.behaviours.some(function (behaviour) {
                        return behaviour.hasConnection(connection);
                    });
                } else {
                    found = this.getConnectionIndex(connection) !== -1;
                }

                return found;
            },

            /**
             * [TODO: loadBehaviours description]
             *
             * @param  {PlainObject[]} behaviours
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            loadBehaviours: function loadBehaviours(behaviours) {

                behaviours.forEach(function (info) {
                    this.createBehaviour(info).logManager.log("The behaviour was loaded.", Wirecloud.constants.LOGGING.INFO_MSG);
                }, this);

                if (behaviours.length) {
                    this.enabled = true;
                    this.activate();
                } else {
                    this.trigger('change', this.getCurrentStatus(), this.enabled);
                }

                return this;
            },

            /**
             * [TODO: removeBehaviour description]
             *
             * @param {Behaviour} behaviour
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            removeBehaviour: function removeBehaviour(behaviour) {
                var _behaviour;

                if (!this.enabled) {
                    return this;
                }

                if (this.behaviour.equals(behaviour)) {
                    this.behaviours.some(function (existingBehaviour) {
                        return !behaviour.equals((_behaviour=existingBehaviour));
                    });
                } else {
                    _behaviour = this.behaviour;
                }

                this.emptyBehaviour(behaviour).activate(_behaviour);

                this.body.remove(behaviour);
                this.behaviours.splice(this.behaviours.indexOf(behaviour), 1);

                enableToRemoveBehaviour.call(this);

                return this;
            },

            /**
             * [TODO: removeComponent description]
             *
             * @param {Component} component
             *      [TODO: description]
             * @param {Boolean} [cascade=false]
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            removeComponent: function removeComponent(component, cascade) {

                if (this.enabled) {
                    if (cascade) {
                        _removeComponent.call(this, component, true);
                    } else {
                        if (this.filterBehaviours(component).length > 1) {
                            showComponentDeleteModal.call(this, component);
                        } else {
                            _removeComponent.call(this, component, false);
                        }
                    }
                } else {
                    delete this.description.components[component.type][component.id];
                    delete this.components[component.type][component.id];

                    removeConnections.call(this, component, true);
                    component.remove();

                    this.trigger('change', this.getCurrentStatus(), this.enabled);
                }

                return this;
            },

            /**
             * [TODO: removeConnection description]
             *
             * @param {Connection} connection
             *      [TODO: description]
             * @param {Boolean} [cascade=false]
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            removeConnection: function removeConnection(connection, cascade) {
                var index = this.getConnectionIndex(connection);

                if (this.enabled) {
                    if (cascade) {
                        this.behaviours.forEach(function (behaviour) {
                            behaviour.removeConnection(connection);
                        });
                    } else {
                        this.behaviour.removeConnection(connection);

                        if (this.hasConnection(connection)) {
                            connection.background = true;
                            return this;
                        }
                    }
                }

                _removeConnection.call(this, index, connection);

                if (!this.enabled) {
                    this.trigger('change', this.getCurrentStatus(), this.enabled);
                }

                return this;
            },

            /**
             * [TODO: toggleViewpoint description]
             *
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            toggleViewpoint: function toggleViewpoint() {
                return this.activate(this.behaviour, true);
            },

            /**
             * [TODO: toJSON description]
             *
             * @returns {PlainObject}
             *      The instance on which the member is called.
             */
            toJSON: function toJSON() {
                return JSON.parse(JSON.stringify({
                    behaviours: this.behaviours,
                    components: this.description.components,
                    connections: this.description.connections
                }));
            },

            /**
             * [TODO: updateComponent description]
             *
             * @param {Component} component
             * @param {PlainObject} view
             *      [TODO: description]
             * @param {Boolean} [beShared=false]
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            updateComponent: function updateComponent(component, view, beShared) {
                var name;

                if (this.enabled) {
                    switch (this.viewpoint) {
                    case ns.BehaviourEngine.GLOBAL:
                        if (!component.background || beShared) {
                            this.behaviour.updateComponent(component);
                            component.background = false;
                        }
                        break;
                    case ns.BehaviourEngine.INDEPENDENT:
                        // TODO: do nothing
                        return this;
                    }
                }

                if (!(component.id in this.description.components[component.type])) {
                    this.description.components[component.type][component.id] = {};
                }

                view = view || {};

                for (name in view) {
                    this.description.components[component.type][component.id][name] = view[name];
                }

                this.components[component.type][component.id] = component;

                if (!this.enabled) {
                    this.trigger('change', this.getCurrentStatus(), this.enabled);
                }

                return this;
            },

            /**
             * [TODO: updateConnection description]
             *
             * @param {Connection} connection
             *      [TODO: description]
             * @param {PlainObject} view
             *      [TODO: description]
             * @param {Boolean} [beShared=false]
             *      [TODO: description]
             * @returns {BehaviourEngine}
             *      The instance on which the member is called.
             */
            updateConnection: function updateConnection(connection, view, beShared) {
                var index = this.getConnectionIndex(connection);

                if (this.enabled) {
                    switch (this.viewpoint) {
                    case ns.BehaviourEngine.GLOBAL:
                        if (!connection.background || beShared) {
                            this.behaviour.updateConnection(connection);
                            this.updateComponent(connection.sourceComponent, {}, true);
                            this.updateComponent(connection.targetComponent, {}, true);
                            connection.background = false;
                        }
                        break;
                    case ns.BehaviourEngine.INDEPENDENT:
                        // TODO: do nothing
                        return this;
                    }
                }

                if (index !== -1) {
                    this.description.connections[index] = view;
                } else {
                    this.description.connections.push(view);
                }

                if (!this.enabled) {
                    this.trigger('change', this.getCurrentStatus(), this.enabled);
                }

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['activate', 'change', 'enable'];

    function _removeConnection(index, connection) {

        this.description.connections.splice(index, 1);
        connection.remove();

        return this;
    }

    function desactivateAllExcept(behaviour) {
        var i, found;

        for (found = false, i = 0; i < this.behaviours.length; i++) {
            this.behaviours[i].active = false;

            if (!found && this.behaviours[i].equals(behaviour)) {
                this.behaviour = this.behaviours[i];
                found = true;
            }
        }

        this.behaviour.active = true;

        return this;
    }

    function enableToRemoveBehaviour() {
        var enabled = this.behaviours.length > 1;

        this.behaviours.forEach(function (behaviour) {
            behaviour.btnRemove.enabled = enabled;
        });

        return this;
    }

    function btncreate_onclick() {
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: gettext("Title"), type: 'text'},
                {name: 'description', label: gettext("Description"), type: 'longtext'}
            ],
            gettext("New behaviour"),
            'behaviour-create-form');

        dialog.executeOperation = function (data) {
            this.appendBehaviour(this.createBehaviour(data));
        }.bind(this);
        dialog.show();
    }

    function btnenable_onclick() {
        var dialog, message;

        if (this.enabled) {
            message = gettext("The following operation is irreversible and removes all identified behaviours. " +
                "Would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                'acceptLabel': gettext("Yes"),
                'cancelLabel': gettext("No, thank you")
            });
            dialog.setMsg(message);
            dialog.acceptHandler = function () {
                for (var i = this.behaviours.length - 1; i >= 0; i--) {
                    this.body.remove(this.behaviours[i]);
                }

                this.behaviours.length = 0;
                delete this.behaviour;
                this.enabled = false;
                this.trigger('enable', this.enabled);
            }.bind(this);
            dialog.show();
        } else {
            this.enabled = true;
            this.createBehaviour();
            this.trigger('enable', this.enabled);
        }
    }

    function insertBehaviour(behaviour) {

        this.body.append(behaviour);
        this.behaviours.push(behaviour);

        if (behaviour.active || !this.behaviour) {
            desactivateAllExcept.call(this, behaviour);
        }

        enableToRemoveBehaviour.call(this);

        return behaviour;
    }

    function _removeComponent(component, cascade) {

        if (cascade) {
            this.behaviours.forEach(function (behaviour) {
                behaviour.removeComponent(component);
            });
        } else {
            this.behaviour.removeComponent(component);

            if (this.hasComponent(component)) {
                removeConnections.call(this, component, false);
                component.background = true;

                return this;
            }
        }

        delete this.description.components[component.type][component.id];
        delete this.components[component.type][component.id];

        removeConnections.call(this, component, true);
        component.remove();

        return this;
    }

    function showComponentDeleteModal(component) {
        var modal, message;

        message = gettext("The component belongs to other behaviours. Do you want to delete it from them too?");

        modal = new Wirecloud.ui.AlertWindowMenu({
            cancelLabel: gettext("No, just here")
        });
        modal.setMsg(message);
        modal.acceptHandler = _removeComponent.bind(this, component, true);
        modal.cancelHandler = _removeComponent.bind(this, component);
        modal.show();

        return this;
    }

    function removeConnections(component, cascade) {

        component.forEachConnection(function (connection) {
            this.removeConnection(connection, cascade);
        }.bind(this));

        return this;
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
