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

    /**
     * @abstract
     */
    var StyledElement = function StyledElement(events) {
        StyledElements.ObjectWithEvents.call(this, events);
        this.wrapperElement = null;
        this.enabled = true;
    };
    StyledElement.prototype = new StyledElements.ObjectWithEvents();

    /**
     * Inserta el elemento con estilo dentro del elemento indicado.
     *
     * @param element Este será el elemento donde se insertará el elemento con
     * estilo.
     * @param refElement Este parámetro es opcional. En caso de ser usado, sirve
     * para indicar delante de que elemento se tiene que añadir este elemento con
     * estilo.
     */
    StyledElement.prototype.insertInto = function insertInto(element, refElement) {
        if (element instanceof StyledElements.StyledElement) {
            element = element.wrapperElement;
        }

        if (refElement instanceof StyledElements.StyledElement) {
            refElement = refElement.wrapperElement;
        }

        if (refElement) {
            element.insertBefore(this.wrapperElement, refElement);
        } else {
            element.appendChild(this.wrapperElement);
        }

        return this;
    };

    /**
     * @private
     */
    StyledElement.prototype._getUsableHeight = function _getUsableHeight() {
        var parentElement = this.wrapperElement.parentNode;
        if (!StyledElements.Utils.XML.isElement(parentElement)) {
            return null;
        }

        var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
        if (parentStyle.getPropertyCSSValue('display') == null) {
            return null;
        }
        var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

        var height = parentElement.offsetHeight -
                     parentStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     parentStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                     containerStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);

        return height;
    };

    /**
     * @private
     */
    StyledElement.prototype._getUsableWidth = function _getUsableWidth() {
        var parentElement = this.wrapperElement.parentNode;
        if (!StyledElements.Utils.XML.isElement(parentElement)) {
            return null;
        }

        var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
        var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

        var width = parentElement.offsetWidth -
                    parentStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                    parentStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                    containerStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                    containerStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);

        return width;
    };

    /**
     * Esta función sirve para repintar el componente.
     *
     * @param {Boolean} temporal Indica si se quiere repintar el componente de
     * forma temporal o de forma permanente. Por ejemplo, cuando mientras se está
     * moviendo el tirador de un HPaned se llama a esta función con el parámetro
     * temporal a <code>true</code>, permitiendo que los componentes intenten hacer
     * un repintado más rápido (mejorando la experiencia del usuario); y cuando el
     * usuario suelta el botón del ratón se ejecuta una última vez esta función con
     * el parámetro temporal a <code>false</code>, indicando que el usuario ha
     * terminado de mover el tirador y que se puede llevar a cabo un repintado más
     * inteligente. Valor por defecto: <code>false</code>.
     */
    StyledElement.prototype.repaint = function repaint(temporal) {
    };

    /**
     *
     */
    StyledElement.prototype.hasClassName = function hasClassName(className) {
        return this.wrapperElement.classList.contains(className);
    };

    /**
     *
     */
    StyledElement.prototype.addClassName = function addClassName(className) {
        var i, tokens;

        className = className.trim();
        if (className === '') {
            return;
        }

        tokens = className.split(/\s+/);
        for (i = 0; i < tokens.length; i++) {
            this.wrapperElement.classList.add(tokens[i]);
        }

        return this;
    };

    /**
     *
     */
    StyledElement.prototype.removeClassName = function removeClassName(className) {
        var i, tokens;

        className = className.trim();
        if (className === '') {
            return;
        }

        tokens = className.split(/\s+/);
        for (i = 0; i < tokens.length; i++) {
            this.wrapperElement.classList.remove(tokens[i]);
        }

        return this;
    };

    StyledElement.prototype.setDisabled = function setDisabled(disable) {
        if (disable) {
            return this.disable();
        } else {
            return this.enable();
        }
    };

    /**
     * Rehabilita el componente quitándole la clase css .disabled
     */
    StyledElement.prototype.enable = function enable() {
        this.enabled = true;
        this.removeClassName('disabled');

        return this;
    };

    /**
     * Deshabilita el componente añadiendo la clase css .disabled
     */
    StyledElement.prototype.disable = function disable() {
        this.enabled = false;
        this.addClassName('disabled');

        return this;
    };

    /*
     * @experimental
     */
    StyledElement.prototype.getBoundingClientRect = function () {
        return this.wrapperElement.getBoundingClientRect();
    };

    StyledElements.StyledElement = StyledElement;

})();
