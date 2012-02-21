var IGadgetMenuItems = function(iGadget) {
    StyledElements.DynamicMenuItems.call(this);

    this.iGadget = iGadget;
    this.has_prefs = iGadget.gadget.getTemplate().getUserPrefs().length > 0;
}
IGadgetMenuItems.prototype = new StyledElements.DynamicMenuItems();

IGadgetMenuItems.prototype.build = function() {
    var items, fulldragboard_label;

    items = [];

    if (this.has_prefs) {
        items.push(new StyledElements.MenuItem(
            gettext("Preferences"),
            function () {
                this.toggleConfigurationVisible();
                LayoutManagerFactory.getInstance().hideCover();
            }.bind(this.iGadget)
        ));
    }

    items.push(new StyledElements.MenuItem(
        gettext("Reload"),
        function () {
            if ('data' in this.content) {
                this.contentWrapper.removeChild(this.content);
                this.contentWrapper.appendChild(this.content);
            } else {
                this.content.src = this.codeURL;
            }
            LayoutManagerFactory.getInstance().hideCover();
        }.bind(this.iGadget)
    ))

    if (this.iGadget.isInFullDragboardMode()) {
        fulldragboard_label = gettext("Exit Full Dragboard");
    } else {
        fulldragboard_label = gettext("Full Dragboard");
    }
    items.push(new StyledElements.MenuItem(
        fulldragboard_label,
        function () {
            LayoutManagerFactory.getInstance().hideCover();
            this.setFullDragboardMode(!this.isInFullDragboardMode());
        }.bind(this.iGadget)
    ));

    if (!this.iGadget.isInFullDragboardMode()) {
        if (this.iGadget.onFreeLayout()) {
            layout_label = gettext("Snap to grid");
        } else {
            layout_label = gettext("Extract from grid");
        }
        items.push(new StyledElements.MenuItem(
            layout_label,
            this.iGadget.toggleLayout.bind(this.iGadget)
        ));
    }

    return items;
};
