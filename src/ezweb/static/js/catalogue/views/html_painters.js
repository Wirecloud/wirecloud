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

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global alert, Constants, Element, document, gettext, Hash, interpolate, LayoutManagerFactory, Template */
"use strict";

var HTML_Painter = function () {
    this.dom_element = null;
};

HTML_Painter.prototype.set_dom_element = function (dom_element) {
    this.dom_element = dom_element;
};

HTML_Painter.prototype.set_dom_wrapper = function (dom_wrapper) {
    this.dom_wrapper = dom_wrapper;
};

HTML_Painter.prototype.paint = function (command, user_command_manager) {};

HTML_Painter.prototype.get_popularity_html = function (popularity) {
    var on_stars, md_star, off_stars, result_html, i;

    on_stars = Math.floor(popularity);
    md_star = popularity - on_stars;
    off_stars = 5 - popularity;

    result_html = '';

    // "On" stars
    for (i = 0; i < on_stars; i += 1) {
        result_html += '<a class="on"></a>';
    }

    if (md_star) {
        result_html += '<a class="md"></a>';
    }

    // "Off" stars
    for (i = 0; i < Math.floor(off_stars); i += 1) {
        result_html += '<a class="off"></a>';
    }

    return result_html;
};

var ResourcesPainter = function (resource_template) {
    if (arguments.length === 0) {
        return;
    }

    HTML_Painter.call(this);

    this.structure_template = new Template(resource_template);
};
ResourcesPainter.prototype = new HTML_Painter();

ResourcesPainter.prototype.paint = function (command, user_command_manager) {
    var command_data, resources, resource, i, j, context, resource_element,
        button_list, button, click_for_details_list, tag_links_list, important_tag_links_list;

    command_data = command.get_data();
    resources = command_data.resources;

    this.dom_element.update('');

    for (i = 0; i < resources.length; i += 1) {
        resource = resources[i];

        context = {
            'name': resource.getName(),
            'image_url': resource.getUriImage(),
            'description': resource.getDescription(),
            'average_popularity': this.get_popularity_html(resource.getPopularity())
        };
        context.button_text = gettext('Add');
        context.type = '';

        resource_element = document.createElement('div');
        Element.extend(resource_element);
        resource_element.className = 'resource';

        resource_element.update(this.structure_template.evaluate(context));

        // Inserting resource html in the DOM
        this.dom_element.appendChild(resource_element);

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // "Instantiate"
        button_list = resource_element.getElementsByClassName('instanciate_button');
        if (!button_list || button_list.length !== 1) {
            alert('Problem parsing resource template!');
        }

        button = button_list[0];

        user_command_manager.create_command_from_data('INSTANTIATE_RESOURCE', button, resource, 'click');

        // "Show details"
        click_for_details_list = resource_element.getElementsByClassName('click_for_details');
        if (click_for_details_list.length === 0) {
            alert('Problem parsing resource template!');
        }
        for (j = 0; j < click_for_details_list.length; j += 1) {
            user_command_manager.create_command_from_data('SHOW_RESOURCE_DETAILS', click_for_details_list[j], resource, 'click');
        }

        // Full tag list
        tag_links_list = resource_element.getElementsByClassName('tag_links');
        if (tag_links_list && tag_links_list.length === 1) {
            this._renderFullTagList(resource, tag_links_list[0], user_command_manager);
        }

        // Important tag list
        important_tag_links_list = resource_element.getElementsByClassName('important_tag_links');
        if (important_tag_links_list && important_tag_links_list.length === 1) {
            this._renderImportantTagList(resource, important_tag_links_list[0], user_command_manager);
        }

    }
};

ResourcesPainter.prototype._renderFullTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element;

    search_options = new Hash({
        starting_page: 1,
        boolean_operator: 'AND',
        scope: ''
    });

    tags = resource.getTags();
    for (i = 0; i < tags.length; i += 1) {
        tag = tags[i];

        tag_element = document.createElement('a');

        Element.extend(tag_element);
        tag_element.update(tag.value);
        tag_element.addClassName('link');
        tag_links.appendChild(tag_element);

        search_options.criteria = tag.value;

        user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
    }
};

