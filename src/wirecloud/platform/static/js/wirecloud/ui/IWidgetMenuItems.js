/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals LayoutManagerFactory, StyledElements, Wirecloud */

(function (utils) {

    "use strict";

    var IWidgetMenuItems = function IWidgetMenuItems(iwidget) {
        StyledElements.DynamicMenuItems.call(this);

        this.iWidget = iwidget;
        this.model = iwidget.internal_iwidget;
        this.has_prefs = iwidget.widget.preferenceList.length > 0;
    };
    IWidgetMenuItems.prototype = new StyledElements.DynamicMenuItems();

    IWidgetMenuItems.prototype.build = function () {
        var items, item, fulldragboard_label, fulldragboard_icon, layout_label, layout_icon, view;

        view = this.iWidget.internal_view;
        items = [];

        item = new StyledElements.MenuItem(
            utils.gettext('Rename'),
            function () {
                this.titleelement.enableEdition();
            }.bind(view)
        );
        item.addIconClass('fa fa-pencil').setDisabled(!this.model.isAllowed('rename'));
        items.push(item);

        item = new StyledElements.MenuItem(
            utils.gettext("Settings"),
            function () {
                var dialog = new Wirecloud.Widget.PreferencesWindowMenu();
                dialog.show(this);
            }.bind(this.model)
        );
        item.setDisabled(!this.has_prefs || !this.model.isAllowed('configure'));
        item.addIconClass('fa fa-gear');
        items.push(item);

        item = new StyledElements.MenuItem(
            utils.gettext("Logs"),
            function () {
                var dialog = new Wirecloud.ui.LogWindowMenu(this.logManager);
                dialog.show();
            }.bind(this.model)
        );
        item.addIconClass('fa fa-tags');
        items.push(item);

        item = new StyledElements.MenuItem(
            utils.gettext("Upgrade/Downgrade"),
            function () {
                var dialog = new Wirecloud.ui.UpgradeWindowMenu(this);
                dialog.show();
            }.bind(this.model)
        );
        item.addIconClass('fa fa-retweet');
        item.setDisabled(!this.model.isAllowed('upgrade') || !Wirecloud.LocalCatalogue.hasAlternativeVersion(this.model.meta));
        items.push(item);

        item = new StyledElements.MenuItem(utils.gettext("Reload"), view.reload.bind(view))
        item.addIconClass('fa fa-refresh');
        item.setDisabled(this.model.meta.missing);
        items.push(item);

        item = new StyledElements.MenuItem(
            utils.gettext("User's Manual"),
            function () {
                var myresources_view = LayoutManagerFactory.getInstance().viewsByName.myresources;
                myresources_view.createUserCommand('showDetails', this.widget, {
                        version: this.widget.version,
                        tab: 'Documentation'
                    })();
            }.bind(this.model)
        );
        item.addIconClass('fa fa-book');
        item.setDisabled(this.model.meta.doc === '');
        items.push(item);

        if (this.iWidget.isInFullDragboardMode()) {
            fulldragboard_label = utils.gettext("Exit Full Dragboard");
            fulldragboard_icon = 'fa fa-compress';
        } else {
            fulldragboard_label = utils.gettext("Full Dragboard");
            fulldragboard_icon = 'fa fa-expand';
        }
        item = new StyledElements.MenuItem(
            fulldragboard_label,
            function () {
                this.setFullDragboardMode(!this.isInFullDragboardMode());
            }.bind(this.iWidget)
        );
        item.addIconClass(fulldragboard_icon);
        item.setDisabled(!this.model.isAllowed('move'));
        items.push(item);

        if (!this.iWidget.isInFullDragboardMode()) {
            if (this.iWidget.onFreeLayout()) {
                layout_label = utils.gettext("Snap to grid");
                layout_icon = 'fa fa-sign-in';
            } else {
                layout_label = utils.gettext("Extract from grid");
                layout_icon = 'fa fa-sign-out';
            }
            item = new StyledElements.MenuItem(
                layout_label,
                this.iWidget.toggleLayout.bind(this.iWidget)
            );
            item.addIconClass(layout_icon);
            item.setDisabled(!this.model.isAllowed('move'));
            items.push(item);
        }

        return items;
    };

    Wirecloud.ui.IWidgetMenuItems = IWidgetMenuItems;

})(Wirecloud.Utils);
