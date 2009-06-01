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


function WiringInterface(wiring, workspace, wiringContainer, wiringLink) {

  // ***********************************
  //  PRIVATE METHODS AND ATTRIBUTES
  // ***********************************

  this.workspace = workspace;
  this.wiring = wiring;
  this.wiringContainer = wiringContainer;
  this.wiringLink = wiringLink;

  this.opmanager = OpManagerFactory.getInstance();
  this.currentChannel = null;
  this.inputs = new Array(); // Input connections (events & inouts)
  this.outputs = new Array(); // Output connections (slots & inouts)
  this.channels = new Array();
  this.filterMenus = new Hash();
  this.friend_codes = {};
  this.highlight_color = "#FFFFE0"; // TODO remove
  this.friend_codes_counter = 0;
  this.channelBaseName = gettext("Channel");
  this.visible = false; // TODO temporal workarround
  this.unfold_on_entering = false; //Does the user want all tabs to be expanded?
  
  Event.observe($('wiring_link'), "click", function(){OpManagerFactory.getInstance().activeWorkSpace.showWiring()}, false, "show_wiring");

  this.eventColumn = $('eventColumn');
  this.slotColumn = $('slotColumn');
  this.event_list = $('events_list');//wiringContainer.getElementById('events_list');
  this.slot_list = $('slots_list');//wiringContainer.getElementById('slots_list');
  this.channels_list = $('channels_list');//wiringContainer.getElementById('channels_list');
  this.channel_name = $('channel_name');//wiringContainer.getElementById('channel_name');
  this.msgsDiv = $('wiring_messages');
  this.newChannel = $('newChannel');
  this.wiringTable = $('wiring_table');
  
  //folding/unfolding all tabs events
  //events
    
	titleElement=this.eventColumn.getElementsByClassName("title")[0];
	
	Event.observe(titleElement, "click",
	                        function (e) {
	                        	var expand = null;
	                        	var folded = e.target.hasClassName('folded');
	                        	var nIgadgets = $$('#events_list .igadget').length
	                        	var nIgadgetsFolded = $$('#events_list .igadget.folded').length
	                        	if(folded && nIgadgetsFolded == 0)
	                        		expand = false;	                      
	                        	else if(!folded && nIgadgetsFolded == nIgadgets)
	                        		expand = true;
	                        	else{
	                        		expand = folded;
	                        		e.target.toggleClassName('folded');
	                        	}
								this.toggleEventColumn(expand);	
	                        	
								
	                        }.bind(this));
	
	//slots
	titleElement=this.slotColumn.getElementsByClassName("title")[0];
	Event.observe(titleElement, "click",
	                    function (e) {
	                    	var expand = null;
	                    	var folded = e.target.hasClassName('folded');
	                    	var nIgadgets = $$('#slots_list .igadget').length
	                    	var nIgadgetsFolded = $$('#slots_list .igadget.folded').length
	                    	if(folded && nIgadgetsFolded == 0)
	                    		expand = false;	                      
	                    	else if(!folded && nIgadgetsFolded == nIgadgets)
	                    		expand = true;
	                    	else{
	                    		expand = folded;
	                    		e.target.toggleClassName('folded');
	                    	}
							this.toggleSlotColumn(expand);	
	                    }.bind(this));    
	  
	Event.observe($('unfold_all_link'), "click",
	  					function (){
	  						this.toggleEventColumn(true);
						  	this.toggleSlotColumn(true);
						}.bind(this));
					
	Event.observe($('unfold_chkItem'), "click",
	  					function(e){	  				
	  						//the user wants all unfolded
	  						e.target.toggleClassName('chkItem');
	  						this.unfold_on_entering = e.target.hasClassName('chkItem');
	  					}.bind(this));  
  
//  this.chEventsWr = null;
//  this.chSlotsWr = null;  

  this._eventCreateChannel = function (e) {
    Event.stop(e);
    this._createChannel();
    this.toggleEventColumn(true);    
    this.toggleSlotColumn(true);
  }.bind(this)
  
  WiringInterface.prototype.show = function () {
    if (this.visible)
      return; // Nothing to do

    this.visible = true;

    this.renewInterface();

    LayoutManagerFactory.getInstance().showWiring(this);

    Event.observe(this.newChannel, 'click', this._eventCreateChannel);
  }

  WiringInterface.prototype.hide = function () {
    if (!this.visible)
      return; // Nothing to do

    this.visible = false;
    if(this.currentChannel){
		this.uncheckChannel(this.currentChannel);
		this.currentChannel = null;
    }
    
    this.saveWiring();
    this.channels.clear();

    Event.stopObserving(this.newChannel, 'click', this._eventCreateChannel);
    LayoutManagerFactory.getInstance().hideView(this.wiringContainer);
  }
  
  WiringInterface.prototype.unload = function () {
	    // Saving wiring structure and hiding!
	    //this.wiringContainer.update();
  }

  WiringInterface.prototype.saveWiring = function () {

    for (var i = 0; i < this.channels.length; i++) {
      this.channels[i].commitChanges(this.wiring);
    }
    
    // The wiring engine is notified in order to persist state!
    this.wiring.serialize();
  }

  WiringInterface.prototype._showFilterParams = function (channel, filter, paramLabelElement, paramValueElement, valueElement){
	// No filter, no params
	if (filter == null){
		return;
	}
	
	// Adds a new row for each param of the current filter
	var params = filter.getParams();
	for (var p = 0; p < params.length; p++) {
		paramLabelElement.appendChild(params[p].createHtmlLabel());
		paramValueElement.appendChild(params[p].createHtmlValue(this, channel, valueElement));
	}
  }
  
  WiringInterface.prototype._setChannelFilter = function (channel, filter){
	var filterValue;

	var selected_channel_cells = $$('.channel.selected td');
	var filter_content = selected_channel_cells[1].firstChild.childNodes[0];
	var param_label_content = selected_channel_cells[0].firstChild.childNodes[1];
	var param_content = selected_channel_cells[1].firstChild.childNodes[1];
	var value_content = selected_channel_cells[1].firstChild.childNodes[2];

	channel.setFilter(filter);

	// Removes the params of the other filter
	while (param_label_content.childNodes.length > 0){
		param_label_content.childNodes[param_label_content.childNodes.length - 1].remove();	
	}
	while (param_content.childNodes.length > 0){
		param_content.childNodes[param_content.childNodes.length - 1].remove();	
	}
	
	// Sets the filter name
	if (filter_content.childNodes[0].nodeType ==  Node.TEXT_NODE){
		filterValue = filter_content.childNodes[0];
	}else{
		filterValue = filter_content.childNodes[1];
	}
	if (filter == null){
		filterValue.nodeValue = gettext("None");
	}else{
		filterValue.nodeValue = filter.getLabel();
	}
		
	// Sets the channel value and the channel filter params	
	if ((filter == null) || !filter.hasParams()){
		value_content.update(channel.getValue());
	}else{
		// The channel value will be calculated with the params given by user.
		value_content.update(channel.getValueWithoutFilter());
		this._showFilterParams(channel, filter, param_label_content, param_content, value_content);
	}
	

	// The filter content size has changed, and the selected channel and its arrows must be repainted 
	this.uncheckChannel(this.currentChannel);
	this.highlightChannel(this.currentChannel);
  }

  // Creates the menu with all the available filters
  WiringInterface.prototype._createFilterMenu = function (channel) {
  	var context = {wiringGUI:this, channel:channel};

	var idFilterMenu = 'filter_menu_' + channel.getId();
	var filterMenuHTML = '<div id="'+idFilterMenu+'" class="drop_down_menu"><div id="submenu_'+idFilterMenu+'" class="submenu"></div></div>';
	new Insertion.After($('menu_layer'), filterMenuHTML);
	var filterMenu = new FilterDropDownMenu(idFilterMenu);

//	filterMenu.addOptionWithHelp(
//			"/ezweb/images/pencil.png", 
// 		    "Creates a new filter.",
//			gettext('New Filter'), 
//			function(){
//				LayoutManagerFactory.getInstance().hideCover();
//			},
//			0);

	filterMenu.addOptionWithHelp(
			_currentTheme.getIconURL('filter'),
			gettext('None'),
			gettext('Returns the value of the channel unfiltered.'),
			function(){
				LayoutManagerFactory.getInstance().hideCover();
				this.wiringGUI._setChannelFilter(this.channel, null); 
			}.bind(context),
			0);
	var filters = this.wiring.getFiltersSort();
	for (var i = 0; i < filters.length; i++) {
		context = {wiringGUI:this, channel:channel, filter:filters[i]};
		filterMenu.addOptionWithHelp(
			_currentTheme.getIconURL('filter'),
			filters[i].getLabel(),
			filters[i].getHelpText(), 
			function(){
				LayoutManagerFactory.getInstance().hideCover();
				this.wiringGUI._setChannelFilter(this.channel, this.filter);
			}.bind(context),
			i+1
		);	
	}
	return filterMenu;
  }
    
  WiringInterface.prototype._addChannelInterface = function (channel) {
    var context = {channel: channel, wiringGUI:this};
    var channelElement = document.createElement("div");
	this.channels_list.appendChild(channelElement);
    channelElement.addClassName("channel");
    Event.observe(channelElement, "click",
                      function (e) {
                        Event.stop(e);
						// Creates the menu just when the filter is selected
						if (this.wiringGUI.filterMenus[this.channel.getId()] == null){
							var newFilterMenu = this.wiringGUI._createFilterMenu(this.channel); 
							this.wiringGUI.filterMenus[this.channel.getId()] = newFilterMenu;
							this.channel.setMenu(newFilterMenu);	
						}
						this.wiringGUI._changeChannel(this.channel);
                      }.bind(context));
    
	var inputDel = document.createElement("img");
    channelElement.appendChild(inputDel);
	inputDel.setAttribute("alt", gettext("Remove"));
    inputDel.setAttribute("src", _currentTheme.getIconURL('remove'));
    Event.observe(inputDel, "click",
                            function (e) {
                              Event.stop(e);
                              this.wiringGUI._removeChannel(this.channel);
                            }.bind(context));
    
    var channelNameInput = document.createElement("input");
	channelElement.appendChild(channelNameInput);
    channelNameInput.setAttribute ("value", channel.getName());
    channelNameInput.addClassName ("channelNameInput");
    Event.observe(channelNameInput, 'click', 
		function(e){
			if(this.wiringGUI.currentChannel==this.channel)
				Event.stop(e);
		}.bind(context)); //do not propagate to div.
    var checkName = function(e){
    	if(e.target.value == "" || e.target.value.match(/^\s$/)){
	    	var msg = gettext("Error updating a channel. Invalid name");
			LogManagerFactory.getInstance().log(msg);
    		e.target.value=this.channel.getName();
    	}else if(this.wiringGUI.channelExists(e.target.value)){
    		var msg = interpolate(gettext("Error updating a channel. %(channelName)s: Channel already exists"),{channelName: e.target.value}, true);
			LogManagerFactory.getInstance().log(msg);
			e.target.value=this.channel.getName();
    	}else{
    		this.channel.setName(e.target.value)
    	}
    }
    Event.observe(channelNameInput, 'change', checkName.bind(context));
     
    var channelContent = document.createElement("div");
    channelElement.appendChild(channelContent);
	channelContent.addClassName("channelContent");
    
    // Channel information showed when the channel is selected
	var contentTable = document.createElement("table");
	contentTable.addClassName("contentTable");
	channelContent.appendChild(contentTable);
	
	// Creates the row for the channel information
	var contentRow = document.createElement("tr");
	contentTable.appendChild(contentRow);
	
	// Creates a layer for the labels
	var labelCol = document.createElement("td");
	labelCol.addClassName("column");
	contentRow.appendChild(labelCol);
	var labelLayer = document.createElement("div");
	labelLayer.addClassName("labelContent");
	labelCol.appendChild(labelLayer);
	
	// Creates a layer for the information
	var contentCol = document.createElement("td");
	contentCol.addClassName("column");
	contentRow.appendChild(contentCol);
	var contentLayer = document.createElement("div");
	contentCol.appendChild(contentLayer);
	
	// Adds all labels
	var filterLabel = document.createElement("div");   
	labelLayer.appendChild(filterLabel);
	filterLabel.appendChild(document.createTextNode(gettext("Filter") + ":"));
	var paramLabelLayer = document.createElement("div");
	labelLayer.appendChild(paramLabelLayer);
	if (channel.getFilter()){
		var params = channel.getFilter().getParams();
		for (var p = 0; p < params.length; p++) {
			paramLabelLayer.appendChild(params[p].createHtmlLabel());
		}
	}
	var valueLabel = document.createElement("div");   
	labelLayer.appendChild(valueLabel);
	valueLabel.appendChild(document.createTextNode(gettext("Value") + ":"));
	
	// Adds the information
	var filterText = document.createElement("div");
	filterText.addClassName("filterValue");
	contentLayer.appendChild(filterText);
	if (channel.getFilter())
		filterText.appendChild(document.createTextNode(channel.getFilter().getLabel()));
	else
		filterText.appendChild(document.createTextNode(gettext("None")));
	var filterMenuButton = document.createElement("input");
	filterText.appendChild(filterMenuButton);
	filterMenuButton.setAttribute("type", "button");
	filterMenuButton.addClassName("filterMenuLauncher");
	Event.observe(filterMenuButton, 'click', 
		function(e){
			e.target.blur();
			Event.stop(e);
			LayoutManagerFactory.getInstance().showDropDownMenu(
				'filterMenu', this.channel.getMenu(), Event.pointerX(e), Event.pointerY(e));
		}.bind(context)
	);
	var paramValueLayer = document.createElement("div");
	contentLayer.appendChild(paramValueLayer);
		
	// Adds the channel value
	var valueText = document.createElement("div");   
	contentLayer.appendChild(valueText);
	if (channel.getFilter()){
		var params = channel.getFilter().getParams();
		for (var p = 0; p < params.length; p++) {
			paramValueLayer.appendChild(params[p].createHtmlValue(this, channel, valueText));
		}
	}
	valueText.appendChild(document.createTextNode(channel.getValue()));	
	
	channel.assignInterface(channelElement);
	this.channels.push(channel);
    channelNameInput.focus();
  }
  
  WiringInterface.prototype._addTab = function (tab) {
  	// TODO mirar esto
  	var tabEvents = new EventTabInterface(tab, this);
  	var tabSlots = new SlotTabInterface(tab, this);

    // Igadgets
    var igadgets = tab.dragboard.getIGadgets();
    for (var i = 0; i < igadgets.length; i++){
    	this._addIGadget(igadgets[i], tabEvents, tabSlots);
    }
    
    tabEvents.show();
  	tabSlots.show();

  }
  
  WiringInterface.prototype._addIGadget = function (igadget, tabEvents, tabSlots) {
    // TODO mirar esto
  	var igadgetEvents = new EventIgadgetInterface(igadget, this, tabEvents);
  	var igadgetSlots = new SlotIgadgetInterface(igadget, this, tabSlots);
  	
	//if the igadget has events, add it
	if (igadgetEvents.hasConnectables()){
	    tabEvents.addConnectables(igadgetEvents.getConnectables());
	    //fold the igadget if the user hasn't specify not doing it.
	    if(!this.unfold_on_entering)
		    igadgetEvents.forceToggle();
		else{
			igadgetEvents.openedByUser = true;
			igadgetEvents.parentInterface.igadgetsOpenedByUser++;		}
	}
	//if the igadget has slots, add it
	if (igadgetSlots.hasConnectables()){
	    tabSlots.addConnectables(igadgetSlots.getConnectables());
	    //fold the igadget if the user hasn't specify not doing it.
	    if(!this.unfold_on_entering)
		    igadgetSlots.forceToggle();
		else{
			igadgetSlots.openedByUser = true;
			igadgetSlots.parentInterface.igadgetsOpenedByUser++;
		}
	} 
    
  }

  WiringInterface.prototype.clearMessages = function () {
    this.msgsDiv.setStyle({display: null});
  }
   //expands or collapses all tabs & gadgets according to the expand parameter
   // Events 
  WiringInterface.prototype.toggleEventColumn = function (expand) {
  	var input = null;
  	var i=0;
  	for (i=0;i<this.inputs.length;i++){
  		input = this.inputs[i];
  		if(!(input.connectable instanceof wInOut) && !(input.connectable instanceof wTab)){ //we leave channels apart
  			if(expand){
  				input.parentInterface.massiveExpand();
  			}else{
  				input.parentInterface.massiveCollapse();
  			}
  		}
  	}
  	if(this.currentChannel){
  		this.highlightChannelInputs(this.currentChannel)
  	}
  }

  //Slots
  WiringInterface.prototype.toggleSlotColumn = function (expand) {
  	var output = null;
  	var i=0;
  	for (i=0;i<this.outputs.length;i++){
  		output = this.outputs[i];
  		if(!(output.connectable instanceof wInOut) && !(output.connectable instanceof wTab)){ //we leave channels apart
  			if(expand){
	  			output.parentInterface.massiveExpand();
  			}else{
  				output.parentInterface.massiveCollapse();  				
  			}
  		}
  	}
  	if(this.currentChannel){
  		this.highlightChannelOutputs(this.currentChannel)
  	}
  }

  WiringInterface.prototype.renewInterface = function () {
    // Clean the interface
    this.event_list.innerHTML = "";
    this.slot_list.innerHTML = "";
    this.channels_list.innerHTML = "";
    this.clearMessages();

    // Clean data structures
    this.friend_codes_counter = 0;
    this.friend_codes = {};
    this.inputs.clear();
    this.outputs.clear();
    this.currentChannel = null;
	var filterKeys = this.filterMenus.keys();
    for (var f = 0; f < filterKeys.length; f++) {
		this.filterMenus[filterKeys[f]].remove();
    }
	this.filterMenus = new Hash();
    
    // Build the interface
    var tabs = this.workspace.tabInstances.keys();
    for (var i = 0; i < tabs.length; i++) {
    	this._addTab(this.workspace.tabInstances[tabs[i]]);
    }
	
//	this.chEventsWr = new EventChannelWInterface (this);
//	this.chSlotsWr = new SlotChannelWInterface (this);    
	var channels = this.wiring.getChannels();
    for (var j = 0; j < channels.length; j++) {
		var chInterface = new ChannelInterface(channels[j]);
		this._addChannelInterface(chInterface);
		
//		var chEvents = new EventChannelInterface(chInterface, this, this.chEventsWr);
//  		var chSlots = new SlotChannelInterface(chInterface, this, this.chSlotsWr);
//  	
//	    this.chEventsWr.addConnectables(chEvents.getConnectables());
//		this.chSlotsWr.addConnectables(chSlots.getConnectables());
		//this.chEventsWr.forceToggle();  REMOVE
		//this.chSlotsWr.forceToggle();   REMOVE
	}		
    
//	if (channels.length > 0){
//		this.chEventsWr.show();
//		this.chSlotsWr.show();
//	}
    
  }

  WiringInterface.prototype.showMessage = function (msg) { 
  	this.msgsDiv.innerHTML = msg;
  	this.msgsDiv.setStyle({display: "block"});
  }
  
  
  WiringInterface.prototype._changeConnectionStatus = function (anchor) {
 	if (this.currentChannel == null) {
		if (this.channels.length == 0) {
        	this.showMessage(gettext("Please, create a new channel before creating connections."));
      	} else {
        	this.showMessage(gettext("Please, select a channel before creating connections."));
      	}
	  	return;
    }

    var connectable = anchor.getConnectable();

    // add/remove the connection
    
	// WARNING: a wInOut connectable is a wIn too!
	if (connectable instanceof wInOut){
		if (anchor.isChannelIn()){
			if (anchor.isConnected()) {
        		this.currentChannel.disconnectInput(connectable);
        		anchor.setConnectionStatus(false, null, null);
      		} else {
        		this.currentChannel.connectInput(connectable);
        		anchor.setConnectionStatus(true, this.currentChannel.inPosition, null);
      		}
		} else {
			if (anchor.isConnected()) {
       			this.currentChannel.disconnectOutput(connectable);
        		anchor.setConnectionStatus(false, null, null);
      		} else {
        		this.currentChannel.connectOutput(connectable);
        		anchor.setConnectionStatus(true, null, this.currentChannel.outPosition);
      		}
		}
	} else if (connectable instanceof wIn) {
		if (anchor.isConnected()) {
        	this.currentChannel.disconnectInput(connectable);
        	anchor.setConnectionStatus(false, null, null);
      	} else {
        	this.currentChannel.connectInput(connectable);
        	anchor.setConnectionStatus(true, this.currentChannel.inPosition, null);
      	}
    } else if (connectable instanceof wOut) {
      	if (anchor.isConnected()) {
        	this.currentChannel.disconnectOutput(connectable);
        	anchor.setConnectionStatus(false, null, null);
      	} else {
        	this.currentChannel.connectOutput(connectable);
        	anchor.setConnectionStatus(true, null, this.currentChannel.outPosition);
      	}
    }
  }

	WiringInterface.prototype.channelExists = function(channelName){
		if(this.channels.getElementByName(channelName))
			return true;
		return false;
	}

  WiringInterface.prototype._createChannel = function () {
    var result = null;
    var channelName = this.channel_name.value;

    if (channelName == "") {
      // Build an initial channel name
      var auxName=this.channels.length+1;
      channelName = this.channelBaseName + "_" + (auxName);
    }

    // Check if there is another channel with the same name
    while (this.channelExists(channelName)) {
      // Build another channel name
      channelName = this.channelBaseName + "_" + auxName;
      auxName++;
    }

    // Creates the channel interface
	var channel = new ChannelInterface(channelName);
    this._addChannelInterface(channel);
	
	// Creates a temporary channel for the Wiring module. It is necessary to connect channels with theyselves.
	var channelTempObject = wiring.createChannel(channel.getName(), channel.getId());
	channel.setTempChannel(channelTempObject);
	
	// Creates the filter menu
	var newFilterMenu = this._createFilterMenu(channel); 
	this.filterMenus[channel.getId()] = newFilterMenu;
	channel.setMenu(newFilterMenu);
	
//	this.chEventsWr.forceToggle();
//	this.chSlotsWr.forceToggle();
//	    
//	// Creates the interface of the channel slots and events 
//	var chEvents = new EventChannelInterface(channelTempObject, this, this.chEventsWr);
//  	var chSlots = new SlotChannelInterface(channelTempObject, this, this.chSlotsWr);
//  	
//	this.chEventsWr.addConnectables(chEvents.getConnectables());
//	this.chSlotsWr.addConnectables(chSlots.getConnectables());
//	
//	if (this.wiring.getChannels().length == 1){
//		this.chEventsWr.show();
//		this.chSlotsWr.show()
//	} else{
//		this.chEventsWr.forceToggle();
//		this.chSlotsWr.forceToggle();
//	}
	
	this.clearMessages();
    this._changeChannel(channel);
  }

  WiringInterface.prototype._removeChannel = function (channel) {

    if (!this.channels.elementExists(channel))
      return; // Nothing to do

	// Check whether this channel exists in the current wiring model
    // or when it was created with the wiring interface and removed
    // before commiting changes
	if (channel.exists() && !channel.isUnsaved()){
		this.wiring.removeChannel (channel.getId());
	
	// The channel might have been created and deleted without saving  
	// the wiring information (i.e. the user does not change between interfaces).
	// In this case, the wiring core has information about the channel that 
	// must be removed
	}else if (channel.isUnsaved()){
		this.wiring.removeChannel (channel.getId(), true);
	}

    if (this.currentChannel == channel){
      this._changeChannel(channel);
	  this.channels_list.removeChild(channel.getInterface());
    }else{
      this.channels_list.removeChild(channel.getInterface());
      if(this.currentChannel){
		  //repaint status because the channel position may have changed
		  this.uncheckChannel(this.currentChannel);
    	  this.highlightChannel(this.currentChannel);
      }
	}
	
	// Removes the filter menu
	var oldFilterMenu = this.filterMenus.remove(channel.getPreviousId());
	if (oldFilterMenu != null){
		oldFilterMenu.remove();
	}
	oldFilterMenu = this.filterMenus.remove(channel.getId());
	if (oldFilterMenu != null){
		oldFilterMenu.remove();
	}
	this.channels.remove(channel);
  }

  WiringInterface.prototype._changeChannel = function(newChannel) {
    var oldChannel = this.currentChannel;
    this.currentChannel = newChannel;

    if (oldChannel) {
      this.uncheckChannel(oldChannel);
    }
    this.clearMessages();
    if (oldChannel != newChannel) {
      this.highlightChannel(newChannel);
    } else {
      this.currentChannel = null;
    }
  }

  WiringInterface.prototype._highlight = function (chk, friendCode) {
    if (!this.friend_codes[friend_code]) {
    }

    var fcList = this.friend_codes[friendCode].list;
    var fcColor = this.friend_codes[friend_code].color;

    if (chk.checked) {
      for (var i = 0; i < fcList.length; i++) {
        var currentElement = fcList[i];
        currentElement.style.backgroundColor = fcColor;
      }
    } else {
      var allUnchecked = true;
      for (var i = 0; i < fcList.length; i++) {
        var currentElement = fcList[i];
        allUnchecked &= !currentElement.checked;
      }

      if (allUnchecked) {
         for (var i = 0; i < fcList.length; i++) {
           var currentElement = fcList[i];
           currentElement.style.backgroundColor = null;
         }
      }
    }
  }

  WiringInterface.prototype._highlight_friend_code = function (friend_code, highlight) {

    if (!this.friend_codes[friend_code]) {
      // Error
      return;
    }

    var fcList = this.friend_codes[friend_code].list;
    var fcColor = this.friend_codes[friend_code].color;
    var fcBgColor = "#F7F7F7";
    var fcElement = null;
    
    try {
        this.friend_codes[friend_code].fadder.reset();
    } catch(e){}
    
    if (highlight) {
        for (var i = 0; i < fcList.length; i++) {
            if (fcElement = fcList[i]) {
                  fcElement.style.backgroundColor = fcColor;
            }
        }
    }
    else {
        if (!this.friend_codes[friend_code].fadder) 
       	    this.friend_codes[friend_code].fadder = new BackgroundFadder(fcList, fcColor, fcBgColor, (fcList.length > 1)?1700:0, 300);
        this.friend_codes[friend_code].fadder.fade();
     }
  }

  /*Uncheck channel*/
  
  WiringInterface.prototype.uncheckChannelInputs = function (channel){
  	var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(false, null, null);
    }
  }
  
  WiringInterface.prototype.uncheckChannelOutputs = function (channel){
  	var connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(false, null, null);
    }
  }

  WiringInterface.prototype.uncheckChannel = function (channel) {
    channel.uncheck();
    
   //fold all the tabs related to the channel
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	
  		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyUnfolded()){
			connectables[i].view.parentInterface.toggle(); 	//if the interface is unfolded fold it
    	}
    }  	 
    
    connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
   		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyUnfolded()){	//if the interface is unfolded unfold it
				connectables[i].view.parentInterface.toggle();
    	}
    }  	 
   
	this.uncheckChannelInputs(channel);
	this.uncheckChannelOutputs(channel);
 
  }

  /*Highlight channel*/  

  WiringInterface.prototype.highlightChannelInputs = function (channel){
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(true, channel.inPosition, null);
   	}	
  }

  WiringInterface.prototype.highlightChannelOutputs = function (channel){
	var connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(true, null, channel.outPosition);
    }	
  	
  }

  WiringInterface.prototype.highlightChannel = function (channel) {
    //unfold all the tabs related to the channel so that the arrows are displayed in the correct position
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyFolded()){	//if the interface is folded unfold it
				connectables[i].view.parentInterface.toggle();
    	}
    }  	 
    connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
   		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyFolded()){	//if the interface is folded unfold it
				connectables[i].view.parentInterface.toggle();
		}
    }  	 

    channel.check(); //highlight the channel
    
    //mark the connections with the channel
	this.highlightChannelInputs(channel);
	this.highlightChannelOutputs(channel);
  }

    // ***********************************
    //  COLOR SCHEME FOR HIGHLIGHTS
    //  More colors in color_scheme.js file but now it's not used!
    //  Too many colors at that file, it's has been optimized!
    // ***********************************

    this.color_scheme = [];

    this.color_scheme.push("#ffb0a1");

    this.color_scheme.push("#a6ffbf");
    this.color_scheme.push("#7a5e85");
    this.color_scheme.push("#b3f0ff");
    this.color_scheme.push("#cf36ff");
    this.color_scheme.push("#5496ff");
    this.color_scheme.push("#e854ff");

    this.color_scheme.push("#662500");
    this.color_scheme.push("#5a9e68");
    this.color_scheme.push("#bf6900");
    this.color_scheme.push("#a17800");
    this.color_scheme.push("#72cc85");
    this.color_scheme.push("#e6ff42");

    this.color_scheme.push("#becfbc");
    this.color_scheme.push("#005710");
    this.color_scheme.push("#00193f");
    this.color_scheme.push("#e0fffa");
    this.color_scheme.push("#f0ff3d");
    this.color_scheme.push("#f0d8d3");

    this.color_scheme.push("#ab5c00");
    this.color_scheme.push("#3c008f");
    this.color_scheme.push("#d6ff8a");
    this.color_scheme.push("#fac0e1");
    this.color_scheme.push("#4700ad");
    this.color_scheme.push("#ccc6ad");

    this.color_scheme.push("#261e06");
    this.color_scheme.push("#4fedff");
    this.color_scheme.push("#e6bebc");
    this.color_scheme.push("#f0ed73");
    this.color_scheme.push("#4f1800");
    this.color_scheme.push("#020073");

    this.color_scheme.push("#0fff00");
    this.color_scheme.push("#686b00");
    this.color_scheme.push("#804dff");
    this.color_scheme.push("#b100bd");
    this.color_scheme.push("#69ffab");
    this.color_scheme.push("#e6acb8");

    this.color_scheme.push("#8c7a77");
    this.color_scheme.push("#006bfa");
    this.color_scheme.push("#8cffab");
    this.color_scheme.push("#d1d190");
    this.color_scheme.push("#0d4000");
    this.color_scheme.push("#f0e8c4");

    this.color_scheme.push("#0048e8");
    this.color_scheme.push("#b8ffe0");
    this.color_scheme.push("#5effe0");
    this.color_scheme.push("#770000");
    this.color_scheme.push("#913dff");
    this.color_scheme.push("#5357cf");

}

