/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
*/

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $, GadgetVersion */
"use strict";

function ResourceState(resourceJSON_) {

    ///////////////////////
    // PRIVATE VARIABLES
    ///////////////////////
    var vendor = resourceJSON_.vendor,
        name = resourceJSON_.name,
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
    this.getCreator = function () {
        return currentVersion.author;
    };

    this.getVendor = function () {
        return vendor;
    };

    this.getName = function () {
        return name;
    };

    this.getDisplayName = function () {
        return currentVersion.displayName;
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

    this.getDescription = function () {
        return currentVersion.description;
    };

    this.getUriImage = function () {
        return currentVersion.uriImage;
    };

    this.getUriTemplate = function () {
        return currentVersion.uriTemplate;
    };

    this.getUriWiki = function () {
        return currentVersion.uriWiki;
    };

    this.isMashup = function () {
        return type === 'mashup';
    };

    this.isGadget = function () {
        return type === 'gadget';
    };

    this.getAddedBy = function () {
        return currentVersion.addedBy;
    };

    this.getTags = function () {
        return currentVersion.tags;
    };

    this.getSlots = function () {
        return currentVersion.slots;
    };

    this.getEvents = function () {
        return currentVersion.events;
    };

    this.getVotes = function () {
        return currentVersion.votes.votes_number;
    };

    this.getUserVote = function () {
        return currentVersion.votes.user_vote;
    };

    this.getPopularity = function () {
        return currentVersion.votes.popularity;
    };

    this.getCapabilities = function () {
        return currentVersion.capabilities;
    };

    this.getExtraData = function () {
        return extra_data;
    };

    this.getIeCompatible = function () {
        return currentVersion.ieCompatible;
    };

    //////////////
    // SETTERS
    //////////////

    this.setExtraData = function (extra_data_) {
        extra_data = extra_data_;
    };

    this.setTags = function (tagsJSON_) {
        currentVersion.tags = tagsJSON_;
    };

    this.setVotes = function (voteDataJSON_) {
        currentVersion.votes = voteDataJSON_;
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

    function flat_friendcode(x) {
        return x.friendcode;
    }

    for (i = 0; i < versions.length; i += 1) {
        version_data = versions[i];

        version_data.version = new GadgetVersion(version_data.version, 'catalogue');
        version_data.events = version_data.events.map(flat_friendcode);
        version_data.slots = version_data.slots.map(flat_friendcode);

        allVersions.push(version_data.version);
        data_by_version[version_data.version.text] = version_data;
    }
    allVersions = allVersions.sort(function (version1, version2) {
        return -version1.compareTo(version2);
    });
    this.changeVersion(allVersions[0]);
}
