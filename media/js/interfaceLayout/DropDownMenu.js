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
function DropDownMenu(idMenu_, parentMenu) {
	// Allow calling this constructor without arguments for allowing heritage
	if (arguments.length == 0)
		return;

	//Constructor
	this.idMenu = idMenu_;      // menu: menu element in the HTLM code (<div>)
	this.menu = $(this.idMenu);
	this.position;              // position related to the launcher
	this.x; this.y;             // start position
	this.submenu = $$('#'+this.idMenu+' .submenu')[0];
	this.parentMenu = parentMenu;
	this.option_id = 0;         // identifier for options
	this.margin = 5;
	
	// In Firefox 3.0 is necessary to increase the z-index of submenus
	if (this.parentMenu != null) {
		if ((this.parentMenu.menu.style.zIndex == "") || isNaN(this.parentMenu.menu.style.zIndex)) {
			this.menu.style.zIndex = 5;
		} else {
			this.menu.style.zIndex = parseInt(this.parentMenu.menu.style.zIndex) + 1;
		}
	}
}

DropDownMenu.prototype.setParentMenu = function(parentMenu){
	this.parentMenu = parentMenu;
	if(this.parentMenu){
		// In Firefox 3.0 is necessary to increase the z-index of submenus
		if ((this.parentMenu.menu.style.zIndex == "") || isNaN(this.parentMenu.menu.style.zIndex)) {
			this.menu.style.zIndex = 5;
		} else {
			this.menu.style.zIndex = parseInt(this.parentMenu.menu.style.zIndex) + 1;
		}
	}
}

//Calculates the absolute position of the menu according to the point from which it is launched
//The menu can be displayed either on the right or left of the launcher point
DropDownMenu.prototype.calculatePosition = function() {
	if(this.position.indexOf('left') != -1) {
		var smWidth = this.menu.getWidth();
		this.x -= smWidth;
	}
	
	this.menu.setStyle({'max-height' : 'none'});
	var smHeight = this.menu.getHeight();
	
	if(this.position.indexOf('top') != -1) {
		//Check the available height
		if (this.y < smHeight){
			//set max-height in order to have scroll
			this.menu.setStyle({'max-height' : this.y + 'px'});
			this.y = 0;
		}else{
			this.y -= smHeight;
		}
	}else{
		//Check the available height
		var availableHeight = BrowserUtilsFactory.getInstance().getHeight()- this.y;
		if (availableHeight < smHeight){
			//set max-height in order to have scroll
			this.menu.setStyle({'max-height' : availableHeight + 'px'});
		}
	}
	if(this.position.indexOf('center') != -1) {
		var smWidth = this.menu.getWidth();
		this.x -= smWidth/2;
	}
	//set position
	this.menu.setStyle({"top":this.y +'px', "left":this.x +'px'});
	}

