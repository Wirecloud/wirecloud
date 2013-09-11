(function () {

    "use strict";

    var TutorialSubMenu = function TutorialSubMenu() {
        var i, tutorial;

        StyledElements.SubMenuItem.call(this, gettext('Tutorials'));
        for (i = 0; i < Wirecloud.TutorialCatalogue.tutorials.length; i++) {
            tutorial = Wirecloud.TutorialCatalogue.tutorials[i];
            this.append(new StyledElements.MenuItem(tutorial.label, tutorial.start.bind(tutorial)));
        }
    };
    TutorialSubMenu.prototype = new StyledElements.SubMenuItem();

    Wirecloud.ui.TutorialSubMenu = TutorialSubMenu;

})();
