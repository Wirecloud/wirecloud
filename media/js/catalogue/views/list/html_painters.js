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

var ListView_ResourcesPainter = function (resource_structure_element) {
    ResourcesPainter.call(this, resource_structure_element.innerHTML);
}
ListView_ResourcesPainter.prototype = new ResourcesPainter();

var ListView_ResourceDetailsPainter = function (details_structure_element) {
    HTML_Painter.call(this);

    this.details_template_element = details_structure_element;
    this.details_template = new Template(this.details_template_element.innerHTML);

    var get_extra_data = function (name, extra_data) {
        if (!extra_data) {
            return '';
        }

        if (extra_data[name]) {
            return extra_data[name];
        } else {
            return '';
        }
    }

    var get_all_versions_html = function (versions) {
        var html = '';

        for (var i=0; i<versions.length; i++) {
            var version_display_name = 'v' + versions[i] + ' '

            html += version_display_name;
        }

        return html;
    }

    this.paint = function (command, user_command_manager) {
        var resource = command.get_data();
        var extra_data = resource.getExtraData();

        resource.setExtraData(null);

        this.dom_element.update('');

        var image_url = resource.getUriImage();
        var description = resource.getDescription();
        var vendor = resource.getVendor();
        var name = resource.getName();
        var version = resource.getVersion();
        var creator = resource.getCreator();
        var versions = get_all_versions_html(resource.getAllVersions());
        var wiki = resource.getUriWiki();
        var template_url = resource.getUriTemplate();
        var user_vote = resource.getUserVote();

        var update_result = get_extra_data('update_result', extra_data);
        var voting_result = get_extra_data('voting_result', extra_data);
        var average_popularity = this.get_popularity_html(resource.getPopularity());

        var type = '';
        var button_text = gettext('Add');

        if (resource.isContratable() && ! resource.hasContract()) {
            button_text = 'Buy';
            type = 'contratable';
        }

        var resource_html =
            this.details_template.evaluate({'image_url': image_url, 'name': name, 'description': description,
                                          'type': type, 'button_text': button_text, 'vendor': vendor, 'version': version,
                                          'creator': creator, 'versions': versions, 'wiki': wiki,
                                          'template_url': template_url, 'update_result': update_result,
                                          'voting_result': voting_result, 'average_popularity': average_popularity });

        // Inserting resource html to the root_element
        this.dom_element.update(resource_html);

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // Go back to list of resources
        var back_link_list = this.dom_element.getElementsBySelector('.back_to_resource_list');

        if (!back_link_list || back_link_list.length != 1) {
            alert('Problem rendering resource details (back_link)!');
        }

        var back_link = back_link_list[0];

        user_command_manager.create_command_from_data('SHOW_RESOURCE_LIST', back_link, resource, 'click');

        // "Instantiate"
        var button_list = this.dom_element.getElementsBySelector('.left_column_resource button')

        if (!button_list || button_list.length != 1) {
            alert('Problem parsing resource template!');
        }

        var button = button_list[0];

        user_command_manager.create_command_from_data('INSTANTIATE_RESOURCE', button, resource, 'click');

        // Delete resource
        var delete_link_list = this.dom_element.getElementsBySelector('.delete_resource');

        if (!delete_link_list || delete_link_list.length != 1) {
            alert('Problem rendering resource details (delete_link)!');
        }

        var delete_link = delete_link_list[0];

        user_command_manager.create_command_from_data('DELETE_RESOURCE', delete_link, resource, 'click');

        // Update resource html
        var update_link_list = this.dom_element.getElementsBySelector('.update_resource');

        if (!update_link_list || update_link_list.length != 1) {
            alert('Problem rendering resource details (update_link)!');
        }

        var update_link = update_link_list[0];

        user_command_manager.create_command_from_data('UPDATE_RESOURCE', update_link, resource, 'click');

        // Voting a resource
        var voting_link_list = this.dom_element.getElementsBySelector('.voting_resource');

        if (!voting_link_list || voting_link_list.length != 1) {
            alert('Problem rendering resource details (voting_link)!');
        }

        var voting_link = voting_link_list[0];

        user_command_manager.create_command_from_data('VOTE_RESOURCE', voting_link, resource, 'click');

        // Changing version
        var version_link_list = this.dom_element.getElementsBySelector('.change_version_resource');

        if (!version_link_list || version_link_list.length != 1) {
            alert('Problem rendering resource details (change_version_link)!');
        }

        var version_link = version_link_list[0];

        user_command_manager.create_command_from_data('CHANGE_RESOURCE_VERSION', version_link, resource, 'click');

        // Tagging resource
        var tag_link_list = this.dom_element.getElementsBySelector('.tagging_resource');

        if (!tag_link_list || tag_link_list.length != 1) {
            alert('Problem rendering resource details (tag_link)!');
        }

        var tag_link = tag_link_list[0];

        user_command_manager.create_command_from_data('TAG_RESOURCE', tag_link, resource, 'click');

        // ALL Tags
        var tag_links_list = this.dom_element.getElementsBySelector('.right_column_resource .tags .tag_links');
        if (!tag_links_list || tag_links_list.length != 1) {
            alert('Problem rendering resource details (tag_list)!');
        }

        var tag_links = tag_links_list[0];

        var search_options = new Hash();

        search_options['starting_page'] = 1
        search_options['boolean_operator'] = 'AND';
        search_options['scope'] = '';

        var tags = resource.getTags();
        for (var j=0; j<tags.length; j++) {
        var tag = tags[j];

          var tag_element = document.createElement('a');

          Element.extend(tag_element);
          tag_element.update(tag.value);
          tag_element.addClassName('link');
          tag_links.appendChild(tag_element);

          search_options['criteria'] = tag.value;

          user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
        }

        // MY Tags
        var mytags_area_list = this.dom_element.getElementsBySelector('.right_column_resource .my_tags_area');
        if (! mytags_area_list || mytags_area_list.length != 1) {
          alert('Problem rendering resource details (mytags)!');
        }

        var my_tags_area = mytags_area_list[0];

        my_tags_area.update('');

        var tags = resource.getTags();

        for (var j = 0; j < tags.length; j++) {
            var tag = tags[j];

            if (tag['added_by'].toLowerCase() == 'no') {
                continue;
            }

            var tag_element = document.createElement('a');

            Element.extend(tag_element);
            tag_element.update(tag.value);
            tag_element.addClassName('link');
            my_tags_area.appendChild(tag_element);

            tag_element.tag_id = tag.id;

            user_command_manager.create_command_from_data('DELETE_TAG', tag_element, resource, 'click');
        }
    }
}
ListView_ResourceDetailsPainter.prototype = new HTML_Painter();


