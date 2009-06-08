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


/**
 * @abstract
 *
 * Generic class for foldables lists of ConnectableInterfaces ().
 */
function ConnectableGroupInterface (wiringGUI, parentInterface, headerText) {
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	this.empty = true;
	this.wiringGUI = wiringGUI;
	this.folded = false;
	this.connections = 0;
	this.parentInterface = parentInterface;
	this.openedByUser = false;
	this.childConnectableGroups = new Array();

	// Root HTML Element of this interface
	this.htmlElement = document.createElement("div");

	// Header
	this.headerElement = document.createElement("div");
	this.headerElement.addClassName("header");
	this.headerElement.appendChild(document.createTextNode(headerText));
	this.htmlElement.appendChild(this.headerElement);

	// Folding event
	Event.observe(this.headerElement, "click",
		function(e) {
			Event.stop(e);
			this.toggle(true);
		}.bind(this));

	// List of connectables
	this.contentElement = document.createElement("div");
	this.contentElement.addClassName("content");
	this.htmlElement.appendChild(this.contentElement);

	if (this.parentInterface)
		this.parentInterface._addConnectableGroup(this);

	this.htmlElement.addClassName("empty");
}

/**
 * @private
 *
 * Increments the counter of connections that ends in this <code>
 * ConnectableGroupInterface</code>.
 */
ConnectableGroupInterface.prototype._increaseConnections = function() {
	this.connections++;
	if (this.parentInterface) this.parentInterface._increaseConnections();
}

/**
 * @private
 *
 * Decrements the counter of connections that ends in this <code>
 * ConnectableGroupInterface</code>.
 */
ConnectableGroupInterface.prototype._decreaseConnections = function() {
	if (this.connections >= 1) {
		this.connections--;
		if (this.parentInterface) this.parentInterface._decreaseConnections();
	} /* else {
		TODO warning
	*/
}

/**
 * Returns the root HTML element of this <code>ConnectableGroupInterface</code>.
 */
ConnectableGroupInterface.prototype.getHTMLElement = function() {
	return this.htmlElement;
}

/**
 * Toggles this <code>connectableGroupInterface</code> taking into account
 * several aspects, which can leads to different actions (expand, expand
 * massively, fold, fold massively, etc.) depending on these aspects.
 *
 * @param {Boolean} userAction
 */
ConnectableGroupInterface.prototype.toggle = function (userAction) {
	// If the interface was opened by the user, only the user can fold it.
	if (this.openedByUser && !userAction)
		return;

	if (!this.folded && this.connections > 0)
		this.massiveToggle(userAction);

	this.forceToggle();
	this.openedByUser = !this.fold && userAction;
}

/**
 * Folds or unfolds this <code>ConnectableGroupInterface</code> depending on the
 * current interface status.
 */
ConnectableGroupInterface.prototype.forceToggle = function () {
	this.folded = !this.folded;

	if (this.folded) {
		this.htmlElement.addClassName('folded');
		this.openedByUser = false;
	} else {
		this.htmlElement.removeClassName('folded');
	}

	this.repaintSiblings(); // repaint the arrows if needed
}

/**
 * Returns true if there are any unfolded interfaces in this <code>
 * ConnectableGroupInterface</code>.
 */
ConnectableGroupInterface.prototype.isAnyFolded = function () {
	for (var i = 0; i < this.childConnectableGroups.length; i++) {
		var childGroup = this.childConnectableGroups[i];
		if (childGroup.folded || childGroup.isAnyFolded())
			return true;
	}

	return false;
}

/**
 * @param {Boolean} userAction
 */
ConnectableGroupInterface.prototype.makeVisible = function (userAction) {
	if (this.folded)
		this.toggle(userAction);
	else
		this.openedByUser = userAction;

	if (this.parentInterface)
		this.parentInterface.makeVisible(false);
}

/**
 * Expands of folds all the child connectables of this <code>
 * ConnectableGroupInterface</code> according to the status of these
 * connectables.
 *
 * @param {Boolean} userAction
 */
ConnectableGroupInterface.prototype.massiveToggle = function(userAction) {
	if (this.isAnyFolded())
		this.massiveExpand(userAction);
	else
		this.massiveFold();
}

