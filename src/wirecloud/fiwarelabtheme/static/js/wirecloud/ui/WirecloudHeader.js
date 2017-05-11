/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    var WirecloudHeader = function WirecloudHeader() {
        this.wrapperElement = document.getElementById('wirecloud_header');
        this.app_bar = this.wrapperElement.querySelector('.wirecloud_app_bar');
        this.breadcrum = document.getElementById('wirecloud_breadcrum');

        this.backButton = new StyledElements.Button({
            class: 'btn-large wc-back-button',
            iconClass: 'fa fa-caret-left'
        });
        this.backButton.addEventListener('click', function () {
            this.currentView.goUp();
        }.bind(this));
        this.backButton.disable();
        this.backButton.insertInto(this.breadcrum.parentNode, this.breadcrum);

        this.menuButton = new StyledElements.PopupButton({
            class: 'btn-large wc-menu-button',
            iconClass: 'fa fa-reorder'
        });
        this.menuButton.disable();
        this.menuButton.insertInto(this.breadcrum.parentNode);

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'btn-group wc-toolbar';
        this.app_bar.appendChild(this.toolbar);

        this.currentView = null;
        this.close_cookie_banner_button = null;

        Wirecloud.addEventListener('contextloaded', this._initUserMenu.bind(this));
        Wirecloud.addEventListener('viewcontextchanged', this.refresh.bind(this));
    };

    WirecloudHeader.prototype._initUserMenu = function _initUserMenu() {
        var user_name, user_menu, wrapper, item;

        wrapper = document.querySelector('#wc-user-menu');
        if (wrapper == null) {
            return;
        } else if (Wirecloud.contextManager.get('isanonymous')) {
            var template = Wirecloud.currentTheme.templates['wirecloud/signin'];
            builder.parse(template, {
                username: user_name,
                avatar: avatar
            }).appendTo(wrapper);
            document.querySelectorAll(".wc-signin-button").forEach((button) => {
                button.addEventListener('click', () => {
                    var login_url = Wirecloud.URLs.LOGIN_VIEW;
                    var next_url = window.location.pathname + window.location.search + window.location.hash;
                    if (next_url !== '/') {
                        login_url += '?next=' + encodeURIComponent(next_url);
                    }
                    window.location = login_url;
                });
            });
        } else {
            user_name = Wirecloud.contextManager.get('username');
            var avatar = document.createElement('img');
            avatar.className = "avatar";
            avatar.src = Wirecloud.contextManager.get('avatar');

            var template = Wirecloud.currentTheme.templates['wirecloud/user_menu'];
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
                var dialog = new Wirecloud.ui.PreferencesWindowMenu('platform', Wirecloud.preferences);
                dialog.show();
            });
            item.addIconClass('fa fa-gear');
            user_menu.append(item);

            if (Wirecloud.contextManager.get('isstaff') === true && 'DJANGO_ADMIN' in Wirecloud.URLs) {
                item = new StyledElements.MenuItem(utils.gettext('Django Admin panel'), function () {
                    window.open(Wirecloud.URLs.DJANGO_ADMIN, '_blank');
                });
                item.addIconClass('fa fa-tasks');
                user_menu.append(item);
            }

            if (Wirecloud.contextManager.get('issuperuser') === true) {
                item = new StyledElements.MenuItem(utils.gettext('Switch User'), function () {
                    var dialog = new Wirecloud.ui.FormWindowMenu([{name: 'username', label: utils.gettext('User'), type: 'text', required: true}], utils.gettext('Switch User'), 'wc-switch-user');

                    var typeahead = new Wirecloud.ui.UserTypeahead({autocomplete: true});
                    typeahead.bind(dialog.form.fieldInterfaces.username.inputElement);

                    dialog.executeOperation = function (data) {
                        Wirecloud.io.makeRequest(Wirecloud.URLs.SWITCH_USER_SERVICE, {
                            method: 'POST',
                            contentType: 'application/json',
                            postBody: JSON.stringify({username: data.username}),
                            onSuccess: function () {
                                document.location.assign(Wirecloud.URLs.ROOT_URL);
                            }
                        });
                    }.bind(this);

                    dialog.show();
                });
                item.addIconClass('fa fa-exchange');
                user_menu.append(item);
            }

            item = new Wirecloud.ui.TutorialSubMenu();
            user_menu.append(item);
            user_menu.append(new StyledElements.Separator());
            item = new StyledElements.MenuItem(utils.gettext('Sign out'), Wirecloud.logout);
            item.addIconClass('fa fa-sign-out');
            user_menu.append(item);

            if (Wirecloud.constants.FIWARE_OFFICIAL_PORTAL) {
                this._notifyWorkspaceLoaded();
            }
        }
    };

    var paint_breadcrum_entry = function paint_breadcrum_entry(i, breadcrum_entry) {
        var breadcrum_part, breadcrum_levels = ['first_level', 'second_level', 'third_level'];

        if (typeof breadcrum_entry === 'string') {
            breadcrum_entry = {label: breadcrum_entry};
        }

        breadcrum_part = document.createElement('span');
        breadcrum_part.textContent = breadcrum_entry.label;
        breadcrum_part.className = breadcrum_levels[i];
        if ('class' in breadcrum_entry) {
            breadcrum_part.classList.add(breadcrum_entry.class);
        }

        this.breadcrum.appendChild(breadcrum_part);
    };

    WirecloudHeader.prototype._paintBreadcrumb = function _paintBreadcrumb(newView) {
        var i, breadcrum;

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
        var buttons, i;

        this.toolbar.innerHTML = '';

        if (newView == null || !('getToolbarButtons' in newView)) {
            return;
        }

        buttons = newView.getToolbarButtons();
        for (i = 0; i < buttons.length; i++) {
            buttons[i].addClassName('btn-large');
            buttons[i].addClassName('btn-primary');
            buttons[i].addIconClassName('fa-fw');
            buttons[i].insertInto(this.toolbar);
        }
    };

    WirecloudHeader.prototype._replaceMenu = function _replaceMenu(newView) {
        var menu;

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

    var cookies;
    var fiware_cookie_policy_cookie = 'policy_cookie';
    var fiware_cookie_policy_days = 10;

    var readCookie = function readCookie(name) {
        var parts, cookie, i;

        if (cookies == null) {
            parts = document.cookie.split('; ');
            cookies = {};

            for (i = parts.length - 1; i >= 0; i--) {
                cookie = parts[i].split('=');
                cookies[cookie[0]] = cookie[1];
            }
        }

        return cookies[name];
    };

    WirecloudHeader.prototype._notifyWorkspaceLoaded = function _notifyWorkspaceLoaded(workspace) {
        var cookie_banner, expiration_date;

        if (readCookie(fiware_cookie_policy_cookie) !== 'on') {
            cookie_banner = document.createElement('div');
            cookie_banner.setAttribute('id', 'cookie-law');
            cookie_banner.innerHTML = '<p>We use first and third-party’s cookies to improve your experience and our services, identifying your Internet browsing preferences on our website. If you keep browsing, you accept its use. You can get more information on our <a href="http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Cookies_Policy_FIWARE_Lab" target="_blank">Cookie Policy</a>.</p>';
            document.body.appendChild(cookie_banner);

            this.close_cookie_banner_button = new StyledElements.Button({text: 'X', plain: true, id: 'close-cookie-banner'});
            this.close_cookie_banner_button.insertInto(cookie_banner);
            this.close_cookie_banner_button.addEventListener('click', function () {
                document.body.removeChild(cookie_banner);
            }.bind(this));

            var expiration_date = new Date();
            expiration_date.setTime(expiration_date.getTime() + (fiware_cookie_policy_days * 24 * 60 * 60 * 1000));
            document.cookie = fiware_cookie_policy_cookie + "=on; expires=" + expiration_date.toGMTString() + "; path=/";
        }
    };

    WirecloudHeader.prototype.refresh = function refresh() {
        this._paintBreadcrumb(this.currentView);
        this._paintToolbar(this.currentView);
        this._replaceMenu(this.currentView);

        var canGoUp = this.currentView != null && 'goUp' in this.currentView;
        if (canGoUp && typeof this.currentView.canGoUp === 'function') {
            canGoUp = this.currentView.canGoUp();
        }
        this.backButton.enabled = canGoUp;
    };

    Wirecloud.ui.WirecloudHeader = WirecloudHeader;

})(Wirecloud.Utils);
