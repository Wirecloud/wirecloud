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

/*globals gettext, StyledElements, Wirecloud */


Wirecloud.ui.WiringEditor.Behaviour = (function () {

    'use strict';

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    var Behaviour = function Behaviour(data, index, options) {
        data = Behaviour.normalize(data, index);
        this.eventTarget = buildEventTarget.call(this, data);

        this.title = data.title;
        this.description = data.description;

        this.components  = data.components;
        this.connections = data.connections;

        Object.defineProperty(this, 'active', {
            'get': function get() {
                return this.eventTarget.classList.contains('active');
            },
            'set': function set(value) {
                if (value) {
                    this.eventTarget.classList.add('active');
                } else {
                    this.eventTarget.classList.remove('active');
                }
            }
        });

        updateCounterList.call(this);
        this.active = data.active;
    };

    // ==================================================================================
    // STATIC METHODS
    // ==================================================================================

    Behaviour.normalize = function normalize(data, index) {
        if (typeof data !== 'object') {
            data = {
                'title': 'Behaviour_' + index,
                'description': 'No description given.',
                'active': false,
                'components': {'ioperator': {}, 'iwidget': {}},
                'connections': []
            };
        }

        if (typeof data.title !== 'string' || !data.title.length) {
            data.title = 'Behaviour_' + index;
        }

        if (typeof data.description !== 'string' || !data.description.length) {
            data.description = 'No description given.';
        }

        if (typeof data.active !== 'boolean') {
            data.active = false;
        }

        if (typeof data.components !== 'object') {
            data.components = {'iwidget': {}, 'ioperator': {}};
        }

        if (!Array.isArray(data.connections)) {
            data.connections = [];
        }

        return data;
    };

    // ==================================================================================
    // PUBLIC METHODS
    // ==================================================================================

    Behaviour.prototype = {

        'addEventListener': function addEventListener(eventType, eventHandler) {
            this.eventTarget.addEventListener(eventType, function (event) {
                eventHandler(this, event);
            }.bind(this));

            return this;
        },

        'containsComponent': function containsComponent(type, id) {
            return id in this.components[type];
        },

        'equals': function equals(behaviour) {
            return (behaviour instanceof Behaviour) && Object.is(this, behaviour);
        },

        'hasView': function hasView(type, id) {
            return Object.keys(this.components[type][id]).length;
        },

        'removeComponent': function removeComponent(type, id) {
            delete this.components[type][id];
            updateCounterList.call(this);

            return this;
        },

        'saveSettings': function saveSettings(data) {
            var prop;

            if (data.title && data.title.length) {
                this.title = data.title;
                this.titleElement.innerHTML = data.title;
            }

            if (data.description && data.description.length) {
                this.description = data.description;
                this.descriptionElement.innerHTML = data.description;
            }

            return this;
        },

        'serialize': function serialize() {
            var data = {
                title: this.title,
                description: this.description,
                active: this.active,
                components: this.components,
                connections: this.connections
            };

            return data;
        },

        'updateComponent': function updateComponent(type, id, view) {
            if (this.containsComponent(type, id)) {
                if (typeof view !== 'undefined') {
                    this.components[type][id] = view;
                }
            } else {
                if (typeof view !== 'undefined') {
                    this.components[type][id] = view;
                } else {
                    this.components[type][id] = {};
                }
            }

            updateCounterList.call(this);

            return this;
        },

        'viewOf': function viewOf(type, id) {
            return this.components[type][id];
        }

    };

    // ==================================================================================
    // PRIVATE METHODS
    // ==================================================================================

    var buildEventTarget = function buildEventTarget(data) {
        var eventTarget;

        eventTarget = document.createElement('div');
        eventTarget.className = 'behaviour';
        eventTarget.innerHTML =
            '<div class="behaviour-header">' +
            '<span class="title">' + data.title + '</span>' +
            '<span class="option icon-cog"></span>' +
            '</div>' +
            '<div class="behaviour-body">' +
                data.description +
            '</div>' + 
            '<div class="behaviour-counters">' +
                '<div class="badge badge-connection"></div>' +
                '<div class="badge badge-ioperator"></div>' +
                '<div class="badge badge-iwidget"></div>' +
            '</div>';

        this.ioptCounter = eventTarget.querySelector('.badge-ioperator');
        this.iwgtCounter = eventTarget.querySelector('.badge-iwidget');
        this.cnctCounter = eventTarget.querySelector('.badge-connection');

        this.title = eventTarget.querySelector('.title');
        this.description = eventTarget.querySelector('.behaviour-body');
        this.preferences = eventTarget.querySelector('.option.icon-cog');

        return eventTarget;
    };

    var updateCounterList = function updateCounterList() {
        this.ioptCounter.innerHTML = Object.keys(this.data.components.ioperator).length;
        this.iwgtCounter.innerHTML = Object.keys(this.data.components.iwidget).length;
        this.cnctCounter.innerHTML = this.data.connections.length;

        return this;
    };

    return Behaviour;

})();
