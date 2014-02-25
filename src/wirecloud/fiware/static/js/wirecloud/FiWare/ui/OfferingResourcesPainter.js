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

/*global gettext, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var OfferingResourcePainter = function OfferingResourcePainter() {
    };

    var MAC_MIMETYPES = ['application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'];

    var is_mac_mimetype = function is_mac_mimetype(mimetype) {
        return MAC_MIMETYPES.indexOf(mimetype) !== -1;
    };

    var install = function install(url, catalogue, store, button) {
        var layoutManager, local_catalogue_view, market_id;

        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName.local;
        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Importing resource into local repository"), 3);
        layoutManager.logSubTask(gettext('Uploading resource'));

        if (catalogue.market_user !== 'public') {
            market_id = catalogue.market_user + '/' + catalogue.market_name;
        } else {
            market_id = catalogue.market_name;
        }

        local_catalogue_view.catalogue.addResourceFromURL(url, {
            packaged: true,
            forceCreate: true,
            market_info: {
                name: market_id,
                store: store
            },
            onSuccess: function () {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Resource installed successfully'));
                LayoutManagerFactory.getInstance().logStep('');
                button.addClassName('btn-success');
                button.setLabel(gettext('Installed'));

                local_catalogue_view.refresh_search_results();
            },
            onFailure: function (msg) {
                button.enable();
                Wirecloud.GlobalLogManager.log(msg);
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    var onClick = function onClick(url, catalogue, store, button) {
        button.disable();
        install(url, catalogue, store, button);
    };

    OfferingResourcePainter.prototype.paint = function paint(offering, dom_element, catalogue) {
        var i, resource, wrapper, li, button;

        wrapper = document.createElement('ul');
        wrapper.className = 'offering_resource_list';
        dom_element.appendChild(wrapper);

        for (i = 0; i < offering.resources.length; i += 1) {
            resource = offering.resources[i];

            li = document.createElement('li');
            li.className = 'offering_resource';
            li.textContent = resource.name;
            if ('url' in resource) {
                if (is_mac_mimetype(resource.content_type)) {

                    if (Wirecloud.LocalCatalogue.resourceExistsId(resource.id)) {
                        button = new StyledElements.StyledButton({'class': 'btn-success', text: gettext('Installed')});
                        button.disable();
                    } else {
                        button = new StyledElements.StyledButton({text: gettext('Install')});
                        button.addEventListener('click', onClick.bind(null, resource.url, catalogue, offering.store));
                    }

                } else {

                    button = new StyledElements.StyledButton({'class': 'btn-info', text: gettext('Download')});

                }
                button.insertInto(li);
            }
            wrapper.appendChild(li);
        }
    };

    Wirecloud.FiWare.ui.OfferingResourcePainter = OfferingResourcePainter;

})();
