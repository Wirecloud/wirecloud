/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    var TutorialSubMenu = function TutorialSubMenu() {
        var i, tutorial;

        StyledElements.SubMenuItem.call(this, utils.gettext('Tutorials'));

        this.menuItem.addIconClass('fa fa-map-o');

        for (i = 0; i < Wirecloud.TutorialCatalogue.tutorials.length; i++) {
            tutorial = Wirecloud.TutorialCatalogue.tutorials[i];
            this.append(new StyledElements.MenuItem(tutorial.label, tutorial.start.bind(tutorial)));
        }
    };
    TutorialSubMenu.prototype = new StyledElements.SubMenuItem();

    Wirecloud.ui.TutorialSubMenu = TutorialSubMenu;

})(Wirecloud.Utils);
