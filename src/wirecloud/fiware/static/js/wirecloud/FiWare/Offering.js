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

/*global Wirecloud*/

(function () {

    "use strict";

    var MAC_MIMETYPES = ['application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'];
    var MAC_TYPES = ['widget', 'operator', 'mashup'];

    var is_mac_mimetype = function is_mac_mimetype(mimetype) {
        return MAC_MIMETYPES.indexOf(mimetype) !== -1;
    };

    var installResource = function installResource(resource, options) {
        var market_id;

        if (options == null) {
            options = {};
        }

        if (this.catalogue.market_user !== 'public') {
            market_id = this.catalogue.market_user + '/' + this.catalogue.market_name;
        } else {
            market_id = this.catalogue.market_name;
        }

        Wirecloud.LocalCatalogue.addResourceFromURL(resource.url, {
            forceCreate: true,
            monitor: options.monitor,
            market_info: {
                name: market_id,
                store: this.store
            },
            onSuccess: options.onSuccess,
            onFailure: options.onFailure,
            onComplete: options.onComplete
        });
    };

    var installed = function installed() {
        var i, resource;

        for (i = 0; i < this.resources.length; i++) {
            resource = this.resources[i];
            if ('type' in resource && !Wirecloud.LocalCatalogue.resourceExistsId(resource.id)) {
                return false;
            }
        }
        return true;
    };

    var Offering = function Offering(resourceJSON_, catalogue) {

        //////////////////////////
        // GETTERS
        /////////////////////////

        this.getParts = function getParts() {
            return resourceJSON_.parts;
        };

        this.getDisplayName = function getDisplayName() {
            return resourceJSON_.displayName;
        };

        this.getPage = function getPage() {
            return resourceJSON_.page;
        };

        this.getLegal = function getLegal() {
            return resourceJSON_.legal;
        };

        this.isAllow = function isAllow(action) {
            return false;
        };

        var publicationdate = null;
        if (resourceJSON_.publicationdate != null && resourceJSON_.publicationdate !== '') {
            publicationdate = new Date(resourceJSON_.publicationdate);
        }

        Object.defineProperties(this, {
            'catalogue': {value: catalogue},
            'id': {value: resourceJSON_.id},
            'owner': {value: resourceJSON_.vendor},
            'name': {value: resourceJSON_.name},
            'title': {value: resourceJSON_.name},
            'version': {value: resourceJSON_.version},
            'type': {value: resourceJSON_.type},
            'image': {value: resourceJSON_.uriImage},
            'abstract': {value: resourceJSON_.shortDescription},
            'description': {value: resourceJSON_.longDescription},
            'pricing': {value: resourceJSON_.pricing},
            'rating': {value: resourceJSON_.rating},
            'sla': {value: resourceJSON_.sla},
            'open': {value: !!resourceJSON_.open},
            'state': {value: resourceJSON_.state},
            'store': {value: resourceJSON_.store},
            'usdl_url': {value: resourceJSON_.usdl_url},
            'resources': {value: resourceJSON_.resources},
            'publicationdate': {value: publicationdate},
            'installed': {get: installed}
        });

        if (this.open === true || ['purchased', 'rated'].indexOf(this.state) != -1) {
            for (var i = 0; i < this.resources.length; i += 1) {
                var resource = this.resources[i];
                resource.offering = this;
                if (is_mac_mimetype(resource.content_type)) {
                    try {
                        var parts = resource.id.split('/');
                        resource.version = new Wirecloud.Version(parts[2], 'catalogue');
                        resource.vendor = parts[0];
                        resource.name = parts[1];
                        resource.uri = resource.id;
                        resource.type = MAC_TYPES[MAC_MIMETYPES.indexOf(resource.content_type)];
                        resource.install = installResource.bind(this, resource);
                    } catch (error) {
                        delete resource.version;
                        delete resource.vendor;
                        delete resource.name;
                        delete resource.type;
                    }
                }
            }
        }
    };

    Offering.prototype.install = function install(options) {
        var i, subtask, onComplete = null, onSuccess, count = this.resources.length, msg;

        if (options == null) {
            options = {};
        }

        if (typeof options.onComplete === 'function') {
            onComplete = function () {
                if (--count === 0) {
                    try {
                        options.onComplete(options);
                    } catch (e) {}
                }
            };
        }

        for (i = 0; i < this.resources.length; i++) {
            if ('type' in this.resources[i]) {
                if (options.monitor) {
                    msg = gettext('Installing "%(resource_name)s" from the offering');
                    subtask = options.monitor.nextSubtask(Wirecloud.Utils.interpolate(msg, {resource_name: this.resources[i].name}, true));
                }

                if (typeof options.onResourceSuccess === 'function') {
                    onSuccess = options.onResourceSuccess.bind(null, this.resources[i]);
                }

                this.resources[i].install({
                    monitor: subtask,
                    onSuccess: onSuccess,
                    onComplete: onComplete
                });
            } else {
                count -= 1;
            }
        }
    };

    Wirecloud.FiWare.Offering = Offering;

})();
