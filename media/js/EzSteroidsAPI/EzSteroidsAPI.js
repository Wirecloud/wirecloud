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
 

function _EzSteroidsAPI(user) {
	
	var setUserPolicies = function(policies){
		this.userPolicies = policies;
	}
	
	var showUserError = function(resp, e){
		//provisional patch to return allways true if EzSteroids isn't available
		this.userPolicies = null;
	}
	
	var setGlobalPolicies = function(policies){
		this.globalPolicies = policies;
	}
	
	var showGlobalError = function(resp, e){
		//provisional patch to return allways true if EzSteroids isn't available
		this.globalPolicies = null;
	}
	
	try{
		this.userPolicies = null;
		this.globalPolicies = null;
		
		// get the policies
		this.API = new API(URIs.EZSTEROIDS_API, URIs.PROXY);
		this.API.getUserPolicies(user, setUserPolicies.bind(this), showUserError);
		this.API.getAllPolicies(setGlobalPolicies.bind(this), showGlobalError);
	}
	catch(e){
		this.userPolicies = null;
		this.globalPolicies = null;
	}
	
}

_EzSteroidsAPI.prototype.evaluePolicy = function(policy){
	if (!this.userPolicies || !this.globalPolicies)
		// if EzSteroids isn't available, the user cannot do the action
		return false
	
	p = String.toLowerCase(policy.replace(/ /g, "_"));
	
	// search in the user policies
	for (i=0;i<this.userPolicies.length;i++){
		if (this.userPolicies[i].codename == p){
			// allowed policy => action allowed
			return true;
		}
	}
	// if it isn't in the user policies, check if the policy is defined in Ezsteroids
	for (i=0;i<this.globalPolicies.length;i++){
		if (this.globalPolicies[i].codename == p){
			// defined and not allowed policy => action forbidden
			return false;
		}
	}
	// not defined policy => action allowed
	return true;
}

var EzSteroidsAPI = new _EzSteroidsAPI(ezweb_user_name);