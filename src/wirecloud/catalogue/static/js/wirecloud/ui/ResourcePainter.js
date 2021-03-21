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

(function (ns, se, utils) {

    "use strict";

    const onImageError = function onImageError(event) {
        event.target.parentElement.classList.add('se-thumbnail-missing');
        event.target.parentElement.textContent = utils.gettext('No image available');
    };

    ns.ResourcePainter = class ResourcePainter {

        constructor(catalogue_view, resource_template, container, extra_context) {
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
        }

        paintError(message, context) {
            if (context != null) {
                message = this.builder.parse(this.builder.DEFAULT_OPENING + message + this.builder.DEFAULT_CLOSING, context);
            }

            return this.builder.parse(this.info_template, {
                'message': message
            });
        }

        paintError(message) {
            return this.builder.parse(this.error_template, {
                'message': message
            });
        }

        setError(message) {
            this.container.clear();
            this.container.appendChild(this.paintError(message));
        }

        paint(resource) {
            let extra_context, i, license_text;

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

            const context = utils.merge(extra_context, {
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
                    const label = document.createElement('div');
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
                    const button = new se.Button({
                        plain: true,
                        iconClass: 'fas fa-home',
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
                    const button = new se.Button({
                        plain: true,
                        iconClass: 'fas fa-bug',
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
                    const button = new se.Button({
                        plain: true,
                        iconClass: 'fas fa-gavel',
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
                    const image = document.createElement('img');
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
                    const versions = resource.getAllVersions().map(function (version) { return 'v' + version.text; });
                    return versions.join(', ');
                }
            });

            const resource_element = this.builder.parse(this.structure_template, context, resource);

            // TODO "Show details" & tooltip
            for (i = 0; i < resource_element.elements.length; i += 1) {
                if (!(resource_element.elements[i] instanceof Element)) {
                    continue;
                }
                if (this.catalogue_view) {
                    this.create_simple_command(resource_element.elements[i], '.click_for_details', 'click', this.catalogue_view.createUserCommand('showDetails', resource));
                }
                const title_element = resource_element.elements[i].querySelector('.title-tooltip');
                if (title_element != null) {
                    const tooltip = new se.Tooltip({content: resource.title, placement: ['top', 'bottom', 'right', 'left']});
                    tooltip.bind(title_element);
                }
            }

            return resource_element;
        }

        renderAdvancedOperations(resource) {
            const fragment = new se.Fragment();
            let button = new se.Button({
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
                    const local_widget = Wirecloud.LocalCatalogue.getResource(resource.vendor, resource.name, resource.version);
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
                const local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;
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
        }

        renderTagList(resource, listener, max) {
            const fragment = new se.Fragment();

            const tags = resource.tags.slice().sort(function (a, b) {
                return b.apparences - a.apparences;
            });

            if (typeof max === 'undefined') {
                max = tags.length;
            }
            const len = Math.min(max, tags.length);
            for (let i = 0; i < len; i += 1) {
                const tag = tags[i];

                const tag_element = document.createElement('a');
                tag_element.textContent = tag.value;
                fragment.appendChild(tag_element);
            }

            return fragment;
        }

        create_simple_command(element, selector, _event, handler, required) {
            const elements = element.querySelectorAll(selector);
            const root_matches = element.matches(selector);

            if (required && elements.length < 1 && !root_matches) {
                throw new Error();
            }

            if (root_matches) {
                element.addEventListener(_event, handler);
            }

            elements.forEach((element) => {
                element.addEventListener(_event, handler);
            });
        }

        get_people_list(people, options) {
            if (people.length === 0) {
                const dd = document.createElement('dd');
                if (options.class) {
                    dd.className = options.class;
                }
                dd.textContent = utils.gettext('N/A');
                return dd;
            }
            const fragment = new se.Fragment();

            for (let i = 0; i < people.length; i++) {
                const dd = document.createElement('dd');
                if (options.class) {
                    dd.className = options.class;
                }
                dd.textContent = people[i].name;
                fragment.appendChild(dd);
            }

            return fragment;
        }

        get_popularity_html(popularity) {
            if (popularity == null || popularity < 1) {
                popularity = 0;
            }

            const on_stars = Math.floor(popularity);
            const md_star = popularity - on_stars;
            const off_stars = 5 - popularity;

            const stars = document.createElement('div');
            stars.className = 'rating';

            if (popularity === 0) {
                stars.classList.add('disabled');
            }

            // "On" stars
            for (let i = 0; i < on_stars; i += 1) {
                const star = document.createElement('span');
                star.className = 'on fas fa-star';
                stars.appendChild(star);
            }

            if (md_star) {
                const star = document.createElement('span');
                star.className = 'middle fas fa-star-half-alt';
                stars.appendChild(star);
            }

            // "Off" stars
            for (let i = 0; i < Math.floor(off_stars); i += 1) {
                const star = document.createElement('span');
                star.className = 'off far fa-star';
                stars.appendChild(star);
            }

            return stars;
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
