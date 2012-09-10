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

/*global alert, Constants, Element, document, gettext, interpolate, LayoutManagerFactory, Template */
"use strict";

var HTML_Painter = function () {
    this.dom_element = null;
};

HTML_Painter.prototype.create_simple_command = function (element, selector, _event, handler, required) {
    var i, elements = element.getElementsBySelector(selector);

    if (required && elements.length < 1) {
        throw new Error();
    }

    for (i = 0; i < elements.length; i += 1) {
        EzWebExt.addEventListener(elements[i], _event, handler);
    }
};

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

var ResourcePainter = function (catalogue, resource_template, dom_element) {
    if (arguments.length === 0) {
        return;
    }

    this.catalogue = catalogue;
    this.structure_template = new Template(resource_template);
    this.error_template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="error"><t:message/></div></s:styledgui>';
    this.dom_element = dom_element;
};
ResourcePainter.prototype = new HTML_Painter();

ResourcePainter.prototype.setError = function setError(message) {
    this.dom_element.innerHTML = '';

    var builder = new StyledElements.GUIBuilder();
    var contents = builder.parse(this.error_template, {
        'message': message
    });

    contents.insertInto(this.dom_element);
};

ResourcePainter.prototype.paint = function (command_data) {
    var resource, i, j, context, resource_element,
        button_list, button, click_for_details_list, tag_links_list, important_tag_links_list;


    this.dom_element.update('');

    for (i = 0; i < command_data.resources.length; i += 1) {
        resource = command_data.resources[i];

        context = {
            'name': resource.getDisplayName(),
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
        resource_element.getElementsByClassName('image')[0].onerror = function (event) {
            event.target.src = '/static/images/noimage.png';
        };

        // Inserting resource html in the DOM
        this.dom_element.appendChild(resource_element);

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // "Instantiate"
        this.create_simple_command(resource_element, '.instanciate_button', 'click', this.catalogue.createUserCommand('instanciate', resource));

        // "Show details"
        this.create_simple_command(resource_element, '.click_for_details', 'click', this.catalogue.createUserCommand('showDetails', resource));

        // Full tag list
        tag_links_list = resource_element.getElementsByClassName('tag_links');
        if (tag_links_list && tag_links_list.length === 1) {
            this._renderFullTagList(resource, tag_links_list[0]);
        }

        // Important tag list
        important_tag_links_list = resource_element.getElementsByClassName('important_tag_links');
        if (important_tag_links_list && important_tag_links_list.length === 1) {
            this._renderImportantTagList(resource, important_tag_links_list[0]);
        }

    }
};

ResourcePainter.prototype._renderFullTagList = function (resource, tag_links, user_command_manager) {
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

ResourcePainter.prototype._renderImportantTagList = function (resource, tag_links, user_command_manager) {
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
};
