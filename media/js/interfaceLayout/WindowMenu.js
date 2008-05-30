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

//Hierachy for managing a window menu whose HTML code is in templates/index.html.
function WindowMenu(){
	//constructor
	this.htmlElement;		//window HTML element
	this.titleElement;		//title gap
	this.msgElement;		// message gap
	this.element;			//workspace or tab
	this.button; 			//window operation button
	this.operationHandler;	//window handler
	this.title;				//title

	//displays a message
	WindowMenu.prototype.setMsg = function (msg){
		this.msgElement.update(msg);
	}
	//Calculates a usable absolute position for the window
	WindowMenu.prototype.calculatePosition = function(){
		var coordenates = [];
		
		coordenates[1] = BrowserUtilsFactory.getInstance().getHeight()/2 - this.htmlElement.getHeight();
		coordenates[0] = BrowserUtilsFactory.getInstance().getWidth()/2 - this.htmlElement.getWidth()/2;
		
		this.htmlElement.style.top = coordenates[1]+"px";
		this.htmlElement.style.left = coordenates[0]+"px";
	}

	WindowMenu.prototype.setHandler = function (handler){
		this.operationHandler = handler;
	}	
	//displays the window in the correct position
	WindowMenu.prototype.show = function (){
		
		this.calculatePosition();	
		this.initObserving();
		this.titleElement.update(this.title);
		this.htmlElement.style.display = "block";
		this.setFocus();
	}

	//abstract methods
	WindowMenu.prototype.initObserving = function (){
	}
	WindowMenu.prototype.stopObserving = function (){
	}
	WindowMenu.prototype.hide = function (){		
	}

}


//Especific class for the windows used for creating
function CreateWindowMenu (element) {

	//constructor
	this.htmlElement = $('create_menu');		//create-window HTML element
	this.titleElement = $('create_window_title');	//title gap
	this.msgElement = $('create_window_msg');	//error message gap
	this.element = element;				//workspace or tab
	this.button = $('create_btn');
	this.nameInput = $('create_name');
	
	this.operationHandler = function(e){if(e.target == this.nameInput && e.keyCode == Event.KEY_RETURN || e.target == this.button)this.executeOperation()}.bind(this);

	if(this.element == 'workSpace'){
		this.title = gettext('Create workSpace');
	}

	CreateWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
			Event.observe(this.nameInput, "keypress", this.operationHandler);
	}
	
	CreateWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
			Event.stopObserving(this.nameInput, "keypress", this.operationHandler);
	}	
	
	CreateWindowMenu.prototype.setFocus = function(){
		this.nameInput.focus();
	}

	//Calls the Create operation (the task the window is made for).
	CreateWindowMenu.prototype.executeOperation = function(){

		var newName = $('create_name').value;
		switch (this.element){
		case 'workSpace':
			OpManagerFactory.getInstance().addWorkSpace(newName);
			break;
		default:
			break;
		}

	}

	//hides the window and clears all the inputs
	CreateWindowMenu.prototype.hide = function (){

		var inputArray = $$('#create_menu input:not([type=button])');
		for (var i=0; i<inputArray.length; i++){
			inputArray[i].value = '';
		}
		var msg = $('create_window_msg');
		msg.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}
CreateWindowMenu.prototype = new WindowMenu;

//Especific class for alert windows
function AlertWindowMenu (element) {

	//constructor
	this.htmlElement = $('alert_menu');		//create-window HTML element
	this.titleElement = $('alert_window_title');	//title gap
	this.msgElement = $('alert_window_msg');	//error message gap
	this.element = element;				//workspace or tab
	this.button = $('alert_btn1');
	
	this.operationHandler = null;

	this.title = gettext('Warning');
	
	AlertWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
		}
	
	AlertWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
	}	
	
	AlertWindowMenu.prototype.setFocus = function(){
		this.button.focus();
	}

	//hides the window and clears all the inputs
	AlertWindowMenu.prototype.hide = function (){
		this.msgElement.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}
AlertWindowMenu.prototype = new WindowMenu;

