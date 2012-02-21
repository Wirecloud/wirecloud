var WirecloudHeader = function() {
    this.wrapperElement = $('wirecloud_header');
    this.breadcrum = $('wirecloud_breadcrum');

    this.currentMenu = null;

    this.submenu = document.createElement('div');
    this.submenu.className = 'submenu';
    this.wrapperElement.insertBefore(this.submenu, this.wrapperElement.firstChild);

    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.wrapperElement.insertBefore(this.menu, this.wrapperElement.firstChild);

    this._initMenuBar();
    this._initUserMenu();
}

WirecloudHeader.prototype._initMenuBar = function() {
    var menues, menu, menu_element, i, view_name;

    this.menues = {
        'workspace': {label: gettext('Editor')},
        'wiring': {label: gettext('Wiring')},
        'catalogue': {label: gettext('Marketplace')},
    };
    menu_order = ['workspace', 'wiring', 'catalogue'];

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

WirecloudHeader.prototype._initUserMenu = function() {
    var user_menu;

    this.user_menu = new StyledElements.PopupMenu();
    this.user_menu.append(new StyledElements.MenuItem(gettext('Sign out'), OpManagerFactory.getInstance().logout));

    user_menu = document.createElement('div');
    user_menu.className = 'user_menu';
    user_menu.setTextContent(ezweb_user_name);
    this.menu.appendChild(user_menu);
    EzWebExt.addEventListener(user_menu, 'click', function (e) {
        this.user_menu.show({x: e.clientX, y: e.clientY});
    }.bind(this));
};

WirecloudHeader.prototype._paintBreadcrum = function(newView) {
    var i, breadcrum_part, breadcrum, breadcrum_entry, breadcrum_levels;

    breadcrum_levels = ['first_level', 'second_level', 'third_level'];

    this.breadcrum.innerHTML = '';
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
        this.breadcrum.appendChild(breadcrum_part);
    }
};

WirecloudHeader.prototype._paintSubMenu = function(newView) {

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

WirecloudHeader.prototype._notifyViewChange = function(newView) {
    var menuitems, triangle, startx;

    if (this.currentMenu !== null) {
        this.currentMenu.html_element.removeClassName('selected');
        this.submenu.className = 'submenu';
    }

    this.currentMenu = this.menues[newView.view_name];
    this.currentMenu.html_element.addClassName('selected');

    this._paintBreadcrum(newView);
    this._paintSubMenu(newView);
};