//Adds an option to the menu created from the HTML in the specified position (starting on 0).
//imgPath to be shown beside the option (may be null)-- option text -- event:function called on clicking
// additionalClass: string used to add a specific class to the element
DropDownMenu.prototype.addOption = function(imgPath, option, event, position, additionalClass, policy) {
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
	var optionClass = 'option underlined';
	var optionList = $$('#'+this.idMenu+'>.option');
	if(position == optionList.length && position != 0){//new last option
		optionList[optionList.length-1].className='option underlined';
		optionClass = 'option';
	} else if (position == optionList.length && position == 0) {
		optionClass = 'option';
	}
	
	optionClass = optionClass + " " + newClass;

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "'+optionClass+'">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>' + option + '</span></div>';
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
DropDownMenu.prototype.removeOption = function(opId) {
	var option = $(opId).remove();
	if (!option.hasClassName('underlined')) {
		var lastOption = $$('#'+this.idMenu+ ' .option:last-child')[0];
		if (lastOption) {//last option doesn't have a underline
			lastOption.removeClassName('underlined');
		}
	}
}

//updates an option
DropDownMenu.prototype.updateOption = function(opId, imgPath, option, handler, additionalClass, policy) {
	var old=$(opId);
	
	var newClass=additionalClass
	if (!additionalClass)
		newClass="";
		
	var opHtml='<div id="'+ opId +'" class = "option '+newClass+'">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>' + option + '</span>';
	new Insertion.Before(old, opHtml);
	old=old.remove();
	var newOp = $(opId);
	if(old.hasClassName('underlined')){
		newOp.toggleClassName('underlined');
	}
	
	var context = {'menu':this, 'handler':handler}
	Event.observe(newOp, 'click', function(e){this.menu.executeHandler(e,this.handler)}.bind(context), false, policy);
}

//submenu operations
DropDownMenu.prototype.addOptionToSubmenu = function(imgPath, option, event) {
	var lastOption = $$('#'+this.idMenu+ ' .submenu div:last-child')[0];

	if (lastOption) {//last option doesn't have a underline
		lastOption.toggleClassName('underlined');
	}
	//create the HTML code for the option and insert it in the menu
	var opId='secondary_op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "option">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>'+option+'</span></div>';
	new Insertion.Bottom(this.submenu, opHtml);
	lastOption = $(opId);
	Event.observe(lastOption, 'click', event);
	this.option_id++;

	return opId;
}

//removes an option
DropDownMenu.prototype.removeSecondaryOption = function(opId) {
	var option=$(opId).remove();
	if(!option.hasClassName('underlined')) {
		var lastOption = $$('#'+this.idMenu+ ' .submenu div:last-child')[0];
		if (lastOption) {//last option doesn't have a underline
			lastOption.toggleClassName('underlined');
		}
	}
}

//make some arrangements before executing the handler of the option
//for example, hide a submenu if another menu option is clicked 
DropDownMenu.prototype.executeHandler = function(e, handler){

	//perhaps one of the submenus or a chain of submenus are being displayed. The LayoutManager knows who they are, so hide them
	LayoutManagerFactory.getInstance().hideSubmenusOfMenu(this);
	
	//now, execute the handler	
	handler(e);

}

//hides the menu and changes the image of the launcher (in case it has to)
DropDownMenu.prototype.hide = function (hideParents) {
	if(hideParents == null){
		//default value
		hideParents = true;
	}
	 
	this.menu.style.display="none";
	//if it's a submenu
	if(this.parentMenu && hideParents)
		this.parentMenu.hide(hideParents);
}

DropDownMenu.prototype.remove = function () {
    if (isElement(this.menu.parentNode)) {
        Element.remove(this.menu);
    }
}

//shows the menu (calling showMenu function)
DropDownMenu.prototype.show = function (position, x, y) {
	this.position = position.split('-');
	this.x = x;
	this.y = y;
	this.calculatePosition();
	this.menu.style.display="block";
}

//Clears the menu options
DropDownMenu.prototype.clearOptions = function() {
	this.menu.update();
}

//Clears the submenu options
DropDownMenu.prototype.clearSubmenuOptions = function() {
	this.submenu.update();
}


// Specific drop down menu for the menu of channel filters (inheritance from DropDownMenu)
function FilterDropDownMenu(idMenu_, parentMenu) {
	DropDownMenu.call(this, idMenu_, parentMenu);
	
	this.optionHelps = new Hash();
}

// Defining inheritance
FilterDropDownMenu.prototype = new DropDownMenu();


// Adds a option (like DropDownMenu method) with a help buttom
FilterDropDownMenu.prototype.addOptionWithHelp = function(imgPath, option, helpText, event, position) {
	var optionClass = 'option underlined';
	var optionList = $$('#'+this.idMenu+'>.option');
	if (position == optionList.length && position != 0) {//new last option
		optionList[optionList.length-1].className='option underlined';
		optionClass = 'option';
	} else if (position == optionList.length && position == 0)
		optionClass = 'option';

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "'+optionClass+'">';

	//creates the elements for the left side
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>' + option + '</span>';

	//creates the element for the rigth side (help buttom)
	opHtml += '<a class="help_button" type="button"></a></div>';

	//inserts the option in the menu
	try {
		if (optionList.length >0) {
			if (position == 0)
				new Insertion.Before(optionList[position], opHtml);
			else
				new Insertion.After(optionList[position-1], opHtml);
		} else {
			new Insertion.Bottom(this.menu, opHtml);
		}
		var newOption = $(opId);
		newOption.style.paddingRight = '25px';
		Event.observe(newOption, 'click', event);
		
		// Creates the help "pop-up" like a menu
		var idHelpMenu = 'helpFor_' + opId;
		var helpMenuHtml = '<div id="' + idHelpMenu + '" class="drop_down_menu"></div></div>';
		new Insertion.After($('menu_layer'), helpMenuHtml);
		helpMenu = new DropDownMenu(idHelpMenu, this);
		var helpOpId = helpMenu.addOption(null, helpText, function(){}, 0);

		// Sets the help style
		var helpOpElement = helpMenu.menu.getElementsBySelector("#" + helpOpId)[0];
		Element.extend(helpOpElement);
		helpOpElement.addClassName("help_text");

		// Adds the help launcher
		var helpButtom = newOption.getElementsBySelector('.help_button')[0]
		Event.observe(helpButtom, 'click',
			function(e){
				Event.stop(e);
				var allHelps = $$('div[id^=helpFor_]');
				var helpShown = null;
				var i = 0;
				while ((i < allHelps.length) && (helpShown == null)) {
					if (allHelps[i].style.display == 'block'){
						allHelps[i].style.display = 'none';
						helpShown = allHelps[i];
					}
					i++;
				}
				if ((helpShown == null) || helpShown != this.menu) {
					LayoutManagerFactory.getInstance().showDropDownMenu('filterHelp', this, Event.pointerX(e), Event.pointerY(e));
				}
			}.bind(helpMenu)
		);

		this.optionHelps[idHelpMenu] = helpMenu;
		this.option_id++;
	} catch(e) {
		return null;
	}

	return opId;
}

FilterDropDownMenu.prototype.removeOption = function(opId) {
	DropDownMenu.prototype.removeOption.call(this, opId);

	var idHelpMenu = 'helpFor_' + opId;
	this.optionHelps[idHelpMenu].remove();
}


FilterDropDownMenu.prototype.remove = function () {
	// Removes all the helps
	var helpIds = this.optionHelps.keys();
	for (var i = 0; i < helpIds.length; i++) {
		this.optionHelps[helpIds[i]].remove();
	}

	DropDownMenu.prototype.remove.call(this);
}


/**
 * @class
 * Color Drop Down Menu. This Drop Down
 */
function ColorDropDownMenu(idColorMenu, parentMenu, onClick, options) {
	options = options != undefined ? options : {};

	var menuHTML = '<div id="'+idColorMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);

	DropDownMenu.call(this, idColorMenu, parentMenu);
	this.menu.addClassName("color_menu");

	this.currentRow = document.createElement("div");
	Element.extend(this.currentRow);
	this.currentRow.className = "row";
	this.menu.appendChild(this.currentRow);
	this.clearer = document.createElement("div");
	this.clearer.className = "floatclearer";
	this.currentRow.appendChild(this.clearer);

	var onMouseOver = options['onMouseOver'] != undefined ? options['onMouseOver'] : function(){};

	// On Mouse Over
	this._onMouseOver = function(e) {
		var windowStyle = document.defaultView.getComputedStyle(BrowserUtilsFactory.getInstance().getTarget(e), null);

		var newColor = windowStyle.getPropertyCSSValue("background-color").
		               getRGBColorValue();

		onMouseOver(newColor);
	}

	// On Mouse Out
	var onMouseOut = options['onMouseOut'] != undefined ? options['onMouseOut'] : function(){};

	this._onMouseOut = function(e) {
		onMouseOut();
	}

	this._onClick = function(e) {
		var windowStyle = document.defaultView.getComputedStyle(BrowserUtilsFactory.getInstance().getTarget(e), null);

		var newColor = windowStyle.getPropertyCSSValue("background-color").
		               getRGBColorValue();
		onClick(newColor);
		LayoutManagerFactory.getInstance().hideCover();
	}
}
ColorDropDownMenu.prototype = new DropDownMenu();

