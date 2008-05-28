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


var BrowserUtilsFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function BrowserUtils () {

		
		// ****************
		// PUBLIC METHODS 
		// ****************
		
		BrowserUtils.prototype.getHeight = function () {
			var newHeight=window.innerHeight; //Non-IE (Firefox and Opera)
			  
			if( document.documentElement && document.documentElement.clientHeight ) {
			  //IE 6+ in 'standards compliant mode'
			  newHeight = document.documentElement.clientHeight;
			} else if( document.body && document.body.clientHeight ) {
			  //IE 4 compatible and IE 5-7 'quirk mode'
			  newHeight = document.body.clientHeight;
			}
			return newHeight;
		}
		
		//gets total width
		BrowserUtils.prototype.getWidth = function(){	
			var newWidth=window.innerWidth; //Non-IE (Firefox and Opera)
		  
			if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
			    //IE 6+ in 'standards compliant mode'
		  		newWidth = document.documentElement.clientWidth;
			} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
		  		//IE 4 compatible and IE 5-7 'quirk mode'
			  newWidth = document.body.clientWidth;
			}
			return newWidth;
		}
			
		
		BrowserUtils.prototype.isLeftButton = function(button){
			
			if (button == 0 || (this.isIE() && button == 1))
				return true;
			else
				return false;	
		}
	
		BrowserUtils.prototype.getBrowser = function(){ 
			if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){ //test for MSIE x.x;
				var ieversion=new Number(RegExp.$1) // capture x.x portion and store as a number
				if (ieversion>=8)
					return "IE8";
				else if (ieversion>=7)
					return "IE7";
				else if (ieversion>=6)
					return "IE6";
				else if (ieversion>=5)
					return "IE5";
			} else if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
				var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
				if (ffversion>=3)
			 		return "FF3"
				else if (ffversion>=2)
			  		return "FF2"
			 	else if (ffversion>=1)
			  		return "FF1"
			} else{
				return "OTHER";
			}			
		}
		
		BrowserUtils.prototype.isIE = function(){ 
			if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) //test for MSIE x.x;	
				return true;
			else
				return false;		
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new BrowserUtils();
         	}
         	return instance;
       	}
	}
	
}();

