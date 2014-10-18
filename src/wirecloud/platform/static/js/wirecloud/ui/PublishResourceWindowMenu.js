/*
 *     Copyright 2013 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, LayoutManagerFactory, Wirecloud*/

(function () {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishResourceWindowMenu = function PublishResourceWindowMenu(resource) {

        this.resource = resource;

        var fields = this._loadAvailableMarkets();
        Wirecloud.ui.FormWindowMenu.call(this, fields, gettext('Upload resource'), 'publish_resource', {legend: false});
    };
    PublishResourceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    PublishResourceWindowMenu.prototype._loadAvailableMarkets = function _loadAvailableMarkets() {
        // Take available marketplaces from the instance of marketplace view
        var views = LayoutManagerFactory.getInstance().viewsByName.marketplace.viewsByName;
        var key, endpoints, secondInput, buttons = [];

        for (key in views) {
            endpoints = views[key].getPublishEndpoints();
            if (endpoints != null && endpoints.length > 0) {
                endpoints.forEach(function (endpoint) { endpoint.value = key + '#' + endpoint.value; });
                secondInput = new StyledElements.StyledSelect({initialEntries: endpoints});
            } else {
                secondInput = null;
            }
            buttons.push({'label': key, 'value': key, 'secondInput': secondInput});
        }
        return [
            {
                'name': 'marketplaces',
                'type': 'buttons',
                'label': 'Upload to',
                'kind': 'checkbox',
                'buttons': buttons
            }
        ];
    };

    PublishResourceWindowMenu.prototype.show = function show(parentWindow) {
        Wirecloud.ui.FormWindowMenu.prototype.show.call(this, parentWindow);
    };

    PublishResourceWindowMenu.prototype.setFocus = function setFocus() {
        this.form.cancelButton.focus();
    };

    PublishResourceWindowMenu.prototype.executeOperation = function executeOperation(data) {
        var url = Wirecloud.URLs.PUBLISH_ON_OTHER_MARKETPLACE;

        data.marketplaces = data.marketplaces.map(function (endpoint) {
            var parts = endpoint.split('#', 2);
            var result = {
                'market': parts[0]
            };
            if (parts.length === 2) {
                result.store = parts[1];
            }
            return result;
        });
        data.resource = this.resource.uri;

        var layoutManager;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Publishing resource"), 3);
        layoutManager.logSubTask(gettext('Publishing resource'));

        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(data),
            onSuccess: function () {
                layoutManager.logSubTask(gettext('Resource published successfully'));
                layoutManager.getInstance().logStep('');
            },
            onFailure: function (response) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(gettext("Error publishing resource: %(errorMsg)s."), response, null);
                var dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);

                // TODO
                dialog.msgElement.textContent = msg;
                var response_data = JSON.parse(response.responseText);
                if ('details' in response_data) {
                    var expander = new StyledElements.Expander({title: gettext('Details')});
                    expander.insertInto(dialog.msgElement);
                    for (var key in response_data.details) {
                        expander.appendChild(new StyledElements.Fragment('<p><b>' + key + '</b>' + response_data.details[key] + '</p>'));
                    }
                }
                // END TODO

                dialog.show();
            },
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Wirecloud.ui.PublishResourceWindowMenu = PublishResourceWindowMenu;
})();
