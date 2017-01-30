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

/* globals Wirecloud */


(function (utils) {

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

        return Wirecloud.LocalCatalogue.addComponent({
            url: resource.url,
            forceCreate: true,
            market_info: {
                name: market_id,
                store: this.store
            }
        });
    };

    var installed = function installed() {
        var i, resource;

        if (this.wirecloudresources.length === 0) {
            return false;
        }

        for (i = 0; i < this.wirecloudresources.length; i++) {
            resource = this.wirecloudresources[i];
            if (!Wirecloud.LocalCatalogue.resourceExistsId(resource.id)) {
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
            'wirecloudresources': {value: []},
            'publicationdate': {value: publicationdate},
            'installed': {get: installed}
        });

        if (this.open === true || ['purchased', 'rated'].indexOf(this.state) !== -1) {
            for (var i = 0; i < this.resources.length; i += 1) {
                var resource = this.resources[i];
                resource.offering = this;
                if (is_mac_mimetype(resource.content_type)) {
                    resource.type = MAC_TYPES[MAC_MIMETYPES.indexOf(resource.content_type)];
                    try {
                        var parts = resource.id.split('/');
                        resource.uri = resource.id;
                        resource.wirecloud = {
                            uri: resource.id,
                            vendor: parts[0],
                            name: parts[1],
                            title: resource.name,
                            type: resource.type,
                            group_id: parts[0] + '/' + parts[1],
                            version: new Wirecloud.Version(parts[2])
                        };
                        resource.install = installResource.bind(this, resource);
                        this.wirecloudresources.push(resource);
                    } catch (error) {
                        delete resource.uri;
                        delete resource.wirecloud;
                    }
                }
            }
        }

        Object.freeze(this.resources);
        Object.freeze(this.wirecloudresources);
    };

    Offering.prototype.install = function install(options) {
        if (options == null) {
            options = {};
        }

        var title = utils.gettext("Importing offering components into local repository");
        if (this.wirecloudresources.length > 0) {
            var subtasks = this.wirecloudresources.map((component) => {
                var subtask = component.install();
                subtask.then(options.onResourceSuccess, options.onResourceFailure);
                return subtask;
            });

            return new Wirecloud.Task(title, subtasks);
        } else {
            return new Wirecloud.Task(title, (resolve) => {resolve();});
        }

    };

    Wirecloud.FiWare.Offering = Offering;

})(Wirecloud.Utils);
