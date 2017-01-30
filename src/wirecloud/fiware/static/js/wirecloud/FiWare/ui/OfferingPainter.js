/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var CURRENCY_SYMBOL = {
        'EUR': '€',
        'GBP': '£',
        'USD': '$'
    };

    var onInstallClick = function onInstallClick(offering, catalogue_view) {
        Wirecloud.UserInterfaceManager.monitorTask(
            offering.install({
                onResourceSuccess: function () {
                    var local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;
                    local_catalogue_view.viewsByName.search.mark_outdated();
                }
            }).then(() => {
                this.update_buttons();
            }, (error) => {
                this.update_buttons();
            })
        );
    };

    var onUninstallClick = function onUninstallClick(offering, catalogue_view) {
        var local_catalogue_view = Wirecloud.UserInterfaceManager.views.myresources;

        var subtasks = offering.wirecloudresources.map((component) => {
            return local_catalogue_view.catalogue.uninstallResource(component.wirecloud);
        });

        Wirecloud.UserInterfaceManager.monitorTask(
            new Wirecloud.Task(
                utils.gettext("Uninstalling offering resources"),
                subtasks
            ).then(() => {
                local_catalogue_view.viewsByName.search.mark_outdated();
                catalogue_view.viewsByName.search.mark_outdated();
                this.update_buttons();
            }, (error) => {
                this.update_buttons();
            })
        );
    };

    var is_single_payment = function is_single_payment(offering) {
        var pricing = offering.pricing[0];
        return pricing.priceComponents.length === 1 && pricing.priceComponents[0].unit.toLowerCase() === 'single payment';
    };

    var OfferingPainter = function OfferingPainter(catalogue_view, offering_template, container, extra_context) {
        if (arguments.length === 0) {
            return;
        }

        this.builder = new StyledElements.GUIBuilder();
        this.catalogue_view = catalogue_view;
        this.structure_template = offering_template;
        this.error_template = '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><div class="alert alert-block alert-error"><t:message/></div></s:styledgui>';
        this.container = container;
        this.is_details_view = extra_context != null; // TODO
        if (extra_context != null && (typeof extra_context === 'object' || typeof extra_context === 'function')) {
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

    OfferingPainter.prototype.paint = function paint(offering) {
        var extra_context, i, context, offering_element;

        if (typeof this.extra_context === 'function') {
            extra_context = this.extra_context(offering);
        } else {
            extra_context = utils.clone(this.extra_context);
        }

        context = utils.merge(extra_context, {
            'displayname': offering.getDisplayName(),
            'name': offering.name,
            'owner': offering.owner,
            'store': offering.store,
            'version': offering.version,
            'abstract': offering.abstract,
            'description': offering.description,
            'type': function () {
                var label = document.createElement('div');
                label.textContent = offering.type;
                label.className = 'label';
                switch (offering.type) {
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
                if (offering.publicationdate != null) {
                    return moment(offering.publicationdate).fromNow();
                } else {
                    return utils.gettext('N/A');
                }
            },
            'rating': this.get_popularity_html.bind(this, offering.rating),
            'mainbutton': function (options, context, offering_entry) {
                var button;
                if (['widget', 'operator', 'mashup', 'pack'].indexOf(offering.type) === -1 && this.is_details_view) {
                    return null;
                } else {
                    button = new StyledElements.Button({text: ''});
                    offering_entry.mainbuttons.push(button);
                }

                return button;
            }.bind(this),
            'image': function () {
                var image = document.createElement('img');
                image.className = "wc-resource-img";
                image.onerror = onImageError;
                image.src = offering.image;

                return image;
            },
            'tags': function (options) {
                return this.painter.renderTagList(offering, options.max);
            }.bind({painter: this})
        });
        var offering_entry = new OfferingEntry(this, offering);
        offering_element = this.builder.parse(this.structure_template, context, offering_entry);
        offering_entry.update_buttons();

        // TODO "Show details" & tooltip
        for (i = 0; i < offering_element.elements.length; i += 1) {
            if (!(offering_element.elements[i] instanceof Element)) {
                continue;
            }
            if (this.catalogue_view) {
                this.create_simple_command(offering_element.elements[i], '.click_for_details', 'click', this.catalogue_view.createUserCommand('showDetails', offering));
            }
            var title_element = offering_element.elements[i].querySelector('.title-tooltip');
            if (title_element != null) {
                var tooltip = new se.Tooltip({content: offering.getDisplayName(), placement: ['top', 'bottom', 'right', 'left']});
                tooltip.bind(title_element);
            }
        }

        return offering_element;
    };

    var OfferingEntry = function OfferingEntry(painter, offering) {
        this.painter = painter;
        this.offering = offering;
        this.mainbuttons = [];
        this.resource_buttons = {};
    };

    OfferingEntry.prototype.update_mainbuttons = function update_mainbuttons() {
        var i, button;

        for (i = 0; i < this.mainbuttons.length; i++) {
            button = this.mainbuttons[i];
            button.clearClassName().addClassName('mainbutton');
            button.clearEventListeners();

            if (!this.painter.catalogue_view.catalogue.is_purchased(this.offering) && ['widget', 'operator', 'mashup', 'pack'].indexOf(this.offering.type) !== -1) {
                if (this.offering.pricing.length === 0 || !('priceComponents' in this.offering.pricing[0])) {
                    button.addClassName('btn-success').setLabel(utils.gettext('Free'));
                } else if (is_single_payment(this.offering)) {
                    button.addClassName('btn-warning').setLabel(this.offering.pricing[0].priceComponents[0].value + ' ' + CURRENCY_SYMBOL[this.offering.pricing[0].priceComponents[0].currency]);
                } else {
                    button.addClassName('btn-warning').setLabel(utils.gettext('Purchase'));
                }
                button.addEventListener('click', this.painter.catalogue_view.createUserCommand('buy', this.offering, this));
                continue;
            }

            if (this.offering.wirecloudresources.length > 0) {
                if (!this.offering.installed) {
                    button.addClassName('btn-primary').setLabel(utils.gettext('Install'));
                    button.addEventListener('click', onInstallClick.bind(this, this.offering, this.painter.catalogue_view));
                } else {
                    button.addClassName('btn-danger').setLabel(utils.gettext('Uninstall'));
                    button.addEventListener('click', onUninstallClick.bind(this, this.offering, this.painter.catalogue_view));
                }
            } else {
                button.addClassName('btn-info').setLabel(utils.gettext('Details'));
                button.addEventListener('click', this.painter.catalogue_view.createUserCommand('showDetails', this.offering));
                button.setDisabled(this.painter.is_details_view);
            }
        }

    };

    OfferingEntry.prototype.update_buttons = function update_buttons() {
        this.update_mainbuttons();
        if ('update_resource_buttons' in this) {
            this.update_resource_buttons();
        }
    };

    OfferingPainter.prototype.create_simple_command = function (element, selector, _event, handler, required) {
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

    OfferingPainter.prototype.get_popularity_html = function (popularity) {
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
            star.className = 'on star';
            stars.appendChild(star);
        }

        if (md_star) {
            star = document.createElement('span');
            star.className = 'middle star';
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

    var onImageError = function onImageError(event) {
        event.target.parentElement.classList.add('se-thumbnail-missing');
        event.target.parentElement.textContent = utils.gettext('No image available');
    };

    Wirecloud.FiWare.ui.OfferingPainter = OfferingPainter;

})(StyledElements, Wirecloud.Utils);
