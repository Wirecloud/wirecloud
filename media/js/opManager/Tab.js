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


function Tab (tabInfo, workSpace) {

	//CALLBACK METHODS
	var renameSuccess = function(transport){

	}
	var renameError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error renaming a tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var deleteSuccess = function(transport){
		LayoutManagerFactory.getInstance().hideCover();
	}
	var deleteError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error removing a tab: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
		
		LayoutManagerFactory.getInstance().hideCover();
	}

    // ****************
    // PUBLIC METHODS
    // ****************

	Tab.prototype.destroy = function(){
		LayoutManagerFactory.getInstance().removeFromTabBar(this.tabHTMLElement);
		
		this.menu.remove();
		
		this.dragboard.destroy();
	}
	
	Tab.prototype.updateInfo = function (tabName){

		//If the server isn't working the changes will not be saved
		if(tabName=="" || tabName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a tab: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		}else if(!this.workSpace.tabExists(tabName)){
			this.tabInfo.name = tabName;
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			var o = new Object;
			o.name = tabName;
			var tabData = Object.toJSON(o);
			var params = {'tab': tabData};
			PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, renameSuccess, renameError);
		}else{
			var msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workSpace.workSpaceState.name}, true);
			LogManagerFactory.getInstance().log(msg);
		}
	}

	Tab.prototype.deleteTab = function() {
		if(this.workSpace.removeTab(this.tabInfo.id)==true){
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			PersistenceEngineFactory.getInstance().send_delete(tabUrl, this, deleteSuccess, deleteError);		
		}
	}

	Tab.prototype.fillWithLabel = function() {
		if(this.tabNameHTMLElement != null){
			this.tabNameHTMLElement.remove();
		}
		var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
    	new Insertion.Top(this.tabHTMLElement, spanHTML);
    	var difference = this.tabHTMLElement.getWidth() - this.tabWidth;
    	if(difference!=0)
	    	LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabNameHTMLElement = this.tabHTMLElement.firstDescendant();
		this.tabWidth = this.tabHTMLElement.getWidth();
    }

	Tab.prototype.fillWithInput = function () {
		var oldTabWidth= this.tabHTMLElement.getWidth();
		this.tabNameHTMLElement.remove();
		var inputHTML = "<input class='tab_name' value='"+this.tabInfo.name+"' size='"+(this.tabInfo.name.length)+"' maxlength=30 />";
		new Insertion.Top(this.tabHTMLElement, inputHTML);
		this.tabNameHTMLElement =  this.tabHTMLElement.firstDescendant();
		var newTabWidth= this.tabHTMLElement.getWidth();
		var difference= newTabWidth-oldTabWidth;
		if (difference!=0)
			LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabWidth = newTabWidth;
		
		this.tabNameHTMLElement.focus();	
		Event.observe(this.tabNameHTMLElement, 'blur', function(e){Event.stop(e);
					this.fillWithLabel()}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
					e.target.blur();} else{this.makeVisibleInTabBar();}}.bind(this));					
		Event.observe(this.tabNameHTMLElement, 'change', function(e){Event.stop(e);
					this.updateInfo(e.target.value);}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keyup', function(e){Event.stop(e);
					e.target.size = (e.target.value.length==0)?1:e.target.value.length;
					var newTabWidth = e.target.parentNode.getWidth();
					var difference= newTabWidth-this.tabWidth;
					if (difference!=0)
						LayoutManagerFactory.getInstance().changeTabBarSize(difference);
					this.tabWidth = newTabWidth;
				}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'click', function(e){Event.stop(e);}); //do not propagate to div.					
	}
	
	Tab.prototype.unmark = function () {
		//this.hideDragboard();
		LayoutManagerFactory.getInstance().unmarkTab(this.tabHTMLElement, this.tabOpsLauncher, this.changeTabHandler, this.renameTabHandler);

	}

	Tab.prototype.show = function () {
		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

		this.dragboard.recomputeSize();
		this.markAsCurrent();
	}
	
		/* if the tab is out of the visible area of the tab bar, slide it to show it */
	Tab.prototype.makeVisibleInTabBar = function(){
		var tabLeft = Position.cumulativeOffset(this.tabHTMLElement)[0];
		var fixedBarLeft = LayoutManagerFactory.getInstance().getFixedBarLeftPosition();
		var difference = tabLeft - fixedBarLeft;
		if (difference < 0){
			LayoutManagerFactory.getInstance().changeScrollBarRightPosition(difference);
		}
		else{
			var fixedBarRight = fixedBarLeft + LayoutManagerFactory.getInstance().getFixedBarWidth();
			var visibleTabArea = fixedBarRight - tabLeft;
			difference = visibleTabArea - this.tabHTMLElement.getWidth();
			if(difference < 0){
				LayoutManagerFactory.getInstance().changeScrollBarRightPosition(-1*difference);
			}
		}
	}
	
	Tab.prototype.markAsCurrent = function (){
		LayoutManagerFactory.getInstance().markTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	}
	
	Tab.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideTab(this.tabHTMLElement);
		//this.hideDragboard();
	}
	
	Tab.prototype.go = function () {

		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

	    this.dragboard.recomputeSize();
	    LayoutManagerFactory.getInstance().goTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	    this.makeVisibleInTabBar();
	}

	Tab.prototype.getDragboard = function () {
		return this.dragboard;
	}

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	
	/*constructor*/
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.dragboardLayerName = "dragboard_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabHTMLElement;
	this.tabNameHTMLElement = null;
	this.tabWidth = 0;

	//tab event handlers
	this.renameTabHandler = function(e){
		this.makeVisibleInTabBar();
		this.fillWithInput();
	}.bind(this);
	
	this.changeTabHandler = function(e){
		this.workSpace.setTab(this);
		this.makeVisibleInTabBar();
	}.bind(this);

	// Dragboard layer creation
	var dragboardHTML = $("dragboard_template").innerHTML;
	var wrapper = $("wrapper");

	new Insertion.Top(wrapper, dragboardHTML);

	this.dragboardElement = wrapper.firstDescendant();

	this.dragboardElement.setAttribute('id', this.dragboardLayerName);

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	
	LayoutManagerFactory.getInstance().resizeContainer(this.dragboardElement);
	
	// Tab creation
	//add a new tab to the tab section
	this.tabHTMLElement = LayoutManagerFactory.getInstance().addToTabBar(this.tabName);

	this.tabOpsLauncher = this.tabName+"_launcher";
	var tabOpsLauncherHTML = '<input id="'+this.tabOpsLauncher+'" type="button" title="'+gettext("Options")+'" class="tabOps_launcher tabOps_launcher_show"/>';
	new Insertion.Bottom(this.tabHTMLElement, tabOpsLauncherHTML);
	var tabOpsLauncherElement = $(this.tabOpsLauncher);
	Event.observe(tabOpsLauncherElement, "click", function(e){e.target.blur();Event.stop(e);
													LayoutManagerFactory.getInstance().showDropDownMenu('tabOps',this.menu, Event.pointerX(e), Event.pointerY(e));}.bind(this), true);
	tabOpsLauncherElement.setStyle({'display':'none'});

	//fill the tab label with a span tag
	this.fillWithLabel();

	//create tab menu
	var idMenu = 'menu_'+this.tabName;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);
	this.menu.addOption("/ezweb/images/rename.gif", "Rename", function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().fillWithInput();
								LayoutManagerFactory.getInstance().hideCover();},0);

	this._lockFunc = function(locked) {
		if (locked) {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this));
		} else {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this));	
		}
		this.dragboard.setLock(locked);
		this.workSpace._checkLock();
	}.bind(this);

	if (this.dragboard.isLocked()) {
		this.lockEntryId = this.menu.addOption("/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this),1);
	} else {
		this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this),1);
	}
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.firstVisible = false;
				tab.visibleEntryId = tab.menu.addOption("/ezweb/images/visible.png", "First Visible", function(){LayoutManagerFactory.getInstance().hideCover(); tab.markAsVisible();}.bind(tab),1);	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisible = function (){
		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
		var o = new Object;
		o.visible = "true";
		var tabData = Object.toJSON(o);
		var params = {'tab': tabData};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, this.markAsVisibleSuccess, this.markAsVisibleError);
	}.bind(this);
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.addMarkAsVisible();	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisibleError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}.bind(this);
	
	this.addMarkAsVisible = function (){
		this.firstVisible = false;
		this.visibleEntryId = this.menu.addOption("/ezweb/images/visible.png", "Mark as Visible", function(){LayoutManagerFactory.getInstance().hideCover(); this.markAsVisible();}.bind(this),1);
	}.bind(this);
	
	if (this.tabInfo.visible != "true") {
		this.addMarkAsVisible();
	} else {
		this.firstVisible = true;
		this.visibleEntryId = null;
	}
	
	this.menu.addOption("/ezweb/images/remove.png", "Remove",function(){LayoutManagerFactory.getInstance().showWindowMenu('deleteTab');},2);
}
