/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Creates a new instance of class ObjectWithEvents
     *
     * @since 0.5
     *
     * @mixin
     *
     * @name StyledElements.ObjectWithEvents
     * @param {String[]} names List of event names to handle
     */
    se.ObjectWithEvents = function ObjectWithEvents(names) {
        this.events = {};

        (Array.isArray(names) ? names : []).forEach(function (name) {
            this.events[name] = new se.Event(this);
        }, this);
    };

    se.ObjectWithEvents.prototype = /** @lends StyledElements.ObjectWithEvents.prototype */ {

        /**
         * Executes all event handlers attached for the existing event.
         *
         * @since 0.6
         *
         * @param {String} name
         *      A string containing a existing event.
         *
         * @returns {StyledElements.ObjectWithEvents}
         *      The instance on which the member is called.
         */
        dispatchEvent: function dispatchEvent(name) {
            var handlerArgs;

            if (!(name in this.events)) {
                throw new Error(utils.interpolate("Unhandled event '%(name)s'", {
                    name: name
                }));
            }

            handlerArgs = [this].concat(Array.prototype.slice.call(arguments, 1));
            this.events[name].dispatch.apply(this.events[name], handlerArgs);

            return this;
        },

        /**
         * Attaches an event handler to a given event.
         *
         * @since 0.5
         *
         * @param {String} name
         *      Event name
         * @param {Function} handler
         *      An event handler to execute when the event is triggered
         *
         * @returns {StyledElements.ObjectWithEvents}
         *      The instance on which the member is called
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
         * Removes all event handlers for a given event.
         *
         * @since 0.5
         *
         * @param {String} name
         *      event name
         *
         * @returns {StyledElements.ObjectWithEvents}
         *      The instance on which the member is called
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
         * Removes an event handler from a given event.
         *
         * @since 0.5
         *
         * @param {String} name
         *      Event name
         * @param {Function} handler
         *      A previously attached event
         *
         * @returns {StyledElements.ObjectWithEvents}
         *      The instance on which the member is called
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

    };

    /**
     * Attaches an event handler for a given event. This method is an alias of
     * {@link StyledElements.ObjectWithEvents#addEventListener}.
     *
     * @since 0.7
     *
     * @memberof StyledElements.ObjectWithEvents
     * @name StyledElements.ObjectWithEvents#on
     * @method
     *
     * @param {String} name
     *      Event name
     * @param {Function} handler
     *      An event handler to execute when the event is triggered
     *
     * @returns {StyledElements.ObjectWithEvents}
     *      The instance on which the member is called
     */
    se.ObjectWithEvents.prototype.on = se.ObjectWithEvents.prototype.addEventListener;

    /**
     * Removes an event handler from a given event. This method is an alias of
     * {@link StyledElements.ObjectWithEvents#removeEventListener}.
     *
     * @since 0.7
     *
     * @memberof StyledElements.ObjectWithEvents
     * @name StyledElements.ObjectWithEvents#off
     * @method
     *
     * @param {String} name
     *      Event name
     * @param {Function} handler
     *      A previously attached event
     *
     * @returns {StyledElements.ObjectWithEvents}
     *      The instance on which the member is called
     */
    se.ObjectWithEvents.prototype.off = se.ObjectWithEvents.prototype.removeEventListener;

})(StyledElements, StyledElements.Utils);
