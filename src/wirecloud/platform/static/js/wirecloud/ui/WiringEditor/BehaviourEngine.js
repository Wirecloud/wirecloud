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

        this.currentViewpoint = BehaviourEngine.viewpoints.GLOBAL;
    };

    StyledElements.Utils.inherit(BehaviourEngine, null,
        StyledElements.EventManagerMixin, Wirecloud.ui.WiringEditor.BehaviourManagerMixin);

    BehaviourEngine.events = ['activate', 'append', 'beforeActivate', 'beforeRemove'];

    BehaviourEngine.viewpoints = {
        'GLOBAL': 0,
        'INDEPENDENT': 1
    };

    /**
     * @static
     * @function
     *
     * @param {Object.<String, *>} state
     * @param {Boolean} [exhaustive=false]
     * @returns {Object.<String, *>} The wiring state normalized.
     */
    BehaviourEngine.normalizeWiring = function normalizeWiring(state, exhaustive) {
        var i;

        if (typeof exhaustive !== 'boolean') {
            exhaustive = false;
        }

        if (typeof state !== 'object') {
            state = {};
        }

        if (!Array.isArray(state.connections)) {
            state.connections = [];
        }

        if (typeof state.operators !== 'object') {
            state.operators = {};
        }

        if (exhaustive) {
            if (typeof state.visual_part !== 'object') {
                state.visual_part = {
                    behaviours: [],
                    components: {
                        operator: {},
                        widget: {}
                    },
                    connections: []
                };
            }

            if (!Array.isArray(state.visual_part.behaviours)) {
                state.visual_part.behaviours = [];
            }

            for (i = 0; i < state.visual_part.behaviours.length; i++) {
                if (typeof state.visual_part.behaviours[i] !== 'object') {
                    state.visual_part.behaviours[i] = {
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    };
                }

                if (typeof state.visual_part.behaviours[i].components !== 'object') {
                    state.visual_part.behaviours[i].components = {};
                }

                if (!Array.isArray(state.visual_part.behaviours[i].connections)) {
                    state.visual_part.behaviours[i].connections = [];
                }
            }

            if (typeof state.visual_part.components !== 'object') {
                state.visual_part.components = {};
            }

            if (!Array.isArray(state.visual_part.connections)) {
                state.visual_part.connections = [];
            }
        }

        return StyledElements.Utils.cloneObject(state);
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.activateBehaviour = function activateBehaviour(behaviour) {
        this.dispatchEvent('beforeActivate')({
            'behaviour': this.currentBehaviour,
            'behaviourEngine': this
        });

        desactivateAllExcept.call(this, behaviour);

        this.dispatchEvent('activate')({
            'behaviour': this.currentBehaviour,
            'behaviourEngine': this
        });

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

        behaviour.headingElement.addEventListener('click', function (event) {
            behaviour.dispatchEvent('click')({
                'behaviour': behaviour,
                'behaviourEngine': this,
            }, event);
        }.bind(this));

        behaviour.bodyElement.addEventListener('click', function (event) {
            behaviour.dispatchEvent('info.click')({
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

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.containsComponent = function containsComponent(type, id) {
        var i, found;

        for (found = false, i = 0; !found && i < this.behaviourList.length; i++) {
            if (this.behaviourList[i].containsComponent(componentType, componentId)) {
                found = true;
            }
        }

        return found;
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

        switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                componentView = this.currentState.components[componentType][componentId];
                break;
            default:
                break;
        }

        return componentView;
    };

    /**
     * @public
     * @function
     *
     * @param {String} connectionId
     * @returns {Object.<String, *>} The current view of the component given.
     */
    BehaviourEngine.prototype.getConnectionView = function getConnectionView(connectionId) {
        var connectionView, found, i;

        switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
                    if (this.currentState.connections[i].id == connectionId) {
                        connectionView = this.currentState.connections[i];
                        found = true;
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
        this.currentState = state.visual_part;

        for (i = 0; i < this.currentState.behaviours.length; i++) {
            this.appendBehaviour(this.createBehaviour(this.currentState.behaviours[i]));
        }

        if (!this.hasBehaviours()) {
            this.appendBehaviour(this.createBehaviour());
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

        if (this.erasureEnabled && (index=this.getBehaviourIndexOf(behaviour)) != -1) {
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

            this.activateBehaviour(behaviour);
            this.dispatchEvent('beforeRemove')({
                'behaviour': behaviour,
                'behaviourEngine': this
            });

            this.activateBehaviour(oldBehaviour);
            this._removeBehaviour(behaviour);
        }

        return this;
    };

    BehaviourEngine.prototype.removeComponent = function removeComponent(componentType, componentId, cascadeRemove) {
        var i;

        if (typeof cascadeRemove !== 'boolean') {
            cascadeRemove = false;
        }

        if (!this.containsComponent(componentType, componentId)) {
            return -1;
        }

        if (cascadeRemove) {
            for (i = 0; i < this.behaviourList.length; i++) {
                this.behaviourList[i].removeComponent(componentType, componentId);
            }
        } else {
            if (!this.currentBehaviour.containsComponent(componentType, componentId)) {
                return 0;
            }

            this.currentBehaviour.removeComponent(componentType, componentId);

            if (this.containsComponent(componentType, componentId)) {
                return 1;
            }
        }

        delete this.currentState.components[componentType][componentId];

        return 2;
    };

    /**
     * @public
     * @function
     *
     * @param {String} connectionId
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.removeConnection = function removeConnection(connectionId) {
        var found, i;

        for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
            if (this.currentState.connections[i].id == connectionId) {
                this.currentState.connections.splice(i, 1);
                found = true;
            }
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @returns {Object.<String, *>} The visual part of current wiring state.
     */
    BehaviourEngine.prototype.serialize = function serialize() {
        var visualPart, i;

        visualPart = {
            components: this.currentState.components,
            connections: this.currentState.connections,
            behaviours: []
        };

        for (i = 0; i < this.behaviourList.length; i++) {
            visualPart.behaviours.push(this.behaviourList[i]);
        }

        return StyledElements.Utils.cloneObject(visualPart);
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @param {Object.<String, *>} componentView
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.updateComponent = function updateComponent(componentType, componentId, componentView) {
        componentView = StyledElements.Utils.cloneObject(componentView);

        switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                this.currentState.components[componentType][componentId] = componentView;
                this.currentBehaviour.updateComponent(componentType, componentId);
                break;
            default:
                break;
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentId
     * @param {Object.<String, *>} componentView
     * @returns {BehaviourEngine} The instance on which this function was called.
     */
    BehaviourEngine.prototype.updateConnection = function updateConnection(connectionId, connectionView) {
        var found, i;

        componentView = StyledElements.Utils.cloneObject(componentView);

        switch (this.currentViewpoint) {
            case BehaviourEngine.viewpoints.GLOBAL:
                for (found = false, i = 0; !found && i < this.currentState.connections.length; i++) {
                    if (this.currentState.connections[i].id == connectionId) {
                        this.currentState.connections[i] = connectionView;
                        found = true;
                    }
                }

                if (!found) {
                    this.currentState.components.push(componentView);
                }

                this.currentBehaviour.updateConnection(connectionId);
                break;
            default:
                break;
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

    return BehaviourEngine;

})();
