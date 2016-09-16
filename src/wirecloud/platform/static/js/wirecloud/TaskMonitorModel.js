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


(function () {

    "use strict";

    var TaskMonitor = function TaskMonitor(title) {
        this.title = title;
        privates.set(this, {
            status: "pending",
            progress: 0
        });

        Object.defineProperties(this, {
            status: {
                get: on_status_get
            },
            progress: {
                get: on_progress_get
            }
        });

        StyledElements.ObjectWithEvents.call(this, ['abort', 'fail', 'finish', 'progress']);
    };
    TaskMonitor.prototype = new StyledElements.ObjectWithEvents();

    TaskMonitor.prototype.update = function update(progress, title) {
        var priv = privates.get(this);

        if (typeof progress !== "number") {
            throw new TypeError("progress must be a number");
        }

        if (priv.status === "resolved" && progress === 100) {
            return;
        }

        if (priv.status != "pending") {
            throw new Error("Only pending task can be updated");
        }

        if (progress < 0) {
            priv.progress = 0;
        } else if (progress > 100) {
            priv.progress = 100;
        } else {
            priv.progress = progress;
        }
        if (title != null) {
            this.title = title;
        }
        this.trigger("progress", priv.progress);
        if (priv.progress === 100) {
            priv.status = "resolved";
            this.trigger("finish");
        }
    };

    TaskMonitor.prototype.abort = function abort() {
        var priv = privates.get(this);

        if (priv.status === "pending") {
            priv.status = "aborted";
            this.trigger('fail', msg);
        }
    };

    TaskMonitor.prototype.fail = function fail(msg) {
        var priv = privates.get(this);

        if (priv.status === "pending") {
            priv.status = "rejected";
            this.trigger('fail', msg);
        }
    };

    TaskMonitor.prototype.finish = function finish() {
        this.update(100);
    };

    TaskMonitor.prototype.then = function then(resolve, reject) {
        if (resolve != null) {
            this.addEventListener("finish", resolve);
        }

        if (reject != null) {
            this.addEventListener("fail", reject);
        }
    };

    var on_progress_get = function on_progress_get() {
        return privates.get(this).progress;
    };

    var on_status_get = function on_status_get() {
        return privates.get(this).status;
    };

    var TaskMonitorModel = function TaskMonitorModel(title, nsubtasks) {
        this.title = title;
        this.subtasks = [];
        this.nsubtasks = nsubtasks;
        this.currentsubtask = -1;
        this.status = "pending";

        StyledElements.ObjectWithEvents.call(this, ['abort', 'fail', 'finish', 'progress']);
    };
    TaskMonitorModel.prototype = new StyledElements.ObjectWithEvents();

    TaskMonitorModel.prototype.nextSubtask = function nextSubtask(title) {
        if (title) {
            Wirecloud.GlobalLogManager.log(title, Wirecloud.constants.LOGGING.INFO_MSG);
        }

        this.currentsubtask++;
        if (this.currentsubtask >= this.nsubtasks) {
            this.nsubtasks = this.currentsubtask + 1;
        }

        var subtask = new TaskMonitor(title);
        this.subtasks.push(subtask);
        subtask.addEventListener('progress', updateGlobalTaskProgress.bind(this));
        subtask.addEventListener('abort', on_task_abort.bind(this));
        subtask.addEventListener('fail', on_task_fail.bind(this));
        updateGlobalTaskProgress.call(this);

        return subtask;
    };

    var privates = new WeakMap();

    var updateGlobalTaskProgress = function updateGlobalTaskProgress() {
        var accumulated_progress = 0;

        if (this.subtasks.length !== 0) {
            for (var i = 0; i < this.subtasks.length; i += 1) {
                accumulated_progress += this.subtasks[i].progress;
            }
            this.progress = accumulated_progress / this.nsubtasks;
        } else {
            this.progress = 0;
        }

        this.events.progress.dispatch(this, this.progress);
    };

    var abort_task = function abort_task(task) {
        task.abort();
    };

    var on_task_abort = function on_task_abort(task) {
        if (this.status === "pending") {
            this.status = "aborted";
            this.subtasks.forEach(abort_task);
        }
    };

    var on_task_fail = function on_task_fail(task, msg) {
        if (this.status === "pending") {
            this.status = "rejected";
            this.subtasks.forEach(abort_task);
            this.trigger('fail', msg);
        }
    };

    Wirecloud.TaskMonitorModel = TaskMonitorModel;

})();
