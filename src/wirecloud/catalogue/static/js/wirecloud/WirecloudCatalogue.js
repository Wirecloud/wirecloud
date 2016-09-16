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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var WirecloudCatalogue, _onSearchSuccess, _onSearchFailure, deleteSuccessCallback, deleteErrorCallback;

    _onSearchSuccess = function _onSearchSuccess(response) {
        var i, data, raw_data;

        raw_data = JSON.parse(response.responseText);
        data = {
            'resources': raw_data.results,
            'current_page': parseInt(raw_data.pagenum, 10),
            'total_count': parseInt(raw_data.total, 10)
        };
        if ('corrected_q' in raw_data) {
            data.corrected_query = raw_data.corrected_q;
        }

        this.onSuccess(data.resources, data);
    };

    _onSearchFailure = function _onSearchFailure(reponse) {
        utils.callCallback(this.onFailure);
    };

    deleteSuccessCallback = function deleteSuccessCallback(response) {
        var result;

        this.request_task.update(100 / 3);

        if (typeof this.onSuccess === 'function') {
            result = JSON.parse(response.responseText);
            this.onSuccess(result, this.request_task);
        }
    };

    deleteErrorCallback = function deleteErrorCallback(response, e) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error deleting resource: %(errorMsg)s."), response, e);

        this.request_task.fail(msg);
        utils.callCallback(this.onFailure, msg);
    };

    /*************************************************************************/
    WirecloudCatalogue = function WirecloudCatalogue(options) {

        Object.defineProperty(this, 'name', {'value': options.name});
        Object.defineProperty(this, 'permissions', {'value': options.permissions});

        if (options.url == null) {
            options.url = Wirecloud.URLs.LOCAL_REPOSITORY;
        } else if (options.url[options.url.length - 1] !== '/') {
            options.url += '/';
        }

        Object.defineProperties(this, {
            'RESOURCE_CHANGELOG_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s/changelog')},
            'RESOURCE_USERGUIDE_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s/userguide')},
            'RESOURCE_COLLECTION': {value: options.url + 'catalogue/resources'},
            'RESOURCE_UNVERSIONED_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s')},
            'RESOURCE_ENTRY': {value: new utils.Template(options.url + 'catalogue/resource/%(vendor)s/%(name)s/%(version)s')},
        });
    };

    WirecloudCatalogue.prototype.isAllow = function isAllow(action) {
        if (action in this.permissions) {
            return this.permissions[action];
        } else {
            return false;
        }
    };

    WirecloudCatalogue.prototype.search = function search(options) {
        var params, url;

        if (options == null) {
            throw new TypeError();
        }

        params = {};

        if (options.search_criteria != null && options.search_criteria !== '') {
            params.q = options.search_criteria;
        }

        if (options.scope != null && options.scope !== '' && options.scope !== 'all') {
            if (['widget', 'operator', 'mashup'].indexOf(options.scope) === -1) {
                throw new TypeError('invalid scope value');
            }
            params.scope = options.scope;
        }

        if (options.order_by != null && options.order_by !== '') {
            params.orderby = options.order_by;
        }

        if (options.maxresults != null) {
            if (typeof options.maxresults !== 'number' || options.maxresults < 20) {
                throw new TypeError('invalid maxresults value');
            }
            params.maxresults = options.maxresults;
        }

        if (options.pagenum != null) {
            if (typeof options.pagenum !== 'number' || options.pagenum < 0) {
                throw new TypeError('invalid pagenum value');
            }
            params.pagenum = options.pagenum;
        }

        return Wirecloud.io.makeRequest(this.RESOURCE_COLLECTION, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'},
            parameters: params,
            onSuccess: _onSearchSuccess.bind(options),
            onFailure: _onSearchFailure.bind(options),
            onComplete: options.onComplete
        });
    };

    WirecloudCatalogue.prototype.getResourceDetails = function getResourceDetails(vendor, name, options) {

        if (options == null) {
            options = {};
        }

        var url = this.RESOURCE_UNVERSIONED_ENTRY.evaluate({vendor: vendor, name: name});
        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            onSuccess: function (response) {
                var resource_details = new Wirecloud.WirecloudCatalogue.ResourceDetails(JSON.parse(response.responseText), this);
                try {
                    options.onSuccess(resource_details);
                } catch (e) {}
            }.bind(this),
            onFailure: options.onFailure,
            onComplete: options.onComplete
        });
    };

    WirecloudCatalogue.prototype.is_purchased = function is_purchased() {
        return true;
    };

    WirecloudCatalogue.prototype.addPackagedResource = function addPackagedResource(file, options) {
        var url, parameters, requestHeaders, task, onUploadProgress;

        requestHeaders = {
            'Accept': 'application/json'
        };

        if (typeof options != 'object') {
            options = {};
        }

        if (this.name === 'local') {
            url = Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION;
        } else {
            url = this.RESOURCE_COLLECTION;


            if (this.accesstoken != null) {
                requestHeaders['Authorization'] = 'Bearer ' + this.accesstoken;
            }
        }

        parameters = {
            'install_embedded_resources': 'true'
        };

        if (options.force_create === true) {
            parameters.force_create = "true";
        }

        if (options.monitor) {
            task = options.monitor.nextSubtask(utils.gettext('Uploading packaged resource'));
            onUploadProgress = function (event) {
                var progress = Math.round(event.loaded * 100 / event.total);
                if (progress !== 100) {
                    task.update(progress);
                }
            };
        }

        Wirecloud.io.makeRequest(url, {
            method: 'POST',
            contentType: 'application/octet-stream',
            requestHeaders: requestHeaders,
            postBody: file,
            parameters: parameters,
            onSuccess: function (transport) {
                var response_data = JSON.parse(transport.responseText);
                utils.callCallback(options.onSuccess, response_data.resource_details, response_data.extra_resources);
            }.bind(this),
            onFailure: function (response) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error uploading packaged resource: %(errorMsg)s."), response);
                utils.callCallback(options.onFailure, Wirecloud.GlobalLogManager.parseErrorResponse(response));
            },
            onComplete: function () {
                task.finish();
                utils.callCallback(options.onComplete);
            },
            onUploadProgress: onUploadProgress
        });
    };

    WirecloudCatalogue.prototype.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(this.RESOURCE_COLLECTION, {
            method: 'POST',
            requestHeaders: {'Accept': 'application/json'},
            parameters: {'url': url, force_create: !!options.forceCreate},
            onSuccess: function () {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error adding resource from URL: %(errorMsg)s."), transport);

                if (typeof options.onFailure === 'function') {
                    options.onFailure(msg);
                }
            },
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    WirecloudCatalogue.prototype.deleteResource = function deleteResource(resource, options) {
        var url, msg;

        options = utils.merge({
            allversions: false
        }, options);

        if (options.allversions) {
            url = this.RESOURCE_UNVERSIONED_ENTRY.evaluate({
                vendor: resource.vendor,
                name: resource.name
            });
            msg = utils.interpolate(utils.gettext("Deleting all versions of %(title)s (%(group_id)s)"), resource);
        } else {
            url = this.RESOURCE_ENTRY.evaluate({
                vendor: resource.vendor,
                name: resource.name,
                version: resource.version.text
            });
            msg = utils.interpolate(utils.gettext("Deleting %(title)s (%(uri)s)"), resource);
        }

        options.monitor = Wirecloud.UserInterfaceManager.createTask(msg, 1);
        options.request_task = options.monitor.nextSubtask('Sending request to the server');

        // Send request to delete de widget
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: deleteSuccessCallback.bind(options),
            onFailure: deleteErrorCallback.bind(options),
            onException: deleteErrorCallback.bind(options)
        });
    };

    Wirecloud.WirecloudCatalogue = WirecloudCatalogue;

})(Wirecloud.Utils);
