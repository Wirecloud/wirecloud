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

/**
 * @author luismarcos.ayllon
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////   USERNAME ADAPTOR   //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function UserAdaptor() {

	function _onSuccess(receivedData) {
		var usernameJson = eval ('(' + receivedData.responseText + ')');
		var value = usernameJson.value;
		OpManagerFactory.getInstance().activeWorkSpace.getContextManager().notifyModifiedConcept(UserAdaptor.prototype.CONCEPT, value);
	}

	function _onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
							  true);
		} else {
			msg = transport.status + " " + transport.statusText;
		}
		msg = interpolate(gettext("Error getting concept %(concept)s: %(errorMsg)s."),
		                          {concept: UserAdaptor.prototype.CONCEPT, errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var uri = URIs.GET_CONTEXT_VALUE.evaluate({concept: UserAdaptor.prototype.CONCEPT});
	PersistenceEngineFactory.getInstance().send_get(uri , this, _onSuccess, _onError);			
	
}

UserAdaptor.prototype.CONCEPT = 'username'

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////     LANGUAGE ADAPTOR     //////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function LanguageAdaptor() {
	
	function _onSuccess(receivedData) {
		var json = eval ('(' + receivedData.responseText + ')');
		var value = json.value;
		OpManagerFactory.getInstance().activeWorkSpace.getContextManager().notifyModifiedConcept(LanguageAdaptor.prototype.CONCEPT, value);
	}

	function _onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
							  true);
		} else {
			msg = transport.status + " " + transport.statusText;
		}
		msg = interpolate(gettext("Error getting concept %(concept)s: %(errorMsg)s."),
		                          {concept: UserAdaptor.prototype.CONCEPT, errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var uri = URIs.GET_CONTEXT_VALUE.evaluate({concept: LanguageAdaptor.prototype.CONCEPT});
	PersistenceEngineFactory.getInstance().send_get(uri , this, _onSuccess, _onError);			
	
}

LanguageAdaptor.prototype.CONCEPT = 'language'


