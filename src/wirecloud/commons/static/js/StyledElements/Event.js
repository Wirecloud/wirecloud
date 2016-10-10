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
     * This class manages the callbacks of the <code>StyledElement</code>s' events.
     */
    var Event = function Event(context) {
        Object.defineProperties(this, {
            context: {value: context},
            handlers: {value: []}
        });

        map.set(this, {
            dispatching: false
        });
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    Event.prototype.addEventListener = function addEventListener(handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }
        this.handlers.push(handler);
    };

    Event.prototype.removeEventListener = function removeEventListener(handler) {
        var i;

        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }

        for (i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i] === handler) {
                if (map.get(this).dispatching) {
                    this.handlers[i] = null;
                } else {
                    this.handlers.splice(i, 1);
                }
            }
        }
    };

    Event.prototype.clearEventListeners = function clearEventListeners() {
        if (map.get(this).dispatching) {
            this.handlers.forEach(function (callback, index, array) {
                array[index] = null;
            });
        } else {
            this.handlers.length = 0;
        }
    };

    Event.prototype.dispatch = function dispatch() {
        var i;

        map.get(this).dispatching = true;

        for (i = 0; i < this.handlers.length; i++) {
            if (this.handlers[i] == null) {
                continue;
            }
            try {
                this.handlers[i].apply(this.context, arguments);
            } catch (e) {
                if (window.console != null && typeof window.console.error === 'function') {
                    window.console.error(e);
                }
            }
        }

        for (i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i] == null) {
                this.handlers.splice(i, 1);
            }
        }

        map.get(this).dispatching = false;
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var map = new WeakMap();

    StyledElements.Event = Event;

})(StyledElements, StyledElements.Utils);
