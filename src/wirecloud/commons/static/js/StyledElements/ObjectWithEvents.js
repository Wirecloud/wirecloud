/**
 *  This file is part of Wirecloud.
 *  Copyright (C) 2008-2015  CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class ObjectWithEvents
     * @mixin
     *
     * @constructor
     * @param {String[]} names [description]
     */
    se.ObjectWithEvents = utils.defineClass({

        constructor: function ObjectWithEvents(names) {
            this.events = {};

            (Array.isArray(names) ? names : []).forEach(function (name) {
                this.events[name] = new se.Event(this);
            }, this);
        },

        members: {

            /**
             * Remove an event handler from one or more existing events.
             * @version 0.6
             *
             * @param {String} [names]
             *      Optional. One or more space-separated event names.
             * @param {Function} [handler]
             *      Optional. An event handler previously attached.
             * @returns {ObjectWithEvents}
             *      The instance on which the member is called.
             */
            off: function off(names, handler) {
                names = typeof names !== 'string' ? "" : names.trim();
                names = names ? names.split(/\s+/) : Object.keys(this.events);
                for (var i = 0; i < names.length; i++) {
                    this.events[names[i]].off(handler);
                }

                return this;
            },

            /**
             * Attach an event handler for one or more existing events.
             * @version 0.6
             *
             * @param {String} names
             *      One or more space-separated event names.
             * @param {Function} handler
             *      An event handler to execute when the event is triggered.
             * @returns {ObjectWithEvents}
             *      The instance on which the member is called.
             */
            on: function on(names, handler) {
                names = typeof names !== 'string' ? "" : names.trim();

                if (names) {
                    names = names.split(/\s+/);
                    for (var i = 0; i < names.length; i++) {
                        this.events[names[i]].on(handler);
                    }
                }

                return this;
            },

            /**
             * Execute all event handlers attached for the existing event.
             * @version 0.6
             *
             * @param {String} name
             *      A string containing a existing event.
             * @returns {ObjectWithEvents}
             *      The instance on which the member is called.
             */
            trigger: function trigger(name) {
                var handlerArgs;

                if (!(name in this.events)) {
                    throw new Error(utils.interpolate("Unhandled event '%(name)s'", {
                        name: name
                    }));
                }

                handlerArgs = [this].concat(Array.prototype.slice.call(arguments, 1));
                this.events[name].trigger.apply(this.events[name], handlerArgs);

                return this;
            },

            /**
             * @deprecated since version 0.6
             */
            addEventListener: function addEventListener(name, handler) {

                if (!(name in this.events)) {
                    throw new Error(utils.interpolate("Unhandled event '%(name)s'", {
                        name: name
                    }));
                }

                this.events[name].addEventListener(handler);

                return this;
            },

            /**
             * @deprecated since version 0.6
             */
            clearEventListeners: function clearEventListeners(name) {

                if (typeof name !== 'string') {
                    for (name in this.events) {
                        this.events[name].clearEventListeners();
                    }

                    return this;
                }

                if (!(name in this.events)) {
                    throw new Error(utils.interpolate("Unhandled event '%(name)s'", {
                        name: name
                    }));
                }

                this.events[name].clearEventListeners();

                return this;
            },

            /**
             * @deprecated since version 0.6
             */
            destroy: function destroy() {
                this.events = null;

                return this;
            },

            /**
             * @deprecated since version 0.6
             */
            removeEventListener: function removeEventListener(name, handler) {

                if (!(name in this.events)) {
                    throw new Error(utils.interpolate("Unhandled event '%(name)s'", {
                        name: name
                    }));
                }

                this.events[name].removeEventListener(handler);

                return this;
            }

        }

    });

})(StyledElements, StyledElements.Utils);
