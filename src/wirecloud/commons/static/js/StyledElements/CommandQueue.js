/*
 *     Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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


(function (utils) {

    "use strict";

    var privates = new WeakMap();

    /**
     * Creates an asyncrhonous FIFO queue.
     */
    var CommandQueue = function CommandQueue(context, callback) {
        if (typeof callback !== "function") {
            throw new TypeError("callback parameter must be a function");
        }

        privates.set(this, {
            callback: callback,
            context: context,
            elements: [],
            running: false
        });

        Object.defineProperties(this, {
            callback: {
                value: callback
            },
            context: {
                value: context
            },
            running: {
                get: running_getter
            }
        });
    };

    /**
     * Adds a new command into this queue
     *
     * @param command command to add into the queue
     */
    CommandQueue.prototype.addCommand = function addCommand(command) {
        if (command === undefined) {
            return Promise.resolve();
        }

        var priv = privates.get(this);
        var p = new Promise(function (resolve, reject) {
            priv.elements.push({
                command: command,
                resolve: resolve,
                reject: reject
            });
        });

        if (!priv.running) {
            priv.running = true;
            doInit.call(priv);
        }

        return p;
    };

    var doInit = function doInit() {
        var element, action;

        element = this.elements.shift();
        if (element === undefined) {
            this.running = false;
            return;
        }
        try {
            action = this.callback(this.context, element.command);
        } catch (error) {
            element.reject(error);
            doInit.call(this);
        }

        if (action != null && typeof action.then === "function") {
            action.then(
                (value) => {
                    element.resolve(value);
                    doInit.call(this);
                },
                (error) => {
                    element.reject(error);
                    doInit.call(this);
                }
            );
        } else {
            element.resolve(action);
            doInit.call(this);
        }
    };

    var running_getter = function running_getter() {
        return privates.get(this).running;
    };

    StyledElements.CommandQueue = CommandQueue;

})(StyledElements.Utils);
