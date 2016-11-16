/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     */
    var Task = function Task(title, executor) {
        if (title == null) {
            throw new TypeError("missing title parameter");
        }

        if (typeof executor !== "function") {
            throw new TypeError("executor must be a function");
        }
        privates.set(this, {
            title: title,
            progress: 0,
            status: "pending",
            value: undefined
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
            }
        });

        StyledElements.ObjectWithEvents.call(this, ['abort', 'fail', 'finish', 'progress']);

        executor(resolve.bind(this), reject.bind(this), update.bind(this));
    };
    utils.inherit(Task, StyledElements.ObjectWithEvents);

    var update = function update(progress, title) {
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
        if (title != null) {
            priv.title = title;
        }
        this.dispatchEvent("progress", priv.progress);
    };

    Task.prototype.abort = function abort(reason) {
        var priv = privates.get(this);

        if (priv.status === "pending") {
            priv.status = "aborted";
            priv.value = reason;
            this.dispatchEvent('fail', reason);
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

    var resolve_then = function resolve_then(callback, next, resolve, reject) {
        var result;

        if (typeof callback === 'function') {
            try {
                result = callback(this.value);
            } catch (e) {
                reject(e);
            }
        } else {
            result = this.value;
        }
        if (result != null && typeof result.then === "function") {

            result.then(resolve, reject);
        } else {
            next(result);
        }
    };

    Task.prototype.catch = function _catch(reject) {
        return this.then(null, reject);
    };

    Task.prototype.renameTask = function renameTask(title) {
        privates.get(this).title = title;
        return this;
    };

    Task.prototype.then = function then(onFulfilled, onRejected) {
        return new Promise(function (internal_resolve, internal_reject) {
            if (this.status === 'resolved') {
                resolve_then.call(this, onFulfilled, internal_resolve, internal_resolve, internal_reject);
            } else if (this.status === 'rejected' || this.status === 'aborted') {
                resolve_then.call(this, onRejected, internal_reject, internal_resolve, internal_reject);
            } else {
                this.addEventListener("finish", resolve_then.bind(this, onFulfilled, internal_resolve, internal_resolve, internal_reject));
                this.addEventListener("fail", resolve_then.bind(this, onRejected, internal_reject, internal_resolve, internal_reject));
            }
        }.bind(this));
    };

    var privates = new WeakMap();

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

    Wirecloud.Task = Task;

})(Wirecloud.Utils);
