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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

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
    ns.ComponentDraggable = utils.defineClass({

        constructor: function ComponentDraggable(wiringComponent, options) {

            options = utils.updateObject(ns.ComponentDraggable.JSON_TEMPLATE, options);

            this.btnPrefs = new se.PopupButton({
                title: utils.gettext("Preferences"),
                extraClass: "btn-show-prefs",
                iconClass: "icon-reorder"
            });
            this.btnPrefs.popup_menu.append(new ns.ComponentDraggablePrefs(this));

            this.btnRemove = new se.Button({
                title: utils.gettext("Remove"),
                extraClass: "btn-remove",
                iconClass: "icon-remove-sign"
            });
            this.btnRemove.on('click', btnremove_onclick.bind(this));

            this.superClass({
                title: wiringComponent.title,
                events: events,
                extraClass: "component-draggable component-" + wiringComponent.meta.type,
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

                missing: {value: wiringComponent.missing},

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

                sortingEndpoints: {
                    get: function get() {return this.endpoints.source.sortable || this.endpoints.target.sortable;}
                },

                sourceList: {
                    get: function get() {return this.endpoints.source.children;}
                },

                targetList: {
                    get: function get() {return this.endpoints.target.children;}
                },

                type: {value: wiringComponent.meta.type}

            });

            this.get().setAttribute('data-id', this.id);

            this.heading.noticeTitle = document.createElement('span');
            this.heading.noticeTitle.className = "label label-danger";
            this.heading.noticeTitle.addEventListener('mousedown', utils.stopPropagationListener, true);
            this.heading.noticeTitle.addEventListener('click', noticetitle_onclick.bind(this));

            this.heading.notice = document.createElement('div');
            this.heading.notice.className = "component-notice";
            this.heading.notice.appendChild(this.heading.noticeTitle);

            appendEndpoints.call(this, 'source', wiringComponent.meta.outputList.map(function (data) {return wiringComponent.outputs[data.name];}));
            appendEndpoints.call(this, 'target', wiringComponent.meta.inputList.map(function (data) {return wiringComponent.inputs[data.name];}));

            if (!this.missing) {
                wiringComponent.logManager.addEventListener('newentry', notifyErrors.bind(this));

                this.endpoints.source.sortEndpoints(options.endpoints.source);
                this.endpoints.target.sortEndpoints(options.endpoints.target);
            } else {
                this.addClassName("missing");
            }

            if (!this.hasEndpoints()) {
                this.body.remove();
            }

            if (options.collapsed) {
                this.collapsed = true;
            }

            this.position(options.position);

            if (this.type == 'widget' && !wiringComponent.missing) {
                wiringComponent.on('title_changed', component_onrename.bind(this));
            }

            notifyErrors.call(this);
            makeDraggable.call(this);
        },

        inherit: se.Panel,

        statics: {

            JSON_TEMPLATE: {
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
            },

            MINOFFSET_X: 20,

            MINOFFSET_Y: 10

        },

        members: {

            _onactive: function _onactive(active) {

                if (this.sortingEndpoints) {
                    return this;
                }

                return this.forEachEndpoint(function (endpoint) {
                    endpoint.forEachConnection(function (connection) {
                        connection.toggleActive(active);
                    });
                });
            },

            _onbackground: function _onbackground(background) {

                this.toggleClassName('background', background);

                return background ? this._showButtonAdd() : updateFlagRemoveAllowed.call(this);
            },

            _onclick: function _onclick(event) {

                if (this.sortingEndpoints) {
                    return this;
                }

                return this.superMember(se.Panel, '_onclick', event);
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

                this.refresh().trigger('change', {
                    collapsed: collapsed,
                    position: this.position()
                });

                return this;
            },

            _showButtonAdd: function _showButtonAdd() {

                this.btnRemove
                    .replaceClassName('btn-remove', 'btn-share')
                    .removeIconClassName('icon-trash')
                    .removeIconClassName('icon-remove-sign')
                    .addIconClassName('icon-plus-sign')
                    .setTitle(utils.gettext("Add"));

                return this;
            },

            _showButtonDelete: function _showButtonDelete() {

                this.btnRemove
                    .replaceClassName('btn-share', 'btn-remove')
                    .removeIconClassName('icon-plus-sign')
                    .removeIconClassName('icon-remove-sign')
                    .addIconClassName('icon-trash')
                    .setTitle(utils.gettext("Delete"));

                return this;
            },

            _showButtonRemove: function _showButtonRemove() {

                this.btnRemove
                    .replaceClassName('btn-share', 'btn-remove')
                    .removeIconClassName('icon-plus-sign')
                    .removeIconClassName('icon-trash')
                    .addIconClassName('icon-remove-sign')
                    .setTitle(utils.gettext("Remove"));

                return this;
            },

            appendEndpoint: function appendEndpoint(type, wiringEndpoint, options) {
                var endpoint = this.endpoints[type].appendEndpoint(wiringEndpoint);

                endpoint.on('connectionadded', endpoint_onconnectionadded.bind(this));

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
                return this._component.hasSettings();
            },

            hasSortableEndpoints: function hasSortableEndpoints() {
                return this.endpoints.source.canSort() || this.endpoints.target.canSort();
            },

            /**
             * @override
             */
            setTitle: function setTitle(title) {
                var truncatedTitle;

                truncatedTitle = document.createElement('span');
                truncatedTitle.textContent = title;

                return this.superMember(se.Panel, 'setTitle', truncatedTitle);
            },

            showLogs: function showLogs() {

                this._component.showLogs();

                return this;
            },

            showSettings: function showSettings() {

                this._component.showSettings();

                return this;
            },

            startSortableEndpoints: function startSortableEndpoints() {

                if (this.sortingEndpoints || !this.hasSortableEndpoints()) {
                    return this;
                }

                this.btnRemove.disable();

                this.wasActive = this.active;

                this.draggable.destroy();

                this.endpoints.target.startSorting();
                this.endpoints.source.startSorting();

                this.active = true;

                return this.trigger('sortstart');
            },

            stopSortableEndpoints: function stopSortableEndpoints() {

                if (!this.sortingEndpoints) {
                    return this;
                }

                this.btnRemove.enable();

                this.active = this.wasActive;
                delete this.wasActive;

                this.endpoints.target.stopSorting();
                this.endpoints.source.stopSorting();

                makeDraggable.call(this);

                this.trigger('change', {
                    endpoints: {
                        source: this.endpoints.source.toJSON(),
                        target: this.endpoints.target.toJSON()
                    }
                });

                return this.trigger('sortend');
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
                return this.forEachEndpoint(function (endpoint) {
                    endpoint.refresh();
                });
            },

            /**
             * @override
             */
            remove: function remove(childElement) {

                if (!arguments.length && !this.hasClassName('cloned')) {
                    this.trigger('remove');
                }

                return this.superMember(se.Panel, 'remove', childElement);
            },

            setUp: function setUp() {

                this.stopSortableEndpoints();
                this.active = false;

                return this;
            },

            toFirst: function toFirst() {

                this.parentElement.removeChild(this).appendChild(this);

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

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['change', 'dragstart', 'drag', 'dragend', 'optremove', 'optremovecascade', 'optshare', 'remove', 'sortstart', 'sortend'];

    var updateFlagRemoveAllowed = function updateFlagRemoveAllowed() {
        return this.removeAllowed ? this._showButtonRemove() : this._showButtonDelete();
    };

    var appendEndpoints = function appendEndpoints(type, endpoints) {

        endpoints.forEach(function (endpoint) {
            this.appendEndpoint(type, endpoint);
        }, this);

        return this;
    };

    var btnremove_onclick = function btnremove_onclick() {

        if (this.background) {
            this.trigger('optshare');
        } else {
            this.trigger('optremove');
        }
    };

    var collapseEndpoints = function collapseEndpoints(expandedWidth) {
        var offsetWidth;

        this.body
            .removeChild(this.endpoints.target)
            .removeChild(this.endpoints.source)
            .remove();

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

    var expandEndpoints = function expandEndpoints(collapsedWidth) {
        var offsetWidth;

        this.heading
            .removeChild(this.endpoints.target)
            .removeChild(this.endpoints.source);

        this.body
            .appendChild(this.endpoints.target)
            .appendChild(this.endpoints.source)
            .appendTo(this);

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

                context.component.trigger('dragstart', event);
            },
            function drag(event, draggable, context, x, y) {
                context.component
                    .position({
                        x: context.position.x + x,
                        y: context.position.y + y
                    })
                    .trigger('drag', x, y, event);
            },
            function dragend(draggable, context, event) {
                var position = context.component.removeClassName('dragging')
                    .toFirst().position();

                // Check this drag & drop action can be considered a click action instead
                if (isClick(context.position, position)) {
                    context.component.active = !context.active;
                    context.component.trigger('click', event);
                } else {

                    if (!context.active) {
                        context.component.active = false;
                    }

                    context.component
                        .trigger('change', {
                            position: position
                        })
                        .trigger('dragend', event);
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

        count = this._component.logManager.getErrorCount();
        if (count || this.missing) {

            if (!this.heading.has(this.heading.notice)) {
                this.heading.appendChild(this.heading.notice);
            }

            if (this.missing) {
                title = utils.gettext("Missing");
            } else {
                label = utils.ngettext("%(count)s error", "%(count)s errors", count);
                title = utils.interpolate(label, {
                    count: count
                });
            }

            this.heading.noticeTitle.textContent = title;
        }
    };

    var component_onrename = function component_onrename(title) {
        this.setTitle(title).refresh();
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