ResourcesPainter.prototype._renderImportantTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element, len;

    search_options = new Hash({
        starting_page: 1,
        boolean_operator: 'AND',
        scope: ''
    });

    tags = resource.getTags();
    tags = tags.sort(function (a, b) {
        return b.apparences - a.apprences;
    });

    len = Math.min(3, tags.length);

    for (i = 0; i < len; i += 1) {
        tag = tags[i];

        tag_element = document.createElement('a');

        Element.extend(tag_element);
        tag_element.update(tag.value);
        tag_element.addClassName('link');
        tag_links.appendChild(tag_element);

        search_options.criteria = tag.value;

        user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
    }
};

var ResourceDetailsPainter = function (details_structure_element) {
    var get_extra_data, get_all_versions_html;

    HTML_Painter.call(this);

    this.details_template_element = details_structure_element;
    this.details_template = new Template(this.details_template_element.innerHTML);

    get_extra_data = function (name, extra_data) {
        if (!extra_data) {
            return '';
        }

        if (extra_data[name]) {
            return extra_data[name];
        } else {
            return '';
        }
    };

    get_all_versions_html = function (versions) {
        var i, html = '';

        for (i = 0; i < versions.length; i += 1) {
            html += 'v' + versions[i].text + ' ';
        }

        return html;
    };

    this.create_simple_command = function (selector, command, resource, _event, user_command_manager) {
        var elements = this.dom_element.getElementsBySelector(selector);

        if (!elements || elements.length !== 1) {
            alert('Problem rendering resource details (' + selector + ')!');
        }

        user_command_manager.create_command_from_data(command, elements[0], resource, _event);
    };

    this.paint = function (command, user_command_manager) {
        var resource, extra_data, ieCompatibleClass, type, button_text,
            resource_html, tag_links_list, tag_links, search_options, tags, j,
            tag, tag_element, mytags_area_list, my_tags_area;

        resource = command.get_data();
        extra_data = resource.getExtraData();
        resource.setExtraData(null);

        this.dom_element.update('');

        if (resource.getIeCompatible()) {
            // Si es IE compatible ocultamos la advertencia
            ieCompatibleClass = 'hidden';
        }

        type = '';
        button_text = gettext('Add');

        resource_html = this.details_template.evaluate({
            'image_url': resource.getUriImage(),
            'name': resource.getName(),
            'description': resource.getDescription(),
            'type': type,
            'button_text': button_text,
            'vendor': resource.getVendor(),
            'version': resource.getVersion().text,
            'creator': resource.getCreator(),
            'versions': get_all_versions_html(resource.getAllVersions()),
            'wiki': resource.getUriWiki(),
            'template_url': resource.getUriTemplate(),
            'update_result': get_extra_data('update_result', extra_data),
            'voting_result': get_extra_data('voting_result', extra_data),
            'average_popularity': this.get_popularity_html(resource.getPopularity()),
            'ie_compatible_class': ieCompatibleClass
        });

        // Inserting resource html to the root_element
        this.dom_element.update(resource_html);

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // Go back to list of resources
        this.create_simple_command('.back_to_resource_list', 'SHOW_RESOURCE_LIST', resource, 'click', user_command_manager);

        // "Instantiate"
        this.create_simple_command('.left_column_resource button', 'INSTANTIATE_RESOURCE', resource, 'click', user_command_manager);

        // Delete resource
        this.create_simple_command('.delete_resource', 'DELETE_RESOURCE', resource, 'click', user_command_manager);

        // Update resource html
        this.create_simple_command('.update_resource', 'UPDATE_RESOURCE', resource, 'click', user_command_manager);

        // Voting a resource
        this.create_simple_command('.voting_resource', 'VOTE_RESOURCE', resource, 'click', user_command_manager);

        // Changing version
        this.create_simple_command('.change_version_resource', 'CHANGE_RESOURCE_VERSION', resource, 'click', user_command_manager);

        // Tagging resource
        this.create_simple_command('.tagging_resource', 'TAG_RESOURCE', resource, 'click', user_command_manager);

        // ALL Tags
        tag_links_list = this.dom_element.getElementsBySelector('.right_column_resource .tags .tag_links');
        if (!tag_links_list || tag_links_list.length !== 1) {
            alert('Problem rendering resource details (tag_list)!');
        }

        tag_links = tag_links_list[0];

        search_options = new Hash({
            starting_page: 1,
            boolean_operator: 'AND',
            scope: ''
        });

        tags = resource.getTags();
        for (j = 0; j < tags.length; j += 1) {
            tag = tags[j];

            tag_element = document.createElement('a');

            Element.extend(tag_element);
            tag_element.update(tag.value);
            tag_element.addClassName('link');
            tag_links.appendChild(tag_element);

            search_options.criteria = tag.value;

            user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
        }

        // MY Tags
        mytags_area_list = this.dom_element.getElementsBySelector('.right_column_resource .my_tags_area');
        if (!mytags_area_list || mytags_area_list.length !== 1) {
            alert('Problem rendering resource details (mytags)!');
        }

        my_tags_area = mytags_area_list[0];

        my_tags_area.update('');

        tags = resource.getTags();

        for (j = 0; j < tags.length; j += 1) {
            tag = tags[j];

            if (tag.added_by.toLowerCase() === 'no') {
                continue;
            }

            tag_element = document.createElement('a');

            Element.extend(tag_element);
            tag_element.update(tag.value);
            tag_element.addClassName('link');
            my_tags_area.appendChild(tag_element);

            tag_element.tag_id = tag.id;

            user_command_manager.create_command_from_data('DELETE_TAG', tag_element, resource, 'click');
        }
    };
};
ResourceDetailsPainter.prototype = new HTML_Painter();

