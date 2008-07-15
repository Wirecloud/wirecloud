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

// This module provides a set of gadgets which can be deployed into dragboard as gadget instances 
var ShowcaseFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	// *********************************
	// CONSTRUCTOR
	// *********************************
	function Showcase () {
		
		// ******************
		// STATIC VARIABLES
		// ******************
	    Showcase.prototype.MODULE_HTML_ID = "showcase";

		// ****************
		// CALLBACK METHODS 
		// ****************

		// Load gadgets from persistence system
		loadGadgets = function (receivedData_) {
			var response = receivedData_.responseText;
			var jsonGadgetList = eval ('(' + response + ')');
		
			// Load all gadgets from persitence system
			for (var i = 0; i<jsonGadgetList.length; i++) {
				var jsonGadget = jsonGadgetList[i];
				var gadget = new Gadget (jsonGadget, null);
				var gadgetId = gadget.getVendor() + '_' + gadget.getName() + '_' + gadget.getVersion();
				
				// Insert gadget object in showcase object model
				_gadgets[gadgetId] = gadget;
			}
			
			// Showcase loaded
			_loaded = true;
			_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			
		}
		
		// Error callback (empty gadget list)
		onErrorCallback = function (receivedData_) {
			_loaded = true;
			_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
		}
		
		// *******************************
		// PRIVATE METHODS AND VARIABLES
		// *******************************
		var _gadgets = new Hash();
		var _loaded = false;
		var _opManager = OpManagerFactory.getInstance();
		var _persistenceEngine = PersistenceEngineFactory.getInstance();			
		
		// ****************
		// PUBLIC METHODS
		// ****************
		
		// Get a gadget by its gadgetID
		Showcase.prototype.getGadget = function (gadgetId_) {
			return _gadgets[gadgetId_];
		}
		
		
		Showcase.prototype.init = function () {
			// Initial load from persitence system
			_persistenceEngine.send_get(URIs.GET_GADGETS, this, loadGadgets, onErrorCallback);
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Showcase();
          	}
         	return instance;
       	}
	}
	
}();
