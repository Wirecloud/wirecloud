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
}

HTML_Painter.prototype.set_dom_element = function (dom_element) {
    this.dom_element = dom_element;
}

HTML_Painter.prototype.set_dom_wrapper = function (dom_wrapper) {
    this.dom_wrapper = dom_wrapper;
}

HTML_Painter.prototype.paint = function (command, user_command_manager) { }

HTML_Painter.prototype.get_popularity_html = function (popularity) {
    var on_stars = Math.floor(popularity);
    var md_star = popularity - on_stars;
    var off_stars = 5 - popularity;

    var result_html = '';

    // "On" stars
    for (var i=0; i<on_stars; i++) {
        result_html += '<a class="on"></a>';
    }

    if (md_star) {
        result_html += '<a class="md"></a>';
    }

    // "Off" stars
    for (var i=0; i<Math.floor(off_stars); i++) {
        result_html += '<a class="off"></a>';
    }

    return result_html;
}

var ResourcesPainter = function (resource_template) {
    if (arguments.length === 0)
        return;

    HTML_Painter.call(this);

    this.structure_template = new Template(resource_template);
};
ResourcesPainter.prototype = new HTML_Painter();

ResourcesPainter.prototype.paint = function (command, user_command_manager) {
    var command_data, resources, resource, i, j, context, resource_element;

    command_data = command.get_data();
    resources = command_data['resources'];

    this.dom_element.update('');

    for (i = 0; i < resources.length; i++) {
        resource = resources[i];

        context = {
            'name': resource.getName(),
            'image_url': resource.getUriImage(),
            'description': resource.getDescription(),
            'average_popularity': this.get_popularity_html(resource.getPopularity()),
        }

        if (resource.isContratable() && ! resource.hasContract()) {
            context.button_text = gettext('Buy');
            context.type = 'contratable';
        } else {
            context.button_text = gettext('Add');
            context.type = '';
        }

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
        var button_list = resource_element.getElementsByClassName('instanciate_button')
        if (!button_list || button_list.length != 1) {
            alert('Problem parsing resource template!');
        }

        var button = button_list[0];

        user_command_manager.create_command_from_data('INSTANTIATE_RESOURCE', button, resource, 'click');

        // "Show details"
        var click_for_details_list = resource_element.getElementsByClassName('click_for_details')
        if (click_for_details_list.length == 0) {
            alert('Problem parsing resource template!');
        }
        for (j = 0; j < click_for_details_list.length; j += 1) {
            user_command_manager.create_command_from_data('SHOW_RESOURCE_DETAILS', click_for_details_list[j], resource, 'click');
        }

        // Full tag list
        var tag_links_list = resource_element.getElementsByClassName('tag_links');
        if (tag_links_list && tag_links_list.length === 1) {
            this._renderFullTagList(resource, tag_links_list[0], user_command_manager);
        }

        // Important tag list
        var important_tag_links_list = resource_element.getElementsByClassName('important_tag_links');
        if (important_tag_links_list && important_tag_links_list.length === 1) {
            this._renderImportantTagList(resource, important_tag_links_list[0], user_command_manager);
        }

    }
};

ResourcesPainter.prototype._renderFullTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element;
    
    search_options = new Hash();

    search_options['starting_page'] = 1
    search_options['boolean_operator'] = 'AND';
    search_options['scope'] = '';

    tags = resource.getTags();
    for (i = 0; i < tags.length; i++) {
        tag = tags[i];

        tag_element = document.createElement('a');

        Element.extend(tag_element);
        tag_element.update(tag.value);
        tag_element.addClassName('link');
        tag_links.appendChild(tag_element);

        search_options['criteria'] = tag.value;

        user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
    }
};

ResourcesPainter.prototype._renderImportantTagList = function (resource, tag_links, user_command_manager) {
    var i, search_options, tags, tag, tag_element;
    
    search_options = new Hash();

    search_options['starting_page'] = 1
    search_options['boolean_operator'] = 'AND';
    search_options['scope'] = '';

    tags = resource.getTags();
    tags = tags.sort(function (a, b) { return b.apparences - a.apprences });

    len = Math.min(3, tags.length);

    for (i = 0; i < len; i++) {
        tag = tags[i];

        tag_element = document.createElement('a');

        Element.extend(tag_element);
        tag_element.update(tag.value);
        tag_element.addClassName('link');
        tag_links.appendChild(tag_element);

        search_options['criteria'] = tag.value;

        user_command_manager.create_command_from_data('SIMPLE_SEARCH', tag_element, search_options, 'click');
    }
};