/**
 * Expands all connectable interface on this <code>
 * ConnectableGroupInterface</code>.
 *
 * @param {Boolean} userAction
 */
ConnectableGroupInterface.prototype.massiveExpand = function (userAction) {
	if (this.folded) {
		this.forceToggle();
		this.openedByUser = !this.fold && userAction;
	}

	for (var i = 0; i < this.childConnectableGroups.length; i++)
		this.childConnectableGroups[i].massiveExpand(userAction);
}

/**
 * Folds all connectable interface on this <code>
 * ConnectableGroupInterface</code>.
 *
 * @param {Boolean} userAction
 */
ConnectableGroupInterface.prototype.massiveFold = function () {
	if (!this.folded) {
		this.forceToggle();
		this.openedByUser = false;
	}

	for (var i = 0; i < this.childConnectableGroups.length; i++)
		this.childConnectableGroups[i].massiveFold();
}

/**
 * @private
 *
 * Adds a <code>ConnectableGroupInterface</code> as child of this <code>
 * ConnectableGroupInterface</code>.
 *
 * @param {ConnectableGroupInterface} group
 */
ConnectableGroupInterface.prototype._addConnectableGroup = function (group) {
	this.childConnectableGroups.push(group);
	this.contentElement.appendChild(group.getHTMLElement());

	this._notifyNewEmptyStatus(group, group.isEmpty());
}

/**
 * @private
 *
 * This method allows to child connectable groups to notify about empty status
 * changes.
 *
 * @param {ConnectableGroupInterface} group
 * @param {Boolean} newEmptyStatus
 */
ConnectableGroupInterface.prototype._notifyNewEmptyStatus = function (group, newEmptyStatus) {
	if (this.empty && !newEmptyStatus) {
		this.empty = false;
		this.htmlElement.removeClassName("empty");
	}
}

/**
 * Retuns whether this <code>ConnectableGroupInterface</code> can be considered
 * empty.
 */
ConnectableGroupInterface.prototype.isEmpty = function() {
	return this.empty;
}

/**
 * @abstract
 *
 * This class is the base of the classes <code>SlotTabInterface</code> and <code>
 * EventTabInterface</code>.
 *
 * @param {WiringInterface} wiringGUI
 * @param {String} headerText
 */
function ConnectableTabInterface (wiringGUI, headerText) {
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	ConnectableGroupInterface.call(this, wiringGUI, null, headerText);

	this.htmlElement.addClassName("tab");
}
ConnectableTabInterface.prototype = new ConnectableGroupInterface();

/////////////////////////////////////////////////
//    TAB INTERFACES FOR SLOTS AND EVENTS      //
/////////////////////////////////////////////////

/**
 * @class
 * This class represents the interface that groups all the slots (classified by
 * igadgets) of a Tab. This interface also has the anchor for connecting this
 * tab as output of a channel.
 *
 * @param {Tab}
 * @param {WiringInterface}
 */
function SlotTabInterface (tab, wiringGUI) {
	ConnectableTabInterface.call(this, wiringGUI, tab.tabInfo.name);

	this.tabConnectable = tab.connectable;
	wiringGUI._registerConnectable(this);

	// create an anchor for the tab
	this.tabAnchor = new TabConnectionAnchor(this);
	var chkItem = this.tabAnchor.getHTMLElement();
	this.headerElement.appendChild(chkItem);

	Event.observe(chkItem, "click",
		function (e) {
			this.wiringGUI._changeConnectionStatus(this.tabAnchor);
			Event.stop(e); // Stop event propagation
		}.bind(this), false);
	this.wiringGUI.outputs.push(this);
}
SlotTabInterface.prototype = new ConnectableTabInterface();

/**
 * As this <code>SlotTabInterface</code> acts as the interface for the tab.
 * This method returns the <code>wConnectable</code> associated to the
 * connectable of this tab.
 */
SlotTabInterface.prototype.getConnectable = function() {
	return this.tabConnectable;
}

/**
 * As this <code>SlotTabInterface</code> acts as the interface for the tab,
 * this method returns the <code>TabConnectionAnchor</code> associated to the
 * connectable of this tab.
 */
SlotTabInterface.prototype.getAnchor = function() {
	return this.tabAnchor;
}

