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

    this.menu_button = new StyledElements.PopupButton({
        'class': 'icon-tab-menu',
        'plain': true,
        'menuOptions': {
            'position': 'top-left'
        }
    });
    this.menu_button.getPopupMenu().append(new TabMenuItems(this));
    this.menu_button.insertInto(this.tabElement);

    //CALLBACK METHODS
    var renameSuccess = function(transport) {
        var layoutManager = LayoutManagerFactory.getInstance();

        this.tab.tabInfo.name = this.newName;
        this.tab.rename(this.newName);

        layoutManager.logSubTask(gettext('Tab renamed successfully'));
        layoutManager.logStep('');
    };

    var renameError = function(transport, e) {
        var layoutManager, logManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        logManager = LogManagerFactory.getInstance();

        msg = logManager.formatError(gettext("Error renaming tab: %(errorMsg)s."), transport, e);
        logManager.log(msg);
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    };

    var deleteSuccess = function (transport) {
        var layoutManager = LayoutManagerFactory.getInstance();

        this.workSpace.unloadTab(this.getId());

        layoutManager.logSubTask(gettext('Tab deleted successfully'));
        layoutManager.logStep('');
    };

    var deleteError = function(transport, e) {
        var layoutManager, logManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        logManager = LogManagerFactory.getInstance();

        msg = logManager.formatError(gettext("Error removing tab: %(errorMsg)s."), transport, e);
        logManager.log(msg);
        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
    };

    // ****************
    // PUBLIC METHODS
    // ****************

    Tab.prototype.getId = function(){
        return this.tabInfo.id;
    }

    Tab.prototype.getName = function getName () {
        return this.tabInfo.name;
    };

    Tab.prototype.destroy = function() {
        this.preferences.destroy();
        this.preferences = null;

        this.menu_button.destroy();
        this.menu_button = null;
        this.dragboard.destroy();
        this.dragboard = null;

        StyledElements.Alternative.prototype.destroy.call(this);
    };


    /**
     * NOTE: rename conflicts with StyledElements.Tab.rename
     */
    Tab.prototype.updateInfo = function (tabName) {
        var layoutManager, tabUrl, params, msg = null;

        tabName = tabName.strip();

        if (tabName === "") {
            msg = interpolate(gettext("Error updating a tab: invalid name"), true);
        } else if (this.workSpace.tabExists(tabName)) {
            msg = interpolate(gettext("Error updating a tab: the name %(tabName)s is already in use in workspace %(wsName)s."), {tabName: tabName, wsName: this.workSpace.workSpaceState.name}, true);
        }

        if (msg !== null) {
            LogManagerFactory.getInstance().log(msg);
            return;
        }

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Renaming tab"), 1);
        msg = gettext('Renaming "%(tabname)s" to "%(newname)s"');
        msg = interpolate(msg, {tabname: this.tabInfo.name, newname: tabName}, true);
        layoutManager.logSubTask(msg);

        tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
        params = {'tab': Object.toJSON({'name': tabName})};
        Wirecloud.io.makeRequest(tabUrl, {
            method: 'PUT',
            parameters: params,
            onSuccess: renameSuccess.bind({tab: this, newName: tabName}),
            onFailure: renameError,
            onException: renameError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

    Tab.prototype.delete = function () {
        var layoutManager, tabUrl, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        layoutManager._startComplexTask(gettext("Removing tab"), 1);
        msg = gettext('Removing "%(tabname)s" from server');
        msg = interpolate(msg, {tabname: this.tabInfo.name}, true);
        layoutManager.logSubTask(msg);

        tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
        Wirecloud.io.makeRequest(tabUrl, {
            method: 'DELETE',
            onSuccess: deleteSuccess.bind(this),
            onFailure: deleteError,
            onException: deleteError,
            onComplete: function () {
                LayoutManagerFactory.getInstance()._notifyPlatformReady();
            }
        });
    };

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

    Tab.prototype.hasReadOnlyIGadgets = function () {
        return this.dragboard.hasReadOnlyIGadgets();
    };

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

    this.readOnly = false;

    this.dragboard = new Dragboard(this, this.workSpace, this.wrapperElement);

    this.markAsVisible = function () {
        var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabInfo.id});
        var params = {'tab': Object.toJSON({visible: "true"})};
        Wirecloud.io.makeRequest(tabUrl, {
            method: 'POST',
            parameters: params,
            onSuccess: this.markAsVisibleSuccess,
            onFailure: this.markAsVisibleError,
            onException: this.markAsVisibleError
        });
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
}
Tab.prototype = new StyledElements.Tab();

Tab.prototype.isAllowed = function (action) {
    switch (action) {
    case "remove":
        return !this.readOnly && this.workSpace.tabInstances.keys().length > 1 && !this.hasReadOnlyIGadgets();
    default:
        return false;
    }
};

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
