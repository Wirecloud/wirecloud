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
  
  this.configure = function () {
    this.resources_per_page_combo = this.dom_wrapper.get_element_by_code('RESULTS_PER_PAGE_COMBO');
    this.order_by_combo = this.dom_wrapper.get_element_by_code('ORDER_BY_COMBO');
    this.search_input = this.dom_wrapper.get_element_by_code('SEARCH_INPUT');
    
    this.configured = true;
  }
  
  this.search = function (operation, starting_page, search_boolean) {
	if (! this.configured)
	  this.configure();
	
    resources_per_page = this.get_selected_option(this.resources_per_page_combo);  
	order_by = this.get_selected_option(this.order_by_combo); 
	search_criteria = this.search_input.value;
	  
	if (operation == 'SIMPLE_SEARCH' && ! search_criteria)
	  operation = 'VIEW_ALL';
		
    this.searcher.search(operation, search_criteria, starting_page, resources_per_page, order_by, search_boolean);
  }
  
  this.vote = function (data) {
	this.voter.vote(data);
  }
  
  this.tag = function (data) {
	this.tagger.tag(data);
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
}