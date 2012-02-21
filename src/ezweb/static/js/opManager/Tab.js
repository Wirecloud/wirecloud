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


/**
 * @class
 *
 * @param id id inside the notebook
 * @param notebook notebook owner of this Tab
 * @param options options of this Tab
 */
function Tab(id, notebook, options) {

    var tabInfo = options.tab_info;
    options.name = tabInfo.name;
    options.closable = false;
    StyledElements.Tab.call(this, id, notebook, options);

    this.addEventListener('show', function (tab) {
        if (!tab.is_painted()) {
            tab.paint();
        }
    });

    //CALLBACK METHODS
    var renameSuccess = function(transport){

    }
    var renameError = function(transport, e) {
        var logManager = LogManagerFactory.getInstance();
        var msg = logManager.formatError(gettext("Error renaming a tab, changes will not be saved: %(errorMsg)s."), transport, e);
        logManager.log(msg);
    }

    var deleteSuccess = function(transport) {
        LayoutManagerFactory.getInstance().hideCover();
    }

    var deleteError = function(transport, e) {
        var logManager = LogManagerFactory.getInstance();
        var msg = logManager.formatError(gettext("Error removing a tab: %(errorMsg)s."), transport, e);
        logManager.log(msg);

        LayoutManagerFactory.getInstance().hideCover();
    }

    // ****************
    // PUBLIC METHODS
    // ****************

    Tab.prototype.getId = function(){
        return this.tabInfo.id;
    }

    Tab.prototype.destroy = function() {
        this.preferences.destroy();
        this.preferences = null;

        this.menu.remove();
        this.moveMenu.remove();

        this.dragboard.destroy();

        if (this.FloatingGadgetsMenu) {
            this.FloatingGadgetsMenu.remove();
        }

        StyledElements.Alternative.prototype.destroy.call(this);
    }


    Tab.prototype.updateInfo = function (tabName) {
        //If the server isn't working the changes will not be saved
        if (tabName=="" || tabName.match(/^\s$/)) {//empty name
            var msg = interpolate(gettext("Error updating a tab: invalid name"), true);
            LogManagerFactory.getInstance().log(msg);
        } else if (!this.workSpace.tabExists(tabName)) {
            this.tabInfo.name = tabName;
            var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
            var o = new Object;
            o.name = tabName;
            var tabData = Object.toJSON(o);
            var params = {'tab': tabData};
            PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, renameSuccess, renameError);
        } else {
            var msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workSpace.workSpaceState.name}, true);
            LogManagerFactory.getInstance().log(msg);
        }
    }

    Tab.prototype.deleteTab = function() {
        if (this.workSpace.removeTab(this)) { //check if it can be deleted (if not it displays an error window)
            var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
            PersistenceEngineFactory.getInstance().send_delete(tabUrl, this, deleteSuccess, deleteError);
        }
    }

    Tab.prototype.is_painted = function () {
        return this.painted;
    }

    Tab.prototype.paint = function () {
        this.getDragboard().paint();
    }

    Tab.prototype.getDragboard = function () {
        return this.dragboard;
    }

    /**
    * Gets the banner related to the workspace this dragboard belongs to
    */
    Tab.prototype.getHeader = function(){
        return this.workSpace.getHeader();
    }

    Tab.prototype.mark_as_painted = function () {
        this.painted = true;
    }

    Tab.prototype.hasIGadget = function(iGadgetIds){
        for (i in iGadgetIds){
            if (this.dragboard.getIGadget(iGadgetIds[i]))
                return true;
        }
        return false;
    }

    Tab.prototype.hasReadOnlyIGadgets = function(){
        if (this.dragboard.hasReadOnlyIGadgets()){
                return true;
        }
        return false;
    }

    // *****************
    //  PRIVATE METHODS
    // *****************


    /*constructor*/

    // The name of the dragboard HTML elements correspond to the Tab name
    this.workSpace = options.workspace;
    this.tabInfo = tabInfo;
    this.dragboardLayerName = "dragboard_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
    this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;

    this.FloatingGadgetsMenu = null;

    this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('tab', this.tabInfo.preferences, this)
    this.preferences.addCommitHandler(this.preferencesChanged.bind(this));

    //Now, a TAB is painted on-demand. Only the active tab is rendered automatically!
    this.painted = false;

    //By default, the TAB is locked
    this.locked = true;

    this.dragboardElement = this.wrapperElement;
    this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);


    this.tabOpsLauncher = new StyledElements.StyledButton({'text': 'v'});
    // TODO

    this.markAsVisibleSuccess = function() {
        var tabIds = this.workSpace.tabInstances.keys();
        for(var i = 0; i < tabIds.length; i++){
            var tab = this.workSpace.tabInstances[tabIds[i]];
            if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
                tab.firstVisible = false;
                tab.visibleEntryId = tab.menu.addOption('icon-mark-tab-visible',
                    gettext("First Visible"),
                    function() {
                        LayoutManagerFactory.getInstance().hideCover();
                        tab.markAsVisible();
                    }.bind(tab),
                    1);
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
        var logManager = LogManagerFactory.getInstance();
        var msg = logManager.formatError(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), transport, e);
        logManager.log(msg);
    }.bind(this);

    this.addMarkAsVisible = function () {
        this.firstVisible = false;
        this.visibleEntryId = this.menu.addOption('icon-mark-tab-visible',
            gettext("Mark as Visible"),
            function() {
                LayoutManagerFactory.getInstance().hideCover();
                this.markAsVisible();
            }.bind(this),
            1);
    }.bind(this);

    //this._createTabMenu();
}
Tab.prototype = new StyledElements.Tab();

