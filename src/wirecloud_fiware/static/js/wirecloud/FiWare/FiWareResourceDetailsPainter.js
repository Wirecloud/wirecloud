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

var FiWareResourceDetailsPainter = function (catalogue, details_structure_element, container) {
    var get_extra_data, get_all_versions_html;

    this.catalogue = catalogue;
    this.details_template_element = details_structure_element;
    this.details_template = new Template(this.details_template_element);
    this.delete_options = {};
    this.container = container
    this.back_part = document.createElement('div');
    this.content_part = document.createElement('div');
    this.back_appended = false;
    this.mashup_tab_created = false;
    /***********************************/
    this.notebook = new StyledElements.StyledNotebook({'class': 'pruebas'});
    //this.container.appendChild(this.notebook);
    this.main_description = this.notebook.createTab({'name': gettext('Generic Info'), 'closable': false});
    this.legal_description = this.notebook.createTab({'name': gettext('Legal'), 'closable': false});
    this.pricing_description = this.notebook.createTab({'name': gettext('Pricing'), 'closable': false});
    this.sla_description = this.notebook.createTab({'name': gettext('Service level agreement'), 'closable': false});
    this.dom_element = this.main_description.wrapperElement; // Esto para borrar
    /***********************************/

    get_all_versions_html = function (versions) {
        var i, html = '';

        for (i = 0; i < versions.length; i += 1) {
            html += 'v' + versions[i].text + ' ';
        }

        return html;
    };
	

    this.paint = function (resource, user_command_manager) {
        var ieCompatibleClass, type, button_text,legal_more_info,legal_painter,
            resource_html, tag_links_list, tag_links, search_options, tags, j,
            tag, tag_element, mytags_area_list, my_tags_area, legal_button_dom_element,
            more_info_dom_element,sla_painter,sla_button_dom_element,
            sla_more_info,pricing_more_info,pricing_button_dom_element,
            pricing_painter,legal_button_info,sla_button_info,pricing_button_info, details_element,
            evaluate_dict,part_painter;
		
        this.main_description.clear();
        // The fields in this dictionary are only used in delete requests
        this.delete_options = {'store': resource.getStore(),
                               'name': resource.getMarketName()};
        /*if (resource.getIeCompatible()) {
            // Si es IE compatible ocultamos la advertencia
            ieCompatibleClass = 'hidden';
        }*/

        type = '';
        button_text = gettext('add');

        evaluate_dict = {
            'image_url': resource.getUriImage(),
            'name': resource.getDisplayName(),
            'type': resource.getType(),
            'longDescription': resource.getLongDescription(),
            'button_text': button_text,
            'vendor': resource.getVendor(),
            'version': resource.getVersion().text,
            'created': resource.getCreated(),
            'modified': resource.getModified(),
            'versions': get_all_versions_html(resource.getAllVersions()),
            'template_url': resource.getUriTemplate(),
            'store': resource.getStore(),
            'page':resource.getPage(),
            'average_popularity':this.get_popularity_html(resource.getPopularity())

        }

        resource_html = this.details_template.evaluate(evaluate_dict);
        details_element = document.createElement('div');
        Element.extend(details_element);
        details_element.update(resource_html);
        details_element.getElementsByClassName('image')[0].onerror = function (event) {
            event.target.src = '/static/images/noimage.png';
        };

        // If the resource is a mashup another tab is appended with information
        // about the services that compose it
        if(resource.isMashup() && !this.mashup_tab_created){
            this.resource_parts = this.notebook.createTab({'name': gettext('Mash-up parts'), 'closable': false});
            part_painter = new PartsPainter(catalogue,$('fiware_resource_parts').getTextContent(), this.resource_parts.wrapperElement);
            part_painter.paint(resource);
            this.mashup_tab_created = true;
        }else if(!resource.isMashup() && this.mashup_tab_created){
            this.resource_parts.close();
            this.mashup_tab_created = false;
        }

        this.back_part = details_element.getElementsByClassName('back_part')[0];
        this.content_part = details_element.getElementsByClassName('content_part')[0];

        this.main_description.wrapperElement.innerHTML = this.content_part.innerHTML;


        //take the dom elements that will contain the legal clauses
        legal_painter =new LegalPainter(catalogue,$('legal_template').getTextContent(), this.legal_description.wrapperElement);
        legal_painter.paint(resource);

        //take the dom elements that will contain the sla statements
        sla_painter =new SlaPainter(catalogue,$('service_level_template').getTextContent(),this.sla_description.wrapperElement);
        sla_painter.paint(resource)

        //take the dom elements tha will contain the pricing information
        pricing_painter =new PricingPainter(catalogue,$('pricing_template').getTextContent(),this.pricing_description.wrapperElement);
        pricing_painter.paint(resource)

        ///////////////////////////////
        // Binding events to GUI
        ///////////////////////////////

        // Go back to list of resources
        this.create_simple_command(this.back_part, '.back_to_resource_list', 'click', this.catalogue.home.bind(this.catalogue));

        // "Instantiate"
        this.create_simple_command(this.dom_element, '.instanciate_button', 'click', this.catalogue.createUserCommand('instanciate', resource));

        this.populate_advanced_operations(resource);

        if(!this.back_appended){
            this.container.appendChild(this.back_part);
            this.container.appendChild(this.notebook);
            this.back_appended = true;
        }
		
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
FiWareResourceDetailsPainter.prototype = new HTML_Painter();

FiWareResourceDetailsPainter.prototype.populate_advanced_operations = function (resource) {
    var button, element = this.dom_element.getElementsByClassName('advanced_operations')[0];

    button = new StyledElements.StyledButton({
        'text': gettext('Download'),
    });
    button.addEventListener('click', function () {
        window.open(resource.getUriTemplate(), '_blank')
    });
    button.insertInto(element);

    button = new StyledElements.StyledButton({
        'text': gettext('Delete'),
    });
    button.addEventListener('click', this.catalogue.createUserCommand('delete', resource, this.delete_options));
    button.insertInto(element);
};


