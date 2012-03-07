var TabMenuItems = function(tab) {
    StyledElements.DynamicMenuItems.call(this);

    this.tab = tab;
};
TabMenuItems.prototype = new StyledElements.DynamicMenuItems();

TabMenuItems.prototype.build = function() {
    var items, fulldragboard_label;

    items = [];

    items.push(new StyledElements.MenuItem(
        gettext("Rename"),
        function () {
            this.workSpace.renameTabWindow.setTab(this);
            this.workSpace.renameTabWindow.show();
        }.bind(this.tab)
    ));

    if (!this.tab.tabInfo.visible) {
        items.push(new StyledElements.MenuItem(
            gettext("Mark as Visible"),
            this.tab.markAsVisible.bind(this.tab)
        ));
    }

    /*
    this.menu.addOption('icon-show-floating',
        gettext("Show Floating Gadget"),
        function(e) {
            this.FloatingGadgetsMenu.clearOptions();
            this.getDragboard().fillFloatingGadgetsMenu(this.FloatingGadgetsMenu);
            LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu',this.FloatingGadgetsMenu, Event.pointerX(e), Event.pointerY(e));
        }.bind(this),
        4);
    */

    items.push(new StyledElements.MenuItem(
        gettext("Preferences"),
        function () {
            LayoutManagerFactory.getInstance().showPreferencesWindow('tab', this.preferences);
        }.bind(this.tab)
    ));

    return items;
};
