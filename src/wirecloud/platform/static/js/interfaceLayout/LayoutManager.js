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
        this.alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
            Wirecloud.HistoryManager.pushState(new_alternative.buildStateData());
            this.header._notifyViewChange(new_alternative);
        }.bind(this));
        this.viewsByName = {
            'initial': this.alternatives.createAlternative(),
            'workspace': this.alternatives.createAlternative({'alternative_constructor': WorkspaceView}),
            'wiring': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WiringEditor}),
            'marketplace': this.alternatives.createAlternative({'alternative_constructor': MarketplaceView})
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

        this.currentMenu = null;  // current root dialog
        this.coverLayerElement = document.createElement('div');               // disabling background layer
        this.coverLayerElement.id = 'menu_layer';
        this.coverLayerElement.className = 'disabled_background fade';
        this.coverLayerElement.style.display = 'none';
        document.body.insertBefore(this.coverLayerElement, document.body.firstChild);

        // Listen to resize events
        window.addEventListener("resize", this.resizeWrapper.bind(this), true);
    }

        // ***************
        // PUBLIC METHODS
        // ****************

        var updateSubTaskProgress = function updateSubTaskProgress() {
            this.subTask.updateTaskProgress(Math.round((this.currentStep * 100) / this.totalSteps));
        };

        var updateTaskProgress = function updateTaskProgress(monitor, progress) {
            var msg;

            msg = gettext("%(task)s %(percentage)s%");
            msg = interpolate(msg, {task: monitor.title, percentage: progress}, true);
            document.getElementById("loading-task-title").textContent = msg;

            if (monitor.subtasks.length === 0) {
                msg = '';
            } else if (monitor.subtasks[monitor.currentsubtask].title != "") {
                msg = gettext("%(subTask)s: %(percentage)s%");
                msg = interpolate(msg, {
                    subTask: monitor.subtasks[monitor.currentsubtask].title,
                    percentage: monitor.subtasks[monitor.currentsubtask].progress
                }, true);
            } else {
                msg = "%(percentage)s";
                msg = interpolate(msg, {
                    percentage: monitor.subtasks[monitor.currentsubtask].progress
                }, true);
            }

            document.getElementById("loading-subtask-title").textContent = msg;
        };


        LayoutManager.prototype._startComplexTask = function(task, subtasks) {
            var monitor = new Wirecloud.TaskMonitorModel(task, subtasks);
            document.getElementById("loading-window").classList.remove("disabled");

            this.monitor = monitor; // TODO
            this.monitor.addEventListener('progress', updateTaskProgress);
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
        LayoutManager.prototype.changeCurrentView = function(newView) {
            this.alternatives.showAlternative(this.viewsByName[newView]);
        };

        /*
         * Handler for changes in the hash to navigate to other areas
         */
        LayoutManager.prototype.onHashChange = function(state) {
            var tab_id, tab, nextWorkspace, opManager, dragboard, alert_msg;

            opManager = OpManagerFactory.getInstance();

            nextWorkspace = opManager.workspacesByUserAndName[state.workspace_creator][state.workspace_name];
            if (nextWorkspace == null) {
                if (Wirecloud.activeWorkspace != null) {
                    Wirecloud.activeWorkspace.unload();
                    Wirecloud.activeWorkspace = null;
                }
                alert_msg = document.createElement('div');
                alert_msg.className = 'alert alert-info';
                alert_msg.textContent = gettext('The requested workspace is no longer available (it was deleted).');;
                LayoutManagerFactory.getInstance().viewsByName['workspace'].clear();
                LayoutManagerFactory.getInstance().viewsByName['workspace'].appendChild(alert_msg);
                this.header.refresh();
            } else if (Wirecloud.activeWorkspace == null || (nextWorkspace.id !== Wirecloud.activeWorkspace.id)) {
                Wirecloud.changeActiveWorkspace(nextWorkspace, state.tab);
            }

            if (state.view !== this.alternatives.getCurrentAlternative().view_name) {
                this.alternatives.showAlternative(this.viewsByName[state.view]);
            }
        };

        LayoutManager.prototype.showUnclickableCover = function() {
            this.coverLayerElement.style.display = "block";
            setTimeout(function () {
                this.coverLayerElement.classList.add('in');
            }.bind(this), 0);
        };

        /**
         * @private
         * Only to be used by WindowMenu.
         */
        LayoutManager.prototype._showWindowMenu = function (window_menu) {
            if (!(window_menu instanceof Wirecloud.ui.WindowMenu)) {
                throw TypeError('window_menu must be a WindowMenu instance');
            }

            if (this.currentMenu != null) {
                // only if the layer is displayed.
                this.hideCover();
            }
            this.showUnclickableCover();
            this.currentMenu = window_menu;
        };

        //hides the disabling layer and so, the current menu
        LayoutManager.prototype.hideCover = function() {
            if (this.currentMenu) {
                this.currentMenu.hide();
            }
            this.currentMenu = null;
            this.coverLayerElement.classList.remove('in');
            this.coverLayerElement.style.display = "none";
        }

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
