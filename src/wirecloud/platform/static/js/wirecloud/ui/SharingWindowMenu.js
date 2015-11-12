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
            {name: 'public', iconClass: "icon-globe", title: utils.gettext("Public"), description: utils.gettext("Everybody can view this workspace.")},
            {name: 'private', iconClass: "icon-lock", title: utils.gettext("Private"), description: utils.gettext("Nobody can view this workspace, except for people chosen.")}
        ];

        this.visibilityOptions = new se.ButtonsGroup('visibility');
        template = Wirecloud.currentTheme.templates['visibility_option'];

        for (i = 0; i < options.length; i++) {
            appendOption.call(this, options[i], builder, template);
        }

        subtitle2 = document.createElement('h4');
        subtitle2.textContent = utils.gettext("Share with others");
        this.windowContent.appendChild(subtitle2);

        var btnGroup = document.createElement('div');
        btnGroup.className = "btn-group btn-group-search-user";
        this.windowContent.appendChild(btnGroup);

        this.inputSearch = new se.TextField({placeholder: utils.gettext("Search for user")});
        this.inputSearch.appendTo(btnGroup);

        this.inputSearchTypeahead = new se.Typeahead({
            autocomplete: false,
            dataFiltered: true,
            lookup: function lookup(query, next) {
                searchForUser.call(this, query, next);
            },
            build: function build(typeahead, data) {
                return {
                    title: data.full_name,
                    description: data.username,
                    iconClass: "icon-user",
                    context: data
                };
            }
        });
        this.inputSearchTypeahead.bind(this.inputSearch);
        this.inputSearchTypeahead.on('select', menuitem_onselect.bind(this));

        this.userGroup = new se.Container({extraClass: "user-group"});
        this.userGroup.appendTo(this.windowContent);

        this.sharingAlert = new se.Alert({state: 'info', defaultIcon: true, message: utils.gettext("No user selected for sharing this workspace.")});
        this.userGroup.appendChild(this.sharingAlert);

        this.sharingUsers = {};
        template = Wirecloud.currentTheme.templates['sharing_user'];

        for (i = 0; i < workspace.workspaceState.users.length; i++) {
            appendUser.call(this, workspace.workspaceState.users[i], builder, template);
        }

        // windowmenu - footer

        this.btnAccept = new se.Button({text: utils.gettext("Save changes"), state: "primary"});
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
            fullname: data.full_name + (data.owner ? " " + utils.gettext("(You)") : ""),
            username: data.username,
            permission: function () {
                var span = document.createElement('span');

                if (data.owner) {
                    span.textContent = utils.gettext("Owner");
                }

                return span;
            },
            btndelete: function () {
                var button = new se.Button({extraClass: "btn-remove-user", plain: true, iconClass: "icon-remove", title: utils.gettext("Remove")});

                this.sharingUsers[data.username] = button;

                if (data.owner) {
                    button.disable();
                } else {
                    button.on('click', function () {
                        this.userGroup.removeChild(createdElement);
                        delete this.sharingUsers[data.username];

                        if (!Object.keys(this.sharingUsers).length) {
                            this.userGroup.appendChild(this.sharingAlert);
                        }
                    }.bind(this));
                }

                return button;
            }.bind(this)
        }).elements[1];

        this.userGroup.appendChild(createdElement);

        if (Object.keys(this.sharingUsers).length === 1) {
            this.userGroup.removeChild(this.sharingAlert);
        }

        return this;
    };

    var menuitem_onselect = function menuitem_onselect(typeahead, menuItem) {
        var context = menuItem.context;

        var builder = new se.GUIBuilder();
        var template = Wirecloud.currentTheme.templates['sharing_user'];

        appendUser.call(this, context, builder, template);
    };

    var searchForUser = function searchForUser(querytext, next) {
        Wirecloud.io.makeRequest('/api/search?namespace=user&q='+querytext, {
            method: 'GET',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: function (response) {
                next(JSON.parse(response.responseText).results);
            }
        });
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
