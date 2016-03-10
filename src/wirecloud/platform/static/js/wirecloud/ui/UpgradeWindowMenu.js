/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */

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
        if (this.component.meta.version.compareTo(version) < 0) {
            this.acceptButton.setLabel(utils.gettext('Upgrade'));
            this.acceptButton.addClassName('btn-success');
            this.changelog.addClassName('upgrade');
            to_version = version;
            from_version = this.component.meta.version;
        } else {
            this.acceptButton.setLabel(utils.gettext('Downgrade'));
            this.acceptButton.addClassName('btn-danger');
            this.changelog.addClassName('downgrade');
            to_version = this.component.meta.version;
            from_version = version;
        }

        var resource_info = {
            'vendor': this.component.meta.vendor,
            'name': this.component.meta.name,
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

    var UpgradeWindowMenu = function UpgradeWindowMenu(component) {

        var title, versions;

        title = utils.gettext('Upgrading %(component)s');
        title = utils.interpolate(title, {component: component.title});

        this.component = component;

        Wirecloud.ui.WindowMenu.call(this, title, 'wc-upgrade-component-dialog');

        // Get all available versions
        versions = Wirecloud.LocalCatalogue.resourceVersions[this.component.meta.group_id].map(function (component) {return component.version});
        // Remove current version
        versions = versions.filter(function (version) { return component.meta.version.compareTo(version) !== 0});
        // Sort versions
        versions = versions.sort(function (version1, version2) {
            return -version1.compareTo(version2);
        });

        this.version_selector = new StyledElements.Select({'name': "version"});
        this.version_selector.addEventListener('change', request_version.bind(this));
        this.version_selector.addEntries(versions);

        this.changelog = new StyledElements.Container({'extraClass': 'markdown-body loading', 'tagname': 'article'});

        builder.parse(Wirecloud.currentTheme.templates.upgrade_window_menu, {
            currentversion: this.component.meta.version,
            versionselect: this.version_selector,
            changelog: this.changelog
        }).appendTo(this.windowContent);

        // Accept button
        this.acceptButton = new StyledElements.Button({'class': 'btn-accept'});
        this.acceptButton.insertInto(this.windowBottom);
        this.acceptButton.addEventListener("click", function () {
            this.acceptButton.disable();
            var new_version = this.version_selector.getValue();
            var old_version = this.component.meta.version;
            var new_component_id = [this.component.meta.vendor, this.component.meta.name, new_version].join('/');
            var new_component = Wirecloud.LocalCatalogue.getResourceId(new_component_id);

            var _onsuccess_listener = function onsuccess_listener() {
                component.removeEventListener('upgraded', _onsuccess_listener);
                component.removeEventListener('upgradeerror', _onfailure_listener);

                var msg;
                if (new_version.compareTo(old_version) > 0) {
                    msg = utils.gettext("The %(type)s was upgraded to v%(version)s successfully.");
                } else {
                    msg = utils.gettext("The %(type)s was downgraded to v%(version)s successfully.");
                }
                msg = utils.interpolate(msg, {type: component.meta.type, version: new_version});
                component.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

                this._closeListener();
            }.bind(this);

            var _onfailure_listener = function onsuccess_listener() {
                component.removeEventListener('upgraded', _onsuccess_listener);
                component.removeEventListener('upgradeerror', _onfailure_listener);
                this.acceptButton.enable();
            }.bind(this);
            component.addEventListener('upgraded', _onsuccess_listener);
            component.addEventListener('upgradeerror', _onfailure_listener);
            component.meta = new_component;
        }.bind(this));

        // Cancel button
        this.cancelButton = new StyledElements.Button({
            text: utils.gettext('Cancel'),
            'class': 'btn-primary btn-cancel'
        });
        this.cancelButton.addEventListener("click", this._closeListener);
        this.cancelButton.insertInto(this.windowBottom);
    };
    UpgradeWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    UpgradeWindowMenu.prototype.show = function show() {
        Wirecloud.ui.WindowMenu.prototype.show.apply(this, arguments);
        request_version.call(this);
    };

    Wirecloud.ui.UpgradeWindowMenu = UpgradeWindowMenu;

})(StyledElements, StyledElements.Utils);
