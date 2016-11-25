/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Creates a new instance of class Container.
     *
     * @constructor
     * @extends StyledElements.StyledElement
     * @name StyledElements.Container
     * @since 0.5
     * @param {Object.<String, *>} options [description]
     * @param {String[]} events [description]
     */
    se.Container = function Container(options, events) {
        options = utils.merge(utils.clone(defaults), options);
        se.StyledElement.call(this, events);

        this.wrapperElement = document.createElement(options.tagname);
        this.wrapperElement.className = 'se-container';

        if (options.id) {
            this.wrapperElement.setAttribute('id', options.id);
        }

        this.addClassName(options.class);

        var priv = {
            children: []
        };

        privates.set(this, priv);

        Object.defineProperties(this, {
            'children': {
                get: function () {
                    return priv.children.slice(0);
                }
            }
        });
    };

    utils.inherit(se.Container, se.StyledElement, /** @lends StyledElements.Container.prototype */ {

        /**
         * Checks if the given element is a direct descendant of this
         * `Container`.
         *
         * @since 0.6
         *
         * @param {StyledElements.StyledElement|HTMLElement} childElement
         *      An element that may be contained.
         *
         * @returns {Boolean}
         *      If the given element is a child of this `Container`.
         */
        has: function has(childElement) {

            var priv = privates.get(this);

            if (childElement instanceof se.StyledElement && priv.children.indexOf(childElement) !== -1) {
                return true;
            }

            return childElement.parentElement === this.get();
        },

        /**
         * Inserts the `newElement` either to the end of this Container
         * or after the `refElement` given.
         *
         * @since 0.5
         *
         * @param {(StyledElements.StyledElement|Node|String)} newElement
         *     An element to insert into this Container.
         * @param {(StyledElements.StyledElement|Node)} [refElement]
         *     Optional. An element after which `newElement` is inserted.
         *
         * @returns {StyledElements.Container}
         *     The instance on which the member is called.
         */
        appendChild: function appendChild(newElement, refElement) {
            utils.appendChild(this, newElement, refElement).forEach(addChild, this);
            orderbyIndex.call(this);
            return this;
        },

        /**
         * Inserts the `newElement` to the beginning of this `Container`
         * or before the `refElement` given.
         *
         * @since 0.7
         *
         * @param {(StyledElements.StyledElement|Node|String)} newElement
         *     An element to insert into this Container.
         * @param {(StyledElements.StyledElement|Node)} [refElement]
         *     Optional. An element before which `newElement` is inserted.
         *
         * @returns {StyledElements.Container}
         *      The instance on which the member is called.
         */
        prependChild: function prependChild(newElement, refElement) {
            utils.prependChild(this, newElement, refElement).forEach(addChild, this);
            orderbyIndex.call(this);
            return this;
        },

        /**
         * Removes the `childElement` from this `Container`.
         *
         * @since 0.5
         *
         * @param {(StyledElements.StyledElement|Node)} childElement
         *     An element to remove from this Container.
         *
         * @returns {StyledElements.Container}
         *      The instance on which the member is called.
         */
        removeChild: function removeChild(childElement) {
            utils.removeChild(this, childElement);

            if (childElement instanceof se.StyledElement) {
                var priv = privates.get(this);
                priv.children.splice(priv.children.indexOf(childElement), 1);
            }

            return this;
        },

        /**
         * Removes the `childElement` from this `Container`.
         *
         * @since 0.5
         *
         * @param {(StyledElements.StyledElement|Node)} childElement
         *     An element to remove from this Container.
         *
         * @returns {StyledElements.Container}
         *      The instance on which the member is called.
         */
        repaint: function repaint(temporal) {
            temporal = temporal !== undefined ? temporal : false;

            var priv = privates.get(this);
            for (var i = 0; i < priv.children.length; i++) {
                priv.children[i].repaint(temporal);
            }
        },

        /**
         * Removes all children from this `Container`.
         *
         * @since 0.5
         *
         * @returns {StyledElements.Container}
         *      The instance on which the member is called.
         */
        clear: function clear() {
            var priv = privates.get(this);

            priv.children = [];
            this.wrapperElement.innerHTML = "";
            this.wrapperElement.scrollTop = 0;
            this.wrapperElement.scrollLeft = 0;
            if (priv.disabledLayer != null) {
                this.wrapperElement.appendChild(priv.disabledLayer);
            }

            return this;
        },

        /**
         * Gets the combined text content of this `Container`.
         *
         * @param {String} [newText] The text to set as the content of this
         * `Container`
         *
         * @returns {StyledElements.Container|String}
         *      The combined text content of this `Container` if the
         *      `newText` parameter is not used. Otherways, the instance on
         *      which the member is called.
         */
        text: function text(text) {
            if (text == null) {
                return this.get().textContent;
            } else {
                return this.clear().appendChild("" + text);
            }
        },

        /**
         * @deprecated since version 0.6.0
         * @see {@link StyledElements.Container#enabled}
         */
        isDisabled: function isDisabled() {
            return !this.enabled;
        },

        _onenabled: function _onenabled(enabled) {
            var icon, priv;

            priv = privates.get(this);

            if (enabled) {
                if (priv.disabledLayer != null) {
                    priv.disabledLayer.remove();
                }
                priv.disabledLayer = null;
            } else {
                priv.disabledLayer = document.createElement('div');
                priv.disabledLayer.className = 'se-container-disable-layer';

                icon = document.createElement('i');
                icon.className = 'disable-icon fa fa-spin fa-spinner';
                priv.disabledLayer.appendChild(icon);

                this.wrapperElement.appendChild(priv.disabledLayer);
            }
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var defaults = {
        class: "",
        id: "",
        tagname: 'div',
        useFullHeight: false
    };

    var addChild = function addChild(newElement) {
        var priv = privates.get(this);
        if (newElement instanceof se.StyledElement) {
            var index = priv.children.indexOf(newElement);

            if (index === -1) {
                priv.children.push(newElement);
            }
        }
    };

    var orderbyIndex = function orderbyIndex() {
        var children = [], priv;

        priv = privates.get(this);
        Array.prototype.forEach.call(this.get().childNodes, function (childNode) {
            var i, elementFound = false;

            for (i = 0; i < priv.children.length && !elementFound; i++) {
                if (priv.children[i].get() === childNode) {
                    children.push(priv.children.splice(i, 1)[0]);
                    elementFound = true;
                }
            }
        });

        priv.children = children;
    };

})(StyledElements, StyledElements.Utils);
