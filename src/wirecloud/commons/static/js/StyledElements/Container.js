/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements */


(function (se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Container.
     *
     * @constructor
     * @param {Object.<String, *>} options [description]
     * @param {String[]} events [description]
     */
    se.Container = utils.defineClass({

        constructor: function Container(options, events) {
            options = utils.updateObject(defaults, options);
            this.superClass(events);

            this.wrapperElement = document.createElement('div');
            this.children = [];
            this.useFullHeight = options.useFullHeight;

            if (options.id) {
                this.wrapperElement.setAttribute('id', options.id);
            }

            this.addClassName(options['class']);
            this.addClassName(options.extraClass);
        },

        inherit: se.StyledElement,

        members: {

            /**
             * Check if an element is a descendant of the wrapperElement.
             * @version 0.6
             *
             * @param {StyledElement|HTMLElement} childElement
             *      An element that may be contained.
             * @returns {Boolean}
             *      If the given element is a descendant of the wrapperElement, even so
             *      it is a direct child or nested more deeply.
             */
            has: function has(childElement) {

                if (childElement instanceof se.StyledElement && this.children.indexOf(childElement) !== -1) {
                    return true;
                }

                return childElement.parentElement == this.get();
            },

            /**
             * @override
             */
            prepend: function prepend(newElement, refElement) {

                if (newElement instanceof se.StyledElement) {
                    this.children.push(newElement);
                }

                return this.superMember(se.StyledElement, 'prepend', newElement, refElement);
            },

            /**
             * @override
             */
            remove: function remove(childElement) {
                var index;

                if (childElement == null) {
                    return this.superMember(se.StyledElement, 'remove', childElement);
                }

                if (childElement instanceof se.StyledElement) {
                    if ((index = this.children.indexOf(childElement)) === -1) {
                        return this;
                    }

                    this.children.splice(index, 1);
                    childElement.parentElement = null;

                    // Get the DOM element
                    childElement = childElement.get();
                }

                if (childElement.parentElement === this.get()) {
                    this.get().removeChild(childElement);
                }

                return this;
            },

            /**
             * Insert an element at the end of this container or before the
             * refElement if provided.
             *
             * @param {StyledElement|HTMLElement|String} newElement
             *      An element to insert into the wrapperElement.
             * @param {StyledElement|HTMLElement} [refElement]
             *      Optional. An element after which newElement is inserted.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            appendChild: function appendChild(element, refElement) {
                if (element instanceof StyledElements.StyledElement) {
                    element.insertInto(this.wrapperElement, refElement);
                    element.parentElement = this;
                    this.children.push(element);

                    return this;
                }

                if (typeof element === "string") {
                    element = document.createTextNode(element);
                }

                if (refElement instanceof StyledElements.StyledElement) {
                    refElement = refElement.get();
                }

                if (refElement != null) {
                    this.wrapperElement.insertBefore(element, refElement);
                } else {
                    this.wrapperElement.appendChild(element);
                }

                return this;
            },

            /**
             * Inserts a new element to the beginning of this Container
             * @version 0.6
             *
             * @param {StyledElement|HTMLElement|String} newElement
             *      An element to insert into the wrapperElement.
             * @param {StyledElement|HTMLElement} [refElement]
             *      Optional. An element before which newElement is inserted.
             * @returns {StyledElement}
             *      The instance on which the member is called.
             */
            prependChild: function prependChild(newElement, refElement) {
                return this.appendChild(newElement, this.get().firstChild);
            },

            removeChild: function removeChild(element) {
                if (element == null) {
                    throw new TypeError('missing element parameter');
                }

                return this.remove(element);
            },

            repaint: function repaint(temporal) {
                temporal = temporal !== undefined ? temporal : false;

                if (this.useFullHeight) {
                    if (this.wrapperElement.classList.contains('hidden')) {
                        this.wrapperElement.style.height = "";
                        return;
                    }

                    var height = this._getUsableHeight();
                    if (height == null) {
                        return; // nothing to do
                    }

                    this.wrapperElement.style.height = (height + "px");
                }

                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].repaint(temporal);
                }

                if (this.disabledLayer != null) {
                    this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
                    this.disabledLayer.style.lineHeight = this.wrapperElement.clientHeight + 'px';
                }
            },

            clear: function clear() {
                this.children = [];
                this.wrapperElement.innerHTML = "";
                this.wrapperElement.scrollTop = 0;
                this.wrapperElement.scrollLeft = 0;
                if (this.disabledLayer != null) {
                    this.wrapperElement.appendChild(this.disabledLayer);
                }

                return this;
            },

            text: function (text) {
                  if (text == null) {
                      return this.get().textContent;
                  }

                  this.children = []
                  this.wrapperElement.textContent = "" + text;
            },

            /**
             * @deprecated since version 0.6.0
             */
            isDisabled: function isDisabled() {
                return this.disabledLayer != null;
            },

            /**
             * @deprecated since version 0.6.0
             */
            setDisabled: function setDisabled(disabled) {
                if (this.isDisabled() == disabled) {
                    // Nothing to do
                    return;
                }

                if (disabled) {
                    this.disabledLayer = document.createElement('div');
                    this.disabledLayer.className = 'se-container-disable-layer';

                    this.disabled_icon = document.createElement('i');
                    this.disabled_icon.className = 'disable-icon icon-spin icon-spinner';
                    this.disabledLayer.appendChild(this.disabled_icon);

                    this.wrapperElement.appendChild(this.disabledLayer);
                    this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
                    this.disabledLayer.style.lineHeight = this.wrapperElement.clientHeight + 'px';
                } else {
                    this.disabledLayer.parentNode.removeChild(this.disabledLayer);
                    this.disabledLayer = null;
                    this.disable_icon = null;
                }
                this.enabled = !disabled;
            },

            enable: function enable() {
                this.setDisabled(false);
            },

            disable: function disable() {
                this.setDisabled(true);
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        'class': "",
        id: "",
        extraClass: "",
        useFullHeight: false
    };

})(StyledElements, StyledElements.Utils);
