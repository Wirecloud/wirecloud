/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


var LayoutManagerFactory = function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null;

    // *********************************
    // PRIVATE CONSTANTS
    // *********************************

    function LayoutManager () {
        // *********************************
        // PRIVATE VARIABLES
        // *********************************

        this.mainLayout = new StyledElements.BorderLayout();
        this.mainLayout.getNorthContainer().appendChild(document.getElementById('wirecloud_header'));

        this.alternatives = new StyledElements.StyledAlternatives();
        this.mainLayout.getCenterContainer().appendChild(this.alternatives);
        this.mainLayout.insertInto(document.body);

        /* TODO| FIXME */
        this.header = new Wirecloud.ui.WirecloudHeader(this);
        this.alternatives.addEventListener('preTransition', function (alternatives, old_alternative, new_alternative) {
            this.header._notifyViewChange();
        }.bind(this));
        this.alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
            this.header._notifyViewChange(new_alternative);
        }.bind(this));

        this.viewsByName = {
            'initial': this.alternatives.createAlternative(),
            'workspace': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WorkspaceView}),
            'wiring': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WiringEditor}),
            'marketplace': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.MarketplaceView})
        };

        var plain_content = document.querySelector('.plain_content');
        if (plain_content != null) {
            this.viewsByName.initial.appendChild(plain_content);
        }

        this._clickCallback = this._clickCallback.bind(this);
        this.timeout = null;
        if (document.getElementById("loading-window")) {
            document.getElementById("loading-window").addEventListener('click', this._clickCallback, true);
        }

        // Listen to resize events
        window.addEventListener("resize", this.resizeWrapper.bind(this), true);
    }

        // ***************
        // PUBLIC METHODS
        // ****************

        var updateSubTaskProgress = function updateSubTaskProgress() {
            this.subTask.updateTaskProgress((this.currentStep * 100) / this.totalSteps);
        };

        var updateTaskProgress = function updateTaskProgress(monitor, progress) {
            var msg;

            msg = gettext("%(task)s %(percentage)s%");
            msg = interpolate(msg, {task: monitor.title, percentage: Math.round(progress)}, true);
            document.getElementById("loading-task-title").textContent = msg;

            if (monitor.subtasks.length === 0) {
                msg = '';
            } else if (monitor.subtasks[monitor.currentsubtask].title != "") {
                msg = gettext("%(subTask)s: %(percentage)s%");
                msg = interpolate(msg, {
                    subTask: monitor.subtasks[monitor.currentsubtask].title,
                    percentage: Math.round(monitor.subtasks[monitor.currentsubtask].progress)
                }, true);
            } else {
                msg = "%(percentage)s";
                msg = interpolate(msg, {
                    percentage: Math.round(monitor.subtasks[monitor.currentsubtask].progress)
                }, true);
            }

            document.getElementById("loading-subtask-title").textContent = msg;
        };

        LayoutManager.prototype._init = function _init() {
            this.viewsByName.myresources = this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.MyResourcesView});
        };

        LayoutManager.prototype._startComplexTask = function(task, subtasks) {
            var monitor = new Wirecloud.TaskMonitorModel(task, subtasks);
            document.getElementById("loading-window").classList.remove("disabled");

            this.monitor = monitor; // TODO
            this.monitor.addEventListener('progress', updateTaskProgress);
            updateTaskProgress(monitor, 0);
            return monitor;
        };

        LayoutManager.prototype.logSubTask = function(msg, totalSteps) {
            this.subTask = this.monitor.nextSubtask(msg);

            this.currentStep = 0;
            if (arguments.length == 2) {
                this.totalSteps = totalSteps;
            } else {
                this.totalSteps = 1;
            }

            updateSubTaskProgress.call(this);
        };

        LayoutManager.prototype.logStep = function(msg, totalSteps) {
            this.currentStep++;
            if (this.currentStep > this.totalSteps) {
                this.totalSteps = this.currentStep + 1;
            }

            if (arguments.length == 2) {
                this.totalSteps = totalSteps;
            }

            updateSubTaskProgress.call(this);
        };

        LayoutManager.prototype._hideProgressIndicator = function () {
            var loadingElement = document.getElementById("loading-window");
            var loadingMessage = document.getElementById("loading-message");

            loadingElement.classList.add('disabled');
            loadingElement.classList.remove('fadding');
            loadingMessage.style.opacity = '1';

            if (this.timeout !== null) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        };

        LayoutManager.prototype._clickCallback = function (event) {

            if (document.getElementById("loading-window").classList.contains("fadding")) {
                this._hideProgressIndicator();
            }
            event.stopPropagation();
        };

        LayoutManager.prototype._notifyPlatformReady = function () {
            var loadingElement = document.getElementById("loading-window");
            loadingElement.classList.add("fadding");

            var loadingMessage = document.getElementById("loading-message");
            var step = 0;
            var layoutManager = this;
            function fadder() {
                ++step;
                if (step < 80) {
                    loadingMessage.style.opacity = "" + (1 - (step * 0.025));
                    layoutManager.timeout = setTimeout(fadder, 50);
                } else {
                    layoutManager._hideProgressIndicator();
                }
            }
            if (layoutManager.timeout !== null) {
                clearTimeout(layoutManager.timeout);
            }
            layoutManager.timeout = setTimeout(fadder, 50);
        }

        LayoutManager.prototype.resizeWrapper = function () {
            this.mainLayout.repaint();

            // Recalculate menu positions
            if (this.currentMenu) {
                this.currentMenu.calculatePosition();
            }
        }

        /****VIEW OPERATIONS****/
        LayoutManager.prototype.changeCurrentView = function changeCurrentView(newView, options) {

            if (options === true) {
                options = {};
            } else if (options == null) {
                options = {
                    onComplete: function (alternatives, old_alternative, new_alternative) {
                        Wirecloud.HistoryManager.pushState(new_alternative.buildStateData());
                    }
                };
            }

            this.alternatives.showAlternative(this.viewsByName[newView], options);
        };

        /*
         * Handler for changes in the hash to navigate to other areas
         */
        LayoutManager.prototype.onHashChange = function(state) {
            var nextView = this.viewsByName[state.view];
            if (nextView !== this.alternatives.getCurrentAlternative()) {
                this.changeCurrentView(state.view, true);
            }

            if ('onHistoryChange' in nextView) {
                nextView.onHistoryChange(state);
            }
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
