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



if (typeof MYMW == "undefined" || !MYMW) {
    var MYMW = {};
	MYMW.ui = {};
}

String.prototype.supplant = function (o) 
{
	return this.replace(/{([^{}]*)}/g,
		function (a, b) 
		{
			var r = o[b];
			return typeof r === 'string' ? r : a;
		}
	);
};
	
// Detect clients
var ua =  navigator.userAgent;
var isOpera = ua.indexOf("Opera")>0;
var isGecko = ua.indexOf("Gecko")>0;
var isWmobile = !isOpera && !isGecko && (ua.indexOf("PPC")>0 || ua.indexOf("IEMobile")>0);

function id(nid) {
	return isWmobile ? document.all[nid] : document.getElementById(nid);
}

function hasClass(nid, classStr) {
	return (" "+id(node).className+" ").indexOf(" "+classStr+" ") >= 0;
};

function update(nid, content) {
	id(nid).innerHTML = content;
}

function after(nid, content) {
	var el = id(nid);
	el.innerHTML = el.innerHTML + content;
}

function before(nid, content) {
	var el = id(nid);
	el.innerHTML = content + el.innerHTML;
}

function updateClass(nid, className) {
	id(nid).className = className;
}

/*
// not working for IEM
HTMLElement.prototype.update = function( txt ) {
	this.innerHTML = txt;
}
*/

/*
function getElementsByClassName(classStr) {
	var r=[];
	var els=(document.getElementsByTagName)?document.getElementsByTagName("*"):document.all;

	for (var i=0; i<els.length; i++) {
		var tmp=els[i].className.split(" ");
		for (var j=0; j<tmp.length; j++) {
			if (tmp[j] == classStr) { 
				r[r.length] = els[i];
			}
		}
	}
	
	return r
}
*/

/*
var dump = function(obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			alert(i + " => " + obj[i]);
		}
	}
}
*/
(function() {
	var MAX_SLOTS = 5;
	
	MYMW.ui.TabView = function(nid, attr) {
		this._tabs = [];
		this._attr = attr || {};
		this._slots = [null, null, null, null, null]; // MAX_SLOTS
		
		// create initial empty content slots 
		var navHTML = "";
		var contentHTML = "";
		for (var i=0; i<MAX_SLOTS; i++) {
			navHTML += "<li id='mymw-nav-" + i + "' class='mymw-inactive'></li>"
			contentHTML += "<div id='mymw-slot-" + i + "' class='mymw-inactive'></div> ";
		}
		update('mymw-nav', navHTML);		
		update('mymw-content', contentHTML);

		for (var i in attr) {
			this.set(i, attr[i]);
		}		
	};
	var p = MYMW.ui.TabView.prototype;
	
	p.addTab = function(tab) {
	
		if (this._tabs.length === this.get('maxTabs')) {
			this.removeTab( this._LRU() );
		}

		this._tabs[this._tabs.length] = tab;
		
		// assign a free slot
		for (var i=0; i<this._slots.length; i++) {
			if (this._slots[i] === null) {
				this._slots[i] = tab;
				tab.assignSlot(i);
				break;
			}
		}
		
		// It this is the first tab, activate it
		if (this._tabs.length === 1) {
			this.set('activeIndex', 0); // set includes rendering
		}

		// this._renderHead();
		// this._renderBody();
	}

	p.removeTab = function(index) {
		var tab = this._tabs[index];
		this._slots[tab._slot] = null;
		
		tab.assignSlot();
		
		this._tabs.splice(index, 1);
		
		// If the active tab is removed, activate the first tab.
		if (this.get('activeIndex') === index && this._tabs.length > 0) {
			this.set('activeIndex', 0); // set includes rendering
		}
		
		// this._renderHead();
		// this._renderBody();
	}
	
	p.getTab = function(index) {
		return this._tabs[index];
	}

	// name in ['activeId', 'activeTab', 'activeIndex', 'maxTabs']
	p.set = function(name, value) {
		this._attr[name] = value;
		switch (name) {
			case 'activeId' :
				this.set('activeIndex', this.getTabIndexById(value));
				break;
			case 'activeTab' :
				for (var i=0; i<this._tabs.length; i++) {
					if (this._tabs[i] === value) {
						this.set('activeIndex', i);
						break;
					}
				}
				break;
			case 'activeIndex' :
				for (var i=0; i<this._tabs.length; i++)	{
					if (this._tabs[i].get('active') === true) {
						if (i !== value) {
							this._tabs[i].set('active', false);
						}
					} else {
						if (i === value) {
							this._tabs[i].set('active', true);
						}
					}
				}
				break;
			case 'maxTabs' :
				while (this._tabs.length > value) {
					this.removeTab( this._LRU() );
				}					
				break;
		}
	}
	
	p.get = function(name) {
		return this._attr[name];
	}
		
	// not in YUI
	p.clear = function(id) {
		var n = this._tabs.length;
		for (var i=0; i<n; i++) {
			this.removeTab(0);
		}
	}
	
	// not in YUI
	p.removeTabById = function(id) {
		var index = this.getTabIndexById(id);
		if (index >= 0) {
			this.removeTab( index );
		}
	}
	
	// not in YUI
	p.getTabIndexById = function(id) {
		var index;
		for (var i=0; i<this._tabs.length; i++) {
			if (this._tabs[i].get('id') === id) {
				index = i;
				break;
			}
		}
		return index;
	}
		
	p._renderHead = function() {
		var innerHTML = "";
		for (var i=0; i<this._tabs.length; i++) {
			this._tabs[i]._renderHead(); // delegate rendering
		}
	}
	
	p._renderBody = function() {
		for (var i=0; i<this._tabs.length; i++) {
			this._tabs[i]._renderBody(); // delegate rendering
		}				
	}
	
	p._LRU = function() {
		var result;
		var minTime = Number.MAX_VALUE;
		for (var i=0; i<this._tabs.length; i++) {
			if (this._tabs[i]._dateActivation < minTime) {
				minTime = this._tabs[i]._dateActivation;
				result = i;
			}
		}
		return result;
	}
	
	MYMW.ui.Tab = function(attr) {
		this._loaded = false;
		this._disposed = false;
		// this._head = "";
		// this._body = "";
		this._slot = undefined;
		this._dateActivation = undefined;
		
		this._attr = attr || {};
		
		for (var i in attr) {
			this.set(i, attr[i]);
		}
	};
	var p = MYMW.ui.Tab.prototype;
	
	p.assignSlot = function(slot) {
		if (slot != undefined) {
			this._slot = slot;
			this._renderBody();
			this._renderHead();			
		} else {	
			this._disposed = true;
			this._renderBody();
			this._renderHead();
			this._slot = slot;
		}
	}
	
	// name in ['active', 'label', 'content', 'dataSrc', 'cacheData', 'id', 'highlight', 'onclick']
	p.set = function(name, value) {
		this._attr[name] = value;
		switch (name) {
			case 'active' :				
				if (value === true) {
					this._dateActivation = new Date();
					this.__show();
				} else {
					this.__hide();
				}
				//this._renderBody();
				break;
			case 'highlight' :
				if (this._attr['active'] === true) {
					this._attr['highlight'] = false;
				}
			case 'onclick' :
			case 'label' :
				this._renderHead();
				break;
			case 'content' :	
				this._renderBody();
				break;
		}
	}
			
	p.get = function(name) {
		switch (name) {
			case 'content':
				var dataSrc = this.get('dataSrc');
				if (dataSrc &&
					this.get('active') &&
					(!this._loaded || !this.get('cacheData')))
				{
					var handle_ok = function( txt ) {
						this._loaded = true;
						this.set('content', txt);
					}
					var params = "_mymw_rnd=" + Math.random(); // random param to avoid caching
					ajax.apply(this, [dataSrc, handle_ok, null, params, true]);
				}
				break;
		}
		
		return this._attr[name];
	}

	p.__show = function() {
		if (this._slot != undefined) {
			if (!this._loaded) {
				this.get('content');
			}
			updateClass('mymw-slot-' + this._slot, '');
			updateClass('mymw-nav-' + this._slot, 'mymw-selected');
		}
	}
	
	p.__hide = function() {
		if (this._slot != undefined) {
			updateClass('mymw-slot-' + this._slot, 'mymw-inactive');
			updateClass('mymw-nav-' + this._slot, '');
		}
	}
	
	p._renderHead = function() {
		if (this._disposed === false) {
			if (this._slot != undefined) {
				this.__updateHead();
				update('mymw-nav-' + this._slot, this._head);
				updateClass('mymw-nav-' + this._slot, this.get('active') ? 'mymw-selected' : this.get('highlight') ? 'mymw-highlight' : '');
			}
			
			try {
				var onclick = this.get('onclick');
				var tabid = this.get('id')
				var fn = function() {				
					if (onclick) {						
						onclick();
					}
					// TODO the name of the variable "tabview" is hardcoded !
					tabview.set("activeId", tabid);
				}			
				id('mymw-link-' + this._slot).onclick = fn;
			} catch (e) {
				// browsers that do not allow dynamic binding for events will fail silently
			}			
		} else {			
			update('mymw-nav-' + this._slot, "");
			updateClass('mymw-nav-' + this._slot, 'mymw-inactive');
		}
	}
	
	p._renderBody = function() {
		if (this._disposed === false) {
			if (this._slot != undefined) {
				this.__updateBody();
				update('mymw-slot-' + this._slot, this._body); // asynch call, so we sinchronize UI
			}
		} else {
			update('mymw-slot-' + this._slot, "");
		}
	}
	
	p.__updateHead = function() {
		// TODO the name of the variable "tabview" is hardcoded !
		var onclick = 'javascript:tabview.set("activeId","' + this.get('id') + '");';
		var label = this.get('label');
		this._head = "<a id='mymw-link-" + this._slot + "' href='#' onclick='" + onclick + "'>" + label + "</a>";
	}
	
	p.__updateBody = function() {
		this._body = this.get('content');
	}
})();
var Constants = {
  Logging: {
    ERROR_MSG: 1,
    WARN_MSG:  2,
    INFO_MSG:  3
  }
};
 
 /******GENERAL UTILS **********/
 
 //ARRAY EXTENSIONS
 Array.prototype.elementExists = function (element){
 	if(this.indexOf(element) != -1)
 		return true;
 	return false;
 }
 Array.prototype.getElementById = function (id){
 	for(var i=0;i < this.length;i++){
 		if(this[i].getId() == id)
 			return this[i];
 	}
 	return null;
 }
 
 Array.prototype.getElementByName = function (elementName){
 	for(var i=0;i < this.length;i++){
 		if(this[i].getName() == elementName)
 			return this[i];
 	}
 	return null;
 }
 
 Array.prototype.remove = function(element){
 	var index = this.indexOf(element);
	if(index != -1)this.splice(index, 1);
 }
 
 Array.prototype.removeById = function (id){
 	var element;
 	for(var i=0;i < this.length;i++){ 	
 		if(this[i].getId() == id){
 			element = this[i];
 			this.splice(i, 1);
 			return element;
 		}
 	}
 	return null;
 }

/* Slide utility function */
var percent = 100;
var slideSpeed = 20;
var timer;
var percent;

function slide (backwards, element)
{
    percent -= slideSpeed;
    if (this.percent <= 0)
    {
        this.percent = 0;
    }
    element.style.left = (backwards ? -percent : percent) + "%"; 
    if (this.percent != 0)
    	setTimeout(function(){slide(backwards, element)}, 0);
    else
    	percent = 100;
}

/* language selection */
function setLanguage(language) {
	var onSuccess = function() {
		window.location.reload();
	}
	
	var onError = function() {}
	
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var params = {language: language};
	persistenceEngine.send_post("/i18n/setlang/", params, this, onSuccess, onError);
	return false;
}

/* layout change function (landscape or portrait) */
function updateLayout()
{
	var orient = (window.orientation==0 || window.orientation==180) ? "portrait" : "landscape";
    if (!loaded)
    {
    
    /*if (window.innerWidth != _currentWidth || !loaded)
	{
		_currentWidth = window.innerWidth;
		var orient = _currentWidth == 320 ? "portrait" : "landscape";
	*/
    	// change the orientation properties
    	document.body.setAttribute("orient", orient);
    	if (OpManagerFactory.getInstance().loadCompleted){
    		loaded=true;
    		clearInterval(updateInterval);
    		OpManagerFactory.getInstance().activeWorkSpace.updateLayout(orient);
    	}
    	else{
    		loaded=false;
    	}            
    }
    else{
    	//the onorientationchange has hapenned
    	document.body.setAttribute("orient", orient);
    	OpManagerFactory.getInstance().activeWorkSpace.updateLayout(orient);
    }
}

/* tab change function */
function checkTab()
{
	if (OpManagerFactory.getInstance().visibleLayer == "tabs_container"){
		var xoffset = window.pageXOffset;
	
		var tabWidth = window.innerWidth;	
		var halfTabWidth = tabWidth / 2;
	
		var scroll = xoffset < halfTabWidth 
			? - xoffset 
			: - (xoffset - halfTabWidth) % tabWidth + halfTabWidth;
		
		if (scroll != 0)
		{
			var STEP_H = tabWidth / 52;
			var steps = Math.abs(scroll / STEP_H);
			var step = scroll < 0 ? - STEP_H : STEP_H;
			
			for (var i=0; i<steps; i++) {
				window.scrollBy(step, 0);
			}		
			window.scrollTo(xoffset + scroll, 1);
			
			//update the visible Tab
			OpManagerFactory.getInstance().activeWorkSpace.updateVisibleTab(Math.round(window.pageXOffset / tabWidth));
		}
	}
	else if (OpManagerFactory.getInstance().visibleLayer == "dragboard"){ // dragboard
		window.scrollTo(0, 1);
	}
}

function Modules () {

}

// Singleton modules (valid for every WorkSpace)
Modules.prototype.SHOWCASE = 0;
Modules.prototype.CATALOGUE = 1;

//Each workspace loads one instance of VarManager and Wiring
// Each workspace loads loads n instaces of Drabgoard!
Modules.prototype.ACTIVE_WORKSPACE = 2;




/**
 * Prototype Improvements v0.1
 *
 * Various additions to the prototype.js
 */

Object.extend(Event, {
	KEY_SHIFT:    16,
	KEY_CONTROL:  17,
	KEY_CAPSLOCK: 20,
	KEY_SPACE: 32,
	keyPressed: function(event)
	{
		return Browser.isMSIE() ? window.event.keyCode : event.which;
	},
	/*
	 * Event extension to manage user privileges 
	 * */
	observe: function(element, name, observer, useCapture, featureId){
		var _observer = observer;
		if (featureId && typeof(EzSteroidsAPI)!="undefined"){
			//check the user policies
			if (!EzSteroidsAPI.evaluePolicy(featureId)){
				//if the user isn't allowed
				_observer = function(msg){LogManagerFactory.getInstance().showMessage("You are not allowed to perform this operation");};
			}
		}
		element = $(element);
    	useCapture = useCapture || false;

    	if (name == 'keypress' && (Prototype.Browser.WebKit || element.attachEvent))
      		name = 'keydown';

   		Event._observeAndCache(element, name, _observer, useCapture);
	}
});

Browser = {
	
	/**
	 * Returns the user agent
	 * @param {bool} useAlert
	 */
	inspect: function(useAlert)
	{
		if(useAlert)
			alert(navigator.userAgent);
		else
			return navigator.userAgent;
	},
	/**
	 * Returns true if browser is MS Internet Explorer
	 */
	isMSIE: function()
	{
		return (navigator.userAgent.toLowerCase().indexOf("msie") > -1) && !this.isOpera();
	},
	/**
	 * Returns true if browser is Opera
	 */
	isOpera: function()
	{
		return navigator.userAgent.toLowerCase().indexOf("opera") > -1;
	},
	/**
	 * Returns true if browzer is Mozilla
	 */
	isMozilla: function()
	{
		return (navigator.userAgent.toLowerCase().indexOf("mozilla") > -1) && !this.isOpera() && !this.isMSIE();
	}
}


Object.genGUID = function()
{
	var len = 8;
	if(!isNaN(parseInt(arguments[0]))) len = parseInt(arguments[0]);
	var chars = "abcdef0123456789";
	var output = "";
	while(output.length < len)
	{
		var rnd = Math.floor(Math.random() * (chars.length - 1));
		output += chars.charAt(rnd);
	}
	return output;
}

Hash.prototype.clone = function() {
  var newHash = new Hash();
    
  this.each(function (pair) {
    newHash[pair.key] = pair.value;
  });

  return newHash;
}

