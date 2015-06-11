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

/* global CSSPrimitiveValue, StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class StyledElement.
     *
     * @constructor
     * @param {String[]} events [description]
     */
    se.StyledElement = utils.defineClass({

        constructor: function StyledElement(events) {
            this.wrapperElement = null;
            this.parentElement = null;

            Object.defineProperties(this, {

                enabled: {
                    get: function get() {
                        return !this.hasClass('disabled');
                    },
                    set: function set(value) {
                        this.toggleClass('disabled', !value)
                            ._onenabled(value);
                    }
                },

                hidden: {
                    get: function get() {
                        return this.hasClass('hidden');
                    },
                    set: function set(value) {
                        this.toggleClass('hidden', value)
                            ._onhidden(value);
                    }
                }

            });

            this.mixinClass(0, ['hide', 'show'].concat(events));
        },

        mixins: [se.ObjectWithEvents],

        members: {

            /**
             * @version 0.2.0
             * @abstract
             */
            _onenabled: function _onenabled(enabled) {
                // This member can be implemented by subclass.
            },

            /**
             * @version 0.2.0
             * @abstract
             */
            _onhidden: function _onhidden(hidden) {
                // This member can be implemented by subclass.
            },

            /**
             * Add one or more classes to the wrapperElement.
             * @version 0.2.0
             *
             * @param {String} classList
             *      One or more space-separated classes to be added to the
             *      wrapperElement.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            addClass: function addClass(classList) {
                classList = typeof classList !== 'string' ? "" : classList.trim();

                if (classList) {
                    classList.split(/\s+/).forEach(function (className) {
                        this.get().classList.add(className);
                    }, this);
                }

                return this;
            },

            /**
             * Insert a new element to the end of the wrapperElement children.
             * @version 0.2.0
             *
             * @param {StyledElement|HTMLElement|String} newElement
             *      An element to insert into the wrapperElement.
             * @param {StyledElement|HTMLElement} [refElement]
             *      Optional. An element after which newElement is inserted.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            append: function append(newElement, refElement) {

                if (newElement instanceof se.StyledElement) {
                    newElement.parentElement = this;
                    newElement = newElement.get();
                }

                if (typeof newElement === 'string') {
                    newElement = document.createTextNode(newElement);
                }

                if (refElement instanceof se.StyledElement) {
                    refElement = refElement.get();
                }

                if (refElement != null) {
                    this.get().insertBefore(newElement, refElement.nextSibling);
                } else {
                    this.get().appendChild(newElement);
                }

                return this;
            },

            /**
             * Insert the wrapperElement to the end of the targetElement children.
             * @param {StyledElement|HTMLElement} targetElement
             *      An element to insert the wrapperElement.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            appendTo: function appendTo(targetElement) {

                if (targetElement instanceof se.StyledElement) {
                    targetElement.append(this.get());
                } else {
                    targetElement.appendChild(this.get());
                }

                return this;
            },

            /**
             * Disable the wrapperElement.
             * @version 0.2.0
             *
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            disable: function disable() {

                if (this.enabled) {
                    this.enabled = false;
                }

                return this;
            },

            /**
             * Enable the wrapperElement.
             * @version 0.2.0
             *
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            enable: function enable() {

                if (!this.enabled) {
                    this.enabled = true;
                }

                return this;
            },

            /**
             * Remove all children of the wrapperElement from the DOM.
             * @version 0.2.0
             *
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            empty: function empty() {

                while (this.wrapperElement.firstChild) {
                    this.wrapperElement.removeChild(this.wrapperElement.firstChild);
                }

                return this;
            },

            /**
             * Get the attached wrapperElement.
             * @version 0.2.0
             *
             * @returns {HTMLElement}
             *      If the wrapperElement is not instance of HTMLElement, the member
             *      throws TypeError exception.
             */
            get: function get() {

                if (!(this.wrapperElement instanceof HTMLElement)) {
                    throw new TypeError("The wrapperElement must be instance of HTMLElement.");
                }

                return this.wrapperElement;
            },

            /**
             * Check if an element is a descendant of the wrapperElement.
             * @version 0.2.0
             *
             * @param {StyledElement|HTMLElement} childElement
             *      An element that may be contained.
             * @returns {Boolean}
             *      If the given element is a descendant of the wrapperElement, even so
             *      it is a direct child or nested more deeply.
             */
            has: function has(childElement) {

                if (childElement instanceof se.StyledElement) {
                    childElement = childElement.get();
                }

                return this.get().contains(childElement);
            },

            /**
             * Check if the wrapperElement is assigned a class.
             * @version 0.2.0
             *
             * @param {String} className
             *      A class name to search for.
             * @returns {Boolean}
             *      If the class is assigned to the wrapperElement, even if other classes
             *      also are.
             */
            hasClass: function hasClass(className) {
                className = typeof className !== 'string' ? "" : className.trim();

                return this.get().classList.contains(className);
            },

            /**
             * Display the wrapperElement.
             * @version 0.2.0
             *
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            hide: function hide() {

                if (!this.hidden) {
                    this.hidden = true;
                    this.trigger('hide', this);
                }

                return this;
            },

            /**
             * Get the parent of the wrapperElement.
             * @version 0.2.0
             *
             * @returns {HTMLElement}
             *      The parent element of the wrapperElement.
             */
            parent: function parent() {

                if (this.parentElement != null) {
                    return this.parentElement.get();
                }

                return this.get().parentElement;
            },

            /**
             * Insert a new element to the beginning of the wrapperElement children.
             * @version 0.2.0
             *
             * @param {StyledElement|HTMLElement|String} newElement
             *      An element to insert into the wrapperElement.
             * @param {StyledElement|HTMLElement} [refElement]
             *      Optional. An element before which newElement is inserted.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            prepend: function prepend(newElement, refElement) {

                if (newElement instanceof se.StyledElement) {
                    newElement.parentElement = this;
                    newElement = newElement.get();
                }

                if (typeof newElement === 'string') {
                    newElement = document.createTextNode(newElement);
                }

                if (refElement instanceof se.StyledElement) {
                    refElement = refElement.get();
                }

                if (refElement == null) {
                    refElement = this.get().firstChild;
                }

                this.get().insertBefore(newElement, refElement);

                return this;
            },

            /**
             * Insert the wrapperElement to the beginning of the targetElement children.
             * @param {StyledElement|HTMLElement} targetElement
             *      An element to insert the wrapperElement.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            prependTo: function prependTo(targetElement) {

                if (targetElement instanceof se.StyledElement) {
                    targetElement.prepend(this.get());
                } else {
                    targetElement.insertBefore(this.get(), targetElement.firstChild);
                }

                return this;
            },

            /**
             * Remove the wrapperElement or a specified child from the DOM.
             * @version  0.2.0
             *
             * @param {StyledElement|HTMLElement} [childElement]
             *      An element to be removed from the DOM.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            remove: function remove(childElement) {

                if (childElement instanceof se.StyledElement) {
                    childElement.parentElement = null;
                    childElement = childElement.get();
                }

                if (!arguments.length || childElement == null) {
                    if (this.parentElement != null) {
                        this.parentElement.remove(this);
                    } else {
                        if (this.get().parentElement != null) {
                            this.get().parentElement.removeChild(this.get());
                        }
                    }
                } else {
                    if (this.get().contains(childElement)) {
                        this.get().removeChild(childElement);
                    }
                }

                return this;
            },

            /**
             * Remove multiple or all classes from the wrapperElement.
             * @version 0.2.0
             *
             * @param {String} [classList]
             *      Optional. One or more space-separated classes to be removed from the
             *      wrapperElement. If no class names are given, all classes will be
             *      removed.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            removeClass: function removeClass(classList) {
                classList = typeof classList !== 'string' ? "" : classList.trim();

                if (classList) {
                    classList.split(/\s+/).forEach(function (className) {
                        this.get().classList.remove(className);
                    }, this);
                } else {
                    this.get().removeAttribute('class');
                }

                return this;
            },

            /**
             * Replace a existing class with other class.
             * @version 0.2.0
             *
             * @param {String} className1
             *      A existing class name to be removed.
             * @param {String} className2
             *      A new class name to be added.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            replaceClass: function replaceClass(className1, className2) {
                className1 = typeof className1 !== 'string' ? "" : className1.trim();
                className2 = typeof className2 !== 'string' ? "" : className2.trim();

                if (className1) {
                    this.get().classList.remove(className1);
                }

                if (className2) {
                    this.get().classList.add(className2);
                }

                return this;
            },

            /**
             * Display the wrapperElement.
             * @version 0.2.0
             *
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            show: function show() {

                if (this.hidden) {
                    this.hidden = false;
                    this.trigger('show', this);
                }

                return this;
            },

            /**
             * Get the value of a computed style property or set one or more CSS
             * properties for the wrapperElement.
             * @version 0.2.0
             *
             * @param {String|Object.<String, *>} properties
             *      A CSS property name or an object of property-value pairs.
             * @param {String|Number} [value]
             *      Optional. A value to set for the property.
             * @returns {StyledElement|String}
             *      The instance on which the member is called or the CSS property value.
             */
            style: function style(properties, value) {

                if (arguments.length === 1) {
                    if (typeof properties === 'string') {
                        return this.get().style[properties];
                    }

                    for (var name in properties) {
                        this.get().style[name] = properties[name];
                    }
                } else {
                    this.get().style[properties] = value != null ? value : "";
                }

                return this;
            },

            /**
             * Get the text content or set a text as the content of the wrapperElement.
             * @version 0.2.0
             *
             * @param {String|Number|Boolean} [text]
             *      A text to set as the content of the wrapperElement. When Number or
             *      Boolean is given, it will be converted to a string.
             * @returns {StyledElement|String}
             *      The instance on which the member is called or the text content.
             */
            text: function text(text) {

                if (!arguments.length || text == null) {
                    return this.get().textContent;
                }

                this.get().textContent = "" + text;

                return this;
            },

            /**
             * Add or remove one or more classes from the wrapperElement, depending on
             * either the class's presence.
             * @version 0.2.0
             *
             * @param {String} classList
             *      One or more space-separated classes to be toggled from the
             *      wrapperElement.
             * @param {Boolean} [state]
             *      A boolean value to determine if the class should be added or removed.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            toggleClass: function toggleClass(classList, state) {
                classList = typeof classList !== 'string' ? "" : classList.trim();

                if (classList.length) {
                    if (typeof state !== 'boolean') {
                        classList.split(/\s+/).forEach(function (className) {
                            if (this.get().classList.contains(className)) {
                                this.get().classList.remove(className);
                            } else {
                                this.get().classList.add(className);
                            }
                        }, this);
                    } else {
                        var method = state ? "add" : "remove";

                        classList.split(/\s+/).forEach(function (className) {
                            this.get().classList[method](className);
                        }, this);
                    }
                }

                return this;
            },

            _getUsableHeight: function _getUsableHeight() {
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
            },

            _getUsableWidth: function _getUsableWidth() {
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
            },

            /**
             * @deprecated since version 0.2.0
             */
            addClassName: function addClassName(className) {
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
            },

            /**
             * @deprecated since version 0.2.0
             */
            getBoundingClientRect: function getBoundingClientRect() {
                return this.wrapperElement.getBoundingClientRect();
            },

            /**
             * @deprecated since version 0.2.0
             */
            hasClassName: function hasClassName(className) {
                return this.wrapperElement.classList.contains(className);
            },

            /**
             * Inserta el elemento con estilo dentro del elemento indicado.
             *
             * @param element Este será el elemento donde se insertará el elemento con
             * estilo.
             * @param refElement Este parámetro es opcional. En caso de ser usado, sirve
             * para indicar delante de que elemento se tiene que añadir este elemento con
             * estilo.
             */
            insertInto: function insertInto(element, refElement) {
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
            },

            /**
             * @deprecated since version 0.2.0
             */
            removeClassName: function removeClassName(className) {
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
            },

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
            repaint: function repaint(temporal) {},

            /**
             * @deprecated since version 0.2.0
             */
            setDisabled: function setDisabled(disable) {
                if (disable) {
                    return this.disable();
                } else {
                    return this.enable();
                }
            }

        }

    });

})(StyledElements, StyledElements.Utils);
