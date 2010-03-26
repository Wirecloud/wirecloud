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

	// z-index levels
	var hideLevel = 1;
	var showLevel = 2;

	var hideStyle = {'zIndex': hideLevel, 'height': 0, visibility:'hidden'};
	var showStyle = {'zIndex': showLevel, 'display':'block', visibility:'visible'};

	function LayoutManager () {
		// *********************************
		// PRIVATE VARIABLES 
		// *********************************

		// current view: catalogue, dragboard, wiring, logs
		this.currentViewType = null;
		this.currentView = null;

		// Global links managed by LayoutManager: {showcase, wiring}
		// Tabs are managed by WorkSpaces!! 
		this.catalogueLink = $('catalogue_link');
		this.wiringLink = $('wiring_link');
		this.dragboardLink = $('dragboard_link');

		// Container managed by LayOutManager: {showcase_tab}
		// Remaining containers managed by WorkSpaces!!
		this.catalogue = null;
		this.logs = LogManagerFactory.getInstance();
		this.logsLink = $('logs_link');

		// Menu Layer
		this.currentMenu = null;                                                // current menu (either dropdown or window)
		this.coverLayerElement = $('menu_layer');                               // disabling background layer
		this.coverLayerEvent = function () {this.hideCover()}.bind(this);       // disabling layer onclick event (by default)

		// Tab bar section: to make the section scroll 2 divs are needed: one which limits the whole room and
		//another which is absolutely positioned each time a slider button is clicked
		this.tabBarStep = 20;
		this.tabImgSize = null;		// launcher width + dragger width
		this.extraGap = 15;			//for margin of the current tab name and extra room on renaming tabs
		this.rightSlider = $('right_slider');
		this.leftSlider = $('left_slider');
		this.leftTimeOut;
		this.rightTimeOut;
		//fixed section
		this.fixedTabBar = $('fixed_bar');
		if ($('lite_toolbar_section')) {
			this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth -$('lite_toolbar_section').offsetWidth - this.leftSlider.getWidth() - this.rightSlider.getWidth() - $('floating_gadgets_launcher').offsetWidth - 30;
		} else {
			this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth - this.leftSlider.getWidth() - this.rightSlider.getWidth() - $('floating_gadgets_launcher').offsetWidth - 30;
		}

		this.tabMarker = $('tab_marker');		

		//scroll bar
		this.scrollTabBar = $('scroll_bar');

		this.scrollTabBarWidth = null;

		this.menus = new Array();

		// ***************
		// PUBLIC METHODS 
		// ****************
		
		LayoutManager.prototype.resizeTabBar = function () {
			this.showTabs();

			if($('lite_toolbar_section')){
				this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth -$('lite_toolbar_section').offsetWidth - this.leftSlider.getWidth() - this.rightSlider.getWidth() -  $('floating_gadgets_launcher').offsetWidth - 30;
			}else{
				this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth - this.leftSlider.getWidth() - this.rightSlider.getWidth() - $('floating_gadgets_launcher').offsetWidth - 30;
			}

			this.changeTabBarSize(0);
		}

		LayoutManager.prototype._updateTaskProgress = function() {
			var msg, subtaskpercentage, taskpercentage;

			subtaskpercentage = Math.round((this.currentStep * 100) / this.totalSteps);
			if (subtaskpercentage < 0)
				subtaskpercentage = 0;
			else if (subtaskpercentage > 100)
				subtaskpercentage = 100;

			taskpercentage = (this.currentSubTask * 100) / this.totalSubTasks;
			taskpercentage += subtaskpercentage * (1 / this.totalSubTasks);
			taskpercentage = Math.round(taskpercentage);
			if (taskpercentage < 0)
				taskpercentage = 0;
			else if (taskpercentage > 100)
				subtaskpercentage = 100;

			msg = gettext("%(task)s %(percentage)s%");
			msg = interpolate(msg, {task: this.task, percentage: taskpercentage}, true);
			$("loading-task-title").setTextContent(msg);

			if (this.subTask != "")
				msg = gettext("%(subTask)s: %(percentage)s%");
			else
				msg = "%(subTask)s";

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

		LayoutManager.prototype._notifyPlatformReady = function (firstTime) {
			var loadingElement = $("loading-window");
			loadingElement.addClassName("fadding");

			if (firstTime) {

				// Listen to resize events
				Event.observe(window,
				              "resize",
				              this.resizeWrapper.bind(this));
			}

			var loadingMessage = $("loading-message");
			var step = 0;
			function fadder() {
				++step;
				if (step < 80) {
					loadingMessage.setStyle({'opacity': 1 - (step * 0.025)});
					setTimeout(fadder, 50);
				} else {
					loadingElement.addClassName('disabled');
					loadingElement.removeClassName('fadding');
					loadingMessage.setStyle({'opacity': '1'});
				}
			}
			setTimeout(fadder, 50);
		}

		LayoutManager.prototype.changeCurrentTheme = function(newTheme) {
			if (_currentTheme.name == newTheme)
				return;

			this._startComplexTask(gettext('Changing current theme'));

			// Clear themed resources
			this.menus.clear();

			// Load the new theme
			function continueLoading2(theme, imagesNotFound) {
				var layoutManager = LayoutManagerFactory.getInstance();

				if (imagesNotFound.length > 0) {
					var msg = gettext("There were errors while loading some of the images for the \"%(theme)s\" theme. Do you really want to use it?.");
					msg = interpolate(msg, {theme: theme.name}, true);
					layoutManager.showYesNoDialog(msg,
						function() {
							continueLoading2(theme, []);
						},
						function() {
							layoutManager._notifyPlatformReady(false);
						},
						Constants.Logging.WARN_MSG);
					return;
				}

				_currentTheme.deapplyStyle();
				_currentTheme = theme;
				_currentTheme.applyStyle();
				
//				OpManagerFactory.getInstance()._themeLoaded();
				//wait for CSS application
				setTimeout(OpManagerFactory.getInstance()._themeLoaded.bind(OpManagerFactory.getInstance()), 500);
				layoutManager._notifyPlatformReady(false);
			}

			function continueLoading(theme, errorMsg) {
				var layoutManager = LayoutManagerFactory.getInstance();

				if (errorMsg !== null) {
					var msg = gettext("Error loading \"%(theme)s\" theme. Current theme has not been changed.");
					msg = interpolate(msg, {theme: theme.name}, true);
					layoutManager.showMessageMenu(msg, Constants.Logging.WARN_MSG);
					layoutManager._notifyPlatformReady(false);
					return;
				}

				theme.preloadImages(continueLoading2)
			}

			if (newTheme != 'default')
				new Theme(newTheme, _defaultTheme, continueLoading);
			else
				continueLoading(_defaultTheme, null);
		}

		LayoutManager.prototype.getCurrentViewType = function () {
			return this.currentViewType;
		}

		LayoutManager.prototype.resizeContainer = function (container) {
			var wrapperElement = $("wrapper");

			var newHeight = BrowserUtilsFactory.getInstance().getHeight();

			// We have to take into account the header and the wrapper margins and borders.
			var computedStyle = document.defaultView.getComputedStyle(wrapperElement, null);
			var wrapperHeight = newHeight -
			                    $("header").offsetHeight -
			                    computedStyle.getPropertyCSSValue("margin-bottom").getFloatValue(CSSPrimitiveValue.CSS_PX) -
			                    computedStyle.getPropertyCSSValue("border-top-width").getFloatValue(CSSPrimitiveValue.CSS_PX) -
			                    computedStyle.getPropertyCSSValue("border-bottom-width").getFloatValue(CSSPrimitiveValue.CSS_PX);


			wrapperElement.setStyle({"height" : wrapperHeight + "px"});
			container.setStyle({"height" : wrapperHeight + "px"});

			return wrapperHeight;
		}

		LayoutManager.prototype.resizeWrapper = function () {
			var newHeight = BrowserUtilsFactory.getInstance().getHeight();

			var opManager = OpManagerFactory.getInstance();
			if (opManager.loadCompleted) {
				// Resize cover layer
				var newWidth = BrowserUtilsFactory.getInstance().getWidth();
				this.coverLayerElement.setStyle({"height" : newHeight + "px", "width": newWidth +"px"});

				// Resize the current view element and its related elemets
				switch (this.currentViewType) {
				case "catalogue":
					this.resizeContainer(this.currentView.catalogueElement);

					// Recalculate catalogue sizes
					UIUtils.setResourcesWidth();
					UIUtils.resizeResourcesContainer();
					break;
				case "wiring":
					// Recalculate wiring position
					this.resizeContainer(this.currentView.wiringContainer);
					var wiringInterface = opManager.activeWorkSpace.getWiringInterface()
					wiringInterface.wiringTable.setStyle({'width' : (wiringInterface.wiringContainer.getWidth()-20)+"px"});
					if (wiringInterface.currentChannel) {
						wiringInterface.uncheckChannel(wiringInterface.currentChannel);
						wiringInterface.highlightChannel(wiringInterface.currentChannel);
					}
					break;
				case "logs":
					this.resizeContainer(this.currentView.logContainer);
					break;
				case "dragboard":
					this.resizeContainer(this.currentView.dragboardElement);
					opManager.activeWorkSpace.getActiveDragboard()._notifyWindowResizeEvent();
					// recalculate the tab bar
					this.resizeTabBar();
					break;
				}

				// Recalculate menu positions
				if (this.currentMenu)
					this.currentMenu.calculatePosition();
			}
		}

		LayoutManager.prototype.unloadCurrentView = function () {
			if (this.currentView) {
				this.currentView.hide();
				this.currentView = null;
			}
		}

		LayoutManager.prototype.unMarkGlobalTabs = function () {
			if (!this.catalogue) {
				this.catalogueLink = $('catalogue_link');
				this.logsLink = $('logs_link');
				this.wiringLink = $('wiring_link');
				this.dragboardLink = $('dragboard_link');
			}
			
			this.catalogueLink.removeClassName("toolbar_marked");
			this.catalogueLink.addClassName("toolbar_unmarked");
			this.wiringLink.removeClassName("toolbar_marked");
			this.wiringLink.addClassName("toolbar_unmarked");
			this.dragboardLink.removeClassName("toolbar_marked");
			this.dragboardLink.addClassName("toolbar_unmarked");
			/*this.logsLink.removeClassName("toolbar_marked");
			this.logsLink.addClassName("toolbar_unmarked");*/

/*			this.hideShowCase();
			this.hideLogs();
*/
		}

		/****VIEW OPERATIONS****/
		//hide an HTML Element
		LayoutManager.prototype.hideView = function (viewHTML) {
			viewHTML.setStyle(hideStyle);
		}

		LayoutManager.prototype.notifyError = function (labelContent) {
			/*this.logsLink.innerHTML = labelContent;
			this.logsLink.style.display = 'inline';*/
			this.logsLink.addClassName('highlighted');
			setTimeout("LayoutManagerFactory.getInstance().clearErrors()", 1000);
		}
		
		LayoutManager.prototype.clearErrors = function (labelContent) {
			/*this.logsLink.innerHTML = '';
			this.logsLink.style.display = 'none';*/
			this.logsLink.removeClassName('highlighted');
		}

		// Tab operations
		LayoutManager.prototype.unmarkTab = function(tab_object) {
			var tab = tab_object.tabHTMLElement;
			var launcher = tab_object.tabOpsLauncher;
			var renameEvent = tab_object.renameTabHandler;
			var changeEvent = tab_object.changeTabHandler;
			var dragger = tab_object.dragger;
		
			tab.className = "tab";
			//hide the launcher image for the drop down menu and the dragger from the former current tab
			var tabOpsLauncher = $(launcher);
			tabOpsLauncher.setStyle({'display':'none'});
			$(dragger).setStyle({'display':'none'});
			
			//Rename is an operation for ws owners!
			if (! tab_object.workSpace.isShared()) {
				Event.stopObserving(tab, 'click', renameEvent);
			}
				
			Event.observe(tab, 'click', changeEvent);
			
			tab.setStyle({"display": "block"}); // TODO
		}

		LayoutManager.prototype.markTab = function(tab_object) {
			var tab = tab_object.tabHTMLElement;
			var launcher = tab_object.tabOpsLauncher;
			var renameHandler = tab_object.renameTabHandler;
			var changeHandler = tab_object.changeTabHandler;
			var dragger = tab_object.dragger;
			
		
			if (tab.className != "tab current") {
				tab.className = "tab current";
				
				var tabOpsLauncher = $(launcher);
				
				if (! tab_object.workSpace.isShared())
					tabOpsLauncher.setStyle({'display':'inline'});
					
				$(dragger).setStyle({'display':'inline'});
				
				tab.setStyle({"display": "block"}); // TODO
			}
			if (this.currentViewType == 'dragboard') {
				Event.stopObserving(tab, 'click', changeHandler);
				
				//Rename is an operation for ws owners!
				if (! tab_object.workSpace.isShared()) {
					Event.observe(tab, 'click', renameHandler);
				}
			} else {
				//Rename is an operation for ws owners!
				if (! tab_object.workSpace.isShared()) {
					Event.stopObserving(tab, 'click', renameHandler);
				}
				
				Event.observe(tab, 'click', changeHandler);
			}
		}


//DEPRECATED???
/*		LayoutManager.prototype.hideTab = function(tab) {
			try{ //remove the launcher image for the drop down menu from the former current tab
				var tabOpsLauncher = $$('#'+tab.getAttribute('id')+' #tabOps_launcher');
				if (tabOpsLauncher.length > 0) {
					tabOpsLauncher[0].setStyle({'display':'none'});
				}
			} catch (e) {
				return;
			}
			tab.className = "tab";
			tab.setStyle(hideStyle);
		}
*/

		// Dragboard operations (usually called together with Tab operations)
		LayoutManager.prototype.showDragboard = function(dragboard) {
			this.unMarkGlobalTabs();
			if (this.currentView != null) {
				this.currentView.hide();
			}
			this.currentView = dragboard.tab;
			this.currentViewType = 'dragboard';

			this.dragboardLink.removeClassName("toolbar_unmarked");
			this.dragboardLink.addClassName("toolbar_marked");
			this.showTabs();
			this.dragboardLink.blur();
			$("ws_operations_link").blur();
			$("ws_operations_link").removeClassName("hidden");
			$("dragboard_link").title = "";

			this.resizeContainer(dragboard.dragboardElement);

			dragboard.dragboardElement.setStyle(showStyle);

			if (dragboard.getNumberOfIGadgets() == 0) {
				var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Managing_My_Workspace'>" + gettext("Video Tutorials") + "</a>";
				var msg = gettext("In the Dragborad you can move and resize all your gadgets in order to perform and use your own application. Check the gadget preferences for further personalization %(settingsIcon)s. Go to the Catalogue to add more gadgets %(catalogueIcon)s. Go to the Wiring interface to make connections among them %(wiringIcon)s. If you need more help visit the %(helpLink)s.");
				msg = interpolate(msg,
				                  {settingsIcon: "<img src='" + _currentTheme.getIconURL('igadget-settings') + "'/>",
				                   catalogueIcon: "<img src='" + _currentTheme.getIconURL('catalogue') + "'/>",
				                   wiringIcon: "<img src='" + _currentTheme.getIconURL('wiring') + "'/>",
				                   helpLink: videoTutorialMsg},
				                  true);
				this.showTipMessage(msg, 2);
			}
		}

		// Catalogue operations
		LayoutManager.prototype.showCatalogue = function() {
			this.unMarkGlobalTabs();
			if (this.currentView != null) {
				this.currentView.hide();
			}

			this.catalogue = CatalogueFactory.getInstance();

			this.currentView = this.catalogue;
			this.currentViewType = 'catalogue';
			
			this.catalogueLink.removeClassName("toolbar_unmarked");
			this.catalogueLink.addClassName("toolbar_marked");
			$("ws_operations_link").addClassName("hidden");
			$("dragboard_link").title = gettext("Show active workspace");
			this.hideTabs();
			this.catalogueLink.blur();
			
			this.resizeContainer(this.currentView.catalogueElement);
			this.catalogue.catalogueElement.setStyle(showStyle);
			var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Discovering_Gadgets'>" + gettext("Video Tutorials") + "</a>";
			var msg = gettext("Discover new gadgets, look for descriptions, tag them, make your rating, select the ones that best suit your needs and add them to the Dragboard %(dragboardIcon)s. Don't forget to connect them with other gadgets in the Wiring interface %(wiringIcon)s in order to improve your experience. If you need more help visit the %(helpLink)s.");
			msg = interpolate(msg,
				          {dragboardIcon: "<img src='" + _currentTheme.getIconURL('dragboard') + "'/>",
				           wiringIcon: "<img src='" + _currentTheme.getIconURL('wiring') + "'/>",
				           helpLink: videoTutorialMsg},
				          true);
			this.showTipMessage(msg, 0);
		}

		// Logs operations
		LayoutManager.prototype.showLogs = function(){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}
			this.currentView = this.logs;
			this.currentViewType = 'logs';
			
			/*this.logsLink.removeClassName("toolbar_unmarked");
			this.logsLink.addClassName("toolbar_marked");*/
			$("ws_operations_link").addClassName("hidden");
			$("dragboard_link").title = gettext("Show active workspace");
			this.hideTabs();
			this.logsLink.blur();
			
			this.resizeContainer(this.currentView.logContainer);
			this.logs.logContainer.setStyle(showStyle);
			
			//this.showTipMessage(gettext("Logs are shown in this section."), 3);
		}

		//Wiring operations
		LayoutManager.prototype.showWiring = function(wiring){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}
			this.currentView = wiring;
			this.currentViewType = 'wiring';
			
			this.wiringLink.removeClassName("toolbar_unmarked");
			this.wiringLink.addClassName("toolbar_marked");
			$("ws_operations_link").addClassName("hidden");
			$("dragboard_link").title = gettext("Show active workspace");
			this.hideTabs();
			this.wiringLink.blur();

			this.resizeContainer(this.currentView.wiringContainer);

			wiring.wiringContainer.setStyle(showStyle);
			//resizing the wiring table so that the scroll bar does not modify the table width.
			wiring.wiringTable.setStyle({'width' : (wiring.wiringContainer.getWidth()-20)+"px"});

			var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Connecting_Gadgets'>" + gettext("Video Tutorials") + "</a>";
			var msg = gettext("In the Wiring interface you can connect your gadgets among them. Create or select channels and link (by clicking) Events with Slots. Pay attention to the colours trying to help you, you can create some great wires following it. You can see the results of your wires at the Dragboard interface %(dragboardIcon)s. If you need more help visit the %(helpLink)s.");
			msg = interpolate(msg,
			          {dragboardIcon: "<img src='" + _currentTheme.getIconURL('wiring') + "'/>",
			           helpLink: videoTutorialMsg},
			          true);
			this.showTipMessage(msg, 1);
		}

		LayoutManager.prototype.hideTabs = function() {
			$("tab_section").addClassName("hidden");
		}

		LayoutManager.prototype.showTabs = function() {
			var tabSection = $("tab_section");
			if(tabSection.hasClassName("hidden"))
				tabSection.removeClassName("hidden");
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
			workSpace.menu.clearSubmenuOptions();

			if(workspaces.length >= 1) {
				workSpace.menu.submenu.className = "submenu border_bottom";
			} else {
				workSpace.menu.submenu.className = "submenu";
			}

			for (var i = 0; i < workspaces.length; i++) {
				workSpace.menu.addOptionToSubmenu(null,
					workspaces[i].workSpaceState.name,
					function () {
						LayoutManagerFactory.getInstance().hideCover();
						OpManagerFactory.getInstance().changeActiveWorkSpace(this)
					}.bind(workspaces[i]));
			}
		}

		//merge Menu is dinamic so the different options must be added.
		LayoutManager.prototype.refreshMergeWorkSpaceMenu = function(workSpace, workspaces) {
			workSpace.mergeMenu.clearOptions();

			for (var i = 0; i < workspaces.length; i++) {
				var context = {firstWK: workSpace, scndWK: workspaces[i]};
				workSpace.mergeMenu.addOption(null,
					workspaces[i].workSpaceState.name,
					function () {
						this.firstWK.mergeWith(this.scndWK.workSpaceState.id);
					}.bind(context),
					i);
			}
		}

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
			case 'workSpaceOps':
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
			case 'workSpaceOpsSubMenu':
				this.currentMenu = menu;
				this.currentMenu.show('right', posX, posY);
				break;
			case 'TabOpsSubMenu':
				this.currentMenu = menu;
				this.currentMenu.show('right', posX, posY);
				break;
			case 'remoteChannelOperationsMenu':
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
		 * @param {Constants.Logging} type (default: Constants.logging.INFO_MSG}
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
				if (!this.menus['publishWorkSpaceMenu']) {
					this.menus['publishWorkSpaceMenu'] = new PublishWindowMenu(null);
				}
				this.currentMenu = this.menus['publishWorkSpaceMenu'];
				break;
			case 'shareWorkSpace':
				if (!this.menus['shareWorkSpaceMenu']) {
					this.menus['shareWorkSpaceMenu'] = new ShareWindowMenu(null);
				}
				this.currentMenu = this.menus['shareWorkSpaceMenu'];
				break;	
			case 'deleteAllResourceVersions':
				if (!this.menus['alertMenu']) {
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				if (UIUtils.selectedVersion != null) {
					this.currentMenu.setMsg(gettext('Do you really want to remove this version of the gadget?'));
				} else {
					this.currentMenu.setMsg(gettext('WARNING! All versions of this gadget will be removed too! Do you really want to remove this gadget?'));
				}
				this.currentMenu.setHandler(function(){UIUtils.deleteGadget(UIUtils.selectedResource);}, handlerNoButton);
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
			case 'contratableAddInstanceMenu':
				if (!this.menus['contratableAddInstanceMenu']) {
					this.menus['contratableAddInstanceMenu'] = new ContratationWindow();
				}
				this.currentMenu = this.menus['contratableAddInstanceMenu'];
				this.currentMenu.setHandler(handlerYesButton);
				this.currentMenu.setSrc(extra_data);
				break;
			case 'addGadgetToAppMenu':
				if (!this.menus['addGadgetToAppMenu']) {
					this.menus['addGadgetToAppMenu'] = new AddingGadgetToApplicationWindow();
				}
				this.currentMenu = this.menus['addGadgetToAppMenu'];
				this.currentMenu.setHandler(UIUtils.addResourceToApplication);
				this.currentMenu.setExtraData(extra_data);
				break;
			case 'purchaseAppMenu':
				if (!this.menus['purchaseAppMenu']) {
					this.menus['purchaseAppMenu'] = new BuyingApplicationWindow();
				}
				this.currentMenu = this.menus['purchaseAppMenu'];
				this.currentMenu.setHandler(handlerYesButton);
				this.currentMenu.setCloseListener(handlerNoButton);
				this.currentMenu.setExtraData(extra_data);
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
		LayoutManager.prototype.showPreferencesWindow = function(scope, manager) {
			// the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if (this.currentMenu != null) {//only if the layer is displayed.
				this.hideCover();
			}
			this.showUnclickableCover();

			var menuId = 'preferences/' + scope;
			if (!(menuId in this.menus)) {
				this.menus[menuId] = new PreferencesWindowMenu(scope);
			}
			var dialog = this.menus[menuId];
			dialog.setManager(manager);
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

		LayoutManager.prototype.goTab = function(tab_object){

			var tab = tab_object.tabHTMLElement;

			var fadder = new BackgroundFadder(tab, this.FADE_TAB_INI, ((tab.hasClassName("current"))?this.FADE_TAB_CUR_END:this.FADE_TAB_END), 0, 1000);
			fadder.fade();
		}
	}

	/*-----------------------------*
	 * Tab scroll bar management   *
	 *-----------------------------*/


	/*get the size of the images related to a selected tab (ops launcher and dragger)because these images depend on the theme */
	LayoutManager.prototype.getTabImgSize = function() {
		if(!this.tabImgSize){
			var width = null;
			var array = $$('#scrollTabBar .tabOps_launcher');
			var opsLauncherImg = (array.length >0)? array[0]: null;
			if(opsLauncherImg){
				width = opsLauncherImg.getWidth();
			}
			array = $$('#scrollTabBar .tab_dragger');
			var draggerImg = (array.length >0)? array[0]: null;
			if(draggerImg){
				width += draggerImg.getWidth();
			}
			if (!width){
				//create a dump element to calculate the images' width
				var aux1 = document.createElement('div');
				Element.extend(aux1);
				aux1.addClassName('tabOps_launcher');
				document.body.appendChild(aux1);
				width = aux1.getWidth();
				aux1.remove();
				
				var aux2 = document.createElement('div');
				Element.extend(aux2);
				aux2.addClassName('tab_dragger');
				document.body.appendChild(aux2);				
				width += aux2.getWidth();
				aux2.remove();
			}
			this.tabImgSize = width;
		}
		return this.tabImgSize;
	}

	/* get scrollTabBar width */
	LayoutManager.prototype.getScrollTabBarWidth = function(reset) {	
		if(!this.scrollTabBarWidth || reset){
			//initial width (there is always a launcher and a tab dragger (of the current tab))
			this.scrollTabBarWidth = this.getTabImgSize() + this.extraGap + $(this.tabMarker).getWidth();
		}
		return this.scrollTabBarWidth;		
	}


	/* recalculate scrollTabBar width */
	LayoutManager.prototype.recalculateScrollTabBarWidth = function(){
		var nodes = this.scrollTabBar.childNodes;
		var computedStyle;
		var nameNode, tabMarginRight, tabMarginLeft, namMarginRight, nameMarginLeft;
		
		this.scrollTabBarWidth = 0;
		for (var i=0; i<nodes.length;i++){
			//add the node width. If it is a tab, border width are includes
			this.scrollTabBarWidth += nodes[i].getWidth();
			
			// current name margins are taken into account in this.extraGap
			if (nodes[i].hasClassName('current')){
				nameNode = nodes[i].getElementsByTagName('span')[0];
				computedStyle = document.defaultView.getComputedStyle(nameNode, null);
				nameMarginRight = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);	
				nameMarginLeft = computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);		
				this.scrollTabBarWidth -= nameMarginRight + nameMarginLeft;
			}
			
			//add the node margins.
			computedStyle = document.defaultView.getComputedStyle(nodes[i], null);
			tabMarginRight = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
			tabMarginLeft = computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
			this.scrollTabBarWidth += tabMarginRight + tabMarginLeft;
		}
		this.scrollTabBarWidth += this.extraGap;
		return this.scrollTabBarWidht;
	}

	/*Insert tab in the tab bar*/
	LayoutManager.prototype.addToTabBar = function(tabId) {
		var tabHTMLElement = document.createElement("div");
		Element.extend(tabHTMLElement);
		tabHTMLElement.setAttribute("id", tabId);
		tabHTMLElement.addClassName("tab");
		tabHTMLElement.setStyle({"display": "none"}); // TODO
		this.scrollTabBar.insertBefore(tabHTMLElement, this.scrollTabBar.firstChild);
		var computedStyle = document.defaultView.getComputedStyle(tabHTMLElement, null);
		var tabBorder = computedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
		var tabMarginRight = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
		var tabMarginLeft = computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
		this.changeTabBarSize(2*tabBorder + tabMarginRight + tabMarginLeft);
		this.scrollTabBar.setStyle({right: 0, left:''});
		return tabHTMLElement;
	}
	
	/*Move a tab in the tab bar*/
	LayoutManager.prototype.moveTab = function(tab, targetTab){
		
		//inserting an existing node will move it
		//tab nodes are displayed in inverted order. The most left side tab is the last node in the DOM
		if(targetTab){
			//insert before
			if(targetTab == tab){
				//do nothing
				return;
			}
			this.scrollTabBar.insertBefore(tab.tabHTMLElement, targetTab.tabHTMLElement.nextSibling);
		}else{
			//insert at the end
			this.scrollTabBar.insertBefore(tab.tabHTMLElement, this.scrollTabBar.firstChild);
		}
		//persistence of tabs' order
		var ids = [];
		var tabId;
		var aux;
		//tabs are displayed in inverted order
		for (var i= this.scrollTabBar.childNodes.length-1; i>=0; i--){
			//get the tab id (tab_workspaceid_tabId)
			aux = this.scrollTabBar.childNodes[i].id.split("_");
			tabId = parseInt(aux[aux.length-1]);
			ids.push(tabId);		
		}
		var success = function(transport){
			//Do nothing
		}
		
		var error = function(transport){
			var logManager = LogManagerFactory.getInstance();
			var msg = logManager.formatError(gettext("Error updating order: %(errorMsg)s."), transport, e);
			logManager.log(msg);		
		}
		
		var tabsUrl = URIs.GET_POST_TABS.evaluate({'workspace_id': tab.workSpace.workSpaceState.id});
			var tabsData = Object.toJSON(ids);
			var params = {'order': tabsData};
			PersistenceEngineFactory.getInstance().send_update(tabsUrl, params, this, success, error);
		
		
	}
	
	LayoutManager.prototype.insertMarker = function(tabMarker, targetTab){
		//tab nodes are displayed in inverted order. The most left side tab is the last node in the DOM

		this.scrollTabBar.insertBefore(tabMarker, targetTab.tabHTMLElement.nextSibling);
	}

	//move the separator to show where a dragged tab is going to be moved.	
	LayoutManager.prototype.moveIndicator = function(targetTab){
		$('tab_marker').setStyle({'display':'block', 'float':'right'});
		if(targetTab)
			this.scrollTabBar.insertBefore($('tab_marker'), targetTab.tabHTMLElement.nextSibling);
		else{			
			//move to the end
			this.scrollTabBar.insertBefore($('tab_marker'), this.scrollTabBar.firstChild);
		}
	}

	/*remove a tab from the tab bar*/
	LayoutManager.prototype.removeFromTabBar = function(tab){
		var computedStyle = document.defaultView.getComputedStyle(tab.tabHTMLElement, null);
		var tabMarginRight = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
		var tabMarginLeft = computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
		
		computedStyle = document.defaultView.getComputedStyle(tab.tabNameHTMLElement, null);
		var tabNameMarginRight = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
		var tabNameMarginLeft = computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
		
		var tabWidth = -1 * (tab.tabHTMLElement.getWidth() - (this.getTabImgSize() + tabNameMarginLeft + tabNameMarginRight) + tabMarginRight + tabMarginLeft);
		Element.remove(tab.tabHTMLElement);
		this.changeTabBarSize(tabWidth);
		this.scrollTabBar.setStyle({right: (this.fixedTabBar.getWidth() - this.getScrollTabBarWidth()) + 'px', left:''});
	}
	
	/*change the width of the tab bar*/
	LayoutManager.prototype.changeTabBarSize = function(tabSize){

		if (tabSize == 0){//it is a resize event (maybe a change of theme) the scrollTabBar was painted but perhaps its width is different now
			this.recalculateScrollTabBarWidth();
			
		}else{
			this.scrollTabBarWidth = this.getScrollTabBarWidth() + tabSize;
		}

		//calculate the size of the fixed bar taking into account the max allowed width
		var fixedWidth;
		if (this.getScrollTabBarWidth() <= this.fixedTabBarMaxWidth) {
			
			fixedWidth = this.getScrollTabBarWidth();
			this.scrollTabBar.setStyle({right: 0 + "px"});
			// we do not need arrows
			this.rightSlider.style.display = "none";
			this.leftSlider.style.display = "none";
			
		}else{//if the scrollTabBar is bigger than the fixed tab, we need arrows
			fixedWidth = this.fixedTabBarMaxWidth;
			this.rightSlider.style.display = "inline";
			this.leftSlider.style.display = "inline";
		}

		this.fixedTabBar.setStyle({'width': fixedWidth + "px"});
		this.scrollTabBar.setStyle({'width': this.getScrollTabBarWidth() + "px"});		
			
		
	}
	/*change the right position of the scroll tab bar */
	LayoutManager.prototype.changeScrollBarRightPosition = function(difference){
		var newRight = parseInt(this.scrollTabBar.getStyle('right')) + difference;
		var minRight = this.fixedTabBarMaxWidth-this.getScrollTabBarWidth();
		if (newRight > 0)
			newRight = 0;
		else if(newRight < minRight)
			newRight = minRight;
			
		this.scrollTabBar.setStyle({'right': newRight + "px"});
	}
	
	/* get the left position of the fixed tab bar */
	
	LayoutManager.prototype.getFixedBarLeftPosition = function(){
		return Position.cumulativeOffset(this.fixedTabBar)[0];
	}
	
	/*get the width of te fixed bar */
	LayoutManager.prototype.getFixedBarWidth = function(){
		return parseInt(this.fixedTabBar.getWidth());
	}
	
	/*scroll tab bar sliders*/
	LayoutManager.prototype.goLeft = function(){
		this.rightSlider.blur();
		var minLeft = this.fixedTabBarMaxWidth-this.getScrollTabBarWidth();
		if (parseInt(this.scrollTabBar.offsetLeft)>minLeft){
			this.changeScrollBarRightPosition(this.tabBarStep);
			var leftMethod = function(){this.goLeft()}.bind(this);
			this.leftTimeOut=setTimeout(leftMethod,50);
		}
	}

	LayoutManager.prototype.goRight = function() {
		this.leftSlider.blur();
		if (parseInt(this.scrollTabBar.offsetLeft)<0){
			this.changeScrollBarRightPosition(-1*this.tabBarStep);

			var rightMethod = function(){this.goRight()}.bind(this);
			this.rightTimeOut=setTimeout(rightMethod,50);
		}
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
