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



//////////////////////////////////////////////
//                  GADGET                  //
//////////////////////////////////////////////

function Gadget(gadget_, url_, options_) {
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	var _this = this;
	
	this.getVendor = function() { return state.getVendor(); }
	this.getName = function() { return state.getName(); }
	this.getDisplayName = function() { return state.getDisplayName(); }
	this.getVersion = function() { return state.getVersion(); }
	this.getTemplate = function() { return state.getTemplate(); }
	this.getXHtml = function() { return state.getXHtml(); }
	this.getInfoString = function() { return state.getInfoString(); }
	this.getUriWiki = function() { return state.getUriWiki();}
	this.getImage = function() { return state.getImage(); }
	this.setImage = function(image_) { state.setImage(image_); }
	this.getIcon = function() { return state.getIcon(); } 
	this.getMenuColor = function() { return state.getMenuColor(); }
	this.isUpToDate = function() { return state.isUpToDate(); }
	this.setUpdatedState = function(lastVersion, URL) { return state.setUpdatedState(lastVersion, URL); }
	this.getLastVersion = function(){return state.getLastVersion();}
	this.getLastVersionURL = function() {return state.getLastVersionURL();}
	
	this.isContratable = function() { 
		var capabilities = state.getCapabilities();
		
		for (var i=0; i<capabilities.length; i++) {
			var capability = capabilities[i];
			if (capability.name == 'Contratable')
				return capability.value.toLowerCase() == "true";
			else
				return false
		}	
	}

	
	// *******************
	//  PRIVATE FUNCTIONS
	// *******************
	
	var _solicitarGadget = function(url_) {
		
		// ******************
		//  CALLBACK METHODS 
		// ******************
	
		// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
		
		var onError = function(transport, e) {
			var logManager = LogManagerFactory.getInstance();
			var msg = logManager.formatError(gettext("The gadget could not be added to the showcase: %(errorMsg)s."), transport, e);
			logManager.log(msg);
		}
		
		var loadGadget = function(transport) {
			var response = transport.responseText;
			var objRes = JSON.parse(response);
			state = new GadgetState(objRes);
			ShowcaseFactory.getInstance().gadgetToShowcaseGadgetModel(_this, options_);
		}
		
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		var workspaceId_ = OpManagerFactory.getInstance().getActiveWorkspaceId();
		// Post Gadget to PersistenceEngine. Asyncrhonous call!
		// params: url of the template, id of the current workspace to check if it is shared
		// and with who it is shared.  
		var params = {url: url_, workspaceId: workspaceId_};
		persistenceEngine.send_post(URIs.GET_GADGETS, params, this, loadGadget, onError);
	}
	
	this.getId = function() {
		return this.getVendor() + '_'+ this.getName() + '_' + this.getVersion();
	}
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************

	var state = null;
	
	if (url_ != null) {
		_solicitarGadget(url_);
	}
	else {
		state = new GadgetState(gadget_);
	}
}

//////////////////////////////////////////////
//       GADGETSTATE (State Object)         //
//////////////////////////////////////////////

function GadgetState(gadget_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var vendor = null;
	var name = null;
	var version = null;
	var displayName = null;
	var template = null;
	var xhtml = null;
	var image = null;
	var capabilities = []; 
	var uriwiki = null;
	var menuColor= null;
	var icon = null;
	var upToDate = true; 
	var lastVersion = null; 
	var lastVersionURL = null;
		
	// JSON-coded Gadget mapping
	// Constructing the structure
	vendor = gadget_.vendor;
	name = gadget_.name;
	version = gadget_.version;
	displayName = gadget_.displayName
	template = new GadgetTemplate(gadget_.variables, gadget_.size);
	xhtml = new XHtml(gadget_.xhtml);
	image = gadget_.imageURI;
	icon = gadget_.iPhoneImageURI;
	capabilities = gadget_.capabilities;
	uriwiki = gadget_.wikiURI;
	menuColor = gadget_.menuColor;
	lastVersion = version;
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
        this.getCapabilities = function() { return capabilities; } 
	this.getVendor = function() { return vendor; }
	this.getName = function() { return name; }
	this.getDisplayName = function() { return displayName; }
	this.getVersion = function() { return version; }
	this.getTemplate = function() { return template; }
	this.getXHtml = function() { return xhtml; }
	this.getInfoString = function() {
		var transObj = { vendor: vendor, name: name, version: version};
		var msg = gettext("[GadgetVendor: %(vendor)s, GadgetName: %(name)s, GadgetVersion: %(version)s]");
		return interpolate(msg, transObj, true);
	}
	this.getUriWiki = function () {return uriwiki;}
	this.getImage = function() { return image; }
	this.setImage = function(image_) { image = image_; }
	this.getIcon = function() { return (icon!="") ? icon :  image;  }
	this.getMenuColor = function () {return menuColor;}
	this.isUpToDate = function() { return upToDate; }
	this.getLastVersion = function() {return lastVersion;}
	this.getLastVersionURL = function() {return lastVersionURL;}
	this.setUpdatedState = function(v, URL) { 
		upToDate = (version >= v); 
		lastVersion = v;
		lastVersionURL = URL; 
	}
}
