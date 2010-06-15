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

var ListViewFactory  = function () {
	
  this.COMMANDS_INFO = new Hash({'#view_all': 'VIEW_ALL', '#simple_search input': 'SIMPLE_SEARCH',
	                             '#results_per_page': 'SIMPLE_SEARCH', '#results_order': 'SIMPLE_SEARCH',
	                             '#gadgets_button': 'SIMPLE_SEARCH', '#mashups_button': 'SIMPLE_SEARCH',
	                             '#developers_button': 'SHOW_DEVELOPER_INFO'});
  
  this.DOM_ELEMENT_IDS = new Hash({'ORDER_BY_COMBO': '#results_order', 'RESULTS_PER_PAGE_COMBO': '#results_per_page', 
	                               'PAGINATION_AREA': '#paginate', 'GADGET_LIST': '#gadgets', 
	                               'SEARCH_INPUT': '#simple_search input', 'RESOURCE_DETAILS_AREA': '#resource_details', 
	                               'MASHUP_LIST': '#mashups', 'SEARCH_OPTIONS_AREA': '#catalogue_resources_header',
	                               'GADGETS_BUTTON': '#gadgets_button', 'MASHUPS_BUTTON': '#mashups_button',
	                               'DEVELOPERS_BUTTON': '#developers_button', 'DEVELOPER_INFO_AREA': '#developer_info'});
  
  this.catalogue_structure_dom = $('list_view_catalogue_structure');
  this.resource_structure_dom = $('list_view_resource_structure_template');
  this.pagination_structure_dom = $('pagination_structure');
  this.resource_details_structure_dom = $('list_view_resource_structure_template');
  this.developer_info_structure_dom = $('list_view_developer_info_structure');
  
  this.catalogue = null;
  this.user_command_manager = null;
  this.dom_wrapper = null;
  this.services = null;
  this.searcher = null;
  this.voter = null;
  this.tagger = null;
  this.resource_submitter = null;

  this.get_html_code = function () {
	return this.catalogue_structure_dom.innerHTML;
  }

  this.get_commands_info = function () {
	return this.COMMANDS_INFO;
  }
  
  this.get_dom_element_ids = function () {
    return this.DOM_ELEMENT_IDS;
  }
  
  this.create_catalogue = function (catalogue_element, persistence_engine) {
	////////////////////////// 
	// HTML management
	//////////////////////////
	this.dom_wrapper = new DOM_Wrapper(catalogue_element, this.get_dom_element_ids());
	
	this.user_command_manager = new ListView_UserCommandManager(this.dom_wrapper);
	this.resp_command_dispatcher = new ListView_ResponseCommandDispatcher(this.dom_wrapper, this.user_command_manager);
	
	this.gadgets_painter = new ListView_ResourcesPainter(this.resource_structure_dom);
	this.mashups_painter = new ListView_ResourcesPainter(this.resource_structure_dom);
	this.pagination_painter = new ListView_PaginationPainter(this.pagination_structure_dom);
	this.resource_details_painter = new ListView_PaginationPainter(this.resource_details_structure_dom);
	this.developer_info_painter = new ListView_DeveloperInfoPainter(this.developer_info_structure_dom);
	
	this.catalogue = new Catalogue(catalogue_element, this.dom_wrapper);
	
	// Configuring "user_command_manager"
	this.user_command_manager.set_commands_info(this.get_commands_info());
	this.user_command_manager.set_catalogue(this.catalogue);
	
	// Configuring "resp_command_processor"
	this.resp_command_dispatcher.set_painter('GADGETS_PAINTER', this.gadgets_painter);
	this.resp_command_dispatcher.set_painter('PAGINATION_PAINTER', this.pagination_painter);
	this.resp_command_dispatcher.set_painter('MASHUPS_PAINTER', this.mashups_painter);
	this.resp_command_dispatcher.set_painter('RESOURCE_DETAILS_PAINTER', this.resource_details_painter);
	this.resp_command_dispatcher.set_painter('DEVELOPERS_PAINTER', this.developer_info_painter);
	
	this.catalogue.set_html_code(this.get_html_code());
    this.catalogue.set_user_command_manager(this.user_command_manager);
    this.catalogue.set_response_command_dispatcher(this.resp_command_dispatcher);
    
    ///////////////////////////
    // Services management
    ///////////////////////////
    this.persistence_engine = persistence_engine;
    
    this.services = new ServicesFacade(this.persistence_engine, this.dom_wrapper, this.resp_command_dispatcher);
    this.searcher = new CatalogueSearcher();
    this.voter = new CatalogueVoter();
    this.tagger = new CatalogueTagger();
    this.resource_submitter = new CatalogueResourceSubmitter();
    
    // Configuring searcher
    this.searcher.set_scope('gadget');
    
    this.services.set_voter(this.voter);
    this.services.set_tagger(this.tagger);
    this.services.set_searcher(this.searcher);
    this.services.set_resource_submitter(this.resource_submitter);
    
    /////////////////////////////////////////////
    // Linking HTML and Services main classes
    /////////////////////////////////////////////
    this.user_command_manager.set_services(this.services);
    
    this.catalogue.render();
    
    return this.catalogue;
  }
}