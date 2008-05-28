/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
 */



//////////////////////////////////////////////
//                 TEMPLATE                 //
//////////////////////////////////////////////

function GadgetTemplate(variables_, size_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************

   var variableList = variables_;
   var width = size_.width;
   var height = size_.height;

	// ******************
	//  PUBLIC FUNCTIONS
	// ******************

    this.getWidth = function () {
        return width;
    }

    this.getHeight = function () {
        return height;
    }

    this.getVariables = function (iGadget) {
        
		// JSON-coded Template-Variables mapping
		// Constructing the structure
		var iGadgetId = iGadget.getId();
		var varManager = iGadget.dragboard.workSpace.getVarManager();

		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.PROPERTY:
				case Variable.prototype.EVENT:
					objVars[rawVar.name] = new RWVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, null);
					break;
				case Variable.prototype.EXTERNAL_CONTEXT:
				case Variable.prototype.GADGET_CONTEXT:
				case Variable.prototype.SLOT:
					objVars[rawVar.name] = new RVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, null);
					break;
				case Variable.prototype.USER_PREF:
					objVars[rawVar.name] = new RVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, rawVar.default_value);
					break;
			}
		}
        return objVars;
    }
	
	this.getUserPrefs = function () {

		if (this.prefs == null) {
			// JSON-coded Template-Variables mapping	
			// Constructing the structure 
		 
			this.prefs = new Array();
			var rawVar = null;
			for (var i = 0; i < variableList.length; i++) {
				rawVar = variableList[i];
				if (rawVar.aspect == Variable.prototype.USER_PREF) {
					switch (rawVar.type) {
						case UserPref.prototype.TEXT:  
							this.prefs.push(new TextUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.INTEGER:  
							this.prefs.push(new IntUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.BOOLEAN:
							this.prefs.push(new BoolUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.DATE:
							this.prefs.push(new DateUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.PASSWORD:
							this.prefs.push(new PasswordUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.LIST:
							this.prefs.push(new ListUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value, rawVar.value_options));
							break;
					}
				}
			}
		}

		return this.prefs;
	}
	
	this.getExternalContextVars = function (igadget_) {
		
		// JSON-coded Template-Variables mapping	
		// Constructing the structure 

		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		var currentContextVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.EXTERNAL_CONTEXT:
					currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept) 
					objVars.push(currentContextVar); 
					break;
				default:
					break;
			}
		}
		return objVars;
	}
	
	this.getGadgetContextVars = function (igadget_) {

		// JSON-coded Template-Variables mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		var currentContextVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.GADGET_CONTEXT:
					currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept) 
					objVars.push(currentContextVar); 
					break;
				default:
					break;
			}
		}
		return objVars;
	}

	
	this.getUserPrefsId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.USER_PREF)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
	
	this.getEventsId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.EVENT)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
	
   this.getSlots = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.SLOT)
			{
					objVars.push(rawVar);
			}
		}
        return objVars;
    }

   this.getEvents = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.EVENT)
			{
					objVars.push(rawVar);
			}
		}
        return objVars;
    }

	
	this.getPropertiesId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.PROPERTY)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
}
