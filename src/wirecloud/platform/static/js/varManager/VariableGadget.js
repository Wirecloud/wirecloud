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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GADGETVARIABLE (Parent Class) <<GADGET>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function WidgetVariable (iWidgetId, name) {
	this.varManager = null;
	this.iWidgetId = null;
	this.name = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super keyboard emulation)
//////////////////////////////////////////////
WidgetVariable.prototype.WidgetVariable = function (iWidget_, name_) {
	this.varManager = OpManagerFactory.getInstance().activeWorkspace.getVarManager();

	this.iWidgetId = iWidget_;
	this.name = name_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

WidgetVariable.prototype.get = function() {
	return this.varManager.getVariable(this.iWidgetId, this.name);
}

WidgetVariable.prototype.set = function(value, options) { }

WidgetVariable.prototype.register = function(handler) { }

WidgetVariable.prototype.getFinalSlots = function() {
	var variable;

	variable = this.varManager.getVariableByName(this.iWidgetId, this.name);
	return variable.getFinalSlots();
}

WidgetVariable.prototype.getRef = function () {
	return this.iWidgetId + '/' + this.name;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWidgetVariable(iWidget_, name_, handler_) {
	WidgetVariable.prototype.WidgetVariable.call(this, iWidget_, name_);

	this.handler = handler_;

	this.register(handler_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWidgetVariable.prototype = new WidgetVariable;

//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RWidgetVariable.prototype.register = function (handler) {
	this.varManager.registerVariable(this.iWidgetId, this.name, handler);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWWidgetVariable(iWidget_, name_) {
	WidgetVariable.prototype.WidgetVariable.call(this, iWidget_, name_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWWidgetVariable.prototype = new WidgetVariable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////



//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RWWidgetVariable.prototype.set = function (value, options) {
	options = options ? options : {};
	options.initial = false; // Widgets cannot use the "initial" option
    if ('targetSlots' in options) {
        options.targetEndpoints = targetSlots;
    }

	this.varManager.setVariable(this.iWidgetId, this.name, value, options);
}