//    Hack for right HTTP verbs
Ajax.Request.prototype.request = function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

//    if (!['get', 'post'].include(this.method)) {
//      // simulate other verbs over post
//      params['_method'] = this.method;
//      this.method = 'post';
//    }

    this.parameters = params;

    if (params = Hash.toQueryString(params)) {
      // when GET, append parameters to URL
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      if (this.options.onCreate) this.options.onCreate(this.transport);
      Ajax.Responders.dispatch('onCreate', this, this.transport);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous)
        setTimeout(function() { this.respondToReadyState(1) }.bind(this), 10);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

//      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.body = ['put', 'post'].include(this.method) ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  }


var PersistenceEngineFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function PersitenceEngine () {

		// ****************
		// PUBLIC METHODS 
		// ****************
		PersitenceEngine.prototype.send_get = function (url, context, successHandler, errorHandler, parameters, requestHeaders) {
			new Ajax.Request(url, {
				method: 'get',
				parameters: parameters,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			    });
		} 
		
		PersitenceEngine.prototype.send_post = function (url, params, context, successHandler, errorHandler, requestHeaders) {
			new Ajax.Request(url, {
				method: 'post',
				parameters: params,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			    });
		}
		
		PersitenceEngine.prototype.send_delete = function (url, context, successHandler, errorHandler, requestHeaders){
			new Ajax.Request(url, {
				method: 'delete',
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			});
		}
		
		PersitenceEngine.prototype.send_update = function (url, params, context, successHandler, errorHandler, requestHeaders){
			new Ajax.Request(url, {
				method: 'put',
				parameters: params,
				onSuccess: successHandler.bind(context),
				onFailure: errorHandler.bind(context),
				onException: errorHandler.bind(context),
				requestHeaders: requestHeaders
			});
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new PersitenceEngine();
         	}
         	return instance;
       	}
	}
	
}();

var CatalogueFactory  = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function Catalogue() {
		
		// *********************************
		//  PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		
		this.catalogueElement = $('mashup_catalogue_content');
		this.catalogueParentElement = $('mashup_catalogue');
		this.infoElement = $('mashup_info_content');
		this.infoParentElement = $('mashup_info');
		this.resourceList = null;
		
		
		// ********************
		//  PRIVILEGED METHODS
		// ********************
		
		this.reloadCompleteCatalogue = function() {
			UIUtils.repaintCatalogue=true;
			UIUtils.sendPendingTags();
			if (UIUtils.isInfoResourcesOpen) {
				UIUtils.isInfoResourcesOpen = false;
				UIUtils.SlideInfoResourceOutOfView('info_resource');
			}
			UIUtils.search = false;
			this.repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
		}
		
	 	this.emptyResourceList = function() {
			$("resources").innerHTML="";
			_this.clearSelectedResources();
			resources = $H();
		}

		this.getResources = function() {
			return resources;
		}
		
		this.getResource = function(id_) {
			return resources[id_];
		}

		this.addMashupResource = function(mashupId) {
			/***CALLBACK methods***/
			var cloneOk = function(transport){
				/*var response = transport.responseText;
				var wsInfo = eval ('(' + response + ')');
				//create the new workspace and go to it
				opManager = OpManagerFactory.getInstance();
				opManager.workSpaceInstances[wsInfo.workspace.id] = new WorkSpace(wsInfo.workspace);
		
				ShowcaseFactory.getInstance().reload(wsInfo.workspace.id);*/
				window.location.reload()
				
			}
			var cloneError = function(transport, e){
				//ERROR			
				
			}
			
			var cloneURL = URIs.GET_ADD_WORKSPACE.evaluate({'workspace_id': mashupId});
			PersistenceEngineFactory.getInstance().send_get(cloneURL, this, cloneOk, cloneError);
		}

		this.hide = function(){
			this.catalogueParentElement.setStyle({display: "none"});
			OpManagerFactory.getInstance().showWorkspaceMenu();
		}
		
		this.show = function(){
			this.catalogueParentElement.setStyle({display: "block"});
			this.infoParentElement.setStyle({display: "none"});
		}

		this.loadCatalogue = function() {

			// ******************
			//  CALLBACK METHODS 
			// ******************

			//Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.

			var onError = function(transport, e) {
				//ERROR
			}

			/* load the resources and paint the catalogue */
			var loadResources = function(transport) {
				var responseJSON = transport.responseText;
			    var jsonResourceList = eval ('(' + responseJSON + ')');
			    this.resourceList = jsonResourceList.resourceList;
				
				var html = '';
				for (var i = 0; i<this.resourceList.length; i++)
				{
					var resource = this.resourceList[i];
					var visibleName = resource.name;
					if (resource.name.length > 13)
						var visibleName = visibleName.substring(0, 11)+"...";
					html+= '<div class="igadget_item">';
					html+= '<a href="javascript:CatalogueFactory.getInstance().showResourceInfo('+resource.mashupId+');">';
					html+= '<img class="igadget_icon" src="'+resource.uriImage+'" />'
					html+= '</a>';
					html+= '<a href="javascript:CatalogueFactory.getInstance().showResourceInfo('+resource.mashupId+');">'+visibleName+'</a>';
					html+= '</div>';
				}
				this.catalogueElement.update(html);
				this.catalogueParentElement.setStyle({display: "block"});
				$('workspace_menu').setStyle({display: "none"});;
			}
			
			var param = {orderby: "-creation_date", search_criteria: "mashup, mobileok", search_boolean:"AND"};
			var persistenceEngine = PersistenceEngineFactory.getInstance();
			var search_url = URIs.GET_RESOURCES_SIMPLE_SEARCH + "/tag/1/10";
			
			// Get Resources from PersistenceEngine. Asyncrhonous call!
			persistenceEngine.send_get(search_url, this, loadResources, onError, param);
		}
		
		/* Display the mashup information panel */
		this.showResourceInfo = function(id) {
			var html = "";
			for (var i = 0; i<this.resourceList.length; i++){
				var resource = this.resourceList[i];
				if (id == resource.mashupId){
					html += "<h2>"+resource.name+"</h2>";
					html += "<img src='"+ resource.uriImage +"' id='resource_img'>";
					html += "<div id='resource_description'>"+resource.description+"</div>";
					//display the stars according to the popularity
					html += "<div id='resource_popularity'>";
					var i = 0;
					for (i;i<resource.votes[0].popularity;i++)
						html += "<img src='/ezweb/images/ico_vot_ok.gif'/>";
					if ((resource.votes[0].popularity%1)!=0){
						html += "<img src='/ezweb/images/ico_vot_md.gif'/>";
						i++;
					}
					for (i; i<5; i++){
						html += "<img src='/ezweb/images/ico_vot_no.gif'/>";
					}
					html += "<span class='x-small'> ("+resource.votes[0].votes_number+" votes)</span></div>";
					html += "<div id='resource_vendor'><span class='title_info_resource'>Vendor: </span>" + resource.vendor+"</div>";
					html += "<div id='resource_version'><span class='title_info_resource'>Version: </span>" + resource.version+"</div>";
					html += "<div id='resource_tags'><span class='title_info_resource'>Tags: </span>"
					for (var i=0; i<resource.tags.length; i++){
						html +="<span class='small'>"+resource.tags[i].value+"<span class='x-small'> ("+resource.tags[i].appearances+")</span> </span>";
					}
					html += "</div>";
					break;
				}
			}
			html += "<div id='add_resource'><a href='javascript:CatalogueFactory.getInstance().addMashupResource("+resource.mashupId+");'>Add Mashup</a></div>";
			this.infoElement.update(html);
			
			this.catalogueParentElement.setStyle({display: "none"});
			this.infoParentElement.setStyle({display: "block"});
			
		}
	
	}
	
	// ************************
	//  SINGLETON GET INSTANCE
	// ************************
	
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Catalogue();
         	}
         	return instance;
       	}
	}
	
}();


//////////////////////////////////////////////
//                  XHTML                   //
//////////////////////////////////////////////

function XHtml(xhtml_) {
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var uri = null;
	uri = xhtml_.uri;

	
	// ****************
	//  PUBLIC METHODS
	// ****************
	
	this.getURICode = function() { return uri; }
}




//////////////////////////////////////////////
//                 TEMPLATE                 //
//////////////////////////////////////////////

function GadgetTemplate(variables_, size_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************

   var variableList = variables_;
   var width = size_.width;
   var height = size_.height;

	// ******************
	//  PUBLIC FUNCTIONS
	// ******************

    this.getWidth = function () {
        return width;
    }

    this.getHeight = function () {
        return height;
    }

    this.getVariables = function (iGadget) {
        
		// JSON-coded Template-Variables mapping
		// Constructing the structure
		var iGadgetId = iGadget.getId();
		var varManager = iGadget.dragboard.workSpace.getVarManager();

		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.PROPERTY:
				case Variable.prototype.EVENT:
					objVars[rawVar.name] = new RWVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, null);
					break;
				case Variable.prototype.EXTERNAL_CONTEXT:
				case Variable.prototype.GADGET_CONTEXT:
				case Variable.prototype.SLOT:
					objVars[rawVar.name] = new RVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, null);
					break;
				case Variable.prototype.USER_PREF:
					objVars[rawVar.name] = new RVariable(null, iGadgetId, rawVar.name, rawVar.aspect, varManager, rawVar.default_value);
					break;
			}
		}
        return objVars;
    }
	
	this.getUserPrefs = function () {

		if (this.prefs == null) {
			// JSON-coded Template-Variables mapping	
			// Constructing the structure 
		 
			this.prefs = new Array();
			var rawVar = null;
			for (var i = 0; i < variableList.length; i++) {
				rawVar = variableList[i];
				if (rawVar.aspect == Variable.prototype.USER_PREF) {
					switch (rawVar.type) {
						case UserPref.prototype.TEXT:  
							this.prefs.push(new TextUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.INTEGER:  
							this.prefs.push(new IntUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.BOOLEAN:
							this.prefs.push(new BoolUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.DATE:
							this.prefs.push(new DateUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.PASSWORD:
							this.prefs.push(new PasswordUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value));
							break;
						case UserPref.prototype.LIST:
							this.prefs.push(new ListUserPref(rawVar.name, rawVar.label, rawVar.description, rawVar.default_value, rawVar.value_options));
							break;
					}
				}
			}
		}

		return this.prefs;
	}
	
	this.getExternalContextVars = function (igadget_) {
		
		// JSON-coded Template-Variables mapping	
		// Constructing the structure 

		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		var currentContextVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.EXTERNAL_CONTEXT:
					currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept) 
					objVars.push(currentContextVar); 
					break;
				default:
					break;
			}
		}
		return objVars;
	}
	
	this.getGadgetContextVars = function (igadget_) {

		// JSON-coded Template-Variables mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		var currentContextVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			switch (rawVar.aspect) {
				case Variable.prototype.GADGET_CONTEXT:
					currentContextVar = new ContextVar(igadget_, rawVar.name, rawVar.concept) 
					objVars.push(currentContextVar); 
					break;
				default:
					break;
			}
		}
		return objVars;
	}

	
	this.getUserPrefsId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.USER_PREF)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
	
	this.getEventsId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.EVENT)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
	
   this.getSlots = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.SLOT)
			{
					objVars.push(rawVar);
			}
		}
        return objVars;
    }

   this.getEvents = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.EVENT)
			{
					objVars.push(rawVar);
			}
		}
        return objVars;
    }

	
	this.getPropertiesId = function () {
        
		// JSON-coded Template-UserPrefs mapping	
		// Constructing the structure 
		 
		var objVars = [];
		var rawVars = variableList;
		var rawVar = null;
		for (var i = 0; i<rawVars.length; i++) {
			rawVar = rawVars[i];
			if (rawVar.aspect == Variable.prototype.PROPERTY)
			{
					objVars.push(rawVar.name);
			}
		}
        return objVars;
    }
}



//////////////////////////////////////////////
//                  GADGET                  //
//////////////////////////////////////////////