/**********
 *
 **********/
function ConnectionAnchor(connectable, anchorDiv, parentInterface) {
  this.connectable = connectable;
  this.connected = false;
  this.htmlElement = anchorDiv;
  this.parentInterface = parentInterface;
  this.jg_doc=null;
  this.canvas = null;
  this.arrow = null;
  this.channelType = null;
  
  this.connectable.setInterface(this);

	ConnectionAnchor.prototype.getConnectable = function() {
	  return this.connectable;
	}
	
	ConnectionAnchor.prototype.getParentInterface = function() {
	  return this.parentInterface;
	}
	
	ConnectionAnchor.prototype.assignInterface = function(interface_) {
	  this._interface = interface_;
	}
	
	ConnectionAnchor.prototype.getInterface = function() {
	  return this._interface;
	}
	
	ConnectionAnchor.prototype.isChannelIn = function() {
		return this.connectable instanceof wInOut && this.channelType == 'IN';
	}
	
	ConnectionAnchor.prototype.setAsChannelIn = function() {
		if (this.connectable instanceof wInOut){}
	  		this.channelType = 'IN';
	}
	
	ConnectionAnchor.prototype.setAsChannelOut = function() {
	  if (this.connectable instanceof wInOut){}
	  		this.channelType = 'OUT';
	}
	
	ConnectionAnchor.prototype.drawArrow = function(inChannelPos, outChannelPos){
		if(this.jg_doc){
			this.jg_doc.clear();
			this.arrow.update();
			//decrement number of connections in the parent
			if(this.parentInterface && this.parentInterface.connections > 0)
				this.parentInterface.decreaseConnections();
		}
		var coordinates = Position.cumulativeOffset(this.htmlElement);
		var wiringPosition = Position.cumulativeOffset($('wiring'));
		coordinates[0] = coordinates[0] - wiringPosition[0] - 1; //-1px of img border
		coordinates[1] = coordinates[1] - wiringPosition[1] +(this.htmlElement.getHeight())/2 + 2;  
		// WARNING: a wInOut connectable is a wIn too!
		if (this.connectable instanceof wInOut){
			if (this.channelType == 'IN'){
				coordinates[0] = coordinates[0] + this.htmlElement.getWidth();
				this.drawPolyLine(coordinates[0],coordinates[1], inChannelPos[0], inChannelPos[1], true);
			}else{
				this.drawPolyLine(outChannelPos[0], outChannelPos[1],coordinates[0],coordinates[1], false);
			}
		} else if (this.connectable instanceof wIn){
			coordinates[0] = coordinates[0] + this.htmlElement.getWidth();
			this.drawPolyLine(coordinates[0],coordinates[1], inChannelPos[0], inChannelPos[1], true);
	  	}else {
	  		this.drawPolyLine(outChannelPos[0], outChannelPos[1],coordinates[0],coordinates[1], false);
	  	}
	  	
	}
	
	ConnectionAnchor.prototype.drawPolyLine = function(x1,y1,x2,y2,left)
	{
		if(!this.canvas){
			this.canvas= document.createElement('div');
			this.canvas.addClassName('canvas');
			$('wiring').appendChild(this.canvas);
			this.jg_doc = new jsGraphics(this.canvas); // draw directly into document		
		}
		var xList= new Array(x1, (x1+x2)/2, (x1+x2)/2, x2 );
		var yList= new Array(y1, y1, y2, y2);
		this.jg_doc.setColor("#2D6F9C");
		this.jg_doc.setStroke(2);  
		this.jg_doc.drawPolyline(xList, yList);
		if(!this.arrow){
			this.arrow = document.createElement('div');
			this.arrow.addClassName('arrow');
			this.arrow.style.display= 'none';
			this.canvas.appendChild(this.arrow);
		}
		this.arrow.style.top = Math.round(y2 - this.arrow.getHeight()/2)+1 +"px";
		this.arrow.style.left = ((x2 - this.arrow.getWidth())+2) +"px";
		this.arrow.style.display = 'block';
	
		this.jg_doc.paint();
		//increment number of connections in the parent
		if(this.parentInterface){
			this.parentInterface.increaseConnections();
		}
	}
	
	ConnectionAnchor.prototype.clearPolyLine = function()
	{
		if(this.jg_doc){
			this.jg_doc.clear();
			$('wiring').removeChild(this.canvas);
			this.canvas = null;
			this.arrow = null;
			delete this.jg_doc;
			//decrement number of connections in the parent
			if(this.parentInterface && this.parentInterface.connections > 0)
				this.parentInterface.decreaseConnections();
		}
	}
	
	ConnectionAnchor.prototype.setConnectionStatus = function(newStatus, inChannelPos, outChannelPos) {
	  this.connected = newStatus;
	  
	  if (newStatus){
		this.htmlElement.className="chkItem";
		//draw the arrow
		this.drawArrow(inChannelPos, outChannelPos);
	  }else{
		this.htmlElement.className="unchkItem";
		//clear the arrow
		this.clearPolyLine();

	  }
	}
	
	ConnectionAnchor.prototype.isConnected = function() {
	  return this.connected;
	}
}

