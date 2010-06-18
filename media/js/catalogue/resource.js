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
  var vendor = null;
  var name = null;
  var displayName = null;
  var version = null;
  var last_version = null;
  var id = null;
  var description = null;
  var uriImage = null;
  var uriWiki = null;
  var mashupId = null;
  var uriTemplate = null;
  var addedBy = null;
  var allVersions = [];
  var tags = [];
  var slots = [];
  var events = [];
  var votes = null;
  var popularity = null;
  var userVote = null;
  var capabilities = [];
  var availableApps = [];
  var creator = [];
	
  //////////////////////////
  // GETTERS
  /////////////////////////
  this.getCreator = function() { 
    return creator;
  }
  
  this.getVendor = function() { 
    return vendor;
  }
	
  this.getName = function() { 
    return name;
  }
	
  this.getDisplayName = function() {
    return displayName;
  }
	
  this.getVersion = function() { 
	return version;
  }
  
  this.getLastVersion = function() { 
	return last_version;
  }
	
  this.getId = function() { 
	return id;
  }
  
  this.getAllVersions = function() { 
	return allVersions;
  }
  
  this.getDescription = function() { 
    return description;
  }
  
  this.getUriImage = function() { 
    return uriImage;
  }
  
  this.getUriTemplate = function() { 
	return uriTemplate;
  }
	
  this.getUriWiki = function() { 
	return uriWiki;
  }
  
  this.getMashupId = function() { 
	return mashupId;
  }
  
  this.isMashup = function() { 
	return mashupId != null;
  }
  
  this.isGadget = function() { 
	return mashupId == null;
  }
  
  this.getAddedBy = function() { 
    return addedBy;
  }

  this.getTags = function() { 
	return tags;
  }
  
  this.getSlots = function() { 
	return slots;
  }
  
  this.getEvents = function() { 
	return events;
  }
  
  this.getVotes = function() {
	return votes;
  }
	
  this.getUserVote = function() {
	return userVote;
  }
	
  this.getPopularity = function() {
	return popularity;
  }
  
  this.getCapabilities = function() {
	return capabilities; 
  }
  
  //////////////
  // SETTERS
  //////////////
  this.setTags = function(tagsJSON_) {
	tags = tagsJSON_;
  }
  
  this.setSlots = function(slotsJSON_) {
	slots.clear();
		
	for (var i=0; i<slotsJSON_.length; i++) {
	  slots.push(slotsJSON_[i].friendcode);
	}
  }
	
  this.setEvents = function(eventsJSON_) {
	events.clear();
		
	for (var i=0; i<eventsJSON_.length; i++) {
	  events.push(eventsJSON_[i].friendcode);
	}
  }
	
  this.setVotes = function(voteDataJSON_) {
	votes = voteDataJSON_.voteData[0].votes_number;
	userVote = voteDataJSON_.voteData[0].user_vote;
	popularity = voteDataJSON_.voteData[0].popularity;
  }
  
  this.setAvailableApps = function (availableAppsObj) {
    availableApps = availableAppsObj;
  }

  /////////////////////////////
  // CONVENIENCE FUNCTIONS
  /////////////////////////////
  this.getContract = function() { 
	for (i=0; i<capabilities.length; i++) {
	  var capability = capabilities[i];
			
	  if (capability['name'].toLowerCase() == 'contratable') {
		return capability['contract'];
	  }
	}
		
	return null;
  }
	
  this.getGadgetApps = function() { 
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
  creator = resourceJSON_.author;
  
  vendor = resourceJSON_.vendor;
  name = resourceJSON_.name;
  displayName = resourceJSON_.displayName;
  version = resourceJSON_.version;
  
  if (resourceJSON_.last_version)
    last_version = resourceJSON_.last_version;
  
  id = resourceJSON_.id;
  allVersions = resourceJSON_.versions;
  description = resourceJSON_.description;
  uriImage = resourceJSON_.uriImage;
  uriWiki = resourceJSON_.uriWiki;

  if (resourceJSON_.mashupId && resourceJSON_.mashupId != "")
	mashupId = resourceJSON_.mashupId;
  
  addedBy = resourceJSON_.added_by_user;
  uriTemplate = resourceJSON_.uriTemplate;
  votes = resourceJSON_.votes[0].votes_number;
  userVote = resourceJSON_.votes[0].user_vote;
  popularity = resourceJSON_.votes[0].popularity;	
  capabilities = resourceJSON_.capabilities;
  
  if (resourceJSON_.availableApps)
	this.setAvailableApps(resourceJSON_.availableApps);
  
  this.setEvents(resourceJSON_.events);
  this.setSlots(resourceJSON_.slots);
  this.setTags(resourceJSON_.tags);
}