function Gadget(gadget_, url_) {
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	var _this = this;
	
	this.getVendor = function() { return state.getVendor(); }
	this.getName = function() { return state.getName(); }
	this.getVersion = function() { return state.getVersion(); }
	this.getTemplate = function() { return state.getTemplate(); }
	this.getXHtml = function() { return state.getXHtml(); }
	this.getInfoString = function() { return state.getInfoString(); }
	
	this.getImage = function() { return state.getImage(); }
	this.setImage = function(image_) { state.setImage(image_); }
	
	this.getImageURI = function() { return state.getImageURI(); }
	this.getIPhoneImageURI = function() { return state.getIPhoneImageURI(); }
	
	
	// *******************
	//  PRIVATE FUNCTIONS
	// *******************
	
	var _solicitarGadget = function(url_) {
		
		// ******************
		//  CALLBACK METHODS 
		// ******************
	
		// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
		
		var onError = function(transport, e) {
			var msg;
			if (e) {
				msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
				                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
						  true);
			} else if (transport.responseXML) {
                                msg = transport.responseXML.documentElement.textContent;
			} else {
                                msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("The gadget could not be added to the showcase: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}
		
		var loadGadget = function(transport) {
			var response = transport.responseText;
			var objRes = eval ('(' + response + ')');
			state = new GadgetState(objRes);
			ShowcaseFactory.getInstance().gadgetToShowcaseGadgetModel(_this);
		}
		
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		// Post Gadget to PersistenceEngine. Asyncrhonous call!
		var param = {url: url_};
		persistenceEngine.send_post(URIs.GET_GADGETS, param, this, loadGadget, onError);
	}
	
	this.getId = function() {
		return this.getVendor() + '_'+ this.getName() + '_' + this.getVersion();
	}
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************

	var state = null;
	
	if (url_ != null) {
		_solicitarGadget(url_);
	}
	else {
		state = new GadgetState(gadget_);
	}
}

//////////////////////////////////////////////
//       GADGETSTATE (State Object)         //
//////////////////////////////////////////////

function GadgetState(gadget_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var vendor = null;
	var name = null;
	var version = null;
	var template = null;
	var xhtml = null;
	var image = null;
	var imageURI = null;
	var iPhoneImageURI = null;
	
	// JSON-coded Gadget mapping
	// Constructing the structure
	vendor = gadget_.vendor;
	name = gadget_.name;
	version = gadget_.version;
	template = new GadgetTemplate(gadget_.variables, gadget_.size);
	xhtml = new XHtml(gadget_.xhtml);
	image = gadget_.image;
	imageURI = gadget_.imageURI;
	iPhoneImageURI = gadget_.iPhoneImageURI;
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return vendor; }
	this.getName = function() { return name; }
	this.getVersion = function() { return version; }
	this.getTemplate = function() { return template; }
	this.getXHtml = function() { return xhtml; }
	this.getInfoString = function() {
		var transObj = { vendor: vendor, name: name, version: version};
		var msg = gettext("[GadgetVendor: %(vendor)s, GadgetName: %(name)s, GadgetVersion: %(version)s]");
		return interpolate(msg, transObj, true);
	}
	
	this.getImage = function() { return image; }
	this.setImage = function(image_) { image = image_; }
	
	this.getImageURI = function() { return imageURI; }
	this.getIPhoneImageURI = function() {return (iPhoneImageURI!="") ? iPhoneImageURI :  imageURI; }
}


function WorkSpace (workSpaceState) {

	// ****************
	// CALLBACK METHODS
	// ****************

	// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
	var loadWorkSpace = function (transport) {
		// JSON-coded iGadget-variable mapping
		var response = transport.responseText;
		this.workSpaceGlobalInfo = eval ('(' + response + ')');

		this.varManager = new VarManager(this);
		
		var tabs = this.workSpaceGlobalInfo['workspace']['tabList'];

		var visibleTabId = null;

		if (tabs.length>0) {
			for (var i=0; i<tabs.length; i++) {
				var tab = tabs[i];
				this.tabInstances.push(new Tab(tab, this, i));
				
				if (tab.visible == 'true') {
					this.visibleTabIndex = i;
				}
			}
		}
		this.contextManager = new ContextManager(this, this.workSpaceGlobalInfo);
		this.wiring = new Wiring(this, this.workSpaceGlobalInfo);

		this.loaded = true;

		//set the visible tab. It will be displayed as current tab afterwards
		this.visibleTab = this.tabInstances[this.visibleTabIndex];
		

		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
	}

	var onError = function (transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
 			                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
			                  true);
		} else {
			msg = transport.status + " " + transport.statusText;
		}
		alert(msg);
	}
	
	
	// ****************
	// PUBLIC METHODS
	// ****************
	
	WorkSpace.prototype.igadgetLoaded = function(igadgetId) {
		//TODO: propagate only the values that affect to the Gadget with iGadgetId as identifier
		// in other case, this function always propagate the variable value to all the gadgets and there are two problems:
		// - there are non-instantiated gadgets -> the handler doesn't exist
		// - the instantiated gadgets will re-execute their handlers
		
		if (!this.igadgetIdsLoaded.elementExists(igadgetId)){ //to prevent from propagating unnecessary initial values
 	    	this.igadgetIdsLoaded.push(igadgetId);
 	    	this.wiring.propagateInitialValues(true);
		}
	}
	
	WorkSpace.prototype.unload = function(){
		
		// After that, tab info is managed	
		for (var i=0; i<this.tabInstances.length; i++) {
			this.unloadTab(i);
		}
		this.tabInstances.length = 0;
		this.wiring.unload();
		this.contextManager.unload();
	}
	
	WorkSpace.prototype.unloadTab = function(tabId){
		var tab = this.tabInstances[tabId];
		
		this.varManager.removeWorkspaceVariable(tab.connectable.variable.id);
		
		tab.connectable.destroy();
		tab.destroy();
		
		this.visibleTab = null;
	}
	
	WorkSpace.prototype.removeIGadgetData = function(iGadgetId) {
			this.varManager.removeInstance(iGadgetId);
			this.wiring.removeInstance(iGadgetId);
			this.contextManager.removeInstance(iGadgetId);	
	}
	
	WorkSpace.prototype.sendBufferedVars = function () {
		this.varManager.sendBufferedVars();
	} 
    
    
    WorkSpace.prototype.getName = function () {
    	return this.workSpaceState.name;
	}
	
    WorkSpace.prototype.getId = function () {
    	return this.workSpaceState.id;
	}
    
    WorkSpace.prototype.getWiring = function () {
    	return this.wiring;
	}
	    
    WorkSpace.prototype.getVarManager = function () {
    	return this.varManager;
	}
	
	WorkSpace.prototype.getActiveDragboard = function() {
		return this.visibleTab.getDragboard();
	}
	
	
	WorkSpace.prototype.downloadWorkSpaceInfo = function () {
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id, 'last_user': last_logged_user});
		PersistenceEngineFactory.getInstance().send_get(workSpaceUrl, this, loadWorkSpace, onError);
	}
	
	
	WorkSpace.prototype.getIgadget = function(igadgetId) {
		for (var i = 0; i < this.tabInstances.length; i++) {
			var igadget = this.tabInstances[i].getDragboard().getIGadget(igadgetId);
			
			if (igadget)
				return igadget;
		}
	}
	
	WorkSpace.prototype.getIGadgets = function() {
		if (!this.loaded)
			return;

		var iGadgets = new Array();
		for (var i = 0; i < this.tabInstances.length; i++) {
			iGadgets = iGadgets.concat(this.tabInstances[i].getDragboard().getIGadgets());
		}

		return iGadgets;
	}
	
	WorkSpace.prototype.getRelatedIGadgets = function(iGadgetId) {
		var iGadgets = new Array();
		var dragboard = null;
		var igadget = null;
		var id=null;
		
		var iGadgetIds = this.wiring.getRelatedIgadgets(iGadgetId);		
		for (var j = 0; j < iGadgetIds.length; j++) {
			id = iGadgetIds[j];
			for (var i = 0; i < this.tabInstances.length; i++) {
				dragboard = this.tabInstances[i].getDragboard();
				igadget = dragboard.getIGadget(id);			
				if (igadget)
					iGadgets.push(igadget);
			}
		}
		return iGadgets;
	}
	
	/**** Display the IGadgets menu ***/
	WorkSpace.prototype.paint = function() {
		this.tabsContainerElement.update();
		//initialize the list of igadget loaded identifiers
		this.igadgetIdsLoaded = new Array();
		
		//Create a menu for each tab of the workspace and paint it as main screen.
		var scrolling = 0;
		var step = 0;
		if (document.body.getAttribute("orient") == "portrait")
			step = this.scrollPortrait;
		else
			step = this.scrollLandscape;
		
		for(var i=0;i<this.tabInstances.length;i++){
			this.tabInstances[i].show(scrolling, i);
			scrolling += step;
		}
		//show the menu
		this.tabsContainerElement.setStyle({display: "block"});
		
		window.scrollTo(this.visibleTabIndex * step, 1);
	}
	
	WorkSpace.prototype.hide = function() {
		this.tabsContainerElement.setStyle({display: "none"});
	}
	
	WorkSpace.prototype.show = function() {
		//initialize the list of igadget loaded identifiers
		delete this.igadgetIdsLoaded;
		this.igadgetIdsLoaded = new Array();
		
		//show the igadget list and hide the dragboard
		this.visibleTab.getDragboard().hide();
		this.tabsContainerElement.setStyle({display: "block"});
		var step = 0;
		if (document.body.getAttribute("orient") == "portrait")
			step = this.scrollPortrait;
		else
			step = this.scrollLandscape;
		window.scrollTo(this.visibleTabIndex * step, 1);
	}
	
	WorkSpace.prototype.getTab = function(tabId) {
		return this.tabInstances.getElementById(tabId);
	}
	
	WorkSpace.prototype.setTab = function(tab) {
		if (!this.loaded)
			return;
		this.visibleTab = tab;
		this.visibleTab.show();
		
	}
	
	WorkSpace.prototype.getVisibleTab = function() {
		if (!this.loaded)
			return;
		
		return this.visibleTab;
	}
	
	WorkSpace.prototype.getNumberOfTabs = function() {
		return this.tabInstances.length;
	}
	
	WorkSpace.prototype.updateVisibleTab = function(index) {
		if (this.visibleTabIndex != index) {
			this.visibleTabIndex = index;	
			this.visibleTab = this.tabInstances[this.visibleTabIndex];
		}
	}
	
	WorkSpace.prototype.updateLayout = function(orient) {
		//notify this to the ContextManager. The orient value may be "portrait" or "landscape".
		this.contextManager.notifyModifiedConcept(Concept.prototype.ORIENTATION, orient);
		//TODO: change the tab labels according to the orientation
		var step = 0;
		var scrolling = 0;
		if (orient=="portrait"){
			step = this.scrollPortrait;
			this.tabView.set("maxTabs", 3);
		}
		else{ //landscape
			step = this.scrollLandscape;
			this.tabView.set("maxTabs", 4);
		}
		for(var i=0;i<this.tabInstances.length;i++){
			this.tabInstances[i].updateLayout(scrolling);
			scrolling += step;
		}
		
		//set current scroll
		if (OpManagerFactory.getInstance().visibleLayer == "tabs_container")
			window.scrollTo(this.visibleTabIndex * step, 1);
		else
			window.scrollTo(0, 1);
	}
	
	WorkSpace.prototype.goTab = function(tab){
		// DO NOTHING -> to avoid modifying the varManager 
	}
	
	WorkSpace.prototype.tabExists = function(tabName){
		for(var i=0;i<this.tabInstances.length;i++){
			if(this.tabInstances[i].tabInfo.name == tabName)
				return true;
		}
		return false;
	}
	
	WorkSpace.prototype.showRelatedIgadget = function(iGadgetId, tabId){
		this.visibleTab = this.getTab(tabId);
		this.visibleTabIndex = this.tabInstances.indexOf(this.visibleTab);
		this.visibleTab.getDragboard().paintRelatedIGadget(iGadgetId);
	}

    // *****************
    //  CONSTRUCTOR
    // *****************

	this.workSpaceState = workSpaceState;
	this.workSpaceGlobal = null;
	this.varManager = null;
	this.tabInstances = new Array();
	this.wiring = null;
	this.varManager = null;
	this.loaded = false;
	this.visibleTab = null;
	this.visibleTabIndex = 0;
	
	this.tabView = new MYMW.ui.TabView("dragboard", { maxTabs : 3 });
	this.igadgetIdsLoaded = null;
	
	this.tabsContainerElement = $('tabs_container');
	//scrolling
	this.scrollPortrait = 320;
	this.scrollLandscape = 480;
	
}


function Tab (tabInfo, workSpace, index) {
				
    // ****************
    // PUBLIC METHODS
    // ****************

	Tab.prototype.destroy = function(){
		this.dragboard.destroy();		
		delete this;
	}
	
	/*																		*
	 *  Paint the igadget list of this tab. It is used in the first charge.	*
	 *																		*/
	Tab.prototype.show = function (scrollLeft, index) {
		var iGadgets = this.dragboard.getIGadgets();
	    var html="";
	    var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
	    //var handler = function(){this.dragboard.setVisibleIGadget(iGadgets[i]);this.dragboard.paint();}.bind(this);
	    
	    html+= '<div class="container tab" id="'+this.tabName+'" style="left:'+scrollLeft+'px">';
		html+= '<div class="toolbar anchorTop"><a href="javascript:OpManagerFactory.getInstance().showWorkspaceMenu()" class="back_button"><span class="menu_text">Menu</span></a>' +
				'<h1>'+ nameToShow +'</h1>';
		if (isAnonymousUser)
			html +='<a href="/accounts/login/?next=/" class="logout">Sign-in</a></div>';
		else
			html +='<a href="/logout" class="logout">Exit</a></div>';
		html+= '<div class="tab_content">';
		for(i=0;i<iGadgets.length;i++){
			html+= '<div class="igadget_item">';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">';
			html+= '<img class="igadget_icon" src="'+iGadgets[i].getGadget().getIPhoneImageURI()+'" />'
			html+= '</a>';
			html+= '<a href="javascript:OpManagerFactory.getInstance().showDragboard('+iGadgets[i].id+');">'+iGadgets[i].getVisibleName()+'</a>';
			html+= '</div>';
		}
		html+= '</div>';
		var tabsLength = this.workSpace.getNumberOfTabs();
		if (tabsLength > 1){
			html += '<div class="navbar">';
			for(i=0;i<tabsLength;i++){
				if (i!=index)
					html += '<img src="/ezweb/images/iphone/greyball.png"></img>'
				else
					html += '<img src="/ezweb/images/iphone/whiteball.png"></img>'
			}
			html+= '</div>';
		}	
		html+= '</div>';
	    new Insertion.Bottom(this.tabsContainer, html);
	    this.tabElement = $(this.tabName);
	}
	
	Tab.prototype.updateLayout = function (scrollLeft) {
		if (this.tabElement)
			this.tabElement.setStyle({left: scrollLeft+"px"});
	}

	Tab.prototype.getDragboard = function () {
		return this.dragboard;
	}
	
	Tab.prototype.getId = function () {
		return this.tabInfo.id;
	}

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.index = index;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	this.tabsContainer=$('tabs_container');
	this.tabElement = null;
}


var OpManagerFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function OpManager () {
	        
	    // ****************
		// CALLBACK METHODS 
		// ****************
		
		var loadEnvironment = function (transport) {
			// JSON-coded user tabspaces
			var response = transport.responseText;
			var workSpacesStructure = eval ('(' + response + ')');

			var workSpaces = workSpacesStructure.workspaces;

			for (var i = 0; i<workSpaces.length; i++) {
			    var workSpace = workSpaces[i];
			    
			    this.workSpaceInstances[workSpace.id] = new WorkSpace(workSpace);

			    if (workSpace.active == "true") {
			    	this.activeWorkSpace=this.workSpaceInstances[workSpace.id];
			    }
			    
			}
		
			// Total information of the active workspace must be downloaded!
			this.activeWorkSpace.downloadWorkSpaceInfo();
		}
		
		var onError = function (transport, e) {
		    alert("error en loadEnvironment");
		}

		
		// *********************************
		// PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		// Singleton modules
		//this.contextManagerModule = null;
		this.persistenceEngine = PersistenceEngineFactory.getInstance();
		
		this.loadCompleted = false;
		this.visibleLayer = null;
		
		// Variables for controlling the collection of wiring and dragboard instances of a user
		this.workSpaceInstances = new Hash();
		this.activeWorkSpace = null;
		
		// workspace menu element
		this.workspaceMenuElement = $('workspace_menu');
		this.workspaceListElement = $('workspace_list');

		
		// ****************
		// PUBLIC METHODS 
		// ****************
		OpManager.prototype.logIGadgetError = function (igadget, msg, type) {
			console.log(msg);
		}
				
		OpManager.prototype.sendBufferedVars = function () {
			this.activeWorkSpace.sendBufferedVars();
		}
		
		OpManager.prototype.changeActiveWorkSpace = function (workSpace) {
			if(this.activeWorkSpace != null){
				this.activeWorkSpace.unload();
			}
			
		    this.activeWorkSpace = workSpace;
		    
		    this.activeWorkSpace.downloadWorkSpaceInfo();			    					    
		}					
		
		OpManager.prototype.sendEvent = function (gadget, event, value) {
		    this.activeWorkSpace.getWiring().sendEvent(gadget, event, value);
		}

		OpManager.prototype.loadEnviroment = function () {
			LayoutManagerFactory.getInstance().resizeWrapper();
			// First, global modules must be loades (Showcase, Catalogue)
			// Showcase is the first!
			// When it finish, it will invoke continueLoadingGlobalModules method!
			this.showcaseModule = ShowcaseFactory.getInstance();
			this.showcaseModule.init();
			this.logs = LogManagerFactory.getInstance();
		}

		OpManager.prototype.igadgetLoaded = function (igadgetId) {
			this.activeWorkSpace.igadgetLoaded(igadgetId);
		}
				
		OpManager.prototype.showActiveWorkSpace = function () {
			var workSpaceIds = this.workSpaceInstances.keys();
			var disabledWorkSpaces= [];
			var j=0;
			for (var i=0; i<workSpaceIds.length; i++) {
				var workSpace = this.workSpaceInstances[workSpaceIds[i]];
				if (workSpace != this.activeWorkSpace) {
					disabledWorkSpaces[j] = workSpace;					
					j++;
				}
				
			}
			this.activeWorkSpace.paint();
		}
		
		OpManager.prototype.continueLoadingGlobalModules = function (module) {
		    // Asynchronous load of modules
		    // Each singleton module notifies OpManager it has finished loading!
		    if (module == Modules.prototype.SHOWCASE) {
		    	// All singleton modules has been loaded!
		    	// It's time for loading tabspace information!
		    	this.loadActiveWorkSpace();
		    	return;
		    }		    
		    if (module == Modules.prototype.ACTIVE_WORKSPACE) {
		    	this.loadCompleted = true;
		    	if (!this.visibleLayer){
		    		this.showActiveWorkSpace(this.activeWorkSpace);
		    		this.visibleLayer= "tabs_container";
		    	}
		    	//TODO: remove this variable when the MYMWTab Framework is updated
    			tabview = this.activeWorkSpace.tabView;
		    	return;
		    }
		}

		OpManager.prototype.loadActiveWorkSpace = function () {
		    // Asynchronous load of modules
		    // Each singleton module notifies OpManager it has finished loading!

		    this.persistenceEngine.send_get(URIs.GET_POST_WORKSPACES, this, loadEnvironment, onError)   
		}

		//Operations on workspaces
		
		OpManager.prototype.workSpaceExists = function (newName){
			var workSpaceValues = this.workSpaceInstances.values();
			for(var i=0;i<workSpaceValues.length;i++){
			if(workSpaceValues[i].workSpaceState.name == newName)
				return true;
			}
			return false;
		}	

		
		OpManager.prototype.showDragboard = function(iGadgetId){
			this.activeWorkSpace.getActiveDragboard().paint(iGadgetId);
			this.visibleLayer= "dragboard";
		}
		
		OpManager.prototype.showGadgetsMenu = function(){
			if (this.visibleLayer=="workspace_menu")
				this.workspaceMenuElement.setStyle({display: "none"});
			this.visibleLayer= "tabs_container";
			this.activeWorkSpace.show();
		}
		
		OpManager.prototype.showGadgetsMenuFromWorskspaceMenu = function(){
			if (!this.loadCompleted){
				setTimeout(function(){OpManagerFactory.getInstance().showGadgetsMenuFromWorskspaceMenu()}, 100);
			}
			this.workspaceMenuElement.setStyle({display: "none"});
			this.showActiveWorkSpace(this.activeWorkSpace);
		    this.visibleLayer= "tabs_container";
		}
		
		OpManager.prototype.showRelatedIgadget = function(iGadgetId, tabId){
			this.activeWorkSpace.showRelatedIgadget(iGadgetId, tabId);
		}
		
		OpManager.prototype.markRelatedIgadget = function(iGadgetId){
			this.activeWorkSpace.getActiveDragboard().markRelatedIgadget(iGadgetId);
		}
		
		OpManager.prototype.showWorkspaceMenu = function( ){
			if (this.visibleLayer == "tabs_container")
				this.activeWorkSpace.hide();
			this.visibleLayer= "workspace_menu";
			//show the workspace list and the "add mashup" option
			this.workspaceMenuElement.setStyle({display: "block"});
			
			//generate the workspace list
			var wkeys = this.workSpaceInstances.keys();
						
			var html ="<ul>";
			for (i=0;i<wkeys.length;i++){
				wname = this.workSpaceInstances[wkeys[i]].getName();
				if (this.workSpaceInstances[wkeys[i]] == this.activeWorkSpace)
					html += "<li id='"+this.workSpaceInstances[wkeys[i]].getId()+"_item' class='selected'>" + wname +"<small>★</small></li>";
				else
					html += "<li id='"+this.workSpaceInstances[wkeys[i]].getId()+"_item'><a href='javascript:OpManagerFactory.getInstance().selectActiveWorkspace("+wkeys[i]+");'>" + wname +"</a></li>";
			}
			html += "<li class='bold'><a href='javascript:CatalogueFactory.getInstance().loadCatalogue()' class='arrow'>Add Mobile Mashup</a></li>";
			
			this.workspaceListElement.update(html);
		}
		
		OpManager.prototype.selectActiveWorkspace = function(workspaceKey){
			var newWorkspace = this.workSpaceInstances[workspaceKey];
			var newElement = $(newWorkspace.getId()+"_item");
			var oldElement = $(this.activeWorkSpace.getId()+"_item");
			
			newElement.update(newWorkspace.getName() +"<small>★</small>");
			newElement.className = "selected";
			oldElement.update("<a href='javascript:OpManagerFactory.getInstance().selectActiveWorkspace("+this.activeWorkSpace.workSpaceGlobalInfo.workspace.id+");'>" + this.activeWorkSpace.getName() +"</a>");
			oldElement.className = "";
			this.loadCompleted = false;
			this.changeActiveWorkSpace(newWorkspace);
		}

	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new OpManager();
         	}
         	return instance;
       	}
	}
	
}();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GADGETVARIABLE (Parent Class) <<GADGET>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function GadgetVariable (iGadgetId, name) {
	this.varManager = null;
	this.iGadgetId = null;
	this.name = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super keyboard emulation)
