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

/*global StyledElements*/

(function () {

    "use strict";

    /**
     * This class manages the callbacks of the <code>StyledElement</code>s' events.
     */
    var Event = function Event(context) {
        Object.defineProperties(this, {
            context: {value: context},
            handlers: {value: []}
        });
    };

    Event.prototype.on = function on(handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }
        this.handlers.push(handler);
    };

    Event.prototype.off = function off(handler) {
        if (handler == null) {
            this.handlers.length = 0;
        } else {
            var index = this.handlers.indexOf(handler);
            if (index != -1) {
                this.handlers.splice(index, 1);
            }
        }
    };

    Event.prototype.trigger = function trigger() {
        for (var i = 0; i < this.handlers.length; i++) {
            try {
                this.handlers[i].apply(this.context, arguments);
            } catch (e) {
                if (window.console != null && typeof window.console.error === 'function') {
                    window.console.error(e);
                }
            }
        }
    };

    Event.prototype.addEventListener = function addEventListener(handler) {
        this.on(handler);
    };

    Event.prototype.removeEventListener = function removeEventListener(handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }

        this.off(handler);
    };

    Event.prototype.clearEventListeners = function clearEventListeners() {
        this.off();
    };

    Event.prototype.dispatch = function dispatch() {
        this.trigger.apply(this, arguments);
    };

    StyledElements.Event = Event;

})();
