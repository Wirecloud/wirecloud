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

var CatalogueService = function () {
  this.persistence_engine = null;
  
  this.set_persistence_engine = function (persistence_engine) {
	this.persistence_engine = persistence_engine;
  }
  
  this.set_response_command_processor = function (command_processor) {
    this.resp_command_processor = command_processor;
  }
  
  this.parse_response_data = function (response_data) {}
}

var CatalogueSearcher = function () {
  CatalogueService.call(this);
  
  this.scope = null;
  this.view_all_template = null;
  this.simple_search_template = null;
  this.configured = false;
  this.resp_command_processor = null;
  
  this.set_scope = function (scope) {
	this.scope = scope;
  }
  
  this.get_scope = function () {
	return this.scope;
  }
  
  this.get_command_id_by_scope = function () {
    if (this.scope == 'gadget')
      return 'PAINT_GADGETS'
    
    if (this.scope == 'mashup')
      return 'PAINT_MASHUPS'
    
    alert ('Missing scope type');
    return '';
  }
  
  this.configure = function () {
	this.view_all_template = new Template(URIs.GET_POST_RESOURCES + '/#{starting_page}/#{resources_per_page}');
	this.simple_search_template = new Template(URIs.GET_RESOURCES_SIMPLE_SEARCH + '/simple_or/#{starting_page}/#{resources_per_page}');
	
	this.configured = true;
  }
  
  this.process_response = function (response, command) {
	var response_text = response.responseText;
	var response_json = response_text.evalJSON();
	
	var query_results_number = response.getResponseHeader('items'); 
	
	var resource_list = response_json['resourceList'];
	
	if (resource_list) {
	  var resource_objects = [];
	  
	  for (var i=0; i<resource_list.length; i++) {
	    var resource_state = resource_list[i];
	    var resource_obj = new ResourceState(resource_state);
	    
	    resource_objects.push(resource_obj);
	  }
	  
	  var processed_data = {}
	  
	  processed_data['resources'] = resource_objects;
	  processed_data['query_results_number'] = query_results_number;
	  processed_data['resources_per_page'] = command.resources_per_page
	  processed_data['current_page'] = command.current_page
	  
	  return processed_data;
	}
  }
  
  this.search = function (operation, search_criteria, starting_page, resources_per_page, order_by, search_boolean, search_scope) {
	if (! this.configured)
	  this.configure();
	
	if (search_scope)
	  this.set_scope(search_scope);
	
	var url = null;
	var params = new Hash({'orderby': order_by, 'search_criteria': search_criteria, 'search_boolean': search_boolean, 'scope': this.scope});
	var response_command = new ResponseCommand(this.resp_command_processor, this);
	var command_id = this.get_command_id_by_scope();
	
	
	response_command.resources_per_page = resources_per_page;
	response_command.current_page = starting_page;
	
	switch (operation) {
	case 'VIEW_ALL':
	  url = this.view_all_template.evaluate({'starting_page': starting_page, 'resources_per_page': resources_per_page}); 
	  response_command.set_id(command_id);
	  
	  break;
	case 'SIMPLE_SEARCH':
	  url = this.simple_search_template.evaluate({'starting_page': starting_page, 'resources_per_page': resources_per_page});	
	  response_command.set_id(command_id);
	  
	  break;
	default:
	  // Unidentified search => Skipping!
	  alert('Unidentified search;')
	  return;
	}
	
	var success_callback = function (response) {
	  var processed_response_data = this.caller.process_response(response, this);
	 	  
	  // "this" is binded to a "ResponseCommand" object
	  this.set_data(processed_response_data);
	  
	  // processing command
      this.process();
	}
		
	var error_callback = function (response) {
	  alert(response.responseText);
	}
	
	this.persistence_engine.send_get(url, response_command, success_callback, error_callback, params);
  }
}

var CatalogueResourceSubmitter = function () {
  CatalogueService.call(this);
  
  this.configured = false;
  this.resp_command_processor = null;
  
  this.configure = function () {
	this.submit_gadget_url = URIs.GET_POST_RESOURCES;
	
	this.configured = true;
  }
  
  this.process_response = function (response, command) {
	
  }
  
  this.add_gadget_from_template = function (template_uri) {
	
    var error_callback = function (transport, e) {
	  var response = transport.responseText;
	  var response_message = JSON.parse(response)['message'];
	
	  var logManager = LogManagerFactory.getInstance();
	  var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s.");
	
	  msg = interpolate(msg, {errorMsg: response_message}, true);
	  LayoutManagerFactory.getInstance().hideCover(); //TODO: is it necessary?
	  LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
	  logManager.log(msg);
	}
	
    var success_callback = function (response) {
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
			//UIUtils.repaintOrderedByCreationDate();
		  }
	    } 
 		else {
	      //UIUtils.repaintOrderedByCreationDate();
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
		this.persistence_engine.send_delete(resourceURI, this, function (){LayoutManagerFactory.getInstance().hideCover();}, onError);
	  }
    
      var context = {result: result, continueAdding: continueAdding, rollback: rollback};
      
      //check if the new gadget is the last version
      if (result['last_version'] != result['version']) {
    	//inform the user about the situation
    	var msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
    			"The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
    			" Do you really want to continue to add version %(curr_version)s ");
    	msg = interpolate(msg, {curr_version: result['version'], last_version: result['last_version'] }, true);
    	
    	LayoutManagerFactory.getInstance().showYesNoDialog(msg, 
    			function (){ this.continueAdding(this.result) }.bind(context),
    			function (){ this.rollback(this.result) }.bind(context), 
    			Constants.Logging.WARN_MSG);
      }
      else{
    	continueAdding(result);
      }   
    }
    
    var params = new Hash();
    
    params['template_uri'] = template_uri;
	
	this.persistence_engine.send_post(URIs.GET_POST_RESOURCES, params, this, success_callback, error_callback);
  }
}

var CatalogueVoter = function () {
  CatalogueService.call(this);
	  
  this.vote = function (options) {
	
  }
}

var CatalogueTagger = function () {
  CatalogueService.call(this);
		  
  this.tag = function (options) {
		
  }
}