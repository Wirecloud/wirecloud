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

/* global gettext, StyledElement, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class ConnectionHandle.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {Endpoint} endpoint
     *      [TODO: description]
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.ConnectionHandle = utils.defineClass({

        constructor: function ConnectionHandle(endpoint, options) {

            options = utils.updateObject(defaults, options);
            this.superClass(events.concat(options.events));

            this.wrapperElement = document.createElementNS(ns.ConnectionHandle.SVG_NS, 'g');
            this.wrapperElement.setAttribute('class', "connection-handle");
            this.addClass(endpoint.type + "-handle");

            if (options.extraClass) {
                this.addClass(options.extraClass);
            }

            this.lineElement = document.createElementNS(ns.ConnectionHandle.SVG_NS, 'path');
            this.lineElement.setAttribute('class', "handle-line");
            this.append(this.lineElement);

            this.ballElement = document.createElementNS(ns.ConnectionHandle.SVG_NS, 'circle');
            this.ballElement.setAttribute('class', "handle-ball");
            this.ballElement.setAttribute('r', options.radius);
            this.ballElement.addEventListener('click', utils.stopPropagationListener);
            this.append(this.ballElement);

            this.auto = true;
            this.endpoint = endpoint;

            this.tooltip = new se.Tooltip({content: gettext("Drag & Drop"), placement: ['top']});
            this.tooltip.bind(this.ballElement);

            setRelativePosition.call(this, options.position);
            startDraggableElement.call(this);
        },

        inherit: se.StyledElement,

        statics: {

            getRelativePosition: function getRelativePosition(startPosition, endPosition, invert) {
                var offsetX = Math.abs(startPosition.x - endPosition.x);

                if (offsetX > ns.ConnectionHandle.MAXOFFSET_X) {
                    offsetX = ns.ConnectionHandle.MAXOFFSET_X;
                }

                if (offsetX < ns.ConnectionHandle.MINOFFSET_X) {
                    offsetX = ns.ConnectionHandle.MINOFFSET_X;
                }

                if (invert) {
                    offsetX *= -1;
                }

                return {x: offsetX, y: 0};
            },

            MAXOFFSET_X: 90,

            MINOFFSET_X: 20,

            SVG_NS: "http://www.w3.org/2000/svg"

        },

        members: {

            /**
             * [TODO: position description]
             *
             * @param {PlainObject} relativePosition
             *     [TODO: description]
             * @returns {ConnectionHandle|PlainObject}
             *     [TODO: description]
             */
            position: function position(relativePosition) {
                var anchorPosition = this.endpoint.anchorPosition;

                if (relativePosition != null) {
                    this.relativePosition = relativePosition;

                    var offsetPosition = {
                        x: anchorPosition.x + this.relativePosition.x,
                        y: anchorPosition.y + this.relativePosition.y
                    };

                    this.lineElement.setAttribute('d', formatDistance(anchorPosition, offsetPosition));

                    this.ballElement.setAttribute('cx', offsetPosition.x);
                    this.ballElement.setAttribute('cy', offsetPosition.y);

                    return this;
                }

                return {
                    x: this.ballElement.getAttribute('cx'),
                    y: this.ballElement.getAttribute('cy')
                };
            },

            /**
             * [TODO: toJSON description]
             *
             * @returns {String|PlainObject}
             *     [TODO: description]
             */
            toJSON: function toJSON() {
                return this.auto ? "auto" : this.relativePosition;
            },

            /**
             * [TODO: updateDistance description]
             *
             * @param {PlainObject} endPosition
             *     [TODO: description]
             * @param {Boolean} invert
             *     [TODO: description]
             * @returns {ConnectionHandle}
             *      The instance on which the member is called.
             */
            updateDistance: function updateDistance(endPosition, invert) {
                var startPosition = this.endpoint.anchorPosition;

                if (this.auto) {
                    this.relativePosition = ns.ConnectionHandle.getRelativePosition(startPosition, endPosition, invert);
                }

                var offsetPosition = {
                    x: startPosition.x + this.relativePosition.x,
                    y: startPosition.y + this.relativePosition.y
                };

                this.lineElement.setAttribute('d', formatDistance(startPosition, offsetPosition));

                this.ballElement.setAttribute('cx', offsetPosition.x);
                this.ballElement.setAttribute('cy', offsetPosition.y);

                return this;

            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        events: [],
        extraClass: "",
        radius: "6px",
        position: null
    };

    var events = ['dragstart', 'drag', 'dragend'];

    function formatDistance(endpoint, handle) {
        return "M " + endpoint.x + "," + endpoint.y + " " + handle.x + "," + handle.y;
    }

    function is2DPosition(position) {
        return utils.isPlainObject(position) && Number.isInteger(position.x) && Number.isInteger(position.y);
    }

    function setRelativePosition(position) {

        if (is2DPosition(position)) {
            this.relativePosition = position;
            this.auto = false;
        }

        return this;
    }

    function startDraggableElement() {

        this.draggable = new Wirecloud.ui.Draggable(this.ballElement, {handle: this},
            function ondragstart(draggable, context) {
                context.initialPosition = context.handle.relativePosition;
                context.handle.auto = false;
                context.handle.trigger('dragstart');
            },
            function ondrag(event, draggable, context, offsetX, offsetY) {
                var newPosition = {
                    x: context.initialPosition.x + offsetX,
                    y: context.initialPosition.y + offsetY
                };

                context.handle
                    .position(newPosition)
                    .trigger('drag', newPosition);
            },
            function ondragend(draggable, context) {
                context.handle.trigger('dragend');
            },
            function canDrag() {return true;}
        );

        return this;
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
