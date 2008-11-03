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

	function LayoutManager () {
	        
	    // *********************************
		// PRIVATE VARIABLES 
		// *********************************
		
		// z-index levels	
			this.hideLevel = 1;
			this.showLevel = 2;
			
		// current view: catalogue, dragboard, wiring, logs
			this.currentViewType = null;
			this.currentView = null;
			
		// Global links managed by LayoutManager: {showcase, wiring}
		// Tabs are managed by WorkSpaces!! 
			this.catalogueLink = $('catalogue_link');
			this.wiringLink = $('wiring_link');
			
		// Container managed by LayOutManager: {showcase_tab}
		// Remaining containers managed by WorkSpaces!!
			this.catalogue = null;
			this.logs = LogManagerFactory.getInstance();
			this.logsLink = $('logs_link');
			
		// Menu Layer	
			this.currentMenu = null;							//current menu (either dropdown or window)
			this.coverLayerElement = $('menu_layer');					//disabling background layer
			this.coverLayerEvent = function () {this.hideCover()}.bind(this);	//disabling layer onclick event (by default)
			
		// Tab bar section: to make the section scroll 2 divs are needed: one which limits the whole room and
		//another which is absolutely positioned each time a slider button is clicked
			this.tabBarStep = 20;
			this.tabImgSize = 14; //launcher width
			this.extraGap = 15;	// 15px to ensure that a new character has enough room in the scroll bar
			this.tabMarginRight = 6	;	//6px
			this.rightSlider = $('right_slider');
			this.leftSlider = $('left_slider');
			this.leftTimeOut;
			this.rightTimeOut;			
			//fixed section
			this.fixedTabBar = $('fixed_bar');
			this.fixedTabBarMaxWidth = BrowserUtilsFactory.getInstance().getWidth()*0.70;
			
			//scroll bar
			this.scrollTabBar = $('scroll_bar');
			//initial width (there is always a launcher (of the current tab))
			this.scrollTabBarWidth = this.tabImgSize + this.extraGap;
	
			this.menus = new Array();
					
		// ****************
		// PUBLIC METHODS 
		// ****************
		LayoutManager.prototype.getCurrentViewType = function () {
			return this.currentViewType;
		}

		LayoutManager.prototype.resizeWrapper = function () {
			// We have to take into account the bottom margin and border widths.
			// Bottom margin = 4px
			// Border width = 2px => Top border + bottom border = 4px
			// Total 8px
			var newHeight=BrowserUtilsFactory.getInstance().getHeight();
			$("wrapper").setStyle({"height" : (newHeight - $("header").offsetHeight - 8) + "px"});

			var wrapperChilds = $('wrapper').childElements();
			var i;
			for (i=0;i<wrapperChilds.length;i++){
				wrapperChilds[i].setStyle({"height" : (newHeight - $("header").offsetHeight - 8) + "px"});
			}
			var newWidth = BrowserUtilsFactory.getInstance().getWidth();
			this.coverLayerElement.setStyle({"height" : newHeight + "px", "width": newWidth +"px"});
			
			//recalculate wiring position
			var opManager = OpManagerFactory.getInstance();
			if(opManager.loadCompleted){
				var wiringInterface = opManager.activeWorkSpace.getWiringInterface()
				wiringInterface.wiringTable.setStyle({'width' : (wiringInterface.wiringContainer.getWidth()-20)+"px"});
				if(wiringInterface.currentChannel){
					wiringInterface.uncheckChannel(wiringInterface.currentChannel);
					wiringInterface.highlightChannel(wiringInterface.currentChannel);				
				}
			}
			
			//recalculate menu positions
			if(this.currentMenu){
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
			}
			
			this.catalogueLink.className = 'toolbar_unmarked';
			this.wiringLink.className = 'toolbar_unmarked';
			this.logsLink.className = 'toolbar_unmarked';
			
/*			this.hideShowCase();
			this.hideLogs();		
*/
		}

		/****VIEW OPERATIONS****/
		//hide an HTML Element
		LayoutManager.prototype.hideView = function (viewHTML){
			viewHTML.setStyle({'zIndex': this.hideLevel, 'visibility': 'hidden'});
		}
		
		LayoutManager.prototype.notifyError = function (labelContent){
			this.logsLink.innerHTML = labelContent;
			this.logsLink.setStyle({'display' : 'inline'});
		}
		
		LayoutManager.prototype.clearErrors = function (labelContent){
			this.logsLink.innerHTML = '';
		}

		// Tab operations
		LayoutManager.prototype.unmarkTab = function(tab, launcher, changeEvent, renameEvent){
			tab.className = "tab";
			//hide the launcher image for the drop down menu from the former current tab
			var tabOpsLauncher = $(launcher);
			tabOpsLauncher.setStyle({'display':'none'});
			Event.stopObserving(tab, 'click', renameEvent);
		   	Event.observe(tab, 'click', changeEvent);
		    tab.setStyle({'zIndex': this.showLevel, 'display':'block', 'visibility':'visible'});
			
		}
		
		LayoutManager.prototype.markTab = function(tab, launcher, renameHandler, changeHandler){
			if(tab.className != "tab current"){
				tab.className = "tab current";
			    var tabOpsLauncher = $(launcher);
			    tabOpsLauncher.setStyle({'display':'inline'});
		    	tab.setStyle({'zIndex': this.showLevel, 'display':'block', 'visibility':'visible'});
			}
			if(this.currentViewType == 'dragboard'){
				Event.stopObserving(tab, 'click', changeHandler);
   			   	Event.observe(tab, 'click', renameHandler);
			}else{
				Event.stopObserving(tab, 'click', renameHandler);
   			   	Event.observe(tab, 'click', changeHandler);
			}
		}
		
		LayoutManager.prototype.hideTab = function(tab){
			try{ //remove the launcher image for the drop down menu from the former current tab
				var tabOpsLauncher = $$('#'+tab.getAttribute('id')+' #tabOps_launcher');
				if(tabOpsLauncher.length>0){	
					tabOpsLauncher[0].setStyle({'display':'none'});
				}
			}catch (e){
				return;
			}
			tab.className = "tab";
			tab.setStyle({'zIndex': this.hideLevel, 'display':'none', 'visibility':'hidden'});
		}
		
		// Dragboard operations (usually called together with Tab operations)
		LayoutManager.prototype.showDragboard = function(dragboard){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}
		    this.currentView = dragboard;
		    this.currentViewType = 'dragboard';
			dragboard.dragboardElement.setStyle({'zIndex': this.showLevel, 'visibility': 'visible'})
		}
		
		// Catalogue operations
		LayoutManager.prototype.showCatalogue = function(){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}			
				
			if (!this.catalogue) {
				this.catalogue = CatalogueFactory.getInstance();
			}

			this.currentView = this.catalogue;
			this.currentViewType = 'catalogue';
			this.catalogueLink.className = 'toolbar_marked';
			this.catalogue.catalogueElement.setStyle({'zIndex': this.showLevel, 'display': 'block', 'visibility': 'visible'});
		}
				
		// Logs operations
		LayoutManager.prototype.showLogs = function(){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}				
		    this.currentView = this.logs;
			this.currentViewType = 'logs';
			this.logsLink.className = "toolbar_marked";			
			this.logs.logContainer.setStyle({'zIndex': this.showLevel, 'display': 'block', 'visibility': 'visible'});
		}
	
		//Wiring operations
		LayoutManager.prototype.showWiring = function(wiring){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}				
		    this.currentView = wiring;			
			this.currentViewType = 'wiring';
			this.wiringLink.className = "toolbar_marked";
			this.wiringLink.blur();
			wiring.wiringContainer.setStyle({'zIndex' : this.showLevel, 'display': 'block', 'visibility': 'visible'});
			//resizing the wiring table so that the scroll bar don't modify the table width.
			wiring.wiringTable.setStyle({'width' : (wiring.wiringContainer.getWidth()-20)+"px"});
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

			for (var i=0; i<workspaces.length; i++){
				workSpace.menu.addOptionToSubmenu(null, workspaces[i].workSpaceState.name, function (){LayoutManagerFactory.getInstance().hideCover();OpManagerFactory.getInstance().changeActiveWorkSpace(this)}.bind(workspaces[i]));

			}
		}

		//merge Menu is dinamic so the different options must be added.
		LayoutManager.prototype.refreshMergeWorkSpaceMenu = function(workSpace, workspaces){
			
			workSpace.mergeMenu.clearOptions();
			
			for (var i=0; i<workspaces.length; i++){
				var context = {firstWK: workSpace, scndWK: workspaces[i]}
				workSpace.mergeMenu.addOption(null, workspaces[i].workSpaceState.name, function (){this.firstWK.mergeWith(this.scndWK.workSpaceState.id)}.bind(context), i);

			}
		}		

		//Shows the asked drop down menu 
		LayoutManager.prototype.showDropDownMenu = function(menuType, menu, x, y){
			switch (menuType){
			case 'workSpaceOps':
				this.currentMenu = menu;
				this.currentMenu.show('right', x, y);
				this.showClickableCover();
				break;
			case 'tabOps':
				this.currentMenu = menu;
				this.currentMenu.show('left', x, y);
				this.showClickableCover();
				break;
			case 'workSpaceOpsSubMenu':
				this.currentMenu = menu;
				this.currentMenu.show('right', x, y);
				break;
			default:
				break;
			}

		}

		//Shows the asked window menu
		LayoutManager.prototype.showWindowMenu = function(window){
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if(this.currentMenu != null){//only if the layer is displayed.
				this.hideCover();
			}
			this.showUnclickableCover();
			switch (window){
			case 'createWorkSpace':
				if(!this.menus['createWorkSpaceMenu']){
					this.menus['createWorkSpaceMenu'] = new CreateWindowMenu('workSpace');
				}
				this.currentMenu = this.menus['createWorkSpaceMenu'];
				this.currentMenu.show();
				break;
			case 'deleteTab':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you really want to remove this tab?'));
				this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().deleteTab();});
				this.currentMenu.show();
				break;
			case 'deleteWorkSpace':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you really want to remove this workspace?'));
				this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();});
				this.currentMenu.show();
				break;
			case 'publishWorkSpace':
				if(!this.menus['publishWorkSpaceMenu']){
					this.menus['publishWorkSpaceMenu'] = new PublishWindowMenu(null);
				}
				this.currentMenu = this.menus['publishWorkSpaceMenu'];
				this.currentMenu.show();
				break;			
			case 'deleteAllResourceVersions':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}				
				this.currentMenu = this.menus['alertMenu'];
				if (UIUtils.selectedVersion != null){
					this.currentMenu.setMsg(gettext('Do you really want to remove this version of the gadget?'));
				}else{
					this.currentMenu.setMsg(gettext('WARNING! All versions of this gadget will be removed too! Do you really want to remove this gadget?'));
				}
				this.currentMenu.setHandler(function(){UIUtils.deleteGadget(UIUtils.selectedResource);});
				this.currentMenu.show();
				break;
			default:
				break;
			}
		}
		
		//Shows the message window menu
		LayoutManager.prototype.showMessageMenu = function(msg){
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if(this.currentMenu != null){//only if the layer is displayed.
				this.hideCover();
			}
			this.showUnclickableCover();
			
			if(!this.menus['messageMenu']){
				this.menus['messageMenu'] = new MessageWindowMenu(null);
			}
			this.currentMenu = this.menus['messageMenu'];
			this.currentMenu.setMsg(msg);
			this.currentMenu.show();			
		}

		//hides the disabling layer and so, the current menu
		LayoutManager.prototype.hideCover = function(){
			if(this.currentMenu){
				this.currentMenu.hide();
			}
			this.currentMenu = null;
			this.coverLayerElement.style.display="none";		
			this.coverLayerElement.removeClassName('disabled_background');			
		}
		
		var FADE_RED_INI = 240;
		var FADE_GREEN_INI = 230;
		var FADE_BLUE_INI = 140;
		var FADE_RED_END_TAB = 151;
		var FADE_GREEN_END_TAB = 160;
		var FADE_BLUE_END_TAB = 168;
		var FADE_RED_END_CUR_TAB = 224;
		var FADE_GREEN_END_CUR_TAB = 224;
		var FADE_BLUE_END_CUR_TAB = 224;
		var FADE_HOLD = 500;
		var FADE_SPEED = 200;
		var FADE_STEP = 5;
		var self = this;
		LayoutManager.prototype.goTab = function(tab, tabLauncher, renameHandler, changeHandler){
			this.markTab(tab, tabLauncher, renameHandler, changeHandler);
			var currentColour = [FADE_RED_INI, FADE_GREEN_INI, FADE_BLUE_INI];
			tab.style.background = "rgb(" + currentColour[0] + "," + currentColour[1] + "," + currentColour[2] + ")";
			setTimeout(function(){
					var endColour = [FADE_RED_END_TAB, FADE_GREEN_END_TAB, FADE_BLUE_END_TAB];
					if(tab.className == "tab current"){
						endColour = [FADE_RED_END_CUR_TAB, FADE_GREEN_END_CUR_TAB, FADE_BLUE_END_CUR_TAB];	
					}
					self.fadeTab(tab.id, currentColour, endColour);
				}, FADE_HOLD);
		}
		
		LayoutManager.prototype.fadeTab = function(tabId, currentColour, endColour){
			var element = document.getElementById(tabId);
			if(!element){
				return;
			}
			
			if(currentColour[0]==endColour[0] && currentColour[1]==endColour[1] && currentColour[2] == endColour[2]){
				element.style.background = "";
				return;
			}
			
			currentColour[0] = this.fadeColour(currentColour[0], endColour[0], FADE_STEP);
			currentColour[1] = this.fadeColour(currentColour[1], endColour[1], FADE_STEP);
			currentColour[2] = this.fadeColour(currentColour[2], endColour[2], FADE_STEP);
			
			element.style.background = "rgb(" + currentColour[0] + "," + currentColour[1] + "," + currentColour[2] + ")";
			setTimeout(function(){self.fadeTab(tabId, currentColour, endColour);}, FADE_SPEED);
		}
		
		LayoutManager.prototype.fadeColour = function(colour, obj, step){
			if(colour > obj){
				if(colour - step > obj){
					return colour - step;	
				}	
			} else {
				if(colour + step < obj){
					return colour + step;	
				}		
			}
			return obj;
		}
		
	}
	
	/*Tab scroll bar management*/
	/*Reset the tab bar values*/
	LayoutManager.prototype.resetTabBar = function(tabId){
		this.scrollTabBarWidth = this.tabImgSize + this.extraGap;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		//we don't need arrows
		this.rightSlider.style.display = "none";
		this.leftSlider.style.display = "none";		
	}
	
	/*Insert tab in the tab bar*/
	LayoutManager.prototype.addToTabBar = function(tabId){
		new Insertion.Top(this.scrollTabBar, "<div id='"+tabId+"' class='tab' style='display:none'></div>");
		var tabHTMLElement = this.scrollTabBar.firstDescendant();
		var tabBorder= parseInt(tabHTMLElement.getStyle('border-left-width'));
		this.changeTabBarSize(2*(this.tabMarginRight + tabBorder));
		this.scrollTabBar.setStyle({right: 0, left:''});
		return tabHTMLElement;
	}

	/*remove a tab from the tab bar*/
	LayoutManager.prototype.removeFromTabBar = function(tabHTMLElement){
		var tabWidth = -1 * (tabHTMLElement.getWidth()-this.tabImgSize +2*this.tabMarginRight);
		Element.remove(tabHTMLElement);
		this.changeTabBarSize(tabWidth);
		this.scrollTabBar.setStyle({right: (this.fixedTabBarWidth - this.scrollTabBarWidth) + 'px', left:''});
	}
	
	/*change the width of the tab bar*/
	LayoutManager.prototype.changeTabBarSize = function(tabSize){
		
		this.scrollTabBarWidth += tabSize;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		if(this.scrollTabBarWidth <= this.fixedTabBarMaxWidth){
			this.scrollTabBar.setStyle({right: 0 + "px"});
			//we don't need arrows
			this.rightSlider.style.display = "none";
			this.leftSlider.style.display = "none";			
		}else{ //if the scrollTabBar is bigger than the fixed tab, we need arrows
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
		return parseInt(this.fixedTabBar.offsetLeft);
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

	LayoutManager.prototype.goRight = function(){
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