//////////////////////////////////////////////
 
GadgetVariable.prototype.GadgetVariable = function (iGadget_, name_) {
    this.varManager = OpManagerFactory.getInstance().activeWorkSpace.getVarManager();  
  
    this.iGadgetId = iGadget_;
    this.name = name_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

GadgetVariable.prototype.get = function () { 
	return this.varManager.getVariable(this.iGadgetId, this.name);
}  

GadgetVariable.prototype.set = function (value) { } 

GadgetVariable.prototype.register = function (handler) { } 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RGadgetVariable(iGadget_, name_, handler_) {
	GadgetVariable.prototype.GadgetVariable.call(this, iGadget_, name_);
  
	this.handler = handler_;

	this.register(handler_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RGadgetVariable.prototype = new GadgetVariable;

//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RGadgetVariable.prototype.register = function (handler) { 
	this.varManager.registerVariable(this.iGadgetId, this.name, handler);
} 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWGADGETVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWGadgetVariable(iGadget_, name_) {
	GadgetVariable.prototype.GadgetVariable.call(this, iGadget_, name_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWGadgetVariable.prototype = new GadgetVariable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

 

//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RWGadgetVariable.prototype.set = function (value) {  
	this.varManager.setVariable(this.iGadgetId, this.name, value)
} 



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VARIABLE (Parent Class)  <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Variable (id, iGadget, name, varManager) {
        // True when a the value of the variable has changed and the callback has not been invoked! 
        this.annotated = false;
	this.varManager = null;
	this.id = null;
	this.iGadget = null;
	this.name = null;
	this.label = null;
	this.aspect = null;
	this.value = null;
}

//////////////////////////////////////////////
// PARENT CONTRUCTOR (Super class emulation)
//////////////////////////////////////////////
 
Variable.prototype.Variable = function (id, iGadget_, name_, aspect_, varManager_,  value_, label_) {
	this.varManager = varManager_;
	this.id = id;
	this.iGadget = iGadget_;
    this.name = name_;
    this.label = label_;
	this.aspect = aspect_;
	this.value = value_;
}

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////

Variable.prototype.get = function () {
	return this.value;
}

Variable.prototype.setHandler = function () { } 

Variable.prototype.set = function (value) { } 

Variable.prototype.annotate = function (value) {
        this.annotated = true;
        this.value=value;
} 

Variable.prototype.assignConnectable = function (connectable) {
	this.connectable = connectable;
}

Variable.prototype.getConnectable = function () {
	return this.connectable;
}

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////

Variable.prototype.EVENT = "EVEN"  
Variable.prototype.SLOT = "SLOT"  
Variable.prototype.USER_PREF = "PREF"  
Variable.prototype.PROPERTY = "PROP"  
Variable.prototype.EXTERNAL_CONTEXT = "ECTX"
Variable.prototype.GADGET_CONTEXT = "GCTX"
Variable.prototype.INOUT = "CHANNEL"
Variable.prototype.TAB = "TAB"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RVARIABLE (Derivated class) <<PLATFORM>>
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RVariable(id, iGadget_, name_, aspect_, varManager_, value_, label_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_, label_);
  
	this.handler = null;
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
////////////////////////////////////////////// 



//////////////////////////////////////////////
// OVERWRITTEN METHODS
//////////////////////////////////////////////

RVariable.prototype.setHandler = function (handler_) { 
	this.handler = handler_;
} 

RVariable.prototype.set = function (newValue) {
    if (this.annotated) {
	// If not annotated, the value must be managed!
        // And it must be changed to NOT annotated!
	this.annotated = false;	

	var varInfo = [{id: this.id, value: newValue, aspect: this.aspect}];
	switch (this.aspect) {
		case Variable.prototype.USER_PREF:
		case Variable.prototype.EXTERNAL_CONTEXT:
		case Variable.prototype.GADGET_CONTEXT:
		case Variable.prototype.SLOT:
			this.varManager.markVariablesAsModified(varInfo);
			
			this.value = newValue;
			
			if (this.handler) {
				try {
					this.handler(newValue);
				} catch (e) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name, exceptionMsg: e};
					var msg = interpolate(gettext("Error in the handler of the \"%(varName)s\" RVariable in iGadget %(iGadgetId)s: %(exceptionMsg)s."), transObj, true);
					OpManagerFactory.getInstance().logIGadgetError(this.iGadget, msg, Constants.Logging.ERROR_MSG);
				}
			} else {
				var opManager = OpManagerFactory.getInstance();
			        var iGadget = opManager.activeWorkSpace.getIgadget(this.iGadget);
				if (iGadget.loaded) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name};
					var msg = interpolate(gettext("IGadget %(iGadgetId)s does not provide a handler for the \"%(varName)s\" RVariable."), transObj, true);
					opManager.logIGadgetError(this.iGadget, msg, Constants.Logging.WARN_MSG);
				}
			}
			
			break;
		case Variable.prototype.TAB:
			this.varManager.markVariablesAsModified(varInfo);
			
			OpManagerFactory.getInstance().activeWorkSpace.goTab(this.connectable.tab);
			break;
		default:
			break;
	}
	
    }
}

RVariable.prototype.refresh = function() {
	switch (this.aspect) {
		case Variable.prototype.USER_PREF:
		case Variable.prototype.EXTERNAL_CONTEXT:
		case Variable.prototype.GADGET_CONTEXT:
		case Variable.prototype.SLOT:
			if (this.handler) {
				try {
					this.handler(this.value);
				} catch (e) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name, exceptionMsg: e};
					var msg = interpolate(gettext("Error in the handler of the \"%(varName)s\" RVariable in iGadget %(iGadgetId)s: %(exceptionMsg)s."), transObj, true);
					OpManagerFactory.getInstance().logIGadgetError(this.iGadget, msg, Constants.Logging.ERROR_MSG);
				}
			} else {
				var opManager = OpManagerFactory.getInstance();
				var iGadget = opManager.activeWorkSpace.getIgadget(this.iGadget);
				if (iGadget.loaded) {
					var transObj = {iGadgetId: this.iGadget, varName: this.name};
					var msg = interpolate(gettext("IGadget %(iGadgetId)s does not provide a handler for the \"%(varName)s\" RVariable."), transObj, true);
					opManager.logIGadgetError(this.iGadget, msg, Constants.Logging.WARN_MSG);
				}
			}
			break;
		case Variable.prototype.TAB:
		default:
			break;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RWVARIABLE (Derivated class)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function RWVariable(id, iGadget_, name_, aspect_, varManager_, value_, label_) {
	Variable.prototype.Variable.call(this, id, iGadget_, name_, aspect_, varManager_, value_, label_);
}

//////////////////////////////////////////////
// DEFINING INHERITANCE
//////////////////////////////////////////////

RWVariable.prototype = new Variable;

//////////////////////////////////////////////
// PUBLIC METHODS TO BE INHERITANCED
//////////////////////////////////////////////


RWVariable.prototype.set = function (value_) {
    this.varManager.incNestingLevel();

    if (this.value != value_) {
    	// This variable was modified
    	this.value = value_;
	
        this.varManager.markVariablesAsModified([this]);
    }

    // Propagate changes to wiring module
    // Only when variable is an Event, the connectable must start propagating
    // When variable is INOUT, is the connectable who propagates
    switch (this.aspect){
		case Variable.prototype.EVENT:   
			if (this.connectable != null) {
				this.connectable.propagate(this.value, false);
				break;
			}
		default:
			break;
    }

    // This will save all modified vars if we are the root event
    this.varManager.decNestingLevel();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 




function VarManager (_workSpace) {
	
	VarManager.prototype.MAX_BUFFERED_REQUESTS = 10 
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	

	VarManager.prototype.parseVariables = function (workSpaceInfo) {	
		// Igadget variables!
		var tabs = workSpaceInfo['workspace']['tabList'];
		
		for (var i=0; i<tabs.length; i++) {
			var igadgets = tabs[i]['igadgetList'];
			
			for (var j=0; j<igadgets.length; j++) {
				this.parseIGadgetVariables(igadgets[j]);
			}
		}
		
		// Workspace variables (Connectables and future variables!)
		var ws_vars = workSpaceInfo['workspace']['workSpaceVariableList'];
				
		this.parseWorkspaceVariables(ws_vars);
	}
	

	VarManager.prototype.parseWorkspaceVariables = function (ws_vars) {
		for (var i = 0; i<ws_vars.length; i++) {
			this.parseWorkspaceVariable(ws_vars[i]);
		}		
	}
	
	VarManager.prototype.sendBufferedVars = function () {
		// Asynchronous handlers 
		function onSuccess(transport) {
			//varManager.resetModifiedVariables(); Race Condition
		}

		function onError(transport, e) {
			var msg;
			if (e) {
				msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
				                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
				                  true);
			} else {
				msg = transport.status + " " + transport.statusText;
			}
			msg = interpolate(gettext("Error saving variables to persistence: %(errorMsg)s."),
			                          {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}
		
		// Max lenght of buffered requests have been reached. Uploading to server!
		if (this.igadgetModifiedVars.length > 0 || this.workspaceModifiedVars.length > 0) {
						
			var variables = {};
			
			variables['igadgetVars'] = this.igadgetModifiedVars;
			variables['workspaceVars'] = this.workspaceModifiedVars;
			
			var param = {variables: Object.toJSON(variables)};
			
			var uri = URIs.PUT_VARIABLES.evaluate({workspaceId: this.workSpace.getId()});

			PersistenceEngineFactory.getInstance().send_update(uri, param, this, onSuccess, onError);
			this.resetModifiedVariables();
		}
	}
	
	VarManager.prototype.parseWorkspaceVariable = function (ws_var) {
		var id = ws_var.id;
		var name = ws_var.name;
		var aspect = ws_var.aspect;
		var value = ws_var.value;
			
		switch (aspect) {
			case Variable.prototype.INOUT:
				this.workspaceVariables[id] = new RWVariable(id, null, name, aspect, this, value);
				break;
			case Variable.prototype.TAB:
				this.workspaceVariables[id] = new RVariable(id, null, name, aspect, this, value);
				break;
		}	
	}
	
	VarManager.prototype.removeWorkspaceVariable = function (ws_varId) {
		delete this.workspaceVariables[ws_varId];
		this.workspaceModifiedVars.removeById(ws_varId);
	}
	
	VarManager.prototype.parseIGadgetVariables = function (igadget) {
		var igadgetVars = igadget['variables'];
		var objVars = []
		for (var i = 0; i<igadgetVars.length; i++) {
			var id = igadgetVars[i].id;
			var igadgetId = igadgetVars[i].igadgetId;
			var name = igadgetVars[i].name;
			var label = igadgetVars[i].label;
			var aspect = igadgetVars[i].aspect;
			var value = igadgetVars[i].value;
				
			switch (aspect) {
				case Variable.prototype.PROPERTY:
				case Variable.prototype.EVENT:
					objVars[name] = new RWVariable(id, igadgetId, name, aspect, this, value, label);
					this.variables[id] = objVars[name];
					break;
				case Variable.prototype.EXTERNAL_CONTEXT:
				case Variable.prototype.GADGET_CONTEXT:
				case Variable.prototype.SLOT:
				case Variable.prototype.USER_PREF:
					objVars[name] = new RVariable(id, igadgetId, name, aspect, this, value, label);
					this.variables[id] = objVars[name];
					break;
			}
		}
		
		this.iGadgets[igadget['id']] = objVars;
		
	}
		
	VarManager.prototype.registerVariable = function (iGadgetId, variableName, handler) {
		var variable = this.findVariable(iGadgetId, variableName);

		if (variable) {
			variable.setHandler(handler);
		} else {
			var transObj = {iGadgetId: iGadgetId, varName: variableName};
			var msg = interpolate(gettext("IGadget %(iGadgetId)s does not have any variable named \"%(varName)s\".\nIf you need it, please insert it into the gadget's template."), transObj, true);
			OpManagerFactory.getInstance().logIGadgetError(iGadgetId, msg, Constants.Logging.ERROR_MSG);
		}
	}
	
	VarManager.prototype.assignEventConnectable = function (iGadgetId, variableName, wEvent) {
		var variable = this.findVariable(iGadgetId, variableName);
		variable.assignEvent(wEvent);
	}
	
	VarManager.prototype.getVariable = function (iGadgetId, variableName) {
		var variable = this.findVariable(iGadgetId, variableName);
		
		// Error control
		
		return variable.get();
	}
	
	VarManager.prototype.setVariable = function (iGadgetId, variableName, value) {
		var variable = this.findVariable(iGadgetId, variableName);
		
		variable.set(value);
	}

	VarManager.prototype.addInstance = function (iGadget, igadgetInfo) {
		this.parseIGadgetVariables(igadgetInfo);
	}
	
	VarManager.prototype.removeInstance = function (iGadgetId) {		
		delete this.iGadgets[iGadgetId];
		
		this.removeIGadgetVariables(iGadgetId);
	}
	
	
	VarManager.prototype.removeIGadgetVariables = function (iGadgetId) {	
		var variables_ids = this.variables.keys()
		
		for (var i=0; i<variables_ids.length; i++) {			
			if (this.variables[variables_ids[i]].iGadget == iGadgetId) {
				this.igadgetModifiedVars.removeById(variables_ids[i]);
				delete this.variables[variables_ids[i]];
			}
		}
	}
	
	VarManager.prototype.unload = function () {	
		delete this;
	}

	VarManager.prototype.commitModifiedVariables = function() {		
		//If it have not been buffered all the requests, it's not time to send a PUT request
		if (this.buffered_requests < VarManager.prototype.MAX_BUFFERED_REQUESTS) {
			this.buffered_requests++;
			return
		}

		this.sendBufferedVars();
	}

	VarManager.prototype.createWorkspaceVariable = function(name) {
		var provisional_id = new Date().getTime();
		
		return new RWVariable(provisional_id, null, name, Variable.prototype.INOUT, this, "");
		
	}
	
	VarManager.prototype.addWorkspaceVariable = function(id, variable) {
		this.workspaceVariables[id] = variable;
	}

	VarManager.prototype.getWorkspaceVariableById = function(varId) {
		return this.workspaceVariables[varId];
	}

	VarManager.prototype.initializeInterface = function () {
	    // Calling all SLOT vars handler
	    var variable;
	    var vars;
	    var varIndex;
	    var gadgetIndex;

	    for (gadgetIndex in this.iGadgets) {
		vars = this.iGadgets[gadgetIndex];

		for (varIndex in vars) {
		    variable = vars[varIndex];

		    if (variable.aspect == "SLOT" && variable.handler) {
			try {
			    variable.handler(variable.value);
			} catch (e) {
			}
		    }
		}
		
	    }
	}


	VarManager.prototype.markVariablesAsModified = function (variables) {
		var varCollection;
		
		for (var j=0; j < variables.length; j++) {
			var variable = variables[j];
			
			// Is it a igadgetVar or a workspaceVar?
			if (variable.aspect == Variable.prototype.INOUT
				|| variable.aspect == Variable.prototype.TAB) {
				varCollection = this.workspaceModifiedVars;
			} else {
				varCollection = this.igadgetModifiedVars;
			}
		 
			for (var i=0; i<varCollection.length; i++) {
			    var modVar = varCollection[i];
		
			    if (modVar.id == variable.id) {
					modVar.value = variable.value;
					return;
			    }	
			}

			//It's doesn't exist in the list
			//It's time to create it!
			var varInfo = {}
			
			varInfo['id'] = variable.id
			varInfo['value'] = variable.value
			
			varCollection.push(varInfo);	    
		}
	
	}

	VarManager.prototype.incNestingLevel = function() {
	    this.nestingLevel++;
	}

	VarManager.prototype.decNestingLevel = function() {
	    this.nestingLevel--;
	    if (this.nestingLevel == 0)
		this.commitModifiedVariables();
	}

	VarManager.prototype.resetModifiedVariables = function () {
	    this.nestingLevel = 0;
	    this.buffered_requests = 0;
	    this.igadgetModifiedVars = [];
	    this.workspaceModifiedVars = [];
	}
	
	VarManager.prototype.getVariableById = function (varId) {
		return this.variables[varId];
	}
	
	VarManager.prototype.getVariableByName = function (igadgetId, varName) {
		return this.findVariable(igadgetId, varName);
	}
	
	// *********************************
	// PRIVATE VARIABLES AND CONSTRUCTOR
	// *********************************
	
	VarManager.prototype.findVariable = function (iGadgetId, name) {
		var variables = this.iGadgets[iGadgetId];
		var variable = variables[name];
	
		return variable;
	}

	this.workSpace = _workSpace;
	this.iGadgets = new Hash();
	this.variables = new Hash();
	
	// For now workspace variables must be in a separated hash table, because they have a
	// different identifier space and can collide with the idenfiers of normal variables
	this.workspaceVariables = new Hash();
	
	this.igadgetModifiedVars = []
	this.workspaceModifiedVars = []
	
	this.nestingLevel = 0;
	
	this.buffered_requests = 0;
	
	// Creation of ALL EzWeb variables regarding one workspace
	this.parseVariables(this.workSpace.workSpaceGlobalInfo);
}


/**
 * @author luismarcos.ayllon
 */

// This module provides a set of gadgets which can be deployed into dragboard as gadget instances 
var ShowcaseFactory = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	// *********************************
	// CONSTRUCTOR
	// *********************************
	function Showcase () {
		
		// ******************
		// STATIC VARIABLES
		// ******************
	    Showcase.prototype.MODULE_HTML_ID = "showcase";

		// ****************
		// CALLBACK METHODS 
		// ****************

		// Load gadgets from persistence system
		loadGadgets = function (receivedData_) {
			var response = receivedData_.responseText;
			var jsonGadgetList = eval ('(' + response + ')');
		
			// Load all gadgets from persitence system
			for (var i = 0; i<jsonGadgetList.length; i++) {
				var jsonGadget = jsonGadgetList[i];
				var gadget = new Gadget (jsonGadget, null);
				var gadgetId = gadget.getVendor() + '_' + gadget.getName() + '_' + gadget.getVersion();
				
				// Insert gadget object in showcase object model
				_gadgets[gadgetId] = gadget;
			}
			
			// Showcase loaded
			_loaded = true;
			_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			
		}
		
		// Error callback (empty gadget list)
		onErrorCallback = function (receivedData_) {
			_loaded = true;
			_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
		}
		
		// *******************************
		// PRIVATE METHODS AND VARIABLES
		// *******************************
		var _gadgets = new Hash();
		var _loaded = false;
		var _opManager = OpManagerFactory.getInstance();
		var _persistenceEngine = PersistenceEngineFactory.getInstance();			
		
		// ****************
		// PUBLIC METHODS
		// ****************
		
		// Get a gadget by its gadgetID
		Showcase.prototype.getGadget = function (gadgetId_) {
			return _gadgets[gadgetId_];
		}
		
		
		Showcase.prototype.init = function () {
			// Initial load from persitence system
			_persistenceEngine.send_get(URIs.GET_GADGETS, this, loadGadgets, onErrorCallback);
		}
		
	}
	
	// *********************************
	// SINGLETON GET INSTANCE
	// *********************************
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Showcase();
          	}
         	return instance;
       	}
	}
	
}();


