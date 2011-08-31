/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global isAnonymousUser, Insertion, $, Dragboard */
"use strict";

/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


function Tab(tabInfo, workSpace, index) {

    // ****************
    // PUBLIC METHODS
    // ****************

    Tab.prototype.destroy = function () {
        this.dragboard.destroy();
    };

    /*                                                                       *
     *  Paint the igadget list of this tab. It is used in the first charge.  *
     *                                                                       */
    Tab.prototype.show = function (scrollLeft, index) {
        var iGadgets = this.dragboard.getIGadgets(),
            toolbarElement, backButton, titleElement,
            loginButton, i, tabsLength, opManager, tabContent,
            iGadgetElement, icon, navBarElement;

        this.tabElement = document.createElement('div');
        this.tabElement.setAttribute('class', "container ezweb_tab");
        this.tabElement.setAttribute('id', this.tabName);
        this.tabElement.style.left = scrollLeft + 'px';

        /************************************************
         *  Toolbar *
         ************************************************/

        toolbarElement = document.createElement('div');
        toolbarElement.setAttribute('class', 'toolbar anchorTop');

        backButton = document.createElement('div');
        backButton.setAttribute('class', 'back_button');
        backButton.addEventListener('click', function () {
            OpManagerFactory.getInstance().showWorkspaceMenu()
        }, true);
        backButton.innerHTML = '<span class="menu_text">Menu</span>';
        toolbarElement.appendChild(backButton);

        titleElement = document.createElement('h1');
        titleElement.textContent = this.tabInfo.name;
        toolbarElement.appendChild(titleElement);

        loginButton = document.createElement('a');
        loginButton.setAttribute('class', 'logout');
        if (isAnonymousUser) {
            loginButton.setAttribute('href', '/accounts/login/?next=' + document.location.path);
            loginButton.textContent = gettext('Sign-in');
        } else {
            loginButton.setAttribute('href', '/logout')
            loginButton.textContent = gettext('Exit');
        }
        toolbarElement.appendChild(loginButton);
        this.tabElement.appendChild(toolbarElement);

        /*
         * Tab content
         */
        opManager = OpManagerFactory.getInstance();

        tabContent = document.createElement('div');
        tabContent.setAttribute('class', 'tab_content');
        for (i = 0; i < iGadgets.length; i += 1) {
            iGadgetElement = document.createElement('div');
            iGadgetElement.setAttribute('class', 'igadget_item');
            icon = document.createElement('img');
            icon.setAttribute('class', "igadget_icon");
            icon.setAttribute('src', iGadgets[i].getGadget().getIPhoneImageURI());
            iGadgetElement.appendChild(icon);

            iGadgetElement.appendChild(document.createTextNode(iGadgets[i].name));
            iGadgetElement.addEventListener('click', opManager.showDragboard.bind(opManager, iGadgets[i].id), false);
            tabContent.appendChild(iGadgetElement);
        }
        this.tabElement.appendChild(tabContent);

        tabsLength = this.workSpace.getNumberOfTabs();
        if (tabsLength > 1) {
            navBarElement = document.createElement('div');
            navBarElement.setAttribute('class', 'navbar');
            for (i = 0; i < tabsLength; i += 1) {
                if (i !== index) {
                    navBarElement.innerHTML += '<img src="/ezweb/images/iphone/greyball.png"></img>';
                } else {
                    navBarElement.innerHTML += '<img src="/ezweb/images/iphone/whiteball.png"></img>';
                }
            }
            this.tabElement.appendChild(navBarElement);
        }
        this.tabsContainer.appendChild(this.tabElement);
    };

    Tab.prototype.updateLayout = function (scrollLeft) {
        if (this.tabElement) {
            this.tabElement.setStyle({
                left: scrollLeft + "px"
            });
        }
    };

    Tab.prototype.getDragboard = function () {
        return this.dragboard;
    };

    Tab.prototype.getId = function () {
        return this.tabInfo.id;
    };

    Tab.prototype.is_painted = function () {
        return true;
    };

    // *****************
    //  PRIVATE METHODS
    // *****************

    // The name of the dragboard HTML elements correspond to the Tab name
    this.workSpace = workSpace;
    this.tabInfo = tabInfo;
    this.index = index;
    this.tabName = "tab_" + this.workSpace.workSpaceState.id + "_" + this.tabInfo.id;

    this.dragboard = new Dragboard(this, this.workSpace, this.dragboardElement);
    this.tabsContainer = $('tabs_container');
    this.tabElement = null;
}
