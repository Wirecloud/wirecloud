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

	/**
	 * @private
	 *
	 * Recreates the correct <code>wConnectable</code> that represents the given
	 * variable and inserts it into wiring data structures.
	 *
	 * @param {JSON} varData json from persistence representing a variable.
	 */
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

			var fParams = varData.connectable.filter_params;

			if (fParams)
				fParams = JSON.parse(fParams);
			else
				fParams = []

			channel.setFilterParams(fParams);

			// Connecting channel input
			var connectable_ins = varData.connectable.ins;
			for (var j = 0; j < connectable_ins.length; j++) {
				// Input can be: {wEvent}
				var current_input = connectable_ins[j];

				var in_connectable = null;
				if (current_input.connectable_type == "in") {
					var var_id = current_input.ig_var_id;
					in_connectable = varManager.getVariableById(var_id).getConnectable();
				} else {
					var msg = gettext("Error in processVar: Channel input connectables can only be events.");
					LogManagerFactory.getInstance().log(msg);
				}

				in_connectable.connect(channel);
			}

			// Connecting channel output (except connections to wChannels)
			var connectable_outs = varData.connectable.outs;
			for (var j = 0; j < connectable_outs.length; j++) {
				// Outputs can be: {wSlot, wTab}
				var current_output = connectable_outs[j];

				var out_connectable = null;
				if (current_output.connectable_type == "out") {
					if (current_output.ig_var_id) {
						var var_id = current_output.ig_var_id;
						out_connectable = varManager.getVariableById(var_id).getConnectable();
					} else {
						var var_id = current_output.ws_var_id;
						out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
					}
				} else {
					var msg = gettext("Error in processVar: Channel output connectables can only be slots or tabs.");
					LogManagerFactory.getInstance().log(msg);
				}

				channel.connect(out_connectable);
			}

			// Save it on the channel list
			this.channels.push(channel);
			this.channelsById[channel.getId()] = channel;
		}
	}

	/**
	 * @private
	 *
	 * Connects channels with other channels.
	 */
	Wiring.prototype._connectInouts = function (varData) {
		var channel = this.channelsById[varData.connectable.id];
		var varManager = this.workspace.getVarManager();
		var connectable_inouts = varData.connectable.out_inouts;

		for (var j = 0; j < connectable_inouts.length; j++) {
			var out_inout = this.channelsById[connectable_inouts[j]];
				if (!channel.isConnectable(out_inout)) {
					var msg = gettext("Wiring: Loop detected while recovering wiring status from persistence.\nOutput connection to channel \"%(targetChannel)s\" from channel \"%(sourceChannel)s\" will be ignored.");
					msg = interpolate(msg,
					                  {sourceChannel: channel.getName(),
					                   targetChannel: out_inout.getName()},
					                  true);

					LogManagerFactory.getInstance().log(msg, Constants.Logging.WARN_MSG);
					continue;
				}
				channel.connect(out_inout);
		}
	}

	/**
	 * @private
	 *
	 * Parses workSpaceData and fills the wiring data structures to recreate
	 * the status saved into persistence.
	 */
	Wiring.prototype._loadWiring = function (workSpaceData) {
		var workSpace = workSpaceData['workspace'];
		var ws_vars_info = workSpace['workSpaceVariableList'];
		var tabs = workSpace['tabList'];
		var filters = workSpace['filters'];

		for (var i = 0; i < tabs.length; i++)
			this.processTab(tabs[i]);

		// Load all platform filters.
		// WARNING: Filters must be loaded before workspace variables
		for (var i = 0; i < filters.length; i++)
			this.processFilter(filters[i]);

		// Load WorkSpace variables
		for (var i = 0; i < ws_vars_info.length; i++)
			this.processVar(ws_vars_info[i]);

		// Load inter-channel connections
		for (var i = 0; i < ws_vars_info.length; i++)
			if (ws_vars_info[i].aspect == "CHANNEL")
				this._connectInouts(ws_vars_info[i]);

		this.loaded = true;
	}

	/**
	 * @private
	 *
	 * Generates and returns a new provisional channel id.
	 */
	Wiring.prototype._newProvisionalChannelId = function () {
		return this.currentProvisionalId++;
	}


	// ****************
	// PUBLIC METHODS
	// ****************

	Wiring.prototype.getConnectableId = function (variables, name, igadgetId) {
		for (var i = 0; i < variables.length; i++) {
			var variable = variables[i];

			if ((variable.name == name) && (variable.igadgetId == igadgetId)) {
				return variable.connectable.id;
			}
		}
	}

	Wiring.prototype.iGadgetLoaded = function (iGadget) {
		var entry = this.iGadgets[iGadget.getId()];

	}

	Wiring.prototype.iGadgetUnloaded = function (iGadget) {
		var entry = this.iGadgets[iGadget.getId()];

		for (var i = 0; i < entry.slots.length; i++)
			entry.slots[i].variable.setHandler(null);
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

	/**
	 * Removes an iGadget from this wiring instance. This method should be only
	 * used by the Workspace class.
	 */
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

	/**
	 * Returns a list of all connectable associated to a given iGadget.
	 *
	 * @param {Number} iGadget id of the iGadget to look up for connectables
	 * @return {Array}
	 */
	Wiring.prototype.getIGadgetConnectables = function(iGadget) {
		var iGadgetEntry = this.iGadgets[iGadget.id];

		if (iGadgetEntry == null) {
			var msg = gettext("Wiring error: Trying to retreive the connectables of an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		return iGadgetEntry.connectables;
	}

	/**
	 * Returns a list with all channel managed by this wiring instance.
	 *
	 * @return {Array}
	 */
	Wiring.prototype.getChannels = function() {
		return this.channels;
	}

	/**
	 * Returns the list of filter that this wiring instance manages sorted by
	 * name.
	 *
	 * @return {Array}
	 */
	Wiring.prototype.getFiltersSort = function() {
		var sortByLabel = function (a, b) {
			var x = a.getName();
			var y = b.getName();
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
		return this.filters.values().sort(sortByLabel);
	}

	/**
	 * Checks if there is currently a channel with a given name.
	 */
	Wiring.prototype.channelExists = function(channelName) {
		return this.channels.getElementByName(channelName) ? true : false;
	}

	/**
	 * Creates a new Channel
	 *
	 * @param {String} channelName name of the new channel
	 */
	Wiring.prototype.createChannel = function (channelName) {
		if (this.channelExists(channelName)) {
			var msg = gettext("Error creating channel %(channelName)s: Channel already exists");
			msg = interpolate(msg, {channelName: channelName}, true);
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		var channelVar = this.workspace.getVarManager().createWorkspaceVariable(channelName);
		var channelId = this._newProvisionalChannelId();

		var channel = new wChannel(channelVar, channelName, channelId, true);
		this.channels.push(channel);

		// Save it on the provisional channel list
		this.provisionalChannels[channelId] = channel;

		return channel;
	}

	/**
	 * Removes the given channel form the wiring.
	 *
	 * @param {wChannel} channel channel to remove. This channel must belong to
	 *        this wiring instance.
	 */
	Wiring.prototype.removeChannel = function (channel) {
		// Delete the workspace variable
		this.workspace.getVarManager().removeWorkspaceVariable(channel.variable.id);

		// Mark it to remove from persistence
		this.channelsForRemoving.push(channel.getId());

		// Remove it from the list of channels
		this.channels.remove(channel);

		// Free memory
		channel.destroy();
	}

	/**
	 * Unloads this wiring instance. After this, this wiring instance can not be
	 * use any more.
	 */
	Wiring.prototype.unload = function () {
		var varManager = this.workspace.getVarManager();

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];

			varManager.removeWorkspaceVariable(channel.variable.id);

			channel.destroy();
		}

		loaded = false;
	}

	/**
	 * @private
	 */
	Wiring.prototype.serializationSuccess = function (transport) {
		// JSON-coded ids mapping
		var response = transport.responseText;
		var json = JSON.parse(response);

		var mappings = json['ids'];
		for (var provisional_id in mappings) {
			var mapping = mappings[provisional_id];

			var curChannel = this.provisionalChannels[provisional_id];
			delete this.provisionalChannels[provisional_id];

			curChannel.id = mapping.new_id;
			curChannel.provisional_id = false;
			curChannel.variable.id = mapping.new_wv_id;
			this.workspace.getVarManager().addWorkspaceVariable(mapping.new_wv_id, curChannel.variable);
		}

		// Cleaning state variables
		this.channelsForRemoving = [];
	}

	/**
	 * @private
	 */
	Wiring.prototype.serializationError = function (transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error saving wiring status: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	/**
	 * Saves the wiring state.
	 */
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

			serialized_channel['filter_params'] = channel.getFilterParams();
			
			if (channel.getRemoteSubscription().has_changed())
				serialized_channel['remote_subscription'] = channel.getRemoteSubscription().get_data();
			else
				serialized_channel['remote_subscription'] = null;

			// Inputs (except inouts)
			serialized_channel['ins'] = [];
			for (var j = 0; j < channel.inputs.length; j++) {
				var input = channel.inputs[j];

				if (input instanceof wInOut)
					continue;

				serialized_channel['ins'].push(input.id);
			}

			// Outputs (except inouts)
			serialized_channel.outs = [];
			var inouts = [];
			for (var j = 0; j < channel.outputs.length; j++) {
				var output = channel.outputs[j];

				if (output instanceof wInOut) {
					inouts.push(output);
					continue;
				}

				serialized_channel['outs'].push(output.id);
			}

			// Inouts connected as output
			serialized_channel['inouts'] = [];
			for (var j = 0; j < inouts.length; j++) {
				var inout = inouts[j];
				serialized_channel['inouts'].push({id: inout.id,
				                                   provisional_id: inout.provisional_id});
			}

			serialized_channels.push(serialized_channel);
		}

		// Send data to persistence engine
		var json = {'inOutList': serialized_channels,
		            'channelsForRemoving': this.channelsForRemoving};
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
	this.channelsById = new Hash();
	this.filters = new Hash();
	this.channelsForRemoving = [];
	this.provisionalChannels = [];
	this.currentProvisionalId = 1;

	this._loadWiring(workSpaceGlobalInfo);

	delete this['channelsById']; // this variable is only used on wiring loading
}
