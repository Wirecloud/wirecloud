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


var Constants = {
  Logging: {
    ERROR_MSG: 1,
    WARN_MSG:  2,
    INFO_MSG:  3
  }
};
 
 /******GENERAL UTILS **********/
 
 //ARRAY EXTENSIONS
 Array.prototype.elementExists = function (element){
 	if(this.indexOf(element) != -1)
 		return true;
 	return false;
 }
 Array.prototype.getElementById = function (id){
 	for(var i=0;i < this.length;i++){
 		if(this[i].getId() == id)
 			return this[i];
 	}
 	return null;
 }
 
 Array.prototype.getElementByName = function (elementName){
 	for(var i=0;i < this.length;i++){
 		if(this[i].getName() == elementName)
 			return this[i];
 	}
 	return null;
 }
 
 Array.prototype.remove = function(element){
 	var index = this.indexOf(element);
	if(index != -1)this.splice(index, 1);
 }
 
 Array.prototype.removeById = function (id){
 	var element;
 	var elementId;
 	for(var i=0;i < this.length;i++){
 		if(typeof this[i].getId == "function"){
 			elementId = this[i].getId();
 		}else{
 			elementId = this[i].id;
 		}
 		if(elementId == id){
 			element = this[i];
 			this.splice(i, 1);
 			return element;
 		}
 	}
 	return null;
 }

function Modules () {

}

// Singleton modules (valid for every WorkSpace)
Modules.prototype.SHOWCASE = 0;
Modules.prototype.CATALOGUE = 1;

//Each workspace loads one instance of VarManager and Wiring
// Each workspace loads loads n instaces of Drabgoard!
Modules.prototype.ACTIVE_WORKSPACE = 2;




var PersistenceEngineFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function PersitenceEngine () {

		// ****************
		// PUBLIC METHODS 
		// ****************
		PersitenceEngine.prototype.send_get = function (url, context, successHandler, errorHandler, parameters, requestHeaders) {
			new Ajax.Request(url, {
				method: 'get',
				parameters: parameters,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			    });
		} 
		
		PersitenceEngine.prototype.send_post = function (url, params, context, successHandler, errorHandler, requestHeaders) {
			new Ajax.Request(url, {
				method: 'post',
				parameters: params,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			    });
		}
		
		PersitenceEngine.prototype.send_delete = function (url, context, successHandler, errorHandler, requestHeaders){
			new Ajax.Request(url, {
				method: 'delete',
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			});
		}
		
		PersitenceEngine.prototype.send_update = function (url, params, context, successHandler, errorHandler, requestHeaders){
			new Ajax.Request(url, {
				method: 'put',
				parameters: params,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			});
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new PersitenceEngine();
         	}
         	return instance;
       	}
	}
	
}();

//////////////////////////////////////////////
//                  XHTML                   //
//////////////////////////////////////////////

function XHtml(xhtml_) {
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var uri = null;
	uri = xhtml_.uri;

	
	// ****************
	//  PUBLIC METHODS
	// ****************
	
	this.getURICode = function() { return uri; }
}




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
	var capabilities = []; 
	
	// JSON-coded Gadget mapping
	// Constructing the structure
	vendor = gadget_.vendor;
	name = gadget_.name;
	version = gadget_.version;
	template = new GadgetTemplate(gadget_.variables, gadget_.size);
	xhtml = new XHtml(gadget_.xhtml);
	image = gadget_.image;
	capabilities = gadget_.capabilities;
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
        this.getCapabilities = function() { return capabilities; } 
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

var LogManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function LogManager () {
		
		/**** PRIVATE VARIABLES ****/
		this.logConsole = $('logs_console');
		this.logContainer = $('logs_container');
		this.messageContainer = $('message_section');
		this.messageBox = $('message_box');
		this.errorCount = 0;


		/**** PUBLIC METHODS****/
		LogManager.prototype.log = function(msg, level) {
//			if (this.errorCount++ == 0) {
//				$("logs_tab").className="tab";
//			}

			labelContent = ngettext("%(errorCount)s error", "%(errorCount)s errors", ++this.errorCount);
			labelContent = interpolate(labelContent, {errorCount: this.errorCount}, true);
			LayoutManagerFactory.getInstance().notifyError(labelContent);

			var logentry = document.createElement("p");

			switch (level) {
			default:
			case Constants.Logging.ERROR_MSG:
				icon = document.createElement("img");
				icon.setAttribute("src", "/ezweb/images/error.png");
				icon.setAttribute("class", "icon");
				icon.setAttribute("alt", "[Error] ");
				this.logConsole.appendChild(icon);
				try {
					console.error(msg);
				} catch (e) {}
				break;
			case Constants.Logging.WARN_MSG:
				icon = document.createElement("img");
				icon.setAttribute("src", "/ezweb/images/warning.png");
				icon.setAttribute("class", "icon"); 
				icon.setAttribute("alt", "[Warning] ");
				this.logConsole.appendChild(icon);
				try {
					if (console) console.warn(msg);
				} catch (e) {}
				break;
			case Constants.Logging.INFO_MSG:
				icon = document.createElement("img");
				icon.setAttribute("src", "/ezweb/images/info.png");
				icon.setAttribute("class", "icon");
				icon.setAttribute("alt", "[Info] ");
				this.logConsole.appendChild(icon);
				try {
					if (console) console.info(msg);
				} catch (e) {}
				break;
			}

			var index;
			while ((index = msg.indexOf("\n")) != -1) {
			  logentry.appendChild(document.createTextNode(msg.substring(0, index)));
			  logentry.appendChild(document.createElement("br"));
			  msg = msg.substring(index + 1);
			}
			logentry.appendChild(document.createTextNode(msg));
			this.logConsole.appendChild(logentry);

		}
		
		LogManager.prototype.show = function(){
			LayoutManagerFactory.getInstance().showLogs();
		}
		LogManager.prototype.hide = function(){
			LayoutManagerFactory.getInstance().hideView(this.logContainer);
		}
		LogManager.prototype.reset = function(){
			this.logConsole.innerHTML = '';
			this.errorCount = 0;
		}
		
		LogManager.prototype.showMessage = function(msg){
			this.messageBox.update(msg);
			this.messageContainer.setStyle({"display": "block"});
			setTimeout(function(){LogManagerFactory.getInstance().removeMessage()}, 3000);			
		}
		
		LogManager.prototype.removeMessage = function(){
			this.messageContainer.setStyle({"display": "none"});
			this.messageBox.update("");
		}
	}
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new LogManager();
         	}
         	return instance;
       	}
	}
}();


function WorkSpace (workSpaceState) {

	// ****************
	// CALLBACK METHODS
	// ****************

	// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
	var loadWorkSpace = function (transport) {
		// JSON-coded iGadget-variable mapping
		var response = transport.responseText;
		this.workSpaceGlobalInfo = eval ('(' + response + ')');

		this.varManager = new VarManager(this);
		var tabs = this.workSpaceGlobalInfo['workspace']['tabList'];

		try {
			var visibleTabId = null;

			if (tabs.length>0) {
				visibleTabId = tabs[0].id;
				for (var i=0; i<tabs.length; i++) {
					var tab = tabs[i];
					this.tabInstances[tab.id] = new Tab(tab, this);

					if (tab.visible == 'true') {
						visibleTabId = tab.id;
					}
				}
			}

			this.contextManager = new ContextManager(this, this.workSpaceGlobalInfo);
			this.wiring = new Wiring(this, this.workSpaceGlobalInfo);
			this.wiringInterface = new WiringInterface(this.wiring, this, $("wiring"), $("wiring_link"));

			if (tabs.length > 0) {
				for (i = 0; i < tabs.length; i++)
					this.tabInstances[tabs[i].id].getDragboard().paint();
			}

			//set the visible tab. It will be displayed as current tab afterwards
			this.visibleTab = this.tabInstances[visibleTabId];

			this.valid=true;
		} catch (error) {
			// Error during initialization
			// Only loading workspace menu
			this.valid=false;

			// Log it on the log console
			this.tabInstances = new Hash();
			msg = interpolate(gettext("Error loading workspace: %(error)s"),
			                  {error: error}, true);
			LogManagerFactory.getInstance().log(msg);

			// Show a user friend alert
			LayoutManagerFactory.getInstance().showMessageMenu('Error during workspace load! Please, change active workspace or create a new one!')
		}

		this.loaded = true;

		this._createWorkspaceMenu();

		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
	}

	var onError = function (transport, e) {
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
		msg = interpolate(gettext("Error retreiving workspace data: %(errorMsg)s."),
		                          {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var renameSuccess = function(transport) {
	}
	var renameError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error renaming workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
	}
	var deleteSuccess = function(transport) {
		var tabList = this.tabInstances.keys();
		
		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];
			tab.destroy;
			//TODO:treatment of wiring, varManager, etc.
		}
		LayoutManagerFactory.getInstance().hideCover();
	}
	var deleteError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error removing workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
	}
	var publishSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var mashupInfo = eval ('(' + response + ')');		
		UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', mashupInfo.url);
	}
	var publishError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error publishing workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
		
	}
	
	var mergeSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var data = eval ('(' + response + ')');
		//update the new wsInfo
		opManager = OpManagerFactory.getInstance();
		opManager.changeActiveWorkSpace(opManager.workSpaceInstances[data.merged_workspace_id]);
		LayoutManagerFactory.getInstance().hideCover();
	}
	
	var mergeError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error merging workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
		
	}	
	
	//**** TAB CALLBACK*****
	var createTabSuccess = function(transport) {
		var response = transport.responseText;
		var tabInfo = eval ('(' + response + ')');
		
		tabInfo.igadgetList=[];
		
		var newTab = new Tab(tabInfo, this);
		this.tabInstances[tabInfo.id] = newTab;
		this._checkLock();
		this.setTab(this.tabInstances[tabInfo.id]);
		for(var i=0; i< tabInfo.workspaceVariables.length; i++){
			this.varManager.parseWorkspaceVariable(tabInfo.workspaceVariables[i]);
			this.wiring.processVar(tabInfo.workspaceVariables[i]);
		}

		newTab.getDragboard().paint();
	}
	
	var createTabError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error creating a tab: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	// ****************
	// PUBLIC METHODS
	// ****************
	
	WorkSpace.prototype.igadgetLoaded = function(igadgetId) {
		var igadget = this.getIgadget(igadgetId);
		var reload = igadget.loaded;
		igadget._notifyLoaded();

		if (reload) {
			this.wiring.refreshIGadget(igadget);
		} if (this._allIgadgetsLoaded()) {
			this.wiring.propagateInitialValues(true);
		}
	}
	
	WorkSpace.prototype.sendBufferedVars = function () {
		this.varManager.sendBufferedVars();
	}
	
	WorkSpace.prototype.fillWithLabel = function() {
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		if(this.workSpaceNameHTMLElement != null){
			this.workSpaceNameHTMLElement.remove();
		}
		var nameToShow = (this.workSpaceState.name.length>15)?this.workSpaceState.name.substring(0, 15)+"..." : this.workSpaceState.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
		new Insertion.Top(this.workSpaceHTMLElement, spanHTML);
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		Event.observe(this.workSpaceNameHTMLElement, 'click', function(e){this.fillWithInput();}.bind(this));
    }


	WorkSpace.prototype.fillWithInput = function () {
		this.workSpaceNameHTMLElement.remove();
		var inputHTML = "<input class='ws_name' value='"+this.workSpaceState.name+"' size='"+this.workSpaceState.name.length+" maxlength=30' />";
		new Insertion.Top(this.workSpaceHTMLElement, inputHTML);
		this.workSpaceNameHTMLElement =  this.workSpaceHTMLElement.firstDescendant();
		this.workSpaceNameHTMLElement.focus();	
		Event.observe(this.workSpaceNameHTMLElement, 'blur', function(e){Event.stop(e);
					this.fillWithLabel()}.bind(this));
		Event.observe(this.workSpaceNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
					e.target.blur();}}.bind(this));						
		Event.observe(this.workSpaceNameHTMLElement, 'change', function(e){Event.stop(e);
					this.updateInfo(e.target.value);}.bind(this));
		Event.observe(this.workSpaceNameHTMLElement, 'keyup', function(e){Event.stop(e);
					e.target.size = (e.target.value.length==0)?1:e.target.value.length;}.bind(this));
	}
	
	
    WorkSpace.prototype.updateInfo = function (workSpaceName) {
		//If the server isn't working the changes will not be saved
		if(workSpaceName == "" || workSpaceName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a workspace: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		}else if(!OpManagerFactory.getInstance().workSpaceExists(workSpaceName)){
			this.workSpaceState.name = workSpaceName;		
	
			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
			var o = new Object;
			o.name = workSpaceName;
			var workSpaceData = Object.toJSON(o);
			var params = {'workspace': workSpaceData};
			PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, renameSuccess, renameError);
		}else{
			var msg = interpolate(gettext("Error updating a workspace: the name %(workSpaceName)s is already in use."), {workSpaceName: workSpaceName}, true);
			LogManagerFactory.getInstance().log(msg);
		}
    }  
    
    WorkSpace.prototype.deleteWorkSpace = function() {
		if(OpManagerFactory.getInstance().removeWorkSpace(this.workSpaceState.id)){
			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
			PersistenceEngineFactory.getInstance().send_delete(workSpaceUrl, this, deleteSuccess, deleteError);		
		}
	}
    
    WorkSpace.prototype.getName = function () {
    	return this.workSpaceState.name;
	}
	
    WorkSpace.prototype.getId = function () {
    	return this.workSpaceState.id;
	}
    
    WorkSpace.prototype.getWiring = function () {
    	return this.wiring;
	}
	
	WorkSpace.prototype.getWiringInterface = function () {
    	return this.wiringInterface;
	}
    
    WorkSpace.prototype.getVarManager = function () {
    	return this.varManager;
	}
	
	WorkSpace.prototype.getContextManager = function () {
    	return this.contextManager;
	}

	WorkSpace.prototype.downloadWorkSpaceInfo = function () {
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
		PersistenceEngineFactory.getInstance().send_get(workSpaceUrl, this, loadWorkSpace, onError);
	}
	
	WorkSpace.prototype.showWiring = function() {
		if (!this.loaded)
			return;
	
		if (!this.isValid())
			return;
		
		this.visibleTab.unmark();
		this.wiringInterface.show();
	}
	
	WorkSpace.prototype.getIgadget = function(igadgetId) {
		var tabs = this.tabInstances.keys();	
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var igadget = this.tabInstances[tab].getDragboard().getIGadget(igadgetId);
			
			if (igadget)
				return igadget;
		}
	}

	//hide all information about a workspace (wiring, tabs)
	WorkSpace.prototype.hide = function() {
		if (!this.loaded)
			return;
		
		//this.wiringInterface.hide();

		
		var tabList = this.tabInstances.keys();
		
		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];
			
			tab.hide();
		}
	}

	WorkSpace.prototype.show = function() {	
		if (!this.loaded)
			return;

		//global tab section
		this.fillWithLabel();

		var tabList = this.tabInstances.keys();

		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];

			if (tab == this.visibleTab)
				tab.show();
			else
				tab.unmark();
		}

		if (this.visibleTab) {
			//show the current tab in the tab bar if it isn't within the visible area
			//!this.visibleTab => error during initialization
			this.visibleTab.makeVisibleInTabBar();
			this.visibleTab.getDragboard()._notifyWindowResizeEvent();
		}

	}
	
	WorkSpace.prototype.isValid = function() {
		return this.valid;
	}
	
	WorkSpace.prototype.getTab = function(tabId) {
		return this.tabInstances[tabId];
	}
	
	WorkSpace.prototype.setTab = function(tab) {
		if (!this.loaded)
			return;
		if(this.visibleTab != null){
			this.visibleTab.unmark();
		}
		this.visibleTab = tab;
		this.visibleTab.show();
		
	}
	
	WorkSpace.prototype.getVisibleTab = function() {
		if (!this.loaded)
			return;
		
		return this.visibleTab;
	}
	
	WorkSpace.prototype.tabExists = function(tabName){
		var tabValues = this.tabInstances.values();
		for(var i=0;i<tabValues.length;i++){
			if(tabValues[i].tabInfo.name == tabName)
				return true;
		}
		return false;
	}
	
	WorkSpace.prototype.addTab = function() {
		if (!this.isValid()) {
			return;
		}
	
		var counter = this.tabInstances.keys().length + 1;
		var tabName = "MyTab "+counter.toString();
		//check if there is another tab with the same name
		while (this.tabExists(tabName)){
			tabName = "MyTab "+(counter++).toString();
		}
		var tabsUrl = URIs.GET_POST_TABS.evaluate({'workspace_id': this.workSpaceState.id});
		var o = new Object;
		o.name = tabName;
		tabData = Object.toJSON(o);
		params = 'tab=' + tabData;
		PersistenceEngineFactory.getInstance().send_post(tabsUrl, params, this, createTabSuccess, createTabError);
	
	}
	
	WorkSpace.prototype.removeTab = function(tabId){
		if(this.tabInstances.keys().length <= 1){
			var msg;
			msg = "there must be one tab at least";

			msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
			return false;
		}
		
		this.unloadTab(tabId);
		
		//set the first tab as current
		this.setTab(this.tabInstances.values()[0]);
		
		return true
	}
	
	WorkSpace.prototype.unloadTab = function(tabId){
		var tab = this.tabInstances[tabId];

		this.tabInstances.remove(tabId);

		this.varManager.removeWorkspaceVariable(tab.connectable.variable.id);

		tab.connectable.destroy();
		tab.destroy();

		this.visibleTab = null;
	}
	
	WorkSpace.prototype.unload = function() {
		// Unload Wiring Interface
		// TODO Wiring Interface should be shared between Workspaces
		if (this.wiringInterface !== null) {
			this.wiringInterface.unload();
			this.wiringInterface = null;
		}

		LayoutManagerFactory.getInstance().unloadCurrentView();

		this.sendBufferedVars();

		// After that, tab info is managed
		var tabKeys = this.tabInstances.keys();

		for (var i=0; i<tabKeys.length; i++) {
			this.unloadTab(tabKeys[i]);
		}
		// reset the values used to figure out the size of the tabBar
		LayoutManagerFactory.getInstance().resetTabBar();

		if (this.wiring !== null)
			this.wiring.unload();
		if (this.contextManager !== null)
			this.contextManager.unload();

		this.menu.remove();
		this.mergeMenu.remove();
	}

	WorkSpace.prototype.goTab = function(tab) {
		if (!this.loaded)
			return;
		
		this.visibleTab.unmark();
		this.visibleTab = tab;
		this.visibleTab.go();
	}
	

	WorkSpace.prototype.addIGadget = function(tab, igadget, igadgetJSON) {
		this.varManager.addInstance(igadget, igadgetJSON);
		this.contextManager.addInstance(igadget, igadget.getGadget().getTemplate());
		this.wiring.addInstance(igadget, igadgetJSON.variables);

		igadget.paint();

		// The dragboard must be shown after an igadget insertion
		//LayoutManagerFactory.getInstance().unMarkGlobalTabs();
		this.visibleTab.show();
	}
	
	WorkSpace.prototype.removeIGadgetData = function(iGadgetId) {
			this.varManager.removeInstance(iGadgetId);
			this.wiring.removeInstance(iGadgetId);
			this.contextManager.removeInstance(iGadgetId);
	}
	
	WorkSpace.prototype.removeIGadget = function(iGadgetId) {
			this.visibleTab.getDragboard().removeInstance(iGadgetId); // TODO split into hideInstance and removeInstance
			this.removeIGadgetData(iGadgetId);
	}

	WorkSpace.prototype.getIGadgets = function() {
		if (!this.loaded)
			return;

		var iGadgets = new Array();
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			iGadgets = iGadgets.concat(this.tabInstances[keys[i]].getDragboard().getIGadgets());
		}

		return iGadgets;
	}
	
	WorkSpace.prototype.getActiveDragboard = function() {
		return this.visibleTab.getDragboard();
	}
	
	WorkSpace.prototype.publish = function(data) {
		var workSpaceUrl = URIs.POST_PUBLISH_WORKSPACE.evaluate({'workspace_id': this.workSpaceState.id});
		publicationData = Object.toJSON(data);
		params = 'data=' + publicationData;
		PersistenceEngineFactory.getInstance().send_post(workSpaceUrl, params, this, publishSuccess, publishError);
	}
	
		WorkSpace.prototype.mergeWith = function(workspace_id){
			var workSpaceUrl = URIs.GET_MERGE_WORKSPACE.evaluate({'from_ws_id': workspace_id, 'to_ws_id': this.workSpaceState.id});
			PersistenceEngineFactory.getInstance().send_get(workSpaceUrl, this, mergeSuccess, mergeError);			
		}

    // *****************
    //  CONSTRUCTOR
    // *****************

	this.workSpaceState = workSpaceState;
	this.workSpaceGlobal = null;
	this.wiringInterface = null;
	this.varManager = null;
	this.tabInstances = new Hash();
	this.wiring = null;
	this.varManager = null;
	this.contextManager = null;
	this.loaded = false;
	this.wiringLayer = null;
	this.visibleTab = null;
	this.workSpaceHTMLElement = $('workspace_name');
	this.menu = null;
	this.mergeMenu = null;
	this.unlockEntryPos;
	this.valid=false;
	
	var wsOpsLauncher = 'ws_operations_link';
	var idMenu = 'menu_'+this.workSpaceState.id;
	
	
	//create workspace menu
	this._createWorkspaceMenu = function(){

		//worksplace menu
		var optionPosition = 0;
		var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"><div id="submenu_'+idMenu+'" class="submenu"></div></div>';
		new Insertion.After($('menu_layer'), menuHTML);
		this.menu = new DropDownMenu(idMenu);
		
		//mergeWith workspace Menu
		var idMergeMenu = 'mergeMenu_'+this.workSpaceState.id;
		var mergeMenuHTML = '<div id="'+idMergeMenu+'" class="drop_down_menu"></div></div>';
		new Insertion.After($('menu_layer'), mergeMenuHTML);
		this.mergeMenu = new DropDownMenu(idMergeMenu, this.menu);
		
		//adding options to workspace menu
		this.menu.addOption("/ezweb/images/rename.gif", "Rename", function(){OpManagerFactory.getInstance().activeWorkSpace.fillWithInput(); 
							LayoutManagerFactory.getInstance().hideCover();},optionPosition++);
		if (this.workSpaceGlobalInfo.workspace.active != "true") {
			this.activeEntryId = this.menu.addOption("/ezweb/images/active.png", "Mark as Active", function(){LayoutManagerFactory.getInstance().hideCover(); this.markAsActive();}.bind(this),optionPosition++);
		}
		this.unlockEntryPos = optionPosition;
		this.unlockEntryId = this.menu.addOption("/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this), optionPosition++);
		this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this), optionPosition++);							
		var res = this._checkLock();
		optionPosition -= res;

		this.menu.addOption("/ezweb/images/remove.png","Remove",function(){LayoutManagerFactory.getInstance().showWindowMenu('deleteWorkSpace');}, optionPosition++);
		//TODO:Intermediate window to ask for data (name, description...)
		this.menu.addOption("/ezweb/images/publish.png","Publish workspace",function(){LayoutManagerFactory.getInstance().showWindowMenu('publishWorkSpace');}.bind(this), optionPosition++);
		if(OpManagerFactory.getInstance().workSpaceInstances.keys().length > 1){ //there are several workspaces
			this.menu.addOption("/ezweb/images/merge.png","Merge with workspace...",function(e){LayoutManagerFactory.getInstance().showDropDownMenu('workSpaceOpsSubMenu',this.mergeMenu, Event.pointerX(e), Event.pointerY(e));}.bind(this), optionPosition++);
		}
		this.menu.addOption("/ezweb/images/list-add.png","New workspace",function(){LayoutManagerFactory.getInstance().showWindowMenu('createWorkSpace');}, optionPosition++);
	}
	
	this._lockFunc = function(locked) {
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			this.tabInstances[keys[i]]._lockFunc(locked);
		}
	}.bind(this);
	
	this._checkLock = function() {
		var keys = this.tabInstances.keys();
		var all = true;
		var locked = null;
		var numRemoved = 0;
		var position = this.unlockEntryPos;
		for (var i = 0; i < keys.length; i++) {
			if (i == 0){
				locked = this.tabInstances[keys[i]].dragboard.isLocked();
			} else if (locked != this.tabInstances[keys[i]].dragboard.isLocked()){
				all = false;
			}
		}
		
		if(all){
			if(locked && this.lockEntryId!=null){
				this.menu.removeOption(this.lockEntryId);
				this.lockEntryId = null;
				numRemoved++;
			}else if(!locked && this.unlockEntryId!=null){
				this.menu.removeOption(this.unlockEntryId);
				this.unlockEntryId = null;	
				numRemoved++;
			}
		}
		
		if((!all || locked) && this.unlockEntryId==null){
			this.unlockEntryId = this.menu.addOption("/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this), this.unlockEntryPos);
		}
		if((!all || !locked) && this.lockEntryId==null){
			if(this.unlockEntryId)
				position = this.unlockEntryPos + 1;
			this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this), position);	
		}
		return numRemoved;
	}.bind(this);
	
	this.markAsActive = function (){
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
		var o = new Object;
		o.active = "true"
		var workSpaceData = Object.toJSON(o);
		var params = {'workspace': workSpaceData};
		PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, this.markAsActiveSuccess, this.markAsActiveError);
	}.bind(this);
	
	this.markAsActiveSuccess = function() {
		this.workSpaceGlobalInfo.workspace.active = "true";
		this.workSpaceState.active = "true";
		if(this.activeEntryId!=null){
			this.menu.removeOption(this.activeEntryId);
			this.activeEntryId = null;
		}
	}.bind(this);
	
	this.markAsActiveError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error marking as first active workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}.bind(this);
	
	this._allIgadgetsLoaded = function() {
		var tabs = this.tabInstances.keys();	
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var remainingIgadgets = this.tabInstances[tab].getDragboard().getRemainingIGadgets();
			
			if (remainingIgadgets != 0)
				return false;
		}	
		
		return true;
	}
}


function Tab (tabInfo, workSpace) {

	//CALLBACK METHODS
	var renameSuccess = function(transport){

	}
	var renameError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error renaming a tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var deleteSuccess = function(transport){
		LayoutManagerFactory.getInstance().hideCover();
	}
	var deleteError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error removing a tab: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
		
		LayoutManagerFactory.getInstance().hideCover();
	}

	// ****************
	// PUBLIC METHODS
	// ****************

	Tab.prototype.destroy = function() {
		LayoutManagerFactory.getInstance().removeFromTabBar(this.tabHTMLElement);
		
		this.menu.remove();
		
		this.dragboard.destroy();
	}


	Tab.prototype.updateInfo = function (tabName) {

		//If the server isn't working the changes will not be saved
		if(tabName=="" || tabName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a tab: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		}else if(!this.workSpace.tabExists(tabName)){
			this.tabInfo.name = tabName;
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			var o = new Object;
			o.name = tabName;
			var tabData = Object.toJSON(o);
			var params = {'tab': tabData};
			PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, renameSuccess, renameError);
		}else{
			var msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workSpace.workSpaceState.name}, true);
			LogManagerFactory.getInstance().log(msg);
		}
	}

	Tab.prototype.deleteTab = function() {
		if(this.workSpace.removeTab(this.tabInfo.id)==true){
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			PersistenceEngineFactory.getInstance().send_delete(tabUrl, this, deleteSuccess, deleteError);		
		}
	}

	Tab.prototype.fillWithLabel = function() {
		if(this.tabNameHTMLElement != null){
			this.tabNameHTMLElement.remove();
		}
		var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
		new Insertion.Top(this.tabHTMLElement, spanHTML);
		var difference = this.tabHTMLElement.getWidth() - this.tabWidth;
		if(difference!=0)
			LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabNameHTMLElement = this.tabHTMLElement.firstDescendant();
		this.tabWidth = this.tabHTMLElement.getWidth();
	}

	Tab.prototype.fillWithInput = function () {
		var oldTabWidth= this.tabHTMLElement.getWidth();
		this.tabNameHTMLElement.remove();
		var inputHTML = "<input class='tab_name' value='"+this.tabInfo.name+"' size='"+(this.tabInfo.name.length)+"' maxlength=30 />";
		new Insertion.Top(this.tabHTMLElement, inputHTML);
		this.tabNameHTMLElement =  this.tabHTMLElement.firstDescendant();
		var newTabWidth= this.tabHTMLElement.getWidth();
		var difference= newTabWidth-oldTabWidth;
		if (difference!=0)
			LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabWidth = newTabWidth;
		
		this.tabNameHTMLElement.focus();
		Event.observe(this.tabNameHTMLElement, 'blur', function(e){Event.stop(e);
					this.fillWithLabel()}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
					e.target.blur();} else{this.makeVisibleInTabBar();}}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'change', function(e){Event.stop(e);
					this.updateInfo(e.target.value);}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keyup', function(e){Event.stop(e);
					e.target.size = (e.target.value.length==0)?1:e.target.value.length;
					var newTabWidth = e.target.parentNode.getWidth();
					var difference= newTabWidth-this.tabWidth;
					if (difference!=0)
						LayoutManagerFactory.getInstance().changeTabBarSize(difference);
					this.tabWidth = newTabWidth;
				}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'click', function(e){Event.stop(e);}); //do not propagate to div.
	}
	
	Tab.prototype.unmark = function () {
		//this.hideDragboard();
		LayoutManagerFactory.getInstance().unmarkTab(this.tabHTMLElement, this.tabOpsLauncher, this.changeTabHandler, this.renameTabHandler);

	}

	Tab.prototype.show = function () {
		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

		this.dragboard._notifyWindowResizeEvent();
		this.markAsCurrent();
	}
	
		/* if the tab is out of the visible area of the tab bar, slide it to show it */
	Tab.prototype.makeVisibleInTabBar = function(){
		var tabLeft = Position.cumulativeOffset(this.tabHTMLElement)[0];
		var fixedBarLeft = LayoutManagerFactory.getInstance().getFixedBarLeftPosition();
		var difference = tabLeft - fixedBarLeft;
		if (difference < 0){
			LayoutManagerFactory.getInstance().changeScrollBarRightPosition(difference);
		}
		else{
			var fixedBarRight = fixedBarLeft + LayoutManagerFactory.getInstance().getFixedBarWidth();
			var visibleTabArea = fixedBarRight - tabLeft;
			difference = visibleTabArea - this.tabHTMLElement.getWidth();
			if(difference < 0){
				LayoutManagerFactory.getInstance().changeScrollBarRightPosition(-1*difference);
			}
		}
	}
	
	Tab.prototype.markAsCurrent = function (){
		LayoutManagerFactory.getInstance().markTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	}
	
	Tab.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideTab(this.tabHTMLElement);
		//this.hideDragboard();
	}
	
	Tab.prototype.go = function () {

		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

	    this.dragboard.recomputeSize();
	    LayoutManagerFactory.getInstance().goTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	    this.makeVisibleInTabBar();
	}

	Tab.prototype.getDragboard = function () {
		return this.dragboard;
	}

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	
	/*constructor*/
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.dragboardLayerName = "dragboard_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabHTMLElement;
	this.tabNameHTMLElement = null;
	this.tabWidth = 0;

	//tab event handlers
	this.renameTabHandler = function(e){
		this.makeVisibleInTabBar();
		this.fillWithInput();
	}.bind(this);
	
	this.changeTabHandler = function(e){
		this.workSpace.setTab(this);
		this.makeVisibleInTabBar();
	}.bind(this);

	// Dragboard layer creation
	var wrapper = $("wrapper");

	this.dragboardElement = document.createElement("div");
	this.dragboardElement.className = "container dragboard";
	wrapper.insertBefore(this.dragboardElement, wrapper.firstChild);

	this.dragboardElement.setAttribute('id', this.dragboardLayerName);

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	
	LayoutManagerFactory.getInstance().resizeContainer(this.dragboardElement);
	
	// Tab creation
	//add a new tab to the tab section
	this.tabHTMLElement = LayoutManagerFactory.getInstance().addToTabBar(this.tabName);

	this.tabOpsLauncher = this.tabName+"_launcher";
	var tabOpsLauncherHTML = '<input id="'+this.tabOpsLauncher+'" type="button" title="'+gettext("Options")+'" class="tabOps_launcher tabOps_launcher_show"/>';
	new Insertion.Bottom(this.tabHTMLElement, tabOpsLauncherHTML);
	var tabOpsLauncherElement = $(this.tabOpsLauncher);
	Event.observe(tabOpsLauncherElement, "click", function(e){e.target.blur();Event.stop(e);
													LayoutManagerFactory.getInstance().showDropDownMenu('tabOps',this.menu, Event.pointerX(e), Event.pointerY(e));}.bind(this), true);
	tabOpsLauncherElement.setStyle({'display':'none'});

	//fill the tab label with a span tag
	this.fillWithLabel();

	//create tab menu
	var idMenu = 'menu_'+this.tabName;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);
	this.menu.addOption("/ezweb/images/rename.gif", "Rename", function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().fillWithInput();
								LayoutManagerFactory.getInstance().hideCover();},0);

	this._lockFunc = function(locked) {
		if (locked) {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this));
		} else {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this));	
		}
		this.dragboard.setLock(locked);
		this.workSpace._checkLock();
	}.bind(this);

	if (this.dragboard.isLocked()) {
		this.lockEntryId = this.menu.addOption("/ezweb/images/unlock.png", "Unlock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this),1);
	} else {
		this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", "Lock", function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this),1);
	}
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.firstVisible = false;
				tab.visibleEntryId = tab.menu.addOption("/ezweb/images/visible.png", "First Visible", function(){LayoutManagerFactory.getInstance().hideCover(); tab.markAsVisible();}.bind(tab),1);	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisible = function (){
		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
		var o = new Object;
		o.visible = "true";
		var tabData = Object.toJSON(o);
		var params = {'tab': tabData};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, this.markAsVisibleSuccess, this.markAsVisibleError);
	}.bind(this);
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.addMarkAsVisible();	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisibleError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}.bind(this);
	
	this.addMarkAsVisible = function (){
		this.firstVisible = false;
		this.visibleEntryId = this.menu.addOption("/ezweb/images/visible.png", "Mark as Visible", function(){LayoutManagerFactory.getInstance().hideCover(); this.markAsVisible();}.bind(this),1);
	}.bind(this);
	
	if (this.tabInfo.visible != "true") {
		this.addMarkAsVisible();
	} else {
		this.firstVisible = true;
		this.visibleEntryId = null;
	}
	
	this.menu.addOption("/ezweb/images/remove.png", "Remove",function(){LayoutManagerFactory.getInstance().showWindowMenu('deleteTab');},2);
}


var OpManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function OpManager () {
	        
	    // ****************
		// CALLBACK METHODS 
		// ****************
		
		var loadEnvironment = function (transport) {
			// JSON-coded user tabspaces
			var response = transport.responseText;
			var workSpacesStructure = eval ('(' + response + ')');
			
			var isDefaultWS = workSpacesStructure.isDefault;
			var workSpaces = workSpacesStructure.workspaces;
			var activeWorkSpace = null;
			
			for (var i = 0; i<workSpaces.length; i++) {
				var workSpace = workSpaces[i];

				this.workSpaceInstances[workSpace.id] = new WorkSpace(workSpace);

				if (workSpace.active == "true") {
					activeWorkSpace=this.workSpaceInstances[workSpace.id];
				}
			}
			
			// set handler for workspace options button
			Event.observe($('ws_operations_link'), 'click', function(e){e.target.blur();LayoutManagerFactory.getInstance().showDropDownMenu('workSpaceOps', this.activeWorkSpace.menu, Event.pointerX(e), Event.pointerY(e));}.bind(this));
			
			// Total information of the active workspace must be downloaded!
			if (isDefaultWS=="true"){
				//the showcase must be reloaded to have all new gadgets
				//it itself changes to the active workspace
				ShowcaseFactory.getInstance().reload(workSpace.id);
				
			}else{
				this.activeWorkSpace = activeWorkSpace;
				this.activeWorkSpace.downloadWorkSpaceInfo();
			}
		}
		
		var onError = function (transport, e) {
			var msg;
			try {
				if (e) {
					msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
					                  true);
				} else if (transport.responseXML) {
					msg = transport.responseXML.documentElement.textContent;
				} else {
					msg = "HTTP Error " + transport.status + " - " + transport.statusText;
				}
				msg = interpolate(gettext("Error loading EzWeb Platform: %(errorMsg)s."),
				                          {errorMsg: msg}, true);
				LogManagerFactory.getInstance().log(msg);
			} catch (e) {
			}

			alert (gettext("Error loading EzWeb Platform"));
		}
		
		/*****WORKSPACE CALLBACK***/
		var createWSSuccess = function(transport){
			var response = transport.responseText;
			var wsInfo = eval ('(' + response + ')');
			this.workSpaceInstances[wsInfo.workspace.id] = new WorkSpace(wsInfo.workspace);
			this.changeActiveWorkSpace(this.workSpaceInstances[wsInfo.workspace.id]);
			LayoutManagerFactory.getInstance().hideCover();
		}
		
		var createWSError = function(transport, e){
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error creating a workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		
		}

		
		// *********************************
		// PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		// Singleton modules
		this.showcaseModule = null;
		this.contextManagerModule = null;
		this.catalogue = null;
		this.logs = null;
		this.persistenceEngine = PersistenceEngineFactory.getInstance();
		
		this.loadCompleted = false;
		this.firstAccessToTheCatalogue = true;
		this.catalogueIsCurrentTab = false;
		
		// Variables for controlling the collection of wiring and dragboard instances of a user
		this.workSpaceInstances = new Hash();
		this.activeWorkSpace = null;

		
		// ****************
		// PUBLIC METHODS 
		// ****************

		OpManager.prototype.showCatalogue = function () {
			if (!this.activeWorkSpace.isValid()) {
				//Nothing to do!
				return;
			}

			UIUtils.repaintCatalogue=true;
			UIUtils.sendPendingTags();
			
			if (LayoutManagerFactory.getInstance().getCurrentViewType() == 'catalogue') { 
				this.catalogueIsCurrentTab = true;
			}
			this.catalogue.show();

			this.activeWorkSpace.getVisibleTab().markAsCurrent();
			
			// Load catalogue data!
			if (this.firstAccessToTheCatalogue || this.catalogueIsCurrentTab)
			{
				this.catalogue.initCatalogue();
				this.firstAccessToTheCatalogue = false;
				this.catalogueIsCurrentTab = false;
			} else {
				UIUtils.repaintCatalogue=false;
			}
		}

		OpManager.prototype.showLogs = function () {
			if(this.activeWorkSpace && this.activeWorkSpace.getVisibleTab())
				this.activeWorkSpace.getVisibleTab().unmark();
			
			LogManagerFactory.getInstance().show();
		}
		
		OpManager.prototype.clearLogs = function () {
			LogManagerFactory.getInstance().reset();
			LayoutManagerFactory.getInstance().clearErrors();
		}

		OpManager.prototype.changeActiveWorkSpace = function (workSpace) {
			$("loading-indicator").removeClassName("disabled"); // TODO

			if(this.activeWorkSpace != null){
				this.activeWorkSpace.unload();
			}

			this.activeWorkSpace = workSpace;
			this.activeWorkSpace.downloadWorkSpaceInfo();
		}

		OpManager.prototype.addInstance = function (gadgetId) {
			if (!this.loadCompleted)
				return;

			var gadget = this.showcaseModule.getGadget(gadgetId);
			this.activeWorkSpace.getVisibleTab().getDragboard().addInstance(gadget);
		}

		OpManager.prototype.unsubscribeServices = function (gadgetId) {
			var unsubscribeOk = function (transport) {
			}

			var unsubscribeError = function (transport) {
			}

			unsubscribe_url += "?igadget=";
			unsubscribe_url += gadgetId;
			unsubscribe_url += "&user=";
			unsubscribe_url += ezweb_user_name;

			var params = {'method': "GET", 'url':  unsubscribe_url}; 
			this.persistenceEngine.send_post("/proxy", params, this, unsubscribeOk, unsubscribeError);
		}

		OpManager.prototype.cancelServices = function (gadgetId) {
			var cancelOk = function (transport) {
			}

			var cancelError = function (transport) {
			}

			var cancel_url = URIs.HOME_GATEWAY_DISPATCHER_CANCEL_URL;

			cancel_url += "?igadget=";
			cancel_url += gadgetId;
			cancel_url += "&user=";
			cancel_url += ezweb_user_name;

			var params = {'method': "GET", 'url':  cancel_url};
			this.persistenceEngine.send_post("/proxy", params, this, cancelOk, cancelError);
		}

		OpManager.prototype.removeInstance = function (iGadgetId) {
			if (!this.loadCompleted)
				return;
			this.activeWorkSpace.removeIGadget(iGadgetId);
		}


		OpManager.prototype.sendEvent = function (gadget, event, value) {
			this.activeWorkSpace.getWiring().sendEvent(gadget, event, value);
		}

		OpManager.prototype.loadEnviroment = function () {
			// Init Layout Manager
			LayoutManagerFactory.getInstance().resizeWrapper();

			// First, global modules must be loaded (Showcase, Catalogue)
			// Showcase is the first!
			// When it finish, it will invoke continueLoadingGlobalModules method!
			this.showcaseModule = ShowcaseFactory.getInstance();
			this.showcaseModule.init();
			this.logs = LogManagerFactory.getInstance();

			Event.observe(window,
			              "unload",
			              this.unloadEnvironment.bind(this),
			              true);
		}

		OpManager.prototype.unloadEnvironment = function() {
			if (this.activeWorkSpace)
				this.activeWorkSpace.unload();

			UIUtils.sendPendingTags();
		}

		OpManager.prototype.igadgetLoaded = function (igadgetId) {
			this.activeWorkSpace.igadgetLoaded(igadgetId);
		}

		OpManager.prototype.showActiveWorkSpace = function () {
			var workSpaceIds = this.workSpaceInstances.keys();
			var disabledWorkSpaces= [];
			var j=0;
			for (var i=0; i<workSpaceIds.length; i++) {
				var workSpace = this.workSpaceInstances[workSpaceIds[i]];
				if (workSpace != this.activeWorkSpace) {
					disabledWorkSpaces[j] = workSpace;
					j++;
				}
			}

			this.activeWorkSpace.show();
			LayoutManagerFactory.getInstance().refreshChangeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
			LayoutManagerFactory.getInstance().refreshMergeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
		}

		OpManager.prototype.continueLoadingGlobalModules = function (module) {
			// Asynchronous load of modules
			// Each singleton module notifies OpManager it has finished loading!

			if (module == Modules.prototype.SHOWCASE) {
				this.catalogue = CatalogueFactory.getInstance();
				return;
			}

			if (module == Modules.prototype.CATALOGUE) {
				// All singleton modules has been loaded!
				// It's time for loading tabspace information!
				this.loadActiveWorkSpace();
				return;
			}

			if (module == Modules.prototype.ACTIVE_WORKSPACE) {
				this.showActiveWorkSpace(this.activeWorkSpace);
//				this.changeActiveWorkSpace(this.activeWorkSpace);
				//ezweb fly
				if(!BrowserUtilsFactory.getInstance().isIE()) {
					var s = document.createElement('style');
					s.type = "text/css";
					s.innerHTML = '.container { background-image: url(/ezweb/init.dat); background-repeat: no-repeat; background-attachment:scroll; background-position: center bottom;}';
					var h = document.getElementsByTagName("head")[0];
					h.appendChild(s);
				}//TODO: for IE try: document.createStyleSheet() and addRule()

				LayoutManagerFactory.getInstance()._notifyPlatformReady(!this.loadComplete);
				this.loadCompleted = true;
			}
		}

		OpManager.prototype.loadActiveWorkSpace = function () {
			// Asynchronous load of modules
			// Each singleton module notifies OpManager it has finished loading!

			this.persistenceEngine.send_get(URIs.GET_POST_WORKSPACES, this, loadEnvironment, onError)
		}

		OpManager.prototype.logIGadgetError = function(iGadgetId, msg, level) {
			var iGadget = this.activeWorkSpace.getIgadget(iGadgetId);
			if (iGadget == null) {
				var msg2 = gettext("Some pice of code tried to notify an error in the iGadget %(iGadgetId)s when it did not exist or it was not loaded yet. This is an error in EzWeb Platform, please notify it.\nError Message: %(errorMsg)s");
				msg2 = interpolate(msg2, {iGadgetId: iGadgetId, errorMsg: msg}, true);
				this.logs.log(msg2);
				return;
			}

			var gadgetInfo = iGadget.getGadget().getInfoString();
			msg = msg + "\n" + gadgetInfo;

			this.logs.log(msg, level);
			iGadget.notifyError();
		}

		//Operations on workspaces
		
		OpManager.prototype.workSpaceExists = function (newName){
			var workSpaceValues = this.workSpaceInstances.values();
			for(var i=0;i<workSpaceValues.length;i++){
			if(workSpaceValues[i].workSpaceState.name == newName)
				return true;
			}
			return false;
		}

		OpManager.prototype.addWorkSpace = function (newName) {
			var o = new Object;
			o.name = newName;
			var wsData = Object.toJSON(o);
			var params = {'workspace': wsData};
			PersistenceEngineFactory.getInstance().send_post(URIs.GET_POST_WORKSPACES, params, this, createWSSuccess, createWSError);

		}

		OpManager.prototype.unloadWorkSpace = function(workSpaceId) {
			//Unloading the Workspace
			this.workSpaceInstances[workSpaceId].unload();

			// Removing reference
			//this.workSpaceInstances.remove(workSpaceId);
		}

		OpManager.prototype.removeWorkSpace = function(workSpaceId){
			if (this.workSpaceInstances.keys().length <= 1) {
				var msg = "there must be one workspace at least";
				msg = interpolate(gettext("Error removing workspace: %(errorMsg)s."), {errorMsg: msg}, true);
				
				LogManagerFactory.getInstance().log(msg);
				LayoutManagerFactory.getInstance().hideCover();
				return false;
			}

			// Removing reference
			this.workSpaceInstances.remove(workSpaceId);

			//set the first workspace as current (and unload the former)
			this.changeActiveWorkSpace(this.workSpaceInstances.values()[0]);

			return true;
		}
	}

	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
		this.getInstance = function() {
			if (instance == null) {
				instance = new OpManager();
			}
			return instance;
		}
	}
}();



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
    if (this.annotated) {
	// If not annotated, the value must be managed!
        // And it must be changed to NOT annotated!
	this.annotated = false;	

	var varInfo = [{id: this.id, value: newValue, aspect: this.aspect}];
	switch (this.aspect) {
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




function VarManager (_workSpace) {
	
	VarManager.prototype.MAX_BUFFERED_REQUESTS = 10 
	
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
	
	VarManager.prototype.sendBufferedVars = function () {
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
		
		// Max lenght of buffered requests have been reached. Uploading to server!
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
		this.workspaceModifiedVars.removeById(ws_varId);
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
				this.igadgetModifiedVars.removeById(variables_ids[i]);
				delete this.variables[variables_ids[i]];
			}
		}
	}
	
	VarManager.prototype.unload = function () {	
		delete this;
	}

	VarManager.prototype.commitModifiedVariables = function() {		
		//If it have not been buffered all the requests, it's not time to send a PUT request
		if (this.buffered_requests < VarManager.prototype.MAX_BUFFERED_REQUESTS) {
			this.buffered_requests++;
			return
		}

		this.sendBufferedVars();
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
	    this.buffered_requests = 0;
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
	
	this.buffered_requests = 0;
	
	// Creation of ALL EzWeb variables regarding one workspace
	this.parseVariables(this.workSpace.workSpaceGlobalInfo);
}


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
				alert("error en showcase")
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
		Event.observe($('submit_link'), "click", function(){UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', $('template_uri').value);}, false, "add_resource");
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


/**
 * @author luismarcos.ayllon
 */
function StringBuffer() {
	this.buffer = [];
};

StringBuffer.prototype.append = function append(string) {
	this.buffer.push(string);
	return this;
};

StringBuffer.prototype.toString = function toString() {
	return this.buffer.join("");
};

function ContextManager (workspace_, workSpaceInfo_) {
	
	
	// ***********************
	// PRIVATED FUNCTIONS 
	// ***********************
	
	// Adds all variables from workspace data model
	this._addContextVarsFromTemplate = function (cVars_, type_) {
		for (var i = 0; i < cVars_.size(); i++){
			var cVar = cVars_[i];
			cVar.setVarManager(this._workspace.getVarManager());
			if (this._name2Concept[cVar.getConceptName()] == null) {
				var msg = gettext("Context variable [%(varName)s] does not have a related concept so its value cannot be established.");
				msg = interpolate(msg, {varName: cVar.getName()}, true);
				LogManagerFactory.getInstance().log(msg);
				return;
			}
			var relatedConcept = this._concepts[this._name2Concept[cVar.getConceptName()]];
			relatedConcept.setType(type_);
			relatedConcept.addIGadgetVar(cVar);
		}
	}

	// Loads all concept from workspace data model. 
	this._loadConceptsFromWorkspace = function (workSpaceInfo_) {
		
		this._concepts = new Hash();
		this._name2Concept = new Hash();
		
		var conceptsJson = workSpaceInfo_['workspace']['concepts'];

		// Parses concepts json
		for (var i = 0; i < conceptsJson.length; i++) {
			var curConcept = conceptsJson[i];
			// Creates the concept
			if (curConcept.adaptor){
				var concept = new Concept(curConcept.concept, curConcept.adaptor);
			} else {
				var concept = new Concept(curConcept.concept, null);
			}
			this._concepts[curConcept.concept] = concept;

			// Sets the concept value
			if (curConcept.value){
				concept.setInitialValue(curConcept.value)
			}			 
			
			// Relates the concept name to all its concept
			for (var j = 0; j < curConcept.names.length; j++) {
				var cname = curConcept.names[j];
				
				if (this._name2Concept[cname] != null){
					var msg = interpolate(gettext("WARNING: concept name") + " '" + cname + "' " + gettext("is already related to") + " '" + this._name2Concept[cname] + "'. " + gettext("New related concept is") + " '" + curConcept.concept + "' %(errorMsg)s.", {errorMsg: transport.status}, true);
					LogManagerFactory.getInstance().log(msg);
				}
				this._name2Concept[cname] = curConcept.concept;	
			}	
		}
	}
	
	// Load igadget's context variables from workspace data model
	this._loadIGadgetContextVarsFromWorkspace = function (workSpaceInfo) {
		
		var tabs = workSpaceInfo['workspace']['tabList'];
		
		// Tabs in workspace
		for (var i=0; i<tabs.length; i++) {
			var currentTab = tabs[i]; 
			var igadgets = currentTab.igadgetList;
			
			// igadgets in tab
			for (var j=0; j<igadgets.length; j++) {
				var currentIGadget = igadgets[j];
				var variables = currentIGadget['variables'];
				
				// Variables of igadgets
				for (var k = 0; k < variables.length; k++) {
				var currentVar = variables[k];
					switch (currentVar.aspect) {
					case Variable.prototype.EXTERNAL_CONTEXT:
					case Variable.prototype.GADGET_CONTEXT:
						var contextVar = new ContextVar(currentIGadget.id, currentVar.name, currentVar.concept)
						contextVar.setVarManager(this._workspace.getVarManager());
						var relatedConcept = this._concepts[this._name2Concept[currentVar.concept]];
						if (relatedConcept){
							contextVar.setValue(relatedConcept._initialValue);
							relatedConcept.setType(currentVar.aspect);
							relatedConcept.addIGadgetVar(contextVar);
						}
						break;
					default:
						break;
					}
				}
			}
		}
		
		// Continues loading next module
		this._loaded = true;
	}
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	
	ContextManager.prototype.addInstance = function (iGadget_, template_) {
		if (!this._loaded)
		    return;
		
		if (template_ == null)
			return;

		this._addContextVarsFromTemplate(template_.getExternalContextVars(iGadget_.id), Concept.prototype.EXTERNAL);
		this._addContextVarsFromTemplate(template_.getGadgetContextVars(iGadget_.id), Concept.prototype.IGADGET);
	}
	
	
	ContextManager.prototype.propagateInitialValues = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].propagateIGadgetVarValues(iGadgetId_);
		}
	}

	ContextManager.prototype.removeInstance = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].deleteIGadgetVars(iGadgetId_);
		}
	}

	ContextManager.prototype.notifyModifiedConcept = function (concept_, value_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		this._concepts[concept_].setValue(value_);
	}
	
	ContextManager.prototype.notifyModifiedGadgetConcept = function (igadgetid_, concept_, value_, preLoaded_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		try{
			if (preLoaded_){
				this._concepts[concept_].getIGadgetVar(igadgetid_).setPreloadedValue(value_);
			}else{
				this._concepts[concept_].getIGadgetVar(igadgetid_).setValue(value_);	
			}
		}catch(e){
			// Do nothing, igadget has not variables related to this concept
		}
	}
	
	ContextManager.prototype.getWorkspace = function () {
		return this._workspace;
	}	


	ContextManager.prototype.unload = function () {

		// Delete all concept names
		var namekeys = this._name2Concept.keys();
		for (var i=0; i<namekeys.length; i++) {
			delete this._name2Concept[namekeys[i]];
		}
		delete this._name2Concept;
		
		// Delete all the concepts
		var conceptkeys = this._concepts.keys();
		for (var j=0; i<conceptkeys.length; j++) {
			this._concepts[conceptkeys[j]].unload();
			delete this._concepts[conceptkeys[j]];		
		}
		delete this._concepts;

		// Delete all the ContextManager attributes
		delete this._loaded;
		delete this._workspace;

		delete this;
	}


	// *********************************************
	// PRIVATE VARIABLES AND CONSTRUCTOR OPERATIONS
	// *********************************************

	this._loaded = false;
	this._concepts = new Hash();     // a concept is its adaptor an its value
	this._name2Concept = new Hash(); // relates the name to its concept
	this._workspace = workspace_;
		
	// Load all igadget context variables and concepts (in this order!)
	this._loadConceptsFromWorkspace (workSpaceInfo_);
	this._loadIGadgetContextVarsFromWorkspace (workSpaceInfo_);
}
function ContextVar(igadgetId_, varName_, conceptName_) {
	this._igadgetId = igadgetId_;
	this._varName = varName_;
	this._conceptName = conceptName_;
	this._varManager = null;
	this._value = null;
	this._gadgetLoaded = false;
}

ContextVar.prototype.getName = function () {
	return this._varName;
}

ContextVar.prototype.getIGadgetId = function () {
	return this._igadgetId;
}

ContextVar.prototype.getConceptName = function () {
	return this._conceptName;
}

ContextVar.prototype.getValue = function () {
	return this._value;
}

ContextVar.prototype.propagateValue = function () {
	if (this._gadgetLoaded)
		return;
	
	this._gadgetLoaded = true;
	this.setValue(this._value);
}

ContextVar.prototype.setValue = function (newValue_) {
	this._value = newValue_;
	if (this._varManager !=null) {
		var variable = this._varManager.getVariableByName(this._igadgetId, this._varName)
		
		variable.annotate(newValue_);
		variable.set(newValue_);
	}
}

ContextVar.prototype.setVarManager = function (varManager_) {
	this._varManager = varManager_;
}

ContextVar.prototype.unload = function () {
	delete this._igadgetId;
	delete this._varName;
	delete this._conceptName;
	delete this._varManager;
	delete this._value;
	
	delete this;
}

//////////////////////////////////////////////////////////
// Concept
//////////////////////////////////////////////////////////
function Concept(semanticConcept_, adaptor_) {
	this._semanticConcept = semanticConcept_;
	this._adaptor = adaptor_;
	this._type = null;
	this._value = null;
	this._initialValue = null;

	this._igadgetVars = new Array();

	this._initAdaptor = function (ivar_) {
		if (ivar_ == null){
			// Adaptor of External Context variable doesn't receives any parameter   
			eval ('new ' + adaptor_ + "()"); 
		}else{
			// Adaptor of Gadget Context variable receives the IGadget as parameter			
			eval ('new ' + adaptor_ + "("+ ivar_.getIGadgetId() +")");
		}
	}
	
}

// Known concept types
Concept.prototype.EXTERNAL = 'ECTX';
Concept.prototype.IGADGET = 'GCTX';

// Known concepts
Concept.prototype.USERNAME = "username";
Concept.prototype.LANGUAGE = "language";
Concept.prototype.WIDTH = "width";
Concept.prototype.WIDTHINPIXELS = "widthInPixels";
Concept.prototype.HEIGHT = "height";
Concept.prototype.HEIGHTINPIXELS = "heightInPixels";
Concept.prototype.XPOSITION = "xPosition";
Concept.prototype.YPOSITION = "yPosition";
Concept.prototype.LOCKSTATUS = "lockStatus";
Concept.prototype.ORIENTATION = "orientation";

Concept.prototype.getSemanticConcept = function () {
	return this._semanticConcept;
}

Concept.prototype.getAdaptor = function () {
	return this._adaptor;
}

Concept.prototype.getValue = function () {
	if (this._type == Concept.prototype.EXTERNAL){
		return this._value;
	}
	throw gettext("Concept does not have value, this is a Gadget Concept.");
}

Concept.prototype.setType = function (type_) {
	if (this._type == null){
		this._type = type_;
		switch (this._type) {
			case Concept.prototype.EXTERNAL:
				if (this._initialValue != null){
					this._value = this._initialValue;
				}
				break;
			default:
				this._initialValue = null;						
				break;
			}
	} else if (this._type != type_) {
		throw gettext("Unexpected change of concept type.");
	}
}

Concept.prototype.setValue = function (value_) {
	switch (this._type) {
		case Concept.prototype.IGADGET:
			throw gettext("Concept does not have value, this is a Gadget Concept.");
			break;
		default:
			this._value = value_;
			for (var i = 0; i < this._igadgetVars.length; i++){
				var ivar = this._igadgetVars[i];
				ivar.setValue(value_);
			} 
			break;
	}
}

Concept.prototype.setInitialValue = function (newValue_) {
	this._initialValue = newValue_;
}

Concept.prototype.propagateIGadgetVarValues = function (iGadget_) {
	for (var i = 0; i < this._igadgetVars.length; i++){
		var ivar = this._igadgetVars[i];
		if ((iGadget_ == null) || (ivar.getIGadgetId() == iGadget_))
			ivar.propagateValue();
	} 
}

Concept.prototype.addIGadgetVar = function (ivar_) {
	switch (this._type) {
		case Concept.prototype.EXTERNAL:
			if (this._value != null){
				ivar_.setValue(this._value);
				this._igadgetVars.push(ivar_);		
			}else{
				this._igadgetVars.push(ivar_);
				if (this._adaptor)
					this._initAdaptor(null);
			}
			break;
		case Concept.prototype.IGADGET:
			this._igadgetVars.push(ivar_);
			if (this._adaptor)
				this._initAdaptor(ivar_);
			break;
		default:
			throw gettext("Unexpected igadget variables. Concept does not have type yet.");
			break;
	}
}

Concept.prototype.deleteIGadgetVars = function (igadgetId_) {
	var i = 0;
	while (i < this._igadgetVars.length){
		var ivar = this._igadgetVars[i];
		if (ivar.getIGadgetId() == igadgetId_){
				this._igadgetVars.splice(i, 1);
		}else{
			i++;
		}
	}
}

Concept.prototype.getIGadgetVar = function (igadgetId_) {
	switch (this._type) {
		case Concept.prototype.IGADGET:
			for (var i = 0; i < this._igadgetVars.length; i++){
				var ivar = this._igadgetVars[i];
				if (ivar.getIGadgetId() == igadgetId_){
					return ivar;
				}
			}
			throw interpolate (gettext("%(concept)s Concept is not related to IGadget number %(var)s."), {'concept': this._semanticConcept, 'var': igadgetId_}, true)
			break;
		case Concept.prototype.EXTERNAL:
			throw gettext("This is a External Concept, 'getIGadgetVar' is only for Gadget Concept.");
			break;
		default:
			throw gettext("Concept does not have type yet.");
	}
}

Concept.prototype.unload = function () {
	
	// Delete all the igadget variables related to this concept
	var keys = this._igadgetVars.keys();
	for (var i=0; i<keys.length; i++) {
		this._igadgetVars[keys[i]].unload();
		delete this._igadgetVars[keys[i]];
	}
	
	// Delete all the Concept attributes
	delete this._semanticConcept;
	delete this._adaptor;
	delete this._type;
	delete this._value;
	delete this._initialValue;
	
	delete this.EXTERNAL;
	delete this.IGADGET;
	delete this.USERNAME;
	delete this.LANGUAGE;
	delete this.WIDTH;
	delete this.WIDTHINPIXELS;
	delete this.HEIGHT;
	delete this.HEIGHTINPIXELS;
	delete this.XPOSITION;
	delete this.YPOSITION;
	delete this.LOCKSTATUS;
	delete this.ORIENTATION;
	
	delete this;

}




/**
 * @author luismarcos.ayllon
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////   USERNAME ADAPTOR   //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function UserAdaptor() {

	function _onSuccess(receivedData) {
		var usernameJson = eval ('(' + receivedData.responseText + ')');
		var value = usernameJson.value;
		OpManagerFactory.getInstance().activeWorkSpace.getContextManager().notifyModifiedConcept(UserAdaptor.prototype.CONCEPT, value);
	}

	function _onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
							  true);
		} else {
			msg = transport.status + " " + transport.statusText;
		}
		msg = interpolate(gettext("Error getting concept %(concept)s: %(errorMsg)s."),
		                          {concept: UserAdaptor.prototype.CONCEPT, errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var uri = URIs.GET_CONTEXT_VALUE.evaluate({concept: UserAdaptor.prototype.CONCEPT});
	PersistenceEngineFactory.getInstance().send_get(uri , this, _onSuccess, _onError);			
	
}

UserAdaptor.prototype.CONCEPT = 'username'

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////     LANGUAGE ADAPTOR     //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function LanguageAdaptor() {
	
	function _onSuccess(receivedData) {
		var json = eval ('(' + receivedData.responseText + ')');
		var value = json.value;
		OpManagerFactory.getInstance().activeWorkSpace.getContextManager().notifyModifiedConcept(LanguageAdaptor.prototype.CONCEPT, value);
	}

	function _onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
							  true);
		} else {
			msg = transport.status + " " + transport.statusText;
		}
		msg = interpolate(gettext("Error getting concept %(concept)s: %(errorMsg)s."),
		                          {concept: UserAdaptor.prototype.CONCEPT, errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var uri = URIs.GET_CONTEXT_VALUE.evaluate({concept: LanguageAdaptor.prototype.CONCEPT});
	PersistenceEngineFactory.getInstance().send_get(uri , this, _onSuccess, _onError);			
	
}

LanguageAdaptor.prototype.CONCEPT = 'language'



/////////////////////////////////////
// DragboardLayout
/////////////////////////////////////

/**
 * This constructor initializes the common resources of a DragboardLayout. As
 * DragboardLayout is an abstract class, this can not be called directly and is
 * intented to be used by child classes.
 *
 * @class Represents a dragboard layout to be used to place igadgets into the
 * dragboard. Despite javascript not having a way to mark classes abstract, this
 * class is abstract, so please do not try to create an instance of this class.
 *
 * @private
 *
 * @param {Dragboard} dragboard      associated dragboard
 */
function DragboardLayout(dragboard) {
	if (arguments.length == 0)
		return; // Allow empty constructor (allowing hierarchy)

	this.dragboard = dragboard;
	this.iGadgets = new Hash();
}

/**
 *
 */
DragboardLayout.prototype._notifyWindowResizeEvent = function() {
	// Notify each igadget
	var iGadget;
	var igadgetKeys = this.iGadgets.keys();
	for (var i = 0; i < igadgetKeys.length; i++) {
		iGadget = this.iGadgets[igadgetKeys[i]];
		iGadget._notifyWindowResizeEvent();
	}
}

/**
 * Returns the size of the menu bar.
 *
 * @returns {MultiValuedSize} the size of the menu bar
 */
DragboardLayout.prototype.getMenubarSize = function() {
	var sizeInPixels = 18; // TODO calculate this
	var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
	return new MultiValuedSize(sizeInPixels, sizeInLU);
}

/**
 * Returns the size of the status bar.
 *
 * @returns {MultiValuedSize} the size of the menu bar
 */
DragboardLayout.prototype.getStatusbarSize = function() {
	var sizeInPixels = 16; // TODO calculate this
	var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
	return new MultiValuedSize(sizeInPixels, sizeInLU);
}

/**
 * Returns the total vertical extra size that will have an iGadget. For now,
 * thats includes the menu bar and the status bar sizes.
 *
 * @returns {MultiValuedSize} vertical extra size
 */
DragboardLayout.prototype.getExtraSize = function() {
	var sizeInPixels = this.getMenubarSize().inPixels +
	                   this.getStatusbarSize().inPixels;
	var sizeInLU = Math.ceil(this.fromPixelsToVCells(sizeInPixels));
	return new MultiValuedSize(sizeInPixels, sizeInLU);
}

/////////////////////////////////////
// Layout Units (LU) conversion.
/////////////////////////////////////

/**
 * Converts
 */
DragboardLayout.prototype.adaptColumnOffset = function(pixels) {
	var msg = gettext("method \"%(method)s\" must be implemented.");
	msg = interpolate(msg, {method: "adaptColumnOffset"}, true);
	throw new Exception(msg);
}

DragboardLayout.prototype.adaptRowOffset = function(pixels) {
	var msg = gettext("method \"%(method)s\" must be implemented.");
	msg = interpolate(msg, {method: "adaptRowOffset"}, true);
	throw new Exception(msg);
}

DragboardLayout.prototype.adaptHeight = function(contentHeight, fullSize) {
	var msg = gettext("method \"%(method)s\" must be implemented.");
	msg = interpolate(msg, {method: "adaptHeight"}, true);
	throw new Exception(msg);
}

DragboardLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
	var msg = gettext("method \"%(method)s\" must be implemented.");
	msg = interpolate(msg, {method: "adaptWidth"}, true);
	throw new Exception(msg);
}

/**
 * Checks if the point is inside the dragboard.
 *
 * @param x  X coordinate
 * @param y  Y coordinate
 *
 * @returns true if the point is inside
 */
DragboardLayout.prototype.isInside = function (x, y) {
	return (x >= 0) && (x < this.getWidth()) && (y >= 0);
}

/**
 * Gets the width of the usable dragboard area.
 *
 * @returns The width of the usable dragboard area
 */
DragboardLayout.prototype.getWidth = function() {
	return this.dragboard.getWidth();
}

/**
 * Adds an iGadget to this layout.
 *
 * @param {IGadget} iGadget          iGadget to add
 * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
 */
DragboardLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
	if (iGadget.layout != null) {
		var msg = gettext("the iGadget could not be associated with this layout as it already has an associated layout.");
		throw new Error(msg);
	}
	iGadget.layout = this;

	if (affectsDragboard) {
		this.dragboard._registerIGadget(iGadget);

		if (iGadget.isVisible()) // TODO
			this.dragboard.dragboardElement.appendChild(iGadget.element);
	}

	this.iGadgets[iGadget.code] = iGadget;

	if (iGadget.isVisible()) {
		iGadget._recomputeSize();
	}
}

/**
 * @private
 *
 * This function should be called at the end of the implementation of addIGadget.
 */
DragboardLayout.prototype._adaptIGadget = function(iGadget) {
	if (iGadget.element != null) {
		this._ensureMinimalSize(iGadget, false);
	}
}

/**
 * @private
 */
DragboardLayout.prototype._ensureMinimalSize = function (iGadget, persist) {
	// Ensure a minimal size
	var minWidth = Math.ceil(this.fromPixelsToHCells(80));
	var minHeight = Math.ceil(this.fromPixelsToVCells(24));

	var sizeChange = false;
	var newWidth = iGadget.getContentWidth();
	var newHeight = iGadget.getContentHeight();

	if (newWidth < minWidth) {
		sizeChange = true;
		newWidth = minWidth;
	}

	if (newHeight < minHeight) {
		sizeChange = true;
		newHeight = minHeight;
	}

	if (sizeChange) {
		iGadget.setContentSize(newWidth, newHeight, false, persist);
	}
}

/**
 * Removes an iGadget from this layout.
 *
 * @param {IGadget} iGadget          iGadget to remove
 * @param {Boolean} affectsDragboard true if the associated dragboard must be notified
 */
DragboardLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
	delete this.iGadgets[iGadget.code];

	if (affectsDragboard) {
		this.dragboard._deregisterIGadget(iGadget);

		if (iGadget.element != null) // TODO
			this.dragboard.dragboardElement.removeChild(iGadget.element);
	}

	iGadget.layout = null;
}

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardLayout.prototype.destroy = function() {
	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		this.iGadgets[keys[i]].destroy();
	}
	this.iGadgets = null;
}

/////////////////////////////////////
// Drag & drop support
/////////////////////////////////////

/**
 * Initializes a temporal iGadget move.
 *
 * @param {IGadget}          iGadget     iGadget to move
 * @param {IGadgetDraggable} [draggable] associated draggable object (only
 *                                       needed in drag & drop operations)
 *
 * @see DragboardLayout.initializeMove
 * @see DragboardLayout.moveTemporally
 * @see DragboardLayout.acceptMove
 * @see DragboardLayout.cancelMove
 *
 * @example
 * layout.initializeMove(iGadget, iGadgetDraggable);
 * layout.moveTemporally(1,0);
 * layout.moveTemporally(10,8);
 * layout.acceptMove();
 */
DragboardLayout.prototype.initializeMove = function(iGadget, draggable) {
}

/**
 * Moves temporally the configured iGadget (or cursor) to the given position.
 *
 * @param {Number} x new X coordinate
 * @param {Number} y new Y coordinate
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.moveTemporally = function(x, y) {
}

/**
 * Finish the current temporal move accepting the current position.
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.acceptMove = function() {
}

/**
 * Finish the current temporal move restoring the layout to the status before
 * to the call to initializeMove.
 *
 * @see DragboardLayout.initializeMove
 */
DragboardLayout.prototype.cancelMove = function() {
}

/**
 * Disables the cursor if it is active. This method must be implemented by
 * real Layout classes whether they use cursors. The default implementation
 * does nothing.
 */
DragboardLayout.prototype.disableCursor = function() {
}

/////////////////////////////////////
// Css unit conversions
/////////////////////////////////////

/**
 * Measure the given test elmenet in the specified css units.
 *
 * @param testElement element to measure
 * @param units units to use in the measure
 *
 * @returns the horizontal and vertical size of the test element converted
 *          to the target css units.
 *
 * @see CSSPrimitiveValue
 */
DragboardLayout.prototype.measure = function(testElement, units) {
	testElement.style.visibility = "hidden";
	this.dragboard.dragboardElement.appendChild(testElement);

	// Retrieve target measurements
	var res = new Array();
	res[0] = getComputedStyle(testElement, null).getPropertyCSSValue("width").getFloatValue(units);
	res[1] = getComputedStyle(testElement, null).getPropertyCSSValue("height").getFloatValue(units);

	// Remove the test element
	testElement.parentNode.removeChild(testElement);

	return res;
}

/**
 * Converts a value from its initial units to the especified css units.
 *
 * @param {String} value css value to convert
 * @param newUnits units to convert to
 *
 * @returns the value converted to the target css units in horizontal and
 *          vertical
 *
 * @see CSSPrimitiveValue
 *
 * @example
 * layout.unitConvert("1cm", CSSPrimitiveValue.CSS_PX);
 */
DragboardLayout.prototype.unitConvert = function(value, newUnits) {
	// Create a square div using the given value
	var testDiv = document.createElement("div");
	testDiv.style.height = value;
	testDiv.style.width = value;

	return this.measure(testDiv, newUnits);
}

/////////////////////////////////////
// MultiValuedSize
/////////////////////////////////////

/**
 * @class Represents a size in several units.
 */
function MultiValuedSize (inPixels, inLU) {
	this.inPixels = inPixels;
	this.inLU = inLU;
}

/////////////////////////////////////
// ColumnLayout
/////////////////////////////////////

/**
 * Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * @param dragboard        associated dragboard
 * @param columns          number of columns of the layout
 * @param cellHeight       the height of the layout's cells in pixels
 * @param verticalMargin   vertical margin between igadgets in pixels
 * @param horizontalMargin horizontal margin between igadgets in pixels
 * @param scrollbarSpace   space reserved for the right scroll bar in pixels
 */
function ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
	if (arguments.length == 0)
		return; // Allow empty constructor (allowing hierarchy)

	this.initialized = false;
	this.shadowMatrix = null;    // Temporal matrix of igadgets used for D&D
	this.shadowPositions = null;
	this.columns = columns;
	this.cellHeight = cellHeight;

	if ((verticalMargin % 2) == 0) {
		this.topMargin = verticalMargin / 2;
		this.bottomMargin = verticalMargin / 2;
	} else {
		this.topMargin = Math.floor(verticalMargin / 2);
		this.bottomMargin = Math.floor(verticalMargin / 2) + 1;
	}

	if ((horizontalMargin % 2) == 0) {
		this.leftMargin = horizontalMargin / 2;
		this.rightMargin = horizontalMargin / 2;
	} else {
		this.leftMargin = Math.floor(horizontalMargin / 2);
		this.rightMargin = Math.floor(horizontalMargin / 2) + 1;
	}

	this._clearMatrix();         // Matrix of igadgets
	this.dragboardCursor = null;
	this.gadgetToMove = null;

	DragboardLayout.call(this, dragboard, scrollbarSpace);
}

/*
 * ColumnLayout extends DragboardLayout
 */
ColumnLayout.prototype = new DragboardLayout();

/**
 * Returns the numbers of columns of this layout.
 */
ColumnLayout.prototype.getColumns = function() {
	return this.columns;
}

ColumnLayout.prototype.getCellHeight = function() {
	return this.cellHeight;
}

ColumnLayout.prototype.fromPixelsToVCells = function(pixels) {
	return (pixels / this.cellHeight);
}

ColumnLayout.prototype.fromVCellsToPixels = function(cells) {
	return (cells * this.cellHeight);
}

ColumnLayout.prototype.getWidthInPixels = function (cells) {
	return this.fromHCellsToPixels(cells) - this.leftMargin - this.rightMargin;
}

ColumnLayout.prototype.getHeightInPixels = function (cells) {
	return this.fromVCellsToPixels(cells) - this.topMargin - this.bottomMargin;
}

ColumnLayout.prototype.fromPixelsToHCells = function(pixels) {
	var cells = pixels / this.fromHCellsToPixels(1);
	var truncatedCells = Math.floor(cells);

	if (Math.ceil(this.fromHCellsToPixels(truncatedCells)) == pixels)
		return truncatedCells;
	else
		return cells;
}

ColumnLayout.prototype.fromHCellsToPixels = function(cells) {
	return (this.getWidth() * this.fromHCellsToPercentage(cells)) / 100;
}

ColumnLayout.prototype.fromHCellsToPercentage = function(cells) {
	return cells * (100 / this.columns);
}

ColumnLayout.prototype.adaptColumnOffset = function(pixels) {
	var halfColumnWidth = Math.floor(this.fromHCellsToPixels(1) / 2);
	var offsetInLU = Math.floor(this.fromPixelsToHCells(pixels - this.leftMargin + halfColumnWidth));
	var offsetInPixels = this.fromHCellsToPixels(offsetInLU) + this.leftMargin;
	return new MultiValuedSize(offsetInPixels, offsetInLU);
}

ColumnLayout.prototype.adaptRowOffset = function(pixels) {
	var halfRowHeight = Math.floor(this.fromVCellsToPixels(1) / 2);
	var offsetInLU = Math.floor(this.fromPixelsToVCells(pixels - this.topMargin + halfRowHeight));
	var offsetInPixels = this.fromVCellsToPixels(offsetInLU) + this.topMargin;
	return new MultiValuedSize(offsetInPixels, offsetInLU);
}

ColumnLayout.prototype.adaptHeight = function(contentHeight, fullSize) {
	fullSize += this.topMargin + this.bottomMargin;
	var paddedFullSizeInCells = Math.ceil(this.fromPixelsToVCells(fullSize));
	var paddedFullSize = this.fromVCellsToPixels(paddedFullSizeInCells);

	return new MultiValuedSize(contentHeight + (paddedFullSize - fullSize), paddedFullSizeInCells);
}

ColumnLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
	fullSize += this.leftMargin + this.rightMargin;
	var paddedFullSizeInCells = Math.ceil(this.fromPixelsToHCells(fullSize));
	var paddedFullSize = this.fromHCellsToPixels(paddedFullSizeInCells);

	return new MultiValuedSize(contentWidth + (paddedFullSize - fullSize), paddedFullSizeInCells);
}

ColumnLayout.prototype.getColumnOffset = function(column) {
	var tmp = Math.floor((this.getWidth() * this.fromHCellsToPercentage(column)) / 100);
	tmp += this.leftMargin;
	return tmp;
}

ColumnLayout.prototype.getRowOffset = function(row) {
	return this.fromVCellsToPixels(row) + this.topMargin;
}


ColumnLayout.prototype._getPositionOn = function(_matrix, gadget) {
	if (_matrix == this.matrix)
		return gadget.getPosition();
	else
		return this.shadowPositions[gadget.code];
}

ColumnLayout.prototype._setPositionOn = function(_matrix, gadget, position) {
	if (_matrix == this.matrix)
		gadget.setPosition(position);
	else
		this.shadowPositions[gadget.code] = position;
}

ColumnLayout.prototype._clearMatrix = function() {
	this.matrix = new Array();

	for (var x = 0; x < this.getColumns(); x++)
		this.matrix[x] = new Array();
}

ColumnLayout.prototype._hasSpaceFor = function(_matrix, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			if (_matrix[positionX + x][positionY + y] != null)
				return false;

	return true;
}

ColumnLayout.prototype._reserveSpace = function(_matrix, iGadget) {
	var x, y;
	var position = this._getPositionOn(_matrix, iGadget);
	var width = iGadget.getWidth();
	var height = iGadget.getHeight();

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			_matrix[position.x + x][position.y + y] = iGadget;
}

ColumnLayout.prototype._clearSpace = function(_matrix, iGadget) {
	var x, y;
	var position = this._getPositionOn(_matrix, iGadget);
	var width = iGadget.getWidth();
	var height = iGadget.getHeight();

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			delete _matrix[position.x + x][position.y + y];
}

ColumnLayout.prototype._searchInsertPoint = function(_matrix, x, y, width, height) {
	return y;
}

ColumnLayout.prototype._moveSpaceDown = function(_matrix, iGadget, offsetY) {
	var affectedIGadgets = new Hash();
	var position = this._getPositionOn(_matrix, iGadget);
	var finalPosition = position.clone();
	finalPosition.y += offsetY;

	var edgeY = position.y + iGadget.getHeight();

	// Search affected gadgets
	// TODO move gadgets according to the biggest offset for optimizing
	var igadget, x, y;
	for (x = 0; x < iGadget.getWidth(); x++)
		for (y = 0; y < offsetY; y++) {
			igadget = _matrix[position.x + x][edgeY + y];
			if (igadget != null) {
				affectedIGadgets[igadget.code] = offsetY - y; // calculate the offset for this igadget
				break; // continue whit the next column
			}
		}

	// Move affected gadgets instances
	var keys = affectedIGadgets.keys();
	var igadget, i, key;
	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		igadget = this.iGadgets[key];
		this._moveSpaceDown(_matrix, igadget, affectedIGadgets[key]);
	}

	// Move the gadget
	this._clearSpace(_matrix, iGadget);
	this._setPositionOn(_matrix, iGadget, finalPosition);
	this._reserveSpace(_matrix, iGadget);
}

ColumnLayout.prototype._moveSpaceUp = function(_matrix, iGadget) {
	var position = this._getPositionOn(_matrix, iGadget);
	var edgeY = position.y + iGadget.getHeight();

	var offsetY;
	for (offsetY = 1;
	     ((position.y - offsetY) >= 0) && this._hasSpaceFor(_matrix, position.x, position.y - offsetY, iGadget.getWidth(), 1);
	     offsetY++);
	--offsetY;

	if (offsetY > 0) {
		var affectedIGadgets = new Hash();
		var finalPosition = position.clone();
		finalPosition.y -= offsetY;

		// Search affected gadgets
		// TODO move the topmost gadget for optimizing
		var igadget, x, y, columnsize;
		for (x = 0; x < iGadget.getWidth(); x++) {
			columnsize = _matrix[position.x + x].length;
			for (y = edgeY; y < columnsize; y++) {
				igadget = _matrix[position.x + x][y];
				if (igadget != null) {
					affectedIGadgets[igadget.code] = igadget;
					break; // continue whit the next column
				}
			}
		}

		// Move the representation of the gadget
		this._clearSpace(_matrix, iGadget);
		this._setPositionOn(_matrix, iGadget, finalPosition);
		this._reserveSpace(_matrix, iGadget);

		// Move affected gadgets instances
		var keys = affectedIGadgets.keys();
		var i;
		for (i = 0; i < keys.length; i++)
			this._moveSpaceUp(_matrix, affectedIGadgets[keys[i]]);
	}
}

ColumnLayout.prototype._removeFromMatrix = function(_matrix, iGadget) {
	this._clearSpace(_matrix, iGadget);
}

ColumnLayout.prototype._reserveSpace2 = function(_matrix, iGadget, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			_matrix[positionX + x][positionY + y] = iGadget;
}

ColumnLayout.prototype._clearSpace2 = function(_matrix, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			delete _matrix[positionX + x][positionY + y];
}

ColumnLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
	var x, y;
	var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
	var position = iGadget.getPosition();
	var step2X;
	step2X = position.x;

	// First Step
	if (newWidth > oldWidth) {
		// Calculate the width for the next step
		step2Width = oldWidth;

		var finalYPos = position.y + newHeight;

		if (resizeLeftSide) {
			// Move affected igadgets
			var widthDiff = newWidth - oldWidth;
			for (x = position.x - widthDiff; x < position.x; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Move the gadget
			position.x -= widthDiff;
			if (persist)
				iGadget.setPosition(position);

			// Reserve the new space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x, position.y,
			                                 widthDiff, newHeight);
		} else {
			// Move affected igadgets
			for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
			  for (y = 0; y < newHeight; ++y) {
			    var iGadgetToMove = this.matrix[x][position.y + y];
			    if (iGadgetToMove != null) {
			      this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
			      break; // Continue with the next column
			    }
			  }
			}

			// Reserve this space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x + oldWidth, position.y,
			                                 newWidth - oldWidth, newHeight);
		}

	} else if (newWidth < oldWidth) {
		// Calculate the width for the next step
		step2Width = newWidth;

		var widthDiff = oldWidth - newWidth;
		if (resizeLeftSide) {

			// Clear space
			this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

			// Move the gadget
			position.x += widthDiff;
			if (persist)
				iGadget.setPosition(position);

			step2X = position.x;
		} else {
			// Clear space
			this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);
		}
	}


	// Second Step
	if (newHeight > oldHeight) {
		var limitY = position.y + newHeight;
		var limitX = step2X + step2Width;
		for (y = position.y + oldHeight; y < limitY; y++)
			for (x = step2X; x < limitX; x++)
				if (this.matrix[x][y] != null)
					this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);

		// Reserve Space
		this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
	} else if (newHeight < oldHeight) {
		// Clear freed space
		this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);
	}

	this._notifyWindowResizeEvent(); // TODO
	if (persist)
		this.dragboard._commitChanges(); // FIXME
}

ColumnLayout.prototype._insertAt = function(iGadget, x, y) {
	var newPosition = new DragboardPosition(x, y);

	// Move other instances
	var affectedgadget, offset, affectedY;
	var lastX = newPosition.x + iGadget.getWidth();
	var lastY = newPosition.y + iGadget.getHeight();

	for (x = newPosition.x; x < lastX; x++)
		for (y = newPosition.y; y < lastY; y++) {
			affectedgadget = this.matrix[x][y];
			if (affectedgadget != null) {
				// only move the gadget if we didn't move it before
				offset = iGadget.getHeight() - (y - newPosition.y);
				affectedY = affectedgadget.getPosition().y;
				if (affectedY < y)
					offset += y - affectedY;
				this._moveSpaceDown(this.matrix, affectedgadget,  offset);
				// move only the topmost gadget in the column
				break;
			}
		}

	// Change Gadget instance position (insert it)
	iGadget.setPosition(newPosition);

	this._reserveSpace(this.matrix, iGadget);
}

ColumnLayout.prototype._searchFreeSpace = function(width, height) {
	var positionX = 0, positionY = 0;
	var columns = this.getColumns() - width + 1;

	for (positionY = 0; true ; positionY++)
		for (positionX = 0; positionX < columns; positionX++)
			if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
				return new DragboardPosition(positionX, positionY);
			}
}

ColumnLayout.prototype.initialize = function () {
	var iGadget, key, position, iGadgetsToReinsert = new Array();

	this._clearMatrix();

	// Insert igadgets
	var igadgetKeys = this.iGadgets.keys();
	for (var i = 0; i < igadgetKeys.length; i++) {
		key = igadgetKeys[i];

		iGadget = this.iGadgets[key];

		position = iGadget.getPosition();

		iGadget.paint();
		this._ensureMinimalSize(iGadget);

		if (iGadget.getWidth() > this.getColumns())
			iGadget.contentWidth = this.getColumns();

		if (iGadget.getWidth() + position.x > this.getColumns()) {
			iGadgetsToReinsert.push(iGadget);
		} else if (this._hasSpaceFor(this.matrix, position.x, position.y, iGadget.getWidth(), iGadget.getHeight())) {
			this._reserveSpace(this.matrix, iGadget);
		} else {
			iGadgetsToReinsert.push(iGadget);
		}
	}

	// Reinsert the igadgets that didn't fit in their positions
	for (i = 0; i < iGadgetsToReinsert.length; i++) {
		position = this._searchFreeSpace(iGadgetsToReinsert[i].getWidth(),
		                                 iGadgetsToReinsert[i].getHeight());
		iGadgetsToReinsert[i].setPosition(position);
		this._reserveSpace(this.matrix, iGadgetsToReinsert[i]);
	}

	this.initialized = true;
}

/**
 * Calculate what cell is at a given position in pixels
 */
ColumnLayout.prototype.getCellAt = function (x, y) {
	var columnWidth = this.getWidth() / this.getColumns();

	return new DragboardPosition(Math.floor(x / columnWidth),
	                             Math.floor(y / this.getCellHeight()));
}

/**
 * Inserts the given iGadget into this layout.
 *
 * @param iGadget the iGadget to insert in this layout
 * @param affectsDragboard if true, the dragbaord associated to this layout will be notified
 */
ColumnLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
	DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

	iGadget.setZPosition(0);

	if (!this.initialized)
		return;

	var position = iGadget.getPosition();
	if (position) {
		if (iGadget.getWidth() > this.getColumns())
			iGadget.contentWidth = this.getColumns();

		var diff = iGadget.getWidth() + position.x - this.getColumns();
		if (diff > 0)
			position.x -= diff

		// Insert it
		this._insertAt(iGadget, position.x, position.y);
	} else {
		// Search a position for the gadget
		position = this._searchFreeSpace(iGadget.getWidth(), iGadget.getHeight());
		iGadget.setPosition(position);

		// Pre-reserve the cells for the gadget instance
		this._reserveSpace(this.matrix, iGadget);
	}

	this._adaptIGadget(iGadget);
}

ColumnLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
	this._removeFromMatrix(this.matrix, iGadget);
	DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
}

ColumnLayout.prototype.initializeMove = function(igadget, draggable) {
	draggable = draggable || null; // default value of draggable argument

	// Check for pendings moves
	if (this.igadgetToMove != null) {
		var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.")
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		this.cancelMove();
	}

	this.igadgetToMove = igadget;

	// Make a copy of the positions of the gadgets
	this.shadowPositions = new Array();

	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		this.shadowPositions[keys[i]] = this.iGadgets[keys[i]].getPosition().clone();
	}

	// Shadow matrix = current matrix without the gadget to move
	// Initialize shadow matrix and searchInsertPointCache
	var i, lastGadget, lastY = 0;
	this.shadowMatrix = new Array();
	this.searchInsertPointCache = new Array();
	for (i = 0; i < this.columns; i++) {
		this.searchInsertPointCache[i] = new Array();
		this.shadowMatrix[i] = this.matrix[i].clone();
	}
	this._removeFromMatrix(this.shadowMatrix, igadget);

	// search bottommost row
	for (i = 0; i < this.columns; i++) {
		lastGadget = this.matrix[i].compact().last();

		if (!lastGadget)
			continue;

		tmp = lastGadget.getPosition().y + lastGadget.getHeight();
		if (tmp > lastY)
			lastY = tmp;
	}
	this.searchInsertPointYLimit = lastY + 1;

	// Create dragboard cursor
	this.dragboardCursor = new DragboardCursor(igadget);
	this.dragboardCursor.paint(this.dragboard.dragboardElement);
	this._reserveSpace(this.matrix, this.dragboardCursor);

	if (draggable) {
		draggable.setXOffset(this.fromHCellsToPixels(1) / 2);
		draggable.setYOffset(this.getCellHeight());
	}
}

ColumnLayout.prototype._destroyCursor = function(clearSpace) {
	if (this.dragboardCursor != null) {
		if (clearSpace)
			this._removeFromMatrix(this.matrix, this.dragboardCursor); // FIXME
		this.dragboardCursor.destroy();
		this.dragboardCursor = null;
	}
}

ColumnLayout.prototype.disableCursor = function() {
	this._destroyCursor(true);
}

ColumnLayout.prototype.moveTemporally = function(x, y) {
	if (this.igadgetToMove == null) {
		var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	var maxX = this.getColumns() - this.igadgetToMove.getWidth();
	if (x > maxX) x = maxX;

	// Check if we have to change the position of the cursor
	y = this._searchInsertPoint(this.shadowMatrix, x, y, this.igadgetToMove.getWidth(), this.igadgetToMove.getHeight());

	if (this.dragboardCursor != null) {
		var cursorpos = this.dragboardCursor.getPosition();

		if ((cursorpos.y != y) || (cursorpos.x != x)) {
			// Change cursor position
			this._removeFromMatrix(this.matrix, this.dragboardCursor);
			this._insertAt(this.dragboardCursor, x, y);
		}
	} else {
		this.dragboardCursor = new DragboardCursor(this.igadgetToMove);
		this.dragboardCursor.paint(this.dragboard.dragboardElement);
		this._insertAt(this.dragboardCursor, x, y);
	}
}

ColumnLayout.prototype.cancelMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Trying to cancel an inexistant temporal move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	this._destroyCursor(true);
	var position = this.igadgetToMove.getPosition();
	this._insertAt(this.igadgetToMove, position.x, position.y);
	this.shadowMatrix = null;
	this.igadgetToMove = null;
	this.dragboardCursor = null;
}

ColumnLayout.prototype.acceptMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Function acceptMove called when there is not an started igadget move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	var oldposition = this.igadgetToMove.getPosition();
	var newposition = this.dragboardCursor.getPosition();
	this._destroyCursor(false);

	// Needed to force repaint of the igadget at the correct position
	this.igadgetToMove.setPosition(newposition);

	// Needed to overwriting the cursor cells
	this._reserveSpace(this.matrix, this.igadgetToMove);

	// Update igadgets positions in persistence
	if (oldposition.y != newposition.y || oldposition.x != newposition.x) {
		this.dragboard._commitChanges();
	}

	this.shadowMatrix = null;
	this.igadgetToMove = null;
	this.dragboardCursor = null;
}

/////////////////////////////////////
// SmartColumnLayout
/////////////////////////////////////

function SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
	ColumnLayout.call(this,
	                  dragboard,
	                  columns,
	                  cellHeight,
	                  verticalMargin,
	                  horizontalMargin,
	                  scrollbarSpace);
}

SmartColumnLayout.prototype = new ColumnLayout();

SmartColumnLayout.prototype._realSearchInsertPoint = function(_matrix, x, y, width, height) {
	var lastY;

	/* Check for special cases
	   y == 0                             => we are on the topmost position
	                                      so this is the insert point
	   _matrix[x][y - 1] != _matrix[x][y] => we are in a edge, so this is
	                                      the insert point.
	   _matrix[x][y] != null              => there is already a gadget in
	                                      this position, so we have to
	                                      search an insert point ignoring
	                                      it.
	*/
	if (y == 0) {
		return 0;
	} else if ((_matrix[x][y - 1] != null) && (_matrix[x][y - 1] != _matrix[x][y])) {
		return y;
	} else if (_matrix[x][y]) {
		var widthDiff = _matrix[x][y].getWidth() - width;
		widthDiff -= x - this._getPositionOn(_matrix, _matrix[x][y]).x;
		if (widthDiff > 0) {
			// The gadget at (x,y) has the same or a bigger width
			// than the gadget to move, so as the gadget to move
			// fits there, so at least we can insert here.
			y = this._getPositionOn(_matrix, _matrix[x][y]).y - 1;
			while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
				y--;
			}
			return ++y;
		} if (widthDiff != 0) {
			var offsetX;

			for (;y > 1; y--) {
				for (offsetX = 0; offsetX < width; offsetX++) {
					if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
						if (_matrix[x + offsetX][y - 1]) {
							// Edge detected
							return y;
						}
					}
				}
			}

			// edges not found
			return 0;
		} else {
			return this._getPositionOn(_matrix, _matrix[x][y]).y
		}
	}

	lastY = y;
	while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
		y--;
	}
	if (y != lastY) {
		y++;
	} else {
		var offsetX;

		for (;y > 1; y--) {
			for (offsetX = 0; offsetX < width; offsetX++) {
				if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
					if (_matrix[x + offsetX][y - 1]) {
						// Edge detected
						return y;
					}
				}
			}
		}

		return 0;
	}
	return y;
}

SmartColumnLayout.prototype._searchInsertPoint = function(_matrix, x, y, width, height) {
	// Search the topmost position for the gadget

	if (y > this.searchInsertPointYLimit)
		y = this.searchInsertPointYLimit;

	if (!this.searchInsertPointCache[x][y])
		this.searchInsertPointCache[x][y] = this._realSearchInsertPoint(_matrix, x, y, width, height);

	return this.searchInsertPointCache[x][y];
}

SmartColumnLayout.prototype.initialize = function() {
	ColumnLayout.prototype.initialize.call(this);

	// remove holes moving igadgets to the topmost positions
	var iGadget;
	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		iGadget = this.iGadgets[keys[i]];
		this._moveSpaceUp(this.matrix, iGadget);
	}
}

SmartColumnLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
	var x, y;
	var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
	var position = iGadget.getPosition();
	var step2X;
	step2X = position.x;

	// First Step
	if (newWidth > oldWidth) {
		// Calculate the width for the next step
		step2Width = oldWidth;

		var finalYPos = position.y + newHeight;

		if (resizeLeftSide) {
			// Move affected igadgets
			var widthDiff = newWidth - oldWidth;
			for (x = position.x - widthDiff; x < position.x; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Move the gadget
			position.x -= widthDiff;
			if (persist)
				iGadget.setPosition(position);

			// Reserve the new space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x, position.y,
			                                 widthDiff, newHeight);
		} else {
			// Move affected igadgets
			for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Reserve this space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x + oldWidth, position.y,
			                                 newWidth - oldWidth, newHeight);
		}

	} else if (newWidth < oldWidth) {
		// Calculate the width for the next step
		step2Width = newWidth;

		var widthDiff = oldWidth - newWidth;
		if (resizeLeftSide) {

			// Clear space
			this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

			// Move affected igadgets
			y = position.y + oldHeight;
			var limitX = position.x + widthDiff;
			for (x = position.x; x < limitX; ++x)
				if (this.matrix[x][y] != null)
					this._moveSpaceUp(this.matrix, this.matrix[x][y]);

			// Move the gadget
			position.x += widthDiff;
			if (persist)
				iGadget.setPosition(position);

			step2X = position.x;
		} else {
			// Clear space
			this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);

			// Move affected igadgets
			y = position.y + oldHeight;
			var limitX = position.x + oldWidth;
			for (x = position.x + newWidth; x < limitX; ++x)
				if (this.matrix[x][y] != null)
					this._moveSpaceUp(this.matrix, this.matrix[x][y]);
		}
	}

	// Second Step
	if (newHeight > oldHeight) {
		var limitY = position.y + newHeight;
		var limitX = step2X + step2Width;
		for (y = position.y + oldHeight; y < limitY; y++)
			for (x = step2X; x < limitX; x++)
				if (this.matrix[x][y] != null)
					this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);

		// Reserve Space
		this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
	} else if (newHeight < oldHeight) {
		// Clear freed space
		this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);

		y = position.y + oldHeight;
		var limitX = step2X + step2Width;
		for (x = step2X; x < limitX; x++)
			if (this.matrix[x][y] != null)
				this._moveSpaceUp(this.matrix, this.matrix[x][y]);
	}

	this._notifyWindowResizeEvent(); // TODO
	if (persist) {
		this._moveSpaceUp(this.matrix, iGadget);
		// Save new positions into persistence
		this.dragboard._commitChanges(); // FIXME
	}
}

SmartColumnLayout.prototype._insertAt = function(iGadget, x, y) {
	ColumnLayout.prototype._insertAt.call(this, iGadget, x, y);

	this._moveSpaceUp(this.matrix, iGadget);
}

SmartColumnLayout.prototype._removeFromMatrix = function(_matrix, iGadget) {
	this._clearSpace(_matrix, iGadget);

	var affectedIGadgets = new Hash();
	var affectedgadget, x, y, columnsize;
	var position = this._getPositionOn(_matrix, iGadget);
	var edgeY = position.y + iGadget.getHeight();

	// check if we have to update the representations of the gadget instances
	for (x = 0; x < iGadget.getWidth(); x++) {
		columnsize = _matrix[position.x + x].length;
		for (y = edgeY; y < columnsize; y++) {
			affectedgadget = _matrix[position.x + x][y];
			if ((affectedgadget != null) && (affectedIGadgets[affectedgadget.code] == undefined)) {
				affectedIGadgets[affectedgadget.code] = 1;
				this._moveSpaceUp(_matrix, affectedgadget);
				break;
			}
		}
	}
}
/////////////////////////////////////
// FreeLayout
/////////////////////////////////////

/**
 * @class Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * This dragobard uses percentages for horizontal units and px for vertical units.
 *
 * @extends DragboardLayout
 */
function FreeLayout(dragboard, scrollbarSpace) {
	if (arguments.length == 0)
		return; // Allow empty constructor (allowing hierarchy)

	this.initialized = false;
	this.orderList = new Array();
	DragboardLayout.call(this, dragboard, scrollbarSpace);
}

FreeLayout.prototype = new DragboardLayout();

FreeLayout.prototype.MAX_HLU = 1000000;

FreeLayout.prototype.fromPixelsToVCells = function(pixels) {
	return pixels;
}

FreeLayout.prototype.fromVCellsToPixels = function(cells) {
	return cells;
}

FreeLayout.prototype.getWidthInPixels = function (cells) {
	return this.fromHCellsToPixels(cells);
}

FreeLayout.prototype.getHeightInPixels = function (cells) {
	return this.fromVCellsToPixels(cells);
}

FreeLayout.prototype.fromPixelsToHCells = function(pixels) {
	return (pixels  * this.MAX_HLU/ this.getWidth());
}

FreeLayout.prototype.fromHCellsToPixels = function(cells) {
	return Math.ceil((this.getWidth() * cells) / this.MAX_HLU);
}

FreeLayout.prototype.fromHCellsToPercentage = function(cells) {
	return cells / (this.MAX_HLU / 100);
}

FreeLayout.prototype.getColumnOffset = function(column) {
	return Math.ceil((this.getWidth() * column) / this.MAX_HLU);
}

FreeLayout.prototype.getRowOffset = function(row) {
	return row;
}

FreeLayout.prototype.adaptColumnOffset = function(pixels) {
	var offsetInLU = Math.ceil(this.fromPixelsToHCells(pixels));
	return new MultiValuedSize(this.fromHCellsToPixels(offsetInLU), offsetInLU);
}

FreeLayout.prototype.adaptRowOffset = function(pixels) {
	return new MultiValuedSize(pixels, pixels);
}

FreeLayout.prototype.adaptHeight = function(contentHeight, fullSize) {
	return new MultiValuedSize(contentHeight, fullSize);
}

FreeLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
	var widthInLU = Math.floor(this.fromPixelsToHCells(fullSize));
	return new MultiValuedSize(this.fromHCellsToPixels(widthInLU), widthInLU);
}

FreeLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
	if (resizeLeftSide) {
		var widthDiff = newWidth - oldWidth;
		var position = iGadget.getPosition();
		position.x -= widthDiff;

		if (persist)
			iGadget.setPosition(position);
		else
			iGadget._notifyWindowResizeEvent();
	}

	if (persist) {
		// Save new position into persistence
		this.dragboard._commitChanges([iGadget.code]);
	}
}

FreeLayout.prototype.initialize = function () {
	var iGadget, key, zPos, iGadgetsToReinsert = new Array();

	// Insert igadgets
	var igadgetKeys = this.iGadgets.keys();
	for (var i = 0; i < igadgetKeys.length; i++) {
		key = igadgetKeys[i];
		iGadget = this.iGadgets[key];

		zPos = iGadget.getZPosition() - 1000;
		if (this.orderList[zPos]) {
			iGadgetsToReinsert.push(iGadget);
		} else {
			this.orderList[zPos] = iGadget;
		}

		iGadget.paint();
	}

	// Reinsert the igadgets that didn't fit in their positions
	for (i = 0; i < iGadgetsToReinsert.length; i++) {
		iGadget = iGadgetsToReinsert[i];
		zPos = this.orderList.push(iGadget) - 1;
		iGadget.setZPosition(1000 + zPos);
		iGadget.paint();
	}

	// Check if we have to readjust the z positions
	var oldLength = this.orderList.length;
	this.orderList = this.orderList.compact();
	if (oldLength != this.orderList.length) {
		for ( i = 0; i < this.orderList.length; i++) {
			this.orderList[i].setZPosition(1000 + i);
		}
	}

	this.initialized = true;
}

/**
 * Calculate what cell is at a given position in pixels
 */
FreeLayout.prototype.getCellAt = function (x, y) {
	return new DragboardPosition((x * this.MAX_HLU) / this.getWidth(),
	                             y);
}

FreeLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
	DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

	if (!this.initialized)
		return;

	if (iGadget.getPosition() == null)
		iGadget.setPosition(new DragboardPosition(0, 0));

	var posZ = this.orderList.push(iGadget) - 1;
	iGadget.setZPosition(1000 + posZ);

	this._adaptIGadget(iGadget);
}

FreeLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
	var posZ = iGadget.getZPosition() - 1000;
	delete this.orderList[posZ];
	this.orderList = this.orderList.compact();

	var i = 0;
	for (; i < this.orderList.length; i++) {
		this.orderList[i].setZPosition(1000 + i);
	}

	DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
}

FreeLayout.prototype.initializeMove = function(igadget, draggable) {
	draggable = draggable || null; // default value for the draggable parameter

	// Check for pendings moves
	if (this.igadgetToMove != null) {
		var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.")
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		this.cancelMove();
	}

	this.igadgetToMove = igadget;
	this.newPosition = igadget.getPosition().clone();

	if (draggable) {
		draggable.setXOffset(0);
		draggable.setYOffset(0);
	}
}

FreeLayout.prototype.moveTemporally = function(x, y) {
	if (this.igadgetToMove == null) {
		var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	this.newPosition.x = x;
	this.newPosition.y = y;
}

FreeLayout.prototype.acceptMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Function acceptMove called when there is not an started igadget move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	if (this.newPosition.x > (this.MAX_HLU - 1))
		this.newPosition.x = (this.MAX_HLU - 1);
	if (this.newPosition.y < 0)
		this.newPosition.y = 0;

	this.igadgetToMove.setPosition(this.newPosition);
	this.igadgetToMove._notifyWindowResizeEvent();
	this.dragboard._commitChanges([this.igadgetToMove.code]);

	this.igadgetToMove = null;
	this.newPosition = null;
}

FreeLayout.prototype.cancelMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Trying to cancel an inexistant temporal move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	this.igadgetToMove._notifyWindowResizeEvent();
	this.igadgetToMove = null;
	this.newPosition = null;
}

FreeLayout.prototype.lowerToBottom = function(iGadget) {
	var zPos = iGadget.getZPosition() - 1000;
	delete this.orderList[zPos];
	this.orderList = [iGadget].concat(this.orderList).compact();

	var i = 0;
	for (; i < this.orderList.length; i++) {
		this.orderList[i].setZPosition(1000 + i);
	}

	this.dragboard._commitChanges();
}

FreeLayout.prototype.lower = function(iGadget) {
	var zPos = iGadget.getZPosition() - 1000;
	if (zPos == 0) {
		// Nothing to do if we are already in the bottom
		return;
	}

	var prevIGadget = this.orderList[zPos - 1];
	this.orderList[zPos - 1] = iGadget;
	this.orderList[zPos] = prevIGadget;

	zPos += 1000;
	iGadget.setZPosition(zPos -1);
	prevIGadget.setZPosition(zPos);

	this.dragboard._commitChanges([iGadget.code, prevIGadget.code]);
}

FreeLayout.prototype.raiseToTop = function(iGadget) {
	var zPos = iGadget.getZPosition() - 1000;
	delete this.orderList[zPos];
	this.orderList = this.orderList.compact();
	this.orderList.push(iGadget);

	var i = 0;
	for (; i < this.orderList.length; i++) {
		this.orderList[i].setZPosition(1000 + i);
	}

	this.dragboard._commitChanges();
}

FreeLayout.prototype.raise = function(iGadget) {
	var zPos = iGadget.getZPosition() - 1000;
	if (zPos == (this.orderList.length - 1)) {
		// Nothing to do if we are already in the top
		return;
	}

	var nextIGadget = this.orderList[zPos + 1];
	this.orderList[zPos + 1] = iGadget;
	this.orderList[zPos] = nextIGadget;

	zPos += 1000;
	iGadget.setZPosition(zPos + 1);
	nextIGadget.setZPosition(zPos);

	this.dragboard._commitChanges([iGadget.code, nextIGadget.code]);
}
/**
 * Creates an instance of a Gadget.
 *
 * @author Álvaro Arranz
 *
 * @class Represents an instance of a Gadget.
 *
 * @param {Gadget}            gadget       Gadget of this iGadget
 * @param {Number}            iGadgetId    iGadget id in persistence. This
 *                                         parameter can be null for new
 *                                         iGadgets (not coming from
 *                                         persistence)
 * @param {String}            iGadgetName  current gadget
 * @param {DragboardLayout}   layout       associated layout
 * @param {DragboardPosition} position     initial position. This parameter can
 *                                         be null for new iGadgets (not coming
 *                                         from persistence)
 * @param {Number}            zPos         initial z coordinate position. This
 *                                         parameter can be null for new
 *                                         iGadgets (not coming from
 *                                         persistence)
 * @param {Number}            width        initial content width
 * @param {Number}            height       initial content height
 * @param {Boolean}           minimized    initial minimized status
 * @param {Boolean}           transparency initial transparency status (true for
 *                                         enabled and false for disabled)
 * @param {String}            menu_color   background color for the iGadget's
 *                                         menu. (6 chars with a hexadecimal
 *                                         color)
 */
function IGadget(gadget, iGadgetId, iGadgetName, layout, position, zPos, width, height, minimized, transparency, menu_color) {
	this.id = iGadgetId;
	this.code = null;
	this.name = iGadgetName;
	this.gadget = gadget;
	this.position = position;
	this.contentWidth = width;
	this.contentHeight = height;
	this.loaded = false;
	this.zPos = zPos;
	this.transparency = transparency;
	this.draggable = null;
	this.visible = false;

	if (!minimized)
		this.height = this.contentHeight;
	else
		this.height = layout.getMenubarSize().inLU;

	this.configurationVisible = false;
	this.minimized = minimized;

	// Elements
	this.element = null;
	this.gadgetMenu = null;
	this.contentWrapper = null;
	this.content = null;
	this.configurationElement = null;
	this.settingsButtonElement = null;
	this.minimizeButtonElement = null;
	this.errorButtonElement = null;
	this.igadgetNameHTMLElement = null;
	this.igadgetInputHTMLElement = null;
	this.statusBar = null;
	this.extractButton = null;

	// Menu attributes
	this.extractOptionId = null;
	this.extractOptionOrder = 0;
	
	this.lowerOpId = null;
	this.raiseOpId = null;
	this.lowerToBottomOpId = null;
	this.raiseToTopOpId = null;

	// iGadget drop box menu
	this.menu = null;

	this.errorCount = 0;

	// Add the iGadget to the layout
	this.build();
	layout.addIGadget(this, true);

	this.menu_color = IGadgetColorManager.autogenColor(menu_color, this.code);
}

/**
 * Returns the associated Gadget.
 *
 * @returns {Gadget} the associated Gadget.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @param {DragboardPosition} position the new position for the iGadget.
 */
IGadget.prototype.setPosition = function(position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
		this.element.style.top = this.layout.getRowOffset(position.y) + "px";

		// Notify Context Manager of igadget's position
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);
	}
}

/**
 * Sets the z coordinate position of this iGadget.
 *
 * @param {Number} zPos the new Z coordinate position for the iGadget.
 */
IGadget.prototype.setZPosition = function(zPos) {
	this.zPos = zPos;

	if (this.element)
		this.element.style.zIndex = zPos;
}

/**
 * Gets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getPosition = function() {
	return this.position;
}

/**
 * Gets the z coordinate of this iGadget.
 *
 * @returns {Number} the Z coordinate of the iGadget.
 */
IGadget.prototype.getZPosition = function(zPos) {
	return this.zPos;
}

/**
 * Returns the content width in Layout Units.
 *
 * @returns {Number} the content width in cells.
 */
IGadget.prototype.getContentWidth = function() {
	return this.contentWidth;
}

/**
 * Returns the content height in Layout Units.
 *
 * @returns {Number} the content height in cells.
 */
IGadget.prototype.getContentHeight = function() {
	return this.contentHeight;
}

/**
 * Returns the Tab where this iGadget is displayed.
 *
 * @returns {Tab} associated tab
 */
IGadget.prototype.getTab = function() {
	return this.layout.dragboard.tab;
}

/**
 * Returns the current width of the gadget in LU. This is not the same to the
 * iGadget's content with as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current width of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getWidth = function() {
	// For now, the igadget width is always the width of the igadget content
	return this.contentWidth;
}

/**
 * Returns the current height of the gadget in LU. This is not the same to the
 * iGadget's content height as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current height of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getHeight = function() {
	return this.height;
}

/**
 * Returns the identifier of this iGadget. This identifier is unique for the
 * current EzWeb Platform. This identifier can be null if this iGadget is not
 * currently presisted.
 *
 * @returns {Number} the identifier for this iGadget.
 */
IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getElement = function() {
	return this.element;
}

/**
 * Returns true if the iGadget is currently visible in a dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently visible; false otherwise.
 */
IGadget.prototype.isVisible = function() {
	return this.visible;
}

/**
 * Returns true if the iGadget is currently on the free layout of the dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently on the free layout of the
 *                    associated dragboard; false otherwise.
 */
IGadget.prototype.onFreeLayout = function() {
	return this.layout.dragboard.freeLayout == this.layout;
}

/**
 * Toggle the gadget transparency
 */
IGadget.prototype.toggleTransparency = function() {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	this.element.toggleClassName("gadget_window_transparent");
	this.transparency = !this.transparency;
	
	//Persist the new state
	var o = new Object;
	o.transparency = this.transparency;
	o.id = this.id;
	var igadgetData = Object.toJSON(o);
	var params = {'igadget': igadgetData};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * Updates the extract/snap from/to grid option on the iGadget's menu.
 *
 * @private
 */
IGadget.prototype._updateExtractOption = function() {
	if (this.onFreeLayout()) {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/snap.png",
		                       gettext("Snap to grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("extractButton");
		this.extractButton.addClassName("snapButton");
		this.extractButton.setAttribute("title", gettext("This iGadget outside the grid."));

		// TODO more generic code
		this.lowerOpId = this.menu.addOption("/ezweb/images/igadget/lower.png",
		                    gettext("Lower"),
		                    function() {
		                        this.layout.lower(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+1);
		this.raiseOpId = this.menu.addOption("/ezweb/images/igadget/raise.png",
		                    gettext("Raise"),
		                    function() {
		                        this.layout.raise(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+2);
		this.lowerToBottomOpId = this.menu.addOption("/ezweb/images/igadget/lowerToBottom.png",
		                    gettext("Lower To Bottom"),
		                    function() {
		                        this.layout.lowerToBottom(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+3);
		this.raiseToTopOpId = this.menu.addOption("/ezweb/images/igadget/raiseToTop.png",
		                    gettext("Raise To Top"),
		                    function() {
		                        this.layout.raiseToTop(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+4);
	} else {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/extract.png",
		                       gettext("Extract from grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("snapButton");
		this.extractButton.addClassName("extractButton");
		this.extractButton.setAttribute("title", gettext("This iGadget is aligned to the grid."));

		if (this.lowerOpId != null) {
			this.menu.removeOption(this.lowerOpId);
			this.menu.removeOption(this.raiseOpId);
			this.menu.removeOption(this.lowerToBottomOpId);
			this.menu.removeOption(this.raiseToTopOpId);
			this.lowerOpId = null;
			this.raiseOpId = null;
			this.lowerToBottomOpId = null;
			this.raiseToTopOpId = null;
		}
	}
}

/**
 * Builds the structure of the gadget
 */
IGadget.prototype.build = function() {
	this.element = document.createElement("div");
	this.element.addClassName("gadget_window");

	// Gadget Menu
	this.gadgetMenu = document.createElement("div");
	this.gadgetMenu.addClassName("gadget_menu");
	this.gadgetMenu.observe("contextmenu", function(e) {Event.stop(e);}, true);

	// Gadget title
	this.gadgetMenu.setAttribute("title", this.name);

	//#######################################
	// buttons. Inserted from right to left
	//#######################################
	var button;

	// close button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("closebutton");

	if (this.gadget.isContratable()) {
		var remove_and_cancel = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().cancelServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		var remove = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().unsubscribeServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		button.observe("click", function() {
		                            LayoutManagerFactory.getInstance().showWindowMenu('cancelService', remove_and_cancel, remove);
		                        },
		               true);
	} else {
		button.observe("click", function() {
		                            OpManagerFactory.getInstance().removeInstance(this.id);
		                        }.bind(this),
		                        true);
	}

	button.setAttribute("title", gettext("Close"));
	button.setAttribute("alt", gettext("Close"));
	this.gadgetMenu.appendChild(button);

	// iGadget's menu
	var idMenu = 'igadget_menu_' + this.id;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);

	var idColorMenu = 'igadget_color_menu_' + this.id;
	this.colorMenu = IGadgetColorManager.genDropDownMenu(idColorMenu, this.menu, this);

	// Settings
	this.menu.addOption("/ezweb/images/igadget/settings.png",
	                    gettext("Preferences"),
	                    function() {
	                        this.toggleConfigurationVisible();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    0);

	this.menuColorEntryId = this.menu.addOption("/ezweb/images/menu_colors.png",
	                                           gettext("Menu Bar Color..."),
	                                           function(e) {
	                                               var menuEntry = $(this.menuColorEntryId);
	                                               if (menuEntry.getBoundingClientRect != undefined) {
	                                                   var y = menuEntry.getBoundingClientRect().top;
	                                               } else {
	                                                   var y = document.getBoxObjectFor(menuEntry).screenY -
	                                                           document.getBoxObjectFor(document.documentElement).screenY;
	                                               }
	                                               LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                   this.colorMenu,
	                                                   Event.pointerX(e),
	                                                   y + (menuEntry.offsetHeight/2));
	                                           }.bind(this),
	                                           1);

	this.menu.addOption("/ezweb/images/igadget/transparency.png",
	                    gettext("Transparency"),
	                    function() {
	                        this.toggleTransparency();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    2);

	// Extract/Snap from/to grid option (see _updateExtractOption)
	this.extractOptionOrder = 2;
	this.extractOptionId = this.menu.addOption("", "", function(){}, this.extractOptionOrder);

	// iGadget's menu button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("settingsbutton");
	button.observe("click",
	               function(e) {
	                  LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                      this.menu,
	                                                                      Event.pointerX(e),
	                                                                      Event.pointerY(e));
	               }.bind(this),
	               true);
	// and listen to mouse events
	/*this.gadgetMenu.observe("mousedown",
	                        function (e) {
	                            e = e || window.event; // needed for IE

	                            // Only attend to right button (or left button for left-handed persons) events
	                            if (!BrowserUtilsFactory.getInstance().isRightButton(e.button))
	                                return false;

	                            LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                                this.menu,
	                                                                                Event.pointerX(e),
	                                                                                Event.pointerY(e));

	                            Event.stop(e);
	                            return false;
	                        }.bind(this),
	                        true);*/

	button.setAttribute("title", gettext("Menu"));
	button.setAttribute("alt", gettext("Menu"));
	this.gadgetMenu.appendChild(button);
	this.settingsButtonElement = button;

	// minimize button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.observe("click", function() {this.toggleMinimizeStatus()}.bind(this), true);
	if (this.minimized) {
		button.setAttribute("title", gettext("Maximize"));
		button.setAttribute("alt", gettext("Maximize"));
		button.addClassName("maximizebutton");
	} else {
		button.setAttribute("title", gettext("Minimize"));
		button.setAttribute("alt", gettext("Minimize"));
		button.addClassName("minimizebutton");
	}

	this.gadgetMenu.appendChild(button);
	this.minimizeButtonElement = button;

	// error button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("class", "button errorbutton disabled");
	button.setAttribute("className", "button errorbutton disabled"); //IE hack
	Event.observe (button, "click", function() {OpManagerFactory.getInstance().showLogs();}, true);
	this.gadgetMenu.appendChild(button);
	this.errorButtonElement = button;

	this.fillWithLabel();

	this.element.appendChild(this.gadgetMenu);

	// Content wrapper
	this.contentWrapper = document.createElement("div");
	this.contentWrapper.addClassName("gadget_wrapper");
	this.element.appendChild(this.contentWrapper);

	// Gadget configuration (Initially empty and hidden)
	this.configurationElement = document.createElement("div");
	this.configurationElement.addClassName("config_interface");
	this.contentWrapper.appendChild(this.configurationElement);

	// Gadget Content
	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content = document.createElement("iframe");
		this.content.setAttribute("class", "gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
//		this.content.innerHTML = "Loading...."; // TODO add an animation ?
		this.content.setAttribute("src", codeURL);
		this.content.setAttribute("width", "100%");
	} else { //non IE6
		this.content = document.createElement("object");
		this.content.setAttribute("class", "gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
		this.content.setAttribute("data", codeURL);
		this.content.innerHTML = "Loading...."; // TODO add an animation ?
	}
	this.content.observe("load",
	                     function () {
	                         OpManagerFactory.getInstance().igadgetLoaded(this.id);
	                     }.bind(this),
	                     true);
	this.contentWrapper.appendChild(this.content);
	
	// Gadget status bar
	this.statusBar = document.createElement("div");
	this.statusBar.setAttribute("class", "statusBar");
	this.element.appendChild(this.statusBar);
	if (this.minimized) {
		this.statusBar.setStyle({"display": "none"});
	}

	// resize handles
	var resizeHandle;

	// Left one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "leftResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.leftResizeHandle = new IGadgetResizeHandle(resizeHandle, this, true);

	// Right one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "rightResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.rightResizeHandle = new IGadgetResizeHandle(resizeHandle, this, false);

	// extract/snap button
	this.extractButton = document.createElement("div");
	this.extractButton.observe("click",
	                           function() {
	                               this.toggleLayout();
	                           }.bind(this),
	                           false);
	this.statusBar.appendChild(this.extractButton);
}

/**
 * Paints this gadget instance into the assigned dragboard
 */
IGadget.prototype.paint = function() {
	if (this.visible)
		return; // Do nothing if the iGadget is already painted

	this.visible = true;

	// Initialize lock status
	if (this.layout.dragboard.isLocked()) {
		this.element.addClassName("gadget_window_locked");
	}

	// Initialize transparency status
	if (this.transparency)
		this.element.addClassName("gadget_window_transparent");

	// Initialize snap/extract options
	this._updateExtractOption();


	// Insert it into the dragboard
	this.layout.dragboard.dragboardElement.appendChild(this.element);

	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content.setAttribute("src", codeURL);
	} else { //non IE6
		this.content.setAttribute("data", codeURL);
	}

	// TODO use setStyle from prototype
	// Position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";
	this.element.style.zIndex = this.zPos;

	// Recompute size
	this._recomputeSize(true);

	// Mark as draggable
	this.draggable = new IGadgetDraggable(this);

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();

	// Notify Context Manager of igadget's position
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);

	// Notify Context Manager of igadget's size
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);

	// Notify Context Manager of the current lock status
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, this.layout.dragboard.isLocked());

	this.setMenuColor(undefined, true);
}

IGadget.prototype.fillWithLabel = function() {
	if(this.igadgetInputHTMLElement != null){
		//hide the input element
		this.igadgetInputHTMLElement.hide();
	}
	
	// get the name
	var nameToShow = this.name;
	if(nameToShow.length>30){
		nameToShow = nameToShow.substring(0, 30)+"...";
	}
	
	if(this.igadgetNameHTMLElement != null){
		// update and show the label
		this.igadgetNameHTMLElement.update(nameToShow);
		this.igadgetNameHTMLElement.show();
	}
	else{
		//create the label
		this.igadgetNameHTMLElement = document.createElement("span");
		this.igadgetNameHTMLElement.innerHTML = nameToShow;
		this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
		//var spanHTML = nameToShow;
		//new Insertion.Top(this.gadgetMenu, spanHTML);
		//this.igadgetNameHTMLElement = this.gadgetMenu.firstDescendant();
	
		this.igadgetNameHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithInput();
		                                    }.bind(this)); //do not propagate to div.
	}
}


IGadget.prototype.fillWithInput = function () {
	this.igadgetNameHTMLElement.hide();
	if (this.igadgetInputHTMLElement) {
		this.igadgetInputHTMLElement.show();
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
	} else {
		this.igadgetInputHTMLElement = document.createElement("input");
		this.igadgetInputHTMLElement.addClassName("igadget_name");
		this.igadgetInputHTMLElement.setAttribute("type", "text");
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
		this.igadgetInputHTMLElement.setAttribute("maxlength", 30);

		this.gadgetMenu.appendChild(this.igadgetInputHTMLElement);

		this.igadgetInputHTMLElement.observe('blur',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithLabel()
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keypress',
		                                    function(e) {
		                                        if(e.keyCode == Event.KEY_RETURN) {
		                                            Event.stop(e);
		                                            e.target.blur();
		                                        }
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('change',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.setName(e.target.value);
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keyup',
		                                    function(e) {
		                                        Event.stop(e);
		                                        e.target.size = (e.target.value.length==0) ? 1 : e.target.value.length + 5;
		                                    }.bind(this));

		/*this.igadgetInputHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                    }); //do not propagate to div.*/
		this.igadgetInputHTMLElement.observe('mousedown',
		                                    function(e) {
		                                        e = e || window.event; // needed for IE
		                                        Event.stop(e);
		                                    });
	}
	this.igadgetInputHTMLElement.focus();
}

/**
 * Sets the name of this iGadget. The name of the iGadget is shown at the
 * iGadget's menu bar. Also, this name will be used to refere to this gadget in
 * other parts of the EzWeb Platform, for example it is used in the wiring
 * interface.
 *
 * @param {String} igadgetName New name for this iGadget.
 */
IGadget.prototype.setName = function (igadgetName) {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	if (igadgetName != null && igadgetName.length > 0) {
		this.name = igadgetName;
		this.gadgetMenu.setAttribute("title", igadgetName);
		this.igadgetNameHTMLElement.update(this.name);
		var o = new Object;
		o.name = igadgetName;
		o.id = this.id;
		var igadgetData = Object.toJSON(o);
		var params = {'igadget': igadgetData};
		var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
		                                            tabId: this.layout.dragboard.tabId,
		                                            iGadgetId: this.id});
		PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
	}
}

/**
 * Sets the background color of the iGadget's menu bar.
 *
 * @param {String|Color} newColor
 */
IGadget.prototype.setMenuColor = function (newColor, temporal) {
	temporal = temporal != undefined ? temporal : false;

	if (newColor == undefined) {
		newColor = this.menu_color;
		temporal = true;
	}

	this.gadgetMenu.style.backgroundColor = IGadgetColorManager.color2css(newColor);

	if (temporal)
		return;

	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error updating igadget's menu color into persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	this.menu_color = newColor;
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['id'] = this.id;
	data['menu_color'] = IGadgetColorManager.color2hex(this.menu_color);
	var params = {'igadget': data.toJSON()};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	persistenceEngine.send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function() {
	if (this.draggable !== null) {
		this.draggable.destroy();
		this.draggable = null;
	}

	if (this.leftResizeHandle !== null) {
		this.leftResizeHandle.destroy();
		this.leftResizeHandle = null;
	}

	if (this.rightResizeHandle !== null) {
		this.rightResizeHandle.destroy();
		this.rightResizeHandle = null;
	}

	if (this.menu) {
		this.menu.remove();
		this.menu = null;
	}
	this.gadget = null;
	this.layout = null;
	this.position = null;
}

/**
 * Removes this igadget form the dragboard. Also this notify EzWeb Platform for
 * remove the igadget form persistence.
 */
IGadget.prototype.remove = function() {
	if (this.element != null) {
		function onSuccess() {}
		function onError(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}
			msg = interpolate(gettext("Error removing igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var dragboard = this.layout.dragboard;
		if (this.element.parentNode != null) {
			this.layout.removeIGadget(this, true);
		}

		this.element = null;
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		var uri = URIs.GET_IGADGET.evaluate({workspaceId: dragboard.workSpaceId,
		                                     tabId: dragboard.tabId,
		                                     iGadgetId: this.id});
		persistenceEngine.send_delete(uri, this, onSuccess, onError);
	}
}

/**
 * Change the values shown in the configuration form of this igadget to the default ones.
 */
IGadget.prototype._setDefaultPrefsInInterface = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var curPref;

	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		curPref.setDefaultValueInInterface(this.prefElements[curPref.getVarName()]);
	}
}

/**
 * Set all preferences of this gadget instance to their default value
 */
IGadget.prototype.setDefaultPrefs = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var varManager = this.layout.dragboard.getWorkspace().getVarManager();

	for (var i = 0; i < prefs.length; i++) {
		prefs[i].setToDefault(varManager, this.id);
	}

	if (this.configurationVisible)
		this._setDefaultPrefsInInterface();
}

/**
 * This function builds the igadget configuration form.
 */
IGadget.prototype._makeConfigureInterface = function() {

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var prefs = this.gadget.getTemplate().getUserPrefs();

	var interfaceDiv = document.createElement("div");

	if (prefs.length == 0) {
		interfaceDiv.innerHTML = gettext("This IGadget does not have user prefs");
		return interfaceDiv;
	}

	this.prefElements = new Array();

	var row, cell, label, table = document.createElement("table");
	tbody = document.createElement("tbody");
	table.appendChild(tbody);
	for (var i = 0; i < prefs.length; i++) {
		row = document.createElement("tr");

		// Settings label
		cell = document.createElement("td");
		cell.setAttribute("width", "40%"); // TODO
		label = prefs[i].getLabel();
		cell.appendChild(label);
		row.appendChild(cell);

		// Settings control
		cell = document.createElement("td");
		cell.setAttribute("width", "60%"); // TODO
		curPrefInterface = prefs[i].makeInterface(varManager, this.id);
		this.prefElements[curPrefInterface.name] = curPrefInterface;
		Element.extend(this.prefElements[curPrefInterface.name]);
		cell.appendChild(curPrefInterface);
		row.appendChild(cell);

		tbody.appendChild(row);
	}
	interfaceDiv.appendChild(table);

	var buttons = document.createElement("div");
	buttons.setAttribute("class", "buttons");
	buttons.setAttribute("className", "buttons"); //IE hack
	var button;

	// "Set Defaults" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Set Defaults"));
	Event.observe (button, "click", this._setDefaultPrefsInInterface.bind(this), true);
	buttons.appendChild(button);

	// "Save" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Save"));
	button.observe("click", function () {this.layout.dragboard.saveConfig(this.id)}.bind(this), true);
	buttons.appendChild(button);

	// "Cancel" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Cancel"));
	button.observe("click", function () {this.setConfigurationVisible(false)}.bind(this), true);
	buttons.appendChild(button);
	interfaceDiv.appendChild(buttons);

	// clean floats
	var floatClearer = document.createElement("div");
	floatClearer.setAttribute("class", "floatclearer");
	floatClearer.setAttribute("className", "floatclearer"); //IE hack
	interfaceDiv.appendChild(floatClearer);

	return interfaceDiv;
}

/**
 * Sets the size of the igadget's content.
 *
 * @param {Number} newWidth
 * @param {Number} newHeight
 * @param {Boolean} [persist] default: true
 */
IGadget.prototype.setContentSize = function(newWidth, newHeight, persist) {
	persist = persist != undefined ? persist : true;

	if (!this.element) {
		this.contentWidth = newWidth;
		this.contentHeight = newHeight;
		return;
	}

	var oldHeight = this.getHeight();
	var oldWidth = this.getWidth();

	this.contentWidth = newWidth;
	this.contentHeight = newHeight;

	this._recomputeSize(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false, persist);
}

/**
 * This function is called when the browser window is resized.
 *
 * @private
 */
IGadget.prototype._notifyWindowResizeEvent = function() {
	if (!this.element)
		return;

	/* TODO this is a temporally workaround needed when using display:none to hide tabs */
	var oldHeight = this.getHeight();
	var oldWidth = this.getWidth();
	/* TODO end of temporally workaround */

	// Recompute position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

	// Recompute size
	this._recomputeSize(true);

	/* TODO this is a temporally workaround needed when using display:none to hide tabs */
	// Notify new sizes if needed
	var newHeight = this.getHeight();
	var newWidth = this.getWidth();

	if ((oldHeight != newHeight) || (oldWidth != newWidth))
		this.layout._notifyResizeEvent(this, oldWidth, oldHeight, newWidth, newHeight, false, false);
	/* TODO end of temporally workaround */
}

/**
 * This function is called when the dragboard is locked or unlocked.
 *
 * @private
 * @param {Boolean} newLockStatus
 */
IGadget.prototype._notifyLockEvent = function(newLockStatus) {
	if (!this.element)
		return;

	if (newLockStatus) {
		this.element.addClassName("gadget_window_locked");
	} else {
		this.element.removeClassName("gadget_window_locked");
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	this._recomputeHeight(false);

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, newLockStatus);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false);
}

/**
 * This function is called when the content of the igadget has been loaded completly.
 *
 * @private
 */
IGadget.prototype._notifyLoaded = function() {
	if (!this.loaded) {
		this.loaded = true;

		if (this.errorCount > 0) {
			var msg = ngettext("%(errorCount)s error for the iGadget \"%(name)s\" was notified before it was loaded",
			                   "%(errorCount)s errors for the iGadget \"%(name)s\" were notified before it was loaded",
			                   this.errorCount);
			msg = interpolate(msg, {errorCount: this.errorCount, name: this.name}, true);
			LogManagerFactory.getInstance().log(msg);
			this.errorButtonElement.removeClassName("disabled");
			this._updateErrorInfo();
		}

		this.layout.dragboard.igadgetLoaded(this);
	}

	// Notify to the context manager the igadget has been loaded
	this.layout.dragboard.getWorkspace().getContextManager().propagateInitialValues(this.id);
}

/**
 * @private
 */
IGadget.prototype._recomputeWidth = function() {
	var width = this.layout.getWidthInPixels(this.contentWidth);

	width-= this._computeExtraWidthPixels();
	this.element.style.width = width + "px";

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, width);
}

/**
 * @private
 */
IGadget.prototype._recomputeWrapper = function(contentHeight) {
	if (!this.minimized) {
		contentHeight = contentHeight ? contentHeight : parseInt(this.content.offsetHeight);
		wrapperHeight = contentHeight + this.configurationElement.offsetHeight;
	} else {
		wrapperHeight = 0;
	}

	this.contentWrapper.setStyle({height: wrapperHeight + "px"});
}

/**
 * @private
 */
IGadget.prototype._computeExtraWidthPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-left-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-right-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._computeExtraHeightPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-bottom-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var menubarStyle = window.getComputedStyle(this.gadgetMenu, null);
	pixels += menubarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += menubarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var statusbarStyle = window.getComputedStyle(this.statusBar, null);
	pixels += statusbarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += statusbarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._recomputeHeight = function(basedOnContent) {
	var contentHeight;

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager()

	if (basedOnContent) {
		// Based on content height

		if (!this.minimized) {
			contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
			var fullSize = contentHeight;
			fullSize += this.gadgetMenu.offsetHeight +
			            this.statusBar.offsetHeight +
			            this.configurationElement.offsetHeight;
			fullSize += this._computeExtraHeightPixels();
			
			processedSize = this.layout.adaptHeight(contentHeight, fullSize);
			contentHeight = processedSize.inPixels;
			this.height = processedSize.inLU;
			this.content.setStyle({height: contentHeight + "px"});

			this._recomputeWrapper(contentHeight);

			// Notify Context Manager about the new igadget's size
			contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
		} else {
			this._recomputeWrapper();
			contentHeight = this.element.offsetHeight;
			this.content.setStyle({height: "0px"});
			this.height = Math.ceil(this.layout.fromPixelsToVCells(contentHeight));
		}

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.height);
	} else {
		// Based on full gadget height
		contentHeight = this.layout.getHeightInPixels(this.height);
		contentHeight -= this.configurationElement.offsetHeight + this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
		contentHeight -= this._computeExtraHeightPixels();
		this.content.setStyle({height: contentHeight + "px"});
		this.contentHeight = Math.floor(this.layout.fromPixelsToVCells(contentHeight));

		this._recomputeWrapper(contentHeight);

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
	}

}

/**
 * @private
 */
IGadget.prototype._recomputeSize = function(basedOnContent) {
	this._recomputeWidth();
	this._recomputeHeight(basedOnContent);
}

/**
 * Sets the absolute size of the igadget. See setContentSize for resizing the area for the igadget content.
 *
 * @param {Number} newWidth the new width of this igadget in cells. This will be
 *                          the final width for this gadget.
 * @param {Number} newHeight the new height of this igadget in cells. This will
 *                           be the final height for this gadget (that is,
 *                           counting the igadget's title bar, the configuration
 *                           form, etc)
 * @param {Boolean} [resizeLeftSide] true if the gadget will be resized using
 *                                   the topRight corner as base point.
 *                                   default: false.
 * @param {Boolean} [persist] true if is needed to notify the new
 *                            widths/positions of the iGadget (then the
 *                            associated layout can move other igadgets) to
 *                            persistence. default: true.
 */
IGadget.prototype.setSize = function(newWidth, newHeight, resizeLeftSide, persist) {
	// defaults values for the resizeLeftSide and persist parameters
	resizeLeftSide = resizeLeftSide != undefined ? resizeLeftSide : false;
	persist = persist != undefined ? persist : true;

	if (!this.element) {
		this.contentWidth = newWidth;
		this.height = newHeight;
		return;
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	// Assign new values
	this.contentWidth = newWidth;
	this.height = newHeight;

	// Recompute sizes
	this._recomputeSize(false);

	if (persist) {
		// Notify Context Manager new igadget's sizes
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager()
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, this.content.offsetWidth);
	}

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.contentWidth, this.height, resizeLeftSide, persist);
}

/**
 * Returns true if this igadget is minimized.
 *
 * @returns {Boolean} true if the iGadget is minimized; false otherwise.
 */
IGadget.prototype.isMinimized = function() {
	return this.minimized;
}

/**
 * Changes minimize status of this igadget
 *
 * @param newStatus new minimize status of the igadget
 */
IGadget.prototype.setMinimizeStatus = function(newStatus) {
	if (this.minimized == newStatus)
		return; // Nothing to do

	// TODO add effects?

	// New Status
	this.minimized = newStatus;

	if (this.minimized) {
		this.contentWrapper.setStyle({"visibility": "hidden" , "border": "0px"});
		this.statusBar.setStyle({"display": "none"});
		this.configurationElement.setStyle({"display": "none"});
		this.minimizeButtonElement.setAttribute("title", gettext("Maximize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Maximize"));
		this.minimizeButtonElement.removeClassName("minimizebutton");
		this.minimizeButtonElement.addClassName("maximizebutton");
	} else {
		this.contentWrapper.setStyle({"visibility": "visible", "border": null});
		this.statusBar.setStyle({"display": null});
		if (this.configurationVisible == true)
			this.configurationElement.setStyle({"display": "block"});
		this.minimizeButtonElement.setAttribute("title", gettext("Minimize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Minimize"));
		this.minimizeButtonElement.removeClassName("maximizebutton");
		this.minimizeButtonElement.addClassName("minimizebutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), false, true);
}

/**
 * Toggles the minimize status of this gadget
 */
IGadget.prototype.toggleMinimizeStatus = function () {
	this.setMinimizeStatus(!this.minimized);
}

/**
 * @private
 */
IGadget.prototype._updateErrorInfo = function () {
	label = ngettext("%(errorCount)s error", "%(errorCount)s errors", this.errorCount);
	label = interpolate(label, {errorCount: this.errorCount}, true);
	this.errorButtonElement.setAttribute("title", label);
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.notifyError = function() {
	this.errorCount++
	
	if (this.isVisible()) {
		if (this.errorCount == 1) { // First time
			this.errorButtonElement.removeClassName("disabled");
		}
		this._updateErrorInfo();
	}
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.toggleLayout = function() {
	if (this.onFreeLayout())
		this.moveToLayout(this.layout.dragboard.baseLayout);
	else
		this.moveToLayout(this.layout.dragboard.freeLayout);
}

/**
 * Returns true if the configuration form of this igadget is visible
 *
 * @returns true if the configuration form of this igadget is visible; false
 *          otherwise
 */
IGadget.prototype.isConfigurationVisible = function() {
	return this.configurationVisible;
}

/**
 * Changes the visibility status of the configuration form of this igadget
 *
 * @param newValue new visibility status of the configuration form of this
 *                 igadget
 */
IGadget.prototype.setConfigurationVisible = function(newValue) {
	if (this.configurationVisible == newValue)
		return; // Nothing to do

	// New Status
	this.configurationVisible = newValue;

	if (newValue == true) {
		this.configurationElement.appendChild(this._makeConfigureInterface());
		if (this.isMinimized())
			this.configurationElement.setStyle({"display": "none"});
		else
			this.configurationElement.setStyle({"display": "block"});
		this.settingsButtonElement.removeClassName("settingsbutton");
		this.settingsButtonElement.addClassName("settings2button");
	} else {
		this.configurationElement.innerHTML = "";
		this.configurationElement.hide();
		this.settingsButtonElement.removeClassName("settings2button");
		this.settingsButtonElement.addClassName("settingsbutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), true);
}

/**
 * Toggles the visibility status of the configuration form of this igadget.
 */
IGadget.prototype.toggleConfigurationVisible = function () {
	this.setConfigurationVisible(!this.configurationVisible);
}

/**
 * Saves the values of the preferences from the config form of this igadget.
 */
IGadget.prototype.saveConfig = function() {
	if (this.configurationVisible == false)
		throw new Error(""); // TODO

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var i, curPref, prefElement, validData = true;
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var prefName = null;
	
	for (i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		if (!curPref.validate(curPref.getValueFromInterface(prefElement))) {
			validData = false;
			prefElement.addClassName("invalid");
		} else {
			prefElement.removeClassName("invalid");
		}
	}

	if (!validData)
		throw new Error("Invalid data found"); // Don't save if the data is invalid

	// Start propagation of the new values of the user pref variables
	varManager.incNestingLevel();

	// Annotate new value of the variable without invoking callback function!
	var oldValue, newValue;
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);


		if (newValue != oldValue)
			curPref.annotate(varManager, this.id, newValue);
	}

        /* Commit new value of the variable
	   Doing this in 2 phases (first setting the value and then propagating changes)
           avoids reading old values!! */
	
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);

		
		curPref.setValue(varManager, this.id, newValue);
	}

	// Commit
	varManager.decNestingLevel();

	this.setConfigurationVisible(false);
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is,
 * for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.layout.dragboard.addIGadget(this, igadgetInfo);
	}

	function onError(transport, e) {
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

		msg = interpolate(gettext("Error adding igadget to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);

		// Remove this iGadget from the layout
		this.layout.removeIGadget(this, true);
		this.destroy();
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['zIndex'] = this.zPos;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['name'] = this.name;
	data['menu_color'] = IGadgetColorManager.color2css(this.menu_color).substring(1, 6); // TODO
	if (this.onFreeLayout())
		data['layout'] = 1;
	else
		data['layout'] = 0;

	var uri = URIs.POST_IGADGET.evaluate({tabId: this.layout.dragboard.tabId,
	                                      workspaceId: this.layout.dragboard.workSpaceId});

	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}

/**
 * This function migrates this igadget form a layout to another
 *
 * @param {DragboardLayout} newLayout the layout where the iGadget will be moved
 *                          to.
 */
IGadget.prototype.moveToLayout = function(newLayout) {
	if (this.layout == newLayout)
		return;

	// ##### TODO Revise this
	var contentWidth = this.element.offsetWidth;
	var fullWidth = contentWidth;
	contentWidth -= this._computeExtraWidthPixels();

	var contentHeight = this.content.offsetHeight;
	var fullHeight = contentHeight;
	fullHeight += this.gadgetMenu.offsetHeight +
	              this.statusBar.offsetHeight +
	              this.configurationElement.offsetHeight;
	fullHeight += this._computeExtraHeightPixels();
	// ##### END TODO

	var dragboardChange = this.layout.dragboard != newLayout.dragboard;
	var oldLayout = this.layout;
	oldLayout.removeIGadget(this, dragboardChange);

	if (dragboardChange && !(newLayout instanceof FreeLayout)) {
		this.position = null;
	} else {
		this.position.x = oldLayout.getColumnOffset(this.position.x);
		this.position.x = newLayout.adaptColumnOffset(this.position.x).inLU;

		this.position.y = oldLayout.getRowOffset(this.position.y);
		this.position.y = newLayout.adaptRowOffset(this.position.y).inLU;
	}

	// ##### TODO Revise this
	//console.debug("prev width: " + this.contentWidth);
	var newWidth = newLayout.adaptWidth(contentWidth, fullWidth)
	this.contentWidth = newWidth.inLU;
	//console.debug("new width: " + this.contentWidth);

	//console.debug("prev height: " + this.height);
	var newHeight = newLayout.adaptHeight(contentHeight, fullHeight)
	this.height = newHeight.inLU;
	//console.debug("new height: " + this.height);

	// ##### END TODO
	newLayout.addIGadget(this, dragboardChange);
	this._updateExtractOption();

	// Persistence
	var onSuccess = function(transport) { }

	var onError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error saving changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	var data = new Hash();
	data['iGadgets'] = new Array();

	var iGadgetInfo = new Hash();
	iGadgetInfo['id'] = this.id;
	iGadgetInfo['top'] = this.position.y;
	iGadgetInfo['left'] = this.position.x;
	iGadgetInfo['zIndex'] = this.zPos;
	iGadgetInfo['width'] = this.contentWidth;
	iGadgetInfo['height'] = this.contentHeight;
	iGadgetInfo['tab'] = this.layout.dragboard.tabId;

	if (this.onFreeLayout())
		iGadgetInfo['layout'] = 1;
	else
		iGadgetInfo['layout'] = 0;

	data['iGadgets'].push(iGadgetInfo);

	data = {igadgets: data.toJSON()};
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	uri = URIs.GET_IGADGETS.evaluate({workspaceId: oldLayout.dragboard.workSpaceId, tabId: oldLayout.dragboard.tabId});
	persistenceEngine.send_update(uri, data, this, onSuccess, onError);
}

function IGadgetColorManager () {
	this.colors = ["FFFFFF", "A8D914", "EFEFEF", "D4E6FC", "97A0A8", "B2A3A3", "46C0ED", "FFBB03"];
}

IGadgetColorManager.prototype.autogenColor = function(color, seed) {
	if (color === undefined || color === null)
		return this.colors[seed % this.colors.length];
	else
		return color;
}

IGadgetColorManager.prototype.genDropDownMenu = function(idColorMenu, parentMenu, iGadget) {
	var updateColorFunc = function (newColor) {
		iGadget.setMenuColor(newColor, true);
	}

	var endFunc = function (newColor) {
		iGadget.setMenuColor(newColor, false);
	}

	var colorMenu = new ColorDropDownMenu(idColorMenu,
	                                      parentMenu,
	                                      endFunc,
	                                      {onMouseOver: updateColorFunc,
	                                       onMouseOut: updateColorFunc});

	for (var i = 0; i < this.colors.length; i++)
		colorMenu.appendColor(this.colors[i]);

	return colorMenu;
}

IGadgetColorManager.prototype.color2css = function(color) {
	if (typeof color === "string")
		return '#' + color;
	else
		return "rgb(" + color.red.cssText + ", " + color.green.cssText + ", " + color.blue.cssText + ")";
}

IGadgetColorManager.prototype.color2hex = function(color) {
	if (typeof color === "string") {
		return color;
	} else {
		function component2hex(component) {
			return "0123456789ABCDEF".charAt(Math.floor(component / 16)) +
			       "0123456789ABCDEF".charAt(component % 16);
		}
		return component2hex(color.red.cssText) +
		       component2hex(color.green.cssText) +
		       component2hex(color.blue.cssText);
	}
}

IGadgetColorManager = new IGadgetColorManager();

/**
 * @author aarranz
 */
function Dragboard(tab, workSpace, dragboardElement) {
	// *********************************
	// PRIVATE VARIABLES
	// *********************************
	this.loaded = false;
	this.currentCode = 1;
	this.scrollbarSpace = 17; // TODO make this configurable?
	// TODO or initialized with the scroll bar's real with?
	this.dragboardElement;
	this.dragboardWidth = 800;
	this.baseLayout = null;
	this.freeLayout = null;
	this.gadgetToMove = null;
	this.iGadgets = new Hash();
	this.iGadgetsByCode = new Hash();
	this.tab = tab;
	this.tabId = tab.tabInfo.id;
	this.workSpace = workSpace;
	this.workSpaceId = workSpace.workSpaceState.id;
	this.fixed = false;

	// ***********************
	// PRIVATE FUNCTIONS
	// ***********************
	Dragboard.prototype.paint = function () {
		this.dragboardElement.innerHTML = "";

		this._recomputeSize();

		this.baseLayout.initialize();
		this.freeLayout.initialize();
	}

	/**
	 * Update igadget status in persistence
	 */
	this._commitChanges = function(keys) {
		keys = keys || this.iGadgetsByCode.keys();

		var onSuccess = function(transport) { }

		var onError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		// TODO only send real changes
		var iGadget, iGadgetInfo, uri, position;
		var data = new Hash();
		data['iGadgets'] = new Array();

		for (var i = 0; i < keys.length; i++) {
			iGadget = this.iGadgetsByCode[keys[i]];
			iGadgetInfo = new Hash();
			position = iGadget.getPosition();
			iGadgetInfo['id'] = iGadget.id;
			iGadgetInfo['top'] = position.y;
			iGadgetInfo['left'] = position.x;
			iGadgetInfo['zIndex'] = iGadget.zPos;
			iGadgetInfo['minimized'] = iGadget.isMinimized() ? "true" : "false";
			iGadgetInfo['width'] = iGadget.getContentWidth();
			iGadgetInfo['height'] = iGadget.getContentHeight();
			iGadgetInfo['tab'] = this.tabId;

			data['iGadgets'].push(iGadgetInfo);
		}

		data = {igadgets: data.toJSON()};
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		uri = URIs.GET_IGADGETS.evaluate({workspaceId: this.workSpaceId, tabId: this.tabId});
		persistenceEngine.send_update(uri, data, this, onSuccess, onError);
	}

	/**
	 * This function is slow. Please, only call it when really necessary.
	 *
	 * @private
	 */
	Dragboard.prototype._recomputeSize = function() {
		// TODO check this in a compatible fashion
		var cssStyle = document.defaultView.getComputedStyle(this.dragboardElement, null);
		if (cssStyle.getPropertyValue("display") == "none")
			return; // Do nothing

		var dragboardElement = this.dragboardElement;
		this.dragboardWidth = parseInt(dragboardElement.offsetWidth);

		var tmp = this.dragboardWidth;
		tmp-= parseInt(dragboardElement.clientWidth);

		if (tmp > this.scrollbarSpace)
			this.dragboardWidth-= tmp;
		else
			this.dragboardWidth-= this.scrollbarSpace;
	}


	// ****************
	// PUBLIC METHODS
	// ****************

	/**
	 * Gets the width of the usable dragboard area.
	 *
	 * @returns The width of the usable dragboard area
	 */
	Dragboard.prototype.getWidth = function() {
		return this.dragboardWidth;
	}

	/**
	 * This method forces recomputing of the iGadgets' sizes.
	 */
	Dragboard.prototype.recomputeSize = function() {
		this.baseLayout._notifyWindowResizeEvent(this.dragboardWidth);
		this.freeLayout._notifyWindowResizeEvent(this.dragboardWidth);
	}

	Dragboard.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideView(this.dragboardElement);
	}

	/**
	 * This method must be called to avoid memory leaks caused by circular references.
	 */
	Dragboard.prototype.destroy = function () {
		this.baseLayout.destroy();
		this.freeLayout.destroy();
		this.baseLayout = null;
		this.freeLayout = null;

		var keys = this.iGadgets.keys();
		//disconect and delete the connectables and variables of all tab iGadgets
		for (var i = 0; i < keys.length; i++)
			this.workSpace.removeIGadgetData(keys[i]);

		this.iGadgets = null;
		this.iGadgetsByCode = null;

		Element.remove(this.dragboardElement);
	}

	/**
	 * Returns true if the dragboard is locked.
	 */
	Dragboard.prototype.isLocked = function () {
		return this.fixed;
	}

	/**
	 * Locks and unlocks the dragboard according to the newLockStatus
	 * parameter.
	 *
	 * @param newLockStatus true to make dragboard  be locked or false for
	 *                      having an editable dragboard (where you can
	 *                      move, resize, etc the gadget instances).
	 */
	Dragboard.prototype.setLock = function (newLockStatus) {
		if (this.fixed == newLockStatus)
			return; // No change in status => nothing to do

		this.fixed = newLockStatus;
		if (this.fixed)
			this.dragboardElement.addClassName("fixed");
		else
			this.dragboardElement.removeClassName("fixed");

		var iGadget;

		// propagate the fixed status change event
		var igadgetKeys = this.iGadgets.keys();
		for (var i = 0; i < igadgetKeys.length; i++) {
			iGadget = this.iGadgets[igadgetKeys[i]];
			iGadget._notifyLockEvent(this.fixed);
		}

		// Save to persistence
		var onSuccess = function (transport) {}

		var onError = function (transport, e) {
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
			msg = interpolate(gettext("Error changing tab lock status: %(errorMsg)s."),
			                          {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabId});
		var data = new Hash();
		data.locked = newLockStatus ? "true" : "false";
		var params = {'tab': data.toJSON()};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, onSuccess, onError);
	}

	/**
	 * Toggles the current lock status of the dragboard.
	 */
	Dragboard.prototype.toggleLock = function() {
		this.setFixed(!this.fixed);
	}

	Dragboard.prototype.parseTab = function(tabInfo) {
		var curIGadget, position, zPos, width, height, igadget, gadget, gadgetid, minimized, layout, menu_color;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();
		this.iGadgetsByCode = new Hash();

		if (tabInfo.locked == "true") {
			this.fixed = true;
			this.dragboardElement.addClassName("fixed");
		}

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		this.igadgetsToLoad = tabInfo.igadgetList.length;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];

			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Parse width, height and the position of the igadget
			width = parseInt(curIGadget.width);
			height = parseInt(curIGadget.height);
			position = new DragboardPosition(parseInt(curIGadget.left), parseInt(curIGadget.top));
			zPos = parseInt(curIGadget.zIndex);

			// Parse layout field
			if (curIGadget.layout == 0) {
				layout = this.baseLayout;
			} else {
				layout = this.freeLayout;
			}

			// Parse minimize status
			minimized = curIGadget.minimized == "true" ? true : false;

			// Parse transparency status
			transparency = curIGadget.transparency == "true" ? true : false;

			// Menu color
			menu_color = curIGadget.menu_color;

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.name, layout, position, zPos, width, height, minimized, transparency, menu_color);
		}

		this.loaded = true;
	}

	/**
	 * Creates a new instance of the given gadget and inserts it into this
	 * dragboard.
	 *
	 * @param gadget the gadget to use for creating the instance
	 */
	Dragboard.prototype.addInstance = function (gadget) {
		if ((gadget == null) || !(gadget instanceof Gadget))
			return; // TODO exception

		if (this.isLocked()) {
			var msg = gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab.");
			msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
			LayoutManagerFactory.getInstance().showMessageMenu(msg);
			return;
		}

		// This is the layout where the iGadget will be inserted
		var layout = this.baseLayout; // TODO For now insert it always in the baseLayout

		var template = gadget.getTemplate();
		//var width = layout.unitConvert(template.getWidth() + "cm", CSSPrimitiveValue.CSS_PX)[0];
		//width = layout.adaptWidth(width, width).inLU;
		var width = template.getWidth();
		var height = template.getHeight();

		// Check if the gadget doesn't fit in the dragboard
		if (layout instanceof ColumnLayout) {
			var maxColumns = layout.getColumns();
			if (width > maxColumns) {
				// TODO warning
				width = maxColumns;
			}
		}

		// Create the instance
		var igadgetName = gadget.getName() + ' (' + this.currentCode + ')';
		var iGadget = new IGadget(gadget, null, igadgetName, layout, null, null, width, height, false, false, null);

		iGadget.save();
	}

	Dragboard.prototype.removeInstance = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];

		igadget.remove();
		igadget.destroy();

		this._deregisterIGadget(igadget);
	}

	Dragboard.prototype.igadgetLoaded = function (iGadget) {
		if (!this.iGadgets[iGadget.id]) {
			// TODO log
			return;
		}

		this.igadgetsToLoad--;
	}


	Dragboard.prototype.getRemainingIGadgets = function () {
		return this.igadgetsToLoad;
	}


	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			igadget.setConfigurationVisible(false);
		} catch (e) {
		}
	}

	Dragboard.prototype.setDefaultPrefs = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.setDefaultPrefs();
	}

	Dragboard.prototype.notifyErrorOnIGadget = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.notifyError();
	}

	Dragboard.prototype.getIGadgets = function() {
		return this.iGadgets.values();
	}

	Dragboard.prototype.getIGadget = function (iGadgetId) {
		return this.iGadgets[iGadgetId];
	}

	Dragboard.prototype.getWorkspace = function () {
		return this.workSpace;
	}

	/**
	 * Registers an iGadget into this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._registerIGadget = function (iGadget) {
		if (iGadget.id)
			this.iGadgets[iGadget.id] = iGadget;

		iGadget.code = this.currentCode++

		this.iGadgetsByCode[iGadget.code] = iGadget;
	}

	/**
	 * Deregisters an iGadget from this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._deregisterIGadget = function (iGadget) {
		delete this.iGadgets[iGadget.id];
		delete this.iGadgetsByCode[iGadget.code];

		iGadget.code = null;
	}

	Dragboard.prototype.addIGadget = function (iGadget, igadgetInfo) {
		if (!this.iGadgetsByCode[iGadget.code])
			throw new Exception();

		this.iGadgets[iGadget.id] = iGadget;
		this.workSpace.addIGadget(this.tab, iGadget, igadgetInfo);
	}

	// *******************
	// INITIALIZING CODE
	// *******************
	this.dragboardElement = dragboardElement;

	this.dragboardElement.observe("DOMContentLoaded",
	                              function() {alert('hola');},
	                              true);

	// Window Resize event dispacher function
	this._notifyWindowResizeEvent = function () {
		//var oldWidth = this.dragboardWidth;
		this._recomputeSize();
		//var newWidth = this.dragboardWidth;

		//if (oldWidth !== newWidth)
			this.recomputeSize();
	}.bind(this);

	/*
	 * nº columns                         = 20
	 * cell height                        = 12 pixels
	 * vertical Margin between IGadgets   = 2 pixels
	 * horizontal Margin between IGadgets = 4 pixels
	 */
	this.baseLayout = new SmartColumnLayout(this, 20, 12, 2, 4);

	this.freeLayout = new FreeLayout(this);

	this.parseTab(tab.tabInfo);
}

/////////////////////////////////////
// DragboardPosition
/////////////////////////////////////
function DragboardPosition(x, y) {
	this.x = x;
	this.y = y;
}

DragboardPosition.prototype.clone = function() {
	return new DragboardPosition(this.x, this.y);
}

/////////////////////////////////////
// DragboardCursor
/////////////////////////////////////

/**
 * @class This class represents a dragboard cursor. It is usually used in drag
 *        & drop operations and always represents the place where an iGadget is
 *        going to be placed.
 *
 * @author Álvaro Arranz
 *
 * @param iGadget iGadget that is going to be represented by the new dragboard
 *                cursor
 */
function DragboardCursor(iGadget) {
	var positiontmp = iGadget.getPosition();
	this.position = positiontmp.clone();

	this.layout = iGadget.layout;
	this.width = iGadget.getWidth();
	this.height = iGadget.getHeight();
	this.heightInPixels = iGadget.element.offsetHeight;
	this.widthInPixels = iGadget.element.offsetWidth;
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getHeight = function() {
	return this.height;
}

DragboardCursor.prototype.paint = function(dragboard) {
	var dragboardCursor = document.createElement("div");
	dragboardCursor.setAttribute("id", "dragboardcursor");

	// Set width and height
	dragboardCursor.style.height = this.heightInPixels + "px";
	dragboardCursor.style.width = this.widthInPixels + "px";

	// Set position
	dragboardCursor.style.left = (this.layout.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
	dragboardCursor.style.top = (this.layout.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

	// assign the created element
	dragboard.appendChild(dragboardCursor);
	this.element = dragboardCursor;
}

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardCursor.prototype.destroy = function() {
	if (this.element != null) {
		this.element.parentNode.removeChild(this.element);
		this.element = null;
	}
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getPosition = IGadget.prototype.getPosition;

DragboardCursor.prototype.setPosition = function (position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = (this.layout.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
		this.element.style.top = (this.layout.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
	}
}

/////////////////////////////////////
// Drag and drop support
/////////////////////////////////////
EzWebEffectBase = new Object();
EzWebEffectBase.findDragboardElement = function(element) {
	var tmp = element.parentNode;
	while (tmp) {
		var position = document.defaultView.getComputedStyle(tmp, null).getPropertyValue("position");
		switch (position) {
		case "relative":
		case "absolute":
		case "fixed":
			return tmp;
		}

		tmp = tmp.parentNode;
	}
	return null; // Not found
}

function Draggable(draggableElement, handler, data, onStart, onDrag, onFinish, canBeDragged) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var yScroll = 0;
	var xOffset = 0, yOffset = 0;
	var x, y;
	var dragboardCover;
	var draggable = this;
	canBeDragged = canBeDragged ? canBeDragged : function() {return true;};

	// remove the events
	function enddrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving (document, "mouseup", enddrag);
		Event.stopObserving (document, "mousemove", drag);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		onFinish(draggable, data);

		Event.observe (handler, "mousedown", startdrag);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time it's dragged
	function drag(e) {
		e = e || window.event; // needed for IE

		var screenX = parseInt(e.screenX);
		var screenY = parseInt(e.screenY);
		xDelta = xStart - screenX;
		yDelta = yStart - screenY;
		xStart = screenX;
		yStart = screenY;
		y = y - yDelta;
		x = x - xDelta;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// initiate the drag
	function startdrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		if (!canBeDragged(draggable, data))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		Event.stopObserving (handler, "mousedown", startdrag);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = draggableElement.offsetTop;
		x = draggableElement.offsetLeft;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';
		Event.observe (document, "mouseup", enddrag);
		Event.observe (document, "mousemove", drag);

		onStart(draggable, data);

		var dragboard = EzWebEffectBase.findDragboardElement(draggableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , enddrag, true);
		dragboardCover.observe("mousemove", drag, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		return false;
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll(e) {
		e = e || window.event; // needed for IE

		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// cancels the call to startdrag function
	function cancelbubbling(e) {
		e = e || window.event; // needed for IE
		Event.stop(e);
	}

	// add mousedown event listener
	Event.observe (handler, "mousedown", startdrag);
	var children = handler.childElements();
	for (var i = 0; i < children.length; i++)
		Event.observe (children[i], "mousedown", cancelbubbling);

	/**********
	 * Public methods
	 **********/

	this.setXOffset = function(offset) {
		xOffset = offset;
	}

	this.setYOffset = function(offset) {
		yOffset = offset;
	}

	this.destroy = function() {
		Event.stopObserving (handler, "mousedown", startdrag);
		startdrag = null;
		enddrag = null;
		drag = null;
		scroll = null;
		cancelbubbling = null;
		draggable = null;
		data = null;
		handler = null;
	}
}

/////////////////////////////////////
// IGadget drag & drop support
/////////////////////////////////////
function IGadgetDraggable (iGadget) {
	var context = new Object();
	context.iGadget = iGadget;
	Draggable.call(this, iGadget.element, iGadget.gadgetMenu, context,
	                     IGadgetDraggable.prototype.startFunc,
	                     IGadgetDraggable.prototype.updateFunc,
	                     IGadgetDraggable.prototype.finishFunc,
	                     IGadgetDraggable.prototype.canBeDraggedFunc);
}

IGadgetDraggable.prototype.canBeDraggedFunc = function (draggable, context) {
	return !context.iGadget.layout.dragboard.isLocked();
}


IGadgetDraggable.prototype.startFunc = function (draggable, context) {
	context.layout = context.iGadget.layout;
	context.dragboard = context.layout.dragboard;
	context.currentTab = context.dragboard.tabId;
	context.layout.initializeMove(context.iGadget, draggable);
	context.oldZIndex = context.iGadget.getZPosition();
	context.iGadget.setZPosition("999999");
}

IGadgetDraggable.prototype.updateFunc = function (event, draggable, context, x, y) {
	var element = null;

	// Check if the mouse is over a tab
	if (y < 0)
		element = document.elementFromPoint(event.clientX, event.clientY);

	var id = null;
	if (element != null && element instanceof Element) {
		id = element.getAttribute("id");
		if (id == null && element.parentNode instanceof Element) {
			element = element.parentNode;
			id = element.getAttribute("id");
		}

		if (id != null) {
			var result = id.match(/tab_(\d+)_(\d+)/);
			if (result != null && result[2] != context.currentTab) {
				if (context.selectedTab == result[2])
					return;

				if (context.selectedTabElement != null)
					context.selectedTabElement.removeClassName("selected");

				context.selectedTab = result[2];
				context.selectedTabElement = element;
				context.selectedTabElement.addClassName("selected");
				context.layout.disableCursor();
				return;
			}
		}
	}

	// The mouse is not over a tab
	// The cursor must allways be inside the dragboard
	var position = context.layout.getCellAt(x, y);
	if (position.y < 0)
		position.y = 0;
	if (position.x < 0)
		position.x = 0;
	if (context.selectedTabElement != null)
		context.selectedTabElement.removeClassName("selected");
	context.selectedTab = null;
	context.selectedTabElement = null;
	context.layout.moveTemporally(position.x, position.y);
	return;
}

IGadgetDraggable.prototype.finishFunc = function (draggable, context) {
	context.iGadget.setZPosition(context.oldZIndex);

	if (context.selectedTab != null) {
		context.layout.cancelMove();
		var dragboard = context.dragboard.workSpace.getTab(context.selectedTab).getDragboard();

		var destLayout;
		if (context.iGadget.onFreeLayout())
			destLayout = dragboard.freeLayout;
		else
			destLayout = dragboard.baseLayout;

		context.iGadget.moveToLayout(destLayout);

		var tabElement = context.selectedTabElement;
		setTimeout(function() {
			tabElement.removeClassName("selected");
		}, 500);

		context.selectedTab = null;
		context.selectedTabElement = null;
	} else {
		context.layout.acceptMove();
	}

	context.dragboard = null;
}

/////////////////////////////////////
// resize support
/////////////////////////////////////

function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var dragboardCover;
	var x, y;

	// remove the events
	function endresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving(document, "mouseup", endresize);
		Event.stopObserving(document, "mousemove", resize);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		handleElement.stopObserving("mouseup", endresize, true);
		handleElement.stopObserving("mousemove", resize, true);

		onFinish(resizableElement, handleElement, data);

		// Restore start event listener
		handleElement.observe("mousedown", startresize);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time the mouse is moved while resizing
	function resize(e) {
		e = e || window.event; // needed for IE

		xDelta = xStart - parseInt(e.screenX);
		yDelta = yStart - parseInt(e.screenY);
		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = y - yDelta;
		x = x - xDelta;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll() {
		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// initiate the resizing
	function startresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		handleElement.stopObserving("mousedown", startresize);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
		y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);
		Event.observe (document, "mouseup", endresize);
		Event.observe (document, "mousemove", resize);

		var dragboard = EzWebEffectBase.findDragboardElement(resizableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , endresize, true);
		dragboardCover.observe("mousemove", resize, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		handleElement.observe("mouseup", endresize, true);
		handleElement.observe("mousemove", resize, true);

		onStart(resizableElement, handleElement, data);

		return false;
	}

	// Add event listener
	Event.observe (handleElement, "mousedown", startresize);

	this.destroy = function() {
		Event.stopObserving (handleElement, "mousedown", startresize);
		startresize = null;
		resize = null;
		scroll = null;
		endresize = null;
		data = null;
		handleElement = null;
	}
}

/////////////////////////////////////
// IGadget resize support
/////////////////////////////////////
function IGadgetResizeHandle(handleElement, iGadget, resizeLeftSide) {
	ResizeHandle.call(this, iGadget.element, handleElement,
	                        {iGadget: iGadget, resizeLeftSide: resizeLeftSide},
	                        IGadgetResizeHandle.prototype.startFunc,
	                        IGadgetResizeHandle.prototype.updateFunc,
	                        IGadgetResizeHandle.prototype.finishFunc);
}

IGadgetResizeHandle.prototype.startFunc = function (resizableElement, handleElement, data) {
	handleElement.addClassName("inUse");
	// TODO merge with igadget minimum sizes
	data.minWidth = Math.ceil(data.iGadget.layout.fromPixelsToHCells(80));
	data.minHeight = Math.ceil(data.iGadget.layout.fromPixelsToVCells(50));
	data.iGadget.igadgetNameHTMLElement.blur();
	data.oldZIndex = data.iGadget.getZPosition();
	data.iGadget.setZPosition("999999");
}

IGadgetResizeHandle.prototype.updateFunc = function (resizableElement, handleElement, data, x, y) {
	var iGadget = data.iGadget;

	// Skip if the mouse is outside the dragboard
	if (iGadget.layout.isInside(x, y)) {
		var position = iGadget.layout.getCellAt(x, y);
		var currentPosition = iGadget.getPosition();
		var width;

		if (data.resizeLeftSide) {
			width = currentPosition.x + iGadget.getWidth() - position.x;
		} else {
			width = position.x - currentPosition.x + 1;
		}
		var height = position.y - currentPosition.y + 1;

		// Minimum width
		if (width < data.minWidth)
			width = data.minWidth;

		// Minimum height
		if (height < data.minHeight)
			height = data.minHeight;

		if (width != iGadget.getWidth() || height != iGadget.getHeight())
			iGadget.setSize(width, height, data.resizeLeftSide, false);
	}
}

IGadgetResizeHandle.prototype.finishFunc = function (resizableElement, handleElement, data) {
	var iGadget = data.iGadget;
	data.iGadget.setZPosition(data.oldZIndex);
	iGadget.setSize(iGadget.getWidth(), iGadget.getHeight(), data.resizeLeftSide, true);
	handleElement.removeClassName("inUse");
}


/**
 * abstract
 * @author aarranz
 */
function UserPref(varName_, label_, desc_, defaultValue_) {
	this.varName = null;
	this.label = null;
	this.desc = null;
	this.defaultValue = null;
}

UserPref.prototype.UserPref = function (varName_, label_, desc_, defaultValue_) {
	this.varName = varName_;
	this.label = label_;
	this.desc = desc_;

	if ((defaultValue_ == null) || (defaultValue_ == undefined))
		this.defaultValue = "";
	else
		this.defaultValue = defaultValue_;
}

UserPref.prototype.getVarName = function () {
	return this.varName;
}

UserPref.prototype.validate = function (newValue) {
	return true;
}

UserPref.prototype.getCurrentValue = function (varManager, iGadgetId) {
	var variable = varManager.getVariableByName(iGadgetId, this.varName);
	return variable.get();
}

//Set value and invoke callback function
UserPref.prototype.setValue = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.set(newValue);
	}
}

//Set new variable but it doesn't invoke callback function
UserPref.prototype.annotate = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.annotate(newValue);
	}
}

UserPref.prototype.setToDefault = function (varManager, iGadgetId) {
	this.setValue(varManager, this.defaultValue);
}

UserPref.prototype.getValueFromInterface = function (element) {
	return element.value;
}

UserPref.prototype.setDefaultValueInInterface = function (element) {
	element.value = this.defaultValue;
}

UserPref.prototype.getLabel = function () {
	var label = document.createElement("label");
	label.appendChild(document.createTextNode(this.label));
	label.setAttribute("title", this.desc);
	label.setAttribute("for", this.varName);

	return label;
}

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////
UserPref.prototype.TEXT    = "S"; // "S"tring
UserPref.prototype.INTEGER = "N"; // "N"umber
UserPref.prototype.DATE    = "D"; // "D"ate
UserPref.prototype.LIST    = "L"; // "L"ist
UserPref.prototype.BOOLEAN = "B"; // "B"oolean
UserPref.prototype.PASSWORD = "P"; // "P"assword

/**
 * extends UserPref
 * @author aarranz
 */
function ListUserPref(name_, label_, desc_, defaultValue_, ValueOptions_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
	this.options = ValueOptions_;
	this.optionHash = null;
}

ListUserPref.prototype = new UserPref();

ListUserPref.prototype.makeInterface = function (varManager, iGadgetId) {
	var select;

	select = document.createElement("select");
	select.setAttribute("name", this.varName);

	var currentValue = this.getCurrentValue(varManager, iGadgetId);
	var output = "";
	for (var i = 0; i < this.options.length; i++) {
		output += "<option value=\"" + this.options[i][0] + "\"";

		if (currentValue == this.options[i][0]) output += " selected=\"selected\"";

		output += ">" + this.options[i][1] + "</option>";
	}
		
	select.innerHTML = output;

	return select;
}

ListUserPref.prototype.validate = function (newValue) {
	if (this.optionHash == null) {
		this.optionHash = new Hash();
		for (var i = 0; i < this.options.length; i++)
			this.optionHash[this.options[i][0]] = true;
	}

	return this.optionHash[newValue] != undefined;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function IntUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

IntUserPref.prototype = new UserPref();

IntUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

IntUserPref.prototype.validate = function (newValue) {
	return !isNaN(Number(newValue));
}

/**
 * extends UserPref
 * @autor aarranz
 */
function TextUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

TextUserPref.prototype = new UserPref();

TextUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function DateUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

DateUserPref.prototype = new UserPref();

DateUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function BoolUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

BoolUserPref.prototype = new UserPref();

BoolUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "checkbox");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue.strip().toLowerCase() == "true")
		element.setAttribute("checked", "true");

	return element;
}

BoolUserPref.prototype.getValueFromInterface = function(element) {
	return element.checked ? "true" : "false";
}

/**
 * extends UserPref
 * @autor fabio
 */
function PasswordUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

PasswordUserPref.prototype = new UserPref();

PasswordUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "password");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}


if (!("elementFromPoint" in document)) {

	var elementPositions = function () {
		// *********************************
		// PRIVATE VARIABLES
		// *********************************
		this.elements = [];

		this.getElementByPoint = function(x, y) {
			for (var i = 0; i < this.elements.length; i++){
				var element = this.elements[i];
				var box = element.ownerDocument.getBoxObjectFor(element);
				if (box.x <= x && x <= (box.x+box.width) && box.y <= y && y <= (box.y+box.height)) {
					return element;
				}
			}
			return null;
		}

		this.addElement = function(element){
			this.elements.push(element);
		}

		this.removeElement = function(element){
			this.elements = this.elements.without(element);
		}
	};

	elementPositions = new elementPositions();

	document.elementFromPoint = function(x, y) {
		return elementPositions.getElementByPoint(x, y);
	}

	// Adding a new css rule for the tabs
	var css = document.styleSheets[1];
	css.insertRule('#tab_section .tab {-moz-binding: url("elementfrompoint.xbl#default")}', css.cssRules.length);
}

// This class represents the parameter that a filter can have
function Param (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.Param = function (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.getName = function() {
  return this._name;
}

Param.prototype.getType = function() {
  return this._type;
}

Param.prototype.getLabel = function() {
  return this._label;
}

Param.prototype.getIndex = function() {
  return this._index;
}

Param.prototype.getDefaultValue = function() {
  return this._defaultValue;
}

Param.prototype.createHtmlLabel = function() {
  var labelLayer = document.createElement("div");
  var img = document.createElement("img");
  img.setAttribute("src", "/ezweb/images/param.png");
  labelLayer.appendChild(img);
  labelLayer.appendChild(document.createTextNode(this._label + ':'));
  
  return labelLayer;
}

Param.prototype.createHtmlValue = function(wiringGUI, channel, valueElement){
  var context = {wiringGUI:wiringGUI, channel:channel, filter:channel.getFilter(), param:this, valueElement:valueElement};
  
  var paramValueLayer = document.createElement("div");
  var paramInput = document.createElement("input");
  paramInput.addClassName("paramValueInput");
  paramInput.setAttribute ("value", channel.getFilterParams()[this._index]);
  Event.observe(paramInput, 'click',function(e){Event.stop(e);});
  
  var checkResult = 
  	function(e){
    	var msg;
		if(e.target.value == "" || e.target.value.match(/^\s$/)){
	    	msg = interpolate(gettext("Filter param named '%(filterName)s' cannot be empty."), {filterName: this.param._label}, true);
			this.wiringGUI.showMessage(msg);
			this.valueElement.appendChild(document.createTextNode(gettext('undefined')));
			return;			
    	} 
		
		// Sets the param value
		this.channel.getFilterParams()[this.param._index] = e.target.value;
		
		// Sets the channel value
		this.valueElement.childNodes[0].nodeValue = channel.getValue();
		
		// Shows a message (only with error)
		if (this.channel.getFilter().getlastExecError() == null){
			this.wiringGUI.clearMessages();			
		}else{
			this.wiringGUI.showMessage(this.channel.getFilter().getlastExecError());
			this.valueElement.childNodes[0].nodeValue = gettext('undefined');
		}
    };
	
  // Sets the input
  Event.observe(paramInput, 'change', checkResult.bind(context));
  paramValueLayer.appendChild(paramInput);
  return paramValueLayer;
}

// This class represents the filter of the a channel
function Filter (id_, name_, label_, nature_, code_, category_, params_, helpText_) {
  this._id = id_;
  this._name = name_;
  this._label = label_;
  this._nature = nature_;
  this._params = new Array();
  this._lastExecError = null;
  this._category = category_;
  this._helpText = helpText_;
  
  // Sets the filter parameters
  this.processParams (params_); 
  
  // Sets the filter code
  try{
	if ((nature_ == 'USER') && ((typeof code_) != 'function')){
		this._code = null;
	}else{
		this._code = eval ('(' + code_ + ')');		
	}
  }catch(e){
	var msg = interpolate(gettext("Error loading code of the filter '%(filterName)s'."), {filterName: this._label}, true);
	LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
  }
}

Filter.prototype.getId = function() {
  return this._id;
}

Filter.prototype.getName = function() {
  return this._name;
}

Filter.prototype.getLabel = function() {
  return this._label;
}

Filter.prototype.getParams = function() {
  return this._params;
}

Filter.prototype.getlastExecError = function() {
  return this._lastExecError;
}

Filter.prototype.setParam = function(param_) {
  this._params[param_.getIndex()] = param_;
}

Filter.prototype.hasParams = function() {
  return this._params.length != 0;
}

Filter.prototype.getCategory = function() {
  return this._category;
}

Filter.prototype.getHelpText = function() {
  return this._helpText;
}

Filter.prototype.processParams = function(params_) {
  this._params = new Array();
  if (params_ != null){
  	var fParam, paramObject;
  	var jsonParams = eval (params_);  
  	for (var i = 0; i < jsonParams.length; i++) {
		fParam = jsonParams[i];
		if (fParam.type == 'jpath'){
			paramObject = new JPathParam (fParam.name, fParam.label, fParam.index, fParam.defaultValue);
		} else {
			paramObject = new Param(fParam.name, fParam.label, fParam.type, fParam.index, fParam.defaultValue);						
		}
		this.setParam(paramObject);  
  	}
  } 	
}

Filter.prototype.run = function(channelValue_, paramValues_) {
	var i, msg, params = '';

	// Begins to run, no errors
	this._lastExecError = null;
	
//	// Creates the varible for the channel value
//	eval ("var channelValue = '" + channelValue_ + "';");
	
	try{
		// Creates the variables for other params
		for (i=0; i < this._params.length; ++i){ 
			if (i!=0)
				params += ',';
			// Checks the type of parameter
			switch (this._params[i].getType()){
			case 'N': // Param is Number
				var interger_value = parseInt(paramValues_[i]);
				if (isNaN(interger_value)){
					msg = interpolate(gettext("Error loading parameter '%(paramName)s' of the filter '%(filterName)s'. It must be a number"), 
						{paramName: this._params[i].getLabel(), filterName: this._label}, true);
					LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
					this._lastExecError = msg;
					return gettext('undefined');
				}
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break; 
			case 'regexp': // Param is RegExp
				if ((paramValues_[i].indexOf('/') == 0) && (paramValues_[i].lastIndexOf('/') > 0)){
					var current_pattern = paramValues_[i].substring(1, paramValues_[i].lastIndexOf('/'));
					var current_modifiers = paramValues_[i].substring(paramValues_[i].lastIndexOf('/') + 1, paramValues_[i].length);
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + current_pattern + "', '" + current_modifiers + "');");	
				}else {
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + paramValues_[i] + "');");
				}
				params += this._params[i].getName();
				break;
			case 'jpath': // Param is a JPATH expresion (for JSON)
				var jpath_exp = this._params[i].parse(paramValues_[i]);
				eval ("var " + this._params[i].getName() + " = this._params[i].parse(paramValues_[i]);");
				params += this._params[i].getName();
				break;
			default: // Otherwise is String
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break;
			}

		}
	}catch(e){
		msg = interpolate(gettext("Error loading param '%(paramName)s' of the filter '%(filterName)s': %(error)s."), 
			{paramName: this._params[i].getLabel(), filterName: this._label, error: e}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		this._lastExecError = msg;
		return gettext('undefined');
	}
	
	try{
	
		// Exeutes the filter code
		switch(this._nature){
			case "NATIVE":
				return eval ('channelValue_.' + this._name + '(' + params + ');');
				break;
			case "JSLIB":
				if (params != '')
					params = ',' + params;
				return eval (this._name + '(channelValue_' + params + ');');
				break;
			case "USER":
				if (params != '')
					params = ',' + params;
				return eval ('this._code(channelValue_' + params + ');');
				break;
			default:
				break;
		}
	
	}catch(e){
		var msg = interpolate(gettext("Error executing code of the filter '%(filterName)s'."), {filterName: this._Label}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		// Saves the message (for wiring interface)
		if (this._params.length == 0){
			this._lastExecError = msg;
		}else{
			this._lastExecError = interpolate(gettext("Error executing code of the filter '%(filterName)s'. Check the parametres."), {filterName: this._label}, true);
		}
		return gettext('undefined');
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// This is the class has the common properties of every connectable object of the wiring module //
// The other connectable classes from the wiring module will inherit from this class            //
//////////////////////////////////////////////////////////////////////////////////////////////////
function wConnectable (name, type, friendCode, id) {
  this.id = id;
  this._name = name;
  this._type = type;
  this._friendCode = friendCode;
  this.connectableType = null;
  this.view = null;
}

wConnectable.prototype.annotate = function() {}

wConnectable.prototype.getType = function() {
  return this.type;
}

wConnectable.prototype.getValue = function() {
  throw new Exception("Unimplemented function"); // TODO
}

wConnectable.prototype.getName = function() {
  return this._name;
}

wConnectable.prototype.getId = function() {
  return this.id;
}

wConnectable.prototype.getFriendCode = function() {
  return this._friendCode;
}

wConnectable.prototype.setInterface = function(view) {
	this.view=view;
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
wConnectable.prototype.destroy = function () {
	this.fullDisconnect();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may be placed in the middle of a connection between a In object and wOut object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wOut(name, type, friendCode, id) {
   wConnectable.call(this, name, type, friendCode, id);
   this.connectableType = "out";
   this.inouts = new Array();
}

wOut.prototype = new wConnectable();

wOut.prototype.annotate = function(value) {
    this.variable.annotate(value);
}

wOut.prototype.addInOut = function(inout) {
	this.inouts.push(inout);
}

wOut.prototype.disconnect = function(inout) {
	inout._removeOutput(this);
    this.inouts.remove(inout);
}

wOut.prototype.fullDisconnect = function() {
  // Disconnecting inouts
  var inouts = this.inouts.clone();
  for (var i = 0; i < inouts.length; ++i)
    this.disconnect(inouts[i]);
}

wOut.prototype.refresh = function() {
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may initialize one transmission through the wiring module //
////////////////////////////////////////////////////////////////////////////////////////////////////////
function wIn(name, type, friendCode, id) {
  wConnectable.call(this, name, type, friendCode, id);
  this.outputs = new Array();
  this.connectableType = "in";
}

wIn.prototype = new wConnectable();

wIn.prototype.connect = function(out) {
  this.outputs.push(out);
  if (out instanceof wInOut)
    out._addInput(this);
}

wIn.prototype.disconnect = function(out) {
  if (this.outputs.getElementById(out.getId()) == out) {
    if (out instanceof wInOut)
      out._removeInput(this);

    this.outputs.remove(out);
  }
}

wIn.prototype.fullDisconnect = function() {
  // Outputs
  var outputs = this.outputs.clone();
  for (var i = 0; i < outputs.length; ++i)
    this.disconnect(outputs[i]);
}

wIn.prototype.propagate = function(value, initial) {
  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].annotate(value);

  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].propagate(value, initial);
}

wIn.prototype.refresh = function() {
}

/////////////////////////////////////////////////////////////////////
// This class represents every object which may transmit some data //
/////////////////////////////////////////////////////////////////////
function wInOut(name, type, friendCode, id) {
  wIn.call(this, name, type, friendCode, id);

  this.inputs = new Array();
  this.connectableType = "inout";
}

wInOut.prototype = new wIn();

wInOut.prototype.annotate = function(value) {
  for (var i = 0; i < this.outputs.length; ++i)
      this.outputs[i].annotate();
}	

wInOut.prototype.connect = function(out) {	
	wIn.prototype.connect.call(this, out);
	
	out.addInOut(this);
}

wInOut.prototype._addInput = function(wIn) {
  this.inputs.push(wIn);
}

wInOut.prototype._removeInput = function(wIn) {
  if (this.inputs.getElementById(wIn.getId()) == wIn)
	    this.inputs.remove(wIn);
}

wInOut.prototype._removeOutput = function(wOut) {
  if (this.outputs.getElementById(wOut.getId()) == wOut)
    this.outputs.remove(wOut);
}

wInOut.prototype.fullDisconnect = function() {
  // Inputs
  var inputs = this.inputs.clone();
  for (var i = 0; i < inputs.length; ++i)
    inputs[i].disconnect(this);

  // Outputs
  var outputs = this.outputs.clone();
  for (var i = 0; i < outputs.length; ++i)
    this.disconnect(outputs[i]);
}

// TODO implement this function
//wInOut.prototype.searchCycle = function(name)

// wChannel and wEvent (connectables that propagates values) register in their
// associated variable, a pointer to them
// Double-linked structure.

//////////////////////////////////////////////////////////////////////////
// This class represents a iGadget variable which may produce some data 
//////////////////////////////////////////////////////////////////////////
function wEvent(variable, type, friendCode, id) {
  this.variable = variable;
  wIn.call(this, this.variable.name, type, friendCode, id);
  this.variable.assignConnectable(this);
}

wEvent.prototype = new wIn();

wEvent.prototype.getQualifiedName = function () {
  return "event_" + this.variable.id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wChannel (variable, name, id, provisional_id) {
  this.variable = variable;
  this.provisional_id=provisional_id;
  wInOut.call(this, name, null, null, id);
  this.variable.assignConnectable(this);
  this.filter = null;
  this.filterParams = new Array();
}

wChannel.prototype = new wInOut();

wChannel.prototype.getValue = function() {
  if (this.filter == null)
	return this.variable.get();  	
  else
 	return this.filter.run(this.variable.get(), this.filterParams);
}

wChannel.prototype.getValueWithoutFilter = function() {
	return this.variable.get();  	
}

wChannel.prototype.getFilter = function() {
  return this.filter;
}

wChannel.prototype.setFilter = function(newFilter) {
  this.filter = newFilter;
}

wChannel.prototype.processFilterParams = function(fParamsJson_) {
  this.filterParams = new Array();
  if (fParamsJson_ != null){
  	var fParams = eval (fParamsJson_);
	for (var k = 0; k < fParams.length; k++) {
		this.filterParams[fParams[k].index] = fParams[k].value; 
  	}
  }
}

wChannel.prototype.setFilterParams = function(fParams) {
  this.filterParams = fParams;
}

wChannel.prototype.getFilterParams = function() {
  return this.filterParams;
}

wChannel.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
  wInOut.prototype.propagate.call(this, this.getValue(), initial);
}

wChannel.prototype.getQualifiedName = function () {
  return "channel_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wTab (variable, name, tab, id) {
  this.variable = variable;
  this.tab = tab;
  this.variable.assignConnectable(this);
  wOut.call(this, name, null, null, id);
}

wTab.prototype = new wOut();

wTab.prototype.propagate = function(newValue, initial) {
  if(!initial){
  	this.variable.set(newValue);
  }
}

wTab.prototype.getQualifiedName = function () {
  return "tab_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////
// This class representents a iGadget variable which may receive some data //
/////////////////////////////////////////////////////////////////////////////
function wSlot(variable, type, friendCode, id) {
  this.variable = variable;
  this.variable.assignConnectable(this);
  wOut.call(this, this.variable.name, type, friendCode, id);
}

wSlot.prototype = new wOut();

wSlot.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
}

wSlot.prototype.getQualifiedName = function () {
  return "slot_" + this.variable.id;
}

wSlot.prototype.refresh = function() {
  this.variable.refresh();
}

function Wiring (workspace, workSpaceGlobalInfo) {

	// *****************
	//  PRIVATE METHODS
	// *****************

	// ****************
	// PUBLIC METHODS
	// ****************
	
	Wiring.prototype.getConnectableId = function (variables, name, igadgetId) {
		for (i=0; i<variables.length; i++) {
			var variable = variables[i];
			
			if ((variable.name == name) && (variable.igadgetId == igadgetId)) {
				return variable.connectable.id;
			}
		}
	}

	Wiring.prototype.processFilter = function (filterData) {
		var filterObject = new Filter (filterData.id, filterData.name, filterData.label, 
									   filterData.nature, filterData.code, filterData.category, 
									   filterData.params, filterData.help_text);
		
		this.filters[filterData.id] = filterObject;		
	}

	Wiring.prototype.processTab = function (tabData) {
		var igadgets = tabData['igadgetList'];
		var dragboard = this.workspace.getTab(tabData['id']).getDragboard();

		for (var i = 0; i < igadgets.length; i++) {
			this.addInstance(dragboard.getIGadget(igadgets[i].id), igadgets[i].variables);
		}
	}
	
	Wiring.prototype.processVar = function (varData) {
		var varManager = this.workspace.getVarManager();
		var variable = varManager.getWorkspaceVariableById(varData.id);
		
		if (varData.aspect == "TAB" && varData.connectable) {
			var connectableId = varData.connectable.id;
			var tab_id = varData.tab_id;
			
			var tab = this.workspace.getTab(tab_id);
			
		    var connectable = new wTab(variable, varData.name, tab, connectableId);
		    
		    tab.connectable = connectable;
		}
		
		if (varData.aspect == "CHANNEL" && varData.connectable) {
			var connectableId = varData.connectable.id;
		    var channel = new wChannel(variable, varData.name, connectableId, false);
			
			// Setting channel filter
			channel.setFilter(this.filters[varData.connectable.filter]);
		    channel.processFilterParams(varData.connectable.filter_params);
			
		    // Connecting channel input		
		    var connectable_ins = varData.connectable.ins;
		    for (var j = 0; j < connectable_ins.length; j++) {
		    	// Input can be: {wEvent, wChannel}
		    	var current_input = connectable_ins[j];
		    	
		    	var in_connectable = null;
		    	if (current_input.connectable_type == "in") {
		    		var var_id = current_input.ig_var_id;
		    		in_connectable = varManager.getVariableById(var_id).getConnectable();
		    	}
		    	else {
		    		if (current_input.connectable_type == "inout") {
		    			var var_id = current_input.ws_var_id;
		    			in_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Input connectables can only be In or InOut!!!")
		    		}
		    	}

		    	in_connectable.connect(channel);
		    }
		    
		    // Connecting channel output  
		    var connectable_outs = varData.connectable.outs;
		    for (var j = 0; j < connectable_outs.length; j++) {
		    	// Outputs can be: {wSlot, wTab}
		    	var current_output = connectable_outs[j];
		    	
		    	var out_connectable = null;
		    	if (current_output.connectable_type == "out") {
		    		if (current_output.ig_var_id) {
		    			var var_id = current_output.ig_var_id;
		    			out_connectable = varManager.getVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    	}
		    	else {
		    		if (current_output.connectable_type == "inout") {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Output connectables can only be In or InOut!!!")
		    		}
		    	}

		    	channel.connect(out_connectable);
		    }

			// Save it on the channel list
		    this.channels.push(channel);
		}	
	}

	Wiring.prototype.propagateInitialValues = function (initial) {
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			channel.propagate(channel.variable.value, initial);
		}
	}

	Wiring.prototype.refreshIGadget = function(igadget) {
		var connectables = this.getIGadgetConnectables(igadget);

		for (var i = 0; i < connectables.length; i++) {
			var connectable = connectables[i];
			connectable.refresh();
		}
	}

	Wiring.prototype.loadWiring = function (workSpaceData) {
		var workSpace = workSpaceData['workspace'];
		var ws_vars_info = workSpace['workSpaceVariableList'];
		var tabs = workSpace['tabList'];
		var filters = workSpace['filters'];

		for (var i = 0; i < tabs.length; i++) {
			this.processTab(tabs[i]);
		}

		// Load all platform filters. 
		// ATTENTION: Filters must be loaded before workspace variables
		for (var i = 0; i < filters.length; i++) {
			this.processFilter(filters[i]);
		}
		
		// Load WorkSpace variables
		for (var i = 0; i < ws_vars_info.length; i++) {
			this.processVar(ws_vars_info[i]);
		}

		this.loaded = true;
	}

	Wiring.prototype.addInstance = function (igadget, variables) {
		var varManager = this.workspace.getVarManager();
		var gadgetEntry = new Object();
		var iGadgetId = igadget.getId();

		if (this.iGadgets[iGadgetId]) {
			var msg = gettext("Error adding iGadget into the wiring module of the workspace: Gadget instance already exists.");
			LogManagerFactory.getInstance().log(msg);
		}

		gadgetEntry.events = new Array();
		gadgetEntry.slots = new Array();
		gadgetEntry.connectables = new Array();

		// IGadget variables
		for (var i = 0; i < variables.length; i++) {
			var variableData = variables[i];
			var variable = varManager.getVariableByName(variableData.igadgetId, variableData.name);
			
			if (variable.aspect == "EVEN" && variableData.connectable) {
				var connectableId = variableData.connectable.id;
			    var connectable = new wEvent(variable, variableData.type, variableData.friend_code, connectableId);
			    
			    gadgetEntry.events.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
			if (variable.aspect == "SLOT" && variableData.connectable) {
			    var connectableId = variableData.connectable.id;
			    var connectable = new wSlot(variable, variableData.type, variableData.friend_code, connectableId);

			    gadgetEntry.slots.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
		}
		
		this.iGadgets[iGadgetId] = gadgetEntry;
	}
	
	// TODO
	Wiring.prototype.removeInstance = function (iGadgetId) {
		var entry = this.iGadgets[iGadgetId];

		if (!entry) {
			var msg = gettext("Wiring error: Trying to remove an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		for (var i = 0; i < entry.events.length; i++)
			entry.events[i].destroy();
		entry.events.clear();
		
		for (var i = 0; i < entry.slots.length; i++)
			entry.slots[i].destroy();
		entry.slots.clear();

		this.iGadgets.remove(iGadgetId)
	}

	Wiring.prototype.getIGadgetConnectables = function(iGadget) {
		var iGadgetEntry = this.iGadgets[iGadget.id];

		if (iGadgetEntry == null) {
			var msg = gettext("Wiring error: Trying to retreive the connectables of an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		return iGadgetEntry.connectables;
	}

	Wiring.prototype.getChannels = function() {
		return this.channels;
	}
	
	Wiring.prototype.getFiltersSort = function() {
		var sortByLabel = function (a, b){
			var x = a.getName();
			var y = b.getName();
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		} 
		return this.filters.values().sort(sortByLabel);
	}
	
	Wiring.prototype.channelExists = function(channelName){
		if(this.channels.getElementByName(channelName))
			return true;
		return false;
	}

	Wiring.prototype._insertChannel = function (channelName, channelVar, id, provisional_id) {
		if (this.channelExists(channelName)) {
			var msg = interpolate(gettext("Error creating channel %(channelName)s: Channel already exists"),{channelName: channelName}, true);
//			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}		
		
		if (!provisional_id) 
			provisional_id=false;

		var channel = new wChannel(channelVar, channelName, id, provisional_id);
		this.channels.push(channel);
					
		return channel;
	}

	Wiring.prototype.createChannel = function (channelName, channelId) {
		var channelVar = this.workspace.getVarManager().createWorkspaceVariable(channelName);

		return this._insertChannel(channelName, channelVar, channelId, true);
	}
	
	Wiring.prototype.getOrCreateChannel = function (channelName, channelId) {
		var channel = this.channels.getElementByName(channelName);
		if(!channel){
			channel = this.createChannel(channelName, channelId);
		}
		return channel;
	}

	Wiring.prototype.removeChannel = function (channelId, isTemp) {
		var channel = this.channels.getElementById(channelId);

		if (channel == undefined) {
			var msg = gettext("Error removing channel %(channelName)s: Channel does not exist");
			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		//delete the workspace variable
		this.workspace.getVarManager().removeWorkspaceVariable(channel.variable.id);
		
		if (!isTemp)
			this.channelsForRemoving.push(channel.id);
		
		this.channels.removeById(channelId);
		
		channel.destroy();
	}

	Wiring.prototype.serializationSuccess = function (transport){
		// JSON-coded ids mapping
		var response = transport.responseText;
		var json = eval ('(' + response + ')');
		
		var mappings = json['ids'];
		for (var i=0; i<mappings.length; i++) {
			var mapping = mappings[i];
			for (var j=0; j<this.channels.length; j++) {
				if (this.channels[j].getId() == mapping.provisional_id) {
					this.channels[j].id = mapping.id;
					this.channels[j].provisional_id = false;
					this.channels[j].previous_id = mapping.provisional_id;
					this.channels[j].variable.id = mapping.var_id;
					this.workspace.getVarManager().addWorkspaceVariable(mapping.var_id, this.channels[j].variable);
					break;
				}
			}
		}
		
		// Channels has been sabed in db. Cleaning state variables!
		delete this.channelsForRemoving;
		this.channelsForRemoving = [];
	}

	Wiring.prototype.unload = function () {	
		var varManager = this.workspace.getVarManager();
		
		for (var i=0; i<this.channels.length; i++) {
			var channel = this.channels[i];
			
			varManager.removeWorkspaceVariable(channel.variable.id);
			
			channel.destroy();
		}

	}
	
	Wiring.prototype.serializationError = function (response) {
		var p = response.responseText;
		msg = interpolate(gettext("Error : %(errorMsg)s."), {errorMsg: p}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	Wiring.prototype.serialize = function () {
		var gadgetKeys = this.iGadgets.keys();
		var serialized_channels = [];
		
		// Channels
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			var serialized_channel = new Object();
			
			// Filling channel info!!!
			serialized_channel['id'] = channel.id; 
			serialized_channel['name'] = channel._name;
			serialized_channel['type'] = channel._type;
			serialized_channel['friend_code'] = channel._friendCode;
			serialized_channel['var_id'] = channel.variable.id;
			serialized_channel['provisional_id'] = channel.provisional_id;
			if (channel.getFilter() == null)
				serialized_channel['filter'] = null;
			else
				serialized_channel['filter'] = channel.getFilter().getId();
			
			var serialized_filter_params = '';
			for (var k = 0; k < channel.getFilterParams().length; k++) {
				serialized_filter_params += '{"index": ' + k;  
				serialized_filter_params += ', "value": "' + channel.getFilterParams()[k] + '"}';
				if (k != (channel.getFilterParams().length - 1)){
					serialized_filter_params += ', ';
				}
			}
			serialized_channel['filter_params'] = '{[' + serialized_filter_params + ']}';
			
			serialized_channel.ins = [];
			                              
			var serialized_inputs = serialized_channel.ins;

			for (var j = 0; j < channel.inputs.length; j++) {
				var input = channel.inputs[j];
				var serialized_input = new Object();
				
				serialized_input['id'] = input.id;
				serialized_input['connectable_type'] = input.connectableType;
				
				serialized_inputs.push(serialized_input);
			}

			serialized_channel.outs = [];
			
			var serialized_outputs = serialized_channel.outs;
			
			for (var j = 0; j < channel.outputs.length; j++) {
				var output = channel.outputs[j];
				var serialized_output = new Object();
				
				serialized_output['id'] = output.id;
				serialized_output['connectable_type'] = output.connectableType;
				
				serialized_outputs.push(serialized_output);
			}
			
			serialized_channels.push(serialized_channel);
		}
		
		//Channels for adding

		var json = {'inOutList' : serialized_channels};
		
		json['channelsForRemoving'] = this.channelsForRemoving;
		
		var param = {'json': Object.toJSON(json)};
		
		var url = URIs.GET_POST_WIRING.evaluate({'id': this.workspace.workSpaceState.id});
		
		PersistenceEngineFactory.getInstance().send_post(url, param, this, this.serializationSuccess, this.serializationError); 
	}

	// ***************
	// CONSTRUCTOR
	// ***************
	this.workspace = workspace;

	this.loaded = false;
	this.persistenceEngine = PersistenceEngineFactory.getInstance();
	this.iGadgets = new Hash();
	this.channels = new Array();
	this.filters = new Hash();
	this.channelsForRemoving = [];
	
	
	
	this.loadWiring(workSpaceGlobalInfo);
}



function WiringInterface(wiring, workspace, wiringContainer, wiringLink) {

  // ***********************************
  //  PRIVATE METHODS AND ATTRIBUTES
  // ***********************************

  this.workspace = workspace;
  this.wiring = wiring;
  this.wiringContainer = wiringContainer;
  this.wiringLink = wiringLink;

  this.opmanager = OpManagerFactory.getInstance();
  this.currentChannel = null;
  this.inputs = new Array(); // Input connections (events & inouts)
  this.outputs = new Array(); // Output connections (slots & inouts)
  this.channels = new Array();
  this.filterMenus = new Hash();
  this.friend_codes = {};
  this.highlight_color = "#FFFFE0"; // TODO remove
  this.friend_codes_counter = 0;
  this.channelBaseName = gettext("Channel");
  this.visible = false; // TODO temporal workarround
  this.unfold_on_entering = false; //Does the user want all tabs to be expanded?
  
  Event.observe($('wiring_link'), "click", function(){OpManagerFactory.getInstance().activeWorkSpace.showWiring()}, false, "show_wiring");

  this.eventColumn = $('eventColumn');
  this.slotColumn = $('slotColumn');
  this.event_list = $('events_list');//wiringContainer.getElementById('events_list');
  this.slot_list = $('slots_list');//wiringContainer.getElementById('slots_list');
  this.channels_list = $('channels_list');//wiringContainer.getElementById('channels_list');
  this.channel_name = $('channel_name');//wiringContainer.getElementById('channel_name');
  this.msgsDiv = $('wiring_messages');
  this.newChannel = $('newChannel');
  this.wiringTable = $('wiring_table');
  
  //folding/unfolding all tabs events
  //events
    
	titleElement=this.eventColumn.getElementsByClassName("title")[0];
	
	Event.observe(titleElement, "click",
	                        function (e) {
	                        	var expand = null;
	                        	var folded = e.target.hasClassName('folded');
	                        	var nIgadgets = $$('#events_list .igadget').length
	                        	var nIgadgetsFolded = $$('#events_list .igadget.folded').length
	                        	if(folded && nIgadgetsFolded == 0)
	                        		expand = false;	                      
	                        	else if(!folded && nIgadgetsFolded == nIgadgets)
	                        		expand = true;
	                        	else{
	                        		expand = folded;
	                        		e.target.toggleClassName('folded');
	                        	}
								this.toggleEventColumn(expand);	
	                        	
								
	                        }.bind(this));
	
	//slots
	titleElement=this.slotColumn.getElementsByClassName("title")[0];
	Event.observe(titleElement, "click",
	                    function (e) {
	                    	var expand = null;
	                    	var folded = e.target.hasClassName('folded');
	                    	var nIgadgets = $$('#slots_list .igadget').length
	                    	var nIgadgetsFolded = $$('#slots_list .igadget.folded').length
	                    	if(folded && nIgadgetsFolded == 0)
	                    		expand = false;	                      
	                    	else if(!folded && nIgadgetsFolded == nIgadgets)
	                    		expand = true;
	                    	else{
	                    		expand = folded;
	                    		e.target.toggleClassName('folded');
	                    	}
							this.toggleSlotColumn(expand);	
	                    }.bind(this));    
	  
	Event.observe($('unfold_all_link'), "click",
	  					function (){
	  						this.toggleEventColumn(true);
						  	this.toggleSlotColumn(true);
						}.bind(this));
					
	Event.observe($('unfold_chkItem'), "click",
	  					function(e){	  				
	  						//the user wants all unfolded
	  						e.target.toggleClassName('chkItem');
	  						this.unfold_on_entering = e.target.hasClassName('chkItem');
	  					}.bind(this));  
  
//  this.chEventsWr = null;
//  this.chSlotsWr = null;  

  this._eventCreateChannel = function (e) {
    Event.stop(e);
    this._createChannel();
    this.toggleEventColumn(true);    
    this.toggleSlotColumn(true);
  }.bind(this)
  
  WiringInterface.prototype.show = function () {
    if (this.visible)
      return; // Nothing to do

    this.visible = true;

    this.renewInterface();

    LayoutManagerFactory.getInstance().showWiring(this);

    Event.observe(this.newChannel, 'click', this._eventCreateChannel);
  }

  WiringInterface.prototype.hide = function () {
    if (!this.visible)
      return; // Nothing to do

    this.visible = false;
    if(this.currentChannel){
		this.uncheckChannel(this.currentChannel);
		this.currentChannel = null;
    }
    
    this.saveWiring();
    this.channels.clear();

    Event.stopObserving(this.newChannel, 'click', this._eventCreateChannel);
    LayoutManagerFactory.getInstance().hideView(this.wiringContainer);
  }
  
  WiringInterface.prototype.unload = function () {
	    // Saving wiring structure and hiding!
	    //this.wiringContainer.update();
  }

  WiringInterface.prototype.saveWiring = function () {

    for (var i = 0; i < this.channels.length; i++) {
      this.channels[i].commitChanges(this.wiring);
    }
    
    // The wiring engine is notified in order to persist state!
    this.wiring.serialize();
  }

  WiringInterface.prototype._showFilterParams = function (channel, filter, paramLabelElement, paramValueElement, valueElement){
	// No filter, no params
	if (filter == null){
		return;
	}
	
	// Adds a new row for each param of the current filter
	var params = filter.getParams();
	for (var p = 0; p < params.length; p++) {
		paramLabelElement.appendChild(params[p].createHtmlLabel());
		paramValueElement.appendChild(params[p].createHtmlValue(this, channel, valueElement));
	}
  }
  
  WiringInterface.prototype._setChannelFilter = function (channel, filter){
	var filterValue;

	var selected_channel_cells = $$('.channel.selected td');
	var filter_content = selected_channel_cells[1].firstChild.childNodes[0];
	var param_label_content = selected_channel_cells[0].firstChild.childNodes[1];
	var param_content = selected_channel_cells[1].firstChild.childNodes[1];
	var value_content = selected_channel_cells[1].firstChild.childNodes[2];

	channel.setFilter(filter);

	// Removes the params of the other filter
	while (param_label_content.childNodes.length > 0){
		param_label_content.childNodes[param_label_content.childNodes.length - 1].remove();	
	}
	while (param_content.childNodes.length > 0){
		param_content.childNodes[param_content.childNodes.length - 1].remove();	
	}
	
	// Sets the filter name
	if (filter_content.childNodes[0].nodeType ==  Node.TEXT_NODE){
		filterValue = filter_content.childNodes[0];
	}else{
		filterValue = filter_content.childNodes[1];
	}
	if (filter == null){
		filterValue.nodeValue = gettext("Empty");
	}else{
		filterValue.nodeValue = filter.getLabel();
	}
		
	// Sets the channel value and the channel filter params	
	if ((filter == null) || !filter.hasParams()){
		value_content.update(channel.getValue());
	}else{
		// The channel value will be calculated with the params given by user.
		value_content.update(channel.getValueWithoutFilter());
		this._showFilterParams(channel, filter, param_label_content, param_content, value_content);
	}
	

	// The filter content size has changed, and the selected channel and its arrows must be repainted 
	this.uncheckChannel(this.currentChannel);
	this.highlightChannel(this.currentChannel);
  }

  // Creates the menu with all the available filters
  WiringInterface.prototype._createFilterMenu = function (channel) {
  	var context = {wiringGUI:this, channel:channel};

	var idFilterMenu = 'filter_menu_' + channel.getId();
	var filterMenuHTML = '<div id="'+idFilterMenu+'" class="drop_down_menu"><div id="submenu_'+idFilterMenu+'" class="submenu"></div></div>';
	new Insertion.After($('menu_layer'), filterMenuHTML);
	var filterMenu = new FilterDropDownMenu(idFilterMenu);

//	filterMenu.addOptionWithHelp(
//			"/ezweb/images/pencil.png", 
// 		    "Creates a new filter.",
//			gettext('New Filter'), 
//			function(){
//				LayoutManagerFactory.getInstance().hideCover();
//			},
//			0);

	filterMenu.addOptionWithHelp(
			"/ezweb/images/filter.gif", 
			'Empty', 
			"Returns the value of the channel unfiltered.",
			function(){
				LayoutManagerFactory.getInstance().hideCover();
				this.wiringGUI._setChannelFilter(this.channel, null); 
			}.bind(context),
			0);
	var filters = this.wiring.getFiltersSort();
	for (var i = 0; i < filters.length; i++) {
		context = {wiringGUI:this, channel:channel, filter:filters[i]};
		filterMenu.addOptionWithHelp(
			"/ezweb/images/filter.gif", 
			filters[i].getLabel(),
			filters[i].getHelpText(), 
			function(){
				LayoutManagerFactory.getInstance().hideCover();
				this.wiringGUI._setChannelFilter(this.channel, this.filter);
			}.bind(context),
			i+1
		);	
	}
	return filterMenu;
  }
    
  WiringInterface.prototype._addChannelInterface = function (channel) {
    var context = {channel: channel, wiringGUI:this};
    var channelElement = document.createElement("div");
	this.channels_list.appendChild(channelElement);
    channelElement.addClassName("channel");
    Event.observe(channelElement, "click",
                      function (e) {
                        Event.stop(e);
						// Creates the menu just when the filter is selected
						if (this.wiringGUI.filterMenus[this.channel.getId()] == null){
							var newFilterMenu = this.wiringGUI._createFilterMenu(this.channel); 
							this.wiringGUI.filterMenus[this.channel.getId()] = newFilterMenu;
							this.channel.setMenu(newFilterMenu);	
						}
						this.wiringGUI._changeChannel(this.channel);
                      }.bind(context));
    
	var inputDel = document.createElement("img");
    channelElement.appendChild(inputDel);
	inputDel.setAttribute("alt", gettext("Remove"));
    inputDel.setAttribute("src", "/ezweb/images/remove.png");
    Event.observe(inputDel, "click",
                            function (e) {
                              Event.stop(e);
                              this.wiringGUI._removeChannel(this.channel);
                            }.bind(context));
    
    var channelNameInput = document.createElement("input");
	channelElement.appendChild(channelNameInput);
    channelNameInput.setAttribute ("value", channel.getName());
    channelNameInput.addClassName ("channelNameInput");
    Event.observe(channelNameInput, 'click', 
		function(e){
			if(this.wiringGUI.currentChannel==this.channel)
				Event.stop(e);
		}.bind(context)); //do not propagate to div.
    var checkName = function(e){
    	if(e.target.value == "" || e.target.value.match(/^\s$/)){
	    	var msg = gettext("Error updating a channel. Invalid name");
			LogManagerFactory.getInstance().log(msg);
    		e.target.value=this.channel.getName();
    	}else if(this.wiringGUI.channelExists(e.target.value)){
    		var msg = interpolate(gettext("Error updating a channel. %(channelName)s: Channel already exists"),{channelName: e.target.value}, true);
			LogManagerFactory.getInstance().log(msg);
			e.target.value=this.channel.getName();
    	}else{
    		this.channel.setName(e.target.value)
    	}
    }
    Event.observe(channelNameInput, 'change', checkName.bind(context));
     
    var channelContent = document.createElement("div");
    channelElement.appendChild(channelContent);
	channelContent.addClassName("channelContent");
    
    // Channel information showed when the channel is selected
	var contentTable = document.createElement("table");
	contentTable.addClassName("contentTable");
	channelContent.appendChild(contentTable);
	
	// Creates the row for the channel information
	var contentRow = document.createElement("tr");
	contentTable.appendChild(contentRow);
	
	// Creates a layer for the labels
	var labelCol = document.createElement("td");
	labelCol.addClassName("column");
	contentRow.appendChild(labelCol);
	var labelLayer = document.createElement("div");
	labelLayer.addClassName("labelContent");
	labelCol.appendChild(labelLayer);
	
	// Creates a layer for the information
	var contentCol = document.createElement("td");
	contentCol.addClassName("column");
	contentRow.appendChild(contentCol);
	var contentLayer = document.createElement("div");
	contentCol.appendChild(contentLayer);
	
	// Adds all labels
	var filterLabel = document.createElement("div");   
	labelLayer.appendChild(filterLabel);
	filterLabel.appendChild(document.createTextNode(gettext("Filter") + ":"));
	var paramLabelLayer = document.createElement("div");
	labelLayer.appendChild(paramLabelLayer);
	if (channel.getFilter()){
		var params = channel.getFilter().getParams();
		for (var p = 0; p < params.length; p++) {
			paramLabelLayer.appendChild(params[p].createHtmlLabel());
		}
	}
	var valueLabel = document.createElement("div");   
	labelLayer.appendChild(valueLabel);
	valueLabel.appendChild(document.createTextNode(gettext("Value") + ":"));
	
	// Adds the information
	var filterText = document.createElement("div");
	filterText.addClassName("filterValue");
	contentLayer.appendChild(filterText);
	if (channel.getFilter())
		filterText.appendChild(document.createTextNode(channel.getFilter().getLabel()));
	else
		filterText.appendChild(document.createTextNode(gettext("Empty")));     	
	var filterMenuButton = document.createElement("input");
	filterText.appendChild(filterMenuButton);
	filterMenuButton.setAttribute("type", "button");
	filterMenuButton.addClassName("filterMenuLauncher");
	Event.observe(filterMenuButton, 'click', 
		function(e){
			e.target.blur();
			Event.stop(e);
			LayoutManagerFactory.getInstance().showDropDownMenu(
				'filterMenu', this.channel.getMenu(), Event.pointerX(e), Event.pointerY(e));
		}.bind(context)
	);
	var paramValueLayer = document.createElement("div");
	contentLayer.appendChild(paramValueLayer);
		
	// Adds the channel value
	var valueText = document.createElement("div");   
	contentLayer.appendChild(valueText);
	if (channel.getFilter()){
		var params = channel.getFilter().getParams();
		for (var p = 0; p < params.length; p++) {
			paramValueLayer.appendChild(params[p].createHtmlValue(this, channel, valueText));
		}
	}
	valueText.appendChild(document.createTextNode(channel.getValue()));	
	
	channel.assignInterface(channelElement);
	this.channels.push(channel);
    channelNameInput.focus();
  }
  
  WiringInterface.prototype._addTab = function (tab) {
  	// TODO mirar esto
  	var tabEvents = new EventTabInterface(tab, this);
  	var tabSlots = new SlotTabInterface(tab, this);

    // Igadgets
    var igadgets = tab.dragboard.getIGadgets();
    for (var i = 0; i < igadgets.length; i++){
    	this._addIGadget(igadgets[i], tabEvents, tabSlots);
    }
    
    tabEvents.show();
  	tabSlots.show();

  }
  
  WiringInterface.prototype._addIGadget = function (igadget, tabEvents, tabSlots) {
    // TODO mirar esto
  	var igadgetEvents = new EventIgadgetInterface(igadget, this, tabEvents);
  	var igadgetSlots = new SlotIgadgetInterface(igadget, this, tabSlots);
  	
	//if the igadget has events, add it
	if (igadgetEvents.hasConnectables()){
	    tabEvents.addConnectables(igadgetEvents.getConnectables());
	    //fold the igadget if the user hasn't specify not doing it.
	    if(!this.unfold_on_entering)
		    igadgetEvents.forceToggle();
		else{
			igadgetEvents.openedByUser = true;
			igadgetEvents.parentInterface.igadgetsOpenedByUser++;		}
	}
	//if the igadget has slots, add it
	if (igadgetSlots.hasConnectables()){
	    tabSlots.addConnectables(igadgetSlots.getConnectables());
	    //fold the igadget if the user hasn't specify not doing it.
	    if(!this.unfold_on_entering)
		    igadgetSlots.forceToggle();
		else{
			igadgetSlots.openedByUser = true;
			igadgetSlots.parentInterface.igadgetsOpenedByUser++;
		}
	} 
    
  }

  WiringInterface.prototype.clearMessages = function () {
    this.msgsDiv.setStyle({display: null});
  }
   //expands or collapses all tabs & gadgets according to the expand parameter
   // Events 
  WiringInterface.prototype.toggleEventColumn = function (expand) {
  	var input = null;
  	var i=0;
  	for (i=0;i<this.inputs.length;i++){
  		input = this.inputs[i];
  		if(!(input.connectable instanceof wInOut) && !(input.connectable instanceof wTab)){ //we leave channels apart
  			if(expand){
  				input.parentInterface.massiveExpand();
  			}else{
  				input.parentInterface.massiveCollapse();
  			}
  		}
  	}
  	if(this.currentChannel){
  		this.highlightChannelInputs(this.currentChannel)
  	}
  }

  //Slots
  WiringInterface.prototype.toggleSlotColumn = function (expand) {
  	var output = null;
  	var i=0;
  	for (i=0;i<this.outputs.length;i++){
  		output = this.outputs[i];
  		if(!(output.connectable instanceof wInOut) && !(output.connectable instanceof wTab)){ //we leave channels apart
  			if(expand){
	  			output.parentInterface.massiveExpand();
  			}else{
  				output.parentInterface.massiveCollapse();  				
  			}
  		}
  	}
  	if(this.currentChannel){
  		this.highlightChannelOutputs(this.currentChannel)
  	}
  }

  WiringInterface.prototype.renewInterface = function () {
    // Clean the interface
    this.event_list.innerHTML = "";
    this.slot_list.innerHTML = "";
    this.channels_list.innerHTML = "";
    this.clearMessages();

    // Clean data structures
    this.friend_codes_counter = 0;
    this.friend_codes = {};
    this.inputs.clear();
    this.outputs.clear();
    this.currentChannel = null;
	var filterKeys = this.filterMenus.keys();
    for (var f = 0; f < filterKeys.length; f++) {
		this.filterMenus[filterKeys[f]].remove();
    }
	this.filterMenus = new Hash();
    
    // Build the interface
    var tabs = this.workspace.tabInstances.keys();
    for (var i = 0; i < tabs.length; i++) {
    	this._addTab(this.workspace.tabInstances[tabs[i]]);
    }
	
//	this.chEventsWr = new EventChannelWInterface (this);
//	this.chSlotsWr = new SlotChannelWInterface (this);    
	var channels = this.wiring.getChannels();
    for (var j = 0; j < channels.length; j++) {
		var chInterface = new ChannelInterface(channels[j]);
		this._addChannelInterface(chInterface);
		
//		var chEvents = new EventChannelInterface(chInterface, this, this.chEventsWr);
//  		var chSlots = new SlotChannelInterface(chInterface, this, this.chSlotsWr);
//  	
//	    this.chEventsWr.addConnectables(chEvents.getConnectables());
//		this.chSlotsWr.addConnectables(chSlots.getConnectables());
		//this.chEventsWr.forceToggle();  REMOVE
		//this.chSlotsWr.forceToggle();   REMOVE
	}		
    
//	if (channels.length > 0){
//		this.chEventsWr.show();
//		this.chSlotsWr.show();
//	}
    
  }

  WiringInterface.prototype.showMessage = function (msg) { 
  	this.msgsDiv.innerHTML = msg;
  	this.msgsDiv.setStyle({display: "block"});
  }
  
  
  WiringInterface.prototype._changeConnectionStatus = function (anchor) {
 	if (this.currentChannel == null) {
		if (this.channels.length == 0) {
        	this.showMessage(gettext("Please, create a new channel before creating connections."));
      	} else {
        	this.showMessage(gettext("Please, select a channel before creating connections."));
      	}
	  	return;
    }

    var connectable = anchor.getConnectable();

    // add/remove the connection
    
	// WARNING: a wInOut connectable is a wIn too!
	if (connectable instanceof wInOut){
		if (anchor.isChannelIn()){
			if (anchor.isConnected()) {
        		this.currentChannel.disconnectInput(connectable);
        		anchor.setConnectionStatus(false, null, null);
      		} else {
        		this.currentChannel.connectInput(connectable);
        		anchor.setConnectionStatus(true, this.currentChannel.inPosition, null);
      		}
		} else {
			if (anchor.isConnected()) {
       			this.currentChannel.disconnectOutput(connectable);
        		anchor.setConnectionStatus(false, null, null);
      		} else {
        		this.currentChannel.connectOutput(connectable);
        		anchor.setConnectionStatus(true, null, this.currentChannel.outPosition);
      		}
		}
	} else if (connectable instanceof wIn) {
		if (anchor.isConnected()) {
        	this.currentChannel.disconnectInput(connectable);
        	anchor.setConnectionStatus(false, null, null);
      	} else {
        	this.currentChannel.connectInput(connectable);
        	anchor.setConnectionStatus(true, this.currentChannel.inPosition, null);
      	}
    } else if (connectable instanceof wOut) {
      	if (anchor.isConnected()) {
        	this.currentChannel.disconnectOutput(connectable);
        	anchor.setConnectionStatus(false, null, null);
      	} else {
        	this.currentChannel.connectOutput(connectable);
        	anchor.setConnectionStatus(true, null, this.currentChannel.outPosition);
      	}
    }
  }

	WiringInterface.prototype.channelExists = function(channelName){
		if(this.channels.getElementByName(channelName))
			return true;
		return false;
	}

  WiringInterface.prototype._createChannel = function () {
    var result = null;
    var channelName = this.channel_name.value;

    if (channelName == "") {
      // Build an initial channel name
      var auxName=this.channels.length+1;
      channelName = this.channelBaseName + "_" + (auxName);
    }

    // Check if there is another channel with the same name
    while (this.channelExists(channelName)) {
      // Build another channel name
      channelName = this.channelBaseName + "_" + auxName;
      auxName++;
    }

    // Creates the channel interface
	var channel = new ChannelInterface(channelName);
    this._addChannelInterface(channel);
	
	// Creates a temporary channel for the Wiring module. It is necessary to connect channels with theyselves.
	var channelTempObject = wiring.createChannel(channel.getName(), channel.getId());
	channel.setTempChannel(channelTempObject);
	
	// Creates the filter menu
	var newFilterMenu = this._createFilterMenu(channel); 
	this.filterMenus[channel.getId()] = newFilterMenu;
	channel.setMenu(newFilterMenu);
	
//	this.chEventsWr.forceToggle();
//	this.chSlotsWr.forceToggle();
//	    
//	// Creates the interface of the channel slots and events 
//	var chEvents = new EventChannelInterface(channelTempObject, this, this.chEventsWr);
//  	var chSlots = new SlotChannelInterface(channelTempObject, this, this.chSlotsWr);
//  	
//	this.chEventsWr.addConnectables(chEvents.getConnectables());
//	this.chSlotsWr.addConnectables(chSlots.getConnectables());
//	
//	if (this.wiring.getChannels().length == 1){
//		this.chEventsWr.show();
//		this.chSlotsWr.show()
//	} else{
//		this.chEventsWr.forceToggle();
//		this.chSlotsWr.forceToggle();
//	}
	
	this.clearMessages();
    this._changeChannel(channel);
  }

  WiringInterface.prototype._removeChannel = function (channel) {

    if (!this.channels.elementExists(channel))
      return; // Nothing to do

	// Check whether this channel exists in the current wiring model
    // or when it was created with the wiring interface and removed
    // before commiting changes
	if (channel.exists() && !channel.isUnsaved()){
		this.wiring.removeChannel (channel.getId());
	
	// The channel might have been created and deleted without saving  
	// the wiring information (i.e. the user does not change between interfaces).
	// In this case, the wiring core has information about the channel that 
	// must be removed
	}else if (channel.isUnsaved()){
		this.wiring.removeChannel (channel.getId(), true);
	}

    if (this.currentChannel == channel){
      this._changeChannel(channel);
	  this.channels_list.removeChild(channel.getInterface());
    }else{
      this.channels_list.removeChild(channel.getInterface());
      if(this.currentChannel){
		  //repaint status because the channel position may have changed
		  this.uncheckChannel(this.currentChannel);
    	  this.highlightChannel(this.currentChannel);
      }
	}
	
	// Removes the filter menu
	var oldFilterMenu = this.filterMenus.remove(channel.getPreviousId());
	if (oldFilterMenu != null){
		oldFilterMenu.remove();
	}
	oldFilterMenu = this.filterMenus.remove(channel.getId());
	if (oldFilterMenu != null){
		oldFilterMenu.remove();
	}
	this.channels.remove(channel);
  }

  WiringInterface.prototype._changeChannel = function(newChannel) {
    var oldChannel = this.currentChannel;
    this.currentChannel = newChannel;

    if (oldChannel) {
      this.uncheckChannel(oldChannel);
    }
    this.clearMessages();
    if (oldChannel != newChannel) {
      this.highlightChannel(newChannel);
    } else {
      this.currentChannel = null;
    }
  }

  WiringInterface.prototype._highlight = function (chk, friendCode) {
    if (!this.friend_codes[friend_code]) {
    }

    var fcList = this.friend_codes[friendCode].list;
    var fcColor = this.friend_codes[friend_code].color;

    if (chk.checked) {
      for (var i = 0; i < fcList.length; i++) {
        var currentElement = fcList[i];
        currentElement.style.backgroundColor = fcColor;
      }
    } else {
      var allUnchecked = true;
      for (var i = 0; i < fcList.length; i++) {
        var currentElement = fcList[i];
        allUnchecked &= !currentElement.checked;
      }

      if (allUnchecked) {
         for (var i = 0; i < fcList.length; i++) {
           var currentElement = fcList[i];
           currentElement.style.backgroundColor = null;
         }
      }
    }
  }

  WiringInterface.prototype._highlight_friend_code = function (friend_code, highlight) {

    if (!this.friend_codes[friend_code]) {
      // Error
      return;
    }

    var fcList = this.friend_codes[friend_code].list;
    var fcColor = this.friend_codes[friend_code].color;
    var fcBgColor = "";

    for (var i = 0; i < fcList.length; i++) {
      if (fcElement = fcList[i]) {
        if (highlight) {
          fcElement.style.backgroundColor = fcColor;
        } else {
          fcElement.style.backgroundColor = fcBgColor;
        }
      }
    }
  }

  /*Uncheck channel*/
  
  WiringInterface.prototype.uncheckChannelInputs = function (channel){
  	var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(false, null, null);
    }
  }
  
  WiringInterface.prototype.uncheckChannelOutputs = function (channel){
  	var connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(false, null, null);
    }
  }

  WiringInterface.prototype.uncheckChannel = function (channel) {
    channel.uncheck();
    
   //fold all the tabs related to the channel
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	
  		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyUnfolded()){
			connectables[i].view.parentInterface.toggle(); 	//if the interface is unfolded fold it
    	}
    }  	 
    
    connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
   		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyUnfolded()){	//if the interface is unfolded unfold it
				connectables[i].view.parentInterface.toggle();
    	}
    }  	 
   
	this.uncheckChannelInputs(channel);
	this.uncheckChannelOutputs(channel);
 
  }

  /*Highlight channel*/  

  WiringInterface.prototype.highlightChannelInputs = function (channel){
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(true, channel.inPosition, null);
   	}	
  }

  WiringInterface.prototype.highlightChannelOutputs = function (channel){
	var connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
    	connectables[i].view.setConnectionStatus(true, null, channel.outPosition);
    }	
  	
  }

  WiringInterface.prototype.highlightChannel = function (channel) {
    //unfold all the tabs related to the channel so that the arrows are displayed in the correct position
    var connectables = channel.getInputs();
    for (var i = 0; i < connectables.length; i++){
		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyFolded()){	//if the interface is folded unfold it
				connectables[i].view.parentInterface.toggle();
    	}
    }  	 
    connectables = channel.getOutputs();
    for (var i = 0; i < connectables.length; i++){
   		if(connectables[i].view.parentInterface && connectables[i].view.parentInterface.isAnyFolded()){	//if the interface is folded unfold it
				connectables[i].view.parentInterface.toggle();
		}
    }  	 

    channel.check(); //highlight the channel
    
    //mark the connections with the channel
	this.highlightChannelInputs(channel);
	this.highlightChannelOutputs(channel);
  }

    // ***********************************
    //  COLOR SCHEME FOR HIGHLIGHTS
    //  More colors in color_scheme.js file but now it's not used!
    //  Too many colors at that file, it's has been optimized!
    // ***********************************

    this.color_scheme = [];

    this.color_scheme.push("#ffb0a1");

    this.color_scheme.push("#a6ffbf");
    this.color_scheme.push("#7a5e85");
    this.color_scheme.push("#b3f0ff");
    this.color_scheme.push("#cf36ff");
    this.color_scheme.push("#5496ff");
    this.color_scheme.push("#e854ff");

    this.color_scheme.push("#662500");
    this.color_scheme.push("#5a9e68");
    this.color_scheme.push("#bf6900");
    this.color_scheme.push("#a17800");
    this.color_scheme.push("#72cc85");
    this.color_scheme.push("#e6ff42");

    this.color_scheme.push("#becfbc");
    this.color_scheme.push("#005710");
    this.color_scheme.push("#00193f");
    this.color_scheme.push("#e0fffa");
    this.color_scheme.push("#f0ff3d");
    this.color_scheme.push("#f0d8d3");

    this.color_scheme.push("#ab5c00");
    this.color_scheme.push("#3c008f");
    this.color_scheme.push("#d6ff8a");
    this.color_scheme.push("#fac0e1");
    this.color_scheme.push("#4700ad");
    this.color_scheme.push("#ccc6ad");

    this.color_scheme.push("#261e06");
    this.color_scheme.push("#4fedff");
    this.color_scheme.push("#e6bebc");
    this.color_scheme.push("#f0ed73");
    this.color_scheme.push("#4f1800");
    this.color_scheme.push("#020073");

    this.color_scheme.push("#0fff00");
    this.color_scheme.push("#686b00");
    this.color_scheme.push("#804dff");
    this.color_scheme.push("#b100bd");
    this.color_scheme.push("#69ffab");
    this.color_scheme.push("#e6acb8");

    this.color_scheme.push("#8c7a77");
    this.color_scheme.push("#006bfa");
    this.color_scheme.push("#8cffab");
    this.color_scheme.push("#d1d190");
    this.color_scheme.push("#0d4000");
    this.color_scheme.push("#f0e8c4");

    this.color_scheme.push("#0048e8");
    this.color_scheme.push("#b8ffe0");
    this.color_scheme.push("#5effe0");
    this.color_scheme.push("#770000");
    this.color_scheme.push("#913dff");
    this.color_scheme.push("#5357cf");

}

/**********
 *
 **********/
function ConnectionAnchor(connectable, anchorDiv, parentInterface) {
  this.connectable = connectable;
  this.connected = false;
  this.htmlElement = anchorDiv;
  this.parentInterface = parentInterface;
  this.jg_doc=null;
  this.canvas = null;
  this.arrow = null;
  this.channelType = null;
  
  this.connectable.setInterface(this);

	ConnectionAnchor.prototype.getConnectable = function() {
	  return this.connectable;
	}
	
	ConnectionAnchor.prototype.getParentInterface = function() {
	  return this.parentInterface;
	}
	
	ConnectionAnchor.prototype.assignInterface = function(interface_) {
	  this._interface = interface_;
	}
	
	ConnectionAnchor.prototype.getInterface = function() {
	  return this._interface;
	}
	
	ConnectionAnchor.prototype.isChannelIn = function() {
		return this.connectable instanceof wInOut && this.channelType == 'IN';
	}
	
	ConnectionAnchor.prototype.setAsChannelIn = function() {
		if (this.connectable instanceof wInOut){}
	  		this.channelType = 'IN';
	}
	
	ConnectionAnchor.prototype.setAsChannelOut = function() {
	  if (this.connectable instanceof wInOut){}
	  		this.channelType = 'OUT';
	}
	
	ConnectionAnchor.prototype.drawArrow = function(inChannelPos, outChannelPos){
		if(this.jg_doc){
			this.jg_doc.clear();
			this.arrow.update();
			//decrement number of connections in the parent
			if(this.parentInterface && this.parentInterface.connections > 0)
				this.parentInterface.decreaseConnections();
		}
		var coordinates = Position.cumulativeOffset(this.htmlElement);
		var wiringPosition = Position.cumulativeOffset($('wiring'));
		coordinates[0] = coordinates[0] - wiringPosition[0] - 1; //-1px of img border
		coordinates[1] = coordinates[1] - wiringPosition[1] +(this.htmlElement.getHeight())/2 + 2;  
		// WARNING: a wInOut connectable is a wIn too!
		if (this.connectable instanceof wInOut){
			if (this.channelType == 'IN'){
				coordinates[0] = coordinates[0] + this.htmlElement.getWidth();
				this.drawPolyLine(coordinates[0],coordinates[1], inChannelPos[0], inChannelPos[1], true);
			}else{
				this.drawPolyLine(outChannelPos[0], outChannelPos[1],coordinates[0],coordinates[1], false);
			}
		} else if (this.connectable instanceof wIn){
			coordinates[0] = coordinates[0] + this.htmlElement.getWidth();
			this.drawPolyLine(coordinates[0],coordinates[1], inChannelPos[0], inChannelPos[1], true);
	  	}else {
	  		this.drawPolyLine(outChannelPos[0], outChannelPos[1],coordinates[0],coordinates[1], false);
	  	}
	  	
	}
	
	ConnectionAnchor.prototype.drawPolyLine = function(x1,y1,x2,y2,left)
	{
		if(!this.canvas){
			this.canvas= document.createElement('div');
			this.canvas.addClassName('canvas');
			$('wiring').appendChild(this.canvas);
			this.jg_doc = new jsGraphics(this.canvas); // draw directly into document		
		}
		var xList= new Array(x1, (x1+x2)/2, (x1+x2)/2, x2 );
		var yList= new Array(y1, y1, y2, y2);
		this.jg_doc.setColor("#2D6F9C");
		this.jg_doc.setStroke(2);  
		this.jg_doc.drawPolyline(xList, yList);
		if(!this.arrow){
			this.arrow = document.createElement('div');
			this.arrow.addClassName('arrow');
			this.arrow.style.display= 'none';
			this.canvas.appendChild(this.arrow);
		}
		this.arrow.style.top = Math.round(y2 - this.arrow.getHeight()/2)+1 +"px";
		this.arrow.style.left = ((x2 - this.arrow.getWidth())+2) +"px";
		this.arrow.style.display = 'block';
	
		this.jg_doc.paint();
		//increment number of connections in the parent
		if(this.parentInterface){
			this.parentInterface.increaseConnections();
		}
	}
	
	ConnectionAnchor.prototype.clearPolyLine = function()
	{
		if(this.jg_doc){
			this.jg_doc.clear();
			$('wiring').removeChild(this.canvas);
			this.canvas = null;
			this.arrow = null;
			delete this.jg_doc;
			//decrement number of connections in the parent
			if(this.parentInterface && this.parentInterface.connections > 0)
				this.parentInterface.decreaseConnections();
		}
	}
	
	ConnectionAnchor.prototype.setConnectionStatus = function(newStatus, inChannelPos, outChannelPos) {
	  this.connected = newStatus;
	  
	  if (newStatus){
		this.htmlElement.className="chkItem";
		//draw the arrow
		this.drawArrow(inChannelPos, outChannelPos);
	  }else{
		this.htmlElement.className="unchkItem";
		//clear the arrow
		this.clearPolyLine();

	  }
	}
	
	ConnectionAnchor.prototype.isConnected = function() {
	  return this.connected;
	}
}

/**********
 *
 **********/

function ChannelInterface(channel) {
  if (channel instanceof wChannel) {
    // Existant channel
    this.channel = channel;
    this.name = channel.getName();
    this.inputs = channel.inputs.clone();
    this.outputs = channel.outputs.clone();
	this.filter = channel.getFilter();
	this.filterParams = channel.getFilterParams();
  } else {
    // New channel
    this.channel = null;
    this.name = channel;
    this.inputs = new Array();
    this.outputs = new Array();
    this.provisional_id = new Date().getTime();
	this.filter = null;
	this.filterParams = new Array();
  }

  this.inputsForAdding = new Array();
  this.inputsForRemoving = new Array();
  this.outputsForAdding = new Array();
  this.outputsForRemoving = new Array();
  this.inPosition = new Array();		//coordinates of the point where the channel input arrow ends
  this.outPosition = new Array();		//coordinates of the point where the channel output arrow starts
  this.tempChannel = null;              //It's created by Wiring Core. Nec        
  this.menu = null;

  // Draw the interface
}

ChannelInterface.prototype.setName = function(newName) {
  this.name = newName;
  //if it has an associated channel in the wiring model, change its name too.
  if(this.channel){
  	this.channel._name=newName;
  }
}

ChannelInterface.prototype.getPreviousId = function(newName) {
  if (this.channel && this.channel.previous_id)
  	return this.channel.previous_id;
  else
  	return null;
}

ChannelInterface.prototype.getId = function(newName) {
  if (this.provisional_id){
  	return this.provisional_id;
  }
  return this.channel.getId();
}

ChannelInterface.prototype.isUnsaved = function() {
	return (this.channel && this.provisional_id);
}

ChannelInterface.prototype.getInputs = function() {
  return this.inputs;
}

ChannelInterface.prototype.getOutputs = function() {
  return this.outputs;
}

ChannelInterface.prototype.getName = function() {
  return this.name;
}

ChannelInterface.prototype.getFilter = function() {
  return this.filter;
}

ChannelInterface.prototype.setFilter = function(filter_) {
  this.filter = filter_;
  this.filterParams = new Array ();
  
  // Sets parameter values by default
  if (filter_ != null){
  	var paramDefinition = filter_.getParams();
	this.filterParams = new Array (paramDefinition.length);  
  	for (var p = 0; p < paramDefinition.length; p++) {
	  	var defaultaValue = paramDefinition[p].getDefaultValue(); 
		if((defaultaValue == null) || (defaultaValue == "") || defaultaValue.match(/^\s$/)){
			this.filterParams[p] = "";
		}else{
			this.filterParams[p] = defaultaValue;
		}
  	}
  }
}

ChannelInterface.prototype.getFilterParams = function() {
  return this.filterParams;
}


ChannelInterface.prototype.setFilterParams = function(params_) {
  this.filterParams = params_;
}

ChannelInterface.prototype.setTempChannel = function(channel_) {
  this.channel = channel_;
}

ChannelInterface.prototype.getValue = function() {
  if (this.channel) {
    return this.channel.getValue();
  } else {
    return gettext("undefined"); // TODO
  }
}

ChannelInterface.prototype.getValueWithoutFilter = function() {
  if (this.channel) {
    return this.channel.getValueWithoutFilter();
  } else {
    return gettext("undefined"); // TODO
  }
}

ChannelInterface.prototype.setMenu = function(menu_) {
	this.menu = menu_;	
}

ChannelInterface.prototype.getMenu = function() {
	return this.menu;	
}

ChannelInterface.prototype.commitChanges = function(wiring) {
  var i;

  if (this.tempChannel != null){
  	this.channel = this.tempChannel;
  }
  
  if (this.channel == null){
   	// The channel don't exists
   	this.channel = wiring.getOrCreateChannel(this.name, this.provisional_id);
  }
  
  // Filter and params for adding
  this.channel.setFilter(this.filter);
  this.channel.setFilterParams(this.filterParams);

  // Inputs for removing
  for (i = 0; i < this.inputsForRemoving.length; i++) {
    this.inputsForRemoving[i].disconnect(this.channel);
  }
  this.inputsForRemoving.clear();

  // Outputs for removing
  for (i = 0; i < this.outputsForRemoving.length; i++) {
    this.channel.disconnect(this.outputsForRemoving[i]);
  }
  this.outputsForRemoving.clear();

  // Outputs for adding
  for (i = 0; i < this.outputsForAdding.length; i++) {
    this.channel.connect(this.outputsForAdding[i]);
  }
  this.outputsForAdding.clear();

  // Inputs for adding
  for (i = 0; i < this.inputsForAdding.length; i++) {
    this.inputsForAdding[i].connect(this.channel);
  }
  this.inputsForAdding.clear();
}

ChannelInterface.prototype.exists = function() {
  return this.channel != null;
}

ChannelInterface.prototype.check = function() {
  this._interface.addClassName("selected");
  this._interface.getElementsByClassName('channelNameInput')[0].focus();
  //calculate the position where de in arrows will end and the out ones will start
  this.inPosition = Position.cumulativeOffset(this._interface);
  var wiringPosition = Position.cumulativeOffset($('wiring'));
  this.inPosition[0] = this.inPosition[0] - wiringPosition[0] - 1; //border 
  this.inPosition[1] = this.inPosition[1] - wiringPosition[1] - 1 + (this._interface.getHeight())/2;
  this.outPosition[1] = this.inPosition[1];
  this.outPosition[0] = this.inPosition[0]+this._interface.getWidth();
}

ChannelInterface.prototype.uncheck = function() {
  this._interface.removeClassName("selected");
  this._interface.getElementsByClassName('channelNameInput')[0].blur();
}

ChannelInterface.prototype.assignInterface = function(interface_) {
  this._interface = interface_;
}

ChannelInterface.prototype.getInterface = function() {
  return this._interface;
}

ChannelInterface.prototype.connectInput = function(wIn) {
  if (this.channel != null &&
      this.channel.inputs.elementExists(wIn)) {
    	this.inputsForRemoving.remove(wIn);
  } else {
    this.inputsForAdding.push(wIn);
  }
  this.inputs.push(wIn);
}

ChannelInterface.prototype.disconnectInput = function(wIn) {
  if (this.channel != null &&
      this.channel.inputs.elementExists(wIn)) {
	    this.inputsForRemoving.push(wIn);
  } else {
   		this.inputsForAdding.remove(wIn);
  }
  this.inputs.remove(wIn);
}

ChannelInterface.prototype.connectOutput = function(connectable) {
  if (this.channel != null &&
      this.channel.outputs.elementExists(connectable)) {
	    this.outputsForRemoving.remove(connectable);
  } else {
	    this.outputsForAdding.push(connectable);
  }
  this.outputs.push(connectable);
}

ChannelInterface.prototype.disconnectOutput = function(connectable) {
  if (this.channel != null &&
      this.channel.outputs.elementExists(connectable)) {
	    this.outputsForRemoving.push(connectable);
  } else {
    	this.outputsForAdding.remove(connectable);
  }
  this.outputs.remove(connectable);
}
/////////////////////////////////////////////////
//     WRAPPER INTERFACE FOR CONNECTABLES      //
/////////////////////////////////////////////////
function ConnectableWrapperInterface (wiringGUI_, headerText_) {
  	
	//atributes
  	this.wiringGUI = wiringGUI_;
  	this.folded = false;
  	this.connections = 0;
  	this.openedByUser = false;
  	
	this.tabDiv = document.createElement("div");
    this.tabDiv.addClassName("tab");
    this.igadgetsOpenedByUser = 0;
    
	// Content
	this.htmlElement = document.createElement("div");
    this.htmlElement.addClassName("tabContent");
	this.htmlElement.addClassName("bckgrnd_folder");   
	this.htmlElement.appendChild(document.createTextNode(headerText_));
    
    //folding event
    Event.observe(this.htmlElement, "click", 
		function(e){
    		if(this.connections<=0){
    			this.toggleOpenedByUser();
    			this.forceToggle();
    			if(this.wiringGUI.currentChannel)
	   				this.wiringGUI.highlightChannelOutputs(this.wiringGUI.currentChannel);
			}
		}.bind(this)
	);
    this.tabDiv.appendChild(this.htmlElement);
}
	
// PARENT CONTRUCTOR (Super class emulation)
ConnectableWrapperInterface.prototype.ConnectableWrapperInterface = function(wiringGUI_, headerText_) {
	//atributes
  	this.wiringGUI = wiringGUI_;
  	this.folded = false;
  	this.connections = 0;
  	this.openedByUser = false;
  	
  	this.tabDiv = document.createElement("div");
    this.tabDiv.addClassName("tab");
    this.igadgetsOpenedByUser = 0;
   
    // Content
    this.htmlElement = document.createElement("div");
    this.htmlElement.addClassName("tabContent");
	this.htmlElement.addClassName("bckgrnd_folder");  
	this.htmlElement.appendChild(document.createTextNode(headerText_)); 
    
    //folding event
    Event.observe(this.htmlElement, "click", 
		function(e){
    		if(this.connections<=0){
    			this.toggleOpenedByUser();
    			this.forceToggle();
    			if(this.wiringGUI.currentChannel)
	    			this.wiringGUI.highlightChannelOutputs(this.wiringGUI.currentChannel);
				}
			}.bind(this)
		);
    this.tabDiv.appendChild(this.htmlElement);
}
	
ConnectableWrapperInterface.prototype.increaseConnections = function(){
	this.connections++;
}
	
ConnectableWrapperInterface.prototype.decreaseConnections = function(){
	this.connections--;
}
	
ConnectableWrapperInterface.prototype.addConnectables = function(connectables){
	this.tabDiv.appendChild(connectables);
}

//ConnectableWrapperInterface.prototype.setHeaderText = function(text_){
	//this.htmlElement.appendChild(document.createTextNode(text_));
//}
	
ConnectableWrapperInterface.prototype.setConnectable = function(connectable_){
	//create a ckeck item and an anchor for relating a tab to a channel output
	var chkItem = document.createElement("div");
	chkItem.addClassName("unchkItem");
	this.htmlElement.appendChild(chkItem);
		
	var chkItemAnchor = new ConnectionAnchor(connectable_, chkItem, this);
	var context = {chkItemAnchor: chkItemAnchor, slotInterface:this};
	Event.observe(chkItem, "click",
		function (e) {
			if(!this.slotInterface.folded){
				Event.stop(e);
	        }else{
	           	this.slotInterface.toggle();
    			if(this.slotInterface.wiringGUI.currentChannel)
	    			this.slotInterface.wiringGUI.highlightChannelOutputs(this.slotInterface.wiringGUI.currentChannel);
	    	}
	   		this.slotInterface.wiringGUI._changeConnectionStatus(this.chkItemAnchor);
		}.bind(context), false);
    this.wiringGUI.outputs.push(chkItemAnchor);
}		
	
ConnectableWrapperInterface.prototype.toggleOpenedByUser = function(){
	if(this.folded ||(!this.folded && this.openedByUser)){
		this.openedByUser = !this.openedByUser;
	}
}
    
//toggle ordered automatically, for instance, changing channels
ConnectableWrapperInterface.prototype.toggle = function () {
	//if the user hasn't touch the tab, it can automatically toggle
	if(this.folded || (!this.folded && !this.openedByUser && this.igadgetsOpenedByUser <= 0)){
		this.forceToggle();
	}
}

ConnectableWrapperInterface.prototype.forceToggle = function () {
	//forced toggle
	this.folded = !this.folded;
	var igadgets = this.tabDiv.getElementsByClassName("igadget");
	var i=0;
	for(i=0;i<igadgets.length;i++){
		igadgets[i].toggleClassName("folded");
	}
}

ConnectableWrapperInterface.prototype.isAnyFolded = function () {
	return this.folded;		
}
	
ConnectableWrapperInterface.prototype.isAnyUnfolded = function () {
	return !this.folded;		
}	


/////////////////////////////////////////////////
// 	  SLOT AND EVENT INTERFACE FOR THE TAB     //
/////////////////////////////////////////////////


// Slot interface for the tab (with connectable)
/////////////////////////////////////////////////
function SlotTabInterface (tab, wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, tab.tabInfo.name);
	
	//this.setHeaderText ();
	this.setConnectable (tab.connectable);
}
SlotTabInterface.prototype = new ConnectableWrapperInterface;

SlotTabInterface.prototype.show = function () {
	this.wiringGUI.slot_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}
 	//fold the tab if the user hasn't specify not doing it.
    if(!this.wiringGUI.unfold_on_entering)
		this.forceToggle();

}

// Event interface for the tab (without connectable)
////////////////////////////////////////////////////
function EventTabInterface (tab, wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, tab.tabInfo.name);
	
	//this.setHeaderText (tab.tabInfo.name);
}
EventTabInterface.prototype = new ConnectableWrapperInterface;

EventTabInterface.prototype.show = function (){
	if (this.tabDiv.childNodes.length > 1){ //Elements with gadgets
  		this.wiringGUI.event_list.appendChild(this.tabDiv);  		
    }else{
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
    }
    //fold the tab if the user hasn't specify not doing it.
    if(!this.wiringGUI.unfold_on_entering)
	  	this.forceToggle();
}

////////////////////////////////////////////////////////////
//   SLOT AND EVENT INTERFACE FOR THE CHANNEL (WRAPPER)   //
////////////////////////////////////////////////////////////

// Slot interface for the channel wrapper (without connectable)
function SlotChannelWInterface (wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, "Channels");
}
SlotChannelWInterface.prototype = new ConnectableWrapperInterface;

SlotChannelWInterface.prototype.show = function () {
	this.wiringGUI.slot_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}
 	
	this.forceToggle();
}

// Event interface for the channel wrapper (without connectable)
function EventChannelWInterface (wiringGUI) {
	ConnectableWrapperInterface.prototype.ConnectableWrapperInterface.call(this, wiringGUI, gettext("Channels"));
}
EventChannelWInterface.prototype = new ConnectableWrapperInterface;

EventChannelWInterface.prototype.show = function (){
	this.wiringGUI.event_list.appendChild(this.tabDiv);
   	if (this.tabDiv.childNodes.length == 1){ //Elements withouth gadgets
    	this.tabDiv.getElementsByClassName("tabContent")[0].removeClassName("bckgrnd_folder");
   	}

	this.forceToggle();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
//     CONNECTABLE INTERFACE (GENERIC SLOT AND EVENT)	  //
////////////////////////////////////////////////////////////
function ConnectableInterface (wiringGUI, parentInterface, headerText) {
  	
	//CREATOR
  	//atributes
  	this.wiringGUI = wiringGUI;
  	this.folded = false;
  	this.igadgetDiv = null;
	this.headerText = headerText;
  	this.connections = 0;
  	this.parentInterface = parentInterface;
  	this.openedByUser = false;		//is the igadget open and has the user done it??
  	
  	this.ulConnectables = document.createElement("div");
    this.ulConnectables.addClassName("igadgetContent");
  	
	
	// PARENT CONTRUCTOR (Super class emulation)
	ConnectableInterface.prototype.ConnectableInterface = function (wiringGUI, parentInterface, headerText) {
	  	//atributes
  		this.wiringGUI = wiringGUI;
  		this.folded = false;
  		this.igadgetDiv = null;
		this.headerText = headerText;
  		this.connections = 0;
  		this.parentInterface = parentInterface;
  		this.openedByUser = false;		//is the igadget open and has the user done it??
  	
  		this.ulConnectables = document.createElement("div");
    	this.ulConnectables.addClassName("igadgetContent");

	}
	
	ConnectableInterface.prototype.increaseConnections = function(){
		this.connections++;
		this.parentInterface.increaseConnections();
	}
	
	ConnectableInterface.prototype.decreaseConnections = function(){
		this.connections--;
		this.parentInterface.decreaseConnections();
	}

 	ConnectableInterface.prototype.toggleOpenedByUser = function(){
 		if(this.folded || (!this.folded && this.openedByUser)){
			this.openedByUser = !this.openedByUser;
			if(this.openedByUser)
				this.parentInterface.igadgetsOpenedByUser++;
			else
				this.parentInterface.igadgetsOpenedByUser--;
 		}
 	}
	
	ConnectableInterface.prototype.hasConnectables = function () {
		return this.igadgetDiv != null; 	
	}
	
	ConnectableInterface.prototype.getConnectables = function (){
		return this.igadgetDiv;
	}

	ConnectableInterface.prototype.setConnectables = function (connectables){
		// Slots
    	for (var i = 0; i < connectables.length; i++) {
	    	var connectable = connectables[i];
	    	if (((connectable instanceof wOut)   && (this instanceof SlotIgadgetInterface))  || 
			    ((connectable instanceof wIn)    && (this instanceof EventIgadgetInterface)) ||
				((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))  ||
				((connectable instanceof wInOut) && (this instanceof EventChannelInterface))){
				var htmlElement = document.createElement("div");
				htmlElement.appendChild(document.createTextNode(connectable.getName()));
			
				var chkItem = document.createElement("div");
				chkItem.addClassName("unchkItem");
				htmlElement.appendChild(chkItem);
			
				var chkItemAnchor = new ConnectionAnchor(connectable, chkItem, this);
				if ((connectable instanceof wInOut) && (this instanceof EventChannelInterface))
					chkItemAnchor.setAsChannelIn();
				if ((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))
					chkItemAnchor.setAsChannelOut();
				
				var context = {chkItemAnchor: chkItemAnchor, wiringGUI:this.wiringGUI};			
				Event.observe(chkItem, "click",
			    	function () {
			        	this.wiringGUI._changeConnectionStatus(this.chkItemAnchor);
			        }.bind(context));
			
				// Harvest info about the friendCode of the connectable
				var friendCode = connectable.getFriendCode();
				if (friendCode != null) {
			    	if (!this.wiringGUI.friend_codes[friendCode]) {
			      		// Create the friend code entry in the list of friend codes
			      		this.wiringGUI.friend_codes[friendCode] = {};
			      		this.wiringGUI.friend_codes[friendCode].list = [];
			      		this.wiringGUI.friend_codes[friendCode].color = this.wiringGUI.color_scheme[this.wiringGUI.friend_codes_counter++];
				    }
			    	this.wiringGUI.friend_codes[friendCode].list.push(htmlElement);
				    var context = {friendCode: friendCode, wiringGUI:this.wiringGUI};
			
				    htmlElement.addEventListener("mouseover",
			    		function () {
							this.wiringGUI._highlight_friend_code(this.friendCode, true);
						}.bind(context), false);
			    	
					htmlElement.addEventListener("mouseout",
			        	function () {
							this.wiringGUI._highlight_friend_code(this.friendCode, false);
						}.bind(context), false);	      
				}
				
				// Cancel bubbling of forceToggle
				function cancelbubbling(e) {
					Event.stop(e);
				}
			
				htmlElement.addEventListener("click", cancelbubbling, false);
			      
				// Insert it on the correct list of connectables	
				this.ulConnectables.appendChild(htmlElement);
				if (((connectable instanceof wOut)   && (this instanceof SlotIgadgetInterface)) || 
				    ((connectable instanceof wInOut) && (this instanceof SlotChannelInterface))){
					
					this.wiringGUI.outputs.push(chkItemAnchor);	
				}
				if (((connectable instanceof wIn)    && (this instanceof EventIgadgetInterface)) || 
				    ((connectable instanceof wInOut) && (this instanceof EventChannelInterface))){
				
					this.wiringGUI.inputs.push(chkItemAnchor);
				}
	    	}	
    	}
		
		// Slot column
		if (this.ulConnectables.childNodes.length > 0) {
			this.igadgetDiv = document.createElement("div");
			this.igadgetDiv.addClassName("igadget");
			var headerHtml = document.createElement("div");
			headerHtml.addClassName("igadgetName");
			if (this.headerText != null)
				headerHtml.appendChild(document.createTextNode(this.headerText));
			  
			//folding event
			Event.observe(headerHtml, "click", 
				function(e){
					Event.stop(e);
					if (this.connections <= 0){
						this.toggleOpenedByUser();
						this.forceToggle();
						if (this.wiringGUI.currentChannel)
							this.repaintSiblings(this.wiringGUI.currentChannel) //repaint the needed arrows in case the layout has changed
					}
				}.bind(this));			  
				  
			
			this.igadgetDiv.appendChild(headerHtml);
			this.igadgetDiv.appendChild(this.ulConnectables);
		}
	}
	
	//toggle ordered automatically, for instance, changing channels
  	ConnectableInterface.prototype.toggle = function () {
  		//if the user hasn't touch the igadget, it can automatically toggle
  		if(!this.openedByUser){
  			this.forceToggle();
  		}
  		if(this.folded != this.parentInterface.folded){
	  			this.parentInterface.toggle();
  		}
  	} 
 	//forced toggle 
	ConnectableInterface.prototype.forceToggle = function () {
		this.folded = !this.folded;
		this.igadgetDiv.getElementsByClassName("igadgetContent")[0].toggleClassName("folded");
		this.igadgetDiv.getElementsByClassName("igadgetName")[0].toggleClassName("bckgrnd_folded");
	}
	
	ConnectableInterface.prototype.isAnyFolded = function () {
		return this.folded || this.parentInterface.folded;
	}
	
	ConnectableInterface.prototype.isAnyUnfolded = function () {
		return !this.folded || !this.parentInterface.folded;
	}
	
	//methods invoked when the user wants to expand/collapse all the slot tabs
	ConnectableInterface.prototype.massiveExpand = function () {
		if(this.folded){//the igadget is folded
			this.toggleOpenedByUser();
			this.forceToggle();
			if(this.folded != this.parentInterface.folded){//if the parent is folded
	  			this.parentInterface.toggle();
			}
		// if the gadget is open by the user but the parent is folded
		}else if(this.openedByUser && this.parentInterface.folded){
			this.parentInterface.toggle();
		}
		else if(!this.openedByUser){//the igadget is open because it is conected to an opened channel
			this.openedByUser = true;
			this.parentInterface.igadgetsOpenedByUser++;
			
		}
	}

	ConnectableInterface.prototype.massiveCollapse = function () {
		if(!this.folded && this.openedByUser){//the igadget is folded
			this.toggleOpenedByUser();
			if(this.connections<=0){//collapse only if the gadget don't have any connections
				this.forceToggle();
			}
		}
		if(this.folded != this.parentInterface.folded){//if the parent isn't folded
			if(this.parentInterface.connections<=0){
				this.parentInterface.toggleOpenedByUser();
				this.parentInterface.toggle();
			}
		}
	}	
}

////////////////////////////////////////////////////////////
//       SLOT AND EVENT INTERFACE FOR THE IGADGET         //
////////////////////////////////////////////////////////////

// Interface for the igadget slots (with connectable)
/////////////////////////////////////////////////////
function SlotIgadgetInterface (igadget, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, igadget.name);
	
	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	this.setConnectables (connectables);
	
	SlotIgadgetInterface.prototype.repaintSiblings = function(channel){
		this.wiringGUI.highlightChannelOutputs(channel);
	}
}

SlotIgadgetInterface.prototype = new ConnectableInterface;	
	
// Interface for the igadget events (with connectable)
//////////////////////////////////////////////////////	
function EventIgadgetInterface (igadget, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, igadget.name);
	
	var connectables = wiringGUI.wiring.getIGadgetConnectables(igadget);
	this.setConnectables (connectables);
	
	EventIgadgetInterface.prototype.repaintSiblings = function(channel){
		this.wiringGUI.highlightChannelInputs(channel);
	}
}
EventIgadgetInterface.prototype = new ConnectableInterface;	

////////////////////////////////////////////////////////////
//       SLOT AND EVENT INTERFACE FOR THE CHANNEL         //
////////////////////////////////////////////////////////////

// Interface for the channel slots (with connectable)
/////////////////////////////////////////////////////
function SlotChannelInterface (channel, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, null);
	
	this.setConnectables ([channel.channel]);
}
SlotChannelInterface.prototype = new ConnectableInterface;

// Interface for the channel events (with connectable)
//////////////////////////////////////////////////////	
function EventChannelInterface (channel, wiringGUI, parentInterface) {
  	ConnectableInterface.prototype.ConnectableInterface.call(this, wiringGUI, parentInterface, null);
	
	this.setConnectables ([channel.channel]);
}
EventChannelInterface.prototype = new ConnectableInterface;
	
	


function UIUtils()
{
	// *********************************
	//           STATIC CLASS
	// *********************************
}

UIUtils.tagmode = false;
UIUtils.repaintCatalogue=false;
UIUtils.sendingPendingTags = false;
UIUtils.selectedResource = null;
UIUtils.selectedVersion = null;
UIUtils.imageBottom = '';
UIUtils.imageContent = '';
UIUtils.imageConnectableBottom = '';
UIUtils.imageConnectableContent = '';
UIUtils.infoResourcesWidth = 400;
UIUtils.isInfoResourcesOpen = false;
UIUtils.page = 1;
UIUtils.off = 10;
UIUtils.orderby = '-creation_date';
UIUtils.num_items = 0;
UIUtils.search = false;
UIUtils.searchValue = [];
UIUtils.searchCriteria = '';
UIUtils.counter=0;
UIUtils.globalTags='all';

UIUtils.addResource = function(url, paramName, paramValue) {
	UIUtils.repaintCatalogue=true;
	UIUtils.search = false;
	
	var newResourceOnSuccess = function (response) {
		UIUtils.orderby = '-creation_date';
		UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), 1, UIUtils.getNum_items());
		LayoutManagerFactory.getInstance().hideCover();
	}
	
	var newResourceOnError = function (transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
			                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
					  true);
		} else if (transport.responseXML) {
			if (transport.responseXML.documentElement.textContent.match("duplicate key"))
			{
                        msg = gettext("The gadget is already added to the catalogue");
			} else {
                        msg = transport.responseXML.documentElement.textContent;
			}
		} else {
                        msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("The resource could not be added to the catalogue: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
		LayoutManagerFactory.getInstance().hideCover();
	}
	
	var persistenceEngine = PersistenceEngineFactory.getInstance();

	var params = new Hash();
	params[paramName] = paramValue;

	persistenceEngine.send_post(url, params, this, newResourceOnSuccess, newResourceOnError);
}

UIUtils.getSelectedResource = function() {
	return UIUtils.selectedResource;
}

UIUtils.selectResource = function(resourceId_) {
	var bottom = $(resourceId_ + '_bottom');
	var content = $(resourceId_ + '_content');
	if (!UIUtils.tagmode)
	{
	    UIUtils.imageBottom = bottom.style.backgroundImage;
	    UIUtils.imageContent = content.style.backgroundImage;
	}
	bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select.png)';
	content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select.png)';
    
}

UIUtils.deselectResource = function(resourceId_) {
	var bottom = $(resourceId_ + '_bottom');
	var content = $(resourceId_ + '_content');
	if (!UIUtils.tagmode)
	{
	    bottom.style.backgroundImage = UIUtils.imageBottom;
	    content.style.backgroundImage = UIUtils.imageContent;
	} else {
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom.gif)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill.gif)';
	}
}

UIUtils.selectConnectableResources = function(resourceId_) {
	UIUtils.deselectConnectableResources();
	UIUtils.selectResource(resourceId_);
	UIUtils.lightUpConnectableResources(UIUtils.selectedResource);
}

/* This method selects all the resources related by wiring in the catalogue*/
UIUtils.lightUpConnectableResources = function(resourceId_) {

	var resource = CatalogueFactory.getInstance().getResource(resourceId_);
	var slots = resource.getSlots();
	var events = resource.getEvents();
	var resources = CatalogueFactory.getInstance().getResources().values();
	var slots2;
	var events2;
	for (var i=0; i<resources.length; i++){
		slots2 = resources[i].getSlots();
		var lookup = {};
		for (var j=0; j<slots2.length; j++) {
			lookup[slots2[j]] = slots2[j];
		}
		for (var k =0; k<events.length; k++) {
			if (typeof lookup[events[k]] != 'undefined') {
				var bottom = $('resource_'+i + '_bottom');
				UIUtils.imageConnectableBottom = bottom.style.backgroundImage;
				bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select-slot.png)';
				var content = $('resource_'+i + '_content');
				UIUtils.imageConnectableContent = content.style.backgroundImage;
				content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select-slot.png)';
				break;
			}
		}
		events2 = resources[i].getEvents();
		var lookup = {};
		for (var j=0; j<events2.length; j++) {
			lookup[events2[j]] = events2[j];
		}
		for (var k =0; k<slots.length; k++) {
			if (typeof lookup[slots[k]] != 'undefined') {
				var bottom = $('resource_'+i + '_bottom');
				UIUtils.imageConnectableBottom = bottom.style.backgroundImage;
				bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select-event.png)';
				var content = $('resource_'+i + '_content');
				UIUtils.imageConnectableContent = content.style.backgroundImage;
				content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select-event.png)';
				break;
			}
		}
	}
}

UIUtils.deselectConnectableResources = function() {
	var resources = CatalogueFactory.getInstance().getResources().values();
	for (var i=0; i<resources.length; i++){
		var bottom = $('resource_'+i + '_bottom');
		bottom.style.backgroundImage = UIUtils.imageConnectableBottom;
		var content = $('resource_'+i + '_content');
		content.style.backgroundImage = UIUtils.imageConnectableContent;
	}
}
	
UIUtils.showResourceInfo = function(resourceId_) {
	UIUtils.selectedResource = resourceId_;
	CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showInfo();
}

UIUtils.updateGadgetXHTML = function() {
    var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);

    var dict = {vendor: resource.getVendor(), name: resource.getName(), version: resource.getVersion()};

    var resourceURI = URIs.GET_GADGET.evaluate(dict) + "/xhtml";

    var onError = function(transport) {
		var msg = interpolate(gettext("Error updating the XHTML: %(errorMsg)s."), {errorMsg: transport.status}, true);
		LogManagerFactory.getInstance().log(msg);
	// Process
    }

    var onSuccess = function(transport) {
		LayoutManagerFactory.getInstance().showMessageMenu(gettext('The gadget code has been successfully updated'));
    }

    PersistenceEngineFactory.getInstance().send_update(resourceURI, "", this, onSuccess, onError);

}

UIUtils.clearPreviousSearch = function() {
	UIUtils.search = false;
	UIUtils.searchValue = [];
	UIUtils.searchCriteria = '';
}

UIUtils.toggle_elements = function(elementIds_) {
	for (i=0;i<elementIds_.length ;i++ )
	{
		UIUtils.toggle(elementIds_[i]);
	}
}
	
UIUtils.toggle = function(elementId_) {
	var element = $(elementId_);
	if (element.style.display != 'none')
	{
		element.style.display = 'none';
	}
	else
	{
		element.style.display = 'block';
	}
}

UIUtils.show = function(elementId_) {
	var element = $(elementId_);
	element.style.display = 'inline';
}

UIUtils.hidde = function(elementId_) {
	var element = $(elementId_);
	element.style.display = 'none';
}

UIUtils.changeImage = function(elementId_, newImage_) {
	var element = $(elementId_);
	element.src = newImage_;
}

UIUtils.simpleSearch = function(url, criteria) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	if (criteria == 'simple_or')
	{
		UIUtils.searchValue[0] = $('simple_search_text').value;
	} else if (criteria == 'and')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_and').value;
	}
	else if (criteria == 'or')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_or').value;
	}
	else if (criteria == 'not')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_not').value;
	}
	else if (criteria == 'tag')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_tag').value;
	}
	else if (criteria == 'event')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_event').value;
	}
	else if (criteria == 'slot')
	{
		UIUtils.searchValue[0] = $('advanced_search_text_slot').value;
	}
	UIUtils.searchValue[0] = UIUtils.filterString(UIUtils.searchValue[0]);

	if (UIUtils.searchValue[0] == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}
	else{
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchCriteria = criteria;
		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + criteria + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}

UIUtils.globalSearch = function(url) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	UIUtils.searchValue[0] = UIUtils.filterString($('advanced_search_text_and').value);
	UIUtils.searchValue[1] = UIUtils.filterString($('advanced_search_text_or').value);
	UIUtils.searchValue[2] = UIUtils.filterString($('advanced_search_text_not').value);
	UIUtils.searchValue[3] = UIUtils.filterString($('advanced_search_text_tag').value);
	UIUtils.searchValue[4] = UIUtils.filterString($('advanced_search_text_event').value);
	UIUtils.searchValue[5] = UIUtils.filterString($('advanced_search_text_slot').value);

	if (UIUtils.searchValue[0] == "" && UIUtils.searchValue[1] == "" && UIUtils.searchValue[2] == "" && UIUtils.searchValue[3] == "" && UIUtils.searchValue[4] == "" && UIUtils.searchValue[5] == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}
	else{
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchCriteria = 'global';
		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}

UIUtils.clearSearchForm = function() {
	$('advanced_search_text_and').value = "";
	$('advanced_search_text_or').value = "";
	$('advanced_search_text_not').value = "";
	$('advanced_search_text_tag').value = "";
	$('advanced_search_text_event').value = "";
	$('advanced_search_text_slot').value = "";
}

UIUtils.searchByConnectivity = function(url, criteria, search_value) {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var name = resource.getName();
	var version = resource.getVersion();
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	$('header_always_error').style.display = 'none';
	UIUtils.setPage(1);
	UIUtils.search = true;
	UIUtils.searchValue[0] = search_value;
	UIUtils.searchCriteria = criteria;
	CatalogueFactory.getInstance().repaintCatalogue(url + "/" + criteria + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset(), name, version);
}

UIUtils.searchByGlobalConnectivity = function(url, search_events, search_slots) {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var name = resource.getName();
	var version = resource.getVersion();
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	$('header_always_error').style.display = 'none';
	UIUtils.setPage(1);
	UIUtils.search = true;
	UIUtils.searchValue[0] = search_events;
	UIUtils.searchValue[1] = search_slots;
	UIUtils.searchCriteria = 'connectEventSlot';
	CatalogueFactory.getInstance().repaintCatalogue(url + "/connectEventSlot/" + UIUtils.getPage() + "/" + UIUtils.getOffset(), name, version);
}

UIUtils.searchByTag = function(url, search_value) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	if (search_value == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}else{
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchValue[0] = search_value;
		UIUtils.searchCriteria = 'tag';
		CatalogueFactory.getInstance().repaintCatalogue(url + "/tag/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}


UIUtils.cataloguePaginate = function(url, offset, pag, items) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.off=offset;
	UIUtils.num_items=items;
	var opManager = OpManagerFactory.getInstance();
	var pages = Math.ceil(UIUtils.getNum_items()/UIUtils.getOffset());

	if (!UIUtils.search){
		url = URIs.GET_POST_RESOURCES;
	} else if(UIUtils.searchCriteria=="global"){
		url = URIs.GET_RESOURCES_GLOBAL_SEARCH;
	} else {
		url = URIs.GET_RESOURCES_SIMPLE_SEARCH + "/" + UIUtils.searchCriteria;
	}

	if (pag == "first"){
		pag = 1;
    }
	if (pag == "prev"){
		if(UIUtils.page == 1){
  			pag = 1;
  		}
   		else{
  			pag = UIUtils.page - 1;
  		}
  	}
	if (pag == "next"){
  		if(UIUtils.page == pages){
  			pag = pages;
  		}
		else{
			pag = parseInt(UIUtils.page) + 1;
		}
	}
    if (pag == "last"){
          pag = pages;
    }
	UIUtils.page = pag; 

	CatalogueFactory.getInstance().repaintCatalogue(url + "/" + pag + "/" + UIUtils.getOffset());
}

UIUtils.setOrderby = function(orderby) {
    UIUtils.orderby = orderby.value;
}

UIUtils.getPage = function() {
    return UIUtils.page;
}

UIUtils.setPage = function(page) {
    UIUtils.page = page;
}

UIUtils.getOffset = function() {
    return UIUtils.off;
}

UIUtils.setOffset = function(offset) {
    UIUtils.off = offset;
}

UIUtils.getNum_items = function() {
    return UIUtils.num_items;
}


UIUtils.removeTag = function(id_) {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.removeTag(id_);
}

UIUtils.removeGlobalTag = function(id_) {
	var tagger;
	selectedResources = CatalogueFactory.getInstance().getSelectedResources();
	for(var i=0; i<selectedResources.length;i++){
		tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
		tagger.removeTag(id_);
	}
	var parentHTML = $("my_global_tags");
	var tagHTML = $(id_);
	parentHTML.removeChild(tagHTML);
}

UIUtils.removeAllTags = function() {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.removeAll();
	$("tag_alert").style.display='none';
	$("new_tag_text_input").value="";
	$("new_tag_text_input").size=5;
	$("new_tag_text_input").focus();
}

UIUtils.removeAllGlobalTags = function() {
	if(UIUtils.tagmode){
		selectedResources=CatalogueFactory.getInstance().getSelectedResources();
		for(var i=0; i<selectedResources.length;i++){
			tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
			tagger.removeAll();
		}
	}
	var parentHTML = $("my_global_tags");
	while(parentHTML.childNodes.length > 1)
	{
		parentHTML.removeChild(parentHTML.childNodes[0]);
	}
	$("global_tag_alert").style.display='none';
	$("new_global_tag_text_input").value="";
	$("new_global_tag_text_input").size=5;
	$("new_global_tag_text_input").focus();
	
}

UIUtils.removeTagUser = function(tag,id) {	
	
	var resource = CatalogueFactory.getInstance().getResource(id);
    var tags = resource.getTags();
	var tag_id = null;
	for (var j=0;j<tags.length ; j++)
	{
		if (tags[j].getValue()==tag) {
			tag_id = tags[j].getIdentifier();
			break;
		}
	}
    var tagger = resource.getTagger();
    var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion() + "/" + tag_id;
	tagger.removeTagUser(URIs.DELETE_TAG, resourceURI,id);		
}

UIUtils.removeGlobalTagUser = function(tag) {	
	
	var resources = CatalogueFactory.getInstance().getSelectedResources();
	for (var i=0; i<resources.length; i++) {
		var resource = CatalogueFactory.getInstance().getResource(resources[i]);
		var tags = resource.getTags();
		for (var j=0;j<tags.length ; j++)
		{
			if (tag == tags[j].getValue())
			{
				var tag_id = tags[j].getIdentifier();
				var tagger = resource.getTagger();
				var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion() + "/" + tag_id;
				tagger.removeTagUser(URIs.DELETE_TAG, resourceURI,resources[i]);
				//break;
			}
		}
	}
}

UIUtils.sendPendingTags = function() {
  UIUtils.sendingPendingTags = true;
  if (UIUtils.tagmode)
  {
    UIUtils.sendGlobalTags();
  } else {
	if (UIUtils.selectedResource!=null)
	{
		var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
		var tagger = resource.getTagger();

		if (tagger.getTags().size() != 0) {
			UIUtils.sendTags();
		}
	}
  }
  UIUtils.sendingPendingTags = false;
}

UIUtils.sendTags = function() {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var tagger = resource.getTagger();
	var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();

	if ((tagger.getTags().size() == 0 || $('new_tag_text_input').value.length!= 0) && !UIUtils.sendingPendingTags)
	{
		UIUtils.addTag($('new_tag_text_input'));
	}
	
	tagger.sendTags(URIs.POST_RESOURCE_TAGS, resourceURI, resource);
}

UIUtils.sendGlobalTags = function() {
	//TBD
	var resources = CatalogueFactory.getInstance().getSelectedResources();
	var resource;
	var tagger;
	var resourceURI;
	for(var i=0; i<resources.length; i++){
		resource = CatalogueFactory.getInstance().getResource(resources[i]);
		tagger = resource.getTagger();
		resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();
		
		if ((tagger.getTags().size() == 0 || $('new_global_tag_text_input').value.length!= 0) && !UIUtils.sendingPendingTags)
		{
			//TODO control de errores
			UIUtils.addGlobalTag($('new_global_tag_text_input'));
		}
		//TODO Aviso de si todo ha ido bien o no

		tagger.sendTags(URIs.POST_RESOURCE_TAGS, resourceURI, resource);
	}
	var parentHTML = $("my_global_tags");
	while(parentHTML.childNodes.length > 1)
	{
		parentHTML.removeChild(parentHTML.childNodes[0]);
	}
}

UIUtils.deleteGadget = function(id) {
	var resource = CatalogueFactory.getInstance().getResource(id);
	if (UIUtils.selectedVersion == null){
		// Removes all versions of the gadget
		var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + escape(resource.getName());
	}else{
		// Removes only the specified version of the gadget
		var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + UIUtils.selectedVersion;
	}
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	
	var onError = function(transport) {
				LayoutManagerFactory.getInstance().hideCover();
				var msg = interpolate(gettext("Error deleting the Gadget: %(errorMsg)s."), {errorMsg: transport.status}, true);
				LogManagerFactory.getInstance().log(msg);
				// Process
			}
			
	var loadCatalogue = function(transport) {
				LayoutManagerFactory.getInstance().hideCover();
				CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
			}
	PersistenceEngineFactory.getInstance().send_delete(resourceURI, this, loadCatalogue, onError);
}

UIUtils.addTag = function(inputText_) {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.addTag(inputText_.value);
	inputText_.value = '';
	inputText_.focus();
	inputText_.size = 5;
}

UIUtils.addGlobalTag = function(inputText_) {
	if(inputText_.value.length<3)	{
		$("global_tag_alert").style.display='inline';
		UIUtils.getError($("global_tag_alert"),gettext("Tags must have at least three characters."));
	}else{
		var id = 'new_global_tag_' + UIUtils.counter;
		UIUtils.counter++;
		var tagger;
		selectedResources=CatalogueFactory.getInstance().getSelectedResources();
		for(var i=0; i<selectedResources.length;i++){
			tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
			tagger.addGlobalTag(inputText_.value);
		}
		UIUtils.paintGlobalTag(id,inputText_.value);
		$("global_tag_alert").style.display='none';
		
		inputText_.value = '';
		inputText_.focus();
		inputText_.size = 5;
	}
}

UIUtils.paintGlobalTag = function(id_, tag_) {
	//$("my_global_tags").innerHTML = "";
	var newTag = UIUtils.createHTMLElement("div", $H({
		id: id_,
		class_name: 'new_global_tag'
	}));
	//$("my_global_tags").appendChild(newTag);
	newTag.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: tag_
	})));
	var image_div = UIUtils.createHTMLElement("div", $H());
	newTag.appendChild(image_div);
	var image_link = UIUtils.createHTMLElement("a", $H({
		title: gettext('Delete gadget')
	}));
	image_link.observe('click', function(event){
		UIUtils.removeGlobalTag(id_);
	});
	image_div.appendChild(image_link);
	var image = UIUtils.createHTMLElement("img", $H({
		src: '/ezweb/images/cancel_gray.png'
	}));
	image.observe('mouseover', function(event){
		this.src = '/ezweb/images/delete.png';
	});
	image.observe('mouseout', function(event){
		this.src = '/ezweb/images/cancel_gray.png';
	});
	image_link.appendChild(image);
	$("my_global_tags").insertBefore(newTag, $("new_global_tag_text"));
}

UIUtils.setResourcesWidth = function() {
	var tab = $('tab_info_resource');
	var head = $('head');
	var resources = $('resources');
	var center = $('center');
	if (center){
		center.style.width = head.offsetWidth + 'px';
		resources.style.width = (center.offsetWidth - (tab.offsetWidth + (UIUtils.isInfoResourcesOpen?UIUtils.infoResourcesWidth:0))) + 'px';
	}
}

UIUtils.openInfoResource = function() {
	if (!UIUtils.isInfoResourcesOpen)
	{
		UIUtils.isInfoResourcesOpen = true;
		UIUtils.SlideInfoResourceIntoView('info_resource');
	}
}

UIUtils.closeInfoResource = function() {
	if (UIUtils.isInfoResourcesOpen)
	{
		UIUtils.deselectConnectableResources();
		UIUtils.isInfoResourcesOpen = false;
		UIUtils.SlideInfoResourceOutOfView('info_resource');
	}
}

UIUtils.SlideInfoResourceIntoView = function(element) {
  $(element).style.width = '0px';
  $(element).style.overflow = 'hidden';
  $(element).firstChild.style.position = 'relative';
  UIUtils.setResourcesWidth();
  Element.show(element);
  new Effect.Scale(element, 100,
    Object.extend(arguments[1] || {}, {
      scaleContent: false,
      scaleY: false,
      scaleMode: 'contents',
      scaleFrom: 0,
      afterUpdate: function(effect){},
	  afterFinish: function(effect)
        {UIUtils.show('tab_info_resource_close'); }
    })
  );
	if (UIUtils.selectedResource != null) {
		 UIUtils.lightUpConnectableResources(UIUtils.selectedResource);
	}
}

UIUtils.SlideInfoResourceOutOfView = function(element) {
  UIUtils.selectedResource= null;
  $(element).style.overflow = 'hidden';
  $(element).firstChild.style.position = 'relative';
  Element.show(element);
  new Effect.Scale(element, 0,
    Object.extend(arguments[1] || {}, {
      scaleContent: false,
      scaleY: false,
      afterUpdate: function(effect){},
      afterFinish: function(effect)
        { Element.hide(effect.element); UIUtils.setResourcesWidth(); UIUtils.hidde('tab_info_resource_close'); }
    })
  );
}

UIUtils.restoreSlide = function() {
	var div = $("head");
    var nodeList = div.childNodes;
    var aux = '';
    var tab = '';
    for(i=0;i<nodeList.length;i++){
    	if(nodeList.item(i).nodeName=="DIV" && nodeList.item(i).id!='header_always'){
	        if(Element.visible(nodeList.item(i))==true){
	        	nodeList.item(i).style.display = "none";
	           	//Effect.BlindUp(nodeList.item(i),{queue:{position:'end',scope:'menuScope',limit:2},});
	            aux = nodeList.item(i).id.split("_");
	            switch (aux[1].toLowerCase()) {
	            	case "tag":
	            		tab = gettext("Advanced Tagging");
	            		break;
	            	case "search":
	            		tab = gettext("Advanced Search");
	            		break;
	            	default:
	            		break;
	            }
	            $(nodeList.item(i).id+"_toggle").innerHTML = tab;
	            $(nodeList.item(i).id+"_toggle").style.background="lightBlue";
	            if(nodeList.item(i).id=="advanced_tag"){UIUtils.deactivateTagMode();}
	        }
	    }
    }
}

UIUtils.SlideAdvanced = function(element,container) {
    var div = $(container);
    var nodeList = div.childNodes;
    var queue = Effect.Queues.get('menuScope');
    var aux = '';
    var tab = '';
    UIUtils.sendPendingTags();
    if(queue.toArray().length<1){
        if(Element.visible(element)==false){
            for(i=0;i<nodeList.length;i++){
                if(nodeList.item(i).nodeName=="DIV" && nodeList.item(i).id!=element && nodeList.item(i).id!='header_always'){
                    if(Element.visible(nodeList.item(i))==true){
                        Effect.BlindUp(nodeList.item(i),{queue:{position:'end',scope:'menuScope',limit:2}});
                        aux = nodeList.item(i).id.split("_");
                        switch (aux[1].toLowerCase()) {
			            	case "tag":
			            		tab = gettext("Advanced Tagging");
			            		break;
			            	case "search":
			            		tab = gettext("Advanced Search");
			            		break;
			            	default:
			            		break;
			            }
                        $(nodeList.item(i).id+"_toggle").innerHTML = tab;
                        $(nodeList.item(i).id+"_toggle").style.background="transparent";
                        if(nodeList.item(i).id=="advanced_tag"){UIUtils.deactivateTagMode();}
                    }
                }
            }
            Effect.BlindDown(element,{queue:{position:'end',scope:'menuScope',limit:2}});
            aux = element.split("_");
            switch (aux[1].toLowerCase()) {
            	case "tag":
            		tab = gettext("Hide Tagging");
            		break;
            	case "search":
            		tab = gettext("Simple Search");
            		break;
            	default:
            		break;
            }
            $(element+"_toggle").innerHTML = tab;
			$(element+"_toggle").style.background="lightBlue";
			if(element=="advanced_tag"){UIUtils.activateTagMode();}
       }
       else {
       		Effect.BlindUp(element,{queue:{position:'end',scope:'menuScope',limit:2}});
            aux = element.split("_");
            switch (aux[1].toLowerCase()) {
            	case "tag":
            		tab = gettext('Advanced Tagging');
            		break;
            	case "search":
            		tab = gettext('Advanced Search');
            		break;
            	default:
            		break;
            }
            $(element+"_toggle").innerHTML = tab;
            $(element+"_toggle").style.background="transparent"; 
            if(element=="advanced_tag"){UIUtils.deactivateTagMode();}      
       }
   }
}

UIUtils.SlideAdvanced2 = function(element) {
	switch (element) {
		case "advanced_tag":
			element1=$(element).cleanWhitespace();
			element2=$("advanced_search").cleanWhitespace();
			event="Tag";
			break;
		case "advanced_search":
			element1=$(element).cleanWhitespace();
			element2=$("advanced_tag").cleanWhitespace();
			event="Search";
			break;
		default:
			break;
	}
	if (element1.style.display == 'none') {
		new Effect.BlindDown(element1,
			{
				duration:1,
				beforeStart: function() {
					if(element2.style.display != 'none')
					{
						new Effect.BlindUp(element2,
						{
							duration:1,
							beforeStart: function() {
								element1.style.zIndex=2;
								element2.style.zIndex=1;
							},
							afterFinish: function() {
								element2.style.display = 'none';
								$(element2.id+"_toggle").innerHTML = gettext("Advanced "+event);
								$(element2.id+"_toggle").style.background="lightBlue";
							}
						});
					}
					element1.style.zIndex=2;
					element2.style.zIndex=1;
					element1.style.display='true';
				},
				afterFinish: function() {
					$(element1.id+"_toggle").innerHTML = gettext("Simple "+event);
					$(element1.id+"_toggle").style.background="darkBlue";
				}
			});
	} else {
		new Effect.BlindUp(element1,
			{
				duration:1,
				afterFinish: function() {
					element1.style.display='none';
					$(element1.id+"_toggle").innerHTML = gettext("Advanced "+event);
					$(element1.id+"_toggle").style.background="lightBlue";
				}
			});
	}
}

UIUtils.SlideAdvancedSearchIntoView = function(element) {
  element = $(element).cleanWhitespace();
  // SlideDown need to have the content of the element wrapped in a container element with fixed height!
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({ 
    scaleContent: false, 
    scaleX: false, 
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if(window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show(); 
    },
    afterUpdateInternal: function(effect) {
      	effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' }); 
    },
    afterFinishInternal: function(effect) {
      	effect.element.undoClipping().undoPositioned();
      	effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); 
	},
	afterFinish: function(effect) {
		UIUtils.hidde('simple_search');
	  	UIUtils.show('advanced_search_bottom');
	  	$('advanced_search_text_tag').focus();
	}
    }, arguments[1] || {})
  );
}

UIUtils.SlideAdvancedSearchOutOfView = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false, 
    scaleX: false, 
    scaleMode: 'box',
    scaleFrom: 100,
    restoreAfterFinish: true,
    beforeStartInternal: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if(window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },  
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned().setStyle({bottom: oldInnerBottom});
      effect.element.down().undoPositioned();
    },
	afterFinish: function(effect) {
	  	UIUtils.hidde('advanced_search_bottom');
	  	UIUtils.show('simple_search');
	  	$('simple_search_text').focus();
	}
   }, arguments[1] || {})
  );
}

UIUtils.activateTagMode = function() {
	UIUtils.tagmode = true;
	UIUtils.removeAllGlobalTags();
	UIUtils.closeInfoResource();
	$("global_tagcloud").innerHTML = '';
	$("my_global_tags").childNodes[0].style.display="none";
}

UIUtils.deactivateTagMode = function() {
	UIUtils.sendPendingTags();
	UIUtils.tagmode = false;
	selectedResources=CatalogueFactory.getInstance().getSelectedResources();
	for(var i=0; i<selectedResources.length;i++){
		UIUtils.deselectResource(selectedResources[i]);
	}
	CatalogueFactory.getInstance().clearSelectedResources();
}

UIUtils.clickOnResource = function(id_) {
	if(UIUtils.tagmode){
		UIUtils.toggleSelectedResource(id_);
	}else{
		UIUtils.showResourceInfo(id_);
		UIUtils.openInfoResource();
		UIUtils.selectConnectableResources(id_);
	}
}

UIUtils.toggleSelectedResource = function(id_) {
	UIUtils.removeAllGlobalTags();
	if(CatalogueFactory.getInstance().isSelectedResource(id_)){
		var bottom = $(id_ + '_bottom');
	    var content = $(id_ + '_content');
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom.gif)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill.gif)';
		CatalogueFactory.getInstance().removeSelectedResource(id_);
	} else{
		var bottom = $(id_ + '_bottom');
	    var content = $(id_ + '_content');
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-tagmode.png)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-tagmode.png)';
		CatalogueFactory.getInstance().addSelectedResource(id_);
	}
	CatalogueFactory.getInstance().updateGlobalTags();
	
	if (CatalogueFactory.getInstance().getSelectedResources().length == 0){
		$("my_global_tags").childNodes[0].style.display="none";
	}else{
		$("my_global_tags").childNodes[0].style.display="inline";
	}
}

UIUtils.mouseOverResource = function(id_) {
	if(!((UIUtils.tagmode)&&(CatalogueFactory.getInstance().isSelectedResource(id_)))){
			UIUtils.selectResource(id_);
	}
	UIUtils.show(id_ + "_toolbar");
}

UIUtils.mouseOutResource = function(id_) {
	if(!((UIUtils.tagmode)&&(CatalogueFactory.getInstance().isSelectedResource(id_)))){
			UIUtils.deselectResource(id_);
	}
	UIUtils.hidde(id_ + "_toolbar");
}

//enlarge an input depending on the size of the text
UIUtils.enlargeInput = function(inputText_) {
	if (inputText_.value.length>5) inputText_.size = inputText_.value.length+1;
}

UIUtils.getError = function(element, error) {
	var jsCall = 'javascript:$(\"' + element.id + '\").style.display=\"none\"';
	element.innerHTML = "";
	element.appendChild(UIUtils.createHTMLElement("img", $H({
		class_name: 'warning',
		src: '/ezweb/images/ico_error_mini.gif'
	})));
	element.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: error
	})));
	var close = UIUtils.createHTMLElement("img", $H({
		class_name: 'close',
		src: '/ezweb/images/cancel_gray.png'
	}));
	close.observe('mouseover', function(event){
		this.src='/ezweb/images/delete.png';
	});
	close.observe('mouseout', function(event){
		this.src='/ezweb/images/cancel_gray.png';
	});
	close.observe('click', function(event){
		$(element.id).style.display = "none";
	});
	element.appendChild(close);
	new Effect.Highlight(element,{duration:0.5, startcolor:'#FF0000', endcolor:'#FFFF00', restorecolor:'#FFFF00'});
}

UIUtils.splitString = function(element){
	var ret = [''];
	element = element.replace(/^\s+|\s+$/g, '');
	ret = element.split(/\s+/);
	return ret;
}

UIUtils.filterString = function(element){
	element = element.replace(/^\s+|\s+$/g, '');
	element = element.replace(/\s+/g, ' ');
	return element;	
} 

// Enables you to react to return being pressed in an input
UIUtils.onReturn = function(event_, handler_, inputText_) {
  if (!event_) event_ = window.event;
  if (event_ && event_.keyCode && event_.keyCode == 13) {
	  handler_(inputText_,arguments[3]);
  }
};

UIUtils.rating = function(num)
{
	var star = num.id.replace("_", ''); // Get the selected star

	for(var i=1; i<=5; i++){		
		if(i<=star){
			$("_"+i).className = "on";
		}else{
			$("_"+i).className = "";
		}
	}
}

UIUtils.off_rating = function(num)
{
	var vote = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getUserVote();

	for(var i=1; i<=5; i++){		
		if(i<=vote){
			$("_"+i).className = "on";	
		}else{
			$("_"+i).className = "";
		}
	}
}

UIUtils.sendVotes = function(num) {
	
	var onError = function(transport) {
		alert(gettext ("Error POST"));
				// Process
	}
			
	var loadVotes = function(transport) {
		var responseJSON = transport.responseText;
		var jsonVoteData = eval ('(' + responseJSON + ')');
		resource.setVotes(jsonVoteData);
	}

	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();
	var star = num.id.replace("_", '');
	var param = {vote: star};
	if (resource.getUserVote() == 0) {
		PersistenceEngineFactory.getInstance().send_post(URIs.POST_RESOURCE_VOTES + resourceURI, param, this, loadVotes, onError);
	} else {
		PersistenceEngineFactory.getInstance().send_update(URIs.POST_RESOURCE_VOTES + resourceURI, param, this, loadVotes, onError);
	}
}

UIUtils.createHTMLElement = function(type_, attributes_){
	var newElement = document.createElement(type_);
	if (attributes_) {
		attributes_.each(function(attribute) {
			if (attribute.key != "innerHTML") {
				var key = attribute.key;
				if (key == "class_name") key = "class"; 
				else if (key == "for_") key = "for";
					
				newElement.setAttribute(key, attribute.value);
			}
			else 
				newElement.innerHTML = attribute.value;
		});
	}
	return newElement;
}

UIUtils.setPreferredGadgetVersion = function(preferredVersion_){

    var onError = function(transport) {
		var	msg = interpolate(gettext("Error updating the preferred version: %(errorMsg)s."), {errorMsg: transport.status}, true);
		LogManagerFactory.getInstance().log(msg);
    }
			
    var onSuccess = function(transport) {
    	UIUtils.repaintCatalogue=true;
		UIUtils.sendPendingTags();
		UIUtils.closeInfoResource();
		CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
    
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + preferredVersion_;
	var data = {preferred: true};
    PersistenceEngineFactory.getInstance().send_update(resourceURI, data, this, onSuccess, onError);
}

var CatalogueFactory  = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;


	function Catalogue() {
		
		// *********************************
		//  PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		var resources = $H();
		var selectedResources = [];
		var globalTags = [];
		var _this = this;
		var max_gadgets_per_page = 40;
		var min_offset = 10;
		var selectedResourceName = "";
		var selectedResourceVersion = "";
		var purchasableGadgets = []; 

		this.catalogueElement = $('showcase_container');
		
		Event.observe($('catalogue_link'), "click", function(){OpManagerFactory.getInstance().showCatalogue()}, false, "show_catalogue");
		
		
		// ********************
		//  PRIVILEGED METHODS
		// ********************

		this.initCatalogue = function () {	
			var onSuccess = function (transport) {
				// Loading purchaseble gadgets!! only when a transport is received!
				var responseJSON = transport.responseText;
				var response = eval ('(' + responseJSON + ')'); 
				purchasableGadgets = response['available_resources'];

			    // Load catalogue data!
			    this.repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
			    
			    UIUtils.setResourcesWidth();
				
			    $('simple_search_text').focus();
			}
			
			var onError = function () {
			    // Error downloading available gadgets! 
			    // Maybe the EzWeb user has no associated home gateway? 
			    // Continue loading non-contratable gadgets! 
			    purchasableGadgets = [] 

			    // Load catalogue data! 
			    this.repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
			    UIUtils.setResourcesWidth(); 
			    $('simple_search_text').focus();

			}
			
			var persistenceEngine = PersistenceEngineFactory.getInstance();
			
			UIUtils.clearPreviousSearch();
			
			// Get Resources from PersistenceEngine. Asyncrhonous call!
			

			if (URIs.HOME_GATEWAY_DISPATCHER_URL) {			
			    var params = {'method': "GET", 'url':  URIs.HOME_GATEWAY_DISPATCHER_URL};
			    persistenceEngine.send_post("/proxy", params, this, onSuccess, onError);
			}
			else {
			    this.repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
			    UIUtils.setResourcesWidth();
				
			    $('simple_search_text').focus();
			}
		}
		
		this.reloadCompleteCatalogue = function() {
			this.initCatalogue();
		}
		
	 	this.emptyResourceList = function() {
			$("resources").innerHTML="";
			_this.clearSelectedResources();
			resources = $H();
		}

		this.getResources = function() {
			return resources;
		}
		
		this.getResource = function(id_) {
			return resources[id_];
		}
		
		this.getVersionManager = function(id_) {
			return verManager;
		}

		this.addSelectedResource = function(id_) {
			if(!_this.isSelectedResource(id_)) {
				selectedResources.push(id_);
			}
		}

		this.isSelectedResource = function(id_) {
			for (var i=0; i<selectedResources.length; i++){
				if (selectedResources[i] == id_) {
					return true;
				}
			}
			return false;
		}

		this.removeSelectedResource = function(id_) {
			for (var i=0; i<selectedResources.length; i++){
				if (selectedResources[i] == id_) {
					selectedResources = selectedResources.without(selectedResources[i]);
				}
			}
		}

		this.clearSelectedResources = function() {
			selectedResources = [];
		}
	
		this.toggleSelectedResource = function(id_) {
			if(isSelectedResources(id_)) {
				removeSelectedResource(id_)
			}else{
				addSelectedResource(id_);
			}
		}

		this.getSelectedResources = function() {
			return selectedResources;
		}

		this.addResource = function(resourceJSON_, urlTemplate_) { 
			var resourceKey = "resource_" + resources.keys().length;
			resources[resourceKey] = new Resource(resourceKey, resourceJSON_, urlTemplate_);
		}

		this.addResourceToShowCase = function(resourceId_) {
			var currentResource = this.getResource(resourceId_);
			ShowcaseFactory.getInstance().addGadget(currentResource.getVendor(), currentResource.getName(),  currentResource.getVersion(), currentResource.getUriTemplate());
		}

		this.addMashupResource = function(resourceId_) {
			/***CALLBACK methods***/
			var cloneOk = function(transport){
				var response = transport.responseText;
				var wsInfo = eval ('(' + response + ')');
				//create the new workspace and go to it
				opManager = OpManagerFactory.getInstance();
				opManager.workSpaceInstances[wsInfo.workspace.id] = new WorkSpace(wsInfo.workspace);
		
				ShowcaseFactory.getInstance().reload(wsInfo.workspace.id);
				
			}
			var cloneError = function(transport, e){
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
				msg = interpolate(gettext("Error cloning workspace: %(errorMsg)s."),
				                          {errorMsg: msg}, true);
				LogManagerFactory.getInstance().log(msg);				
				
			}
			
			var currentResource = this.getResource(resourceId_);
			var workSpaceId = currentResource.getMashupId();
			var cloneURL = URIs.GET_ADD_WORKSPACE.evaluate({'workspace_id': workSpaceId});
			PersistenceEngineFactory.getInstance().send_get(cloneURL, this, cloneOk, cloneError);
		}

		this.paginate = function(items) {
			_paginate_show($("paginate_show"), items);
			_paginate($("paginate"), items);
		}

		this.orderby = function(items){
			_orderby($("orderby"), items);
		}

		this.changeGlobalTagcloud = function(type){	
			$('view_global_tags_links').innerHTML = "";
			
			var all = UIUtils.createHTMLElement((type=="all")?"span":"a", $H({ innerHTML: gettext ('All common tags') }));
			if (type != "all") {
				all.observe("click", function(event){
					_this.changeGlobalTagcloud('all');
				});
			}
			var mytags = UIUtils.createHTMLElement((type=="mytags")?"span":"a", $H({ innerHTML: gettext ('My common tags') }));
			if (type != "mytags") {
				mytags.observe("click", function(event){
					_this.changeGlobalTagcloud('mytags');
				});
			}
			var others = UIUtils.createHTMLElement((type=="others")?"span":"a", $H({ innerHTML: gettext ('Others common tags') }));
			if (type != "others") {
				others.observe("click", function(event){
					_this.changeGlobalTagcloud('others');
				});
			}
			$('view_global_tags_links').appendChild(all);
			$('view_global_tags_links').appendChild(mytags);
			$('view_global_tags_links').appendChild(others);
			UIUtils.globalTags = type;
			this.updateGlobalTags();
		}
		
        this.updateGlobalTags = function(){
            if (UIUtils.tagmode) {
                if (selectedResources.length == 0) {
                    globalTags = [];
					_globalTagsToTagcloud($("global_tagcloud"));
					return;
				}
				if(selectedResources.length==1){
					if (UIUtils.globalTags == "all") {
						globalTags = globalTags=CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
					} 
					else if (UIUtils.globalTags == "mytags") {
						var auxGlobalTags = [];
						var counter=0;
						globalTags = globalTags=CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
						for(var k=0;k<globalTags.length; k++){
							if(globalTags[k].getAdded_by()=='Yes'){
								auxGlobalTags[counter]=globalTags[k];
								counter++;
							}
						}
						globalTags=auxGlobalTags;
					} else {
						var auxGlobalTags = [];
						var counter=0;
						globalTags = CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
						for(var k=0;k<globalTags.length; k++){
							if(globalTags[k].getAdded_by()=='No'){
								auxGlobalTags[counter]=globalTags[k];
								counter++;
							}
						}
						globalTags=auxGlobalTags;
					}
                    _globalTagsToTagcloud($("global_tagcloud"));
                    return;
                }
                if (UIUtils.globalTags == "all") {
                    globalTags = _this.getResource(selectedResources[0]).getTags();
                    var auxTags = [];
                    var bool = [];
                    for (var i = 1; i < selectedResources.length; i++) {
                        auxTags = _this.getResource(selectedResources[i]).getTags();
                        for (var k = 0; k < globalTags.length; k++) {
                            bool[k] = false;
                            for (var j = 0; j < auxTags.length; j++) {
                                if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                    bool[k] = true;
                                    break;
                                }
                            }
                        }
                        var auxGlobalTags = [];
                        var counter = 0;
                        for (var k = 0; k < globalTags.length; k++) {
                            if (bool[k]) {
                                auxGlobalTags[counter] = globalTags[k];
                                counter++;
                            }
                        }
                        globalTags = auxGlobalTags;
                    }
                }
                else 
                    if (UIUtils.globalTags == "mytags") {
                        globalTags = _this.getResource(selectedResources[0]).getTags();
                        var auxTags = [];
                        var bool = [];
                        for (var i = 1; i < selectedResources.length; i++) {
                            auxTags = _this.getResource(selectedResources[i]).getTags();
                            for (var k = 0; k < globalTags.length; k++) {
                                bool[k] = false;
                                for (var j = 0; j < auxTags.length; j++) {
                                    if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                        bool[k] = true;
                                        break;
                                    }
                                }
                            }
                            var auxGlobalTags = [];
                            var counter = 0;
                            for (var k = 0; k < globalTags.length; k++) {
                                if (bool[k] && globalTags[k].getAdded_by() == 'Yes') {
                                    auxGlobalTags[counter] = globalTags[k];
                                    counter++;
                                }
                            }
                            globalTags = auxGlobalTags;
                        }
                    }
                    else {
                        globalTags = _this.getResource(selectedResources[0]).getTags();
                        var auxTags = [];
                        var bool = [];
                        for (var i = 1; i < selectedResources.length; i++) {
                            auxTags = _this.getResource(selectedResources[i]).getTags();
                            for (var k = 0; k < globalTags.length; k++) {
                                bool[k] = false;
                                for (var j = 0; j < auxTags.length; j++) {
                                    if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                        bool[k] = true;
                                        break;
                                    }
                                }
                            }
                            var auxGlobalTags = [];
                            var counter = 0;
                            for (var k = 0; k < globalTags.length; k++) {
                                if (bool[k] && globalTags[k].getAdded_by() == 'No') {
                                    auxGlobalTags[counter] = globalTags[k];
                                    counter++;
                                }
                            }
                            globalTags = auxGlobalTags;
                        }
                    }
                _globalTagsToTagcloud($("global_tagcloud"));
            }
        }

		this.getGlobalTags = function() {
			return globalTags;
		}

		this.repaintCatalogue = function (url) {
			selectedResourceName = arguments[1];
			selectedResourceVersion = arguments[2];
			this.emptyResourceList();
			this.loadCatalogue(url);
		}

		this.show = function(){
			LayoutManagerFactory.getInstance().showCatalogue();
		}

		this.hide = function(){
			LayoutManagerFactory.getInstance().hideView(this.catalogueElement);
		}

		this.isContratableResource = function (resource) {
		  for (var i=0; i<resource.capabilities.length; i++) {
		      var capability = resource.capabilities[i];
                      if (capability.name == 'Contratable') 
		      	 return capability.value.toLowerCase() == "true";
		      else
			return false;
		  }
 	        } 
 	                 
 	        this.isAvailableResource = function(resource) { 
 	          for (var i=0; i<purchasableGadgets.length; i++) { 
		      if (resource.uriTemplate == purchasableGadgets[i].gadget)  	            
 	                 return true; 
 	              } 
 	          return false; 
 	        } 

		this.loadCatalogue = function(urlCatalogue_) {

			// ******************
			//  CALLBACK METHODS 
			// ******************

			//Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
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

				msg = interpolate(gettext("Error retrieving catalogue data: %(errorMsg)s."), {errorMsg: msg}, true);
				LogManagerFactory.getInstance().log(msg);

			}

			var loadResources = function(transport) {
			  var response = Try.these(
			       function() { 
				   return new DOMParser().parseFromString(transport.responseText, 'text/xml'); 
			       },

			       function() { 
				   var xmldom = new ActiveXObject('Microsoft.XMLDOM'); 
				   xmldom.loadXML(transport.responseText); 											return xmldom; 
			       }
  			  );

			  var responseJSON = transport.responseText;
			  var items = transport.getResponseHeader('items');
			  var jsonResourceList = eval ('(' + responseJSON + ')');
			  jsonResourceList = jsonResourceList.resourceList;

                          for (var i = 0; i<jsonResourceList.length; i++) { 
                             // It's a contratable gadget 
			     if (this.isContratableResource(jsonResourceList[i])) {
			     	//It's a contratable gadget!
				//Let's see if its available at HomeGateway! 
				if (this.isAvailableResource(jsonResourceList[i])) {
				   // It's a available contratable gadget!
				   // Adding to catalogue! 
				   this.addResource(jsonResourceList[i], null);
				}
				else { 
				   //It's not available! 
				   //Not adding to catalogue!
				   continue; 
				}
			     }
			     else {
			     	  // It's a normal not purchasable gadget 
				  // Always adding to catalogue
				  this.addResource(jsonResourceList[i], null); 
 	                          continue; 
 	                     } 
			  }

			  this.paginate(items);
			  this.orderby(items);
			  $('global_tagcloud').innerHTML = '';
			  UIUtils.repaintCatalogue=false;
			}

			var param = {orderby: UIUtils.orderby, search_criteria: UIUtils.searchValue, search_boolean:$("global_search_boolean").value};

			var persistenceEngine = PersistenceEngineFactory.getInstance();

			$('header_always_status').innerHTML = "";
			$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: urlCatalogue_
			})));

			var text = "";
			switch(UIUtils.searchCriteria){
				case "and":
					text = gettext('Search') + ': ';
					break;
				case "or":
				case "simple_or":
					text = gettext('Search') + ': ';
					break;
				case "not":
					text = gettext('Search') + ': ';
					break;
				case "tag":
					text = gettext('Search by Tag') + ': ';
					break;
				case "event":
					text = gettext('Search by Event') + ': ';
					break;
				case "slot":
					text = gettext('Search by Slot') + ': ';
					break;
				case "connectSlot":
					text = gettext('Search by Slot connectivity for %(resourceName)s %(resourceVersion)s');
					text = interpolate(text, {resourceName: selectedResourceName, resourceVersion: selectedResourceVersion}, true);
					break;
				case "connectEvent":
					text = gettext('Search by Event connectivity for %(resourceName)s %(resourceVersion)s');
					text = interpolate(text, {resourceName: selectedResourceName, resourceVersion: selectedResourceVersion}, true);
					break;
				case "connectEventSlot":
					text = gettext('Search by Event and Slot connectivity for %(resourceName)s %(resourceVersion)s');
					text = interpolate(text, {resourceName: selectedResourceName, resourceVersion: selectedResourceVersion}, true);
					break;
				case "global":
					text = gettext('Global Search') + ': ';
					break;
			}
			if (text != "") {
				$('header_always_status').innerHTML = "";
				$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
					innerHTML: text
				})));
			}
			var searching='';
			switch(UIUtils.searchCriteria){
				case "global":
					var auxiliar_and=[""];
					var auxiliar_and_bool = true;
					var auxiliar_or=[""];
					var auxiliar_or_bool = true;
					var auxiliar_not=[""];
					var auxiliar_not_bool = true;
					var auxiliar_tag=[""];
					var auxiliar_tag_bool = true;
					var auxiliar_event=[""];
					var auxiliar_event_bool = true;
					var auxiliar_slot=[""];
					var auxiliar_slot_bool = true;
					if (UIUtils.searchValue[0]=="") auxiliar_and_bool = false;
					if (UIUtils.searchValue[1]=="") auxiliar_or_bool = false;
					if (UIUtils.searchValue[2]=="") auxiliar_not_bool = false;
					if (UIUtils.searchValue[3]=="") auxiliar_tag_bool = false;
					if (UIUtils.searchValue[4]=="") auxiliar_event_bool = false;
					if (UIUtils.searchValue[5]=="") auxiliar_slot_bool = false;

					if (auxiliar_and_bool) {
						auxiliar_and=UIUtils.splitString(UIUtils.searchValue[0]);
						for (var j=0;j<auxiliar_and.length;j++){
							if(j==auxiliar_and.length-1){
								searching += auxiliar_and[j] + ((auxiliar_or_bool||auxiliar_not_bool||auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");
							}else if(j==auxiliar_and.length-2){
								searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
							}else{
								searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
							}
						}
					}
					if (auxiliar_or_bool) {
						auxiliar_or=UIUtils.splitString(UIUtils.searchValue[1]);
						for (var j=0;j<auxiliar_or.length;j++){
							if(j==auxiliar_or.length-1){
								searching += auxiliar_or[j] + ((auxiliar_not_bool||auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");
							}else if(j==auxiliar_or.length-2){
								searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
							}
						}
					}
					if (auxiliar_not_bool) {
						auxiliar_not=UIUtils.splitString(UIUtils.searchValue[2]);
						for (var j=0;j<auxiliar_not.length;j++){
							if(j==0){
								if(auxiliar_not.length==1){
									searching += gettext('not') + ' ' + auxiliar_not[j] + ((auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");
								}else{
									searching += gettext('neither') + ' ' + auxiliar_not[j] + ' ' + gettext('nor') + ' ';
								}
							}else if(j==auxiliar_not.length-1){
								searching += auxiliar_not[j] + ((auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");
							}else{
								searching += auxiliar_not[j] + ' ' + gettext('nor') + ' ';
							}
						}
					}
					if (auxiliar_tag_bool) {
						auxiliar_tag=UIUtils.splitString(UIUtils.searchValue[3]);
						searching += gettext('Tags: ');
						for (var j=0;j<auxiliar_tag.length;j++){
							if(j==auxiliar_tag.length-1){
								searching += auxiliar_tag[j] + ((auxiliar_event_bool||auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");
							}else if(j==auxiliar_tag.length-2){
								searching += auxiliar_tag[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_tag[j] + ', ';
							}
						}
					}
					if (auxiliar_event_bool) {
						auxiliar_event=UIUtils.splitString(UIUtils.searchValue[4]);
						searching += gettext('Events: ');
						for (var j=0;j<auxiliar_event.length;j++){
							if(j==auxiliar_event.length-1){
								searching += auxiliar_event[j] + ((auxiliar_slot_bool)?' '+$("global_search_boolean").value+' ':".");;
							}else if(j==auxiliar_event.length-2){
								searching += auxiliar_event[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_event[j] + ', ';
							}
						}
					}
					if (auxiliar_slot_bool) {
						auxiliar_slot=UIUtils.splitString(UIUtils.searchValue[5]);
						searching += gettext('Slots: ');
						for (var j=0;j<auxiliar_slot.length;j++){
							if(j==auxiliar_slot.length-1){
								searching += auxiliar_slot[j] + ".";
							}else if(j==auxiliar_slot.length-2){
								searching += auxiliar_slot[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_slot[j] + ', ';
							}
						}
					}
					break;
				case "and":
					var auxiliar_and=[""];
					auxiliar_and=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_and.length;j++){
						if(j==auxiliar_and.length-1){
							searching += auxiliar_and[j] + ".";
						}else if(j==auxiliar_and.length-2){
							searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
						}else{
							searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
						}
					}
					break;
				case "or":
				case "simple_or":
					var auxiliar_or=[""];
					auxiliar_or=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_or.length;j++){
						if(j==auxiliar_or.length-1){
							searching += auxiliar_or[j] + ".";
						}else if(j==auxiliar_or.length-2){
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}else{
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}
					}
					break;
				case "not":
					var auxiliar_not=[""];
					auxiliar_not=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_not.length;j++){
						if(j==0){
							if(auxiliar_not.length==1){
								searching += gettext('not') + ' ' + auxiliar_not[j] + ".";
							}else{
								searching += gettext('neither') + ' ' + auxiliar_not[j] + ' ' + gettext('nor') + ' ';
							}
						}else if(j==auxiliar_not.length-1){
							searching += auxiliar_not[j] + ".";
						}else{
							searching += auxiliar_not[j] + ' ' + gettext('nor') + ' ';
						}
					}
					break;
				case "tag":
				case "event":
				case "slot":
				case "connectEvent":
				case "connectSlot":
					var auxiliar_or=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_or.length;j++){
						if(j==auxiliar_or.length-1){
							searching += auxiliar_or[j];
						}else if(j==auxiliar_or.length-2){
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}else{
							searching += auxiliar_or[j] + ', ';
						}
					}
					break;
				case "connectEventSlot":
					var auxiliar_event=[""];
					var auxiliar_event_bool = true;
					var auxiliar_slot=[""];
					var auxiliar_slot_bool = true;
					if (UIUtils.searchValue[0]=="") auxiliar_event_bool = false;
					if (UIUtils.searchValue[1]=="") auxiliar_slot_bool = false;
					if (auxiliar_event_bool) {
						auxiliar_event=UIUtils.splitString(UIUtils.searchValue[0]);
						searching += gettext('Events: ');
						for (var j=0;j<auxiliar_event.length;j++){
							if(j==auxiliar_event.length-1){
								searching += auxiliar_event[j] + ((auxiliar_slot_bool)?' OR ':".");;
							}else if(j==auxiliar_event.length-2){
								searching += auxiliar_event[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_event[j] + ', ';
							}
						}
					}
					if (auxiliar_slot_bool) {
						auxiliar_slot=UIUtils.splitString(UIUtils.searchValue[1]);
						searching += gettext('Slots: ');
						for (var j=0;j<auxiliar_slot.length;j++){
							if(j==auxiliar_slot.length-1){
								searching += auxiliar_slot[j] + ".";
							}else if(j==auxiliar_slot.length-2){
								searching += auxiliar_slot[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_slot[j] + ', ';
							}
						}
					}
					break;
			}
			var auxiliar = urlCatalogue_.toString().split("/");
			for (var i=0;i<auxiliar.length;i++){
				if (auxiliar[i] == 'resource') {
					$('header_always_status').innerHTML = "";
					$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
						innerHTML: gettext('Full Catalogue')
					})));
					break;
				} else if (auxiliar[i] == 'search' || auxiliar[i]=='globalsearch') {
					$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
						innerHTML: searching
					})));
					var reload_link = UIUtils.createHTMLElement("a", $H({
						innerHTML: gettext("Reload")
					}));
					reload_link.observe("click", function(event){
						CatalogueFactory.getInstance().emptyResourceList();
						CatalogueFactory.getInstance().loadCatalogue(urlCatalogue_);
					});
					$('header_always_status').appendChild(reload_link);
					break;
				}
			}


			var reload_catalogue_link = UIUtils.createHTMLElement("a", $H({
				id: 'reload_catalogue_link',
				innerHTML: gettext("Reload Catalogue")
			}));
			reload_catalogue_link.observe("click", function(event){
				CatalogueFactory.getInstance().reloadCompleteCatalogue();
				$('header_always_error').style.display = 'none';
			});
			$('header_always_status').appendChild(reload_catalogue_link);
			
			// Get Resources from PersistenceEngine. Asyncrhonous call!
			persistenceEngine.send_get(urlCatalogue_, this, loadResources, onError, param);
		}

	var _paginate_show = function(parent, items){
		parent.innerHTML = "";
		parent.appendChild(UIUtils.createHTMLElement("label", $H({
			for_: 'combo_results_per_page',
			innerHTML: gettext("Gadgets per page: ")
		})));
		var select = UIUtils.createHTMLElement("select", $H({
			id: 'combo_results_per_page',
			size: '1'
		}));
		select.observe("change", function(event){
			UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, $('combo_results_per_page').options[$('combo_results_per_page').selectedIndex].value.toString(), 'first', items);
		});
		parent.appendChild(select);
		if(items<=0) {
			select.setAttribute("disabled", "disabled");
		}
		else {
			var max;
			if(items>max_gadgets_per_page) {
				max = max_gadgets_per_page/min_offset;
			} else {
				max = Math.ceil(items/min_offset);
			}
			var some_selected = false;
			for (var i=1; i<=max; i++){
				var option = UIUtils.createHTMLElement("option", $H({
					value: "" + (i*min_offset),
					innerHTML: "" + (i*min_offset)
				}));
				if(UIUtils.getOffset() == i*min_offset){
					option.setAttribute("selected", "selected");
					some_selected=true;
				}
				if((i==max)&&(!some_selected)){
					option.setAttribute("selected", "selected");
					UIUtils.offset=max;
				}
				select.appendChild(option);
			}
		}
	}
	
	var _paginate = function(parent, items){
		parent.innerHTML = '';
		var end_page = Math.ceil(items/UIUtils.getOffset());
        if (end_page==0){end_page=1;}
		
		var first_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(first_span);
		var previous_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(previous_span);
		
        if(UIUtils.getPage()!=1)
        {
			var first_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to first page')
			}));
			first_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(),"first", items);
			});
			first_span.appendChild(first_link);
			var first_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-first.png'
			}));
			first_link.appendChild(first_img);
			var previous_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to previous page')
			}));
			previous_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), "prev", items);
			});
			previous_span.appendChild(previous_link);
			var previous_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-previous.png'
			}));
			previous_link.appendChild(previous_img);
        } 
		else {
			var first_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-first-dim.png'
			}));
			first_span.appendChild(first_img);
			var previous_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-previous-dim.png'
			}));
			previous_span.appendChild(previous_img);
        }

		for (var i=1; i<=end_page; i++)
		{
            if(UIUtils.getPage()!=i)
            {
				var page_span = UIUtils.createHTMLElement("span", $H({
					class_name: 'pagination_button'
				}));
				parent.appendChild(page_span);
				var page_link = UIUtils.createHTMLElement('a', $H({
					title: gettext('Go to page ') + i,
					innerHTML: '' + i
				}));
				page_link.observe("click", function(event){
					UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), this.innerHTML , items);
				});
				page_span.appendChild(page_link);
		    } 
			else {
				parent.appendChild(UIUtils.createHTMLElement("span", $H({
		   			class_name: 'pagination_button',
					innerHTML: '' + i
				})));
		    }
		}

		var next_span = UIUtils.createHTMLElement("span", $H({
			class_name: 'pagination_button'
		}));
		parent.appendChild(next_span);
		var last_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(last_span);
		
		if(end_page == UIUtils.getPage())
        {
			var last_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-last-dim.png'
			}));
			last_span.appendChild(last_img);
			var next_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-next-dim.png'
			}));
			next_span.appendChild(next_img);
        }
		else {
			var last_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to last page')
			}));
			last_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(),"last", items);
			});
			last_span.appendChild(last_link);
			var last_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-last.png'
			}));
			last_link.appendChild(last_img);
			var next_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to next page')
			}));
			next_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), "next", items);
			});
			next_span.appendChild(next_link);
			var next_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-next.png'
			}));
			next_link.appendChild(next_img);
		}
	}

	var _orderby = function(parent, items) {
		parent.innerHTML = '';
		parent.appendChild(UIUtils.createHTMLElement("label", $H({
			for_: 'combo_order_by',
			innerHTML: gettext(" Order by") + ':'
		})));
		var select = UIUtils.createHTMLElement("select", $H({
			id: 'combo_order_by'
		}));
		select.observe("change", function(event){
			UIUtils.setOrderby(this);
			UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, $('combo_results_per_page').options[$('combo_results_per_page').selectedIndex].value.toString(), 'first', items);
		});
		parent.appendChild(select);
		
		if (items==0) {
			select.setAttribute("disabled", "disabled");
		}
		else {
			var creation = UIUtils.createHTMLElement("option", $H({
				value: '-creation_date',
				innerHTML: gettext("Creation date")
			}));
			if (UIUtils.orderby == "-creation_date") creation.setAttribute("selected", "selected");
			select.appendChild(creation);
			var name = UIUtils.createHTMLElement("option", $H({
				value: 'short_name',
				innerHTML: gettext("Name")
			}));
			if (UIUtils.orderby == "short_name") name.setAttribute("selected", "selected");
			select.appendChild(name);
			var vendor = UIUtils.createHTMLElement("option", $H({
				value: 'vendor',
				innerHTML: gettext("Vendor")
			}));
			if (UIUtils.orderby == "vendor") vendor.setAttribute("selected", "selected");
			select.appendChild(vendor);
			var author = UIUtils.createHTMLElement("option", $H({
				value: 'author',
				innerHTML: gettext("Author")
			}));
			if (UIUtils.orderby == "author") author.setAttribute("selected", "selected");
			select.appendChild(author);
			var popularity = UIUtils.createHTMLElement("option", $H({
				value: '-popularity',
				innerHTML: gettext("Popularity")
			}));
			if (UIUtils.orderby == "-popularity") popularity.setAttribute("selected", "selected");
			select.appendChild(popularity);
		}
	}

    var _globalTagsToTagcloud = function(parent){
        parent.innerHTML = "";
        for (var i = 0; i < globalTags.length; i++) {
            var new_tag = UIUtils.createHTMLElement("span", $H({
                class_name: 'multiple_size_tag'
            }));
            new_tag.appendChild(globalTags[i].tagToTypedHTML({
                tags: 'multiple'
            }));
            if (UIUtils.globalTags == "mytags") {
                var image_container = UIUtils.createHTMLElement("span", $H({
                    title: gettext('Delete tag')
                }));
                image_container.observe("click", function(event){
                    UIUtils.removeGlobalTagUser(this.parentNode.firstChild.innerHTML);
                });
                var image = UIUtils.createHTMLElement("img", $H({
                    id: ('delete_icon_' + i),
                    src: '/ezweb/images/cancel_gray.png',
                    border: '0',
                    name: 'op1'
                }));
                image.observe("mouseover", function(event){
                    this.src = '/ezweb/images/delete.png';
                });
                image.observe("mouseout", function(event){
                    this.src = '/ezweb/images/cancel_gray.png';
                });
				image_container.appendChild(image);
                new_tag.appendChild(image_container);
            }
            var separator = UIUtils.createHTMLElement("span", $H({
                innerHTML: ((i < (globalTags.length - 1)) ? "," : "")
            }));
            new_tag.appendChild(separator);
            parent.appendChild(new_tag);
        }
    }

	OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
	
	}
	
	// ************************
	//  SINGLETON GET INSTANCE
	// ************************
	
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Catalogue();
         	}
         	return instance;
       	}
	}
	
}();


  //////////////////////////////////////////////
  //                RESOURCE                  //
  //////////////////////////////////////////////

function Resource( id_, resourceJSON_, urlTemplate_) {
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return state.getVendor();}
	this.getName = function() { return state.getName();}
	this.getVersion = function() { return state.getVersion();}
	this.getAllVersions = function() { return state.getAllVersions();}
	this.getDescription = function() { return state.getDescription();}
	this.getUriImage = function() { return state.getUriImage();}
	this.getUriTemplate = function() { return state.getUriTemplate();}
	this.getUriWiki = function() { return state.getUriWiki();}
	this.getMashupId = function() { return state.getMashupId();}	
	this.getAddedBy = function() { return state.getAddedBy();}
	this.getTags = function() { return state.getTags();}
	this.setTags = function(tags_) { state.setTags(tags_);}
	this.addTag = function(tag) { state.addTag(tag); }
	this.getSlots = function() { return state.getSlots();}
	this.setSlots = function(slots_) { state.setSlots(slots_);}
	this.getEvents = function() { return state.getEvents();}
	this.setEvents = function(events_) { state.setEvents(events_);}
	this.getTagger = function() { return tagger;}
	this.setVotes = function(voteData_) {
		state.setVotes(voteData_);
		_rateResource();
	}
	this.getVotes = function() {return state.getVotes();}
	this.getUserVote = function() {return state.getUserVote();}
	this.getPopularity = function() {return state.getPopularity();}
	this.getSelectedVersion = function() {return versionSelected;}
	this.setSelectedVersion = function(version_) {versionSelected = version_;}
	
	this.paint = function(){
		var newResource = UIUtils.createHTMLElement("div", $H({
            id: id_
        }));
		$("resources").appendChild(newResource);
		var resource = UIUtils.createHTMLElement("div", $H({
            class_name: 'resource'
        }));
		resource.observe("mouseover", function(event){
            UIUtils.mouseOverResource(id_);
        });
		resource.observe("mouseout", function(event){
            UIUtils.mouseOutResource(id_);
        });
		newResource.appendChild(resource);
		// TOP
		resource.appendChild(UIUtils.createHTMLElement("div", $H({
            class_name: 'top'
        })));
		// TOOLBAR
		var toolbar = UIUtils.createHTMLElement("div", $H({
            class_name: 'toolbar'
        }));
		resource.appendChild(toolbar);
		var content_toolbar = UIUtils.createHTMLElement("div", $H({
            id: id_ + '_toolbar',
			style: 'display:none'
        }));
		toolbar.appendChild(content_toolbar);
		var wiki = UIUtils.createHTMLElement("a", $H({
            title: gettext ('Access to the wiki'),
			target: '_blank',
			href: state.getUriWiki()
        }));
		content_toolbar.appendChild(wiki);
		var wiki_img = UIUtils.createHTMLElement("img", $H({
            id: id_ + '_wiki_img',
			src: '/ezweb/images/wiki_gray.png'
        }));
		wiki_img.observe("mouseover", function(event){
			this.src = '/ezweb/images/wiki.png';
		});
		wiki_img.observe("mouseout", function(event){
			this.src = '/ezweb/images/wiki_gray.png';
		});
		wiki.appendChild(wiki_img);
		var template = UIUtils.createHTMLElement("a", $H({
            title: gettext ('Show template'),
			target: '_blank',
			href: state.getUriTemplate()
        }));
		content_toolbar.appendChild(template);
		var template_img = UIUtils.createHTMLElement("img", $H({
            id: id_ + '_template_img',
			src: '/ezweb/images/template_gray.png'
        }));
		template_img.observe("mouseover", function(event){
			this.src = '/ezweb/images/template.png';
		});
		template_img.observe("mouseout", function(event){
			this.src = '/ezweb/images/template_gray.png';
		});
		template.appendChild(template_img);
		if (state.getAddedBy() == 'Yes') {
			var deleteResource = UIUtils.createHTMLElement("a", $H({
				title: gettext('Delete')
			}));
			deleteResource.observe("click", function(event){
				UIUtils.selectedResource = id;
				UIUtils.selectedVersion = null;
				LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
			});
			content_toolbar.appendChild(deleteResource);
			var delete_img = UIUtils.createHTMLElement("img", $H({
				id: id_ + '_delete_img',
				src: '/ezweb/images/cancel_gray.png'
			}));
			delete_img.observe("mouseover", function(event){
				this.src = '/ezweb/images/delete.png';
			});
			delete_img.observe("mouseout", function(event){
				this.src = '/ezweb/images/cancel_gray.png';
			});
			deleteResource.appendChild(delete_img);
		}
		// CONTENT
		var content = UIUtils.createHTMLElement("div", $H({
            class_name: 'content',
			id: id_ + '_content'
        }));
		resource.appendChild(content);
		content.appendChild(UIUtils.createHTMLElement("div", $H({
            class_name: 'title',
			innerHTML: state.getName()
        }))); 
		var image_div = UIUtils.createHTMLElement("div", $H({
            class_name: 'image'
        })); 
		content.appendChild(image_div);
		var image_link = UIUtils.createHTMLElement("a", $H({
            title: gettext('Show resource details')
        }));
		image_link.observe("click", function(event){
			UIUtils.sendPendingTags();
			UIUtils.clickOnResource(id_);
		});
		image_div.appendChild(image_link);
		var image = UIUtils.createHTMLElement("img", $H({
			id: id_ + '_img',
            src: state.getUriImage()
        }));
		image.observe("error", function(event){
			this.src = '/ezweb/images/not_available.jpg';
		});
		image.observe("abort", function(event){
			this.src = '/ezweb/images/not_available.jpg';
		});
		image_link.appendChild(image);

		// Tags
		var tags = UIUtils.createHTMLElement("div", $H({
            class_name: 'tags'
        })); 
		content.appendChild(tags);
		var important_tags = UIUtils.createHTMLElement("div", $H({
            id: id_ + '_important_tags',
			class_name: 'important_tags'
        })); 
		tags.appendChild(important_tags);
		_tagsToMoreImportantTags(important_tags, 3);

	   	// Depending on capabilities, the add button can be different! 
		// Depending on resource type (Gadget, mashup), the add button can be different!

		if (state.getMashupId()==null){ 
		    //Gadget

		    var bottom_message = gettext('Add Gadget'); 
		    var bottom_class = ''

		    if (this.isContratable(state.getCapabilities())) {
		       bottom_message = gettext('Purchase');
		       bottom_class = 'contratable';
		    }

		    var button = UIUtils.createHTMLElement("button", $H({
		        innerHTML: bottom_message,
			class_name: bottom_class
	            })); 
		
		    button.observe("click", function(event){
				CatalogueFactory.getInstance().addResourceToShowCase(id_);
			},false,"instance_gadget");
		}
		else{ 
		    //Mashup

		    var bottom_message = gettext('Add Mashup'); 
		    var bottom_class = 'add_mashup'

		    if (this.isContratable(state.getCapabilities())) {
		       bottom_message = gettext('Purchase');
		       bottom_class = 'contratable';
		    }

		    var button = UIUtils.createHTMLElement("button", $H({
		        innerHTML: bottom_message,
			class_name: bottom_class
	            }));

		    button.observe("click", function(event){
				CatalogueFactory.getInstance().addMashupResource(id_);
			},false,"instance_mashup");
		}
		content.appendChild(button);
		// BOTTOM
		var bottom = UIUtils.createHTMLElement("div", $H({
			id: id_ + '_bottom',
            class_name: 'bottom'
        }));
		resource.appendChild(bottom);
	}

	this.isContratable = function (capabilities) {
		for (var i=0; i<capabilities.length; i++) {
			var capability = capabilities[i];
			if (capability.name == 'Contratable')
				return capability.value.toLowerCase() == "true";
			else
				return false
		}
	}
	
	this.showInfo = function() {
		$("info_resource_content").innerHTML = '';
		if (state.getMashupId()==null){ //Gadget
			$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({ 
				class_name: 'title_fieldset',
				innerHTML: gettext('Gadget details')
			})));
		}
		else{ //Mashup
			$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({ 
				class_name: 'title_fieldset',
				innerHTML: gettext('Mashup details')
			})));
		}
		var fieldset = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'fieldset'
		}));
		$("info_resource_content").appendChild(fieldset);
		var title = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'title'
		}));
		fieldset.appendChild(title);
		title.appendChild(UIUtils.createHTMLElement("span", $H({ 
			class_name: 'name',
			innerHTML: state.getName()
		})));
		/*title.appendChild(UIUtils.createHTMLElement("span", $H({ 
			class_name: 'version',
			innerHTML: state.getVersion()
		})));*/
		fieldset.appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'vendor',
			innerHTML: state.getVendor()
		})));
		var rating = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'rating'
		}));
		fieldset.appendChild(rating);
		rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
			id: 'rateStatus',
			innerHTML: gettext('Vote Me... ')
		})));
		rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
			id: 'ratingSaved',
			innerHTML: gettext('Vote Saved ')
		})));
		var rate_me = UIUtils.createHTMLElement("span", $H({ 
			id: 'rateMe'
		}));
		rating.appendChild(rate_me);
		var rate_me_array = [];
		rate_me_array[0] = UIUtils.createHTMLElement("a", $H({ 
			id: '_1',
			title: gettext('Ehh...')
		}));
		rate_me_array[1] = UIUtils.createHTMLElement("a", $H({ 
			id: '_2',
			title: gettext('Not Bad')
		}));
		rate_me_array[2] = UIUtils.createHTMLElement("a", $H({ 
			id: '_3',
			title: gettext('Pretty Good')
		}));
		rate_me_array[3] = UIUtils.createHTMLElement("a", $H({ 
			id: '_4',
			title: gettext('Out Standing')
		}));
		rate_me_array[4] = UIUtils.createHTMLElement("a", $H({ 
			id: '_5',
			title: gettext('Awesome!')
		}));
		var rate_me_iterator = $A(rate_me_array);
		rate_me_iterator.each(function(item){
			item.observe("click", function(event){
				UIUtils.sendVotes(this);
			});
			item.observe("mouseover", function(event){
				UIUtils.rating(this);
			});
			item.observe("mouseout", function(event){
				UIUtils.off_rating(this);
			});
			rate_me.appendChild(item);
		});
		rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
			id: 'rateResultStatus',
			innerHTML: gettext('Vote Result:')
		})));
		var rate_result = UIUtils.createHTMLElement("span", $H({ 
			id: 'rateResult'
		}));
		rating.appendChild(rate_result);
		rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
			id: 'res_1',
			title: gettext('Ehh...')
		})));
		rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
			id: 'res_2',
			title: gettext('Not Bad')
		})));
		rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
			id: 'res_3',
			title: gettext('Pretty Good')
		})));
		rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
			id: 'res_4',
			title: gettext('Out Standing')
		})));
		rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
			id: 'res_5',
			title: gettext('Awesome!')
		})));
		rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
			id: 'votes'
		})));
		var image = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'image'
		}));
		fieldset.appendChild(image);
		image.appendChild(UIUtils.createHTMLElement("img", $H({ 
			src: state.getUriImage(),
			alt: state.getName()+ ' ' + state.getVersion()
		})));
		var description = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'description'
		}));
		fieldset.appendChild(description);
		description.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Description') + ':'
		})));
		description.appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'text',
			innerHTML: state.getDescription()
		})));
		var connect = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'connect'
		}));
		fieldset.appendChild(connect);
		connect.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Resource connectivity') + ':'
		})));
		var connect_text = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'text'
		}));
		connect.appendChild(connect_text);
		var events = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'events'
		}));
		connect_text.appendChild(events);
		events.appendChild(UIUtils.createHTMLElement("img", $H({
			title: gettext('All compatible gadgets by events are highlighted in this color'),
			src: '/ezweb/images/resource_compatible_event.png'
		})));
		if (state.getEvents().length != 0)
		{
			var events_link = UIUtils.createHTMLElement("a",$H({
				class_name: 'submit_link',
				title: gettext('Search by all compatible events'),
				innerHTML: gettext('Events') + ':'
			}));
			events_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectEvent', state.getEvents().join(" "));
			});
			events.appendChild(events_link);
		} else {
			events.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: gettext('Events') + ': '
			})));
		}
		_events(events);
		var slots = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'slots'
		}));
		connect_text.appendChild(slots);
		slots.appendChild(UIUtils.createHTMLElement("img", $H({
			title: gettext('All compatible gadgets by slots are highlighted in this color'),
			src: '/ezweb/images/resource_compatible_slot.png'
		})));
		if (state.getSlots().length != 0)
		{
			var slots_link = UIUtils.createHTMLElement("a",$H({
				class_name: 'submit_link',
				title: gettext('Search by all compatible slots'),
				innerHTML: gettext('Slots') + ':'
			}));
			slots_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectSlot', state.getSlots().join(" "));
			});
			slots.appendChild(slots_link);
		} else {
			slots.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: gettext('Slots') + ': '
			})));
		}
		_slots(slots);
		if (state.getSlots().length != 0 || state.getEvents().length != 0) {
			var search_events_slots_div = UIUtils.createHTMLElement("div", $H({
				id: 'search_events_slots_div',
				class_name: 'link',
				style: 'text-align:right;'
			}));
			fieldset.appendChild(search_events_slots_div);
			var search_events_slots_link = UIUtils.createHTMLElement("a", $H({
				id: 'search_events_slots_link',
				class_name: 'submit_link',
				innerHTML: gettext('Search all connectable gadgets')
			}));
			search_events_slots_link.observe("click", function(event){
				UIUtils.searchByGlobalConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getEvents().join(" "), state.getSlots().join(" "));
			});
			search_events_slots_div.appendChild(search_events_slots_link);
		}
		var versions = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'versions'
		}));
		fieldset.appendChild(versions);
		versions.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Selected version') + ': '
		})));
		versions.appendChild(UIUtils.createHTMLElement("span", $H({
			id: 'version_link',
			style: 'color:#0000ff;',
			innerHTML: 'v' + this.getVersion()
		})));
		var version_panel = UIUtils.createHTMLElement("div", $H({
			id: 'version_panel',
			class_name: 'version_panel',
			style: 'display:none;'
		}));
		versions.appendChild(version_panel);
		var title_versions_div = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'version_title'
		}));
		title_versions_div.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Choose the version you want to view') + ': '
		})));
		version_panel.appendChild(title_versions_div);
		_addVersionsToPanel (version_panel);
		var show_versions_div = UIUtils.createHTMLElement("div", $H({
			id: 'view_versions_div',
			class_name: 'link',
			style: 'text-align:right;'
		}));
		fieldset.appendChild(show_versions_div);
		var show_versions_link = UIUtils.createHTMLElement("a", $H({
			id: 'view_versions_link',
			class_name: 'submit_link',
			innerHTML: gettext('Show all versions')
		}));
		show_versions_link.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showVersionPanel();
		});
		show_versions_div.appendChild(show_versions_link);
		var tagcloud = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'tagcloud'
		}));
		fieldset.appendChild(tagcloud);
		tagcloud.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Tagcloud') + ':'
		})));
		var tag_links = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'link',
			id: 'view_tags_links'
		}));
		tagcloud.appendChild(tag_links);
		tag_links.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('All tags')
		})));
		var my_tags = UIUtils.createHTMLElement("a", $H({ 
			innerHTML: gettext('My tags')
		}));
		my_tags.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
		});
		tag_links.appendChild(my_tags);
		var others_tags = UIUtils.createHTMLElement("a", $H({ 
			innerHTML: gettext('Others tags')
		}));
		others_tags.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
		});
		tag_links.appendChild(others_tags);
		var tags = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'tags',
			id: id_ + '_tagcloud'
		}));
		tagcloud.appendChild(tags);
		_tagsToTagcloud(tags, 'description');
		var add_tags_panel = UIUtils.createHTMLElement("div", $H({
			id: 'add_tags_panel',
			class_name: 'new_tags',
			style: 'display:none;'
		}));
		fieldset.appendChild(add_tags_panel);
		add_tags_panel.appendChild(UIUtils.createHTMLElement("div", $H({
			class_name: 'title',
			innerHTML: gettext('New tags')
		})));
		my_tags = UIUtils.createHTMLElement("div", $H({
			id: 'my_tags',
			class_name: 'my_tags'
		}));
		add_tags_panel.appendChild(my_tags);
		var new_tag_text = UIUtils.createHTMLElement("div", $H({
			id: "new_tag_text",
			class_name: "new_tag_text"
		}));
		my_tags.appendChild(new_tag_text);
		var new_tag_text_input = UIUtils.createHTMLElement("input", $H({
			id: 'new_tag_text_input',
			type: 'text',
			maxlength: '20'
		}));
		new_tag_text_input.observe("keyup", function(event){
			UIUtils.enlargeInput(this);
		});
		new_tag_text_input.observe("keypress", function(event){
			UIUtils.onReturn(event,UIUtils.addTag,this);
		});
		new_tag_text.appendChild(new_tag_text_input);
		add_tags_panel.appendChild(UIUtils.createHTMLElement("div", $H({
			id: 'tag_alert',
			class_name: 'message_error'
		})));
		var buttons = UIUtils.createHTMLElement("div", $H({
			class_name: 'buttons'
		}));
		add_tags_panel.appendChild(buttons);
		var link_tag = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Tag')
		}));
		link_tag.observe("click", function(event){
			UIUtils.sendTags();
		});
		buttons.appendChild(link_tag);
		var link_delete = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Delete all')
		}));
		link_delete.observe("click", function(event){
			UIUtils.removeAllTags();
		});
		buttons.appendChild(link_delete);
		var add_tags_link = UIUtils.createHTMLElement("div", $H({
			id: 'add_tags_link',
			class_name: 'link',
			style: 'text-align:right;'
		}));
		fieldset.appendChild(add_tags_link);
		var add_tags_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Tag the resource')
		}));
		add_tags_submit_link.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud('mytags');
		});
		add_tags_link.appendChild(add_tags_submit_link);
		var access_wiki_link = UIUtils.createHTMLElement("div", $H({
			id: 'access_wiki_link',
			class_name: 'link'
		}));
		fieldset.appendChild(access_wiki_link);
		var access_wiki_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			href: state.getUriWiki(),
			target: '_blank',
			innerHTML: gettext('Access to the Wiki')
		}));
		access_wiki_link.appendChild(access_wiki_submit_link);
		var access_template_link = UIUtils.createHTMLElement("div", $H({
			id: 'access_template_link',
			class_name: 'link'
		}));
		fieldset.appendChild(access_template_link);
		var access_template_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			href: state.getUriTemplate(),
			target: '_blank',
			innerHTML: gettext('Access to the Template')
		}));
		access_template_link.appendChild(access_template_submit_link);
		if (state.getMashupId()==null){ //it is a Gadget (not visible in Mashups)
			var update_code_link = UIUtils.createHTMLElement("div", $H({
				id: 'update_code_link',
				class_name: 'link'
			}));
			fieldset.appendChild(update_code_link);
			var update_code_submit_link = UIUtils.createHTMLElement("a", $H({
				class_name: 'submit_link',
				innerHTML: gettext('Update code')
			}));
			update_code_submit_link.observe("click", function(event){
				UIUtils.updateGadgetXHTML();
			});
			update_code_link.appendChild(update_code_submit_link);
		}
		var delete_gadget_link = UIUtils.createHTMLElement("div", $H({
			id: 'delete_gadget_link',
			class_name: 'link'
		}));
		fieldset.appendChild(delete_gadget_link);
		_deleteGadget(delete_gadget_link);
		if (state.getMashupId()==null){ //add gadget button
			var add_gadget_button = UIUtils.createHTMLElement("button", $H({
				id: 'add_gadget_button',
				class_name: 'add_gadget',
				style: 'text-align:center;',
				innerHTML: gettext('Add Gadget')
			}));
			add_gadget_button.observe("click", function(event){
				CatalogueFactory.getInstance().addResourceToShowCase(UIUtils.getSelectedResource());
			},false,"instance_gadget");
		}
		else{ //add mashup button
			var add_gadget_button = UIUtils.createHTMLElement("button", $H({
				id: 'add_gadget_button',
				class_name: 'add_mashup',
				style: 'text-align:center;',
				innerHTML: gettext('Add Mashup')
			}));
			add_gadget_button.observe("click", function(event){
				CatalogueFactory.getInstance().addMashupResource(UIUtils.getSelectedResource());
			},false,"instance_mashup");
		}
		$("info_resource_content").appendChild(add_gadget_button);
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({
			id: 'content_bottom_margin'
		})));
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({
			class_name: 'bottom'
		})));
		_rateResource();
	}

	this.updateTags = function()
	{
		_tagsToMoreImportantTags($(id + "_important_tags"), 3);
		if ((id == UIUtils.selectedResource) &&  ($(id + "_tagcloud") != null))
		{
			_tagsToTagcloud($(id + "_tagcloud"), 'description' , {tags:'mytags'});
		}
	}

	this.changeTagcloud = function(type){
		var option = {};
		$("view_tags_links").innerHTML = "";
		option = {tags: type};
		switch(type){
			case "mytags":
				var all_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('All tags')
				}));
				all_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("all");
				});
				$("view_tags_links").appendChild(all_tags);
				$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
					innerHTML: gettext('My tags')
				})));
				var others_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('Others tags')
				}));
				others_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
				});
				$("view_tags_links").appendChild(others_tags);
				UIUtils.hidde("add_tags_link");
				UIUtils.show("add_tags_panel");
				$("new_tag_text_input").value="";
				$("new_tag_text_input").size=5;
				$("new_tag_text_input").focus();
				break;
			case "others":
				var all_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('All tags')
				}));
				all_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("all");
				});
				$("view_tags_links").appendChild(all_tags);
				var my_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('My tags')
				}));
				my_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
				});
				$("view_tags_links").appendChild(my_tags);
				$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
					innerHTML: gettext('Others tags')
				})));
				UIUtils.show("add_tags_link");
				UIUtils.hidde("add_tags_panel");
				break;
			case "all":
			default:
				$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
					innerHTML: gettext('All tags')
				})));
				var my_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('My tags')
				}));
				my_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
				});
				$("view_tags_links").appendChild(my_tags);
				var others_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('Others tags')
				}));
				others_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
				});
				$("view_tags_links").appendChild(others_tags);
				UIUtils.show("add_tags_link");
				UIUtils.hidde("add_tags_panel");
		}
		if ($(id + '_tagcloud'))
		{
			_tagsToTagcloud($(id + '_tagcloud'), 'description', option);
		}
	}

	this.showVersionPanel = function(){
		if ($("version_panel").style.display == 'none'){
			$("version_panel").style.display = 'block';
			$("view_versions_link").innerHTML = gettext('Hide all versions'); 
		}else{
			$("version_panel").style.display = 'none'
			$("view_versions_link").innerHTML = gettext('Show all versions');
		}
	}

	// *******************
	//  PRIVATE FUNCTIONS
	// *******************
	
	var _getFirstTagNonRepeat = function(list1_, list2_) {
		for (var i=0; i<list1_.length; i++) {
			if (!_containsTag(list1_[i], list2_)) return list1_[i];
		}
		return;
	}
	
	var _containsTag = function(element_, list_)
	{
		for (var i=0; i<list_.length; i++) {
			if (element_.equals(list_[i])) {
				return true;
			}
		}
		return false;
	}
	
	var _tagsToMoreImportantTags = function(parent, tagsNumber_){
		var tagsHTML = '';
		var tagsAux = state.getTags();
		var moreImportantTags = [];
		
		var tagNumber = Math.min(tagsNumber_, tagsAux.length);
		for (var i=0; i<tagNumber; i++){
			var firstTag = _getFirstTagNonRepeat(tagsAux, moreImportantTags);
			if (firstTag){
				moreImportantTags[i] = firstTag;
				for (var j=0; j<tagsAux.length; j++){
				    if ((!_containsTag(tagsAux[j], moreImportantTags)) && (moreImportantTags[i].compareTo(tagsAux[j]) < 0)) {
					    moreImportantTags[i] = tagsAux[j];
				    }
			    }
			} else {
				break;
			}
		}
		
		parent.innerHTML='';
		for (var i=0; i<moreImportantTags.length; i++)
		{
			parent.appendChild(moreImportantTags[i].tagToHTML())
			if (i<(((moreImportantTags.length>tagsNumber_)?tagsNumber_:moreImportantTags.length)-1)){
				parent.appendChild(UIUtils.createHTMLElement("span", $H({
            		innerHTML: ', '
        		})));
			}
		}
	}

	var _events = function(parent){
		parent.innerHMTL = '';
		var eventsAux = state.getEvents();
		
		for (var i=0; i<eventsAux.length; i++)
		{
			var tag = UIUtils.createHTMLElement("span", $H({ 
				class_name: 'multiple_size_tag'
			}));
			parent.appendChild(tag);
			var tag_link = UIUtils.createHTMLElement("a", $H({ 
				title: gettext('Search by ') + eventsAux[i],
				innerHTML: eventsAux[i]
			}));
			tag_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectEvent', this.innerHTML);
			});
			tag.appendChild(tag_link);
			tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: ((i<(eventsAux.length-1))?",":"")
			})));
		}
	}
	
	var _addVersionsToPanel = function (parent){
		
		var sortByMin = function (a, b){
			var x = parseFloat(a);
			var y = parseFloat(b);
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		} 
		parent.innerHMTL = '';
		var versions = state.getAllVersions().sort(sortByMin);
		for (var i=0; i<versions.length; i++){
			var ver_element = UIUtils.createHTMLElement("span", $H({ 
			}));
			parent.appendChild(ver_element);
			if (versions[i] == state.getVersion()){
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: 'v' + versions[i]
				})));					
			}else{
				var ver_link = UIUtils.createHTMLElement("a", $H({ 
					title: gettext('Select this version as preferred version'),
					innerHTML: 'v' + versions[i]
				}));
				ver_link.observe("click", function(event){
					UIUtils.selectedVersion = event.currentTarget.innerHTML.substring(1);
					UIUtils.setPreferredGadgetVersion(UIUtils.selectedVersion);
				});
				ver_element.appendChild(ver_link);
			}
			if (state.getAddedBy() == 'Yes') {
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: " "
				})));
				var delete_img = UIUtils.createHTMLElement("img", $H({
					title: gettext('Delete this version of the gadget'),
					id: "deleteIcon_v" + versions[i],
					src: '/ezweb/images/cancel_gray.png',
					style: 'border:none;',
					name: versions[i]
				}));
				delete_img.observe("click", function(event){
					UIUtils.selectedVersion = event.currentTarget.getAttribute('name')
					LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
				});
				delete_img.observe("mouseover", function(event){
					this.src='/ezweb/images/delete.png';
				});
				delete_img.observe("mouseout", function(event){
					this.src='/ezweb/images/cancel_gray.png';
				});
				ver_element.appendChild(delete_img);
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: " "
				})));
			}else{
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: ((i<(versions.length-1))?", ":"")
				})));
			}
		}
	}
	
	var _deleteGadget = function(parent){
		var addedBy = state.getAddedBy();
		parent.innerHTML = '';
		if (addedBy == 'Yes'){
			var submit_link = UIUtils.createHTMLElement("a", $H({
				class_name: 'submit_link',
				innerHTML: gettext('Delete')
			}));
			submit_link.observe("click", function(event){
				UIUtils.deleteGadget(id);
			});
			parent.appendChild(submit_link);
    	}
	}
	
	var _slots = function(parent){
		parent.innerHMTL = '';
		var slotsAux = state.getSlots();
		
		for (var i=0; i<slotsAux.length; i++)
		{
			var tag = UIUtils.createHTMLElement("span", $H({ 
				class_name: 'multiple_size_tag'
			}));
			parent.appendChild(tag);
			var tag_link = UIUtils.createHTMLElement("a", $H({ 
				title: gettext('Search by ') + slotsAux[i],
				innerHTML: slotsAux[i]
			}));
			tag_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectSlot', this.innerHTML);
			});
			tag.appendChild(tag_link);
			tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: ((i<(slotsAux.length-1))?",":"")
			})));
		}
	}

	var _tagsToTagcloud = function(parent, loc){
		parent.innerHTML = "";
		var tagsAux = state.getTags();
		var option = arguments[2] || {tags:'all'};
			
		switch(option.tags) {
			case 'all':
				for (var i=0; i<tagsAux.length; i++) {
					var tag = UIUtils.createHTMLElement("span", $H({ 
						class_name: 'multiple_size_tag'
					}));
					tag.appendChild(tagsAux[i].tagToTypedHTML());
					tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
						innerHTML: ((i<(tagsAux.length-1))?",":"")
					})));
					parent.appendChild(tag);
				}
				break;
			case 'mytags':
				var tags = [];
				var j = 0;
				for (var i=0; i<tagsAux.length; i++) {
					if (tagsAux[i].getAdded_by() == 'Yes')
					{
						tags[j] = tagsAux[i];
						j++;
					}
				}
				for (var i=0; i<tags.length; i++) {
					var tag = UIUtils.createHTMLElement("span", $H({ 
						class_name: 'multiple_size_tag'
					}));
					tag.appendChild(tags[i].tagToTypedHTML(option));
					var tag_link = UIUtils.createHTMLElement("a", $H({ 
						title: gettext('Delete tag')
					}));
					tag_link.observe("click", function(event){
						UIUtils.removeTagUser(this.parentNode.firstChild.innerHTML, id);
					});
					tag.appendChild(tag_link);
					var tag_img = UIUtils.createHTMLElement("img", $H({
						id: id + "_deleteIcon_" + i + "_" + loc,
						src: '/ezweb/images/cancel_gray.png',
						style: 'border:none;',
						name: 'op1'
					}));
					tag_img.observe("mouseover", function(event){
						this.src='/ezweb/images/delete.png';
					});
					tag_img.observe("mouseout", function(event){
						this.src='/ezweb/images/cancel_gray.png';
					});
					tag_link.appendChild(tag_img);
					tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
						innerHTML: ((i<(tags.length-1))?",":"")
					})));
					parent.appendChild(tag);
				}
				break;
			case 'others':
			default:
				var tags = [];
				var j = 0;
				for (var i=0; i<tagsAux.length; i++) {
					if (tagsAux[i].getAdded_by() == 'No' || tagsAux[i].getAppearances()>1)
					{
						tags[j] = tagsAux[i];
						j++;
					}
				}
				for (var i=0; i<tags.length; i++) {
					var tag = UIUtils.createHTMLElement("span", $H({ 
						class_name: 'multiple_size_tag'
					}));
					tag.appendChild(tags[i].tagToTypedHTML());
					tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
						innerHTML: ((i<(tags.length-1))?",":"")
					})));
					parent.appendChild(tag);
				}
		}
	}

	var _rateResource = function()
	{
		var vote = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getUserVote();
		var popularity = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getPopularity();
		if (vote!=0)
		{
			$("rateStatus").innerHTML = $("ratingSaved").innerHTML;
			for (var i = 1; i<=vote; i++)
			{
				$("_"+i).className = "on";
			}
		}
		if (popularity!=null)
		{
			var i = 1
			for (i; i<=popularity; i++)
			{
				$("res_"+i).className = "on";
			}
			if ((popularity%1)!=0)
			{
				$("res_"+i).className = "md";
				i++;
			}
			for (i; i<=5; i++)
			{
				$("res_"+i).className = "";
			}
		}
		$("votes").innerHTML = state.getVotes()+ " " + gettext ('votes');
	}


	var _createResource = function(urlTemplate_) {
		
		// ******************
		//  CALLBACK METHODS 
		// ******************
	
		// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
		
		onError = function(transport) {
			msg = interpolate(gettext("Error creating the resource: %(errorMsg)s."), {errorMsg: transport.status}, true);
			LogManagerFactory.getInstance().log(msg);
			// Process
		}
		
		loadResource = function(transport) {
			var response = transport.responseXML;
			state = new ResourceState(response);
			this.paint();
		}
		
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		// Post Resource to PersistenceEngine. Asyncrhonous call!
		persistenceEngine.send_post(url_Server, url_, this, loadResource, onError);
	}
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************

	var state = null;
	var id = id_;
	var tagger = new Tagger();
	var versionSelected = null;
	
	if (urlTemplate_ != null) {
		_createResource(urlTemplate_);
	}
	else {
		state = new ResourceState(resourceJSON_);
		this.paint();
	}
}

  //////////////////////////////////////////////
  //       RESOURCESTATE (State Object)       //
  //////////////////////////////////////////////
  
	function ResourceState(resourceJSON_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var vendor = null;
	var name = null;
	var version = null;
	var description = null;
	var uriImage = null;
	var uriWiki = null;
	var mashupId = null;
	var uriTemplate = null;
	var addedBy = null;
	var allVersions = [];
	var tags = [];
	var slots = [];
	var events = [];
	var votes = null;
	var popularity = null;
	var userVote = null;
	var capabilities = [];

	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return vendor;}
	this.getName = function() { return name;}
	this.getVersion = function() { return version;}
	this.getAllVersions = function() { return allVersions;}
	this.getDescription = function() { return description;}
	this.getUriImage = function() { return uriImage;}
	this.getUriTemplate = function() { return uriTemplate;}
	this.getUriWiki = function() { return uriWiki;}
	this.getMashupId = function() { return mashupId;}	
	this.getAddedBy = function() { return addedBy;}

	this.setTags = function(tagsJSON_) {
		tags.clear();
		for (var i=0; i<tagsJSON_.length; i++)
		{
			tags.push(new Tag(tagsJSON_[i]));
		}
	}
	
	this.addTag = function(tag) { 
		tags.push(new Tag(tag)); 
	}
	
	this.setSlots = function(slotsJSON_) {
		slots.clear();
		for (var i=0; i<slotsJSON_.length; i++)
		{
			slots.push(slotsJSON_[i].friendcode);
		}
	}
	
	this.setEvents = function(eventsJSON_) {
		events.clear();
		for (var i=0; i<eventsJSON_.length; i++)
		{
			events.push(eventsJSON_[i].friendcode);
		}
	}

	this.setVotes = function(voteDataJSON_) {
		votes = voteDataJSON_.voteData[0].votes_number;
		userVote = voteDataJSON_.voteData[0].user_vote;
		popularity = voteDataJSON_.voteData[0].popularity;
	}

	
	this.getTags = function() { return tags;}
	this.getSlots = function() { return slots;}
	this.getEvents = function() { return events;}
	this.getVotes = function() {return votes;}
	this.getUserVote = function() {return userVote;}
	this.getPopularity = function() {return popularity;}
	this.getCapabilities = function() {return capabilities; } 

	// Parsing JSON Resource
	// Constructing the structure
	
	vendor = resourceJSON_.vendor;
	name = resourceJSON_.name;
	version = resourceJSON_.version;
	allVersions = resourceJSON_.versions;
	description = resourceJSON_.description;
	uriImage = resourceJSON_.uriImage;
	uriWiki = resourceJSON_.uriWiki;
	mashupId = resourceJSON_.mashupId;
	addedBy = resourceJSON_.added_by_user;
	uriTemplate = resourceJSON_.uriTemplate;
	this.setEvents(resourceJSON_.events);
	this.setSlots(resourceJSON_.slots);
	this.setTags(resourceJSON_.tags);
	votes = resourceJSON_.votes[0].votes_number;
	userVote = resourceJSON_.votes[0].user_vote;
	popularity = resourceJSON_.votes[0].popularity;	
	capabilities = resourceJSON_.capabilities;
}

function Tagger(){
	
	var _this = this;
	var tags  = $H();
	var new_tag_id = 0;
	
	this.addTag = function(tag_) {
		if (tag_.length < 3) {
			$("tag_alert").style.display="block";
			UIUtils.getError($("tag_alert"),gettext ("Tags must have at least three characters."));
		}
		else {
			if (!containsTag(tag_)) {
				var id = 'new_tag_' + new_tag_id;
				new_tag_id++;
				tags[id] = tag_;
				paintTag(id, tag_);
				$("tag_alert").style.display='none';
			}
		}
	}
	
	this.addGlobalTag = function(tag_) {
		if (!containsTag(tag_)) {
			var id = 'new_tag_' + tags.keys().length;
			tags[id] = tag_;
		}
	}

	this.getTags = function(){
		return tags;
	}

	this.removeTag = function(id_) { 
		tags.remove(id_);
		eraserTag(id_);
	}
	
	this.removeAll = function() {
		tags = $H();
		new_tag_id = 0;
		if(!UIUtils.tagmode)eraserAll();
	}

	this.sendTags = function(url, resourceURI, resource)
	{
		if (tags.keys().length>0)
		{
			var onError = function(transport) {
				var msg = interpolate(gettext("Error sending tags: %(errorMsg)s."), {errorMsg: transport.status}, true);
				LogManagerFactory.getInstance().log(msg);
				// Process
			}
			
			var loadTags = function(transport) {
				var responseJSON = transport.responseText;
				var jsonResourceList = eval ('(' + responseJSON + ')');
				resource.setTags(jsonResourceList.tagList);
				
				if (!UIUtils.repaintCatalogue) 
					resource.updateTags();
				if (UIUtils.tagmode) 
					CatalogueFactory.getInstance().updateGlobalTags();
			}
			
			var elements = tags.values();
			var xmlDoc;
			if (window.ActiveXObject)
				xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			else if (document.implementation)
				xmlDoc = document.implementation.createDocument("","",null);
			var tagsXML = xmlDoc.createElement("Tags");
			xmlDoc.appendChild(tagsXML);
			for (var i=0; i<elements.length; i++)
			{
				var tagXML = xmlDoc.createElement("Tag");
				tagXML.appendChild(document.createTextNode(elements[i]));
				tagsXML.appendChild(tagXML);
			}
			var param = {tags_xml: (new XMLSerializer()).serializeToString(xmlDoc)};

			PersistenceEngineFactory.getInstance().send_post(url + resourceURI, param, this, loadTags, onError)
			_this.removeAll();
		}
	}
	
	this.removeTagUser = function(url, resourceURI,id)
	{
		var resource = CatalogueFactory.getInstance().getResource(id);

		var onError = function(transport) {
			var msg = interpolate(gettext("Error removing tag: %(errorMsg)s."), {errorMsg: transport.status}, true);
			LogManagerFactory.getInstance().log(msg);
			// Process
		}
		
		var loadTags = function(transport) {
			var responseJSON = transport.responseText;
			var jsonResourceList = eval ('(' + responseJSON + ')');
			resource.setTags(jsonResourceList.tagList);
			resource.updateTags();
			if (UIUtils.tagmode) 
				CatalogueFactory.getInstance().updateGlobalTags();
		}
		
		PersistenceEngineFactory.getInstance().send_delete(url + resourceURI, this, loadTags, onError);
	}

	var containsTag = function(tag_) {
		var values = tags.values();
		for (var i=0; i<values.length; i++){
			if (values[i] == tag_) {
				return true;
			}
		}
		return false;
	}
	
	var paintTag = function(id_, tag_) {
		var newTag = UIUtils.createHTMLElement("div", $H({ id: id_, class_name: "new_tag" }));
		newTag.observe("mouseover", function(event) {
			$("button_disable_" + id_).hide();
			$("button_enable_" + id_).show();
		});
		newTag.observe("mouseout", function(event) {
			$("button_enable_" + id_).hide();
			$("button_disable_" + id_).show();
		});
		var value = UIUtils.createHTMLElement("span", $H({ innerHTML: tag_ }));
		var disable = UIUtils.createHTMLElement("span", $H({ id: "button_disable_" + id_ }));
		var img_disable = UIUtils.createHTMLElement("img", $H({ src: '/ezweb/images/cancel_gray.png' }));
		disable.appendChild(img_disable);
		var enable = UIUtils.createHTMLElement("span",  $H({ id: "button_enable_" + id_ }));
		enable.hide();
		enable.observe("click", function(event) {
			UIUtils.removeTag(id_);
		});
		var img_enable = UIUtils.createHTMLElement("img", $H({ src: '/ezweb/images/delete.png' }));
		enable.appendChild(img_enable);
		var separator = UIUtils.createHTMLElement("span", $H({ innerHTML: "," }));
		newTag.appendChild(value);
		newTag.appendChild(disable);
		newTag.appendChild(enable);
		newTag.appendChild(separator);
		$("my_tags").insertBefore(newTag, $("new_tag_text"));
	}
	
	var eraserTag = function(id_) {
		if(!UIUtils.tagmode){
			var parentHTML = $("my_tags");
			var tagHTML = $(id_);
			parentHTML.removeChild(tagHTML);
		}
	}
	
	var eraserAll = function() {
		var parentHTML = $("my_tags");
		while(parentHTML.childNodes.length > 1)
		{
			parentHTML.removeChild(parentHTML.childNodes[0]);
		}
	} 
}


function Tag(tagJSON_)
{
	var state = new StateTag(tagJSON_);
	
	this.getIdentifier = function() { return state.getIdentifier(); }
	this.getValue = function() { return state.getValue(); }
	this.getAdded_by = function() { return state.getAdded_by(); }
	this.getAppearances = function() { return state.getAppearances(); }
	
    this.tagToHTML = function(){
        var link = UIUtils.createHTMLElement("a", $H({
            title: gettext('Search by ') + state.getValue(),
            innerHTML: state.getValue()
        }));
        link.observe("click", function(event){
            UIUtils.searchByTag(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getValue());
        });
        return link;
    }
	
	this.tagToTypedHTML = function() {
		var option = arguments[0] || {tags:'undefined'};
		
		var className_;
		if (state.getAppearances()<5) className_ = 'tag_type_1';
		else if (state.getAppearances()<15) className_ = 'tag_type_2';
		else if (state.getAppearances()<25) className_ = 'tag_type_3';
		else className_ = 'tag_type_4';
		
		var title_ = gettext('Search by ') + state.getValue();
		var value_ =  state.getValue() + ((option.tags == 'undefined')?" (" + state.getAppearances() + ")":"");
		
		var link = UIUtils.createHTMLElement("a", $H({ class_name: className_, title: title_, innerHTML: value_ }));
		link.observe("click", function(event) {
			UIUtils.searchByTag(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getValue());
		});
		return link;
	}
	
	this.equals = function(tag_) {
		return ((tag_.getValue() == state.getValue()) && (tag_.getAppearances() == state.getAppearances()));
	}
	
	this.compareTo = function(tag_) {
		if (state.getAppearances() < (tag_.getAppearances())) return -1;
		else if	(state.getAppearances() > (tag_.getAppearances())) return 1;
		else return 0;
	}
}

function StateTag(tagJSON_) 
{
	var identifier = tagJSON_.id;
    var value = tagJSON_.value;
	var appearances = tagJSON_.appearances;
	var added_by = tagJSON_.added_by;
	
	this.getIdentifier = function() {return identifier;}
	this.getValue = function() { return value; }
	this.getAppearances = function() { return appearances; } 
	this.getAdded_by = function() { return added_by; }
}

//Class for managing a drop down menu whose HTML code is in templates/index.html.
//The options may be created either by default in the HTML code or dinamically with the addOption function
function DropDownMenu(idMenu_, parentMenu) {
	// Allow calling this constructor without arguments for allowing heritage
	if (arguments.length == 0)
		return;

	//Constructor
	this.idMenu = idMenu_;      // menu: menu element in the HTLM code (<div>)
	this.menu = $(this.idMenu);
	this.position;              // position related to the launcher
	this.x; this.y;             // start position
	this.submenu = $$('#'+this.idMenu+' .submenu')[0];
	this.parentMenu = parentMenu;
	this.option_id = 0;         // identifier for options
	this.margin = 5;
	
	// In Firefox 3.0 is necessary to increase the z-index of submenus
	if (this.parentMenu != null) {
		if ((this.parentMenu.menu.style.zIndex == "") || isNaN(this.parentMenu.menu.style.zIndex)) {
			this.menu.style.zIndex = 5;
		} else {
			this.menu.style.zIndex = parseInt(this.parentMenu.menu.style.zIndex) + 1;
		}
	}
}

//Calculates the absolute position of the menu according to the point from which it is launched
//The menu can be displayed either on the right or left of the launcher point
DropDownMenu.prototype.calculatePosition = function() {
	if(this.position.indexOf('left') != -1) {
		var smWidth = this.menu.getWidth();
		this.x -= smWidth;
	}
	if(this.position.indexOf('top') != -1) {
		var smHeight = this.menu.getHeight();
		this.y -= smHeight;
	}
	//set position
	this.menu.style.top = this.y +"px";
	this.menu.style.left = this.x +"px";
	}

//Adds an option to the menu created from the HTML in the specified position (starting on 0).
//imgPath to be shown beside the option (may be null)-- option text -- event:function called on clicking
DropDownMenu.prototype.addOption = function(imgPath, option, event, position) {
	var optionClass = 'option underlined';
	var optionList = $$('#'+this.idMenu+'>.option');
	if(position == optionList.length && position != 0){//new last option
		optionList[optionList.length-1].className='option underlined';
		optionClass = 'option';
	} else if (position == optionList.length && position == 0) {
		optionClass = 'option';
	}

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "'+optionClass+'">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>'+gettext(option)+'</span></div>';
	try {
		if(optionList.length > 0) {
			if(position == 0) {
				new Insertion.Before(optionList[position], opHtml);
			} else {
				new Insertion.After(optionList[position-1], opHtml);
			}
		} else {
			new Insertion.Bottom(this.menu, opHtml);
		}
		var newOption = $(opId);
		Event.observe(newOption, 'click', event, false, option);
		this.option_id++;
	} catch(e) {
		return null;
	}
	return opId;
}

//removes an option
DropDownMenu.prototype.removeOption = function(opId) {
	var option = $(opId).remove();
	if (!option.hasClassName('underlined')) {
		var lastOption = $$('#'+this.idMenu+ ' .option:last-child')[0];
		if (lastOption) {//last option doesn't have a underline
			lastOption.removeClassName('underlined');
		}
	}
}

//updates an option
DropDownMenu.prototype.updateOption = function(opId, imgPath, option, handler) {
	var old=$(opId);
	var opHtml='<div id="'+ opId +'" class = "option">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>'+gettext(option)+'</span>';
	new Insertion.Before(old, opHtml);
	old=old.remove();
	var newOp = $(opId);
	if(old.hasClassName('underlined')){
		newOp.toggleClassName('underlined');
	}
	Event.observe(newOp, 'click', handler);
}

//submenu operations
DropDownMenu.prototype.addOptionToSubmenu = function(imgPath, option, event) {
	var lastOption = $$('#'+this.idMenu+ ' .submenu div:last-child')[0];

	if (lastOption) {//last option doesn't have a underline
		lastOption.toggleClassName('underlined');
	}
	//create the HTML code for the option and insert it in the menu
	var opId='secondary_op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "option">';
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>'+option+'</span></div>';
	new Insertion.Bottom(this.submenu, opHtml);
	lastOption = $(opId);
	Event.observe(lastOption, 'click', event);
	this.option_id++;

	return opId;
}

//removes an option
DropDownMenu.prototype.removeSecondaryOption = function(opId) {
	var option=$(opId).remove();
	if(!option.hasClassName('underlined')) {
		var lastOption = $$('#'+this.idMenu+ ' .submenu div:last-child')[0];
		if (lastOption) {//last option doesn't have a underline
			lastOption.toggleClassName('underlined');
		}
	}
}

//hides the menu and changes the image of the launcher (in case it has to)
DropDownMenu.prototype.hide = function () {
	this.menu.style.display="none";
	//if it's a submenu
	if(this.parentMenu)
		this.parentMenu.hide();
}

DropDownMenu.prototype.remove = function () {
		Element.remove(this.menu);
}

//shows the menu (calling showMenu function)
DropDownMenu.prototype.show = function (position, x, y) {
	this.position = position.split('-');
	this.x = x;
	this.y = y;
	this.calculatePosition();
	this.menu.style.display="block";
}

//Clears the menu options
DropDownMenu.prototype.clearOptions = function() {
	this.menu.update();
}

//Clears the submenu options
DropDownMenu.prototype.clearSubmenuOptions = function() {
	this.submenu.update();
}


// Specific drop down menu for the menu of channel filters (inheritance from DropDownMenu)
function FilterDropDownMenu(idMenu_, parentMenu) {
	DropDownMenu.call(this, idMenu_, parentMenu);
	
	this.optionHelps = new Hash();
}

// Defining inheritance
FilterDropDownMenu.prototype = new DropDownMenu();


// Adds a option (like DropDownMenu method) with a help buttom
FilterDropDownMenu.prototype.addOptionWithHelp = function(imgPath, option, helpText, event, position) {
	var optionClass = 'option underlined';
	var optionList = $$('#'+this.idMenu+'>.option');
	if (position == optionList.length && position != 0) {//new last option
		optionList[optionList.length-1].className='option underlined';
		optionClass = 'option';
	} else if (position == optionList.length && position == 0)
		optionClass = 'option';

	//create the HTML code for the option and insert it in the menu
	var opId='op_'+this.idMenu+'_'+this.option_id;
	var opHtml = '<div id="'+ opId +'" class = "'+optionClass+'">';
	
	//creates the elements for the left side
	if (imgPath) {
		opHtml += '<img src="'+imgPath+'"/>';
	}
	opHtml += '<span>'+gettext(option)+'</span>';
	
	//creates the element for the rigth side (help buttom)
	opHtml += '<input class="help_buttom" type="button"/></div>';
	
	//inserts the option in the menu
	try {
		if (optionList.length >0) {
			if (position == 0)
				new Insertion.Before(optionList[position], opHtml);
			else
				new Insertion.After(optionList[position-1], opHtml);
		} else {
			new Insertion.Bottom(this.menu, opHtml);
		}
		var newOption = $(opId);
		newOption.style.paddingRight = '25px';
		Event.observe(newOption, 'click', event);
		
		// Creates the help "pop-up" like a menu
		var idHelpMenu = 'helpFor_' + opId;
		var helpMenuHtml = '<div id="' + idHelpMenu + '" class="drop_down_menu"></div></div>';
		new Insertion.After($('menu_layer'), helpMenuHtml);
		helpMenu = new DropDownMenu(idHelpMenu, this);
		var helpOpId = helpMenu.addOption(null, helpText, function(){}, 0);

		// Sets the help style
		var helpOpElement = helpMenu.menu.getElementsBySelector('#' + helpOpId)[0]
		helpOpElement.style.fontSize = '80%';
		helpOpElement.style.padding = '0px';
		helpOpElement.style.whiteSpace = 'pre';
		helpOpElement.style.cursor = 'default';

		// Adds the help launcher
		var helpButtom = newOption.getElementsBySelector('.help_buttom')[0]
		Event.observe(helpButtom, 'click',
			function(e){
				Event.stop(e);
				var allHelps = $$('div[id^=helpFor_]');
				var helpShown = null;
				var i = 0;
				while ((i < allHelps.length) && (helpShown == null)) {
					if (allHelps[i].style.display == 'block'){
						allHelps[i].style.display = 'none';
						helpShown = allHelps[i];
					}
					i++;
				}
				if ((helpShown == null) || helpShown != this.menu) {
					LayoutManagerFactory.getInstance().showDropDownMenu('filterHelp', this, Event.pointerX(e), Event.pointerY(e));
				}
			}.bind(helpMenu)
		);

		this.optionHelps[idHelpMenu] = helpMenu;
		this.option_id++;
	} catch(e) {
		return null;
	}

	return opId;
}

FilterDropDownMenu.prototype.removeOption = function(opId) {
	DropDownMenu.prototype.removeOption.call(this, opId);

	var idHelpMenu = 'helpFor_' + opId;
	this.optionHelps[idHelpMenu].remove();
}


FilterDropDownMenu.prototype.remove = function () {
	// Removes all the helps
	var helpIds = this.optionHelps.keys();
	for (var i = 0; i < helpIds.length; i++) {
		this.optionHelps[helpIds[i]].remove();
	}

	DropDownMenu.prototype.remove.call(this);
}


/**
 * @class
 * Color Drop Down Menu. This Drop Down
 */
function ColorDropDownMenu(idColorMenu, parentMenu, onClick, options) {
	options = options != undefined ? options : {};

	var menuHTML = '<div id="'+idColorMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);

	DropDownMenu.call(this, idColorMenu, parentMenu);
	this.menu.addClassName("color_menu");

	this.currentRow = document.createElement("div");
	this.currentRow.className = "row";
	this.menu.appendChild(this.currentRow);
	this.clearer = document.createElement("div");
	this.clearer.className = "floatclearer";
	this.currentRow.appendChild(this.clearer);

	var onMouseOver = options['onMouseOver'] != undefined ? options['onMouseOver'] : function(){};

	// On Mouse Over
	this._onMouseOver = function(e) {
		var windowStyle = window.getComputedStyle(e.target, null);

		var newColor = windowStyle.getPropertyCSSValue("background-color").
		               getRGBColorValue();

		onMouseOver(newColor);
	}

	// On Mouse Out
	var onMouseOut = options['onMouseOut'] != undefined ? options['onMouseOut'] : function(){};

	this._onMouseOut = function(e) {
		onMouseOut();
	}

	this._onClick = function(e) {
		var windowStyle = window.getComputedStyle(e.target, null);

		var newColor = windowStyle.getPropertyCSSValue("background-color").
		               getRGBColorValue();
		onClick(newColor);
		LayoutManagerFactory.getInstance().hideCover();
	}
}
ColorDropDownMenu.prototype = new DropDownMenu();

ColorDropDownMenu.prototype.appendColor = function(color) {
	var cell = document.createElement("div");
	cell.className = "color_button";
	cell.style.background = "#" + color;
	this.currentRow.insertBefore(cell, this.clearer);

	cell.observe('mouseover', this._onMouseOver, true);
	cell.observe('mouseout', this._onMouseOut, true);
	cell.observe('click', this._onClick, true);
}

ColorDropDownMenu.prototype.show = function (position, x, y) {
	DropDownMenu.prototype.show.apply(this, arguments);

	// This is needed for Firefox 2
	this.menu.style.height = this.currentRow.offsetHeight + "px";
}

ColorDropDownMenu.prototype.addOption = function() {
}

ColorDropDownMenu.prototype.removeOption = function() {
}

//Hierachy for managing a window menu whose HTML code is in templates/index.html.
function WindowMenu(){
	//constructor
	this.htmlElement;		//window HTML element
	this.titleElement;		//title gap
	this.msgElement;		// message gap
	this.element;			//workspace or tab
	this.button; 			//window operation button
	this.operationHandler;	//window handler
	this.title;				//title

	//displays a message
	WindowMenu.prototype.setMsg = function (msg){
		this.msgElement.update(msg);
	}
	//Calculates a usable absolute position for the window
	WindowMenu.prototype.calculatePosition = function(){
		var coordenates = [];
		
		coordenates[1] = BrowserUtilsFactory.getInstance().getHeight()/2 - this.htmlElement.getHeight()/2;
		coordenates[0] = BrowserUtilsFactory.getInstance().getWidth()/2 - this.htmlElement.getWidth()/2;
		
		this.htmlElement.style.top = coordenates[1]+"px";
		this.htmlElement.style.left = coordenates[0]+"px";
	}

	WindowMenu.prototype.setHandler = function (handler){
		this.operationHandler = handler;
	}	
	//displays the window in the correct position
	WindowMenu.prototype.show = function (){
		
		this.calculatePosition();	
		this.initObserving();
		this.titleElement.update(this.title);
		this.htmlElement.style.display = "block";
		this.setFocus();
	}

	//abstract methods
	WindowMenu.prototype.initObserving = function (){
	}
	WindowMenu.prototype.stopObserving = function (){
	}
	WindowMenu.prototype.hide = function (){		
	}
	WindowMenu.prototype.setFocus = function (){		
	}

}


//Especific class for the windows used for creating
function CreateWindowMenu (element) {

	//constructor
	this.htmlElement = $('create_menu');		//create-window HTML element
	this.titleElement = $('create_window_title');	//title gap
	this.msgElement = $('create_window_msg');	//error message gap
	this.element = element;				//workspace or tab
	this.button = $('create_btn');
	this.nameInput = $('create_name');
	
	this.operationHandler = function(e){if(e.target == this.nameInput && e.keyCode == Event.KEY_RETURN || e.target == this.button)this.executeOperation()}.bind(this);

	if(this.element == 'workSpace'){
		this.title = gettext('Create workSpace');
	}

	CreateWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
			Event.observe(this.nameInput, "keypress", this.operationHandler);
	}
	
	CreateWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
			Event.stopObserving(this.nameInput, "keypress", this.operationHandler);
	}	
	
	CreateWindowMenu.prototype.setFocus = function(){
		this.nameInput.focus();
	}

	//Calls the Create operation (the task the window is made for).
	CreateWindowMenu.prototype.executeOperation = function(){

		var newName = $('create_name').value;
		switch (this.element){
		case 'workSpace':
			if(!OpManagerFactory.getInstance().workSpaceExists(newName)){
					OpManagerFactory.getInstance().addWorkSpace(newName);
			}
			else{
				this.msgElement.update(gettext('Invalid name: the name '+newName+' is already in use'));
			}
			break;
		default:
			break;
		}

	}

	//hides the window and clears all the inputs
	CreateWindowMenu.prototype.hide = function (){

		var inputArray = $$('#create_menu input:not([type=button])');
		for (var i=0; i<inputArray.length; i++){
			inputArray[i].value = '';
		}
		var msg = $('create_window_msg');
		msg.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}
CreateWindowMenu.prototype = new WindowMenu;

//Especific class for alert windows
function AlertWindowMenu (element) {

	//constructor
	this.htmlElement = $('alert_menu');		//create-window HTML element
	this.titleElement = $('alert_window_title');	//title gap
	this.msgElement = $('alert_window_msg');	//error message gap
	this.element = element;				//workspace or tab
	this.button = $('alert_btn1');
	this.button2 = $('alert_btn2');
	
	this.operationHandler = null;
	this.operationHandler2 = null;

	this.title = gettext('Warning');
	
	AlertWindowMenu.prototype.setHandler = function(handlerYesButton, handlerNoButton){
		this.operationHandler = handlerYesButton;
		
		if (!handlerNoButton)
			this.operationHandler2 = function () { LayoutManagerFactory.getInstance().hideCover(); }
		else
			this.operationHandler2 = handlerNoButton;
	}

	AlertWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
			Event.observe(this.button2, "click", this.operationHandler2);
		}
	
	AlertWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
			Event.stopObserving(this.button2, "click", this.operationHandler2);
	}	
	
	AlertWindowMenu.prototype.setFocus = function(){
		this.button.focus();
	}

	//hides the window and clears all the inputs
	AlertWindowMenu.prototype.hide = function (){
		this.msgElement.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}

AlertWindowMenu.prototype = new WindowMenu;

//Especific class for alert windows
function MessageWindowMenu (element) {

	//constructor
	this.htmlElement = $('message_menu');		//create-window HTML element
	this.titleElement = $('message_window_title');	//title gap
	this.msgElement = $('message_window_msg');	//error message gap
	this.button = $('message_btn1');
	this.title = gettext('Warning');
	
	MessageWindowMenu.prototype.setFocus = function(){
		this.button.focus();
	}

	//hides the window and clears all the inputs
	MessageWindowMenu.prototype.hide = function (){
		this.msgElement.update();
		this.stopObserving();
		this.htmlElement.style.display = "none";		
	}

}

MessageWindowMenu.prototype = new WindowMenu;


//Especific class for publish windows
function PublishWindowMenu (element) {

	//constructor
	this.htmlElement = $('publish_menu');		//create-window HTML element
	this.titleElement = $('publish_window_title');	//title gap
	this.msgElement = $('publish_window_msg');	//error message gap
	this.button = $('publish_btn1');
	this.title = gettext('Publish Workspace');
	
	this.operationHandler = function(e){
								if ($('publish_name').value!="" && $('publish_vendor').value!="" && $('publish_name').version!="" && $('publish_email').value!="") {
									this.executeOperation();
									LayoutManagerFactory.getInstance().hideCover();
								}
								else{
									this.msgElement.update("All the required fields must be filled");
								}
							}.bind(this);


	PublishWindowMenu.prototype.initObserving = function(){	
			Event.observe(this.button, "click", this.operationHandler);
	}
	
	PublishWindowMenu.prototype.stopObserving = function(){	
			Event.stopObserving(this.button, "click", this.operationHandler);
	}	
	
	PublishWindowMenu.prototype.setFocus = function(){
		$('publish_name').focus();
	}
	
	PublishWindowMenu.prototype.executeOperation = function(){
		var o = new Object;
		o.name = $('publish_name').value;
		o.vendor = $('publish_vendor').value;
		o.version = $('publish_version').value;
		o.author = $('publish_author').value;
		o.email = $('publish_email').value;
		o.description = $('publish_description').value;
		o.imageURI = $('publish_imageURI').value;
		o.wikiURI = $('publish_wikiURI').value;
		OpManagerFactory.getInstance().activeWorkSpace.publish(o);
	}
	


	//hides the window and clears all the inputs
	PublishWindowMenu.prototype.hide = function (){

		var inputArray = $$('#publish_menu input:not([type=button])');
		for (var i=0; i<inputArray.length; i++){
			inputArray[i].value = '';
		}
		$('publish_description').value="";
		var msg = $('create_window_msg');
		msg.update();
		this.stopObserving();
		this.msgElement.update();
		this.htmlElement.style.display = "none";		
	}

}

PublishWindowMenu.prototype = new WindowMenu;


var LayoutManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	// *********************************
	// PRIVATE CONSTANTS
	// *********************************

	// z-index levelS
	var hideLevel = 1;
	var showLevel = 2;

	var hideStyle = {'zIndex': hideLevel, 'display': 'none'};
	var showStyle = {'zIndex': showLevel, 'display': 'block'};

	/*
	 * Workaround for Firefox 2
	 */
	var firefox2workaround = Prototype.Browser.Gecko && navigator.userAgent.indexOf("2.0.0") != -1;
	if (firefox2workaround) {
		hideStyle['visibility'] = 'hidden';
		delete hideStyle['display'];

		showStyle['visibility'] = 'visible';
		delete showStyle['display'];

		document.styleSheets[0].insertRule(".container {display:block; visibility:hidden;}", document.styleSheets[0].cssRules.length);
	}


	function LayoutManager () {
		// *********************************
		// PRIVATE VARIABLES 
		// *********************************

		// current view: catalogue, dragboard, wiring, logs
		this.currentViewType = null;
		this.currentView = null;

		// Global links managed by LayoutManager: {showcase, wiring}
		// Tabs are managed by WorkSpaces!! 
		this.catalogueLink = $('catalogue_link');
		this.wiringLink = $('wiring_link');

		// Container managed by LayOutManager: {showcase_tab}
		// Remaining containers managed by WorkSpaces!!
		this.catalogue = null;
		this.logs = LogManagerFactory.getInstance();
		this.logsLink = $('logs_link');

		// Menu Layer
		this.currentMenu = null;                                                // current menu (either dropdown or window)
		this.coverLayerElement = $('menu_layer');                               // disabling background layer
		this.coverLayerEvent = function () {this.hideCover()}.bind(this);       // disabling layer onclick event (by default)

		// Tab bar section: to make the section scroll 2 divs are needed: one which limits the whole room and
		//another which is absolutely positioned each time a slider button is clicked
		this.tabBarStep = 20;
		this.tabImgSize = 14;    // launcher width
		this.extraGap = 15;      // 15px to ensure that a new character has enough room in the scroll bar
		this.tabMarginRight = 6; // 6px
		this.rightSlider = $('right_slider');
		this.leftSlider = $('left_slider');
		this.leftTimeOut;
		this.rightTimeOut;
		//fixed section
		this.fixedTabBar = $('fixed_bar');
		this.fixedTabBarMaxWidth = BrowserUtilsFactory.getInstance().getWidth()*0.70;

		//scroll bar
		this.scrollTabBar = $('scroll_bar');
		//initial width (there is always a launcher (of the current tab))
		this.scrollTabBarWidth = this.tabImgSize + this.extraGap;

		this.menus = new Array();

		// ****************
		// PUBLIC METHODS 
		// ****************

		LayoutManager.prototype._notifyPlatformReady = function (firstTime) {
			var loadingElement = $("loading-indicator");
			loadingElement.addClassName("disabled");

			if (!firstTime)
				return;

			// Listen to resize events
				Event.observe(window,
				              "resize",
				              this.resizeWrapper.bind(this));
		}



		LayoutManager.prototype.getCurrentViewType = function () {
			return this.currentViewType;
		}
		
		LayoutManager.prototype.resizeContainer = function (container) {
			// We have to take into account the bottom margin and border widths.
			// Bottom margin = 4px
			// Border width = 2px => Top border + bottom border = 4px
			// Total 8px
			container.setStyle({"height" : (BrowserUtilsFactory.getInstance().getHeight() - $("header").offsetHeight - 8) + "px"});
		}

		LayoutManager.prototype.resizeWrapper = function () {
			// We have to take into account the bottom margin and border widths.
			// Bottom margin = 4px
			// Border width = 2px => Top border + bottom border = 4px
			// Total 8px
			var newHeight=BrowserUtilsFactory.getInstance().getHeight();
			$("wrapper").setStyle({"height" : (newHeight - $("header").offsetHeight - 8) + "px"});

			var wrapperChilds = $('wrapper').childElements();
			var i;
			for (i=0;i<wrapperChilds.length;i++){
				this.resizeContainer(wrapperChilds[i]);
			}
			var newWidth = BrowserUtilsFactory.getInstance().getWidth();
			this.coverLayerElement.setStyle({"height" : newHeight + "px", "width": newWidth +"px"});

			// Recalculate catalogue sizes
			UIUtils.setResourcesWidth();

			// Recalculate wiring position
			var opManager = OpManagerFactory.getInstance();
			if(opManager.loadCompleted) {
				/* Wiring */
				var wiringInterface = opManager.activeWorkSpace.getWiringInterface()
				wiringInterface.wiringTable.setStyle({'width' : (wiringInterface.wiringContainer.getWidth()-20)+"px"});
				if(wiringInterface.currentChannel){
					wiringInterface.uncheckChannel(wiringInterface.currentChannel);
					wiringInterface.highlightChannel(wiringInterface.currentChannel);
				}

				/* Current Dragboard */
				opManager.activeWorkSpace.getActiveDragboard()._notifyWindowResizeEvent();
			}

			// Recalculate menu positions
			if (this.currentMenu) {
				this.currentMenu.calculatePosition();
			}
		}

		LayoutManager.prototype.unloadCurrentView = function () {
			if (this.currentView) {
				this.currentView.hide();
				this.currentView = null;
			}
		}

		LayoutManager.prototype.unMarkGlobalTabs = function () {
			if (!this.catalogue) {
				this.catalogueLink = $('catalogue_link');
				this.logsLink = $('logs_link');
				this.wiringLink = $('wiring_link');
			}

			this.catalogueLink.className = 'toolbar_unmarked';
			this.wiringLink.className = 'toolbar_unmarked';
			this.logsLink.className = 'toolbar_unmarked';

/*			this.hideShowCase();
			this.hideLogs();
*/
		}

		/****VIEW OPERATIONS****/
		//hide an HTML Element
		LayoutManager.prototype.hideView = function (viewHTML) {
			viewHTML.setStyle(hideStyle);
		}

		LayoutManager.prototype.notifyError = function (labelContent) {
			this.logsLink.innerHTML = labelContent;
			this.logsLink.setStyle({'display' : 'inline'});
		}
		
		LayoutManager.prototype.clearErrors = function (labelContent) {
			this.logsLink.innerHTML = '';
		}

		// Tab operations
		LayoutManager.prototype.unmarkTab = function(tab, launcher, changeEvent, renameEvent) {
			tab.className = "tab";
			//hide the launcher image for the drop down menu from the former current tab
			var tabOpsLauncher = $(launcher);
			tabOpsLauncher.setStyle({'display':'none'});
			Event.stopObserving(tab, 'click', renameEvent);
			Event.observe(tab, 'click', changeEvent);
			tab.setStyle({"display": "block"}); // TODO
		}

		LayoutManager.prototype.markTab = function(tab, launcher, renameHandler, changeHandler) {
			if (tab.className != "tab current") {
				tab.className = "tab current";
				var tabOpsLauncher = $(launcher);
				tabOpsLauncher.setStyle({'display':'inline'});
				tab.setStyle({"display": "block"}); // TODO
			}
			if (this.currentViewType == 'dragboard') {
				Event.stopObserving(tab, 'click', changeHandler);
				Event.observe(tab, 'click', renameHandler);
			} else {
				Event.stopObserving(tab, 'click', renameHandler);
				Event.observe(tab, 'click', changeHandler);
			}
		}

		LayoutManager.prototype.hideTab = function(tab) {
			try{ //remove the launcher image for the drop down menu from the former current tab
				var tabOpsLauncher = $$('#'+tab.getAttribute('id')+' #tabOps_launcher');
				if (tabOpsLauncher.length > 0) {
					tabOpsLauncher[0].setStyle({'display':'none'});
				}
			} catch (e) {
				return;
			}
			tab.className = "tab";
			tab.setStyle(hideStyle);
		}

		// Dragboard operations (usually called together with Tab operations)
		LayoutManager.prototype.showDragboard = function(dragboard) {
			this.unMarkGlobalTabs();
			if (this.currentView != null) {
				this.currentView.hide();
			}
			this.currentView = dragboard;
			this.currentViewType = 'dragboard';
			dragboard.dragboardElement.setStyle(showStyle);
		}

		// Catalogue operations
		LayoutManager.prototype.showCatalogue = function(){
			this.unMarkGlobalTabs();
			if (this.currentView != null) {
				this.currentView.hide();
			}

			if (!this.catalogue) {
				this.catalogue = CatalogueFactory.getInstance();
			}

			this.currentView = this.catalogue;
			this.currentViewType = 'catalogue';
			this.catalogueLink.className = 'toolbar_marked';
			this.catalogue.catalogueElement.setStyle(showStyle);
		}

		// Logs operations
		LayoutManager.prototype.showLogs = function(){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}
			this.currentView = this.logs;
			this.currentViewType = 'logs';
			this.logsLink.className = "toolbar_marked";
			this.logs.logContainer.setStyle(showStyle);
		}

		//Wiring operations
		LayoutManager.prototype.showWiring = function(wiring){
			this.unMarkGlobalTabs();
			if(this.currentView != null){
				this.currentView.hide();
			}
			this.currentView = wiring;
			this.currentViewType = 'wiring';
			this.wiringLink.className = "toolbar_marked";
			this.wiringLink.blur();
			wiring.wiringContainer.setStyle(showStyle);
			//resizing the wiring table so that the scroll bar don't modify the table width.
			wiring.wiringTable.setStyle({'width' : (wiring.wiringContainer.getWidth()-20)+"px"});
		}

		//the disabling layer can be clicable (in order to hide a menu) or not
		LayoutManager.prototype.showClickableCover = function(){
			this.coverLayerElement.style.display="block";
			Event.observe( this.coverLayerElement, "click", this.coverLayerEvent);
		}

		LayoutManager.prototype.showUnclickableCover = function(){
			this.coverLayerElement.addClassName('disabled_background');
			this.coverLayerElement.style.display="block";

			Event.stopObserving( this.coverLayerElement, "click", this.coverLayerEvent);
		}

		//WorkSpaceMenu is dinamic so the different options must be added.
		LayoutManager.prototype.refreshChangeWorkSpaceMenu = function(workSpace, workspaces){
			
			workSpace.menu.clearSubmenuOptions();
			
			if(workspaces.length >= 1){
				workSpace.menu.submenu.className = "submenu border_bottom";
			}else{
				workSpace.menu.submenu.className = "submenu";
			}

			for (var i=0; i<workspaces.length; i++){
				workSpace.menu.addOptionToSubmenu(null, workspaces[i].workSpaceState.name, function (){LayoutManagerFactory.getInstance().hideCover();OpManagerFactory.getInstance().changeActiveWorkSpace(this)}.bind(workspaces[i]));

			}
		}

		//merge Menu is dinamic so the different options must be added.
		LayoutManager.prototype.refreshMergeWorkSpaceMenu = function(workSpace, workspaces){
			
			workSpace.mergeMenu.clearOptions();
			
			for (var i=0; i<workspaces.length; i++){
				var context = {firstWK: workSpace, scndWK: workspaces[i]}
				workSpace.mergeMenu.addOption(null, workspaces[i].workSpaceState.name, function (){this.firstWK.mergeWith(this.scndWK.workSpaceState.id)}.bind(context), i);

			}
		}

		//Shows the asked drop down menu 
		LayoutManager.prototype.showDropDownMenu = function(menuType, menu, x, y) {
			switch (menuType) {
			case 'igadgetOps':
				this.currentMenu = menu;
				var position;

				if (menu.parentMenu)
					x = menu.parentMenu.menu.offsetLeft + menu.parentMenu.menu.offsetWidth - 10;

				if (x + menu.menu.getWidth() <= BrowserUtilsFactory.getInstance().getWidth()) {
					//the menu has enough room to be displayed from left to right
					this.currentMenu.show('right', x, y);
				} else {
					if (menu.parentMenu)
						x = menu.parentMenu.menu.offsetLeft + 10;

					this.currentMenu.show('left', x, y);
				}
				this.showClickableCover();
				break;
			case 'workSpaceOps':
				this.currentMenu = menu;
				this.currentMenu.show('right', x, y);
				this.showClickableCover();
				break;
			case 'tabOps':
				this.currentMenu = menu;
				this.currentMenu.show('left', x, y);
				this.showClickableCover();
				break;
			case 'workSpaceOpsSubMenu':
				this.currentMenu = menu;
				this.currentMenu.show('right', x, y);
				break;
			case 'filterMenu':
				this.currentMenu = menu;
				var position;
				if (y + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()){
					//the menu has enough room to be displayed from top to bottom
					this.currentMenu.show('left-bottom', x, y);
				}else{
					this.currentMenu.show('left-top', x, y);
				}
				this.showClickableCover();
				break;
			case 'filterHelp':
				this.currentMenu = menu;
				var position;
				if (y + menu.menu.getHeight() <= BrowserUtilsFactory.getInstance().getHeight()){
					//the menu has enough room to be displayed from top to bottom
					this.currentMenu.show('right-bottom', x, y);
				}else{
					this.currentMenu.show('right-top', x, y);
				}
				break;
			default:
				break;
			}

		}

		//Shows the asked window menu
		LayoutManager.prototype.showWindowMenu = function(window, handlerYesButton, handlerNoButton){
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if(this.currentMenu != null){//only if the layer is displayed.
				this.hideCover();
			}
			this.showUnclickableCover();
			switch (window){
			case 'createWorkSpace':
				if(!this.menus['createWorkSpaceMenu']){
					this.menus['createWorkSpaceMenu'] = new CreateWindowMenu('workSpace');
				}
				this.currentMenu = this.menus['createWorkSpaceMenu'];
				this.currentMenu.show();
				break;
			case 'deleteTab':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you really want to remove this tab?'));
				this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().deleteTab();}, handlerNoButton);
				this.currentMenu.show();
				break;
			case 'cancelService':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you want to cancel the subscription to the service?'));
				this.currentMenu.setHandler(handlerYesButton, handlerNoButton);
				this.currentMenu.show();
				break;
			case 'deleteWorkSpace':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				this.currentMenu.setMsg(gettext('Do you really want to remove this workspace?'));
				this.currentMenu.setHandler(function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();}, handlerNoButton);
				this.currentMenu.show();
				break;
			case 'publishWorkSpace':
				if(!this.menus['publishWorkSpaceMenu']){
					this.menus['publishWorkSpaceMenu'] = new PublishWindowMenu(null);
				}
				this.currentMenu = this.menus['publishWorkSpaceMenu'];
				this.currentMenu.show();
				break;
			case 'deleteAllResourceVersions':
				if(!this.menus['alertMenu']){
					this.menus['alertMenu'] = new AlertWindowMenu(null);
				}
				this.currentMenu = this.menus['alertMenu'];
				if (UIUtils.selectedVersion != null){
					this.currentMenu.setMsg(gettext('Do you really want to remove this version of the gadget?'));
				}else{
					this.currentMenu.setMsg(gettext('WARNING! All versions of this gadget will be removed too! Do you really want to remove this gadget?'));
				}
				this.currentMenu.setHandler(function(){UIUtils.deleteGadget(UIUtils.selectedResource);}, handlerNoButton);
				this.currentMenu.show();
				break;
			default:
				break;
			}
		}
		
		//Shows the message window menu
		LayoutManager.prototype.showMessageMenu = function(msg){
			//the disabling layer is displayed as long as a menu is shown. If there isn't a menu, there isn't a layer.
			if(this.currentMenu != null){//only if the layer is displayed.
				this.hideCover();
			}
			this.showUnclickableCover();
			
			if(!this.menus['messageMenu']){
				this.menus['messageMenu'] = new MessageWindowMenu(null);
			}
			this.currentMenu = this.menus['messageMenu'];
			this.currentMenu.setMsg(msg);
			this.currentMenu.show();
		}

		//hides the disabling layer and so, the current menu
		LayoutManager.prototype.hideCover = function(){
			if(this.currentMenu){
				this.currentMenu.hide();
			}
			this.currentMenu = null;
			this.coverLayerElement.style.display="none";
			this.coverLayerElement.removeClassName('disabled_background');
		}
		
		var FADE_RED_INI = 240;
		var FADE_GREEN_INI = 230;
		var FADE_BLUE_INI = 140;
		var FADE_RED_END_TAB = 151;
		var FADE_GREEN_END_TAB = 160;
		var FADE_BLUE_END_TAB = 168;
		var FADE_RED_END_CUR_TAB = 224;
		var FADE_GREEN_END_CUR_TAB = 224;
		var FADE_BLUE_END_CUR_TAB = 224;
		var FADE_HOLD = 500;
		var FADE_SPEED = 200;
		var FADE_STEP = 5;
		var self = this;
		LayoutManager.prototype.goTab = function(tab, tabLauncher, renameHandler, changeHandler){
			this.markTab(tab, tabLauncher, renameHandler, changeHandler);
			var currentColour = [FADE_RED_INI, FADE_GREEN_INI, FADE_BLUE_INI];
			tab.style.background = "rgb(" + currentColour[0] + "," + currentColour[1] + "," + currentColour[2] + ")";
			setTimeout(function(){
					var endColour = [FADE_RED_END_TAB, FADE_GREEN_END_TAB, FADE_BLUE_END_TAB];
					if(tab.className == "tab current"){
						endColour = [FADE_RED_END_CUR_TAB, FADE_GREEN_END_CUR_TAB, FADE_BLUE_END_CUR_TAB];	
					}
					self.fadeTab(tab.id, currentColour, endColour);
				}, FADE_HOLD);
		}
		
		LayoutManager.prototype.fadeTab = function(tabId, currentColour, endColour){
			var element = document.getElementById(tabId);
			if(!element){
				return;
			}
			
			if(currentColour[0]==endColour[0] && currentColour[1]==endColour[1] && currentColour[2] == endColour[2]){
				element.style.background = "";
				return;
			}
			
			currentColour[0] = this.fadeColour(currentColour[0], endColour[0], FADE_STEP);
			currentColour[1] = this.fadeColour(currentColour[1], endColour[1], FADE_STEP);
			currentColour[2] = this.fadeColour(currentColour[2], endColour[2], FADE_STEP);
			
			element.style.background = "rgb(" + currentColour[0] + "," + currentColour[1] + "," + currentColour[2] + ")";
			setTimeout(function(){self.fadeTab(tabId, currentColour, endColour);}, FADE_SPEED);
		}
		
		LayoutManager.prototype.fadeColour = function(colour, obj, step){
			if(colour > obj){
				if(colour - step > obj){
					return colour - step;
				}
			} else {
				if(colour + step < obj){
					return colour + step;
				}
			}
			return obj;
		}
		
	}

	/*-----------------------------*
	 * Tab scroll bar management   *
	 *-----------------------------*/

	/*Reset the tab bar values*/
	LayoutManager.prototype.resetTabBar = function(tabId) {
		this.scrollTabBarWidth = this.tabImgSize + this.extraGap;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		//we don't need arrows
		this.rightSlider.style.display = "none";
		this.leftSlider.style.display = "none";
	}

	/*Insert tab in the tab bar*/
	LayoutManager.prototype.addToTabBar = function(tabId) {
		var tabHTMLElement = document.createElement("div");
		tabHTMLElement.setAttribute("id", tabId);
		tabHTMLElement.setAttribute("class", "tab");
		tabHTMLElement.setStyle({"display": "none"}); // TODO
		this.scrollTabBar.insertBefore(tabHTMLElement, this.scrollTabBar.firstChild);
		var tabBorder= parseInt(tabHTMLElement.getStyle('border-left-width'));
		this.changeTabBarSize(2*(this.tabMarginRight + tabBorder));
		this.scrollTabBar.setStyle({right: 0, left:''});
		return tabHTMLElement;
	}

	/*remove a tab from the tab bar*/
	LayoutManager.prototype.removeFromTabBar = function(tabHTMLElement){
		var tabWidth = -1 * (tabHTMLElement.getWidth()-this.tabImgSize + 2*this.tabMarginRight);
		Element.remove(tabHTMLElement);
		this.changeTabBarSize(tabWidth);
		this.scrollTabBar.setStyle({right: (this.fixedTabBarWidth - this.scrollTabBarWidth) + 'px', left:''});
	}
	
	/*change the width of the tab bar*/
	LayoutManager.prototype.changeTabBarSize = function(tabSize){
		
		this.scrollTabBarWidth += tabSize;
		this.scrollTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		this.fixedTabBar.setStyle({'width': this.scrollTabBarWidth + "px"});
		if (this.scrollTabBarWidth <= this.fixedTabBarMaxWidth) {
			this.scrollTabBar.setStyle({right: 0 + "px"});
			//we don't need arrows
			this.rightSlider.style.display = "none";
			this.leftSlider.style.display = "none";
		} else { //if the scrollTabBar is bigger than the fixed tab, we need arrows
			this.rightSlider.style.display = "inline";
			this.leftSlider.style.display = "inline";
			
		}
		
	}
	/*change the right position of the scroll tab bar */
	LayoutManager.prototype.changeScrollBarRightPosition = function(difference){
		var newRight = parseInt(this.scrollTabBar.getStyle('right')) + difference;
		var minRight = this.fixedTabBarMaxWidth-this.scrollTabBarWidth;
		if (newRight > 0)
			newRight = 0;
		else if(newRight < minRight)
			newRight = minRight;
			
		this.scrollTabBar.setStyle({'right': newRight + "px"});
	}
	
	/* get the left position of the fixed tab bar */
	
	LayoutManager.prototype.getFixedBarLeftPosition = function(){
		return parseInt(this.fixedTabBar.offsetLeft);
	}
	
	/*get the width of te fixed bar */
	LayoutManager.prototype.getFixedBarWidth = function(){
		return parseInt(this.fixedTabBar.getWidth());
	}
	
	/*scroll tab bar sliders*/
	LayoutManager.prototype.goLeft = function(){
		this.rightSlider.blur();
		var minLeft = this.fixedTabBarMaxWidth-this.scrollTabBarWidth;
		if (parseInt(this.scrollTabBar.offsetLeft)>minLeft){
			this.changeScrollBarRightPosition(this.tabBarStep);
			var leftMethod = function(){this.goLeft()}.bind(this);
			this.leftTimeOut=setTimeout(leftMethod,50);
		}
	}

	LayoutManager.prototype.goRight = function() {
		this.leftSlider.blur();
		if (parseInt(this.scrollTabBar.offsetLeft)<0){
			this.changeScrollBarRightPosition(-1*this.tabBarStep);

			var rightMethod = function(){this.goRight()}.bind(this);
			this.rightTimeOut=setTimeout(rightMethod,50);
		}
	}
	
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
	this.getInstance = function() {
		if (instance == null) {
			instance = new LayoutManager();
		}
		return instance;
		}
	}
}();


var BrowserUtilsFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function BrowserUtils () {

		
		// ****************
		// PUBLIC METHODS 
		// ****************
		
		BrowserUtils.prototype.getHeight = function () {
			var newHeight=window.innerHeight; //Non-IE (Firefox and Opera)
			  
			if( document.documentElement && document.documentElement.clientHeight ) {
			  //IE 6+ in 'standards compliant mode'
			  newHeight = document.documentElement.clientHeight;
			} else if( document.body && document.body.clientHeight ) {
			  //IE 4 compatible and IE 5-7 'quirk mode'
			  newHeight = document.body.clientHeight;
			}
			return newHeight;
		}
		
		//gets total width
		BrowserUtils.prototype.getWidth = function(){	
			var newWidth=window.innerWidth; //Non-IE (Firefox and Opera)
		  
			if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
			    //IE 6+ in 'standards compliant mode'
		  		newWidth = document.documentElement.clientWidth;
			} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
		  		//IE 4 compatible and IE 5-7 'quirk mode'
			  newWidth = document.body.clientWidth;
			}
			return newWidth;
		}

		BrowserUtils.prototype.isLeftButton = function(button) {
			if ((this.isIE() && button == 1) || button == 0)
				return true;
			else
				return false;
		}

		BrowserUtils.prototype.isRightButton = function(button) {
			if (button == 2)
				return true;
			else
				return false;
		}

		BrowserUtils.prototype.getBrowser = function(){ 
			if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){ //test for MSIE x.x;
				var ieversion=new Number(RegExp.$1) // capture x.x portion and store as a number
				if (ieversion>=8)
					return "IE8";
				else if (ieversion>=7)
					return "IE7";
				else if (ieversion>=6)
					return "IE6";
				else if (ieversion>=5)
					return "IE5";
			} else if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
				var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
				if (ffversion>=3)
			 		return "FF3"
				else if (ffversion>=2)
			  		return "FF2"
			 	else if (ffversion>=1)
			  		return "FF1"
			} else{
				return "OTHER";
			}			
		}
		
		BrowserUtils.prototype.isIE = function(){ 
			if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) //test for MSIE x.x;	
				return true;
			else
				return false;		
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new BrowserUtils();
         	}
         	return instance;
       	}
	}
	
}();

