(function () {

    "use strict";

    var TutorialSubMenu = function TutorialSubMenu() {
        StyledElements.SubMenuItem.call(this, gettext('Tutorials'));
        this.append(new StyledElements.MenuItem(gettext('Add new Catalog'), function () {}));
    };
    TutorialSubMenu.prototype = new StyledElements.SubMenuItem();

    Wirecloud.ui.TutorialSubMenu = TutorialSubMenu;

})();