ColorDropDownMenu.prototype.appendColor = function(color) {
	var cell = document.createElement("div");
	Element.extend(cell);
	cell.className = "color_button";
	cell.style.background = "#" + color;
	this.currentRow.insertBefore(cell, this.clearer);

	cell.observe('mouseover', this._onMouseOver, true);
	cell.observe('mouseout', this._onMouseOut, true);
	cell.observe('click', this._onClick, true);
}

ColorDropDownMenu.prototype.show = function (position, x, y) {
	DropDownMenu.prototype.show.apply(this, arguments);

	// This is needed for Firefox 2
	this.menu.style.height = this.currentRow.offsetHeight + "px";
}

ColorDropDownMenu.prototype.addOption = function() {
}

ColorDropDownMenu.prototype.removeOption = function() {
}

/////////////////////////////////////////////////////////////////////////
// Remote Channel Operations
/////////////////////////////////////////////////////////////////////////
// Specific drop down menu for the remote channel operations!
function RemoteChannelOperationsDropDownMenu(idMenu_, parentMenu) {
	var menuHTML = '<div id="remote_channel_operations" class="drop_down_menu">';
	
	new Insertion.After($('menu_layer'), menuHTML);
	
	DropDownMenu.call(this, idMenu_, parentMenu);
}

// Defining inheritance
RemoteChannelOperationsDropDownMenu.prototype = new DropDownMenu();

RemoteChannelOperationsDropDownMenu.prototype.getTextFromOp = function(op_code) {
	var menu_options = this.menu.childElements();
	
	for (var i=0; i<menu_options.length; i++) {
		var option_id = menu_options[i].id;
		var id_len = option_id.length;
		var last_character = parseInt(option_id.charAt(id_len - 1));
		
		if (last_character == op_code)
			return menu_options[i].getTextContent();
		
	}
}

