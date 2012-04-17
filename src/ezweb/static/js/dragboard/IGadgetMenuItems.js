/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global gettext, LayoutManagerFactory, StyledElements*/

var IGadgetMenuItems = function (iGadget) {
    StyledElements.DynamicMenuItems.call(this);

    this.iGadget = iGadget;
    this.has_prefs = iGadget.gadget.getTemplate().getUserPrefs().length > 0;
};
IGadgetMenuItems.prototype = new StyledElements.DynamicMenuItems();

IGadgetMenuItems.prototype.build = function () {
    var items, fulldragboard_label, layout_label;

    items = [];

    if (this.has_prefs) {
        items.push(new StyledElements.MenuItem(
            gettext("Preferences"),
            function () {
                var prueba = new Wirecloud.Widget.PreferencesWindowMenu();
                prueba.show(this);
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
        }.bind(this.iGadget)
    ));

    if (this.iGadget.isInFullDragboardMode()) {
        fulldragboard_label = gettext("Exit Full Dragboard");
    } else {
        fulldragboard_label = gettext("Full Dragboard");
    }
    items.push(new StyledElements.MenuItem(
        fulldragboard_label,
        function () {
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
