/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    const privates = new WeakMap();

    const update = function update(progress) {
        const priv = privates.get(this);

        if (priv.status === "aborted") {
            return;
        } else if (priv.status !== "pending") {
            throw new Error("Only pending tasks can be resolved");
        }

        if (progress < 0) {
            priv.progress = 0;
        } else if (progress > 100) {
            priv.progress = 100;
        } else {
            priv.progress = progress;
        }
        this.dispatchEvent("progress", priv.progress);
    };

    const reject = function reject(reason) {
        const priv = privates.get(this);

        if (priv.status === "aborted") {
            return;
        } else if (priv.status !== "pending") {
            throw new Error("Only pending tasks can be resolved");
        }

        priv.status = "rejected";
        priv.value = reason;
        this.dispatchEvent('fail', reason);
    };

    const resolve = function resolve(value) {
        const priv = privates.get(this);

        if (priv.status === "aborted") {
            return;
        } else if (priv.status !== "pending") {
            throw new Error("Only pending tasks can be resolved");
        }

        update.call(this, 100);

        priv.value = value;
        priv.status = "resolved";
        this.dispatchEvent("finish");
    };

    const resolve_then = function resolve_then(tc, callback, next, resolve, reject) {
        let result;

        if (tc.status === 'aborted') {
            return;
        } else if (typeof callback === 'function') {
            try {
                result = callback(this.value);
            } catch (e) {
                reject(e);
                return;
            }
            next = resolve;
        } else {
            result = this.value;
        }

        if (result instanceof Wirecloud.Task) {
            privates.get(tc).subtasks.push(result);
            tc.dispatchEvent("nexttask", result);
        }

        if (result != null && typeof result.then === "function") {
            result.then(resolve, reject);
        } else {
            next(result);
        }
    };

    ns.Task = class Task extends se.ObjectWithEvents {

        /**
         * Like a Promise, but Task have title, and are able to provide
         * progress and be abortable. They are also usable as a standard Promise.
         *
         * @since 1.1
         * @name Wirecloud.Task
         * @constructor
         * @extends {external:StyledElements.ObjectWithEvents}
         *
         * @param {String} title
         * @param {Function|Array.<Wirecloud.Task>} executor
         */
        constructor(title, executor) {
            // TODO find a better way to shortcircuit this constructor from TaskContinuation
            if (executor !== privates) {
                if (title == null) {
                    throw new TypeError("missing title parameter");
                }

                if (typeof executor !== "function" && !Array.isArray(executor)) {
                    throw new TypeError("executor must be a function or a task array");
                } else if (Array.isArray(executor) && executor.length === 0) {
                    throw new TypeError("at least one subtask is required");
                }
            }

            super(['abort', 'fail', 'finish', 'progress', 'nexttask']);

            privates.set(this, {
                parent: null,
                title: title,
                progress: 0,
                status: "pending",
                value: undefined,
                subtasks: []
            });

            if (executor === privates) {
                // TODO find a better way to shortcircuit this constructor from TaskContinuation
                return;
            } else if (typeof executor === "function") {
                executor(resolve.bind(this), reject.bind(this), update.bind(this));
            } else {
                executor.forEach(addAggregatedTask, this);
                updateAggregatedTaskProgress.call(this);
                on_task_finish.call(this);
            }
        }

        get status() {
            return privates.get(this).status;
        }

        get value() {
            return privates.get(this).value;
        }

        get progress() {
            return privates.get(this).progress;
        }

        get title() {
            return privates.get(this).title;
        }

        get subtasks() {
            return privates.get(this).subtasks.slice(0);
        };

        abort(reason, retroactive) {
            const priv = privates.get(this);

            if (priv.status === "pending") {
                priv.status = "aborted";
                priv.value = reason;

                priv.subtasks.forEach((subtask) => {subtask.abort(reason)});
                this.dispatchEvent('abort', reason);
            }

            if (retroactive === true && priv.parent != null && priv.parent.status === "pending") {
                priv.parent.abort(reason, true);
            }

            return this;
        }

        toString() {
            return this.title + ': ' + this.progress + '%';
        }

        /**
         * Creates a new task asociated to the progress of the chain of task
         * associated with this instance.
         *
         * @param {String} title new title for this task
         * @returns {Wirecloud.Task}
         */
        toTask(title) {
            title = title != null ? title : this.title;
            var task = new Task(title, (resolve, reject, update) => {
                this.addEventListener("progress", function (task, progress) {
                    update(progress);
                });
                update(this.progress);
                this.then(resolve, reject);
            });
            privates.get(task).subtasks.push(this);
            return task;
        }

        renameTask(title) {
            privates.get(this).title = title;
            return this;
        }

        then(onFulfilled, onRejected, onAborted) {
            return new ns.TaskContinuation(this, onFulfilled, onRejected, onAborted);
        }

    }


    ns.Task.prototype.catch = function _catch(reject, abort) {
        return this.then(null, reject, abort);
    };

    /**
     * The `finally()` method returns a `Wirecloud.Task`. When the promise is
     * settled, i.e either fulfilled, aborted or rejected, the specified
     * callback function is executed. This provides a way for code to be run
     * whether the promise was fulfilled successfully, aborted or rejected
     * once the `Wirecloud.Task` has been dealt with.
     *
     * @param {Function} onFinally A `Function` called when the `Wirecloud.Task`
     *                             is settled.
     * @returns {Wirecloud.Task}
     */
    ns.Task.prototype.finally = function _finally(onFinally) {
        return this.then(onFinally, onFinally, onFinally);
    };

    ns.TaskContinuation = class TaskContinuation extends ns.Task {

        constructor(parent, onFulfilled, onRejected, onAborted) {
            // TODO find a better way to shortcircuit Task constructor
            super(null, privates);

            privates.get(this).parent = parent;

            Object.defineProperties(this, {
                type: {
                    value: "then"
                }
            });

            var internal_resolve = resolve.bind(this);
            var internal_reject = reject.bind(this);
            var internal_abort = this.abort.bind(this);
            if (parent.status === 'resolved') {
                resolve_then.call(parent, this, onFulfilled, internal_resolve, internal_resolve, internal_reject);
            } else if (parent.status === 'rejected') {
                resolve_then.call(parent, this, onRejected, internal_reject, internal_resolve, internal_reject);
            } else if (parent.status === 'aborted') {
                resolve_then.call(parent, this, onAborted, internal_abort, internal_resolve, internal_reject);
            } else /* if (parent.status === 'pending') */ {
                parent.addEventListener("finish", resolve_then.bind(parent, this, onFulfilled, internal_resolve, internal_resolve, internal_reject));
                parent.addEventListener("fail", resolve_then.bind(parent, this, onRejected, internal_reject, internal_resolve, internal_reject));
                parent.addEventListener("abort", resolve_then.bind(parent, this, onAborted, internal_abort, internal_resolve, internal_reject));
            }
        }

        /**
         * Creates a new task asociated to the progress of the chain of task
         * associated with this instance.
         *
         * @param {String} title new title for this task
         * @returns {Wirecloud.Task}
         */
        toTask(title) {
            let current_task;

            if (title == null) {
                // Search root task
                current_task = privates.get(this);
                while (current_task.parent != null) {
                    current_task = privates.get(current_task.parent);
                }
                title = current_task.title;
            }
            const task = new ns.Task(title, (resolve, reject, update) => {
                this.then(resolve, reject);
            });

            // loop all the sequence up
            const priv = privates.get(task);
            current_task = this;
            while (current_task != null) {
                current_task.addEventListener("nexttask", (tc, newtask) => {
                    const index = priv.subtasks.indexOf(tc);
                    priv.subtasks[index] = newtask;
                    newtask.addEventListener('progress', updateAggregatedTaskProgress.bind(task));
                    updateAggregatedTaskProgress.call(task);
                });
                priv.subtasks.push(current_task);
                current_task = privates.get(current_task).parent;
            }
            priv.subtasks = priv.subtasks.reverse();
            priv.subtasks[0].addEventListener('progress', updateAggregatedTaskProgress.bind(task));
            updateAggregatedTaskProgress.call(task);

            return task;
        }

    }

    var on_task_finish = function on_task_finish() {
        var priv = privates.get(this);
        var status = null;

        priv.subtasks.some(function (task) {
            if (task.status === "pending") {
                status = "pending";
                // Stop looping
                return true;
            } else if (task.status === "aborted") {
                status = "aborted";
            } else if (task.status === "resolved" && status === null) {
                status = "resolved";
            } else if (task.status === "rejected" && status !== "aborted") {
                status = "rejected";
            }
        });

        if (status !== "pending") {
            priv.value = priv.subtasks.map(function (task) {return task.value});
            priv.status = status;
            switch (status) {
            case "resolved":
                this.dispatchEvent("finish");
                break;
            case "rejected":
            case "aborted":
                this.dispatchEvent("fail");
                break;
            }
        }
    };

    var addAggregatedTask = function addAggregatedTask(task) {
        var priv = privates.get(this);

        priv.subtasks.push(task);
        task.addEventListener('progress', updateAggregatedTaskProgress.bind(this));
        task.addEventListener('finish', on_task_finish.bind(this));
        task.addEventListener('fail', on_task_finish.bind(this));
        task.addEventListener('abort', on_task_finish.bind(this));
    };

    var updateAggregatedTaskProgress = function updateAggregatedTaskProgress() {
        var priv, accumulated_progress = 0;

        priv = privates.get(this);

        priv.subtasks.forEach((subtask) => {
            accumulated_progress += subtask.progress;
        });
        priv.progress = accumulated_progress / priv.subtasks.length;

        this.dispatchEvent("progress", priv.progress);
    };

})(Wirecloud, StyledElements, Wirecloud.Utils);
