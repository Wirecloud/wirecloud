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
	this.getUriWiki = function() { return state.getUriWiki();}
	this.getImage = function() { return state.getImage(); }
	this.setImage = function(image_) { state.setImage(image_); }
	
	this.isContratable = function() { 
		var capabilities = state.getCapabilities();
		
		for (var i=0; i<capabilities.length; i++) {
			var capability = capabilities[i];
			if (capability.name == 'Contratable')
				return capability.value.toLowerCase() == "true";
			else
				return false
		}	
	}

	
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
	var capabilities = []; 
	var uriwiki = null;
	
	// JSON-coded Gadget mapping
	// Constructing the structure
	vendor = gadget_.vendor;
	name = gadget_.name;
	version = gadget_.version;
	template = new GadgetTemplate(gadget_.variables, gadget_.size);
	xhtml = new XHtml(gadget_.xhtml);
	image = gadget_.image;
	capabilities = gadget_.capabilities;
	uriwiki = gadget_.wikiURI;
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
        this.getCapabilities = function() { return capabilities; } 
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
	this.getUriWiki = function () {return uriwiki;}
	this.getImage = function() { return image; }
	this.setImage = function(image_) { image = image_; }
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

		try {
			var visibleTabId = null;

			if (tabs.length>0) {
				visibleTabId = tabs[0].id;
				for (var i=0; i<tabs.length; i++) {
					var tab = tabs[i];
					this.tabInstances[tab.id] = new Tab(tab, this);

					if (tab.visible == 'true') {
						visibleTabId = tab.id;
					}
				}
			}

			this.contextManager = new ContextManager(this, this.workSpaceGlobalInfo);
			this.wiring = new Wiring(this, this.workSpaceGlobalInfo);
			this.wiringInterface = new WiringInterface(this.wiring, this, $("wiring"), $("wiring_link"));

			if (tabs.length > 0) {
				for (i = 0; i < tabs.length; i++)
					this.tabInstances[tabs[i].id].getDragboard().paint();
			}

			//set the visible tab. It will be displayed as current tab afterwards
			this.visibleTab = this.tabInstances[visibleTabId];

			this.valid=true;
		} catch (error) {
			// Error during initialization
			// Only loading workspace menu
			this.valid=false;

			// Log it on the log console
			this.tabInstances = new Hash();
			msg = interpolate(gettext("Error loading workspace: %(error)s"),
			                  {error: error}, true);
			LogManagerFactory.getInstance().log(msg);

			// Show a user friend alert
			LayoutManagerFactory.getInstance().showMessageMenu('Error during workspace load! Please, change active workspace or create a new one!')
		}

		this.loaded = true;

		this._createWorkspaceMenu();

		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
	}

	var onError = function (transport, e) {
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
		msg = interpolate(gettext("Error retreiving workspace data: %(errorMsg)s."),
		                          {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var renameSuccess = function(transport) {
	}
	var renameError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error renaming workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
	}
	var deleteSuccess = function(transport) {
		var tabList = this.tabInstances.keys();
		
		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];
			tab.destroy;
			//TODO:treatment of wiring, varManager, etc.
		}
		LayoutManagerFactory.getInstance().hideCover();
	}
	var deleteError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error removing workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
	}
	var publishSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var mashupInfo = eval ('(' + response + ')');		
		UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', mashupInfo.url);
	}
	var publishError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error publishing workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
		
	}
	
	var mergeSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var data = eval ('(' + response + ')');
		//update the new wsInfo
		opManager = OpManagerFactory.getInstance();
		opManager.changeActiveWorkSpace(opManager.workSpaceInstances[data.merged_workspace_id]);
		LayoutManagerFactory.getInstance().hideCover();
	}
	
	var mergeError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error merging workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
		
	}	
	
	//**** TAB CALLBACK*****
	var createTabSuccess = function(transport) {
		var response = transport.responseText;
		var tabInfo = eval ('(' + response + ')');
		
		tabInfo.igadgetList=[];
		
		var newTab = new Tab(tabInfo, this);
		this.tabInstances[tabInfo.id] = newTab;
		this._checkLock();
		this.setTab(this.tabInstances[tabInfo.id]);
		for(var i=0; i< tabInfo.workspaceVariables.length; i++){
			this.varManager.parseWorkspaceVariable(tabInfo.workspaceVariables[i]);
			this.wiring.processVar(tabInfo.workspaceVariables[i]);
		}

		newTab.getDragboard().paint();
	}
	
	var createTabError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error creating a tab: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	// ****************
	// PUBLIC METHODS
	// ****************
	
	WorkSpace.prototype.igadgetLoaded = function(igadgetId) {
		var igadget = this.getIgadget(igadgetId);
		var reload = igadget.loaded;
		igadget._notifyLoaded();

		if (reload) {
			this.wiring.refreshIGadget(igadget);
		} if (this._allIgadgetsLoaded()) {
			this.wiring.propagateInitialValues(true);
		}
	}
	
	WorkSpace.prototype.sendBufferedVars = function () {
		this.varManager.sendBufferedVars();
	}
	
	WorkSpace.prototype.fillWithLabel = function() {
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		if(this.workSpaceNameHTMLElement != null){
			this.workSpaceNameHTMLElement.remove();
		}
		var nameToShow = (this.workSpaceState.name.length>15)?this.workSpaceState.name.substring(0, 15)+"..." : this.workSpaceState.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
		new Insertion.Top(this.workSpaceHTMLElement, spanHTML);
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		Event.observe(this.workSpaceNameHTMLElement, 'click', function(e){
			if (LayoutManagerFactory.getInstance().getCurrentViewType() == "dragboard") {
				this.fillWithInput();
			}
			else {
				OpManagerFactory.getInstance().showActiveWorkSpace();
			}
		}.bind(this));
		LayoutManagerFactory.getInstance().resizeTabBar();
    }


	WorkSpace.prototype.fillWithInput = function () {
		this.workSpaceNameHTMLElement.remove();
		var inputHTML = "<input class='ws_name' value='"+this.workSpaceState.name+"' size='"+this.workSpaceState.name.length+" maxlength=30' />";
		new Insertion.Top(this.workSpaceHTMLElement, inputHTML);
		this.workSpaceNameHTMLElement =  this.workSpaceHTMLElement.firstDescendant();
		this.workSpaceNameHTMLElement.focus();	
		Event.observe(this.workSpaceNameHTMLElement, 'blur', function(e){Event.stop(e);
					this.fillWithLabel()}.bind(this));
		Event.observe(this.workSpaceNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
					e.target.blur();}}.bind(this));						
		Event.observe(this.workSpaceNameHTMLElement, 'change', function(e){Event.stop(e);
					this.updateInfo(e.target.value);}.bind(this));
		Event.observe(this.workSpaceNameHTMLElement, 'keyup', function(e){Event.stop(e);
					e.target.size = (e.target.value.length==0)?1:e.target.value.length;}.bind(this));
	}
	
	
    WorkSpace.prototype.updateInfo = function (workSpaceName) {
		//If the server isn't working the changes will not be saved
		if(workSpaceName == "" || workSpaceName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a workspace: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		}else if(!OpManagerFactory.getInstance().workSpaceExists(workSpaceName)){
			this.workSpaceState.name = workSpaceName;		
	
			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
			var o = new Object;
			o.name = workSpaceName;
			var workSpaceData = Object.toJSON(o);
			var params = {'workspace': workSpaceData};
			PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, renameSuccess, renameError);
		}else{
			var msg = interpolate(gettext("Error updating a workspace: the name %(workSpaceName)s is already in use."), {workSpaceName: workSpaceName}, true);
			LogManagerFactory.getInstance().log(msg);
		}
    }  
    
    WorkSpace.prototype.deleteWorkSpace = function() {
		if(OpManagerFactory.getInstance().removeWorkSpace(this.workSpaceState.id)){
			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
			PersistenceEngineFactory.getInstance().send_delete(workSpaceUrl, this, deleteSuccess, deleteError);		
		}
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
	
	WorkSpace.prototype.getWiringInterface = function () {
    	return this.wiringInterface;
	}
    
    WorkSpace.prototype.getVarManager = function () {
    	return this.varManager;
	}
	
	WorkSpace.prototype.getContextManager = function () {
    	return this.contextManager;
	}

	WorkSpace.prototype.downloadWorkSpaceInfo = function () {
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
		PersistenceEngineFactory.getInstance().send_get(workSpaceUrl, this, loadWorkSpace, onError);
	}
	
	WorkSpace.prototype.showWiring = function() {
		if (!this.loaded)
			return;
	
		if (!this.isValid())
			return;
		
		this.visibleTab.unmark();
		this.wiringInterface.show();
	}
	
	WorkSpace.prototype.getIgadget = function(igadgetId) {
		var tabs = this.tabInstances.keys();	
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var igadget = this.tabInstances[tab].getDragboard().getIGadget(igadgetId);
			
			if (igadget)
				return igadget;
		}
	}

	//hide all information about a workspace (wiring, tabs)
	WorkSpace.prototype.hide = function() {
		if (!this.loaded)
			return;
		
		//this.wiringInterface.hide();

		
		var tabList = this.tabInstances.keys();
		
		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];
			
			tab.hide();
		}
	}

	WorkSpace.prototype.show = function() {	
		if (!this.loaded)
			return;

		//global tab section
		this.fillWithLabel();

		var tabList = this.tabInstances.keys();

		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];

			if (tab == this.visibleTab)
				tab.show();
			else
				tab.unmark();
		}

		if (this.visibleTab) {
			//show the current tab in the tab bar if it isn't within the visible area
			//!this.visibleTab => error during initialization
			this.visibleTab.makeVisibleInTabBar();
			this.visibleTab.getDragboard()._notifyWindowResizeEvent();
		}

	}
	
	WorkSpace.prototype.isValid = function() {
		return this.valid;
	}
	
	WorkSpace.prototype.getTab = function(tabId) {
		return this.tabInstances[tabId];
	}
	
	WorkSpace.prototype.setTab = function(tab) {
		if (!this.loaded)
			return;
		if(this.visibleTab != null){
			this.visibleTab.unmark();
		}
		this.visibleTab = tab;
		this.visibleTab.show();
		
	}
	
	WorkSpace.prototype.getVisibleTab = function() {
		if (!this.loaded)
			return;
		
		return this.visibleTab;
	}
	
	WorkSpace.prototype.tabExists = function(tabName){
		var tabValues = this.tabInstances.values();
		for(var i=0;i<tabValues.length;i++){
			if(tabValues[i].tabInfo.name == tabName)
				return true;
		}
		return false;
	}
	
	WorkSpace.prototype.addTab = function() {
		if (!this.isValid()) {
			return;
		}
	
		var counter = this.tabInstances.keys().length + 1;
		var tabName = "MyTab "+counter.toString();
		//check if there is another tab with the same name
		while (this.tabExists(tabName)){
			tabName = "MyTab "+(counter++).toString();
		}
		var tabsUrl = URIs.GET_POST_TABS.evaluate({'workspace_id': this.workSpaceState.id});
		var o = new Object;
		o.name = tabName;
		tabData = Object.toJSON(o);
		params = 'tab=' + tabData;
		PersistenceEngineFactory.getInstance().send_post(tabsUrl, params, this, createTabSuccess, createTabError);
	
	}
	
	WorkSpace.prototype.removeTab = function(tabId){
		if(this.tabInstances.keys().length <= 1){
			var msg;
			msg = "there must be one tab at least";

			msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
			return false;
		}
		
		this.unloadTab(tabId);
		
		//set the first tab as current
		this.setTab(this.tabInstances.values()[0]);
		
		return true
	}
	
	WorkSpace.prototype.unloadTab = function(tabId){
		var tab = this.tabInstances[tabId];

		this.tabInstances.remove(tabId);

		this.varManager.removeWorkspaceVariable(tab.connectable.variable.id);

		tab.connectable.destroy();
		tab.destroy();

		this.visibleTab = null;
	}
	
	WorkSpace.prototype.unload = function() {
		// Unload Wiring Interface
		// TODO Wiring Interface should be shared between Workspaces
		if (this.wiringInterface !== null) {
			this.wiringInterface.unload();
			this.wiringInterface = null;
		}

		LayoutManagerFactory.getInstance().unloadCurrentView();

		this.sendBufferedVars();

		// After that, tab info is managed
		var tabKeys = this.tabInstances.keys();

		for (var i=0; i<tabKeys.length; i++) {
			this.unloadTab(tabKeys[i]);
		}
		// reset the values used to figure out the size of the tabBar
		LayoutManagerFactory.getInstance().resetTabBar();

		if (this.wiring !== null)
			this.wiring.unload();
		if (this.contextManager !== null)
			this.contextManager.unload();

		this.menu.remove();
		this.mergeMenu.remove();
	}

	WorkSpace.prototype.goTab = function(tab) {
		if (!this.loaded)
			return;
		
		this.visibleTab.unmark();
		this.visibleTab = tab;
		this.visibleTab.go();
	}
	

	WorkSpace.prototype.addIGadget = function(tab, igadget, igadgetJSON) {
		this.varManager.addInstance(igadget, igadgetJSON);
		this.contextManager.addInstance(igadget, igadget.getGadget().getTemplate());
		this.wiring.addInstance(igadget, igadgetJSON.variables);

		igadget.paint();

		// The dragboard must be shown after an igadget insertion
		//LayoutManagerFactory.getInstance().unMarkGlobalTabs();
		this.visibleTab.show();
	}
	
	WorkSpace.prototype.removeIGadgetData = function(iGadgetId) {
			this.varManager.removeInstance(iGadgetId);
			this.wiring.removeInstance(iGadgetId);
			this.contextManager.removeInstance(iGadgetId);
	}
	
	WorkSpace.prototype.removeIGadget = function(iGadgetId) {
			this.visibleTab.getDragboard().removeInstance(iGadgetId); // TODO split into hideInstance and removeInstance
			this.removeIGadgetData(iGadgetId);
	}

	WorkSpace.prototype.getIGadgets = function() {
		if (!this.loaded)
			return;

		var iGadgets = new Array();
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			iGadgets = iGadgets.concat(this.tabInstances[keys[i]].getDragboard().getIGadgets());
		}

		return iGadgets;
	}
	
	WorkSpace.prototype.getActiveDragboard = function() {
		return this.visibleTab.getDragboard();
	}
	
	WorkSpace.prototype.shareWorkspace = function(value) {
		var share_workspace_success = function (transport) {
			var response = transport.responseText;
			var result = eval ('(' + response + ')');
			
			alert('New workspace shared in ' + result['url'])
		}
		
		var share_workspace_error = function (transport) {
			alert('Error sharing workspace')
		}
		
		var url = URIs.PUT_SHARE_WORKSPACE.evaluate({'workspace_id': this.workSpaceState.id, 'share_boolean': value})
		
		PersistenceEngineFactory.getInstance().send_update(url, {}, this, share_workspace_success, share_workspace_error);
	}
	
	WorkSpace.prototype.publish = function(data) {
		var workSpaceUrl = URIs.POST_PUBLISH_WORKSPACE.evaluate({'workspace_id': this.workSpaceState.id});
		publicationData = Object.toJSON(data);
		params = 'data=' + publicationData;
		PersistenceEngineFactory.getInstance().send_post(workSpaceUrl, params, this, publishSuccess, publishError);
	}
	
		WorkSpace.prototype.mergeWith = function(workspace_id){
			var workSpaceUrl = URIs.GET_MERGE_WORKSPACE.evaluate({'from_ws_id': workspace_id, 'to_ws_id': this.workSpaceState.id});
			PersistenceEngineFactory.getInstance().send_get(workSpaceUrl, this, mergeSuccess, mergeError);			
		}

    // *****************
    //  CONSTRUCTOR
    // *****************

	this.workSpaceState = workSpaceState;
	this.workSpaceGlobal = null;
	this.wiringInterface = null;
	this.varManager = null;
	this.tabInstances = new Hash();
	this.wiring = null;
	this.varManager = null;
	this.contextManager = null;
	this.loaded = false;
	this.wiringLayer = null;
	this.visibleTab = null;
	this.workSpaceHTMLElement = $('workspace_name');
	this.menu = null;
	this.mergeMenu = null;
	this.unlockEntryPos;
	this.valid=false;
	
	var wsOpsLauncher = 'ws_operations_link';
	var idMenu = 'menu_'+this.workSpaceState.id;
	
	
	//create workspace menu
	this._createWorkspaceMenu = function(){

		//worksplace menu
		var optionPosition = 0;
		var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"><div id="submenu_'+idMenu+'" class="submenu"></div></div>';
		new Insertion.After($('menu_layer'), menuHTML);
		this.menu = new DropDownMenu(idMenu);
		
		//mergeWith workspace Menu
		var idMergeMenu = 'mergeMenu_'+this.workSpaceState.id;
		var mergeMenuHTML = '<div id="'+idMergeMenu+'" class="drop_down_menu"></div></div>';
		new Insertion.After($('menu_layer'), mergeMenuHTML);
		this.mergeMenu = new DropDownMenu(idMergeMenu, this.menu);
		
		//adding options to workspace menu
		this.menu.addOption("/ezweb/images/rename.gif", gettext("Rename"), function(){OpManagerFactory.getInstance().activeWorkSpace.fillWithInput(); 
							LayoutManagerFactory.getInstance().hideCover();},optionPosition++);
		if (this.workSpaceGlobalInfo.workspace.active != "true") {
			this.activeEntryId = this.menu.addOption("/ezweb/images/active.png", gettext("Mark as Active"), function(){LayoutManagerFactory.getInstance().hideCover(); this.markAsActive();}.bind(this),optionPosition++);
		}
		this.unlockEntryPos = optionPosition;
		this.unlockEntryId = this.menu.addOption("/ezweb/images/unlock.png", gettext("Unlock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this), optionPosition++);
		this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", gettext("Lock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this), optionPosition++);							
		var res = this._checkLock();
		optionPosition -= res;

		this.menu.addOption("/ezweb/images/remove.png", gettext("Remove"),function(){LayoutManagerFactory.getInstance().showWindowMenu('deleteWorkSpace');}, optionPosition++);
		//TODO:Intermediate window to ask for data (name, description...)
		this.menu.addOption("/ezweb/images/publish.png", gettext("Publish workspace"),function(){LayoutManagerFactory.getInstance().showWindowMenu('publishWorkSpace');}.bind(this), optionPosition++);
		
		if(OpManagerFactory.getInstance().workSpaceInstances.keys().length > 1){ //there are several workspaces
			this.menu.addOption("/ezweb/images/merge.png", gettext("Merge with workspace..."),function(e){LayoutManagerFactory.getInstance().showDropDownMenu('workSpaceOpsSubMenu',this.mergeMenu, Event.pointerX(e), Event.pointerY(e));}.bind(this), optionPosition++);
		}
		
		this.menu.addOption("/ezweb/images/publish.png", gettext("Share workspace"),function(){LayoutManagerFactory.getInstance().hideCover(); this._shareWorkspace();}.bind(this), optionPosition++);
		
		this.menu.addOption("/ezweb/images/list-add.png", gettext("New workspace"),function(){LayoutManagerFactory.getInstance().showWindowMenu('createWorkSpace');}, optionPosition++);
	}
	
	this._lockFunc = function(locked) {
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			this.tabInstances[keys[i]]._lockFunc(locked);
		}
	}.bind(this);
	
	// Share current workspace to the rest of users
	this._shareWorkspace = function() {
		this.shareWorkspace(true);
	}.bind(this);
	
	this._checkLock = function() {
		var keys = this.tabInstances.keys();
		var all = true;
		var locked = null;
		var numRemoved = 0;
		var position = this.unlockEntryPos;
		for (var i = 0; i < keys.length; i++) {
			if (i == 0){
				locked = this.tabInstances[keys[i]].dragboard.isLocked();
			} else if (locked != this.tabInstances[keys[i]].dragboard.isLocked()){
				all = false;
			}
		}
		
		if(all){
			if(locked && this.lockEntryId!=null){
				this.menu.removeOption(this.lockEntryId);
				this.lockEntryId = null;
				numRemoved++;
			}else if(!locked && this.unlockEntryId!=null){
				this.menu.removeOption(this.unlockEntryId);
				this.unlockEntryId = null;	
				numRemoved++;
			}
		}
		
		if((!all || locked) && this.unlockEntryId==null){
			this.unlockEntryId = this.menu.addOption("/ezweb/images/unlock.png", gettext("Unlock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this), this.unlockEntryPos);
		}
		if((!all || !locked) && this.lockEntryId==null){
			if(this.unlockEntryId)
				position = this.unlockEntryPos + 1;
			this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", gettext("Lock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this), position);	
		}
		return numRemoved;
	}.bind(this);
	
	this.markAsActive = function (){
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id});
		var o = new Object;
		o.active = "true"
		var workSpaceData = Object.toJSON(o);
		var params = {'workspace': workSpaceData};
		PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, this.markAsActiveSuccess, this.markAsActiveError);
	}.bind(this);
	
	this.markAsActiveSuccess = function() {
		this.workSpaceGlobalInfo.workspace.active = "true";
		this.workSpaceState.active = "true";
		if(this.activeEntryId!=null){
			this.menu.removeOption(this.activeEntryId);
			this.activeEntryId = null;
		}
	}.bind(this);
	
	this.markAsActiveError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error marking as first active workspace, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}.bind(this);
	
	this._allIgadgetsLoaded = function() {
		var tabs = this.tabInstances.keys();	
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var remainingIgadgets = this.tabInstances[tab].getDragboard().getRemainingIGadgets();
			
			if (remainingIgadgets != 0)
				return false;
		}	
		
		return true;
	}
}


