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
  
  this.set_html_code = function (html_code) {
	this.html_code = html_code;
  }
  
  this.set_user_command_manager = function (command_manager) {
	this.user_command_manager = command_manager;
  }
  
  this.set_response_command_dispatcher = function (command_processor) {
	this.resp_command_dispatcher = command_processor;
  }
  
  this.render = function () {
	if (this.rendered)
	  return;
	
	this.dom_element.update(this.html_code);
	
	this.dom_wrapper.init();
    this.user_command_manager.init(this.dom_element);
    this.resp_command_dispatcher.init();
    
    this.rendered = true;
  }
  
  this.fit_height = function () {
	var gadgets = this.dom_wrapper.get_element_by_code('GADGET_LIST');
	var resource_details = this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA');
	
	var screen_height = BrowserUtilsFactory.getInstance().getHeight();
	var top_offset = Position.cumulativeOffset(gadgets)[1];
	
	var center_area_height = screen_height - top_offset - 12 + 'px';
	
	gadgets.style.height = center_area_height;
	resource_details.style.height = center_area_height;
  }
  
  this.destroy = function () {
    this.dom_element.update('');
    this.rendered = false;
  }
  
  this.show = function () {
    this.render();
    this.fit_height();
    
    LayoutManagerFactory.getInstance().showCatalogue();
  }
  
  this.hide = function () {
	LayoutManagerFactory.getInstance().hideView(this.get_dom_element());
  }
  
  this.get_dom_element = function () {
	return this.dom_element;
  }
  
  this.set_style = function (style) {
    this.dom_element.setStyle(style);
  }
}