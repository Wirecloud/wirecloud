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
 * abstract
 * @author aarranz
 */
function UserPref(varName_, label_, desc_, defaultValue_) {
	this.varName = null;
	this.label = null;
	this.desc = null;
	this.defaultValue = null;
}

UserPref.prototype.UserPref = function (varName_, label_, desc_, defaultValue_) {
	this.varName = varName_;
	this.label = label_;
	this.desc = desc_;

	if ((defaultValue_ == null) || (defaultValue_ == undefined))
		this.defaultValue = "";
	else
		this.defaultValue = defaultValue_;
}

UserPref.prototype.getVarName = function () {
	return this.varName;
}

UserPref.prototype.validate = function (newValue) {
	return true;
}

UserPref.prototype.getCurrentValue = function (varManager, iGadgetId) {
	var variable = varManager.getVariableByName(iGadgetId, this.varName);
	return variable.get();
}

//Set value and invoke callback function
UserPref.prototype.setValue = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.set(newValue);
	}
}

//Set new variable but it doesn't invoke callback function
UserPref.prototype.annotateValuea = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.annotate(newValue);
	}
}

UserPref.prototype.setToDefault = function (varManager, iGadgetId) {
	this.setValue(varManager, this.defaultValue);
}

UserPref.prototype.getValueFromInterface = function (element) {
	return element.value;
}

UserPref.prototype.setDefaultValueInInterface = function (element) {
	element.value = this.defaultValue;
}

UserPref.prototype.getLabel = function () {
	var label = document.createElement("label");
	label.appendChild(document.createTextNode(this.label));
	label.setAttribute("title", this.desc);
	label.setAttribute("for", this.varName);

	return label;
}

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////
UserPref.prototype.TEXT    = "S"; // "S"tring
UserPref.prototype.INTEGER = "N"; // "N"umber
UserPref.prototype.DATE    = "D"; // "D"ate
UserPref.prototype.LIST    = "L"; // "L"ist
UserPref.prototype.BOOLEAN = "B"; // "B"oolean
UserPref.prototype.PASSWORD = "P"; // "P"assword

/**
 * extends UserPref
 * @author aarranz
 */
function ListUserPref(name_, label_, desc_, defaultValue_, ValueOptions_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
	this.options = ValueOptions_;
	this.optionHash = null;
}

ListUserPref.prototype = new UserPref();

ListUserPref.prototype.makeInterface = function (varManager, iGadgetId) {
	var select;

	select = document.createElement("select");
	select.setAttribute("name", this.varName);

	var currentValue = this.getCurrentValue(varManager, iGadgetId);
	var output = "";
	for (var i = 0; i < this.options.length; i++) {
		output += "<option value=\"" + this.options[i][0] + "\"";

		if (currentValue == this.options[i][0]) output += " selected=\"selected\"";

		output += ">" + this.options[i][1] + "</option>";
	}
		
	select.innerHTML = output;

	return select;
}

ListUserPref.prototype.validate = function (newValue) {
	if (this.optionHash == null) {
		this.optionHash = new Hash();
		for (var i = 0; i < this.options.length; i++)
			this.optionHash[this.options[i][0]] = true;
	}

	return this.optionHash[newValue] != undefined;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function IntUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

IntUserPref.prototype = new UserPref();

IntUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

IntUserPref.prototype.validate = function (newValue) {
	return !isNaN(Number(newValue));
}

/**
 * extends UserPref
 * @autor aarranz
 */
function TextUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

TextUserPref.prototype = new UserPref();

TextUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function DateUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

DateUserPref.prototype = new UserPref();

DateUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function BoolUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

BoolUserPref.prototype = new UserPref();

BoolUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "checkbox");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue.strip().toLowerCase() == "true")
		element.setAttribute("checked", "true");

	return element;
}

BoolUserPref.prototype.getValueFromInterface = function(element) {
	return element.checked ? "true" : "false";
}

/**
 * extends UserPref
 * @autor fabio
 */
function PasswordUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

PasswordUserPref.prototype = new UserPref();

PasswordUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "password");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

