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


function WorkSpace (workSpaceState) {


	//set the proper handlers to the workspace toolbar buttons	
	WorkSpace.prototype._initToolbar = function(){
		if (this.getHeader()) {			
			//set the handlers
			if (this.wiring_link)
				this.wiringInterface.setToolbarButton(this.wiring_link);
			if (this.catalogue_link)
				CatalogueFactory.getInstance().setToolbarButton(this.catalogue_link);
			
		}
	}
	
	//unset the handlers of the workspace toolbar buttons
	WorkSpace.prototype._unloadToolbar = function(){
		if (this.getHeader()) {
			this.wiringInterface.unsetToolbarButton(this.wiring_link);
			CatalogueFactory.getInstance().unsetToolbarButton(this.catalogue_link);
		}		
	}
	
	WorkSpace.prototype._initAllToolbars = function () {
		this._initToolbar();									//workspace toolbar
		this.wiringInterface.initToolbar();				//wiring toolbar
		CatalogueFactory.getInstance().initToolbar();	//catalogue toolbar
		
	}
	
	WorkSpace.prototype._unloadAllToolbars = function () {
		this._unloadToolbar();								//workspace toolbar
		this.wiringInterface.unloadToolbar();			//wiring toolbar
		CatalogueFactory.getInstance().unloadToolbar(); //catalogue toolbar
		
	}
	
	WorkSpace.prototype._manageAddTabElement = function(locked){
		if (this.addTabElement){
			if (this.isAllowed('add_tab')) {
				if (locked) {
					this.addTabElement.hide();
				}
				else {
					this.addTabElement.show();
				}
			}
			else {
				this.addTabElement.hide();
			}
		}		
	}

	// ****************
	// CALLBACK METHODS
	// ****************

	/**
	 * Initializes this WorkSpace in failsafe mode.
	 */
	var _failsafeInit = function(transport, e) {
		this.valid = false;

		// Log it on the log console
		var logManager = LogManagerFactory.getInstance();
		msg = logManager.formatError(gettext("Error loading workspace: %(errorMsg)s"), transport, e);
		logManager.log(msg);

		// Show a user friend alert
		var layoutManager = LayoutManagerFactory.getInstance();
		var msg = gettext('Error loading workspace. Please, change active workspace or create a new one.');
		layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);

		// Clean current status
		this.varmanager = null;
		this.contextManager = null;
		this.wiring = null;
		this.wiringInterface = null;

		// Failsafe workspace status
		layoutManager.currentViewType = "dragboard"; // workaround
		this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('workspace', {}, this)

		var initialTab = {
		                  'id': 0,
		                  'locked': "true",
		                  'igadgetList': [],
		                  'name': gettext("Unusable Tab"),
		                  'visible': 1,
		                  'preferences': {}
		                 };

		this.workSpaceGlobalInfo = {
		                            'workspace': {
		                               'tabList': [
		                                 initialTab
		                               ]
		                             }
		                           };
		this.tabInstances = new Hash();
		this.tabInstances[0] = new Tab(initialTab, this);
		this.visibleTab = this.tabInstances[0];

		this.loaded = true;

		this._createWorkspaceMenu();
		this._update_creator_options();

		layoutManager.logStep('');
		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
	};

	// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
	var loadWorkSpace = function (transport) {
		var layoutManager = LayoutManagerFactory.getInstance();
		layoutManager.logStep('');
		layoutManager.logSubTask(gettext('Processing workspace data'));

		try {
			// JSON-coded iGadget-variable mapping
			var response = transport.responseText;
			this.workSpaceGlobalInfo = JSON.parse(response);

			// Load workspace preferences
			var preferenceValues = this.workSpaceGlobalInfo['workspace']['preferences'];
			this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('workspace', preferenceValues, this)
			this.preferences.addCommitHandler(this.preferencesChanged.bind(this));
			
			// Load workspace tabs
			var tabs = this.workSpaceGlobalInfo['workspace']['tabList'];
			var visibleTabId = null;

			if (tabs.length > 0) {
				visibleTabId = tabs[0].id;
				for (var i = 0; i < tabs.length; i++) {
					var tab = tabs[i];
					var tabInstance = new Tab(tab, this);
					this.tabInstances[tab.id] = tabInstance;

					if (tab.visible) {
						visibleTabId = tab.id;
					}
				}
			}

			this.varManager = new VarManager(this);

			this.contextManager = new ContextManager(this, this.workSpaceGlobalInfo);
			this.wiring = new Wiring(this, this.workSpaceGlobalInfo);

			this.wiringInterface = new WiringInterface(this.wiring, this, $("wiring"));
			
			this.remoteChannelManager = new RemoteChannelManager(this.wiring);

			this.valid = true;

			if (tabs.length > 0) {
				//Only painting the "active" tab!
				this.tabInstances[visibleTabId].getDragboard().paint();
			}

			//set the visible tab. It will be displayed as current tab afterwards
			this.visibleTab = this.tabInstances[visibleTabId];

		} catch (error) {
			// Error during initialization
			// Loading in failsafe mode
			_failsafeInit.call(this, transport, error);
			return;
		}

		this.loaded = true;
		
		
		this._createWorkspaceMenu();
		
		this._update_creator_options();
		if (!this.isAllowed('preserve_lock_status'))
			this._lockFunc(true);
		
		//all the modules have been downloaded. Init now all the toolbars:
		//catalogue, wiring and workspace.
		this._initAllToolbars();
		
		var branding = this.workSpaceGlobalInfo['workspace']['branding']
		this.brandingManager.setBranding(branding);

		var workspaceSkin = this.preferences.get('skin');
		var scriptSkin = ScriptManagerFactory.getInstance().get_theme();
		
		if (scriptSkin)
			workspaceSkin = scriptSkin 
		
		this.skinManager.loadSkin(workspaceSkin);

		layoutManager.logStep('');
		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
	}

	var onError = function (transport, e) {
		_failsafeInit.call(this, transport, e);
	}

	var renameSuccess = function(transport) {
	}
	var renameError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error renaming workspace, changes will not be saved: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}
	var deleteSuccess = function(transport) {
		var tabList = this.tabInstances.keys();
		
		for (var i=0; i<tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];
			tab.destroy();
			//TODO:treatment of wiring, varManager, etc.
		}
		LayoutManagerFactory.getInstance().hideCover();
	}

	var deleteError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error removing workspace, changes will not be saved: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().hideCover();
	}

	var publishSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var mashupInfo = JSON.parse(response);
		
		CatalogueFactory.getInstance().add_resource_by_template(mashupInfo.url);
	}

	var publishError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error publishing workspace: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().hideCover();
	}
	
	var mergeSuccess = function(transport) {
		// JSON-coded new published workspace id and mashup url mapping
		var response = transport.responseText;
		var data = JSON.parse(response);
		//update the new wsInfo
		opManager = OpManagerFactory.getInstance();
		opManager.changeActiveWorkSpace(opManager.workSpaceInstances[data.merged_workspace_id]);
		LayoutManagerFactory.getInstance().hideCover();
	}

	var mergeError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error merging workspace: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().hideCover();
	}

	//**** TAB CALLBACK*****
	var createTabSuccess = function(transport) {
		var response = transport.responseText;
		var tabInfo = JSON.parse(response);

		tabInfo.igadgetList = [];
		tabInfo.preferences = {};
		
		var newTab = new Tab(tabInfo, this);
		this.tabInstances[tabInfo.id] = newTab;
		this._checkLock();
		this.setTab(this.tabInstances[tabInfo.id]);
		for(var i=0; i< tabInfo.workspaceVariables.length; i++){
			this.varManager.parseWorkspaceVariable(tabInfo.workspaceVariables[i]);
			this.wiring.processVar(tabInfo.workspaceVariables[i]);
		}

		this.showTabBar();
		newTab.getDragboard().paint();
	}

	var createTabError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error creating a tab: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	// ****************
	// PUBLIC METHODS
	// ****************

	WorkSpace.prototype.subscribe_to_channels = function() {
		this.remoteChannelManager.subscribe_to_channels();
	}

	WorkSpace.prototype.igadgetLoaded = function(igadgetId) {
		var igadget = this.getIgadget(igadgetId);
		igadget._notifyLoaded();

		// Notify to the wiring module the igadget has been loaded
		this.wiring.iGadgetLoaded(igadget);

		// Notify to the context manager the igadget has been loaded
		this.contextManager.iGadgetLoaded(igadget);
		
		// Notify to the variable manager the igadget has been loaded
		this.varManager.dispatchPendingVariables(igadgetId);
		
	}
	
	WorkSpace.prototype.getTabInstance = function(tabId) {
		return this.tabInstances[tabId];
	}
	
		
	WorkSpace.prototype.run_script = function() {
		ScriptManagerFactory.getInstance().run_script(this);
	}

	WorkSpace.prototype.igadgetUnloaded = function(igadgetId) {
		var igadget = this.getIgadget(igadgetId);
		if (igadget == null)
			return;

		// Notify to the wiring module the igadget has been unloaded
		this.wiring.iGadgetUnloaded(igadget);

		// Notify to the context manager the igadget has been unloaded
		this.contextManager.iGadgetUnloaded(igadget);

		igadget._notifyUnloaded();
	}

	WorkSpace.prototype.sendBufferedVars = function () {
		if (this.varManager) this.varManager.sendBufferedVars();
	}
	
	WorkSpace.prototype.getHeader = function(){
		return this.headerHTML;
	}
	
	/**
	 * This function knows which handler matches the workspace link in the toolbar
	 * @param {HTML element} workspaceLinkElement
	 */
	 
	WorkSpace.prototype.setToolbarButton = function (workspaceLinkElement){
		workspaceLinkElement.onclick = function(){
											OpManagerFactory.getInstance().showActiveWorkSpace(false);
										};
	}
	
	/**
	 * This function knows how to stop observing the workspace link event
	 * @param {HTML element} workspaceLinkElement
	 */
	WorkSpace.prototype.unsetToolbarButton = function (workspaceLinkElement){
		workspaceLinkElement.onclick = null;
	}

	WorkSpace.prototype.fillWithLabel = function() {
		var nameToShow = (this.workSpaceState.name.length>15)?this.workSpaceState.name.substring(0, 15)+"..." : this.workSpaceState.name;
		
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();		
		if (this.workSpaceNameHTMLElement != null) {
			this.workSpaceNameHTMLElement.update(nameToShow);
		}else {
			var spanHTML = "<span>" + nameToShow + "</span>";
			new Insertion.Top(this.workSpaceHTMLElement, spanHTML);
			this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		}
	}
	
	WorkSpace.prototype.rename = function(name){
		this.updateInfo(name);
		this.fillWithLabel();
	}

	WorkSpace.prototype.updateInfo = function (workSpaceName) {
		//If the server isn't working the changes will not be saved
		if (workSpaceName == "" || workSpaceName.match(/^\s$/)){//empty name
			var msg = interpolate(gettext("Error updating a workspace: invalid name"), true);
			LogManagerFactory.getInstance().log(msg);
		} else if (!OpManagerFactory.getInstance().workSpaceExists(workSpaceName)) {
			this.workSpaceState.name = workSpaceName;

			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id, 'last_user': last_logged_user});
			var o = new Object();
			o.name = workSpaceName;
			var workSpaceData = Object.toJSON(o);
			var params = {'workspace': workSpaceData};
			PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, renameSuccess, renameError);
		} else {
			var msg = interpolate(gettext("Error updating a workspace: the name %(workSpaceName)s is already in use."), {workSpaceName: workSpaceName}, true);
			LogManagerFactory.getInstance().log(msg);
		}
	}

	WorkSpace.prototype.deleteWorkSpace = function() {
		if(OpManagerFactory.getInstance().removeWorkSpace(this.workSpaceState.id)){
			var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id, 'last_user': last_logged_user});
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
	
	WorkSpace.prototype.isEmpty = function () {
		if (this.tabInstances.keys().length == 1){
		 return this.visibleTab.dragboard.getIGadgets().length == 0; 
		}
		return false;
	}

	WorkSpace.prototype.downloadWorkSpaceInfo = function () {
		LayoutManagerFactory.getInstance().logSubTask(gettext("Downloading workspace data"), 1);
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id, 'last_user': last_logged_user});
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

	WorkSpace.prototype.show = function() {
	
		if (!this.loaded)
			return;

		if (this.getHeader()) //there is a banner
			this.fillWithLabel();

		var tabList = this.tabInstances.keys();

		for (var i = 0; i < tabList.length; i++) {
			var tab = this.tabInstances[tabList[i]];

			if (tab == this.visibleTab)
				tab.show();
			else
				tab.unmark();
		}
		if (tabList.length == 1){ //hide the tab if only one exists
			this.hideTabBar()
		}else{
			this.showTabBar()
		}

		// resize tab bar after displaying tabs
		LayoutManagerFactory.getInstance().resizeTabBar();

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

	//It returns if the tab can be removed and shows an error window if it isn't possible
	WorkSpace.prototype.removeTab = function(tab) {
		var msg=null;
		if (this.tabInstances.keys().length <= 1) {
			msg = gettext("there must be one tab at least");
			msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {
				errorMsg: msg
			}, true);
		} else if (tab.hasReadOnlyIGadgets()) {
			msg = gettext("it contains some gadgets that cannot be removed");
			msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {
				errorMsg: msg
			}, true);
		}

		if (msg) { //It cannot be deleted
			LogManagerFactory.getInstance().log(msg);
			//LayoutManagerFactory.getInstance().hideCover();
			LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
			return false;
		}

		this.unloadTab(tab.getId());
		
		if (this.tabInstances.keys().length == 1) {
			this.hideTabBar();
		}
		//set the first tab as current
		this.setTab(this.tabInstances.values()[0]);

		return true;
	}

	WorkSpace.prototype.unloadTab = function(tabId) {
		if (!this.valid)
			return;

		var tab = this.tabInstances[tabId];

		this.tabInstances.remove(tabId);

		this.varManager.removeWorkspaceVariable(tab.connectable.variable.id);

		tab.connectable.destroy();
		tab.destroy();

		this.visibleTab = null;
	}
	
	WorkSpace.prototype.hideTabBar = function(){
		this.tabBar.setStyle({"visibility": "hidden"});
	}
	
	WorkSpace.prototype.showTabBar = function(){
		this.tabBar.setStyle({"visibility": "visible"});
	}

	WorkSpace.prototype.unload = function() {
		var layoutManager = LayoutManagerFactory.getInstance();
		layoutManager.logSubTask(gettext("Unloading current workspace"));

		//remove the handlers of the catalogue and wiring buttons
		//and the reference to this workspace from catalogue and wiring toolbars
		this._unloadAllToolbars();

		// Unload Wiring Interface
		// TODO Wiring Interface should be shared between Workspaces
		if (this.wiringInterface !== null) {
			this.wiringInterface.saveWiring();
			this.wiringInterface.unload();
			this.wiringInterface = null;
		}

		//layoutManager.unloadCurrentView();

		this.sendBufferedVars();

		// After that, tab info is managed
		var tabKeys = this.tabInstances.keys();

		for (var i=0; i<tabKeys.length; i++) {
			this.unloadTab(tabKeys[i]);
		}

		if (this.preferences) {
			this.preferences.destroy();
			this.preferences = null;
		}

		if (this.wiring !== null)
			this.wiring.unload();
		if (this.contextManager !== null)
			this.contextManager.unload();
			this.contextManager=null;

		this._removeWorkspaceMenu();
				
		//deapply skin
		this.skinManager.unloadSkin();
		
		layoutManager.logStep('');
	}

	WorkSpace.prototype.goTab = function(tab) {
		if (!this.loaded)
			return;
		
		this.visibleTab.unmark();
		this.visibleTab = tab;
		this.visibleTab.go();
	}
	

	WorkSpace.prototype.addIGadget = function(tab, igadget, igadgetJSON, options) {
		this.varManager.addInstance(igadget, igadgetJSON, tab);
		this.contextManager.addInstance(igadget, igadget.getGadget().getTemplate());
		this.wiring.addInstance(igadget, igadgetJSON.variables);

		options.setDefaultValues.call(this, igadget.id);

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
	
	WorkSpace.prototype.shareWorkspace = function(value, groups) {
		var share_workspace_success = function (transport) {
			var response = transport.responseText;
			var result = JSON.parse(response);
			
			if (result['result'] != 'ok')
				LayoutManagerFactory.getInstance().showSharingWorkspaceResults(gettext("The Workspace has NOT been successfully shared."), '');
			else
				LayoutManagerFactory.getInstance().showSharingWorkspaceResults(gettext("The Workspace has been successfully shared."), result);
		}

		var share_workspace_error = function (transport) {
			var response = transport.responseText;
			var result = JSON.parse(response);
			
			LayoutManagerFactory.getInstance().showSharingWorkspaceResults(gettext("The Workspace has NOT been successfully shared."), '');
		}

		var url = URIs.PUT_SHARE_WORKSPACE.evaluate({'workspace_id': this.workSpaceState.id, 'share_boolean': value});
		var sharingData = Object.toJSON(groups);
		var params = (groups.length>0)?{'groups':sharingData}:{};
		
		PersistenceEngineFactory.getInstance().send_update(url, params, this, share_workspace_success, share_workspace_error);
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

	//Check if a workspace is shared with another users
	WorkSpace.prototype.isShared = function() {
		return this.workSpaceState['shared'] || this.forceRestrictedSharing();
	}

	//Check if the workspace has to be forced to work as a Shared environment (IE6 only)
	WorkSpace.prototype.forceRestrictedSharing = function() {
		return (BrowserUtilsFactory.getInstance().getBrowser() == "IE6");
	}


	/**
	 * Check when an action, defined by a basic policy, can be performed.
	 */
	WorkSpace.prototype._isAllowed = function (action) {
		return EzSteroidsAPI.is_activated() ?
			EzSteroidsAPI.evaluePolicy(action) :
			true;
	}

	/**
	 * Checks if an action can be performed in this workspace by current user.
	 */
	WorkSpace.prototype.isAllowed = function (action) {

		if (action != "add_remove_workspaces" && (!this.valid || this.shared))
			return false;

		switch (action) {
		case "merge_workspaces":
			return this._isAllowed('add_remove_igadgets') || this._isAllowed('merge_workspaces');
		case "catalogue_view_gadgets":
			return this._isAllowed('add_remove_igadgets');
		case "catalogue_view_gadgets":
			return this.isAllowed('add_remove_workspaces') || this.isAllowed('merge_workspaces');
		default:
			return this._isAllowed(action);
		}
	}
	
	/*
	 * General function to create the ToolbarMenu
	 */
	WorkSpace.prototype._initMenu = function(idMenu, idSubMenu){
		// get the current menu to remove it if it already exists
		var menuHTML = $(idMenu);
		if (menuHTML) 
			menuHTML.remove();
		
		// add the DOM element and create the menu
		menuHTML = '<div id="' + idMenu + '" class="toolbar_menu_small"></div>';
		new Insertion.Bottom(this.toolbarSection, menuHTML);
		return new ToolbarMenu(idMenu);
	}
	
	
	
	
	/*
	 * Menu with the options to configure the workspace 
	 */
	WorkSpace.prototype._createConfigurationMenu = function(){
		var idMenu = 'config_menu_'+this.workSpaceState.id;

		this.confMenu = this._initMenu(idMenu);
		
		/*** Add to the menu the proper options ***/
		var optionPosition = 0;
		
		// Mark as active option
		if (this.valid && !this.workSpaceGlobalInfo.workspace.active) {
			this.activeEntryId = this.confMenu.addOption(gettext("Initial"),
				function() {
					LayoutManagerFactory.getInstance().hideCover();
					this.markAsActive();
				}.bind(this),
				optionPosition++);
		}
		//Rename option
		if (this.isAllowed('rename')) {
			this.confMenu.addOption(gettext("Rename"),
				function() {
					LayoutManagerFactory.getInstance().showWindowMenu("renameWorkSpace");
				},
				optionPosition++);
		}
		// Workspace preferences option
		if (this.isAllowed('change_preferences')) {
			this.confMenu.addOption(gettext("Preferences"),
				function() {
					LayoutManagerFactory.getInstance().showPreferencesWindow('workspace', this.preferences);
				}.bind(this),
				optionPosition++);
		}
		// Delete option
		if (this.isAllowed('add_remove_workspaces')) {
			this.confMenu.addOption(gettext("Remove"),
				function() {
					var msg = gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
					msg = interpolate(msg, {workspaceName: this.workSpaceState.name}, true);
					LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();})
				}.bind(this),
				optionPosition++);
		}
		//Merge workspace option
		if (this.isAllowed('merge_workspaces') && 
			(OpManagerFactory.getInstance().workSpaceInstances.keys().length > 1)) { //there are several workspaces
			
			// mergeWith workspace Menu
			var idMergeMenu = 'mergeMenu_'+this.workSpaceState.id;		
			this.mergeMenu = LayoutManagerFactory.getInstance().initDropDownMenu(idMergeMenu);
			
			this.confMenu.addOption(gettext("Merge"),
				function(e) {
					LayoutManagerFactory.getInstance().showDropDownMenu('wsList', this.mergeMenu, Event.pointerX(e), Event.pointerY(e));
				}.bind(this),
				optionPosition++);
		}
		
		// add the event listener
		Event.observe(this.confLauncher, 'click', 
						function(e){
							var target = BrowserUtilsFactory.getInstance().getTarget(e);
							target.blur();
							LayoutManagerFactory.getInstance().showToolbarMenu(this.confMenu, this.confLauncher, this.toolbarSection);
						}.bind(this));
		
	
	}
	
	
	/* 
	 * Menu with the share and publish options 
	 */
	WorkSpace.prototype._createSharingMenu = function(){
		var idMenu = 'sharing_menu_'+this.workSpaceState.id;

		this.sharingMenu = this._initMenu(idMenu);
		
		/*** Add to the menu the proper options ***/
		var optionPosition = 0;		
		
		if (this.isAllowed('share')) {
			this.sharingMenu.addOption(gettext("Share"),
				function() {
					LayoutManagerFactory.getInstance().showWindowMenu('shareWorkSpace');
				}.bind(this),
				optionPosition++, null, "share_workspace");
		}
		
		if (this.isAllowed('publish')) {
			//TODO:Intermediate window to ask for data (name, description...)		
			this.sharingMenu.addOption(gettext("Publish in gallery"),
				function() {
					LayoutManagerFactory.getInstance().showWindowMenu('publishWorkSpace');
				}.bind(this),
				optionPosition++, null, "publish_workspace");
		}
		
		// add the event listener
		Event.observe(this.sharingLauncher, 'click', 
						function(e){
							var target = BrowserUtilsFactory.getInstance().getTarget(e);
							target.blur();
							LayoutManagerFactory.getInstance().showToolbarMenu(this.sharingMenu, this.sharingLauncher, this.toolbarSection);
						}.bind(this));
	
	}
	
	/* 
	 * Menu with the share and publish options 
	 */
	WorkSpace.prototype._createEditMenu = function(){
		var idMenu = 'edit_menu_'+this.workSpaceState.id;

		this.editMenu = this._initMenu(idMenu);
		
		/*** Add to the menu the proper options ***/
		var optionPosition = 0;
		
		// catalogue access option
		if (this.isAllowed('catalogue_view_gadgets') || this.isAllowed('catalogue_view_mashups')){
				var catId = this.editMenu.addOption(gettext("Go to Gallery")+" »",
								function() {
									// the action of going to the catalogue is set by the own catalogue module
									LayoutManagerFactory.getInstance().hideCover();
								},
								optionPosition++);
				this.catalogue_link = $(catId)
		}
		
		//wiring access option
		if (this.isAllowed('connect_igadgets')){
			var wiringId = this.editMenu.addOption(gettext("Go to Wiring tool")+" »",
								function() {
									// the action of going to the wiring is set by the own wiring module
									LayoutManagerFactory.getInstance().hideCover();
								},
								optionPosition++);
			this.wiring_link = $(wiringId)
		}
				
		// add the event listener
		Event.observe(this.editLauncher, 'click', 
						function(e){
							var target = BrowserUtilsFactory.getInstance().getTarget(e);
							target.blur();
							if (this.isAllowed('change_lock_status')) {
								this._lockFunc(!this._isLocked());
							}
							LayoutManagerFactory.getInstance().showToolbarMenu(this.editMenu, this.editLauncher, this.toolbarSection);
						}.bind(this));
	
	}
	
	
	/* 
	 *Menu with the "go to" options 
	 */
	WorkSpace.prototype._createGoToMenu = function(){
		/*var idMenu = 'goto_menu_'+this.workSpaceState.id;
		var idSubMenu = "submenu_" + idMenu;

		this.goToMenu = this._initMenu(idMenu);
		
		// Add to the menu the proper options
		var optionPosition = 0; 
		//NOTE: first positions will be used to access to the main workspaces (filled by the LayoutManager)
		
		var ws_count = OpManagerFactory.getInstance().getWorkspaceCount();
		
		if (ws_count > this.goToMenu.MAX_OPTIONS - 1){ // let one hole to prevent larger toolbars
			//Workspace list option
			this.goToMenu.addOption("<span class='superindex'>»</span>"+ String(ws_count - 1),
								function(e) {
									//show the window with all the workspaces
									LayoutManagerFactory.getInstance().toggleSideBarMenu();
								},
								optionPosition++);
		}else{				
			//new workspace option
			if (this.isAllowed('add_remove_workspaces') && this.isAllowed('create_custom_workspaces')) {
				// EzWeb IE6 version does not allow creating new Workspaces
				 this.goToMenu.addOption(gettext("New Application"),
							function() {
								LayoutManagerFactory.getInstance().showWindowMenu('createWorkSpace');
							},
							optionPosition++);
			}
			
		}
		
		
		// add the event listener
		Event.observe(this.goToLauncher, 'click', 
						function(e){
							var target = BrowserUtilsFactory.getInstance().getTarget(e);
							target.blur();
							LayoutManagerFactory.getInstance().showToolbarMenu(this.goToMenu, this.goToLauncher, this.toolbarSection);
						}.bind(this));
		*/
		//Toggle the sidebar
		/*Event.observe(this.goToLauncher, 'click', 
						function(e){
							//LayoutManagerFactory.getInstance().clearToolbar(this.toolbarSection, this.goToLauncher);
							LayoutManagerFactory.getInstance().toggleSideBarMenu();
						}.bind(this));*/
		

	}
	
	/*
	 * Create the necessary menus for the Toolbar 
	 */
	WorkSpace.prototype._createWorkspaceMenu = function() {
		LayoutManagerFactory.getInstance().createToolbarSection(this.toolbarSection);
		
		//this.goToLauncher = $('go_to_link');
		this.confLauncher = $('conf_link');
		this.sharingLauncher = $('sharing_link');
		this.editLauncher = $('edit_link')
		
		//GoTo menu
		//this._createGoToMenu();
		
		//Configuration Menu
		this._createConfigurationMenu();
				
		//Sharing menu
		this._createSharingMenu();
		
		//Edit Menu
		this._createEditMenu();
		
		//Show the initial menu
		// Show the "My Applications" option unfolded
		/*LayoutManagerFactory.getInstance().showToolbarMenu(this.goToMenu, this.goToLauncher, this.toolbarSection);*/
		// hide the add_tab element	
		this._manageAddTabElement(true);
	}
	
	/*
	 * Remove the toolbar menus 
	 */
	WorkSpace.prototype._removeWorkspaceMenu = function(){
		if (this.goToMenu)
			this.goToMenu.remove();
		if (this.confMenu)
			this.confMenu.remove();
		if (this.sharingMenu)
			this.sharingMenu.remove();
		if (this.editMenu)
			this.editMenu.remove();

		if (this.wsListMenu)
			this.wsListMenu.remove();
		if (this.mergeMenu)
			this.mergeMenu.remove();

	}
	
	WorkSpace.prototype.getGoToMenu = function(){
		return this.goToMenu;
	}
	
	WorkSpace.prototype.getWsListMenu = function(){
		return this.wsListMenu;
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
	this.remoteChannelManager = null;
	this.contextManager = null;
	this.loaded = false;
	this.wiringLayer = null;
	this.visibleTab = null;
	this.valid=false;
	
	this.workSpaceHTMLElement = $('workspace_name');
	this.addTabElement = $('add_tab_link');
	this.tabBar = $('fixed_bar');
	this.toolbarSection = $('toolbar_section')!=null?$('toolbar_section'):$('lite_toolbar_section');
	
	
	// menu DOM elements and objects
	this.goToMenu = null;
	this.confMenu = null;
	this.sharingMenu = null;	
	this.mergeMenu = null;
	this.FloatingGadgetsMenu = null;
	this.wsListMenu = null;
	
	//this.goToLauncher = null;
	this.confLauncher = null;
	this.sharingLauncher = null;
	this.editLauncher = null;
	
	this.unlockEntryPos;
	 
	//toolbar links
	this.wiring_link = null;
	this.catalogue_link = null;
	
	//banner
	this.headerHTML = $('ws_header');
	
	this.skinManager = new SkinManager();
	this.brandingManager = new BrandingManager();
	
	
	/*
	 * OPERATIONS
	 */
	

	this._lockFunc = function(locked) {
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			this.tabInstances[keys[i]].setLock(locked);
		}
		this._manageAddTabElement(locked)
		
	}.bind(this);
	
	this._isLocked = function(){
		var keys = this.tabInstances.keys();
		var all = true;
		var locked = null;
		for (var i = 0; i < keys.length; i++) {
			if (!this.tabInstances[keys[i]].dragboard.isLocked()){
				all = false;
			}
		}
		return all;
	}


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
				this.confMenu.removeOption(this.lockEntryId);
				this.lockEntryId = null;
				numRemoved++;
			}else if(!locked && this.unlockEntryId!=null){
				this.confMenu.removeOption(this.unlockEntryId);
				this.unlockEntryId = null;
				numRemoved++;
			}
		}
		
		if((!all || locked) && this.unlockEntryId==null){
			this.unlockEntryId = this.confMenu.addOption(_currentTheme.getIconURL('unlock'),
				gettext("Unlock"),
				function() {
					LayoutManagerFactory.getInstance().hideCover();
					this._lockFunc(false);
				}.bind(this),
				this.unlockEntryPos);
		}
		if((!all || !locked) && this.lockEntryId==null){
			if(this.unlockEntryId)
				position = this.unlockEntryPos + 1;
			this.lockEntryId = this.confMenu.addOption(_currentTheme.getIconURL('lock'),
				gettext("Lock"),
				function() {
					LayoutManagerFactory.getInstance().hideCover();
					this._lockFunc(true);
				}.bind(this),
				position);
		}
		return numRemoved;
	}.bind(this);

	this.markAsActive = function () {
		var workSpaceUrl = URIs.GET_POST_WORKSPACE.evaluate({'id': this.workSpaceState.id, 'last_user': last_logged_user});
		var o = new Object;
		o.active = "true"
		var workSpaceData = Object.toJSON(o);
		var params = {'workspace': workSpaceData};
		PersistenceEngineFactory.getInstance().send_update(workSpaceUrl, params, this, this.markAsActiveSuccess, this.markAsActiveError);
	}.bind(this);

	this.markAsActiveSuccess = function() {
		this.workSpaceGlobalInfo.workspace.active = true;
		this.workSpaceState.active = true;
		if (this.activeEntryId != null) {
			this.confMenu.removeOption(this.activeEntryId);
			this.activeEntryId = null;
		}
	}.bind(this);

	this.markAsActiveError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error marking as first active workspace, changes will not be saved: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}.bind(this);

	this._update_creator_options = function() {		
		if (this.isShared()) {
			document.body.addClassName('shared');
		} else {
			document.body.removeClassName('shared');
		}
	}
}

WorkSpace.prototype.preferencesChanged = function(modifiedValues) {
	for (preferenceName in modifiedValues) {
		var newLayout = false;

		switch (preferenceName) {
		case "skin":
			var newSkin = modifiedValues[preferenceName];
			this.skinManager.loadSkin(newSkin);

		default:
			continue;
		}
	}
}