var ListView_DeveloperInfoPainter = function (structure_element) {
    HTML_Painter.call(this);

    this.local_ids = new Hash({'NEW_GADGET_BUTTON':   '#submit_link',     'GADGET_TEMPLATE_INPUT': '#template_uri',
                             'NEW_PACKAGE_BUTTON':  '#gadget_link',     'NEW_PACKAGE_FORM':      '#upload_form',
                             'NEW_FEED_BUTTON':     '#new_feed_button', 'NEW_WEBSITE_BUTTON':    '#new_website_button'});

    this.structure_template_element = structure_element;

    this.paint = function (command, user_command_manager) {
        this.dom_element.update(this.structure_template_element.innerHTML);

        var new_gadget_button_selector = this.local_ids['NEW_GADGET_BUTTON'];
        var new_gadget_button = this.dom_wrapper.get_element_by_selector(new_gadget_button_selector);

        var new_gadget_input_selector = this.local_ids['GADGET_TEMPLATE_INPUT'];
        var new_gadget_input = this.dom_wrapper.get_element_by_selector(new_gadget_input_selector);

        var new_package_button_selector = this.local_ids['NEW_PACKAGE_BUTTON'];
        var new_package_button = this.dom_wrapper.get_element_by_selector(new_package_button_selector);

        var new_package_form_selector = this.local_ids['NEW_PACKAGE_FORM'];
        var new_package_form = this.dom_wrapper.get_element_by_selector(new_package_form_selector);

        var new_feed_button_selector = this.local_ids['NEW_FEED_BUTTON'];
        var new_feed_button = this.dom_wrapper.get_element_by_selector(new_feed_button_selector);

        var new_website_button_selector = this.local_ids['NEW_WEBSITE_BUTTON'];
        var new_website_button = this.dom_wrapper.get_element_by_selector(new_website_button_selector);

        // New gadget from template
        var data = new Hash({'template_url_element': new_gadget_input});
        user_command_manager.create_command_from_data('SUBMIT_GADGET', new_gadget_button, data, 'click');

        // New gadget from package
        var data = new Hash({'upload_form': new_package_form});
        user_command_manager.create_command_from_data('SUBMIT_PACKAGED_GADGET', new_package_button, data, 'click');

        // New gadget from feed
        var data = {'window': 'addFeed'};
        user_command_manager.create_command_from_data('SHOW_WINDOW', new_feed_button, data, 'click');

        // New gadget from website
        var data = {'window': 'addSite'};
        user_command_manager.create_command_from_data('SHOW_WINDOW', new_website_button, data, 'click');
    }

    this.paint_adding_gadget_results = function (command, user_command_manager) {

        var resource = command.get_data();

        // showYesNoDialog handlers
        // "Yes" handler
        var continueAdding = function (resource) {
            // leave that gadget version and continue
            if (resource.isContratable() && resource.isGadget()) {
                // Link gadget with application
                var available_apps = resource.getAvailableApps();

                user_command_manager.set_available_apps(available_apps);

                LayoutManagerFactory.getInstance().showWindowMenu('addGadgetToAppMenu',
                    user_command_manager.get_service_facade(),
                    function(){  },
                    resource);
            } else {
                user_command_manager.get_service_facade().search_by_creation_date();
            }
        }.bind(this);

        // "No" handler
        var rollback = function(resource) {
            user_command_manager.get_service_facade().delete_resource(resource);
        }.bind(this);

        var context = {result: resource, continueAdding: continueAdding, rollback: rollback};

        // check if the new gadget is the last version
        if (resource.getLastVersion() != resource.getVersion()) {
            // inform the user about the situation
            var msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
                "The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
                " Do you really want to continue to add version %(curr_version)s ");

            msg = interpolate(msg, {curr_version: resource.getVersion(), last_version: resource.getLastVersion() }, true);

            LayoutManagerFactory.getInstance().showYesNoDialog(msg,
                function (){ continueAdding(resource) },
                function (){ rollback(resource) },
                Constants.Logging.WARN_MSG);
        } else {
            continueAdding(resource);
        }
    }
}
ListView_DeveloperInfoPainter.prototype = new HTML_Painter();

