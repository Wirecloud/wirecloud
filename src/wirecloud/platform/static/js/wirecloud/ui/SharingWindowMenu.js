/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2019 Future Internet Consulting and Development Solutions S.L.
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

    ns.SharingWindowMenu = function SharingWindowMenu(workspace) {
        var i, options, subtitle1, subtitle2;

        ns.WindowMenu.call(this, utils.gettext("Sharing settings"), 'wc-dashboard-share-modal');

        this.workspace = workspace;

        subtitle1 = document.createElement('h4');
        subtitle1.textContent = utils.gettext("Visibility options");
        this.windowContent.appendChild(subtitle1);

        options = [
            {name: 'public', iconClass: "fa fa-globe", title: utils.gettext("Public"), description: utils.gettext("Anyone on the Internet can find and access this dashboard.")},
            {name: 'public-auth', iconClass: "fas fa-id-card", title: utils.gettext("Registered User"), description: utils.gettext("Anyone on the Internet can find this dashboard. Only registered users can access it.")},
            {name: 'private', iconClass: "fa fa-lock", title: utils.gettext("Private"), description: utils.gettext("Shared with specific people and organizations.")}
        ];

        this.visibilityOptions = new se.ButtonsGroup('visibility');

        for (i = 0; i < options.length; i++) {
            appendOption.call(this, options[i]);
        }

        subtitle2 = document.createElement('h4');
        subtitle2.textContent = utils.gettext("Users and groups with access");
        this.windowContent.appendChild(subtitle2);

        this.inputSearch = new se.TextField({placeholder: utils.gettext("Add a person or an organization"), class: "wc-dashboard-share-input"});
        this.inputSearch.appendTo(this.windowContent);

        this.inputSearchTypeahead = new Wirecloud.ui.UserTypeahead({autocomplete: false});

        this.inputSearchTypeahead.bind(this.inputSearch);
        this.inputSearchTypeahead.addEventListener('select', (typeahead, menuItem) => {
            appendUser.call(this, menuItem.context);
        });

        this.userGroup = new se.Container({class: "wc-dashboard-share-list"});
        this.userGroup.appendTo(this.windowContent);

        this.sharingUsers = {};

        for (i = 0; i < workspace.model.users.length; i++) {
            appendUser.call(this, workspace.model.users[i]);
        }

        // windowmenu - footer

        this.btnAccept = new se.Button({text: utils.gettext("Save"), state: "primary", class: 'btn-accept'});
        this.btnAccept.appendTo(this.windowBottom);
        this.btnAccept.addEventListener('click', accept.bind(this));

        this.btnCancel = new se.Button({text: utils.gettext("Cancel"), class: 'btn-cancel'});
        this.btnCancel.appendTo(this.windowBottom);
        this.btnCancel.addEventListener('click', this._closeListener);

        if (!workspace.model.preferences.get('public')) {
            this.visibilityOptions.setValue('private');
        } else {
            this.visibilityOptions.setValue(workspace.model.preferences.get('requireauth') ? 'public-auth' : 'public');
        }
        this.visibilityOptions.addEventListener('change', on_visibility_option_change.bind(this));
        on_visibility_option_change.call(this);
    };
    utils.inherit(ns.SharingWindowMenu, Wirecloud.ui.WindowMenu);

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var builder = new se.GUIBuilder();

    var on_visibility_option_change = function on_visibility_option_change() {
        this.inputSearch.setDisabled(this.visibilityOptions.value !== 'private');
        this.userGroup.setDisabled(this.visibilityOptions.value !== 'private');
    };

    var accept = function accept() {
        this.btnAccept.disable().addClassName('busy');
        this.btnCancel.disable();

        const sharelist = Object.values(this.sharingUsers);
        this.workspace.model.preferences.set({
            public: {value: this.visibilityOptions.value === "public" || this.visibilityOptions.value === "public-auth"},
            requireauth: {value: this.visibilityOptions.value !== "public"},
            sharelist: {value: sharelist}
        }).then(
            () => {
                this.workspace.model.users.length = 0;
                sharelist.forEach((user) => {
                    this.workspace.model.users.push(user);
                });

                this._closeListener();
            }, () => {
                this.btnAccept.enable().removeClassName('busy');
                this.btnCancel.enable();
            }
        );
    };

    var appendOption = function appendOption(data) {
        let template = Wirecloud.currentTheme.templates['wirecloud/workspace/visibility_option'];

        builder.parse(template, {
            radiobutton: function () {
                return new se.RadioButton({group: this.visibilityOptions, value: data.name});
            }.bind(this),
            image: function () {
                var icon = document.createElement('span');
                icon.className = data.iconClass;
                return icon;
            }.bind(this),
            title: data.title,
            description: data.description
        }).appendTo(this.windowContent);

        return this;
    };

    var appendUser = function appendUser(data) {
        var createdElement;

        if (data.username in this.sharingUsers) {
            // This user is already taken.
            return this;
        }
        this.sharingUsers[data.username] = data;

        var fullname = data.fullname;
        if (data.username === Wirecloud.contextManager.get('username')) {
            fullname = utils.interpolate(utils.gettext("%(fullname)s (You)"), {fullname: data.fullname});
            data.accesslevel = "owner";
        } else {
            data.accesslevel = "read";
        }

        let template = Wirecloud.currentTheme.templates['wirecloud/workspace/sharing_user'];
        createdElement = builder.parse(template, {
            fullname: fullname,
            icon: function () {
                var icon = document.createElement('i');
                icon.className = data.organization ? "fa fa-building fa-stack-1x" : "fa fa-user fa-stack-1x";
                return icon;
            },
            username: data.username,
            permission: function () {
                var span = document.createElement('span');

                if (data.accesslevel === 'owner') {
                    span.textContent = utils.gettext("Owner");
                } else {
                    span.textContent = utils.gettext("Can view");
                }

                return span;
            },
            btndelete: function () {
                var button = new se.Button({class: "btn-remove-user", plain: true, iconClass: "fa fa-remove", title: utils.gettext("Remove")});

                if (data.accesslevel === 'owner') {
                    button.disable();
                } else {
                    button.addEventListener('click', function () {
                        this.userGroup.removeChild(createdElement);
                        delete this.sharingUsers[data.username];
                    }.bind(this));
                }

                return button;
            }.bind(this)
        }).elements[1];

        this.userGroup.appendChild(createdElement);

        return this;
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
