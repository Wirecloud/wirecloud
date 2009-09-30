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

function ExternalSubscription (){
	this._op_code = null;
	this._id = null;
  	this._url = null;
  	this._has_changed = false;
  	this._channel_GUI = null;
  	this._initializing = false;
}

function ExternalSubscription (subscription_data){
	if (subscription_data) {
		this._op_code = subscription_data['op_code'];
  		this._url = subscription_data['url'];
  		this._id = subscription_data['id'];
  	} else {
  		this._op_code = 0; // Disabled
  		this._url = null;
  		this._id = null;
  	}
  	
  	this._has_changed = false;
  	this._channel_GUI = null;
  	this._initializing = false;
}

ExternalSubscription.prototype.setChannelGUI = function (channel_GUI) {
	this._channel_GUI = channel_GUI;
}

ExternalSubscription.prototype.setOpCode = function (op_code) {
	this._has_changed = true;
  	this._op_code = op_code;
  	this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

ExternalSubscription.prototype.setURL = function (url) {
	this._has_changed = true;
  	this._url = url;
  	this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

ExternalSubscription.prototype.setID = function (id) {
	this._has_changed = true;
  	this._id = id;
  	this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

ExternalSubscription.prototype.hasChanged = function () {
	return this._has_changed;
}

ExternalSubscription.prototype.getOpCode = function () {
	return this._op_code;
}

ExternalSubscription.prototype.getURL = function () {
	return this._url;
}

ExternalSubscription.prototype.getID = function () {
	return this._id;
}

ExternalSubscription.prototype.getData = function () {
	var data = new Hash();
	
	data['url'] = this._url;
	data['op_code'] = this._op_code;
	data['id'] = this._id;
	
	return data;
}

ExternalSubscription.prototype.createURL = function () {
  	var create_url_success = function (transport) {
  		var response = JSON.parse(transport.responseText);
  		
  		this.setURL(response['url']);
  		this.setID(response['id']);
  		
  		this._channel_GUI.updateRemoteSubscription();
  	}
  	
  	var create_url_error = function (transport) {
  		alert("error en create_url");
  	}
  	
  	var url = URIs.POST_CREATE_EXTERNAL_CHANNEL;
  	PersistenceEngineFactory.getInstance().send_post(url, null, this, create_url_success, create_url_error);
}