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
  this.last_search_options = null;
  
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
  
  this.save_search_options = function (operation, criteria, starting_page, resources_per_page, order_by, search_boolean, search_scope) {
    var search_options = new Hash();
    
    search_options['operation'] = operation;
    search_options['criteria'] = criteria;
    search_options['starting_page'] = starting_page;
    search_options['resources_per_page'] = resources_per_page;
    search_options['order_by'] = order_by;
    search_options['boolean_operator'] = search_boolean;
    search_options['scope'] = search_scope;

    this.last_search_options = search_options;
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
  
  this.repeat_last_search = function () {
	var search_options = this.last_search_options;
	
	var operation = search_options['operation'];
	var criteria = search_options['criteria'];
	var starting_page = search_options['starting_page'];
	var resources_per_page = search_options['resources_per_page'];
	var order_by = search_options['order_by'];
	var boolean_operator = search_options['boolean_operator'];
	var scope = search_options['scope'];
	
	this.search(operation, criteria, starting_page, resources_per_page, order_by, boolean_operator, scope);
  }
  
  this.search = function (operation, search_criteria, starting_page, resources_per_page, order_by, search_boolean, search_scope) {
	if (! this.configured)
	  this.configure();
	
	// Saving search options in order to repeat search!
	this.save_search_options(operation, search_criteria, starting_page, resources_per_page, order_by, search_boolean, search_scope);
	
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
	var response_text = response.responseText;
	var resource_state = response_text.evalJSON();
	
	resource_state['added_by_user'] = 'Yes';
	resource_state['uriTemplate'] = resource_state['templateUrl'];
	resource_state['name'] = resource_state['gadgetName'];
	resource_state['id'] = resource_state['gadgetId'];
	                                               
    var votes = new Hash();
	
	votes['votes_number'] = 0;
	votes['user_vote'] = 0;
	votes['popularity'] = 0;
	
	resource_state['votes'] = [votes]; 
	
	if (resource_state['contratable']) {
	  var capability = new Hash();
	  
	  capability['name'] = 'contratable';
	  capability['value'] = 'true';
	
	  resource_state['capabilities'] = [capability];
	}
	else
	  resource_state['capabilities'] = [];
	
	resource_state['events'] = [];
	resource_state['slots'] = [];
	resource_state['tags'] = []; 
	
	var resource_obj = new ResourceState(resource_state);
	  
	return resource_obj;
  }
  
  this.buy_resource_applications = function (resource) {
	var contratationSuccess = function (transport) {
	  var responseJSON = transport.responseText;
	  var response = JSON.parse(responseJSON); 
		
	  // processing command
      this.process();
	}
	
	var contratationError = function () {
	  alert("Error contracting application");
	}
	
	var url = URIs.CONTRACT_APPLICATIONS_TRANSACTION;
	var contract_list = []
	
	var gadget_apps = resource.getGadgetApps();
	
	for (var i=0; i<gadget_apps.length; i++) {
	  var app = gadget_apps[i];
		
	  if (! app['has_contract']) {
		var contract = {'username': ezweb_user_name, 'free': true, 'app_id': app['app_code']};
		
		contract_list.push(contract);
	  }
	}
	
	// CommandResponse creation
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('REPEAT_SEARCH');
	
	var params = {'contract_list': Object.toJSON(contract_list)};
	
	this.persistence_engine.send_post(url, params, response_command, contratationSuccess, contratationError);
  }
  
  this.add_gadget_to_app = function (gadget, application_id) {
    var addingToAppSuccess = function (response) {
      // processing command
      this.process();
	}
	
	var addingToAppError = function (response) {
	  alert ("Error en addingToApp");
	}
	
	var resource_id = gadget.getId();
	
	//Send request the application manager
	var params = new Hash();
	var url = URIs.ADD_RESOURCE_TO_APP.evaluate({"application_id": application_id, "resource_id":resource_id});
	
	// CommandResponse creation
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('ADD_GADGET_TO_APP');
	
	this.persistence_engine.send_post(url, params, response_command, addingToAppSuccess, addingToAppError);
  }
  
  this.change_preferred_version = function (resource, version) {
	var url = URIs.GET_POST_RESOURCES + '/' + resource.getVendor() + '/' + resource.getName() + '/' + version;
    
	var successCallback = function (response) {
	  var response_text = response.responseText;
	  var response_obj = response_text.evalJSON();
	  
	  var resource_state = response_obj['resourceList'][0];
	  
	  var resource = new ResourceState(resource_state);
	  
	  this.set_data(resource);
	  
	  this.process();
	}
	
	var errorCallback = function (response) {
	  alert("error");
	}
	
	// CommandResponse creation
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    
    response_command.set_id('PAINT_RESOURCE_DETAILS');
    
    var params = new Hash();
    
    params['preferred'] = true;
    
	this.persistence_engine.send_update(url, params, response_command, successCallback, errorCallback);
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
      var processed_response_data = this.caller.process_response(response, this);
    
      // "this" is binded to a "ResponseCommand" object
      this.set_data(processed_response_data);
  
      // processing command
      this.process();
 	}
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('SUBMIT_GADGET');
    
    var params = new Hash();
    
    params['template_uri'] = template_uri;
	
	this.persistence_engine.send_post(URIs.GET_POST_RESOURCES, params, response_command, success_callback, error_callback);
  }
  
  this.delete_resource = function (resource) {
    var url = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();

    var success_callback = function(response) {
      // processing command
      this.process();
    }
    
    var error_callback = function(transport, e) {
  	  var logManager = LogManagerFactory.getInstance();
  	  var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
  	
  	  logManager.log(msg);
  	
  	  // processing command
  	  this.process();
    }
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('REPEAT_SEARCH');

    //Send request to delete de gadget
    this.persistence_engine.send_delete(url, response_command, success_callback, error_callback);
  }
  
  this.update_resource_html = function (resource) {
	var context = {'vendor': resource.getVendor(), 'name': resource.getName(), 'version': resource.getVersion()};
    
	var url = URIs.GET_GADGET.evaluate(context);
    url += '/xhtml';

    var success_callback = function(response) {
      // processing command
      var resource = this.get_data();
      
      resource.setExtraData({'update_result': gettext('Done!')});
      
      this.set_data(resource);
    	
      this.process();
    }
    
    var error_callback = function(transport, e) {
  	  var logManager = LogManagerFactory.getInstance();
  	  var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
  	
  	  logManager.log(msg);
  	  
  	  resource.setExtraData({'update_result': gettext('Error: the Gadget has not cached its HTML code. Instantiate it previously!')});
  	
  	  // processing command
  	  this.process();
    }
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('PAINT_RESOURCE_DETAILS');
    
    // "this" is binded to a "ResponseCommand" object
    response_command.set_data(resource);
	    
	//Send request to update gadget's code
	this.persistence_engine.send_update(url, {}, response_command, success_callback, error_callback);
  }
}

