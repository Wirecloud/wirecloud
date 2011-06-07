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
  this.initialized_scopes = new Hash();
  
  this.set_scope = function (scope) {
	this.scope = scope;
	
	if (this.initialized_scopes[scope])
	  return true;
	
	this.initialized_scopes[scope] = true;
	
	return false;
	
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
        var response_json, resource_list, preferred_versions, resources, i,
            key;

        response_json = JSON.parse(response.responseText);
        resource_list = response_json['resources'];
	
        if (resource_list) {
            preferred_versions = CookieManager.readCookie('preferred_versions', true);
            if (preferred_versions == null) {
                preferred_versions = {};
            }

            resources = [];

            for (i = 0; i < resource_list.length; i += 1) {
                resource = new ResourceState(resource_list[i]);
                resources.push(resource);
                key = resource.getVendor() + '/' + resource.getName();
                if (key in preferred_versions) {
                    resource.changeVersion(preferred_versions[key]);
                }
            }

            return {
                'resources': resources,
                'preferred_versions': preferred_versions,
                'query_results_number': response.getResponseHeader('items'),
                'resources_per_page': command.resources_per_page,
                'current_page': command.current_page
            }
        }
    };
  
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
		
	var error_callback = function (transport, e) {
            var logManager, layoutManager, msg;

            logManager = LogManagerFactory.getInstance();
            layoutManager = LayoutManagerFactory.getInstance();

            msg = logManager.formatError(gettext("Error searching the catalogue: %(errorMsg)s."), transport, e);
            logManager.log(msg);
            layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
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
  
  this.process_response = function (response_text, command) {
	var resource_state = JSON.parse(response_text);
	
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
        var preferred_versions, response_command;

        preferred_versions = CookieManager.readCookie('preferred_versions', true);
        if (preferred_versions === null) {
            preferred_versions = {};
        }
        preferred_versions[resource.getVendor() + '/' + resource.getName()] = version.text;
        CookieManager.createCookie('preferred_versions', preferred_versions, 30);
        resource.changeVersion(version);

        // CommandResponse creation
        response_command = new ResponseCommand(this.resp_command_processor, this);
        response_command.set_id('PAINT_RESOURCE_DETAILS');
	response_command.set_data(resource);
	response_command.process();
    };
  
  this.add_gadget_from_template = function (template_uri) {
	
    var error_callback = function (transport, e) {
        var logManager, layoutManager, msg;

        logManager = LogManagerFactory.getInstance();
        layoutManager = LayoutManagerFactory.getInstance();

        msg = logManager.formatError(gettext("The resource could not be added to the catalogue: %(errorMsg)s."), transport, e);

        logManager.log(msg);
        layoutManager._notifyPlatformReady();
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    }

    var success_callback = function (response) { 
        var layoutManager, processed_response_data;
        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logSubTask(gettext('Processing catalogue response'));

        processed_response_data = this.caller.process_response(response.responseText, this);
    
        // "this" is binded to a "ResponseCommand" object
        this.set_data(processed_response_data);

        layoutManager._notifyPlatformReady();

        // processing command
        this.process();
    }
    
    var layoutManager = LayoutManagerFactory.getInstance();
    layoutManager._startComplexTask(gettext("Adding the resource to the catalogue"), 2);
    layoutManager.logSubTask(gettext('Sending resource template to the catalogue'));

    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('SUBMIT_GADGET');
    
    var params = new Hash();
    
    params['template_uri'] = template_uri;
	
    this.persistence_engine.send_post(URIs.GET_POST_RESOURCES, params, response_command, success_callback, error_callback);
  }

  this.add_gadget_from_wgt = function () {
    var checkFile = function () {
      var iframe = document.getElementById("upload");

      if (iframe.contentDocument) {
        var doc = iframe.contentDocument;
      } else if (iframe.contentWindow) {
        var doc = iframe.contentWindow.document;
      } else {
        var doc = window.frames["upload"].document;
      }

      var layoutManager = LayoutManagerFactory.getInstance();

      doc.body.getTextContent = Element.prototype.getTextContent;
      if (doc.location.href.search("error") >= 0) {
        var logManager = LogManagerFactory.getInstance();
        var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s");
        msg = interpolate(msg, {errorMsg: doc.body.getTextContent()}, true);

        layoutManager._notifyPlatformReady();
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
        logManager.log(msg);
        return;
      } else {
        layoutManager.logSubTask(gettext('Gadget uploaded successfully'));
        layoutManager.logStep('');
        layoutManager._notifyPlatformReady();

        // "this" is binded to a "ResponseCommand" object
        var processed_response_data = this.caller.process_response(doc.body.getTextContent(), this);
        this.set_data(processed_response_data);
        this.process();
      }
    }

    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('SUBMIT_PACKAGED_GADGET');

    LayoutManagerFactory.getInstance()._startComplexTask(gettext("Uploading packaged gadget"), 1);
    var upload = document.getElementById("upload_form");
    var iframe = document.getElementById("upload");

    iframe.onload = checkFile.bind(response_command);

    upload.submit();
  }

  this.delete_resource = function (resource) {
    var url = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion().text;

    var success_callback = function(response) {
      // processing command
      var layoutManager = LayoutManagerFactory.getInstance();
      var result = JSON.parse(response.responseText);

      layoutManager.logSubTask(gettext('Removing affected iGadgets'));
      var opManager = OpManagerFactory.getInstance();
      for (var i = 0; i < result.removedIGadgets.length; i += 1) {
        opManager.removeInstance(result.removedIGadgets[i], true);
      }

      layoutManager.logSubTask(gettext('Purging gadget info'));
      var gadgetId = resource.getVendor() + '_' + resource.getName() + '_' + resource.getVersion().text;
      ShowcaseFactory.getInstance().deleteGadget(gadgetId);

      layoutManager._notifyPlatformReady();
      this.process();
    }

    var error_callback = function(transport, e) {
      var logManager = LogManagerFactory.getInstance();
      var layoutManager = LayoutManagerFactory.getInstance();

      var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);

      logManager.log(msg);
      layoutManager._notifyPlatformReady();
      layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    }

    var doRequest = function() {
      var layoutManager = LayoutManagerFactory.getInstance();
      layoutManager._startComplexTask(gettext("Deleting gadget resource from catalogue"), 3);
      layoutManager.logSubTask(gettext('Requesting server'));

      var response_command = new ResponseCommand(this.resp_command_processor, this);
      response_command.set_id('REPEAT_SEARCH');

      //Send request to delete de gadget
      this.persistence_engine.send_delete(url, response_command, success_callback, error_callback);
    }

    // First ask the user
    var msg = gettext('Do you really want to remove the "%(name)s" (vendor: "%(vendor)s", version: "%(version)s") gadget?');
    var context = {
      name: resource.getName(),
      vendor: resource.getVendor(),
      version: resource.getVersion().text
    };

    msg = interpolate(msg, context, true);
    LayoutManagerFactory.getInstance().showYesNoDialog(msg, doRequest.bind(this));
  }

  this.update_resource_html = function (resource) {
	var context = {'vendor': resource.getVendor(), 'name': resource.getName(), 'version': resource.getVersion().text};
    
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
	var url = URIs.POST_RESOURCE_VOTES + '/' + resource.getVendor() + '/' + resource.getName() + '/' + resource.getVersion().text;

    var success_callback = function(response) {
      // processing command
      var response_obj = JSON.parse(response.responseText);
      
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
		  
  this.tag = function (resource, tags_data) {
    var url = URIs.POST_RESOURCE_TAGS + '/' + resource.getVendor() + '/' + resource.getName() + '/' + resource.getVersion().text;

    var success_callback = function(response) {
      // processing command
      var response_obj = JSON.parse(response.responseText);
      
      var resource = this.get_data();
      
      var new_tags = response_obj['tagList']
      
      resource.setTags(new_tags);
      
      resource.setExtraData({'tagging_result': gettext('Done!')});
      
      this.set_data(resource);
    	
      this.process();
    }
    
    var error_callback = function(transport, e) {
  	  var logManager = LogManagerFactory.getInstance();
  	  var msg = logManager.formatError(gettext("Error tagging Gadget: %(errorMsg)s."), transport, e);
  	
  	  logManager.log(msg);
  	  
  	  resource.setExtraData({'tagging_result': gettext('Error during tagging!')});
  	
  	  // processing command
  	  this.process();
    }
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('PAINT_RESOURCE_DETAILS');
    
    // "this" is binded to a "ResponseCommand" object
    response_command.set_data(resource);
	    
	//Send request to update gadget's code
    var params = new Hash();
    
    params['tags_xml'] = tags_data;
    
    this.persistence_engine.send_post(url, params, response_command, success_callback, error_callback);	  
  }
  
  this.delete_tag = function (resource, tag_id) {
    var url = URIs.POST_RESOURCE_TAGS + '/' + resource.getVendor() + '/' + resource.getName() + '/' + resource.getVersion().text + '/' + tag_id;

    var success_callback = function(response) {
      // processing command
      var response_obj = JSON.parse(response.responseText);
      
      var resource = this.get_data();
      
      var new_tags = response_obj['tagList']
      
      resource.setTags(new_tags);
      
      resource.setExtraData({'tagging_result': gettext('Done!')});
      
      this.set_data(resource);
    	
      this.process();
    }
    
    var error_callback = function(transport, e) {
  	  var logManager = LogManagerFactory.getInstance();
  	  var msg = logManager.formatError(gettext("Error tagging Gadget: %(errorMsg)s."), transport, e);
  	
  	  logManager.log(msg);
  	  
  	  resource.setExtraData({'tagging_result': gettext('Error during tagging!')});
  	
  	  // processing command
  	  this.process();
    }
    
    var response_command = new ResponseCommand(this.resp_command_processor, this);
    response_command.set_id('PAINT_RESOURCE_DETAILS');
    
    // "this" is binded to a "ResponseCommand" object
    response_command.set_data(resource);
    
    this.persistence_engine.send_delete(url, response_command, success_callback, error_callback);	  
  }
}
