/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * Esta clase se encarga de gestionar los eventos que van a manejar los
     * <code>StyledElement</code>s.
     */
    var Event = function Event() {
        this.handlers = [];
    };

    Event.prototype.addEventListener = function addEventListener(handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }
        this.handlers.push(handler);
    };

    Event.prototype.removeEventListener = function removeEventListener(handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handlers must be functions');
        }
        var index = this.handlers.indexOf(handler);
        if (index != -1) {
            this.handlers.splice(index, 1);
        }
    };

    Event.prototype.clearEventListeners = function clearEventListeners() {
        this.handlers.length = 0;
    };

    Event.prototype.dispatch = function dispatch() {
        for (var i = 0; i < this.handlers.length; i++) {
            try {
                this.handlers[i].apply(null, arguments);
            } catch (e) {}
        }
    };

    StyledElements.Event = Event;

})();
