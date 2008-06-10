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


function VarManager (_workSpace) {
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	

	VarManager.prototype.parseVariables = function (workSpaceInfo) {	
		// Igadget variables!
		var tabs = workSpaceInfo['workspace']['tabList'];
		
		for (var i=0; i<tabs.length; i++) {
			var igadgets = tabs[i]['igadgetList'];
			
			for (var j=0; j<igadgets.length; j++) {
				this.parseIGadgetVariables(igadgets[j]);
			}
		}
		
		// Workspace variables (Connectables and future variables!)
		var ws_vars = workSpaceInfo['workspace']['workSpaceVariableList'];
				
		this.parseWorkspaceVariables(ws_vars);
	}
	

	VarManager.prototype.parseWorkspaceVariables = function (ws_vars) {
		for (var i = 0; i<ws_vars.length; i++) {
			this.parseWorkspaceVariable(ws_vars[i]);
		}		
	}
	
	VarManager.prototype.parseWorkspaceVariable = function (ws_var) {
		var id = ws_var.id;
		var name = ws_var.name;
		var aspect = ws_var.aspect;
		var value = ws_var.value;
			
		switch (aspect) {
			case Variable.prototype.INOUT:
				this.workspaceVariables[id] = new RWVariable(id, null, name, aspect, this, value);
				break;
			case Variable.prototype.TAB:
				this.workspaceVariables[id] = new RVariable(id, null, name, aspect, this, value);
				break;
		}	
	}
	
	VarManager.prototype.removeWorkspaceVariable = function (ws_varId) {
		delete this.workspaceVariables[ws_varId];
	}
	
	VarManager.prototype.parseIGadgetVariables = function (igadget) {
		var igadgetVars = igadget['variables'];
		var objVars = []
		for (var i = 0; i<igadgetVars.length; i++) {
			var id = igadgetVars[i].id;
			var igadgetId = igadgetVars[i].igadgetId;
			var name = igadgetVars[i].name;
			var aspect = igadgetVars[i].aspect;
			var value = igadgetVars[i].value;
				
			switch (aspect) {
				case Variable.prototype.PROPERTY:
				case Variable.prototype.EVENT:
					objVars[name] = new RWVariable(id, igadgetId, name, aspect, this, value);
					this.variables[id] = objVars[name];
					break;
				case Variable.prototype.EXTERNAL_CONTEXT:
				case Variable.prototype.GADGET_CONTEXT:
				case Variable.prototype.SLOT:
				case Variable.prototype.USER_PREF:
					objVars[name] = new RVariable(id, igadgetId, name, aspect, this, value);
					this.variables[id] = objVars[name];
					break;
			}
		}
		
		this.iGadgets[igadget['id']] = objVars;
		
	}
		
	VarManager.prototype.registerVariable = function (iGadgetId, variableName, handler) {
		var variable = this.findVariable(iGadgetId, variableName);

		if (variable) {
			variable.setHandler(handler);
		} else {
			var transObj = {iGadgetId: iGadgetId, varName: variableName};
			var msg = interpolate(gettext("IGadget %(iGadgetId)s does not have any variable named \"%(varName)s\".\nIf you need it, please insert it into the gadget's template."), transObj, true);
			OpManagerFactory.getInstance().logIGadgetError(iGadgetId, msg, Constants.Logging.ERROR_MSG);
		}
	}
	
	VarManager.prototype.assignEventConnectable = function (iGadgetId, variableName, wEvent) {
		var variable = this.findVariable(iGadgetId, variableName);
		variable.assignEvent(wEvent);
	}
	
	VarManager.prototype.getVariable = function (iGadgetId, variableName) {
		var variable = this.findVariable(iGadgetId, variableName);
		
		// Error control
		
		return variable.get();
	}
	
	VarManager.prototype.setVariable = function (iGadgetId, variableName, value) {
		var variable = this.findVariable(iGadgetId, variableName);
		
		variable.set(value);
	}

	VarManager.prototype.addInstance = function (iGadget, igadgetInfo) {
		this.parseIGadgetVariables(igadgetInfo);
	}
	
	VarManager.prototype.removeInstance = function (iGadgetId) {		
		delete this.iGadgets[iGadgetId];
		
		this.removeIGadgetVariables(iGadgetId);
	}
	
	
	VarManager.prototype.removeIGadgetVariables = function (iGadgetId) {	
		var variables_ids = this.variables.keys()
		
		for (var i=0; i<variables_ids.length; i++) {			
			if (this.variables[variables_ids[i]].iGadget == iGadgetId) {
				delete this.variables[variables_ids[i]];
			}
		}
	}
	
	VarManager.prototype.unload = function () {	
		delete this;
	}

	VarManager.prototype.commitModifiedVariables = function() {
		// Asynchronous handlers 
		function onSuccess(transport) {
			//varManager.resetModifiedVariables(); Race Condition
		}

		function onError(transport, e) {
			var msg;
			if (e) {
				msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
				                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
				                  true);
			} else {
				msg = transport.status + " " + transport.statusText;
			}
			msg = interpolate(gettext("Error saving variables to persistence: %(errorMsg)s."),
			                          {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		if (this.igadgetModifiedVars.length > 0 || this.workspaceModifiedVars.length > 0) {
						
			var variables = {};
			
			variables['igadgetVars'] = this.igadgetModifiedVars;
			variables['workspaceVars'] = this.workspaceModifiedVars;
			
			var param = {variables: Object.toJSON(variables)};
			
			var uri = URIs.PUT_VARIABLES.evaluate({workspaceId: this.workSpace.getId()});

			PersistenceEngineFactory.getInstance().send_update(uri, param, this, onSuccess, onError);
			this.resetModifiedVariables();
		}
	}

	VarManager.prototype.createWorkspaceVariable = function(name) {
		var provisional_id = new Date().getTime();
		
		return new RWVariable(provisional_id, null, name, Variable.prototype.INOUT, this, "");
		
	}
	
	VarManager.prototype.addWorkspaceVariable = function(id, variable) {
		this.workspaceVariables[id] = variable;
	}

	VarManager.prototype.getWorkspaceVariableById = function(varId) {
		return this.workspaceVariables[varId];
	}

	VarManager.prototype.initializeInterface = function () {
	    // Calling all SLOT vars handler
	    var variable;
	    var vars;
	    var varIndex;
	    var gadgetIndex;

	    for (gadgetIndex in this.iGadgets) {
		vars = this.iGadgets[gadgetIndex];

		for (varIndex in vars) {
		    variable = vars[varIndex];

		    if (variable.aspect == "SLOT" && variable.handler) {
			try {
			    variable.handler(variable.value);
			} catch (e) {
			}
		    }
		}
		
	    }
	}


	VarManager.prototype.markVariablesAsModified = function (variables) {
		var varCollection;
		
		for (var j=0; j < variables.length; j++) {
			var variable = variables[j];
			
			// Is it a igadgetVar or a workspaceVar?
			if (variable.aspect == Variable.prototype.INOUT
				|| variable.aspect == Variable.prototype.TAB) {
				varCollection = this.workspaceModifiedVars;
			} else {
				varCollection = this.igadgetModifiedVars;
			}
		 
			for (var i=0; i<varCollection.length; i++) {
			    var modVar = varCollection[i];
		
			    if (modVar.id == variable.id) {
					modVar.value = variable.value;
					return;
			    }	
			}

			//It's doesn't exist in the list
			//It's time to create it!
			var varInfo = {}
			
			varInfo['id'] = variable.id
			varInfo['value'] = variable.value
			
			varCollection.push(varInfo);	    
		}
	
	}

	VarManager.prototype.incNestingLevel = function() {
	    this.nestingLevel++;
	}

	VarManager.prototype.decNestingLevel = function() {
	    this.nestingLevel--;
	    if (this.nestingLevel == 0)
		this.commitModifiedVariables();
	}

	VarManager.prototype.resetModifiedVariables = function () {
	    this.nestingLevel = 0;
	    this.igadgetModifiedVars = [];
	    this.workspaceModifiedVars = [];
	}
	
	VarManager.prototype.getVariableById = function (varId) {
		return this.variables[varId];
	}
	
	VarManager.prototype.getVariableByName = function (igadgetId, varName) {
		return this.findVariable(igadgetId, varName);
	}
	
	// *********************************
	// PRIVATE VARIABLES AND CONSTRUCTOR
	// *********************************
	
	VarManager.prototype.findVariable = function (iGadgetId, name) {
		var variables = this.iGadgets[iGadgetId];
		var variable = variables[name];
	
		return variable;
	}

	this.workSpace = _workSpace;
	this.iGadgets = new Hash();
	this.variables = new Hash();
	
	// For now workspace variables must be in a separated hash table, because they have a
	// different identifier space and can collide with the idenfiers of normal variables
	this.workspaceVariables = new Hash();
	
	this.igadgetModifiedVars = []
	this.workspaceModifiedVars = []
	
	this.nestingLevel = 0;
	
	// Creation of ALL EzWeb variables regarding one workspace
	this.parseVariables(this.workSpace.workSpaceGlobalInfo);
}
