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


function Tab (tabInfo, workSpace) {

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
        LayoutManagerFactory.getInstance().removeFromTabBar(this);

        this.preferences.destroy();
        this.preferences = null;

        this.menu.remove();
        this.moveMenu.remove();

        this.dragboard.destroy();

        if (this.FloatingGadgetsMenu)
            this.FloatingGadgetsMenu.remove();
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

    Tab.prototype.fillWithLabel = function() {
        if (this.tabNameHTMLElement != null) {
            this.tabNameHTMLElement.remove();
        }
        var nameToShow = (this.tabInfo.name.length>15)?this.tabInfo.name.substring(0, 15)+"..." : this.tabInfo.name;
        var spanHTML = "<span>"+nameToShow+"</span>";
        new Insertion.After($(this.dragger), spanHTML);
        var difference = this.tabHTMLElement.getWidth() - this.tabWidth;
        if (difference != 0)
            LayoutManagerFactory.getInstance().changeTabBarSize(difference);
        this.tabNameHTMLElement = Element.extend($(this.dragger).nextSibling);
        this.tabWidth = this.tabHTMLElement.getWidth();
    }

    Tab.prototype.fillWithInput = function () {
        var oldTabWidth= this.tabHTMLElement.getWidth();
        this.tabNameHTMLElement.remove();
        var inputHTML = "<input class='tab_name' value='"+this.tabInfo.name+"' size='"+(this.tabInfo.name.length)+"' maxlength=30 />";
        new Insertion.After($(this.dragger), inputHTML);
        this.tabNameHTMLElement =  Element.extend($(this.dragger).nextSibling);
        var newTabWidth= this.tabHTMLElement.getWidth();
        var difference= newTabWidth-oldTabWidth;
        if (difference!=0)
            LayoutManagerFactory.getInstance().changeTabBarSize(difference);
        this.tabWidth = newTabWidth;

        this.tabNameHTMLElement.focus();
        this.tabNameHTMLElement.select();
        Event.observe(this.tabNameHTMLElement, 'blur', function(e){Event.stop(e);
                    this.fillWithLabel()}.bind(this));
        Event.observe(this.tabNameHTMLElement, 'keypress', function(e){
                            var target = BrowserUtilsFactory.getInstance().getTarget(e);
                            if(e.keyCode == Event.KEY_RETURN){
                                Event.stop(e);
                                target.blur();
                            } else{
                                this.makeVisibleInTabBar();
                            }}.bind(this));
        Event.observe(this.tabNameHTMLElement, 'change', function(e){
                            var target = BrowserUtilsFactory.getInstance().getTarget(e);
                            this.updateInfo(target.value);}.bind(this));
        Event.observe(this.tabNameHTMLElement, 'keyup', function(e){
                            Event.stop(e);
                            var target = BrowserUtilsFactory.getInstance().getTarget(e);
                            target.size = (target.value.length==0)?1:target.value.length;
                            var newTabWidth = target.parentNode.getWidth();
                            var difference= newTabWidth-this.tabWidth;
                            if (difference!=0)
                                LayoutManagerFactory.getInstance().changeTabBarSize(difference);
                            this.tabWidth = newTabWidth;
                        }.bind(this));
        Event.observe(this.tabNameHTMLElement, 'click', function(e){Event.stop(e);}); //do not propagate to div.
    }

    Tab.prototype.unmark = function () {
        //this.hideDragboard();
        LayoutManagerFactory.getInstance().unmarkTab(this);

    }

    Tab.prototype.is_painted = function () {
        return this.painted;
    }

    Tab.prototype.paint = function () {
        this.getDragboard().paint();
    }

        /* if the tab is out of the visible area of the tab bar, slide it to show it */
    Tab.prototype.makeVisibleInTabBar = function(){
        var tabLeft = Position.cumulativeOffset(this.tabHTMLElement)[0];
        var fixedBarLeft = LayoutManagerFactory.getInstance().getFixedBarLeftPosition();
        var difference = tabLeft - fixedBarLeft;
        if (difference < 0){
            LayoutManagerFactory.getInstance().changeScrollBarRightPosition(difference);
        }
        else{
            var fixedBarRight = fixedBarLeft + LayoutManagerFactory.getInstance().getFixedBarWidth();
            var visibleTabArea = fixedBarRight - tabLeft;
            difference = visibleTabArea - this.tabHTMLElement.getWidth();
            if(difference < 0){
                LayoutManagerFactory.getInstance().changeScrollBarRightPosition(-1*difference);
            }
        }
    }

    Tab.prototype.markAsCurrent = function (){
        LayoutManagerFactory.getInstance().markTab(this);
    }

    Tab.prototype.go = function () {
        this.show();
        LayoutManagerFactory.getInstance().goTab(this);
        this.makeVisibleInTabBar();
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
    this.workSpace = workSpace;
    this.tabInfo = tabInfo;
    this.dragboardLayerName = "dragboard_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
    this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;
    this.tabHTMLElement;
    this.tabNameHTMLElement = null;
    this.tabWidth = 0;

    this.FloatingGadgetsMenu = null;

    this.preferences = PreferencesManagerFactory.getInstance().buildPreferences('tab', this.tabInfo.preferences, this)
    this.preferences.addCommitHandler(this.preferencesChanged.bind(this));

    //Now, a TAB is painted on-demand. Only the active tab is rendered automatically!
    this.painted = false;

    //By default, the TAB is locked
    this.locked = true;

    //tab event handlers
    this.renameTabHandler = function(e){
        this.makeVisibleInTabBar();
        this.fillWithInput();
    }.bind(this);

    this.changeTabHandler = function(e){
        this.workSpace.setTab(this);
        this.makeVisibleInTabBar();
    }.bind(this);


/***
 *** DRAGGABLE TAB***
 ***/

    //draggable only in x axis
    this.xDelta = 0;
    this.xStart = 0;
    this.xOffset = 0;
    this.x;
    this.y;
    this.referenceTab;


    Tab.prototype._findTabElement = function(curNode, maxRecursion){
        if (maxRecursion == 0)
            return null;

        // Only check elements, skip other dom nodes.
        if (isElement(curNode) && Element.extend(curNode).hasClassName('tab')) {
            return curNode;
        } else {
            var parentNode = curNode.parentNode;
            if (isElement(parentNode))
                return this._findTabElement(parentNode, maxRecursion - 1);
            else
                return null;
        }

    }

    this.startDrag = function(e){

        e = e || window.event; // needed for IE
        // Only attend to left button (or right button for left-handed persons) events
        if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
            return false;

        Event.stop(e);
        document.oncontextmenu = function() { return false; }; // disable context menu
        document.onmousedown = function() { return false; }; // disable text selection in Firefox
        document.onselectstart = function () { return false; }; // disable text selection in IE
        Event.stopObserving ($(this.dragger), "mousedown", this.startDrag);

        //tab has position relative. OffsetTop/Left are relative
        this.x = this.tabHTMLElement.offsetLeft;
        this.y = Position.cumulativeOffset(this.tabHTMLElement)[1];
        var y = this.tabHTMLElement.offsetTop;
        this.tabHTMLElement.style.position = "absolute";
        this.tabHTMLElement.style.zIndex = "999999";
        this.xStart = parseInt(Event.pointerX(e));
        this.tabHTMLElement.style.left = this.x + 'px';
        this.tabHTMLElement.style.top = y + 'px';

        //create an element to mark the room available for the tab
        this.tabMarker = document.createElement('div');
        Element.extend(this.tabMarker);
        this.tabMarker.id = "tab_space";
        this.tabMarker.addClassName('tab');

        var computedStyle = document.defaultView.getComputedStyle(this.tabHTMLElement, null);
        var borderWidth= computedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX) * 2;
        var padding = computedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) +
                      computedStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
        var width = this.tabHTMLElement.getWidth() - borderWidth - padding;
        this.tabMarker.style.width = width + "px";
        //this.tabMarker.style.visibility = "hidden";

        LayoutManagerFactory.getInstance().insertMarker(this.tabMarker, this);

        //this.referenceTab = this;

        Event.observe (document, "mouseup", this.endDrag);
        Event.observe (document, "mousemove", this.drag);

        return false;

    }.bind(this);

    this.drag = function(e){

        e = e || window.event; // needed for IE

        var screenX = parseInt(Event.pointerX(e));
        this.xDelta = this.xStart - screenX;
        this.xStart = screenX;

        this.x = this.x - this.xDelta;
        if(this.x < 0)
            this.x = 0;

        if(this.x > LayoutManagerFactory.getInstance().getScrollTabBarWidth()){
            //insert at the end
            this.referenceTab = null;
            //mark the target position with the separator img
            LayoutManagerFactory.getInstance().moveIndicator(this.referenceTab);
            return false;
        }
        this.tabHTMLElement.style.left = this.x + 'px';

        // calculate where the user wants to put the tab
        //y+2: problems with border in IE<8
        // hide the draggable element
        // in order not to return it in elementFromPoint()
        this.tabHTMLElement.hide();
        var element = document.elementFromPoint(Event.pointerX(e), this.y +2);
        this.tabHTMLElement.show();
        if (element != null) {
            // elementFromPoint may return inner tab elements
            element = this._findTabElement(element, 4);
        }
        var id = null;
        if (element) {
            id = element.getAttribute("id");
            if (id != null) {
                if(id == "tab_space"){
                    //same position:do nothing
                    this.referenceTab = this;
                }
                var keys = this.workSpace.tabInstances.keys();
                for(var i = 0;i<keys.length;i++){
                    if(this.workSpace.tabInstances[keys[i]].tabName == id){
                        this.referenceTab = this.workSpace.tabInstances[keys[i]];
                        break;
                    }
                }
                if(this.referenceTab.tabHTMLElement.nextSibling == this.tabHTMLElement){
                    //same position: do nothing
                    this.referenceTab = this;
                }

                //mark the target position with the separator img
                LayoutManagerFactory.getInstance().moveIndicator(this.referenceTab);
            }
        }
        return false;
    }.bind(this);

    this.endDrag = function(e){

        e = e || window.event; // needed for IE

        Event.stop(e);
        // Only attend to left button (or right button for left-handed persons) events
        if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
            return false;

        Event.stopObserving (document, "mouseup", this.endDrag);
        Event.stopObserving (document, "mousemove", this.drag);

        Element.remove(this.tabMarker);
        $('tab_marker').style.display = 'none';

        //move the tab and restore its properties
        LayoutManagerFactory.getInstance().moveTab(this, this.referenceTab);
        this.tabHTMLElement.style.position = "relative";
        this.tabHTMLElement.style.zIndex = "";
        this.tabHTMLElement.style.left = "";
        this.tabHTMLElement.style.top = "";

        Event.observe($(this.dragger), "mousedown", this.startDrag);

        document.onmousedown = null; // reenable context menu
        document.onselectstart = null; // reenable text selection in IE
        document.oncontextmenu = null; // reenable text selection

        return false;

    }.bind(this)