/**
 * @author luismarcos.ayllon
 */
function StringBuffer() {
	this.buffer = [];
};

StringBuffer.prototype.append = function append(string) {
	this.buffer.push(string);
	return this;
};

StringBuffer.prototype.toString = function toString() {
	return this.buffer.join("");
};

function ContextManager (workspace_, workSpaceInfo_) {
	
	
	// ***********************
	// PRIVATED FUNCTIONS 
	// ***********************
	
	// Adds all variables from workspace data model
	this._addContextVarsFromTemplate = function (cVars_, type_) {
		for (var i = 0; i < cVars_.size(); i++){
			var cVar = cVars_[i];
			cVar.setVarManager(this._workspace.getVarManager());
			if (this._name2Concept[cVar.getConceptName()] == null) {
				var msg = gettext("Context variable [%(varName)s] does not have a related concept so its value cannot be established.");
				msg = interpolate(msg, {varName: cVar.getName()}, true);
				LogManagerFactory.getInstance().log(msg);
				return;
			}
			var relatedConcept = this._concepts[this._name2Concept[cVar.getConceptName()]];
			relatedConcept.setType(type_);
			relatedConcept.addIGadgetVar(cVar);
		}
	}

	// Loads all concept from workspace data model. 
	this._loadConceptsFromWorkspace = function (workSpaceInfo_) {
		
		this._concepts = new Hash();
		this._name2Concept = new Hash();
		
		var conceptsJson = workSpaceInfo_['workspace']['concepts'];

		// Parses concepts json
		for (var i = 0; i < conceptsJson.length; i++) {
			var curConcept = conceptsJson[i];
			// Creates the concept
			if (curConcept.adaptor){
				var concept = new Concept(curConcept.concept, curConcept.adaptor);
			} else {
				var concept = new Concept(curConcept.concept, null);
			}
			this._concepts[curConcept.concept] = concept;

			// Sets the concept value
			if (curConcept.value){
				concept.setInitialValue(curConcept.value)
			}			 
			
			// Relates the concept name to all its concept
			for (var j = 0; j < curConcept.names.length; j++) {
				var cname = curConcept.names[j];
				
				if (this._name2Concept[cname] != null){
					var msg = interpolate(gettext("WARNING: concept name") + " '" + cname + "' " + gettext("is already related to") + " '" + this._name2Concept[cname] + "'. " + gettext("New related concept is") + " '" + curConcept.concept + "' %(errorMsg)s.", {errorMsg: transport.status}, true);
					LogManagerFactory.getInstance().log(msg);
				}
				this._name2Concept[cname] = curConcept.concept;	
			}	
		}
	}
	
	// Load igadget's context variables from workspace data model
	this._loadIGadgetContextVarsFromWorkspace = function (workSpaceInfo) {
		
		var tabs = workSpaceInfo['workspace']['tabList'];
		
		// Tabs in workspace
		for (var i=0; i<tabs.length; i++) {
			var currentTab = tabs[i]; 
			var igadgets = currentTab.igadgetList;
			
			// igadgets in tab
			for (var j=0; j<igadgets.length; j++) {
				var currentIGadget = igadgets[j];
				var variables = currentIGadget['variables'];
				
				// Variables of igadgets
				for (var k = 0; k < variables.length; k++) {
				var currentVar = variables[k];
					switch (currentVar.aspect) {
					case Variable.prototype.EXTERNAL_CONTEXT:
					case Variable.prototype.GADGET_CONTEXT:
						var contextVar = new ContextVar(currentIGadget.id, currentVar.name, currentVar.concept)
						contextVar.setVarManager(this._workspace.getVarManager());
						var relatedConcept = this._concepts[this._name2Concept[currentVar.concept]];
						if (relatedConcept){
							contextVar.setValue(relatedConcept._initialValue);
							relatedConcept.setType(currentVar.aspect);
							relatedConcept.addIGadgetVar(contextVar);
						}
						break;
					default:
						break;
					}
				}
			}
		}
		
		// Continues loading next module
		this._loaded = true;
	}
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	
	ContextManager.prototype.addInstance = function (iGadget_, template_) {
		if (!this._loaded)
		    return;
		
		if (template_ == null)
			return;

		this._addContextVarsFromTemplate(template_.getExternalContextVars(iGadget_.id), Concept.prototype.EXTERNAL);
		this._addContextVarsFromTemplate(template_.getGadgetContextVars(iGadget_.id), Concept.prototype.IGADGET);
	}
	
	
	ContextManager.prototype.propagateInitialValues = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].propagateIGadgetVarValues(iGadgetId_);
		}
	}

	ContextManager.prototype.removeInstance = function (iGadgetId_) {
		if (! this._loaded)
		    return;
	
		var keys = this._concepts.keys();
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			this._concepts[key].deleteIGadgetVars(iGadgetId_);
		}
	}

	ContextManager.prototype.notifyModifiedConcept = function (concept_, value_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		this._concepts[concept_].setValue(value_);
	}
	
	ContextManager.prototype.notifyModifiedGadgetConcept = function (igadgetid_, concept_, value_, preLoaded_) {
		if (! this._loaded)
		    return;
			
		if (! this._concepts[concept_])
			return;
			
		try{
			if (preLoaded_){
				this._concepts[concept_].getIGadgetVar(igadgetid_).setPreloadedValue(value_);
			}else{
				this._concepts[concept_].getIGadgetVar(igadgetid_).setValue(value_);	
			}
		}catch(e){
			// Do nothing, igadget has not variables related to this concept
		}
	}
	
	ContextManager.prototype.getWorkspace = function () {
		return this._workspace;
	}	


	ContextManager.prototype.unload = function () {

		// Delete all concept names
		var namekeys = this._name2Concept.keys();
		for (var i=0; i<namekeys.length; i++) {
			delete this._name2Concept[namekeys[i]];
		}
		delete this._name2Concept;
		
		// Delete all the concepts
		var conceptkeys = this._concepts.keys();
		for (var j=0; i<conceptkeys.length; j++) {
			this._concepts[conceptkeys[j]].unload();
			delete this._concepts[conceptkeys[j]];		
		}
		delete this._concepts;

		// Delete all the ContextManager attributes
		delete this._loaded;
		delete this._workspace;

		delete this;
	}


	// *********************************************
	// PRIVATE VARIABLES AND CONSTRUCTOR OPERATIONS
	// *********************************************

	this._loaded = false;
	this._concepts = new Hash();     // a concept is its adaptor an its value
	this._name2Concept = new Hash(); // relates the name to its concept
	this._workspace = workspace_;
		
	// Load all igadget context variables and concepts (in this order!)
	this._loadConceptsFromWorkspace (workSpaceInfo_);
	this._loadIGadgetContextVarsFromWorkspace (workSpaceInfo_);
}
function ContextVar(igadgetId_, varName_, conceptName_) {
	this._igadgetId = igadgetId_;
	this._varName = varName_;
	this._conceptName = conceptName_;
	this._varManager = null;
	this._value = null;
	this._gadgetLoaded = false;
}

ContextVar.prototype.getName = function () {
	return this._varName;
}

ContextVar.prototype.getIGadgetId = function () {
	return this._igadgetId;
}

ContextVar.prototype.getConceptName = function () {
	return this._conceptName;
}

ContextVar.prototype.getValue = function () {
	return this._value;
}

ContextVar.prototype.propagateValue = function () {
	if (this._gadgetLoaded)
		return;
	
	this._gadgetLoaded = true;
	this.setValue(this._value);
}

ContextVar.prototype.setValue = function (newValue_) {
	this._value = newValue_;
	if (this._varManager !=null) {
		var variable = this._varManager.getVariableByName(this._igadgetId, this._varName)
		
		variable.annotate(newValue_);
		variable.set(newValue_);
	}
}

ContextVar.prototype.setVarManager = function (varManager_) {
	this._varManager = varManager_;
}

ContextVar.prototype.unload = function () {
	delete this._igadgetId;
	delete this._varName;
	delete this._conceptName;
	delete this._varManager;
	delete this._value;
	
	delete this;
}

//////////////////////////////////////////////////////////
// Concept
//////////////////////////////////////////////////////////
function Concept(semanticConcept_, adaptor_) {
	this._semanticConcept = semanticConcept_;
	this._adaptor = adaptor_;
	this._type = null;
	this._value = null;
	this._initialValue = null;

	this._igadgetVars = new Array();

	this._initAdaptor = function (ivar_) {
		if (ivar_ == null){
			// Adaptor of External Context variable doesn't receives any parameter   
			eval ('new ' + adaptor_ + "()"); 
		}else{
			// Adaptor of Gadget Context variable receives the IGadget as parameter			
			eval ('new ' + adaptor_ + "("+ ivar_.getIGadgetId() +")");
		}
	}
	
}

// Known concept types
Concept.prototype.EXTERNAL = 'ECTX';
Concept.prototype.IGADGET = 'GCTX';

// Known concepts
Concept.prototype.USERNAME = "username";
Concept.prototype.LANGUAGE = "language";
Concept.prototype.WIDTH = "width";
Concept.prototype.WIDTHINPIXELS = "widthInPixels";
Concept.prototype.HEIGHT = "height";
Concept.prototype.HEIGHTINPIXELS = "heightInPixels";
Concept.prototype.XPOSITION = "xPosition";
Concept.prototype.YPOSITION = "yPosition";
Concept.prototype.LOCKSTATUS = "lockStatus";
Concept.prototype.ORIENTATION = "orientation";

Concept.prototype.getSemanticConcept = function () {
	return this._semanticConcept;
}

Concept.prototype.getAdaptor = function () {
	return this._adaptor;
}

Concept.prototype.getValue = function () {
	if (this._type == Concept.prototype.EXTERNAL){
		return this._value;
	}
	throw gettext("Concept does not have value, this is a Gadget Concept.");
}

Concept.prototype.setType = function (type_) {
	if (this._type == null){
		this._type = type_;
		switch (this._type) {
			case Concept.prototype.EXTERNAL:
				if (this._initialValue != null){
					this._value = this._initialValue;
				}
				break;
			default:
				this._initialValue = null;						
				break;
			}
	} else if (this._type != type_) {
		throw gettext("Unexpected change of concept type.");
	}
}

Concept.prototype.setValue = function (value_) {
	switch (this._type) {
		case Concept.prototype.IGADGET:
			throw gettext("Concept does not have value, this is a Gadget Concept.");
			break;
		default:
			this._value = value_;
			for (var i = 0; i < this._igadgetVars.length; i++){
				var ivar = this._igadgetVars[i];
				ivar.setValue(value_);
			} 
			break;
	}
}

Concept.prototype.setInitialValue = function (newValue_) {
	this._initialValue = newValue_;
}

Concept.prototype.propagateIGadgetVarValues = function (iGadget_) {
	for (var i = 0; i < this._igadgetVars.length; i++){
		var ivar = this._igadgetVars[i];
		if ((iGadget_ == null) || (ivar.getIGadgetId() == iGadget_))
			ivar.propagateValue();
	} 
}

Concept.prototype.addIGadgetVar = function (ivar_) {
	switch (this._type) {
		case Concept.prototype.EXTERNAL:
			if (this._value != null){
				ivar_.setValue(this._value);
				this._igadgetVars.push(ivar_);		
			}else{
				this._igadgetVars.push(ivar_);
				if (this._adaptor)
					this._initAdaptor(null);
			}
			break;
		case Concept.prototype.IGADGET:
			this._igadgetVars.push(ivar_);
			if (this._adaptor)
				this._initAdaptor(ivar_);
			break;
		default:
			throw gettext("Unexpected igadget variables. Concept does not have type yet.");
			break;
	}
}