SlotTabInterface.prototype.getFriendCode = function() {
	return "go_tab_event";
}

SlotTabInterface.prototype.repaintSiblings = function () {
	if (this.wiringGUI.currentChannel == null)
		return;

	this.wiringGUI._uncheckChannelOutputs(this.wiringGUI.currentChannel);
	this.wiringGUI._highlightChannelOutputs(this.wiringGUI.currentChannel);
}

/**
 * @class
 * This class represents the interface that groups all the events (classified by
 * igadgets) of a Tab.
 *
 * @param {Tab}
 * @param {WiringInterface}
 */
function EventTabInterface (tab, wiringGUI) {
	ConnectableTabInterface.call(this, wiringGUI, tab.tabInfo.name);
}
EventTabInterface.prototype = new ConnectableTabInterface();

EventTabInterface.prototype.repaintSiblings = function () {
	if (this.wiringGUI.currentChannel == null)
		return;

	this.wiringGUI._uncheckChannelInputs(this.wiringGUI.currentChannel);
	this.wiringGUI._highlightChannelInputs(this.wiringGUI.currentChannel);
}


/**********
 *
 **********/

/**
 * @abstract
 *
 * This class represents the interface associated to a given connectable in the
 * wiring GUI. As each connectable has a different interface, this class can not be
 * used directly (it is abstract).
 *
 * @param {Connectable} connectable
 * @param {ConnectableAnchor} anchor
 */
function ConnectableInterface(connectable, anchor) {
	this.connectable = connectable;
	this.anchor = anchor;
}

ConnectableInterface.prototype.getConnectable = function() {
	return this.connectable;
}

ConnectableInterface.prototype.getAnchor = function() {
	return this.anchor;
}

/**
 *
 * @see ConnectableInterface
 */
