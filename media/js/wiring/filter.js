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

// This class represents the parameter that a filter can have
function Param (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.Param = function (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.getName = function() {
  return this._name;
}

Param.prototype.getType = function() {
  return this._type;
}

Param.prototype.getLabel = function() {
  return this._label;
}

Param.prototype.getIndex = function() {
  return this._index;
}

Param.prototype.getDefaultValue = function() {
  return this._defaultValue;
}

Param.prototype.createHtmlLabel = function() {
  var labelLayer = document.createElement("div");
  var img = document.createElement("img");
  img.setAttribute("src", "/ezweb/images/param.png");
  labelLayer.appendChild(img);
  labelLayer.appendChild(document.createTextNode(this._label + ':'));
  
  return labelLayer;
}

Param.prototype.createHtmlValue = function(wiringGUI, channel, valueElement){
  var context = {wiringGUI:wiringGUI, channel:channel, filter:channel.getFilter(), param:this, valueElement:valueElement};
  
  var paramValueLayer = document.createElement("div");
  var paramInput = document.createElement("input");
  paramInput.addClassName("paramValueInput");
  paramInput.setAttribute ("value", channel.getFilterParams()[this._index]);
  Event.observe(paramInput, 'click',function(e){Event.stop(e);});
  
  var checkResult = 
  	function(e){
    	var msg;
		if(e.target.value == "" || e.target.value.match(/^\s$/)){
	    	msg = interpolate(gettext("Filter param named '%(filterName)s' cannot be empty."), {filterName: this.param._label}, true);
			this.wiringGUI.showMessage(msg);
			this.valueElement.appendChild(document.createTextNode(gettext('undefined')));
			return;			
    	} 
		
		// Sets the param value
		this.channel.getFilterParams()[this.param._index] = e.target.value;
		
		// Sets the channel value
		this.valueElement.childNodes[0].nodeValue = channel.getValue();
		
		// Shows a message (only with error)
		if (this.channel.getFilter().getlastExecError() == null){
			this.wiringGUI.clearMessages();			
		}else{
			this.wiringGUI.showMessage(this.channel.getFilter().getlastExecError());
			this.valueElement.childNodes[0].nodeValue = gettext('undefined');
		}
    };
	
  // Sets the input
  Event.observe(paramInput, 'change', checkResult.bind(context));
  paramValueLayer.appendChild(paramInput);
  return paramValueLayer;
}

// This class represents the filter of the a channel
function Filter (id_, name_, label_, nature_, code_, category_, params_, helpText_) {
  this._id = id_;
  this._name = name_;
  this._label = label_;
  this._nature = nature_;
  this._params = new Array();
  this._lastExecError = null;
  this._category = category_;
  this._helpText = helpText_;
  
  // Sets the filter parameters
  this.processParams (params_); 
  
  // Sets the filter code
  try{
	if ((nature_ == 'USER') && ((typeof code_) != 'function')){
		this._code = null;
	}else{
		this._code = eval ('(' + code_ + ')');		
	}
  }catch(e){
	var msg = interpolate(gettext("Error loading code of the filter '%(filterName)s'."), {filterName: this._label}, true);
	LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
  }
}

Filter.prototype.getId = function() {
  return this._id;
}

Filter.prototype.getName = function() {
  return this._name;
}

Filter.prototype.getLabel = function() {
  return this._label;
}

Filter.prototype.getParams = function() {
  return this._params;
}

Filter.prototype.getlastExecError = function() {
  return this._lastExecError;
}

Filter.prototype.setParam = function(param_) {
  this._params[param_.getIndex()] = param_;
}

Filter.prototype.hasParams = function() {
  return this._params.length != 0;
}

Filter.prototype.getCategory = function() {
  return this._category;
}

Filter.prototype.getHelpText = function() {
  return this._helpText;
}

Filter.prototype.processParams = function(params_) {
  this._params = new Array();
  if (params_ != null){
  	var fParam, paramObject;
  	var jsonParams = eval (params_);  
  	for (var i = 0; i < jsonParams.length; i++) {
		fParam = jsonParams[i];
		if (fParam.type == 'jpath'){
			paramObject = new JPathParam (fParam.name, fParam.label, fParam.index, fParam.defaultValue);
		} else {
			paramObject = new Param(fParam.name, fParam.label, fParam.type, fParam.index, fParam.defaultValue);						
		}
		this.setParam(paramObject);  
  	}
  } 	
}

Filter.prototype.run = function(channelValue_, paramValues_) {
	var i, msg, params = '';

	// Begins to run, no errors
	this._lastExecError = null;
	
//	// Creates the varible for the channel value
//	eval ("var channelValue = '" + channelValue_ + "';");
	
	try{
		// Creates the variables for other params
		for (i=0; i < this._params.length; ++i){ 
			if (i!=0)
				params += ',';
			// Checks the type of parameter
			switch (this._params[i].getType()){
			case 'N': // Param is Number
				var interger_value = parseInt(paramValues_[i]);
				if (isNaN(interger_value)){
					msg = interpolate(gettext("Error loading parameter '%(paramName)s' of the filter '%(filterName)s'. It must be a number"), 
						{paramName: this._params[i].getLabel(), filterName: this._label}, true);
					LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
					this._lastExecError = msg;
					return gettext('undefined');
				}
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break; 
			case 'regexp': // Param is RegExp
				if ((paramValues_[i].indexOf('/') == 0) && (paramValues_[i].lastIndexOf('/') > 0)){
					var current_pattern = paramValues_[i].substring(1, paramValues_[i].lastIndexOf('/'));
					var current_modifiers = paramValues_[i].substring(paramValues_[i].lastIndexOf('/') + 1, paramValues_[i].length);
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + current_pattern + "', '" + current_modifiers + "');");	
				}else {
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + paramValues_[i] + "');");
				}
				params += this._params[i].getName();
				break;
			case 'jpath': // Param is a JPATH expresion (for JSON)
				var jpath_exp = this._params[i].parse(paramValues_[i]);
				eval ("var " + this._params[i].getName() + " = this._params[i].parse(paramValues_[i]);");
				params += this._params[i].getName();
				break;
			default: // Otherwise is String
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break;
			}

		}
	}catch(e){
		msg = interpolate(gettext("Error loading param '%(paramName)s' of the filter '%(filterName)s': %(error)s."), 
			{paramName: this._params[i].getLabel(), filterName: this._label, error: e}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		this._lastExecError = msg;
		return gettext('undefined');
	}
	
	try{
	
		// Exeutes the filter code
		switch(this._nature){
			case "NATIVE":
				return eval ('channelValue_.' + this._name + '(' + params + ');');
				break;
			case "JSLIB":
				if (params != '')
					params = ',' + params;
				return eval (this._name + '(channelValue_' + params + ');');
				break;
			case "USER":
				if (params != '')
					params = ',' + params;
				return eval ('this._code(channelValue_' + params + ');');
				break;
			default:
				break;
		}
	
	}catch(e){
		var msg = interpolate(gettext("Error executing code of the filter '%(filterName)s'."), {filterName: this._Label}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		// Saves the message (for wiring interface)
		if (this._params.length == 0){
			this._lastExecError = msg;
		}else{
			this._lastExecError = interpolate(gettext("Error executing code of the filter '%(filterName)s'. Check the parametres."), {filterName: this._label}, true);
		}
		return gettext('undefined');
	}
}