/**********
 *
 **********/

function ChannelInterface(channel) {
  if (channel instanceof wChannel) {
    // Existant channel
    this.channel = channel;
    this.name = channel.getName();
    this.inputs = channel.inputs.clone();
    this.outputs = channel.outputs.clone();
	this.filter = channel.getFilter();
	this.filterParams = channel.getFilterParams();
  } else {
    // New channel
    this.channel = null;
    this.name = channel;
    this.inputs = new Array();
    this.outputs = new Array();
    this.provisional_id = new Date().getTime();
	this.filter = null;
	this.filterParams = new Array();
  }

  this.inputsForAdding = new Array();
  this.inputsForRemoving = new Array();
  this.outputsForAdding = new Array();
  this.outputsForRemoving = new Array();
  this.inPosition = new Array();		//coordinates of the point where the channel input arrow ends
  this.outPosition = new Array();		//coordinates of the point where the channel output arrow starts
  this.tempChannel = null;              //It's created by Wiring Core. Nec        
  this.menu = null;

  // Draw the interface
}

ChannelInterface.prototype.setName = function(newName) {
  this.name = newName;
  //if it has an associated channel in the wiring model, change its name too.
  if(this.channel){
  	this.channel._name=newName;
  }
}

ChannelInterface.prototype.getPreviousId = function(newName) {
  if (this.channel && this.channel.previous_id)
  	return this.channel.previous_id;
  else
  	return null;
}

