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
            var workSpacesStructure = JSON.parse(response);

            var reloadShowcase = workSpacesStructure.reloadShowcase;
            var workSpaces = workSpacesStructure.workspaces;
            var activeWorkSpace = null;

            for (var i = 0; i < workSpaces.length; i++) {
                var workSpace = workSpaces[i];

                this.workSpaceInstances.set(workSpace.id, new WorkSpace(workSpace));

                if (public_workspace && public_workspace != '') {
                    if (workSpace.id == public_workspace) {
                        activeWorkSpace = this.workSpaceInstances.get(workSpace.id);
                        continue;
                    }
                } else {
                    if (workSpace.active) {
                        activeWorkSpace = this.workSpaceInstances.get(workSpace.id);
                    }
                }
            }

            //Create the workspace list menu
            this.wsListMenu = new SideBarMenu(this.sideBarElement.id);
            //event
            Event.observe(this.goToLauncher, 'click',
                        function(e){
                            LayoutManagerFactory.getInstance().toggleSideBarMenu();
                        }.bind(this));
            //close option
            Event.observe($('close_sidebar'), "click",
                        function(){
                            this.wsListMenu.hide();
                        }.bind(this));
            //new workspace option
            if (!EzSteroidsAPI.is_activated() ||
                (EzSteroidsAPI.evaluePolicy('add_remove_workspaces') && EzSteroidsAPI.evaluePolicy('create_custom_workspaces'))) {
                // Wirecloud IE6 version does not allow creating new Workspaces
                Event.observe($('add_workspace'), "click",
                        function(){
                            LayoutManagerFactory.getInstance().showWindowMenu('createWorkSpace');
                        });
            }


            // When a profile is set to a user, profile options prevail over user options!
            var active_ws_from_script = ScriptManagerFactory.getInstance().get_ws_id();
            if (active_ws_from_script && this.workSpaceInstances.get(active_ws_from_script)) {
                activeWorkSpace = this.workSpaceInstances.get(active_ws_from_script);
            }
            HistoryManager.init(activeWorkSpace.getId());

            // Total information of the active workspace must be downloaded!
            if (reloadShowcase) {
                //the showcase must be reloaded to have all new gadgets
                //it itself changes to the active workspace
                ShowcaseFactory.getInstance().reload(workSpace.id);
            } else {
                this.activeWorkSpace = activeWorkSpace;

                if (this.activeWorkSpace == null && workSpaces.length > 0)
                    this.activeWorkSpace = this.workSpaceInstances.get(workSpaces[0].id);

                this.activeWorkSpace.downloadWorkSpaceInfo(HistoryManager.getCurrentState().tab);
            }
        }

        var onError = function (transport, e) {
            var msg;
            try {
                var logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error loading Wirecloud Platform: %(errorMsg)s."), transport, e);
                LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                logManager.log(msg);
            } catch (e) {
                if (msg != null)
                    alert(msg);
                else
                    alert (gettext("Error loading Wirecloud Platform"));
            }
        }

        /*****WORKSPACE CALLBACK***/
        var createWSSuccess = function(transport) {
            var response = transport.responseText;
            var wsInfo = JSON.parse(response);

            //create the new workspace and go to it
            this.workSpaceInstances.set(wsInfo.workspace.id, new WorkSpace(wsInfo.workspace));

            LayoutManagerFactory.getInstance().hideCover();
            ShowcaseFactory.getInstance().reload(wsInfo.workspace.id);
        }

        var createWSError = function(transport, e) {
            var logManager = LogManagerFactory.getInstance();
            var msg = logManager.formatError(gettext("Error creating a workspace: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        }


        // *********************************
        // PRIVATE VARIABLES AND FUNCTIONS
        // *********************************

        // Singleton modules
        this.showcaseModule = null;
        this.contextManagerModule = null;
        this.catalogue = null;
        this.logs = null;
        this.platformPreferences = null;
        this.persistenceEngine = PersistenceEngineFactory.getInstance();

        this.loadCompleted = false;
        this.catalogueIsCurrentTab = false;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workSpaceInstances = new Hash();

        this.activeWorkSpace = null;

        //Workspace List Menu
        this.wsListMenu = null;
        this.sideBarElement = $('workspace_sidebar');
        this.goToLauncher = $('go_to_link');

        /**
         * @private
         *
         * This method updates the active workspace menu with the available workspaces.
         */
        OpManager.prototype._refreshWorkspaceMenu = function() {
            var workspace_keys, i, workspace, disabledWorkSpaces = [];
            workspace_keys = this.workSpaceInstances.keys();
            for (i = 0; i < workspace_keys.length; i += 1) {
                workspace = this.workSpaceInstances.get(workspace_keys[i]);
                if (workspace !== this.activeWorkSpace) {
                    disabledWorkSpaces.push(workspace);
                }
            }

            LayoutManagerFactory.getInstance().refreshChangeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
            LayoutManagerFactory.getInstance().refreshMergeWorkSpaceMenu(this.activeWorkSpace, disabledWorkSpaces);
        };

        /**
         * @private
         *
         * This method is called after changing current theme.
         */


        // ****************
        // PUBLIC METHODS
        // ****************

        OpManager.prototype.showCatalogue = function () {
            if (!this.activeWorkSpace.isValid()) {
                //Nothing to do!
                return;
            }

            CatalogueFactory.getInstance().render();
        }

        OpManager.prototype.showLogs = function (logManager) {
            logManager = arguments.length > 0 ? logManager : LogManagerFactory.getInstance();

            if (this.activeWorkSpace && this.activeWorkSpace.getVisibleTab()) {
                this.activeWorkSpace.getVisibleTab().unmark();
                        }

            LogManagerFactory.getInstance().show(logManager);
        }

        OpManager.prototype.mergeMashupResource = function(resource) {
            var mergeOk = function(transport){
                var response = transport.responseText;
                response = JSON.parse(response);

                //create the new workspace and go to it
                opManager = OpManagerFactory.getInstance();

                ShowcaseFactory.getInstance().reload(response['workspace_id']);
                LayoutManagerFactory.getInstance().logStep('');

            }
            var mergeError = function(transport, e) {
                var logManager, layoutManager, msg;

                logManager = LogManagerFactory.getInstance();
                msg = logManager.formatError(gettext("Error merging workspace: %(errorMsg)s."), transport, e);
                logManager.log(msg);

                layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Merging with current workspace"));

            var active_ws_id = OpManagerFactory.getInstance().getActiveWorkspaceId();
            var mergeURL = URIs.MERGE_WORKSPACE.evaluate({'to_ws': active_ws_id});

            PersistenceEngineFactory.getInstance().send(mergeURL, {
                method: 'POST',
                contentType: 'application/json',
                postBody: Object.toJSON({
                    'workspace': resource.getUriTemplate()
                }),
                onSuccess: mergeOk.bind(this),
                onFailure: mergeError.bind(this),
                onException: mergeError.bind(this)
            });
        };

        OpManager.prototype.addMashupResource = function(resource) {
            var cloneOk = function(transport) {
                var response = transport.responseText;
                var wsInfo = JSON.parse(response);
                //create the new workspace and go to it
                opManager = OpManagerFactory.getInstance();
                opManager.workSpaceInstances.set(wsInfo.workspace.id, new WorkSpace(wsInfo.workspace));

                ShowcaseFactory.getInstance().reload(wsInfo.workspace.id);

                LayoutManagerFactory.getInstance().logStep('');
            };

            var cloneError = function(transport, e) {
                var logManager, layoutManager, msg;

                logManager = LogManagerFactory.getInstance();
                                layoutManager = LayoutManagerFactory.getInstance();

                msg = logManager.formatError(gettext("Error adding the workspace: %(errorMsg)s."), transport, e);
                logManager.log(msg);
                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();

                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            };

            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Adding the mashup"), 1);
            LayoutManagerFactory.getInstance().logSubTask(gettext("Creating a new workspace"));

            PersistenceEngineFactory.getInstance().send(URIs.ADD_WORKSPACE, {
                method: 'POST',
                contentType: 'application/json',
                postBody: Object.toJSON({
                    'workspace': resource.getUriTemplate(),
                }),
                onSuccess: cloneOk.bind(this),
                onFailure: cloneError.bind(this),
                onException: cloneError.bind(this)
            });
        };

        OpManager.prototype.showPlatformPreferences = function () {
            PreferencesManagerFactory.getInstance().show();
        }

        OpManager.prototype.changeActiveWorkSpace = function (workspace, initial_tab) {
            var state, steps = this.activeWorkSpace != null ? 2 : 1;

            state = {
                workspace: workspace.getId(),
                view: "dragboard"
            };
            if (initial_tab) {
                state.tab = initial_tab;
            }
            HistoryManager.pushState(state);
            LayoutManagerFactory.getInstance()._startComplexTask(gettext("Changing current workspace"), steps);

            if (this.activeWorkSpace != null) {
                this.activeWorkSpace.unload();
            }

            this.activeWorkSpace = workspace;
            this.activeWorkSpace.downloadWorkSpaceInfo(initial_tab);
        }


        /**
         * Method called when the user clicks the logout link. As this action
         * changes the document URL, an unload event will be launched (so
         * unloadEnvironment will be called).
         */
        OpManager.prototype.logout = function () {
            window.location = "/logout";
        }

        OpManager.prototype.addInstance = function (gadgetId, options) {
            if (!this.loadCompleted)
                return;

            var gadget = this.showcaseModule.getGadget(gadgetId);
            this.activeWorkSpace.getVisibleTab().getDragboard().addInstance(gadget, options);
        }

        OpManager.prototype.removeInstance = function (iGadgetId, orderFromServer) {
            if (!this.loadCompleted)
                return;

            this.activeWorkSpace.removeIGadget(iGadgetId, orderFromServer);
        }

        OpManager.prototype.getActiveWorkspaceId = function () {
            return this.activeWorkSpace.getId();
        }

        OpManager.prototype.sendEvent = function (gadget, event, value) {
            this.activeWorkSpace.getWiring().sendEvent(gadget, event, value);
        }

        /**
         * Loads the Wirecloud Platform.
         */
        OpManager.prototype.loadEnviroment = function () {
            // Init Layout Manager
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.resizeWrapper();
            layoutManager._startComplexTask(gettext('Loading Wirecloud Platform'), 3);
            layoutManager.logSubTask(gettext('Retrieving Wirecloud code'));
            layoutManager.logStep('');

            // Init log manager
            this.logs = LogManagerFactory.getInstance();

            Event.observe(window,
                          "beforeunload",
                          this.unloadEnvironment.bind(this),
                          true);

            // Wirecloud fly
            if (BrowserUtilsFactory.getInstance().isIE()) {
                this.flyStyleSheet = document.createStyleSheet();
            } else {
                s = document.createElement('style');
                s.type = "text/css";
                var h = document.getElementsByTagName("head")[0];
                h.appendChild(s);
                this.flyStyleSheet = document.styleSheets[document.styleSheets.length - 1];
            }

            // Load initial theme
            OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.THEME_MANAGER);
        }

        /**
         * Refresh Wirecloud fly using current theme.
         */
        OpManager.prototype.refreshEzWebFly = function() {
            /*var rules = 'background-image: url('+_currentTheme.getIconURL('init-dat')+');' +
                        'background-repeat: no-repeat;' +
                        'background-attachment:scroll;' +
                        'background-position: center bottom;';

            if (BrowserUtilsFactory.getInstance().isIE()) {
                while (this.flyStyleSheet.rules.length > 0)
                    this.flyStyleSheet.removeRule(0);

                this.flyStyleSheet.addRule('#wrapper', rules);
            } else {
                while (this.flyStyleSheet.cssRules.length > 0)
                    this.flyStyleSheet.deleteRule(0);

                this.flyStyleSheet.insertRule('#wrapper {' + rules + '}',
                                              this.flyStyleSheet.cssRules.length);
            }*/
        }


        /**
         * Unloads the Wirecloud Platform. This method is called, by default, when
         * the unload event is captured.
         */
        OpManager.prototype.unloadEnvironment = function() {
            var layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.hideCover();
            layoutManager._startComplexTask(gettext('Unloading Wirecloud Platform'));

            if (this.activeWorkSpace) {
                this.activeWorkSpace.unload();
                        }

            this.wsListMenu.remove();

            //TODO: unloadCatalogue
        }

        OpManager.prototype.igadgetLoaded = function (igadgetId) {
            this.activeWorkSpace.igadgetLoaded(igadgetId);
        }

        OpManager.prototype.igadgetUnloaded = function (igadgetId) {
            this.activeWorkSpace.igadgetUnloaded(igadgetId);
        }

        OpManager.prototype.checkForGadgetUpdates = function () {
            this.activeWorkSpace.checkForGadgetUpdates();
        }

        OpManager.prototype.showActiveWorkSpace = function (refreshMenu) {
            LayoutManagerFactory.getInstance().showDragboard(this.activeWorkSpace.getActiveDragboard());

            if (refreshMenu != false){ //refreshMenu == true or null
                this._refreshWorkspaceMenu();
            }
        }

        OpManager.prototype.preferencesChanged = function (modifiedValues) {
            if ('language' in modifiedValues) {
                window.location.reload();
            }
        };

        OpManager.prototype.continueLoadingGlobalModules = function (module) {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!
            var preferencesManager;

            switch (module) {
            case Modules.prototype.THEME_MANAGER:
                this.refreshEzWebFly();
                this.platformPreferences = PreferencesManagerFactory.getInstance();
                break;

            case Modules.prototype.PLATFORM_PREFERENCES:
                preferencesManager = PreferencesManagerFactory.getInstance();
                preferencesManager.getPlatformPreferences().addCommitHandler(this.preferencesChanged.bind(this), 'post-commit');
                this.showcaseModule = ShowcaseFactory.getInstance();
                this.showcaseModule.init();
                break;

            case Modules.prototype.SHOWCASE:
                this.catalogue = CatalogueFactory.getInstance();
                break;

            case Modules.prototype.CATALOGUE:
                // All singleton modules has been loaded!
                // It's time for loading tabspace information!
                this.loadActiveWorkSpace();
                break;

            case Modules.prototype.ACTIVE_WORKSPACE:
                var layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.logSubTask(gettext("Activating current Workspace"));

                this.showActiveWorkSpace();

                layoutManager.logStep('');
                layoutManager._notifyPlatformReady();
                this.loadCompleted = true;

                //Additional information that a workspace must do after loading!
                this.activeWorkSpace.run_script();
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
                var msg2 = gettext("Some pice of code tried to notify an error in the iGadget %(iGadgetId)s when it did not exist or it was not loaded yet. This is an error in Wirecloud Platform, please notify it.\nError Message: %(errorMsg)s");
                msg2 = interpolate(msg2, {iGadgetId: iGadgetId, errorMsg: msg}, true);
                this.logs.log(msg2);
                return;
            }

            iGadget.log(msg, level);
        }

        OpManager.prototype.drawAttention = function(iGadgetId) {
            this.activeWorkSpace.drawAttention(iGadgetId);
        };

        //Operations on workspaces

        OpManager.prototype.workSpaceExists = function (newName) {
            var workspace_keys, workspace, i;
            workspace_keys = this.workSpaceInstances.keys();
            for (i = 0; i < workspace_keys.length; i += 1) {
                workspace = this.workSpaceInstances.get(workspace_keys[i]);
                if (workspace.workSpaceState.name === newName) {
                    return true;
                }
            }
            return false;
        }

        OpManager.prototype.addWorkSpace = function (newName) {
            var o = new Object();
            o.name = newName;
            var params = {'workspace': Object.toJSON(o)};
            PersistenceEngineFactory.getInstance().send_post(URIs.GET_POST_WORKSPACES, params, this, createWSSuccess, createWSError);

        }

        OpManager.prototype.unloadWorkSpace = function(workSpaceId) {
            //Unloading the Workspace
            this.workSpaceInstances.get(workSpaceId).unload();
        }

        OpManager.prototype.removeWorkSpace = function(workSpaceId) {
            if (this.workSpaceInstances.keys().length <= 1) {
                var msg = gettext("there must be one workspace at least");
                msg = interpolate(gettext("Error removing workspace: %(errorMsg)s."), {errorMsg: msg}, true);

                LogManagerFactory.getInstance().log(msg);
                var layoutManager = LayoutManagerFactory.getInstance();
                layoutManager.hideCover();
                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                return false;
            }

            // Removing reference
            this.workSpaceInstances.unset(workSpaceId);

            //set the first workspace as current (and unload the former)
            this.changeActiveWorkSpace(this.workSpaceInstances.values()[0]);

            return true;
        }


        OpManager.prototype.getWorkspaceCount = function(){
            return this.workSpaceInstances.keys().length;
        }

        OpManager.prototype.getWsListMenu = function(){
            return this.wsListMenu;
        }

        OpManager.prototype.getSideBarElement = function(){
            return this.sideBarElement;
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

