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
 * This class has the common properties of every connectable object of the wiring module.
 * The other connectable classes from the wiring module will inherit from this class.
 *
 * @param name name of the connectable
 * @param type data type managed by this connectable
 * @param friendCode friendCode of this connectable
 * @param id id of this connectable
 */
function wConnectable (name, type, friendCode, id) {
	this.id = id;
	this._name = name;
	this._type = type;
	this._friendCode = friendCode;
}

/**
 * @private
 *
 * Stablish a new value for this <code>wConnectable</code> but without
 * propagating any event.
 */
wConnectable.prototype._annotate = function() {
	var funcName = '_annotate';
	var msg = gettext("Unimplemented function: %(funcName)s");
	msg = interpolate(msg, {funcName: funcName}, yes);
	LogManagerFactory.getInstance().log(msg);
	return;
}

wConnectable.prototype.getType = function() {
	return this.type;
}

wConnectable.prototype.getValue = function() {
	var funcName = 'getValue';
	var msg = gettext("Unimplemented function: %(funcName)s");
	msg = interpolate(msg, {funcName: funcName}, yes);
	LogManagerFactory.getInstance().log(msg);
	return;
}

wConnectable.prototype.getName = function() {
	return this._name;
}

wConnectable.prototype.getId = function() {
	return this.id;
}

wConnectable.prototype.getFriendCode = function() {
	return this._friendCode;
}

/**
 * Disconnects this <code>wConnectable</code> from all the
 * <code>wConnectables</code> this is connected to.
 */
wConnectable.prototype.fullDisconnect = function() {
	var funcName = 'fullDisconnect';
	var msg = gettext("Unimplemented function: %(funcName)s");
	msg = interpolate(msg, {funcName: funcName}, yes);
	LogManagerFactory.getInstance().log(msg);
	return;
}

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
wConnectable.prototype.destroy = function () {
	this.fullDisconnect();
}



/**
 * @abstract
 *
 * This class represents every object in which the transmission is ended
 */
function wOut(name, type, friendCode, id) {
	wConnectable.call(this, name, type, friendCode, id);
	this.inouts = new Array();
}

wOut.prototype = new wConnectable();

wOut.prototype._annotate = function(value) {
	this.variable.annotate(value);
}

/**
 * @private
 *
 * This method must be used only by the connectables code. If you like to
 * connect an wOut to an wInOut, you should call to the connect method of the
 * wInOut intance.
 */
wOut.prototype._addInput = function(inout) {
	this.inouts.push(inout);
}

/**
 * @private
 *
 * This method must be used only by connectables code. If you like to disconnect
 * an wOut from an wInOut, you should call to the disconnect method of the wInOut
 * intance.
 */
wOut.prototype._removeInput = function(inout) {
	inout._removeOutput(this);
	this.inouts.remove(inout);
}

wOut.prototype.fullDisconnect = function() {
	// Disconnecting inouts
	var inouts = this.inouts.clone();
	for (var i = 0; i < inouts.length; ++i)
		inouts[i].disconnect(this);
}

wOut.prototype.refresh = function() {
}

/**
 * @abstract
 *
 * This class represents every object which may initialize one transmission
 * through the wiring module.
 *
 * @param name
 * @param type
 * @param friendCode
 * @param id
 */
function wIn(name, type, friendCode, id) {
	wConnectable.call(this, name, type, friendCode, id);
	this.outputs = new Array();
  this.changed = false;
}
wIn.prototype = new wConnectable();

wIn.prototype.connect = function(out) {
	this.outputs.push(out);

	//if (out instanceof wInOut)
		out._addInput(this);
}

wIn.prototype.disconnect = function(out) {
	if (this.outputs.getElementById(out.getId()) == out) {
		if (out instanceof wInOut)
			out._removeInput(this);

		this.outputs.remove(out);
	}
}

wIn.prototype.fullDisconnect = function() {
	// Outputs
	var outputs = this.outputs.clone();
	for (var i = 0; i < outputs.length; ++i)
		this.disconnect(outputs[i]);
}

/**
 * Sets the value for this <code>wIn</code>. Also, this method propagates this
 * new value to the output connectables.
 */
wIn.prototype.propagate = function(value, initial) {
	for (var i = 0; i < this.outputs.length; ++i)
		this.outputs[i]._annotate(value);

	for (var i = 0; i < this.outputs.length; ++i)
		this.outputs[i].propagate(value, initial, this);
}

