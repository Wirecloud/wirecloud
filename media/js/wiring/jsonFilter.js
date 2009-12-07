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

// JPATH expression elements
function JPathToken (type_, value_) {
  	this._type = type_;
	this._value = value_;	
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This class represents a JPATH parameter
// JPATH is the language to access to JSON structures
function JPathParam (name_, label_, index_, required_, defaultValue_) {
	Param.prototype.Param.call(this, name_, label_, 'jpath', index_, required_, defaultValue_);
}

JPathParam.prototype = new Param;

// Especial characters are not "normal text"
JPathParam.prototype.isChar = function(char_) {
	
	switch(char_){
	case '[':
	case ']':
	case '.':
	case ':':
	case '\\':
	case '=':
	case '"':
		return false;
		break;
	default:
		return true;
		break;
	}
	
}

// Main method to parse a JPATH expression
JPathParam.prototype.parse = function(text_) {
	
	var tokens = new Array();
	var iter = text_.length;
	var index = 0;
	var state = 1;
	
	do {
	
		if ((text_.charAt(index) == "") && (state != 1)) {
			throw "Unexpected end of expression";
		} 
		
		switch(state){
		case 1:
			switch(text_.charAt(index)){
				case '\\':
					text_ = text_.substring (0, index) + text_.substring(index + 1);
					state = 2;
					break;
				case '[':
					if (index != 0){
						tokens.push(new JPathToken ('text', text_.substring(0, index)));
					}
					text_ = text_.substring(index + 1);
					index = 0;
					state = 3;
					break;
				case "":
					if (index != 0){
						tokens.push(new JPathToken ('text', text_.substring(0, index)));
					}
					return tokens;
					break;
				default:
					index++;
					state = 1;
			}
			break;
		case 2:
			index++;
			state = 1;
			break;
		case 3:
		case 5:
			if (this.isChar (text_.charAt(index))){
				index++;
				state = 4;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 4:
			switch(text_.charAt(index)){
				case ']':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					tokens.push(new JPathToken ('separator', ''));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 1;
					break;
				case '.':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 5;
					break;
				case ':':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 6;
					break;
				case '[':
				case '\\':
				case '=':
					throw "Unexpected character " + state;;
					break;
				default:
					index++;
					state = 4;
			}
			break;
		case 6:
			if (text_.indexOf("index=") == 0){
				tokens.push(new JPathToken ('index_cond', ''));
				text_ = text_.substring(index + 6);
				index = 0;
				state = 7;
			} else if (text_.indexOf("first:") == 0){
				tokens.push(new JPathToken ('first_cond', ''));
				text_ = text_.substring(index + 6);
				index = 0;
				state = 16;
			} else if (text_.indexOf("last:") == 0){
				tokens.push(new JPathToken ('last_cond', ''));
				text_ = text_.substring(index + 5);
				index = 0;
				state = 16;
			} else if (this.isChar (text_.charAt(index))){
				index++;
				state = 9;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 7:
			if (text_.indexOf("first") == 0){
				tokens.push(new JPathToken ('first_index', ''));
				text_ = text_.substring(index + 5);
				index = 0;
				state = 18;
			} else if (text_.indexOf("last") == 0){
				tokens.push(new JPathToken ('last_index', ''));
				text_ = text_.substring(index + 4);
				index = 0;
				state = 18;
			} else if (!isNaN(parseInt(text_.charAt(index)))){
				index++;
				state = 8;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 8:
			if (!isNaN(parseInt(text_.charAt(index)))){
				index++;
				state = 8;
			} else if (text_.charAt(index) == ':'){
				tokens.push(new JPathToken ('value', parseInt(text_.substring(0, index))));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
			} else if (text_.charAt(index) == ']'){
				tokens.push(new JPathToken ('value', parseInt(text_.substring(0, index))));
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 9:
			switch(text_.charAt(index)){
				case '.':
					tokens.push(new JPathToken ('condition', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 15;
					break;
				case '=':
					tokens.push(new JPathToken ('condition', text_.substring(0, index)));
					tokens.push(new JPathToken ('op', '='));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 10;
					break;
				case ':':
				case '[':
				case ']':
				case '\\':
					throw "Unexpected character " + state;;
					break;
				default:
					index++;
					state = 9;
			}
			break;
		case 10:
			if (text_.charAt(index) == '"'){
				text_ = text_.substring(index + 1);
				index = 0;
				state = 17;									
			} else if (this.isChar (text_.charAt(index))){
				index++;
				state = 11;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 11:
			if (text_.charAt(index) == ':'){
				tokens.push(new JPathToken ('value', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
			} else if (this.isChar (text_.charAt(index))){
				index++;
				state = 11;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 12:
			if (this.isChar (text_.charAt(index))){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 13:
			if (text_.charAt(index) == ']'){
				tokens.push(new JPathToken ('element', text_.substring(0, index)));
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
			}else if (text_.charAt(index) == '.'){
				tokens.push(new JPathToken ('element', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 14;
			}else if (this.isChar (text_.charAt(index))){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 14:
			if (this.isChar (text_.charAt(index))){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 15:
		case 16:
			if (this.isChar (text_.charAt(index))){
				index++;
				state = 9;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 17:
			switch (text_.charAt(index)){
			case '"':
				tokens.push(new JPathToken ('value', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 18;
				break;
			default:
				index++;
				state = 17;
				break;
			}
			break;
		case 18:
			switch (text_.charAt(index)){
			case ']':
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
				break;			
			case ':':
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
				break;
			default:
				throw "Unexpected character " + state;
			}
			break;
		default:
			throw "Lex parser error. Unexpected state " + state;
		}
		
		iter--;
	
	} while (iter >= 0);
	
	if (iter < 0){
		throw "Lex parser error. Too many iterations";
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a JSON filter
JSONParser = new Object();

// This method finds a conditional element into a JSON list
JSONParser.findConditionalElement = function(json_list_, exp_, occur_, index_) {

	if ((typeof json_list_ != "object") || (json_list_.length == undefined)){
		throw "JSON must be a list";
	}

	var res = new Array();
	var found_eltos, iter;
	var current_token, value_token;

	for (var i = 0; i < json_list_.length; i++) { 

		iter = index_;
		current_token = exp_[iter];

		do {
			found_eltos = this.findJSONElement(current_token._value, json_list_[i]);
			current_token = exp_[++iter];	
		} while (current_token._type != 'op');
		
		// Gets the operation value
		value_token = exp_[++iter];
		
		for (var j = 0; j < json_list_.length; j++) {
			// Performs the selected operation (current token is a 'operation')
			switch(current_token._value){
			case '=':
				// Get the value of the operation
				if (found_eltos[j] == value_token._value ){
					if (occur_ == 'first'){
						return json_list_[i];
					} else {
						res.push (json_list_[i]);
						break;
					} 
				}			
				break;
			default:
				throw "Unexpected operator";
				break;
			}
		}

	}		
	
	if (res.length == 0){
		return undefined;
	}
	
	if (occur_ == 'last'){
		return res[res.length - 1];
	}
	
	return res;
		
}

// This method finds a element into a JSON list
JSONParser.findJSONElement = function(element_, json_) {
	
	// The element is only searched into javascript objects
	if (typeof json_ != "object") {
		return undefined;
	}
	
	// Found element
	if (json_[element_] != undefined){
		return json_[element_];
	} 
	
	// It is a list
	if (json_.length != undefined) {
	
		var res = new Array();
		for (var i = 0; i < json_.length; i++) { 
			var res_elto = this.findJSONElement(element_, json_[i]);
			if (res_elto != undefined){
				res.push(res_elto);
			}
		}		
		if (res.length == 0){
			res = undefined;
		}
		return res;
	}
	
	// It a normal object
	for (var json_item in json_) { 
		var res = this.findJSONElement(element_, json_[json_item]);
		if (res != undefined){
			return res;
		}
	}		
	
	return undefined;
}

// This method parses a JSON structures using a JPATH expression
JSONParser.parse = function(json_, exp_) {
	
	var res = new Array();
	var json_objs = null;
	var json_cp = null;
	var ocurr = null;
	
	// Checks the json
	if (json_ == ''){
		json_objs = {};
	} else {
		var k = 0
		while (k < json_.length) {
			switch (json_[k]){
			case '\n':
				json_ = json_.substring (0, k) + json_.substring(k + 1);
				break;
			default:
				k++;
				break;
			}
		}
		json_objs = JSON.parse(json_);
	}
	
	for (var i = 0; i < exp_.length; i++) {

		var token = exp_[i];
		
		switch(token._type){
		case 'text':
			res.push(token._value);
			break;
		case 'element':
			json_objs = this.findJSONElement(token._value, json_objs);
			break;
		case 'index_cond':
			
			var index_token = exp_[++i];
			var ind = null;
			
			switch(index_token._type){
			case 'first_index':
				ind = 0;
				break;
			case 'last_index':
				ind = json_objs.length - 1;
				break;
			default:
				ind = index_token._value;
				break;				
			}			 		

			json_objs = json_objs[ind]; 
			break;
		case 'first_cond':
			ocurr = "first";
			break;
		case 'last_cond':
			ocurr = "last";
			break;
		case 'condition':
			json_objs = this.findConditionalElement(json_objs, exp_, ocurr, i);
			while (exp_[i]._type != 'value') {
				i++;		
			} 			
			break;
		case 'separator':

			// Adds the found JSON element
			switch(typeof json_objs){
			case "object":
				res.push(Object.toJSON(json_objs));
				break;
			case "string":
				var first_comma = json_objs.indexOf('"');
				var last_comma = json_objs.lastIndexOf('"');
				if ((first_comma == 0) && (last_comma > 0) && (last_comma == (json_objs.length - 1))){
					json_objs = json_objs.substring (1, last_comma)
				}
			default:
				res.push(json_objs);
				break;
			}
				
			// Resets the json
			json_objs = JSON.parse(json_);
			break;
		default:
			throw "Unexpected token";
		}	

	}
	
	return res.join('');

}