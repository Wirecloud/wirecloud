/*
 *     Copyright 2013-2017 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    /**
     * Specific class for publish windows
     */
    var PublishResourceWindowMenu = function PublishResourceWindowMenu(resource) {

        this.resource = resource;

        var fields = this._loadAvailableMarkets();
        Wirecloud.ui.FormWindowMenu.call(this, fields, utils.gettext('Upload resource'), 'publish_resource', {legend: false});
    };
    PublishResourceWindowMenu.prototype = new Wirecloud.ui.FormWindowMenu();

    PublishResourceWindowMenu.prototype._loadAvailableMarkets = function _loadAvailableMarkets() {
        // Take available marketplaces from the instance of marketplace view
        var views = Wirecloud.UserInterfaceManager.views.marketplace.viewsByName;
        var key, endpoints, secondInput, buttons = [];

        for (key in views) {
            endpoints = views[key].getPublishEndpoints();
            if (endpoints != null) {
                if (endpoints.length > 0) {
                    endpoints.forEach(assign_endpoint_value, key);
                    secondInput = new StyledElements.Select({initialEntries: endpoints});
                } else {
                    secondInput = null;
                }
                buttons.push({'label': key, 'value': key, 'secondInput': secondInput});
            }
        }
        return [
            {
                'name': 'marketplaces',
                'type': 'buttons',
                'label': utils.gettext('Upload to'),
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

        return Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(data)
        }).then((response) => {
            if ([204, 401, 403, 500].indexOf(response.status) === -1) {
                return Promise.reject(utils.gettext("Unexpected response from server"));
            } else if ([401, 403, 500].indexOf(response.status) !== -1) {
                return Promise.reject(Wirecloud.GlobalLogManager.parseErrorResponse(response));
            }
            return Promise.resolve();
        });
    };

    var assign_endpoint_value = function assign_endpoint_value(endpoint) {
        endpoint.value = this + '#' + endpoint.value;
    };

    Wirecloud.ui.PublishResourceWindowMenu = PublishResourceWindowMenu;

})(Wirecloud.Utils);
