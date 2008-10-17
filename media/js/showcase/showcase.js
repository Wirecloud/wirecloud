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
		Showcase.prototype.NUM_CELLS = 4;

		// ****************
		// CALLBACK METHODS 
		// ****************

		this.parseGadgets = function (receivedData_){
			var response = receivedData_.responseText;
			var jsonGadgetList = eval ('(' + response + ')');
		
			// Load all gadgets from persitence system
			for (var i = 0; i<jsonGadgetList.length; i++) {
				var jsonGadget = jsonGadgetList[i];
				var gadget = new Gadget (jsonGadget, null);
				var gadgetId = gadget.getVendor() + '_' + gadget.getName() + '_' + gadget.getVersion();
				
				// Insert gadget object in showcase object model
				this.gadgets[gadgetId] = gadget;
			}
		}

		Showcase.prototype.reload = function (workspace_id) {
			
			var id = workspace_id;
			
			this.gadgets = []
			
			var onSuccess = function (receivedData_) {

				this.parseGadgets(receivedData_);
				
				opManager = OpManagerFactory.getInstance();
	
				opManager.changeActiveWorkSpace(opManager.workSpaceInstances[id]);
			}
			
			var onError = function (receivedData_) {
				alert("eerror en showcase")
			}

			// Initial load from persitence system
			this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);			
		}
		
		Showcase.prototype.init = function () {

			// Load gadgets from persistence system
			var onSuccess = function (receivedData_) {

				this.parseGadgets(receivedData_);
				
				// Showcase loaded
				this.loaded = true;
				this.opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			
			}
		
			// Error callback (empty gadget list)
			var onError = function (receivedData_) {
				this.loaded = true;
				this.opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			}
			
			// Initial load from persitence system
			this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);
			
		}
		
		
		// *******************************
		// PRIVATE METHODS AND VARIABLES
		// *******************************
		this.gadgets = new Hash();
		this.loaded = false;
		this.opManager = OpManagerFactory.getInstance();
		this.persistenceEngine = PersistenceEngineFactory.getInstance();			
		
		// ****************
		// PUBLIC METHODS
		// ****************
		
		// Add a new gadget from Internet
		Showcase.prototype.addGadget = function (vendor_, name_, version_, url_) {
			var gadgetId = vendor_ + '_' + name_ + '_' + version_;
			var gadget = this.gadgets[gadgetId];

			if (gadget == null){
				gadget = new Gadget (null, url_);		
			}else{
				this.opManager.addInstance(gadgetId);
			}
		}
		
		// Insert gadget object in showcase object model
		Showcase.prototype.gadgetToShowcaseGadgetModel = function(gadget_) {
			var gadgetId = gadget_.getId();

			this.gadgets[gadgetId] = gadget_;
			this.opManager.addInstance(gadgetId);
		}
		
		// Remove a Showcase gadget
		Showcase.prototype.deleteGadget = function (gadgetId_) {
			var gadget = this.gadgets.remove(gadgetId_);
			//gadget.remove();
		}
		
		// Update a Showcase gadget
		Showcase.prototype.updateGadget = function (gadgetId_, url_) {
			this.remove(gadgetId_);
			this.addGadget(url_);
		}

		// Get a gadget by its gadgetID
		Showcase.prototype.getGadget = function (gadgetId_) {
			return this.gadgets[gadgetId_];
		}
		
		// Set gadget properties (User Interface)
		Showcase.prototype.setGadgetProperties = function (gadgetId_, imageSrc_, tags_) {
			var gadget = this.gadgets[gadgetId_];

			gadget.setImage(imageSrc_);
			gadget.setTags(tags_);
		}

		// Add a tag to a Showcase gadget
		Showcase.prototype.tagGadget = function (gadgetId_, tags_) {
			for (var i = 0; i<tags_.length; i++) {
				var tag = tags_[i];
				this.gadgets[gadgetId_].addTag(tag);
			}
		}
		
		// Deploy a Showcase gadget into dragboard as gadget instance  
		Showcase.prototype.addInstance = function (gadgetId_) {
			var gadget = this.gadgets[gadgetId_];
			this.opManager.addInstance (gadget);
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
