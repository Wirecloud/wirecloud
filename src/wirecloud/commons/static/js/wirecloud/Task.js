/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

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
    var Task = function Task(title, executor) {
        if (title == null) {
            throw new TypeError("missing title parameter");
        }

        if (typeof executor !== "function" && !Array.isArray(executor)) {
            throw new TypeError("executor must be a function or a task array");
        } else if (Array.isArray(executor) && executor.length === 0) {
            throw new TypeError("at least one subtask is required");
        }

        privates.set(this, {
            parent: null,
            title: title,
            progress: 0,
            status: "pending",
            value: undefined,
            subtasks: []
        });

        Object.defineProperties(this, {
            title: {
                get: on_title_get
            },
            progress: {
                get: on_progress_get
            },
            status: {
                get: on_status_get
            },
            value: {
                get: on_value_get
            },
            subtasks: {
                get: on_subtasks_get
            }
        });

        StyledElements.ObjectWithEvents.call(this, ['abort', 'fail', 'finish', 'progress', 'nexttask']);

        if (typeof executor === "function") {
            executor(resolve.bind(this), reject.bind(this), update.bind(this));
        } else {
            executor.forEach(addAggregatedTask, this);
            updateAggregatedTaskProgress.call(this);
            on_task_finish.call(this);
        }
    };
    utils.inherit(Task, StyledElements.ObjectWithEvents);

    var update = function update(progress) {
        var priv = privates.get(this);

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

    Task.prototype.abort = function abort(reason, retroactive) {
        var priv = privates.get(this);

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
    };

    var reject = function reject(reason) {
        var priv = privates.get(this);

        if (priv.status === "aborted") {
            return;
        } else if (priv.status !== "pending") {
            throw new Error("Only pending tasks can be resolved");
        }

        priv.status = "rejected";
        priv.value = reason;
        this.dispatchEvent('fail', reason);
    };

    var resolve = function resolve(value) {
        var priv = privates.get(this);

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

    var resolve_then = function resolve_then(tc, callback, next, resolve, reject) {
        var result;

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

    Task.prototype.toString = function toString() {
        return this.title + ': ' + this.progress + '%';
    };

    /**
     * Creates a new task asociated to the progress of the chain of task
     * associated with this instance.
     *
     * @param {String} title new title for this task
     * @returns {Wirecloud.Task}
     */
    Task.prototype.toTask = function toTask(title) {
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
    };

    Task.prototype.catch = function _catch(reject, abort) {
        return this.then(null, reject, abort);
    };

    Task.prototype.renameTask = function renameTask(title) {
        privates.get(this).title = title;
        return this;
    };

    Task.prototype.then = function then(onFulfilled, onRejected, onAborted) {
        return new TaskContinuation(this, onFulfilled, onRejected, onAborted);
    };

    var privates = new WeakMap();

    var TaskContinuation = function TaskContinuation(parent, onFulfilled, onRejected, onAborted) {

        privates.set(this, {
            parent: parent,
            progress: 0,
            status: "pending",
            value: undefined,
            subtasks: []
        });

        Object.defineProperties(this, {
            progress: {
                get: on_progress_get
            },
            type: {
                value: "then"
            },
            status: {
                get: on_status_get
            },
            value: {
                get: on_value_get
            },
            subtasks: {
                get: on_subtasks_get
            }
        });

        StyledElements.ObjectWithEvents.call(this, ['abort', 'fail', 'finish', 'progress', 'upgrade', 'nexttask']);

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
    };
    utils.inherit(TaskContinuation, Task);

    TaskContinuation.prototype.then = Task.prototype.then;
    TaskContinuation.prototype.catch = Task.prototype.catch;

    /**
     * Creates a new task asociated to the progress of the chain of task
     * associated with this instance.
     *
     * @param {String} title new title for this task
     * @returns {Wirecloud.Task}
     */
    TaskContinuation.prototype.toTask = function toTask(title) {
        var current_task;

        if (title == null) {
            // Search root task
            current_task = privates.get(this);
            while (current_task.parent != null) {
                current_task = privates.get(current_task.parent);
            }
            title = current_task.title;
        }
        var task = new Task(title, function (resolve, reject, update) {
            this.then(resolve, reject);
        }.bind(this));

        // loop all the sequence up
        var priv = privates.get(task);
        current_task = this;
        while (current_task != null) {
            current_task.addEventListener("nexttask", (tc, newtask) => {
                var index = priv.subtasks.indexOf(tc);
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
    };

    var on_status_get = function on_status_get() {
        return privates.get(this).status;
    };

    var on_value_get = function on_value_get() {
        return privates.get(this).value;
    };

    var on_progress_get = function on_progress_get() {
        return privates.get(this).progress;
    };

    var on_title_get = function on_title_get() {
        return privates.get(this).title;
    };

    var on_subtasks_get = function on_subtasks_get() {
        return privates.get(this).subtasks.slice(0);
    };

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

    Wirecloud.Task = Task;
    Wirecloud.TaskContinuation = TaskContinuation;

})(Wirecloud.Utils);
