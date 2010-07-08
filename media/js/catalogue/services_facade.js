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

var ServicesFacade = function (persistence_engine, dom_wrapper, resp_command_processor) {

  this.persistence_engine = persistence_engine;
  this.dom_wrapper = dom_wrapper;
  
  this.resp_command_processor = resp_command_processor;
  this.searcher = null;
  this.tagger = null;
  this.voter = null;
  
  this.configured = false;
  
  // HTML elements with data needed for the service invocation
  this.resources_per_page_combo = null;
  this.order_by_combo = null;
  this.search_input = null;
  
  this.set_searcher = function (searcher) {
	this.searcher = searcher;
	this.searcher.set_persistence_engine(this.persistence_engine);
	this.searcher.set_response_command_processor(this.resp_command_processor);
  }
  
  this.set_tagger = function (tagger) {
	this.tagger = tagger;
	this.tagger.set_persistence_engine(this.persistence_engine);
	this.tagger.set_response_command_processor(this.resp_command_processor);
  }
  
  this.set_voter = function (voter) {
	this.voter = voter;
	this.voter.set_persistence_engine(this.persistence_engine);
	this.voter.set_response_command_processor(this.resp_command_processor);
  }
  
  this.set_resource_submitter = function (submitter) {
	this.resource_submitter = submitter;
	this.resource_submitter.set_persistence_engine(this.persistence_engine);
	this.resource_submitter.set_response_command_processor(this.resp_command_processor);
  }
  
  this.configure = function () {
    this.resources_per_page_combo = this.dom_wrapper.get_element_by_code('RESULTS_PER_PAGE_COMBO');
    this.order_by_combo = this.dom_wrapper.get_element_by_code('ORDER_BY_COMBO');
    this.search_input = this.dom_wrapper.get_element_by_code('SEARCH_INPUT');
    
    this.template_input = this.dom_wrapper.get_element_by_code('SUBMIT_GADGET_INPUT');
    
    this.configured = true;
  }
  
  this.search = function (operation, starting_page, search_boolean, scope, criteria) {
	if (! this.configured)
	  this.configure();
	
    var resources_per_page = this.get_selected_option(this.resources_per_page_combo);  
	var order_by = this.get_selected_option(this.order_by_combo); 
	var search_criteria = this.search_input.value;
	
	if (scope)
	  this.searcher.set_scope(scope);
	
	if (criteria)
	  search_criteria = criteria;
	  
	if (operation == 'SIMPLE_SEARCH' && ! search_criteria)
	  operation = 'VIEW_ALL';
		
    this.searcher.search(operation, search_criteria, starting_page, resources_per_page, order_by, search_boolean, scope);
  }
  
  this.vote = function (resource, vote) {
	this.voter.vote(resource, vote);
  }
  
  this.tag = function (resource, tag) {
	var tags_xml = "<Tags><Tag>" + tag + "</Tag></Tags>";
	this.tagger.tag(resource, tags_xml);
  }
  
  this.delete_tag = function (resource, tag_id) {
	this.tagger.delete_tag(resource, tag_id);
  }
  
  this.submit_gadget_to_catalogue = function (data) {
	var template_url = data['template_url_element'].value;
	  
    this.resource_submitter.add_gadget_from_template(template_url);
  }
  
  this.add_resource_by_template = function (template_url) {
    this.resource_submitter.add_gadget_from_template(template_url);
  }
  
  this.delete_resource = function (resource) { 
    this.resource_submitter.delete_resource(resource);
  }
  
  this.change_preferred_version = function (resource, version) { 
    this.resource_submitter.change_preferred_version(resource, version);
  }
  
  this.update_resource_html = function (resource) { 
    this.resource_submitter.update_resource_html(resource);
  } 
  
  this.add_gadget_to_app = function (gadget, app) { 
    this.resource_submitter.add_gadget_to_app(gadget, app);
  }
  
  this.buy_resource_applications = function (resource) { 
    this.resource_submitter.buy_resource_applications(resource);
  }
  
  this.repeat_last_search = function () {
    this.searcher.repeat_last_search();
  }
  
  this.search_by_creation_date = function () {
	var order_by = this.set_option(this.order_by_combo, '-creation_date'); 
	  
	this.search('VIEW_ALL', 1, 'AND');
  }
  
  this.create_local_command = function (command_code, data) {
	var response_command = new ResponseCommand(this.resp_command_processor, null);
	
	response_command.set_id(command_code);
	response_command.set_data(data);
	
	return response_command;
  }
  
  ///////////////////////////////////////////////////////////////
  // Aux functions in order to manage HTML elements complexity
  //////////////////////////////////////////////////////////////
  
  this.get_selected_option = function (combo_element) {
	var index = combo_element.selectedIndex;
		
	return combo_element.options[index].value;
  }
  
  this.set_option = function (combo_element, option_value) {
	for (var i=0; i<combo_element.options.length; i++) {
	  if (combo_element.options[i].value == option_value) {
	    combo_element.selectedIndex = i;
	    return;
	  }
	}

	alert('Not option found in <select>!');
  }
}