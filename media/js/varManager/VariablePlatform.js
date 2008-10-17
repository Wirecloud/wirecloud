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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VARIABLE (Parent Class)  <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Variable (id, iGadget, name, varManager) {
	this.varManager = null;
	this.id = null;
	this.iGadget = null;
	this.name = null;
	this.aspect = null;
	this.value = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super class emulation)
//////////////////////////////////////////////
 
Variable.prototype.Variable = function (id, iGadget_, name_, aspect_, varManager_,  value_) {
	this.varManager = varManager_;
	this.id = id;
	this.iGadget = iGadget_;
    this.name = name_;
	this.aspect = aspect_;
	this.value = value_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

Variable.prototype.get = function () {
	return this.value;
}

Variable.prototype.setHandler = function () { } 

Variable.prototype.set = function (value) { } 

Variable.prototype.assignConnectable = function (connectable) {
	this.connectable = connectable;
}

Variable.prototype.getConnectable = function () {
	return this.connectable;
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

function RVariable(id, iGadget_, name_, aspect_, varManager_, value_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_);
  
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
	var varInfo = [{id: this.id, value: newValue, aspect: this.aspect}];
	switch (this.aspect){
		case Variable.prototype.USER_PREF:
		case Variable.prototype.EXTERNAL_CONTEXT:
		case Variable.prototype.GADGET_CONTEXT:
		case Variable.prototype.SLOT:
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

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWVariable(id, iGadget_, name_, aspect_, varManager_, value_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_);
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


