/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global LayoutManagerFactory, gettext, StyledElements, Wirecloud */

(function () {

    "use strict";

    var CURRENCY_SYMBOL = {
        'EUR': '€',
        'GBP': '£',
        'USD': '$'
    };

    var onInstallClick = function onInstallClick(offering, catalogue_view) {
        var layoutManager, monitor;

        layoutManager = LayoutManagerFactory.getInstance();
        monitor = layoutManager._startComplexTask(gettext("Importing offering resources into local repository"), 3);

        offering.install({
            monitor: monitor,
            onResourceSuccess: function () {
                var local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
                local_catalogue_view.viewsByName.search.mark_outdated();
            },
            onComplete: function () {
                this.update_buttons();
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }.bind(this)
        });
    };

    var onUninstallClick = function onUninstallClick(offering, catalogue_view) {
        var layoutManager, local_catalogue_view, monitor, i, count, callbacks;

        layoutManager = LayoutManagerFactory.getInstance();
        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
        monitor = layoutManager._startComplexTask(gettext("Uninstalling offering resources"), 1);

        count = offering.resources.length;
        callbacks = {
            onSuccess: function () {
                local_catalogue_view.viewsByName.search.mark_outdated();
                catalogue_view.viewsByName.search.mark_outdated();
            },
            onComplete: function () {
                if (--count === 0) {
                    LayoutManagerFactory.getInstance()._notifyPlatformReady();
                    this.update_buttons();
                }
            }.bind(this)
        };

        for (i = 0; i < offering.resources.length; i++) {
            if ('type' in offering.resources[i]) {
                local_catalogue_view.catalogue.uninstallResource(offering.resources[i], callbacks);
            } else {
                count -= 1;
            }
        }
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
            extra_context = Wirecloud.Utils.clone(this.extra_context);
        }

        context = Wirecloud.Utils.merge(extra_context, {
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
                    return offering.publicationdate.strftime('%x');
                } else {
                    return gettext('N/A');
                }
            },
            'rating': this.get_popularity_html.bind(this, offering.rating),
            'mainbutton': function (options, context, offering_entry) {
                var button;
                if (['widget', 'operator', 'mashup', 'pack'].indexOf(offering.type) === -1 && this.is_details_view) {
                    return null;
                } else {
                    button = new StyledElements.StyledButton({text: ''});
                    offering_entry.mainbuttons.push(button);
                }

                return button;
            }.bind(this),
            'image': function () {
                var container = document.createElement('div');
                container.className = "wc-resource-img-container";

                var image = document.createElement('img');
                image.className = "wc-resource-img";
                image.onerror = function (event) {
                    event.target.src = '/static/images/noimage.png';
                };
                image.src = offering.image;

                container.appendChild(image);
                return container;
            },
            'tags': function (options) {
                return this.painter.renderTagList(offering, options.max);
            }.bind({painter: this})
        });
        var offering_entry = new OfferingEntry(this, offering);
        offering_element = this.builder.parse(this.structure_template, context, offering_entry);
        offering_entry.update_buttons();

        // TODO "Show details"
        for (i = 0; i < offering_element.elements.length; i += 1) {
            if (!Wirecloud.Utils.XML.isElement(offering_element.elements[i])) {
                continue;
            }
            this.create_simple_command(offering_element.elements[i], '.click_for_details', 'click', this.catalogue_view.createUserCommand('showDetails', offering));
            if (offering_element.elements[i].classList.contains('click_for_details')) {
                offering_element.elements[i].addEventListener('click', this.catalogue_view.createUserCommand('showDetails', offering));
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
        var i, button, local_catalogue_view;

        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;

        for (i = 0; i < this.mainbuttons.length; i++) {
            button = this.mainbuttons[i];
            button.clearClassName().addClassName('mainbutton');
            button.clearEventListeners();

            if (!this.painter.catalogue_view.catalogue.is_purchased(this.offering) && ['widget', 'operator', 'mashup', 'pack'].indexOf(this.offering.type) !== -1) {
                if (this.offering.pricing.length === 0 || !('priceComponents' in this.offering.pricing[0])) {
                    button.addClassName('btn-success').setLabel(gettext('Free'));
                } else if (is_single_payment(this.offering)) {
                    button.addClassName('btn-warning').setLabel(this.offering.pricing[0].priceComponents[0].value + ' ' + CURRENCY_SYMBOL[this.offering.pricing[0].priceComponents[0].currency]);
                } else {
                    button.addClassName('btn-warning').setLabel(gettext('Purchase'));
                }
                button.addEventListener('click', this.painter.catalogue_view.createUserCommand('buy', this.offering, this));
                continue;
            }

            if (['widget', 'operator', 'mashup', 'pack'].indexOf(this.offering.type) !== -1) {
                if (!this.offering.installed) {
                    button.addClassName('btn-primary').setLabel(gettext('Install'));
                    button.addEventListener('click', onInstallClick.bind(this, this.offering, this.painter.catalogue_view));
                } else {
                    button.addClassName('btn-danger').setLabel(gettext('Uninstall'));
                    button.addEventListener('click', onUninstallClick.bind(this, this.offering, this.painter.catalogue_view));
                }
            } else {
                button.addClassName('btn-info').setLabel(gettext('Details'));
                button.addEventListener('click', this.painter.catalogue_view.createUserCommand('showDetails', this.offering));
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
        var i, elements = element.querySelectorAll(selector);

        if (required && elements.length < 1) {
            throw new Error();
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

    Wirecloud.FiWare.ui.OfferingPainter = OfferingPainter;
})();
