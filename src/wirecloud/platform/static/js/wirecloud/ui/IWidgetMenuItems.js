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

        item = new StyledElements.MenuItem(
            gettext('Rename'),
            function () {
                this.titleelement.enableEdition();
            }.bind(this.iWidget)
        );
        item.setDisabled(!this.iWidget.isAllowed('rename'));
        items.push(item);

        item = new StyledElements.MenuItem(
            gettext("Settings"),
            function () {
                var dialog = new Wirecloud.Widget.PreferencesWindowMenu();
                dialog.show(this);
            }.bind(this.iWidget.internal_iwidget)
        );
        item.setDisabled(!this.has_prefs || !this.iWidget.isAllowed('configure'));
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
                    var prev = this.content.src;
                    this.content.src = this.codeURL;
                    if (this.content.src === prev) {
                        this.content.contentDocument.location.reload();
                    }
                } catch (e) {}
            }.bind(this.iWidget)
        ));

        item = new StyledElements.MenuItem(
            gettext("User's Manual"),
            function () {
                var myresources_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
                myresources_view.createUserCommand('showDetails', this.widget, {
                        version: this.widget.version,
                        tab: 'Documentation'
                    })();
            }.bind(this.iWidget)
        );
        item.setDisabled(this.iWidget.widget.doc === '');
        items.push(item);

        if (this.iWidget.isInFullDragboardMode()) {
            fulldragboard_label = gettext("Exit Full Dragboard");
        } else {
            fulldragboard_label = gettext("Full Dragboard");
        }
        item = new StyledElements.MenuItem(
            fulldragboard_label,
            function () {
                this.setFullDragboardMode(!this.isInFullDragboardMode());
            }.bind(this.iWidget)
        );
        item.setDisabled(!this.iWidget.isAllowed('move'));
        items.push(item);

        if (!this.iWidget.isInFullDragboardMode()) {
            if (this.iWidget.onFreeLayout()) {
                layout_label = gettext("Snap to grid");
            } else {
                layout_label = gettext("Extract from grid");
            }
            item = new StyledElements.MenuItem(
                layout_label,
                this.iWidget.toggleLayout.bind(this.iWidget)
            );
            item.setDisabled(!this.iWidget.isAllowed('move'));
            items.push(item);
        }

        return items;
    };

    Wirecloud.ui.IWidgetMenuItems = IWidgetMenuItems;

})();
