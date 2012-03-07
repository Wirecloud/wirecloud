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

    var button, tabInfo = options.tab_info;
    options.name = tabInfo.name;
    options.closable = false;
    StyledElements.Tab.call(this, id, notebook, options);

    this.addEventListener('show', function (tab) {
        if (!tab.is_painted()) {
            tab.paint();
        }
    });

    button = new StyledElements.StyledButton({
        'class': 'icon-tab-menu',
        'plain': true
    });
    button.insertInto(this.tabElement);
    button.addEventListener('click', function () {
        this.menu.show();
    }.bind(this));

    //CALLBACK METHODS
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

        this.menu.destroy();
        this.dragboard.destroy();

        StyledElements.Alternative.prototype.destroy.call(this);
    };


    Tab.prototype.updateInfo = function (tabName) {
        //If the server isn't working the changes will not be saved
        if (tabName=="" || tabName.match(/^\s$/)) {//empty name
            var msg = interpolate(gettext("Error updating a tab: invalid name"), true);
            LogManagerFactory.getInstance().log(msg);
        } else if (!this.workSpace.tabExists(tabName)) {
            var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
            var params = {'tab': Object.toJSON({'name': tabName})};
            PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, function() { this.tabInfo.name = tabName; this.rename(tabName)}, renameError);
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

    this.markAsVisible = function () {
        var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
        var o = new Object;
        o.visible = "true";
        var tabData = Object.toJSON(o);
        var params = {'tab': tabData};
        PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, this.markAsVisibleSuccess, this.markAsVisibleError);
    }.bind(this);

    this.markAsVisibleSuccess = function() {
        var tabIds = this.workSpace.tabInstances.keys();
        for (var i = 0; i < tabIds.length; i++){
            var tab = this.workSpace.tabInstances.get(tabIds[i]);
            tab.tabInfo.visible = false;
        }
        this.tabInfo.visible = true;
    }.bind(this);

    this.markAsVisibleError = function(transport, e){
        var logManager = LogManagerFactory.getInstance();
        var msg = logManager.formatError(gettext("Error marking as first visible tab, changes will not be saved: %(errorMsg)s."), transport, e);
        logManager.log(msg);
    }.bind(this);

    this.menu = new StyledElements.PopupMenu();
    this.menu.append(new TabMenuItems(this));
}
Tab.prototype = new StyledElements.Tab();

Tab.prototype.repaint = function(temporal) {
    StyledElements.Tab.prototype.repaint.call(this, temporal);

    if (!temporal) {
        this.dragboard._notifyWindowResizeEvent();
    }
};

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
