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

    function FiWareCatalogueResource(resourceJSON_) {

        //////////////////////////
        // GETTERS
        /////////////////////////

        this.getParts = function getParts() {
            return resourceJSON_.parts;
        };

        this.getId = function getId() {
            return resourceJSON_.id;
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
            'owner': {value: resourceJSON_.vendor},
            'name': {value: resourceJSON_.name},
            'version': {value: resourceJSON_.version},
            'type': {value: resourceJSON_.type},
            'image': {value: resourceJSON_.uriImage},
            'abstract': {value: resourceJSON_.shortDescription},
            'description': {value: resourceJSON_.longDescription},
            'pricing': {value: resourceJSON_.pricing},
            'rating': {value: resourceJSON_.rating},
            'sla': {value: resourceJSON_.sla},
            'state': {value: resourceJSON_.state},
            'store': {value: resourceJSON_.store},
            'usdl_url': {value: resourceJSON_.usdl_url},
            'resources': {value: resourceJSON_.resources},
            'publicationdate': {value: publicationdate}
        });

        if (['purchased', 'rated'].indexOf(this.state) != -1) {
            for (var i = 0; i < this.resources.length; i += 1) {
                var resource = this.resources[i];
                if (is_mac_mimetype(resource.content_type)) {
                    try {
                        var parts = resource.id.split('/');
                        resource.version = new Wirecloud.Version(parts[2], 'catalogue');
                        resource.vendor = parts[0];
                        resource.name = parts[1];
                        resource.uri = resource.id;
                        resource.type = MAC_TYPES[MAC_MIMETYPES.indexOf(resource.content_type)];
                    } catch (error) {
                        delete resource.version;
                        delete resource.vendor;
                        delete resource.name;
                        delete resource.type;
                    }
                }
            }
        }
    }

    window.FiWareCatalogueResource = FiWareCatalogueResource;

})();
