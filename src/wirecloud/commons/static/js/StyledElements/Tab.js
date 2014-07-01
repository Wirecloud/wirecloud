/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var updateTitle = function updateTitle() {
        if (typeof this.title === 'undefined' || this.title === null) {
            this.tabElement.setAttribute('title', this.nameText);
        } else {
            this.tabElement.setAttribute('title', this.title);
        }
    };

    /**
     * Este compontente representa a un tab de un notebook.
     */
    var Tab = function Tab(id, notebook, options) {
        if (arguments.length === 0) {
            return;
        }

        if (!(notebook instanceof StyledElements.StyledNotebook)) {
            throw new Error("Invalid notebook argument");
        }

        var defaultOptions = {
            'closable': true,
            'containerOptions': {},
            'name': ''
        };
        options = Wirecloud.Utils.merge(defaultOptions, options);
        // Work around common typo
        if (options.closeable) {
            options.closable = options.closeable;
        }
        options.useFullHeight = true;

        this.tabId = id;
        this.notebook = notebook;

        this.tabElement = document.createElement("div");
        this.tabElement.className = "tab";
        this.name = document.createElement('span');
        this.tabElement.appendChild(this.name);

        /* call to the parent constructor */
        StyledElements.Container.call(this, options.containerOptions, ['show', 'hide', 'close']);

        this.wrapperElement.classList.add("se-notebook-tab-content");
        this.wrapperElement.classList.add("hidden");

        this.tabElement.addEventListener("click",
                                    function () {
                                        this.notebook.goToTab(this.tabId);
                                    }.bind(this),
                                    false);


        /* Process options */
        if (options.closable) {
            var closeButton = new StyledElements.StyledButton({
                text: "X",
                plain: true,
                'class': "close_button",
                title: 'Close Tab'
            });
            closeButton.insertInto(this.tabElement);

            closeButton.addEventListener("click",
                                         this.close.bind(this),
                                         false);
        }

        this.title = options.title;
        this.rename(options.name);
    };
    Tab.prototype = new StyledElements.Container({extending: true});

    /**
     * Elimina este Tab del notebook al que está asociado.
     */
    Tab.prototype.close = function close() {
        this.notebook.removeTab(this.tabId);
    };

    /**
     * Establece el texto que se mostrará dentro de la pestaña que se mostrará en
     * <code>notebook</code> y que representará al contenido de este
     * <code>Tab</code>.
     */
    Tab.prototype.rename = function rename(newName) {
        this.nameText = newName;
        this.name.textContent = this.nameText;

        updateTitle.call(this);
    };

    /**
     * Establece el texto que se mostrará, mediante un dialogo popup, cuando el
     * puntero del ratón este encima de la pestaña simulando al atributo "title" de
     * los elementos HTML.
     */
    Tab.prototype.setTitle = function setTitle(newTitle) {
        this.title = newTitle;

        updateTitle.call(this);
    };

    /**
     * Establece el icono de este Tab. En caso de no pasar un icono del notebook al
     * que está asociado.
     */
    Tab.prototype.setIcon = function setIcon(iconURL) {
        if (iconURL == null) {
            if (this.tabIcon != null) {
                Wirecloud.Utils.removeFromParent(this.tabIcon);
                this.tabIcon = null;
            }
            return;
        }

        if (this.tabIcon == null) {
            this.tabIcon = document.createElement('img');
            this.tabElement.insertBefore(this.tabIcon, this.tabElement.firstChild);
        }
        this.tabIcon.src = iconURL;
    };

    Tab.prototype.setVisible = function setVisible(newStatus) {
        if (newStatus) {
            this.tabElement.classList.add("selected");
            this.wrapperElement.classList.remove("hidden");
            this.repaint(false);
            this.events.show.dispatch(this);
        } else {
            this.tabElement.classList.remove("selected");
            this.wrapperElement.classList.add("hidden");
            this.events.hide.dispatch(this);
        }
    };

    Tab.prototype.getId = function getId() {
        return this.tabId;
    };

    /**
     * TODO change this.
     */
    Tab.prototype.getTabElement = function getTabElement() {
        return this.tabElement;
    };

    StyledElements.Tab = Tab;

})();
