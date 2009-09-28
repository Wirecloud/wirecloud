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

function ExternalChannelInfo (channel){
	this._channel = channel;
	this._op_code = null;
  	this._url = null;
}

ExternalChannelInfo.prototype.setOperation = function (op_code) {
  	this._op_code = op_code;
}

ExternalChannelInfo.prototype.setURL = function (url) {
  	this._url = url;
}

ExternalChannelInfo.prototype.createURL = function () {
  	var create_url_success = function (transport) {
  		this._channel.set_remote_URL('kk');
  	}
  	
  	var create_url_error = function (transport) {
  		
  	}
  	
  	var url = URIs.POST_CREATE_EXTERNAL_CHANNEL;
  	PersistenceEngineFactory.getInstance().send_post(url, null, this, create_url_success, create_url_error);
}