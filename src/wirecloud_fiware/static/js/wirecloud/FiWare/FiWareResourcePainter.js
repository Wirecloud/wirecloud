/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global alert, Constants, Element, document, gettext, interpolate, LayoutManagerFactory, Template */
"use strict";

var FiWareResourcePainter = function (catalogue, resource_template, dom_element) {
    if (arguments.length === 0) {
        return;
    }

    this.catalogue = catalogue;
    this.structure_template = new Template(resource_template);
    this.dom_element = dom_element;
};
FiWareResourcePainter.prototype = new HTML_Painter();

FiWareResourcePainter.prototype.paint = function (command_data) {
    var resource, i, j, context, resource_element,
        button_list, button, click_for_details_list, tag_links_list, important_tag_links_list;


    this.dom_element.update('');

    for (i = 0; i < command_data.resources.length; i += 1) {
        resource = command_data.resources[i];

        context = {
            'name': resource.getDisplayName(),
            'image_url': resource.getUriImage(),
            'description': resource.getShortDescription(),
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
        this.create_simple_command(resource_element, '.instanciate_button', 'click', this.catalogue.createUserCommand('instanciate', resource));

        // "Show details"
        this.create_simple_command(resource_element, '.click_for_details', 'click', this.catalogue.createUserCommand('showDetails', resource));

        /*// Full tag list
        tag_links_list = resource_element.getElementsByClassName('tag_links');
        if (tag_links_list && tag_links_list.length === 1) {
            this._renderFullTagList(resource, tag_links_list[0]);
        }

        // Important tag list
        important_tag_links_list = resource_element.getElementsByClassName('important_tag_links');
        if (important_tag_links_list && important_tag_links_list.length === 1) {
            this._renderImportantTagList(resource, important_tag_links_list[0]);
        }*/

    }
};

/*FiWareResourcePainter.prototype._renderFullTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element;

    search_options = {
        starting_page: 1,
        boolean_operator: 'AND',
        scope: ''
    };

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

FiWareResourcePainter.prototype._renderImportantTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element, len;

    search_options = {
        starting_page: 1,
        boolean_operator: 'AND',
        scope: ''
    };

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
};*/