var CatalogueVoter = function () {
  CatalogueService.call(this);
	  
  this.vote = function (resource, vote) {   
	var url = URIs.POST_RESOURCE_VOTES + '/' + resource.getVendor() + '/' + resource.getName() + '/' + resource.getVersion();

    var success_callback = function(response) {
      // processing command
      var response_text = response.responseText;
      var response_obj = response_text.evalJSON();
      
      var resource = this.get_data();
      
      resource.setVotes(response_obj);
      
      resource.setExtraData({'voting_result': gettext('Done!')});
      
      this.set_data(resource);
    	
      this.process();
    }
    
    var error_callback = function(transport, e) {
  	  var logManager = LogManagerFactory.getInstance();
  	  var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
  	
  	  logManager.log(msg);
  	  
  	  resource.setExtraData({'voting_result': gettext('Error during voting!')});
  	
  	  // processing command
  	  this.process();
    }
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('PAINT_RESOURCE_DETAILS');
    
    // "this" is binded to a "ResponseCommand" object
    response_command.set_data(resource);
	    
	//Send request to update gadget's code
    
    if (resource.getUserVote() == 0)
      this.persistence_engine.send_post(url, {'vote': vote }, response_command, success_callback, error_callback);
    else
      this.persistence_engine.send_update(url, {'vote': vote }, response_command, success_callback, error_callback);
  }
}

var CatalogueTagger = function () {
  CatalogueService.call(this);
		  
  this.tag = function (options) {
		
  }
}