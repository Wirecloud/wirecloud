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

function Gadget(gadget_, url_) {
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	var _this = this;
	
	this.getVendor = function() { return state.getVendor(); }
	this.getName = function() { return state.getName(); }
	this.getVersion = function() { return state.getVersion(); }
	this.getTemplate = function() { return state.getTemplate(); }
	this.getXHtml = function() { return state.getXHtml(); }
	this.getInfoString = function() { return state.getInfoString(); }
	
	this.getImage = function() { return state.getImage(); }
	this.setImage = function(image_) { state.setImage(image_); }
	
	
	// *******************
	//  PRIVATE FUNCTIONS
	// *******************
	
	var _solicitarGadget = function(url_) {
		
		// ******************
		//  CALLBACK METHODS 
		// ******************
	
		// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
		
		var onError = function(transport, e) {
			var msg;
			if (e) {
				msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
				                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
						  true);
			} else if (transport.responseXML) {
                                msg = transport.responseXML.documentElement.textContent;
			} else {
                                msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("The gadget could not be added to the showcase: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}
		
		var loadGadget = function(transport) {
			var response = transport.responseText;
			var objRes = eval ('(' + response + ')');
			state = new GadgetState(objRes);
			ShowcaseFactory.getInstance().gadgetToShowcaseGadgetModel(_this);
		}
		
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		// Post Gadget to PersistenceEngine. Asyncrhonous call!
		var param = {url: url_};
		persistenceEngine.send_post(URIs.GET_GADGETS, param, this, loadGadget, onError);
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
	var template = null;
	var xhtml = null;
	var image = null;
	
	// JSON-coded Gadget mapping
	// Constructing the structure
	vendor = gadget_.vendor;
	name = gadget_.name;
	version = gadget_.version;
	template = new GadgetTemplate(gadget_.variables, gadget_.size);
	xhtml = new XHtml(gadget_.xhtml);
	image = gadget_.image;
	
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return vendor; }
	this.getName = function() { return name; }
	this.getVersion = function() { return version; }
	this.getTemplate = function() { return template; }
	this.getXHtml = function() { return xhtml; }
	this.getInfoString = function() {
		var transObj = { vendor: vendor, name: name, version: version};
		var msg = gettext("[GadgetVendor: %(vendor)s, GadgetName: %(name)s, GadgetVersion: %(version)s]");
		return interpolate(msg, transObj, true);
	}
	
	this.getImage = function() { return image; }
	this.setImage = function(image_) { image = image_; }
}
