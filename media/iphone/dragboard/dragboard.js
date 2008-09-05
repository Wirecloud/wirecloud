/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2007-2008 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
 */

/**
 * @author aarranz
 */
function Dragboard(tab, workSpace, dragboardElement) {
	// *********************************
	// PRIVATE VARIABLES
	// *********************************
	this.loaded = false;
	this.currentCode = 1;

	// HTML Elements
	this.dragboardElement = $('dragboard');
	this.tabNameElement = $('tab_name');
	this.barElement = $('bar');
	
	//Atributes
	this.iGadgets = new Hash();
	this.tab = tab;
	this.tabId = tab.tabInfo.id;
	this.workSpace = workSpace;
	this.workSpaceId = workSpace.workSpaceState.id;
	
	this.visibleIGadget=null;
	
	// ****************
	// PUBLIC METHODS 
	// ****************

	Dragboard.prototype.paint = function (iGadgetId) {
		this.setVisibleIGadget(iGadgetId);
		
		//update the tab name
		this.tabNameElement.update(this.tab.tabInfo.name);
		
		//paints the visible igadget
		if (this.visibleIGadget)
			this.visibleIGadget.paint();
			
		if (OpManagerFactory.getInstance().visibleLayer!="dragboard"){
			//Paints the dragboard and the visibleIGadget and hide the gadget menu
			this.workSpace.hide();
			this.dragboardElement.setStyle({display: "block", left : "100%"});
			slide(false, this.dragboardElement);
			
			//show the bar element
			this.barElement.setStyle({display: "block"});
		}
	}
	
	Dragboard.prototype.paintRelatedIGadget = function (iGadgetId) {
		var tabId = this.getIGadget(iGadgetId).getTabId();
		var tabIndex = this.workSpace.tabView.getTabIndexById(tabId);
		if (tabIndex != null){ // the tab is already visible
			this.setVisibleIGadget(iGadgetId);
			this.workSpace.tabView.set('activeTab', this.workSpace.tabView.getTab(tabIndex));
		}
		else
			this.paint(iGadgetId)
	}
	
	Dragboard.prototype.hide = function () {
		//hide and clean the dragboard layer
		this.dragboardElement.setStyle({display: "none"});
		
		//clean the igadget
		if (this.visibleIGadget)
			this.visibleIGadget =  null;
		
		//clean the bar and the content
		//TODO: elimiar la variable a pelo "tabView"	
		/*delete this.workSpace.tabView;
		this.workSpace.tabView = new TabView("dragboard", { maxTabs : 3 });
		tabView = this.workSpace.tabView;*/
		this.workSpace.tabView.clear();
		this.barElement.setStyle({display: "none"});
	}

	Dragboard.prototype.markRelatedIgadget = function(iGadgetId){
		$("related_"+iGadgetId).addClassName("active");
		
		// highlight related tabs
		var igadget = this.getIGadget(iGadgetId);
		if (igadget){
			var tabId = igadget.getTabId();			
			var tabIndex = this.workSpace.tabView.getTabIndexById(tabId);
			if (tabIndex != null){ // the tab is already visible
				this.workSpace.tabView.getTab(tabIndex).set('highlight', true);
			}
		}		
	}
	
	/**
	 * Removes the mark on the related igadget. It has to be called at least:
	 * - when the user clicks on the tab containing that igadget
	 * - when the user clicks on the related gadget icon
	 */
	Dragboard.prototype.unmarkRelatedIgadget = function(iGadgetId){		
		var r = $("related_"+iGadgetId);
		if (r){
			r.removeClassName("active");
		}
	}
	
	Dragboard.prototype.parseTab = function(tabInfo) {
		var curIGadget, position, width, height, igadget, gadget, gadgetid, minimized;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];
			
			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.code, curIGadget.name, this);
			this.iGadgets[curIGadget.id] = igadget;

			if (curIGadget.code >= this.currentCode)
				this.currentCode =  curIGadget.code + 1;
		}
		this.loaded = true;
	}

	Dragboard.prototype.igadgetLoaded = function (iGadgetId) {
	    //DO NOTHING
	}

	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			this.setConfigurationVisible(igadget.getId(), false);
		} catch (e) {
		}
	}

	Dragboard.prototype.showInstance = function (igadget) {
		igadget.paint(this.dragboardElement, this.dragboardStyle);
	}

	Dragboard.prototype.getIGadgets = function() {
		return this.iGadgets.values();
	}

	Dragboard.prototype.getIGadget = function (iGadgetId) {
		return this.iGadgets[iGadgetId];
	}

	Dragboard.prototype.getWorkspace = function () {
		return this.workSpace;
	}
	
	Dragboard.prototype.getVisibleIGadget = function () {
		return this.visibleIGadget;
	}
	
	Dragboard.prototype.setVisibleIGadget = function (iGadgetId) {
		this.visibleIGadget = this.getIGadget(iGadgetId);
		this.unmarkRelatedIgadget(iGadgetId);
	}
	
	// *******************
	// INITIALIZING CODE
	// *******************

	this.parseTab(tab.tabInfo);
}