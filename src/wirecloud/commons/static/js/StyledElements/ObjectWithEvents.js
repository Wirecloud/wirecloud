/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements */

(function () {

    "use strict";

    /**
     * @abstract
     */
    var ObjectWithEvents = function ObjectWithEvents(events) {
        events = events ? events : [];

        this.events = {};
        for (var i = 0; i < events.length; i++) {
            this.events[events[i]] = new StyledElements.Event();
        }
    };

    /**
     * Añade un listener para un evento indicado.
     */
    ObjectWithEvents.prototype.addEventListener = function addEventListener(event, handler) {
        if (this.events[event] == null) {
            throw new Error(StyledElements.Utils.interpolate("Unhandled event \"%(event)s\"", {event: event}));
        }

        this.events[event].addEventListener(handler);
    };

    ObjectWithEvents.prototype.clearEventListeners = function clearEventListeners(event) {

        if (event == null) {
            for (event in this.events) {
                this.events[event].clearEventListeners();
            }
        } else {
            if (this.events[event] == null) {
                throw new TypeError(StyledElements.Utils.interpolate("Unhandled event \"%(event)s\"", {event: event}));
            }

            this.events[event].clearEventListeners();
        }
    };

    /**
     * Elimina un listener para un evento indicado.
     */
    ObjectWithEvents.prototype.removeEventListener = function removeEventListener(event, handler) {
        if (this.events[event] == null) {
            throw new Error(StyledElements.Utils.interpolate("Unhandled event \"%(event)s\"", {event: event}));
        }

        this.events[event].removeEventListener(handler);
    };

    /**
     * Unsets some internal structures to avoid memory leaks caused by circular
     * references.
     */
    ObjectWithEvents.prototype.destroy = function destroy() {
        this.events = null;
    };

    StyledElements.ObjectWithEvents = ObjectWithEvents;

})();
