/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global Workspace, alert, Hash, $, console, LayoutManagerFactory, ShowcaseFactory, LogManagerFactory, Modules, setTimeout, Wirecloud */
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
            var response = transport.responseText,
                workspacesStructure = JSON.parse(response),
                workspaces = workspacesStructure.workspaces,
                workspace, workspace_instance, state, i;

            for (i = 0; i < workspaces.length; i += 1) {
                workspace = workspaces[i];

                workspace_instance = new Workspace(workspace);
                this.workspaceInstances.set(workspace.id, workspace_instance);
                if (!(workspace.creator in this.workspacesByUserAndName)) {
                    this.workspacesByUserAndName[workspace.creator] = {};
                }
                this.workspacesByUserAndName[workspace.creator][workspace.name] = workspace_instance;
            }

            HistoryManager.init();
            state = HistoryManager.getCurrentState();
            this.activeWorkspace = this.workspacesByUserAndName[state.workspace_creator][state.workspace_name];

            // Total information of the active workspace must be downloaded!
            this.activeWorkspace.downloadWorkspaceInfo();
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
        OpManager.prototype.logIWidgetError = function (iwidget, msg, type) {
            console.log(msg);
        };

        OpManager.prototype.sendBufferedVars = function () {
            this.activeWorkspace.sendBufferedVars();
        };

        OpManager.prototype.changeActiveWorkspace = function (workspace) {
            var state;

            if (this.activeWorkspace !== null && this.activeWorkspace !== undefined) {
                this.activeWorkspace.unload();
            }

            this.loadCompleted = false;
            this.activeWorkspace = workspace;
            state = {
                workspace_creator: workspace.workspaceState.creator,
                workspace_name: workspace.getName(),
                view: "workspace"
            };
            HistoryManager.pushState(state);
            this.activeWorkspace.downloadWorkspaceInfo();
            this.showWidgetsMenuFromWorskspaceMenu();
        };

        OpManager.prototype.sendEvent = function (widget, event, value) {
            this.activeWorkspace.getWiring().sendEvent(widget, event, value);
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

        OpManager.prototype.showActiveWorkspace = function () {
            var workspaceIds = this.workspaceInstances.keys(),
                disabledWorkspaces = [],
                j = 0, i, workspace;
            for (i = 0; i < workspaceIds.length; i += 1) {
                workspace = this.workspaceInstances.get(workspaceIds[i]);
                if (workspace !== this.activeWorkspace) {
                    disabledWorkspaces[j] = workspace;
                    j += 1;
                }
            }
            this.activeWorkspace.init();
        };

        OpManager.prototype.continueLoadingGlobalModules = function (module) {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!
            if (module === Modules.prototype.SHOWCASE) {
                // All singleton modules has been loaded!
                // It's time for loading tabspace information!
                this.loadActiveWorkspace();
                return;
            }
            if (module === Modules.prototype.ACTIVE_WORKSPACE) {
                this.loadCompleted = true;
                if (!this.visibleLayer) {
                    this.showActiveWorkspace(this.activeWorkspace);
                    this.visibleLayer = "tabs_container";
                }
                return;
            }
        };

        OpManager.prototype.loadActiveWorkspace = function () {
            // Asynchronous load of modules
            // Each singleton module notifies OpManager it has finished loading!

            Wirecloud.io.makeRequest(Wirecloud.URLs.WORKSPACE_COLLECTION, {
                method: 'GET',
                onSuccess: loadEnvironment.bind(this),
                onFailure: onError,
                onException: onError
            });
        };

        //Operations on workspaces

        OpManager.prototype.workspaceExists = function (newName) {
            var workspaceValues = this.workspaceInstances.values(),
                i;
            for (i = 0; i < workspaceValues.length; i += 1) {
                if (workspaceValues[i].workspaceState.name === newName) {
                    return true;
                }
            }
            return false;
        };


        OpManager.prototype.showDragboard = function (iWidgetId) {
            var dragboard = this.activeWorkspace.getIWidget(iWidgetId).dragboard;
            dragboard.paint(iWidgetId);
            this.visibleLayer = "dragboard";
        };

        OpManager.prototype.showWidgetsMenu = function () {
            this.alternatives.showAlternative(this.workspaceTabsAlternative);
            this.visibleLayer = "tabs_container";
            this.activeWorkspace.show();
        };

        OpManager.prototype.showWidgetsMenuFromWorskspaceMenu = function () {
            if (!this.loadCompleted) {
                setTimeout(function () {
                    OpManagerFactory.getInstance().showWidgetsMenuFromWorskspaceMenu();
                }, 100);
                return;
            }
            this.showActiveWorkspace(this.activeWorkspace);
            this.visibleLayer = "tabs_container";
        };

        OpManager.prototype.showRelatedIwidget = function (iWidgetId, tabId) {
            this.activeWorkspace.showRelatedIwidget(iWidgetId, tabId);
        };

        OpManager.prototype.markRelatedIwidget = function (iWidgetId) {
            this.activeWorkspace.getActiveDragboard().markRelatedIwidget(iWidgetId);
        };

        OpManager.prototype.showWorkspaceMenu = function () {
            //generate the workspace list
            var wkeys = this.workspaceInstances.keys(),
                i, wname, workspace, workspaceEntry;

            this.workspaceListElement.innerHTML = '';
            for (i = 0; i < wkeys.length; i += 1) {
                workspace = this.workspaceInstances.get(wkeys[i]);
                wname = workspace.getName();
                workspaceEntry = document.createElement('li');
                workspaceEntry.textContent = wname;
                if (workspace === this.activeWorkspace) {
                    workspaceEntry.setAttribute('class', 'selected');
                    workspaceEntry.addEventListener('click', this.showWidgetsMenuFromWorskspaceMenu.bind(this), false);
                } else {
                    workspaceEntry.addEventListener('click', this.changeActiveWorkspace.bind(this, workspace), false);
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
        this.workspaceInstances = new Hash();
        this.workspacesByUserAndName = {};
        this.activeWorkspace = null;

        // workspace menu element
        this.workspaceMenuElement = $('workspace_menu');
        this.workspaceListElement = $('workspace_list');
        this.alternatives = new StyledElements.StyledAlternatives();
        this.workspaceListAlternative = this.alternatives.createAlternative();
        this.workspaceListAlternative.appendChild(this.workspaceMenuElement);

        this.workspaceTabsAlternative = this.alternatives.createAlternative({'class': 'tabs_container'});

        this.iwidgetViewAlternative = this.alternatives.createAlternative();
        this.globalDragboard = new MobileDragboard();
        this.iwidgetViewAlternative.appendChild(this.globalDragboard);
        this.alternatives.addEventListener('preTransition', function (alternatives, out_alternative, in_alternative) {
            alternatives.repaint();
            in_alternative.repaint();
        });
        this.iwidgetViewAlternative.addEventListener('hide', this.sendBufferedVars.bind(this));

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
