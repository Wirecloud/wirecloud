/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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
/*global $, GadgetVersion */
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
        currentVersion = null,
        allVersions = [],
        data_by_version = {},
        extra_data = null,
    ///////////////////////////
    // CONSTRUCTOR VARIABLES
    ///////////////////////////
        i = 0,
        versions,
        version_data;

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

	this.getParts = function() {
		return parts;
	};

    this.getVersion = function () {
        return currentVersion.version;
    };

    this.getLastVersion = function () {
        return allVersions[0];
    };

    this.getId = function () {
        return currentVersion.id;
    };

    this.getAllVersions = function () {
        return allVersions;
    };

    this.getShortDescription = function () {
        return currentVersion.shortDescription;
    };

	this.getLongDescription = function () {
        return currentVersion.longDescription;
    };

    this.getUriImage = function () {
        return currentVersion.uriImage;
    };

    this.getUriTemplate = function () {
        return currentVersion.uriTemplate;
    };

	this.getPage = function () {
        return currentVersion.page;
    };

	this.getCreated = function () {
        return currentVersion.created;
    };

	this.getModified = function () {
        return currentVersion.modified;
    };

	this.getPricing = function() {
		return currentVersion.pricing;
	};

	this.getSla = function() {
		return currentVersion.sla;
	};
	
	this.getLegal = function() {
		return currentVersion.legal;
	};

	this.getStore = function() {
		return store;
	};

	this.getMarketName = function() {
		return market_name;
	};

    this.getExtraData = function () {
        return extra_data;
    };

   this.getPopularity = function () {
       return 0;
   }

    //////////////
    // SETTERS
    //////////////

    this.setExtraData = function (extra_data_) {
        extra_data = extra_data_;
    };

    /////////////////////////////
    // CONVENIENCE FUNCTIONS
    /////////////////////////////
    this.changeVersion = function (version) {
        if (version instanceof GadgetVersion) {
            version = version.text;
        }

        if (version in data_by_version) {
            currentVersion = data_by_version[version];
        } else {
            currentVersion = data_by_version[allVersions[0].text];
        }
    };

    ////////////////////////
    // CONSTRUCTOR
    ////////////////////////
    versions = resourceJSON_.versions;

    /*function flat_friendcode(x) {
        return x.friendcode;
    }*/

    for (i = 0; i < versions.length; i += 1) {
        version_data = versions[i];

        version_data.version = new GadgetVersion(version_data.version, 'catalogue');
        /*version_data.events = version_data.events.map(flat_friendcode);
        version_data.slots = version_data.slots.map(flat_friendcode);*/

        allVersions.push(version_data.version);
        data_by_version[version_data.version.text] = version_data;
    }
    allVersions = allVersions.sort(function (version1, version2) {
        return -version1.compareTo(version2);
    });
    this.changeVersion(allVersions[0]);
}
