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
        //hide an HTML Element
        LayoutManager.prototype.hideView = function (viewHTML) {
            viewHTML.setStyle(hideStyle);
        }

        //hide the specified banner
        LayoutManager.prototype.hideHeader = function (headerHTML) {
            if (headerHTML)
                headerHTML.hide();
        }

        //show the specified banner
        LayoutManager.prototype.showHeader = function (headerHTML) {
            if (headerHTML)
                headerHTML.show();
        }

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

        // Dragboard operations (usually called together with Tab operations)
        LayoutManager.prototype.showDragboard = function(dragboard) {
            dragboard.workSpace.prepareToShow();

            this.currentView = dragboard.tab;
            this.currentViewType = 'dragboard';

            var state = {
                workspace: HistoryManager.getCurrentState().workspace,
                view: "dragboard",
                tab: dragboard.tab.getId()
            };
            HistoryManager.pushState(state);

            this.resizeContainer(dragboard.dragboardElement);

            if (dragboard.getNumberOfIGadgets() == 0) {
                var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Managing_My_Workspace'>" + gettext("Video Tutorials") + "</a>";
                var msg = gettext("In the Dragborad you can move and resize all your gadgets in order to perform and use your own application. Check the gadget preferences for further personalization %(settingsIcon)s. Go to the Catalogue to add more gadgets %(catalogueIcon)s. Go to the Wiring interface to make connections among them %(wiringIcon)s. If you need more help visit the %(helpLink)s.");
                msg = interpolate(msg, {
                    settingsIcon: "<span class='icon icon-igadget-settings'></span>",
                    catalogueIcon: "<span class='icon icon-catalogue'></span>",
                    wiringIcon: "<span class='icon icon-wiring'></span>",
                    helpLink: videoTutorialMsg
                }, true);
                this.showTipMessage(msg, 2);
            }

            //Firefox 3.6 bug
            document.childNodes[1].scrollTop = 0
        }

        // Catalogue operations
        LayoutManager.prototype.showCatalogue = function() {

            this.catalogue = CatalogueFactory.getInstance();

            if (this.currentView != null) {
                this.currentView.hide();
                //if the previous view was different and it had banner, change the banner
                if (this.currentViewType != 'catalogue' && this.currentView.getHeader) {
                    this.hideHeader(this.currentView.getHeader());
                }
            }

            this.showHeader(this.catalogue.getHeader());

            $(document.body).removeClassName(this.currentViewType+"_view");

            this.currentView = this.catalogue;
            this.currentViewType = 'catalogue';

            $(document.body).addClassName(this.currentViewType+"_view");
            var state = {
                'workspace': HistoryManager.getCurrentState().workspace,
                'view': 'catalogue'
            };
            HistoryManager.pushState(state);

            this.resizeContainer(this.catalogue.get_dom_element());
            this.catalogue.set_style(showStyle);

            var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Discovering_Gadgets'>" + gettext("Video Tutorials") + "</a>";
            var msg = gettext("Discover new gadgets, look for descriptions, tag them, make your rating, select the ones that best suit your needs and add them to the Dragboard %(dragboardIcon)s. Don't forget to connect them with other gadgets in the Wiring interface %(wiringIcon)s in order to improve your experience. If you need more help visit the %(helpLink)s.");
            msg = interpolate(msg, {
                dragboardIcon: "<span class='icon icon-dragboard'></span>",
                wiringIcon: "<span class='icon icon-wiring'></span>",
                helpLink: videoTutorialMsg
            }, true);
            this.showTipMessage(msg, 0);

            //Firefox 3.6 bug
            document.childNodes[1].scrollTop = 0
        }

        // Logs operations
        LayoutManager.prototype.showLogs = function(){

            if (this.currentView != null) {
                this.currentView.hide();
                //if the previous view had banner change the banner
                if (this.currentViewType != 'logs' && this.currentView.getHeader) {
                    this.hideHeader(this.currentView.getHeader());
                }
            }

            this.showHeader(this.logs.getHeader());

            $(document.body).removeClassName(this.currentViewType+"_view");

            this.currentView = this.logs;
            this.currentViewType = 'logs';

            $(document.body).addClassName(this.currentViewType+"_view");
            var state = {
                'workspace': HistoryManager.getCurrentState().workspace,
                'view': 'logs'
            };
            HistoryManager.pushState(state);

            this.resizeContainer(this.currentView.logContainer);
            this.logs.logContainer.setStyle(showStyle);

            //Firefox 3.6 bug
            document.childNodes[1].scrollTop = 0
        }

        //Wiring operations
        LayoutManager.prototype.showWiring = function(wiring){

            if(this.currentView != null){
                this.currentView.hide();
                //if the previous view was different and it had banner, change the banner
                if (this.currentViewType != 'wiring' && this.currentView.getHeader) {
                    this.hideHeader(this.currentView.getHeader());
                }
            }

            this.showHeader(wiring.getHeader());

            $(document.body).removeClassName(this.currentViewType+"_view");

            this.currentView = wiring;
            this.currentViewType = 'wiring';

            $(document.body).addClassName(this.currentViewType+"_view");
            var state = {
                'workspace': HistoryManager.getCurrentState().workspace,
                'view': 'wiring'
            };
            HistoryManager.pushState(state);

            this.resizeContainer(this.currentView.wiringContainer);

            wiring.wiringContainer.setStyle(showStyle);
            //resizing the wiring table so that the scroll bar does not modify the table width.
            wiring.wiringTable.setStyle({'width' : (wiring.wiringContainer.getWidth()-20)+"px"});

            var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Connecting_Gadgets'>" + gettext("Video Tutorials") + "</a>";
            var msg = gettext("In the Wiring interface you can connect your gadgets among them. Create or select channels and link (by clicking) Events with Slots. Pay attention to the colours trying to help you, you can create some great wires following it. You can see the results of your wires at the Dragboard interface %(dragboardIcon)s. If you need more help visit the %(helpLink)s.");
            msg = interpolate(msg, {
                dragboardIcon: "<span class='icon icon-wiring'></span>",
                helpLink: videoTutorialMsg
            }, true);
            this.showTipMessage(msg, 1);

            //Firefox 3.6 bug
            document.childNodes[1].scrollTop = 0
        }

        //the disabling layer can be clicable (in order to hide a menu) or not
        LayoutManager.prototype.showClickableCover = function(){
            this.coverLayerElement.style.display="block";
            Event.observe( this.coverLayerElement, "click", this.coverLayerEvent);
        }

        LayoutManager.prototype.showUnclickableCover = function(){
            this.coverLayerElement.addClassName('disabled_background');
            this.coverLayerElement.style.display="block";

        }

        //WorkSpaceMenu is dinamic so the different options must be added.
        LayoutManager.prototype.refreshChangeWorkSpaceMenu = function(workSpace, workspaces) {
            var wsListMenu = OpManagerFactory.getInstance().getWsListMenu();
            if (wsListMenu) {
                wsListMenu.clearOptions();
                for (var i = 0; i < workspaces.length; i += 1) {
                    //Add to the Sidebar Menu
                    wsListMenu.addOption(workspaces[i].workSpaceState.name,
                        function () {
                            LayoutManagerFactory.getInstance().hideCover();
                            OpManagerFactory.getInstance().changeActiveWorkSpace(this)
                        }.bind(workspaces[i]), i);
                }
            }
        };

        //merge Menu is dinamic so the different options must be added.
        LayoutManager.prototype.refreshMergeWorkSpaceMenu = function(workSpace, workspaces) {
            if (workSpace.mergeMenu) {
                workSpace.mergeMenu.clearOptions();

                for (var i = 0; i < workspaces.length; i++) {
                    var context = {
                        firstWK: workSpace,
                        scndWK: workspaces[i]
                    };
                    workSpace.mergeMenu.addOption(null, workspaces[i].workSpaceState.name, function(){
                        this.firstWK.mergeWith(this.scndWK.workSpaceState);
                    }.bind(context), i);
                }
            }
        };

        /**
         * General function to create the DropDownMenu
         */
        LayoutManager.prototype.initDropDownMenu = function (idMenu, parentMenu) {
            var menuHTML = $(idMenu);
            if (menuHTML) {
                menuHTML.remove();
            }

            // add the DOM element and create the menu
            menuHTML = '<div id="' + idMenu + '" class="drop_down_menu"></div>'
            new Insertion.After($('menu_layer'), menuHTML);
            return new DropDownMenu(idMenu, parentMenu);
        };

        /**
         * Shows the asked drop down menu.
         */
        LayoutManager.prototype.showDropDownMenu = function(menuType, menu, posX, posY) {
            switch (menuType) {
            case 'igadgetOps':
                this.currentMenu = menu;
                var position;

                if (menu.parentMenu)
                    posX = menu.parentMenu.menu.offsetLeft + menu.parentMenu.menu.offsetWidth - 10;

                if (posX + menu.menu.getWidth() <= BrowserUtilsFactory.getInstance().getWidth()) {
                    //the menu has enough room to be displayed from left to right
                    this.currentMenu.show('right', posX, posY);
                } else {
                    if (menu.parentMenu)
                        posX = menu.parentMenu.menu.offsetLeft + 10;

                    this.currentMenu.show('left', posX, posY);
                }
                this.showClickableCover();
                break;
            case 'wsList':
                this.currentMenu = menu;
                this.currentMenu.show('center', posX, posY);
                this.showClickableCover();
                break;
            case 'tabOps':
                this.currentMenu = menu;
                if ((posX - menu.menu.getWidth()) <= 0)
                    this.currentMenu.show('right', posX, posY);
                else
                    this.currentMenu.show('left', posX, posY);
                this.showClickableCover();
                break;
            case 'TabOpsSubMenu':
                this.currentMenu = menu;
                this.currentMenu.show('right', posX, posY);
                break;
            case 'filterMenu':
                this.currentMenu = menu;
                var position;

                if (posY + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()) {
                    //the menu has enough room to be displayed from top to bottom
                    this.currentMenu.show('left-bottom', posX, posY);
                } else {
                    this.currentMenu.show('left-top', posX, posY);
                }
                this.showClickableCover();
                break;
            case 'filterHelp':
                this.currentMenu = menu;
                var position;
                if (posY + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()) {
                    //the menu has enough room to be displayed from top to bottom
                    this.currentMenu.show('right-bottom', posX, posY);
                } else {
                    this.currentMenu.show('right-top', posX, posY);
                }
                break;
            case 'floatingGadgets':
                this.currentMenu = menu;
                this.currentMenu.show('left', posX, posY);
                this.showClickableCover();
                break;
            default:
                break;
            }
        }

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

        //Shows the asked window menu
        LayoutManager.prototype.showWindowMenu = function(window, handlerYesButton, handlerNoButton, extra_data) {
            //the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {
                // only if the layer is displayed.
                this.hideCover();
            }
            this.showUnclickableCover();
            switch (window) {
            case 'createWorkSpace':
                if (!this.menus['createWorkSpaceMenu']) {
                    this.menus['createWorkSpaceMenu'] = new CreateWindowMenu('workSpace');
                }
                this.currentMenu = this.menus['createWorkSpaceMenu'];
                break;
            case 'renameWorkSpace':
                if (!this.menus['renameWorkSpaceMenu']) {
                    this.menus['renameWorkSpaceMenu'] = new RenameWindowMenu(null);
                }
                this.currentMenu = this.menus['renameWorkSpaceMenu'];
                break;
            case 'renameTab':
                if (!this.menus['renameTabMenu']) {
                    this.menus['renameTabMenu'] = new RenameTabWindowMenu(extra_data);
                }
                this.menus['renameTabMenu'].setTab(extra_data);
                this.currentMenu = this.menus['renameTabMenu'];
                break;
            case 'useBrokenTheme':
                if (!this.menus['alertMenu']) {
                    this.menus['alertMenu'] = new AlertWindowMenu();
                }
                this.currentMenu = this.menus['alertMenu'];
                this.currentMenu.setMsg(gettext('Do you really want to remove this tab?'));
                this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().deleteTab();}, handlerNoButton);
                break;
            case 'cancelService':
                if (!this.menus['alertMenu']) {
                    this.menus['alertMenu'] = new AlertWindowMenu(null);
                }
                this.currentMenu = this.menus['alertMenu'];
                this.currentMenu.setMsg(gettext('Do you want to cancel the subscription to the service?'));
                this.currentMenu.setHandler(handlerYesButton, handlerNoButton);
                break;
            case 'publishWorkSpace':
                this.currentMenu = new PublishWindowMenu(OpManagerFactory.getInstance().activeWorkSpace);
                break;
            case 'addFeed':
                if (!this.menus['addFeedMenu']) {
                    this.menus['addFeedMenu'] = new AddFeedMenu();
                }
                this.currentMenu = this.menus['addFeedMenu'];
                break;
            case 'addSite':
                if (!this.menus['addSiteMenu']) {
                    this.menus['addSiteMenu'] = new AddSiteMenu();
                }
                this.currentMenu = this.menus['addSiteMenu'];
                break;
            case 'addMashup':
                if (!this.menus['addMashupMenu']) {
                    this.menus['addMashupMenu'] = new AddMashupWindowMenu(null);
                }
                this.currentMenu = this.menus['addMashupMenu'];
                this.currentMenu.setMsg(gettext('You are going to add a Mashup that could be composed by more than one gadget. Do you want to add it to a new Workspace or to the current one?'));
                this.currentMenu.setHandler(handlerYesButton, handlerNoButton);
                break;
            default:
                return;
            }
            this.currentMenu.show();
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
            // the disabling layer is displayed as long as a menu is shown. If there is not a menu, there is not a layer.
            if (this.currentMenu != null) {//only if the layer is displayed.
                this.hideCover();
            }
            this.showUnclickableCover();

            if (!this.menus['messageMenu']) {
                this.menus['messageMenu'] = new MessageWindowMenu(null);
            }
            type = type ? type : Constants.Logging.INFO_MSG;
            this.currentMenu = this.menus['messageMenu'];
            this.currentMenu.setMsg(msg);
            this.currentMenu.setType(type);
            this.currentMenu.show();
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

        //hides a submenu or a chain of submenus which are children of the specified menu.
        //The specified menu must become the currentMenu.
        LayoutManager.prototype.hideSubmenusOfMenu = function(parentMenu){

            var displayedMenu = this.currentMenu;
            while( this.currentMenu != parentMenu){
                //hide the submenu one by one (hideParents=false)
                this.currentMenu.hide(false);
                this.currentMenu = this.currentMenu.parentMenu;
            }
            //now, the current menu is parentMenu

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
