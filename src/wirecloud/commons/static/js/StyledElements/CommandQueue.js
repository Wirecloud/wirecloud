/*
 *     Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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
    var CommandQueue = function CommandQueue(context, callback, stepFunc) {
        privates.set(this, {
            callback: callback,
            context: context,
            elements: [],
            running: false,
            step: 0,
            stepTimes: null
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
            },
            stepFunc: {
                value: stepFunc
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

    var doStep = function doStep() {
        var cont;

        try {
            cont = this.stepFunc(this.step, this.context);
        } catch (e) {
            doInit.call(this);
        }

        if (cont) {
            var timeDiff = this.stepTimes[this.step] - (new Date()).getTime();
            if (timeDiff < 0) {
                timeDiff = 0;
            }

            this.step++;
            setTimeout(doStep.bind(this), timeDiff);
        } else {
            doInit.call(this);
        }
    };

    var doInit = function doInit() {
        var element, action, timeDiff;

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

        if (action === false) {
            element.resolve();
            doInit.call(this);
        } else if (typeof action.then === "function") {
            action.then(
                function (value) {
                    element.resolve(value);
                    doInit.call(this);
                }.bind(this),
                function (error) {
                    element.reject(error);
                    doInit.call(this);
                }.bind(this)
            );
        } else {
            this.step = 0;
            this.stepTimes = action;

            timeDiff = this.stepTimes[this.step] - (new Date()).getTime();
            if (timeDiff < 0) {
                timeDiff = 0;
            }
            setTimeout(doStep.bind(this), timeDiff);
        }
    };

    var running_getter = function running_getter() {
        return privates.get(this).running;
    };

    StyledElements.CommandQueue = CommandQueue;

})(StyledElements.Utils);
