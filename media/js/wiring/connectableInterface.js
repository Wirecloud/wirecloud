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

/////////////////////////////////////////////////
//     WRAPPER INTERFACE FOR CONNECTABLES      //
/////////////////////////////////////////////////
function ConnectableWrapperInterface (wiringGUI_, headerText_) {
  	
	//atributes
  	this.wiringGUI = wiringGUI_;
  	this.folded = false;
  	this.connections = 0;
  	this.openedByUser = false;
  	
	this.tabDiv = document.createElement("div");
    this.tabDiv.addClassName("tab");
    this.igadgetsOpenedByUser = 0;
    
	// Content
	this.htmlElement = document.createElement("div");
    this.htmlElement.addClassName("tabContent");
	this.htmlElement.addClassName("bckgrnd_folder");   
	this.htmlElement.appendChild(document.createTextNode(headerText_));
    
    //folding event
    Event.observe(this.htmlElement, "click", 
		function(e){
    		if(this.connections<=0){
    			this.toggleOpenedByUser();
    			this.forceToggle();
    			if(this.wiringGUI.currentChannel)
	   				this.wiringGUI.highlightChannelOutputs(this.wiringGUI.currentChannel);
			}
		}.bind(this)
	);
    this.tabDiv.appendChild(this.htmlElement);
}
	
// PARENT CONTRUCTOR (Super class emulation)
ConnectableWrapperInterface.prototype.ConnectableWrapperInterface = function(wiringGUI_, headerText_) {
	//atributes
  	this.wiringGUI = wiringGUI_;
  	this.folded = false;
  	this.connections = 0;
  	this.openedByUser = false;
  	
  	this.tabDiv = document.createElement("div");
    this.tabDiv.addClassName("tab");
    this.igadgetsOpenedByUser = 0;
   
    // Content
    this.htmlElement = document.createElement("div");
    this.htmlElement.addClassName("tabContent");
	this.htmlElement.addClassName("bckgrnd_folder");  
	this.htmlElement.appendChild(document.createTextNode(headerText_)); 
    
    //folding event
    Event.observe(this.htmlElement, "click", 
		function(e){
    		if(this.connections<=0){
    			this.toggleOpenedByUser();
    			this.forceToggle();
    			if(this.wiringGUI.currentChannel)
	    			this.wiringGUI.highlightChannelOutputs(this.wiringGUI.currentChannel);
				}
			}.bind(this)
		);
    this.tabDiv.appendChild(this.htmlElement);
}
	
ConnectableWrapperInterface.prototype.increaseConnections = function(){
	this.connections++;
}
	
ConnectableWrapperInterface.prototype.decreaseConnections = function(){
	this.connections--;
}
	
ConnectableWrapperInterface.prototype.addConnectables = function(connectables){
	this.tabDiv.appendChild(connectables);
}

//ConnectableWrapperInterface.prototype.setHeaderText = function(text_){
	//this.htmlElement.appendChild(document.createTextNode(text_));
//}
	
ConnectableWrapperInterface.prototype.setConnectable = function(connectable_){
	//create a ckeck item and an anchor for relating a tab to a channel output
	var chkItem = document.createElement("div");
	chkItem.addClassName("unchkItem");
	this.htmlElement.appendChild(chkItem);
		
	var chkItemAnchor = new ConnectionAnchor(connectable_, chkItem, this);
	var context = {chkItemAnchor: chkItemAnchor, slotInterface:this};
	Event.observe(chkItem, "click",
		function (e) {
			if(!this.slotInterface.folded){
				Event.stop(e);
	        }else{
	           	this.slotInterface.toggle();
    			if(this.slotInterface.wiringGUI.currentChannel)
	    			this.slotInterface.wiringGUI.highlightChannelOutputs(this.slotInterface.wiringGUI.currentChannel);
	    	}
	   		this.slotInterface.wiringGUI._changeConnectionStatus(this.chkItemAnchor);
		}.bind(context), false);
    this.wiringGUI.outputs.push(chkItemAnchor);
}		
	
ConnectableWrapperInterface.prototype.toggleOpenedByUser = function(){
	if(this.folded ||(!this.folded && this.openedByUser)){
		this.openedByUser = !this.openedByUser;
	}
}
    
