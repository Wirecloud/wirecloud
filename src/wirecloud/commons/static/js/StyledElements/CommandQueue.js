/*
 *     Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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

    const privates = new WeakMap();

    const doInit = function doInit(priv) {

        const element = priv.elements.shift();
        if (element === undefined) {
            priv.running = false;
            this.dispatchEvent("stop");
            return;
        }
        let action;
        try {
            action = priv.callback(priv.context, element.command);
        } catch (error) {
            element.reject(error);
            doInit.call(this, priv);
        }

        if (action != null && typeof action.then === "function") {
            action.then(
                (value) => {
                    element.resolve(value);
                    doInit.call(this, priv);
                },
                (error) => {
                    element.reject(error);
                    doInit.call(this, priv);
                }
            );
        } else {
            element.resolve(action);
            doInit.call(this, priv);
        }
    };

    /**
     * Creates an asyncrhonous FIFO queue.
     */
    StyledElements.CommandQueue = class CommandQueue extends se.ObjectWithEvents {

        constructor(context, callback) {
            if (typeof callback !== "function") {
                throw new TypeError("callback parameter must be a function");
            }

            super(["start", "stop"]);

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
                }
            });
        }

        /**
         * Adds a new command into this queue
         *
         * @param command command to add into the queue
         */
        addCommand(command) {
            if (command === undefined) {
                return Promise.resolve();
            }

            const priv = privates.get(this);
            const p = new Promise(function (resolve, reject) {
                priv.elements.push({
                    command: command,
                    resolve: resolve,
                    reject: reject
                });
            });

            if (!priv.running) {
                priv.running = true;
                this.dispatchEvent("start");
                doInit.call(this, priv);
            }

            return p;
        }

        get running() {
            return privates.get(this).running;
        }

    }

})(StyledElements, StyledElements.Utils);
