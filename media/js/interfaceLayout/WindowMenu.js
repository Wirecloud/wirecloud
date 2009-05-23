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
		
		coordenates[1] = BrowserUtilsFactory.getInstance().getHeight()/2 - this.htmlElement.getHeight()/2;
		coordenates[0] = BrowserUtilsFactory.getInstance().getWidth()/2 - this.htmlElement.getWidth()/2;
		
		this.htmlElement.style.top = coordenates[1]+"px";
		this.htmlElement.style.left = coordenates[0]+"px";
		this.htmlElement.style.right = coordenates[0]+"px";
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
	WindowMenu.prototype.setFocus = function (){		
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
			if(!OpManagerFactory.getInstance().workSpaceExists(newName)){
					OpManagerFactory.getInstance().addWorkSpace(newName);
			}
			else{
				this.msgElement.update(gettext('Invalid name: the name '+newName+' is already in use'));
			}
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
	this.button2 = $('alert_btn2');
	
	this.operationHandler = null;
	this.operationHandler2 = null;

	this.title = gettext('Warning');
	
	AlertWindowMenu.prototype.setHandler = function(handlerYesButton, handlerNoButton){
		this.operationHandler = handlerYesButton;
		
		if (!handlerNoButton)
			this.operationHandler2 = function () { LayoutManagerFactory.getInstance().hideCover(); }
		else
			this.operationHandler2 = handlerNoButton;
	}

	AlertWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
			Event.observe(this.button2, "click", this.operationHandler2);
		}
	
	AlertWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
			Event.stopObserving(this.button2, "click", this.operationHandler2);
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

//Especific class for alert windows
function MessageWindowMenu (element) {

	//constructor
	this.htmlElement = $('message_menu');		//create-window HTML element
	this.titleElement = $('message_window_title');	//title gap
	this.msgElement = $('message_window_msg');	//error message gap
	this.button = $('message_btn1');
	this.title = gettext('Warning');
	
	MessageWindowMenu.prototype.setFocus = function(){
		this.button.focus();
	}

	//hides the window and clears all the inputs
	MessageWindowMenu.prototype.hide = function (){
		this.msgElement.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}

MessageWindowMenu.prototype = new WindowMenu;

//Especific class for alert windows
function InfoWindowMenu (element) {

	//constructor
	this.htmlElement = $('info_menu');		//create-window HTML element
	this.titleElement = $('info_window_title');	//title gap
	this.msgElement = $('info_window_msg');	//error message gap
	this.title = gettext('Do you know what ... ?');

	//hides the window and clears all the inputs
	InfoWindowMenu.prototype.hide = function (){
		this.msgElement.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}

InfoWindowMenu.prototype = new WindowMenu;

//Especific class for publish windows
function PublishWindowMenu (element) {

	//constructor
	this.htmlElement = $('publish_menu');		//create-window HTML element
	this.titleElement = $('publish_window_title');	//title gap
	this.msgElement = $('publish_window_msg');	//error message gap
	this.button = $('publish_btn1');
	this.title = gettext('Publish Workspace');
	
	this.not_valid_characters = ['/', '?', '&', ':']
	
	this.operationHandler = function(e){
		var publish_name = $('publish_name').value;
		var publish_vendor = $('publish_vendor').value;
		var publish_version = $('publish_version').value;
		var publish_email = $('publish_email').value;
		
		if (publish_name.value!="" && publish_vendor!="" && publish_version!="" && publish_email!="") {
			// Not empty input data!
			// Now validating input data!
			
			for (var i=0; i<this.not_valid_characters.length; i++) {
				var character = this.not_valid_characters[i];
				
				if (publish_name.indexOf(character) >= 0 || publish_vendor.indexOf(character) >= 0 || publish_version.indexOf(character) >= 0) {
					this.msgElement.update("Not valid characters in: 'Mashup Name', 'Distributor' or 'Version'. Don't use [/, ?, &, :]");
					return;
				}
			}
			
			this.executeOperation();
			LayoutManagerFactory.getInstance().hideCover();
		}
		else{
			this.msgElement.update("All the required fields must be filled");
		}
	}.bind(this);


	PublishWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
	}
	
	PublishWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
	}	
	
	PublishWindowMenu.prototype.setFocus = function(){
		$('publish_name').focus();
	}
	
	PublishWindowMenu.prototype.executeOperation = function(){
		var o = new Object;
		o.name = $('publish_name').value;
		o.vendor = $('publish_vendor').value;
		o.version = $('publish_version').value;
		o.author = $('publish_author').value;
		o.email = $('publish_email').value;
		o.description = $('publish_description').value;
		o.imageURI = $('publish_imageURI').value;
		o.wikiURI = $('publish_wikiURI').value;
		OpManagerFactory.getInstance().activeWorkSpace.publish(o);
	}
	


	//hides the window and clears all the inputs
	PublishWindowMenu.prototype.hide = function (){

		var inputArray = $$('#publish_menu input:not([type=button])');
		for (var i=0; i<inputArray.length; i++){
			inputArray[i].value = '';
		}
		$('publish_description').value="";
		var msg = $('create_window_msg');
		msg.update();
		this.stopObserving();
		this.msgElement.update();
		this.htmlElement.style.display = "none";		
	}

}

