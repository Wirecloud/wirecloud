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
     * Create a new instance of class EndpointGroup.
     * @extends {Container}
     *
     * @constructor
     * @param {String} type
     *      [TODO: description]
     * @param {ComponentDraggable} component
     *      [TODO: description]
     * @param {Function} EndpointClass
     *      [TODO: description]
     */
    ns.EndpointGroup = function EndpointGroup(type, component, EndpointClass) {
        se.Container.call(this, {class: "endpoints"});
        this.addClassName(type + "-endpoints");

        this.endpoints = {};
        this.component = component;

        this.EndpointClass = EndpointClass;
        this.originalOrder = [];

        Object.defineProperties(this, {
            modified: {
                get: function get() {
                    return this.canBeOrdered() && !equalsLists(this.originalOrder, this.children.map(function (endpoint) {
                        return endpoint.name;
                    }));
                }
            },
            orderable: {
                get: function get() {return this.hasClassName('orderable');},
                set: function set(value) {this.toggleClassName('orderable', value);}
            },
            type: {value: type}
        });
    };

    ns.EndpointGroup.MIN_LENGTH = 1;

    utils.inherit(ns.EndpointGroup, se.Container, {

        /**
         * [TODO: appendEndpoint description]
         *
         * @param {Wiring.Endpoint} wiringEndpoint
         *      [TODO: description]
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        appendEndpoint: function appendEndpoint(wiringEndpoint) {
            var endpoint = new this.EndpointClass(wiringEndpoint, this.component);
            var missingEndpoint = findFirstMissingEndpoint.call(this);
            var i;

            if (!wiringEndpoint.missing) {
                this.originalOrder.push(endpoint.name);
            }

            if (!wiringEndpoint.missing && missingEndpoint != null) {
                this.prependChild(endpoint, missingEndpoint);
            } else {
                this.appendChild(endpoint);
            }

            this.endpoints[endpoint.name] = endpoint;

            for (i = 0; i < this.children.length; i++) {
                this.children[i].index = i;
            }

            return endpoint;
        },

        /**
         * [TODO: canBeOrdered description]
         *
         * @returns {Boolean}
         *      [TODO: description]
         */
        canBeOrdered: function canBeOrdered() {
            return this.children.length > ns.EndpointGroup.MIN_LENGTH && !hasMissingEndpoints.call(this);
        },

        /**
         * [TODO: getEndpoint description]
         *
         * @param {String} name
         *      [TODO: description]
         * @returns {Endpoint}
         *      [TODO: description]
         */
        getEndpoint: function getEndpoint(name) {
            return this.endpoints[name];
        },

        /**
         * [TODO: refresh description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        refresh: function refresh() {
            var name;

            for (name in this.endpoints) {
                this.endpoints[name].refresh();
            }

            return this;
        },

        /**
         * [TODO: orderEndpoints description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        orderEndpoints: function orderEndpoints(newOrder) {

            if (!this.canBeOrdered()) {
                return this;
            }

            if (newOrder.length < 2 || equalsLists(this.originalOrder, newOrder)) {
                return this;
            }

            if (!equalsLists(this.originalOrder, newOrder, false)) {
                return this;
            }

            newOrder.forEach(function (name, index) {
                var endpoint = this.endpoints[name];

                endpoint.index = index;
                se.Container.prototype.removeChild.call(this, endpoint);
                this.appendChild(endpoint);
            }, this);

            return this;
        },

        removeChild: function removeChild(endpoint) {
            var index = this.originalOrder.indexOf(endpoint.name);
            var i;

            if (index !== -1) {
                this.originalOrder.splice(index, 1);
            }

            se.Container.prototype.removeChild.call(this, endpoint);
            delete this.endpoints[endpoint.name];

            for (i = 0; i < this.children.length; i++) {
                this.children[i].index = i;
            }

            return this;
        },

        /**
         * [TODO: startOrdering description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        startOrdering: function startOrdering() {

            if (!this.canBeOrdered() || this.orderable) {
                return this;
            }

            this.orderable = true;
            this.children.forEach(function (endpoint) {
                makeEndpointDraggable.call(this, endpoint);
            }, this);

            return this;
        },

        /**
         * [TODO: stopOrdering description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        stopOrdering: function stopOrdering() {

            if (!this.orderable) {
                return this;
            }

            this.orderable = false;
            this.children.forEach(function (endpoint) {
                endpoint.draggable.destroy();
            }, this);

            return this;
        },

        /**
         * [TODO: toJSON description]
         *
         * @returns {Array.<String>}
         *      [TODO: description]
         */
        toJSON: function toJSON() {

            if (this.modified) {
                return this.children.map(function (endpoint) {
                    return endpoint.name;
                });
            }

            return [];
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var equalsLists = function equalsLists(list1, list2, sorted) {

        if (typeof sorted !== 'boolean') {
            sorted = true;
        }

        list1 = list1.slice();
        list2 = list2.slice();

        if (!sorted) {
            list1 = list1.sort();
            list2 = list2.sort();
        }

        return list1.join() === list2.join();
    };

    var hasMissingEndpoints = function hasMissingEndpoints() {
        return this.children.some(function (endpoint) {
            return endpoint.missing;
        });
    };

    var findFirstMissingEndpoint = function findFirstMissingEndpoint() {
        var i, endpoint = null;

        for (i = 0; i < this.children.length && endpoint == null; i++) {
            if (this.children[i].missing) {
                endpoint = this.children[i];
            }
        }

        return endpoint;
    };

    var makeEndpointDraggable = function makeEndpointDraggable(endpoint) {

        endpoint.draggable = new Wirecloud.ui.Draggable(endpoint.get(), {group: this},
            function dragstart(draggable, context, event) {
                var endpointBCR, layout, layoutBCR;

                // endpoints > component > layout
                context.layout = context.group.component.parentElement;

                endpointBCR = endpoint.get().getBoundingClientRect();
                layout = context.layout.get();
                layoutBCR = layout.getBoundingClientRect();

                context.x = (event.clientX + layout.scrollLeft) - (layoutBCR.left + (endpoint.get().offsetWidth / 2));
                context.y = (event.clientY + layout.scrollTop) - (layoutBCR.top + (endpointBCR.height / 2));

                context.offsetHeight = event.clientY - (endpointBCR.top + (endpointBCR.height / 2));

                context.clonedEndpoint = endpoint.get().cloneNode(true);
                context.clonedEndpoint.classList.add(endpoint.type + "-endpoint");
                context.clonedEndpoint.classList.add("cloned");

                context.layout.appendChild(context.clonedEndpoint);
                context.clonedEndpoint.style.left = context.x + 'px';
                context.clonedEndpoint.style.top = context.y + 'px';

                endpoint.addClassName("dragging");

                context.marginVertical = 5;

                context.refHeigth = endpointBCR.height + context.marginVertical;
                context.refHeigthUp = (endpointBCR.height / 2) + context.marginVertical;
                context.refHeigthDown = context.refHeigthUp;

                context.canMoveUp = endpoint.index;
                context.canMoveDown = context.group.children.length - (context.canMoveUp + 1);
            },
            function drag(e, draggable, context, xDelta, yDelta) {
                context.clonedEndpoint.style.left = Math.round(context.x + xDelta) + 'px';
                context.clonedEndpoint.style.top = Math.round(context.y + yDelta) + 'px';

                if ((context.canMoveUp > 0) && (-(yDelta + context.offsetHeight) > context.refHeigthUp)) {
                    context.canMoveUp -= 1;
                    context.refHeigthUp += context.refHeigth;

                    context.canMoveDown += 1;
                    context.refHeigthDown -= context.refHeigth;

                    moveUpEndpoint.call(context.group, endpoint);
                } else if ((context.canMoveDown > 0) && ((yDelta + context.offsetHeight) > context.refHeigthDown)) {
                    context.canMoveUp += 1;
                    context.refHeigthUp -= context.refHeigth;

                    context.canMoveDown -= 1;
                    context.refHeigthDown += context.refHeigth;

                    moveDownEndpoint.call(context.group, endpoint);
                }
            },
            function dragend(draggable, context) {
                endpoint.removeClassName("dragging");
                context.layout.removeChild(context.clonedEndpoint);
            },
            function canDrag() {
                return true;
            }
        );

        return this;
    };

    var moveDownEndpoint = function moveDownEndpoint(endpoint) {
        var nextEndpoint, index = endpoint.index;

        if (index == (this.children.length - 1)) {
            return this;
        }

        nextEndpoint = this.children[index + 1];
        endpoint.parent().insertBefore(endpoint.get(), nextEndpoint.get().nextSibling);

        endpoint.index = index + 1;
        nextEndpoint.index = index;

        this.children[index + 1] = endpoint;
        this.children[index] = nextEndpoint;

        return this.refresh();
    };

    var moveUpEndpoint = function moveUpEndpoint(endpoint) {
        var previousEndpoint, index;

        index = endpoint.index;

        if (index === 0) {
            return this;
        }

        previousEndpoint = this.children[index - 1];
        endpoint.parent().insertBefore(endpoint.get(), previousEndpoint.get());

        endpoint.index = index - 1;
        previousEndpoint.index = index;

        this.children[index - 1] = endpoint;
        this.children[index] = previousEndpoint;

        return this.refresh();
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