//END Draggable tab

    // Dragboard layer creation
    var wrapper = $("wrapper");

    this.dragboardElement = document.createElement("div");
    Element.extend(this.dragboardElement);
    this.dragboardElement.className = "container dragboard";
    wrapper.insertBefore(this.dragboardElement, wrapper.firstChild);

    this.dragboardElement.setAttribute('id', this.dragboardLayerName);

    this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);


    //LayoutManagerFactory.getInstance().resizeContainer(this.dragboardElement);

    // Tab creation
    //add a new tab to the tab section
    this.tabHTMLElement = LayoutManagerFactory.getInstance().addToTabBar(this.tabName);

    //Element for dragging
    this.dragger = this.tabName + "_dragger";
    var draggerHTML = '<div id="'+this.dragger+'" class="tab_dragger"></div>';
    new Insertion.Top(this.tabHTMLElement, draggerHTML);
    var draggerElement = $(this.dragger);
    Event.observe(draggerElement, "mousedown", this.startDrag);
    Event.observe(draggerElement, "click", function(e){Event.stop(e)});
    draggerElement.setStyle({'display':'none'});

    //fill the tab label with a span tag
    this.fillWithLabel();

    this.tabOpsLauncher = this.tabName+"_launcher";
    var tabOpsLauncherHTML = '<input id="'+this.tabOpsLauncher+'" type="button" title="'+gettext("Options")+'" class="tabOps_launcher tabOps_launcher_show"/>';
    new Insertion.Bottom(this.tabHTMLElement, tabOpsLauncherHTML);
    var tabOpsLauncherElement = $(this.tabOpsLauncher);
    Event.observe(tabOpsLauncherElement, "click", function(e){
                                                    var target = BrowserUtilsFactory.getInstance().getTarget(e);
                                                    target.blur();Event.stop(e);
                                                    LayoutManagerFactory.getInstance().showDropDownMenu('tabOps',this.menu, Event.pointerX(e), Event.pointerY(e));}.bind(this), true);
    tabOpsLauncherElement.setStyle({'display':'none'});

    this.markAsVisibleSuccess = function() {
        var tabIds = this.workSpace.tabInstances.keys();
        for(var i = 0; i < tabIds.length; i++){
            var tab = this.workSpace.tabInstances[tabIds[i]];
            if ((tab.tabInfo.id != this.tabInfo.id) && tab.firstVisible){
                tab.firstVisible = false;
                tab.visibleEntryId = tab.menu.addOption(_currentTheme.getIconURL('mark_tab_visible'),
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
        this.visibleEntryId = this.menu.addOption(_currentTheme.getIconURL("mark_tab_visible"),
            gettext("Mark as Visible"),
            function() {
                LayoutManagerFactory.getInstance().hideCover();
                this.markAsVisible();
            }.bind(this),
            1);
    }.bind(this);

    this._createTabMenu();
}

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
    this.menu.addOption(_currentTheme.getIconURL("rename"),
        gettext("Rename"),
        function() {
            OpManagerFactory.getInstance().activeWorkSpace.getVisibleTab().fillWithInput();
            LayoutManagerFactory.getInstance().hideCover();
        },
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

    this.menu.addOption(_currentTheme.getIconURL("move"),
            gettext("Move before..."),
            function(e) {
                this.moveMenu.clearOptions();
                this._addMoveOptions();
                LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu', this.moveMenu, Event.pointerX(e), Event.pointerY(e));
            }.bind(this),
            2);

    this.menu.addOption(_currentTheme.getIconURL("remove"),
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


    this.menu.addOption(_currentTheme.getIconURL("show_floating"),
        gettext("Show Floating Gadget"),
        function(e) {
            this.FloatingGadgetsMenu.clearOptions();
            this.getDragboard().fillFloatingGadgetsMenu(this.FloatingGadgetsMenu);
            LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu',this.FloatingGadgetsMenu, Event.pointerX(e), Event.pointerY(e));
        }.bind(this),
        4);

    this.menu.addOption(_currentTheme.getIconURL('tab_preferences'),
        gettext("Preferences"),
        function() {
            LayoutManagerFactory.getInstance().showPreferencesWindow('tab', this.preferences);
        }.bind(this),
        5);
}

/**
 *
 */
Tab.prototype.show = function() {
    if (!this.painted)
        this.getDragboard().paint();

    LayoutManagerFactory.getInstance().showDragboard(this.dragboard);

    this.dragboard._notifyVisibilityChange(true);
    this.markAsCurrent();
}

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
