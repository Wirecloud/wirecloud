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


function Wiring (workspace, workSpaceGlobalInfo) {

	// *****************
	//  PRIVATE METHODS
	// *****************

	// ****************
	// PUBLIC METHODS
	// ****************
	
	Wiring.prototype.getConnectableId = function (variables, name, igadgetId) {
		for (i=0; i<variables.length; i++) {
			var variable = variables[i];
			
			if ((variable.name == name) && (variable.igadgetId == igadgetId)) {
				return variable.connectable.id;
			}
		}
	}

	Wiring.prototype.processFilter = function (filterData) {
		var filterObject = new Filter (filterData.id, filterData.name, filterData.label, 
									   filterData.nature, filterData.code, filterData.category, 
									   filterData.params, filterData.help_text);
		
		this.filters[filterData.id] = filterObject;		
	}

	Wiring.prototype.processTab = function (tabData) {
		var igadgets = tabData['igadgetList'];
		var dragboard = this.workspace.getTab(tabData['id']).getDragboard();

		for (var i = 0; i < igadgets.length; i++) {
			this.addInstance(dragboard.getIGadget(igadgets[i].id), igadgets[i].variables);
		}
	}
	
	Wiring.prototype.processVar = function (varData) {
		var varManager = this.workspace.getVarManager();
		var variable = varManager.getWorkspaceVariableById(varData.id);
		
		if (varData.aspect == "TAB" && varData.connectable) {
			var connectableId = varData.connectable.id;
			var tab_id = varData.tab_id;
			
			var tab = this.workspace.getTab(tab_id);
			
		    var connectable = new wTab(variable, varData.name, tab, connectableId);
		    
		    tab.connectable = connectable;
		}
		
		if (varData.aspect == "CHANNEL" && varData.connectable) {
			var connectableId = varData.connectable.id;
		    var channel = new wChannel(variable, varData.name, connectableId, false);
			
			// Setting channel filter
			channel.setFilter(this.filters[varData.connectable.filter]);
		    channel.processFilterParams(varData.connectable.filter_params);
			
		    // Connecting channel input		
		    var connectable_ins = varData.connectable.ins;
		    for (var j = 0; j < connectable_ins.length; j++) {
		    	// Input can be: {wEvent, wChannel}
		    	var current_input = connectable_ins[j];
		    	
		    	var in_connectable = null;
		    	if (current_input.connectable_type == "in") {
		    		var var_id = current_input.ig_var_id;
		    		in_connectable = varManager.getVariableById(var_id).getConnectable();
		    	}
		    	else {
		    		if (current_input.connectable_type == "inout") {
		    			var var_id = current_input.ws_var_id;
		    			in_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Input connectables can only be In or InOut!!!")
		    		}
		    	}

		    	in_connectable.connect(channel);
		    }
		    
		    // Connecting channel output  
		    var connectable_outs = varData.connectable.outs;
		    for (var j = 0; j < connectable_outs.length; j++) {
		    	// Outputs can be: {wSlot, wTab}
		    	var current_output = connectable_outs[j];
		    	
		    	var out_connectable = null;
		    	if (current_output.connectable_type == "out") {
		    		if (current_output.ig_var_id) {
		    			var var_id = current_output.ig_var_id;
		    			out_connectable = varManager.getVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    	}
		    	else {
		    		if (current_output.connectable_type == "inout") {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Output connectables can only be In or InOut!!!")
		    		}
		    	}

		    	channel.connect(out_connectable);
		    }

			// Save it on the channel list
		    this.channels.push(channel);
		}	
	}

	Wiring.prototype.propagateInitialValues = function (initial) {
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			channel.propagate(channel.variable.value, initial);
		}
	}

	Wiring.prototype.refreshIGadget = function(igadget) {
		var connectables = this.getIGadgetConnectables(igadget);

		for (var i = 0; i < connectables.length; i++) {
			var connectable = connectables[i];
			connectable.refresh();
		}
	}

	Wiring.prototype.loadWiring = function (workSpaceData) {
		var workSpace = workSpaceData['workspace'];
		var ws_vars_info = workSpace['workSpaceVariableList'];
		var tabs = workSpace['tabList'];
		var filters = workSpace['filters'];

		for (var i = 0; i < tabs.length; i++) {
			this.processTab(tabs[i]);
		}

		// Load all platform filters. 
		// ATTENTION: Filters must be loaded before workspace variables
		for (var i = 0; i < filters.length; i++) {
			this.processFilter(filters[i]);
		}
		
		// Load WorkSpace variables
		for (var i = 0; i < ws_vars_info.length; i++) {
			this.processVar(ws_vars_info[i]);
		}

		this.loaded = true;
	}

	Wiring.prototype.addInstance = function (igadget, variables) {
		var varManager = this.workspace.getVarManager();
		var gadgetEntry = new Object();
		var iGadgetId = igadget.getId();

		if (this.iGadgets[iGadgetId]) {
			var msg = gettext("Error adding iGadget into the wiring module of the workspace: Gadget instance already exists.");
			LogManagerFactory.getInstance().log(msg);
		}

		gadgetEntry.events = new Array();
		gadgetEntry.slots = new Array();
		gadgetEntry.connectables = new Array();

		// IGadget variables
		for (var i = 0; i < variables.length; i++) {
			var variableData = variables[i];
			var variable = varManager.getVariableByName(variableData.igadgetId, variableData.name);
			
			if (variable.aspect == "EVEN" && variableData.connectable) {
				var connectableId = variableData.connectable.id;
			    var connectable = new wEvent(variable, variableData.type, variableData.friend_code, connectableId);
			    
			    gadgetEntry.events.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
			if (variable.aspect == "SLOT" && variableData.connectable) {
			    var connectableId = variableData.connectable.id;
			    var connectable = new wSlot(variable, variableData.type, variableData.friend_code, connectableId);

			    gadgetEntry.slots.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
		}
		
		this.iGadgets[iGadgetId] = gadgetEntry;
	}
	
	// TODO
	Wiring.prototype.removeInstance = function (iGadgetId) {
		var entry = this.iGadgets[iGadgetId];

		if (!entry) {
			var msg = gettext("Wiring error: Trying to remove an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		for (var i = 0; i < entry.events.length; i++)
			entry.events[i].destroy();
		entry.events.clear();
		
		for (var i = 0; i < entry.slots.length; i++)
			entry.slots[i].destroy();
		entry.slots.clear();

		this.iGadgets.remove(iGadgetId)
	}

	Wiring.prototype.getIGadgetConnectables = function(iGadget) {
		var iGadgetEntry = this.iGadgets[iGadget.id];

		if (iGadgetEntry == null) {
			var msg = gettext("Wiring error: Trying to retreive the connectables of an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		return iGadgetEntry.connectables;
	}

	Wiring.prototype.getChannels = function() {
		return this.channels;
	}
	
	Wiring.prototype.getFiltersSort = function() {
		var sortByLabel = function (a, b){
			var x = a.getName();
			var y = b.getName();
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		} 
		return this.filters.values().sort(sortByLabel);
	}
	
	Wiring.prototype.channelExists = function(channelName){
		if(this.channels.getElementByName(channelName))
			return true;
		return false;
	}

	Wiring.prototype._insertChannel = function (channelName, channelVar, id, provisional_id) {
		if (this.channelExists(channelName)) {
			var msg = interpolate(gettext("Error creating channel %(channelName)s: Channel already exists"),{channelName: channelName}, true);
//			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}		
		
		if (!provisional_id) 
			provisional_id=false;

		var channel = new wChannel(channelVar, channelName, id, provisional_id);
		this.channels.push(channel);
					
		return channel;
	}

	Wiring.prototype.createChannel = function (channelName, channelId) {
		var channelVar = this.workspace.getVarManager().createWorkspaceVariable(channelName);

		return this._insertChannel(channelName, channelVar, channelId, true);
	}
	
	Wiring.prototype.getOrCreateChannel = function (channelName, channelId) {
		var channel = this.channels.getElementByName(channelName);
		if(!channel){
			channel = this.createChannel(channelName, channelId);
		}
		return channel;
	}

	Wiring.prototype.removeChannel = function (channelId, isTemp) {
		var channel = this.channels.getElementById(channelId);

		if (channel == undefined) {
			var msg = gettext("Error removing channel %(channelName)s: Channel does not exist");
			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		//delete the workspace variable
		this.workspace.getVarManager().removeWorkspaceVariable(channel.variable.id);
		
		if (!isTemp)
			this.channelsForRemoving.push(channel.id);
		
		this.channels.removeById(channelId);
		
		channel.destroy();
	}

	Wiring.prototype.serializationSuccess = function (transport){
		// JSON-coded ids mapping
		var response = transport.responseText;
		var json = eval ('(' + response + ')');
		
		var mappings = json['ids'];
		for (var i=0; i<mappings.length; i++) {
			var mapping = mappings[i];
			for (var j=0; j<this.channels.length; j++) {
				if (this.channels[j].getId() == mapping.provisional_id) {
					this.channels[j].id = mapping.id;
					this.channels[j].provisional_id = false;
					this.channels[j].previous_id = mapping.provisional_id;
					this.channels[j].variable.id = mapping.var_id;
					this.workspace.getVarManager().addWorkspaceVariable(mapping.var_id, this.channels[j].variable);
					break;
				}
			}
		}
		
		// Channels has been sabed in db. Cleaning state variables!
		delete this.channelsForRemoving;
		this.channelsForRemoving = [];
	}

	Wiring.prototype.unload = function () {	
		var varManager = this.workspace.getVarManager();
		
		for (var i=0; i<this.channels.length; i++) {
			var channel = this.channels[i];
			
			varManager.removeWorkspaceVariable(channel.variable.id);
			
			channel.destroy();
		}

	}
	
	Wiring.prototype.serializationError = function (response) {
		var p = response.responseText;
		msg = interpolate(gettext("Error : %(errorMsg)s."), {errorMsg: p}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	Wiring.prototype.serialize = function () {
		var gadgetKeys = this.iGadgets.keys();
		var serialized_channels = [];
		
		// Channels
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			var serialized_channel = new Object();
			
			// Filling channel info!!!
			serialized_channel['id'] = channel.id; 
			serialized_channel['name'] = channel._name;
			serialized_channel['type'] = channel._type;
			serialized_channel['friend_code'] = channel._friendCode;
			serialized_channel['var_id'] = channel.variable.id;
			serialized_channel['provisional_id'] = channel.provisional_id;
			if (channel.getFilter() == null)
				serialized_channel['filter'] = null;
			else
				serialized_channel['filter'] = channel.getFilter().getId();
			
			var serialized_filter_params = '';
			for (var k = 0; k < channel.getFilterParams().length; k++) {
				serialized_filter_params += '{"index": ' + k;  
				serialized_filter_params += ', "value": "' + channel.getFilterParams()[k] + '"}';
				if (k != (channel.getFilterParams().length - 1)){
					serialized_filter_params += ', ';
				}
			}
			serialized_channel['filter_params'] = '{[' + serialized_filter_params + ']}';
			
			serialized_channel.ins = [];
			                              
			var serialized_inputs = serialized_channel.ins;

			for (var j = 0; j < channel.inputs.length; j++) {
				var input = channel.inputs[j];
				var serialized_input = new Object();
				
				serialized_input['id'] = input.id;
				serialized_input['connectable_type'] = input.connectableType;
				
				serialized_inputs.push(serialized_input);
			}

			serialized_channel.outs = [];
			
			var serialized_outputs = serialized_channel.outs;
			
			for (var j = 0; j < channel.outputs.length; j++) {
				var output = channel.outputs[j];
				var serialized_output = new Object();
				
				serialized_output['id'] = output.id;
				serialized_output['connectable_type'] = output.connectableType;
				
				serialized_outputs.push(serialized_output);
			}
			
			serialized_channels.push(serialized_channel);
		}
		
		//Channels for adding

		var json = {'inOutList' : serialized_channels};
		
		json['channelsForRemoving'] = this.channelsForRemoving;
		
		var param = {'json': Object.toJSON(json)};
		
		var url = URIs.GET_POST_WIRING.evaluate({'id': this.workspace.workSpaceState.id});
		
		PersistenceEngineFactory.getInstance().send_post(url, param, this, this.serializationSuccess, this.serializationError); 
	}

	// ***************
	// CONSTRUCTOR
	// ***************
	this.workspace = workspace;

	this.loaded = false;
	this.persistenceEngine = PersistenceEngineFactory.getInstance();
	this.iGadgets = new Hash();
	this.channels = new Array();
	this.filters = new Hash();
	this.channelsForRemoving = [];
	
	
	
	this.loadWiring(workSpaceGlobalInfo);
}

