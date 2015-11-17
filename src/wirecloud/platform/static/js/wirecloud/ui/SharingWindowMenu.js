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


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    ns.SharingWindowMenu = function SharingWindowMenu(workspace) {
        var builder, i, options, subtitle1, subtitle2, template;

        ns.WindowMenu.call(this, utils.gettext("Sharing settings"));

        builder = new se.GUIBuilder();

        subtitle1 = document.createElement('h4');
        subtitle1.textContent = utils.gettext("Visibility options");
        this.windowContent.appendChild(subtitle1);

        options = [
            {name: 'public', iconClass: "icon-globe", title: utils.gettext("Public"), description: utils.gettext("Anyone on the Internet can find and access this dashboard.")},
            {name: 'private', iconClass: "icon-lock", title: utils.gettext("Private"), description: utils.gettext("Shared with specific people and organizations.")}
        ];

        this.visibilityOptions = new se.ButtonsGroup('visibility');
        template = Wirecloud.currentTheme.templates['visibility_option'];

        for (i = 0; i < options.length; i++) {
            appendOption.call(this, options[i], builder, template);
        }

        subtitle2 = document.createElement('h4');
        subtitle2.textContent = utils.gettext("Users and groups with access");
        this.windowContent.appendChild(subtitle2);

        this.inputSearch = new se.TextField({placeholder: utils.gettext("Add a person or an organization"), class: "wc-dashboard-share-input"});
        this.inputSearch.appendTo(this.windowContent);

        this.inputSearchTypeahead = new se.Typeahead({
            autocomplete: false,
            dataFiltered: true,
            lookup: searchForUser,
            build: function build(typeahead, data) {
                return {
                    title: data.fullname,
                    description: data.username,
                    iconClass: data.organization ? "icon-building" : "icon-user",
                    context: data
                };
            }
        });
        this.inputSearchTypeahead.bind(this.inputSearch);
        this.inputSearchTypeahead.on('select', menuitem_onselect.bind(this));

        this.userGroup = new se.Container({extraClass: "wc-dashboard-share-list"});
        this.userGroup.appendTo(this.windowContent);

        this.sharingUsers = {};
        template = Wirecloud.currentTheme.templates['sharing_user'];

        for (i = 0; i < workspace.workspaceState.users.length; i++) {
            appendUser.call(this, workspace.workspaceState.users[i], builder, template);
        }

        // windowmenu - footer

        this.btnAccept = new se.Button({text: utils.gettext("Save"), state: "primary"});
        this.btnAccept.appendTo(this.windowBottom);

        this.btnCancel = new se.Button({text: utils.gettext("Cancel")});
        this.btnCancel.appendTo(this.windowBottom);
        this.btnCancel.on('click', this._closeListener);

        this.visibilityOptions.setValue(workspace.preferences.preferences.public.value ? 'public' : 'private');
    };

    ns.SharingWindowMenu.prototype = new Wirecloud.ui.WindowMenu();

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var appendOption = function appendOption(data, builder, template) {
        var createdElement;

        createdElement = builder.parse(template, {
            radiobutton: function () {
                return new se.RadioButton({id: data.name + '_option', group: this.visibilityOptions, value: data.name});
            }.bind(this),
            image: function () {
                var icon = document.createElement('span');
                icon.className = data.iconClass;
                return icon;
            }.bind(this),
            title: data.title,
            description: data.description
        }).elements[1];
        createdElement.querySelector(".option-heading").setAttribute('for', data.name + '_option');

        this.windowContent.appendChild(createdElement);

        return this;
    };

    var appendUser = function appendUser(data, builder, template) {
        var createdElement;

        if (data.username in this.sharingUsers) {
            // This user is already taken.
            return this;
        }

        createdElement = builder.parse(template, {
            fullname: data.fullname + (data.username === Wirecloud.contextManager.get('username') ? " " + utils.gettext("(You)") : ""),
            icon: function () {
                var icon = document.createElement('i');
                icon.className = data.organization ? "icon-building" : "icon-user";
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
                var button = new se.Button({extraClass: "btn-remove-user", plain: true, iconClass: "icon-remove", title: utils.gettext("Remove")});

                this.sharingUsers[data.username] = button;

                if (data.accesslevel === 'owner') {
                    button.disable();
                } else {
                    button.on('click', function () {
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

    var menuitem_onselect = function menuitem_onselect(typeahead, menuItem) {
        var context = menuItem.context;

        var builder = new se.GUIBuilder();
        var template = Wirecloud.currentTheme.templates['sharing_user'];

        appendUser.call(this, context, builder, template);
    };

    var searchForUser = function searchForUser(querytext, next) {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.SEARCH_SERVICE, {
            parameters: {namespace: 'user', q: querytext},
            method: 'GET',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: function (response) {
                next(JSON.parse(response.responseText).results);
            }
        });
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