wIn.prototype.refresh = function() {
}

/**
 * @abstract
 * This class represents every object which may transmit some data.
 *
 * @param name
 * @param type
 * @param friendCode
 * @param id
 */
function wInOut(name, type, friendCode, id) {
	wIn.call(this, name, type, friendCode, id);

	this.inputs = new Array();
	this.modified_inputs_state = new Array();
}
wInOut.prototype = new wIn();

/**
 * Checks whether a loop will be created if the given <code>wInOut</code> is
 * connected to this <code>wInOut</code>.
 *
 * @param {wInOut} inout
 */
wInOut.prototype.isConnectable = function(inout) {
	return inout != this && !inout._checkLoop(this, 100);
}

wInOut.prototype._checkLoop = function(inout, depth) {
	if (depth <= 0)
		return false;

	if (this.outputs.indexOf(inout) == -1) {
		for (var i = 0; i < this.outputs.length; i++) {
			var currentInout = this.outputs[i];
			if (!(currentInout instanceof wInOut)) // Loops can only be formed by channels
				continue;

			if (currentInout._checkLoop(inout, depth - 1))
				return true;
		}
		return false;
	} else {
		return true;
	}
}

/**
 * @private
 *
 * Stablish a new value for this <code>wConnectable</code> but without
 * propagating any event.
 */
wInOut.prototype._annotate = function(value) {
	for (var i = 0; i < this.outputs.length; ++i)
		this.outputs[i]._annotate(value);
}

wInOut.prototype.connect = function(out) {
	wIn.prototype.connect.call(this, out);
}

wInOut.prototype._addInput = function(wIn) {
	this.inputs.push(wIn);
	this.modified_inputs_state.push(false);
}

wInOut.prototype._removeInput = function(wIn) {
	if (this.inputs.getElementById(wIn.getId()) == wIn) {

		var input_position = this.inputs.indexOf(wIn);
		this.inputs.remove(wIn);

		this.modified_inputs_state.splice(input_position, 1);
	}
}

wInOut.prototype._removeOutput = function(wOut) {
	if (this.outputs.getElementById(wOut.getId()) == wOut)
		this.outputs.remove(wOut);
}

wInOut.prototype.fullDisconnect = function() {
	// Inputs
	var inputs = this.inputs.clone();
	for (var i = 0; i < inputs.length; ++i)
		inputs[i].disconnect(this);

	// Outputs
	var outputs = this.outputs.clone();
	for (var i = 0; i < outputs.length; ++i)
		this.disconnect(outputs[i]);
}

/**
 * This class represents a iGadget variable which may produce some data (also
 * know as event)
 *
 * @param variable
 * @param type
 * @param friendCode
 * @param id
 */
function wEvent(variable, type, friendCode, id) {
	this.variable = variable;
	wIn.call(this, this.variable.name, type, friendCode, id);
	this.variable.assignConnectable(this);
}

wEvent.prototype = new wIn();

wEvent.prototype.getQualifiedName = function () {
	return "event_" + this.variable.id;
}

wEvent.prototype.getLabel = function () {
	return this.variable.label;
}

wEvent.prototype.getValue = function() {
  return this.variable.get();
}

/**
 * This class represents a <code>wConnectable</code> whose only purpose is to
 * redistribute the data produced by an wIn object.
 *
 * @param variable
 * @param name
 * @param id
 * @param provisional_id
 */
function wChannel (variable, name, id, provisional_id) {
	this.variable = variable;
	this.provisional_id=provisional_id;
	wInOut.call(this, name, null, null, id);
	this.variable.assignConnectable(this);
	this.filter = null;
	this.filterParams = new Array();
	this.remoteSubscription = null;
}
wChannel.prototype = new wInOut();

wChannel.prototype.getValue = function(propagating) {
	if (this.filter == null)
		return this.variable.get();
	else{
		try{
			var value = this.filter.run(this.variable.get(), this.filterParams, this);
			if(!propagating && (this.getFilter().getlastExecError() != null)) {
				LayoutManagerFactory.getInstance().showMessageMenu(this.getFilter().getlastExecError(), Constants.Logging.WARN_MSG);
			}
			return value;
			
		}catch (e){
			if(e.name == "DONT_PROPAGATE"){
				if(propagating)
					throw new DontPropagateException(e)
				else
					return gettext("undefined");
			}
		}
	}
}