function Tab (tabInfo, workSpace) {

	//CALLBACK METHODS
	var renameSuccess = function(transport){

	}
	var renameError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error renaming a tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var deleteSuccess = function(transport){
		LayoutManagerFactory.getInstance().hideCover();
	}
	var deleteError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error removing a tab: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
		
		LayoutManagerFactory.getInstance().hideCover();
	}

	// ****************
	// PUBLIC METHODS
	// ****************

	Tab.prototype.destroy = function() {
		LayoutManagerFactory.getInstance().removeFromTabBar(this.tabHTMLElement);
		
		this.menu.remove();
		
		this.dragboard.destroy();
	}


	Tab.prototype.updateInfo = function (tabName) {

		//If the server isn't working the changes will not be saved
		if(tabName=="" || tabName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a tab: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		}else if(!this.workSpace.tabExists(tabName)){
			this.tabInfo.name = tabName;
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			var o = new Object;
			o.name = tabName;
			var tabData = Object.toJSON(o);
			var params = {'tab': tabData};
			PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, renameSuccess, renameError);
		}else{
			var msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workSpace.workSpaceState.name}, true);
			LogManagerFactory.getInstance().log(msg);
		}
	}

	Tab.prototype.deleteTab = function() {
		if(this.workSpace.removeTab(this.tabInfo.id)==true){
			var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
			PersistenceEngineFactory.getInstance().send_delete(tabUrl, this, deleteSuccess, deleteError);		
		}
	}

	Tab.prototype.fillWithLabel = function() {
		if(this.tabNameHTMLElement != null){
			this.tabNameHTMLElement.remove();
		}
		var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
		new Insertion.Top(this.tabHTMLElement, spanHTML);
		var difference = this.tabHTMLElement.getWidth() - this.tabWidth;
		if(difference!=0)
			LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabNameHTMLElement = this.tabHTMLElement.firstDescendant();
		this.tabWidth = this.tabHTMLElement.getWidth();
	}

	Tab.prototype.fillWithInput = function () {
		var oldTabWidth= this.tabHTMLElement.getWidth();
		this.tabNameHTMLElement.remove();
		var inputHTML = "<input class='tab_name' value='"+this.tabInfo.name+"' size='"+(this.tabInfo.name.length)+"' maxlength=30 />";
		new Insertion.Top(this.tabHTMLElement, inputHTML);
		this.tabNameHTMLElement =  this.tabHTMLElement.firstDescendant();
		var newTabWidth= this.tabHTMLElement.getWidth();
		var difference= newTabWidth-oldTabWidth;
		if (difference!=0)
			LayoutManagerFactory.getInstance().changeTabBarSize(difference);
		this.tabWidth = newTabWidth;
		
		this.tabNameHTMLElement.focus();
		Event.observe(this.tabNameHTMLElement, 'blur', function(e){Event.stop(e);
					this.fillWithLabel()}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
					e.target.blur();} else{this.makeVisibleInTabBar();}}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'change', function(e){Event.stop(e);
					this.updateInfo(e.target.value);}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'keyup', function(e){Event.stop(e);
					e.target.size = (e.target.value.length==0)?1:e.target.value.length;
					var newTabWidth = e.target.parentNode.getWidth();
					var difference= newTabWidth-this.tabWidth;
					if (difference!=0)
						LayoutManagerFactory.getInstance().changeTabBarSize(difference);
					this.tabWidth = newTabWidth;
				}.bind(this));
		Event.observe(this.tabNameHTMLElement, 'click', function(e){Event.stop(e);}); //do not propagate to div.
	}
	
	Tab.prototype.unmark = function () {
		//this.hideDragboard();
		LayoutManagerFactory.getInstance().unmarkTab(this.tabHTMLElement, this.tabOpsLauncher, this.changeTabHandler, this.renameTabHandler);

	}

	Tab.prototype.show = function () {
		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

		this.dragboard._notifyWindowResizeEvent();
		this.markAsCurrent();
	}
	
		/* if the tab is out of the visible area of the tab bar, slide it to show it */
	Tab.prototype.makeVisibleInTabBar = function(){
		var tabLeft = Position.cumulativeOffset(this.tabHTMLElement)[0];
		var fixedBarLeft = LayoutManagerFactory.getInstance().getFixedBarLeftPosition();
		var difference = tabLeft - fixedBarLeft;
		if (difference < 0){
			LayoutManagerFactory.getInstance().changeScrollBarRightPosition(difference);
		}
		else{
			var fixedBarRight = fixedBarLeft + LayoutManagerFactory.getInstance().getFixedBarWidth();
			var visibleTabArea = fixedBarRight - tabLeft;
			difference = visibleTabArea - this.tabHTMLElement.getWidth();
			if(difference < 0){
				LayoutManagerFactory.getInstance().changeScrollBarRightPosition(-1*difference);
			}
		}
	}
	
	Tab.prototype.markAsCurrent = function (){
		LayoutManagerFactory.getInstance().markTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	}
	
	Tab.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideTab(this.tabHTMLElement);
		//this.hideDragboard();
	}
	
	Tab.prototype.go = function () {

		LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

	    this.dragboard.recomputeSize();
	    LayoutManagerFactory.getInstance().goTab(this.tabHTMLElement, this.tabOpsLauncher, this.renameTabHandler, this.changeTabHandler);
	    this.makeVisibleInTabBar();
	}

	Tab.prototype.getDragboard = function () {
		return this.dragboard;
	}

    // *****************
	//  PRIVATE METHODS
    // *****************
	
	
	/*constructor*/
	
	// The name of the dragboard HTML elements correspond to the Tab name
	this.workSpace = workSpace;
	this.tabInfo = tabInfo;
	this.dragboardLayerName = "dragboard_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
	this.tabHTMLElement;
	this.tabNameHTMLElement = null;
	this.tabWidth = 0;

	//tab event handlers
	this.renameTabHandler = function(e){
		this.makeVisibleInTabBar();
		this.fillWithInput();
	}.bind(this);
	
	this.changeTabHandler = function(e){
		this.workSpace.setTab(this);
		this.makeVisibleInTabBar();
	}.bind(this);

	// Dragboard layer creation
	var wrapper = $("wrapper");

	this.dragboardElement = document.createElement("div");
	this.dragboardElement.className = "container dragboard";
	wrapper.insertBefore(this.dragboardElement, wrapper.firstChild);

	this.dragboardElement.setAttribute('id', this.dragboardLayerName);

	this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
	
	LayoutManagerFactory.getInstance().resizeContainer(this.dragboardElement);
	
	// Tab creation
	//add a new tab to the tab section
	this.tabHTMLElement = LayoutManagerFactory.getInstance().addToTabBar(this.tabName);

	this.tabOpsLauncher = this.tabName+"_launcher";
	var tabOpsLauncherHTML = '<input id="'+this.tabOpsLauncher+'" type="button" title="'+gettext("Options")+'" class="tabOps_launcher tabOps_launcher_show"/>';
	new Insertion.Bottom(this.tabHTMLElement, tabOpsLauncherHTML);
	var tabOpsLauncherElement = $(this.tabOpsLauncher);
	Event.observe(tabOpsLauncherElement, "click", function(e){e.target.blur();Event.stop(e);
													LayoutManagerFactory.getInstance().showDropDownMenu('tabOps',this.menu, Event.pointerX(e), Event.pointerY(e));}.bind(this), true);
	tabOpsLauncherElement.setStyle({'display':'none'});

	//fill the tab label with a span tag
	this.fillWithLabel();

	//create tab menu
	var idMenu = 'menu_'+this.tabName;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);
	this.menu.addOption("/ezweb/images/rename.gif",
	                    gettext("Rename"),
			    function() {
			        OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().fillWithInput();
				LayoutManagerFactory.getInstance().hideCover();
	                    },
			    0);

	this._lockFunc = function(locked) {
		if (locked) {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/unlock.png", gettext("Unlock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this));
		} else {
			this.menu.updateOption(this.lockEntryId, "/ezweb/images/lock.png", gettext("Lock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this));	
		}
		this.dragboard.setLock(locked);
		this.workSpace._checkLock();
	}.bind(this);

	if (this.dragboard.isLocked()) {
		this.lockEntryId = this.menu.addOption("/ezweb/images/unlock.png", gettext("Unlock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(false);}.bind(this),1);
	} else {
		this.lockEntryId = this.menu.addOption("/ezweb/images/lock.png", gettext("Lock"), function(){LayoutManagerFactory.getInstance().hideCover(); this._lockFunc(true);}.bind(this),1);
	}
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.firstVisible = false;
				tab.visibleEntryId = tab.menu.addOption("/ezweb/images/visible.png", gettext("First Visible"), function(){LayoutManagerFactory.getInstance().hideCover(); tab.markAsVisible();}.bind(tab),1);	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisible = function (){
		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
		var o = new Object;
		o.visible = "true";
		var tabData = Object.toJSON(o);
		var params = {'tab': tabData};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, this.markAsVisibleSuccess, this.markAsVisibleError);
	}.bind(this);
	
	this.markAsVisibleSuccess = function() {
		var tabIds = this.workSpace.tabInstances.keys();
		for(var i = 0; i < tabIds.length; i++){
			var tab = this.workSpace.tabInstances[tabIds[i]];
			if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
				tab.addMarkAsVisible();	
			}
		}
		this.firstVisible = true;
		if(this.visibleEntryId!=null){
			this.menu.removeOption(this.visibleEntryId);
			this.visibleEntryId = null;
		}
	}.bind(this);
	
	this.markAsVisibleError = function(transport, e){
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}.bind(this);
	
	this.addMarkAsVisible = function (){
		this.firstVisible = false;
		this.visibleEntryId = this.menu.addOption("/ezweb/images/visible.png", gettext("Mark as Visible"), function(){LayoutManagerFactory.getInstance().hideCover(); this.markAsVisible();}.bind(this),1);
	}.bind(this);
	
	if (this.tabInfo.visible != "true") {
		this.addMarkAsVisible();
	} else {
		this.firstVisible = true;
		this.visibleEntryId = null;
	}
	
	this.menu.addOption("/ezweb/images/remove.png", "Remove",function(){LayoutManagerFactory.getInstance().showWindowMenu('deleteTab');},2);
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
			
			var isDefaultWS = workSpacesStructure.isDefault;
			var workSpaces = workSpacesStructure.workspaces;
			var activeWorkSpace = null;
			
			for (var i = 0; i<workSpaces.length; i++) {
				var workSpace = workSpaces[i];

				this.workSpaceInstances[workSpace.id] = new WorkSpace(workSpace);

				if (public_workspace && public_workspace != '') {
				    if (workSpace.id == public_workspace) {
					  activeWorkSpace=this.workSpaceInstances[workSpace.id];
					  continue;
					}
				}
                else {
					if (workSpace.active == "true") {
						activeWorkSpace=this.workSpaceInstances[workSpace.id];
					}
				}	
			}
			
			// set handler for workspace options button
			Event.observe($('ws_operations_link'), 'click', function(e){
				if (LayoutManagerFactory.getInstance().getCurrentViewType() == "dragboard") {
					e.target.blur();
					LayoutManagerFactory.getInstance().showDropDownMenu('workSpaceOps', this.activeWorkSpace.menu, Event.pointerX(e), Event.pointerY(e));
				}
				else {
					OpManagerFactory.getInstance().showActiveWorkSpace();
				}
			}.bind(this));
			
			// Total information of the active workspace must be downloaded!
			if (isDefaultWS=="true"){
				//the showcase must be reloaded to have all new gadgets
				//it itself changes to the active workspace
				ShowcaseFactory.getInstance().reload(workSpace.id);
				
			}else{
				this.activeWorkSpace = activeWorkSpace;
				this.activeWorkSpace.downloadWorkSpaceInfo();
			}
		}
		
		var onError = function (transport, e) {
			var msg;
			try {
				if (e) {
					msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
					                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
					                  true);
				} else if (transport.responseXML) {
					msg = transport.responseXML.documentElement.textContent;
				} else {
					msg = "HTTP Error " + transport.status + " - " + transport.statusText;
				}
				msg = interpolate(gettext("Error loading EzWeb Platform: %(errorMsg)s."),
				                          {errorMsg: msg}, true);
				LogManagerFactory.getInstance().log(msg);
			} catch (e) {
			}

			alert (gettext("Error loading EzWeb Platform"));
		}
		
		/*****WORKSPACE CALLBACK***/
		var createWSSuccess = function(transport){
			var response = transport.responseText;
			var wsInfo = eval ('(' + response + ')');
			this.workSpaceInstances[wsInfo.workspace.id] = new WorkSpace(wsInfo.workspace);
			this.changeActiveWorkSpace(this.workSpaceInstances[wsInfo.workspace.id]);
			LayoutManagerFactory.getInstance().hideCover();
		}
		
		var createWSError = function(transport, e){
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error creating a workspace: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		
		}

		
		// *********************************
		// PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		// Singleton modules
		this.showcaseModule = null;
		this.contextManagerModule = null;
		this.catalogue = null;
		this.logs = null;
		this.persistenceEngine = PersistenceEngineFactory.getInstance();
		
		this.loadCompleted = false;
		this.firstAccessToTheCatalogue = true;
		this.catalogueIsCurrentTab = false;
		
		// Variables for controlling the collection of wiring and dragboard instances of a user
		this.workSpaceInstances = new Hash();
		this.activeWorkSpace = null;

		
		// ****************
		// PUBLIC METHODS 
		// ****************

		OpManager.prototype.showCatalogue = function () {
			if (!this.activeWorkSpace.isValid()) {
				//Nothing to do!
				return;
			}

			UIUtils.repaintCatalogue=true;
			UIUtils.sendPendingTags();
			
			if (LayoutManagerFactory.getInstance().getCurrentViewType() == 'catalogue') { 
				this.catalogueIsCurrentTab = true;
			}
			this.catalogue.show();

			this.activeWorkSpace.getVisibleTab().markAsCurrent();
			
			// Load catalogue data!
			if (this.firstAccessToTheCatalogue || this.catalogueIsCurrentTab)
			{
				this.catalogue.initCatalogue();
				this.firstAccessToTheCatalogue = false;
				this.catalogueIsCurrentTab = false;
			} else {
				UIUtils.repaintCatalogue=false;
			}
			UIUtils.resizeResourcesContainer();
		}

		OpManager.prototype.showLogs = function () {
			if(this.activeWorkSpace && this.activeWorkSpace.getVisibleTab())
				this.activeWorkSpace.getVisibleTab().unmark();
			
			LogManagerFactory.getInstance().show();
		}
		
		OpManager.prototype.clearLogs = function () {
			LogManagerFactory.getInstance().reset();
			LayoutManagerFactory.getInstance().clearErrors();
			LayoutManagerFactory.getInstance().resizeTabBar();
			this.showActiveWorkSpace();
		}

		OpManager.prototype.changeActiveWorkSpace = function (workSpace) {
			$("loading-indicator").removeClassName("disabled"); // TODO

			if(this.activeWorkSpace != null){
				this.activeWorkSpace.unload();
			}

			this.activeWorkSpace = workSpace;
			this.activeWorkSpace.downloadWorkSpaceInfo();
		}

		OpManager.prototype.addInstance = function (gadgetId) {
			if (!this.loadCompleted)
				return;

			var gadget = this.showcaseModule.getGadget(gadgetId);
			this.activeWorkSpace.getVisibleTab().getDragboard().addInstance(gadget);
		}

		OpManager.prototype.unsubscribeServices = function (gadgetId) {
			var unsubscribeOk = function (transport) {
			}

			var unsubscribeError = function (transport) {
			}

			unsubscribe_url += "?igadget=";
			unsubscribe_url += gadgetId;
			unsubscribe_url += "&user=";
			unsubscribe_url += ezweb_user_name;

			var params = {'method': "GET", 'url':  unsubscribe_url}; 
			this.persistenceEngine.send_post("/proxy", params, this, unsubscribeOk, unsubscribeError);
		}

		OpManager.prototype.cancelServices = function (gadgetId) {
			var cancelOk = function (transport) {
			}

			var cancelError = function (transport) {
			}

			var cancel_url = URIs.HOME_GATEWAY_DISPATCHER_CANCEL_URL;

			cancel_url += "?igadget=";
			cancel_url += gadgetId;
			cancel_url += "&user=";
			cancel_url += ezweb_user_name;

			var params = {'method': "GET", 'url':  cancel_url};
			this.persistenceEngine.send_post("/proxy", params, this, cancelOk, cancelError);
		}

		OpManager.prototype.removeInstance = function (iGadgetId) {
			if (!this.loadCompleted)
				return;
			this.activeWorkSpace.removeIGadget(iGadgetId);
		}


		OpManager.prototype.sendEvent = function (gadget, event, value) {
			this.activeWorkSpace.getWiring().sendEvent(gadget, event, value);
		}

		OpManager.prototype.loadEnviroment = function () {
			// Init Layout Manager
			LayoutManagerFactory.getInstance().resizeWrapper();

			// First, global modules must be loaded (Showcase, Catalogue)
			// Showcase is the first!
			// When it finish, it will invoke continueLoadingGlobalModules method!
			this.showcaseModule = ShowcaseFactory.getInstance();
			this.showcaseModule.init();
			this.logs = LogManagerFactory.getInstance();

			Event.observe(window,
			              "unload",
			              this.unloadEnvironment.bind(this),
			              true);
		}

		OpManager.prototype.unloadEnvironment = function() {
			if (this.activeWorkSpace)
				this.activeWorkSpace.unload();

			UIUtils.sendPendingTags();
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

			this.activeWorkSpace.show();
			LayoutManagerFactory.getInstance().refreshChangeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
			LayoutManagerFactory.getInstance().refreshMergeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
		}

		OpManager.prototype.continueLoadingGlobalModules = function (module) {
			// Asynchronous load of modules
			// Each singleton module notifies OpManager it has finished loading!

			if (module == Modules.prototype.SHOWCASE) {
				this.catalogue = CatalogueFactory.getInstance();
				return;
			}

			if (module == Modules.prototype.CATALOGUE) {
				// All singleton modules has been loaded!
				// It's time for loading tabspace information!
				this.loadActiveWorkSpace();
				return;
			}

			if (module == Modules.prototype.ACTIVE_WORKSPACE) {
				this.showActiveWorkSpace(this.activeWorkSpace);
//				this.changeActiveWorkSpace(this.activeWorkSpace);
				//ezweb fly
				if(!BrowserUtilsFactory.getInstance().isIE()) {
					var s = document.createElement('style');
					s.type = "text/css";
					s.innerHTML = '.container { background-image: url(/ezweb/init.dat); background-repeat: no-repeat; background-attachment:scroll; background-position: center bottom;}';
					var h = document.getElementsByTagName("head")[0];
					h.appendChild(s);
				}//TODO: for IE try: document.createStyleSheet() and addRule()

				LayoutManagerFactory.getInstance()._notifyPlatformReady(!this.loadComplete);
				this.loadCompleted = true;
			}
		}

		OpManager.prototype.loadActiveWorkSpace = function () {
			// Asynchronous load of modules
			// Each singleton module notifies OpManager it has finished loading!

			this.persistenceEngine.send_get(URIs.GET_POST_WORKSPACES, this, loadEnvironment, onError)
		}

		OpManager.prototype.logIGadgetError = function(iGadgetId, msg, level) {
			var iGadget = this.activeWorkSpace.getIgadget(iGadgetId);
			if (iGadget == null) {
				var msg2 = gettext("Some pice of code tried to notify an error in the iGadget %(iGadgetId)s when it did not exist or it was not loaded yet. This is an error in EzWeb Platform, please notify it.\nError Message: %(errorMsg)s");
				msg2 = interpolate(msg2, {iGadgetId: iGadgetId, errorMsg: msg}, true);
				this.logs.log(msg2);
				return;
			}

			var gadgetInfo = iGadget.getGadget().getInfoString();
			msg = msg + "\n" + gadgetInfo;

			this.logs.log(msg, level);
			iGadget.notifyError();
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

		OpManager.prototype.addWorkSpace = function (newName) {
			var o = new Object;
			o.name = newName;
			var wsData = Object.toJSON(o);
			var params = {'workspace': wsData};
			PersistenceEngineFactory.getInstance().send_post(URIs.GET_POST_WORKSPACES, params, this, createWSSuccess, createWSError);

		}

		OpManager.prototype.unloadWorkSpace = function(workSpaceId) {
			//Unloading the Workspace
			this.workSpaceInstances[workSpaceId].unload();

			// Removing reference
			//this.workSpaceInstances.remove(workSpaceId);
		}

		OpManager.prototype.removeWorkSpace = function(workSpaceId){
			if (this.workSpaceInstances.keys().length <= 1) {
				var msg = "there must be one workspace at least";
				msg = interpolate(gettext("Error removing workspace: %(errorMsg)s."), {errorMsg: msg}, true);
				
				LogManagerFactory.getInstance().log(msg);
				LayoutManagerFactory.getInstance().hideCover();
				return false;
			}

			// Removing reference
			this.workSpaceInstances.remove(workSpaceId);

			//set the first workspace as current (and unload the former)
			this.changeActiveWorkSpace(this.workSpaceInstances.values()[0]);

			return true;
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
		Showcase.prototype.NUM_CELLS = 4;

		// ****************
		// CALLBACK METHODS 
		// ****************

		this.parseGadgets = function (receivedData_){
			var response = receivedData_.responseText;
			var jsonGadgetList = eval ('(' + response + ')');
		
			// Load all gadgets from persitence system
			for (var i = 0; i<jsonGadgetList.length; i++) {
				var jsonGadget = jsonGadgetList[i];
				var gadget = new Gadget (jsonGadget, null);
				var gadgetId = gadget.getVendor() + '_' + gadget.getName() + '_' + gadget.getVersion();
				
				// Insert gadget object in showcase object model
				this.gadgets[gadgetId] = gadget;
			}
		}

		Showcase.prototype.reload = function (workspace_id) {
			
			var id = workspace_id;
			
			this.gadgets = []
			
			var onSuccess = function (receivedData_) {

				this.parseGadgets(receivedData_);
				
				opManager = OpManagerFactory.getInstance();
	
				opManager.changeActiveWorkSpace(opManager.workSpaceInstances[id]);
			}
			
			var onError = function (receivedData_) {
				alert("error en showcase")
			}

			// Initial load from persitence system
			this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);			
		}
		
		Showcase.prototype.init = function () {

			// Load gadgets from persistence system
			var onSuccess = function (receivedData_) {

				this.parseGadgets(receivedData_);
				
				// Showcase loaded
				this.loaded = true;
				this.opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			
			}
		
			// Error callback (empty gadget list)
			var onError = function (receivedData_) {
				this.loaded = true;
				this.opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
			}
			
			// Initial load from persitence system
			this.persistenceEngine.send_get(URIs.GET_GADGETS, this, onSuccess, onError);
			
		}
		
		
		// *******************************
		// PRIVATE METHODS AND VARIABLES
		// *******************************
		Event.observe($('submit_link'), "click", function(){UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', $('template_uri').value);}, false, "add_resource");
		this.gadgets = new Hash();
		this.loaded = false;
		this.opManager = OpManagerFactory.getInstance();
		this.persistenceEngine = PersistenceEngineFactory.getInstance();			
		
		// ****************
		// PUBLIC METHODS
		// ****************
		
		// Add a new gadget from Internet
		Showcase.prototype.addGadget = function (vendor_, name_, version_, url_) {
			var gadgetId = vendor_ + '_' + name_ + '_' + version_;
			var gadget = this.gadgets[gadgetId];

			if (gadget == null){
				gadget = new Gadget (null, url_);		
			}else{
				this.opManager.addInstance(gadgetId);
			}
		}
		
		// Insert gadget object in showcase object model
		Showcase.prototype.gadgetToShowcaseGadgetModel = function(gadget_) {
			var gadgetId = gadget_.getId();

			this.gadgets[gadgetId] = gadget_;
			this.opManager.addInstance(gadgetId);
		}
		
		// Remove a Showcase gadget
		Showcase.prototype.deleteGadget = function (gadgetId_) {
			var gadget = this.gadgets.remove(gadgetId_);
			//gadget.remove();
		}
		
		// Update a Showcase gadget
		Showcase.prototype.updateGadget = function (gadgetId_, url_) {
			this.remove(gadgetId_);
			this.addGadget(url_);
		}

		// Get a gadget by its gadgetID
		Showcase.prototype.getGadget = function (gadgetId_) {
			return this.gadgets[gadgetId_];
		}
		
		// Set gadget properties (User Interface)
		Showcase.prototype.setGadgetProperties = function (gadgetId_, imageSrc_, tags_) {
			var gadget = this.gadgets[gadgetId_];

			gadget.setImage(imageSrc_);
			gadget.setTags(tags_);
		}

		// Add a tag to a Showcase gadget
		Showcase.prototype.tagGadget = function (gadgetId_, tags_) {
			for (var i = 0; i<tags_.length; i++) {
				var tag = tags_[i];
				this.gadgets[gadgetId_].addTag(tag);
			}
		}
		
		// Deploy a Showcase gadget into dragboard as gadget instance  
		Showcase.prototype.addInstance = function (gadgetId_) {
			var gadget = this.gadgets[gadgetId_];
			this.opManager.addInstance (gadget);
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
 * Creates an instance of a Gadget.
 *
 * @author �lvaro Arranz
 *
 * @class Represents an instance of a Gadget.
 *
 * @param {Gadget}            gadget       Gadget of this iGadget
 * @param {Number}            iGadgetId    iGadget id in persistence. This
 *                                         parameter can be null for new
 *                                         iGadgets (not coming from
 *                                         persistence)
 * @param {String}            iGadgetName  current gadget
 * @param {DragboardLayout}   layout       associated layout
 * @param {DragboardPosition} position     initial position. This parameter can
 *                                         be null for new iGadgets (not coming
 *                                         from persistence)
 * @param {Number}            zPos         initial z coordinate position. This
 *                                         parameter can be null for new
 *                                         iGadgets (not coming from
 *                                         persistence)
 * @param {Number}            width        initial content width
 * @param {Number}            height       initial content height
 * @param {Boolean}           minimized    initial minimized status
 * @param {Boolean}           transparency initial transparency status (true for
 *                                         enabled and false for disabled)
 * @param {String}            menu_color   background color for the iGadget's
 *                                         menu. (6 chars with a hexadecimal
 *                                         color)
 */
function IGadget(gadget, iGadgetId, iGadgetName, layout, position, zPos, width, height, minimized, transparency, menu_color) {
	this.id = iGadgetId;
	this.code = null;
	this.name = iGadgetName;
	this.gadget = gadget;
	this.position = position;
	this.contentWidth = width;
	this.contentHeight = height;
	this.loaded = false;
	this.zPos = zPos;
	this.transparency = transparency;
	this.draggable = null;
	this.visible = false;

	if (!minimized)
		this.height = this.contentHeight;
	else
		this.height = layout.getMenubarSize().inLU;

	this.configurationVisible = false;
	this.minimized = minimized;

	// Elements
	this.element = null;
	this.gadgetMenu = null;
	this.contentWrapper = null;
	this.content = null;
	this.configurationElement = null;
	this.settingsButtonElement = null;
	this.minimizeButtonElement = null;
	this.errorButtonElement = null;
	this.igadgetNameHTMLElement = null;
	this.igadgetInputHTMLElement = null;
	this.statusBar = null;
	this.extractButton = null;

	// Menu attributes
	this.extractOptionId = null;
	this.extractOptionOrder = 0;
	
	this.lowerOpId = null;
	this.raiseOpId = null;
	this.lowerToBottomOpId = null;
	this.raiseToTopOpId = null;

	// iGadget drop box menu
	this.menu = null;

	this.errorCount = 0;

	// Add the iGadget to the layout
	this.build();
	layout.addIGadget(this, true);

	this.menu_color = menu_color ? menu_color : "FFFFFF";
	//this.menu_color = IGadgetColorManager.autogenColor(menu_color, this.code);
}

/**
 * Returns the associated Gadget.
 *
 * @returns {Gadget} the associated Gadget.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @param {DragboardPosition} position the new position for the iGadget.
 */
IGadget.prototype.setPosition = function(position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
		this.element.style.top = this.layout.getRowOffset(position.y) + "px";

		// Notify Context Manager of igadget's position
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);
	}
}

/**
 * Sets the z coordinate position of this iGadget.
 *
 * @param {Number} zPos the new Z coordinate position for the iGadget.
 */
IGadget.prototype.setZPosition = function(zPos) {
	this.zPos = zPos;

	if (this.element)
		this.element.style.zIndex = zPos;
}

/**
 * Gets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getPosition = function() {
	return this.position;
}

/**
 * Gets the z coordinate of this iGadget.
 *
 * @returns {Number} the Z coordinate of the iGadget.
 */
IGadget.prototype.getZPosition = function(zPos) {
	return this.zPos;
}

/**
 * Returns the content width in Layout Units.
 *
 * @returns {Number} the content width in cells.
 */
IGadget.prototype.getContentWidth = function() {
	return this.contentWidth;
}

/**
 * Returns the content height in Layout Units.
 *
 * @returns {Number} the content height in cells.
 */
IGadget.prototype.getContentHeight = function() {
	return this.contentHeight;
}

/**
 * Returns the Tab where this iGadget is displayed.
 *
 * @returns {Tab} associated tab
 */
IGadget.prototype.getTab = function() {
	return this.layout.dragboard.tab;
}

/**
 * Returns the current width of the gadget in LU. This is not the same to the
 * iGadget's content with as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current width of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getWidth = function() {
	// For now, the igadget width is always the width of the igadget content
	return this.contentWidth;
}

/**
 * Returns the current height of the gadget in LU. This is not the same to the
 * iGadget's content height as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current height of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getHeight = function() {
	return this.height;
}

/**
 * Returns the identifier of this iGadget. This identifier is unique for the
 * current EzWeb Platform. This identifier can be null if this iGadget is not
 * currently presisted.
 *
 * @returns {Number} the identifier for this iGadget.
 */
IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getElement = function() {
	return this.element;
}

/**
 * Returns true if the iGadget is currently visible in a dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently visible; false otherwise.
 */
IGadget.prototype.isVisible = function() {
	return this.visible;
}

/**
 * Returns true if the iGadget is currently on the free layout of the dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently on the free layout of the
 *                    associated dragboard; false otherwise.
 */
IGadget.prototype.onFreeLayout = function() {
	return this.layout.dragboard.freeLayout == this.layout;
}

/**
 * Toggle the gadget transparency
 */
IGadget.prototype.toggleTransparency = function() {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	this.element.toggleClassName("gadget_window_transparent");
	this.transparency = !this.transparency;

	//Persist the new state
	var o = new Object;
	o.transparency = this.transparency;
	o.id = this.id;
	var igadgetData = Object.toJSON(o);
	var params = {'igadget': igadgetData};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * Updates the extract/snap from/to grid option on the iGadget's menu.
 *
 * @private
 */
IGadget.prototype._updateExtractOption = function() {
	if (this.onFreeLayout()) {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/snap.png",
		                       gettext("Snap to grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("extractButton");
		this.extractButton.addClassName("snapButton");
		this.extractButton.setAttribute("title", gettext("This iGadget outside the grid."));

		// TODO more generic code
		this.lowerOpId = this.menu.addOption("/ezweb/images/igadget/lower.png",
		                    gettext("Lower"),
		                    function() {
		                        this.layout.lower(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+1);
		this.raiseOpId = this.menu.addOption("/ezweb/images/igadget/raise.png",
		                    gettext("Raise"),
		                    function() {
		                        this.layout.raise(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+2);
		this.lowerToBottomOpId = this.menu.addOption("/ezweb/images/igadget/lowerToBottom.png",
		                    gettext("Lower To Bottom"),
		                    function() {
		                        this.layout.lowerToBottom(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+3);
		this.raiseToTopOpId = this.menu.addOption("/ezweb/images/igadget/raiseToTop.png",
		                    gettext("Raise To Top"),
		                    function() {
		                        this.layout.raiseToTop(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+4);
	} else {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/extract.png",
		                       gettext("Extract from grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("snapButton");
		this.extractButton.addClassName("extractButton");
		this.extractButton.setAttribute("title", gettext("This iGadget is aligned to the grid."));

		if (this.lowerOpId != null) {
			this.menu.removeOption(this.lowerOpId);
			this.menu.removeOption(this.raiseOpId);
			this.menu.removeOption(this.lowerToBottomOpId);
			this.menu.removeOption(this.raiseToTopOpId);
			this.lowerOpId = null;
			this.raiseOpId = null;
			this.lowerToBottomOpId = null;
			this.raiseToTopOpId = null;
		}
	}
}

/**
 * Builds the structure of the gadget
 */
IGadget.prototype.build = function() {
	this.element = document.createElement("div");
	this.element.addClassName("gadget_window");

	// Gadget Menu
	this.gadgetMenu = document.createElement("div");
	this.gadgetMenu.addClassName("gadget_menu");
	this.gadgetMenu.observe("contextmenu", function(e) {Event.stop(e);}, true);

	// Gadget title
	this.gadgetMenu.setAttribute("title", this.name);

	//#######################################
	// buttons. Inserted from right to left
	//#######################################
	var button;

	// close button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("closebutton");

	if (this.gadget.isContratable()) {
		var remove_and_cancel = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().cancelServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		var remove = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().unsubscribeServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		button.observe("click", function() {
		                            LayoutManagerFactory.getInstance().showWindowMenu('cancelService', remove_and_cancel, remove);
		                        },
		               true);
	} else {
		button.observe("click", function() {
		                            OpManagerFactory.getInstance().removeInstance(this.id);
		                        }.bind(this),
		                        true);
	}

	button.setAttribute("title", gettext("Close"));
	button.setAttribute("alt", gettext("Close"));
	this.gadgetMenu.appendChild(button);

	// iGadget's menu button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("settingsbutton");
	button.observe("click",
	               function(e) {
	                  LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                      this.menu,
	                                                                      Event.pointerX(e),
	                                                                      Event.pointerY(e));
	               }.bind(this),
	               true);
	// and listen to mouse events
	/*this.gadgetMenu.observe("mousedown",
	                        function (e) {
	                            e = e || window.event; // needed for IE

	                            // Only attend to right button (or left button for left-handed persons) events
	                            if (!BrowserUtilsFactory.getInstance().isRightButton(e.button))
	                                return false;

	                            LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                                this.menu,
	                                                                                Event.pointerX(e),
	                                                                                Event.pointerY(e));

	                            Event.stop(e);
	                            return false;
	                        }.bind(this),
	                        true);*/

	button.setAttribute("title", gettext("Menu"));
	button.setAttribute("alt", gettext("Menu"));
	this.gadgetMenu.appendChild(button);
	this.settingsButtonElement = button;

	// minimize button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.observe("click", function() {this.toggleMinimizeStatus()}.bind(this), true);
	if (this.minimized) {
		button.setAttribute("title", gettext("Maximize"));
		button.setAttribute("alt", gettext("Maximize"));
		button.addClassName("maximizebutton");
	} else {
		button.setAttribute("title", gettext("Minimize"));
		button.setAttribute("alt", gettext("Minimize"));
		button.addClassName("minimizebutton");
	}

	this.gadgetMenu.appendChild(button);
	this.minimizeButtonElement = button;

	// error button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("class", "button errorbutton disabled");
	button.setAttribute("className", "button errorbutton disabled"); //IE hack
	Event.observe (button, "click", function() {OpManagerFactory.getInstance().showLogs();}, true);
	this.gadgetMenu.appendChild(button);
	this.errorButtonElement = button;

	this.fillWithLabel();

	this.element.appendChild(this.gadgetMenu);

	// Content wrapper
	this.contentWrapper = document.createElement("div");
	this.contentWrapper.addClassName("gadget_wrapper");
	this.element.appendChild(this.contentWrapper);

	// Gadget configuration (Initially empty and hidden)
	this.configurationElement = document.createElement("div");
	this.configurationElement.addClassName("config_interface");
	this.contentWrapper.appendChild(this.configurationElement);

	// Gadget Content
	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content = document.createElement("iframe");
		this.content.setAttribute("class", "gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
//		this.content.innerHTML = "Loading...."; // TODO add an animation ?
		this.content.setAttribute("src", codeURL);
		this.content.setAttribute("width", "100%");
	} else { //non IE6
		this.content = document.createElement("object");
		this.content.setAttribute("class", "gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
		this.content.setAttribute("data", codeURL);
		this.content.innerHTML = "Loading...."; // TODO add an animation ?
	}
	this.content.observe("load",
	                     function () {
	                         OpManagerFactory.getInstance().igadgetLoaded(this.id);
	                     }.bind(this),
	                     true);
	this.contentWrapper.appendChild(this.content);
	
	// Gadget status bar
	this.statusBar = document.createElement("div");
	this.statusBar.setAttribute("class", "statusBar");
	this.element.appendChild(this.statusBar);
	if (this.minimized) {
		this.statusBar.setStyle({"display": "none"});
	}

	// resize handles
	var resizeHandle;

	// Left one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "leftResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.leftResizeHandle = new IGadgetResizeHandle(resizeHandle, this, true);

	// Right one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "rightResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.rightResizeHandle = new IGadgetResizeHandle(resizeHandle, this, false);

	// wikilink
	this.wikilink = document.createElement('div');
	this.wikilink.setAttribute ('class', 'dragboardwiki');
	var awikilink = document.createElement('a');
	awikilink.href=this.gadget.getUriWiki();
	awikilink.setAttribute ('target', '_blank');
	awikilink.setAttribute ('class', 'dragboardwikilink');
	var imgwikilink = document.createElement('img');
	imgwikilink.src = '/ezweb/images/wiki_dragboard.png'
	imgwikilink.setAttribute('title', 'Access to Information');
	awikilink.appendChild(imgwikilink);
	this.wikilink.appendChild(awikilink);
	this.statusBar.appendChild(this.wikilink);

	// extract/snap button
	this.extractButton = document.createElement("div");
	this.extractButton.observe("click",
	                           function() {
	                               this.toggleLayout();
	                           }.bind(this),
	                           false);
	this.statusBar.appendChild(this.extractButton);
	
}

/**
 * Paints this gadget instance into the assigned dragboard
 */
IGadget.prototype.paint = function() {
	if (this.visible)
		return; // Do nothing if the iGadget is already painted

	this.visible = true;

	// Initialize iGadget's preferences menu
	var idMenu = 'igadget_menu_' + this.id;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);

	var idColorMenu = 'igadget_color_menu_' + this.id;
	this.colorMenu = IGadgetColorManager.genDropDownMenu(idColorMenu, this.menu, this);

	// Settings
	this.menu.addOption("/ezweb/images/igadget/settings.png",
	                    gettext("Preferences"),
	                    function() {
	                        this.toggleConfigurationVisible();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    0);

	this.menuColorEntryId = this.menu.addOption("/ezweb/images/menu_colors.png",
	                                           gettext("Menu Bar Color..."),
	                                           function(e) {
	                                               var menuEntry = $(this.menuColorEntryId);
	                                               if (menuEntry.getBoundingClientRect != undefined) {
	                                                   var y = menuEntry.getBoundingClientRect().top;
	                                               } else {
	                                                   var y = document.getBoxObjectFor(menuEntry).screenY -
	                                                           document.getBoxObjectFor(document.documentElement).screenY;
	                                               }
	                                               LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                   this.colorMenu,
	                                                   Event.pointerX(e),
	                                                   y + (menuEntry.offsetHeight/2));
	                                           }.bind(this),
	                                           1);

	this.menu.addOption("/ezweb/images/igadget/transparency.png",
	                    gettext("Transparency"),
	                    function() {
	                        this.toggleTransparency();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    2);

	// Extract/Snap from/to grid option (see _updateExtractOption)
	this.extractOptionOrder = 2;
	this.extractOptionId = this.menu.addOption("", "", function(){}, this.extractOptionOrder);

	// Initialize lock status
	if (this.layout.dragboard.isLocked()) {
		this.element.addClassName("gadget_window_locked");
	}

	// Initialize transparency status
	if (this.transparency)
		this.element.addClassName("gadget_window_transparent");

	// Initialize snap/extract options
	this._updateExtractOption();


	// Insert it into the dragboard
	this.layout.dragboard.dragboardElement.appendChild(this.element);

	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content.setAttribute("src", codeURL);
	} else { //non IE6
		this.content.setAttribute("data", codeURL);
	}

	// TODO use setStyle from prototype
	// Position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";
	this.element.style.zIndex = this.zPos;

	// Recompute size
	this._recomputeSize(true);

	// Mark as draggable
	this.draggable = new IGadgetDraggable(this);

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();

	// Notify Context Manager of igadget's position
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);

	// Notify Context Manager of igadget's size
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);

	// Notify Context Manager of the current lock status
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, this.layout.dragboard.isLocked());

	this.setMenuColor(undefined, true);
}

IGadget.prototype.fillWithLabel = function() {
	if(this.igadgetInputHTMLElement != null){
		//hide the input element
		this.igadgetInputHTMLElement.hide();
	}
	
	// get the name
	var nameToShow = this.name;
	if(nameToShow.length>30){
		nameToShow = nameToShow.substring(0, 30)+"...";
	}
	
	if(this.igadgetNameHTMLElement != null){
		// update and show the label
		this.igadgetNameHTMLElement.update(nameToShow);
		this.igadgetNameHTMLElement.show();
	}
	else{
		//create the label
		this.igadgetNameHTMLElement = document.createElement("span");
		this.igadgetNameHTMLElement.innerHTML = nameToShow;
		this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
		//var spanHTML = nameToShow;
		//new Insertion.Top(this.gadgetMenu, spanHTML);
		//this.igadgetNameHTMLElement = this.gadgetMenu.firstDescendant();
	
		this.igadgetNameHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithInput();
		                                    }.bind(this)); //do not propagate to div.
	}
}


IGadget.prototype.fillWithInput = function () {
	this.igadgetNameHTMLElement.hide();
	if (this.igadgetInputHTMLElement) {
		this.igadgetInputHTMLElement.show();
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
	} else {
		this.igadgetInputHTMLElement = document.createElement("input");
		this.igadgetInputHTMLElement.addClassName("igadget_name");
		this.igadgetInputHTMLElement.setAttribute("type", "text");
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
		this.igadgetInputHTMLElement.setAttribute("maxlength", 30);

		this.gadgetMenu.appendChild(this.igadgetInputHTMLElement);

		this.igadgetInputHTMLElement.observe('blur',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithLabel()
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keypress',
		                                    function(e) {
		                                        if(e.keyCode == Event.KEY_RETURN) {
		                                            Event.stop(e);
		                                            e.target.blur();
		                                        }
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('change',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.setName(e.target.value);
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keyup',
		                                    function(e) {
		                                        Event.stop(e);
		                                        e.target.size = (e.target.value.length==0) ? 1 : e.target.value.length + 5;
		                                    }.bind(this));

		/*this.igadgetInputHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                    }); //do not propagate to div.*/
		this.igadgetInputHTMLElement.observe('mousedown',
		                                    function(e) {
		                                        e = e || window.event; // needed for IE
		                                        Event.stop(e);
		                                    });
	}
	this.igadgetInputHTMLElement.focus();
}

/**
 * Sets the name of this iGadget. The name of the iGadget is shown at the
 * iGadget's menu bar. Also, this name will be used to refere to this gadget in
 * other parts of the EzWeb Platform, for example it is used in the wiring
 * interface.
 *
 * @param {String} igadgetName New name for this iGadget.
 */
IGadget.prototype.setName = function (igadgetName) {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	if (igadgetName != null && igadgetName.length > 0) {
		this.name = igadgetName;
		this.gadgetMenu.setAttribute("title", igadgetName);
		this.igadgetNameHTMLElement.update(this.name);
		var o = new Object;
		o.name = igadgetName;
		o.id = this.id;
		var igadgetData = Object.toJSON(o);
		var params = {'igadget': igadgetData};
		var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
		                                            tabId: this.layout.dragboard.tabId,
		                                            iGadgetId: this.id});
		PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
	}
}

/**
 * Sets the background color of the iGadget's menu bar.
 *
 * @param {String|Color} newColor
 */
IGadget.prototype.setMenuColor = function (newColor, temporal) {
	temporal = temporal != undefined ? temporal : false;

	if (newColor == undefined) {
		newColor = this.menu_color;
		temporal = true;
	}

	this.gadgetMenu.style.backgroundColor = IGadgetColorManager.color2css(newColor);

	if (temporal)
		return;

	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error updating igadget's menu color into persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	this.menu_color = newColor;
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['id'] = this.id;
	data['menu_color'] = IGadgetColorManager.color2hex(this.menu_color);
	var params = {'igadget': data.toJSON()};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	persistenceEngine.send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function() {
	if (this.draggable !== null) {
		this.draggable.destroy();
		this.draggable = null;
	}

	if (this.leftResizeHandle !== null) {
		this.leftResizeHandle.destroy();
		this.leftResizeHandle = null;
	}

	if (this.rightResizeHandle !== null) {
		this.rightResizeHandle.destroy();
		this.rightResizeHandle = null;
	}

	if (this.menu) {
		this.menu.remove();
		this.menu = null;
	}
	this.gadget = null;
	this.layout = null;
	this.position = null;
}

/**
 * Removes this igadget form the dragboard. Also this notify EzWeb Platform for
 * remove the igadget form persistence.
 */
IGadget.prototype.remove = function() {
	if (this.element != null) {
		function onSuccess() {}
		function onError(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}
			msg = interpolate(gettext("Error removing igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var dragboard = this.layout.dragboard;
		if (this.element.parentNode != null) {
			this.layout.removeIGadget(this, true);
		}

		this.element = null;
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		var uri = URIs.GET_IGADGET.evaluate({workspaceId: dragboard.workSpaceId,
		                                     tabId: dragboard.tabId,
		                                     iGadgetId: this.id});
		persistenceEngine.send_delete(uri, this, onSuccess, onError);
	}
}

/**
 * Change the values shown in the configuration form of this igadget to the default ones.
 */
IGadget.prototype._setDefaultPrefsInInterface = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var curPref;

	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		curPref.setDefaultValueInInterface(this.prefElements[curPref.getVarName()]);
	}
}

/**
 * Set all preferences of this gadget instance to their default value
 */
IGadget.prototype.setDefaultPrefs = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var varManager = this.layout.dragboard.getWorkspace().getVarManager();

	for (var i = 0; i < prefs.length; i++) {
		prefs[i].setToDefault(varManager, this.id);
	}

	if (this.configurationVisible)
		this._setDefaultPrefsInInterface();
}

/**
 * This function builds the igadget configuration form.
 */
IGadget.prototype._makeConfigureInterface = function() {

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var prefs = this.gadget.getTemplate().getUserPrefs();

	var interfaceDiv = document.createElement("div");

	if (prefs.length == 0) {
		interfaceDiv.innerHTML = gettext("This IGadget does not have user prefs");
		return interfaceDiv;
	}

	this.prefElements = new Array();

	var row, cell, label, table = document.createElement("table");
	tbody = document.createElement("tbody");
	table.appendChild(tbody);
	for (var i = 0; i < prefs.length; i++) {
		row = document.createElement("tr");

		// Settings label
		cell = document.createElement("td");
		cell.setAttribute("width", "40%"); // TODO
		label = prefs[i].getLabel();
		cell.appendChild(label);
		row.appendChild(cell);

		// Settings control
		cell = document.createElement("td");
		cell.setAttribute("width", "60%"); // TODO
		curPrefInterface = prefs[i].makeInterface(varManager, this.id);
		this.prefElements[curPrefInterface.name] = curPrefInterface;
		Element.extend(this.prefElements[curPrefInterface.name]);
		cell.appendChild(curPrefInterface);
		row.appendChild(cell);

		tbody.appendChild(row);
	}
	interfaceDiv.appendChild(table);

	var buttons = document.createElement("div");
	buttons.setAttribute("class", "buttons");
	buttons.setAttribute("className", "buttons"); //IE hack
	var button;

	// "Set Defaults" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Set Defaults"));
	Event.observe (button, "click", this._setDefaultPrefsInInterface.bind(this), true);
	buttons.appendChild(button);

	// "Save" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Save"));
	button.observe("click", function () {this.layout.dragboard.saveConfig(this.id)}.bind(this), true);
	buttons.appendChild(button);

	// "Cancel" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Cancel"));
	button.observe("click", function () {this.setConfigurationVisible(false)}.bind(this), true);
	buttons.appendChild(button);
	interfaceDiv.appendChild(buttons);

	// clean floats
	var floatClearer = document.createElement("div");
	floatClearer.setAttribute("class", "floatclearer");
	floatClearer.setAttribute("className", "floatclearer"); //IE hack
	interfaceDiv.appendChild(floatClearer);

	return interfaceDiv;
}

/**
 * Sets the size of the igadget's content.
 *
 * @param {Number} newWidth
 * @param {Number} newHeight
 * @param {Boolean} [persist] default: true
 */
IGadget.prototype.setContentSize = function(newWidth, newHeight, persist) {
	persist = persist != undefined ? persist : true;

	if (!this.element) {
		this.contentWidth = newWidth;
		this.contentHeight = newHeight;
		return;
	}

	var oldHeight = this.getHeight();
	var oldWidth = this.getWidth();

	this.contentWidth = newWidth;
	this.contentHeight = newHeight;

	this._recomputeSize(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false, persist);
}

/**
 * This function is called when the browser window is resized.
 *
 * @private
 */
IGadget.prototype._notifyWindowResizeEvent = function() {
	if (!this.element)
		return;

	/* TODO this is a temporally workaround needed when using display:none to hide tabs */
	var oldHeight = this.getHeight();
	var oldWidth = this.getWidth();
	/* TODO end of temporally workaround */

	// Recompute position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

	// Recompute size
	this._recomputeSize(true);

	/* TODO this is a temporally workaround needed when using display:none to hide tabs */
	// Notify new sizes if needed
	var newHeight = this.getHeight();
	var newWidth = this.getWidth();

	if ((oldHeight != newHeight) || (oldWidth != newWidth))
		this.layout._notifyResizeEvent(this, oldWidth, oldHeight, newWidth, newHeight, false, false);
	/* TODO end of temporally workaround */
}

/**
 * This function is called when the dragboard is locked or unlocked.
 *
 * @private
 * @param {Boolean} newLockStatus
 */
IGadget.prototype._notifyLockEvent = function(newLockStatus) {
	if (!this.element)
		return;

	if (newLockStatus) {
		this.element.addClassName("gadget_window_locked");
	} else {
		this.element.removeClassName("gadget_window_locked");
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	this._recomputeHeight(false);

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, newLockStatus);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false);
}

/**
 * This function is called when the content of the igadget has been loaded completly.
 *
 * @private
 */
IGadget.prototype._notifyLoaded = function() {
	if (!this.loaded) {
		this.loaded = true;

		if (this.errorCount > 0) {
			var msg = ngettext("%(errorCount)s error for the iGadget \"%(name)s\" was notified before it was loaded",
			                   "%(errorCount)s errors for the iGadget \"%(name)s\" were notified before it was loaded",
			                   this.errorCount);
			msg = interpolate(msg, {errorCount: this.errorCount, name: this.name}, true);
			LogManagerFactory.getInstance().log(msg);
			this.errorButtonElement.removeClassName("disabled");
			this._updateErrorInfo();
		}

		this.layout.dragboard.igadgetLoaded(this);
	}

	// Notify to the context manager the igadget has been loaded
	this.layout.dragboard.getWorkspace().getContextManager().propagateInitialValues(this.id);
}

/**
 * @private
 */
IGadget.prototype._recomputeWidth = function() {
	var width = this.layout.getWidthInPixels(this.contentWidth);

	width-= this._computeExtraWidthPixels();
	this.element.style.width = width + "px";

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, width);
}

/**
 * @private
 */
IGadget.prototype._recomputeWrapper = function(contentHeight) {
	if (!this.minimized) {
		contentHeight = contentHeight ? contentHeight : parseInt(this.content.offsetHeight);
		wrapperHeight = contentHeight + this.configurationElement.offsetHeight;
	} else {
		wrapperHeight = 0;
	}

	this.contentWrapper.setStyle({height: wrapperHeight + "px"});
}

/**
 * @private
 */
IGadget.prototype._computeExtraWidthPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-left-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-right-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._computeExtraHeightPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-bottom-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var menubarStyle = window.getComputedStyle(this.gadgetMenu, null);
	pixels += menubarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += menubarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var statusbarStyle = window.getComputedStyle(this.statusBar, null);
	pixels += statusbarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += statusbarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._recomputeHeight = function(basedOnContent) {
	var contentHeight;

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager()

	if (basedOnContent) {
		// Based on content height

		if (!this.minimized) {
			contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
			var fullSize = contentHeight;
			fullSize += this.gadgetMenu.offsetHeight +
			            this.statusBar.offsetHeight +
			            this.configurationElement.offsetHeight;
			fullSize += this._computeExtraHeightPixels();
			
			processedSize = this.layout.adaptHeight(contentHeight, fullSize);
			contentHeight = processedSize.inPixels;
			this.height = processedSize.inLU;
			this.content.setStyle({height: contentHeight + "px"});

			this._recomputeWrapper(contentHeight);

			// Notify Context Manager about the new igadget's size
			contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
		} else {
			this._recomputeWrapper();
			contentHeight = this.element.offsetHeight;
			this.content.setStyle({height: "0px"});
			this.height = Math.ceil(this.layout.fromPixelsToVCells(contentHeight));
		}

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.height);
	} else {
		// Based on full gadget height
		contentHeight = this.layout.getHeightInPixels(this.height);
		contentHeight -= this.configurationElement.offsetHeight + this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
		contentHeight -= this._computeExtraHeightPixels();
		this.content.setStyle({height: contentHeight + "px"});
		this.contentHeight = Math.floor(this.layout.fromPixelsToVCells(contentHeight));

		this._recomputeWrapper(contentHeight);

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
	}

}

/**
 * @private
 */
IGadget.prototype._recomputeSize = function(basedOnContent) {
	this._recomputeWidth();
	this._recomputeHeight(basedOnContent);
}

/**
 * Sets the absolute size of the igadget. See setContentSize for resizing the area for the igadget content.
 *
 * @param {Number} newWidth the new width of this igadget in cells. This will be
 *                          the final width for this gadget.
 * @param {Number} newHeight the new height of this igadget in cells. This will
 *                           be the final height for this gadget (that is,
 *                           counting the igadget's title bar, the configuration
 *                           form, etc)
 * @param {Boolean} [resizeLeftSide] true if the gadget will be resized using
 *                                   the topRight corner as base point.
 *                                   default: false.
 * @param {Boolean} [persist] true if is needed to notify the new
 *                            widths/positions of the iGadget (then the
 *                            associated layout can move other igadgets) to
 *                            persistence. default: true.
 */
IGadget.prototype.setSize = function(newWidth, newHeight, resizeLeftSide, persist) {
	// defaults values for the resizeLeftSide and persist parameters
	resizeLeftSide = resizeLeftSide != undefined ? resizeLeftSide : false;
	persist = persist != undefined ? persist : true;

	if (!this.element) {
		this.contentWidth = newWidth;
		this.height = newHeight;
		return;
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	// Assign new values
	this.contentWidth = newWidth;
	this.height = newHeight;

	// Recompute sizes
	this._recomputeSize(false);

	if (persist) {
		// Notify Context Manager new igadget's sizes
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager()
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, this.content.offsetWidth);
	}

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.contentWidth, this.height, resizeLeftSide, persist);
}

/**
 * Returns true if this igadget is minimized.
 *
 * @returns {Boolean} true if the iGadget is minimized; false otherwise.
 */
IGadget.prototype.isMinimized = function() {
	return this.minimized;
}

/**
 * Changes minimize status of this igadget
 *
 * @param newStatus new minimize status of the igadget
 */
IGadget.prototype.setMinimizeStatus = function(newStatus) {
	if (this.minimized == newStatus)
		return; // Nothing to do

	// TODO add effects?

	// New Status
	this.minimized = newStatus;

	if (this.minimized) {
		this.contentWrapper.setStyle({"visibility": "hidden" , "border": "0px"});
		this.statusBar.setStyle({"display": "none"});
		this.configurationElement.setStyle({"display": "none"});
		this.minimizeButtonElement.setAttribute("title", gettext("Maximize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Maximize"));
		this.minimizeButtonElement.removeClassName("minimizebutton");
		this.minimizeButtonElement.addClassName("maximizebutton");
	} else {
		this.contentWrapper.setStyle({"visibility": "visible", "border": null});
		this.statusBar.setStyle({"display": null});
		if (this.configurationVisible == true)
			this.configurationElement.setStyle({"display": "block"});
		this.minimizeButtonElement.setAttribute("title", gettext("Minimize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Minimize"));
		this.minimizeButtonElement.removeClassName("maximizebutton");
		this.minimizeButtonElement.addClassName("minimizebutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), false, true);
}

/**
 * Toggles the minimize status of this gadget
 */
IGadget.prototype.toggleMinimizeStatus = function () {
	this.setMinimizeStatus(!this.minimized);
}

/**
 * @private
 */
IGadget.prototype._updateErrorInfo = function () {
	label = ngettext("%(errorCount)s error", "%(errorCount)s errors", this.errorCount);
	label = interpolate(label, {errorCount: this.errorCount}, true);
	this.errorButtonElement.setAttribute("title", label);
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.notifyError = function() {
	this.errorCount++
	
	if (this.isVisible()) {
		if (this.errorCount == 1) { // First time
			this.errorButtonElement.removeClassName("disabled");
		}
		this._updateErrorInfo();
	}
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.toggleLayout = function() {
	if (this.onFreeLayout())
		this.moveToLayout(this.layout.dragboard.baseLayout);
	else
		this.moveToLayout(this.layout.dragboard.freeLayout);
}

/**
 * Returns true if the configuration form of this igadget is visible
 *
 * @returns true if the configuration form of this igadget is visible; false
 *          otherwise
 */
IGadget.prototype.isConfigurationVisible = function() {
	return this.configurationVisible;
}

/**
 * Changes the visibility status of the configuration form of this igadget
 *
 * @param newValue new visibility status of the configuration form of this
 *                 igadget
 */
IGadget.prototype.setConfigurationVisible = function(newValue) {
	if (this.configurationVisible == newValue)
		return; // Nothing to do

	// New Status
	this.configurationVisible = newValue;

	if (newValue == true) {
		this.configurationElement.appendChild(this._makeConfigureInterface());
		if (this.isMinimized())
			this.configurationElement.setStyle({"display": "none"});
		else
			this.configurationElement.setStyle({"display": "block"});
		this.settingsButtonElement.removeClassName("settingsbutton");
		this.settingsButtonElement.addClassName("settings2button");
	} else {
		this.configurationElement.innerHTML = "";
		this.configurationElement.hide();
		this.settingsButtonElement.removeClassName("settings2button");
		this.settingsButtonElement.addClassName("settingsbutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), true);
}

/**
 * Toggles the visibility status of the configuration form of this igadget.
 */
IGadget.prototype.toggleConfigurationVisible = function () {
	this.setConfigurationVisible(!this.configurationVisible);
}

/**
 * Saves the values of the preferences from the config form of this igadget.
 */
IGadget.prototype.saveConfig = function() {
	if (this.configurationVisible == false)
		throw new Error(""); // TODO

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var i, curPref, prefElement, validData = true;
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var prefName = null;
	
	for (i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		if (!curPref.validate(curPref.getValueFromInterface(prefElement))) {
			validData = false;
			prefElement.addClassName("invalid");
		} else {
			prefElement.removeClassName("invalid");
		}
	}

	if (!validData)
		throw new Error("Invalid data found"); // Don't save if the data is invalid

	// Start propagation of the new values of the user pref variables
	varManager.incNestingLevel();

	// Annotate new value of the variable without invoking callback function!
	var oldValue, newValue;
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);


		if (newValue != oldValue)
			curPref.annotate(varManager, this.id, newValue);
	}

        /* Commit new value of the variable
	   Doing this in 2 phases (first setting the value and then propagating changes)
           avoids reading old values!! */
	
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);

		
		curPref.setValue(varManager, this.id, newValue);
	}

	// Commit
	varManager.decNestingLevel();

	this.setConfigurationVisible(false);
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is,
 * for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.layout.dragboard.addIGadget(this, igadgetInfo);
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

		// Remove this iGadget from the layout
		this.layout.removeIGadget(this, true);
		this.destroy();
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['zIndex'] = this.zPos;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['name'] = this.name;
	data['menu_color'] = IGadgetColorManager.color2css(this.menu_color).substring(1, 6); // TODO
	if (this.onFreeLayout())
		data['layout'] = 1;
	else
		data['layout'] = 0;

	var uri = URIs.POST_IGADGET.evaluate({tabId: this.layout.dragboard.tabId,
	                                      workspaceId: this.layout.dragboard.workSpaceId});

	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}

/**
 * This function migrates this igadget form a layout to another
 *
 * @param {DragboardLayout} newLayout the layout where the iGadget will be moved
 *                          to.
 */
IGadget.prototype.moveToLayout = function(newLayout) {
	if (this.layout == newLayout)
		return;

	// ##### TODO Revise this
	var contentWidth = this.element.offsetWidth;
	var fullWidth = contentWidth;
	contentWidth -= this._computeExtraWidthPixels();

	var contentHeight = this.content.offsetHeight;
	var fullHeight = contentHeight;
	fullHeight += this.gadgetMenu.offsetHeight +
	              this.statusBar.offsetHeight +
	              this.configurationElement.offsetHeight;
	fullHeight += this._computeExtraHeightPixels();
	// ##### END TODO

	var dragboardChange = this.layout.dragboard != newLayout.dragboard;
	var oldLayout = this.layout;
	oldLayout.removeIGadget(this, dragboardChange);

	if (dragboardChange && !(newLayout instanceof FreeLayout)) {
		this.position = null;
	} else {
		this.position.x = oldLayout.getColumnOffset(this.position.x);
		this.position.x = newLayout.adaptColumnOffset(this.position.x).inLU;

		this.position.y = oldLayout.getRowOffset(this.position.y);
		this.position.y = newLayout.adaptRowOffset(this.position.y).inLU;
	}

	// ##### TODO Revise this
	//console.debug("prev width: " + this.contentWidth);
	var newWidth = newLayout.adaptWidth(contentWidth, fullWidth)
	this.contentWidth = newWidth.inLU;
	//console.debug("new width: " + this.contentWidth);

	//console.debug("prev height: " + this.height);
	var newHeight = newLayout.adaptHeight(contentHeight, fullHeight)
	this.height = newHeight.inLU;
	//console.debug("new height: " + this.height);

	// ##### END TODO
	newLayout.addIGadget(this, dragboardChange);
	this._updateExtractOption();

	// Persistence
	var onSuccess = function(transport) { }

	var onError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error saving changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	var data = new Hash();
	data['iGadgets'] = new Array();

	var iGadgetInfo = new Hash();
	iGadgetInfo['id'] = this.id;
	iGadgetInfo['top'] = this.position.y;
	iGadgetInfo['left'] = this.position.x;
	iGadgetInfo['zIndex'] = this.zPos;
	iGadgetInfo['width'] = this.contentWidth;
	iGadgetInfo['height'] = this.contentHeight;
	iGadgetInfo['tab'] = this.layout.dragboard.tabId;

	if (this.onFreeLayout())
		iGadgetInfo['layout'] = 1;
	else
		iGadgetInfo['layout'] = 0;

	data['iGadgets'].push(iGadgetInfo);

	data = {igadgets: data.toJSON()};
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	uri = URIs.GET_IGADGETS.evaluate({workspaceId: oldLayout.dragboard.workSpaceId, tabId: oldLayout.dragboard.tabId});
	persistenceEngine.send_update(uri, data, this, onSuccess, onError);
}

function IGadgetColorManager () {
	this.colors = ["FFFFFF", "EFEFEF", "DDDDDD", "97A0A8", "FF9999", "FF3333","FFD4AA", "FFD42A", "FFFFCC", "FFFF66", "CCFFCC", "A8D914", "D4E6FC", "CCCCFF", "349EE8", "FFCCFF", "FF99FF"];
}

IGadgetColorManager.prototype.autogenColor = function(color, seed) {
	if (color === undefined || color === null)
		return this.colors[seed % this.colors.length];
	else
		return color;
}

IGadgetColorManager.prototype.genDropDownMenu = function(idColorMenu, parentMenu, iGadget) {
	var updateColorFunc = function (newColor) {
		iGadget.setMenuColor(newColor, true);
	}

	var endFunc = function (newColor) {
		iGadget.setMenuColor(newColor, false);
	}

	var colorMenu = new ColorDropDownMenu(idColorMenu,
	                                      parentMenu,
	                                      endFunc,
	                                      {onMouseOver: updateColorFunc,
	                                       onMouseOut: updateColorFunc});

	for (var i = 0; i < this.colors.length; i++)
		colorMenu.appendColor(this.colors[i]);

	return colorMenu;
}

IGadgetColorManager.prototype.color2css = function(color) {
	if (typeof color === "string")
		return '#' + color;
	else
		return "rgb(" + color.red.cssText + ", " + color.green.cssText + ", " + color.blue.cssText + ")";
}

IGadgetColorManager.prototype.color2hex = function(color) {
	if (typeof color === "string") {
		return color;
	} else {
		function component2hex(component) {
			return "0123456789ABCDEF".charAt(Math.floor(component / 16)) +
			       "0123456789ABCDEF".charAt(component % 16);
		}
		return component2hex(color.red.cssText) +
		       component2hex(color.green.cssText) +
		       component2hex(color.blue.cssText);
	}
}

IGadgetColorManager = new IGadgetColorManager();

/**
 * @author aarranz
 */
function Dragboard(tab, workSpace, dragboardElement) {
	// *********************************
	// PRIVATE VARIABLES
	// *********************************
	this.loaded = false;
	this.currentCode = 1;
	this.scrollbarSpace = 17; // TODO make this configurable?
	// TODO or initialized with the scroll bar's real with?
	this.dragboardElement;
	this.dragboardWidth = 800;
	this.baseLayout = null;
	this.freeLayout = null;
	this.gadgetToMove = null;
	this.iGadgets = new Hash();
	this.iGadgetsByCode = new Hash();
	this.tab = tab;
	this.tabId = tab.tabInfo.id;
	this.workSpace = workSpace;
	this.workSpaceId = workSpace.workSpaceState.id;
	this.fixed = false;

	// ***********************
	// PRIVATE FUNCTIONS
	// ***********************
	Dragboard.prototype.paint = function () {
		this.dragboardElement.innerHTML = "";

		this._recomputeSize();

		this.baseLayout.initialize();
		this.freeLayout.initialize();
	}

	/**
	 * Update igadget status in persistence
	 */
	this._commitChanges = function(keys) {
		keys = keys || this.iGadgetsByCode.keys();

		var onSuccess = function(transport) { }

		var onError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		// TODO only send real changes
		var iGadget, iGadgetInfo, uri, position;
		var data = new Hash();
		data['iGadgets'] = new Array();

		for (var i = 0; i < keys.length; i++) {
			iGadget = this.iGadgetsByCode[keys[i]];
			iGadgetInfo = new Hash();
			position = iGadget.getPosition();
			iGadgetInfo['id'] = iGadget.id;
			iGadgetInfo['top'] = position.y;
			iGadgetInfo['left'] = position.x;
			iGadgetInfo['zIndex'] = iGadget.zPos;
			iGadgetInfo['minimized'] = iGadget.isMinimized() ? "true" : "false";
			iGadgetInfo['width'] = iGadget.getContentWidth();
			iGadgetInfo['height'] = iGadget.getContentHeight();
			iGadgetInfo['tab'] = this.tabId;

			data['iGadgets'].push(iGadgetInfo);
		}

		data = {igadgets: data.toJSON()};
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		uri = URIs.GET_IGADGETS.evaluate({workspaceId: this.workSpaceId, tabId: this.tabId});
		persistenceEngine.send_update(uri, data, this, onSuccess, onError);
	}

	/**
	 * This function is slow. Please, only call it when really necessary.
	 *
	 * @private
	 */
	Dragboard.prototype._recomputeSize = function() {
		// TODO check this in a compatible fashion
		var cssStyle = document.defaultView.getComputedStyle(this.dragboardElement, null);
		if (cssStyle.getPropertyValue("display") == "none")
			return; // Do nothing

		var dragboardElement = this.dragboardElement;
		this.dragboardWidth = parseInt(dragboardElement.offsetWidth);

		var tmp = this.dragboardWidth;
		tmp-= parseInt(dragboardElement.clientWidth);

		if (tmp > this.scrollbarSpace)
			this.dragboardWidth-= tmp;
		else
			this.dragboardWidth-= this.scrollbarSpace;
	}


	// ****************
	// PUBLIC METHODS
	// ****************

	/**
	 * Gets the width of the usable dragboard area.
	 *
	 * @returns The width of the usable dragboard area
	 */
	Dragboard.prototype.getWidth = function() {
		return this.dragboardWidth;
	}

	/**
	 * This method forces recomputing of the iGadgets' sizes.
	 */
	Dragboard.prototype.recomputeSize = function() {
		this.baseLayout._notifyWindowResizeEvent(this.dragboardWidth);
		this.freeLayout._notifyWindowResizeEvent(this.dragboardWidth);
	}

	Dragboard.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideView(this.dragboardElement);
	}

	/**
	 * This method must be called to avoid memory leaks caused by circular references.
	 */
	Dragboard.prototype.destroy = function () {
		this.baseLayout.destroy();
		this.freeLayout.destroy();
		this.baseLayout = null;
		this.freeLayout = null;

		var keys = this.iGadgets.keys();
		//disconect and delete the connectables and variables of all tab iGadgets
		for (var i = 0; i < keys.length; i++)
			this.workSpace.removeIGadgetData(keys[i]);

		this.iGadgets = null;
		this.iGadgetsByCode = null;

		Element.remove(this.dragboardElement);
	}

	/**
	 * Returns true if the dragboard is locked.
	 */
	Dragboard.prototype.isLocked = function () {
		return this.fixed;
	}

	/**
	 * Locks and unlocks the dragboard according to the newLockStatus
	 * parameter.
	 *
	 * @param newLockStatus true to make dragboard  be locked or false for
	 *                      having an editable dragboard (where you can
	 *                      move, resize, etc the gadget instances).
	 */
	Dragboard.prototype.setLock = function (newLockStatus) {
		if (this.fixed == newLockStatus)
			return; // No change in status => nothing to do

		this.fixed = newLockStatus;
		if (this.fixed)
			this.dragboardElement.addClassName("fixed");
		else
			this.dragboardElement.removeClassName("fixed");

		var iGadget;

		// propagate the fixed status change event
		var igadgetKeys = this.iGadgets.keys();
		for (var i = 0; i < igadgetKeys.length; i++) {
			iGadget = this.iGadgets[igadgetKeys[i]];
			iGadget._notifyLockEvent(this.fixed);
		}

		// Save to persistence
		var onSuccess = function (transport) {}

		var onError = function (transport, e) {
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
			msg = interpolate(gettext("Error changing tab lock status: %(errorMsg)s."),
			                          {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabId});
		var data = new Hash();
		data.locked = newLockStatus ? "true" : "false";
		var params = {'tab': data.toJSON()};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, onSuccess, onError);
	}

	/**
	 * Toggles the current lock status of the dragboard.
	 */
	Dragboard.prototype.toggleLock = function() {
		this.setFixed(!this.fixed);
	}

	Dragboard.prototype.parseTab = function(tabInfo) {
		var curIGadget, position, zPos, width, height, igadget, gadget, gadgetid, minimized, layout, menu_color;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();
		this.iGadgetsByCode = new Hash();

		if (tabInfo.locked == "true") {
			this.fixed = true;
			this.dragboardElement.addClassName("fixed");
		}

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		this.igadgetsToLoad = tabInfo.igadgetList.length;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];

			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Parse width, height and the position of the igadget
			width = parseInt(curIGadget.width);
			height = parseInt(curIGadget.height);
			position = new DragboardPosition(parseInt(curIGadget.left), parseInt(curIGadget.top));
			zPos = parseInt(curIGadget.zIndex);

			// Parse layout field
			if (curIGadget.layout == 0) {
				layout = this.baseLayout;
			} else {
				layout = this.freeLayout;
			}

			// Parse minimize status
			minimized = curIGadget.minimized == "true" ? true : false;

			// Parse transparency status
			transparency = curIGadget.transparency == "true" ? true : false;

			// Menu color
			menu_color = curIGadget.menu_color;

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.name, layout, position, zPos, width, height, minimized, transparency, menu_color);
		}

		this.loaded = true;
	}

	/**
	 * Creates a new instance of the given gadget and inserts it into this
	 * dragboard.
	 *
	 * @param gadget the gadget to use for creating the instance
	 */
	Dragboard.prototype.addInstance = function (gadget) {
		if ((gadget == null) || !(gadget instanceof Gadget))
			return; // TODO exception

		if (this.isLocked()) {
			var msg = gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab.");
			msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
			LayoutManagerFactory.getInstance().showMessageMenu(msg);
			return;
		}

		// This is the layout where the iGadget will be inserted
		var layout = this.baseLayout; // TODO For now insert it always in the baseLayout

		var template = gadget.getTemplate();
		//var width = layout.unitConvert(template.getWidth() + "cm", CSSPrimitiveValue.CSS_PX)[0];
		//width = layout.adaptWidth(width, width).inLU;
		var width = template.getWidth();
		var height = template.getHeight();

		// Check if the gadget doesn't fit in the dragboard
		if (layout instanceof ColumnLayout) {
			var maxColumns = layout.getColumns();
			if (width > maxColumns) {
				// TODO warning
				width = maxColumns;
			}
		}

		// Create the instance
		var igadgetName = gadget.getName() + ' (' + this.currentCode + ')';
		var iGadget = new IGadget(gadget, null, igadgetName, layout, null, null, width, height, false, false, null);

		iGadget.save();
	}
	
	Dragboard.prototype.getNumberOfIGadgets = function () {
		return this.iGadgets.keys().length;
	}

	Dragboard.prototype.removeInstance = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];

		igadget.remove();
		igadget.destroy();

		this._deregisterIGadget(igadget);
	}

	Dragboard.prototype.igadgetLoaded = function (iGadget) {
		if (!this.iGadgets[iGadget.id]) {
			// TODO log
			return;
		}

		this.igadgetsToLoad--;
	}


	Dragboard.prototype.getRemainingIGadgets = function () {
		return this.igadgetsToLoad;
	}


	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			igadget.setConfigurationVisible(false);
		} catch (e) {
		}
	}

	Dragboard.prototype.setDefaultPrefs = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.setDefaultPrefs();
	}

	Dragboard.prototype.notifyErrorOnIGadget = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.notifyError();
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

	/**
	 * Registers an iGadget into this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._registerIGadget = function (iGadget) {
		if (iGadget.id)
			this.iGadgets[iGadget.id] = iGadget;

		iGadget.code = this.currentCode++

		this.iGadgetsByCode[iGadget.code] = iGadget;
	}

	/**
	 * Deregisters an iGadget from this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._deregisterIGadget = function (iGadget) {
		delete this.iGadgets[iGadget.id];
		delete this.iGadgetsByCode[iGadget.code];

		iGadget.code = null;
	}

	Dragboard.prototype.addIGadget = function (iGadget, igadgetInfo) {
		if (!this.iGadgetsByCode[iGadget.code])
			throw new Exception();

		this.iGadgets[iGadget.id] = iGadget;
		this.workSpace.addIGadget(this.tab, iGadget, igadgetInfo);
	}

	// *******************
	// INITIALIZING CODE
	// *******************
	this.dragboardElement = dragboardElement;

	this.dragboardElement.observe("DOMContentLoaded",
	                              function() {alert('hola');},
	                              true);

	// Window Resize event dispacher function
	this._notifyWindowResizeEvent = function () {
		//var oldWidth = this.dragboardWidth;
		this._recomputeSize();
		//var newWidth = this.dragboardWidth;

		//if (oldWidth !== newWidth)
			this.recomputeSize();
	}.bind(this);

	/*
	 * nº columns                         = 20
	 * cell height                        = 12 pixels
	 * vertical Margin between IGadgets   = 2 pixels
	 * horizontal Margin between IGadgets = 4 pixels
	 */
	this.baseLayout = new SmartColumnLayout(this, 20, 12, 2, 4);

	this.freeLayout = new FreeLayout(this);

	this.parseTab(tab.tabInfo);
}

