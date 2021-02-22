/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    ns.EndpointGroup = class EndpointGroup extends se.Container {

        /**
         * Create a new instance of class EndpointGroup.
         * @extends {StyledElements.Container}
         *
         * @constructor
         * @param {String} type
         *      [TODO: description]
         * @param {ComponentDraggable} component
         *      [TODO: description]
         */
        constructor(type, component) {
            super({class: "endpoints"});
            this.addClassName(type + "-endpoints");

            this.endpoints = {};
            this.component = component;

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
        }

        /**
         * [TODO: appendEndpoint description]
         *
         * @param {Wiring.Endpoint} wiringEndpoint
         *      [TODO: description]
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        appendEndpoint(wiringEndpoint) {
            var endpoint = new ns.Endpoint(wiringEndpoint, this.component);
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
        }

        /**
         * [TODO: canBeOrdered description]
         *
         * @returns {Boolean}
         *      [TODO: description]
         */
        canBeOrdered() {
            return this.children.length > ns.EndpointGroup.MIN_LENGTH && !hasMissingEndpoints.call(this);
        }

        /**
         * [TODO: getEndpoint description]
         *
         * @param {String} name
         *      [TODO: description]
         * @returns {Endpoint}
         *      [TODO: description]
         */
        getEndpoint(name) {
            return this.endpoints[name];
        }

        /**
         * [TODO: refresh description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        refresh() {
            var name;

            for (name in this.endpoints) {
                this.endpoints[name].refresh();
            }

            return this;
        }

        /**
         * [TODO: orderEndpoints description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        orderEndpoints(newOrder) {

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
        }

        removeChild(endpoint) {
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
        }

        /**
         * [TODO: startOrdering description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        startOrdering() {

            if (!this.canBeOrdered() || this.orderable) {
                return this;
            }

            this.orderable = true;
            this.children.forEach(function (endpoint) {
                makeEndpointDraggable.call(this, endpoint);
            }, this);

            return this;
        }

        /**
         * [TODO: stopOrdering description]
         *
         * @returns {EndpointGroup}
         *      The instance on which the member is called.
         */
        stopOrdering() {

            if (!this.orderable) {
                return this;
            }

            this.orderable = false;
            this.children.forEach(function (endpoint) {
                endpoint.draggable.destroy();
            }, this);

            return this;
        }

        /**
         * [TODO: toJSON description]
         *
         * @returns {Array.<String>}
         *      [TODO: description]
         */
        toJSON() {

            if (this.modified) {
                return this.children.map(function (endpoint) {
                    return endpoint.name;
                });
            }

            return [];
        }

    }
    ns.EndpointGroup.MIN_LENGTH = 1;


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

                let groupBCR = context.group.getBoundingClientRect();
                context.topBorder = groupBCR.top - layoutBCR.top;
                context.ratio = groupBCR.height / context.group.children.length;
            },
            function drag(e, draggable, context, xDelta, yDelta) {
                let yPos = context.y + yDelta;

                context.clonedEndpoint.style.left = (context.x + xDelta) + 'px';
                context.clonedEndpoint.style.top = yPos + 'px';

                let new_index = Math.round((yPos - context.topBorder) / context.ratio);
                if (new_index < 0) {
                    new_index = 0;
                } else if (new_index >= context.group.children.length) {
                    new_index = context.group.children.length - 1;
                }

                if (new_index !== endpoint.index) {
                    moveEndpoint.call(context.group, endpoint, new_index);
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

    var moveEndpoint = function moveEndpoint(endpoint, new_index) {
        se.Container.prototype.removeChild.call(this, endpoint);
        let refElement = this.children[new_index - 1];
        if (refElement) {
            se.Container.prototype.appendChild.call(this, endpoint, refElement);
        } else {
            se.Container.prototype.prependChild.call(this, endpoint);
        }

        this.children.forEach((endpoint, index) => {
            endpoint.index = index;
        });

        return this.refresh();
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