ChannelInterface.prototype.getId = function(newName) {
  if (this.provisional_id){
  	return this.provisional_id;
  }
  return this.channel.getId();
}

ChannelInterface.prototype.isUnsaved = function() {
	return (this.channel && this.provisional_id);
}

ChannelInterface.prototype.getInputs = function() {
  return this.inputs;
}

ChannelInterface.prototype.getOutputs = function() {
  return this.outputs;
}

ChannelInterface.prototype.getName = function() {
  return this.name;
}

ChannelInterface.prototype.getFilter = function() {
  return this.filter;
}

ChannelInterface.prototype.setFilter = function(filter_) {
  this.filter = filter_;
  this.filterParams = new Array ();
  
  // Sets parameter values by default
  if (filter_ != null){
  	var paramDefinition = filter_.getParams();
	this.filterParams = new Array (paramDefinition.length);  
  	for (var p = 0; p < paramDefinition.length; p++) {
	  	var defaultaValue = paramDefinition[p].getDefaultValue(); 
		if((defaultaValue == null) || (defaultaValue == "") || defaultaValue.match(/^\s$/)){
			this.filterParams[p] = "";
		}else{
			this.filterParams[p] = defaultaValue;
		}
  	}
  }
}

ChannelInterface.prototype.getFilterParams = function() {
  return this.filterParams;
}


