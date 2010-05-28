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

//////////////////////////
// PARENT COMMAND CLASS
//////////////////////////
var UserCommand = function (dom_element, html_event, services, dom_wrapper, data) {
  this.html_event = html_event;
  this.dom_element = dom_element;
  this.services = services;
  this.dom_wrapper = dom_wrapper;
  this.data = data;
		
  Event.observe(this.dom_element, this.html_event, this.anonymous_function.bind(this));
  
  this.set_catalogue = function (catalogue) {
	this.catalogue = catalogue;
  }
}

/////////////////////
// GENERAL COMMANDS 
////////////////////

var ViewAllCommand  = function (dom_element, html_event, service_facade, dom_wrapper) {
  this.anonymous_function =  function (event) {
	this.services.search('VIEW_ALL', 1, 'AND');
  } 
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, null);
}

/////////////////////////////////
// COMMANDS WITH ATTACHED DATA 
/////////////////////////////////

var SimpleSearchCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	if (event instanceof KeyboardEvent && event.keyCode != '13') {
	  // Do nothing!
	  return;
	}

    this.services.search('SIMPLE_SEARCH', this.data['starting_page'], this.data['boolean_operator'], this.data['scope']);
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var InstantiateCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) {   
	var resource = this.data;;
	  
	//contratable resources
	if (resource.isContratable() && !resource.hasContract()) {
	  LayoutManagerFactory.getInstance().showWindowMenu('purchaseAppMenu', CatalogueFactory.getInstance().contractApplication,
	                                                    LayoutManagerFactory.getInstance().hideCover,
	                                                    resource);
	  return;
	}
	  
	//is mashup?
	if (resource.isMashup()) {
	  LayoutManagerFactory.getInstance().showWindowMenu(
			  "addMashup",
	          function(){ OpManagerFactory.getInstance().addMashupResource(this);   }.bind(resource),
	          function(){ OpManagerFactory.getInstance().mergeMashupResource(this); }.bind(resource)
	  );
	  
	  return;
	}
	
	// Normal instantiation! 
	ShowcaseFactory.getInstance().addGadget(resource.getVendor(), resource.getName(), 
			                                resource.getVersion(), resource.getUriTemplate());
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var ShowResourceDetailsCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    var response_command = this.services.create_local_command('PAINT_RESOURCE_DETAILS', data);
    
    response_command.process();
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var ShowDeveloperInfoCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    var response_command = this.services.create_local_command('SHOW_DEVELOPER_INFO', data);
    
    response_command.process();
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var AddGadgetToCatalogueCommand = function(url, paramName, paramValue) {
	UIUtils.repaintCatalogue=true;
	UIUtils.search = false;
	
	var newResourceOnSuccess = function (response) {
	    var response_json = response.responseText;
		var result = JSON.parse(response_json);
	 
		//showYesNoDialog handlers
		//"Yes" handler
	 	var continueAdding = function (result){
	 		//leave that gadget version and continue
	 		if (result['contratable']) {
				if (result['mashupId'] == "") {
					// Link gadget with application
					var gadget_id = result['gadgetId'];
					var available_apps = result['availableApps'];
					
					CatalogueFactory.getInstance().setAvailableApps(available_apps);
					
					LayoutManagerFactory.getInstance().showWindowMenu('addGadgetToAppMenu', UIUtils.addResourceToApplication, function(){
						LayoutManagerFactory.getInstance().hideCover()
					}, gadget_id);
				}
				else {
					UIUtils.repaintOrderedByCreationDate();
				}
		    } else {
		    	UIUtils.repaintOrderedByCreationDate();
		    }
	 	}
	 
	 	//"No" handler
		var rollback = function(result)	{

			var resourceURI = URIs.GET_POST_RESOURCES + "/" + result['vendor'] + "/" + result['gadgetName'] + "/" + result['version'];
	
			var onError = function(transport, e) {
				var logManager = LogManagerFactory.getInstance();
				var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
				logManager.log(msg);
				LayoutManagerFactory.getInstance().hideCover();
				// Process
			}

			//Send request to delete de gadget
			PersistenceEngineFactory.getInstance().send_delete(resourceURI, this, function (){LayoutManagerFactory.getInstance().hideCover();}, onError);
			
		}
	    
	    var context = {result: result, continueAdding: continueAdding, rollback: rollback};
	    //check if the new gadget is the last version
	    if (result['last_version'] != result['version']) {
	    	//inform the user about the situation
	    	var msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
	    			"The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
	    			" Do you really want to continue to add version %(curr_version)s ");
	    	msg = interpolate(msg, {curr_version: result['version'], last_version: result['last_version'] }, true);
	    	LayoutManagerFactory.getInstance().showYesNoDialog(msg, function (){
	    																this.continueAdding(this.result)
	    															}.bind(context),
	    															function (){
	    																this.rollback(this.result)
	    															}.bind(context), Constants.Logging.WARN_MSG);
	    }
	    else{
	    	continueAdding(result);
	    }    
	 
	}
	
	var newResourceOnError = function (transport, e) {
		var response = transport.responseText;
		var response_message = JSON.parse(response)['message'];
	
		var logManager = LogManagerFactory.getInstance();
		var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s.");
/*
		if (response_message.indexOf("IntegrityError") > 0) {
			msg = interpolate(msg, {errorMsg: gettext("The gadget is already added to the catalogue")}, true);
		} else {
			msg = logManager.formatError(msg, transport, e)
		}
*/
		msg = interpolate(msg, {errorMsg: response_message}, true);
		LayoutManagerFactory.getInstance().hideCover(); //TODO: is it necessary?
		LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		logManager.log(msg);
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();

	var params = new Hash();
	params[paramName] = paramValue;

	persistenceEngine.send_post(url, params, this, newResourceOnSuccess, newResourceOnError);
}

//Upload Wgt files
UIUtils.uploadFile = function () {
	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Uploading packaged gadget"), 1);

	var upload = document.getElementById("upload_form");
	var iframe = document.getElementById("upload");
	if (!iframe.onload)
		iframe.onload = function(){UIUtils.checkFile();};
	upload.submit();
}

//Check upload status wgt file
UIUtils.checkFile = function () {
	var i = document.getElementById("upload");

	if (i.contentDocument) {
		var d = i.contentDocument;
	} else if (i.contentWindow) {
		var d = i.contentWindow.document;
	} else {
		var d = window.frames["upload"].document;
	}

	var layoutManager = LayoutManagerFactory.getInstance();

	if (d.location.href.search("error") >= 0) {
		var logManager = LogManagerFactory.getInstance();
		var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s");
		msg = interpolate(msg, {errorMsg: d.body.textContent}, true);

		layoutManager._notifyPlatformReady();
		layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		logManager.log(msg);
		return;
	} else {
		layoutManager.logSubTask(gettext('Gadget uploaded successfully'));
		layoutManager.logStep('');
		layoutManager._notifyPlatformReady();
	}

	this.viewAll();
}

UIUtils.viewAll = function (url, criteria) {
	$('header_always_error').style.display = 'none';
	UIUtils.page = 1;
	UIUtils.off = 10;
	UIUtils.search = false;
	UIUtils.searchCriteria = '';
	CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES+ "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
}

