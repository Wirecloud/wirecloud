/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.
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

    const builder = new StyledElements.GUIBuilder();

    const WirecloudHeader = function WirecloudHeader() {
        this.wrapperElement = document.getElementById('wirecloud_header');
        this.app_bar = this.wrapperElement.querySelector('.wirecloud_app_bar');
        this.breadcrum = document.getElementById('wirecloud_breadcrum');

        this.backButton = new StyledElements.Button({
            class: 'btn-large wc-back-button',
            iconClass: 'fas fa-caret-left'
        });
        this.backButton.addEventListener('click', function () {
            this.currentView.goUp();
        }.bind(this));
        this.backButton.disable();
        this.backButton.insertInto(this.breadcrum.parentNode, this.breadcrum);

        this.menuButton = new StyledElements.PopupButton({
            class: 'btn-large wc-menu-button',
            iconClass: 'fas fa-bars'
        });
        this.menuButton.disable();
        this.menuButton.insertInto(this.breadcrum.parentNode);

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'btn-group wc-toolbar';
        this.app_bar.appendChild(this.toolbar);

        this.currentView = null;
        Wirecloud.addEventListener("contextloaded", this._initUserMenu.bind(this));
        Wirecloud.addEventListener("viewcontextchanged", this.refresh.bind(this));
    };

    WirecloudHeader.prototype._initUserMenu = function _initUserMenu() {
        let user_name, user_menu, item;

        const wrapper = document.querySelector('#wc-user-menu');
        if (wrapper == null) {
            return;
        } else if (Wirecloud.contextManager.get('isanonymous')) {
            const template = Wirecloud.currentTheme.templates['wirecloud/signin'];
            builder.parse(template, {
                username: user_name
            }).appendTo(wrapper);
            document.querySelectorAll(".wc-signin-button").forEach((button) => {
                button.addEventListener('click', Wirecloud.login);
            });
        } else {
            user_name = Wirecloud.contextManager.get('username');
            const avatar = document.createElement('img');
            avatar.className = "avatar";
            avatar.src = Wirecloud.contextManager.get('avatar');

            const template = Wirecloud.currentTheme.templates['wirecloud/user_menu'];
            builder.parse(template, {
                username: user_name,
                avatar: avatar,
                usermenu: (options) => {
                    this.user_button = new StyledElements.PopupButton(options);
                    return this.user_button;
                }
            }).appendTo(wrapper);

            user_menu = this.user_button.getPopupMenu();
            item = new StyledElements.MenuItem(utils.gettext('Settings'), function () {
                const dialog = new Wirecloud.ui.PreferencesWindowMenu('platform', Wirecloud.preferences);
                dialog.show();
            });
            item.addIconClass('fas fa-cog');
            user_menu.append(item);

            if (Wirecloud.contextManager.get('isstaff') === true && 'DJANGO_ADMIN' in Wirecloud.URLs) {
                item = new StyledElements.MenuItem(utils.gettext('Django Admin panel'), function () {
                    window.open(Wirecloud.URLs.DJANGO_ADMIN, '_blank');
                });
                item.addIconClass('fas fa-tasks');
                user_menu.append(item);
            }

            item = new Wirecloud.ui.TutorialSubMenu();
            user_menu.append(item);

            user_menu.append(new se.Separator());

            if (Wirecloud.contextManager.get('issuperuser') === true) {
                item = new StyledElements.MenuItem(utils.gettext('Switch User'), function () {
                    const dialog = new Wirecloud.ui.FormWindowMenu([{name: 'username', label: utils.gettext('User'), type: 'text', required: true}], utils.gettext('Switch User'), 'wc-switch-user');

                    const typeahead = new Wirecloud.ui.UserTypeahead({autocomplete: true});
                    typeahead.bind(dialog.form.fieldInterfaces.username.inputElement);

                    dialog.executeOperation = (data) => {
                        Wirecloud.switchUser(data.username);
                    };

                    dialog.show();
                });
                user_menu.append(item.addIconClass('fas fa-exchange-alt'));
            }

            const realuser = Wirecloud.contextManager.get('realuser');
            if (realuser != null) {
                item = new StyledElements.MenuItem(
                    utils.interpolate(utils.gettext('Back to %(user)s'), {user: realuser}),
                    () => {Wirecloud.switchUser(realuser);}
                );
                user_menu.append(item.addIconClass('fas fa-undo'));
            }

            item = new StyledElements.MenuItem(utils.gettext('Sign out'), Wirecloud.logout);
            item.addIconClass('fas fa-sign-out-alt');
            user_menu.append(item);
        }
    };

    const paint_breadcrum_entry = function paint_breadcrum_entry(i, breadcrum_entry) {
        const breadcrum_levels = ['first_level', 'second_level', 'third_level'];

        if (typeof breadcrum_entry === 'string') {
            breadcrum_entry = {label: breadcrum_entry};
        }

        const breadcrum_part = document.createElement('span');
        breadcrum_part.textContent = breadcrum_entry.label;
        breadcrum_part.className = breadcrum_levels[i];
        if ('class' in breadcrum_entry) {
            breadcrum_part.classList.add(breadcrum_entry.class);
        }

        this.breadcrum.appendChild(breadcrum_part);
    };

    WirecloudHeader.prototype._paintBreadcrumb = function _paintBreadcrumb(newView) {
        let i, breadcrum;

        this.breadcrum.innerHTML = '';

        if (newView != null && 'getBreadcrumb' in newView) {
            breadcrum = newView.getBreadcrumb();
        } else {
            return;
        }

        if (breadcrum.length === 0) {
            return;
        }

        paint_breadcrum_entry.call(this, 0, breadcrum[0]);

        for (i = 1; i < breadcrum.length; i += 1) {
            this.breadcrum.appendChild(document.createTextNode('/'));

            paint_breadcrum_entry.call(this, i, breadcrum[i]);
        }
    };

    WirecloudHeader.prototype._paintToolbar = function _paintToolbar(newView) {
        this.toolbar.innerHTML = "";

        if (newView == null || !('getToolbarButtons' in newView)) {
            return;
        }

        const btn_group = document.createElement('div');
        btn_group.className = 'btn-group';
        this.breadcrum.appendChild(btn_group);
        const buttons = newView.getToolbarButtons();
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addClassName('btn-large');
            buttons[i].addClassName('btn-primary');
            buttons[i].addIconClassName('fa-fw');
            buttons[i].insertInto(this.toolbar);
        }
    };

    WirecloudHeader.prototype._replaceMenu = function _replaceMenu(newView) {
        let menu;

        if (newView != null && ('getToolbarMenu' in newView)) {
            menu = newView.getToolbarMenu();
        }

        this.menuButton.replacePopupMenu(menu);
        this.menuButton.setDisabled(menu == null);
    };

    WirecloudHeader.prototype._notifyViewChange = function _notifyViewChange(newView) {
        if (newView == null) {
            this.backButton.disable();
            this.menuButton.disable();
        } else {
            this.currentView = newView;

            this.refresh();
        }
    };

    WirecloudHeader.prototype.refresh = function refresh() {
        this._paintBreadcrumb(this.currentView);
        this._paintToolbar(this.currentView);
        this._replaceMenu(this.currentView);

        let canGoUp = this.currentView != null && 'goUp' in this.currentView;
        if (canGoUp && typeof this.currentView.canGoUp === 'function') {
            canGoUp = this.currentView.canGoUp();
        }
        this.backButton.enabled = canGoUp;
    };

    Wirecloud.ui.WirecloudHeader = WirecloudHeader;

})(StyledElements, Wirecloud.Utils);
