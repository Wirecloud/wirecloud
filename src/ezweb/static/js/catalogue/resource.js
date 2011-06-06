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

function ResourceState(resourceJSON_) {

    ///////////////////////
    // PRIVATE VARIABLES
    ///////////////////////
    var versions = resourceJSON_;
    var currentVersion = null;
    var allVersions = [];
    var data_by_version = {};

    //////////////////////////
    // GETTERS
    /////////////////////////
    this.getCreator = function() {
        return currentVersion.creator;
    }

    this.getVendor = function() {
        return currentVersion.vendor;
    }

    this.getName = function() {
        return currentVersion.name;
    }

    this.getDisplayName = function() {
        return currentVersion.displayName;
    }

    this.getVersion = function() {
        return currentVersion.version;
    }

    this.getLastVersion = function() {
        return allVersions[0];
    }

    this.getId = function() {
        return currentVersion.id;
    }

    this.getAllVersions = function() {
        return allVersions;
    }

    this.getDescription = function() {
        return currentVersion.description;
    }

    this.getUriImage = function() {
        return currentVersion.uriImage;
    }

    this.getUriTemplate = function() {
        return currentVersion.uriTemplate;
    }

    this.getUriWiki = function() {
        return currentVersion.uriWiki;
    }

    this.getMashupId = function() {
        return currentVersion.mashupId;
    }

    this.isMashup = function() {
        return currentVersion.mashupId != null;
    }

    this.isGadget = function() {
        return currentVersion.mashupId == null;
    }

    this.getAddedBy = function() {
        return currentVersion.addedBy;
    }

    this.getTags = function() {
        return currentVersion.tags;
    }

    this.getSlots = function() {
        return currentVersion.slots;
    }

    this.getEvents = function() {
        return currentVersion.events;
    }

    this.getVotes = function() {
        return currentVersion.votes.votes_number;
    }

    this.getUserVote = function() {
        return currentVersion.votes.user_vote;
    }

    this.getPopularity = function() {
        return currentVersion.votes.popularity;
    }

    this.getCapabilities = function() {
        return currentVersion.capabilities;
    }

    this.getExtraData = function() {
        return extra_data;
    }

    this.getIeCompatible = function () {
        return currentVersion.ieCompatible;
    }

    //////////////
    // SETTERS
    //////////////

    this.setExtraData = function(extra_data_) {
        extra_data = extra_data_;
    }

    this.setTags = function(tagsJSON_) {
        currentVersion.tags = tagsJSON_;
    }

    this.setVotes = function(voteDataJSON_) {
        currentVersion.votes = voteDataJSON_;
    }

    this.setAvailableApps = function (availableAppsObj) {
        availableApps = availableAppsObj;
    }

    /////////////////////////////
    // CONVENIENCE FUNCTIONS
    /////////////////////////////
    this.changeVersion = function(version) {
        if (version instanceof GadgetVersion) {
            version = version.text;
        }
        currentVersion = data_by_version[allVersions[0].text];
        if (currentVersion.availableApps) {
            this.setAvailableApps(currentVersion.availableApps);
        }
    };

    this.getContract = function() {
        var capabilities = this.getCapabilities();

        for (i = 0; i < capabilities.length; i++) {
            var capability = capabilities[i];

            if (capability['name'].toLowerCase() == 'contratable') {
                return capability['contract'];
            }
        }

        return null;
    }

    this.getGadgetApps = function() {
        var capabilities = this.getCapabilities();

        for (i=0; i<capabilities.length; i++) {
            var capability = capabilities[i];

            if (capability['name'].toLowerCase() == 'contratable') {
                return capability['applications'];
            }
        }

        return [];
    }

    this.getAvailableApps = function() {
        return availableApps;
    }

    this.isContratable = function () {
        var capabilities = this.getCapabilities();

        for (var i = 0; i < capabilities.length; i++) {
            var capability = capabilities[i];

            if (capability.name.toLowerCase() == 'contratable')
                return capability.value.toLowerCase() == "true";
            else
                return false
        }

        return false;
    }

    this.hasContract = function () {
        var gadgetApps = this.getGadgetApps();

        if (gadgetApps.length == 0)
        return false;

        for (var i=0; i<gadgetApps.length; i++) {
            var app = gadgetApps[i];

            if (! app['has_contract'])
                return false;
        }

        return true;
    }

    ////////////////////////
    // CONSTRUCTOR
    ////////////////////////
    var i = 0;

    for (i = 0; i < resourceJSON_.length; i += 1) {
       version_data = resourceJSON_[i];

       version_data['version'] = new GadgetVersion(version_data['version'], 'catalogue');
       version_data['events'] = version_data['events'].map(function (x) {return x.friendcode;});
       version_data['slots'] = version_data['slots'].map(function (x) {return x.friendcode;});

       allVersions.push(version_data['version']);
       data_by_version[version_data['version'].text] = version_data;
    }
    allVersions = allVersions.sort(function(version1, version2) {
        return -version1.compareTo(version2);
    });
    this.changeVersion(allVersions[0]);
}
