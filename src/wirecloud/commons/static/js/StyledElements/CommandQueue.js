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


(function (utils) {

    "use strict";

    var privates = new WeakMap();

    /**
     * Creates an asyncrhonous FIFO queue.
     */
    var CommandQueue = function CommandQueue(context, callback, stepFunc) {
        privates.set(this, {
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
            return;
        }

        var priv = privates.get(this);
        priv.elements.push(command);

        if (!priv.running) {
            priv.running = true;
            doInit.call(this);
        }
    };

    var doStep = function doStep() {
        var cont, priv = privates.get(this);

        try {
            cont = this.stepFunc(priv.step, this.context);
        } catch (e) {
            doInit.call(this);
        }

        if (cont) {
            var timeDiff = priv.stepTimes[priv.step] - (new Date()).getTime();
            if (timeDiff < 0) {
                timeDiff = 0;
            }

            priv.step++;
            setTimeout(doStep.bind(this), timeDiff);
        } else {
            doInit.call(this);
        }
    };

    var doInit = function doInit() {
        var command, action, timeDiff, priv = privates.get(this);

        do {
            command = priv.elements.shift();
        } while (command !== undefined && !(action = this.callback(this.context, command)));

        if (command === undefined) {
            priv.running = false;
        } else if (action instanceof Promise) {
            action.then(doInit.bind(this), doInit.bind(this));
        } else {
            priv.step = 0;
            priv.stepTimes = action;

            timeDiff = priv.stepTimes[priv.step] - (new Date()).getTime();
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
