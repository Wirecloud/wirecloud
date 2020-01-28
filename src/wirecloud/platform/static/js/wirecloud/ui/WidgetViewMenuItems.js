/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

            item = new se.MenuItem(utils.gettext("Rename"), () => {
                this.widget.titleelement.enableEdition();
            });
            item.addIconClass("fa fa-pencil");
            item.setDisabled(!this.widget.model.isAllowed('rename', 'editor'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Reload"), () => {
                this.widget.reload();
            });
            item.addIconClass("fa fa-refresh");
            item.setDisabled(this.widget.model.missing);
            items.push(item);

            item = new se.MenuItem(utils.gettext("Upgrade/Downgrade"), () => {
                var dialog = new Wirecloud.ui.UpgradeWindowMenu(this.widget.model);
                dialog.show();
            });
            item.addIconClass("fa fa-retweet");
            item.setDisabled(!this.widget.model.isAllowed('upgrade', 'editor') || !Wirecloud.LocalCatalogue.hasAlternativeVersion(this.widget.model.meta));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Logs"), () => {
                this.widget.showLogs();
            });
            item.addIconClass("fa fa-tags");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), () => {
                this.widget.showSettings();
            });
            item.addIconClass("fa fa-cog");
            item.setDisabled(!this.widget.model.hasPreferences() || !this.widget.model.isAllowed('configure', 'editor'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("User's Manual"), () => {
                var myresources_view = Wirecloud.UserInterfaceManager.views.myresources;
                myresources_view.createUserCommand('showDetails', this.widget.model.meta, {
                        version: this.widget.model.meta.version,
                        tab: utils.gettext('Documentation')
                    })();
            });
            item.addIconClass("fa fa-book");
            item.setDisabled(this.widget.model.meta.doc === '');
            items.push(item);

            items.push(new StyledElements.Separator());

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
            item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
            items.push(item);

            if (this.widget.layout === this.widget.tab.dragboard.fulldragboardLayout) {
                // Other options require exiting first from the full dragboard mode
                return items;
            }

            if (this.widget.layout !== this.widget.tab.dragboard.freeLayout) {
                item = new se.MenuItem(utils.gettext("Extract from grid"), () => {
                    this.widget.moveToLayout(this.widget.tab.dragboard.freeLayout);
                });
                item.addIconClass("fas fa-sign-out-alt");
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                items.push(item);
            }

            if (this.widget.layout !== this.widget.tab.dragboard.baseLayout) {
                item = new se.MenuItem(utils.gettext("Snap to grid"), () => {
                    this.widget.moveToLayout(this.widget.tab.dragboard.baseLayout);
                });
                item.addIconClass("fas fa-sign-in-alt");
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                items.push(item);
            }

            if (this.widget.layout !== this.widget.tab.dragboard.leftLayout) {
                item = new se.MenuItem(utils.gettext("Move to the left sidebar"), () => {
                    this.widget.moveToLayout(this.widget.tab.dragboard.leftLayout);
                });
                item.addIconClass("fas fa-caret-square-left")
                    .setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                items.push(item);
            }

            if (this.widget.layout !== this.widget.tab.dragboard.rightLayout) {
                item = new se.MenuItem(utils.gettext("Move to the right sidebar"), () => {
                    this.widget.moveToLayout(this.widget.tab.dragboard.rightLayout);
                });
                item.addIconClass("fas fa-caret-square-right")
                    .setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                items.push(item);
            }

            return items;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
