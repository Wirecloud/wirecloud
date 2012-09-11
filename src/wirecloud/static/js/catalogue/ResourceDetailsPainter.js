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
/*global alert, Constants, Element, document, gettext, interpolate, LayoutManagerFactory, Template */
"use strict";

var ResourceDetailsPainter = function (catalogue, details_structure_element, dom_element) {
    var get_extra_data, get_all_versions_html;

    this.catalogue = catalogue;
    this.details_template_element = details_structure_element;
    this.details_template = new Template(this.details_template_element);
    this.dom_element = dom_element;

    get_all_versions_html = function (versions) {
        var i, html = '';

        for (i = 0; i < versions.length; i += 1) {
            html += 'v' + versions[i].text + ' ';
        }

        return html;
    };


    this.paint = function (resource, user_command_manager) {
        var ieCompatibleClass, type, button_text,
            resource_html, tag_links_list, tag_links, search_options, tags, j,
            tag, tag_element, mytags_area_list, my_tags_area;

        this.dom_element.innerHTML = '';

        if (resource.getIeCompatible()) {
            // Si es IE compatible ocultamos la advertencia
            ieCompatibleClass = 'hidden';
        }

        type = '';
        button_text = gettext('Add');

        resource_html = this.details_template.evaluate({
            'image_url': resource.getUriImage(),
            'name': resource.getDisplayName(),
            'description': resource.getDescription(),
            'type': type,
            'button_text': button_text,
            'vendor': resource.getVendor(),
            'version': resource.getVersion().text,
            'creator': resource.getCreator(),
            'versions': get_all_versions_html(resource.getAllVersions()),
            'wiki': resource.getUriWiki(),
            'template_url': resource.getUriTemplate(),
            'average_popularity': this.get_popularity_html(resource.getPopularity()),
            'ie_compatible_class': ieCompatibleClass
        });

        // Inserting resource html to the root_element
        this.dom_element.update(resource_html);
        this.dom_element.getElementsByClassName('image')[0].onerror = function (event) {
            event.target.src = '/static/images/noimage.png';
        };

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // Go back to list of resources
        this.create_simple_command(this.dom_element, '.back_to_resource_list', 'click', this.catalogue.home.bind(this.catalogue));

        // "Instantiate"
        this.create_simple_command(this.dom_element, '.instanciate_button', 'click', this.catalogue.createUserCommand('instanciate', resource));

        this.populate_advanced_operations(resource);
        /*
        // Tagging resource
        this.create_simple_command('.tagging_resource', 'TAG_RESOURCE', resource, 'click', user_command_manager);

        // ALL Tags
        tag_links_list = this.dom_element.getElementsBySelector('.right_column_resource .tags .tag_links');
        if (!tag_links_list || tag_links_list.length !== 1) {
            alert('Problem rendering resource details (tag_list)!');
        }

        tag_links = tag_links_list[0];

        search_options = {
            starting_page: 1,
            boolean_operator: 'AND',
            scope: ''
        };

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
        }*/
    };
};
ResourceDetailsPainter.prototype = new HTML_Painter();

ResourceDetailsPainter.prototype.populate_advanced_operations = function (resource) {
    var button, element = this.dom_element.getElementsByClassName('advanced_operations')[0];

    button = new StyledElements.StyledButton({
        'text': gettext('Download'),
    });
    button.addEventListener('click', function () {
        window.open(resource.getUriTemplate(), '_blank')
    });
    button.insertInto(element);

    if (resource.added_by_user) {
        button = new StyledElements.StyledButton({
            'text': gettext('Delete'),
        });
        button.addEventListener('click', this.catalogue.createUserCommand('delete', resource));
        button.insertInto(element);
    }
};
