/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global interpolate, isAnonymousUser, VarManager, ContextManager, Wiring, OpManagerFactory, Modules, gettext, alert, last_logged_user, document, window, Concept, StyledElements, Tab, $, Wirecloud */
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


function WorkSpace(workSpaceState) {

    var loadWorkSpace,
        onError;

    // ****************
    // CALLBACK METHODS
    // ****************

    // Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
    loadWorkSpace = function (transport) {
        // JSON-coded iWidget-variable mapping
        var response = transport.responseText;
        this.workSpaceGlobalInfo = JSON.parse(response);

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

    WorkSpace.prototype._buildInterface = function () {
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
        if (isAnonymousUser) {
            loginButton.setAttribute('href', '/accounts/login/?next=' + document.location.path);
            loginButton.textContent = gettext('Sign in');
        } else {
            loginButton.setAttribute('href', '/logout')
            loginButton.textContent = gettext('Sign out');
        }

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

    WorkSpace.prototype._scroll = function (index) {
        this.layout.getCenterContainer().wrapperElement.scrollLeft = index * window.innerWidth;
    };

    // ****************
    // PUBLIC METHODS
    // ****************

    WorkSpace.prototype.unload = function () {
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
        this.contextManager.unload();
        OpManagerFactory.getInstance().globalDragboard.clear();
        this.tabsContainerElement = null;
        this.layout.destroy();
    };

    WorkSpace.prototype.unloadTab = function (tabId) {
        var tab = this.tabInstances[tabId];

        tab.destroy();

        this.visibleTab = null;
    };

    WorkSpace.prototype.removeIWidgetData = function (iWidgetId) {
        this.varManager.removeInstance(iWidgetId);
        this.wiring.removeInstance(iWidgetId);
        this.contextManager.removeInstance(iWidgetId);
    };

    WorkSpace.prototype.sendBufferedVars = function () {
        this.varManager.sendBufferedVars();
    };

    WorkSpace.prototype.getTabInstance = function (tabId) {
        var i;
        for (i = 0; i < this.tabInstances.length; i += 1) {
            if (this.tabInstances[i].getId() === tabId) {
                return this.tabInstances[i];
            }
        }
        return null;
    };

    WorkSpace.prototype.getName = function () {
        return this.workSpaceState.name;
    };

    WorkSpace.prototype.getId = function () {
        return this.workSpaceState.id;
    };

    WorkSpace.prototype.getWiring = function () {
        return this.wiring;
    };

    WorkSpace.prototype.getVarManager = function () {
        return this.varManager;
    };

    WorkSpace.prototype.getContextManager = function () {
        return this.contextManager;
    };

    WorkSpace.prototype.getActiveDragboard = function () {
        return this.visibleTab.getDragboard();
    };

    WorkSpace.prototype.downloadWorkSpaceInfo = function () {
        var workSpaceUrl = Wirecloud.URLs.WORKSPACE_ENTRY.evaluate({'workspace_id': this.workSpaceState.id});
        Wirecloud.io.makeRequest(workSpaceUrl, {
            method: 'GET',
            onSuccess: loadWorkSpace.bind(this),
            onFailure: onError.bind(this),
            onException: onError.bind(this)
        });
    };

    WorkSpace.prototype.getIwidget = function (iwidgetId) {
        var i, iwidget;
        for (i = 0; i < this.tabInstances.length; i += 1) {
            iwidget = this.tabInstances[i].getDragboard().getIWidget(iwidgetId);

            if (iwidget) {
                return iwidget;
            }
        }
    };

    WorkSpace.prototype.getIWidgets = function () {
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
    WorkSpace.prototype.init = function () {
        //Create a menu for each tab of the workspace and paint it as main screen.
        var scrolling = 0,
            step = window.innerWidth,
            i, tabs, tab, iwidgets;

        tabs = this.workSpaceGlobalInfo.workspace.tabList;

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

        this.contextManager = new ContextManager(this, this.workSpaceGlobalInfo);
        this.wiring = new Wirecloud.Wiring(this);
        iwidgets = this.getIWidgets();
        for (i = 0; i < iwidgets.length; i += 1) {
            this.events.iwidgetadded.dispatch(this, iwidgets[i]);
        }
        this.wiring.load(this.workSpaceGlobalInfo.workspace.wiring);
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

    WorkSpace.prototype.show = function () {
        var step = window.innerWidth;
        window.scrollTo(this.visibleTabIndex * step, 1);
    };

    WorkSpace.prototype.getTab = function (tabId) {
        return this.tabInstances.getElementById(tabId);
    };

    WorkSpace.prototype.setTab = function (tab) {
        if (!this.loaded) {
            return;
        }
        this.visibleTab = tab;
        this.visibleTab.show();
    };

    WorkSpace.prototype.getVisibleTab = function () {
        if (!this.loaded) {
            return;
        }

        return this.visibleTab;
    };

    WorkSpace.prototype.getNumberOfTabs = function () {
        return this.tabInstances.length;
    };

    WorkSpace.prototype.updateVisibleTab = function (index) {
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

    WorkSpace.prototype.updateLayout = function (orient) {
        var step = window.innerWidth,
            scrolling = 0,
            iWidgets, contextManager, i;

        //notify this to the ContextManager. The orient value may be "portrait" or "landscape".
        this.contextManager.notifyModifiedConcept(Concept.prototype.ORIENTATION, orient);

        for (i = 0; i < this.tabInstances.length; i += 1) {
            this.tabInstances[i].updateLayout(scrolling);
            scrolling += step;
        }

        iWidgets = this.getIWidgets();
        for (i = 0; i < iWidgets.length; i += 1) {
            this.contextManager.notifyModifiedWidgetConcept(iWidgets[i], Concept.prototype.WIDTHINPIXELS, step);
        }

        // set current scroll
        if (OpManagerFactory.getInstance().visibleLayer === "tabs_container") {
            this._scroll(this.visibleTabIndex);
        }
    };

    WorkSpace.prototype.tabExists = function (tabName) {
        for (var i = 0; i < this.tabInstances.length; i += 1) {
            if (this.tabInstances[i].tabInfo.name === tabName) {
                return true;
            }
        }
        return false;
    };

    WorkSpace.prototype.showRelatedIwidget = function (iWidgetId, tabId) {
        this.visibleTab = this.getTab(tabId);
        this.visibleTabIndex = this.tabInstances.indexOf(this.visibleTab);
        this.visibleTab.getDragboard().paintRelatedIWidget(iWidgetId);
    };

    // *****************
    //  CONSTRUCTOR
    // *****************

    this.workSpaceState = workSpaceState;
    this.workSpaceGlobal = null;
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
WorkSpace.prototype = new StyledElements.ObjectWithEvents();
