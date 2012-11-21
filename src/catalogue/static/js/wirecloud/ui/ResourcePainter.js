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

/*global document, EzWebExt, LayoutManagerFactory, gettext, interpolate, StyledElements, Wirecloud */

(function () {

    "use strict";

    var ResourcePainter = function ResourcePainter(catalogue, resource_template, container, extra_context) {
        if (arguments.length === 0) {
            return;
        }

        this.builder = new StyledElements.GUIBuilder();
        this.catalogue = catalogue;
        this.structure_template = resource_template;
        this.error_template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="error"><t:message/></div></s:styledgui>';
        this.container = container;
        if (typeof extra_context === 'object' || typeof extra_context === 'function') {
            this.extra_context = extra_context;
        } else {
            this.extra_context = {};
        }
    };

    ResourcePainter.prototype.setError = function setError(message) {
        this.container.clear();

        var contents = this.builder.parse(this.error_template, {
            'message': message
        });

        this.container.appendChild(contents);
    };

    ResourcePainter.prototype.paint = function paint(resource) {
        var extra_context, i, context, resource_element;

        if (typeof this.extra_context === 'function') {
            extra_context = this.extra_context(resource);
        } else {
            extra_context = EzWebExt.clone(this.extra_context);
        }

        context = EzWebExt.merge(extra_context, {
            'displayname': resource.getDisplayName(),
            'name': resource.getName(),
            'vendor': resource.getVendor(),
            'version': resource.getVersion().text,
            'author': resource.getCreator(),
            'description': resource.getDescription(),
            'lastupdate': function () { return resource.date.strftime('%x'); },
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
            'rating': this.get_popularity_html.bind(this, resource.getPopularity()),
            'mainbutton': function () {
                var button, local_catalogue_view;

                local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;
                if (this.resource.getType() === 'operator') {

                    if (Wirecloud.LocalCatalogue.resourceExists(this.resource)) {
                        button = new StyledElements.StyledButton({
                            'text': gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', this.resource, this.catalogue));
                    } else {

                        button = new StyledElements.StyledButton({
                            'text': gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('import', this.resource, this.catalogue));
                    }
                } else if (this.catalogue.getLabel() === 'local') {
                    switch (this.resource.getType()) {
                    case 'mashup':
                    case 'widget':
                        button = new StyledElements.StyledButton({
                            'class': 'instantiate_button',
                            'text': gettext('Add to workspace')
                        });
                        button.addEventListener('click', this.catalogue.createUserCommand('instantiate', this.resource));
                        break;
                    default:
                        button = new StyledElements.StyledButton({text: gettext('Download')});
                        button.addEventListener('click', function (resource) {
                            window.open(resource.getUriTemplate(), '_blank');
                        }.bind(null, this.resource));
                    }
                } else {
                    if (Wirecloud.LocalCatalogue.resourceExists(this.resource)) {
                        button = new StyledElements.StyledButton({
                            'text': gettext('Uninstall')
                        });
                        button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', this.resource, this.catalogue));
                    } else {
                        button = new StyledElements.StyledButton({
                            'text': gettext('Install')
                        });

                        button.addEventListener('click', local_catalogue_view.createUserCommand('import', this.resource, this.catalogue));
                    }
                }
                button.addClassName('mainbutton btn-primary');
                return button;
            }.bind({catalogue: this.catalogue, resource: resource}),
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
            'advancedops': this.renderAdvancedOperations.bind(this, resource),
            'uploader': function () {
                if (resource.uploader != null) {
                    return resource.uploader;
                } else {
                    return gettext('Anonymous');
                }
            }
        });

        resource_element = this.builder.parse(this.structure_template, context);

        // TODO "Show details"
        for (i = 0; i < resource_element.elements.length; i += 1) {
            if (!EzWebExt.XML.isElement(resource_element.elements[i])) {
                continue;
            }
            this.create_simple_command(resource_element.elements[i], '.click_for_details', 'click', this.catalogue.createUserCommand('showDetails', resource));
        }

        return resource_element;
    };

    ResourcePainter.prototype.renderAdvancedOperations = function renderAdvancedOperations(resource) {
        var button, fragment = new StyledElements.Fragment();

        button = new StyledElements.StyledButton({
            'text': gettext('Download')
        });
        button.addEventListener('click', function () {
            window.open(resource.getUriTemplate(), '_blank');
        });
        fragment.appendChild(button);

        if (Wirecloud.LocalCatalogue.resourceExists(resource)) {
            var local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;
            button = new StyledElements.StyledButton({
                'text': gettext('Uninstall')
            });
            button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', resource, this.catalogue));
            fragment.appendChild(button);
        }

        if (resource.isAllow('delete')) {
            button = new StyledElements.StyledButton({
                'class': 'btn-danger',
                'text': gettext('Delete')
            });
            button.addEventListener('click', this.catalogue.createUserCommand('delete', resource));
            fragment.appendChild(button);
        }

        if ((resource.getAllVersions().length > 1) && resource.isAllow('delete-all')) {
            button = new StyledElements.StyledButton({
                'class': 'btn-danger',
                'text': gettext('Delete all versions')
            });
            button.addEventListener('click', this.catalogue.createUserCommand('delete', resource));
            fragment.appendChild(button);
        }

        return fragment;
    };

    ResourcePainter.prototype.renderTagList = function renderTagList(resource, listener, max) {
        var i, fragment, tags, tag, tag_element, len;

        fragment = new StyledElements.Fragment();

        tags = resource.getTags();
        tags = tags.sort(function (a, b) {
            return b.apparences - a.apparences;
        });

        if (typeof max === 'undefined') {
            max = tags.length;
        }
        len = Math.min(max, tags.length);

        for (i = 0; i < len; i += 1) {
            tag = tags[i];

            tag_element = document.createElement('a');
            tag_element.textContent = tag.value;
            fragment.appendChild(tag_element);
        }

        return fragment;
    };

    ResourcePainter.prototype.create_simple_command = function (element, selector, _event, handler, required) {
        var i, elements = element.getElementsBySelector(selector);

        if (required && elements.length < 1) {
            throw new Error();
        }

        for (i = 0; i < elements.length; i += 1) {
            EzWebExt.addEventListener(elements[i], _event, handler);
        }
    };

    ResourcePainter.prototype.get_popularity_html = function (popularity) {
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

    Wirecloud.ui.ResourcePainter = ResourcePainter;
})();
