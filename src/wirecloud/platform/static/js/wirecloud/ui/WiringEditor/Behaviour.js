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


Wirecloud.ui.WiringEditor.Behaviour = (function () {

    "use strict";

    /**
     * Create a new instance of class Behaviour.
     * @class
     *
     * @param {Object.<String, *>} data
     * @param {Number} index
     * @param {Object.<String, *>} [options]
     */
    var Behaviour = function Behaviour(data, index, options) {
        var bodyElement, headingElement, optionsElement;

        StyledElements.EventManagerMixin.call(this, Behaviour.events);
        data = Behaviour.normalize(data, index);

        this.title = data.title;
        this.description = data.description;

        this.titleElement = document.createElement('span');
        this.titleElement.className = "panel-title behaviour-title";
        this.titleElement.textContent = this.title;

        this.btnActivate = new StyledElements.Button({
            'title': gettext("Activate"),
            'class': 'btn-activate',
            'iconClass': 'icon-plus'
        });

        this.btnShowSettings = new StyledElements.Button({
            'title': gettext("Settings"),
            'class': 'btn-show-settings',
            'iconClass': 'icon-tasks'
        });

        optionsElement = document.createElement('span');
        optionsElement.className = "panel-options";
        optionsElement.appendChild(this.btnShowSettings.wrapperElement);
        optionsElement.appendChild(this.btnActivate.wrapperElement);

        headingElement = document.createElement('div');
        headingElement.className = "panel-heading";
        headingElement.appendChild(this.titleElement);
        headingElement.appendChild(optionsElement);

        this.descriptionElement = document.createElement('p');
        this.descriptionElement.className = "behaviour-description";
        this.descriptionElement.textContent = this.description;

        bodyElement = document.createElement('div');
        bodyElement.className = "panel-body";
        bodyElement.appendChild(this.descriptionElement);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "panel behaviour";
        this.wrapperElement.appendChild(headingElement);
        this.wrapperElement.appendChild(bodyElement);

        this.components = data.components;
        this.connections = data.connections;

        Object.defineProperty(this, 'active', {
            'get': function get() {
                return this.wrapperElement.classList.contains('active');
            },
            'set': function set(state) {
                if (state) {
                    this.wrapperElement.classList.add('active');
                } else {
                    this.wrapperElement.classList.remove('active');
                }
            }
        });

        this.active = data.active;
    };

    StyledElements.Utils.inherit(Behaviour, null, StyledElements.EventManagerMixin);

    Behaviour.events = ['activate', 'activate.dblclick', 'open'];

    Behaviour.normalize = function normalize(data, index) {
        if (typeof data !== 'object') {
            data = {
                active: false,
                title: "New behaviour " + index,
                description: "No description provided.",
                components: {
                    operator: {},
                    widget: {}
                },
                connections: []
            };
        }

        if (typeof data.active !== 'boolean') {
            data.active = false;
        }

        if (typeof data.title !== 'string' || !data.title.length) {
            data.title = "New behaviour " + index;
        }

        if (typeof data.description !== 'string' || !data.description.length) {
            data.description = "No description provided.";
        }

        if (typeof data.components !== 'object') {
            data.components = {
                operator: {},
                widget: {}
            };
        }

        if (!Array.isArray(data.connections)) {
            data.connections = [];
        }

        return data;
    };

    Behaviour.prototype.cleanComponentGroup = function cleanComponentGroup(componentType, idList) {
        var componentList, i, id;

        componentList = Object.keys(this.components[componentType]);

        for (i = 0; i < componentList.length; i++) {
            id = componentList[i];

            if (idList.indexOf(id) == -1) {
                delete this.components[componentType][id];
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
     * @returns {Boolean} If the component given is saved.
     */
    Behaviour.prototype.containsComponent = function containsComponent(componentType, componentId) {
        return componentId in this.components[componentType];
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Boolean} If the connection given is saved.
     */
    Behaviour.prototype.containsConnection = function containsConnection(sourceName, targetName) {
        var connection, found, i;

        for (found = false, i = 0; !found && i < this.connections.length; i++) {
            connection = this.connections[i];

            if (connection.sourcename == sourceName && connection.targetname == targetName) {
                found = true;
            }
        }

        return found;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {Boolean} If the behaviour given is the same behaviour saved.
     */
    Behaviour.prototype.empty = function empty() {
        this.connections.length = 0;
        this.components = {
            'operator': {},
            'widget': {}
        };

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Behaviour} behaviour
     * @returns {Boolean} If the behaviour given is the same behaviour saved.
     */
    Behaviour.prototype.equals = function equals(behaviour) {
        return (behaviour instanceof Behaviour) && Object.is(this, behaviour);
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {Boolean} If the component given has view registered.
     */
    Behaviour.prototype.hasComponentView = function hasComponentView(componentType, componentId) {
        return Object.keys(this.components[componentType][componentId]).length;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {Object.<String, *>} The current view of the component given.
     */
    Behaviour.prototype.getComponentView = function getComponentView(componentType, componentId) {
        return this.components[componentType][componentId];
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Number} The index of the connection found.
     */
    Behaviour.prototype.getConnectionIndex = function getConnectionIndex(sourceName, targetName) {
        var connection, found, i, index;

        index = -1;

        for (found = false, i = 0; !found && i < this.connections.length; i++) {
            connection = this.connections[i];

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
     * @param {String} connectionId
     * @returns {Object.<String, *>} The current view of the component given.
     */
    Behaviour.prototype.getConnectionView = function getConnectionView(connectionId) {
        var connectionView, found, i;

        for (found = false, i = 0; !found && i < this.connections.length; i++) {
            if (this.connections[i].id == connectionId) {
                connectionView = this.connections[i];
                found = true;
            }
        }

        return connectionView;
    };

    Behaviour.prototype.getInfo = function getInfo() {
        return StyledElements.Utils.cloneObject({
            'title': this.title,
            'description': this.description
        });
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @returns {Behaviour} The instance on which this function was called.
     */
    Behaviour.prototype.removeComponent = function removeComponent(componentType, componentId) {
        delete this.components[componentType][componentId];

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} sourceName
     * @param {String} targetName
     * @returns {Behaviour} The instance on which this function was called.
     */
    Behaviour.prototype.removeConnection = function removeConnection(sourceName, targetName) {
        var index;

        if ((index=this.getConnectionIndex(sourceName, targetName)) != -1) {
            this.connections.splice(index, 1);
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @returns {Object.<String, *>} The current information saved.
     */
    Behaviour.prototype.serialize = function serialize() {
        var data = {
            active: this.active,
            title: this.title,
            description: this.description,
            components: this.components,
            connections: this.connections
        };

        return StyledElements.Utils.cloneObject(data);
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {String} componentId
     * @param {Object.<String, *>} componentView
     * @returns {Behaviour} The instance on which this function was called.
     */
    Behaviour.prototype.updateComponent = function updateComponent(componentType, componentId, componentView) {
        if (typeof componentView === 'undefined') {
            componentView = {};
        }

        if (this.containsComponent(componentType, componentId) && this.hasComponentView(componentType, componentId)) {
            if (Object.keys(componentView).length > 0) {
                this.components[componentType][componentId] = componentView;
            }
        } else {
            this.components[componentType][componentId] = componentView;
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Object.<String, *>} data
     * @returns {Behaviour} The instance on which this function was called.
     */
    Behaviour.prototype.updateConnection = function updateConnection(connectionView) {
        var found, i;

        for (found = false, i = 0; !found && i < this.connections.length; i++) {
            if (this.connections[i].sourcename == connectionView.sourcename &&
                this.connections[i].targetname == connectionView.targetname) {
                this.connections[i] = {
                    'sourcename': connectionView.sourcename,
                    'targetname': connectionView.targetname
                };
                found = true;
            }
        }

        if (!found) {
            this.connections.push({
                'sourcename': connectionView.sourcename,
                'targetname': connectionView.targetname
            });
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {Object.<String, *>} data
     * @returns {Behaviour} The instance on which this function was called.
     */
    Behaviour.prototype.updateInfo = function updateInfo(data) {
        var prop;

        if (typeof data.title === 'string' && data.title.length) {
            this.title = data.title;
            this.titleElement.textContent = data.title;
        }

        if (typeof data.description === 'string' && data.description.length) {
            this.description = data.description;
            this.descriptionElement.textContent = data.description;
        }

        return this;
    };

    return Behaviour;

})();
