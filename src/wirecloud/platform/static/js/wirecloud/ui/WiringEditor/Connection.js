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
     * Create a new instance of class Connection.
     * @extends {StyledElement}
     *
     * @constructor
     */
    ns.Connection = utils.defineClass({

        constructor: function Connection() {

            this.superClass(events);

            this.wrapperElement = document.createElementNS(ns.Connection.SVG_NS, 'g');
            this.wrapperElement.setAttribute('class', "connection");

            this.borderElement = document.createElementNS(ns.Connection.SVG_NS, 'path');
            this.borderElement.setAttribute('class', "connection-border");
            this.wrapperElement.appendChild(this.borderElement);

            this.bodyElement = document.createElementNS(ns.Connection.SVG_NS, 'path');
            this.bodyElement.setAttribute('class', "connection-body");
            this.bodyElement.addEventListener('click', connection_onclick.bind(this));
            this.wrapperElement.appendChild(this.bodyElement);

            this.optionsElement = document.createElementNS(ns.Connection.SVG_NS, 'g');
            this.optionsElement.setAttribute('class', "connection-options");

            this.btnGroupElement = document.createElementNS(ns.Connection.SVG_NS, 'rect');
            this.btnGroupElement.setAttribute('class', "btn-svg-group");
            this.btnGroupElement.setAttribute('height', "20px");
            this.btnGroupElement.setAttribute('width', "45px");
            this.optionsElement.appendChild(this.btnGroupElement);

            this.btnPrefs = new se.SVGPlainButton({
                title: gettext("Preferences"),
                extraClass: "btn-show-prefs",
                iconClass: "icon-reorder",
                menuItems: new ns.ConnectionPrefs(this)
            });
            this.btnPrefs.appendTo(this.optionsElement);

            this.btnRemove = new se.SVGPlainButton({
                title: gettext("Remove"),
                extraClass: "btn-remove",
                iconClass: "icon-remove-sign"
            });
            this.btnRemove.on('click', btnremove_onclick.bind(this));
            this.btnRemove.appendTo(this.optionsElement);

            this.activeCount = 0;

            this.source = {};
            this.target = {};

            var removeAllowed = true;

            Object.defineProperties(this, {

                active: {
                    get: function get() {return this.hasClassName('active');},
                    set: function set(value) {this._onactive(value);}
                },

                background: {
                    get: function get() {return this.hasClassName('background');},
                    set: function set(value) {this._onbackground(value);}
                },

                created: {
                    get: function get() {return this.source.endpoint != null && this.target.endpoint != null;}
                },

                established: {
                    get: function get() {return this.created && this._connection != null;}
                },

                editable: {
                    get: function get() {return this.hasClassName('editable');},
                    set: function set(value) {this._oneditable(value);}
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

                sourceComponent: {
                    get: function get() {return this.source.endpoint.component;}
                },

                sourceId: {
                    get: function get() {return this.source.endpoint.id;}
                },

                targetComponent: {
                    get: function get() {return this.target.endpoint.component;}
                },

                targetId: {
                    get: function get() {return this.target.endpoint.id;}
                }

            });
        },

        inherit: se.StyledElement,

        statics: {

            SVG_NS: "http://www.w3.org/2000/svg",

            JSON_TEMPLATE: {
                sourcename: "",
                sourcehandle: null,
                targetname: "",
                targethandle: null
            }

        },

        members: {

            /**
             * [TODO: _onactive description]
             * @protected
             *
             * @param {Boolean} active
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            _onactive: function _onactive(active) {

                if (this.active === active) {
                    return this;
                }

                this.toggleClassName('active', active).toFirst();
                toggleActiveEndpoints.call(this, active);

                return this;
            },

            /**
             * [TODO: _onbackground description]
             * @protected
             *
             * @param {Boolean} background
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            _onbackground: function _onbackground(background) {

                this.toggleClassName('background', background);

                return background ? this._showButtonAdd() : updateFlagRemoveAllowed.call(this);
            },

            /**
             * [TODO: _oneditable description]
             * @protected
             *
             * @param {Boolean} editable
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            _oneditable: function _oneditable(editable) {

                if (this.editable === editable) {
                    return this;
                }

                this.toggleClassName('editable', editable).toFirst();
                toggleActiveEndpoints.call(this, editable);

                if (editable) {
                    this.source.handle.appendTo(this.wrapperElement);
                    this.target.handle.appendTo(this.wrapperElement);
                    this.trigger('customizestart');
                } else {
                    this.source.handle.remove();
                    this.target.handle.remove();
                    this.trigger('customizeend');
                }

                return this;
            },

            _showButtonAdd: function _showButtonAdd() {

                this.btnRemove
                    .replaceClassName("btn-remove", "btn-share")
                    .iconClass("icon-plus-sign")
                    .title(utils.gettext("Add"));

                return this;
            },

            _showButtonDelete: function _showButtonDelete() {

                this.btnRemove
                    .replaceClassName('btn-share', 'btn-remove')
                    .iconClass("icon-trash")
                    .title(utils.gettext("Delete"));

                return this;
            },

            _showButtonRemove: function _showButtonRemove() {

                this.btnRemove
                    .replaceClassName('btn-share', 'btn-remove')
                    .iconClass("icon-remove-sign")
                    .title(utils.gettext("Remove"));

                return this;
            },

            /**
             * [TODO: activate description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            activate: function activate() {

                if (this.activeCount === 0) {
                    this.active = true;
                }

                this.activeCount++;

                return this;
            },

            /**
             * [TODO: createAndBind description]
             *
             * @param {Boolean} readonly
             *      [TODO: description]
             * @param {Wiring} wiringEngine
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            createAndBind: function createAndBind(readonly, wiringEngine) {
                var source = this.source.endpoint._endpoint,
                    target = this.target.endpoint._endpoint;

                if (this.established) {
                    return this;
                }

                establishConnection.call(this, wiringEngine.createConnection(readonly, source, target));
                this.refresh();

                return this;
            },

            /**
             * [TODO: deactivate description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            deactivate: function deactivate() {

                if (this.activeCount === 0) {
                    return this;
                }

                this.activeCount--;

                if (this.activeCount === 0) {
                    this.active = false;
                }

                return this;
            },

            /**
             * [TODO: equals description]
             *
             * @param {Connection} connection
             *      [TODO: description]
             * @returns {Boolean}
             *      [TODO: description]
             */
            equals: function equals(connection) {

                if (!(connection instanceof ns.Connection)) {
                    return false;
                }

                return this.sourceId === connection.sourceId && this.targetId === connection.targetId;
            },

            /**
             * [TODO: hasEndpoint description]
             *
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasEndpoint: function hasEndpoint(endpoint) {
                return this[endpoint.type].endpoint.equals(endpoint);
            },

            /**
             * [TODO: refresh description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            refresh: function refresh() {
                var sourcePosition, sourceHandle, targetPosition, targetHandle;

                if (!this.created) {
                    return this;
                }

                sourcePosition = this.source.endpoint.anchorPosition;
                targetPosition = this.target.endpoint.anchorPosition;

                sourceHandle = this.source.handle.updateDistance(targetPosition).position();
                targetHandle = this.target.handle.updateDistance(sourcePosition, true).position();

                updateDistance.call(this, sourcePosition, sourceHandle, targetPosition, targetHandle);

                return this;
            },

            /**
             * @override
             */
            remove: function remove(childElement) {

                if (childElement == null) {

                    if (this.established) {
                        this.source.endpoint.removeConnection(this);
                        this.target.endpoint.removeConnection(this);
                    }

                    this.trigger('remove');
                }


                return this.superMember(se.StyledElement, 'remove', childElement);
            },

            /**
             * [TODO: restoreDefaults description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            restoreDefaults: function restoreDefaults() {

                if (this.readonly || this.background) {
                    return this;
                }

                if (this.established) {
                    this.source.handle.auto = true;
                    this.target.handle.auto = true;

                    this.refresh().trigger('change', this.toJSON());
                }

                return this;
            },

            /**
             * [TODO: stickEndpoint description]
             *
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @param {PlainObject} [options]
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            stickEndpoint: function stickEndpoint(endpoint, options) {

                if (this.established) {
                    return this;
                }

                options = utils.updateObject({
                    establish: true,
                    wiringConnection: null
                }, options);

                appendEndpoint.call(this, endpoint, options);

                if (this.created) {

                    if (options.establish) {
                        establishConnection.call(this, options.wiringConnection);
                    }

                    this.refresh();
                }

                return this;
            },

            /**
             * [TODO: showLogs description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            showLogs: function showLogs() {
                this._connection.showLogs();

                return this;
            },

            /**
             * [TODO: toFirst description]
             *
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            toFirst: function toFirst() {
                var parentElement;

                if (this.parentElement != null) {
                    this.parentElement.removeChild(this).appendChild(this);
                } else {
                    parentElement = this.get().parentElement;

                    if (parentElement != null) {
                        parentElement.removeChild(this.get());
                        parentElement.appendChild(this.get());
                    }
                }

                return this;
            },

            /**
             * [TODO: toggleActive description]
             *
             * @param {Boolean} active
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            toggleActive: function toggleActive(active) {
                return active ? this.activate() : this.deactivate();
            },

            /**
             * [TODO: toJSON description]
             *
             * @returns {PlainObject}
             *      [TODO: description]
             */
            toJSON: function toJSON() {
                return {
                    sourcename: this.sourceId,
                    sourcehandle: this.source.handle.toJSON(),
                    targetname: this.targetId,
                    targethandle: this.target.handle.toJSON()
                };
            },

            /**
             * [TODO: unstickEndpoint description]
             *
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            unstickEndpoint: function unstickEndpoint(endpoint) {

                if (this.established) {
                    return this;
                }

                removeEndpoint.call(this, endpoint);

                return this;
            },

            /**
             * [TODO: updateCursorPosition description]
             *
             * @param {PlainObject} position
             *      [TODO: description]
             * @returns {Connection}
             *      The instance on which the member is called.
             */
            updateCursorPosition: function updateCursorPosition(position) {
                var source, sourceHandle, target, targetHandle;

                if (this.created) {
                    return this;
                }

                if (this.source.endpoint != null) {
                    source = this.source.endpoint.anchorPosition;
                    target = position;
                    sourceHandle = this.source.handle.updateDistance(target).position();
                    targetHandle = getHandlePosition(target, source, true);
                } else {
                    source = position;
                    target = this.target.endpoint.anchorPosition;
                    sourceHandle = getHandlePosition(source, target);
                    targetHandle = this.target.handle.updateDistance(source, true).position();
                }

                updateDistance.call(this, source, sourceHandle, target, targetHandle);

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['change', 'click', 'customizestart', 'customizeend', 'optremove', 'optshare', 'remove'];

    var updateFlagRemoveAllowed = function updateFlagRemoveAllowed() {
        return this.removeAllowed ? this._showButtonRemove() : this._showButtonDelete();
    };

    var appendEndpoint = function appendEndpoint(endpoint, options) {

        this[endpoint.type] = {
            endpoint: endpoint,
            handle: new ns.ConnectionHandle(endpoint, options)
        };

        return this;
    };

    var bindWiringConnection = function bindWiringConnection(wiringConnection) {

        Object.defineProperties(this, {

            logManager: {value: wiringConnection.logManager},

            readonly: {value: wiringConnection.readonly}

        });

        this._connection = wiringConnection;

        if (this.readonly) {
            this.addClassName("readonly");
            this.btnRemove.disable();
        }

        return this;
    };

    var btnremove_onclick = function btnremove_onclick(event) {

        if (this.background) {
            this.trigger('optshare', event);
        } else {
            if (!this.readonly) {
                this.trigger('optremove', event);
            }
        }
    };

    var calculateMiddle = function calculateMiddle(source, sourceHandle, target, targetHandle) {
        var B1, B2, B3, B4, bezier;

        B1 = function B1(t) { return t * t * t; };
        B2 = function B2(t) { return 3 * t * t * (1 - t); };
        B3 = function B3(t) { return 3 * t * (1 - t) * (1 - t); };
        B4 = function B4(t) { return (1 - t) * (1 - t) * (1 - t); };

        bezier = function bezier(percent, C1, C2, C3, C4) {
            var X = C1.x * B1(percent) + C2.x * B2(percent) + C3.x * B3(percent) + C4.x * B4(percent);
            var Y = C1.y * B1(percent) + C2.y * B2(percent) + C3.y * B3(percent) + C4.y * B4(percent);
            return {x: Math.round(X), y: Math.round(Y)};
        };

        return bezier(0.5, source, sourceHandle, targetHandle, target);
    };

    var connection_onclick = function connection_onclick(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.enabled && event.button === 0) {
            this.trigger('click');
        }
    };

    var establishConnection = function establishConnection(wiringConnection) {

        if (wiringConnection == null) {
            return this;
        }

        this.wrapperElement.appendChild(this.optionsElement);

        this.source.handle.on('drag', handle_ondrag.bind(this));
        this.source.handle.on('dragend', handle_ondragend.bind(this));

        this.target.handle.on('drag', handle_ondrag.bind(this));
        this.target.handle.on('dragend', handle_ondragend.bind(this));

        bindWiringConnection.call(this, wiringConnection);

        this.source.endpoint.appendConnection(this);
        this.target.endpoint.appendConnection(this);

        this.get().setAttribute('data-sourceid', this.sourceId);
        this.get().setAttribute('data-targetid', this.targetId);

        return this;
    };

    var handle_ondrag = function handle_ondrag(position, handle) {
        return this.refresh();
    };

    var handle_ondragend = function handle_ondragend() {
        return this.trigger('change', this.toJSON());
    };

    var formatDistance = function formatDistance(s, sHandle, t, tHandle) {
        return "M " + s.x + "," + s.y + " C " + sHandle.x + "," + sHandle.y + " " + tHandle.x + "," + tHandle.y + " " + t.x + "," + t.y;
    };

    var getHandlePosition = function getHandlePosition(start, end, invert) {
        var position = ns.ConnectionHandle.getRelativePosition(start, end, invert);

        return {x: start.x + position.x, y: start.y + position.y};
    };

    var removeEndpoint = function removeEndpoint(endpoint) {

        this[endpoint.type] = {};

        return this;
    };

    var toggleActiveEndpoints = function toggleActiveEndpoints(active) {

        if (this.source.endpoint != null) {
            this.source.endpoint.toggleActive(active);
        }

        if (this.target.endpoint != null) {
            this.target.endpoint.toggleActive(active);
        }

        return this;
    };

    var updateDistance = function updateDistance(source, sourceHandle, target, targetHandle) {

        this.borderElement.setAttribute('d', formatDistance(source, sourceHandle, target, targetHandle));
        this.bodyElement.setAttribute('d', formatDistance(source, sourceHandle, target, targetHandle));

        if (this.established) {
            var middlePosition = calculateMiddle(source, sourceHandle, target, targetHandle);

            this.btnGroupElement.setAttribute('x', middlePosition.x - 20);
            this.btnGroupElement.setAttribute('y', middlePosition.y - 10);

            this.btnRemove.position(middlePosition.x + 6, middlePosition.y + 5);
            this.btnPrefs.position(middlePosition.x - 12, middlePosition.y + 5);
        }

        return this;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
