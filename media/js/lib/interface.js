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


/**
 * @author luismarcos.ayllon
 */

var WiringFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function Wiring () {
		
		// ****************
		// PUBLIC METHODS
		// ****************
		Wiring.prototype.addInstance = function (iGadgetId, template) {} 
		Wiring.prototype.removeInstance = function (iGadgetId) {}
		Wiring.prototype.createChannel = function (channelName){}
		Wiring.prototype.removeChannel = function (channelName){}
		Wiring.prototype.viewValue = function (channelName){}
		Wiring.prototype.sendEvent = function (iGadgetId, eventName, value) {} // asynchronous
		Wiring.prototype.addChannelInput = function (idGadgetId, inputName, channelName) {}
		Wiring.prototype.addChannelInput = function (inputName, channelName) {}
		Wiring.prototype.addChannelOutput = function (idGadgetId, outputName, channelName) {}
		Wiring.prototype.addChannelOutput = function (outputName, channelName) {}
		Wiring.prototype.removeChannelInput = function (idGadgetId, inputName, channelName) {}
		Wiring.prototype.removeChannelInput = function (inputName, channelName) {}
		Wiring.prototype.removeChannelOutput = function (idGadgetId, outputName, channelName) {}
		Wiring.prototype.removeChannelOutput = function (outputName, channelName) {}
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Wiring();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();

var VarManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function VarManager () {
		
		// *********************************
		// PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
	
		// ****************
		// PUBLIC METHODS 
		// ****************
		VarManager.prototype.writeSlot = function (iGadgetId, slotName, value) {} 
		VarManager.prototype.registerVariable = function (iGadgetId, variableName) {}
		VarManager.prototype.getVariable = function (iGadgetId, variableName){}
		VarManager.prototype.setVariable = function (iGadgetId, variableName, value){}
	}
	
		
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new VarManager();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();


var PersitenceEngineFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function PersitenceEngine () {
		
		// ****************
		// PUBLIC METHODS 
		// ****************
		PersitenceEngine.prototype.send_get = function (url, context, asynHandler) {} 
		PersitenceEngine.prototype.send_post = function (url, value, context, asynHandler) {}
		PersitenceEngine.prototype.send_delete = function (url, context, asynHandler){}
		PersitenceEngine.prototype.send_update = function (url, value, context, asynHandler){}
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new PersitenceEngine();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();

var OpManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function OpManager () {
		
		// ****************
		// PUBLIC METHODS 
		// ****************
		OpManager.prototype.addInstance = function (gadgetId) {} 
		OpManager.prototype.removeInstance = function (gadgetId) {}
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new OpManager();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();

var ShowcaseFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function Showcase () {
		
		// ****************
		// PUBLIC METHODS
		// ****************
		Showcase.prototype.addGadget = function (url) {} 
		Showcase.prototype.deleteGadget = function (gadgetId) {}
		Showcase.prototype.updateGadget = function (gadgetId, url) {}
		Showcase.prototype.tagGadget = function (gadgetId, tags) {}
		Showcase.prototype.addInstance = function (gadgetId) {}
		Showcase.prototype.repaint = function () {}
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Showcase();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();


var DragboardFactory  = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function Dragboard () {
		
		// ****************
		// PUBLIC METHODS
		// ****************
		Dragboard.prototype.addInstance = function (iGadgetId) {}
		Dragboard.prototype.getUserProperty = function (varable) {}
		Dragboard.prototype.setUserProperty = function (varable, value) {}
		Dragboard.prototype.moveInstance = function (iGadgetId, position) {}
		Dragboard.prototype.repaint = function () {}
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Dragboard();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();