wChannel.prototype.getValueWithoutFilter = function() {
	return this.variable.get();
}

wChannel.prototype.getFilter = function() {
	return this.filter;
}

wChannel.prototype.getRemoteSubscription = function() {
	return this.remoteSubscription;
}

wChannel.prototype.setRemoteSubscription = function(remoteSubscription) {
	this.remoteSubscription = remoteSubscription;
}

wChannel.prototype.is_remote_channel = function() {
	return this.remoteSubscription.is_active();
}

wChannel.prototype.setFilter = function(newFilter) {
	this.filter = newFilter;
	this.filterParams = new Array();
}

/**
 * @param {fParamsHash} fParams
 */
wChannel.prototype.setFilterParams = function(fParams) {
	this.filterParams = fParams;
}

/**
 */
wChannel.prototype.setFilterParam = function(index, value) {
	this.filterParams[index]['value'] = value;
}

wChannel.prototype.getFilterParams = function() {
	return this.filterParams;
}

/**
 * @private
 */
wChannel.prototype._getJSONInput = function() {
	var json = new Hash();

	for (var i = 0; i < this.inputs.length; i++) {
		json[this.inputs[i].getName()] = this.inputs[i].getValue();
	}

	return json;
}

/**
 * @param newValue new value for this <code>wChannel</code>
 * @param {Boolean} initial true for initial propagations
 * @param {wIn} source connectable the new value comes from.
 */
wChannel.prototype.propagate = function(newValue, initial, source) {
	if (!initial)
		this._markInputAsModified(source);
	else
		this._markAllInputsAsModified(source);
		
	this.variable.set(newValue);
	
	try {
		//getValue applys filter if needed!
		var filteredValue = this.getValue(propagating=true);
		this._unmarkAllInputsAsModified();
	}
	catch (err) {
		if (err.name == "DONT_PROPAGATE") {
			//Exception when getting value from channel => there is a filter
			//When a filter thorws an Exception, the propagation stops;
			return;
		}
		
		//Loggin error
		var msg = interpolate(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), {errorMsg: err.msg}, true);
		LogManagerFactory.getInstance().log(msg);
		return;
	}

	wInOut.prototype.propagate.call(this, filteredValue, initial);
}

wChannel.prototype.getQualifiedName = function () {
	return "channel_" + this.id;
}

/**
 * @private
 */
wChannel.prototype._markInputAsModified = function (input) {
	var input_position = this.inputs.indexOf(input);

	this.modified_inputs_state[input_position]=true;
}

/**
 * @private
 */
wChannel.prototype._unmarkAllInputsAsModified = function () {
	for (var i = 0; i < this.modified_inputs_state.length; i++) {
		this.modified_inputs_state[i] = false;
	}
}

/**
 * @private
 */
wChannel.prototype._markAllInputsAsModified = function () {
	for (var i = 0; i < this.modified_inputs_state.length; i++) {
		this.modified_inputs_state[i] = true;
	}
}

/**
 * @private
 */
wChannel.prototype._allInputsModified = function () {

	if(this.modified_inputs_state.length == 0)
		return false;

	for (var i = 0; i < this.modified_inputs_state.length; i++) {
		if (!this.modified_inputs_state[i])
			return false;
	}

	return true;
}

/**
 * This class represents a Tab as a possible target on the wiring module.
 */
function wTab (variable, name, tab, id) {
	this.variable = variable;
	this.tab = tab;
	this.variable.assignConnectable(this);
	wOut.call(this, name, null, null, id);
}
wTab.prototype = new wOut();

wTab.prototype.propagate = function(newValue, initial) {
	if (!initial)
		this.variable.set(newValue);
}

wTab.prototype.getQualifiedName = function () {
	return "tab_" + this.id;
}

/**
 * This class representents a iGadget variable which may receive some data.
 *
 * @param variable
 * @param type
 * @param friendCode
 * @param id
 */
function wSlot(variable, type, friendCode, id) {
	this.variable = variable;
	this.variable.assignConnectable(this);
	wOut.call(this, this.variable.name, type, friendCode, id);
}
wSlot.prototype = new wOut();

wSlot.prototype.propagate = function(newValue, initial) {
	this.variable.set(newValue);
}

wSlot.prototype.getQualifiedName = function () {
	return "slot_" + this.variable.id;
}

wSlot.prototype.getLabel = function () {
	return this.variable.label;
}

wSlot.prototype.refresh = function() {
	this.variable.refresh();
}