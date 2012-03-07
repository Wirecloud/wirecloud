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
        this.mainLayout.getNorthContainer().appendChild($('wirecloud_header'));

        this.alternatives = new StyledElements.StyledAlternatives();
        this.mainLayout.getCenterContainer().appendChild(this.alternatives);
        this.mainLayout.insertInto(document.body);

        /* TODO| FIXME */
        this.header = new WirecloudHeader(this);
        this.alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
            this._notifyViewChange(new_alternative);
        }.bind(this.header));
        this.viewsByName = {
            'workspace': this.alternatives.createAlternative({'alternative_constructor': WorkspaceView}),
            'wiring': this.alternatives.createAlternative({'alternative_constructor': WiringInterface}),
            'catalogue': this.alternatives.createAlternative({'alternative_constructor': CatalogueView}),
            'logs': this.alternatives.createAlternative()
        };
        this.header._notifyViewChange(this.viewsByName['workspace']);

        // Container managed by LayOutManager: {showcase_tab}
        // Remaining containers managed by WorkSpaces!!
        this.logs = LogManagerFactory.getInstance();
        this.logsLink = $('logs_link');

        this._clickCallback = this._clickCallback.bind(this);
        this.timeout = null;
        $("loading-window").observe('click', this._clickCallback);

        // Menu Layer
        this.currentMenu = null;                                                // current menu (either dropdown or window)
        this.coverLayerElement = $('menu_layer');                               // disabling background layer
        this.coverLayerEvent = function () {this.hideCover()}.bind(this);       // disabling layer onclick event (by default)

        this.menus = new Array();

        // Listen to resize events
        Event.observe(window, "resize", this.resizeWrapper.bind(this));
    }

        // ***************
        // PUBLIC METHODS
        // ****************


        LayoutManager.prototype._updateTaskProgress = function() {
            var msg, subtaskpercentage, taskpercentage;

            subtaskpercentage = Math.round((this.currentStep * 100) / this.totalSteps);
            if (subtaskpercentage < 0) {
                subtaskpercentage = 0;
            } else if (subtaskpercentage > 100) {
                subtaskpercentage = 100;
            }

            taskpercentage = (this.currentSubTask * 100) / this.totalSubTasks;
            taskpercentage += subtaskpercentage * (1 / this.totalSubTasks);
            taskpercentage = Math.round(taskpercentage);
            if (taskpercentage < 0) {
                taskpercentage = 0;
            } else if (taskpercentage > 100) {
                subtaskpercentage = 100;
            }

            msg = gettext("%(task)s %(percentage)s%");
            msg = interpolate(msg, {task: this.task, percentage: taskpercentage}, true);
            $("loading-task-title").textContent = msg;

            if (this.subTask != "") {
                msg = gettext("%(subTask)s: %(percentage)s%");
            } else {
                msg = "%(subTask)s";
            }

            msg = interpolate(msg, {subTask: this.subTask, percentage: subtaskpercentage}, true);
            $("loading-subtask-title").setTextContent(msg);
        }

        LayoutManager.prototype._startComplexTask = function(task, subtasks) {
            this.task = task ? task : "";
            this.currentSubTask = -2;
            this.totalSubTasks = subtasks != undefined ? subtasks : 1;
            this.logSubTask("");
            $("loading-window").removeClassName("disabled");
        }

        LayoutManager.prototype.logSubTask = function(msg, totalSteps) {
            this.subTask = msg ? msg : "";

            if (msg) {
                LogManagerFactory.getInstance().log(msg, Constants.Logging.INFO_MSG);
            }

            this.currentSubTask++;
            if (this.currentSubTask >= this.totalSubTasks)
                this.totalSubTasks = this.currentSubTask + 1;

            this.currentStep = 0;
            if (arguments.length == 2)
                this.totalSteps = totalSteps;
            else
                this.totalSteps = 1;

            this._updateTaskProgress();
        }

        LayoutManager.prototype.logStep = function(msg, totalSteps) {
            //$("loading-step-title").setTextContent(msg ? msg : "");
            this.currentStep++;
            if (this.currentStep > this.totalSteps)
                this.totalSteps = this.currentStep + 1;

            if (arguments.length == 2)
                this.totalSteps = totalSteps;

            this._updateTaskProgress();
        }

        LayoutManager.prototype._hideProgressIndicator = function () {
            var loadingElement = $("loading-window");
            var loadingMessage = $("loading-message");

            loadingElement.addClassName('disabled');
            loadingElement.removeClassName('fadding');
            loadingMessage.setStyle({'opacity': '1'});

            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        };

        LayoutManager.prototype._clickCallback = function (event) {
            event = event || window.event;

            if ($("loading-window").hasClassName("fadding")) {
                this._hideProgressIndicator();
            }
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
        };

        LayoutManager.prototype._notifyPlatformReady = function () {
            var loadingElement = $("loading-window");
            loadingElement.addClassName("fadding");

            var loadingMessage = $("loading-message");
            var step = 0;
            var layoutManager = this;
            function fadder() {
                ++step;
                if (step < 80) {
                    loadingMessage.setStyle({'opacity': 1 - (step * 0.025)});
                    layoutManager.timeout = setTimeout(fadder, 50);
                } else {
                    layoutManager._hideProgressIndicator();
                }
            }
            layoutManager.timeout = setTimeout(fadder, 50);
        }

        LayoutManager.prototype.getCurrentViewType = function () {
            return this.currentViewType;
        }

        LayoutManager.prototype.resizeContainer = function (container) {
        }

        LayoutManager.prototype.resizeWrapper = function () {
            this.mainLayout.repaint();

            // Recalculate menu positions
            if (this.currentMenu) {
                this.currentMenu.calculatePosition();
            }
        }

        LayoutManager.prototype.unloadCurrentView = function () {
            if (this.currentView) {
                this.currentView.hide();
                this.currentView = null;
            }
        }


        /****VIEW OPERATIONS****/
        LayoutManager.prototype.notifyError = function (labelContent) {
            // TODO
        };

        LayoutManager.prototype.clearErrors = function (labelContent) {
            /*this.logsLink.innerHTML = '';
            this.logsLink.style.display = 'none';*/
            this.logsLink.removeClassName('highlighted');
        }

        LayoutManager.prototype.changeCurrentView = function(newView) {
            this.alternatives.showAlternative(this.viewsByName[newView]);
        };

        /*
         * Handler for changes in the hash to navigate to other areas
         */
        LayoutManager.prototype.onHashChange = function(state) {
            var ws_id, tab_id, tab, nextWorkspace, opManager, dragboard;

            opManager = OpManagerFactory.getInstance();

            ws_id = parseInt(state.workspace, 10);
            if (ws_id !== opManager.activeWorkSpace.getId()) {
                nextWorkspace = opManager.workSpaceInstances[ws_id];
                opManager.changeActiveWorkSpace(nextWorkspace, state.tab);
                return;
            }

            if (state.view !== this.currentViewType) {
                this.alternatives.showAlternative(this.viewsByName[state.view]);
            }
        };

        //the disabling layer can be clicable (in order to hide a menu) or not
        LayoutManager.prototype.showClickableCover = function() {
            this.coverLayerElement.style.display = "block";
            Event.observe(this.coverLayerElement, "click", this.coverLayerEvent);
        };

        LayoutManager.prototype.showUnclickableCover = function() {
            this.coverLayerElement.addClassName('disabled_background');
            this.coverLayerElement.style.display="block";
        };

        /**
         * Shows a yes/no question dialog.
         *
         * @param {String} msg message to show to the user
         * @param {function} yesHandler
         * @param {function}
         * @param {Constants.Logging} type (default: Constants.logging.INFO_MSG)
         */
        LayoutManager.prototype.showYesNoDialog = function(msg, yesHandler, noHandler, type) {
            if (this.currentMenu != null) {
                // only if the layer is displayed.
                this.hideCover();
            }

            this.showUnclickableCover();

            if (!this.menus['alertMenu'])
                this.menus['alertMenu'] = new AlertWindowMenu();

            this.currentMenu = this.menus['alertMenu'];
            this.currentMenu.setMsg(msg);
            this.currentMenu.setHandler(yesHandler, noHandler);
            this.currentMenu.show();
        }

        /**
         * @private
         * Only to be used by WindowMenu.
         */
        LayoutManager.prototype._showWindowMenu = function (window_menu) {
            if (!(window_menu instanceof WindowMenu)) {
                throw TypeError('window_menu must be a WindowMenu instance');
            }

            if (this.currentMenu != null) {
                // only if the layer is displayed.
                this.hideCover();
            }
            this.showUnclickableCover();
            this.currentMenu = window_menu;
        };

        /**
         * @deprecated
         * Shows the asked window menu
         */
        LayoutManager.prototype.showWindowMenu = function(window, handlerYesButton, handlerNoButton, extra_data) {
            var newMenu;

            //the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            switch (window) {
            case 'useBrokenTheme':
                if (!this.menus['alertMenu']) {
                    this.menus['alertMenu'] = new AlertWindowMenu();
                }
                newMenu = this.menus['alertMenu'];
                newMenu.setMsg(gettext('Do you really want to remove this tab?'));
                newMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().deleteTab();}, handlerNoButton);
                break;
            case 'cancelService':
                if (!this.menus['alertMenu']) {
                    this.menus['alertMenu'] = new AlertWindowMenu(null);
                }
                newMenu = this.menus['alertMenu'];
                newMenu.setMsg(gettext('Do you want to cancel the subscription to the service?'));
                newMenu.setHandler(handlerYesButton, handlerNoButton);
                break;
            case 'publishWorkSpace':
                newMenu = new PublishWindowMenu(OpManagerFactory.getInstance().activeWorkSpace);
                break;
            case 'addFeed':
                if (!this.menus['addFeedMenu']) {
                    this.menus['addFeedMenu'] = new AddFeedMenu();
                }
                newMenu = this.menus['addFeedMenu'];
                break;
            case 'addSite':
                if (!this.menus['addSiteMenu']) {
                    this.menus['addSiteMenu'] = new AddSiteMenu();
                }
                newMenu = this.menus['addSiteMenu'];
                break;
            case 'addMashup':
                if (!this.menus['addMashupMenu']) {
                    this.menus['addMashupMenu'] = new AddMashupWindowMenu(null);
                }
                newMenu = this.menus['addMashupMenu'];
                newMenu.setMsg(gettext('You are going to add a Mashup that could be composed by more than one gadget. Do you want to add it to a new Workspace or to the current one?'));
                newMenu.setHandler(handlerYesButton, handlerNoButton);
                break;
            default:
                return;
            }
            newMenu.show();
        }

        //Shows the background and on click the message on front disappear
        LayoutManager.prototype.showTransparentBackground = function() {
            this.coverLayerElement.addClassName('disabled_background');
            this.coverLayerElement.style.display="block";

            Event.observe( this.coverLayerElement, "click", this.coverLayerEvent);
        }

        //Shows the message information
        LayoutManager.prototype.showTipMessage = function(msg, type) {
            var platformPreferences = PreferencesManagerFactory.getInstance().getPlatformPreferences();

            if (!platformPreferences.get('tip-' + type)) // Do not show me anymore
                return;

            // the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }

            this.showUnclickableCover();

            if (!this.menus['tipMenu'])
                this.menus['tipMenu'] = new TipWindowMenu();

            this.currentMenu = this.menus['tipMenu'];
            this.currentMenu.setMsg(msg);
            this.currentMenu.show(type);
        }

        // Shows a generic information dialog
        LayoutManager.prototype.showInfoMessage = function(msg, type, title) {
            var platformPreferences = PreferencesManagerFactory.getInstance().getPlatformPreferences();

            if (!platformPreferences.get('tip-' + type)) // Do not show me anymore
                return;

            // the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }

            this.showUnclickableCover();

            this.currentMenu = new InfoWindowMenu(title);
            this.currentMenu.setMsg(msg);
            this.currentMenu.show(type);
        }

        // Shows a generic alert dialog
        LayoutManager.prototype.showAlertMessage = function(msg) {
            // the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }

            this.showUnclickableCover();

            this.currentMenu = new AlertWindowMenu();
            this.currentMenu.setMsg(msg);
            this.currentMenu.show();
        }

        //Show sharing workspace results!
        LayoutManager.prototype.showSharingWorkspaceResults = function(msg, shared_ws_data) {
            // the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }

            this.showUnclickableCover();

            if (!this.menus['sharingWorksSpaceMenu']) {
                this.menus['sharingWorksSpaceMenu'] = new SharedWorkSpaceMenu();
            }

            this.currentMenu = this.menus['sharingWorksSpaceMenu'];

            if (shared_ws_data != []) {
                if(shared_ws_data['url']){
                    this.currentMenu.setURL(shared_ws_data['url']);
                    this.currentMenu.setHTML(shared_ws_data['url']);
                }
            }

            this.currentMenu.setMsg(msg);
            this.currentMenu.show();
        }

        /**
         * Shows the message window menu using the specified text. By default,
         * it will be interpreted as an information message, but you can use the
         * type param to change this behaviour.
         *
         * @param {String} msg Text of the message to show
         * @param {Constants.Logging} type Optional parameter to change the
         *        message type. (default value: Constants.Logging.INFO_MSG)
         */
        LayoutManager.prototype.showMessageMenu = function(msg, type) {
            var menu;
            if (!this.menus['messageMenu']) {
                this.menus['messageMenu'] = new MessageWindowMenu(null);
            }
            menu = this.menus['messageMenu'];

            type = type ? type : Constants.Logging.INFO_MSG;
            menu.setMsg(msg);
            menu.setType(type);
            // TODO: this.currentMenu???
            menu.show(this.currentMenu);
        }

        /**
         * Shows a dialog to changing platform preferences.
         *
         * @param scope
         * @param manager
         */
        LayoutManager.prototype.showPreferencesWindow = function(scope, manager, cancelable) {
            // the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }
            this.showUnclickableCover();

            var dialog, menuId = 'preferences/' + scope;


            if (scope == 'workspace') {
                dialog = new PreferencesWindowMenu(scope, manager);
            } else if (!(menuId in this.menus)) {
                this.menus[menuId] = new PreferencesWindowMenu(scope, manager);
                dialog = this.menus[menuId];
            } else {
                dialog = this.menus[menuId];
            }
            dialog.setCancelable(cancelable != null ? cancelable : true);
            this.currentMenu = dialog;
            this.currentMenu.show();
        }

        //hides the disabling layer and so, the current menu
        LayoutManager.prototype.hideCover = function() {
            if (this.currentMenu) {
                this.currentMenu.hide();
            }
            this.currentMenu = null;
            this.coverLayerElement.style.display="none";
            this.coverLayerElement.removeClassName('disabled_background');
            Event.stopObserving( this.coverLayerElement, "click", this.coverLayerEvent);
        }

        LayoutManager.prototype.FADE_TAB_INI = "#F0E68C";
        LayoutManager.prototype.FADE_TAB_CUR_END = "#E0E0E0";
        LayoutManager.prototype.FADE_TAB_END = "#97A0A8";
        LayoutManager.prototype.IDENTIFIER_WIDTH = 550;
        LayoutManager.prototype.SLIDER_WIDTH = 30;


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
