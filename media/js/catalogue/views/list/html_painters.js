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

var HTML_Painter = function () {
  this.dom_element = null;
	
  this.set_dom_element = function (dom_element) {
	this.dom_element = dom_element;
  }
  
  this.set_dom_wrapper = function (dom_wrapper) {
    this.dom_wrapper = dom_wrapper;
  }
  
  this.paint = function (command, user_command_manager) { }
}

var ListView_ResourcesPainter = function (resource_structure_element) {
  HTML_Painter.call(this);
  
  this.structure_template_element = resource_structure_element;
  
  this.structure_template = new Template(this.structure_template_element.innerHTML);
  
  this.paint = function (command, user_command_manager) {
    var command_data = command.get_data();
    var resources = command_data['resources'];
    
    this.dom_element.update('');
    
    for (var i=0; i<resources.length; i++) {
      var resource_state = resources[i];
      
      var name = resource_state.getName();
      var image_url = resource_state.getUriImage();
      var description = resource_state.getDescription();
      var type = '';
      var button_text = 'Add';
      
      var resource_element = document.createElement('div');
      Element.extend(resource_element);
      resource_element.className = 'resource';
      
      var resource_html = 
    	this.structure_template.evaluate({'image_url': image_url, 'name': name, 'description': description, 
    	                                  'type': type, 'button_text': button_text})
      
      resource_element.update(resource_html);
      
      // Inserting resource html in the DOM
      this.dom_element.appendChild(resource_element);
      
      ///////////////////////////////
      // Binding events to GUI
      ///////////////////////////////
      
      // "Instantiate" 
      var button_list = resource_element.getElementsBySelector('.left_column_resource button')
      if (! button_list || button_list.length != 1) {
    	alert('Problem parsing resource template!');
      }
      
      var button = button_list[0];
      
      user_command_manager.create_command_from_data('INSTANTIATE_RESOURCE', button, resource_state, 'click');
      
      // "Show details"
      var resource_name_list = resource_element.getElementsBySelector('.right_column_resource .resource_name')
      if (! resource_name_list || resource_name_list.length != 1) {
    	alert('Problem parsing resource template!');
      }
      
      var resource_name = resource_name_list[0];
      
      user_command_manager.create_command_from_data('SHOW_RESOURCE_DETAILS', resource_name, resource_state, 'click');
    }
  }
}

var ListView_DeveloperInfoPainter = function (structure_element) {
  HTML_Painter.call(this);
  
  this.local_ids = new Hash({'GADGET_SUBMIT_LINK': '#submit_link', 'GADGET_TEMPLATE_INPUT': '#template_uri',
	                         'SUBMITTED_RESOURCE_DETAILS': '#submitted_resource_details'})
  
  this.structure_template_element = structure_element;
  
  this.paint = function (command, user_command_manager) {
	this.dom_element.update(this.structure_template_element.innerHTML);
	
	var submit_link_selector = this.local_ids['GADGET_SUBMIT_LINK'];
	var submit_link = this.dom_wrapper.get_element_by_selector(submit_link_selector);
	
	var submit_input_selector = this.local_ids['GADGET_TEMPLATE_INPUT'];
	var submit_input = this.dom_wrapper.get_element_by_selector(submit_input_selector);
	
	var data = new Hash({'template_url_element': submit_input}); 
	
	user_command_manager.create_command_from_data('SUBMIT_GADGET', submit_link, data, 'click');
  }
  
  this.paint_adding_gadget_results = function (command, user_command_manager) {
	  
	var resource = command.get_data();
	  
    //showYesNoDialog handlers
    //"Yes" handler
    var continueAdding = function (resource){
	  //leave that gadget version and continue
	  if (resource.isContratable() && resource.isGadget()) {
	    // Link gadget with application
		var available_apps = resource.getAvailableApps();
			
		user_command_manager.set_available_apps(available_apps);
		
		LayoutManagerFactory.getInstance().showWindowMenu('addGadgetToAppMenu', 
				null, 
				function(){ LayoutManagerFactory.getInstance().hideCover() }, 
				resource);
	  }
	  else {
	    user_command_manager.search_by_creation_date();  
	  }
    }.bind(this);
    
    //"No" handler
    var rollback = function(resource)	{
      user_command_manager.delete_resource(resource);
    }.bind(this);
    
    var context = {result: resource, continueAdding: continueAdding, rollback: rollback};
      
    //check if the new gadget is the last version
    if (resource.getLastVersion() != resource.getVersion()) {
      //inform the user about the situation
      var msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
    			"The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
    			" Do you really want to continue to add version %(curr_version)s ");
      
      msg = interpolate(msg, {curr_version: resource.getVersion(), last_version: resource.getLastVersion() }, true);
    	
      LayoutManagerFactory.getInstance().showYesNoDialog(msg, 
    			function (){ continueAdding(resource) },
    			function (){ rollback(resource) }, 
    			Constants.Logging.WARN_MSG);
    }
    else {
      continueAdding(resource);
    }  
  }
}

