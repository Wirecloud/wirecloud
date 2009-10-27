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
 
function RemoteChannelManager(wiring) {

	RemoteChannelManager.prototype.MILLISECONDS_TO_WAIT = 1000;
	RemoteChannelManager.prototype.MAX_SECONDS_TO_WAIT = 1800;
 
	//  CONSTRUCTOR
	this.nested_delayed_updates = 0;
	this.waiting_for_response = false;
	this.subscribed_channels = null;
	this.uncommited_channel_values = new Hash();
	this.error_delay = 0;
	
	this.persistence_engine = PersistenceEngineFactory.getInstance();
	this.wiring = wiring;
 	
 	////////////////////////////////////////////////////////////////////////
 	// PUBLIC METHODS!
 	////////////////////////////////////////////////////////////////////////
 	
 	// Subscribe with only one connection to all given channels!
 	RemoteChannelManager.prototype.subscribe_to_channels = function() {
 		var remote_channels = this.wiring.get_remote_channels_for_reading_ids()
 		this.subscribed_channels = new Hash();
 		
 		for (var i=0; i<remote_channels.length; i++) {
 			var channel = remote_channels[i];
 			var remote_id = channel.getRemoteSubscription().getID(); 
 			
 			this.subscribed_channels[remote_id] = channel;
 		}
		
		this.subscribe_remote_channels();
	}
	
	// Mark channel to be published!
	// Programs a remote update operation MILLISECONDS_TO_WAIT from now!
	RemoteChannelManager.prototype.publish_channel_value = function(channel_id, channel_value) {		
		if (! this.uncommited_channel_values[channel_id]) {
			// Creating  array of values for this channel
			this.uncommited_channel_values[channel_id] = new Array();
		}
		
		var values = this.uncommited_channel_values[channel_id];
		
		var remote_channel_value = new RemoteChannelValue(channel_id, channel_value);
		values.push(remote_channel_value);
		
		var new_delayed_update = this.check_delayed_updates_number(values);
	
		this.schedule_update_operation(new_delayed_update);
	}
	
	////////////////////////////////////////////////////////////////////////
 	// PRIVATE METHODS!
 	////////////////////////////////////////////////////////////////////////
 	
 	// AJAX CALLBACKS
	var subscribe_success = function(transport) {
		var response_text = transport.responseText;
		var modified_channels = JSON.parse(response_text);
		
		/* ****************************************************************************
		   - modified_channels.length == 0 
		      Connection closed by server: the same client has connected 2 times!
		      Noting to do!
		   - modified_channels.length > 0
		      Propagate through channels!
		      Connect again to push notifier!
		**************************************************************************** */
		
		if (modified_channels.length > 0) {
		
			// Propagate values
			this.propagate_channels(modified_channels);
			
			// Reconnecting!
			this.subscribe_remote_channels();
		}
		
		this.error_delay = 0;
	}
	
	 var subscribe_error = function(transport) {
		var response = transport.responseText;
		//var data = JSON.parse(response);
		
		// Reconnecting!
		this.schedule_subscribe_operation();
	}
 
  	var publish_success = function(transport) {
		var response = transport.responseText;
		//var data = JSON.parse(response);
		
		this.remove_sent_values();
		this.schedule_delay_between_requests();
	}
	
	var publish_error = function(transport) {
		var response = transport.responseText;
		//var data = JSON.parse(response);
		
		this.schedule_delay_between_requests();
	}
	
	
	// Checking if repeated value!
	this.check_delayed_updates_number = function(values) {
		if (values.length > this.nested_delayed_updates) {
			this.nested_delayed_updates = values.length;
			
			return true;
		}
		
		return false;
	}
	
	// Auxiliar function for getting values to publish!
	this.get_values_to_send = function() {
		var channel_keys = this.uncommited_channel_values.keys();
		var values_json = new Array();
		
		for (var i = 0; i<channel_keys.length; i++) {
		    var channel_id = channel_keys[i];
			var channel_values = this.uncommited_channel_values[channel_id];
			
			if (channel_values.length > 0) {
				var first_channel_value = channel_values[0];
				
				values_json.push(first_channel_value.get_json())
			}
		}	
		
		return values_json.toJSON();
	}
	
	
	// Auxiliar function for erasing sent values!
	this.remove_sent_values = function() {
		var channel_keys = this.uncommited_channel_values.keys();
		var values_json = new Array();
		
		for (var i = 0; i<channel_keys.length; i++) {
		    var channel_id = channel_keys[i];
			var channel_values = this.uncommited_channel_values[channel_id];
			
			if (channel_values.length > 0) {
				channel_values.shift();
			}
		}
		
		this.nested_delayed_updates--;
	}
	
	this.get_subscribed_channels_json = function() {
		var keys = this.subscribed_channels.keys();
		var ids = new Array();
		
		for (var i=0; i<keys.length; i++) {
			ids.push(parseInt(keys[i]));
		}
		
		return ids.toJSON();
	}
	
	this.propagate_channels = function(channels) {
		for (var i=0; i<channels.length; i++) {
			var id = channels[i]['id'];
			var value = channels[i]['value'];
			
			this.subscribed_channels[id].propagate(value);
		}
	} 
	
	// Register to remote channels!
	this.subscribe_remote_channels = function() {
		var channels_json = this.get_subscribed_channels_json();
	
		var url = URIs.GET_SUBSCRIBE_USER_TO_REMOTE_CHANNELS.evaluate({'channels': channels_json});
		
		this.persistence_engine.send_get(url, this, subscribe_success, subscribe_error);
	}
	
	// Publish new channel's value!
	this.update_remote_channels = function() {
		this.waiting_for_response = true;
			
		var values_json = this.get_values_to_send();
		
		var url = URIs.POST_PUBLISH_REMOTE_CHANNELS.evaluate({'channels': values_json}) ;
		
		this.persistence_engine.send_get(url, this, publish_success, publish_error);
	}

	this.delayed_update = function() {
		if (this.waiting_for_response) {
			setTimeout(this.delayed_update.bind(this), RemoteChannelManager.prototype.MILLISECONDS_TO_WAIT);
			return;
		}
		
		// Not running update! Saving channels now!
		this.update_remote_channels();
	}

	this.schedule_subscribe_operation = function() {
		setTimeout(this.subscribe_remote_channels.bind(this), this.get_error_delay_milliseconds());
	}
	
	this.get_error_delay_milliseconds = function() {
		if (this.error_delay == 0) {
			this.error_delay = 1;
		}
		else {
			if (this.error_delay > RemoteChannelManager.prototype.MAX_SECONDS_TO_WAIT)
				this.error_delay = RemoteChannelManager.prototype.MAX_SECONDS_TO_WAIT;
			else
				this.error_delay *= 4;
		}
		
		return this.error_delay*1000;
	}
	
	this.schedule_update_operation = function(new_delayed_update) {
		// Creating new delayed update (if needed)
		if (new_delayed_update) {
			setTimeout(this.delayed_update.bind(this), RemoteChannelManager.prototype.MILLISECONDS_TO_WAIT);
			return;
		}
	}
	
	this.schedule_delay_between_requests = function() {
		setTimeout(this.ready_for_new_request.bind(this), RemoteChannelManager.prototype.MILLISECONDS_TO_WAIT);
	}
	
	this.ready_for_new_request = function() {
		this.waiting_for_response = false;
	}
	
	
	// INITIALIZATION:
	this.subscribe_to_channels();
}

function RemoteChannelValue (id, value){

	// Constructor
	this.id = id;
	this.value = value;
	this.token = new Date().getTime();
	
	// Public methods!
	RemoteChannelValue.prototype.compare_token = function (token) {
		return this.token == token;
	}
	
	
	RemoteChannelValue.prototype.get_json = function () {
		return {'id': this.id, 'value': this.value, 'token': this.token};
	}
}