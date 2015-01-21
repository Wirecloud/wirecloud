/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CSSPrimitiveValue, StyledElements*/

(function () {

    "use strict";

    var onNewTab = function onNewTab() {
        this.events.newTab.dispatch(this);
    };

    /**
     * El componente Styled Notebook crea dos paneles separados por un separador y
     * que permite redimensionar los dos paneles a la vez con el objetivo de que
     * siguan ocupando el mismo espacio en conjunto.
     *
     * @param options opciones soportadas:
     *                - focusOnSetVisible: hace que se ponga el foco en las
     *                  pestañas al hacerlas visibles (<code>true</code> por
     *                  defecto).
     *
     * Eventos que soporta este componente:
     *      - change: evento lanzado cuando se cambia la pestaña.
     *      - tabDeletion: evento lanzado cuando se elimina algún tab del notebook.
     *      - tabInsertion: evento lanzado cuando se crea e inserta un nuevo tab en
     *        el notebook.
     */
    var StyledNotebook = function StyledNotebook(options) {
        var tabWrapper;

        StyledElements.StyledElement.call(this, ['change', 'changed', 'tabDeletion', 'tabInsertion', 'newTab']);

        var defaultOptions = {
            'class': '',
            'focusOnSetVisible': true,
            'full': true
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = StyledElements.Utils.prependWord(options['class'], "se-notebook");

        tabWrapper = new StyledElements.HorizontalLayout({'class': 'se-notebook-tabs-wrapper', 'autoHeight': false});
        this.tabWrapper = tabWrapper;
        tabWrapper.insertInto(this.wrapperElement);

        this.tabArea = new StyledElements.Container();
        tabWrapper.getCenterContainer().appendChild(this.tabArea);
        this.tabArea.addClassName('se-notebook-tab-area');

        this.moveLeftButton = new this.Button({'class': 'move_left', 'iconClass': 'icon-caret-left'});
        tabWrapper.getWestContainer().appendChild(this.moveLeftButton);

        this.moveRightButton = new this.Button({'class': 'move_right', 'iconClass': 'icon-caret-right'});
        tabWrapper.getEastContainer().appendChild(this.moveRightButton);

        this.contentArea = document.createElement("div");
        this.contentArea.className = "se-notebook-content-wrapper";
        this.wrapperElement.appendChild(this.contentArea);

        this.tabs = [];
        this.tabsById = [];
        this.visibleTab = null;
        this.maxTabElementWidth = null;

        /* Process options */
        if (options.id != null) {
            this.wrapperElement.setAttribute('id', options.id);
        }

        if (options.full) {
            this.wrapperElement.classList.add('full');
        }

        this.focusOnSetVisible = options.focusOnSetVisible;

        /* Tab creation support */
        this.events.newTab.addEventListener = function addEventListener(listener) {
            var new_tab_main_listener;

            if (this.new_tab_button_tabs == null) {
                new_tab_main_listener = onNewTab.bind(this);

                this.new_tab_button_tabs = new this.Button({iconClass: 'icon-plus', 'class': 'se-notebook-new-tab', title: gettext('Add Tab')});
                this.new_tab_button_tabs.addEventListener('click', new_tab_main_listener);
                this.tabArea.appendChild(this.new_tab_button_tabs);
                this.new_tab_button_left = new this.Button({iconClass: 'icon-plus', 'class': 'se-notebook-new-tab', title: gettext('Add Tab')});
                this.new_tab_button_left.addEventListener('click', new_tab_main_listener);
                this.addButton(this.new_tab_button_left);
            }
            StyledElements.Event.prototype.addEventListener.call(this.events.newTab, listener);
        }.bind(this);

        /* Transitions code */
        var context = {
            control: this,
            initialScrollLeft: null,
            finalScrollLeft: null,
            steps: null,
            step: null,
            inc: null
        };

        var stepFunc = function stepFunc(step, context) {
            var scrollLeft = context.initialScrollLeft + Math.floor((step + 1) * context.inc);

            if ((context.inc < 0) && (scrollLeft > context.finalScrollLeft) ||
                (context.inc > 0) && (scrollLeft < context.finalScrollLeft)) {
                context.control.tabArea.wrapperElement.scrollLeft = Math.round(scrollLeft);
                return true;  // we need to do more iterations
            } else {
                // Finish current transition
                context.control.tabArea.wrapperElement.scrollLeft = context.finalScrollLeft;
                enableDisableButtons.call(context.control);

                return false;
            }
        };

        var initFunc = function initFunc(context, command) {
            var firstVisibleTab, currentTab, maxScrollLeft, baseTime, stepTimes, computedStyle, padding;

            context.initialScrollLeft = context.control.tabArea.wrapperElement.scrollLeft;
            computedStyle = document.defaultView.getComputedStyle(context.control.tabArea.wrapperElement, null);
            padding = computedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);

            switch (command.type) {
            case 'shiftLeft':

                if (isTabVisible.call(context.control, 0)) {
                    return false;
                }

                firstVisibleTab = getFirstVisibleTab.call(context.control);
                currentTab = context.control.tabs[firstVisibleTab - 1].getTabElement();
                context.finalScrollLeft = currentTab.offsetLeft - padding;
                break;

            case 'shiftRight':
                if (isLastTabVisible.call(context.control)) {
                    return false;
                }

                firstVisibleTab = getFirstVisibleTab.call(context.control);
                currentTab = context.control.tabs[firstVisibleTab + 1].getTabElement();
                context.finalScrollLeft = currentTab.offsetLeft - padding;
                break;
            case 'focus':
                currentTab = context.control.tabsById[command.tabId].getTabElement();

                if (isTabVisible.call(context.control, context.control.getTabIndex(command.tabId), true)) {
                    return false;
                }
                context.finalScrollLeft = currentTab.offsetLeft - padding;
                break;
            }

            maxScrollLeft = context.control.tabArea.wrapperElement.scrollWidth - context.control.tabArea.wrapperElement.clientWidth;
            if (context.finalScrollLeft > maxScrollLeft) {
                context.finalScrollLeft = maxScrollLeft;
            }

            baseTime = (new Date()).getTime() + 100;
            stepTimes = [];
            context.steps = 6;
            for (var i = 0; i <= context.steps; i++) {
                stepTimes[i] = baseTime + (i * 100);
            }

            context.inc = Math.floor((context.finalScrollLeft - context.initialScrollLeft) / context.steps);
            return stepTimes; // we have things to do
        };

        this.transitionsQueue = new StyledElements.CommandQueue(context, initFunc, stepFunc);

        /* Code for handling internal events */
        this.moveLeftButton.addEventListener("click", this.shiftLeftTabs.bind(this));
        this.moveRightButton.addEventListener("click", this.shiftRightTabs.bind(this));

        Object.defineProperty(this, 'fullscreen', {
            get: function () {
                if ('fullscreenElement' in document) {
                    return document.fullscreenElement === this.wrapperElement;
                } else if ('msFullscreenElement' in document) {
                    return document.msFullscreenElement === this.wrapperElement;
                } else if ('mozFullScreenElement' in document) {
                    return document.mozFullScreenElement === this.wrapperElement;
                } else if ('webkitFullscreenElement' in document) {
                    return document.webkitFullscreenElement === this.wrapperElement;
                }
            }
        });
    };
    StyledNotebook.prototype = new StyledElements.StyledElement();

    StyledNotebook.prototype.Button = StyledElements.StyledButton;
    StyledNotebook.prototype.Tab = StyledElements.Tab;

    /**
     * @private
     */
    var isTabVisible = function isTabVisible(tabIndex, full) {
        var tabElement, tabAreaStart, tabAreaEnd, tabOffsetRight;

        tabElement = this.tabs[tabIndex].getTabElement();

        tabAreaStart = this.tabArea.wrapperElement.scrollLeft;
        tabAreaEnd = tabAreaStart + this.tabArea.wrapperElement.clientWidth;

        if (full) {
            tabOffsetRight = tabElement.offsetLeft + tabElement.offsetWidth;
            return tabElement.offsetLeft >= tabAreaStart && tabOffsetRight <= tabAreaEnd;
        } else {
            return tabElement.offsetLeft >= tabAreaStart && tabElement.offsetLeft <= tabAreaEnd;
        }
    };

    /**
     * @private
     */
    var isLastTabVisible = function isLastTabVisible() {
        var lastTab = this.tabs.length - 1;

        if (this.tabs.length === 0 || isTabVisible.call(this, lastTab, true)) {
            return true;
        }
        if (!isTabVisible.call(this, lastTab)) {
            return false;
        }
        return this.tabs.length < 2 || !isTabVisible.call(this, lastTab - 1);
    };

    /**
     * @private
     */
    var enableDisableButtons = function enableDisableButtons() {
        if (this.tabs.length === 0) {
            this.moveLeftButton.disable();
            this.moveRightButton.disable();
            if (this.new_tab_button_tabs != null) {
                this.new_tab_button_tabs.enable();
                this.new_tab_button_left.disable();
            }
            return;
        }

        var first_tab_visible = isTabVisible.call(this, 0);
        var last_tab_visible = isLastTabVisible.call(this);

        this.moveLeftButton.setDisabled(first_tab_visible);
        this.moveRightButton.setDisabled(last_tab_visible);

        if (this.new_tab_button_tabs != null) {
            if (first_tab_visible && last_tab_visible) {
                this.new_tab_button_tabs.enable();
                this.new_tab_button_left.disable();
            } else {
                this.new_tab_button_tabs.disable();
                this.new_tab_button_left.enable();
            }
            this.tabWrapper.repaint();
        }
    };

    /**
     * @private
     */
    var getFirstVisibleTab = function getFirstVisibleTab() {
        var i;
        for (i = 0; i < this.tabs.length; i += 1) {
            if (isTabVisible.call(this, i)) {
                return i;
            }
        }
        return null;
    };

    /**
     * Desplaza las pestañas a la izquierda.
     */
    StyledNotebook.prototype.shiftLeftTabs = function shiftLeftTabs() {
        this.transitionsQueue.addCommand({type: 'shiftLeft'});
    };

    /**
     * Desplaza las pestañas a la derecha.
     */
    StyledNotebook.prototype.shiftRightTabs = function shiftRightTabs() {
        this.transitionsQueue.addCommand({type: 'shiftRight'});
    };

    StyledNotebook.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);

        this.repaint();
    };

    /**
     * Crea un Tab y lo asocia con este notebook.
     *
     * @param options opciones de la pestaña:
     *                - containerOptions: indica las opciones particulares del
     *                  contenedor que se creará para el contenido del Tab. Para
     *                  ver las opciones disponibles ver el constructor de
     *                  <code>Container</code>. Valor por defecto: {}.
     *                - closable: indica si se le permitirá al usuario cerrar
     *                  la pestaña mediante el botón cerrar (botón que sólo aparece
     *                  si la pestaña es "closable"). Valor por defecto: true.
     *                - name: indica el texto inicial que se mostrará dentro de la
     *                  pestaña. Valor por defecto: "".
     *                - title: indica el "title" inicial que tendrá el Tab (ver el
     *                  método Tab.setTitle).
     */
    StyledNotebook.prototype.createTab = function createTab(options) {
        var defaultOptions = {
            'initiallyVisible': false,
            'name': '',
            'tab_constructor': this.Tab
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        // Reserve an id for the new tab
        var tabId = this.tabsById.push(null);

        // Create the tab
        if ((options.tab_constructor != this.Tab) && !(options.tab_constructor.prototype instanceof StyledElements.Tab)) {
            throw new TypeError();
        }
        var tab = new options.tab_constructor(tabId, this, options);

        // Insert it into our hashes
        this.tabs[this.tabs.length] = tab;
        this.tabsById[tabId] = tab;

        var tabElement = tab.getTabElement();
        this.tabArea.appendChild(tabElement, this.new_tab_button_tabs);
        tab.insertInto(this.contentArea);
        if (this.maxTabElementWidth == null) {
            this._computeMaxTabElementWidth();
        }
        tabElement.style.maxWidth = this.maxTabElementWidth + 'px';

        if (!this.visibleTab) {
            this.visibleTab = tab;
            tab.setVisible(true);
        }

        // Enable/Disable tab moving buttons
        enableDisableButtons.call(this);

        /* Process options */
        if (options.initiallyVisible) {
            this.goToTab(tabId);
        }

        // Event dispatch
        this.events.tabInsertion.dispatch(this);

        /* Return the container associated with the newly created tab */
        return tab;
    };

    /**
     * Devuelve la instancia de la pestaña indicada mediante su identificador.
     *
     * @param id identificador de la pestaña que se quiere recuperar.
     * @returns {Tab}
     */
    StyledNotebook.prototype.getTab = function getTab(id) {
        return this.tabsById[id];
    };

    /**
     * Search a tab given the label. This method returns the first tab that maches.
     *
     * @param id identificador de la pestaña que se quiere recuperar.
     * @returns {Tab}
     */
    StyledNotebook.prototype.getTabByLabel = function getTabByLabel(label) {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].nameText === label) {
                return this.tabs[i];
            }
        }
        return null;
    };

    /**
     * Returns current tab.
     *
     * @returns {StyledElements.Tab}
     */
    StyledNotebook.prototype.getVisibleTab = function getVisibleTab() {
        return this.visibleTab;
    };

    /**
     * Devuelve la pesataña que está actualmente en la posición indicada.
     *
     * @param index indice de la pestaña de la que se quiere conocer el
     * identificador de pestaña.
     * @returns {Tab}
     */
    StyledNotebook.prototype.getTabByIndex = function getTabByIndex(index) {
        return this.tabs[index];
    };

    /**
     * Devuelve la posición actual de la pestaña indicada mediante su identificador.
     * Esta operación es lenta, por lo que no conviene abusar de ella.
     *
     * @param id identificador de la pestaña de la que se quiere conocer su posición
     * actual.
     */
    StyledNotebook.prototype.getTabIndex = function getTabIndex(id) {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].tabId == id) {
                return i;
            }
        }
        return null;
    };

    /**
     * Elimina del notebook la pestaña indicada mediante su identificador.
     * @param id identificador de la pestaña que se quiere eliminar.
     */
    StyledNotebook.prototype.removeTab = function removeTab(id) {
        var index, tabToExtract, nextTab;

        if (!this.tabsById[id]) {
            return;
        }

        delete this.tabsById[id];
        index = this.getTabIndex(id);
        tabToExtract = this.tabs.splice(index, 1)[0];

        this.tabArea.removeChild(tabToExtract.getTabElement());
        this.contentArea.removeChild(tabToExtract.wrapperElement);

        // Enable/Disable tab scrolling buttons
        enableDisableButtons.call(this);

        if ((this.visibleTab === tabToExtract) && (this.tabs.length > 0)) {
            nextTab = this.tabs[index];
            if (!nextTab) {
                nextTab = this.tabs[index - 1];
            }
            this.goToTab(nextTab.tabId);
        }

        // Send specific tab close event
        tabToExtract.events.close.dispatch(tabToExtract, this);

        // Event dispatch
        this.events.tabDeletion.dispatch(this, tabToExtract);
    };

    /**
     * Marca la pestaña indicada mediante su identificador como visible, haciendo
     * que el contenido de esta sea visible. En caso de que el notebook fuera
     * creado con la opción "focusOnSetVisible" activada, además se le pasará el
     * foco a la pestaña asociada.
     *
     * @param {Number|Tab} tab instancia o identificador de la pestaña que se quiere eliminar.
     */
    StyledNotebook.prototype.goToTab = function goToTab(tab, options) {
        var newTab, oldTab;

        if (tab instanceof StyledElements.Tab) {
            if (this.tabsById[tab.tabId] !== tab) {
                throw new TypeError('tab is not owned by this notebook');
            }
            newTab = tab;
        } else {
            newTab = this.tabsById[tab];
            if (newTab == null) {
                throw new TypeError('Invalid tab id');
            }
        }
        oldTab = this.visibleTab;

        if (options == null) {
            options = {};
        }

        if (this.visibleTab && newTab == this.visibleTab) {
            if (this.focusOnSetVisible) {
                this.focus(newTab.tabId);
            }
            return;
        }

        this.events.change.dispatch(this, oldTab, newTab, options.context);

        if (this.visibleTab) {
            this.visibleTab.setVisible(false);
        }

        this.visibleTab = newTab;
        this.visibleTab.setVisible(true);

        if (this.focusOnSetVisible) {
            this.focus(newTab.tabId);
        }

        this.events.changed.dispatch(this, oldTab, newTab, options.context);
    };

    /**
     * Devuelve el número de pestañas disponibles actualmente en este notebook.
     */
    StyledNotebook.prototype.getNumberOfTabs = function getNumberOfTabs() {
        return this.tabs.length;
    };

    /**
     * Establece el foco en la pestaña indicada, esto es, fuerza a que sea visible
     * la pestaña en el area de pestañas del notebook.
     */
    StyledNotebook.prototype.focus = function focus(tabId) {
        this.transitionsQueue.addCommand({type: 'focus', tabId: tabId});
    };

    /**
     * @private
     */
    StyledNotebook.prototype._computeMaxTabElementWidth = function _computeMaxTabElementWidth() {
        var tabAreaWidth, tabElement, computedStyle, tabAreaComputedStyle;

        if (this.tabs.length === 0) {
            this.maxTabElementWidth = null;
            return;
        }

        tabAreaWidth = this.tabArea.wrapperElement.clientWidth;
        tabElement = this.tabs[0].getTabElement();

        computedStyle = document.defaultView.getComputedStyle(tabElement, null);
        if (computedStyle.getPropertyCSSValue('display') == null) {
            this.maxTabElementWidth = null;
            return;
        }

        tabAreaComputedStyle = document.defaultView.getComputedStyle(this.tabArea.wrapperElement, null);
        tabAreaWidth -= tabAreaComputedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
        tabAreaWidth -= tabAreaComputedStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
        this.maxTabElementWidth = tabAreaWidth;
    };

    var repaint_tab_area = function repaint_tab_area() {
        var i, j, tabElement, maxWidth, tabComputedStyle, childComputedStyle;

        this._computeMaxTabElementWidth();

        for (i = 0; i < this.tabs.length; i++) {
            tabElement = this.tabs[i].getTabElement();
            maxWidth = this.maxTabElementWidth;
            tabComputedStyle = document.defaultView.getComputedStyle(tabElement, null);
            maxWidth -= tabComputedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
            maxWidth -= tabComputedStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
            maxWidth -= tabComputedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            maxWidth -= tabComputedStyle.getPropertyCSSValue('border-right-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
            for (j = 1; j < tabElement.childNodes.length; j++) {
                childComputedStyle = document.defaultView.getComputedStyle(tabElement.childNodes[j], null);
                maxWidth -= tabElement.childNodes[j].offsetWidth;
                maxWidth -= childComputedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
                maxWidth -= childComputedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
            }
            tabElement.style.maxWidth = this.maxTabElementWidth + 'px';
            tabElement.firstChild.style.maxWidth = maxWidth + 'px';
        }
    };

    StyledNotebook.prototype.repaint = function repaint(temporal) {
        var i, height;
        temporal = temporal !== undefined ? temporal: false;

        if (this.fullscreen !== true) {
            height = this._getUsableHeight();
            if (height == null) {
                return; // nothing to do
            }

            this.wrapperElement.style.height = (height + "px");
        } else {
            this.wrapperElement.style.height = '';
        }

        this.tabWrapper.repaint();

        repaint_tab_area.call(this);

        // Enable/Disable tab scrolling buttons
        enableDisableButtons.call(this);

        // Resize contents
        if (temporal) {
            if (this.visibleTab) {
                this.visibleTab.repaint(true);
            }
        } else {
            for (i = 0; i < this.tabs.length; i++) {
                this.tabs[i].repaint(false);
            }
        }
    };

    /**
     * Devuelve <code>true</code> si este Componente está deshabilitado.
     */
    StyledNotebook.prototype.isDisabled = function isDisabled() {
        return this.disabledLayer != null;
    };

    /**
     * Deshabilita/habilita este notebook. Cuando un notebook está deshabilitado
     * los usuarios no pueden realizar ninguna operación de ningún componente
     * incluido dentro de este.
     */
    StyledNotebook.prototype.setDisabled = function setDisabled(disabled) {
        if (this.isDisabled() == disabled) {
            // Nothing to do
            return;
        }

        if (disabled) {
            this.disabledLayer = document.createElement('div');
            this.disabledLayer.classList.add('disable-layer');
            this.wrapperElement.appendChild(this.disabledLayer);
        } else {
            StyledElements.Utils.removeFromParent(this.disabledLayer);
            this.disabledLayer = null;
        }
        this.enabled = !disabled;
    };

    StyledNotebook.prototype.enable = function enable() {
        this.setDisabled(false);
    };

    StyledNotebook.prototype.disable = function disable() {
        this.setDisabled(true);
    };

    StyledNotebook.prototype.clear = function clear() {
        this.tabs = [];
        this.tabsById = [];
        this.visibleTab = null;

        this.tabArea.clear();
        this.contentArea.innerHTML = '';

        // Enable/Disable tab scrolling buttons
        enableDisableButtons.call(this);
    };

    StyledNotebook.prototype.addButton = function addButton(button, position) {
        if (!(button instanceof StyledElements.StyledButton) && !(button instanceof StyledElements.StyledSelect)) {
            throw new TypeError();
        }

        position = position || 'right';

        switch (position) {
        case 'left':
            this.tabWrapper.getWestContainer().appendChild(button, this.moveLeftButton);
            break;
        case 'right':
            this.tabWrapper.getEastContainer().appendChild(button);
            break;
        }
    };

    StyledNotebook.prototype.requestFullscreen = function requestFullscreen() {
        if ('requestFullscreen' in this.wrapperElement) {
            this.wrapperElement.requestFullscreen();
        } else if ('msRequestFullscreen' in this.wrapperElement) {
            this.wrapperElement.msRequestFullscreen();
        } else if ('mozRequestFullScreen' in this.wrapperElement) {
            this.wrapperElement.mozRequestFullScreen();
        } else if ('webkitRequestFullscreen' in this.wrapperElement) {
            this.wrapperElement.webkitRequestFullscreen();
        }
    };

    StyledNotebook.prototype.exitFullscreen = function exitFullscreen() {
        if (this.fullscreen !== true) {
            return;
        }

        if ('exitFullscreen' in document) {
            document.exitFullscreen();
        } else if ('msExitFullscreen' in document) {
            document.msExitFullscreen();
        } else if ('mozCancelFullScreen' in document) {
            document.mozCancelFullScreen();
        } else if ('webkitExitFullscreen' in document) {
            document.webkitExitFullscreen();
        }
    };

    StyledNotebook.prototype.destroy = function destroy() {
        if (StyledElements.Utils.XML.isElement(this.wrapperElement.parentNode)) {
            StyledElements.Utils.removeFromParent(this.wrapperElement);
        }

        this.tabs = null;
        this.tabsById = null;
        this.visibleTab = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.StyledNotebook = StyledNotebook;

})();
