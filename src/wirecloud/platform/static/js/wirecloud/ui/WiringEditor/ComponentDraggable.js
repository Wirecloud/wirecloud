/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class ComponentDraggable.
     * @extends {Panel}
     *
     * @constructor
     * @param {Wiring.Component} wiringComponent
     *      [TODO: description]
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.ComponentDraggable = function ComponentDraggable(wiringComponent, options) {

        options = utils.updateObject(ns.ComponentDraggable.JSON_TEMPLATE, options);

        this.title_tooltip = new se.Tooltip({content: wiringComponent.title, placement: ["top", "bottom", "right", "left"]});
        this.btnPrefs = new se.PopupButton({
            title: utils.gettext("Preferences"),
            class: "we-prefs-btn",
            iconClass: "fa fa-reorder"
        });
        this.btnPrefs.popup_menu.append(new ns.ComponentDraggablePrefs(this));

        this.btnRemove = new se.Button({
            title: utils.gettext("Remove"),
            class: "btn-remove",
            iconClass: "fa fa-times-circle"
        });
        this.btnRemove.addEventListener('click', btnremove_onclick.bind(this));

        se.Panel.call(this, {
            title: wiringComponent.title,
            events: events,
            class: "component-draggable component-" + wiringComponent.meta.type,
            buttons: [this.btnPrefs, this.btnRemove]
        });

        this._component = wiringComponent;

        this.endpoints = {
            source: new ns.EndpointGroup('source', this, ns.SourceEndpoint),
            target: new ns.EndpointGroup('target', this, ns.TargetEndpoint)
        };

        this.body
            .appendChild(this.endpoints.target)
            .appendChild(this.endpoints.source);

        var removeAllowed = true;

        Object.defineProperties(this, {

            id: {value: wiringComponent.id},

            background: {
                get: function get() {return this.hasClassName('background');},
                set: function set(value) {this._onbackground(value);}
            },

            collapsed: {
                get: function get() {return this.hasClassName('collapsed');},
                set: function set(value) {this._oncollapsed(value);}
            },

            missing: {
                get: function get() {return this._component.missing;}
            },

            readonly: {
                get: function get() {return this.hasClassName('readonly');},
                set: function set(value) {this.toggleClassName('readonly', value);}
            },

            removeAllowed: {
                get: function get() {return removeAllowed;},
                set: function set(value) {
                    removeAllowed = !!value;
                    if (!this.background) {
                        updateFlagRemoveAllowed.call(this);
                    }
                }
            },

            removeCascadeAllowed: {value: options.removecascade_allowed, writable: true},

            orderingEndpoints: {
                get: function get() {return this.endpoints.source.orderable || this.endpoints.target.orderable;}
            },

            sources: {
                get: function get() {return this.endpoints.source.endpoints;}
            },

            sourceList: {
                get: function get() {return this.endpoints.source.children;}
            },

            targets: {
                get: function get() {return this.endpoints.target.endpoints;}
            },

            targetList: {
                get: function get() {return this.endpoints.target.children;}
            },

            type: {value: wiringComponent.meta.type}

        });

        this.get().setAttribute('data-id', this.id);

        this.title_tooltip = new se.Tooltip({content: wiringComponent.title, placement: ["top", "bottom", "right", "left"]});

        this.heading.noticeTitle = document.createElement('span');
        this.heading.noticeTitle.className = "label label-danger";
        this.heading.noticeTitle.addEventListener('mousedown', utils.stopPropagationListener, true);
        this.heading.noticeTitle.addEventListener('click', noticetitle_onclick.bind(this));

        this.heading.notice = document.createElement('div');
        this.heading.notice.className = "component-notice";
        this.heading.notice.appendChild(this.heading.noticeTitle);

        this._endpoint_onconnectionadded_bound = endpoint_onconnectionadded.bind(this);
        this._endpoint_onconnectionremoved_bound = endpoint_onconnectionremoved.bind(this);

        appendEndpoints.call(this, 'source', wiringComponent.meta.outputList.map(function (data) {return wiringComponent.outputs[data.name];}));
        appendEndpoints.call(this, 'target', wiringComponent.meta.inputList.map(function (data) {return wiringComponent.inputs[data.name];}));

        var name, endpoint;

        for (name in wiringComponent.outputs) {
            endpoint = wiringComponent.outputs[name];
            if (endpoint.missing) {
                this.appendEndpoint('source', endpoint);
            }
        }

        for (name in wiringComponent.inputs) {
            endpoint = wiringComponent.inputs[name];
            if (endpoint.missing) {
                this.appendEndpoint('target', endpoint);
            }
        }

        wiringComponent.logManager.addEventListener('newentry', notifyErrors.bind(this));

        if (!this.missing) {
            this.endpoints.source.orderEndpoints(options.endpoints.source);
            this.endpoints.target.orderEndpoints(options.endpoints.target);
        }

        if (options.collapsed) {
            this.collapsed = true;
        }

        this.position(options.position);

        this._on_change_model = on_change_model.bind(this);

        notifyErrors.call(this);
        makeDraggable.call(this);

        this.wrapperElement.addEventListener('dblclick', utils.stopPropagationListener);
        wiringComponent.addEventListener('change', this._on_change_model);
    };

    ns.ComponentDraggable.JSON_TEMPLATE = {
        name: "",
        position: {
            x: 0,
            y: 0
        },
        collapsed: false,
        endpoints: {
            source: [],
            target: []
        },
        removecascade_allowed: false
    };

    ns.ComponentDraggable.MINOFFSET_X = 20;
    ns.ComponentDraggable.MINOFFSET_Y = 10;

    utils.inherit(ns.ComponentDraggable, se.Panel, {

        _onactive: function _onactive(active) {

            if (this.orderingEndpoints) {
                return this;
            }

            return this.forEachEndpoint(function (endpoint) {
                endpoint.forEachConnection(function (connection) {
                    connection.highlighted = active;
                });
            });
        },

        _onbackground: function _onbackground(background) {

            this.toggleClassName('background', background);

            return background ? this._showButtonAdd() : updateFlagRemoveAllowed.call(this);
        },

        _onclick: function _onclick(event) {

            if (this.orderingEndpoints) {
                return this;
            }

            return se.Panel.prototype._onclick.call(this, event);
        },

        _oncollapsed: function _oncollapsed(collapsed) {
            var offsetWidth = this.get().offsetWidth;

            if (this.collapsed === collapsed) {
                return this;
            }

            this.toggleClassName('collapsed', collapsed);

            if (collapsed) {
                collapseEndpoints.call(this, offsetWidth);
            } else {
                expandEndpoints.call(this, offsetWidth);
            }

            this.refresh().dispatchEvent('change', {
                collapsed: collapsed,
                position: this.position()
            });

            return this;
        },

        _showButtonAdd: function _showButtonAdd() {

            this.btnRemove
                .replaceClassName('btn-remove', 'btn-add')
                .removeIconClassName(['fa-trash', 'fa-times-circle'])
                .addIconClassName('fa-plus-circle')
                .setTitle(utils.gettext("Add"));

            return this;
        },

        _showButtonDelete: function _showButtonDelete() {

            this.btnRemove
                .replaceClassName('btn-add', 'btn-remove')
                .removeIconClassName(['fa-plus-circle', 'fa-trash'])
                .addIconClassName('fa-times-circle')
                .setTitle(utils.gettext("Remove"));

            return this;
        },

        _showButtonRemove: function _showButtonRemove() {

            this.btnRemove
                .replaceClassName('btn-add', 'btn-remove')
                .removeIconClassName(['fa-plus-circle', 'fa-times-circle'])
                .addIconClassName('fa-trash')
                .setTitle(utils.gettext("Remove"));

            return this;
        },

        appendEndpoint: function appendEndpoint(type, wiringEndpoint) {
            var endpoint = this.endpoints[type].appendEndpoint(wiringEndpoint);

            endpoint.addEventListener('connectionadded', endpoint_onconnectionadded.bind(this));
            endpoint.addEventListener('connectionremoved', endpoint_onconnectionremoved.bind(this));
            this.dispatchEvent('endpointadded', endpoint);

            return this;
        },

        equals: function equals(component) {

            if (!(component instanceof ns.ComponentDraggable)) {
                return false;
            }

            return this.type === component.type && this.id === component.id;
        },

        getEndpoint: function getEndpoint(type, name) {
            return this.endpoints[type].getEndpoint(name);
        },

        forEachConnection: function forEachConnection(callback) {
            return this.forEachEndpoint(function (endpoint) {
                endpoint.forEachConnection(function (connection) {
                    callback(connection);
                });
            });
        },

        forEachEndpoint: function forEachEndpoint(callback) {

            this.targetList.forEach(function (endpoint, index) {
                callback(endpoint, index);
            });

            this.sourceList.forEach(function (endpoint, index) {
                callback(endpoint, index);
            });

            return this;
        },

        hasConnections: function hasConnections() {
            var found = false;

            found = this.targetList.some(function (endpoint) {
                return endpoint.hasConnections();
            });

            if (found) {
                return true;
            }

            found = this.sourceList.some(function (endpoint) {
                return endpoint.hasConnections();
            });

            return found;
        },

        hasEndpoints: function hasEndpoints() {
            return this.sourceList.length || this.targetList.length;
        },

        hasSettings: function hasSettings() {
            return this._component.meta.preferenceList.length > 0;
        },

        hasOrderableEndpoints: function hasOrderableEndpoints() {
            return this.endpoints.source.canBeOrdered() || this.endpoints.target.canBeOrdered();
        },

        isRemovable: function isRemovable() {
            return !this.readonly && !this.background;
        },

        /**
         * @override
         */
        setTitle: function setTitle(title) {
            var span;

            span = document.createElement('span');
            span.textContent = title;
            this.title_tooltip.options.content = title;
            this.title_tooltip.bind(span);

            return se.Panel.prototype.setTitle.call(this, span);
        },

        showLogs: function showLogs() {

            this._component.showLogs();

            return this;
        },

        showSettings: function showSettings() {

            this._component.showSettings();

            return this;
        },

        startOrderingEndpoints: function startOrderingEndpoints() {

            if (this.orderingEndpoints || !this.hasOrderableEndpoints()) {
                return this;
            }

            this.btnRemove.disable();

            this.wasActive = this.active;

            this.draggable.destroy();

            this.endpoints.target.startOrdering();
            this.endpoints.source.startOrdering();

            this.active = true;

            return this.dispatchEvent('orderstart');
        },

        stopOrderingEndpoints: function stopOrderingEndpoints() {

            if (!this.orderingEndpoints) {
                return this;
            }

            this.btnRemove.enable();

            this.active = this.wasActive;
            delete this.wasActive;

            this.endpoints.target.stopOrdering();
            this.endpoints.source.stopOrdering();

            makeDraggable.call(this);

            this.dispatchEvent('change', {
                endpoints: {
                    source: this.endpoints.source.toJSON(),
                    target: this.endpoints.target.toJSON()
                }
            });

            return this.dispatchEvent('orderend');
        },

        /**
         * Get or set the current coordinates of the wrapperElement relative to the
         * offset parent.
         *
         * @param {Number} offsetLeft
         *      [description]
         * @param {Number} offsetTop
         *      [description]
         * @returns {ComponentDraggable|Object.<String, Number>}
         *      [description]
         */
        position: function position(offset) {

            if (offset != null && (offset.x !== null || offset.y != null)) {

                if (offset.x != null) {
                    if (offset.x < ns.ComponentDraggable.MINOFFSET_X) {
                        offset.x = ns.ComponentDraggable.MINOFFSET_X;
                    }

                    this.style('left', Math.round(offset.x) + 'px');
                }

                if (offset.y != null) {
                    if (offset.y < ns.ComponentDraggable.MINOFFSET_Y) {
                        offset.y = ns.ComponentDraggable.MINOFFSET_Y;
                    }

                    this.style('top', Math.round(offset.y) + 'px');
                }

                return this.refresh();
            }

            return {
                x: this.get().offsetLeft,
                y: this.get().offsetTop
            };
        },

        refresh: function refresh() {
            notifyErrors.call(this);
            return this.forEachEndpoint(function (endpoint) {
                endpoint.refresh();
            });
        },

        /**
         * @override
         */
        remove: function remove(childElement) {

            if (!arguments.length && !this.hasClassName('cloned')) {
                this._component.removeEventListener('change', this._on_change_model);
                this.dispatchEvent('remove');
            }

            return se.Panel.prototype.remove.call(this, childElement);
        },

        setUp: function setUp() {

            this.stopOrderingEndpoints();
            this.active = false;

            return this;
        },

        toFirst: function toFirst() {

            this.parentElement.appendChild(this);

            return this;
        },

        toJSON: function toJSON() {
            return {
                name: this._component.meta.uri,
                collapsed: this.collapsed,
                position: this.position(),
                endpoints: {
                    source: this.endpoints.source.toJSON(),
                    target: this.endpoints.target.toJSON()
                }
            };
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['change', 'dragstart', 'drag', 'dragend', 'endpointadded', 'endpointremoved', 'optremove', 'optremovecascade', 'optshare', 'remove', 'orderstart', 'orderend'];

    var updateFlagRemoveAllowed = function updateFlagRemoveAllowed() {
        return this.removeAllowed ? this._showButtonRemove() : this._showButtonDelete();
    };

    var appendEndpoints = function appendEndpoints(type, endpoints) {

        endpoints.forEach(function (endpoint) {
            this.appendEndpoint(type, endpoint);

            if (this._missingEndpoints != null && endpoint.name in this._missingEndpoints[type]) {
                this._missingEndpoints[type][endpoint.name].forEachConnection(function (connection) {
                    this.endpoints[type].endpoints[endpoint.name].appendConnection(connection, true);
                }.bind(this));
                delete this._missingEndpoints[type][endpoint.name];
            }
        }, this);

        return this;
    };

    var btnremove_onclick = function btnremove_onclick() {

        if (this.background) {
            this.dispatchEvent('optshare');
        } else {
            this.dispatchEvent('optremove');
        }
    };

    var collapseEndpoints = function collapseEndpoints(expandedWidth) {
        var offsetWidth;

        this.body
            .removeChild(this.endpoints.target)
            .removeChild(this.endpoints.source);

        this.heading
            .appendChild(this.endpoints.target)
            .appendChild(this.endpoints.source);

        offsetWidth = expandedWidth - this.get().offsetWidth;

        if (offsetWidth > 0) {
            this.style('left', Math.round(this.get().offsetLeft + (offsetWidth / 2)) + 'px');
        }

        return this;
    };

    var endpoint_onconnectionadded = function endpoint_onconnectionadded(endpoint, connection) {

        if (connection.readonly) {
            this.btnRemove.disable();
            this.readonly = true;
        }

    };

    var endpoint_onconnectionremoved = function endpoint_onconnectionremoved(endpoint, connection) {
        if (endpoint.missing && !endpoint.hasConnections()) {
            this.endpoints[endpoint.type].removeChild(endpoint);
            this.dispatchEvent('endpointremoved', endpoint);
            this.refresh();
        }
    };

    var expandEndpoints = function expandEndpoints(collapsedWidth) {
        var offsetWidth;

        this.heading
            .removeChild(this.endpoints.target)
            .removeChild(this.endpoints.source);

        this.body
            .appendChild(this.endpoints.target)
            .appendChild(this.endpoints.source);

        offsetWidth = this.get().offsetWidth - collapsedWidth;

        if (offsetWidth > 0) {
            this.style('left', Math.round(this.get().offsetLeft - (offsetWidth / 2)) + 'px');
        }

        return this;
    };

    var isClick = function isClick(position1, position2) {
        return (position1.x === position2.x) && (position1.y === position2.y);
    };

    var makeDraggable = function makeDraggable() {
        this.draggable = new Wirecloud.ui.Draggable(this.get(), {component: this},
            function dragstart(draggable, context, event) {
                context.active = context.component.active;
                context.component.btnPrefs.getPopupMenu().hide();
                context.position = context.component.addClassName('dragging').position();

                if (!context.active) {
                    context.component.active = true;
                }

                context.component.dispatchEvent('dragstart', event);
            },
            function drag(event, draggable, context, x, y) {
                context.component
                    .position({
                        x: context.position.x + x,
                        y: context.position.y + y
                    })
                    .dispatchEvent('drag', x, y, event);
            },
            function dragend(draggable, context, event) {
                var position = context.component.removeClassName('dragging').position();

                // Work around problems raised by removing and readding the element into the DOM (especially in chrome)
                setTimeout(context.component.toFirst.bind(context.component), 0);

                // Check this drag & drop action can be considered a click action instead
                if (isClick(context.position, position)) {
                    context.component.active = !context.active;
                } else {

                    if (!context.active) {
                        context.component.active = false;
                    }

                    context.component
                        .dispatchEvent('change', {
                            position: position
                        })
                        .dispatchEvent('dragend', event);
                }
            },
            function canDrag() {
                return true;
            }
        );

        return this;
    };

    var noticetitle_onclick = function noticetitle_onclick(event) {
        event.preventDefault();
        this.showLogs();
        event.stopPropagation();
    };

    var notifyErrors = function notifyErrors() {
        var title, label, count;

        count = this._component.logManager.errorCount;
        this.toggleClassName('missing', this.missing);

        if (this.heading.has(this.heading.notice)) {
            this.heading.removeChild(this.heading.notice);
        }

        if (count || this.missing) {

            if (this.missing) {
                title = utils.gettext("Missing");
            } else {
                label = utils.ngettext("%(count)s error", "%(count)s errors", count);
                title = utils.interpolate(label, {
                    count: count
                });
            }

            this.heading.noticeTitle.textContent = title;
            this.heading.appendChild(this.heading.notice);
        }
    };

    var cleanEndpoints = function cleanEndpoints() {
        var id;

        for (id in this.targets) {
            cleanEndpoint.call(this, this.targets[id]);
        }

        for (id in this.sources) {
            cleanEndpoint.call(this, this.sources[id]);
        }
    };

    var cleanEndpoint = function cleanEndpoint(endpoint) {
        if (endpoint.hasConnections()) {
            this._missingEndpoints[endpoint.type][endpoint.name] = endpoint;
        }

        endpoint.removeEventListener('connectionadded', this._endpoint_onconnectionadded_bound);
        endpoint.removeEventListener('connectionremoved', this._endpoint_onconnectionremoved_bound);

        this.endpoints[endpoint.type].removeChild(endpoint);
        this.dispatchEvent('endpointremoved', endpoint);
    };

    var on_change_model = function on_change_model(model, changes) {
        if (changes.indexOf('title') !== -1) {
            this.setTitle(model.title).refresh();
        }

        if (changes.indexOf('meta') !== -1) {
            this.setTitle(model.title);

            this._missingEndpoints = {source: {}, target: {}};
            cleanEndpoints.call(this);

            appendEndpoints.call(this, 'source', model.meta.outputList.map(function (data) {return model.outputs[data.name];}));
            appendEndpoints.call(this, 'target', model.meta.inputList.map(function (data) {return model.inputs[data.name];}));

            appendMissingEndpoints.call(this, model, 'source', 'outputs');
            appendMissingEndpoints.call(this, model, 'target', 'inputs');

            delete this._missingEndpoints;
            this.refresh();
        }
    };

    var appendMissingConnection = function appendMissingConnection(type, name, connection) {
        this.endpoints[type].endpoints[name].appendConnection(connection, true);
    };

    var appendMissingEndpoints = function appendMissingEndpoints(componentUpdated, type, namespace) {
        var name;

        for (name in componentUpdated[namespace]) {
            if (name in this._missingEndpoints[type]) {
                this.appendEndpoint(type, componentUpdated[namespace][name]);
                this._missingEndpoints[type][name].forEachConnection(appendMissingConnection.bind(this, type, name));
            }
        }
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