Tab.prototype._createTabMenu = function() {
    var idMenu = 'menu_' + this.tabName;

    var menuHTML = $(idMenu);
    if (menuHTML)
        menuHTML.remove();

    //Tab Menu
    menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
    new Insertion.After($('menu_layer'), menuHTML);
    this.menu = new DropDownMenu(idMenu);

    //options for Tab Menu
    this.menu.addOption('icon-rename',
        gettext("Rename"),
        function() {
            LayoutManagerFactory.getInstance().showWindowMenu("renameTab", null, null, this);
        }.bind(this),
        0);

    if (this.tabInfo.visible != "true") {
        this.addMarkAsVisible();
    } else {
        this.firstVisible = true;
        this.visibleEntryId = null;
    }

    //move before... Menu
    var idMoveMenu = 'moveMenu_'+this.tabName;
    this.moveMenu = LayoutManagerFactory.getInstance().initDropDownMenu(idMoveMenu, this.menu);


    //add an option for each tab
    this._addMoveOptions = function(){
        var context;

        var tabIds = this.workSpace.tabInstances.keys();
        if(tabIds.length == 1){
            this.moveMenu.menu.update(gettext("no more tabs"));
            return;
        }
        //tabs are displayed in inverted order
        var nextTab = this.tabHTMLElement.previousSibling;
        var pos = 0;
        for(var i = 0; i < tabIds.length; i++){
            //don't allow moving before this tab or next tab
            if(this.tabInfo.id != tabIds[i] && this.workSpace.tabInstances[tabIds[i]].tabHTMLElement != nextTab){
                context = {thisTab: this, targetTab: this.workSpace.tabInstances[tabIds[i]]};
                this.moveMenu.addOption(null,
                    this.workSpace.tabInstances[tabIds[i]].tabInfo.name,
                    function() {
                        LayoutManagerFactory.getInstance().hideCover();
                        LayoutManagerFactory.getInstance().moveTab(this.thisTab, this.targetTab);
                    }.bind(context),
                    pos);
                pos++;
            }

        }
        //move to end option
        if(nextTab){ //only if there is a next tab
            this.moveMenu.addOption(null, gettext('move to end'),
                    function(){
                        LayoutManagerFactory.getInstance().hideCover();
                        LayoutManagerFactory.getInstance().moveTab(this, null);
                    }.bind(this),
                    pos);
        }
    }

    this.menu.addOption('icon-move',
            gettext("Move before..."),
            function(e) {
                this.moveMenu.clearOptions();
                this._addMoveOptions();
                LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu', this.moveMenu, Event.pointerX(e), Event.pointerY(e));
            }.bind(this),
            2);

    this.menu.addOption('icon-remove',
        gettext("Remove"),
        function() {
            var msg = gettext('Do you really want to remove the "%(tabName)s" tab?');
            msg = interpolate(msg, {tabName: this.tabInfo.name}, true);
            LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().deleteTab();})
        }.bind(this),
        3);

    //Floating Gadgets Menu
    var floatingGadgetsId = 'floatingGadgetsMenu_'+this.tabName;
    this.FloatingGadgetsMenu = LayoutManagerFactory.getInstance().initDropDownMenu(floatingGadgetsId, this.menu);


    this.menu.addOption('icon-show-floating',
        gettext("Show Floating Gadget"),
        function(e) {
            this.FloatingGadgetsMenu.clearOptions();
            this.getDragboard().fillFloatingGadgetsMenu(this.FloatingGadgetsMenu);
            LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu',this.FloatingGadgetsMenu, Event.pointerX(e), Event.pointerY(e));
        }.bind(this),
        4);

    this.menu.addOption('icon-tab-preferences',
        gettext("Preferences"),
        function() {
            LayoutManagerFactory.getInstance().showPreferencesWindow('tab', this.preferences);
        }.bind(this),
        5);
}

/**
 * FIXME
 */
Tab.prototype.show = function() {
    if (!this.painted)
        this.getDragboard().paint();

    LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

    this.dragboard._notifyVisibilityChange(true);
    this.dragboard._notifyWindowResizeEvent();
};

/**
 *
 */
Tab.prototype.hide = function() {
    this.dragboard._notifyVisibilityChange(false);
}

/**
 * @private
 *
 * This method is called when tab preferences are changed
 */
Tab.prototype.preferencesChanged = function(modifiedValues) {
    for (preferenceName in modifiedValues) {
        var newLayout = false;

        switch (preferenceName) {
        case "smart":
        case "columns":
        case "cell-height":
        case "vertical-margin":
        case "horizontal-margin":
            newLayout = true;
            break;
        default:
            continue;
        }
        break;
    }

    if (newLayout) {
        this.dragboard._updateBaseLayout();
    }
}


/**
 * Locks/unlocks this tab.
 */
Tab.prototype.setLock = function(locked) {
    this.locked = locked;
    this.dragboard.setLock(locked);
}

/**
 * Checks if the tab is locked
 */
Tab.prototype.isLocked = function() {
    return this.locked;
}
