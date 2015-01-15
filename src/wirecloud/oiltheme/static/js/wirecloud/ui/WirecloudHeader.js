/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, LayoutManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var WirecloudHeader = function WirecloudHeader() {
        this.wrapperElement = document.getElementById('wirecloud_header');
        this.app_bar = this.wrapperElement.querySelector('.wirecloud_app_bar');
        this.breadcrum = document.getElementById('wirecloud_breadcrum');
        this.oil_header = this.wrapperElement.getElementsByTagName('header')[0];

        this.backButton = new StyledElements.StyledButton({'class': 'btn-large', 'iconClass': 'icon-caret-left'});
        this.backButton.addEventListener('click', function () {
            this.currentView.goUp();
        }.bind(this));
        this.backButton.disable();
        this.backButton.insertInto(this.breadcrum.parentNode, this.breadcrum);

        this.menuButton = new StyledElements.PopupButton({'class': 'btn-large', 'iconClass': 'icon-reorder'});
        this.menuButton.disable();
        this.menuButton.insertInto(this.breadcrum.parentNode);

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'btn-group wirecloud_toolbar';
        this.app_bar.appendChild(this.toolbar);

        this.currentView = null;
        this.close_cookie_banner_button = null;
    };

    WirecloudHeader.prototype._initUserMenu = function _initUserMenu() {
        var user_menu, wrapper, login_button, item;

        var username = Wirecloud.contextManager.get('username');
        var full_name = Wirecloud.contextManager.get('fullname').trim();

        wrapper = document.createElement('div');
        wrapper.className = 'nav pull-right';
        this.oil_header.insertBefore(wrapper, this.oil_header.firstChild);

        var li = document.createElement('li');
        wrapper.appendChild(li);
        var anchor = document.createElement('a');
        anchor.setAttribute('href', Wirecloud.constants.FIWARE_IDM_SERVER + '/users/' + username);
        anchor.setAttribute('target', '_blank');
        li.appendChild(anchor);
        var img = document.createElement('img');
        img.setAttribute('src', '/static/images/user.png');
        anchor.appendChild(img);
        anchor.appendChild(document.createTextNode(' '));
        var username_element = document.createElement('span');
        username_element.className = 'name';
        if (full_name === '') {
            full_name = username;
        }
        username_element.textContent = full_name;
        anchor.appendChild(username_element);

        this.user_button = new StyledElements.PopupButton({
            'class': 'arrow-down-settings',
            'plain': true
        });
        this.user_button.insertInto(wrapper);

        user_menu = this.user_button.getPopupMenu();
        item = new StyledElements.MenuItem(gettext('Settings'), function () {
            var dialog = new Wirecloud.ui.PreferencesWindowMenu('platform', Wirecloud.preferences);
            dialog.show();
        });
        user_menu.append(item);
        item.setDisabled(username === 'anonymous');

        if (Wirecloud.contextManager.get('isstaff') === true && 'DJANGO_ADMIN' in Wirecloud.URLs) {
            user_menu.append(new StyledElements.MenuItem(gettext('DJango Admin panel'), function () {
                window.open(Wirecloud.URLs.DJANGO_ADMIN, '_blank');
            }));
        }
        item = new Wirecloud.ui.TutorialSubMenu();
        user_menu.append(item);
        item.setDisabled(username === 'anonymous');
        user_menu.append(new StyledElements.Separator());
        if (username === 'anonymous') {
            user_menu.append(new StyledElements.MenuItem(gettext('Sign in'), function () {
                window.location = Wirecloud.URLs.LOGIN_VIEW + '?next=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
            }));
        } else {
            user_menu.append(new StyledElements.MenuItem(gettext('Sign out'), function () {
                var portal_logout_urls, i, portal;

                portal_logout_urls = [];
                for (i = 0; i < Wirecloud.constants.FIWARE_PORTALS.length; i++) {
                    portal = Wirecloud.constants.FIWARE_PORTALS[i];
                    if ('logout_path' in portal) {
                        portal_logout_urls.push(portal.url + portal.logout_path);
                    }
                };
                for (i = 0; i < portal_logout_urls.length; i += 1) {
                    try {
                        Wirecloud.io.makeRequest(portal_logout_urls[i], {
                            method: 'GET',
                            supportsAccessControl: true,
                            withCredentials: true,
                            requestHeaders: {
                                'X-Requested-With': null
                            }
                        });
                    } catch (error) {}
                }
                setTimeout(Wirecloud.logout, 1000);
            }));
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
            breadcrum_part.classList.add(breadcrum_entry['class']);
        }

        this.breadcrum.appendChild(breadcrum_part);
    };

    WirecloudHeader.prototype._paintBreadcrum = function _paintBreadcrum(newView) {
        var i, breadcrum, breadcrum_entry;

        this.breadcrum.innerHTML = '';

        if (newView != null && 'getBreadcrum' in newView) {
            breadcrum = newView.getBreadcrum();
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

    WirecloudHeader.prototype._refreshTitle = function _refreshTitle(newView) {
        if (newView != null) {
            document.title = newView.getTitle();
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
        var msg, environment, cookie_banner, expiration_date;

        if (Wirecloud.constants.FIWARE_OFFICIAL_PORTAL && this.footer == null) {
            this.footer = document.createElement('footer');

            msg = '<div>2014 © <a href="http://fiware.org/" target="_blank">FIWARE</a>. The use of FIWARE %(environment)s services is subject to the acceptance of the <a href="http://wiki.fiware.org/FI-LAB_Terms_and_Conditions" target="_blank">Terms and Conditions</a>, <a href="http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/FI-LAB_Personal_Data_Protection_Policy" target="_blank">Personal Data Protection Policy</a> and <a href="http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Cookies_Policy_FIWARE_Lab" target="_blank">Cookies Policy</a></div>';
            if (Wirecloud.constants.FIWARE_IDM_SERVER === 'https://account.lab.fiware.org') {
                environment = 'Lab';
            } else {
                environment = 'Testbed';
            }
            msg = interpolate(msg, {environment: environment}, true);
            this.footer.innerHTML = msg;

            if (readCookie(fiware_cookie_policy_cookie) !== 'on') {
                cookie_banner = document.createElement('div');
                cookie_banner.setAttribute('id', 'cookie-law');
                cookie_banner.innerHTML = '<p>We use first and third-party’s cookies to improve your experience and our services, identifying your Internet browsing preferences on our website. If you keep browsing, you accept its use. You can get more information on our <a href="http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Cookies_Policy_FIWARE_Lab" target="_blank">Cookie Policy</a>.</p>';
                document.body.appendChild(cookie_banner);

                this.close_cookie_banner_button = new StyledElements.StyledButton({text: 'X', plain: true, id: 'close-cookie-banner'});
                this.close_cookie_banner_button.insertInto(cookie_banner);
                this.close_cookie_banner_button.addEventListener('click', function () {
                    document.body.removeChild(cookie_banner);
                }.bind(this));

                var expiration_date = new Date();
                expiration_date.setTime(expiration_date.getTime() + (fiware_cookie_policy_days * 24 * 60 * 60 * 1000));
                document.cookie = fiware_cookie_policy_cookie + "=on; expires=" + expiration_date.toGMTString() + "; path=/";
            }

            LayoutManagerFactory.getInstance().mainLayout.getSouthContainer().appendChild(this.footer);
            LayoutManagerFactory.getInstance().mainLayout.repaint();
        }

        this._paintBreadcrum(LayoutManagerFactory.getInstance().viewsByName['workspace']);
    };

    WirecloudHeader.prototype.refresh = function refresh() {
        this._paintBreadcrum(this.currentView);
        this._refreshTitle(this.currentView);
        this._paintToolbar(this.currentView);
        this._replaceMenu(this.currentView);
        this.backButton.setDisabled(this.currentView == null || !('goUp' in this.currentView));
    };

    Wirecloud.ui.WirecloudHeader = WirecloudHeader;

})();