Concept.prototype.deleteIGadgetVars = function (igadgetId_) {
	var i = 0;
	while (i < this._igadgetVars.length){
		var ivar = this._igadgetVars[i];
		if (ivar.getIGadgetId() == igadgetId_){
				this._igadgetVars.splice(i, 1);
		}else{
			i++;
		}
	}
}

Concept.prototype.getIGadgetVar = function (igadgetId_) {
	switch (this._type) {
		case Concept.prototype.IGADGET:
			for (var i = 0; i < this._igadgetVars.length; i++){
				var ivar = this._igadgetVars[i];
				if (ivar.getIGadgetId() == igadgetId_){
					return ivar;
				}
			}
			throw interpolate (gettext("%(concept)s Concept is not related to IGadget number %(var)s."), {'concept': this._semanticConcept, 'var': igadgetId_}, true)
			break;
		case Concept.prototype.EXTERNAL:
			throw gettext("This is a External Concept, 'getIGadgetVar' is only for Gadget Concept.");
			break;
		default:
			throw gettext("Concept does not have type yet.");
	}
}

Concept.prototype.unload = function () {
	
	// Delete all the igadget variables related to this concept
	var keys = this._igadgetVars.keys();
	for (var i=0; i<keys.length; i++) {
		this._igadgetVars[keys[i]].unload();
		delete this._igadgetVars[keys[i]];
	}
	
	// Delete all the Concept attributes
	delete this._semanticConcept;
	delete this._adaptor;
	delete this._type;
	delete this._value;
	delete this._initialValue;
	
	delete this.EXTERNAL;
	delete this.IGADGET;
	delete this.USERNAME;
	delete this.LANGUAGE;
	delete this.WIDTH;
	delete this.WIDTHINPIXELS;
	delete this.HEIGHT;
	delete this.HEIGHTINPIXELS;
	delete this.XPOSITION;
	delete this.YPOSITION;
	delete this.LOCKSTATUS;
	delete this.ORIENTATION;
	
	delete this;

}




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



/**
 * This class represents a instance of a Gadget.
 * @author aarranz
 */
function IGadget(gadget, iGadgetId, iGadgetCode, iGadgetName, dragboard) {
	this.id = iGadgetId;
	this.code = iGadgetCode;
	this.name = iGadgetName;
	this.gadget = gadget;
	
	this.dragboard = dragboard;
	this.iGadgetElement=$('mymw-content');
	this.iGadgetTabBar=$('mymw-nav');

}

/**
 * Returns the associated Gadget class.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Return the Tab of the IGadget
 */
IGadget.prototype.getTab = function() {
	return this.dragboard.tab;
}

IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getVisibleName = function() {
	var visibleName = this.name;
	if (visibleName.length > 13)
		visibleName = visibleName.substring(0, 11)+"...";
	return visibleName;
}

/**
 * Paints the gadget instance
 * @param where HTML Element where the igadget will be painted
 */
IGadget.prototype.paint = function() {
	
	//Generate the related gadgets html
	var relatedhtml ="";
	var related = this.dragboard.workSpace.getRelatedIGadgets(this.id);
	if (related.length > 0){
		relatedhtml +='<div id="related_gadgets" class="related_gadgets">';
		for (i=0;i<related.length;i++){
			relatedhtml += '<div class="related_gadget_div" onclick="OpManagerFactory.getInstance().showRelatedIgadget('+related[i].id+','+related[i].dragboard.tab.tabInfo.id+')" >';
			relatedhtml += '<img id="related_'+related[i].getId()+'" class="related_gadget" src="'+related[i].getGadget().getIPhoneImageURI()+'" />';
			relatedhtml += '</div>';
		}
		relatedhtml +='</div>'
	}
	
	// Generate the Gadget html
	var html = '<div id="gadget_'+this.id+'" class="';
	if (related.length > 0)
			html += 'gadget_content">';
	else
		html +='gadget_content_full">';
	html += '<object onload=\'OpManagerFactory.getInstance().igadgetLoaded('+this.id+');\' class="gadget_object" type="text/html" data="'+this.gadget.getXHtml().getURICode()+'?id='+this.id+'" standby="Loading...">'; 
	html += '"Loading...."';
	html += '</object></div>';
	
	//create a new Tab and add the new content
	tab = new MYMW.ui.Tab ({
		id : this.getTabId(),
		label : this.getVisibleName(),
		content : html+relatedhtml,
		onclick : function() { this.dragboard.unmarkRelatedIgadget(this.id ); this.dragboard.updateTab();}.bind(this)
		});
	this.dragboard.workSpace.tabView.addTab(tab);
	this.dragboard.workSpace.tabView.set('activeTab', tab);
}


