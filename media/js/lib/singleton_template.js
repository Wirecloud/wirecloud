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
var MyClassFactory  = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function MyClass () {
		
		// *********************************
		// PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		var myPrivateVar = "private variable accessed";
	    function myPrivateMethod(){ 
			alert ("private method accessed");
		}
	
		// *********************
		// PRIVILEGED METHODS
		// *********************
		this.getMyPrivateVar = function(){ return myPrivateVar }
		
	
		// *******************
		// PUBLIC PROPERTIES 
		// *******************
		this.myPublicVar = "public var accessed";
	
		// ****************
		// PUBLIC METHODS
		// ****************
		MyClass.prototype.myPublicMethod = function () {alert ("public method accessed")}
			
	}
	
	// ************************
	// SINGLETON GET INSTANCE
	// ************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new MyClass();
            	instance.constructor = null;
         	}
         	return instance;
       	}
	}
	
}();

var myInstance = MyClassFactory.getInstance();
myInstance.myPublicMethod(); // OK
alert (myInstance.myPublicVar); // OK
alert (myInstance.getMyPrivateVar()); // OK
myInstance.myPrivateMethod (); // NO
alert (myInstance.myPrivateVar); // NO