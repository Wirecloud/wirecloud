/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * Creates a new instance of Fragment.
     * @name StyledElements.Fragment
     * @since 0.5
     *
     * @constructor
     * @extends {StyledElements.StyledElement}
     *
     * @param {(Array|String|Node|StyledElement)} newElement
     *     An element or list of elements.
     */
    se.Fragment = function Fragment(newElement) {
        se.StyledElement.call(this);

        /**
         * The list of elements stored.
         * @since 0.7
         *
         * @memberof StyledElements.Fragment#
         * @type {Array.<(Node|StyledElements.StyledElement)>}
         */
        this.children = [];

        if (Array.isArray(newElement)) {
            newElement.forEach(function (childElement) {
                this.appendChild(childElement);
            }.bind(this));
        } else {
            this.appendChild(newElement);
        }

        Object.defineProperties(this, {
            elements: {
                get: function get() {return this.children;}
            }
        });
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(se.Fragment, se.StyledElement, /** @lends StyledElements.Fragment.prototype */{

        /**
         * Insert the `newElement` to the end of this Fragment.
         * @since 0.5
         *
         * @param {(Node|String|StyledElements.StyledElement)} newElement
         *     An element to insert into this Fragment.
         *
         * @returns {StyledElements.Fragment}
         *     The instance on which the member is called.
         */
        appendChild: function appendChild(newElement) {

            if (newElement == null) {
                return this;
            }

            if (typeof newElement === 'string') {
                this.children = this.children.concat(getChildrenFromText(newElement));
            } else if (newElement instanceof se.Fragment) {
                this.children = this.children.concat(newElement.children);
            } else {
                this.children.push(newElement);
            }

            return this;
        },

        /*
         * @override
         */
        appendTo: function appendTo(parentElement, refElement) {
            this.children.forEach(function (childElement) {
                utils.appendChild(parentElement, childElement, refElement);
            });
            return this;
        },

        /*
         * @override
         */
        repaint: function repaint() {
            this.children.forEach(function (childElement) {
                if (typeof childElement.repaint === 'function') {
                    childElement.repaint();
                }
            });
            return this;
        }

    });

    var getChildrenFromText = function getChildrenFromText(text) {
        var targetElement, children = [];

        if (text.length) {
            targetElement = document.createElement('div');
            targetElement.innerHTML = text;
            children = Array.prototype.slice.call(targetElement.childNodes);
        }

        return children;
    };

})(StyledElements, StyledElements.Utils);
