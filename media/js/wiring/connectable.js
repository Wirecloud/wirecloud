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


//////////////////////////////////////////////////////////////////////////////////////////////////
// This is the class has the common properties of every connectable object of the wiring module //
// The other connectable classes from the wiring module will inherit from this class            //
//////////////////////////////////////////////////////////////////////////////////////////////////
function wConnectable (name, type, friendCode, id) {
  this.id = id;
  this._name = name;
  this._type = type;
  this._friendCode = friendCode;
  this.connectableType = null;
  this.view = null;
}

wConnectable.prototype.annotate = function() {}

wConnectable.prototype.getType = function() {
  return this.type;
}

wConnectable.prototype.getValue = function() {
  throw new Exception("Unimplemented function"); // TODO
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

wConnectable.prototype.setInterface = function(view) {
	this.view=view;
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
wConnectable.prototype.destroy = function () {
	this.fullDisconnect();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may be placed in the middle of a connection between a In object and wOut object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wOut(name, type, friendCode, id) {
   wConnectable.call(this, name, type, friendCode, id);
   this.connectableType = "out";
   this.inouts = new Array();
}

wOut.prototype = new wConnectable();

wOut.prototype.annotate = function(value) {
    this.variable.annotate(value);
}

wOut.prototype.addInOut = function(inout) {
	this.inouts.push(inout);
}

wOut.prototype.disconnect = function(inout) {
	inout._removeOutput(this);
    this.inouts.remove(inout);
}

wOut.prototype.fullDisconnect = function() {
  // Disconnecting inouts
  var inouts = this.inouts.clone();
  for (var i = 0; i < inouts.length; ++i)
    this.disconnect(inouts[i]);
}

wOut.prototype.refresh = function() {
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may initialize one transmission through the wiring module //
////////////////////////////////////////////////////////////////////////////////////////////////////////
function wIn(name, type, friendCode, id) {
  wConnectable.call(this, name, type, friendCode, id);
  this.outputs = new Array();
  this.connectableType = "in";
}

wIn.prototype = new wConnectable();

wIn.prototype.connect = function(out) {
  this.outputs.push(out);
  if (out instanceof wInOut)
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

wIn.prototype.propagate = function(value, initial) {
  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].annotate(value);

  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].propagate(value, initial);
}

wIn.prototype.refresh = function() {
}

/////////////////////////////////////////////////////////////////////
// This class represents every object which may transmit some data //
/////////////////////////////////////////////////////////////////////
function wInOut(name, type, friendCode, id) {
  wIn.call(this, name, type, friendCode, id);

  this.inputs = new Array();
  this.connectableType = "inout";
}

wInOut.prototype = new wIn();

wInOut.prototype.annotate = function(value) {
  for (var i = 0; i < this.outputs.length; ++i)
      this.outputs[i].annotate();
}	

wInOut.prototype.connect = function(out) {	
	wIn.prototype.connect.call(this, out);
	
	out.addInOut(this);
}

wInOut.prototype._addInput = function(wIn) {
  this.inputs.push(wIn);
}

wInOut.prototype._removeInput = function(wIn) {
  if (this.inputs.getElementById(wIn.getId()) == wIn)
	    this.inputs.remove(wIn);
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

// TODO implement this function
//wInOut.prototype.searchCycle = function(name)

// wChannel and wEvent (connectables that propagates values) register in their
// associated variable, a pointer to them
// Double-linked structure.

//////////////////////////////////////////////////////////////////////////
// This class represents a iGadget variable which may produce some data 
//////////////////////////////////////////////////////////////////////////
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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wChannel (variable, name, id, provisional_id) {
  this.variable = variable;
  this.provisional_id=provisional_id;
  wInOut.call(this, name, null, null, id);
  this.variable.assignConnectable(this);
  this.filter = null;
  this.filterParams = new Array();
}

wChannel.prototype = new wInOut();

wChannel.prototype.getValue = function() {
  if (this.filter == null)
	return this.variable.get();  	
  else
 	return this.filter.run(this.variable.get(), this.filterParams);
}

wChannel.prototype.getValueWithoutFilter = function() {
	return this.variable.get();  	
}

wChannel.prototype.getFilter = function() {
  return this.filter;
}

wChannel.prototype.setFilter = function(newFilter) {
  this.filter = newFilter;
}

wChannel.prototype.processFilterParams = function(fParamsJson_) {
  this.filterParams = new Array();
  if (fParamsJson_ != null){
  	var fParams = eval (fParamsJson_);
	for (var k = 0; k < fParams.length; k++) {
		this.filterParams[fParams[k].index] = fParams[k].value; 
  	}
  }
}

wChannel.prototype.setFilterParams = function(fParams) {
  this.filterParams = fParams;
}

wChannel.prototype.getFilterParams = function() {
  return this.filterParams;
}

wChannel.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
  wInOut.prototype.propagate.call(this, this.getValue(), initial);
}

wChannel.prototype.getQualifiedName = function () {
  return "channel_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wTab (variable, name, tab, id) {
  this.variable = variable;
  this.tab = tab;
  this.variable.assignConnectable(this);
  wOut.call(this, name, null, null, id);
}

wTab.prototype = new wOut();

wTab.prototype.propagate = function(newValue, initial) {
  if(!initial){
  	this.variable.set(newValue);
  }
}

wTab.prototype.getQualifiedName = function () {
  return "tab_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////
// This class representents a iGadget variable which may receive some data //
/////////////////////////////////////////////////////////////////////////////
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