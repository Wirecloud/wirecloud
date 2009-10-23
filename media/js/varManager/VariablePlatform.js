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
// VARIABLE (Parent Class)  <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Variable (id, iGadget, name, varManager) {
    // True when a the value of the variable has changed and the callback has not been invoked! 
    this.annotated = false;
	this.varManager = null;
	this.id = null;
	this.iGadget = null;
	this.name = null;
	this.label = null;
	this.aspect = null;
	this.value = null;
	this.tab = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super class emulation)
//////////////////////////////////////////////
 
Variable.prototype.Variable = function (id, iGadget_, name_, aspect_, varManager_,  value_, label_, tab_) {
	this.varManager = varManager_;
	this.id = id;
	this.iGadget = iGadget_;
    this.name = name_;
    this.label = label_;
	this.aspect = aspect_;
	this.value = value_;
	this.tab = tab_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

Variable.prototype.get = function () {
	return this.value;
}

Variable.prototype.setHandler = function () { } 

Variable.prototype.set = function (value) { } 

Variable.prototype.annotate = function (value) {
        this.annotated = true;
        this.value=value;
} 

Variable.prototype.assignConnectable = function (connectable) {
	this.connectable = connectable;
}

Variable.prototype.getConnectable = function () {
	return this.connectable;
}

Variable.prototype.getWorkspace = function () {
	return this.varManager.getWorkspace();
}

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////

Variable.prototype.EVENT = "EVEN"  
Variable.prototype.SLOT = "SLOT"  
Variable.prototype.USER_PREF = "PREF"  
Variable.prototype.PROPERTY = "PROP"  
Variable.prototype.EXTERNAL_CONTEXT = "ECTX"
Variable.prototype.GADGET_CONTEXT = "GCTX"
Variable.prototype.INOUT = "CHANNEL"
Variable.prototype.TAB = "TAB"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RVARIABLE (Derivated class) <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RVariable(id, iGadget_, name_, aspect_, varManager_, value_, label_, tab_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_, label_, tab_);
  
	this.handler = null;
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
////////////////////////////////////////////// 



//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RVariable.prototype.setHandler = function (handler_) { 
	this.handler = handler_;
} 

RVariable.prototype.set = function (newValue) {
    if (this.annotated) {
		// If annotated, the value must be managed!

		var varInfo = [{id: this.id, value: newValue, aspect: this.aspect}];
		
		switch (this.aspect) {
			case Variable.prototype.SLOT:
				
				// On-demand loading of tabs!
				// Only wiring variables are involved!
				if (! this.tab.is_painted() ) {
					this.varManager.addPendingVariable(this.iGadget, this.name, newValue);
					this.tab.paint();
					return;
				}
				var opManager = OpManagerFactory.getInstance();
				var iGadget = opManager.activeWorkSpace.getIgadget(this.iGadget);
				if (!iGadget.loaded) { //the tab is being painted due to another variable in the same tab and this gadget isn't fully loaded
					this.varManager.addPendingVariable(this.iGadget, this.name, newValue);
					return;
				}
			
			case Variable.prototype.USER_PREF:
			case Variable.prototype.EXTERNAL_CONTEXT:
			case Variable.prototype.GADGET_CONTEXT:
				
				this.varManager.markVariablesAsModified(varInfo);
				
				this.value = newValue;
				
				if (this.handler) {
					try {
						this.handler(newValue);
					} catch (e) {
						var transObj = {iGadgetId: this.iGadget, varName: this.name, exceptionMsg: e};
						var msg = interpolate(gettext("Error in the handler of the \"%(varName)s\" RVariable in iGadget %(iGadgetId)s: %(exceptionMsg)s."), transObj, true);
						OpManagerFactory.getInstance().logIGadgetError(this.iGadget, msg, Constants.Logging.ERROR_MSG);
					}
				} else {
					var opManager = OpManagerFactory.getInstance();
				    var iGadget = opManager.activeWorkSpace.getIgadget(this.iGadget);
					if (iGadget.loaded) {
						var transObj = {iGadgetId: this.iGadget, varName: this.name};
						var msg = interpolate(gettext("IGadget %(iGadgetId)s does not provide a handler for the \"%(varName)s\" RVariable."), transObj, true);
						opManager.logIGadgetError(this.iGadget, msg, Constants.Logging.WARN_MSG);
					}
				}
				
				break;
			case Variable.prototype.TAB:
				this.varManager.markVariablesAsModified(varInfo);
				
				OpManagerFactory.getInstance().activeWorkSpace.goTab(this.connectable.tab);
				break;
			default:
				break;
		}
		// And it must be changed to NOT annotated!
		this.annotated = false;	
    }
}

RVariable.prototype.refresh = function() {
	switch (this.aspect) {
		case Variable.prototype.USER_PREF:
		case Variable.prototype.EXTERNAL_CONTEXT:
		case Variable.prototype.GADGET_CONTEXT:
		case Variable.prototype.SLOT:
			if (this.handler) {
				try {
					this.handler(this.value);
				} catch (e) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name, exceptionMsg: e};
					var msg = interpolate(gettext("Error in the handler of the \"%(varName)s\" RVariable in iGadget %(iGadgetId)s: %(exceptionMsg)s."), transObj, true);
					OpManagerFactory.getInstance().logIGadgetError(this.iGadget, msg, Constants.Logging.ERROR_MSG);
				}
			} else {
				var opManager = OpManagerFactory.getInstance();
				var iGadget = opManager.activeWorkSpace.getIgadget(this.iGadget);
				if (iGadget.loaded) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name};
					var msg = interpolate(gettext("IGadget %(iGadgetId)s does not provide a handler for the \"%(varName)s\" RVariable."), transObj, true);
					opManager.logIGadgetError(this.iGadget, msg, Constants.Logging.WARN_MSG);
				}
			}
			break;
		case Variable.prototype.TAB:
		default:
			break;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWVariable(id, iGadget_, name_, aspect_, varManager_, value_, label_, tab_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_, label_, tab_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////


RWVariable.prototype.set = function (value_) {
    this.varManager.incNestingLevel();

    if (this.value != value_) {
    	// This variable was modified
    	this.value = value_;
	
        this.varManager.markVariablesAsModified([this]);
    }

    // Propagate changes to wiring module
    // Only when variable is an Event, the connectable must start propagating
    // When variable is INOUT, is the connectable who propagates
    switch (this.aspect){
		case Variable.prototype.EVENT:   
			if (this.connectable != null) {
				this.connectable.propagate(this.value, false);
				break;
			}
		default:
			break;
    }

    // This will save all modified vars if we are the root event
    this.varManager.decNestingLevel();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