IGadget.prototype.getTabId = function() {
	return "mymwtab_"+this.id;
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is, for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.dragboard.addIGadget(this, igadgetInfo);
	}

	function onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
			                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
			                  true);
		} else if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error adding igadget to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	if(this.dragboard.isLocked()){
		LayoutManagerFactory.getInstance().showMessageMenu(interpolate(gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab."), {'tabName': this.dragboard.tab.tabInfo.name}, true));
		return;
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['code'] = this.code;
	data['name'] = this.name;
	
	var uri = URIs.POST_IGADGET.evaluate({tabId: this.dragboard.tabId, workspaceId: this.dragboard.workSpaceId});
	
	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}

/**
 * @author aarranz
 */
function Dragboard(tab, workSpace, dragboardElement) {
	// *********************************
	// PRIVATE VARIABLES
	// *********************************
	this.loaded = false;
	this.currentCode = 1;

	// HTML Elements
	this.dragboardElement = $('dragboard');
	this.tabNameElement = $('tab_name');
	this.barElement = $('bar');
	
	//Atributes
	this.iGadgets = new Hash();
	this.tab = tab;
	this.tabId = tab.tabInfo.id;
	this.workSpace = workSpace;
	this.workSpaceId = workSpace.workSpaceState.id;
	
	this.visibleIGadget=null;
	
	// ****************
	// PUBLIC METHODS 
	// ****************
	
	Dragboard.prototype.updateTab = function () {
		//update the interface
		this.tabNameElement.update(this.tab.tabInfo.name);
		//update the internal data
		this.workSpace.updateVisibleTab(this.tab.index);
	}

	Dragboard.prototype.paint = function (iGadgetId) {
		this.setVisibleIGadget(iGadgetId);
		
		//update the tab name (the internal data is already up-to-date)
		this.updateTab();
		
		//paints the visible igadget
		if (this.visibleIGadget)
			this.visibleIGadget.paint();
			
		if (OpManagerFactory.getInstance().visibleLayer!="dragboard"){
			//Paints the dragboard and the visibleIGadget and hide the gadget menu
			this.workSpace.hide();
			this.dragboardElement.setStyle({display: "block"});
			//slide(false, this.dragboardElement);
			
			//show the bar element
			this.barElement.setStyle({display: "block"});
		}
	}
	
	Dragboard.prototype.paintRelatedIGadget = function (iGadgetId) {
		var tabId = this.getIGadget(iGadgetId).getTabId();
		var tabIndex = this.workSpace.tabView.getTabIndexById(tabId);
		if (tabIndex != null){ // the gadget-tab is already visible
			this.setVisibleIGadget(iGadgetId);
			this.workSpace.tabView.set('activeTab', this.workSpace.tabView.getTab(tabIndex));
		}
		else
			this.paint(iGadgetId)
	}
	
	Dragboard.prototype.hide = function () {
		//hide and clean the dragboard layer
		this.dragboardElement.setStyle({display: "none"});
		
		//clean the igadget
		if (this.visibleIGadget)
			this.visibleIGadget =  null;
		
		//clean the bar and the content
		this.workSpace.tabView.clear();
		this.barElement.setStyle({display: "none"});
	}
	

	Dragboard.prototype.markRelatedIgadget = function(iGadgetId){
		$("related_"+iGadgetId).addClassName("active");
		
		// highlight related tabs
		var igadget = this.getIGadget(iGadgetId);
		if (igadget){
			var tabId = igadget.getTabId();			
			var tabIndex = this.workSpace.tabView.getTabIndexById(tabId);
			if (tabIndex != null){ // the tab is already visible
				this.workSpace.tabView.getTab(tabIndex).set('highlight', true);
			}
		}		
	}
	
	/**
	 * Removes the mark on the related igadget. It has to be called at least:
	 * - when the user clicks on the tab containing that igadget
	 * - when the user clicks on the related gadget icon
	 */
	Dragboard.prototype.unmarkRelatedIgadget = function(iGadgetId){		
		var r = $("related_"+iGadgetId);
		if (r){
			r.removeClassName("active");
		}
	}
	
	Dragboard.prototype.parseTab = function(tabInfo) {
		var curIGadget, position, width, height, igadget, gadget, gadgetid, minimized;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];
			
			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.code, curIGadget.name, this);
			this.iGadgets[curIGadget.id] = igadget;

			if (curIGadget.code >= this.currentCode)
				this.currentCode =  curIGadget.code + 1;
		}
		this.loaded = true;
	}

	Dragboard.prototype.igadgetLoaded = function (iGadgetId) {
	    //DO NOTHING
	}
	
	Dragboard.prototype.destroy = function () {
		var keys = this.iGadgets.keys();
		//disconect and delete the connectables and variables of all tab iGadgets
		for (var i = 0; i < keys.length; i++) {
			this.workSpace.removeIGadgetData(keys[i]);
			delete this.iGadgets[keys[i]];
		}
		//TODO: have all references been removed?,delete the object
	}

	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			this.setConfigurationVisible(igadget.getId(), false);
		} catch (e) {
		}
	}

	Dragboard.prototype.showInstance = function (igadget) {
		igadget.paint(this.dragboardElement, this.dragboardStyle);
	}

	Dragboard.prototype.getIGadgets = function() {
		return this.iGadgets.values();
	}

	Dragboard.prototype.getIGadget = function (iGadgetId) {
		return this.iGadgets[iGadgetId];
	}

	Dragboard.prototype.getWorkspace = function () {
		return this.workSpace;
	}
	
	Dragboard.prototype.getVisibleIGadget = function () {
		return this.visibleIGadget;
	}
	
	Dragboard.prototype.setVisibleIGadget = function (iGadgetId) {
		this.visibleIGadget = this.getIGadget(iGadgetId);
		this.unmarkRelatedIgadget(iGadgetId);
		this.updateTab();
	}
	
	// *******************
	// INITIALIZING CODE
	// *******************

	this.parseTab(tab.tabInfo);
}
// This class represents the parameter that a filter can have
function Param (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.Param = function (name_, label_, type_, index_, defaultValue_){
  this._name = name_;
  this._label = label_;
  this._type = type_;
  this._index = index_;
  this._defaultValue = defaultValue_;
}

Param.prototype.getName = function() {
  return this._name;
}

Param.prototype.getType = function() {
  return this._type;
}

Param.prototype.getLabel = function() {
  return this._label;
}

Param.prototype.getIndex = function() {
  return this._index;
}

Param.prototype.getDefaultValue = function() {
  return this._defaultValue;
}

Param.prototype.createHtmlLabel = function() {
  var labelLayer = document.createElement("div");
  var img = document.createElement("img");
  img.setAttribute("src", "/ezweb/images/param.png");
  labelLayer.appendChild(img);
  labelLayer.appendChild(document.createTextNode(this._label + ':'));
  
  return labelLayer;
}

Param.prototype.createHtmlValue = function(wiringGUI, channel, valueElement){
  var context = {wiringGUI:wiringGUI, channel:channel, filter:channel.getFilter(), param:this, valueElement:valueElement};
  
  var paramValueLayer = document.createElement("div");
  var paramInput = document.createElement("input");
  paramInput.addClassName("paramValueInput");
  paramInput.setAttribute ("value", channel.getFilterParams()[this._index]);
  Event.observe(paramInput, 'click',function(e){Event.stop(e);});
  
  var checkResult = 
  	function(e){
    	var msg;
		if(e.target.value == "" || e.target.value.match(/^\s$/)){
	    	msg = interpolate(gettext("Filter param named '%(filterName)s' cannot be empty."), {filterName: this.param._label}, true);
			this.wiringGUI.showMessage(msg);
			this.valueElement.appendChild(document.createTextNode(gettext('undefined')));
			return;			
    	} 
		
		// Sets the param value
		this.channel.getFilterParams()[this.param._index] = e.target.value;
		
		// Sets the channel value
		this.valueElement.childNodes[0].nodeValue = channel.getValue();
		
		// Shows a message (only with error)
		if (this.channel.getFilter().getlastExecError() == null){
			this.wiringGUI.clearMessages();			
		}else{
			this.wiringGUI.showMessage(this.channel.getFilter().getlastExecError());
			this.valueElement.childNodes[0].nodeValue = gettext('undefined');
		}
    };
	
  // Sets the input
  Event.observe(paramInput, 'change', checkResult.bind(context));
  paramValueLayer.appendChild(paramInput);
  return paramValueLayer;
}

// This class represents the filter of the a channel
function Filter (id_, name_, label_, nature_, code_, category_, params_, helpText_) {
  this._id = id_;
  this._name = name_;
  this._label = label_;
  this._nature = nature_;
  this._params = new Array();
  this._lastExecError = null;
  this._category = category_;
  this._helpText = helpText_;
  
  // Sets the filter parameters
  this.processParams (params_); 
  
  // Sets the filter code
  try{
	if ((nature_ == 'USER') && ((typeof code_) != 'function')){
		this._code = null;
	}else{
		this._code = eval ('(' + code_ + ')');		
	}
  }catch(e){
	var msg = interpolate(gettext("Error loading code of the filter '%(filterName)s'."), {filterName: this._label}, true);
	LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
  }
}

Filter.prototype.getId = function() {
  return this._id;
}

Filter.prototype.getName = function() {
  return this._name;
}

Filter.prototype.getLabel = function() {
  return this._label;
}

Filter.prototype.getParams = function() {
  return this._params;
}

Filter.prototype.getlastExecError = function() {
  return this._lastExecError;
}

Filter.prototype.setParam = function(param_) {
  this._params[param_.getIndex()] = param_;
}

Filter.prototype.hasParams = function() {
  return this._params.length != 0;
}

Filter.prototype.getCategory = function() {
  return this._category;
}

Filter.prototype.getHelpText = function() {
  return this._helpText;
}

Filter.prototype.processParams = function(params_) {
  this._params = new Array();
  if (params_ != null){
  	var fParam, paramObject;
  	var jsonParams = eval (params_);  
  	for (var i = 0; i < jsonParams.length; i++) {
		fParam = jsonParams[i];
		if (fParam.type == 'jpath'){
			paramObject = new JPathParam (fParam.name, fParam.label, fParam.index, fParam.defaultValue);
		} else {
			paramObject = new Param(fParam.name, fParam.label, fParam.type, fParam.index, fParam.defaultValue);						
		}
		this.setParam(paramObject);  
  	}
  } 	
}

Filter.prototype.run = function(channelValue_, paramValues_) {
	var i, msg, params = '';

	// Begins to run, no errors
	this._lastExecError = null;
	
//	// Creates the varible for the channel value
//	eval ("var channelValue = '" + channelValue_ + "';");
	
	try{
		// Creates the variables for other params
		for (i=0; i < this._params.length; ++i){ 
			if (i!=0)
				params += ',';
			// Checks the type of parameter
			switch (this._params[i].getType()){
			case 'N': // Param is Number
				var interger_value = parseInt(paramValues_[i]);
				if (isNaN(interger_value)){
					msg = interpolate(gettext("Error loading parameter '%(paramName)s' of the filter '%(filterName)s'. It must be a number"), 
						{paramName: this._params[i].getLabel(), filterName: this._label}, true);
					LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
					this._lastExecError = msg;
					return gettext('undefined');
				}
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break; 
			case 'regexp': // Param is RegExp
				if ((paramValues_[i].indexOf('/') == 0) && (paramValues_[i].lastIndexOf('/') > 0)){
					var current_pattern = paramValues_[i].substring(1, paramValues_[i].lastIndexOf('/'));
					var current_modifiers = paramValues_[i].substring(paramValues_[i].lastIndexOf('/') + 1, paramValues_[i].length);
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + current_pattern + "', '" + current_modifiers + "');");	
				}else {
					eval ("var " + this._params[i].getName() + " = new RegExp ('" + paramValues_[i] + "');");
				}
				params += this._params[i].getName();
				break;
			case 'jpath': // Param is a JPATH expresion (for JSON)
				var jpath_exp = this._params[i].parse(paramValues_[i]);
				eval ("var " + this._params[i].getName() + " = this._params[i].parse(paramValues_[i]);");
				params += this._params[i].getName();
				break;
			default: // Otherwise is String
				eval ("var " + this._params[i].getName() + " = '" + paramValues_[i] + "';");
				params += this._params[i].getName();
				break;
			}

		}
	}catch(e){
		msg = interpolate(gettext("Error loading param '%(paramName)s' of the filter '%(filterName)s': %(error)s."), 
			{paramName: this._params[i].getLabel(), filterName: this._label, error: e}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		this._lastExecError = msg;
		return gettext('undefined');
	}
	
	try{
	
		// Exeutes the filter code
		switch(this._nature){
			case "NATIVE":
				return eval ('channelValue_.' + this._name + '(' + params + ');');
				break;
			case "JSLIB":
				if (params != '')
					params = ',' + params;
				return eval (this._name + '(channelValue_' + params + ');');
				break;
			case "USER":
				if (params != '')
					params = ',' + params;
				return eval ('this._code(channelValue_' + params + ');');
				break;
			default:
				break;
		}
	
	}catch(e){
		var msg = interpolate(gettext("Error executing code of the filter '%(filterName)s'."), {filterName: this._Label}, true);
		LogManagerFactory.getInstance().log(msg, Constants.ERROR_MSG);
		// Saves the message (for wiring interface)
		if (this._params.length == 0){
			this._lastExecError = msg;
		}else{
			this._lastExecError = interpolate(gettext("Error executing code of the filter '%(filterName)s'. Check the parametres."), {filterName: this._label}, true);
		}
		return gettext('undefined');
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// This is the class has the common properties of every connectable object of the wiring module //
// The other connectable classes from the wiring module will inherit from this class            //
//////////////////////////////////////////////////////////////////////////////////////////////////
function wConnectable (name, type, friendCode, id) {
  this.id = id;
  this._name = name;
  this._type = type;
  this._friendCode = friendCode;
  this.connectableType = null;
  this.view = null;
}

wConnectable.prototype.annotate = function() {}

wConnectable.prototype.getType = function() {
  return this.type;
}

wConnectable.prototype.getValue = function() {
  throw new Exception("Unimplemented function"); // TODO
}

wConnectable.prototype.getName = function() {
  return this._name;
}

wConnectable.prototype.getId = function() {
  return this.id;
}

wConnectable.prototype.getFriendCode = function() {
  return this._friendCode;
}

wConnectable.prototype.setInterface = function(view) {
	this.view=view;
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
wConnectable.prototype.destroy = function () {
	this.fullDisconnect();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may be placed in the middle of a connection between a In object and wOut object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wOut(name, type, friendCode, id) {
   wConnectable.call(this, name, type, friendCode, id);
   this.connectableType = "out";
   this.inouts = new Array();
}

wOut.prototype = new wConnectable();

wOut.prototype.annotate = function(value) {
    this.variable.annotate(value);
}

wOut.prototype.addInOut = function(inout) {
	this.inouts.push(inout);
}

wOut.prototype.disconnect = function(inout) {
	inout._removeOutput(this);
    this.inouts.remove(inout);
}

wOut.prototype.fullDisconnect = function() {
  // Disconnecting inouts
  var inouts = this.inouts.clone();
  for (var i = 0; i < inouts.length; ++i)
    this.disconnect(inouts[i]);
}

wOut.prototype.refresh = function() {
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents every object which may initialize one transmission through the wiring module //
////////////////////////////////////////////////////////////////////////////////////////////////////////
function wIn(name, type, friendCode, id) {
  wConnectable.call(this, name, type, friendCode, id);
  this.outputs = new Array();
  this.connectableType = "in";
}

wIn.prototype = new wConnectable();

wIn.prototype.connect = function(out) {
  this.outputs.push(out);
  if (out instanceof wInOut)
    out._addInput(this);
}

wIn.prototype.disconnect = function(out) {
  if (this.outputs.getElementById(out.getId()) == out) {
    if (out instanceof wInOut)
      out._removeInput(this);

    this.outputs.remove(out);
  }
}

wIn.prototype.fullDisconnect = function() {
  // Outputs
  var outputs = this.outputs.clone();
  for (var i = 0; i < outputs.length; ++i)
    this.disconnect(outputs[i]);
}

wIn.prototype.propagate = function(value, initial) {
  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].annotate(value);

  for (var i = 0; i < this.outputs.length; ++i)
    this.outputs[i].propagate(value, initial);
}

wIn.prototype.refresh = function() {
}

/////////////////////////////////////////////////////////////////////
// This class represents every object which may transmit some data //
/////////////////////////////////////////////////////////////////////
function wInOut(name, type, friendCode, id) {
  wIn.call(this, name, type, friendCode, id);

  this.inputs = new Array();
  this.connectableType = "inout";
}

wInOut.prototype = new wIn();

wInOut.prototype.annotate = function(value) {
  for (var i = 0; i < this.outputs.length; ++i)
      this.outputs[i].annotate();
}	

wInOut.prototype.connect = function(out) {	
	wIn.prototype.connect.call(this, out);
	
	out.addInOut(this);
}

wInOut.prototype._addInput = function(wIn) {
  this.inputs.push(wIn);
}

wInOut.prototype._removeInput = function(wIn) {
  if (this.inputs.getElementById(wIn.getId()) == wIn)
	    this.inputs.remove(wIn);
}

wInOut.prototype._removeOutput = function(wOut) {
  if (this.outputs.getElementById(wOut.getId()) == wOut)
    this.outputs.remove(wOut);
}

wInOut.prototype.fullDisconnect = function() {
  // Inputs
  var inputs = this.inputs.clone();
  for (var i = 0; i < inputs.length; ++i)
    inputs[i].disconnect(this);

  // Outputs
  var outputs = this.outputs.clone();
  for (var i = 0; i < outputs.length; ++i)
    this.disconnect(outputs[i]);
}

// TODO implement this function
//wInOut.prototype.searchCycle = function(name)

// wChannel and wEvent (connectables that propagates values) register in their
// associated variable, a pointer to them
// Double-linked structure.

//////////////////////////////////////////////////////////////////////////
// This class represents a iGadget variable which may produce some data 
//////////////////////////////////////////////////////////////////////////
function wEvent(variable, type, friendCode, id) {
  this.variable = variable;
  wIn.call(this, this.variable.name, type, friendCode, id);
  this.variable.assignConnectable(this);
}

wEvent.prototype = new wIn();

wEvent.prototype.getQualifiedName = function () {
  return "event_" + this.variable.id;
}

wEvent.prototype.getLabel = function () {
  return this.variable.label;	
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wChannel (variable, name, id, provisional_id) {
  this.variable = variable;
  this.provisional_id=provisional_id;
  wInOut.call(this, name, null, null, id);
  this.variable.assignConnectable(this);
  this.filter = null;
  this.filterParams = new Array();
}

wChannel.prototype = new wInOut();

wChannel.prototype.getValue = function() {
  if (this.filter == null)
	return this.variable.get();  	
  else
 	return this.filter.run(this.variable.get(), this.filterParams);
}

wChannel.prototype.getValueWithoutFilter = function() {
	return this.variable.get();  	
}

wChannel.prototype.getFilter = function() {
  return this.filter;
}

wChannel.prototype.setFilter = function(newFilter) {
  this.filter = newFilter;
}

wChannel.prototype.processFilterParams = function(fParamsJson_) {
  this.filterParams = new Array();
  if (fParamsJson_ != null){
  	var fParams = eval (fParamsJson_);
	for (var k = 0; k < fParams.length; k++) {
		this.filterParams[fParams[k].index] = fParams[k].value; 
  	}
  }
}

wChannel.prototype.setFilterParams = function(fParams) {
  this.filterParams = fParams;
}

wChannel.prototype.getFilterParams = function() {
  return this.filterParams;
}

wChannel.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
  wInOut.prototype.propagate.call(this, this.getValue(), initial);
}

wChannel.prototype.getQualifiedName = function () {
  return "channel_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a wConnectable whose only purpose is to redistribute the data produced by an wIn object //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wTab (variable, name, tab, id) {
  this.variable = variable;
  this.tab = tab;
  this.variable.assignConnectable(this);
  wOut.call(this, name, null, null, id);
}

wTab.prototype = new wOut();

wTab.prototype.propagate = function(newValue, initial) {
  if(!initial){
  	this.variable.set(newValue);
  }
}

wTab.prototype.getQualifiedName = function () {
  return "tab_" + this.id;
}

/////////////////////////////////////////////////////////////////////////////
// This class representents a iGadget variable which may receive some data //
/////////////////////////////////////////////////////////////////////////////
function wSlot(variable, type, friendCode, id) {
  this.variable = variable;
  this.variable.assignConnectable(this);
  wOut.call(this, this.variable.name, type, friendCode, id);
}

wSlot.prototype = new wOut();

wSlot.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
}

wSlot.prototype.getQualifiedName = function () {
  return "slot_" + this.variable.id;
}

wSlot.prototype.getLabel = function () {
  return this.variable.label;	
}

wSlot.prototype.refresh = function() {
  this.variable.refresh();
}

function Wiring (workspace, workSpaceGlobalInfo) {

	// *****************
	//  PRIVATE METHODS
	// *****************

	// ****************
	// PUBLIC METHODS
	// ****************
	
	Wiring.prototype.getConnectableId = function (variables, name, igadgetId) {
		for (i=0; i<variables.length; i++) {
			var variable = variables[i];
			
			if ((variable.name == name) && (variable.igadgetId == igadgetId)) {
				return variable.connectable.id;
			}
		}
	}

	Wiring.prototype.processFilter = function (filterData) {
		var filterObject = new Filter (filterData.id, filterData.name, filterData.label, 
									   filterData.nature, filterData.code, filterData.category, 
									   filterData.params, filterData.help_text);
		
		this.filters[filterData.id] = filterObject;		
	}

	Wiring.prototype.processTab = function (tabData) {
		var igadgets = tabData['igadgetList'];
		var dragboard = this.workspace.getTab(tabData['id']).getDragboard();

		for (var i = 0; i < igadgets.length; i++) {
			this.addInstance(dragboard.getIGadget(igadgets[i].id), igadgets[i].variables);
		}
	}
	
	Wiring.prototype.processVar = function (varData) {
		var varManager = this.workspace.getVarManager();
		var variable = varManager.getWorkspaceVariableById(varData.id);
		
		if (varData.aspect == "TAB" && varData.connectable) {
			var connectableId = varData.connectable.id;
			var tab_id = varData.tab_id;
			
			var tab = this.workspace.getTab(tab_id);
			
		    var connectable = new wTab(variable, varData.name, tab, connectableId);
		    
		    tab.connectable = connectable;
		}
		
		if (varData.aspect == "CHANNEL" && varData.connectable) {
			var connectableId = varData.connectable.id;
		    var channel = new wChannel(variable, varData.name, connectableId, false);
			
			// Setting channel filter
			channel.setFilter(this.filters[varData.connectable.filter]);
		    channel.processFilterParams(varData.connectable.filter_params);
			
		    // Connecting channel input		
		    var connectable_ins = varData.connectable.ins;
		    for (var j = 0; j < connectable_ins.length; j++) {
		    	// Input can be: {wEvent, wChannel}
		    	var current_input = connectable_ins[j];
		    	
		    	var in_connectable = null;
		    	if (current_input.connectable_type == "in") {
		    		var var_id = current_input.ig_var_id;
		    		in_connectable = varManager.getVariableById(var_id).getConnectable();
		    	}
		    	else {
		    		if (current_input.connectable_type == "inout") {
		    			var var_id = current_input.ws_var_id;
		    			in_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Input connectables can only be In or InOut!!!")
		    		}
		    	}

		    	in_connectable.connect(channel);
		    }
		    
		    // Connecting channel output  
		    var connectable_outs = varData.connectable.outs;
		    for (var j = 0; j < connectable_outs.length; j++) {
		    	// Outputs can be: {wSlot, wTab}
		    	var current_output = connectable_outs[j];
		    	
		    	var out_connectable = null;
		    	if (current_output.connectable_type == "out") {
		    		if (current_output.ig_var_id) {
		    			var var_id = current_output.ig_var_id;
		    			out_connectable = varManager.getVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    	}
		    	else {
		    		if (current_output.connectable_type == "inout") {
		    			var var_id = current_output.ws_var_id;
		    			out_connectable = varManager.getWorkspaceVariableById(var_id).getConnectable();
		    		}
		    		else {
		    			assert("Error: Output connectables can only be In or InOut!!!")
		    		}
		    	}

		    	channel.connect(out_connectable);
		    }

			// Save it on the channel list
		    this.channels.push(channel);
		}	
	}

	Wiring.prototype.propagateInitialValues = function (initial) {
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			channel.propagate(channel.variable.value, initial);
		}
	}

	Wiring.prototype.refreshIGadget = function(igadget) {
		var connectables = this.getIGadgetConnectables(igadget);

		for (var i = 0; i < connectables.length; i++) {
			var connectable = connectables[i];
			connectable.refresh();
		}
	}

	Wiring.prototype.loadWiring = function (workSpaceData) {
		var workSpace = workSpaceData['workspace'];
		var ws_vars_info = workSpace['workSpaceVariableList'];
		var tabs = workSpace['tabList'];
		var filters = workSpace['filters'];

		for (var i = 0; i < tabs.length; i++) {
			this.processTab(tabs[i]);
		}

		// Load all platform filters. 
		// ATTENTION: Filters must be loaded before workspace variables
		for (var i = 0; i < filters.length; i++) {
			this.processFilter(filters[i]);
		}
		
		// Load WorkSpace variables
		for (var i = 0; i < ws_vars_info.length; i++) {
			this.processVar(ws_vars_info[i]);
		}

		this.loaded = true;
	}

	Wiring.prototype.addInstance = function (igadget, variables) {
		var varManager = this.workspace.getVarManager();
		var gadgetEntry = new Object();
		var iGadgetId = igadget.getId();

		if (this.iGadgets[iGadgetId]) {
			var msg = gettext("Error adding iGadget into the wiring module of the workspace: Gadget instance already exists.");
			LogManagerFactory.getInstance().log(msg);
		}

		gadgetEntry.events = new Array();
		gadgetEntry.slots = new Array();
		gadgetEntry.connectables = new Array();

		// IGadget variables
		for (var i = 0; i < variables.length; i++) {
			var variableData = variables[i];
			var variable = varManager.getVariableByName(variableData.igadgetId, variableData.name);
			
			if (variable.aspect == "EVEN" && variableData.connectable) {
				var connectableId = variableData.connectable.id;
			    var connectable = new wEvent(variable, variableData.type, variableData.friend_code, connectableId);
			    
			    gadgetEntry.events.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
			if (variable.aspect == "SLOT" && variableData.connectable) {
			    var connectableId = variableData.connectable.id;
			    var connectable = new wSlot(variable, variableData.type, variableData.friend_code, connectableId);

			    gadgetEntry.slots.push(connectable);
			    gadgetEntry.connectables.push(connectable);
			}
			
		}
		
		this.iGadgets[iGadgetId] = gadgetEntry;
	}
	
	// TODO
	Wiring.prototype.removeInstance = function (iGadgetId) {
		var entry = this.iGadgets[iGadgetId];

		if (!entry) {
			var msg = gettext("Wiring error: Trying to remove an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		for (var i = 0; i < entry.events.length; i++)
			entry.events[i].destroy();
		entry.events.clear();
		
		for (var i = 0; i < entry.slots.length; i++)
			entry.slots[i].destroy();
		entry.slots.clear();

		this.iGadgets.remove(iGadgetId)
	}

	Wiring.prototype.getIGadgetConnectables = function(iGadget) {
		var iGadgetEntry = this.iGadgets[iGadget.id];

		if (iGadgetEntry == null) {
			var msg = gettext("Wiring error: Trying to retreive the connectables of an inexistent igadget.");
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		return iGadgetEntry.connectables;
	}

	Wiring.prototype.getChannels = function() {
		return this.channels;
	}
	
	Wiring.prototype.getFiltersSort = function() {
		var sortByLabel = function (a, b){
			var x = a.getName();
			var y = b.getName();
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		} 
		return this.filters.values().sort(sortByLabel);
	}
	
	Wiring.prototype.channelExists = function(channelName){
		if(this.channels.getElementByName(channelName))
			return true;
		return false;
	}

	Wiring.prototype._insertChannel = function (channelName, channelVar, id, provisional_id) {
		if (this.channelExists(channelName)) {
			var msg = interpolate(gettext("Error creating channel %(channelName)s: Channel already exists"),{channelName: channelName}, true);
//			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}		
		
		if (!provisional_id) 
			provisional_id=false;

		var channel = new wChannel(channelVar, channelName, id, provisional_id);
		this.channels.push(channel);
					
		return channel;
	}

	Wiring.prototype.createChannel = function (channelName, channelId) {
		var channelVar = this.workspace.getVarManager().createWorkspaceVariable(channelName);

		return this._insertChannel(channelName, channelVar, channelId, true);
	}
	
	Wiring.prototype.getOrCreateChannel = function (channelName, channelId) {
		var channel = this.channels.getElementByName(channelName);
		if(!channel){
			channel = this.createChannel(channelName, channelId);
		}
		return channel;
	}

	Wiring.prototype.removeChannel = function (channelId, isTemp) {
		var channel = this.channels.getElementById(channelId);

		if (channel == undefined) {
			var msg = gettext("Error removing channel %(channelName)s: Channel does not exist");
			msg = interpolate(msg, {channelName: channelName});
			LogManagerFactory.getInstance().log(msg);
			return;
		}
		
		//delete the workspace variable
		this.workspace.getVarManager().removeWorkspaceVariable(channel.variable.id);
		
		if (!isTemp)
			this.channelsForRemoving.push(channel.id);
		
		this.channels.removeById(channelId);
		
		channel.destroy();
	}

	Wiring.prototype.serializationSuccess = function (transport){
		// JSON-coded ids mapping
		var response = transport.responseText;
		var json = eval ('(' + response + ')');
		
		var mappings = json['ids'];
		for (var i=0; i<mappings.length; i++) {
			var mapping = mappings[i];
			for (var j=0; j<this.channels.length; j++) {
				if (this.channels[j].getId() == mapping.provisional_id) {
					this.channels[j].id = mapping.id;
					this.channels[j].provisional_id = false;
					this.channels[j].previous_id = mapping.provisional_id;
					this.channels[j].variable.id = mapping.var_id;
					this.workspace.getVarManager().addWorkspaceVariable(mapping.var_id, this.channels[j].variable);
					break;
				}
			}
		}
		
		// Channels has been sabed in db. Cleaning state variables!
		delete this.channelsForRemoving;
		this.channelsForRemoving = [];
	}

	Wiring.prototype.unload = function () {	
		var varManager = this.workspace.getVarManager();
		
		for (var i=0; i<this.channels.length; i++) {
			var channel = this.channels[i];
			
			varManager.removeWorkspaceVariable(channel.variable.id);
			
			channel.destroy();
		}

	}
	
	Wiring.prototype.serializationError = function (response) {
		var p = response.responseText;
		msg = interpolate(gettext("Error : %(errorMsg)s."), {errorMsg: p}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	Wiring.prototype.serialize = function () {
		var gadgetKeys = this.iGadgets.keys();
		var serialized_channels = [];
		
		// Channels
		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			var serialized_channel = new Object();
			
			// Filling channel info!!!
			serialized_channel['id'] = channel.id; 
			serialized_channel['name'] = channel._name;
			serialized_channel['type'] = channel._type;
			serialized_channel['friend_code'] = channel._friendCode;
			serialized_channel['var_id'] = channel.variable.id;
			serialized_channel['provisional_id'] = channel.provisional_id;
			if (channel.getFilter() == null)
				serialized_channel['filter'] = null;
			else
				serialized_channel['filter'] = channel.getFilter().getId();
			
			var serialized_filter_params = '';
			for (var k = 0; k < channel.getFilterParams().length; k++) {
				serialized_filter_params += '{"index": ' + k;  
				serialized_filter_params += ', "value": "' + channel.getFilterParams()[k] + '"}';
				if (k != (channel.getFilterParams().length - 1)){
					serialized_filter_params += ', ';
				}
			}
			serialized_channel['filter_params'] = '{[' + serialized_filter_params + ']}';
			
			serialized_channel.ins = [];
			                              
			var serialized_inputs = serialized_channel.ins;

			for (var j = 0; j < channel.inputs.length; j++) {
				var input = channel.inputs[j];
				var serialized_input = new Object();
				
				serialized_input['id'] = input.id;
				serialized_input['connectable_type'] = input.connectableType;
				
				serialized_inputs.push(serialized_input);
			}

			serialized_channel.outs = [];
			
			var serialized_outputs = serialized_channel.outs;
			
			for (var j = 0; j < channel.outputs.length; j++) {
				var output = channel.outputs[j];
				var serialized_output = new Object();
				
				serialized_output['id'] = output.id;
				serialized_output['connectable_type'] = output.connectableType;
				
				serialized_outputs.push(serialized_output);
			}
			
			serialized_channels.push(serialized_channel);
		}
		
		//Channels for adding

		var json = {'inOutList' : serialized_channels};
		
		json['channelsForRemoving'] = this.channelsForRemoving;
		
		var param = {'json': Object.toJSON(json)};
		
		var url = URIs.GET_POST_WIRING.evaluate({'id': this.workspace.workSpaceState.id});
		
		PersistenceEngineFactory.getInstance().send_post(url, param, this, this.serializationSuccess, this.serializationError); 
	}

	// ***************
	// CONSTRUCTOR
	// ***************
	this.workspace = workspace;

	this.loaded = false;
	this.persistenceEngine = PersistenceEngineFactory.getInstance();
	this.iGadgets = new Hash();
	this.channels = new Array();
	this.filters = new Hash();
	this.channelsForRemoving = [];
	
	
	
	this.loadWiring(workSpaceGlobalInfo);
}


// JPATH expression elements
function JPathToken (type_, value_) {
  	this._type = type_;
	this._value = value_;	
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This class represents a JPATH parameter
// JPATH is the language to access to JSON structures
function JPathParam (name_, label_, index_, defaultValue_) {
	Param.prototype.Param.call(this, name_, label_, 'jpath', index_, defaultValue_);
}

JPathParam.prototype = new Param;

// Especial characters are not "normal text"
JPathParam.prototype.isChar = function(char_) {
	
	switch(char_){
	case '[':
	case ']':
	case '.':
	case ':':
	case '\\':
	case '=':
	case '"':
		return false;
		break;
	default:
		return true;
		break;
	}
	
}

// Main method to parse a JPATH expression
JPathParam.prototype.parse = function(text_) {
	
	var tokens = new Array();
	var iter = text_.length;
	var index = 0;
	var state = 1;
	
	do {
	
		if ((text_[index] == undefined) && (state != 1)) {
			throw "Unexpected end of expression";
		} 
		
		switch(state){
		case 1:
			switch(text_[index]){
				case '\\':
					text_ = text_.substring (0, index) + text_.substring(index + 1);
					state = 2;
					break;
				case '[':
					if (index != 0){
						tokens.push(new JPathToken ('text', text_.substring(0, index)));
					}
					text_ = text_.substring(index + 1);
					index = 0;
					state = 3;
					break;
				case undefined:
					if (index != 0){
						tokens.push(new JPathToken ('text', text_.substring(0, index)));
					}
					return tokens;
					break;
				default:
					index++;
					state = 1;
			}
			break;
		case 2:
			index++;
			state = 1;
			break;
		case 3:
		case 5:
			if (this.isChar (text_[index])){
				index++;
				state = 4;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 4:
			switch(text_[index]){
				case ']':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					tokens.push(new JPathToken ('separator', ''));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 1;
					break;
				case '.':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 5;
					break;
				case ':':
					tokens.push(new JPathToken ('element', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 6;
					break;
				case '[':
				case '\\':
				case '=':
					throw "Unexpected character " + state;;
					break;
				default:
					index++;
					state = 4;
			}
			break;
		case 6:
			if (text_.indexOf("index=") == 0){
				tokens.push(new JPathToken ('index_cond', ''));
				text_ = text_.substring(index + 6);
				index = 0;
				state = 7;
			} else if (text_.indexOf("first:") == 0){
				tokens.push(new JPathToken ('first_cond', ''));
				text_ = text_.substring(index + 6);
				index = 0;
				state = 16;
			} else if (text_.indexOf("last:") == 0){
				tokens.push(new JPathToken ('last_cond', ''));
				text_ = text_.substring(index + 5);
				index = 0;
				state = 16;
			} else if (this.isChar (text_[index])){
				index++;
				state = 9;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 7:
			if (text_.indexOf("first") == 0){
				tokens.push(new JPathToken ('first_index', ''));
				text_ = text_.substring(index + 5);
				index = 0;
				state = 18;
			} else if (text_.indexOf("last") == 0){
				tokens.push(new JPathToken ('last_index', ''));
				text_ = text_.substring(index + 4);
				index = 0;
				state = 18;
			} else if (!isNaN(parseInt(text_[index]))){
				index++;
				state = 8;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 8:
			if (!isNaN(parseInt(text_[index]))){
				index++;
				state = 8;
			} else if (text_[index] == ':'){
				tokens.push(new JPathToken ('value', parseInt(text_.substring(0, index))));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
			} else if (text_[index] == ']'){
				tokens.push(new JPathToken ('value', parseInt(text_.substring(0, index))));
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
			} else {
				throw "Unexpected character " + state;
			}
			break;
		case 9:
			switch(text_[index]){
				case '.':
					tokens.push(new JPathToken ('condition', text_.substring(0, index)));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 15;
					break;
				case '=':
					tokens.push(new JPathToken ('condition', text_.substring(0, index)));
					tokens.push(new JPathToken ('op', '='));
					text_ = text_.substring(index + 1);
					index = 0;
					state = 10;
					break;
				case ':':
				case '[':
				case ']':
				case '\\':
					throw "Unexpected character " + state;;
					break;
				default:
					index++;
					state = 9;
			}
			break;
		case 10:
			if (text_[index] == '"'){
				text_ = text_.substring(index + 1);
				index = 0;
				state = 17;									
			} else if (this.isChar (text_[index])){
				index++;
				state = 11;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 11:
			if (text_[index] == ':'){
				tokens.push(new JPathToken ('value', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
			} else if (this.isChar (text_[index])){
				index++;
				state = 11;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 12:
			if (this.isChar (text_[index])){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 13:
			if (text_[index] == ']'){
				tokens.push(new JPathToken ('element', text_.substring(0, index)));
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
			}else if (text_[index] == '.'){
				tokens.push(new JPathToken ('element', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 14;
			}else if (this.isChar (text_[index])){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 14:
			if (this.isChar (text_[index])){
				index++;
				state = 13;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 15:
		case 16:
			if (this.isChar (text_[index])){
				index++;
				state = 9;
			}else{
				throw "Unexpected character " + state;
			}
			break;
		case 17:
			switch (text_[index]){
			case '"':
				tokens.push(new JPathToken ('value', text_.substring(0, index)));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 18;
				break;
			default:
				index++;
				state = 17;
				break;
			}
			break;
		case 18:
			switch (text_[index]){
			case ']':
				tokens.push(new JPathToken ('separator', ''));
				text_ = text_.substring(index + 1);
				index = 0;
				state = 1;
				break;			
			case ':':
				text_ = text_.substring(index + 1);
				index = 0;
				state = 12;
				break;
			default:
				throw "Unexpected character " + state;
			}
			break;
		default:
			throw "Lex parser error. Unexpected state " + state;
		}
		
		iter--;
	
	} while (iter >= 0);
	
	if (iter < 0){
		throw "Lex parser error. Too many iterations";
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This class represents a JSON filter
JSONParser = new Object();

// This method finds a conditional element into a JSON list
JSONParser.findConditionalElement = function(json_list_, exp_, occur_, index_) {

	if ((typeof json_list_ != "object") || (json_list_.length == undefined)){
		throw "JSON must be a list";
	}

	var res = new Array();
	var found_eltos, iter;
	var current_token, value_token;

	for (var i = 0; i < json_list_.length; i++) { 

		iter = index_;
		current_token = exp_[iter];

		do {
			found_eltos = this.findJSONElement(current_token._value, json_list_[i]);
			current_token = exp_[++iter];	
		} while (current_token._type != 'op');
		
		// Gets the operation value
		value_token = exp_[++iter];
		
		for (var j = 0; j < json_list_.length; j++) {
			// Performs the selected operation (current token is a 'operation')
			switch(current_token._value){
			case '=':
				// Get the value of the operation
				if (found_eltos[j] == value_token._value ){
					if (occur_ == 'first'){
						return json_list_[i];
					} else {
						res.push (json_list_[i]);
						break;
					} 
				}			
				break;
			default:
				throw "Unexpected operator";
				break;
			}
		}

	}		
	
	if (res.length == 0){
		return undefined;
	}
	
	if (occur_ == 'last'){
		return res[res.length - 1];
	}
	
	return res;
		
}

// This method finds a element into a JSON list
JSONParser.findJSONElement = function(element_, json_) {
	
	// The element is only searched into javascript objects
	if (typeof json_ != "object") {
		return undefined;
	}
	
	// Found element
	if (json_[element_] != undefined){
		return json_[element_];
	} 
	
	// It is a list
	if (json_.length != undefined) {
	
		var res = new Array();
		for (var i = 0; i < json_.length; i++) { 
			var res_elto = this.findJSONElement(element_, json_[i]);
			if (res_elto != undefined){
				res.push(res_elto);
			}
		}		
		if (res.length == 0){
			res = undefined;
		}
		return res;
	}
	
	// It a normal object
	for (var json_item in json_) { 
		var res = this.findJSONElement(element_, json_[json_item]);
		if (res != undefined){
			return res;
		}
	}		
	
	return undefined;
}

// This method parses a JSON structures using a JPATH expression
JSONParser.parse = function(json_, exp_) {
	
	var res = new Array();
	var json_objs = null;
	var json_cp = null;
	var ocurr = null;
	
	// Checks the json
	if (json_ == ''){
		json_objs = {};
	} else {
		var k = 0
		while (k < json_.length) {
			switch (json_[k]){
			case '\n':
				json_ = json_.substring (0, k) + json_.substring(k + 1);
				break;
			default:
				k++;
				break;
			}
		}
		json_objs = eval ('(' + json_ + ')');
	}
	
	for (var i = 0; i < exp_.length; i++) {

		var token = exp_[i];
		
		switch(token._type){
		case 'text':
			res.push(token._value);
			break;
		case 'element':
			json_objs = this.findJSONElement(token._value, json_objs);
			break;
		case 'index_cond':
			
			var index_token = exp_[++i];
			var ind = null;
			
			switch(index_token._type){
			case 'first_index':
				ind = 0;
				break;
			case 'last_index':
				ind = json_objs.length - 1;
				break;
			default:
				ind = index_token._value;
				break;				
			}			 		

			json_objs = json_objs[ind]; 
			break;
		case 'first_cond':
			ocurr = "first";
			break;
		case 'last_cond':
			ocurr = "last";
			break;
		case 'condition':
			json_objs = this.findConditionalElement(json_objs, exp_, ocurr, i);
			while (exp_[i]._type != 'value') {
				i++;		
			} 			
			break;
		case 'separator':

			// Adds the found JSON element
			switch(typeof json_objs){
			case "object":
				res.push(Object.toJSON(json_objs));
				break;
			case "string":
				var first_comma = json_objs.indexOf('"');
				var last_comma = json_objs.lastIndexOf('"');
				if ((first_comma == 0) && (last_comma > 0) && (last_comma == (json_objs.length - 1))){
					json_objs = json_objs.substring (1, last_comma)
				}
			default:
				res.push(json_objs);
				break;
			}
				
			// Resets the json
			json_objs = eval ('(' + json_ + ')');
			break;
		default:
			throw "Unexpected token";
		}	

	}
	
	return res.join('');

} 
// Special function to retrieve the related gadgets (used in the iphone prototype)
	Wiring.prototype.getRelatedIgadgets = function(iGadgetId){
		var events = this.iGadgets[iGadgetId].events;
		var related = new Array();
		var outputs = null;
		var o = null;
		var id = null;
		var channelOutputs = null;
		
		for (i=0;i<events.length;i++){
			var outputs = events[i].outputs; //gadget outputs
			for (j=0;j<outputs.length;j++){
				o = outputs[j];
				if (o.connectableType=="inout"){ //it is a channel
					channelOutputs = o.outputs;
					for (k=0;k<channelOutputs.length;k++){ //channel outputs -> slots
						id = channelOutputs[k].variable.iGadget;
						if (!related.elementExists(id)){ //the iGadgetId is not in the related list already
							related.push(id); //add to the related igadgets list the iGadgetId associated with the channel outputs
						}
					}
				}
			}
		}
		return related;
	}
wSlot.prototype.propagate = function(newValue, initial) {
  this.variable.set(newValue);
  //mark the related gadget affected with the propagation
  if (!initial)
  	OpManagerFactory.getInstance().markRelatedIgadget(this.variable.iGadget);
}