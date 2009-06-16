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
		this.tabImgSize = 14;    // launcher width
		this.extraGap = 2;      // 15px to ensure that a new character has enough room in the scroll bar
		this.tabMarginRight = 3; // 6px
		this.rightSlider = $('right_slider');
		this.leftSlider = $('left_slider');
		this.leftTimeOut;
		this.rightTimeOut;
		//fixed section
		this.fixedTabBar = $('fixed_bar');
		if($('lite_toolbar_section')){
			this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth -$('lite_toolbar_section').offsetWidth - this.leftSlider.offsetWidth - this.rightSlider.offsetWidth - 30;
		}else{
			this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth - this.leftSlider.offsetWidth - this.rightSlider.offsetWidth - 30;
		}
		
		//scroll bar
		this.scrollTabBar = $('scroll_bar');
		//initial width (there is always a launcher (of the current tab))
		this.scrollTabBarWidth = this.tabImgSize + this.extraGap;

		this.menus = new Array();

		// Information messages
		this.informationMessagesStatus = CookieManager.readCookie('informationMessagesStatus', true);
		if (this.informationMessagesStatus !== null) {
			// Renew information message cookie
			CookieManager.createCookie('informationMessagesStatus',
				this.informationMessagesStatus,
				365);
		} else {
			// TODO refactor this
			this.informationMessagesStatus = [];
			for (var i = 0; i < 20; i++)
				this.informationMessagesStatus[i] = false;
		}

		// Renew theme cookie if needed
		CookieManager.renewCookie('theme', 365);

		// ***************
		// PUBLIC METHODS 
		// ****************
		
		LayoutManager.prototype.resizeTabBar = function () {

			if($('lite_toolbar_section')){
				this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth -$('lite_toolbar_section').offsetWidth - this.leftSlider.offsetWidth - this.rightSlider.offsetWidth - 30;
			}else{
				this.fixedTabBarMaxWidth = $("bar").offsetWidth - $("add_tab_link").offsetWidth - this.leftSlider.offsetWidth - this.rightSlider.offsetWidth - 30;
			}
	
			this.changeTabBarSize(0);
		}

		LayoutManager.prototype._notifyPlatformReady = function (firstTime) {
			var loadingElement = $("loading-indicator");
			loadingElement.addClassName("disabled");

			if (!firstTime)
				return;

			// Listen to resize events
			Event.observe(window,
			              "resize",
			              this.resizeWrapper.bind(this));

			// Build theme list
			// TODO retreive this list from the server
			if ($('themeMenu') == null) {
				var themes = _THEMES;
				var menuHTML = '<div id="themeMenu" class="drop_down_menu"></div>';
				new Insertion.After($('menu_layer'), menuHTML);
				var themeMenu = new DropDownMenu('themeMenu');

				for (var i = 0; i < themes.length; i++) {
					var themeName = themes[i]
					themeMenu.addOption(null,
					                    themeName,
					                    function() {
					                        LayoutManagerFactory.getInstance().hideCover();
					                        LayoutManagerFactory.getInstance().changeCurrentTheme(this.theme);
					                    }.bind({theme:themeName}),
					                    i);
				}

				if($('themeSelector')) {
					$('themeSelector').observe('click',
						function (e) {
							LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
							                                                      themeMenu,
							                                                      Event.pointerX(e),
							                                                      Event.pointerY(e));
						});
				}
			}
		}

		LayoutManager.prototype.changeCurrentTheme = function(newTheme) {
			if (_currentTheme.name == newTheme)
				return;

			var loadingElement = $("loading-indicator");
			loadingElement.removeClassName("disabled");

			// Clear themed resources
			this.menus.clear();

			// Load the new theme
			function continueLoading2(theme, imagesNotFound) {
				var layoutManager = LayoutManagerFactory.getInstance();

				if (imagesNotFound.length > 0) {
					// TODO log eror
				}

				_currentTheme.deapplyStyle();
				_currentTheme = theme;
				$("themeLabel").textContent = theme.name;
				_currentTheme.applyStyle();
				layoutManager.resizeWrapper();

				// Save theme selection into a cookie
				CookieManager.createCookie('theme', theme.name, 365);

				layoutManager._notifyPlatformReady(false);
			}

			function continueLoading(theme, loaded) {
				var layoutManager = LayoutManagerFactory.getInstance();

				if (loaded === true) {
					theme.preloadImages(continueLoading2)
				} else {
					// TODO log eror
					layoutManager._notifyPlatformReady(false);
				}
			}

			if (newTheme != 'default')
				new Theme(newTheme, _defaultTheme, continueLoading);
			else
				continueLoading(_defaultTheme, true);
		}

		LayoutManager.prototype.getCurrentViewType = function () {
			return this.currentViewType;
		}

		LayoutManager.prototype.resizeContainer = function (container) {
			// We have to take into account the bottom margin and border widths.
			// Bottom margin = 4px
			// Border width = 2px => Top border + bottom border = 4px
			// Total 8px
			container.setStyle({"height" : (BrowserUtilsFactory.getInstance().getHeight() - $("header").offsetHeight - 8) + "px"});
		}

		LayoutManager.prototype.resizeWrapper = function () {
			// We have to take into account the bottom margin and border widths.
			// Bottom margin = 4px
			// Border width = 2px => Top border + bottom border = 4px
			// Total 8px
			var newHeight=BrowserUtilsFactory.getInstance().getHeight();
			$("wrapper").setStyle({"height" : (newHeight - $("header").offsetHeight - 8) + "px"});
			
			var opManager = OpManagerFactory.getInstance();
			if(opManager.loadCompleted) {
				//resize cover layer
				var newWidth = BrowserUtilsFactory.getInstance().getWidth();
				this.coverLayerElement.setStyle({"height" : newHeight + "px", "width": newWidth +"px"});
				
				//resize the current view element and its related elemets
				if (this.currentViewType=="catalogue"){
					this.resizeContainer(this.currentView.catalogueElement);
					// Recalculate catalogue sizes
					UIUtils.setResourcesWidth();
					UIUtils.resizeResourcesContainer();
				}else if (this.currentViewType=="wiring"){	
					// Recalculate wiring position			
					this.resizeContainer(this.currentView.wiringContainer);
					var wiringInterface = opManager.activeWorkSpace.getWiringInterface()
					wiringInterface.wiringTable.setStyle({'width' : (wiringInterface.wiringContainer.getWidth()-20)+"px"});
					if(wiringInterface.currentChannel){
						wiringInterface.uncheckChannel(wiringInterface.currentChannel);
						wiringInterface.highlightChannel(wiringInterface.currentChannel);
					}
				}else if (this.currentViewType=="logs"){ 
					this.resizeContainer(this.currentView.logContainer);
				}else{ //dragboard
					this.resizeContainer(this.currentView.dragboardElement);
					opManager.activeWorkSpace.getActiveDragboard()._notifyWindowResizeEvent();
					// recalculate the tab bar
					this.resizeTabBar();
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
		
			tab.className = "tab";
			//hide the launcher image for the drop down menu from the former current tab
			var tabOpsLauncher = $(launcher);
			tabOpsLauncher.setStyle({'display':'none'});
			
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
			
		
			if (tab.className != "tab current") {
				tab.className = "tab current";
				
				var tabOpsLauncher = $(launcher);
				
				if (! tab_object.workSpace.isShared())
					tabOpsLauncher.setStyle({'display':'inline'});
				
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

		LayoutManager.prototype.hideTab = function(tab) {
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

		// Dragboard operations (usually called together with Tab operations)
		LayoutManager.prototype.showDragboard = function(dragboard) {
			this.unMarkGlobalTabs();
			if (this.currentView != null) {
				this.currentView.hide();
			}
			this.currentView = dragboard;
			this.currentViewType = 'dragboard';

			this.dragboardLink.removeClassName("toolbar_unmarked");
			this.dragboardLink.addClassName("toolbar_marked");
			this.showTabs();
			this.dragboardLink.blur();
			$("ws_operations_link").blur();
			$("ws_operations_link").removeClassName("hidden");
			$("dragboard_link").title = "";

			this.resizeContainer(this.currentView.dragboardElement);

			dragboard.dragboardElement.setStyle(showStyle);

			LayoutManagerFactory.getInstance().resizeTabBar();

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

			if (!this.catalogue) {
				this.catalogue = CatalogueFactory.getInstance();
			}

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
			//resizing the wiring table so that the scroll bar doesn't modify the table width.
			wiring.wiringTable.setStyle({'width' : (wiring.wiringContainer.getWidth()-20)+"px"});
			
			//if(wiring.channels.length == 0){
			var videoTutorialMsg = "<a target='_blank' href='http://forge.morfeo-project.org/wiki/index.php/FAQ#Connecting_Gadgets'>" + gettext("Video Tutorials") + "</a>";
			var msg = gettext("In the Wiring interface you can connect your gadgets among them. Create or select channels and link (by clicking) Events with Slots. Pay attention to the colours trying to help you, you can create some great wires following it. You can see the results of your wires at the Dragboard interface %(dragboardIcon)s. If you need more help visit the %(helpLink)s.");
			msg = interpolate(msg,
				          {dragboardIcon: "<img src='" + _currentTheme.getIconURL('wiring') + "'/>",
				           helpLink: videoTutorialMsg},
				          true);
			this.showTipMessage(msg, 1);
			//}
		}
		
		LayoutManager.prototype.hideTabs = function() {
			$("tab_section").addClassName("hidden");
		}
		
		LayoutManager.prototype.showTabs = function() {
			$("tab_section").removeClassName("hidden");
		}

		//the disabling layer can be clicable (in order to hide a menu) or not
		LayoutManager.prototype.showClickableCover = function(){
			this.coverLayerElement.style.display="block";
			Event.observe( this.coverLayerElement, "click", this.coverLayerEvent);
		}

		LayoutManager.prototype.showUnclickableCover = function(){
			this.coverLayerElement.addClassName('disabled_background');
			this.coverLayerElement.style.display="block";

			Event.stopObserving( this.coverLayerElement, "click", this.coverLayerEvent);
		}

		//WorkSpaceMenu is dinamic so the different options must be added.
		LayoutManager.prototype.refreshChangeWorkSpaceMenu = function(workSpace, workspaces){
			
			workSpace.menu.clearSubmenuOptions();
			
			if(workspaces.length >= 1){
				workSpace.menu.submenu.className = "submenu border_bottom";
			}else{
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
		LayoutManager.prototype.refreshMergeWorkSpaceMenu = function(workSpace, workspaces){
			
			workSpace.mergeMenu.clearOptions();

			for (var i=0; i<workspaces.length; i++){
				var context = {firstWK: workSpace, scndWK: workspaces[i]}
				workSpace.mergeMenu.addOption(null,
					workspaces[i].workSpaceState.name,
					function () {
						this.firstWK.mergeWith(this.scndWK.workSpaceState.id);
					}.bind(context),
					 i);
			}
		}

		//Shows the asked drop down menu 
		LayoutManager.prototype.showDropDownMenu = function(menuType, menu, x, y) {
			switch (menuType) {
			case 'igadgetOps':
				this.currentMenu = menu;
				var position;

				if (menu.parentMenu)
					x = menu.parentMenu.menu.offsetLeft + menu.parentMenu.menu.offsetWidth - 10;

				if (x + menu.menu.getWidth() <= BrowserUtilsFactory.getInstance().getWidth()) {
					//the menu has enough room to be displayed from left to right
					this.currentMenu.show('right', x, y);
				} else {
					if (menu.parentMenu)
						x = menu.parentMenu.menu.offsetLeft + 10;

					this.currentMenu.show('left', x, y);
				}
				this.showClickableCover();
				break;
			case 'workSpaceOps':
				this.currentMenu = menu;
				this.currentMenu.show('center', x, y);
				this.showClickableCover();
				break;
			case 'tabOps':
				this.currentMenu = menu;
				if (x - menu.menu.getWidth()<=0)
					this.currentMenu.show('right', x, y);
				else
					this.currentMenu.show('left', x, y);
				this.showClickableCover();
				break;
			case 'workSpaceOpsSubMenu':
				this.currentMenu = menu;
				this.currentMenu.show('right', x, y);
				break;
			case 'filterMenu':
				this.currentMenu = menu;
				var position;
				if (y + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()){
					//the menu has enough room to be displayed from top to bottom
					this.currentMenu.show('left-bottom', x, y);
				}else{
					this.currentMenu.show('left-top', x, y);
				}
				this.showClickableCover();
				break;
			case 'filterHelp':
				this.currentMenu = menu;
				var position;
				if (y + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()){
					//the menu has enough room to be displayed from top to bottom
					this.currentMenu.show('right-bottom', x, y);
				}else{
					this.currentMenu.show('right-top', x, y);
				}
				break;
			default:
				break;
			}

		}

		//Shows the asked window menu
		LayoutManager.prototype.showWindowMenu = function(window, handlerYesButton, handlerNoButton){
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
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
			case 'deleteTab':
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
			case 'deleteWorkSpace':
				if (!this.menus['alertMenu']) {
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you really want to remove this workspace?'));
				this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();}, handlerNoButton);
				break;
			case 'publishWorkSpace':
				if (!this.menus['publishWorkSpaceMenu']) {
					this.menus['publishWorkSpaceMenu'] = new PublishWindowMenu(null);
				}
				this.currentMenu = this.menus['publishWorkSpaceMenu'];
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
					this.menus['addMashupMenu'] = new AddMashupWindowMenu();
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
			if (this.informationMessagesStatus[type]) // Don't show me anymore
				return;

			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
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
			if (this.informationMessagesStatus[type]) // Don't show me anymore
				return;

			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
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
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
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
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if (this.currentMenu != null) {//only if the layer is displayed.
				this.hideCover();
			}

	        this.showUnclickableCover();

			if (!this.menus['sharingWorksSpaceMenu']) {
				this.menus['sharingWorksSpaceMenu'] = new SharedWorkSpaceMenu();
			}
			
			this.currentMenu = this.menus['sharingWorksSpaceMenu'];
			
			if (shared_ws_data != []) {
				this.currentMenu.setURL(shared_ws_data['url']);
				this.currentMenu.setHTML(shared_ws_data['url']);
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
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
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

		//hides the disabling layer and so, the current menu
		LayoutManager.prototype.hideCover = function() {
			if (this.currentMenu) {
				this.currentMenu.hide();
			}
			this.currentMenu = null;
			this.coverLayerElement.style.display="none";
			this.coverLayerElement.removeClassName('disabled_background');
		}

		LayoutManager.prototype.FADE_TAB_INI = "#F0E68C";
		LayoutManager.prototype.FADE_TAB_CUR_END = "#E0E0E0";
		LayoutManager.prototype.FADE_TAB_END = "#97A0A8";

		LayoutManager.prototype.goTab = function(tab_object){
			this.markTab(tab_object);
			
			var tab = tab_object.tabHTMLElement;
			
			var fadder = new BackgroundFadder(tab, this.FADE_TAB_INI, ((tab.hasClassName("current"))?this.FADE_TAB_CUR_END:this.FADE_TAB_END), 0, 1000);
			fadder.fade();
		}
		
	}

	/*-----------------------------*
	 * Tab scroll bar management   *
	 *-----------------------------*/

	/*Reset the tab bar values*/
	LayoutManager.prototype.resetTabBar = function(tabId) {
		this.scrollTabBarWidth = this.tabImgSize + this.extraGap;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px", "max-width": this.fixedTabBarMaxWidth + "px"});
		//we don't need arrows
		this.rightSlider.style.display = "none";
		this.leftSlider.style.display = "none";
	}

	/*Insert tab in the tab bar*/
	LayoutManager.prototype.addToTabBar = function(tabId) {
		var tabHTMLElement = document.createElement("div");
		tabHTMLElement.setAttribute("id", tabId);
		tabHTMLElement.setAttribute("class", "tab");
		tabHTMLElement.setStyle({"display": "none"}); // TODO
		this.scrollTabBar.insertBefore(tabHTMLElement, this.scrollTabBar.firstChild);
		var tabBorder= parseInt(tabHTMLElement.getStyle('border-left-width'));
		this.changeTabBarSize(2*(this.tabMarginRight + tabBorder));
		this.scrollTabBar.setStyle({right: 0, left:''});
		return tabHTMLElement;
	}

	/*remove a tab from the tab bar*/
	LayoutManager.prototype.removeFromTabBar = function(tabHTMLElement){
		var tabWidth = -1 * (tabHTMLElement.getWidth()-this.tabImgSize + 2*this.tabMarginRight);
		Element.remove(tabHTMLElement);
		this.changeTabBarSize(tabWidth);
		this.scrollTabBar.setStyle({right: (this.fixedTabBarWidth - this.scrollTabBarWidth) + 'px', left:''});
	}
	
	/*change the width of the tab bar*/
	LayoutManager.prototype.changeTabBarSize = function(tabSize){
		this.showTabs();
		this.scrollTabBarWidth += tabSize;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px", "max-width": this.fixedTabBarMaxWidth + "px"});
		if (this.scrollTabBarWidth <= this.fixedTabBarMaxWidth) {
			this.scrollTabBar.setStyle({right: 0 + "px"});
			//we don't need arrows
			this.rightSlider.style.display = "none";
			this.leftSlider.style.display = "none";
		} else { //if the scrollTabBar is bigger than the fixed tab, we need arrows
			this.rightSlider.style.display = "inline";
			this.leftSlider.style.display = "inline";
			
		}
		
	}
	/*change the right position of the scroll tab bar */
	LayoutManager.prototype.changeScrollBarRightPosition = function(difference){
		var newRight = parseInt(this.scrollTabBar.getStyle('right')) + difference;
		var minRight = this.fixedTabBarMaxWidth-this.scrollTabBarWidth;
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
		var minLeft = this.fixedTabBarMaxWidth-this.scrollTabBarWidth;
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