var DeveloperInfoPainter = function (structure_element) {
    HTML_Painter.call(this);

    this.local_ids = new Hash({'NEW_GADGET_BUTTON':   '#submit_link',     'GADGET_TEMPLATE_INPUT': '#template_uri',
                             'NEW_PACKAGE_BUTTON':  '#gadget_link',     'NEW_PACKAGE_FORM':      '#upload_form',
                             'NEW_FEED_BUTTON':     '#new_feed_button', 'NEW_WEBSITE_BUTTON':    '#new_website_button'});

    this.structure_template_element = structure_element;

    this.paint = function (command, user_command_manager) {
        var selector, new_gadget_button, new_gadget_input, new_package_button,
            new_package_form, new_feed_button, new_website_button, data;

        this.dom_element.update(this.structure_template_element.innerHTML);

        selector = this.local_ids.NEW_GADGET_BUTTON;
        new_gadget_button = this.dom_wrapper.get_element_by_selector(selector);

        selector = this.local_ids.GADGET_TEMPLATE_INPUT;
        new_gadget_input = this.dom_wrapper.get_element_by_selector(selector);

        selector = this.local_ids.NEW_PACKAGE_BUTTON;
        new_package_button = this.dom_wrapper.get_element_by_selector(selector);

        selector = this.local_ids.NEW_PACKAGE_FORM;
        new_package_form = this.dom_wrapper.get_element_by_selector(selector);

        selector = this.local_ids.NEW_FEED_BUTTON;
        new_feed_button = this.dom_wrapper.get_element_by_selector(selector);

        selector = this.local_ids.NEW_WEBSITE_BUTTON;
        new_website_button = this.dom_wrapper.get_element_by_selector(selector);

        // New gadget from template
        data = new Hash({'template_url_element': new_gadget_input});
        user_command_manager.create_command_from_data('SUBMIT_GADGET', new_gadget_button, data, 'click');

        // New gadget from package
        data = new Hash({'upload_form': new_package_form});
        user_command_manager.create_command_from_data('SUBMIT_PACKAGED_GADGET', new_package_button, data, 'click');

        // New gadget from feed
        data = {'window': 'addFeed'};
        user_command_manager.create_command_from_data('SHOW_WINDOW', new_feed_button, data, 'click');

        // New gadget from website
        data = {'window': 'addSite'};
        user_command_manager.create_command_from_data('SHOW_WINDOW', new_website_button, data, 'click');
    };

    this.paint_adding_gadget_results = function (command, user_command_manager) {
        var resource, continueAdding, rollback, msg;

        resource = command.get_data();

        // showYesNoDialog handlers
        // "Yes" handler
        continueAdding = function (resource) {
            user_command_manager.get_service_facade().search_by_creation_date();
        }.bind(this);

        // "No" handler
        rollback = function (resource) {
            user_command_manager.get_service_facade().delete_resource(resource);
        }.bind(this);

        // check if the new gadget is the last version
        if (resource.getLastVersion() !== resource.getVersion()) {
            // inform the user about the situation
            msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
                "The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
                " Do you really want to continue to add version %(curr_version)s ");

            msg = interpolate(msg, {curr_version: resource.getVersion().text, last_version: resource.getLastVersion().text }, true);

            LayoutManagerFactory.getInstance().showYesNoDialog(msg,
                function () {
                    continueAdding(resource);
                },
                function () {
                    rollback(resource);
                },
                Constants.Logging.WARN_MSG);
        } else {
            continueAdding(resource);
        }
    };
};
DeveloperInfoPainter.prototype = new HTML_Painter();

