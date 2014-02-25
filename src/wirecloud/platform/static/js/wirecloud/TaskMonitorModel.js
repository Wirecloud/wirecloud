/*global Wirecloud*/

(function () {

    "use strict";

    var SubtaskMonitorModel = function SubtaskMonitorModel(title) {
        this.progress = 0;
    };

    SubtaskMonitorModel.prototype.updateTaskProgress = function updateTaskProgress(progress) {
        if (progress < 0) {
            this.progress = 0;
        } else if (progress > 100) {
            this.progress = 100;
        }
    };

    var TaskMonitorModel = function TaskMonitorModel(task, nsubtasks) {
        this.task = task;
        this.nsubtasks = nsubtasks;
        this.currentsubtask = 1;
    };

    TaskMonitorModel.prototype.nextSubtask = function nextSubtask(title) {
        if (title) {
            Wirecloud.GlobalLogManager.log(title, Wirecloud.constants.LOGGING.INFO_MSG);
        }

        this.currentsubtask++;
        if (this.currentsubtask >= this.totalSubTask) {
            this.totalSubTasks = this.currentSubTask + 1;
        }

        return new SubtaskMonitorModel(title);
    };

    Wirecloud.TaskMonitorModel = TaskMonitorModel;

})();
