/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var IWidgetMenuItems = function IWidgetMenuItems(iWidget) {
        StyledElements.DynamicMenuItems.call(this);

        this.iWidget = iWidget;
        this.has_prefs = iWidget.widget.preferenceList.length > 0;
    };
    IWidgetMenuItems.prototype = new StyledElements.DynamicMenuItems();

    IWidgetMenuItems.prototype.build = function () {
        var items, item, fulldragboard_label, layout_label;

        items = [];

        items.push(new StyledElements.MenuItem(
            gettext('Rename'),
            function () {
                this.titleelement.enableEdition();
            }.bind(this.iWidget)
        ));

        item = new StyledElements.MenuItem(
            gettext("Settings"),
            function () {
                var dialog = new Wirecloud.Widget.PreferencesWindowMenu();
                dialog.show(this);
            }.bind(this.iWidget.internal_iwidget)
        );
        item.setDisabled(!this.has_prefs);
        items.push(item);

        items.push(new StyledElements.MenuItem(
            gettext("Logs"),
            function () {
                var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
                dialog.show();
            }.bind(this.iWidget.internal_iwidget)
        ));

        items.push(new StyledElements.MenuItem(
            gettext("Reload"),
            function () {
                try {
                    this.content.contentDocument.location.reload();
                } catch (e) {}
            }.bind(this.iWidget)
        ));

        items.push(new StyledElements.MenuItem(
            gettext("User's Manual"),
            function () {
                window.open(this.widget.getUriWiki(), '_blank');
            }.bind(this.iWidget)
        ));

        if (this.iWidget.isInFullDragboardMode()) {
            fulldragboard_label = gettext("Exit Full Dragboard");
        } else {
            fulldragboard_label = gettext("Full Dragboard");
        }
        items.push(new StyledElements.MenuItem(
            fulldragboard_label,
            function () {
                this.setFullDragboardMode(!this.isInFullDragboardMode());
            }.bind(this.iWidget)
        ));

        if (!this.iWidget.isInFullDragboardMode()) {
            if (this.iWidget.onFreeLayout()) {
                layout_label = gettext("Snap to grid");
            } else {
                layout_label = gettext("Extract from grid");
            }
            items.push(new StyledElements.MenuItem(
                layout_label,
                this.iWidget.toggleLayout.bind(this.iWidget)
            ));
        }

        return items;
    };

    Wirecloud.ui.IWidgetMenuItems = IWidgetMenuItems;

})();
