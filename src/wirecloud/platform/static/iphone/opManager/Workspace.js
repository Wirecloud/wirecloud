/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global interpolate, Wiring, OpManagerFactory, gettext, alert, last_logged_user, document, window, Concept, StyledElements, Tab, Wirecloud */
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


function Workspace(workspaceState, resources) {

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

        this.layout.getCenterContainer().wrapperElement.setAttribute('id', 'workspace');
        new MobileScrollManager(this.layout.getCenterContainer().wrapperElement, {
            'capture': true,
            'propagate': true,
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
        if (this.wiring != null) {
            this.wiring.destroy();
            this.wiring = null;
        }
        OpManagerFactory.getInstance().globalDragboard.clear();
        this.tabsContainerElement = null;
        this.layout.destroy();
    };

    Workspace.prototype.unloadTab = function (tabId) {
        var tab = this.tabInstances[tabId];

        tab.destroy();

        this.visibleTab = null;
    };

    Workspace.prototype.getName = function () {
        return this.workspaceState.name;
    };

    Workspace.prototype.getActiveDragboard = function () {
        return this.visibleTab.getDragboard();
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
        var iWidgets = [],
            i;
        for (i = 0; i < this.tabInstances.length; i += 1) {
            iWidgets = iWidgets.concat(this.tabInstances[i].getDragboard().getIWidgets());
        }

        return iWidgets;
    };

    /**** Display the IWidgets menu ***/
    Workspace.prototype.init = function () {

        var layoutManager = LayoutManagerFactory.getInstance();
        layoutManager.logStep('');
        layoutManager.logSubTask(gettext('Processing workspace data'));

        //Create a menu for each tab of the workspace and paint it as main screen.
        var scrolling = 0,
            step = window.innerWidth,
            i, tabs, tab, iwidgets;

        tabs = this.workspaceState.tabs;

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

        this.contextManager = new Wirecloud.ContextManager(this, this.workspaceState.context);
        this.wiring = new Wirecloud.Wiring(this);
        iwidgets = this.getIWidgets();
        for (i = 0; i < iwidgets.length; i += 1) {
            this.events.iwidgetadded.dispatch(this, iwidgets[i].internal_iwidget);
        }
        this._buildInterface();
        this.wiring.load(this.workspaceState.wiring);

        for (i = 0; i < this.tabInstances.length; i += 1) {
            this.tabInstances[i].paint(this.layout.getCenterContainer(), scrolling, i);
            scrolling += step;
        }

        //show the menu
        var opManager = OpManagerFactory.getInstance();
        opManager.alternatives.showAlternative(this.tabsContainerElement);

        this.updateVisibleTab(this.visibleTabIndex);

        Wirecloud.GlobalLogManager.log(gettext('Workspace loaded'), Wirecloud.constants.LOGGING.INFO_MSG);
    };

    Workspace.prototype.show = function () {
        var step = window.innerWidth;
        window.scrollTo(this.visibleTabIndex * step, 1);
    };

    Workspace.prototype.getTab = function (tabId) {
        var i;

        for (i = 0; i < this.tabInstances.length; i += 1) {
            if (this.tabInstances[i].id === tabId) {
                return this.tabInstances[i];
            }
        }
        return null;
    };

    Workspace.prototype.getVisibleTab = function () {
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
        Wirecloud.contextManager.modify({
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

    Workspace.prototype.drawAttention = function drawAttention(iwidget) {
    };

    // *****************
    //  CONSTRUCTOR
    // *****************

    Object.defineProperty(this, 'id', {value: workspaceState.id});
    Object.defineProperty(this, 'resources', {value: resources});
    Object.defineProperty(this, 'owned', {value: workspaceState.owned});
    this.workspaceState = workspaceState;
    this.tabInstances = [];
    this.wiring = null;
    this.visibleTab = null;
    this.visibleTabIndex = 0;
    this.alternatives = null;
    this.tabsContainerElement = null;
    this.layout = null;

    StyledElements.ObjectWithEvents.call(this, ['iwidgetadded', 'iwidgetremoved', 'removed']);

    this.init();
    OpManagerFactory.getInstance().visibleLayer = "tabs_container";
}
Workspace.prototype = new StyledElements.ObjectWithEvents();
