/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */

(function () {

    "use strict";

    var MAC_MIMETYPES = ['application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'];
    var MAC_TYPES = ['widget', 'operator', 'mashup'];

    var is_mac_mimetype = function is_mac_mimetype(mimetype) {
        return MAC_MIMETYPES.indexOf(mimetype) !== -1;
    };

    var getURI = function getURI() {
        return this.id;
    };

    function FiWareCatalogueResource(resourceJSON_) {

        ///////////////////////
        // PRIVATE VARIABLES
        ///////////////////////
        var vendor = resourceJSON_.vendor,
            name = resourceJSON_.name,
            store = resourceJSON_.store,
            parts = resourceJSON_.parts,
            extra_data = null,
        ///////////////////////////
        // CONSTRUCTOR VARIABLES
        ///////////////////////////
            i = 0;

        //////////////////////////
        // GETTERS
        /////////////////////////

        this.isMashup = function(){
            var result = false;

            if (this.type === 'mashup'){
                result = true;
            }
            return result;
        };

        this.getCreator = function() {
            return "";
        };

        this.getParts = function() {
            return parts;
        };

        this.getLastVersion = function () {
            return allVersions[0];
        };

        this.getId = function () {
            return resourceJSON_.id;
        };

        this.getDisplayName = function getDisplayName() {
            return resourceJSON_.displayName;
        };

        this.getUriImage = function () {
            return resourceJSON_.uriImage;
        };

        this.getUriTemplate = function () {
            return resourceJSON_.uriTemplate;
        };

        this.getPage = function () {
            return resourceJSON_.page;
        };

        this.getCreated = function () {
            return resourceJSON_.created;
        };

        this.getLegal = function() {
            return resourceJSON_.legal;
        };

        this.getExtraData = function () {
            return extra_data;
        };

        this.getTags = function () {
            return [];
        };

        this.getURI = function () {
            return [vendor, name, version.text].join('/');
        };

        this.isAllow = function isAllow(action) {
            return false;
        };

        this.getVersion = function getVersion() {
            return this.version;
        };

        var publicationdate = null;
        if (resourceJSON_.publicationdate != null && resourceJSON_.publicationdate != '') {
            publicationdate = new Date(resourceJSON_.publicationdate);
        }

        Object.defineProperties(this, {
            'owner': {value: resourceJSON_.vendor},
            'name': {value: resourceJSON_.name},
            'version': {value: new Wirecloud.Version(resourceJSON_.version, 'catalogue')},
            'type': {value: resourceJSON_.type},
            'abstract': {value: resourceJSON_.shortDescription},
            'description': {value: resourceJSON_.longDescription},
            'pricing': {value: resourceJSON_.pricing},
            'rating': {value: resourceJSON_.rating},
            'sla': {value: resourceJSON_.sla},
            'state': {value: resourceJSON_.state},
            'store': {value: store},
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
                        resource.type = MAC_TYPES[MAC_MIMETYPES.indexOf(resource.content_type)];
                        resource.getURI = getURI;
                    } catch (error) {}
                }
            }
        }

        //////////////
        // SETTERS
        //////////////

        this.setExtraData = function (extra_data_) {
            extra_data = extra_data_;
        };
    }

    window.FiWareCatalogueResource = FiWareCatalogueResource;

})();