//toggle ordered automatically, for instance, changing channels
ConnectableWrapperInterface.prototype.toggle = function () {
	//if the user hasn't touch the tab, it can automatically toggle
	if(this.folded || (!this.folded && !this.openedByUser && this.igadgetsOpenedByUser <= 0)){
		this.forceToggle();
	}
}

ConnectableWrapperInterface.prototype.forceToggle = function () {
	//forced toggle
	this.folded = !this.folded;
	var igadgets = this.tabDiv.getElementsByClassName("igadget");
	var i=0;
	for(i=0;i<igadgets.length;i++){
		igadgets[i].toggleClassName("folded");
	}
}

ConnectableWrapperInterface.prototype.isAnyFolded = function () {
	return this.folded;		
}
	
ConnectableWrapperInterface.prototype.isAnyUnfolded = function () {
	return !this.folded;		
}	


/////////////////////////////////////////////////
// 	  SLOT AND EVENT INTERFACE FOR THE TAB     //
/////////////////////////////////////////////////


// Slot interface for the tab (with connectable)
/////////////////////////////////////////////////
function SlotTabInterface (tab, wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, tab.tabInfo.name);
	
	//this.setHeaderText ();
	this.setConnectable (tab.connectable);
}
SlotTabInterface.prototype = new ConnectableWrapperInterface;

SlotTabInterface.prototype.show = function () {
	this.wiringGUI.slot_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}
 	
	this.forceToggle();
}

// Event interface for the tab (without connectable)
////////////////////////////////////////////////////
function EventTabInterface (tab, wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, tab.tabInfo.name);
	
	//this.setHeaderText (tab.tabInfo.name);
}
EventTabInterface.prototype = new ConnectableWrapperInterface;

EventTabInterface.prototype.show = function (){
	if (this.tabDiv.childNodes.length > 1){ //Elements with gadgets
  		this.wiringGUI.event_list.appendChild(this.tabDiv);  		
    }else{
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
    }
    
  	this.forceToggle();
}

////////////////////////////////////////////////////////////
//   SLOT AND EVENT INTERFACE FOR THE CHANNEL (WRAPPER)   //
////////////////////////////////////////////////////////////

// Slot interface for the channel wrapper (without connectable)
function SlotChannelWInterface (wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, "Channels");
}
SlotChannelWInterface.prototype = new ConnectableWrapperInterface;

SlotChannelWInterface.prototype.show = function () {
	this.wiringGUI.slot_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}
 	
	this.forceToggle();
}

// Event interface for the channel wrapper (without connectable)
function EventChannelWInterface (wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, gettext("Channels"));
}
EventChannelWInterface.prototype = new ConnectableWrapperInterface;

EventChannelWInterface.prototype.show = function (){
	this.wiringGUI.event_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}

	this.forceToggle();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