/////////////////////////////////////
// DragboardPosition
/////////////////////////////////////
function DragboardPosition(x, y) {
	this.x = x;
	this.y = y;
}

DragboardPosition.prototype.clone = function() {
	return new DragboardPosition(this.x, this.y);
}

/////////////////////////////////////
// DragboardCursor
/////////////////////////////////////

/**
 * @class This class represents a dragboard cursor. It is usually used in drag
 *        & drop operations and always represents the place where an iGadget is
 *        going to be placed.
 *
 * @author Álvaro Arranz
 *
 * @param iGadget iGadget that is going to be represented by the new dragboard
 *                cursor
 */
function DragboardCursor(iGadget) {
	var positiontmp = iGadget.getPosition();
	this.position = positiontmp.clone();

	this.layout = iGadget.layout;
	this.width = iGadget.getWidth();
	this.height = iGadget.getHeight();
	this.heightInPixels = iGadget.element.offsetHeight;
	this.widthInPixels = iGadget.element.offsetWidth;
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getHeight = function() {
	return this.height;
}

DragboardCursor.prototype.paint = function(dragboard) {
	var dragboardCursor = document.createElement("div");
	dragboardCursor.setAttribute("id", "dragboardcursor");

	// Set width and height
	dragboardCursor.style.height = this.heightInPixels + "px";
	dragboardCursor.style.width = this.widthInPixels + "px";

	// Set position
	dragboardCursor.style.left = (this.layout.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
	dragboardCursor.style.top = (this.layout.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

	// assign the created element
	dragboard.appendChild(dragboardCursor);
	this.element = dragboardCursor;
}

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardCursor.prototype.destroy = function() {
	if (this.element != null) {
		this.element.parentNode.removeChild(this.element);
		this.element = null;
	}
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getPosition = IGadget.prototype.getPosition;

DragboardCursor.prototype.setPosition = function (position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = (this.layout.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
		this.element.style.top = (this.layout.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
	}
}

/////////////////////////////////////
// Drag and drop support
/////////////////////////////////////
EzWebEffectBase = new Object();
EzWebEffectBase.findDragboardElement = function(element) {
	var tmp = element.parentNode;
	while (tmp) {
		var position = document.defaultView.getComputedStyle(tmp, null).getPropertyValue("position");
		switch (position) {
		case "relative":
		case "absolute":
		case "fixed":
			return tmp;
		}

		tmp = tmp.parentNode;
	}
	return null; // Not found
}

function Draggable(draggableElement, handler, data, onStart, onDrag, onFinish, canBeDragged) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var yScroll = 0;
	var xOffset = 0, yOffset = 0;
	var x, y;
	var dragboardCover;
	var draggable = this;
	canBeDragged = canBeDragged ? canBeDragged : function() {return true;};

	// remove the events
	function enddrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving (document, "mouseup", enddrag);
		Event.stopObserving (document, "mousemove", drag);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		onFinish(draggable, data);

		Event.observe (handler, "mousedown", startdrag);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time it's dragged
	function drag(e) {
		e = e || window.event; // needed for IE

		var screenX = parseInt(e.screenX);
		var screenY = parseInt(e.screenY);
		xDelta = xStart - screenX;
		yDelta = yStart - screenY;
		xStart = screenX;
		yStart = screenY;
		y = y - yDelta;
		x = x - xDelta;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// initiate the drag
	function startdrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		if (!canBeDragged(draggable, data))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		Event.stopObserving (handler, "mousedown", startdrag);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = draggableElement.offsetTop;
		x = draggableElement.offsetLeft;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';
		Event.observe (document, "mouseup", enddrag);
		Event.observe (document, "mousemove", drag);

		onStart(draggable, data);

		var dragboard = EzWebEffectBase.findDragboardElement(draggableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , enddrag, true);
		dragboardCover.observe("mousemove", drag, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		return false;
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll(e) {
		e = e || window.event; // needed for IE

		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// cancels the call to startdrag function
	function cancelbubbling(e) {
		e = e || window.event; // needed for IE
		Event.stop(e);
	}

	// add mousedown event listener
	Event.observe (handler, "mousedown", startdrag);
	var children = handler.childElements();
	for (var i = 0; i < children.length; i++)
		Event.observe (children[i], "mousedown", cancelbubbling);

	/**********
	 * Public methods
	 **********/

	this.setXOffset = function(offset) {
		xOffset = offset;
	}

	this.setYOffset = function(offset) {
		yOffset = offset;
	}

	this.destroy = function() {
		Event.stopObserving (handler, "mousedown", startdrag);
		startdrag = null;
		enddrag = null;
		drag = null;
		scroll = null;
		cancelbubbling = null;
		draggable = null;
		data = null;
		handler = null;
	}
}

/////////////////////////////////////
// IGadget drag & drop support
/////////////////////////////////////
function IGadgetDraggable (iGadget) {
	var context = new Object();
	context.iGadget = iGadget;
	Draggable.call(this, iGadget.element, iGadget.gadgetMenu, context,
	                     IGadgetDraggable.prototype.startFunc,
	                     IGadgetDraggable.prototype.updateFunc,
	                     IGadgetDraggable.prototype.finishFunc,
	                     IGadgetDraggable.prototype.canBeDraggedFunc);
}

IGadgetDraggable.prototype.canBeDraggedFunc = function (draggable, context) {
	return !context.iGadget.layout.dragboard.isLocked();
}


IGadgetDraggable.prototype.startFunc = function (draggable, context) {
	context.layout = context.iGadget.layout;
	context.dragboard = context.layout.dragboard;
	context.currentTab = context.dragboard.tabId;
	context.layout.initializeMove(context.iGadget, draggable);
	context.oldZIndex = context.iGadget.getZPosition();
	context.iGadget.setZPosition("999999");
}

IGadgetDraggable.prototype.updateFunc = function (event, draggable, context, x, y) {
	var element = null;

	// Check if the mouse is over a tab
	if (y < 0)
		element = document.elementFromPoint(event.clientX, event.clientY);

	var id = null;
	if (element != null && element instanceof Element) {
		id = element.getAttribute("id");
		if (id == null && element.parentNode instanceof Element) {
			element = element.parentNode;
			id = element.getAttribute("id");
		}

		if (id != null) {
			var result = id.match(/tab_(\d+)_(\d+)/);
			if (result != null && result[2] != context.currentTab) {
				if (context.selectedTab == result[2])
					return;

				if (context.selectedTabElement != null)
					context.selectedTabElement.removeClassName("selected");

				context.selectedTab = result[2];
				context.selectedTabElement = element;
				context.selectedTabElement.addClassName("selected");
				context.layout.disableCursor();
				return;
			}
		}
	}

	// The mouse is not over a tab
	// The cursor must allways be inside the dragboard
	var position = context.layout.getCellAt(x, y);
	if (position.y < 0)
		position.y = 0;
	if (position.x < 0)
		position.x = 0;
	if (context.selectedTabElement != null)
		context.selectedTabElement.removeClassName("selected");
	context.selectedTab = null;
	context.selectedTabElement = null;
	context.layout.moveTemporally(position.x, position.y);
	return;
}

IGadgetDraggable.prototype.finishFunc = function (draggable, context) {
	context.iGadget.setZPosition(context.oldZIndex);

	if (context.selectedTab != null) {
		context.layout.cancelMove();
		var dragboard = context.dragboard.workSpace.getTab(context.selectedTab).getDragboard();

		var destLayout;
		if (context.iGadget.onFreeLayout())
			destLayout = dragboard.freeLayout;
		else
			destLayout = dragboard.baseLayout;

		context.iGadget.moveToLayout(destLayout);

		var tabElement = context.selectedTabElement;
		setTimeout(function() {
			tabElement.removeClassName("selected");
		}, 500);
		
		//var fadder = new BackgroundFadder(tabElement, "#F0E68C", ((tabElement.hasClassName("current"))?"#E0E0E0":"#97A0A8"), 1000);
		//fadder.fade();

		context.selectedTab = null;
		context.selectedTabElement = null;
	} else {
		context.layout.acceptMove();
	}

	context.dragboard = null;
}

/////////////////////////////////////
// resize support
/////////////////////////////////////

function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var dragboardCover;
	var x, y;

	// remove the events
	function endresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving(document, "mouseup", endresize);
		Event.stopObserving(document, "mousemove", resize);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		handleElement.stopObserving("mouseup", endresize, true);
		handleElement.stopObserving("mousemove", resize, true);

		onFinish(resizableElement, handleElement, data);

		// Restore start event listener
		handleElement.observe("mousedown", startresize);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time the mouse is moved while resizing
	function resize(e) {
		e = e || window.event; // needed for IE

		xDelta = xStart - parseInt(e.screenX);
		yDelta = yStart - parseInt(e.screenY);
		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = y - yDelta;
		x = x - xDelta;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll() {
		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// initiate the resizing
	function startresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		handleElement.stopObserving("mousedown", startresize);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
		y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);
		Event.observe (document, "mouseup", endresize);
		Event.observe (document, "mousemove", resize);

		var dragboard = EzWebEffectBase.findDragboardElement(resizableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , endresize, true);
		dragboardCover.observe("mousemove", resize, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		handleElement.observe("mouseup", endresize, true);
		handleElement.observe("mousemove", resize, true);

		onStart(resizableElement, handleElement, data);

		return false;
	}

	// Add event listener
	Event.observe (handleElement, "mousedown", startresize);

	this.destroy = function() {
		Event.stopObserving (handleElement, "mousedown", startresize);
		startresize = null;
		resize = null;
		scroll = null;
		endresize = null;
		data = null;
		handleElement = null;
	}
}

/////////////////////////////////////
// IGadget resize support
/////////////////////////////////////
function IGadgetResizeHandle(handleElement, iGadget, resizeLeftSide) {
	ResizeHandle.call(this, iGadget.element, handleElement,
	                        {iGadget: iGadget, resizeLeftSide: resizeLeftSide},
	                        IGadgetResizeHandle.prototype.startFunc,
	                        IGadgetResizeHandle.prototype.updateFunc,
	                        IGadgetResizeHandle.prototype.finishFunc);
}

IGadgetResizeHandle.prototype.startFunc = function (resizableElement, handleElement, data) {
	handleElement.addClassName("inUse");
	// TODO merge with igadget minimum sizes
	data.minWidth = Math.ceil(data.iGadget.layout.fromPixelsToHCells(80));
	data.minHeight = Math.ceil(data.iGadget.layout.fromPixelsToVCells(50));
	data.iGadget.igadgetNameHTMLElement.blur();
	data.oldZIndex = data.iGadget.getZPosition();
	data.iGadget.setZPosition("999999");
}

IGadgetResizeHandle.prototype.updateFunc = function (resizableElement, handleElement, data, x, y) {
	var iGadget = data.iGadget;

	// Skip if the mouse is outside the dragboard
	if (iGadget.layout.isInside(x, y)) {
		var position = iGadget.layout.getCellAt(x, y);
		var currentPosition = iGadget.getPosition();
		var width;

		if (data.resizeLeftSide) {
			width = currentPosition.x + iGadget.getWidth() - position.x;
		} else {
			width = position.x - currentPosition.x + 1;
		}
		var height = position.y - currentPosition.y + 1;

		// Minimum width
		if (width < data.minWidth)
			width = data.minWidth;

		// Minimum height
		if (height < data.minHeight)
			height = data.minHeight;

		if (width != iGadget.getWidth() || height != iGadget.getHeight())
			iGadget.setSize(width, height, data.resizeLeftSide, false);
	}
}

IGadgetResizeHandle.prototype.finishFunc = function (resizableElement, handleElement, data) {
	var iGadget = data.iGadget;
	data.iGadget.setZPosition(data.oldZIndex);
	iGadget.setSize(iGadget.getWidth(), iGadget.getHeight(), data.resizeLeftSide, true);
	handleElement.removeClassName("inUse");
}


/**
 * abstract
 * @author aarranz
 */
function UserPref(varName_, label_, desc_, defaultValue_) {
	this.varName = null;
	this.label = null;
	this.desc = null;
	this.defaultValue = null;
}

UserPref.prototype.UserPref = function (varName_, label_, desc_, defaultValue_) {
	this.varName = varName_;
	this.label = label_;
	this.desc = desc_;

	if ((defaultValue_ == null) || (defaultValue_ == undefined))
		this.defaultValue = "";
	else
		this.defaultValue = defaultValue_;
}

UserPref.prototype.getVarName = function () {
	return this.varName;
}

UserPref.prototype.validate = function (newValue) {
	return true;
}

UserPref.prototype.getCurrentValue = function (varManager, iGadgetId) {
	var variable = varManager.getVariableByName(iGadgetId, this.varName);
	return variable.get();
}

//Set value and invoke callback function
UserPref.prototype.setValue = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.set(newValue);
	}
}

//Set new variable but it doesn't invoke callback function
UserPref.prototype.annotate = function (varManager, iGadgetId, newValue) {
	if (this.validate(newValue)) {
		var variable = varManager.getVariableByName(iGadgetId, this.varName);
		variable.annotate(newValue);
	}
}

UserPref.prototype.setToDefault = function (varManager, iGadgetId) {
	this.setValue(varManager, this.defaultValue);
}

UserPref.prototype.getValueFromInterface = function (element) {
	return element.value;
}

UserPref.prototype.setDefaultValueInInterface = function (element) {
	element.value = this.defaultValue;
}

UserPref.prototype.getLabel = function () {
	var label = document.createElement("label");
	label.appendChild(document.createTextNode(this.label));
	label.setAttribute("title", this.desc);
	label.setAttribute("for", this.varName);

	return label;
}

//////////////////////////////////////////////
// PUBLIC CONSTANTS
//////////////////////////////////////////////
UserPref.prototype.TEXT    = "S"; // "S"tring
UserPref.prototype.INTEGER = "N"; // "N"umber
UserPref.prototype.DATE    = "D"; // "D"ate
UserPref.prototype.LIST    = "L"; // "L"ist
UserPref.prototype.BOOLEAN = "B"; // "B"oolean
UserPref.prototype.PASSWORD = "P"; // "P"assword

/**
 * extends UserPref
 * @author aarranz
 */
function ListUserPref(name_, label_, desc_, defaultValue_, ValueOptions_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
	this.options = ValueOptions_;
	this.optionHash = null;
}

ListUserPref.prototype = new UserPref();

ListUserPref.prototype.makeInterface = function (varManager, iGadgetId) {
	var select;

	select = document.createElement("select");
	select.setAttribute("name", this.varName);

	var currentValue = this.getCurrentValue(varManager, iGadgetId);
	var output = "";
	for (var i = 0; i < this.options.length; i++) {
		output += "<option value=\"" + this.options[i][0] + "\"";

		if (currentValue == this.options[i][0]) output += " selected=\"selected\"";

		output += ">" + this.options[i][1] + "</option>";
	}
		
	select.innerHTML = output;

	return select;
}

ListUserPref.prototype.validate = function (newValue) {
	if (this.optionHash == null) {
		this.optionHash = new Hash();
		for (var i = 0; i < this.options.length; i++)
			this.optionHash[this.options[i][0]] = true;
	}

	return this.optionHash[newValue] != undefined;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function IntUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

IntUserPref.prototype = new UserPref();

IntUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

IntUserPref.prototype.validate = function (newValue) {
	return !isNaN(Number(newValue));
}

/**
 * extends UserPref
 * @autor aarranz
 */
function TextUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

TextUserPref.prototype = new UserPref();

TextUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function DateUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

DateUserPref.prototype = new UserPref();

DateUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "text");

	var currentValue = this.getCurrentValue(IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}

/**
 * extends UserPref
 * @autor aarranz
 */
function BoolUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

BoolUserPref.prototype = new UserPref();

BoolUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "checkbox");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue.strip().toLowerCase() == "true")
		element.setAttribute("checked", "true");

	return element;
}

BoolUserPref.prototype.getValueFromInterface = function(element) {
	return element.checked ? "true" : "false";
}

/**
 * extends UserPref
 * @autor fabio
 */
function PasswordUserPref(name_, label_, desc_, defaultValue_) {
	UserPref.prototype.UserPref.call(this, name_, label_, desc_, defaultValue_);
}

PasswordUserPref.prototype = new UserPref();

PasswordUserPref.prototype.makeInterface = function (varManager, IGadgetId) {
	var element;

	element = document.createElement("input");
	element.setAttribute("name", this.varName);
	element.setAttribute("type", "password");

	var currentValue = this.getCurrentValue(varManager, IGadgetId);
	if (currentValue != null)
		element.setAttribute("value", currentValue);

	return element;
}


if (!("elementFromPoint" in document)) {

	var elementPositions = function () {
		// *********************************
		// PRIVATE VARIABLES
		// *********************************
		this.elements = [];

		this.getElementByPoint = function(x, y) {
			for (var i = 0; i < this.elements.length; i++){
				var element = this.elements[i];
				var box = element.ownerDocument.getBoxObjectFor(element);
				if (box.x <= x && x <= (box.x+box.width) && box.y <= y && y <= (box.y+box.height)) {
					return element;
				}
			}
			return null;
		}

		this.addElement = function(element){
			this.elements.push(element);
		}

		this.removeElement = function(element){
			this.elements = this.elements.without(element);
		}
	};

	elementPositions = new elementPositions();

	document.elementFromPoint = function(x, y) {
		return elementPositions.getElementByPoint(x, y);
	}

	// Adding a new css rule for the tabs
	var css = document.styleSheets[1];
	css.insertRule('#tab_section .tab {-moz-binding: url("elementfrompoint.xbl#default")}', css.cssRules.length);
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