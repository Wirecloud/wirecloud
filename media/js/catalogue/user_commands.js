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
