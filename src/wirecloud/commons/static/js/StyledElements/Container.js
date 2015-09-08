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

            if (options.extraClass) {
                this.addClass(options.extraClass);
            }

            if (options['class']) {
                this.addClass(options['class']);
            }
        },

        inherit: se.StyledElement,

        members: {

            /**
             * @override
             */
            append: function append(newElement, refElement) {

                if (newElement instanceof se.StyledElement) {
                    this.children.push(newElement);
                }

                return this.superMember(se.StyledElement, 'append', newElement, refElement);
            },

            /**
             * @override
             */
            empty: function empty() {
                var i = this.children.length

                while (i--) {
                    this.remove(this.children[i]);
                }

                return this.superMember(se.StyledElement, 'empty');
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

                if (childElement instanceof se.StyledElement) {
                    if ((index=this.children.indexOf(childElement)) < 0) {
                        return this;
                    }

                    this.children.splice(index, 1);
                }

                return this.superMember(se.StyledElement, 'remove', childElement);
            },

            /**
             * @deprecated since version 0.2.0
             */
            appendChild: function appendChild(element, refElement) {
                if (element instanceof StyledElements.StyledElement) {
                    element.insertInto(this.wrapperElement, refElement);
                    this.children.push(element);

                    return element;
                }

                if (typeof element === "string") {
                    element = document.createTextNode(element);
                }

                if (refElement instanceof StyledElements.StyledElement) {
                    refElement = refElement.wrapperElement;
                }

                if (refElement != null) {
                    this.wrapperElement.insertBefore(element, refElement);
                } else {
                    this.wrapperElement.appendChild(element);
                }

                return element;
            },

            /**
             * @deprecated since version 0.2.0
             */
            removeChild: function removeChild(element) {
                var index;

                if (element instanceof StyledElements.StyledElement) {
                    index = this.children.indexOf(element);
                    this.children.splice(index, 1);
                    this.wrapperElement.removeChild(element.wrapperElement);
                } else {
                    this.wrapperElement.removeChild(element);
                }

                return this;
            },

            /**
             * @deprecated since version 0.2.0
             */
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

            /**
             * @deprecated since version 0.2.0
             */
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

            /**
             * @deprecated since version 0.2.0
             */
            isDisabled: function isDisabled() {
                return this.disabledLayer != null;
            },

            /**
             * @deprecated since version 0.2.0
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

            /**
             * @deprecated since version 0.2.0
             */
            enable: function enable() {
                this.setDisabled(false);
            },

            /**
             * @deprecated since version 0.2.0
             */
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
