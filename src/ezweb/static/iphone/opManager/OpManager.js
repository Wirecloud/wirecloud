/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global WorkSpace, alert, Hash, $, console, LayoutManagerFactory, ShowcaseFactory, LogManagerFactory, Modules, URIs, setTimeout, Wirecloud */
"use strict";

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


var OpManagerFactory = (function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null,
        Singleton;

    function OpManager() {

        var loadEnvironment,
            onError;

        // ****************
        // CALLBACK METHODS
        // ****************

        loadEnvironment = function (transport) {
            // JSON-coded user tabspaces
            var response = transport.responseText,
                workSpacesStructure = JSON.parse(response),
                workSpaces = workSpacesStructure.workspaces,
                workSpace, i;

            for (i = 0; i < workSpaces.length; i += 1) {
                workSpace = workSpaces[i];

                this.workSpaceInstances.set(workSpace.id, new WorkSpace(workSpace));
            }

            HistoryManager.init();
            this.activeWorkSpace = this.workSpaceInstances.get(parseInt(HistoryManager.getCurrentState().workspace, 10));

            // Total information of the active workspace must be downloaded!
            this.activeWorkSpace.downloadWorkSpaceInfo();
        };

        onError = function (transport, e) {
            alert("error en loadEnvironment");
        };


        // *********************************
        // PRIVATE VARIABLES AND FUNCTIONS
        // *********************************

        // ****************
        // PUBLIC METHODS
        // ****************
        OpManager.prototype.logIGadgetError = function (igadget, msg, type) {
            console.log(msg);
        };

        OpManager.prototype.sendBufferedVars = function () {
            this.activeWorkSpace.sendBufferedVars();
        };

        OpManager.prototype.changeActiveWorkSpace = function (workspace) {
            var state;

            if (this.activeWorkSpace !== null && this.activeWorkSpace !== undefined) {
                this.activeWorkSpace.unload();
            }

            this.loadCompleted = false;
            this.activeWorkSpace = workspace;
            state = {
                workspace: workspace.getId(),
                view: "dragboard"
            };
            HistoryManager.pushState(state);
            this.activeWorkSpace.downloadWorkSpaceInfo();
            this.showGadgetsMenuFromWorskspaceMenu();
        };

        OpManager.prototype.sendEvent = function (gadget, event, value) {
            this.activeWorkSpace.getWiring().sendEvent(gadget, event, value);
        };

        OpManager.prototype.loadEnviroment = function () {
            LayoutManagerFactory.getInstance().resizeWrapper();
            // First, global modules must be loades (Showcase, Catalogue)
            // Showcase is the first!
            // When it finish, it will invoke continueLoadingGlobalModules method!
            this.showcaseModule = ShowcaseFactory.getInstance();
            this.showcaseModule.init();
            this.logs = LogManagerFactory.getInstance();
        };

        OpManager.prototype.igadgetLoaded = function (igadgetId) {
            this.activeWorkSpace.igadgetLoaded(igadgetId);
        };

        OpManager.prototype.igadgetUnloaded = function (igadgetId) {
            this.activeWorkSpace.igadgetUnloaded(igadgetId);
        };

        OpManager.prototype.showActiveWorkSpace = function () {
            var workSpaceIds = this.workSpaceInstances.keys(),
                disabledWorkSpaces = [],
                j = 0, i, workSpace;
            for (i = 0; i < workSpaceIds.length; i += 1) {
                workSpace = this.workSpaceInstances.get(workSpaceIds[i]);
                if (workSpace !== this.activeWorkSpace) {
                    disabledWorkSpaces[j] = workSpace;
                    j += 1;
                }
            }
            this.activeWorkSpace.init();
        };

        OpManager.prototype.continueLoadingGlobalModules = function (module) {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!
            if (module === Modules.prototype.SHOWCASE) {
                // All singleton modules has been loaded!
                // It's time for loading tabspace information!
                this.loadActiveWorkSpace();
                return;
            }
            if (module === Modules.prototype.ACTIVE_WORKSPACE) {
                this.loadCompleted = true;
                if (!this.visibleLayer) {
                    this.showActiveWorkSpace(this.activeWorkSpace);
                    this.visibleLayer = "tabs_container";
                }
                return;
            }
        };

        OpManager.prototype.loadActiveWorkSpace = function () {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!

            Wirecloud.io.makeRequest(URIs.GET_POST_WORKSPACES, {
                method: 'GET',
                onSuccess: loadEnvironment.bind(this),
                onFailure: onError,
                onException: onError
            });
        };

        //Operations on workspaces

        OpManager.prototype.workSpaceExists = function (newName) {
            var workSpaceValues = this.workSpaceInstances.values(),
                i;
            for (i = 0; i < workSpaceValues.length; i += 1) {
                if (workSpaceValues[i].workSpaceState.name === newName) {
                    return true;
                }
            }
            return false;
        };


        OpManager.prototype.showDragboard = function (iGadgetId) {
            var dragboard = this.activeWorkSpace.getIgadget(iGadgetId).dragboard;
            dragboard.paint(iGadgetId);
            this.visibleLayer = "dragboard";
        };

        OpManager.prototype.showGadgetsMenu = function () {
            this.alternatives.showAlternative(this.workspaceTabsAlternative);
            this.visibleLayer = "tabs_container";
            this.activeWorkSpace.show();
        };

        OpManager.prototype.showGadgetsMenuFromWorskspaceMenu = function () {
            if (!this.loadCompleted) {
                setTimeout(function () {
                    OpManagerFactory.getInstance().showGadgetsMenuFromWorskspaceMenu();
                }, 100);
                return;
            }
            this.showActiveWorkSpace(this.activeWorkSpace);
            this.visibleLayer = "tabs_container";
        };

        OpManager.prototype.showRelatedIgadget = function (iGadgetId, tabId) {
            this.activeWorkSpace.showRelatedIgadget(iGadgetId, tabId);
        };

        OpManager.prototype.markRelatedIgadget = function (iGadgetId) {
            this.activeWorkSpace.getActiveDragboard().markRelatedIgadget(iGadgetId);
        };

        OpManager.prototype.showWorkspaceMenu = function () {
            //generate the workspace list
            var wkeys = this.workSpaceInstances.keys(),
                i, wname, workspace, workspaceEntry;

            this.workspaceListElement.innerHTML = '';
            for (i = 0; i < wkeys.length; i += 1) {
                workspace = this.workSpaceInstances.get(wkeys[i]);
                wname = workspace.getName();
                workspaceEntry = document.createElement('li');
                workspaceEntry.textContent = wname;
                if (workspace === this.activeWorkSpace) {
                    workspaceEntry.setAttribute('class', 'selected');
                    workspaceEntry.addEventListener('click', this.showGadgetsMenuFromWorskspaceMenu.bind(this), false);
                } else {
                    workspaceEntry.addEventListener('click', this.changeActiveWorkSpace.bind(this, workspace), false);
                }
                this.workspaceListElement.appendChild(workspaceEntry);
            }
            //html += "<li class='bold'><a href='javascript:CatalogueFactory.getInstance().loadCatalogue()' class='arrow'>Add Mobile Mashup</a></li>";

            this.alternatives.showAlternative(this.workspaceListAlternative);
            this.visibleLayer = "workspace_menu";
        };

        // Singleton modules
        //this.contextManagerModule = null;
        this.loadCompleted = false;
        this.visibleLayer = null;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workSpaceInstances = new Hash();
        this.activeWorkSpace = null;

        // workspace menu element
        this.workspaceMenuElement = $('workspace_menu');
        this.workspaceListElement = $('workspace_list');
        this.alternatives = new StyledElements.StyledAlternatives();
        this.workspaceListAlternative = this.alternatives.createAlternative();
        this.workspaceListAlternative.appendChild(this.workspaceMenuElement);

        this.workspaceTabsAlternative = this.alternatives.createAlternative({'class': 'tabs_container'});

        this.igadgetViewAlternative = this.alternatives.createAlternative();
        this.globalDragboard = new MobileDragboard();
        this.igadgetViewAlternative.appendChild(this.globalDragboard);
        this.igadgetViewAlternative.addEventListener('hide', this.sendBufferedVars.bind(this));

        this.alternatives.insertInto(document.body);
    }

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    Singleton = function () {
        this.getInstance = function () {
            if (instance === null || instance === undefined) {
                instance = new OpManager();
            }
            return instance;
        };
    };

    return new Singleton();

}());
