/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var onInstallClick = function onInstallClick(resource, catalogue, offering_entry, button) {
        var layoutManager, local_catalogue_view, url;

        button.disable();

        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Importing resource into local repository"), 3);
        layoutManager.logSubTask(gettext('Uploading resource'));

        resource.install({
            onSuccess: function () {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Resource installed successfully'));
                LayoutManagerFactory.getInstance().logStep('');

                offering_entry.update_buttons();

                catalogue.viewsByName.search.mark_outdated();
                local_catalogue_view.viewsByName.search.mark_outdated();
            },
            onFailure: function (msg) {
                Wirecloud.GlobalLogManager.log(msg);
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            },
            onComplete: function () {
                button.enable();
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    var onUninstallClick = function onUninstallClick(resource, catalogue, offering_entry, button) {
        var layoutManager, local_catalogue_view, url;

        button.disable();

        local_catalogue_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Uninstalling resource from local repository"), 3);
        layoutManager.logSubTask(gettext('Uninstalling resource'));

        local_catalogue_view.catalogue.uninstallResource(resource, {
            onSuccess: function () {
                LayoutManagerFactory.getInstance().logSubTask(gettext('Resource uninstalled successfully'));
                LayoutManagerFactory.getInstance().logStep('');

                offering_entry.update_buttons();

                catalogue.viewsByName.search.mark_outdated();
                local_catalogue_view.viewsByName.search.mark_outdated();
            },
            onFailure: function (msg) {
                Wirecloud.GlobalLogManager.log(msg);
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            },
            onComplete: function () {
                button.enable();
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    OfferingResourcePainter.prototype.paint = function paint(offering, dom_element, catalogue, offering_entry) {
        var i, resource, wrapper, li, btn_group, button, details_button;

        wrapper = document.createElement('ul');
        wrapper.className = 'offering_resource_list';
        dom_element.appendChild(wrapper);

        offering_entry.update_resource_buttons = function update_resource_buttons() {
            for (var key in this.resource_buttons) {
                var button_info = this.resource_buttons[key];
                var button = button_info.button;
                var resource = button_info.resource;

                button.clearClassName().clearEventListeners('click');
                if (Wirecloud.LocalCatalogue.resourceExistsId(resource.id)) {
                    button.addClassName('btn-danger').setLabel(gettext('Uninstall'));
                    button.addEventListener('click', onUninstallClick.bind(null, resource, catalogue, offering_entry));
                    button_info.details_button.enable();
                } else {
                    button.addClassName('btn-primary').setLabel(gettext('Install'));
                    button.addEventListener('click', onInstallClick.bind(null, resource, catalogue, offering_entry));
                    button_info.details_button.disable();
                }
            }
        };

        for (i = 0; i < offering.resources.length; i += 1) {
            resource = offering.resources[i];

            li = document.createElement('li');
            li.className = 'offering_resource';
            li.textContent = resource.name;
            if ('url' in resource) {
                btn_group = document.createElement('div');
                btn_group.className = 'btn-group';
                li.appendChild(btn_group);

                if ('type' in resource) {

                    button = new StyledElements.StyledButton({text: ''});
                    button.insertInto(btn_group);
                    details_button = new StyledElements.StyledButton({text: gettext('Details')});
                    details_button.addEventListener('click', function () {
                        var myresources_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
                        myresources_view.createUserCommand('showDetails', this, {version: this.version})();
                    }.bind(resource));
                    details_button.insertInto(btn_group);
                    offering_entry.resource_buttons[resource.id] = {resource: resource, button: button, details_button: details_button};

                } else {
                    button = new StyledElements.StyledButton({'class': 'btn-info', text: gettext('Download')});
                    button.insertInto(btn_group);
                }
            }
            wrapper.appendChild(li);
        }
    };

    Wirecloud.FiWare.ui.OfferingResourcePainter = OfferingResourcePainter;

})();