var ListView_PaginationPainter = function (pagination_structure_element) {
  HTML_Painter.call(this);
  
  this.pagination_structure_element = pagination_structure_element;
  this.pagination_template = new Template(this.pagination_structure_element.innerHTML);
  this.pagination_element = new Template('<a title="#{text} #{page}">#{page}</a>');
  
  this.paint = function (command, user_command_manager) {
	var command_data = command.get_data();
	
	var number_of_elements = command_data['query_results_number'];
	var resources_per_page = command_data['resources_per_page'];
	var current_page = command_data['current_page'];
	var number_of_pages = Math.ceil(parseInt(number_of_elements) / parseInt(resources_per_page));
	
	this.dom_element.update('');
	
	var first_image = 'go-first.png';
	var previous_image = 'go-previous.png';
	var next_image = 'go-next.png';
	var last_image = 'go-last.png';
	var theme =  _currentTheme.name;
	
	if (current_page == 1) {
      first_image = 'go-first-disabled.png';
	  previous_image = 'go-previous-disabled.png';
	}
	
	if (current_page == number_of_pages) {
	  last_image = 'go-last-disabled.png';
	  next_image = 'go-next-disabled.png';
	}
	
	var pagination_html = 
    	this.pagination_template.evaluate({'first_image': first_image, 'next_image': next_image, 'previous_image': previous_image, 
    	                                   'last_image': last_image, 'theme': theme});
	
	this.dom_element.update(pagination_html);
	
	var page_indexes_dom_elements = this.dom_element.getElementsBySelector('.pagination_pages');
	
	if (! page_indexes_dom_elements || page_indexes_dom_elements.length != 1) {
	  alert('Error rendering pagination HTML!');
	  return;
	}
	
	var page_indexes_dom_element = page_indexes_dom_elements[0];
	
	this.paint_page_indexes(page_indexes_dom_element, number_of_pages, current_page, user_command_manager);
    this.bind_buttons(user_command_manager, current_page, number_of_pages);
  }
  
  this.bind_button = function (user_command_manager, page, html_event, element_selector, command_id, element) {
	var data = {'starting_page': page};
	if (! element)
	  element = this.dom_element.getElementsBySelector(element_selector)[0];
	
	user_command_manager.create_command_from_data(command_id, element, data, html_event);
  }
  
  this.bind_buttons = function (user_command_manager, current_page, number_of_pages) {
	if (current_page != 1) {
	  // Binding events of go_first and go_previous buttons
	  this.bind_button(user_command_manager, 1, 'click', '.beginning', 'SIMPLE_SEARCH');
	  this.bind_button(user_command_manager, current_page - 1, 'click', '.previous', 'SIMPLE_SEARCH');
	}
		
	if (current_page != number_of_pages) {
  	  // Binding events of go_first and go_previous buttons
	  this.bind_button(user_command_manager, current_page + 1, 'click', '.next', 'SIMPLE_SEARCH');
	  this.bind_button(user_command_manager, number_of_pages, 'click', '.last', 'SIMPLE_SEARCH');
	}
  }
  
  this.paint_page_indexes = function (page_indexes_div, number_of_pages, current_page, user_command_manager) {
	var lower_page = current_page - 2;
	
	if (lower_page < 1)
		lower_page = 1
	
	var top_margin = Math.min(4, number_of_pages - 1);
	var max_page = lower_page + top_margin;
	
	for (var i=lower_page; i<=max_page; i++) {
	  var page_element = document.createElement('span');
	  
	  page_element = Element.extend(page_element);
	  page_element.className = 'pagination_button';
	
	  var page_html = null; 
	  
	  if (current_page != i) {
		var text = 'Ir a la página ';
		var page_number = i;
		  
		page_html = this.pagination_element.evaluate({'page': page_number, 'text': text});
		
		this.bind_button(user_command_manager, i, 'click', null, 'SIMPLE_SEARCH', page_element);
	  } else {
		page_html = i;
	  }
	  
	  page_element.update(page_html);
	  
	  page_indexes_div.appendChild(page_element);
	}
  }
}
