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


function Tab (tabInfo, workSpace, index) {
				
    // ****************
    // PUBLIC METHODS
    // ****************

	Tab.prototype.destroy = function(){
		this.dragboard.destroy();		
		delete this;
	}
	
	/*																		*
	 *  Paint the igadget list of this tab. It is used in the first charge.	*
	 *																		*/
	Tab.prototype.show = function (scrollLeft, index) {
		var iGadgets = this.dragboard.getIGadgets();
	    var html="";
	    var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
	    //var handler = function(){this.dragboard.setVisibleIGadget(iGadgets[i]);this.dragboard.paint();}.bind(this);
	    
	    html+= '<div class="container tab" id="'+this.tabName+'" style="left:'+scrollLeft+'px">';
		html+= '<div class="toolbar anchorTop"><a href="javascript:OpManagerFactory.getInstance().showWorkspaceMenu()" class="back_button"><span class="menu_text">Menu</span></a>' +
				'<h1>'+ nameToShow +'</h1>';
		if (isAnonymousUser)
			html +='<a href="/accounts/login/?next=/" class="logout">Sign-in</a></div>';
		else
			html +='<a href="/logout" class="logout">Exit</a></div>';
		html+= '<div class="tab_content">';
		for(i=0;i<iGadgets.length;i++){
			html+= '<div class="igadget_item">';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">';
			html+= '<img class="igadget_icon" src="'+iGadgets[i].getGadget().getIPhoneImageURI()+'" />'
			html+= '</a>';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">'+iGadgets[i].getVisibleName()+'</a>';
			html+= '</div>';
		}
		html+= '</div>';
		var tabsLength = this.workSpace.getNumberOfTabs();
		if (tabsLength > 1){
			html += '<div class="navbar">';
			for(i=0;i<tabsLength;i++){
				if (i!=index)
					html += '<img src="/ezweb/images/iphone/greyball.png"></img>'
				else
					html += '<img src="/ezweb/images/iphone/whiteball.png"></img>'
			}
			html+= '</div>';
		}	
		html+= '</div>';
	    new Insertion.Bottom(this.tabsContainer, html);
	    this.tabElement = $(this.tabName);
	}
	
	Tab.prototype.updateLayout = function (scrollLeft) {
		if (this.tabElement)
			this.tabElement.setStyle({left: scrollLeft+"px"});
	}

	Tab.prototype.getDragboard = function () {
		return this.dragboard;
	}
	
	Tab.prototype.getId = function () {
		return this.tabInfo.id;
	}
	
	Tab.prototype.is_painted = function () {
		return true;
	}

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.index = index;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	this.tabsContainer=$('tabs_container');
	this.tabElement = null;
}