PublishWindowMenu.prototype = new WindowMenu;

//Especific class for Feed creator window
function AddFeedMenu (element) {

	//constructor
	this.htmlElement = $('add_feed_menu');		//create-window HTML element
	this.titleElement = $('add_feed_window_title');	//title gap
	this.msgElement = $('add_feed_window_msg');	//error message gap
	this.button = $('add_feed_btn1');
	this.type="";	
	
	AddFeedMenu.prototype.setType = function(type){
		this.type=type;
		if (this.type=="addFeed"){
			this.title = gettext('Add Feed');
			$('color_pref_opt').setStyle({display:"table-row"});
		}
		else if (this.type=="addSite"){
			this.title = gettext('Add Site');
		}
		this.titleElement.update(this.title);
	}	

	
	this.not_valid_characters = ['/', '?', '&', ':']
	
	
	this.operationHandler = function(e){
		var feed_name = $('feed_name').value;
		var feed_URL = $('feed_URL').value;
		var feed_image_URL = $('feed_image_URL').value;
		var feed_iphone_URL = $('feed_iphone_URL').value;
		var feed_color = $('feed_color').value;
		
		if (feed_name.value!="" && feed_URL!="") {
			// Not empty input data!
			// Now validating input data!
			
			for (var i=0; i<this.not_valid_characters.length; i++) {
				var character = this.not_valid_characters[i];
				
				if (feed_name.indexOf(character) >= 0) {
					this.msgElement.update("Not valid characters in the feed Name");
					return;
				}
			}
			this.executeOperation();
		}
		else{
			this.msgElement.update("All the required fields must be filled");
		}
	}.bind(this);


	AddFeedMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler, false, "add_feed");	
	}
	
	AddFeedMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
	}	
	
	AddFeedMenu.prototype.setFocus = function(){
		$('feed_name').focus();
	}
	
	AddFeedMenu.prototype.executeOperation = function(){
		
		function onError(transport, e){
			alert("error generando el template");
			this.hide();
		}
		function onSuccess(transport){
			var response = transport.responseText;
			var data = eval ('(' + response + ')');
			UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', data.URL);
		}
		var o = new Object;
		o.name = $('feed_name').value;
		o.URL = $('feed_URL').value;
		if ($('feed_image_URL').value!="")
			o.imageURI = $('feed_image_URL').value;
		if ($('feed_iphone_URL').value!="")
			o.iPhoneImageURI = $('feed_iphone_URL').value;
		if ($('feed_color').style.display!="none" && $('feed_color').value!="")
			o.feed_color = $('feed_color').value;
		var data = {"template_data": Object.toJSON(o)};
		var gadget_type="";
		if (this.type=="addFeed"){
			gadget_type="feed_reader"
		} else if (this.type=="addSite"){
			gadget_type="web_browser"
		}
		PersistenceEngineFactory.getInstance().send_post(URIs.GADGET_TEMPLATE_GENERATOR.evaluate({'gadget_type': gadget_type}), data, this, onSuccess, onError);
	}
	


	//hides the window and clears all the inputs
	AddFeedMenu.prototype.hide = function (){

		var inputArray = $$('#add_feed_menu input:not([type=button])');
		for (var i=0; i<inputArray.length; i++){
			inputArray[i].value = '';
		}
		var msg = $('add_feed_window_msg');
		msg.update();
		this.stopObserving();
		this.msgElement.update();
		this.htmlElement.style.display = "none";
		$('color_pref_opt').setStyle({display:"none"});
	}

}

AddFeedMenu.prototype = new WindowMenu;