ChannelInterface.prototype.setFilterParams = function(params_) {
  this.filterParams = params_;
}

ChannelInterface.prototype.setTempChannel = function(channel_) {
  this.channel = channel_;
}

ChannelInterface.prototype.getValue = function() {
  if (this.channel) {
    return this.channel.getValue();
  } else {
    return gettext("undefined"); // TODO
  }
}

ChannelInterface.prototype.getValueWithoutFilter = function() {
  if (this.channel) {
    return this.channel.getValueWithoutFilter();
  } else {
    return gettext("undefined"); // TODO
  }
}

ChannelInterface.prototype.setMenu = function(menu_) {
	this.menu = menu_;	
}

ChannelInterface.prototype.getMenu = function() {
	return this.menu;	
}

ChannelInterface.prototype.commitChanges = function(wiring) {
  var i;

  if (this.tempChannel != null){
  	this.channel = this.tempChannel;
  }
  
  if (this.channel == null){
   	// The channel don't exists
   	this.channel = wiring.getOrCreateChannel(this.name, this.provisional_id);
  }
  
  // Filter and params for adding
  this.channel.setFilter(this.filter);
  this.channel.setFilterParams(this.filterParams);

  // Inputs for removing
  for (i = 0; i < this.inputsForRemoving.length; i++) {
    this.inputsForRemoving[i].disconnect(this.channel);
  }
  this.inputsForRemoving.clear();

  // Outputs for removing
  for (i = 0; i < this.outputsForRemoving.length; i++) {
    this.channel.disconnect(this.outputsForRemoving[i]);
  }
  this.outputsForRemoving.clear();

  // Outputs for adding
  for (i = 0; i < this.outputsForAdding.length; i++) {
    this.channel.connect(this.outputsForAdding[i]);
  }
  this.outputsForAdding.clear();

  // Inputs for adding
  for (i = 0; i < this.inputsForAdding.length; i++) {
    this.inputsForAdding[i].connect(this.channel);
  }
  this.inputsForAdding.clear();
}

