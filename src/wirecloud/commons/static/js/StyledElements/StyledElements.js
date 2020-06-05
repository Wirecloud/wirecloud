/*
 *     Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals CSSPrimitiveValue, StyledElements */


(function (se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class StyledElement.
     *
     * @interface
     * @mixes StyledElements.ObjectWithEvents
     * @name StyledElements.StyledElement
     * @param {String[]} events [description]
     */
    se.StyledElement = function StyledElement(events) {
        this.wrapperElement = null;
        this.parentElement = null;

        Object.defineProperties(this, {

            /**
             * `true` if this element is enabled. This property is
             * writable.
             *
             * @memberof StyledElements.StyledElement#
             * @since 0.6.0
             *
             * @type {Boolean}
             */
            enabled: {
                get: function get() {
                    return !this.hasClassName('disabled');
                },
                set: function set(value) {
                    value = !!value; // Convert into boolean
                    if (this.enabled !== value) {
                        this.toggleClassName('disabled', !value)
                            ._onenabled(value);
                    }
                }
            },

            /**
             * `true` if this element is hidden. This property isArray
             * writable.
             *
             * @memberof StyledElements.StyledElement#
             * @since 0.6.0
             *
             * @type {Boolean}
             */
            hidden: {
                get: function get() {
                    return this.hasClassName('hidden');
                },
                set: function set(value) {
                    this.toggleClassName('hidden', value)
                        ._onhidden(value);
                }
            }

        });

        events = Array.isArray(events) ? events : [];
        se.ObjectWithEvents.call(this, ['hide', 'show'].concat(events));
    };

    utils.inherit(se.StyledElement, se.ObjectWithEvents, /** @lends StyledElements.StyledElement.prototype */ {

        /**
         * @protected
         */
        _onenabled: function _onenabled(enabled) {
            // This member can be implemented by subclass.
        },

        /**
         * @protected
         */
        _onhidden: function _onhidden(hidden) {
            // This member can be implemented by subclass.
        },

        /**
         * Adds one or more classes to this StyledElement.
         *
         * @param {String|String[]} classList
         *      One or more space-separated classes to be added to the
         *      wrapperElement.
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        addClassName: function addClassName(classList) {

            if (!Array.isArray(classList)) {
                classList = classList == null ? "" : classList.toString().trim();
                if (classList === "") {
                    return this;
                }
                classList = classList.split(/\s+/);
            }

            classList.forEach(add_individual_class, this);

            return this;
        },

        /**
         * Inserts this StyledElement either to the end of the `parentElement`
         * or after the `refElement` given.
         * @since 0.6
         *
         * @param {(StyledElements.StyledElement|Node)} parentElement
         *     An element to be the parent of this StyledElement.
         * @param {(StyledElements.StyledElement|Node)} [refElement]
         *     Optional. An element after which this StyledElement is inserted.
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        appendTo: function appendTo(parentElement, refElement) {
            if (parentElement instanceof se.StyledElement && typeof parentElement.appendChild === 'function') {
                parentElement.appendChild(this, refElement);
            } else {
                utils.appendChild(parentElement, this, refElement);
            }
            return this;
        },

        /**
         * Removes any circular reference to this element
         */
        destroy: function destroy() {
            this.remove();
            se.ObjectWithEvents.prototype.destroy.call(this);
        },

        /**
         * Disables this StyledElement
         * @since 0.5
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        disable: function disable() {
            this.enabled = false;

            return this;
        },

        /**
         * Enables this StyledElement
         * @since 0.6
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        enable: function enable() {
            this.enabled = true;

            return this;
        },

        /**
         * Gets the root element for this StyledElement
         * @since 0.6
         *
         * @returns {HTMLElement}
         *      If the wrapperElement is not instance of HTMLElement, the member
         *      throws TypeError exception.
         */
        get: function get() {
            return this.wrapperElement;
        },

        /**
         * Hides this StyledElement
         * @since 0.6
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        hide: function hide() {

            if (!this.hidden) {
                this.hidden = true;
                this.dispatchEvent('hide');
            }

            return this;
        },

        /**
         * Gets the parent of this StyledElement
         * @since 0.6
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
         * Inserts this StyledElement either to the beginning of the `parentElement`
         * or before the `refElement` given.
         * @since 0.7
         *
         * @param {(StyledElements.StyledElement|Node)} parentElement
         *     An element to be the parent of this StyledElement.
         * @param {(StyledElements.StyledElement|Node)} [refElement]
         *     Optional. An element before which this StyledElement is inserted.
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        prependTo: function prependTo(parentElement, refElement) {
            if (parentElement instanceof se.StyledElement && typeof parentElement.prependChild === 'function') {
                parentElement.prependChild(this, refElement);
            } else {
                utils.prependChild(parentElement, this, refElement);
            }
            return this;
        },

        /**
         * Remove this StyledElement from the DOM.
         * @since 0.6
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        remove: function remove() {

            if (this.parentElement instanceof se.StyledElement && typeof this.parentElement.removeChild === 'function') {
                this.parentElement.removeChild(this);
            } else {
                this.get().remove();
            }

            return this;
        },

        /**
         * Replaces CSS classes with others. This method is a shortcut for
         * calling `removeClassName` and `addClassName` at the same time.
         *
         * @since 0.6
         *
         * @param {String|String[]} removeList
         *      classes to remove
         * @param {String|String[]} addList
         *      classes to add
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         *
         * @ example
         *
         * element.className;
         * => "fa fa-plus";
         * element.replaceClassName("fa-plus", "fa-minus");
         * => element
         * element.className;
         * => "fa fa-minus";
         *
         * element.className;
         * => "icon icon-plus";
         * element.replaceClassName("", "fa fa-plus");
         * => element
         * element.className;
         * => "fa fa-plus";
         *
         */
        replaceClassName: function replaceClassName(removeList, addList) {
            this.removeClassName(removeList);
            this.addClassName(addList);

            return this;
        },

        /**
         * Display the wrapperElement.
         * @since 0.6
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        show: function show() {

            if (this.hidden) {
                this.hidden = false;
                this.dispatchEvent('show');
            }

            return this;
        },

        /**
         * Get the value of a computed style property or set one or more CSS
         * properties for the wrapperElement.
         * @since 0.6
         *
         * @param {String|Object.<String, *>} properties
         *      A CSS property name or an object of property-value pairs.
         * @param {String|Number} [value]
         *      Optional. A value to set for the property.
         * @returns {StyledElements.StyledElement|String}
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
         * Add or remove one or more classes from this StyledElement,
         * depending on either the class's presence. Additionaly, you can
         * use the state parameter for indicating if you want to add or
         * delete them.
         * @since 0.6
         *
         * @param {String} classList
         *      One or more space-separated classes to be toggled from the
         *      wrapperElement.
         * @param {Boolean} [state]
         *      A boolean value to determine if the class should be added or removed.
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        toggleClassName: function toggleClassName(classList, state) {
            var method;

            if (!Array.isArray(classList)) {
                classList = classList == null ? [] : classList.toString().trim();
                classList = classList !== "" ? classList.split(/\s+/) : [];
            }

            if (classList.length) {
                if (typeof state !== 'boolean') {
                    classList.forEach(toggle_individual_class, this);
                } else {
                    method = state ? add_individual_class : remove_individual_class;

                    classList.forEach(method, this);
                }
            }

            return this;
        },

        _getUsableHeight: function _getUsableHeight() {
            var parentElement = this.wrapperElement.parentElement;
            if (parentElement == null) {
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
            var parentElement = this.wrapperElement.parentElement;
            if (parentElement == null) {
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

        getBoundingClientRect: function getBoundingClientRect() {
            return this.wrapperElement.getBoundingClientRect();
        },

        /**
         * Returns `true` if this StyledElement is usig the CSS class name
         * `className`, otherwise `false`
         *
         * @param {String} className
         *      A class name to search for.
         * @returns {Boolean}
         *      `true` if this StyledElement is usig the CSS class name
         * `className`, otherwise `false`
         */
        hasClassName: function hasClassName(className) {
            className = className == null ? "" : className.toString().trim();

            return this.get().classList.contains(className);
        },

        /**
         * Inserts this StyledElement either at the end of the `parentElement` or
         * before the `refElement` given.
         *
         * @param {(StyledElements.StyledElement|Node)} parentElement
         *     An element to be the parent of this StyledElement.
         * @param {(StyledElements.StyledElement|Node)} [refElement]
         *     Optional. An element before which this StyledElement is inserted.
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        insertInto: function insertInto(parentElement, refElement) {
            return refElement != null ? this.prependTo(parentElement, refElement) : this.appendTo(parentElement);
        },

        /**
         * Removes multiple or all classes from this StyledElement
         * @since 0.6
         *
         * @param {String|String[]} [classList]
         *      Optional. One or more space-separated classes to be removed from this
         *      StyledElement. If you pass an empty string as the classList parameter,
         *      all classes will be removed.
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        removeClassName: function removeClassName(classList) {
            if (!Array.isArray(classList)) {
                classList = classList == null ? "" : classList.toString().trim();
                if (classList === "") {
                    this.get().className = "";
                    return this;
                }
                classList = classList.split(/\s+/);
            }

            classList.forEach(remove_individual_class, this);

            return this;
        },

        /**
         * Repaints this StyledElement.
         *
         * @param {Boolean} [temporal] `true` if the repaint should be
         * handled as temporal repaint that will be followed, in a short
         * period of time, by more calls to this method. In that case, the
         * sequence should end with a call to this method using `false`
         * for the temporal parameter. `false` by default.
         *
         * @returns {StyledElements.StyledElement}
         *      The instance on which the member is called.
         */
        repaint: function repaint(temporal) {return this;},

        /**
         * @deprecated since version 0.6
         * @see
         *     {@link StyledElements.StyledElement#enable},
         *     {@link StyledElements.StyledElement#disable} and
         *     {@link StyledElements.StyledElement#enabled}
         */
        setDisabled: function setDisabled(disable) {
            if (disable) {
                return this.disable();
            } else {
                return this.enable();
            }
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var add_individual_class = function add_individual_class(className) {
        this.get().classList.add(className);
    };

    var remove_individual_class = function remove_individual_class(className) {
        this.get().classList.remove(className);
    };

    var toggle_individual_class = function toggle_individual_class(className) {
        if (this.get().classList.contains(className)) {
            this.get().classList.remove(className);
        } else {
            this.get().classList.add(className);
        }
    };

})(StyledElements, StyledElements.Utils);
