/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

var WirecloudHeader = function () {
    this.wrapperElement = $('wirecloud_header');
    this.breadcrum = $('wirecloud_breadcrum');

    this.currentView = null;
    this.currentMenu = null;
    this._popup_buttons = [];

    this.submenu = document.createElement('div');
    this.submenu.className = 'submenu';
    this.wrapperElement.insertBefore(this.submenu, this.wrapperElement.firstChild);

    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.wrapperElement.insertBefore(this.menu, this.wrapperElement.firstChild);

    this._initMenuBar();
    this._initUserMenu();
}

WirecloudHeader.prototype._initMenuBar = function () {
    var menues, menu, menu_element, i, view_name;

    this.menues = {
        'workspace': {label: gettext('Editor')},
        'wiring': {label: gettext('Wiring')},
        'marketplace': {label: gettext('Marketplace')},
    };
    menu_order = ['workspace', 'wiring', 'marketplace'];

    for (i = 0; i < menu_order.length; i += 1) {
        menu = this.menues[menu_order[i]];
        view_name = menu_order[i];

        menu_element = document.createElement('span');
        menu_element.setTextContent(menu.label);
        menu_element.className = view_name;
        menu_element.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView(this.view);
        }.bind({'view': view_name}), true);

        this.menu.appendChild(menu_element);
        menu['html_element'] = menu_element;
    }
};

WirecloudHeader.prototype._initUserMenu = function () {
    var user_menu, wrapper;

    wrapper = document.createElement('div');
    wrapper.className = 'user_menu_wrapper';
    this.menu.appendChild(wrapper);

    this.user_button = new StyledElements.PopupButton({
        'plain': true,
        'text': ezweb_user_name
    });
    this.user_button.insertInto(wrapper);

    user_menu = this.user_button.getPopupMenu();
    user_menu.append(new StyledElements.MenuItem(gettext('Settings'), OpManagerFactory.getInstance().showPlatformPreferences));
    user_menu.append(new StyledElements.MenuItem(gettext('Sign out'), OpManagerFactory.getInstance().logout));
};

WirecloudHeader.prototype._clearOldBreadcrum = function () {

    this.breadcrum.innerHTML = '';
    for (i = 0; i < this._popup_buttons.length; i += 1) {
        this._popup_buttons[i].destroy();
    }

    this._popup_buttons = [];
};

WirecloudHeader.prototype._paintBreadcrum = function (newView) {
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
    breadcrum_part.setTextContent(breadcrum_entry.label);
    breadcrum_part.className = breadcrum_levels[0];
    if ('class' in breadcrum_entry) {
        breadcrum_part.addClassName(breadcrum_entry['class']);
    }
    this.breadcrum.appendChild(breadcrum_part);


    for (i = 1; i < breadcrum.length; i += 1) {
        this.breadcrum.appendChild(document.createTextNode('/'));

        breadcrum_entry = breadcrum[i];

        breadcrum_part = document.createElement('span');
        breadcrum_part.setTextContent(breadcrum_entry.label);
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

WirecloudHeader.prototype._paintSubMenu = function (newView) {

    this.submenu.innerHTML = '';
    if ('getSubMenuItems' in newView) {
        menuitems = newView.getSubMenuItems();
    } else {
        return;
    }

    this.submenu.addClassName(newView.view_name);
    triangle = document.createElement('div');
    triangle.className = 'mark';
    this.submenu.appendChild(triangle);

    for (i = 0; i < menuitems.length; i += 1) {
        submenu = menuitems[i];

        submenu_element = document.createElement('span');
        submenu_element.setTextContent(submenu.label);
        submenu_element.addEventListener('click', submenu.callback.bind(newView), true);
        this.submenu.appendChild(submenu_element);
    }
    this.submenu.style.right = '';
    startx = this.menu.offsetWidth - this.currentMenu.html_element.offsetLeft;
    this.submenu.style.right = startx - this.submenu.offsetWidth + 'px';
};

WirecloudHeader.prototype._notifyViewChange = function (newView) {
    var menuitems, triangle, startx;

    if (this.currentMenu !== null) {
        this.currentMenu.html_element.removeClassName('selected');
        this.submenu.className = 'submenu';
    }

    this.currentView = newView;
    this.currentMenu = this.menues[newView.view_name];
    this.currentMenu.html_element.addClassName('selected');

    this.refresh();
};

WirecloudHeader.prototype.refresh = function () {
    this._paintBreadcrum(this.currentView);
    this._paintSubMenu(this.currentView);
};
