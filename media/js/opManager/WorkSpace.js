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
		this.preferences = null;

		this.loaded = true;

		this._createWorkspaceMenu();
		this._hide_creator_options();

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

			this.wiringInterface = new WiringInterface(this.wiring, this, $("wiring"), $("wiring_link"));

			if (tabs.length > 0) {
				//Only painting the "active" tab!
				this.tabInstances[visibleTabId].getDragboard().paint();
			}

			//set the visible tab. It will be displayed as current tab afterwards
			this.visibleTab = this.tabInstances[visibleTabId];

			this.valid = true;
		} catch (error) {
			// Error during initialization
			// Loading in failsafe mode
			_failsafeInit.call(this, transport, error);
			return;
		}

		this.loaded = true;

		var workspaceTheme = this.preferences.get('theme');
		LayoutManagerFactory.getInstance().changeCurrentTheme(workspaceTheme);

		this._createWorkspaceMenu();

		//If workspace is shared, some options must be unavailable!
		if (this.isShared())
			this._hide_creator_options();
		else
			this._show_creator_options();

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
		UIUtils.addResource(URIs.GET_POST_RESOURCES, 'template_uri', mashupInfo.url);
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

	WorkSpace.prototype.igadgetLoaded = function(igadgetId) {
		var igadget = this.getIgadget(igadgetId);
		igadget._notifyLoaded();

		// Notify to the wiring module the igadget has been loaded
		this.wiring.iGadgetLoaded(igadget);

		// Notify to the context manager the igadget has been loaded
		this.contextManager.iGadgetLoaded(igadget);
	}
	
	WorkSpace.prototype.getTabInstance = function(tabId) {
		return this.tabInstances[tabId];
	}
	
		
	WorkSpace.prototype.run_post_load_script = function() {
		run_initial_script(this);
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

	WorkSpace.prototype.fillWithLabel = function() {
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		if (this.workSpaceNameHTMLElement != null) {
			this.workSpaceNameHTMLElement.remove();
		}
		var nameToShow = (this.workSpaceState.name.length>15)?this.workSpaceState.name.substring(0, 15)+"..." : this.workSpaceState.name;
		var spanHTML = "<span>"+nameToShow+"</span>";
		new Insertion.Top(this.workSpaceHTMLElement, spanHTML);
		this.workSpaceNameHTMLElement = this.workSpaceHTMLElement.firstDescendant();
		Event.observe(this.workSpaceNameHTMLElement, 'click', function(e) {
			if (LayoutManagerFactory.getInstance().getCurrentViewType() == "dragboard") {
				this.fillWithInput();
			} else {
				OpManagerFactory.getInstance().showActiveWorkSpace();
			}
		}.bind(this));
		LayoutManagerFactory.getInstance().resizeTabBar();
	}

	WorkSpace.prototype.fillWithInput = function () {
		if (!this.isShared()) {
			this.workSpaceNameHTMLElement.remove();
			var inputHTML = "<input class='ws_name' value='"+this.workSpaceState.name+"' size='"+this.workSpaceState.name.length+" maxlength=30' />";
			new Insertion.Top(this.workSpaceHTMLElement, inputHTML);
			this.workSpaceNameHTMLElement =  this.workSpaceHTMLElement.firstDescendant();
			this.workSpaceNameHTMLElement.focus();
			Event.observe(this.workSpaceNameHTMLElement, 'blur', function(e){
						Event.stop(e);
						this.fillWithLabel()}.bind(this));
			Event.observe(this.workSpaceNameHTMLElement, 'keypress', function(e){
						if(e.keyCode == Event.KEY_RETURN){
							Event.stop(e);
							var target = BrowserUtilsFactory.getInstance().getTarget(e);
							target.blur();
						}}.bind(this));
			Event.observe(this.workSpaceNameHTMLElement, 'change', function(e){
						var target = BrowserUtilsFactory.getInstance().getTarget(e);
						this.updateInfo(target.value);}.bind(this));
			Event.observe(this.workSpaceNameHTMLElement, 'keyup', function(e){
						Event.stop(e);
						var target = BrowserUtilsFactory.getInstance().getTarget(e);
						target.size = (target.value.length==0)?1:target.value.length;}.bind(this));
		}
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
		if (this.tabInstances.keys().length <= 1) {
			var msg;
			msg = gettext("there must be one tab at least");

			msg = interpolate(gettext("Error removing tab: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
			LayoutManagerFactory.getInstance().hideCover();
			return false;
		}

		this.unloadTab(tabId);

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

	WorkSpace.prototype.unload = function() {
		var layoutManager = LayoutManagerFactory.getInstance();
		layoutManager.logSubTask(gettext("Unloading current workspace"));

		// Unload Wiring Interface
		// TODO Wiring Interface should be shared between Workspaces
		if (this.wiringInterface !== null) {
			this.wiringInterface.saveWiring();
			this.wiringInterface.unload();
			this.wiringInterface = null;
		}

		layoutManager.unloadCurrentView();

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

		// reset the values used to figure out the size of the tabBar
		layoutManager.resetTabBar();

		if (this.wiring !== null)
			this.wiring.unload();
		if (this.contextManager !== null)
			this.contextManager.unload();
			this.contextManager=null;

		this.menu.remove();
		this.mergeMenu.remove();

		layoutManager.logStep('');
	}

	WorkSpace.prototype.goTab = function(tab) {
		if (!this.loaded)
			return;
		
		this.visibleTab.unmark();
		this.visibleTab = tab;
		this.visibleTab.go();
	}
	

	WorkSpace.prototype.addIGadget = function(tab, igadget, igadgetJSON) {
		this.varManager.addInstance(igadget, igadgetJSON, tab);
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
		var params = (groups)?{'groups':sharingData}:{};
		
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
		return eval(this.workSpaceState['shared']);
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
	this.FloatingGadgetsMenu = null;
	this.unlockEntryPos;
	this.valid=false;

	var wsOpsLauncher = 'ws_operations_link';

	this._lockFunc = function(locked) {
		var keys = this.tabInstances.keys();
		for (var i = 0; i < keys.length; i++) {
			this.tabInstances[keys[i]]._lockFunc(locked);
		}
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
			this.unlockEntryId = this.menu.addOption(_currentTheme.getIconURL('unlock'),
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
			this.lockEntryId = this.menu.addOption(_currentTheme.getIconURL('lock'),
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
			this.menu.removeOption(this.activeEntryId);
			this.activeEntryId = null;
		}
		PreferencesManagerFactory.getInstance().getPlatformPreferences().set('initial-theme', this.preferences.get('theme'));
	}.bind(this);

	this.markAsActiveError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error marking as first active workspace, changes will not be saved: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}.bind(this);

	this._hide_element = function(id) {
		$(id).style.display = 'none';
	}
	
	this._show_element = function(id) {
		$(id).style.display = 'block';
	}
	
	this._hide_creator_options = function() {
		this._hide_element('add_tab_link');
		this._hide_element('catalogue_link');
		this._hide_element('wiring_link');
		this.workSpaceHTMLElement.addClassName("shared");
	}
	
	this._show_creator_options = function() {
		this._show_element('add_tab_link');
		this._show_element('catalogue_link');
		this._show_element('wiring_link');
		this.workSpaceHTMLElement.removeClassName("shared");
	}
}

WorkSpace.prototype._createWorkspaceMenu = function() {
	var idMenu = 'menu_'+this.workSpaceState.id;

	var menuHTML = $(idMenu);
	if (menuHTML)
		menuHTML.remove();

	//worksplace menu
	var optionPosition = 0;
	menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"><div id="submenu_'+idMenu+'" class="submenu"></div></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);

	//mergeWith workspace Menu
	var idMergeMenu = 'mergeMenu_'+this.workSpaceState.id;
	var mergeMenuHTML = '<div id="'+idMergeMenu+'" class="drop_down_menu"></div></div>';
	new Insertion.After($('menu_layer'), mergeMenuHTML);
	this.mergeMenu = new DropDownMenu(idMergeMenu, this.menu);

	//adding options to workspace menu
	if (this.valid && !this.workSpaceGlobalInfo.workspace.active) {
		this.activeEntryId = this.menu.addOption(_currentTheme.getIconURL('workspace_active'),
			gettext("Mark as Active"),
			function() {
				LayoutManagerFactory.getInstance().hideCover();
				this.markAsActive();
			}.bind(this),
			optionPosition++);
		}

	if (this.valid && !this.isShared()) {
		//It's your own workspace.
		//All operations are allowed!

		this.menu.addOption(_currentTheme.getIconURL('rename'),
			gettext("Rename"),
			function() {
				OpManagerFactory.getInstance().activeWorkSpace.fillWithInput();
				LayoutManagerFactory.getInstance().hideCover();
			},
			optionPosition++);

		this.menu.addOption(_currentTheme.getIconURL('workspace_preferences'),
			gettext("Preferences"),
			function() {
				LayoutManagerFactory.getInstance().showPreferencesWindow('workspace', this.preferences);
			}.bind(this),
			optionPosition++);

		this.unlockEntryPos = optionPosition;
		this.unlockEntryId = this.menu.addOption(_currentTheme.getIconURL('unlock'),
			gettext("Unlock"),
			function() {
				LayoutManagerFactory.getInstance().hideCover();
				this._lockFunc(false);
			}.bind(this),
			optionPosition++);

		this.lockEntryId = this.menu.addOption(_currentTheme.getIconURL('lock'),
			gettext("Lock"),
			function() {
				LayoutManagerFactory.getInstance().hideCover();
				this._lockFunc(true);
			}.bind(this),
			optionPosition++);
		var res = this._checkLock();
		optionPosition -= res;

		this.menu.addOption(_currentTheme.getIconURL('workspace_publish'),
			gettext("Share workspace"),
			function() {
				LayoutManagerFactory.getInstance().showWindowMenu('shareWorkSpace');
			}.bind(this),
			optionPosition++, null, "share_workspace");

		this.menu.addOption(_currentTheme.getIconURL('remove'),
			gettext("Remove"),
			function() {
				var msg = gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
				msg = interpolate(msg, {workspaceName: this.workSpaceState.name}, true);
				LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();})
			}.bind(this),
			optionPosition++);

		//TODO:Intermediate window to ask for data (name, description...)
		this.menu.addOption(_currentTheme.getIconURL('workspace_publish'),
			gettext("Publish workspace"),
			function() {
				LayoutManagerFactory.getInstance().showWindowMenu('publishWorkSpace');
			}.bind(this),
			optionPosition++, null, "publish_workspace");

		if (OpManagerFactory.getInstance().workSpaceInstances.keys().length > 1) { //there are several workspaces
			this.menu.addOption(_currentTheme.getIconURL('workspace_merge'),
				gettext("Merge with workspace..."),
				function(e) {
					LayoutManagerFactory.getInstance().showDropDownMenu('workSpaceOpsSubMenu', this.mergeMenu, Event.pointerX(e), Event.pointerY(e));
				}.bind(this),
				optionPosition++);
		}
	} else if (!this.valid) {
		this.menu.addOption(_currentTheme.getIconURL('remove'),
		gettext("Remove"),
		function() {
			var msg = gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
			msg = interpolate(msg, {workspaceName: this.workSpaceState.name}, true);
			LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){OpManagerFactory.getInstance().activeWorkSpace.deleteWorkSpace();})
		}.bind(this),
		optionPosition++);
	}


	this.menu.addOption(_currentTheme.getIconURL('add'),
		gettext("New workspace"),
		function() {
			LayoutManagerFactory.getInstance().showWindowMenu('createWorkSpace');
		},
		optionPosition++);

	var menuHTML = '<div id="floating_gadgets_list" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.FloatingGadgetsMenu = new DropDownMenu("floating_gadgets_list");
	Event.observe($("floating_gadgets_launcher"), "click",
					function(e) {
						this.FloatingGadgetsMenu.clearOptions();
						this.visibleTab.getDragboard().fillFloatingGadgetsMenu(this.FloatingGadgetsMenu)
						LayoutManagerFactory.getInstance().showDropDownMenu('floatingGadgets',this.FloatingGadgetsMenu, Event.pointerX(e), Event.pointerY(e));
					}.bind(this), true);
}

WorkSpace.prototype.preferencesChanged = function(modifiedValues) {
	for (preferenceName in modifiedValues) {
		var newLayout = false;

		switch (preferenceName) {
		case "theme":
			var newTheme = modifiedValues[preferenceName];
			LayoutManagerFactory.getInstance().changeCurrentTheme(newTheme);
			if (this.workSpaceGlobalInfo.workspace.active)
				PreferencesManagerFactory.getInstance().getPlatformPreferences().set('initial-theme', newTheme);
			break;
		default:
			continue;
		}
	}
}

/**
 * @private
 *
 * This method must be called when a new theme is loaded to refresh some icons
 */
WorkSpace.prototype._themeLoaded = function(modifiedValues) {
	this._createWorkspaceMenu();

	var tabs = this.tabInstances.keys();
	for (var i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		var igadget = this.tabInstances[tab]._themeLoaded();
	}
}
