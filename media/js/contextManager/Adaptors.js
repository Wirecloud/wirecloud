/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
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


