/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global Workspace, alert, console, LayoutManagerFactory, setTimeout, Wirecloud */
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

        // *********************************
        // PRIVATE VARIABLES AND FUNCTIONS
        // *********************************

        // ****************
        // PUBLIC METHODS
        // ****************

        OpManager.prototype.showDragboard = function (iWidgetId) {
            var dragboard = Wirecloud.activeWorkspace.getIWidget(iWidgetId).dragboard;
            dragboard.paint(iWidgetId);
            this.visibleLayer = "dragboard";
        };

        OpManager.prototype.showWidgetsMenu = function () {
            this.alternatives.showAlternative(this.workspaceTabsAlternative);
            this.visibleLayer = "tabs_container";
            Wirecloud.activeWorkspace.show();
        };

        OpManager.prototype.showWorkspaceMenu = function () {
            //generate the workspace list
            var workspaceId, workspace, workspaceEntry;

            this.workspaceListElement.innerHTML = '';
            for (workspaceId in this.workspaceInstances) {
                workspace = this.workspaceInstances[workspaceId];
                workspaceEntry = document.createElement('li');
                workspaceEntry.textContent = workspace.name;
                if (workspace === Wirecloud.activeWorkspace) {
                    workspaceEntry.setAttribute('class', 'selected');
                    workspaceEntry.addEventListener('click', function () {
                        this.alternatives.showAlternative(Wirecloud.activeWorkspace.tabsContainerElement);
                    }.bind(this), false);
                } else {
                    workspaceEntry.addEventListener('click', Wirecloud.changeActiveWorkspace.bind(Wirecloud, workspace), false);
                }
                this.workspaceListElement.appendChild(workspaceEntry);
            }
            //html += "<li class='bold'><a href='javascript:CatalogueFactory.getInstance().loadCatalogue()' class='arrow'>Add Mobile Mashup</a></li>";

            this.alternatives.showAlternative(this.workspaceListAlternative);
            this.visibleLayer = "workspace_menu";
        };

        // Singleton modules
        this.visibleLayer = null;

        // Variables for controlling the collection of wiring and dragboard instances of a user
        this.workspaceInstances = {};
        this.workspacesByUserAndName = {};

        // workspace menu element
        this.workspaceMenuElement = document.getElementById('workspace_menu');
        this.workspaceListElement = document.getElementById('workspace_list');
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
