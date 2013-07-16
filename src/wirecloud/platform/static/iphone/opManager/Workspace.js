/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global interpolate, VarManager, Wiring, OpManagerFactory, Modules, gettext, alert, last_logged_user, document, window, Concept, StyledElements, Tab, $, Wirecloud */
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


function Workspace(workspaceState) {

    var loadWorkspace,
        onError;

    // ****************
    // CALLBACK METHODS
    // ****************

    // Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
    loadWorkspace = function (transport) {
        // JSON-coded iWidget-variable mapping
        var response = transport.responseText;
        this.workspaceGlobalInfo = JSON.parse(response);

        this.loaded = true;

        OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.ACTIVE_WORKSPACE);
    };

    onError = function (transport, e) {
        var msg;
        if (e) {
            msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"), {
                errorFile: e.fileName,
                errorLine: e.lineNumber,
                errorDesc: e
            }, true);
        } else {
            msg = transport.status + " " + transport.statusText;
        }
        alert(msg);
    };

    Workspace.prototype._buildInterface = function () {
        var loginButton;

        this.tabsContainerElement = OpManagerFactory.getInstance().workspaceTabsAlternative;
        // TODO layout reusage
        this.tabsContainerElement.clear();
        this.layout = new StyledElements.BorderLayout();

        /************************************************
         *  Toolbar *
         ************************************************/

        loginButton = document.createElement('a');
        loginButton.setAttribute('class', 'logout');
        loginButton.setAttribute('href', Wirecloud.URLs.LOGOUT_VIEW)
        loginButton.textContent = gettext('Sign out');

        this.toolbar = new StyledElements.NavigationHeader({
            backButton: gettext('Menu'),
            title: '',
            extraButton: loginButton
        });
        this.toolbar.addEventListener('back', function () {
            OpManagerFactory.getInstance().showWorkspaceMenu();
        });
        this.layout.getNorthContainer().appendChild(this.toolbar);

        new MobileScrollManager(this.layout.getCenterContainer().wrapperElement, {
            'capture': true,
            'propagate': false,
            'onend': checkTab
        });

        /************************************************
         *  Navbar *
         ************************************************/
        this.layout.getSouthContainer().addClassName('navbar');

        this.tabsContainerElement.appendChild(this.layout);
        this.layout.repaint();
    };

    Workspace.prototype._scroll = function (index) {
        this.layout.getCenterContainer().wrapperElement.scrollLeft = index * window.innerWidth;
    };

    // ****************
    // PUBLIC METHODS
    // ****************

    Workspace.prototype.unload = function () {
        // After that, tab info is managed
        for (var i = 0; i < this.tabInstances.length; i += 1) {
            this.unloadTab(i);
        }
        if (this.alternatives !== null) {
            this.alternatives.destroy();
            this.alternatives = null;
        }
        this.tabInstances = [];
        this.wiring.destroy();
        OpManagerFactory.getInstance().globalDragboard.clear();
        this.tabsContainerElement = null;
        this.layout.destroy();
    };

    Workspace.prototype.unloadTab = function (tabId) {
        var tab = this.tabInstances[tabId];

        tab.destroy();

        this.visibleTab = null;
    };

    Workspace.prototype.removeIWidgetData = function (iWidgetId) {
        this.varManager.removeInstance(iWidgetId);
        this.wiring.removeInstance(iWidgetId);
    };

    Workspace.prototype.sendBufferedVars = function () {
        this.varManager.sendBufferedVars();
    };

    Workspace.prototype.getName = function () {
        return this.workspaceState.name;
    };

    Workspace.prototype.getId = function () {
        return this.workspaceState.id;
    };

    Workspace.prototype.getVarManager = function () {
        return this.varManager;
    };

    Workspace.prototype.getActiveDragboard = function () {
        return this.visibleTab.getDragboard();
    };

    Workspace.prototype.downloadWorkspaceInfo = function () {
        var workspaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': this.workspaceState.id});
        Wirecloud.io.makeRequest(workspaceUrl, {
            method: 'GET',
            onSuccess: loadWorkspace.bind(this),
            onFailure: onError.bind(this),
            onException: onError.bind(this)
        });
    };

    Workspace.prototype.getIWidget = function (iwidgetId) {
        var i, iwidget;
        for (i = 0; i < this.tabInstances.length; i += 1) {
            iwidget = this.tabInstances[i].getDragboard().getIWidget(iwidgetId);

            if (iwidget) {
                return iwidget;
            }
        }
    };

    Workspace.prototype.getIWidgets = function () {
        if (!this.loaded) {
            return;
        }

        var iWidgets = [],
            i;
        for (i = 0; i < this.tabInstances.length; i += 1) {
            iWidgets = iWidgets.concat(this.tabInstances[i].getDragboard().getIWidgets());
        }

        return iWidgets;
    };

    /**** Display the IWidgets menu ***/
    Workspace.prototype.init = function () {
        //Create a menu for each tab of the workspace and paint it as main screen.
        var scrolling = 0,
            step = window.innerWidth,
            i, tabs, tab, iwidgets;

        tabs = this.workspaceGlobalInfo.tabs;

        if (tabs.length > 0) {
            for (i = 0; i < tabs.length; i += 1) {
                tab = tabs[i];
                this.tabInstances.push(new Tab(tab, this, i));

                if (tab.visible) {
                    this.visibleTabIndex = i;
                }
            }
        }
        //set the visible tab. It will be displayed as current tab afterwards
        this.visibleTab = this.tabInstances[this.visibleTabIndex];

        this.varManager = new VarManager(this);

        this.contextManager = new Wirecloud.ContextManager(this, this.workspaceGlobalInfo.context);
        this.wiring = new Wirecloud.Wiring(this);
        iwidgets = this.getIWidgets();
        for (i = 0; i < iwidgets.length; i += 1) {
            this.events.iwidgetadded.dispatch(this, iwidgets[i].internal_iwidget);
        }
        this.wiring.load(this.workspaceGlobalInfo.wiring);
        this._buildInterface();

        for (i = 0; i < this.tabInstances.length; i += 1) {
            this.tabInstances[i].paint(this.layout.getCenterContainer(), scrolling, i);
            scrolling += step;
        }

        //show the menu
        var opManager = OpManagerFactory.getInstance();
        opManager.alternatives.showAlternative(this.tabsContainerElement);

        this.updateVisibleTab(this.visibleTabIndex);
    };

    Workspace.prototype.show = function () {
        var step = window.innerWidth;
        window.scrollTo(this.visibleTabIndex * step, 1);
    };

    Workspace.prototype.getTab = function (tabId) {
        var i;

        for (i = 0; i < this.tabInstances.length; i += 1) {
            if (this.tabInstances[i].getId() === tabId) {
                return this.tabInstances[i];
            }
        }
        return null;
    };

    Workspace.prototype.setTab = function (tab) {
        if (!this.loaded) {
            return;
        }
        this.visibleTab = tab;
        this.visibleTab.show();
    };

    Workspace.prototype.getVisibleTab = function () {
        if (!this.loaded) {
            return;
        }

        return this.visibleTab;
    };

    Workspace.prototype.getNumberOfTabs = function () {
        return this.tabInstances.length;
    };

    Workspace.prototype.updateVisibleTab = function (index) {
        var i, mark, tabsLength = this.getNumberOfTabs();

        if (this.visibleTabIndex !== index) {
            this.visibleTabIndex = index;
            this.visibleTab = this.tabInstances[this.visibleTabIndex];
        }
        this.toolbar.setTitle(this.visibleTab.tabInfo.name);

        this.layout.getSouthContainer().clear();
        for (i = 0; i < tabsLength; i += 1) {
            mark = document.createElement('div');
            if (i === index) {
                mark.className = "current";
            }
            this.layout.getSouthContainer().appendChild(mark);
        }

        this._scroll(index);
    };

    Workspace.prototype.updateLayout = function (orientation) {
        var step = window.innerWidth,
            scrolling = 0,
            iWidgets, contextManager, i;

        // Notify this to the ContextManager. The orientation value may be "portrait" or "landscape".
        OpManagerFactory.getInstance().contextManager.modify({
            'orientation': orientation
        });

        for (i = 0; i < this.tabInstances.length; i += 1) {
            this.tabInstances[i].updateLayout(scrolling);
            scrolling += step;
        }

        iWidgets = this.getIWidgets();
        for (i = 0; i < iWidgets.length; i += 1) {
            if (iWidgets[i].element != null) {
                iWidgets[i].internal_iwidget.contextManager.modify({
                    'widthInPixels': step,
                    'heightInPixels': iWidgets[i].element.offsetHeight
                });
            }
        }

        // set current scroll
        if (OpManagerFactory.getInstance().visibleLayer === "tabs_container") {
            this._scroll(this.visibleTabIndex);
        }
    };

    Workspace.prototype.tabExists = function (tabName) {
        for (var i = 0; i < this.tabInstances.length; i += 1) {
            if (this.tabInstances[i].tabInfo.name === tabName) {
                return true;
            }
        }
        return false;
    };

    // *****************
    //  CONSTRUCTOR
    // *****************

    this.workspaceState = workspaceState;
    this.workspaceGlobal = null;
    this.varManager = null;
    this.tabInstances = [];
    this.wiring = null;
    this.varManager = null;
    this.loaded = false;
    this.visibleTab = null;
    this.visibleTabIndex = 0;
    this.alternatives = null;
    this.tabsContainerElement = null;
    this.layout = null;

    StyledElements.ObjectWithEvents.call(this, ['iwidgetadded', 'iwidgetremoved']);
}
Workspace.prototype = new StyledElements.ObjectWithEvents();