function ChannelInterface(channel, wiringGUI) {
	this.wiringGUI = wiringGUI;

	if (channel instanceof wChannel) {
		// Existant channel
		this.connectable = channel;
		this.name = channel.getName();
		this.inputs = channel.inputs.clone();
		this.outputs = channel.outputs.clone();
		this.filter = channel.getFilter();
		this.filterParams = channel.getFilterParams();
	} else {
		// New channel
		this.connectable = null;
		this.name = channel;
		this.inputs = new Array();
		this.outputs = new Array();
		this.filter = null;
		this.filterParams = new Array();
	}

	this.inputsForAdding = new Array();
	this.inputsForRemoving = new Array();
	this.outputsForAdding = new Array();
	this.outputsForRemoving = new Array();

	// Anchors
	this.inAnchor = new OutConnectionAnchor(this);
	this.outAnchor = new InConnectionAnchor(this);

	// HTML interface
	this.htmlElement = document.createElement("div");
	this.htmlElement.addClassName("channel");

	var channelPipe = document.createElement("div");
	channelPipe.className = 'channelPipe';
	this.htmlElement.appendChild(channelPipe);

	Event.observe(channelPipe, "click",
	                function (e) {
	                  Event.stop(e);
	                  this.wiringGUI._changeChannel(this);
	                }.bind(this));

	var inputDel = document.createElement("img");
	channelPipe.appendChild(inputDel);
	inputDel.setAttribute("alt", gettext("Remove"));
	inputDel.setAttribute("src", _currentTheme.getIconURL('channel-remove'));
	Event.observe(inputDel,
	              'click',
	              function (e) {
	                  Event.stop(e);
	                  this.wiringGUI._removeChannel(this);
	              }.bind(this));

	this.channelNameInput = document.createElement("input");
	channelPipe.appendChild(this.channelNameInput);
	this.channelNameInput.setAttribute ("value", this.name);
	this.channelNameInput.addClassName ("channelNameInput");
	this.channelNameInput.observe('click',
	              function(e) {
	                  if (this.wiringGUI.currentChannel == this)
	                      Event.stop(e); //do not propagate to div.
	              }.bind(this));

	var checkName = function(e) {
		if (e.target.value == "" || e.target.value.match(/^\s$/)) {
			var msg = gettext("Error updating a channel. Invalid name");
			LogManagerFactory.getInstance().log(msg);
			e.target.value=this.channel.getName();
		} else if (this.wiringGUI.channelExists(e.target.value)) {
			var msg = gettext("Error updating a channel. %(channelName)s: Channel already exists");
			msg = interpolate(msg, {channelName: e.target.value}, true);
			LogManagerFactory.getInstance().log(msg);
			e.target.value=this.channel.getName();
		} else {
			this.setName(e.target.value)
		}
	}
	this.channelNameInput.observe('change', checkName.bind(this));

	var channelContent = document.createElement("div");
	this.htmlElement.appendChild(channelContent);
	channelContent.addClassName("channelContent");
	Event.observe(channelContent, 'click', function(e) {Event.stop(e);});

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
	this.paramLabelLayer = document.createElement("div");
	labelLayer.appendChild(this.paramLabelLayer);

	var valueLabel = document.createElement("div");
	labelLayer.appendChild(valueLabel);
	valueLabel.appendChild(document.createTextNode(gettext("Value") + ":"));

	// Adds the information
	var filterLabelDiv = document.createElement("div");
	filterLabelDiv.addClassName("filterValue");
	contentLayer.appendChild(filterLabelDiv);

	this.filterInput = document.createTextNode("");
	filterLabelDiv.appendChild(this.filterInput);

	var filterMenuButton = document.createElement("input");
	filterLabelDiv.appendChild(filterMenuButton);
	filterMenuButton.setAttribute("type", "button");
	filterMenuButton.addClassName("filterMenuLauncher");
	filterMenuButton.observe('click',
		function(e) {
			e.target.blur();
			Event.stop(e);
			LayoutManagerFactory.getInstance().showDropDownMenu(
				'filterMenu',
				this.wiringGUI.filterMenu,
				Event.pointerX(e),
				Event.pointerY(e));
		}.bind(this)
	);

	this.paramValueLayer = document.createElement("div");
	contentLayer.appendChild(this.paramValueLayer);

	// Adds the channel value
	this.valueElement = document.createElement("div");
	contentLayer.appendChild(this.valueElement);


	// Update the initial information
	this._updateFilterInterface();
	this.channelNameInput.focus();

	// Anchors
	var inAnchorElement = this.inAnchor.getHTMLElement();
	inAnchorElement.addClassName("inAnchor");
	Event.observe(inAnchorElement, "click",
		function (e) {
			this.wiringGUI._changeConnectionStatus(this.inAnchor);
			Event.stop(e); // Stop event propagation
		}.bind(this), false);
	this.htmlElement.appendChild(inAnchorElement);

	var outAnchorElement = this.outAnchor.getHTMLElement()
	outAnchorElement.addClassName("outAnchor");
	Event.observe(outAnchorElement, "click",
		function (e) {
			this.wiringGUI._changeConnectionStatus(this.outAnchor);
			Event.stop(e); // Stop event propagation
		}.bind(this), false);
	this.htmlElement.appendChild(outAnchorElement);
}
ChannelInterface.prototype = new ConnectableInterface();

/**
 */
ChannelInterface.prototype.initialize = function() {
	for (var i = 0; i < this.inputs.length; i++)
		this.inputs[i] = this.wiringGUI.getConnectableByQName(this.inputs[i].getQualifiedName());

	for (var i = 0; i < this.outputs.length; i++)
		this.outputs[i] = this.wiringGUI.getConnectableByQName(this.outputs[i].getQualifiedName());
}

/**
 * Checks whether a loop will be created if the given
 * <code>ChannelInterface</code> is connected to this
 * <code>ChannelInterface</code>.
 *
 * @param {ChannelInterface} channel
 */
ChannelInterface.prototype.isConnectable = function(channel) {
	return !channel._checkLoop(this, 100);
}

ChannelInterface.prototype._checkLoop = function(channel, depth) {
	if (depth <= 0)
		return false;

	if (this.outputs.indexOf(channel) == -1) {
		for (var i = 0; i < this.outputs.length; i++) {
			var currentChannel = this.outputs[i];
			if (!(currentChannel instanceof ChannelInterface)) // Loops can only be formed by channels
				continue;

			if (currentChannel._checkLoop(channel, depth - 1))
				return true;
		}
		return false;
	} else {
		return true;
	}
}

/**
 * Returns the anchor that represents the input anchor for this channel. This
 * anchor is an <code>OutConnectionAnchor</code> as it really acts as a target
 * for connections (as an Slot).
 *
 * @return {OutConnectionAnchor}
 */
