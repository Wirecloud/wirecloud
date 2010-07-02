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



//Class for managing a drop down menu whose HTML code is in templates/index.html.
//The options may be created either by default in the HTML code or dinamically with the addOption function
function SideBarMenu(idMenu_) {
	// Allow calling this constructor without arguments for allowing heritage
	if (arguments.length == 0)
		return;

	//Constructor
	this.idMenu = idMenu_;      // menu: menu element in the HTML code (<div>)
	this.menu = $(this.idMenu);
	this.container = this.menu.parentNode;
	this.option_id = 0;         // identifier for options
	this.margin = 5;
	this.visible = false;
	
}

// Adds an option to the menu created from the HTML in the specified position (starting on 0).
// option text -- event:function called on clicking
// additionalClass: string used to add a specific class to the element
SideBarMenu.prototype.addOption = function(option, event, position, additionalClass, policy) {
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
	
	var optionList = $$('#'+this.idMenu+'> div');
	var optionClass = newClass;

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<span id="'+ opId +'" class = "'+optionClass+'">';
	opHtml += option + '</span>';
	try {
		if(optionList.length > 0) {
			if(position == 0) {
				new Insertion.Before(optionList[position], opHtml);
			} else {
				new Insertion.After(optionList[position-1], opHtml);
			}
		} else {
			new Insertion.Bottom(this.menu, opHtml);
		}
		var newOption = $(opId);
		var context = {'menu':this, 'handler':event}
		Event.observe(newOption, 'click', function(e){this.menu.executeHandler(e,this.handler)}.bind(context), false, policy);
		this.option_id++;
	} catch(e) {
		return null;
	}
	return opId;
}

//removes an option
SideBarMenu.prototype.removeOption = function(opId) {
	var option = $(opId).remove();
}

//updates an option
SideBarMenu.prototype.updateOption = function(opId, option, handler, additionalClass, policy) {
	var old=$(opId);
	
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
		
	var opHtml='<span id="'+ opId +'" class = "'+newClass+'">';
	opHtml += option + '</span>';
	new Insertion.Before(old, opHtml);
	old=old.remove();
	var newOp = $(opId);
	
	var context = {'menu':this, 'handler':handler}
	Event.observe(newOp, 'click', function(e){this.menu.executeHandler(e,this.handler)}.bind(context), false, policy);
}

//make some arrangements before executing the handler of the option
//for example, hide a submenu if another menu option is clicked 
SideBarMenu.prototype.executeHandler = function(e, handler){
	handler(e);

}

//hides the menu
SideBarMenu.prototype.hide = function () {	 
	this.container.removeClassName("visible");
	this.visible = false;
}

//hides the menu and changes the image of the launcher (in case it has to)
SideBarMenu.prototype.hideTemporarily = function () {	 
	this.container.removeClassName("visible");
}

//shows the menu (calling showMenu function)
SideBarMenu.prototype.show = function (position, x, y) {
	this.container.addClassName("visible");
	this.visible = true;
}

SideBarMenu.prototype.remove = function () {
	Element.remove(this.menu);
}

//Clears the menu options
SideBarMenu.prototype.clearOptions = function() {
	this.menu.update();
}

SideBarMenu.prototype.getOptionsLength = function() {
	return this.menu.childNodes.length;
}