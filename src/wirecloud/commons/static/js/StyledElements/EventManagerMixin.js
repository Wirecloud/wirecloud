/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements */


StyledElements.EventManagerMixin = (function () {

    "use strict";

    /**
     * Create a new instance of class EventManagerMixin.
     * @mixin
     * @class
     *
     * @param {Array.<String>} nameList
     */
    var EventManagerMixin = function EventManagerMixin(nameList) {
        var i;

        this.eventList = {};

        if (!Array.isArray(nameList)) {
            nameList = [];
        }

        for (i = 0; i < nameList.length; i++) {
            this.eventList[nameList[i]] = [];
        }
    };

    /**
     * Register the event handler given.
     * @public
     * @function
     *
     * @param {String} eventType
     * @param {Function} eventHandler
     * @returns {EventManagerMixin} The instance on which this function was called.
     */
    EventManagerMixin.prototype.addEventListener = function addEventListener(eventType, eventHandler) {
        if (eventType in this.eventList) {
            this.eventList[eventType].push(eventHandler);
        }

        return this;
    };

    /**
     * Execute all event handlers registered of the event type given.
     * @public
     * @function
     *
     * @param {String} eventType
     * @returns {EventManagerMixin} The instance on which this function was called.
     */
    EventManagerMixin.prototype.dispatchEvent = function dispatchEvent(eventType) {
        return function executeAllHandlers(eventTarget, originalEvent) {
            var i;

            if (eventType in this.eventList) {
                for (i = 0; i < this.eventList[eventType].length; i++) {
                    this.eventList[eventType][i](eventTarget, originalEvent);
                }
            }

            return this;
        }.bind(this);
    };

    /**
     * Empty all event handlers registered of the event type given.
     * @public
     * @function
     *
     * @param {String} [eventType]
     * @returns {EventManagerMixin} The instance on which this function was called.
     */
    EventManagerMixin.prototype.emptyEventListener = function emptyEventListener(eventType) {
        var eventName;

        if (typeof eventType === 'undefined') {
            for (eventName in this.eventList) {
                this.eventList[eventName].length = 0;
            }
        } else {
            if (eventType in this.eventList) {
                this.eventList[eventType].length = 0;
            }
        }

        return this;
    };

    /**
     * Remove the event handler given previously registered.
     * @public
     * @function
     *
     * @param {String} eventType
     * @param {Function} eventHandler
     * @returns {EventManagerMixin} The instance on which this function was called.
     */
    EventManagerMixin.prototype.removeEventListener = function removeEventListener(eventType, eventHandler) {
        var handlerIndex;

        if (eventType in this.eventList) {
            if ((handlerIndex=this.eventList[eventType].indexOf(eventHandler)) != -1) {
                this.eventList[eventType].splice(handlerIndex, 1);
            }
        }

        return this;
    };

    return EventManagerMixin;

})();