//     CONNECTABLE INTERFACE (GENERIC SLOT AND EVENT)	  //
////////////////////////////////////////////////////////////
function ConnectableInterface (wiringGUI, parentInterface, headerText) {
  	
	//CREATOR
  	//atributes
  	this.wiringGUI = wiringGUI;
  	this.folded = false;
  	this.igadgetDiv = null;
	this.headerText = headerText;
  	this.connections = 0;
  	this.parentInterface = parentInterface;
  	this.openedByUser = false;		//is the igadget open and has the user done it??
  	
  	this.ulConnectables = document.createElement("div");
    this.ulConnectables.addClassName("igadgetContent");
  	
	
	// PARENT CONTRUCTOR (Super class emulation)
	ConnectableInterface.prototype.ConnectableInterface = function (wiringGUI, parentInterface, headerText) {
	  	//atributes
  		this.wiringGUI = wiringGUI;
  		this.folded = false;
  		this.igadgetDiv = null;
		this.headerText = headerText;
  		this.connections = 0;
  		this.parentInterface = parentInterface;
  		this.openedByUser = false;		//is the igadget open and has the user done it??
  	
  		this.ulConnectables = document.createElement("div");
    	this.ulConnectables.addClassName("igadgetContent");

	}
	
	ConnectableInterface.prototype.increaseConnections = function(){
		this.connections++;
		this.parentInterface.increaseConnections();
	}
	
	ConnectableInterface.prototype.decreaseConnections = function(){
		this.connections--;
		this.parentInterface.decreaseConnections();
	}

 	ConnectableInterface.prototype.toggleOpenedByUser = function(){
 		if(this.folded || (!this.folded && this.openedByUser)){
			this.openedByUser = !this.openedByUser;
			if(this.openedByUser)
				this.parentInterface.igadgetsOpenedByUser++;
			else
				this.parentInterface.igadgetsOpenedByUser--;
 		}
 	}
	
	ConnectableInterface.prototype.hasConnectables = function () {
		return this.igadgetDiv != null; 	
	}
	
	ConnectableInterface.prototype.getConnectables = function (){
		return this.igadgetDiv;
	}

	ConnectableInterface.prototype.setConnectables = function (connectables){
		// Slots
    	for (var i = 0; i < connectables.length; i++) {
	    	var connectable = connectables[i];
	    	if (((connectable instanceof wOut)   && (this instanceof SlotIgadgetInterface))  || 
			    ((connectable instanceof wIn)    && (this instanceof EventIgadgetInterface)) ||
				((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))  ||
				((connectable instanceof wInOut) && (this instanceof EventChannelInterface))){
				var htmlElement = document.createElement("div");
				htmlElement.appendChild(document.createTextNode(connectable.getName()));
			
				var chkItem = document.createElement("div");
				chkItem.addClassName("unchkItem");
				htmlElement.appendChild(chkItem);
			
				var chkItemAnchor = new ConnectionAnchor(connectable, chkItem, this);
				if ((connectable instanceof wInOut) && (this instanceof EventChannelInterface))
					chkItemAnchor.setAsChannelIn();
				if ((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))
					chkItemAnchor.setAsChannelOut();
				
				var context = {chkItemAnchor: chkItemAnchor, wiringGUI:this.wiringGUI};			
				Event.observe(chkItem, "click",
			    	function () {
			        	this.wiringGUI._changeConnectionStatus(this.chkItemAnchor);
			        }.bind(context));
			
				// Harvest info about the friendCode of the connectable
				var friendCode = connectable.getFriendCode();
				if (friendCode != null) {
			    	if (!this.wiringGUI.friend_codes[friendCode]) {
			      		// Create the friend code entry in the list of friend codes
			      		this.wiringGUI.friend_codes[friendCode] = {};
			      		this.wiringGUI.friend_codes[friendCode].list = [];
			      		this.wiringGUI.friend_codes[friendCode].color = this.wiringGUI.color_scheme[this.wiringGUI.friend_codes_counter++];
				    }
			    	this.wiringGUI.friend_codes[friendCode].list.push(htmlElement);
				    var context = {friendCode: friendCode, wiringGUI:this.wiringGUI};
			
				    htmlElement.addEventListener("mouseover",
			    		function () {
							this.wiringGUI._highlight_friend_code(this.friendCode, true);
						}.bind(context), false);
			    	
					htmlElement.addEventListener("mouseout",
			        	function () {
							this.wiringGUI._highlight_friend_code(this.friendCode, false);
						}.bind(context), false);	      
				}
				
				// Cancel bubbling of forceToggle
				function cancelbubbling(e) {
					Event.stop(e);
				}
			
				htmlElement.addEventListener("click", cancelbubbling, false);
			      
				// Insert it on the correct list of connectables	
				this.ulConnectables.appendChild(htmlElement);
				if (((connectable instanceof wOut)   && (this instanceof SlotIgadgetInterface)) || 
				    ((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))){
					
					this.wiringGUI.outputs.push(chkItemAnchor);	
				}
				if (((connectable instanceof wIn)    && (this instanceof EventIgadgetInterface)) || 
				    ((connectable instanceof wInOut) && (this instanceof EventChannelInterface))){
				
					this.wiringGUI.inputs.push(chkItemAnchor);
				}
	    	}	
    	}
		
		// Slot column
		if (this.ulConnectables.childNodes.length > 0) {
			this.igadgetDiv = document.createElement("div");
			this.igadgetDiv.addClassName("igadget");
			var headerHtml = document.createElement("div");
			headerHtml.addClassName("igadgetName");
			if (this.headerText != null)
				headerHtml.appendChild(document.createTextNode(this.headerText));
			  
			//folding event
			Event.observe(headerHtml, "click", 
				function(e){
					Event.stop(e);
					if (this.connections <= 0){
						this.toggleOpenedByUser();
						this.forceToggle();
						if (this.wiringGUI.currentChannel)
							this.repaintSiblings(this.wiringGUI.currentChannel) //repaint the needed arrows in case the layout has changed
					}
				}.bind(this));			  
				  
			
			this.igadgetDiv.appendChild(headerHtml);
			this.igadgetDiv.appendChild(this.ulConnectables);
		}
	}
	
	//toggle ordered automatically, for instance, changing channels
  	ConnectableInterface.prototype.toggle = function () {
  		//if the user hasn't touch the igadget, it can automatically toggle
  		if(!this.openedByUser){
  			this.forceToggle();
  		}
  		if(this.folded != this.parentInterface.folded){
	  			this.parentInterface.toggle();
  		}
  	} 
 	//forced toggle 
	ConnectableInterface.prototype.forceToggle = function () {
		this.folded = !this.folded;
		this.igadgetDiv.getElementsByClassName("igadgetContent")[0].toggleClassName("folded");
		this.igadgetDiv.getElementsByClassName("igadgetName")[0].toggleClassName("bckgrnd_folded");
	}
	
	ConnectableInterface.prototype.isAnyFolded = function () {
		return this.folded || this.parentInterface.folded;
	}
	
	ConnectableInterface.prototype.isAnyUnfolded = function () {
		return !this.folded || !this.parentInterface.folded;
	}
	
	//methods invoked when the user wants to expand/collapse all the slot tabs
	ConnectableInterface.prototype.massiveExpand = function () {
		if(this.folded){//the igadget is folded
			this.toggleOpenedByUser();
			this.forceToggle();
			if(this.folded != this.parentInterface.folded){//if the parent is folded
	  			this.parentInterface.toggle();
			}
		// if the gadget is open by the user but the parent is folded
		}else if(this.openedByUser && this.parentInterface.folded){
			this.parentInterface.toggle();
		}
		else if(!this.openedByUser){//the igadget is open because it is conected to an opened channel
			this.openedByUser = true;
			this.parentInterface.igadgetsOpenedByUser++;
			
		}
	}

	ConnectableInterface.prototype.massiveCollapse = function () {
		if(!this.folded && this.openedByUser){//the igadget is folded
			this.toggleOpenedByUser();
			if(this.connections<=0){//collapse only if the gadget don't have any connections
				this.forceToggle();
			}
		}
		if(this.folded != this.parentInterface.folded){//if the parent isn't folded
			if(this.parentInterface.connections<=0){
				this.parentInterface.toggleOpenedByUser();
				this.parentInterface.toggle();
			}
		}
	}	
}