ChannelInterface.prototype.exists = function() {
  return this.channel != null;
}

ChannelInterface.prototype.check = function() {
  this._interface.addClassName("selected");
  this._interface.getElementsByClassName('channelNameInput')[0].focus();
  //calculate the position where de in arrows will end and the out ones will start
  this.inPosition = Position.cumulativeOffset(this._interface);
  var wiringPosition = Position.cumulativeOffset($('wiring'));
  this.inPosition[0] = this.inPosition[0] - wiringPosition[0] - 1; //border 
  this.inPosition[1] = this.inPosition[1] - wiringPosition[1] - 1 + (this._interface.getHeight())/2;
  this.outPosition[1] = this.inPosition[1];
  this.outPosition[0] = this.inPosition[0]+this._interface.getWidth();
}

ChannelInterface.prototype.uncheck = function() {
  this._interface.removeClassName("selected");
  this._interface.getElementsByClassName('channelNameInput')[0].blur();
}

ChannelInterface.prototype.assignInterface = function(interface_) {
  this._interface = interface_;
}

ChannelInterface.prototype.getInterface = function() {
  return this._interface;
}

ChannelInterface.prototype.connectInput = function(wIn) {
  if (this.channel != null &&
      this.channel.inputs.elementExists(wIn)) {
    	this.inputsForRemoving.remove(wIn);
  } else {
    this.inputsForAdding.push(wIn);
  }
  this.inputs.push(wIn);
}

