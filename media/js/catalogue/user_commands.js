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
		
  this.anonymous_function = this.anonymous_function.bind(this);
  
  if (this.dom_element)
    Event.observe(this.dom_element, this.html_event, this.anonymous_function);
  
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

    this.services.search('SIMPLE_SEARCH', this.data['starting_page'], this.data['boolean_operator'], this.data['scope'], this.data['criteria']);
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var InstantiateCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) {   
	var resource = this.data;;
	  
	//contratable resources
	if (resource.isContratable() && !resource.hasContract()) {
	  LayoutManagerFactory.getInstance().showWindowMenu(
			  'purchaseAppMenu', 
			  this.services,
	          function () { LayoutManagerFactory.getInstance().hideCover() },
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

var ShowWindowCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    var window_name = this.data['window'];
        
    LayoutManagerFactory.getInstance().showWindowMenu(window_name);
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

var ShowToolbarSectionCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	var command_id = data;
	var search_scope = this.services.searcher.get_scope();
	
    var response_command = this.services.create_local_command(command_id, search_scope);
    
    response_command.process();
  }
	
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var ShowTabCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) {
	var command_id = data;
	var search_scope = null;
	
	if (command_id == 'SHOW_GADGETS')
	  search_scope = 'gadget';
		
	if (command_id == 'SHOW_MASHUPS')
	  search_scope = 'mashup';
	
	if (search_scope)
	  this.services.searcher.set_scope(search_scope);
	
	var response_command = this.services.create_local_command(command_id, null);
	
	response_command.process();
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var SubmitGadgetCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	this.services.submit_gadget_to_catalogue(this.data);
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var DeleteResourceCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	this.services.delete_resource(this.data);
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var UpdateResourceHTMLCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	this.services.update_resource_html(this.data);
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var TagResourceCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    var target = BrowserUtilsFactory.getInstance().getTarget(event);
	
    var tagging_area_div = target.nextSiblings()[0];
	
    tagging_area_div.toggleClassName('hidden');
    
    this.tag_input = tagging_area_div.getElementsBySelector('.tag_input')[0];
    var submit_tag_link = tagging_area_div.getElementsBySelector('.submit_tag_link')[0];
    
    Event.observe(submit_tag_link, 'click', submit_tag_to_resource.bind(this));
    Event.observe(this.tag_input, 'keypress', submit_tag_to_resource.bind(this));
  }
  
  var submit_tag_to_resource = function (event) { 
	if (event instanceof KeyboardEvent && event.keyCode != '13') {
	  // Do nothing!
	  return;
	}

    this.services.tag(this.data, this.tag_input.value)
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var RemoveResourceTagCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) {	
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	
	var tag_id = target.tag_id;
	
    this.services.delete_tag(this.data, tag_id);
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var VoteResourceCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    var target = BrowserUtilsFactory.getInstance().getTarget(event);
	
    var operation_area_div = target.nextSiblings()[0];
	var popularity_div = operation_area_div.getElementsBySelector('.popularity')[0];
	
	operation_area_div.toggleClassName('hidden');
	
	if (!popularity_div.binded_events) {
	  bind_popularity_events(popularity_div, this);
	
	  popularity_div.binded_events = true;
	}
  }
	  
  var bind_popularity_events = function (popularity_div, vote_command) {
	var user_vote = vote_command.data.getUserVote();
	
    var vote_stars = popularity_div.childElements();
    
    for (var i=0.0; i<vote_stars.length; i++) {
      var vote_star = vote_stars[i];
      
      if (user_vote>i) {
        vote_star.addClassName('on');
      }
      
      Event.observe(vote_star, 'mouseover', mark_previous_stars);
      Event.observe(vote_star, 'click', commit_voting.bind(vote_command));
    }
    
    Event.observe(popularity_div, 'mouseout', unmark_not_committed_stars);
  }
	  
  var mark_previous_stars = function (event) {
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	
	target.addClassName('on');
	
	var previous_sibling = target.previousElementSibling;
	
	while (previous_sibling) {
		previous_sibling.addClassName('on');
		
		previous_sibling = previous_sibling.previousElementSibling;
	}
  }
  
  var commit_voting = function (event) {
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	var vote = target.previousSiblings().length + 1;
	
	target.parentNode.committed_voting = target;
	
	mark_previous_stars(event);
	unmark_not_committed_stars(event);
	
	this.services.vote(this.data, vote);
  }
  
  var unmark_not_committed_stars = function (event) {
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	var stars_container = target.parentNode;
	var next_sibling = null;
	
	if (stars_container.committed_voting) {
	  next_sibling = stars_container.committed_voting.nextElementSibling;
	} else {
	  next_sibling = target.parentNode.firstElementChild;
	}
	  
	while (next_sibling) {
	  next_sibling.removeClassName('on');
			
	  next_sibling = next_sibling.nextElementSibling;
	}
	
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var ChangeResourceVersionCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	var operation_area_div = target.nextSiblings()[0];
	var versions_area_div = operation_area_div.getElementsBySelector('.operation_content')[0];
	
	operation_area_div.toggleClassName('hidden');
	
	var resource = this.data;
	
	var resource_versions = resource.getAllVersions();
	var html_versions = '';
	
	versions_area_div.update('');
	
	for (var i=0; i<resource_versions.length; i++) {
	  var version = resource_versions[i];
	  
	  var element_tag = 'a'
	  
	  if (version == resource.getVersion()) {
	    element_tag  = 'div'
	  }
	  
	  var element = document.createElement(element_tag)
	  element = Element.extend(element);
	  element.addClassName('available_version');
	  
	  element.version_code = version;
	  
	  if (version == resource.getVersion())
		element.addClassName('bold'); 
	  else {
		Event.observe(element, 'click', mark_as_preferred_version.bind(this));
	  }
	  
	  element.update('v'+version);
	  
	  versions_area_div.appendChild(element);
		
	}
  }
  
  var mark_as_preferred_version = function (event) {
	var target = BrowserUtilsFactory.getInstance().getTarget(event);
	
	var resource = this.data;
	var preferred_version = target.version_code;
	
	this.services.change_preferred_version(resource, preferred_version);
  }
  
	  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var ShowResourceListCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
	var resource = this.data;
	var type_of_resources = '';
	
	if (resource.isMashup())
	  type_of_resource = 'SHOW_MASHUPS';
	else
	  type_of_resource = 'SHOW_GADGETS';
	
    var response_command = this.services.create_local_command(type_of_resource, data);
    
    response_command.process();
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
}

var SubmitPackagedGadgetCommand = function (dom_element, html_event, service_facade, dom_wrapper, data) {
  this.anonymous_function = function(event) { 
    UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
    LayoutManagerFactory.getInstance()._startComplexTask(gettext("Uploading packaged gadget"), 1);

    var upload = document.getElementById("upload_form");
    var iframe = document.getElementById("upload");
  
    if (!iframe.onload)
	  iframe.onload = function(){checkFile();};
  
    upload.submit();
  }
  
  UserCommand.call(this, dom_element, html_event, service_facade, dom_wrapper, data);
  
  ////////////////////////////////////////////////////////////
  // INTERNAL AUX FUNCTIONS FOR THIS COMMAND
  ////////////////////////////////////////////////////////////
  var checkFile = function () {
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
  }
}





