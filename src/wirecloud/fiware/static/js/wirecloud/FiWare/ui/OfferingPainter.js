/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global document, EzWebExt, LayoutManagerFactory, gettext, interpolate, StyledElements, Wirecloud */

(function () {

    "use strict";

    var OfferingPainter = function OfferingPainter(catalogue_view, resource_template, container, extra_context) {
        if (arguments.length === 0) {
            return;
        }

        this.builder = new StyledElements.GUIBuilder();
        this.catalogue_view = catalogue_view;
        this.structure_template = resource_template;
        this.error_template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="alert alert-block alert-error"><t:message/></div></s:styledgui>';
        this.container = container;
        if (typeof extra_context === 'object' || typeof extra_context === 'function') {
            this.extra_context = extra_context;
        } else {
            this.extra_context = {};
        }
    };

    OfferingPainter.prototype.setError = function setError(message) {
        this.container.clear();

        var contents = this.builder.parse(this.error_template, {
            'message': message
        });

        this.container.appendChild(contents);
    };

    OfferingPainter.prototype.paint = function paint(resource) {
        var extra_context, i, context, resource_element;

        if (typeof this.extra_context === 'function') {
            extra_context = this.extra_context(resource);
        } else {
            extra_context = EzWebExt.clone(this.extra_context);
        }

        context = EzWebExt.merge(extra_context, {
            'displayname': resource.getDisplayName(),
            'name': resource.getName(),
            'owner': resource.getVendor(),
            'store': resource.store,
            'version': resource.version.text,
            'abstract': resource['abstract'],
            'description': resource.description,
            'type': function () {
                var label = document.createElement('div');
                label.textContent = resource.getType();
                label.className = 'label';
                switch (resource.getType()) {
                case 'widget':
                    label.classList.add('label-success');
                    break;
                case 'operator':
                    label.classList.add('label-warning');
                    break;
                case 'mashup':
                    label.classList.add('label-important');
                    break;
                case 'pack':
                    label.classList.add('label-info');
                    break;
                }

                return label;
            },
            'publicationdate': function () {
                if (resource.publicationdate != null) {
                    return resource.publicationdate.strftime('%x');
                } else {
                    return gettext('N/A');
                }
            },
            'doc': function () {
                var button;

                button = new StyledElements.StyledButton({
                    'plain': true,
                    'class': 'icon-doc',
                    'title': gettext('Documentation')
                });
                button.addEventListener('click', function () {
                    window.open(resource.getUriWiki(), '_blank');
                });

                return button;
            },
            'home': function () {
                var button;

                button = new StyledElements.StyledButton({
                    'plain': true,
                    'class': 'icon-home',
                    'title': gettext('Home page')
                });
                button.addEventListener('click', function () {
                    window.open(resource.getUriWiki(), '_blank');
                });

                return button;
            },
            'rating': this.get_popularity_html.bind(this, resource.rating),
            'mainbutton': function () {
                var button, local_catalogue_view;

                local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;

                if (!this.catalogue_view.catalogue.is_purchased(this.resource) && ['widget', 'operator', 'mashup', 'pack'].indexOf(this.resource.getType()) !== -1) {
                    button = new StyledElements.StyledButton({
                        'class': 'mainbutton btn-success',
                        'text': gettext('Buy')
                    });
                    button.addEventListener('click', this.catalogue_view.createUserCommand('buy', this.resource));
                    return button;
                }

                if (this.resource.getType() === 'operator') {

                    if (Wirecloud.LocalCatalogue.resourceExists(this.resource)) {
                        button = new StyledElements.StyledButton({
                            'class': 'btn-danger',
                            'text': gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', this.resource, this.catalogue_view));
                    } else {

                        button = new StyledElements.StyledButton({
                            'text': gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('install', this.resource, this.catalogue_view));
                    }
                } else {
                    if (Wirecloud.LocalCatalogue.resourceExists(this.resource)) {
                        button = new StyledElements.StyledButton({
                            'class': 'btn-danger',
                            'text': gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', this.resource, this.catalogue_view));
                    } else if (['widget', 'operator', 'mashup'].indexOf(this.resource.getType()) != -1) {
                        button = new StyledElements.StyledButton({
                            'text': gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('install', this.resource, this.catalogue_view));
                    } else {
                        button = new StyledElements.StyledButton({
                            'text': gettext('Details')
                        });

                        button.addEventListener('click', this.catalogue_view.createUserCommand('showDetails', this.resource));
                    }
                }
                button.addClassName('mainbutton btn-primary');
                return button;
            }.bind({catalogue_view: this.catalogue_view, resource: resource}),
            'image': function () {
                var image = document.createElement('img');
                image.onerror = function (event) {
                    event.target.src = '/static/images/noimage.png';
                };
                image.src = resource.getUriImage();
                return image;
            },
            'tags': function (options) {
                return this.painter.renderTagList(this.resource, options.max);
            }.bind({painter: this, resource: resource}),
            'versions': function () {
                var versions = resource.getAllVersions().map(function (version) { return 'v' + version.text; });
                return versions.join(', ');
            }
        });

        resource_element = this.builder.parse(this.structure_template, context);

        // TODO "Show details"
        for (i = 0; i < resource_element.elements.length; i += 1) {
            if (!EzWebExt.XML.isElement(resource_element.elements[i])) {
                continue;
            }
            this.create_simple_command(resource_element.elements[i], '.click_for_details', 'click', this.catalogue_view.createUserCommand('showDetails', resource));
        }

        return resource_element;
    };

    OfferingPainter.prototype.create_simple_command = function (element, selector, _event, handler, required) {
        var i, elements = element.getElementsBySelector(selector);

        if (required && elements.length < 1) {
            throw new Error();
        }

        for (i = 0; i < elements.length; i += 1) {
            elements[i].addEventListener(_event, handler);
        }
    };

    OfferingPainter.prototype.get_popularity_html = function (popularity) {
        var on_stars, md_star, off_stars, stars, star, i;

        on_stars = Math.floor(popularity);
        md_star = popularity - on_stars;
        off_stars = 5 - popularity;

        stars = document.createElement('div');
        stars.className = 'rating';

        // "On" stars
        for (i = 0; i < on_stars; i += 1) {
            star = document.createElement('span');
            star.className = 'on star';
            stars.appendChild(star);
        }

        if (md_star) {
            star = document.createElement('span');
            star.className = 'md star';
            stars.appendChild(star);
        }

        // "Off" stars
        for (i = 0; i < Math.floor(off_stars); i += 1) {
            star = document.createElement('span');
            star.className = 'off star';
            stars.appendChild(star);
        }

        return stars;
    };

    Wirecloud.FiWare.ui.OfferingPainter = OfferingPainter;
})();
