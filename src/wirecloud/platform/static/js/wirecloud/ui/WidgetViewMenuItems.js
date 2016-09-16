/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    ns.WidgetViewMenuItems = function WidgetViewMenuItems(widget) {
        se.DynamicMenuItems.call(this);

        Object.defineProperties(this, {
            widget: {
                value: widget
            }
        });
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WidgetViewMenuItems, se.DynamicMenuItems, {

        /**
         * @override
         */
        build: function build() {
            var item, items, item_title, item_icon;

            items = [];

            item = new se.MenuItem(utils.gettext("Rename"), function () {
                this.titleelement.enableEdition();
            }.bind(this.widget));
            item.addIconClass("fa fa-pencil");
            item.setDisabled(!this.widget.model.isAllowed('rename'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Reload"), function () {
                this.reload();
            }.bind(this.widget));
            item.addIconClass("fa fa-refresh");
            item.setDisabled(this.widget.model.missing);
            items.push(item);

            item = new se.MenuItem(utils.gettext("Upgrade/Downgrade"), function () {
                var dialog = new Wirecloud.ui.UpgradeWindowMenu(this.model);
                dialog.show();
            }.bind(this.widget));
            item.addIconClass("fa fa-retweet");
            item.setDisabled(!this.widget.model.isAllowed('upgrade') || !Wirecloud.LocalCatalogue.hasAlternativeVersion(this.widget.model.meta));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Logs"), function () {
                this.showLogs();
            }.bind(this.widget));
            item.addIconClass("fa fa-tags");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), function () {
                this.showSettings();
            }.bind(this.widget));
            item.addIconClass("fa fa-cog");
            item.setDisabled(!this.widget.model.hasPreferences() || !this.widget.model.isAllowed('configure'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("User's Manual"), function () {
                var myresources_view = Wirecloud.UserInterfaceManager.views.myresources;
                myresources_view.createUserCommand('showDetails', this.model.meta, {
                        version: this.model.meta.version,
                        tab: utils.gettext('Documentation')
                    })();
            }.bind(this.widget));
            item.addIconClass("fa fa-book");
            item.setDisabled(this.widget.model.meta.doc === '');
            items.push(item);

            if (this.widget.layout === this.widget.tab.dragboard.fulldragboardLayout) {
                item_icon = "fa fa-compress";
                item_title = utils.gettext("Exit Full Dragboard");
            } else {
                item_icon = "fa fa-expand";
                item_title = utils.gettext("Full Dragboard");
            }

            item = new se.MenuItem(item_title, function () {
                // Works like a toggle button
                this.setFullDragboardMode(this.layout !== this.tab.dragboard.fulldragboardLayout);
            }.bind(this.widget));
            item.addIconClass(item_icon);
            item.setDisabled(!this.widget.model.isAllowed('move'));
            items.push(item);

            if (this.widget.layout !== this.widget.tab.dragboard.fulldragboardLayout) {
                if (this.widget.layout === this.widget.tab.dragboard.freeLayout) {
                    item_icon = "fa fa-sign-in";
                    item_title = utils.gettext("Snap to grid");
                } else {
                    item_icon = "fa fa-sign-out";
                    item_title = utils.gettext("Extract from grid");
                }

                item = new se.MenuItem(item_title, function () {
                    this.toggleLayout();
                }.bind(this.widget));
                item.addIconClass(item_icon);
                item.setDisabled(!this.widget.model.isAllowed('move'));
                items.push(item);
            }

            return items;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
