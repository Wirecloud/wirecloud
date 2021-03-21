/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

    const canRename = function canRename() {
        return !this.component._component.volatile && this.component.type === 'widget';
    };

    const canUpgrade = function canUpgrade() {
        return this.component._component.isAllowed('upgrade', 'editor') && Wirecloud.LocalCatalogue.hasAlternativeVersion(this.component._component.meta);
    };

    const canShowSettings = function canShowSettings() {
        return this.component.hasSettings() && this.component._component.isAllowed('configure', 'editor');
    };

    const showRenameModal = function showRenameModal() {
        const dialog = new Wirecloud.ui.FormWindowMenu(
            [
                {name: 'title', label: utils.gettext("Title"), type: 'text', placeholder: this.component.title},
            ],
            utils.interpolate(utils.gettext("Rename %(type)s"), this.component),
            "wc-component-rename-modal");

        dialog.executeOperation = function (data) {
            if (data.title) {
                this.component._component.rename(data.title);
            }
        }.bind(this);

        dialog.show();
        dialog.setValue({title: this.component.title});
    };

    /**
     * Create a new instance of class ComponentPrefs.
     * @extends {DynamicMenuItems}
     *
     * @constructor
     */
    ns.ComponentPrefs = class ComponentPrefs extends se.DynamicMenuItems {

        constructor(component) {
            super();
            this.component = component;
        }

        _createMenuItem(title, iconClass, onclick, isEnabled) {
            const item = new se.MenuItem(title, onclick);
            item.addIconClass(iconClass);

            if (isEnabled != null) {
                item.enabled = isEnabled.call(this);
            }

            return item;
        }

        /**
         * @override
         */
        build() {
            return [
                this._createMenuItem(utils.gettext("Rename"), "fas fa-pencil-alt", function () {
                    showRenameModal.call(this);
                }.bind(this), canRename),
                this._createMenuItem(utils.gettext("Upgrade/Downgrade"), "fas fa-retweet", function () {
                    const dialog = new Wirecloud.ui.UpgradeWindowMenu(this.component._component);
                    dialog.show();
                }.bind(this), canUpgrade),
                this._createMenuItem(utils.gettext("Logs"), "fas fa-tags", function () {
                    this.component.showLogs();
                }.bind(this)),
                this._createMenuItem(utils.gettext("Settings"), "fas fa-cog", function () {
                    this.component.showSettings();
                }.bind(this), canShowSettings)
            ];
        }

    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