ChannelInterface.prototype.disconnectInput = function(wIn) {
  if (this.channel != null &&
      this.channel.inputs.elementExists(wIn)) {
	    this.inputsForRemoving.push(wIn);
  } else {
   		this.inputsForAdding.remove(wIn);
  }
  this.inputs.remove(wIn);
}

ChannelInterface.prototype.connectOutput = function(connectable) {
  if (this.channel != null &&
      this.channel.outputs.elementExists(connectable)) {
	    this.outputsForRemoving.remove(connectable);
  } else {
	    this.outputsForAdding.push(connectable);
  }
  this.outputs.push(connectable);
}

ChannelInterface.prototype.disconnectOutput = function(connectable) {
  if (this.channel != null &&
      this.channel.outputs.elementExists(connectable)) {
	    this.outputsForRemoving.push(connectable);
  } else {
    	this.outputsForAdding.remove(connectable);
  }
  this.outputs.remove(connectable);
}


function DisplayHelpWiringHeader (element, event)
{
	Event.stop(event);
	var divout = document.createElement('div');
	divout.setAttribute ('id', 'help_background');
	divout.style.cssText = "top:0;bottom:0;right:0;left:0;position:absolute;z-index:3001;"
	divout.observe('click', function (e){
		Event.stop(e);
		this.parentNode.removeChild(this);
	});
	// Sets the help style
	var helpOpElement = document.createElement('div');
	helpOpElement.addClassName ('helpwiringheader');
	helpOpElement.style.padding = '5px';
	helpOpElement.style.position = 'absolute';
	helpOpElement.style.top = Event.pointerY(event)+'px';
	divout.appendChild(helpOpElement)
	document.body.appendChild (divout);
	
	if (element.name=='event'){
		helpOpElement.style.left = Event.pointerX(event)+'px';
		helpOpElement.innerHTML = gettext('Lists of gadgets with events.\nThis events produces a value\nwhich will be received by\nother gadgets as slots.');
	}
	else if (element.name=='channels'){
		helpOpElement.style.left = Event.pointerX(event)+'px';
		helpOpElement.innerHTML = gettext('Channels allows you to manage\nthe connections between different\ninstantiated gadgets.');
	}
	else if (element.name=='slot'){
		helpOpElement.innerHTML = gettext('Lists of gadgets with slots.\nThis slots receives values\nwhich are produced by\nother gadgets as events.');
		helpOpElement.style.left = (Event.pointerX(event) - helpOpElement.offsetWidth) +'px';
	}
}
