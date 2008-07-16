/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telefónica Investigación y Desarrollo 
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


function Tab (tabInfo, workSpace) {
				
    // ****************
    // PUBLIC METHODS
    // ****************

	Tab.prototype.destroy = function(){
		Element.remove(this.tabHTMLElement);
		
		this.menu.remove();
		
		this.dragboard.destroy();
		
		delete this;
	}
	
	/*																		*
	 *  Paint the igadget list of this tab. It is used in the first charge.	*
	 *																		*/
	Tab.prototype.show = function (scrollLeft) {
		var iGadgets = this.dragboard.getIGadgets();
	    var html="";
	    var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
	    //var handler = function(){this.dragboard.setVisibleIGadget(iGadgets[i]);this.dragboard.paint();}.bind(this);
	    
	    html+= '<div class="container tab" id="'+this.tabName+'" style="left:'+scrollLeft+'px">';
		html+= '<div class="toolbar anchorTop"><h1>'+ nameToShow +'</h1><a href="/accounts/login/?next=/" class="logout">Exit</span></div>';
		html+= '<div class="tab_content">';
		for(i=0;i<iGadgets.length;i++){
			html+= '<div class="igadget_item">';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">';
			html+= '<img class="igadget_icon" src="'+iGadgets[i].getGadget().getImageURI()+'" />'
			html+= '</a>';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">'+iGadgets[i].getVisibleName()+'</a>';
			html+= '</div>';
		}
		html+= '</div></div>';
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

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	this.tabsContainer=$('tabs_container');
	this.tabElement = null;
}
