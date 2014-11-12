/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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


var LayoutManagerFactory = function () {

    var instance = null;

    function LayoutManager () {
        // TODO remove this
        this.header = {
            _initUserMenu: function () {},
            refresh: function () {}
        };
        // end TODO
    }

    // TODO
    LayoutManager.prototype._init = function _init() {
    };

    LayoutManager.prototype._startComplexTask = function _startComplexTask(task, subtasks) {
        this.monitor = new Wirecloud.TaskMonitorModel(task, subtasks);
        return this.monitor;
    };

    LayoutManager.prototype.logSubTask = function logSubTask(msg, totalSteps) {
        this.monitor.nextSubtask(msg);
    };

    LayoutManager.prototype.logStep = function logStep() {
    };

    LayoutManager.prototype._notifyPlatformReady = function _notifyPlatformReady() {
        this.monitor = null;
    };

    LayoutManager.prototype.changeCurrentView = function changeCurrentView() {
    };

    // end TODO

    /*
     * Handler for changes in the hash to navigate to other areas
     */
    LayoutManager.prototype.onHashChange = function(state) {
        var ws_id, tab_id, tab, nextWorkspace, opManager, dragboard;

        opManager = OpManagerFactory.getInstance();

        ws_id = parseInt(state.workspace, 10);
        if (ws_id !== Wirecloud.activeWorkspace.id) {
            nextWorkspace = opManager.workspaceInstances[ws_id];
            Wirecloud.changeActiveWorkspace(nextWorkspace, state.tab);
            return;
        }

        if (state.view !== this.currentViewType) {
            switch (state.view) {
            case "dragboard":
                dragboard = null;
                tab_id = parseInt(state.tab, 10);
                if (state.tab !== Wirecloud.activeWorkspace.visibleTab.id) {
                    tab = Wirecloud.activeWorkspace.getTab(state.tab);
                    if (typeof tab !== "undefined") {
                        dragboard = tab.getDragboard();
                    }
                }
                if (dragboard === null) {
                    dragboard = Wirecloud.activeWorkspace.getActiveDragboard();
                }
                this.showDragboard(dragboard);
                break;
            default:
            }
        }
    };

    LayoutManager.prototype.resizeWrapper = function resizeWrapper(state) {
        updateLayout();
    };

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    return new function() {
        this.getInstance = function() {
            if (instance == null) {
                instance = new LayoutManager();
            }
            return instance;
        }
    }
}();
