/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (se, utils) {

    "use strict";

    var builder = new se.GUIBuilder();

    var request_version = function request_version() {
        var from_version, to_version, version;

        if (this.current_request != null) {
            this.current_request.abort();
        }

        this.changelog.disable();
        this.changelog.removeClassName(['downgrade', 'upgrade']);
        this.acceptButton.removeClassName(['btn-success', 'btn-danger']);

        version = this.version_selector.getValue();
        if (this.model.meta.version.compareTo(version) < 0) {
            this.acceptButton.setLabel(utils.gettext('Upgrade'));
            this.acceptButton.addClassName('btn-success');
            this.changelog.addClassName('upgrade');
            to_version = version;
            from_version = this.model.meta.version;
        } else {
            this.acceptButton.setLabel(utils.gettext('Downgrade'));
            this.acceptButton.addClassName('btn-danger');
            this.changelog.addClassName('downgrade');
            to_version = this.model.meta.version;
            from_version = version;
        }

        var resource_info = {
            'vendor': this.model.meta.vendor,
            'name': this.model.meta.name,
            'version': to_version
        };
        var url = Wirecloud.LocalCatalogue.RESOURCE_CHANGELOG_ENTRY.evaluate(resource_info);
        this.current_request = Wirecloud.io.makeRequest(url, {
            method: 'GET',
            parameters: {
                from: from_version
            },
            on404: function (response) {
                this.changelog.removeClassName(['upgrade', 'downgrade']);
                var msg = utils.gettext('There is not change information between versions %(from_version)s and %(to_version)s');
                this.changelog.clear().appendChild(utils.interpolate(msg, {from_version: from_version, to_version: to_version}));
            }.bind(this),
            onFailure: function (response) {
                this.changelog.removeClassName(['upgrade', 'downgrade']);
                var msg = utils.gettext('Unable to retrieve change log information');
                this.changelog.clear().appendChild(msg);
            }.bind(this),
            onSuccess: function (response) {
                this.changelog.clear().appendChild(new se.Fragment(response.responseText));
            }.bind(this),
            onComplete: function () {
                this.current_request = null;
                this.changelog.enable();
            }.bind(this)
        });
    };

    var UpgradeWindowMenu = function UpgradeWindowMenu(model) {
        var versions;

        Wirecloud.ui.WindowMenu.call(this, utils.gettext("Available versions"), 'wc-upgrade-component-modal');
        this.model = model;

        // Get all available versions
        versions = Wirecloud.LocalCatalogue.resourceVersions[this.model.meta.group_id].map(function (resource) {
            return resource.version;
        });
        // Remove current version
        versions = versions.filter(function (version) {
            return model.meta.version.compareTo(version) !== 0;
        });
        // Sort versions
        versions = versions.sort(function (version1, version2) {
            return -version1.compareTo(version2);
        });

        this.version_selector = new se.Select({'name': "version"});
        this.version_selector.addEventListener('change', request_version.bind(this));
        this.version_selector.addEntries(versions);

        this.changelog = new se.Container({class: 'markdown-body loading', tagname: 'article'});

        builder.parse(Wirecloud.currentTheme.templates['wirecloud/modals/upgrade_downgrade_component'], {
            currentversion: this.model.meta.version,
            versionselect: this.version_selector,
            changelog: this.changelog
        }).appendTo(this.windowContent);

        // Accept button
        this.acceptButton = new se.Button({'class': 'btn-accept'});
        this.acceptButton.insertInto(this.windowBottom);
        this.acceptButton.addEventListener("click", function (button) {
            var new_version = this.version_selector.getValue();
            var new_resource_id = [this.model.meta.vendor, this.model.meta.name, new_version].join('/');

            button.disable();
            model.upgrade(Wirecloud.LocalCatalogue.getResourceId(new_resource_id)).then(function (model) {
                button.enable();
                this._closeListener();
            }.bind(this), function (reason) {
                button.enable();
            });
        }.bind(this));

        // Cancel button
        this.cancelButton = new se.Button({
            text: utils.gettext('Cancel'),
            'class': 'btn-default btn-cancel'
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);
    };
    utils.inherit(UpgradeWindowMenu, Wirecloud.ui.WindowMenu);

    UpgradeWindowMenu.prototype.show = function show() {
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        request_version.call(this);
    };

    Wirecloud.ui.UpgradeWindowMenu = UpgradeWindowMenu;

})(StyledElements, StyledElements.Utils);
