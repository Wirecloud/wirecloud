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
// GADGETVARIABLE (Parent Class) <<GADGET>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function GadgetVariable (iGadgetId, name) {
	this.varManager = null;
	this.iGadgetId = null;
	this.name = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super keyboard emulation)
//////////////////////////////////////////////
 
GadgetVariable.prototype.GadgetVariable = function (iGadget_, name_) {
    this.varManager = OpManagerFactory.getInstance().activeWorkSpace.getVarManager();  
  
    this.iGadgetId = iGadget_;
    this.name = name_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

GadgetVariable.prototype.get = function () { 
	return this.varManager.getVariable(this.iGadgetId, this.name);
}  

GadgetVariable.prototype.set = function (value) { } 

GadgetVariable.prototype.register = function (handler) { } 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RGadgetVariable(iGadget_, name_, handler_) {
	GadgetVariable.prototype.GadgetVariable.call(this, iGadget_, name_);
  
	this.handler = handler_;

	this.register(handler_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RGadgetVariable.prototype = new GadgetVariable;

//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RGadgetVariable.prototype.register = function (handler) { 
	this.varManager.registerVariable(this.iGadgetId, this.name, handler);
} 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWGadgetVariable(iGadget_, name_) {
	GadgetVariable.prototype.GadgetVariable.call(this, iGadget_, name_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWGadgetVariable.prototype = new GadgetVariable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

 

//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RWGadgetVariable.prototype.set = function (value) {  
	this.varManager.setVariable(this.iGadgetId, this.name, value)
} 