var PaginationPainter = function (pagination_structure_element) {
    HTML_Painter.call(this);

    this.pagination_structure_element = pagination_structure_element;
    this.pagination_template = new Template(this.pagination_structure_element.innerHTML);
    this.pagination_element = new Template('<a title="#{text} #{page}">#{page}</a>');

    this.paint = function (command, user_command_manager) {
        var command_data, command_id, current_page, number_of_pages, first,
            last, next, previous, pagination_html, page_indexes_dom_elements,
            page_indexes_dom_element;

        command_data = command.get_data();
        command_id = command.get_id();

        this.dom_element.update('');

        current_page = command_data.current_page;
        number_of_pages = Math.ceil(parseInt(command_data.query_results_number, 10) /
            parseInt(command_data.resources_per_page, 10));

        first = 'link';
        last = 'link';
        next = 'link';
        previous = 'link';

        if (current_page === 1 || number_of_pages === 0) {
            first = 'text';
            previous = 'text';
        }

        if (current_page === number_of_pages || number_of_pages === 0) {
            last = 'text';
            next = 'text';
        }

        pagination_html = this.pagination_template.evaluate({
            'first': first,
            'next': next,
            'previous': previous,
            'last': last
        });

        this.dom_element.update(pagination_html);

        page_indexes_dom_elements = this.dom_element.getElementsBySelector('.pagination_pages');

        if (!page_indexes_dom_elements || page_indexes_dom_elements.length !== 1) {
            alert('Error rendering pagination HTML!');
            return;
        }

        page_indexes_dom_element = page_indexes_dom_elements[0];

        this.paint_page_indexes(page_indexes_dom_element, number_of_pages, current_page, user_command_manager);
        this.bind_buttons(user_command_manager, current_page, number_of_pages);
    };

    this.bind_button = function (user_command_manager, page, html_event, element_selector, command_id, element) {
        var data = {'starting_page': page};

        if (! element) {
            element = this.dom_element.getElementsBySelector(element_selector)[0];
        }

        Element.extend(element);
        element.addClassName('link');

        user_command_manager.create_command_from_data(command_id, element, data, html_event);
    };

    this.bind_buttons = function (user_command_manager, current_page, number_of_pages) {
        if (current_page !== 1) {
            // Binding events of go_first and go_previous buttons
            this.bind_button(user_command_manager, 1, 'click', '.beginning', 'SIMPLE_SEARCH');
            this.bind_button(user_command_manager, current_page - 1, 'click', '.previous', 'SIMPLE_SEARCH');
        }

        if (current_page !== number_of_pages) {
            // Binding events of go_first and go_previous buttons
            this.bind_button(user_command_manager, current_page + 1, 'click', '.next', 'SIMPLE_SEARCH');
            this.bind_button(user_command_manager, number_of_pages, 'click', '.last', 'SIMPLE_SEARCH');
        }
    };

    this.paint_page_indexes = function (page_indexes_div, number_of_pages, current_page, user_command_manager) {
        var lower_page, top_margin, max_page, i, page_element, page_html, text, page_number;

        lower_page = current_page - 2;

        if (lower_page < 1) {
            lower_page = 1;
        }

        top_margin = Math.min(4, number_of_pages - 1);
        max_page = lower_page + top_margin;

        for (i = lower_page; i <= max_page; i += 1) {
            page_element = document.createElement('span');

            page_element = Element.extend(page_element);
            page_element.className = 'pagination_button';

            page_html = null;

            if (current_page !== i) {
                text = 'Ir a la página ';
                page_number = i;

                page_html = this.pagination_element.evaluate({'page': page_number, 'text': text});

                this.bind_button(user_command_manager, i, 'click', null, 'SIMPLE_SEARCH', page_element);
            } else {
                page_html = i;
            }

            page_element.update(page_html);

            page_indexes_div.appendChild(page_element);
        }
    };
};
PaginationPainter.prototype = new HTML_Painter();
