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
            item.addIconClass("fas fa-pencil-alt");
            item.setDisabled(!this.widget.model.isAllowed('rename', 'editor'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Reload"), () => {
                this.widget.reload();
            });
            item.addIconClass("fas fa-sync");
            item.setDisabled(this.widget.model.missing);
            items.push(item);

            item = new se.MenuItem(utils.gettext("Upgrade/Downgrade"), () => {
                var dialog = new Wirecloud.ui.UpgradeWindowMenu(this.widget.model);
                dialog.show();
            });
            item.addIconClass("fas fa-retweet");
            item.setDisabled(!this.widget.model.isAllowed('upgrade', 'editor') || !Wirecloud.LocalCatalogue.hasAlternativeVersion(this.widget.model.meta));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Logs"), () => {
                this.widget.showLogs();
            });
            item.addIconClass("fas fa-tags");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), () => {
                this.widget.showSettings();
            });
            item.addIconClass("fas fa-cog");
            item.setDisabled(!this.widget.model.hasPreferences() || !this.widget.model.isAllowed('configure', 'editor'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("User's Manual"), () => {
                var myresources_view = Wirecloud.UserInterfaceManager.views.myresources;
                myresources_view.createUserCommand('showDetails', this.widget.model.meta, {
                    version: this.widget.model.meta.version,
                    tab: utils.gettext('Documentation')
                })();
            });
            item.addIconClass("fas fa-book");
            item.setDisabled(this.widget.model.meta.doc === '');
            items.push(item);

            items.push(new StyledElements.Separator());

            if (this.widget.layout === this.widget.tab.dragboard.freeLayout) {
                let submenu = new se.SubMenuItem("Placement");
                items.push(submenu.addIconClass("fas fa-thumbtack"));

                let halignmenu = new se.SubMenuItem("Horizontal Align", {iconClass: 'fas fa-arrows-alt-h'});
                halignmenu.append(new se.MenuItem(
                    utils.gettext("Left"),
                    {
                        enabled: !this.widget.position.anchor.endsWith("left"),
                        iconClass: "fas fa-align-left",
                        handler: (context) => {
                            let vertical = this.widget.position.anchor.split('-')[0];
                            this.widget.setPosition({anchor: vertical + "-left"});
                        }
                    }
                ));
                halignmenu.append(new se.MenuItem(
                    utils.gettext("Center"),
                    {
                        enabled: !this.widget.position.anchor.endsWith("center"),
                        iconClass: "fas fa-align-center",
                        handler: (context) => {
                            let vertical = this.widget.position.anchor.split('-')[0];
                            this.widget.setPosition({anchor: vertical + "-center"});
                        }
                    }
                ));
                halignmenu.append(new se.MenuItem(
                    utils.gettext("Right"),
                    {
                        enabled: !this.widget.position.anchor.endsWith("right"),
                        iconClass: "fas fa-align-right",
                        handler: (context) => {
                            let vertical = this.widget.position.anchor.split('-')[0];
                            this.widget.setPosition({anchor: vertical + "-right"});
                        }
                    }
                ));
                submenu.append(halignmenu);

                let valignmenu = new se.SubMenuItem("Vertical Align", {iconClass: 'fas fa-arrows-alt-v'});
                valignmenu.append(new se.MenuItem(
                    utils.gettext("Top"),
                    {
                        enabled: this.widget.position.anchor.startsWith("bottom"),
                        iconClass: "fas fa-arrow-up",
                        handler: (context) => {
                            let horizontal = this.widget.position.anchor.split('-')[1];
                            this.widget.setPosition({anchor: "top-" + horizontal});
                        }
                    }
                ));
                valignmenu.append(new se.MenuItem(
                    utils.gettext("Bottom"),
                    {
                        enabled: this.widget.position.anchor.startsWith("top"),
                        iconClass: "fas fa-arrow-down",
                        handler: (context) => {
                            let horizontal = this.widget.position.anchor.split('-')[1];
                            this.widget.setPosition({anchor: "bottom-" + horizontal});
                        }
                    }
                ));
                submenu.append(valignmenu).appendSeparator();

                let title = this.widget.position.relx ? utils.gettext("Absolute x") : utils.gettext("Relative x");
                item = new se.MenuItem(title, () => {
                    const layout = this.widget.layout;
                    if (this.widget.position.relx) {
                        let margin = this.widget.position.anchor.endsWith("left") ? layout.dragboard.leftMargin : layout.dragboard.rightMargin;
                        this.widget.setPosition({relx: false, x: layout.getColumnOffset(this.widget.position) - margin});
                    } else {
                        this.widget.setPosition({relx: true, x: layout.adaptColumnOffset(layout.getColumnOffset(this.widget.position) + 'px').inLU});
                    }
                });
                item.addIconClass("fas " + (this.widget.position.relx ? "fa-ruler" : "fa-percentage"));
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                submenu.append(item);

                title = this.widget.position.rely ? utils.gettext("Absolute y") : utils.gettext("Relative y");
                item = new se.MenuItem(title, () => {
                    const layout = this.widget.layout;
                    if (this.widget.position.rely) {
                        let margin = this.widget.position.anchor.startsWith("top") ? layout.dragboard.topMargin : layout.dragboard.bottomMargin;
                        this.widget.setPosition({rely: false, y: layout.getRowOffset(this.widget.position) - margin});
                    } else {
                        this.widget.setPosition({rely: true, y: layout.adaptRowOffset(layout.getRowOffset(this.widget.position) + 'px').inLU});
                    }
                });
                item.addIconClass("fas " + (this.widget.position.rely ? "fa-ruler" : "fa-percentage"));
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                submenu.append(item);

                title = this.widget.shape.relwidth ? utils.gettext("Absolute width") : utils.gettext("Relative width");
                item = new se.MenuItem(title, () => {
                    const layout = this.widget.layout;
                    if (this.widget.shape.relwidth) {
                        this.widget.setShape({relwidth: false, width: layout.getWidthInPixels(this.widget.shape.width)});
                    } else {
                        this.widget.setShape({relwidth: true, width: layout.adaptWidth(this.widget.shape.width + 'px').inLU});
                    }
                });
                item.addIconClass("fas " + (this.widget.shape.relwidth ? "fa-ruler" : "fa-percentage"));
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                submenu.append(item);

                title = this.widget.shape.relheight ? utils.gettext("Absolute height") : utils.gettext("Relative height");
                item = new se.MenuItem(title, () => {
                    const layout = this.widget.layout;
                    if (this.widget.shape.relheight) {
                        this.widget.setShape({relheight: false, height: layout.getHeightInPixels(this.widget.shape.height)});
                    } else {
                        this.widget.setShape({relheight: true, height: layout.adaptHeight(this.widget.shape.height + 'px').inLU});
                    }
                });
                item.addIconClass("fas " + (this.widget.shape.relheight ? "fa-ruler" : "fa-percentage"));
                item.setDisabled(!this.widget.model.isAllowed('move', 'editor'));
                submenu.append(item);
            }

            if (this.widget.layout === this.widget.tab.dragboard.fulldragboardLayout) {
                item_icon = "fas fa-compress";
                item_title = utils.gettext("Exit Full Dragboard");
            } else {
                item_icon = "fas fa-expand";
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
