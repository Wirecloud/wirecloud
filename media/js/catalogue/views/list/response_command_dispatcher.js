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

var ListView_ResponseCommandDispatcher = function (dom_wrapper, user_command_manager) {
  this.dom_wrapper = dom_wrapper;
  this.user_command_manager = user_command_manager;
  
  // Painter's Hash
  this.painters = new Hash();

}

ListView_ResponseCommandDispatcher.prototype.set_painter = function (painter_code, painter) {
  this.painters[painter_code] = painter;
}

ListView_ResponseCommandDispatcher.prototype.init = function () { 
  var pagination_div = this.dom_wrapper.get_element_by_code('PAGINATION_AREA');
  this.painters['PAGINATION_PAINTER'].set_dom_element(pagination_div);
	 
  var gadgets_div = this.dom_wrapper.get_element_by_code('GADGET_LIST');
  this.painters['GADGETS_PAINTER'].set_dom_element(gadgets_div);
  
  var mashups_div = this.dom_wrapper.get_element_by_code('MASHUP_LIST');
  this.painters['MASHUPS_PAINTER'].set_dom_element(mashups_div);
  
  var resource_details_div = this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA');
  this.painters['RESOURCE_DETAILS_PAINTER'].set_dom_element(resource_details_div);
}

ListView_ResponseCommandDispatcher.prototype.process = function (resp_command) {
  var command_id = resp_command.get_id();
  
  switch (command_id) {
  case 'PAINT_GADGETS':
	this.show_gadgets_section();
	this.painters['GADGETS_PAINTER'].paint(resp_command, this.user_command_manager);
	this.painters['PAGINATION_PAINTER'].paint(resp_command, this.user_command_manager);
	break;
  case 'PAINT_MASHUPS':
	this.show_mashups_section();
	this.painters['MASHUPS_PAINTER'].paint(resp_command, this.user_command_manager);
	this.painters['PAGINATION_PAINTER'].paint(resp_command, this.user_command_manager);
	break;
  case 'PAINT_RESOURCE_DETAILS':
	this.show_resource_details_section();
	break;
  default:
	alert('Missing command code at ResponseCommandProcessor!');
	return;
  }
}

ListView_ResponseCommandDispatcher.prototype.show_gadgets_section = function () {
  this.dom_wrapper.get_element_by_code('SEARCH_OPTIONS_AREA').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('PAGINATION_AREA').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('GADGET_LIST').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('MASHUP_LIST').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA').setStyle({'display': 'none'});
}

ListView_ResponseCommandDispatcher.prototype.show_mashups_section = function () {
  this.dom_wrapper.get_element_by_code('SEARCH_OPTIONS_AREA').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('PAGINATION_AREA').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('GADGET_LIST').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('MASHUP_LIST').setStyle({'display': 'block'});
  this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA').setStyle({'display': 'none'});
}

ListView_ResponseCommandDispatcher.prototype.show_resource_details_section = function () {
  this.dom_wrapper.get_element_by_code('SEARCH_OPTIONS_AREA').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('PAGINATION_AREA').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('GADGET_LIST').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('MASHUP_LIST').setStyle({'display': 'none'});
  this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA').setStyle({'display': 'block'});
}

