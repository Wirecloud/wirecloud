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
function ToolbarMenu(idMenu_) {
	// Allow calling this constructor without arguments for allowing heritage
	if (arguments.length == 0)
		return;

	//Constructor
	this.idMenu = idMenu_;      // menu: menu element in the HTML code (<div>)
	this.menu = $(this.idMenu);
	this.option_id = 0;         // identifier for options
	this.margin = 5;
	
	this.MAX_OPTIONS = 5;
	
}

// Adds an option to the menu created from the HTML in the specified position (starting on 0).
// option text -- event:function called on clicking
// additionalClass: string used to add a specific class to the element
ToolbarMenu.prototype.addOption = function(option, event, position, additionalClass, policy) {
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
	var optionClass = 'option underlined';
	var optionList = $$('#'+this.idMenu+'> div');
	if(position == optionList.length && position != 0){//new last option
		optionList[optionList.length-1].removeClassName('last_toolbar_button');
		optionClass = 'last_toolbar_button';
	} else if (position == 0) { //new first option
		if (optionList.length > 0){ //the toolbar is not empty
			optionList[0].removeClassName('first_toolbar_button');
		}
		optionClass = 'first_toolbar_button';
	}
	
	optionClass = optionClass + " " + newClass;

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "'+optionClass+'">';
	opHtml += option + '</div>';
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
ToolbarMenu.prototype.removeOption = function(opId) {
	var option = $(opId).remove();
	if (option.hasClassName('last_toolbar_button')) {
		var lastOption = $$('#'+this.idMenu+ ' > div:last-child')[0];
		if (lastOption) {
			lastOption.addClassName('last_toolbar_button');
		}
	}
	if (option.hasClassName('first_toolbar_button')) {
		var firstOption = $$('#'+this.idMenu+ ' > div:first-child')[0];
		if (firstOption) {
			firstOption.addClassName('first_toolbar_button');
		}
	}
}

//updates an option
ToolbarMenu.prototype.updateOption = function(opId, option, handler, additionalClass, policy) {
	var old=$(opId);
	
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
		
	var opHtml='<div id="'+ opId +'" class = "option '+newClass+'">';
	opHtml += option + '</div>';
	new Insertion.Before(old, opHtml);
	old=old.remove();
	var newOp = $(opId);
	if (old.hasClassName('last_toolbar_button')){
		newOp.addClassName('last_toolbar_button');
	}
	if (old.hasClassName('first_toolbar_button')){
		newOp.addClassName('first_toolbar_button');
	}
	
	var context = {'menu':this, 'handler':handler}
	Event.observe(newOp, 'click', function(e){this.menu.executeHandler(e,this.handler)}.bind(context), false, policy);
}

//make some arrangements before executing the handler of the option
//for example, hide a submenu if another menu option is clicked 
ToolbarMenu.prototype.executeHandler = function(e, handler){

	//perhaps one of the submenus or a chain of submenus are being displayed. The LayoutManager knows who they are, so hide them
	//LayoutManagerFactory.getInstance().hideSubmenusOfMenu(this);
	
	//now, execute the handler	
	handler(e);

}

//hides the menu and changes the image of the launcher (in case it has to)
ToolbarMenu.prototype.hide = function () {	 
	this.menu.removeClassName("visible_submenu");
}

ToolbarMenu.prototype.remove = function () {
	Element.remove(this.menu);
}

//shows the menu (calling showMenu function)
ToolbarMenu.prototype.show = function (position, x, y) {
	this.menu.addClassName("visible_submenu");
}

//Clears the menu options
ToolbarMenu.prototype.clearOptions = function() {
	this.menu.update();
}

ToolbarMenu.prototype.getOptionsLength = function() {
	return this.menu.childNodes.length;
}