////////////////////////////////////////////////////////////
//       SLOT AND EVENT INTERFACE FOR THE IGADGET         //
////////////////////////////////////////////////////////////

// Interface for the igadget slots (with connectable)
/////////////////////////////////////////////////////
function SlotIgadgetInterface (igadget, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, igadget.name);
	
	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	this.setConnectables (connectables);
	
	SlotIgadgetInterface.prototype.repaintSiblings = function(channel){
		this.wiringGUI.highlightChannelOutputs(channel);
	}
}

SlotIgadgetInterface.prototype = new ConnectableInterface;	
	
// Interface for the igadget events (with connectable)
//////////////////////////////////////////////////////	
function EventIgadgetInterface (igadget, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, igadget.name);
	
	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	this.setConnectables (connectables);
	
	EventIgadgetInterface.prototype.repaintSiblings = function(channel){
		this.wiringGUI.highlightChannelInputs(channel);
	}
}
EventIgadgetInterface.prototype = new ConnectableInterface;	

////////////////////////////////////////////////////////////
//       SLOT AND EVENT INTERFACE FOR THE CHANNEL         //
////////////////////////////////////////////////////////////

// Interface for the channel slots (with connectable)
/////////////////////////////////////////////////////
function SlotChannelInterface (channel, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, null);
	
	this.setConnectables ([channel.channel]);
}
SlotChannelInterface.prototype = new ConnectableInterface;

// Interface for the channel events (with connectable)
//////////////////////////////////////////////////////	
function EventChannelInterface (channel, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, null);
	
	this.setConnectables ([channel.channel]);
}
EventChannelInterface.prototype = new ConnectableInterface;
	
	