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

function RemoteSubscription (){
    this._op_code = null;
    this._id = null;
    this._url = null;
    this._has_changed = false;
    this._channel_GUI = null;
    this._initializing = false;
}

function RemoteSubscription (subscription_data){
    if (subscription_data) {
        this._op_code = subscription_data['op_code'];
        this._url = subscription_data['url'];
        this._id = subscription_data['remote_channel_id'];
    } else {
        this._op_code = RemoteSubscription.prototype.DISABLED;
        this._url = null;
        this._id = null;
    }

    this._has_changed = false;
    this._channel_GUI = null;
    this._initializing = false;
}

RemoteSubscription.prototype.DISABLED = 0;
RemoteSubscription.prototype.READ = 1;
RemoteSubscription.prototype.WRITE = 2;

RemoteSubscription.prototype.setChannelGUI = function (channel_GUI) {
    this._channel_GUI = channel_GUI;
}

RemoteSubscription.prototype.is_reading = function () {
    return this._op_code == RemoteSubscription.prototype.READ;
}

RemoteSubscription.prototype.is_writing = function () {
    return this._op_code == RemoteSubscription.prototype.WRITE;
}

RemoteSubscription.prototype.setID = function (id) {
    if (! this._channel_GUI.wiringGUI)
        return;

    this._has_changed = true;
    this._id = id;
    this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

RemoteSubscription.prototype.setURL = function (url) {
    if (! this._channel_GUI.wiringGUI)
        return;

    this._has_changed = true;
    this._url = url;
    this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

RemoteSubscription.prototype.setOpCode = function (op_code) {
    if (! this._channel_GUI.wiringGUI)
        return;

    this._has_changed = true;
    this._op_code = op_code;
    this._channel_GUI.wiringGUI.notifyRemoteSubscriptionChange();
}

RemoteSubscription.prototype.hasChanged = function () {
    return this._has_changed;
}

RemoteSubscription.prototype.markAsChanged = function () {
    return this._has_changed = true;
}

RemoteSubscription.prototype.getOpCode = function () {
    return this._op_code;
}

RemoteSubscription.prototype.getURL = function () {
    return this._url;
}

RemoteSubscription.prototype.getID = function () {
    return this._id;
}

RemoteSubscription.prototype.getData = function () {
    this._url = this._channel_GUI.remote_url_input.value;

    return {
        'url': this._url,
        'op_code': this._op_code,
        'id': this._id
    };
}

RemoteSubscription.prototype.createURL = function () {
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