ChannelInterface.prototype.getInputAnchor = function() {
	return this.inAnchor;
}

/**
 * Returns the anchor that represents the output anchor for this channel. This
 * anchor is an <code>InConnectionAnchor</code> as it really acts as a source
 * for connections (as an Event).
 *
 * @return {InConnectionAnchor}
 */
ChannelInterface.prototype.getOutputAnchor = function() {
	return this.outAnchor;
}

ChannelInterface.prototype.getFriendCode = function() {
	return "";
}

ChannelInterface.prototype.setName = function(newName) {
	this.name = newName;
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

ChannelInterface.prototype._getFilterParams = function () {
	// No filter, no params
	if (this.filter == null)
		return;

	var fParams = {};
	var params = this.filter.getParams();
	var valueNodes = this.paramValueLayer.childNodes;
	for (var i = 0; i < valueNodes.length; i++) {
		fParams[params[i].getIndex()] = valueNodes[i].textContent;
	}

	return fParams;
}

/**
 * @private
 *
 * Builds/Rebuilds the filter params interface.
 * @param {ChannelInterface} channel
 * @param {Filter} filter
 * @param {}
 */
ChannelInterface.prototype._showFilterParams = function () {
	// No filter, no params
	if (this.filter == null)
		return;

	// Adds a new row for each param of the current filter
	var params = this.filter.getParams();
	for (var p = 0; p < params.length; p++) {
		this.paramLabelLayer.appendChild(params[p].createHtmlLabel());
		this.paramValueLayer.appendChild(params[p].createHtmlValue(this.wiringGUI, this, this.valueElement));
	}
}

/**
 * Updates the interface according to the new filter.
 *
 * @private
 */
ChannelInterface.prototype._updateFilterInterface = function() {
	// Removes the params of the previous filter
	this.paramLabelLayer.textContent = "";
	this.paramValueLayer.textContent = "";

	// Sets the filter name
	if (this.filter == null) {
		this.filterInput.textContent = gettext("None");
	} else {
		this.filterInput.textContent = this.filter.getLabel();
	}

	// Sets the channel value and the channel filter params
	this.valueElement.update(this.getValueWithoutFilter());
	this._showFilterParams();
}

ChannelInterface.prototype.setFilter = function(filter) {
	this.filter = filter;
	this.filterParams = new Array ();

	// Sets parameter values by default
	if (this.filter != null) {
		var paramDefinition = this.filter.getParams();
		this.filterParams = new Array (paramDefinition.length);
		for (var p = 0; p < paramDefinition.length; p++) {
			var defaultaValue = paramDefinition[p].getDefaultValue();
			if ((defaultaValue == null) || (defaultaValue == "") || defaultaValue.match(/^\s$/)) {
				this.filterParams[p] = "";
			} else {
				this.filterParams[p] = defaultaValue;
			}
		}
	}

	this._updateFilterInterface()
}

ChannelInterface.prototype.getFilterParams = function() {
	return this.filterParams;
}

ChannelInterface.prototype.getValue = function() {
	if (this.connectable) {
		return this.connectable.getValue();
	} else {
		return gettext("undefined"); // TODO
	}
}

ChannelInterface.prototype.getValueWithoutFilter = function() {
	if (this.connectable) {
		return this.connectable.getValueWithoutFilter();
	} else {
		return gettext("undefined"); // TODO
	}
}

/**
 * @param {Wiring} wiring
 * @param {Number} phase current phase:
 *                 1 -> Creation
 *                 2 -> Updating
 */
ChannelInterface.prototype.commitChanges = function(wiring, phase) {
	var i;

	switch (phase) {
	case 1: // Creation
		if (this.connectable == null)
			this.connectable = wiring.createChannel(this.name);
		break;
	case 2: // Updates
		// Update channel name
		this.connectable._name= this.name;

		// Update filter and filter params
		this.connectable.setFilter(this.filter);
		this.connectable.setFilterParams(this._getFilterParams());

		// Inputs for removing
		for (i = 0; i < this.inputsForRemoving.length; i++)
			this.inputsForRemoving[i].getConnectable().disconnect(this.connectable);

		this.inputsForRemoving.clear();

		// Outputs for removing
		for (i = 0; i < this.outputsForRemoving.length; i++)
			this.connectable.disconnect(this.outputsForRemoving[i].getConnectable());

		this.outputsForRemoving.clear();

		// Outputs for adding
		for (i = 0; i < this.outputsForAdding.length; i++)
			this.connectable.connect(this.outputsForAdding[i].getConnectable());

		this.outputsForAdding.clear();

		// Inputs for adding
		for (i = 0; i < this.inputsForAdding.length; i++)
			this.inputsForAdding[i].getConnectable().connect(this.connectable);

		this.inputsForAdding.clear();
		break;
	}
}

/**
 * Returns whether this ChannelInterface represents a channel currently existing
 * in the wiring module.
 *
 * @return {Boolean} true if this ChannelInterface represents a channels that
 * exists in the wiring module.
 */
ChannelInterface.prototype.exists = function() {
	return this.connectable != null;
}

ChannelInterface.prototype.check = function() {
	this.htmlElement.addClassName("selected");
	this.channelNameInput.focus();
}

ChannelInterface.prototype.uncheck = function() {
	this.htmlElement.removeClassName("selected");
	this.channelNameInput.blur();
}

ChannelInterface.prototype.getHTMLElement = function() {
	return this.htmlElement;
}

/**
 * Marks this ChannelInterface for deletion. All the connections with other
 * connectables will be disconnected. As all the operations over Connectable
 * Interfaces, it wont be reflected on the wiring module until the changes were
 * commited.
 */
ChannelInterface.prototype.remove = function() {
	var inputs = this.inputs.clone();
	for (var i = 0; i < inputs.length; i++) {
		var input = inputs[i];
		this.disconnectInput(input);
		if (input instanceof ChannelInterface)
			input.disconnectOutput(this);
	}

	var outputs = this.outputs.clone();
	for (var i = 0; i < outputs.length; i++) {
		var output = outputs[i];
		this.disconnectOutput(output);
		if (output instanceof ChannelInterface)
			output.disconnectInput(this);
	}
}

/**
 * @param {ConnectableInterface} interface connectable to connect as input for
 *        this Channel.
 */
ChannelInterface.prototype.connectInput = function(interface) {
	if (interface instanceof ChannelInterface) {
		this.inputs.push(interface);
		return;
	}

	if (this.connectable != null &&
		this.connectable.inputs.elementExists(interface.getConnectable())) {
		this.inputsForRemoving.remove(interface);
	} else {
		this.inputsForAdding.push(interface);
	}
	this.inputs.push(interface);
}

/**
 * @param {ConnectableInterface} interface connectable to disconnect as input
 *        for this Channel.
 */
ChannelInterface.prototype.disconnectInput = function(interface) {
	if (interface instanceof ChannelInterface) {
		this.inputs.remove(interface);
		return;
	}

	if (this.connectable != null &&
		this.connectable.inputs.elementExists(interface.getConnectable())) {
		this.inputsForRemoving.push(interface);
	} else {
		this.inputsForAdding.remove(interface);
	}
	this.inputs.remove(interface);
}

/**
 * @param {ConnectableInterface} interface connectable to connect as output for
 *        this Channel.
 */
ChannelInterface.prototype.connectOutput = function(interface) {
	if (this.connectable != null &&
		this.connectable.outputs.elementExists(interface.getConnectable())) {
		this.outputsForRemoving.remove(interface);
	} else {
		this.outputsForAdding.push(interface);
	}
	this.outputs.push(interface);
}

/**
 * @param {ConnectableInterface} interface connectable to disconnect as output
 *        for this Channel.
 */
ChannelInterface.prototype.disconnectOutput = function(interface) {
	if (this.connectable != null &&
		this.connectable.outputs.elementExists(interface.getConnectable())) {
		this.outputsForRemoving.push(interface);
	} else {
		this.outputsForAdding.remove(interface);
	}
	this.outputs.remove(interface);
}

/**
 * This method ensures that this object does not reference to other objects,
 * avoiding circual references and allowing to the garbage collector to remove
 * they from memory.
 */
ChannelInterface.prototype.destroy = function() {
	this.wiringGUI = null;
}

/**
 * @abstract
 * This class is the base for the simple connectable interfaces. For now, this
 * basic interfaces are the ones for the slots and the events of the igadgets.
 *
 * @param {wConnectable} connectable
 * @param {ConnectableAnchor} anchor
 * @param {ConnectableGroupInterface} group
 */
function SimpleConnectableInterface (connectable, anchor, group) {
	// Allow hierarchy
	if (arguments.length == 0)
		return;

	this.connected = false;

	ConnectableInterface.call(this, connectable, anchor);
	this.parentInterface = group;
	this.htmlElement = document.createElement("div");

	this.htmlElement.appendChild(document.createTextNode(connectable.getLabel()));

	var chkItem = anchor.getHTMLElement();
	this.htmlElement.appendChild(chkItem);

	var context = {chkItemAnchor: anchor, wiringGUI:this.wiringGUI};
	Event.observe(chkItem,
		"click",
		function () {
			this.wiringGUI._changeConnectionStatus(this.chkItemAnchor);
		}.bind(context));

	// Harvest info about the friendCode of the connectable
	var friendCode = connectable.getFriendCode();
	if (friendCode != null) {
		var context = {friendCode: friendCode, wiringGUI:this.wiringGUI};

		this.htmlElement.addEventListener("mouseover",
			function () {
				this.wiringGUI._highlight_friend_code(this.friendCode, true);
			}.bind(context),
			false);

		this.htmlElement.addEventListener("mouseout",
			function () {
				this.wiringGUI._highlight_friend_code(this.friendCode, false);
			}.bind(context),
			false);
	}

	// Cancel bubbling of forceToggle
	function cancelbubbling(e) {
		Event.stop(e);
	}

	this.htmlElement.addEventListener("click", cancelbubbling, false);
}
SimpleConnectableInterface.prototype = new ConnectableInterface();

SimpleConnectableInterface.prototype.getFriendCode = function() {
	return this.connectable.getFriendCode();
}

SimpleConnectableInterface.prototype.getHTMLElement = function() {
	return this.htmlElement;
}

SimpleConnectableInterface.prototype._increaseConnections = function() {
	if (this.connected == true) {
		// TODO log
		return;
	}

	this.connected = true;
	this.parentInterface._increaseConnections();
}

SimpleConnectableInterface.prototype._decreaseConnections = function() {
	if (this.connected == false) {
		// TODO log
		return;
	}

	this.connected = false;
	this.parentInterface._decreaseConnections();
}

SimpleConnectableInterface.prototype.makeVisible = function() {
	this.parentInterface.makeVisible();
}

/**
 * This class corresponds with the interface to represent an Slot into the
 * wiring Interface.
 *
 * @param {WiringInterface} wiringGUI
 * @param {wSlot} connectable
 * @param {ConnectableGroupInterface} group
 */
function SlotInterface(wiringGUI, connectable, group) {
	this.chkItemAnchor = new SlotConnectionAnchor(this);
	this.wiringGUI = wiringGUI;

	SimpleConnectableInterface.call(this, connectable, this.chkItemAnchor, group);
	this.wiringGUI._registerSlot(this);
}
SlotInterface.prototype = new SimpleConnectableInterface();

/**
 * This class corresponds with the interface to represent an Event into the
 * wiring Interface.
 *
 * @param {WiringInterface} wiringGUI
 * @param {wSlot} connectable
 * @param {ConnectableGroupInterface} group
 */
function EventInterface(wiringGUI, connectable, group) {
	this.chkItemAnchor = new EventConnectionAnchor(this);
	this.wiringGUI = wiringGUI;

	SimpleConnectableInterface.call(this, connectable, this.chkItemAnchor, group);
	this.wiringGUI._registerEvent(this);
}
EventInterface.prototype = new SimpleConnectableInterface();

////////////////////////////////////////////////////////////
//       SLOT AND EVENT INTERFACE OF THE IGADGETS         //
////////////////////////////////////////////////////////////

/**
 * @class
 *
 * This class represents the interface that groups all the slots of a given
 * IGadget.
 */
function IGadgetSlotsInterface (igadget, wiringGUI, parentInterface) {
	ConnectableGroupInterface.call(this, wiringGUI, parentInterface, igadget.name);
	this.htmlElement.addClassName("igadget");

	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	// Create Slot interfaces for the slots of this igadget
	for (var i = 0; i < connectables.length; i++) {
		var connectable = connectables[i];
		if (!(connectable instanceof wSlot))
			continue;

		var interface = new SlotInterface(wiringGUI, connectable, this);

		// Insert the HTMLElement of the SlotInterface
		this.contentElement.appendChild(interface.getHTMLElement());
		this.empty = false;
	}

	if (this.empty == false) {
		this.parentInterface._notifyNewEmptyStatus(this, false);
		this.htmlElement.removeClassName("empty");
	}
}
IGadgetSlotsInterface.prototype = new ConnectableGroupInterface();

IGadgetSlotsInterface.prototype.repaintSiblings = function() {
	if (this.wiringGUI.currentChannel == null)
		return;

	this.wiringGUI._uncheckChannelOutputs(this.wiringGUI.currentChannel);
	this.wiringGUI._highlightChannelOutputs(this.wiringGUI.currentChannel);
}

IGadgetSlotsInterface.prototype._increaseConnections = function() {
	if (this.connections == 0)
		this.htmlElement.addClassName("unfoldable");

	ConnectableGroupInterface.prototype._increaseConnections.call(this);
}

IGadgetSlotsInterface.prototype._decreaseConnections = function() {
	ConnectableGroupInterface.prototype._decreaseConnections.call(this);

	if (this.connections == 0)
		this.htmlElement.removeClassName("unfoldable");
}

/**
 * @class
 *
 * This class represents the interface that groups all the events of a given
 * IGadget.
 */
function IGadgetEventsInterface (igadget, wiringGUI, parentInterface) {
	ConnectableGroupInterface.call(this, wiringGUI, parentInterface, igadget.name);
	this.htmlElement.addClassName("igadget");

	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	// Create Event interfaces for the events of this igadget
	for (var i = 0; i < connectables.length; i++) {
		var connectable = connectables[i];
		if (!(connectable instanceof wEvent))
			continue;

		var interface = new EventInterface(wiringGUI, connectable, this);

		// Insert the HTMLElement of the Event Interface
		this.contentElement.appendChild(interface.getHTMLElement());
		this.empty = false;
	}

	if (this.empty == false) {
		this.parentInterface._notifyNewEmptyStatus(this, false);
		this.htmlElement.removeClassName("empty");
	}
}
IGadgetEventsInterface.prototype = new ConnectableGroupInterface();

IGadgetEventsInterface.prototype.repaintSiblings = function() {
	if (this.wiringGUI.currentChannel == null)
		return;

	this.wiringGUI._uncheckChannelInputs(this.wiringGUI.currentChannel);
	this.wiringGUI._highlightChannelInputs(this.wiringGUI.currentChannel);
}

IGadgetEventsInterface.prototype._increaseConnections = function() {
	if (this.connections == 0)
		this.htmlElement.addClassName("unfoldable");

	ConnectableGroupInterface.prototype._increaseConnections.call(this);
}

IGadgetEventsInterface.prototype._decreaseConnections = function() {
	ConnectableGroupInterface.prototype._decreaseConnections.call(this);

	if (this.connections == 0)
		this.htmlElement.removeClassName("unfoldable");
}

/**
 *
 */
function ConnectableColumnInterface(htmlElement) {
	this.childConnectableGroups = [];
	this.htmlElement = htmlElement;
}
ConnectableColumnInterface.prototype.isAnyFolded = ConnectableGroupInterface.prototype.isAnyFolded;
ConnectableColumnInterface.prototype.massiveToggle = ConnectableGroupInterface.prototype.massiveToggle;

ConnectableColumnInterface.prototype.massiveExpand = function (userAction) {
	for (var i = 0; i < this.childConnectableGroups.length; i++)
		this.childConnectableGroups[i].massiveExpand(userAction);
}

ConnectableColumnInterface.prototype.massiveFold = function (userAction) {
	for (var i = 0; i < this.childConnectableGroups.length; i++)
		this.childConnectableGroups[i].massiveFold(userAction);
}

ConnectableColumnInterface.prototype.add = function(group) {
	this.htmlElement.appendChild(group.getHTMLElement());
	this.childConnectableGroups.push(group);
}
