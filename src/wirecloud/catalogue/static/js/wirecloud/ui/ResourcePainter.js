/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals moment, StyledElements, Wirecloud */

(function (se, utils) {

    "use strict";

    var ResourcePainter = function ResourcePainter(catalogue_view, resource_template, container, extra_context) {
        if (arguments.length === 0) {
            return;
        }

        this.builder = new se.GUIBuilder();
        this.catalogue_view = catalogue_view;
        this.structure_template = resource_template;
        this.error_template = this.builder.DEFAULT_OPENING + '<div class="alert alert-error"><t:message/></div>' + this.builder.DEFAULT_CLOSING;
        this.info_template = this.builder.DEFAULT_OPENING + '<div class="alert alert-info"><t:message/></div>' + this.builder.DEFAULT_CLOSING;
        this.container = container;
        if (extra_context != null && (typeof extra_context === 'object' || typeof extra_context === 'function')) {
            this.extra_context = extra_context;
        } else {
            this.extra_context = {};
        }
    };

    ResourcePainter.prototype.paintInfo = function paintError(message, context) {
        if (context != null) {
            message = this.builder.parse(this.builder.DEFAULT_OPENING + message + this.builder.DEFAULT_CLOSING, context);
        }

        return this.builder.parse(this.info_template, {
            'message': message
        });
    };

    ResourcePainter.prototype.paintError = function paintError(message) {
        return this.builder.parse(this.error_template, {
            'message': message
        });
    };

    ResourcePainter.prototype.setError = function setError(message) {
        this.container.clear();
        this.container.appendChild(this.paintError(message));
    };

    ResourcePainter.prototype.paint = function paint(resource) {
        var extra_context, i, context, resource_element, license_text;

        if (typeof this.extra_context === 'function') {
            extra_context = this.extra_context(resource);
        } else {
            extra_context = utils.clone(this.extra_context);
        }

        if (resource.license != null && resource.license !== '') {
            license_text = resource.license;
        } else {
            license_text = 'N/A';
        }

        context = utils.merge(extra_context, {
            'title': resource.title,
            'name': resource.name,
            'internalname': resource.uri,
            'vendor': resource.vendor,
            'version': resource.version,
            'authors': this.get_people_list.bind(null, resource.authors),
            'contributors': this.get_people_list.bind(null, resource.contributors),
            'description': resource.description,
            'longdescription': function () {
                return new se.Fragment(resource.longdescription);
            },
            'type': function () {
                var label = document.createElement('div');
                label.textContent = resource.type;
                label.className = 'label';
                switch (resource.type) {
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
            'lastupdate': function () { return moment(resource.date).fromNow(); },
            'home': function () {
                var button;

                button = new se.Button({
                    plain: true,
                    iconClass: 'fa fa-home',
                    title: utils.gettext('Home page')
                });
                if (resource.homepage != null && resource.homepage !== '') {
                    button.addEventListener('click', function () {
                        window.open(resource.homepage, '_blank');
                    });
                } else {
                    button.disable();
                }

                return button;
            },
            'issuetracker': function () {
                var button;

                button = new se.Button({
                    plain: true,
                    iconClass: 'fa fa-bug',
                    title: utils.gettext('Issue tracker')
                });
                if (resource.issuetracker != null && resource.issuetracker !== '') {
                    button.addEventListener('click', function () {
                        window.open(resource.issuetracker, '_blank');
                    });
                } else {
                    button.disable();
                }

                return button;
            },
            'license': license_text,
            'license_home': function () {
                var button;

                button = new se.Button({
                    plain: true,
                    iconClass: 'fa fa-legal',
                    title: utils.gettext('License details')
                });

                if (resource.licenseurl != null && resource.licenseurl !== '') {
                    button.addEventListener('click', function () {
                        window.open(resource.licenseurl, '_blank');
                    });
                } else {
                    button.disable();
                }

                return button;
            },
            'rating': this.get_popularity_html.bind(this, resource.rating),
            'image': function () {
                var image = document.createElement('img');
                image.className = 'wc-resource-img';

                if (resource.image) {
                    image.onerror = onImageError;
                    setTimeout(() => {image.src = resource.image;});
                } else {
                    setTimeout(onImageError.bind(null, {target: image}), 0);
                }

                return image;
            },
            'tags': function (options) {
                return this.painter.renderTagList(this.resource, options.max);
            }.bind({painter: this, resource: resource}),
            'advancedops': this.renderAdvancedOperations.bind(this, resource),
            'size': utils.formatSize.bind(this, resource.size),
            'versions': function () {
                var versions = resource.getAllVersions().map(function (version) { return 'v' + version.text; });
                return versions.join(', ');
            }
        });

        resource_element = this.builder.parse(this.structure_template, context, resource);

        // TODO "Show details" & tooltip
        for (i = 0; i < resource_element.elements.length; i += 1) {
            if (!(resource_element.elements[i] instanceof Element)) {
                continue;
            }
            if (this.catalogue_view) {
                this.create_simple_command(resource_element.elements[i], '.click_for_details', 'click', this.catalogue_view.createUserCommand('showDetails', resource));
            }
            var title_element = resource_element.elements[i].querySelector('.title-tooltip');
            if (title_element != null) {
                var tooltip = new se.Tooltip({content: resource.title, placement: ['top', 'bottom', 'right', 'left']});
                tooltip.bind(title_element);
            }
        }

        return resource_element;
    };

    ResourcePainter.prototype.renderAdvancedOperations = function renderAdvancedOperations(resource) {
        var button, fragment = new se.Fragment();

        button = new se.Button({
            'text': utils.gettext('Download')
        });
        button.addEventListener('click', function () {
            window.open(resource.description_url, '_blank');
        });
        fragment.appendChild(button);

        if (resource.type === 'widget') {
            button = new se.Button({
                'text': utils.gettext('Add to workspace')
            });
            button.addEventListener('click', function () {
                Wirecloud.UserInterfaceManager.changeCurrentView('workspace');
                var local_widget = Wirecloud.LocalCatalogue.getResource(resource.vendor, resource.name, resource.version);
                Wirecloud.activeWorkspace.view.activeTab.createWidget(local_widget);
            });
            fragment.appendChild(button);
        }

        if (this.catalogue_view.catalogue === Wirecloud.LocalCatalogue) {
            button = new se.Button({
                'text': utils.gettext('Publish')
            });
            button.addEventListener('click', this.catalogue_view.createUserCommand('publishOtherMarket', resource));
            fragment.appendChild(button);
        }

        if (Wirecloud.LocalCatalogue.resourceExists(resource) && resource.isAllow('uninstall')) {
            var local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;
            button = new se.Button({
                'class': 'btn-danger',
                'text': utils.gettext('Uninstall')
            });
            button.addEventListener('click', local_catalogue_view.createUserCommand('uninstall', resource, this.catalogue_view));
            fragment.appendChild(button);
        }

        if ((resource.getAllVersions().length > 1) && resource.isAllow('uninstall-all')) {
            button = new se.Button({
                'class': 'btn-danger',
                'text': utils.gettext('Uninstall all versions')
            });
            button.addEventListener('click', this.catalogue_view.createUserCommand('uninstallall', resource, this.catalogue_view));
            fragment.appendChild(button);
        }

        if (resource.isAllow('delete')) {
            button = new se.Button({
                'class': 'btn-danger',
                'text': utils.gettext('Delete')
            });
            button.addEventListener('click', this.catalogue_view.createUserCommand('delete', resource));
            fragment.appendChild(button);
        }

        if ((resource.getAllVersions().length > 1) && resource.isAllow('delete-all')) {
            button = new se.Button({
                'class': 'btn-danger',
                'text': utils.gettext('Delete all versions')
            });
            button.addEventListener('click', this.catalogue_view.createUserCommand('deleteall', resource));
            fragment.appendChild(button);
        }

        return fragment;
    };

    ResourcePainter.prototype.renderTagList = function renderTagList(resource, listener, max) {
        var i, fragment, tags, tag, tag_element, len;

        fragment = new se.Fragment();

        tags = resource.tags.slice();
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
        var i, elements, root_matches;

        elements = element.querySelectorAll(selector);
        root_matches = element.matches(selector);

        if (required && elements.length < 1 && !root_matches) {
            throw new Error();
        }

        if (root_matches) {
            element.addEventListener(_event, handler);
        }

        for (i = 0; i < elements.length; i += 1) {
            elements[i].addEventListener(_event, handler);
        }
    };

    ResourcePainter.prototype.get_people_list = function get_people_list(people, options) {
        var i, fragment, dd;

        if (people.length === 0) {
            dd = document.createElement('dd');
            if (options.class) {
                dd.className = options.class;
            }
            dd.textContent = utils.gettext('N/A');
            return dd;
        }
        fragment = new se.Fragment();

        for (i = 0; i < people.length; i++) {
            dd = document.createElement('dd');
            if (options.class) {
                dd.className = options.class;
            }
            dd.textContent = people[i].name;
            fragment.appendChild(dd);
        }

        return fragment;
    };

    ResourcePainter.prototype.get_popularity_html = function get_popularity_html(popularity) {
        var on_stars, md_star, off_stars, stars, star, i;

        if (popularity == null || popularity < 1) {
            popularity = 0;
        }

        on_stars = Math.floor(popularity);
        md_star = popularity - on_stars;
        off_stars = 5 - popularity;

        stars = document.createElement('div');
        stars.className = 'rating';

        if (popularity === 0) {
            stars.classList.add('disabled');
        }

        // "On" stars
        for (i = 0; i < on_stars; i += 1) {
            star = document.createElement('span');
            star.className = 'on fas fa-star';
            stars.appendChild(star);
        }

        if (md_star) {
            star = document.createElement('span');
            star.className = 'middle fas fa-star-half-alt';
            stars.appendChild(star);
        }

        // "Off" stars
        for (i = 0; i < Math.floor(off_stars); i += 1) {
            star = document.createElement('span');
            star.className = 'off far fa-star';
            stars.appendChild(star);
        }

        return stars;
    };

    var onImageError = function onImageError(event) {
        event.target.parentElement.classList.add('se-thumbnail-missing');
        event.target.parentElement.textContent = utils.gettext('No image available');
    };

    Wirecloud.ui.ResourcePainter = ResourcePainter;

})(StyledElements, Wirecloud.Utils);
