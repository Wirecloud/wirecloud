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

    var SubtaskMonitorModel = function SubtaskMonitorModel(title) {
        this.title = title;
        this.progress = 0;

        StyledElements.ObjectWithEvents.call(this, ['progress']);
    };
    SubtaskMonitorModel.prototype = new StyledElements.ObjectWithEvents();

    SubtaskMonitorModel.prototype.updateTaskProgress = function updateTaskProgress(progress) {
        if (progress < 0) {
            this.progress = 0;
        } else if (progress > 100) {
            this.progress = 100;
        } else {
            this.progress = progress;
        }
        this.events.progress.dispatch(this, this.progress);
    };

    var updateGlobalTaskProgress = function updateGlobalTaskProgress() {
        var accumulated_progress = 0;

        if (this.subtasks.length !== 0) {
            for (var i = 0; i < this.subtasks.length; i += 1) {
                accumulated_progress += this.subtasks[i].progress;
            }
            this.progress = accumulated_progress / this.subtasks.length;
        } else {
            this.progress = 0;
        }

        this.events.progress.dispatch(this, this.progress);
    };

    var TaskMonitorModel = function TaskMonitorModel(title, nsubtasks) {
        this.title = title;
        this.subtasks = [];
        this.nsubtasks = nsubtasks;
        this.currentsubtask = -1;

        StyledElements.ObjectWithEvents.call(this, ['progress']);
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

        var subtask = new SubtaskMonitorModel(title);
        this.subtasks.push(subtask);
        subtask.addEventListener('progress', updateGlobalTaskProgress.bind(this));
        updateGlobalTaskProgress.call(this);

        return subtask;
    };

    Wirecloud.TaskMonitorModel = TaskMonitorModel;

})();
