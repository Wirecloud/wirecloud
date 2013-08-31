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
/*global $ */
"use strict";

function FiWareCatalogueResource(resourceJSON_) {

    ///////////////////////
    // PRIVATE VARIABLES
    ///////////////////////
    var vendor = resourceJSON_.vendor,
        name = resourceJSON_.name,
		store = resourceJSON_.store,
		market_name = resourceJSON_.marketName,
		parts = resourceJSON_.parts,
		type = resourceJSON_.type,
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

		if (type === 'mashup'){
			result = true;
		}
		return result;
	};
    this.getVendor = function () {
        return vendor;
    };

    this.getName = function () {
        return name;
    };

	this.getType = function() {
		return type;
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

	this.getPricing = function() {
		return resourceJSON_.pricing;
	};

	this.getSla = function() {
		return resourceJSON_.sla;
	};
	
	this.getLegal = function() {
		return resourceJSON_.legal;
	};

	this.getMarketName = function() {
		return market_name;
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

    Object.defineProperties(this, {
        'abstract': {value: resourceJSON_.shortDescription},
        'description': {value: resourceJSON_.longDescription},
        'rating': {value: resourceJSON_.rating},
        'state': {value: resourceJSON_.state},
        'store': {value: store},
        'usdl_url': {value: resourceJSON_.usdl_url},
        'resources': {value: resourceJSON_.resources},
        'version': {value: new Wirecloud.Version(resourceJSON_.version, 'catalogue')},
        'publicationdate': {value: new Date(resourceJSON_.publicationdate)}
    });

    //////////////
    // SETTERS
    //////////////

    this.setExtraData = function (extra_data_) {
        extra_data = extra_data_;
    };
}
