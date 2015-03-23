/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global StyledElements, Wirecloud */


Wirecloud.ui.WiringEditor.BehaviourEngine = (function () {

    "use strict";

    /**
     * Create a new instance of class BehaviourEngine.
     * @class
     *
     * @param {Object.<String, *>} [options]
     */
    var BehaviourEngine = function BehaviourEngine(options) {
        StyledElements.EventManagerMixin.call(this, BehaviourEngine.events);
        Wirecloud.ui.WiringEditor.BehaviourManagerMixin.call(this);

        this.btnCreate.addEventListener('click', function (event) {
            this.dispatchEvent('create')({
                'behaviourEngine': this
            }, event);
        }.bind(this));

        this.readonly = true;
        this.behavioursEnabled = false;
        this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;

        this.btnViewpoint.addEventListener('click', function (event) {
            this.toggleViewpoint();
        }.bind(this));

        this.btnEnable.addEventListener('click', function (event) {
            if (this.behavioursEnabled) {
                delete this.currentBehaviour;
                this.emptyBehaviourList();
                this.behavioursEnabled = false;
            } else {
                this.behavioursEnabled = true;
                this.appendBehaviour(this.createBehaviour());
            }
            this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;

            this.dispatchEvent('enable')({
                'isEnabled': this.behavioursEnabled
            });
        }.bind(this));
    };

    StyledElements.Utils.inherit(BehaviourEngine, null,
        StyledElements.EventManagerMixin, Wirecloud.ui.WiringEditor.BehaviourManagerMixin);

    BehaviourEngine.OPERATION_NOT_ALLOWED = -1;

    BehaviourEngine.COMPONENT_NOT_FOUND = 4;
    BehaviourEngine.COMPONENT_UNREACHABLE = 3;
    BehaviourEngine.COMPONENT_UNSUPPORTED = 2;

    BehaviourEngine.COMPONENT_REMOVED = 1;
    BehaviourEngine.COMPONENT_REMOVED_FULLY = 0;

    BehaviourEngine.CONNECTION_NOT_FOUND = 4;
    BehaviourEngine.CONNECTION_UNREACHABLE = 3;
    BehaviourEngine.CONNECTION_UNSUPPORTED = 2;

    BehaviourEngine.CONNECTION_REMOVED = 1;
    BehaviourEngine.CONNECTION_REMOVED_FULLY = 0;

    BehaviourEngine.events = ['activate', 'append', 'beforeActivate', 'beforeEmpty', 'create', 'enable', 'remove'];

    BehaviourEngine.viewpoints = {
        'GLOBAL': 0,
        'SINGLE': 1
    };

    /**
     * @static
     * @function
     *
     * @param {Object.<String, *>} state
     * @returns {Object.<String, *>} The wiring state normalized.
     */
    BehaviourEngine.normalizeWiring = function normalizeWiring(state) {
        var element, i, key, wiringState;

        wiringState = {
            'version': "2.0",
            'connections': [],
            'operators': {},
            'visualdescription': {
                'behavioursenabled': false,
                'behaviours': [],
                'components': {
                    'operator': {},
                    'widget': {}
                },
                'connections': []
            }
        };

        if (typeof state !== 'object') {
            return wiringState;
        }

        if (state.version === "2.0") {
            if (Array.isArray(state.connections)) {
                wiringState.connections = state.connections;
            }

            if (typeof state.operators === 'object') {
                wiringState.operators = state.operators;
            }

            if (typeof state.visualdescription === 'object') {
                if (typeof state.visualdescription.behavioursenabled === 'boolean') {
                    wiringState.visualdescription.behavioursenabled = state.visualdescription.behavioursenabled;
                }

                if (Array.isArray(state.visualdescription.behaviours)) {
                    wiringState.visualdescription.behaviours = state.visualdescription.behaviours;
                }

                if (typeof state.visualdescription.components === 'object') {
                    wiringState.visualdescription.components = state.visualdescription.components;
                }

                if (Array.isArray(state.visualdescription.connections)) {
                    wiringState.visualdescription.connections = state.visualdescription.connections;
                }
            }
        } else {
            //TODO: old version 1.0 supported?
        }

        return StyledElements.Utils.cloneObject(wiringState);
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.activateBehaviour = function activateBehaviour(behaviour, toggleViewpoint) {
        if (this.behavioursEnabled) {
            if (typeof toggleViewpoint !== 'boolean') {
                toggleViewpoint = false;
            }

            this.dispatchEvent('beforeActivate')({
                'behaviour': this.currentBehaviour,
                'behaviourEngine': this
            });

            desactivateAllExcept.call(this, behaviour);

            if (toggleViewpoint) {
                if (this.currentViewpoint == BehaviourEngine.viewpoints.GLOBAL) {
                    this.currentViewpoint = BehaviourEngine.viewpoints.SINGLE;
                    this.btnViewpoint.setLabel("Single");
                    this.btnEnable.hide();
                } else {
                    this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;
                    this.btnViewpoint.setLabel("Global");
                    this.btnEnable.show();
                }
            }

            this.dispatchEvent('activate')({
                'behaviour': this.currentBehaviour,
                'behaviourEngine': this,
                'globalViewpoint': this.globalViewpointActive()
            });
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.appendBehaviour = function appendBehaviour(behaviour) {
        this._appendBehaviour(behaviour);

        behaviour.btnActivate.addEventListener('click', function (event) {
            behaviour.dispatchEvent('activate')({
                'behaviour': behaviour,
                'behaviourEngine': this,
            }, event);
        }.bind(this));

        behaviour.btnActivate.addEventListener('dblclick', function (event) {
            behaviour.dispatchEvent('activate.dblclick')({
                'behaviour': behaviour,
                'behaviourEngine': this,
            }, event);
        }.bind(this));

        behaviour.titleElement.addEventListener('click', function (event) {
            behaviour.dispatchEvent('open')({
                'behaviour': behaviour,
                'behaviourEngine': this,
            }, event);
        }.bind(this));

        if (behaviour.active || !this.currentBehaviour) {
            desactivateAllExcept.call(this, behaviour);
        }

        this.dispatchEvent('append')({
            'behaviour': behaviour,
            'behaviourEngine': this
        });

        return this;
    };

    /**
     * Remove the set of behaviours saved.
     * @public
     * @function
     *
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.empty = function empty() {
        delete this.currentBehaviour;
        delete this.currentState;
        delete this.currentViewpoint;

        this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;
        this.emptyBehaviourList();

        return this;
    };

    BehaviourEngine.prototype.cleanComponentGroup = function cleanComponentGroup(componentType, idList) {
        var componentList, i, id;

        componentList = Object.keys(this.currentState.components[componentType]);

        for (i = 0; i < this.behaviourList.length; i++) {
            this.behaviourList[i].cleanComponentGroup(componentType, idList);
        }

        for (i = 0; i < componentList.length; i++) {
            id = componentList[i];

            if (idList.indexOf(id) == -1) {
                delete this.currentState.components[componentType][id];
            }
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.containsComponent = function containsComponent(componentType, componentId) {
        var i, found;

        if (this.behavioursEnabled) {
            for (found = false, i = 0; !found && i < this.behaviourList.length; i++) {
                if (this.behaviourList[i].containsComponent(componentType, componentId)) {
                    found = true;
                }
            }
        } else {
            found = componentId in this.currentState.components[componentType];
        }

        return found;
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Boolean} If that connection is saved.
     */
    BehaviourEngine.prototype.containsConnection = function containsConnection(sourceName, targetName) {
        var found, i;

        if (this.behavioursEnabled) {
            for (found = false, i = 0; !found && i < this.behaviourList.length; i++) {
                if (this.behaviourList[i].containsConnection(sourceName, targetName)) {
                    found = true;
                }
            }
        } else {
            found = this.getConnectionIndex(sourceName, targetName) != -1;
        }

        return found;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {Array.<Behaviour>} The behaviours that contain to the component given.
     */
    BehaviourEngine.prototype.getByComponent = function getByComponent(componentType, componentId) {
        var behaviourList, i;

        behaviourList = [];

        if (this.behavioursEnabled) {
            for (i = 0; i < this.behaviourList.length; i++) {
                if (this.behaviourList[i].containsComponent(componentType, componentId)) {
                    behaviourList.push(this.behaviourList[i]);
                }
            }
        }

        return behaviourList;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {Object.<String, *>} The current view of the component given.
     */
    BehaviourEngine.prototype.getComponentView = function getComponentView(componentType, componentId) {
        var componentView;

        if (this.behavioursEnabled) {
            switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                componentView = this.currentState.components[componentType][componentId];

                if (!hasComponentView.call(this, componentView)) {
                    componentView = null;
                }
                break;
            case BehaviourEngine.viewpoints.SINGLE:
                if (this.currentBehaviour.hasComponentView(componentType, componentId)) {
                    componentView = this.currentBehaviour.getComponentView(componentType, componentId);
                } else {
                    componentView = this.currentState.components[componentType][componentId];
                }
                break;
            }
        } else {
            componentView = this.currentState.components[componentType][componentId];
        }

        return componentView;
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Number} The index of the connection found.
     */
    BehaviourEngine.prototype.getConnectionIndex = function getConnectionIndex(sourceName, targetName) {
        var connection, found, i, index;

        index = -1;

        for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
            connection = this.currentState.connections[i];

            if (connection.sourcename == sourceName && connection.targetname == targetName) {
                found = true;
                index = i;
            }
        }

        return index;
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Object.<String, *>} The current view of the connection given.
     */
    BehaviourEngine.prototype.getConnectionView = function getConnectionView(sourceName, targetName) {
        var connection, connectionView, found, i;

        switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
                    connection = this.currentState.connections[i];

                    if (connection.sourcename == sourceName && connection.targetname == targetName) {
                        found = true;
                        connectionView = connection;
                    }
                }
                break;
            default:
                break;
        }

        return connectionView;
    };

    /**
     * @public
     * @function
     *
     * @param {Object.<String, *>} state
     * @returns {Object.<String, *>} The wiring state normalized.
     */
    BehaviourEngine.prototype.loadWiring = function loadWiring(state) {
        var i;

        state = BehaviourEngine.normalizeWiring(state);

        this.empty();
        this.behavioursEnabled = state.behavioursenabled;
        this.currentState = state.visualdescription;

        if (this.behavioursEnabled) {
            this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;
            this.btnViewpoint.setLabel("Global");

            for (i = 0; i < this.currentState.behaviours.length; i++) {
                this.appendBehaviour(this.createBehaviour(this.currentState.behaviours[i]));
            }

            if (!this.hasBehaviours()) {
                this.appendBehaviour(this.createBehaviour());
            }
        }

        return state;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.removeBehaviour = function removeBehaviour(behaviour) {
        var found, i, index, oldBehaviour;

        if (typeof behaviour === 'undefined') {
            behaviour = this.currentBehaviour;
        }

        if (this.erasureEnabled && (index=this.getBehaviourIndex(behaviour)) != -1) {
            if (this.currentBehaviour.equals(behaviour)) {
                for (found = false, i = 0; !found && i < this.behaviourList.length; i++) {
                    if (!this.behaviourList[i].equals(behaviour)) {
                        oldBehaviour = this.behaviourList[i];
                        found = true;
                    }
                }
            } else {
                oldBehaviour = this.currentBehaviour;
            }

            this.emptyBehaviour(behaviour);
            this.activateBehaviour(oldBehaviour);
            this._removeBehaviour(behaviour);

            this.dispatchEvent('remove')({
                'behaviour': behaviour,
                'behaviourEngine': this
            });
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.emptyBehaviour = function emptyBehaviour(behaviour) {
        var found, i, index, oldBehaviour;

        if (typeof behaviour === 'undefined') {
            behaviour = this.currentBehaviour;
        }

        if (this.containsBehaviour(behaviour)) {
            if (this.currentBehaviour.equals(behaviour)) {
                oldBehaviour = null;
            } else {
                oldBehaviour = this.currentBehaviour;
                this.activateBehaviour(behaviour);
            }

            this.dispatchEvent('beforeEmpty')({
                'behaviour': behaviour,
                'behaviourEngine': this
            });

            behaviour.empty();

            if (oldBehaviour != null) {
                this.activateBehaviour(oldBehaviour);
            }
        }

        return this;
    };

    BehaviourEngine.prototype.removeComponent = function removeComponent(componentType, componentId, cascadeRemove) {
        var i;

        if (this.readonly) {
            return BehaviourEngine.OPERATION_NOT_ALLOWED;
        }

        if (typeof cascadeRemove !== 'boolean') {
            cascadeRemove = false;
        }

        if (!this.containsComponent(componentType, componentId)) {
            return BehaviourEngine.COMPONENT_NOT_FOUND;
        }

        if (this.behavioursEnabled && this.currentViewpoint == BehaviourEngine.viewpoints.GLOBAL) {
            if (cascadeRemove) {
                for (i = 0; i < this.behaviourList.length; i++) {
                    this.behaviourList[i].removeComponent(componentType, componentId);
                }
            } else {
                if (!this.currentBehaviour.containsComponent(componentType, componentId)) {
                    return BehaviourEngine.COMPONENT_UNREACHABLE;
                }

                this.currentBehaviour.removeComponent(componentType, componentId);

                if (this.containsComponent(componentType, componentId)) {
                    return BehaviourEngine.COMPONENT_REMOVED;
                }
            }
        }

        delete this.currentState.components[componentType][componentId];

        return BehaviourEngine.COMPONENT_REMOVED_FULLY;
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Number} A number that explain what operation was done.
     */
    BehaviourEngine.prototype.removeConnection = function removeConnection(sourceName, targetName, cascadeRemove) {
        var i, index;

        if (this.readonly) {
            return BehaviourEngine.OPERATION_NOT_ALLOWED;
        }

        if (typeof cascadeRemove !== 'boolean') {
            cascadeRemove = false;
        }

        index = this.getConnectionIndex(sourceName, targetName);

        if (index == -1) {
            return BehaviourEngine.CONNECTION_NOT_FOUND;
        }

        if (this.behavioursEnabled && this.currentViewpoint == BehaviourEngine.viewpoints.GLOBAL) {
            if (cascadeRemove) {
                for (i = 0; i < this.behaviourList.length; i++) {
                    this.behaviourList[i].removeConnection(sourceName, targetName);
                }
            } else {
                if (!this.currentBehaviour.containsConnection(sourceName, targetName)) {
                    return BehaviourEngine.CONNECTION_UNREACHABLE;
                }

                this.currentBehaviour.removeConnection(sourceName, targetName);

                if (this.containsConnection(sourceName, targetName)) {
                    return BehaviourEngine.CONNECTION_REMOVED;
                }
            }
        }

        this.currentState.connections.splice(index, 1);

        return BehaviourEngine.CONNECTION_REMOVED_FULLY;
    };

    /**
     * @public
     * @function
     *
     * @returns {Object.<String, *>} The visual part of current wiring state.
     */
    BehaviourEngine.prototype.serialize = function serialize() {
        var wiringState, i;

        wiringState = BehaviourEngine.normalizeWiring();
        wiringState.visualdescription.behavioursenabled = this.behavioursEnabled;

        wiringState.visualdescription.components = this.currentState.components;
        wiringState.visualdescription.connections = this.currentState.connections;

        if (this.behavioursEnabled) {
            for (i = 0; i < this.behaviourList.length; i++) {
                wiringState.visualdescription.behaviours.push(this.behaviourList[i].serialize());
            }
        }

        return StyledElements.Utils.cloneObject(wiringState);
    };

    BehaviourEngine.prototype.globalViewpointActive = function globalViewpointActive() {
        return this.currentViewpoint == BehaviourEngine.viewpoints.GLOBAL;
    }

    BehaviourEngine.prototype.toggleViewpoint = function toggleViewpoint() {
        this.activateBehaviour(this.currentBehaviour, true);

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @param {Object.<String, *>} componentView
     * @param {Boolean} updateOnly
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.updateComponent = function updateComponent(componentType, componentId, componentView, updateOnly) {
        componentView = StyledElements.Utils.cloneObject(componentView);

        if (this.readonly) {
            return this;
        }

        if (typeof updateOnly !== 'boolean') {
            updateOnly = false;
        }

        if (this.behavioursEnabled) {
            switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                if (updateOnly) {
                    if (componentId in this.currentState.components[componentType]) {
                        this.currentState.components[componentType][componentId] = componentView;
                    }
                } else {
                    this.currentState.components[componentType][componentId] = componentView;
                    this.currentBehaviour.updateComponent(componentType, componentId);
                }
                break;
            case BehaviourEngine.viewpoints.SINGLE:
                if (updateOnly) {
                    if (this.currentBehaviour.containsComponent(componentType, componentId)) {
                        this.currentBehaviour.updateComponent(componentType, componentId, componentView);
                    }
                }
                break;
            }
        } else {
            this.currentState.components[componentType][componentId] = componentView;
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Object.<String, *>} connectionView
     * @param {Boolean} [updateOnly]
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.updateConnection = function updateConnection(connectionView, updateOnly) {
        var found, i, index;

        if (this.readonly) {
            return this;
        }

        connectionView = StyledElements.Utils.cloneObject(connectionView);

        if (typeof updateOnly !== 'boolean') {
            updateOnly = false;
        }

        if (this.behavioursEnabled) {
            switch (this.currentViewpoint) {
                case BehaviourEngine.viewpoints.GLOBAL:
                    for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
                        if (this.currentState.connections[i].sourcename == connectionView.sourcename &&
                            this.currentState.connections[i].targetname == connectionView.targetname) {
                            found = true;
                            index = i;
                        }
                    }

                    if (updateOnly) {
                        if (found) {
                            this.currentState.connections[index] = connectionView;
                        }
                    } else {
                        if (found) {
                            this.currentState.connections[index] = connectionView;
                        } else {
                            this.currentState.connections.push(connectionView);
                        }
                        this.currentBehaviour.updateConnection(connectionView);
                    }
                    break;
                default:
                    break;
            }
        } else {
            for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
                if (this.currentState.connections[i].sourcename == connectionView.sourcename &&
                    this.currentState.connections[i].targetname == connectionView.targetname) {
                    this.currentState.connections[i] = connectionView;
                    found = true;
                }
            }

            if (!found) {
                this.currentState.connections.push(connectionView);
            }
        }

        return this;
    };

    /**
     * @private
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    var desactivateAllExcept = function desactivateAllExcept(behaviour) {
        var i, found;

        for (found = false, i = 0; i < this.behaviourList.length; i++) {
            this.behaviourList[i].active = false;

            if (!found && this.behaviourList[i].equals(behaviour)) {
                this.currentBehaviour = this.behaviourList[i];
                found = true;
            }
        }

        this.currentBehaviour.active = true;

        return this;
    };

    /**
     * @private
     * @function
     */
    var hasComponentView = function hasComponentView(view) {
        return typeof view === 'object' && view != null && Object.keys(view).length > 0;
    };

    return BehaviourEngine;

})();
