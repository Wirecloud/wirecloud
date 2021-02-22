/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    ns.SharingWindowMenu = class SharingWindowMenu extends ns.WindowMenu {

        constructor(workspace) {
            var i, options, subtitle1, subtitle2;

            super(utils.gettext("Sharing settings"), 'wc-dashboard-share-modal');

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

            this.inputSearch = new se.TextField({placeholder: utils.gettext("Add a person, a group or an organization"), class: "wc-dashboard-share-input"});
            this.inputSearch.appendTo(this.windowContent);

            this.inputSearchTypeahead = new Wirecloud.ui.UserGroupTypeahead({autocomplete: false});

            this.inputSearchTypeahead.bind(this.inputSearch);
            this.inputSearchTypeahead.addEventListener('select', (typeahead, menuitem) => {
                appendUser.call(this, menuitem.context);
            });

            this.userGroup = new se.Container({class: "wc-dashboard-share-list"});
            this.userGroup.appendTo(this.windowContent);

            this.users = {};
            this.groups = {};
            this.sharelist = [];

            workspace.model.users.forEach((user) => {
                appendUser.call(this, {
                    accesslevel: user.accesslevel,
                    fullname: user.fullname,
                    name: user.username,
                    type: user.organization ? "organization" : "user"
                });
            });
            workspace.model.groups.forEach((group) => {
                appendUser.call(this, {
                    accesslevel: group.accesslevel,
                    name: group.name,
                    organization: false,
                    type: "group"
                });
            });

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
        }

    }

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

        this.workspace.model.preferences.set({
            public: {value: this.visibilityOptions.value === "public" || this.visibilityOptions.value === "public-auth"},
            requireauth: {value: this.visibilityOptions.value !== "public"},
            sharelist: {value: this.sharelist}
        }).then(
            () => {
                this.workspace.model.users.length = 0;
                this.workspace.model.groups.length = 0;
                this.sharelist.forEach((item) => {
                    if (item.type === "group") {
                        this.workspace.model.groups.push({
                            name: item.name,
                            accesslevel: item.accesslevel
                        });
                    } else {
                        this.workspace.model.users.push({
                            fullname: item.fullname,
                            username: item.name,
                            organization: item.organization,
                            accesslevel: item.accesslevel
                        });
                    }
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
        if (
            (data.type === "user" || data.type === "organization") && data.name in this.users
            || data.type === "group" && data.name in this.groups
        ) {
            // This user is already taken.
            return this;
        }
        this[data.type === "group" ? "groups" : "users"][data.name] = data;
        this.sharelist.push(data);

        let fullname = data.fullname || data.name;
        if (data.name === Wirecloud.contextManager.get('username')) {
            fullname = utils.interpolate(utils.gettext("%(fullname)s (You)"), {fullname: fullname});
            data.accesslevel = "owner";
        } else {
            data.accesslevel = "read";
        }

        let template = Wirecloud.currentTheme.templates['wirecloud/workspace/sharing_user'];
        let createdElement = builder.parse(template, {
            fullname: fullname,
            icon: function () {
                var icon = document.createElement('i');
                icon.className = "fas fa-" + (data.type === "group" ? "users" : (data.type === "organization" ? "building" : "user")) + " fa-stack-1x";
                return icon;
            },
            username: data.name,
            permission: () => {
                var span = document.createElement('span');
                span.textContent = data.accesslevel === 'owner' ? utils.gettext("Owner") : utils.gettext("Can view");
                return span;
            },
            btndelete: () => {
                var button = new se.Button({class: "btn-remove-user", plain: true, iconClass: "fas fa-times", title: utils.gettext("Remove")});

                if (data.accesslevel === 'owner') {
                    button.disable();
                } else {
                    button.addEventListener('click', () => {
                        this.userGroup.removeChild(createdElement);
                        delete this[data.type === "group" ? "groups" : "users"][data.name];
                        utils.removeFromArray(this.sharelist, data);
                    });
                }

                return button;
            }
        }).elements[1];

        this.userGroup.appendChild(createdElement);

        return this;
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
