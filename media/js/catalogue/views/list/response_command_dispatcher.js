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
    this.painters[painter_code].set_dom_wrapper(this.dom_wrapper);
}

ListView_ResponseCommandDispatcher.prototype.init = function () { 
    //PAINTERS
    var pagination_div = this.dom_wrapper.get_element_by_code('PAGINATION_AREA');
    this.painters['PAGINATION_PAINTER'].set_dom_element(pagination_div);

    var gadgets_div = this.dom_wrapper.get_element_by_code('GADGET_LIST');
    this.painters['GADGETS_PAINTER'].set_dom_element(gadgets_div);

    var mashups_div = this.dom_wrapper.get_element_by_code('MASHUP_LIST');
    this.painters['MASHUPS_PAINTER'].set_dom_element(mashups_div);

    var developers_div = this.dom_wrapper.get_element_by_code('DEVELOPER_INFO_AREA');
    this.painters['DEVELOPERS_PAINTER'].set_dom_element(developers_div);

    var resource_details_div = this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA');
    this.painters['RESOURCE_DETAILS_PAINTER'].set_dom_element(resource_details_div);

    // TOOLBAR BUTTONS
    this.search_button = this.dom_wrapper.get_element_by_code('SEARCH_TOOLBAR_BUTTON');
    this.developers_button = this.dom_wrapper.get_element_by_code('DEVELOPERS_BUTTON');

    // TAB BAR AREA
    this.tab_bar = this.dom_wrapper.get_element_by_code('TAB_BAR');
    this.mashups_button = this.dom_wrapper.get_element_by_code('MASHUPS_BUTTON');
    this.gadgets_button = this.dom_wrapper.get_element_by_code('GADGETS_BUTTON');
}

ListView_ResponseCommandDispatcher.prototype.process = function (resp_command) {
    var display_options = {
        'search_options': 'none', 'pagination':'none', 'developer_info': 'none',
        'gadget_list':'none', 'mashup_list':'none', 'resource_details':'none',
        'tab_bar': 'none'};

    var services = this.user_command_manager.get_service_facade();
    var command_id = resp_command.get_id();

    switch (command_id) {
    case 'PAINT_GADGETS':
    case 'SHOW_GADGETS':
        display_options['search_options'] = 'block';
        display_options['pagination'] = 'block';
        display_options['gadget_list'] = 'block';
        display_options['tab_bar'] = 'block';

        this.show_section(display_options, command_id);

        if (command_id == 'PAINT_GADGETS') {
            this.painters['GADGETS_PAINTER'].paint(resp_command, this.user_command_manager);
        }

        this.painters['PAGINATION_PAINTER'].paint(resp_command, this.user_command_manager);

        break;
    case 'PAINT_MASHUPS':
    case 'SHOW_MASHUPS':
        display_options['search_options'] = 'block';
        display_options['pagination'] = 'block';
        display_options['mashup_list'] = 'block';
        display_options['tab_bar'] = 'block';

        this.show_section(display_options, command_id);

        if (command_id == 'PAINT_MASHUPS') {
            this.painters['MASHUPS_PAINTER'].paint(resp_command, this.user_command_manager);
        }

        this.painters['PAGINATION_PAINTER'].paint(resp_command, this.user_command_manager);

        break;
    case 'PAINT_RESOURCE_DETAILS':
        display_options['resource_details'] = 'block';

        this.show_section(display_options, command_id);

        this.painters['RESOURCE_DETAILS_PAINTER'].paint(resp_command, this.user_command_manager);

        break;
    case 'SHOW_DEVELOPER_INFO':
        display_options['developer_info'] = 'block';

        this.show_section(display_options, command_id);

        this.painters['DEVELOPERS_PAINTER'].paint(resp_command, this.user_command_manager);

        break;
    case 'SHOW_SEARCH_INFO':
        display_options['search_options'] = 'block';
        display_options['pagination'] = 'block';
        display_options['tab_bar'] = 'block';

        var command_data = resp_command.get_data();

        if (command_data == 'gadget')
          display_options['gadget_list'] = 'block';

        if (command_data == 'mashup')
          display_options['mashup_list'] = 'block';

        this.show_section(display_options, command_id);

        break;
    case 'SUBMIT_GADGET':
    case 'SUBMIT_PACKAGED_GADGET':
        display_options['developer_info'] = 'block';

        this.show_section(display_options, command_id);

        this.painters['DEVELOPERS_PAINTER'].paint_adding_gadget_results(resp_command, this.user_command_manager);
        break;
    case 'ADD_GADGET_TO_APP':
        display_options['developer_info'] = 'block';

        this.show_section(display_options, command_id);

        services.search_by_creation_date();

        break;
    case 'REPEAT_SEARCH':
        services.repeat_last_search();

        break;
    default:
        alert('Missing command code at ResponseCommandProcessor!');
        return;
    }
}

ListView_ResponseCommandDispatcher.prototype.show_section = function (display_options, command_id) {
    var search_options = display_options['search_options'];
    var pagination = display_options['pagination'];
    var gadget_list = display_options['gadget_list'];
    var mashup_list = display_options['mashup_list'];
    var resource_details = display_options['resource_details'];
    var developer_info = display_options['developer_info'];
    var tab_bar = display_options['tab_bar'];


    this.dom_wrapper.get_element_by_code('SEARCH_OPTIONS_AREA').setStyle({'display': search_options});
    this.dom_wrapper.get_element_by_code('PAGINATION_AREA').setStyle({'display': pagination});
    this.dom_wrapper.get_element_by_code('GADGET_LIST').setStyle({'display': gadget_list});
    this.dom_wrapper.get_element_by_code('MASHUP_LIST').setStyle({'display': mashup_list});
    this.dom_wrapper.get_element_by_code('RESOURCE_DETAILS_AREA').setStyle({'display': resource_details});
    this.dom_wrapper.get_element_by_code('DEVELOPER_INFO_AREA').setStyle({'display': developer_info});
    this.dom_wrapper.get_element_by_code('TAB_BAR').setStyle({'display': tab_bar});

    // Updating Navigation Bar
    switch (command_id) {
    case 'PAINT_MASHUPS':
        this.search_button.addClassName('selected_section');
        this.developers_button.removeClassName('selected_section');
        this.mashups_button.addClassName('current');
        this.gadgets_button.removeClassName('current');
        break;
    case 'PAINT_GADGETS':
        this.search_button.addClassName('selected_section');
        this.developers_button.removeClassName('selected_section');
        this.mashups_button.removeClassName('current');
        this.gadgets_button.addClassName('current');
        break;
    case 'SHOW_DEVELOPER_INFO':
    case 'SUBMIT_GADGET':
    case 'SUBMIT_PACKAGED_GADGET':
    case 'ADD_GADGET_TO_APP':
        this.search_button.removeClassName('selected_section');
        this.developers_button.addClassName('selected_section');
        break;
    case 'SHOW_SEARCH_INFO':
        this.search_button.addClassName('selected_section');
        this.developers_button.removeClassName('selected_section');
        break;
    case 'PAINT_RESOURCE_DETAILS':
        break;
    case 'SHOW_GADGETS':
        this.mashups_button.removeClassName('current');
        this.gadgets_button.addClassName('current');
        break;
    case 'SHOW_MASHUPS':
        this.mashups_button.addClassName('current');
        this.gadgets_button.removeClassName('current');
        break;
    default:
        alert ('Error activating tab!');
    }
}
