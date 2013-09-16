/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global $, gettext, LayoutManagerFactory, OpManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var onMenuClick = function onMenuClick(view_name) {
        LayoutManagerFactory.getInstance().changeCurrentView(view_name);
    };

    var WirecloudHeader = function WirecloudHeader() {
        var menu_wrapper;

        this.wrapperElement = $('wirecloud_header');
        this.breadcrum = $('wirecloud_breadcrum');
        this.oil_header = this.wrapperElement.getElementsByTagName('header')[0];

        this.currentView = null;
        this.currentMenu = null;
        this._popup_buttons = [];

        menu_wrapper = document.createElement('div');
        menu_wrapper.className = 'menu_wrapper';
        this.menu = document.createElement('div');
        this.menu.className = 'menu';
        menu_wrapper.appendChild(this.menu);
        this.wrapperElement.insertBefore(menu_wrapper, this.wrapperElement.getElementsByClassName('breadcrum_wrapper')[0]);

        this._initMenuBar();
    };

    WirecloudHeader.prototype._initMenuBar = function _initMenuBar() {
        var menu_order, menu, mark, menu_element, i, view_name;

        this.menues = {
            'workspace': {label: gettext('Editor')},
            'wiring': {label: gettext('Wiring')},
            'marketplace': {label: gettext('Marketplace')}
        };
        menu_order = ['workspace', 'wiring', 'marketplace'];

        for (i = 0; i < menu_order.length; i += 1) {
            menu = this.menues[menu_order[i]];
            view_name = menu_order[i];

            menu_element = document.createElement('span');
            menu_element.textContent = menu.label;
            menu_element.className = view_name;
            menu_element.addEventListener('click', onMenuClick.bind(null, view_name), true);

            mark = document.createElement('div');
            mark.className = 'mark';
            menu_element.appendChild(mark);
            this.menu.appendChild(menu_element);
            menu.html_element = menu_element;
        }
    };

    WirecloudHeader.prototype._initUserMenu = function _initUserMenu() {
        var user_menu, wrapper;

        var username = OpManagerFactory.getInstance().contextManager.get('username');
        var full_name = OpManagerFactory.getInstance().contextManager.get('fullname').trim();

        wrapper = document.createElement('div');
        wrapper.className = 'nav pull-right';
        this.oil_header.insertBefore(wrapper, this.oil_header.firstChild);

        var li = document.createElement('li');
        wrapper.appendChild(li);
        var anchor = document.createElement('a');
        anchor.setAttribute('href', 'https://account.lab.fi-ware.eu/users/' + username);
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
        user_menu.append(new StyledElements.MenuItem(gettext('Settings'), OpManagerFactory.getInstance().showPlatformPreferences));

        if (OpManagerFactory.getInstance().contextManager.get('isstaff') === true && 'DJANGO_ADMIN' in Wirecloud.URLs) {
            user_menu.append(new StyledElements.MenuItem(gettext('DJango Admin panel'), function () {
                window.open(Wirecloud.URLs.DJANGO_ADMIN, '_blank');
            }));
        }
        user_menu.append(new Wirecloud.ui.TutorialSubMenu());
        user_menu.append(new StyledElements.Separator());
        user_menu.append(new StyledElements.MenuItem(gettext('Sign out'), OpManagerFactory.getInstance().logout));
    };

    WirecloudHeader.prototype._clearOldBreadcrum = function _clearOldBreadcrum() {
        var i;

        this.breadcrum.innerHTML = '';
        for (i = 0; i < this._popup_buttons.length; i += 1) {
            this._popup_buttons[i].destroy();
        }

        this._popup_buttons = [];
    };

    WirecloudHeader.prototype._paintBreadcrum = function _paintBreadcrum(newView) {
        var i, breadcrum_part, breadcrum, breadcrum_entry, breadcrum_levels, button;

        breadcrum_levels = ['first_level', 'second_level', 'third_level'];

        this._clearOldBreadcrum();

        if ('getBreadcrum' in newView) {
            breadcrum = newView.getBreadcrum();
        } else {
            return;
        }

        if (breadcrum.length === 0) {
            return;
        }
        breadcrum_entry = breadcrum[0];
        breadcrum_part = document.createElement('span');
        breadcrum_part.textContent = breadcrum_entry.label;
        breadcrum_part.className = breadcrum_levels[0];
        if ('class' in breadcrum_entry) {
            breadcrum_part.addClassName(breadcrum_entry['class']);
        }
        this.breadcrum.appendChild(breadcrum_part);


        for (i = 1; i < breadcrum.length; i += 1) {
            this.breadcrum.appendChild(document.createTextNode('/'));

            breadcrum_entry = breadcrum[i];

            breadcrum_part = document.createElement('span');
            breadcrum_part.textContent = breadcrum_entry.label;
            breadcrum_part.className = breadcrum_levels[i];
            if ('class' in breadcrum_entry) {
                breadcrum_part.addClassName(breadcrum_entry['class']);
            }

            if ('menu' in breadcrum_entry) {
                button = new StyledElements.PopupButton({
                    'plain': true,
                    'class': 'icon-menu',
                    'menu': breadcrum_entry.menu
                });
                button.insertInto(breadcrum_part);
                this._popup_buttons.push(button);
            }
            this.breadcrum.appendChild(breadcrum_part);
        }
    };

    WirecloudHeader.prototype._notifyViewChange = function _notifyViewChange(newView) {
        var menuitems, triangle, startx;

        if (this.currentMenu !== null) {
            this.currentMenu.html_element.removeClassName('selected');
        }

        this.currentView = newView;
        this.currentMenu = this.menues[newView.view_name];
        this.currentMenu.html_element.addClassName('selected');

        this.refresh();
    };

    WirecloudHeader.prototype._notifyWorkspaceLoaded = function _notifyWorkspaceLoaded(workspace) {
        if (this.footer == null) {
            this.footer = document.createElement('footer');
            this.footer.innerHTML = '<div>2013 © <a href="http://fi-ware.eu/">FI-WARE</a>. Usage of FI-LAB services subject to acceptance of <a href="http://wiki.fi-ware.eu/FI-LAB_Terms_and_Conditions">Terms and Conditions</a> and <a href="http://forge.fi-ware.eu/plugins/mediawiki/wiki/fiware/index.php/FI-LAB_Personal_Data_Protection_Policy">Personal Data Protection Policy</a></div>';
            LayoutManagerFactory.getInstance().mainLayout.getSouthContainer().appendChild(this.footer);
            LayoutManagerFactory.getInstance().mainLayout.repaint();
        }

        this._paintBreadcrum(LayoutManagerFactory.getInstance().viewsByName['workspace']);

        workspace.wiring.addEventListener('load', function () {
            this.menues.wiring.html_element.classList.remove('error');
        }.bind(this));

        workspace.wiring.addEventListener('unloaded', function () {
            this.menues.wiring.html_element.classList.remove('error');
        }.bind(this));

        workspace.wiring.addEventListener('error', function () {
            this.menues.wiring.html_element.classList.add('error');
        }.bind(this));
    };

    WirecloudHeader.prototype.refresh = function refresh() {
        this._paintBreadcrum(this.currentView);
    };

    Wirecloud.ui.WirecloudHeader = WirecloudHeader;

})();
