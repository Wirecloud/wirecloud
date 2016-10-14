/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
     * Creates a new instance of class OffCanvasLayout.
     * @since 0.6
     *
     * @name StyledElements.OffCanvasLayout
     * @constructor
     * @extends {StyledElements.StyledElement}
     *
     * @param {Object} [options]
     * @param {String} [options.sideway='left']
     */
    se.OffCanvasLayout = function OffCanvasLayout(options) {
        se.StyledElement.call(this, ['slideIn', 'slideOut']);

        options = utils.merge({
            sideway: 'left'
        }, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = 'se-offcanvas ' + options.sideway + '-sideway';

        Object.defineProperties(this, {
            slipped: {
                get: function get() {return this.hasClassName('slipped');}
            },
            sidebar: {value: new se.Container({class: 'se-offcanvas-sidebar'})},
            content: {value: new se.Container({class: 'se-offcanvas-content'})}
        });

        this.index = -1;

        this.sidebar.appendTo(this.wrapperElement);
        this.content.appendTo(this.wrapperElement);
    };

    utils.inherit(se.OffCanvasLayout, se.StyledElement, /** @lends StyledElements.OffCanvasLayout.prototype */ {

        /**
         * @param {StyledElements.StyledElement} element
         * @returns {StyledElements.OffCanvasLayout} The instance on which this member is called.
         */
        appendChild: function appendChild(element) {
            this.sidebar.appendChild(element);

            if (this.index < 0) {
                this.index = this.sidebar.children.length - 1;
            }

            return this;
        },

        repaint: function repaint() {

            if (this.slipped) {
                this.sidebar.repaint();
            }

            this.content.repaint();
            return this;
        },

        /**
         * @param {Number} [index]
         * @returns {StyledElements.OffCanvasLayout} The instance on which this member is called.
         */
        slideIn: function slideIn(index) {
            var element;

            if (this.sidebar.children.length) {
                this.sidebar.children.forEach(function (element) {
                    element.hide();
                });

                if (typeof index === 'number') {
                    this.index = index;
                }

                element = this.sidebar.children[this.index].show();
            }

            this.toggleClassName('slipped', true);

            return this.dispatchEvent('slideIn', element);
        },

        /**
         * @param {Number} [index]
         * @returns {StyledElements.OffCanvasLayout} The instance on which this member is called.
         */
        slideOut: function slideOut(index) {

            if (typeof index === 'number') {
                this.index = index;
            }

            this.toggleClassName('slipped', false);

            return this.dispatchEvent('slideOut');
        }

    });

})(StyledElements, StyledElements.Utils);