var ListView_PaginationPainter = function (pagination_structure_element) {
    HTML_Painter.call(this);

    this.pagination_structure_element = pagination_structure_element;
    this.pagination_template = new Template(this.pagination_structure_element.innerHTML);
    this.pagination_element = new Template('<a title="#{text} #{page}">#{page}</a>');

    this.gadgets_last_search_options = null;
    this.mashups_last_search_options = null;

    this.paint = function (command, user_command_manager) {
        var command_data = command.get_data();
        var command_id = command.get_id();

        switch (command_id) {
        case 'PAINT_GADGETS':
            this.gadgets_last_search_options = command_data;
            break;
        case 'PAINT_MASHUPS':
            this.mashups_last_search_options = command_data;
            break;
        case 'SHOW_MASHUPS':
            command_data = this.mashups_last_search_options;
            break;
        case 'SHOW_GADGETS':
            command_data = this.gadgets_last_search_options;
            break;
        default:
            alert('Error at Pagination painter');
        }

        this.dom_element.update('');

        var number_of_elements = command_data['query_results_number'];
        var resources_per_page = command_data['resources_per_page'];
        var current_page = command_data['current_page'];
        var number_of_pages = Math.ceil(parseInt(number_of_elements) / parseInt(resources_per_page));

        var first = 'link';
        var last = 'link';
        var next = 'link';
        var previous = 'link';

        if (current_page == 1 || number_of_pages == 0 ) {
            first = 'text';
            previous = 'text';
        }

        if (current_page == number_of_pages || number_of_pages == 0) {
            last = 'text';
            next = 'text';
        }

        var pagination_html =
            this.pagination_template.evaluate({'first': first, 'next': next, 'previous': previous,
                'last': last});

        this.dom_element.update(pagination_html);

        var page_indexes_dom_elements = this.dom_element.getElementsBySelector('.pagination_pages');

        if (!page_indexes_dom_elements || page_indexes_dom_elements.length != 1) {
            alert('Error rendering pagination HTML!');
            return;
        }

        var page_indexes_dom_element = page_indexes_dom_elements[0];

        this.paint_page_indexes(page_indexes_dom_element, number_of_pages, current_page, user_command_manager);
        this.bind_buttons(user_command_manager, current_page, number_of_pages);
    }

    this.bind_button = function (user_command_manager, page, html_event, element_selector, command_id, element) {
        var data = {'starting_page': page};

        if (! element) {
            element = this.dom_element.getElementsBySelector(element_selector)[0];
        }

        Element.extend(element);
        element.addClassName('link');

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

        if (lower_page < 1) {
            lower_page = 1;
        }

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
ListView_PaginationPainter.prototype = new HTML_Painter();
