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

var Catalogue = function (dom_element, dom_wrapper) {
  this.dom_element = dom_element;
  this.dom_wrapper = dom_wrapper;
  this.rendered = false;
  
  this.html_code = null;
  this.user_command_manager = null;
  this.resp_command_dispatcher = null;
  
  //header
  this.catalogue_header = null;
  this.ws_link = null;	//link to active workspace in the toolbar
  this.catalogue_nav_bar = $('catalogue_nav_bar');
  
  this.available_apps = [];
  
  this.first_search_done = false;
  
  this.set_html_code = function (html_code) {
	this.html_code = html_code;
  }
  
  this.set_user_command_manager = function (command_manager) {
	this.user_command_manager = command_manager;
  }
  
  this.set_response_command_dispatcher = function (command_processor) {
	this.resp_command_dispatcher = command_processor;
  }
  
  this.set_available_apps = function (available_apps) {
	this.available_apps = available_apps;
  }
  
  this.add_gadget_to_app = function (gadget, app) {
    this.user_command_manager.add_gadget_to_app(gadget, app);
  }
  
  this.render = function () {
	if (this.rendered)
	  return;
	
	this.dom_element.update(this.html_code);
	
    this.dom_wrapper.init();
    this.resp_command_dispatcher.init();
    this.user_command_manager.init(this.dom_element);
    
    this.rendered = true;
  }
  
  this.fit_height = function () {
	var gadgets = this.dom_wrapper.get_element_by_code('GADGET_LIST');
	var mashups = this.dom_wrapper.get_element_by_code('MASHUP_LIST');
	var developer_area = this.dom_wrapper.get_element_by_code('DEVELOPER_INFO_AREA');
	var resource_details = this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA');
	
	var screen_height = BrowserUtilsFactory.getInstance().getHeight();
	var tabs_offset = Position.cumulativeOffset(gadgets)[1];
	var no_search_bar_offset = Position.cumulativeOffset(developer_area)[1];
	
	var search_bar_area_height = screen_height - tabs_offset + 'px';
	var no_search_bar_area_height = screen_height - no_search_bar_offset + 'px';
	
	gadgets.style.height = search_bar_area_height;
	mashups.style.height = search_bar_area_height;
	developer_area.style.height = no_search_bar_area_height;
	resource_details.style.height = no_search_bar_area_height;
  }
  
  this.destroy = function () {
    this.dom_element.update('');
    this.rendered = false;
  }
  
  this.show_bar = function () {
	this.catalogue_nav_bar.style.display = 'block';
  }
  
  this.hide_bar = function () {
	this.catalogue_nav_bar.style.display = 'none';   
  }
  
  this.show = function () {
    this.render();
    
    if (!this.first_search_done) {
      this.user_command_manager.run_initial_commands();
      this.fit_height();
      
      this.first_search_done = true;
    }
    
    this.show_bar();
    
    LayoutManagerFactory.getInstance().showCatalogue();
  }
  
  this.hide = function () {
	this.hide_bar();
	LayoutManagerFactory.getInstance().hideView(this.get_dom_element());
  }
  
  this.get_dom_element = function () {
	return this.dom_element;
  }
  
  this.get_available_apps = function () {
	return this.available_apps;
  }
  
  this.set_style = function (style) {
    this.dom_element.setStyle(style);
  }
  
  /*
   * Banner operations
   */
  
  var _buttonHandler = function(){
							this.show();
						}.bind(this);
						
						
  this.getHeader = function(){
  	return this.catalogue_header;
  }
  
  /**
  *
  * set the proper handlers to the workspace toolbar buttons
  */
  this.initToolbar = function () {
  	this.catalogue_header = $('catalogue_header');
	if (this.catalogue_header) {
		this.ws_link = this.catalogue_header.getElementsBySelector('#catalogue_dragboard_link')[0];
		
		//set the handlers
		OpManagerFactory.getInstance().activeWorkSpace.setToolbarButton(this.ws_link);
	}
  }
  
  /**
  *
  * unset the handlers of the workspace toolbar buttons
  */		
  this.unloadToolbar = function(){
  	if (this.catalogue_header) {
		OpManagerFactory.getInstance().activeWorkSpace.unsetToolbarButton(this.ws_link);
	}	
  }
  
  /**
  * This function knows which handler matches the catalogue link in the toolbar
  * @param {HTML element} catalogueLinkElement
  */
  this.setToolbarButton = function (catalogueLinkElement){
	Event.observe(catalogueLinkElement,
				"click",
				_buttonHandler,
				false,
				"show_catalogue"
				); 
  }

  /**
  * This function knows how to stop observing the wiring link event
  * @param {HTML element} catalogueLinkElement
  */
  this.unsetToolbarButton = function (catalogueLinkElement){
	Event.stopObserving(catalogueLinkElement,
						'click',
						_buttonHandler);
  }
  
}