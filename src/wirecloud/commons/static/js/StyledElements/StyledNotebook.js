/*
 *     Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global CommandQueue, CSSPrimitiveValue, EzWebExt, StyledElements*/

(function () {

    "use strict";

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

        StyledElements.StyledElement.call(this, ['change', 'tabDeletion', 'tabInsertion']);

        var defaultOptions = {
            'class': '',
            'focusOnSetVisible': true,
            'full': true
        };
        options = EzWebExt.merge(defaultOptions, options);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = EzWebExt.prependWord(options['class'], "notebook");

        var div = document.createElement("div");
        this.wrapperElement.appendChild(div);

        tabWrapper = new StyledElements.HorizontalLayout({'class': 'tab_wrapper', 'autoHeight': false});
        this.tabWrapper = tabWrapper;
        tabWrapper.insertInto(div);

        this.tabArea = tabWrapper.getCenterContainer();
        this.tabArea.addClassName('tab_area');

        this.moveLeftButton = document.createElement("div");
        this.moveLeftButton.className = "move_left";
        this.moveLeftButton.appendChild(document.createTextNode("<"));
        tabWrapper.getWestContainer().appendChild(this.moveLeftButton);

        this.moveRightButton = document.createElement("div");
        this.moveRightButton.className = "move_right";
        this.moveRightButton.appendChild(document.createTextNode(">"));
        tabWrapper.getEastContainer().appendChild(this.moveRightButton);

        this.contentArea = document.createElement("div");
        this.contentArea.className = "wrapper";
        div.appendChild(this.contentArea);

        this.tabs = [];
        this.tabsById = [];
        this.visibleTab = null;
        this.maxTabElementWidth = '';

        /* Process options */
        if (options.id != null) {
            this.wrapperElement.setAttribute('id', options.id);
        }

        if (options.full) {
            EzWebExt.appendClassName(this.wrapperElement, 'full');
        }

        this.focusOnSetVisible = options.focusOnSetVisible;

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
                context.control._enableDisableButtons();

                return false;
            }
        };

        var initFunc = function initFunc(context, command) {
            var firstVisibleTab, currentTab, maxScrollLeft, baseTime, stepTimes;

            context.initialScrollLeft = context.control.tabArea.wrapperElement.scrollLeft;
            switch (command.type) {
            case 'shiftLeft':

                if (context.control._isTabVisible(0)) {
                    return false;
                }

                firstVisibleTab = context.control.getFirstVisibleTab();
                currentTab = context.control.tabs[firstVisibleTab - 1].getTabElement();
                context.finalScrollLeft = currentTab.offsetLeft;
                break;

            case 'shiftRight':
                if (context.control._isLastTabVisible()) {
                    return false;
                }

                firstVisibleTab = context.control.getFirstVisibleTab();
                currentTab = context.control.tabs[firstVisibleTab + 1].getTabElement();
                context.finalScrollLeft = currentTab.offsetLeft;
                break;
            case 'focus':
                currentTab = context.control.tabsById[command.tabId].getTabElement();

                if (context.control._isTabVisible(context.control.getTabIndex(command.tabId))) {
                    return false;
                }
                context.finalScrollLeft = currentTab.offsetLeft;
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

        this.transitionsQueue = new CommandQueue(context, initFunc, stepFunc);

        /* Code for handling internal events */
        this.moveLeftButton.addEventListener("click",
                                             this.shiftLeftTabs.bind(this),
                                             true);

        this.moveRightButton.addEventListener("click",
                                             this.shiftRightTabs.bind(this),
                                             true);
    };
    StyledNotebook.prototype = new StyledElements.StyledElement();

    /**
     * @private
     */
    StyledNotebook.prototype._isTabVisible = function _isTabVisible(tabIndex, full) {
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
    StyledNotebook.prototype._isLastTabVisible = function _isLastTabVisible() {
        var lastTab = this.tabs.length - 1;

        if (this.tabs.length === 0 || this._isTabVisible(lastTab, true)) {
            return true;
        }
        if (!this._isTabVisible(lastTab)) {
            return false;
        }
        return this.tabs.length < 2 || !this._isTabVisible(lastTab - 1);
    };

    /**
     * @private
     */
    StyledNotebook.prototype._enableDisableButtons = function _enableDisableButtons() {
        if (this.tabs.length === 0) {
            EzWebExt.removeClassName(this.moveLeftButton, "enabled");
            EzWebExt.removeClassName(this.moveRightButton, "enabled");
            return;
        }

        if (this._isTabVisible(0)) {
            EzWebExt.removeClassName(this.moveLeftButton, "enabled");
        } else {
            EzWebExt.appendClassName(this.moveLeftButton, "enabled");
        }

        if (this._isLastTabVisible()) {
            EzWebExt.removeClassName(this.moveRightButton, "enabled");
        } else {
            EzWebExt.appendClassName(this.moveRightButton, "enabled");
        }
    };

    /**
     * @private
     */
    StyledNotebook.prototype.getFirstVisibleTab = function getFirstVisibleTab() {
        var i;
        for (i = 0; i < this.tabs.length; i += 1) {
            if (this._isTabVisible(i)) {
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
            'tab_constructor': StyledElements.Tab
        };
        options = EzWebExt.merge(defaultOptions, options);

        // Reserve an id for the new tab
        var tabId = this.tabsById.push(null);

        // Create the tab
        if ((options.tab_constructor != StyledElements.Tab) && !(options.tab_constructor.prototype instanceof StyledElements.Tab)) {
            throw new TypeError();
        }
        var tab = new options.tab_constructor(tabId, this, options);

        // Insert it into our hashes
        this.tabs[this.tabs.length] = tab;
        this.tabsById[tabId] = tab;

        var tabElement = tab.getTabElement();
        this.tabArea.appendChild(tabElement);
        tab.insertInto(this.contentArea);
        if (this.maxTabElementWidth === '') {
            this._computeMaxTabElementWidth();
        }
        tabElement.style.maxWidth = this.maxTabElementWidth;

        if (!this.visibleTab) {
            this.visibleTab = tab;
            tab.setVisible(true);
        }

        // Enable/Disable tab moving buttons
        this._enableDisableButtons();

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
        this._enableDisableButtons();

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
    StyledNotebook.prototype.goToTab = function goToTab(tab) {
        var newTab, oldTab;

        if (tab instanceof StyledElements.Tab) {
            if (this.tabsById[tab.tabId] !== tab) {
                throw new Error();
            }
            newTab = tab;
        } else {
            newTab = this.tabsById[tab];
            if (newTab == null) {
                throw new Error();
            }
        }
        oldTab = this.visibleTab;

        if (this.visibleTab && newTab == this.visibleTab) {
            return;
        }

        this.events.change.dispatch(this, oldTab, newTab);

        if (this.visibleTab) {
            this.visibleTab.setVisible(false);
        }

        this.visibleTab = newTab;
        this.visibleTab.setVisible(true);

        if (this.focusOnSetVisible) {
            this.focus(newTab.tabId);
        }
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
        var tabAreaWidth, tabElement, computedStyle, padding;

        if (this.tabs.length === 0) {
            this.maxTabElementWidth = '';
            return;
        }

        tabAreaWidth = this.tabArea.wrapperElement.clientWidth;
        tabElement = this.tabs[0].getTabElement();

        computedStyle = document.defaultView.getComputedStyle(tabElement, null);
        if (computedStyle.getPropertyCSSValue('display') == null) {
            this.maxTabElementWidth = '';
            return;
        }
        padding = computedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
        padding += computedStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
        padding += 2 * computedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.maxTabElementWidth = (tabAreaWidth - padding) + 'px';
    };

    StyledNotebook.prototype.repaint = function repaint(temporal) {
        var i, height, tabElement;
        temporal = temporal !== undefined ? temporal: false;

        height = this._getUsableHeight();
        if (height == null) {
            return; // nothing to do
        }

        this.wrapperElement.style.height = (height + "px");

        this.tabWrapper.repaint();

        // Enable/Disable tab scrolling buttons
        this._enableDisableButtons();

        // Resize content
        if (temporal) {
            if (this.visibleTab) {
                this.visibleTab.repaint(true);
            }
        } else {
            this._computeMaxTabElementWidth();
            for (i = 0; i < this.tabs.length; i++) {
                tabElement = this.tabs[i].getTabElement();
                tabElement.style.maxWidth = this.maxTabElementWidth;

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
            EzWebExt.removeFromParent(this.disabledLayer);
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
        this._enableDisableButtons();
    };

    StyledNotebook.prototype.addButton = function addButton(button) {
        if (!(button instanceof StyledElements.StyledButton)) {
            throw new TypeError();
        }

        this.tabWrapper.getEastContainer().appendChild(button);
    };

    StyledNotebook.prototype.destroy = function destroy() {
        if (EzWebExt.XML.isElement(this.wrapperElement.parentNode)) {
            EzWebExt.removeFromParent(this.wrapperElement);
        }

        this.tabs = null;
        this.tabsById = null;
        this.visibleTab = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.StyledNotebook = StyledNotebook;

})();
